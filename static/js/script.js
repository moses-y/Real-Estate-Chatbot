document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    // Function to add a message to the chat box
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user' : 'bot');
        
        const messagePara = document.createElement('p');
        messagePara.textContent = message;
        messageDiv.appendChild(messagePara);
        
        // Add feedback buttons for bot messages
        if (!isUser) {
            const messageId = Date.now().toString();
            messageDiv.id = `msg-${messageId}`;
            const feedbackButtons = addFeedbackButtons(messageId);
            messageDiv.appendChild(feedbackButtons);
        }
        
        chatBox.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat box
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Function to add feedback buttons to bot messages
    function addFeedbackButtons(messageId) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-buttons';
        feedbackDiv.innerHTML = `
            <span>Was this helpful?</span>
            <button onclick="submitFeedback('${messageId}', 'helpful')" class="feedback-btn helpful">👍</button>
            <button onclick="submitFeedback('${messageId}', 'not-helpful')" class="feedback-btn not-helpful">👎</button>
        `;
        return feedbackDiv;
    }
    
    // Function to submit feedback (defined in global scope so it can be called from HTML)
    window.submitFeedback = function(messageId, rating) {
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
            const feedbackDiv = document.querySelector(`#msg-${messageId} .feedback-buttons`);
            if (feedbackDiv) {
                feedbackDiv.innerHTML = '<span>Thanks for your feedback!</span>';
            }
        })
        .catch(error => {
            console.error('Error submitting feedback:', error);
        });
    };
    
    // Function to send a message to the server and get a response
    function sendMessage(message) {
        // Add the user's message to the chat
        addMessage(message, true);
        
        // Clear the input field
        userInput.value = '';
        
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
            // Add the bot's response to the chat
            addMessage(data.response);
        })
        .catch(error => {
            console.error('Error:', error);
            addMessage('Sorry, there was an error processing your request.', false);
        });
    }
    
    // Event listener for the send button
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            const message = userInput.value.trim();
            if (message) {
                sendMessage(message);
            }
        });
    }
    
    // Event listener for pressing Enter in the input field
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const message = userInput.value.trim();
                if (message) {
                    sendMessage(message);
                }
            }
        });
    }
    
    // Event listeners for suggestion buttons
    if (suggestionButtons) {
        suggestionButtons.forEach(button => {
            button.addEventListener('click', function() {
                sendMessage(this.textContent);
            });
        });
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
            
            propertyCard.innerHTML = `
                <div class="property-image" style="background-image: url('/static/images/${property.image}')"></div>
                <div class="property-info">
                    <div class="property-title">${property.title}</div>
                    <div class="property-location">${property.location}</div>
                    <div class="property-price">${formattedPrice}</div>
                    <div class="property-details">
                        <span>${property.bedrooms} Bed${property.bedrooms !== 1 ? 's' : ''}</span>
                        <span>${property.bathrooms} Bath${property.bathrooms !== 1 ? 's' : ''}</span>
                        <span>${property.size} m²</span>
                    </div>
                    <a href="/property/${property.id}" class="view-details">View Details</a>
                </div>
            `;
            
            resultsContainer.appendChild(propertyCard);
        });
    }
});