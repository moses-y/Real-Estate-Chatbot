from flask import Flask, render_template, request, jsonify
import random
import os
import re
from collections import Counter
from data.qa_data import qa_data

# Try to import config, use environment variables as fallback
try:
    from config import NGROK_AUTH_TOKEN
except ImportError:
    NGROK_AUTH_TOKEN = os.environ.get("NGROK_AUTH_TOKEN")

# Initialize Flask app
app = Flask(__name__)

# Extract questions and answers from data
data = qa_data

# Function to preprocess text
def preprocess_text(text):
    # Convert to lowercase and remove punctuation
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text

# Function to calculate similarity using a simple bag of words approach
def calculate_similarity(query, document):
    # Preprocess texts
    query_processed = preprocess_text(query)
    document_processed = preprocess_text(document)

    # Tokenize (split into words)
    query_words = query_processed.split()
    document_words = document_processed.split()

    # Count word occurrences
    query_counter = Counter(query_words)
    document_counter = Counter(document_words)

    # Find common words
    common_words = set(query_counter.keys()) & set(document_counter.keys())

    # Calculate similarity score (number of common words / total unique words)
    if not common_words:
        return 0

    similarity = len(common_words) / (len(set(query_words) | set(document_words)))
    return similarity

# Handle greetings and salutations
greetings = ['hi', 'hello', 'good morning', 'good evening', 'hey', 'howdy', 'hola', 'greetings']
greeting_responses = [
    "Hello! How can I assist you today?",
    "Hi there! How can I help you?",
    "Good day! How can I help you?",
    "Hey! How can I assist you today?"
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.form['message'].lower()

    # Check if message is a greeting
    if any(greeting in user_message for greeting in greetings):
        response = random.choice(greeting_responses)
    else:
        # Calculate similarity between user message and predefined questions
        similarities = []
        for question in data['Question']:
            similarity = calculate_similarity(user_message, question)
            similarities.append(similarity)

        # Get the index of the most similar question
        if similarities:
            most_similar_index = similarities.index(max(similarities))
            response = data['Answer'][most_similar_index]
        else:
            response = "I'm sorry, I don't understand your question."

    return jsonify({'response': response})

if __name__ == '__main__':
    # Only use ngrok in development, not in production
    if NGROK_AUTH_TOKEN:
        try:
            from pyngrok import ngrok
            ngrok.set_auth_token(NGROK_AUTH_TOKEN)
            public_url = ngrok.connect(5000)
            print(f"Flask app running on {public_url}")
        except ImportError:
            print("pyngrok not installed. Running without ngrok tunnel.")

    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))