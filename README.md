# Kwetu Homes Real Estate Chatbot

A simple chatbot application designed to answer real estate inquiries using natural language processing and machine learning techniques.

## Live Demo

Check out the live demo: [Kwetu Homes Chatbot](https://moses-y.github.io/Real-Estate-Chatbot/)

## Features

- **Natural Language Understanding**: Processes user queries with advanced text similarity algorithms
- **Comprehensive Knowledge Base**: Contains 50+ real estate questions and detailed answers
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Interactive Interface**: Features suggestion buttons for common inquiries
- **Real-time Responses**: Provides instant answers to property-related questions

## Live Demo

Experience the chatbot in action: [Kwetu Homes Chatbot Demo](https://moses-y.github.io/Real-Estate-Chatbot)

## Technology Stack

- **Backend**: Flask web framework
- **NLP**: TF-IDF Vectorization and Cosine Similarity
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: GitHub Pages (static demo), Heroku (full application)

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/moses-y/Real-Estate-Chatbot.git
   cd Real-Estate-Chatbot
   ```

2. **Set up a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   
   Create a `config.py` file:
   ```python
   NGROK_AUTH_TOKEN = "your_ngrok_auth_token_here"
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Access the application**
   
   Open your browser and navigate to `http://localhost:5000`

## Deployment Options

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create kwetu-homes-chatbot

# Set environment variables
heroku config:set NGROK_AUTH_TOKEN=your_ngrok_auth_token_here

# Deploy
git push heroku main
```

### GitHub Pages

The static demo is automatically deployed to GitHub Pages when changes are pushed to the main branch.

## Project Structure

```
real-estate-chatbot/
├── app.py                 # Main Flask application
├── static/                # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── templates/             # HTML templates
├── data/                  # Data files
│   └── qa_data.py
├── config.py              # Configuration (not in git)
├── .env                   # Environment variables (not in git)
├── .gitignore             # Git ignore rules
├── requirements.txt       # Dependencies
└── README.md              # Documentation
```

## How It Works

1. User enters a real estate question in the chat interface
2. The system converts the question into a vector representation
3. TF-IDF and cosine similarity algorithms find the most similar question in the database
4. The corresponding answer is returned to the user in real-time

## Future Enhancements

- Integration with property listing APIs
- Multi-language support
- Voice interaction capabilities
- Personalized recommendations based on user preferences

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Moses Yebei - [mosesyebei@gmail.com](mailto:mosesyebei@gmail.com)

Project Link: [https://github.com/moses-y/Real-Estate-Chatbot](https://github.com/moses-y/Real-Estate-Chatbot)

---

*Built with ❤️ by Moses Yebei*