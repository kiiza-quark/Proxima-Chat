# Proxima Chat

A modern web application that combines Flask backend with React frontend, implementing a Retrieval-Augmented Generation (RAG) system for intelligent document processing and querying.

## Features

- **Document Processing**: Upload and process PDF documents
- **Vector Storage**: Efficient document storage using FAISS
- **Intelligent Querying**: Advanced document search and retrieval
- **Modern UI**: Built with React and Tailwind CSS
- **Secure Authentication**: JWT-based authentication system
- **API Integration**: RESTful API endpoints for seamless frontend-backend communication

## Screenshots

![Register](screenshots/Screenshot%202025-06-02%20122502.png)
*Auth Pages: Register*

![Login](screenshots/Screenshot%202025-06-02%20122447.png)
*Auth Pages: Login*

![Chat](screenshots/Screenshot%202025-06-02%20122133.png)
*Chat Interface*

![Settings](screenshots/Screenshot%202025-06-02%20122157.png)
*Simple Settings*



## Tech Stack

### Backend
- Flask 3.0.2
- Flask-CORS
- Flask-Bcrypt
- Flask-SQLAlchemy
- PostgreSQL
- LangChain
- FAISS (Vector Store)
- Sentence Transformers
- PDF Plumber

### Frontend
- React
- Vite
- Tailwind CSS
- ESLint

## Project Structure

```
.
├── backend/
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│   ├── uploads/           # Document upload directory
│   └── vector_store/      # FAISS vector store
│
└── frontend/
    ├── src/               # React source code
    ├── public/            # Static assets
    ├── package.json       # Node.js dependencies
    └── vite.config.js     # Vite configuration
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory with necessary configurations.

4. Run the Flask server:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

The backend provides several RESTful API endpoints for:
- User authentication
- Document upload and processing
- Document querying and retrieval
- Vector store management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 