from flask import Flask, render_template, request, jsonify
import random
import os
import re
import json
from collections import Counter
from datetime import datetime
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

# Improved similarity function with keyword weighting
def calculate_similarity(query, document):
    # Preprocess texts
    query_processed = preprocess_text(query)
    document_processed = preprocess_text(document)

    # Tokenize (split into words)
    query_words = query_processed.split()
    document_words = document_processed.split()

    # Real estate specific keywords that should have higher weight
    important_keywords = [
        'property', 'house', 'apartment', 'mortgage', 'loan', 'buy', 'purchase',
        'rent', 'price', 'cost', 'deposit', 'down payment', 'location', 'area',
        'bedroom', 'bathroom', 'square', 'meter', 'acre', 'land', 'agent', 'broker',
        'fee', 'commission', 'contract', 'agreement', 'title', 'deed', 'document',
        'inspection', 'appraisal', 'valuation', 'insurance', 'tax', 'interest', 'rate'
    ]

    # Count word occurrences
    query_counter = Counter(query_words)
    document_counter = Counter(document_words)

    # Calculate weighted similarity
    total_weight = 0
    matched_weight = 0

    # Process all unique words from both texts
    all_words = set(query_words) | set(document_words)

    for word in all_words:
        # Determine word weight (higher for important keywords)
        weight = 2.0 if word in important_keywords else 1.0
        total_weight += weight

        # If word appears in both query and document, add its weight to matched_weight
        if word in query_counter and word in document_counter:
            matched_weight += weight

    # Calculate final similarity score
    if total_weight == 0:
        return 0

    similarity = matched_weight / total_weight
    return similarity

# Function to log user queries
def log_query(user_message, matched_question, similarity_score):
    log_entry = {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'user_query': user_message,
        'matched_question': matched_question,
        'similarity_score': similarity_score
    }

    try:
        # Load existing logs
        with open('query_logs.json', 'r') as f:
            logs = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        logs = []

    # Add new log entry
    logs.append(log_entry)

    # Save updated logs
    with open('query_logs.json', 'w') as f:
        json.dump(logs, f, indent=2)

# Define greetings and greeting responses
greetings = ['hi', 'hello', 'hey', 'howdy', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening']

greeting_responses = [
    "Hello! How can I assist you with your real estate needs today?",
    "Hi there! Welcome to Kwetu Homes. How can I help you?",
    "Good day! I'm here to answer your real estate questions. What would you like to know?",
    "Hey! Looking for property information? I'm here to help!"
]

# Function to check if a message is just a greeting
def is_greeting_only(message):
    # Preprocess the message
    message = message.lower().strip()

    # Check if the message contains ONLY a greeting
    for greeting in greetings:
        # Check if message is exactly a greeting or greeting with punctuation
        if message == greeting or message == greeting + '!' or message == greeting + '.':
            return True

        # Check if message starts with a greeting followed by common polite phrases
        greeting_phrases = [
            greeting + ' there',
            greeting + ' how are you',
            greeting + ' how are you doing',
            greeting + ' how is it going',
            greeting + ' kwetu',
            greeting + ' team'
        ]

        if any(message.startswith(phrase) for phrase in greeting_phrases):
            return True

    return False

# Store feedback data
feedback_data = []

# Sample property data
properties = [
    {
        'id': 1,
        'title': 'Modern 3 Bedroom Apartment',
        'location': 'Kilimani, Nairobi',
        'price': 15000000,
        'bedrooms': 3,
        'bathrooms': 2,
        'size': 120,  # square meters
        'type': 'Apartment',
        'description': 'Luxurious 3 bedroom apartment with modern finishes, spacious living area, and balcony with city views.',
        'image': 'property1.jpg'
    },
    {
        'id': 2,
        'title': '4 Bedroom Villa with Garden',
        'location': 'Karen, Nairobi',
        'price': 45000000,
        'bedrooms': 4,
        'bathrooms': 3,
        'size': 300,  # square meters
        'type': 'Villa',
        'description': 'Spacious family home with large garden, swimming pool, and modern kitchen. Located in a secure gated community.',
        'image': 'property2.jpg'
    },
    {
        'id': 3,
        'title': '2 Bedroom Apartment',
        'location': 'Westlands, Nairobi',
        'price': 9500000,
        'bedrooms': 2,
        'bathrooms': 1,
        'size': 85,  # square meters
        'type': 'Apartment',
        'description': 'Cozy 2 bedroom apartment with modern finishes, close to shopping centers and restaurants.',
        'image': 'property3.jpg'
    },
    {
        'id': 4,
        'title': 'Commercial Space',
        'location': 'CBD, Nairobi',
        'price': 25000000,
        'bedrooms': 0,
        'bathrooms': 2,
        'size': 200,  # square meters
        'type': 'Commercial',
        'description': 'Prime commercial space in Nairobi CBD, suitable for office or retail use.',
        'image': 'property4.jpg'
    },
    {
        'id': 5,
        'title': '1/4 Acre Plot',
        'location': 'Kitengela, Kajiado',
        'price': 3500000,
        'bedrooms': 0,
        'bathrooms': 0,
        'size': 1011,  # square meters (1/4 acre)
        'type': 'Land',
        'description': 'Ready for development plot with all utilities and good access road.',
        'image': 'property5.jpg'
    }
]

# Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.form['message'].lower().strip()

    # Check if message is ONLY a greeting
    if is_greeting_only(user_message):
        response = random.choice(greeting_responses)
        log_query(user_message, "greeting", 1.0)
    else:
        # For messages that contain more than just a greeting,
        # calculate similarity with predefined questions
        similarities = []
        for question in data['Question']:
            similarity = calculate_similarity(user_message, question)
            similarities.append(similarity)

        # Get the index of the most similar question
        if similarities and max(similarities) > 0.15:  # Set a minimum threshold
            most_similar_index = similarities.index(max(similarities))
            matched_question = data['Question'][most_similar_index]
            similarity_score = similarities[most_similar_index]
            response = data['Answer'][most_similar_index]

            # Log the query
            log_query(user_message, matched_question, similarity_score)
        else:
            response = "I'm sorry, I don't understand your question. Could you please rephrase it or ask something about our properties, buying process, or mortgage options?"
            log_query(user_message, "unknown", 0.0)

    return jsonify({'response': response})

@app.route('/analytics', methods=['GET'])
def analytics():
    try:
        with open('query_logs.json', 'r') as f:
            logs = json.load(f)

        # Count question frequencies
        question_counts = {}
        for log in logs:
            question = log['matched_question']
            if question in question_counts:
                question_counts[question] += 1
            else:
                question_counts[question] = 1

        # Sort by frequency
        sorted_questions = sorted(question_counts.items(), key=lambda x: x[1], reverse=True)

        # Calculate average similarity score
        avg_similarity = sum(log['similarity_score'] for log in logs) / len(logs) if logs else 0

        return render_template('analytics.html',
                              logs=logs,
                              question_counts=sorted_questions,
                              avg_similarity=avg_similarity,
                              total_queries=len(logs))
    except (FileNotFoundError, json.JSONDecodeError):
        return render_template('analytics.html',
                              logs=[],
                              question_counts=[],
                              avg_similarity=0,
                              total_queries=0)

@app.route('/feedback', methods=['POST'])
def feedback():
    feedback = request.json
    feedback['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Store feedback
    feedback_data.append(feedback)

    # Save to file
    with open('feedback_data.json', 'w') as f:
        json.dump(feedback_data, f, indent=2)

    return jsonify({'status': 'success'})

@app.route('/search', methods=['GET'])
def search_page():
    return render_template('search.html')

@app.route('/api/properties', methods=['GET'])
def get_properties():
    # Get filter parameters
    location = request.args.get('location', '').lower()
    min_price = request.args.get('min_price', 0, type=int)
    max_price = request.args.get('max_price', 1000000000, type=int)
    property_type = request.args.get('type', '').lower()
    bedrooms = request.args.get('bedrooms', 0, type=int)

    # Filter properties
    filtered_properties = properties

    if location:
        filtered_properties = [p for p in filtered_properties if location in p['location'].lower()]

    filtered_properties = [p for p in filtered_properties if p['price'] >= min_price and p['price'] <= max_price]

    if property_type:
        filtered_properties = [p for p in filtered_properties if p['type'].lower() == property_type]

    if bedrooms > 0:
        filtered_properties = [p for p in filtered_properties if p['bedrooms'] >= bedrooms]

    return jsonify(filtered_properties)

@app.route('/property/<int:property_id>', methods=['GET'])
def property_detail(property_id):
    # Find property by ID
    property_data = next((p for p in properties if p['id'] == property_id), None)

    if property_data:
        return render_template('property_detail.html', property=property_data)
    else:
        return "Property not found", 404

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