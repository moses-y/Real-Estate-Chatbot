document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    const resetChatButton = document.getElementById('reset-chat');
    const suggestionsContainer = document.querySelector('.suggestion-buttons');
    
    // Last context for follow-up questions
    let lastContext = null;

    // Check if user is new and show welcome tour
    checkFirstTimeVisitor();
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator-container';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatBox.appendChild(typingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return typingDiv;
    }

    // Function to add a message to the chat box with enhanced formatting
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user' : 'bot');
        
        const messageId = Date.now().toString();
        messageDiv.id = `msg-${messageId}`;
        
        // Replace newlines with <br> tags and handle links
        const formattedMessage = formatMessage(message);
        
        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = formattedMessage;
        messageDiv.appendChild(messageContent);
        
        // Add feedback buttons for bot messages
        if (!isUser) {
            const feedbackButtons = addFeedbackButtons(messageId);
            messageDiv.appendChild(feedbackButtons);
        }
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        const time = new Date();
        timestamp.textContent = time.getHours() + ':' + 
            (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();
        messageDiv.appendChild(timestamp);
        
        chatBox.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat box with smooth animation
        chatBox.scrollTo({
            top: chatBox.scrollHeight,
            behavior: 'smooth'
        });
        
        // Update suggestions based on context if it's a bot message
        if (!isUser) {
            updateSuggestions(lastContext);
        }
        
        return messageId;
    }
    
    // Format message with links and structured content
    function formatMessage(message) {
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let formattedMessage = message.replace(urlRegex, function(url) {
            return `<a href="${url}" target="_blank">${url}</a>`;
        });
        
        // Replace newlines with <br>
        formattedMessage = formattedMessage.replace(/\n/g, '<br>');
        
        // Highlight property prices for better visibility
        formattedMessage = formattedMessage.replace(/KES (\d{1,3}(,\d{3})*(\.\d+)?)/g, 
            '<span class="highlight-price">KES $1</span>');
        
        return formattedMessage;
    }
    
    // Function to add feedback buttons to bot messages
    function addFeedbackButtons(messageId) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-buttons';
        feedbackDiv.innerHTML = `
            <span>Was this helpful?</span>
            <button onclick="submitFeedback('${messageId}', 'helpful')" class="feedback-btn helpful" title="This was helpful">👍</button>
            <button onclick="submitFeedback('${messageId}', 'not-helpful')" class="feedback-btn not-helpful" title="This needs improvement">👎</button>
        `;
        return feedbackDiv;
    }
    
    // Function to submit feedback (defined in global scope so it can be called from HTML)
    window.submitFeedback = function(messageId, rating) {
        // Add loading state to feedback buttons
        const feedbackDiv = document.querySelector(`#msg-${messageId} .feedback-buttons`);
        if (feedbackDiv) {
            feedbackDiv.innerHTML = '<span>Submitting feedback...</span>';
        }
        
        fetch('/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message_id: messageId,
                rating: rating
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Update UI to show feedback was received
            if (feedbackDiv) {
                feedbackDiv.innerHTML = rating === 'helpful' ? 
                    '<span class="feedback-text">Thanks for your feedback! 😊</span>' : 
                    '<span class="feedback-text">Thanks for your feedback. We\'ll improve. 🙏</span>';
            }
        })
        .catch(error => {
            console.error('Error submitting feedback:', error);
            if (feedbackDiv) {
                feedbackDiv.innerHTML = '<span class="feedback-text">Error submitting feedback. Please try again.</span>';
            }
        });
    };
    
    // Enhanced function to send a message to the server with typing animation
    function sendMessage(message) {
        // Don't process empty messages
        if (!message.trim()) return;
        
        // Add the user's message to the chat
        addMessage(message, true);
        
        // Clear the input field
        userInput.value = '';
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        
        // Use setTimeout to simulate processing time
        setTimeout(() => {
            // Send the message to the server
            fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'message=' + encodeURIComponent(message)
            })
            .then(response => response.json())
            .then(data => {
                // Remove typing indicator
                typingIndicator.remove();
                
                // Check if response contains property search results
                if (message.toLowerCase().includes('property') && 
                    (message.toLowerCase().includes('search') || 
                     message.toLowerCase().includes('find') || 
                     message.toLowerCase().includes('looking for'))) {
                    
                    // Show property results in chat
                    handlePropertySearch(message);
                } else {
                    // Add the bot's response to the chat
                    const messageId = addMessage(data.response);
                    
                    // Store context for follow-up questions
                    // This is a simplified version - ideally this would come from the server
                    if (data.response.toLowerCase().includes('location') || 
                        data.response.toLowerCase().includes('property') || 
                        data.response.toLowerCase().includes('million')) {
                        lastContext = "property options";
                    } else {
                        lastContext = data.response;
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                typingIndicator.remove();
                addMessage('Sorry, there was an error processing your request. Please try again.', false);
            });
        }, 1500); // Simulated thinking time
    }
    
    // Function to handle property search directly in chat
    function handlePropertySearch(query) {
        // Extract search parameters from the query
        const searchParams = {
            location: extractLocation(query),
            minPrice: extractMinPrice(query),
            maxPrice: extractMaxPrice(query),
            bedrooms: extractBedrooms(query),
            propertyType: extractPropertyType(query)
        };
        
        // Build query string
        const queryParams = new URLSearchParams({
            location: searchParams.location || '',
            type: searchParams.propertyType || '',
            min_price: searchParams.minPrice || 0,
            max_price: searchParams.maxPrice || 1000000000,
            bedrooms: searchParams.bedrooms || 0
        });
        
        // Fetch properties
        fetch(`/api/properties?${queryParams.toString()}`)
            .then(response => response.json())
            .then(properties => {
                showPropertyResultsInChat(properties, query);
            })
            .catch(error => {
                console.error('Error fetching properties:', error);
                addMessage('Sorry, I had trouble finding properties. Please try again or use the search page for more options.', false);
            });
    }
    
    // Extract location from query
    function extractLocation(query) {
        const locations = ['westlands', 'kilimani', 'karen', 'langata', 'south b', 'kitengela', 'nairobi', 'cbd'];
        for (const location of locations) {
            if (query.toLowerCase().includes(location)) {
                return location;
            }
        }
        return '';
    }
    
    // Extract minimum price from query
    function extractMinPrice(query) {
        const minPriceMatch = query.match(/(?:above|from|min|minimum|over) (?:KES|Ksh|ksh|kes)? ?(\d+(?:,\d+)*) ?(?:million|m|k)?/i);
        if (minPriceMatch) {
            const amount = minPriceMatch[1].replace(/,/g, '');
            if (query.toLowerCase().includes('million') || query.toLowerCase().includes('m')) {
                return parseInt(amount) * 1000000;
            } else if (query.toLowerCase().includes('k')) {
                return parseInt(amount) * 1000;
            }
            return parseInt(amount);
        }
        return 0;
    }
    
    // Extract maximum price from query
    function extractMaxPrice(query) {
        const maxPriceMatch = query.match(/(?:below|under|max|maximum|less than) (?:KES|Ksh|ksh|kes)? ?(\d+(?:,\d+)*) ?(?:million|m|k)?/i);
        if (maxPriceMatch) {
            const amount = maxPriceMatch[1].replace(/,/g, '');
            if (query.toLowerCase().includes('million') || query.toLowerCase().includes('m')) {
                return parseInt(amount) * 1000000;
            } else if (query.toLowerCase().includes('k')) {
                return parseInt(amount) * 1000;
            }
            return parseInt(amount);
        }
        
        // Also check for specific price ranges
        const rangeMatch = query.match(/(?:around|about|approximately) (?:KES|Ksh|ksh|kes)? ?(\d+(?:,\d+)*) ?(?:million|m|k)?/i);
        if (rangeMatch) {
            const amount = rangeMatch[1].replace(/,/g, '');
            let baseAmount;
            if (query.toLowerCase().includes('million') || query.toLowerCase().includes('m')) {
                baseAmount = parseInt(amount) * 1000000;
            } else if (query.toLowerCase().includes('k')) {
                baseAmount = parseInt(amount) * 1000;
            } else {
                baseAmount = parseInt(amount);
            }
            return baseAmount * 1.2; // 20% above the mentioned amount
        }
        
        return 1000000000; // Default to a very high number
    }
    
    // Extract bedrooms from query
    function extractBedrooms(query) {
        const bedroomMatch = query.match(/(\d+) ?(?:bed|bedroom|br)/i);
        if (bedroomMatch) {
            return parseInt(bedroomMatch[1]);
        }
        return 0;
    }
    
    // Extract property type from query
    function extractPropertyType(query) {
        if (query.toLowerCase().includes('apartment')) return 'Apartment';
        if (query.toLowerCase().includes('house')) return 'House';
        if (query.toLowerCase().includes('villa')) return 'Villa';
        if (query.toLowerCase().includes('commercial')) return 'Commercial';
        if (query.toLowerCase().includes('land') || query.toLowerCase().includes('plot')) return 'Land';
        return '';
    }
    
    // Function to display property results directly in chat
    function showPropertyResultsInChat(properties, query) {
        if (properties.length === 0) {
            addMessage(`I couldn't find any properties matching your query. Would you like to try different search criteria?`);
            return;
        }
        
        // Add intro message
        addMessage(`I found ${properties.length} properties that might interest you. Here are some options:`);
        
        // Create a property results container
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'chat-property-results';
        
        // Add up to 3 properties
        const displayProperties = properties.slice(0, 3);
        displayProperties.forEach(property => {
            const propertyCard = document.createElement('div');
            propertyCard.className = 'chat-property-card';
            
            const formattedPrice = new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                maximumFractionDigits: 0
            }).format(property.price);
            
            propertyCard.innerHTML = `
                <div class="chat-property-image" style="background-image: url('/static/images/${property.image}')"></div>
                <div class="chat-property-info">
                    <div class="chat-property-title">${property.title}</div>
                    <div class="chat-property-location">${property.location}</div>
                    <div class="chat-property-price">${formattedPrice}</div>
                    <div class="chat-property-specs">${property.bedrooms} Bed • ${property.bathrooms} Bath • ${property.size} m²</div>
                    <a href="/property/${property.id}" class="chat-property-link">View Details</a>
                </div>
            `;
            
            resultsContainer.appendChild(propertyCard);
        });
        
        // Add "View All" link if there are more than 3 properties
        if (properties.length > 3) {
            const viewAllLink = document.createElement('a');
            viewAllLink.href = '/search';
            viewAllLink.className = 'view-all-link';
            viewAllLink.textContent = `View all ${properties.length} properties →`;
            resultsContainer.appendChild(viewAllLink);
        }
        
        // Add the container to chat
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.appendChild(resultsContainer);
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Add a follow-up message
        setTimeout(() => {
            addMessage("Would you like more information about any of these properties?");
            lastContext = "property options";
        }, 1000);
    }
    
    // Update suggestion buttons based on conversation context
    function updateSuggestions(context) {
        if (!suggestionsContainer) return;
        
        let newSuggestions = [];
        
        // Check context and provide relevant suggestions
        if (!context) {
            // Default suggestions
            newSuggestions = [
                'Property viewing process',
                'Document requirements',
                'Property prices in Nairobi',
                'Mortgage options'
            ];
        } else if (typeof context === 'string') {
            if (context.toLowerCase().includes('location') || context.toLowerCase().includes('area')) {
                newSuggestions = [
                    'Properties in Westlands',
                    'Properties in Karen',
                    'Properties in Kilimani',
                    'Upcoming developments'
                ];
            } else if (context.toLowerCase().includes('price') || context.toLowerCase().includes('cost') || 
                    context.toLowerCase().includes('million')) {
                newSuggestions = [
                    'Properties under 5 million',
                    'Properties around 10 million',
                    'Luxury properties',
                    'Payment plans available'
                ];
            } else if (context.toLowerCase().includes('buy') || context.toLowerCase().includes('purchase')) {
                newSuggestions = [
                    'Buying process',
                    'Required documents',
                    'Schedule a viewing',
                    'Financing options'
                ];
            } else if (context.toLowerCase().includes('property options')) {
                newSuggestions = [
                    'Schedule a viewing',
                    'More details on Westlands',
                    'More details on South B',
                    'More details on Langata'
                ];
            } else if (context.toLowerCase().includes('mortgage') || context.toLowerCase().includes('financing')) {
                newSuggestions = [
                    'Mortgage rates',
                    'Loan requirements',
                    'Down payment options',
                    'Payment plans'
                ];
            }
        }
        
        // Only update if we have new suggestions
        if (newSuggestions.length > 0) {
            // Update the suggestion buttons
            suggestionsContainer.innerHTML = '';
            
            newSuggestions.forEach(suggestion => {
                const button = document.createElement('button');
                button.className = 'suggestion-btn';
                button.textContent = suggestion;
                button.addEventListener('click', () => {
                    userInput.value = suggestion;
                    sendMessage(suggestion);
                });
                suggestionsContainer.appendChild(button);
            });
        }
    }
    
    // Reset chat function
    function resetChat() {
        // Remove all messages except the welcome message
        const messages = document.querySelectorAll('.message:not(#msg-welcome)');
        messages.forEach(message => {
            // Add fade-out animation
            message.classList.add('fade-out');
            
            // Remove after animation completes
            setTimeout(() => {
                message.remove();
            }, 300);
        });
        
        // Reset context
        lastContext = null;
        
        // Reset suggestions
        updateSuggestions(null);
        
        // Add a system message
        setTimeout(() => {
            addMessage("Conversation has been reset. How can I help you today?");
        }, 350);
    }
    
    // Check if user is a first-time visitor
    function checkFirstTimeVisitor() {
        if (!localStorage.getItem('hasVisitedBefore')) {
            // Show welcome tour
            showWelcomeTour();
            
            // Set flag in localStorage
            localStorage.setItem('hasVisitedBefore', 'true');
        }
    }
    
    // Welcome tour function
    function showWelcomeTour() {
        const steps = [
            {
                message: "👋 Welcome to Kwetu Homes Chatbot! I'm here to help you with all your real estate needs.",
                delay: 1000
            },
            {
                message: "You can ask me about property locations, prices, the buying process, and more. I'll do my best to provide helpful information.",
                delay: 3000
            },
            {
                message: "Try the suggestion chips below for common questions, or just type your query in the text box. Ready to find your dream home?",
                delay: 5000
            }
        ];
        
        let delay = 0;
        steps.forEach(step => {
            delay += step.delay;
            setTimeout(() => {
                addMessage(step.message);
            }, delay);
        });
    }
    
    // Event listeners
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            const message = userInput.value.trim();
            if (message) {
                sendMessage(message);
            }
        });
    }
    
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const message = userInput.value.trim();
                if (message) {
                    sendMessage(message);
                }
            }
        });
        
        // Add focus to input field when page loads
        setTimeout(() => {
            userInput.focus();
        }, 500);
    }
    
    if (suggestionButtons) {
        suggestionButtons.forEach(button => {
            button.addEventListener('click', function() {
                sendMessage(this.textContent);
            });
        });
    }
    
    // Reset chat button
    if (resetChatButton) {
        resetChatButton.addEventListener('click', resetChat);
    } else {
        // Create reset button if it doesn't exist
        const inputArea = document.querySelector('.input-area');
        if (inputArea) {
            const chatControls = document.createElement('div');
            chatControls.className = 'chat-controls';
            chatControls.innerHTML = '<button id="reset-chat" class="control-btn">Clear Conversation</button>';
            inputArea.parentNode.insertBefore(chatControls, inputArea);
            
            // Add event listener to the newly created button
            document.getElementById('reset-chat').addEventListener('click', resetChat);
        }
    }
    
    // Property search functionality
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        // Load all properties initially if we're on the search page
        fetchProperties();
        
        // Set up search button
        searchButton.addEventListener('click', fetchProperties);
    }
    
    // Function to fetch properties based on filters
    function fetchProperties() {
        // Get filter values
        const location = document.getElementById('location').value;
        const propertyType = document.getElementById('property-type').value;
        const minPrice = document.getElementById('min-price').value || 0;
        const maxPrice = document.getElementById('max-price').value || 1000000000;
        const bedrooms = document.getElementById('bedrooms').value;
        
        // Build query string
        const queryParams = new URLSearchParams({
            location: location,
            type: propertyType,
            min_price: minPrice,
            max_price: maxPrice,
            bedrooms: bedrooms
        });
        
        // Fetch properties
        fetch(`/api/properties?${queryParams.toString()}`)
            .then(response => response.json())
            .then(properties => {
                displayProperties(properties);
            })
            .catch(error => {
                console.error('Error fetching properties:', error);
            });
    }
    
    // Function to display properties in the results container
    function displayProperties(properties) {
        const resultsContainer = document.getElementById('property-results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        if (properties.length === 0) {
            resultsContainer.innerHTML = '<p>No properties found matching your criteria.</p>';
            return;
        }
        
        properties.forEach(property => {
            const propertyCard = document.createElement('div');
            propertyCard.className = 'property-card';
            
            const formattedPrice = new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                maximumFractionDigits: 0
            }).format(property.price);
            
            // Add property badge for new or featured properties
            const badgeHtml = property.id % 2 === 0 ? '<div class="property-badge">New</div>' : 
                            (property.id % 3 === 0 ? '<div class="property-badge featured">Featured</div>' : '');
            
            propertyCard.innerHTML = `
                <div class="property-image" style="background-image: url('/static/images/${property.image}')">
                    ${badgeHtml}
                </div>
                <div class="property-info">
                    <div class="property-title">${property.title}</div>
                    <div class="property-location">${property.location}</div>
                    <div class="property-price">${formattedPrice}</div>
                    <div class="property-details">
                        <div class="property-detail-item beds">${property.bedrooms} Bed${property.bedrooms !== 1 ? 's' : ''}</div>
                        <div class="property-detail-item baths">${property.bathrooms} Bath${property.bathrooms !== 1 ? 's' : ''}</div>
                        <div class="property-detail-item area">${property.size} m²</div>
                    </div>
                    <div class="property-action">
                        <a href="/property/${property.id}" class="view-details">View Details</a>
                        <button class="favorite-btn" onclick="toggleFavorite(${property.id})">❤</button>
                    </div>
                </div>
            `;
            
            resultsContainer.appendChild(propertyCard);
        });
    }
    
    // Function to toggle favorite properties
    window.toggleFavorite = function(propertyId) {
        const button = event.currentTarget;
        button.classList.toggle('active');
        
        // Get saved favorites from localStorage
        let favorites = JSON.parse(localStorage.getItem('favoriteProperties') || '[]');
        
        if (button.classList.contains('active')) {
            // Add to favorites if not already there
            if (!favorites.includes(propertyId)) {
                favorites.push(propertyId);
                button.innerHTML = '❤️'; // Filled heart
            }
        } else {
            // Remove from favorites
            favorites = favorites.filter(id => id !== propertyId);
            button.innerHTML = '❤'; // Empty heart
        }
        
        // Save updated favorites
        localStorage.setItem('favoriteProperties', JSON.stringify(favorites));
    };
    
    // Initialize favorites on page load
    function initializeFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favoriteProperties') || '[]');
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        
        favoriteButtons.forEach(button => {
            const propertyId = parseInt(button.getAttribute('onclick').match(/\d+/)[0]);
            if (favorites.includes(propertyId)) {
                button.classList.add('active');
                button.innerHTML = '❤️'; // Filled heart
            }
        });
    }
    
    // Call initialize favorites
    initializeFavorites();
    
    // Add quick keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt+R to reset chat
        if (e.altKey && e.key === 'r') {
            e.preventDefault();
            resetChat();
        }
        
        // Alt+S to focus search input
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            userInput.focus();
        }
    });
});