# Kwetu Homes Real Estate Chatbot

A smart chatbot for answering real estate questions using natural language processing and machine learning.

![Kwetu Homes Chatbot](static/images/screenshot.png)

## Features

- Natural language understanding to process user queries
- Comprehensive database of real estate questions and answers
- Responsive web interface for easy interaction
- Suggestion buttons for common questions
- Mobile-friendly design

## Demo

Try the live demo: [Kwetu Homes Chatbot](https://moses-y.github.io/real-estate-chatbot)

## Local Development Setup

1. Clone this repository:
mobilebile-friendly design


cd real-estate-chatbot


2. Create a virtual environment and activate it:
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate


3. Install the required packages:
pip install -r requirements.txt


4. Create a `config.py` file with your ngrok auth token (for development):
python
Copy Code
NGROK_AUTH_TOKEN = "your_ngrok_auth_token_here"
Run the application:
python app.py
Open your browser and navigate to http://localhost:5000
Deployment
Heroku Deployment
Create a Heroku account and install the Heroku CLI
Login to Heroku:
heroku login
Create a new Heroku app:
heroku create kwetu-homes-chatbot
Set environment variables:
heroku config:set NGROK_AUTH_TOKEN=your_ngrok_auth_token_here
Deploy the app:
git push heroku main
GitHub Pages (Static Demo)
The index.html file in the root directory is used for GitHub Pages deployment. This provides a static demo of the chatbot interface.

Project Structure
app.py: Main Flask application
data/qa_data.py: Question-answer dataset
static/: Static files (CSS, JS, images)
templates/: HTML templates
config.py: Configuration settings (not tracked by git)
Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

License
This project is licensed under the MIT License - see the LICENSE file for details.

Contact
For any inquiries, please contact mosesyebei@gmail.com