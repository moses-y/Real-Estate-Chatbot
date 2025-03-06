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
        chatBox.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat box
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
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
    sendButton.addEventListener('click', function() {
        const message = userInput.value.trim();
        if (message) {
            sendMessage(message);
        }
    });
    
    // Event listener for pressing Enter in the input field
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const message = userInput.value.trim();
            if (message) {
                sendMessage(message);
            }
        }
    });
    
    // Event listeners for suggestion buttons
    suggestionButtons.forEach(button => {
        button.addEventListener('click', function() {
            sendMessage(this.textContent);
        });
    });
});