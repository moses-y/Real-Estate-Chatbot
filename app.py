from flask import Flask, render_template, request, jsonify
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
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

# Initialize TF-IDF Vectorizer for text similarity
vectorizer = TfidfVectorizer()

# Convert the questions from the dataset into TF-IDF vectors
corpus = list(data['Question'])
X = vectorizer.fit_transform(corpus)

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
        response = np.random.choice(greeting_responses)
    else:
        # Convert user message to vector
        user_message_vector = vectorizer.transform([user_message])

        # Calculate similarity between user message and predefined questions
        similarities = cosine_similarity(user_message_vector, X)

        # Get the index of the most similar question
        most_similar_index = np.argmax(similarities)

        # Return the answer associated with the most similar question
        response = data['Answer'][most_similar_index]

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