from flask import Flask, request, jsonify, session
import os
import tempfile
import uuid
import pickle
from datetime import datetime, timedelta
import json
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt
from functools import wraps
import os.path
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from langchain_community.document_loaders import PDFPlumberLoader
from langchain_experimental.text_splitter import SemanticChunker
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains.llm import LLMChain
from langchain.chains.combine_documents.stuff import StuffDocumentsChain
from langchain.chains import ConversationalRetrievalChain

from models import db, User, File, ChatHistory

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Enable CORS with credential support
bcrypt = Bcrypt(app)

# Configuration
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', tempfile.mkdtemp())
VECTOR_STORE_FOLDER = os.environ.get('VECTOR_STORE_FOLDER', os.path.join(UPLOAD_FOLDER, 'vector_stores'))
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILES = 10
JWT_SECRET = os.environ.get('JWT_SECRET', 'pou-78392gec9gi&**Y(1bvyi183)#UI@yujkbnn::s')
JWT_EXPIRATION = 24  # hours
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'your-google-client-id.apps.googleusercontent.com')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/pou_chat')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(VECTOR_STORE_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max file size

# In-memory storage for retrievers
user_retrievers = {}  # Store user retrievers: {user_id: retriever}

# Load vector stores on startup
def load_vector_stores():
    try:
        for user_dir in os.listdir(VECTOR_STORE_FOLDER):
            user_path = os.path.join(VECTOR_STORE_FOLDER, user_dir)
            if os.path.isdir(user_path):
                try:
                    # Load the vector store if it exists
                    embedder = HuggingFaceEmbeddings()
                    vector_store = FAISS.load_local(user_path, embedder)
                    user_retrievers[user_dir] = vector_store.as_retriever(
                        search_type="similarity", search_kwargs={"k": 4}
                    )
                    print(f"Loaded vector store for user {user_dir}")
                except Exception as e:
                    print(f"Error loading vector store for user {user_dir}: {str(e)}")
    except Exception as e:
        print(f"Error loading vector stores: {str(e)}")

# Load vector stores on startup
load_vector_stores()

# Authentication helper functions
def generate_token(user_id, email):
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check for token in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Authentication token is missing'}), 401
        
        try:
            # Decode token
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired'}), 401
        except Exception as e:
            return jsonify({'success': False, 'message': f'Invalid token: {str(e)}'}), 401
            
        # Pass the current user to the route
        return f(current_user, *args, **kwargs)
    
    return decorated

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_user_files(user_id):
    """Process all files for a user and create/update retriever"""
    user_files = File.query.filter_by(user_id=user_id).all()
    if not user_files:
        return {"success": False, "message": "No files uploaded"}
    
    # Load all documents
    all_documents = []
    for file_info in user_files:
        try:
            # Check if file exists
            if not os.path.exists(file_info.path):
                continue
                
            loader = PDFPlumberLoader(file_info.path)
            docs = loader.load()
            # Add source information
            for doc in docs:
                doc.metadata['source'] = file_info.name
            all_documents.extend(docs)
        except Exception as e:
            return {"success": False, "message": f"Error loading {file_info.name}: {str(e)}"}
    
    if not all_documents:
        return {"success": False, "message": "No documents could be loaded"}

    try:
        # Create embeddings
        embedder = HuggingFaceEmbeddings()
        
        # Split documents
        text_splitter = SemanticChunker(embedder)
        documents = text_splitter.split_documents(all_documents)

        # Create vector store
        vector_store = FAISS.from_documents(documents, embedder)
        user_retrievers[user_id] = vector_store.as_retriever(
            search_type="similarity", 
            search_kwargs={"k": 4}
        )
        
        # Save vector store to disk
        user_vector_dir = os.path.join(VECTOR_STORE_FOLDER, user_id)
        os.makedirs(user_vector_dir, exist_ok=True)
        vector_store.save_local(user_vector_dir)
        
        return {"success": True, "message": "Files processed successfully"}
    except Exception as e:
        return {"success": False, "message": f"Error processing files: {str(e)}"}

def generate_response(user_id, user_input):
    """Generate a response using the RAG system"""
    if user_id not in user_retrievers:
        return {"success": False, "message": "Please upload and process files first"}
    
    retriever = user_retrievers[user_id]
    
    try:
        # Create the LLM
        llm = Ollama(model="deepseek-r1:1.5b")
        
        # Create the prompt template
        template = """You are an AI assistant helping users understand documents. Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.

        Context: {context}

        Question: {question}

        Answer:"""
        
        prompt = PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
        
        # Create the chain
        chain = LLMChain(llm=llm, prompt=prompt)
        
        # Get relevant documents
        docs = retriever.get_relevant_documents(user_input)
        
        # Combine documents
        combined_docs = "\n\n".join([doc.page_content for doc in docs])
        
        # Generate response
        response = chain.run(context=combined_docs, question=user_input)
        
        # Get sources
        sources = list(set([doc.metadata.get('source', 'Unknown') for doc in docs]))
        
        return {
            "success": True,
            "message": response,
            "sources": sources
        }
    except Exception as e:
        return {"success": False, "message": f"Error generating response: {str(e)}"}

# Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    try:
        # Create new user
        user = User(
            email=data['email'],
            password_hash=bcrypt.generate_password_hash(data['password']).decode('utf-8')
        )
        db.session.add(user)
        db.session.commit()
        
        # Generate token
        token = generate_token(user.id, user.email)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'token': token,
            'user': user.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    try:
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        # Generate token
        token = generate_token(user.id, user.email)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Login failed: {str(e)}'}), 500

@app.route('/api/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'Invalid file type'}), 400
    
    # Check max files
    file_count = File.query.filter_by(user_id=current_user).count()
    if file_count >= MAX_FILES:
        return jsonify({'success': False, 'message': f'Maximum of {MAX_FILES} files allowed'}), 400
    
    try:
        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{current_user}_{filename}")
        file.save(file_path)
        
        # Create file record
        new_file = File(
            user_id=current_user,
            name=filename,
            path=file_path,
            size=os.path.getsize(file_path)
        )
        db.session.add(new_file)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'file': new_file.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Upload failed: {str(e)}'}), 500

@app.route('/api/files', methods=['GET'])
@token_required
def get_files(current_user):
    try:
        files = File.query.filter_by(user_id=current_user).all()
        return jsonify({
            'success': True,
            'files': [file.to_dict() for file in files]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch files: {str(e)}'}), 500

@app.route('/api/files/<file_id>', methods=['DELETE'])
@token_required
def delete_file(current_user, file_id):
    try:
        file = File.query.filter_by(id=file_id, user_id=current_user).first()
        if not file:
            return jsonify({'success': False, 'message': 'File not found'}), 404
        
        # Delete physical file
        if os.path.exists(file.path):
            os.remove(file.path)
        
        # Delete from database
        db.session.delete(file)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'File deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete file: {str(e)}'}), 500

@app.route('/api/process', methods=['POST'])
@token_required
def process_files(current_user):
    result = process_user_files(current_user)
    return jsonify(result)

@app.route('/api/chat', methods=['POST'])
@token_required
def chat(current_user):
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'success': False, 'message': 'No message provided'}), 400
    
    try:
        # Generate response
        response = generate_response(current_user, data['message'])
        
        if response['success']:
            # Save to chat history
            chat_entry = ChatHistory(
                user_id=current_user,
                user_message=data['message'],
                bot_message=response['message'],
                sources=response.get('sources', [])
            )
            db.session.add(chat_entry)
            db.session.commit()
            
            response['chat_id'] = chat_entry.id
        
        return jsonify(response)
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Chat failed: {str(e)}'}), 500

@app.route('/api/history', methods=['GET'])
@token_required
def get_history(current_user):
    try:
        history = ChatHistory.query.filter_by(user_id=current_user).order_by(ChatHistory.timestamp.desc()).all()
        return jsonify({
            'success': True,
            'history': [entry.to_dict() for entry in history]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch history: {str(e)}'}), 500

@app.route('/api/history', methods=['DELETE'])
@token_required
def clear_history(current_user):
    try:
        ChatHistory.query.filter_by(user_id=current_user).delete()
        db.session.commit()
        return jsonify({'success': True, 'message': 'Chat history cleared'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to clear history: {str(e)}'}), 500

@app.route('/api/history/<history_id>', methods=['DELETE'])
@token_required
def delete_history_item(current_user, history_id):
    try:
        chat_entry = ChatHistory.query.filter_by(id=history_id, user_id=current_user).first()
        if not chat_entry:
            return jsonify({'success': False, 'message': 'Chat entry not found'}), 404
        
        db.session.delete(chat_entry)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Chat entry deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete chat entry: {str(e)}'}), 500

@app.route('/api/user/status', methods=['GET'])
@token_required
def get_user_status(current_user):
    try:
        file_count = File.query.filter_by(user_id=current_user).count()
        has_retriever = current_user in user_retrievers
        has_history = ChatHistory.query.filter_by(user_id=current_user).count() > 0
        
        return jsonify({
            'success': True,
            'status': {
                'has_files': file_count > 0,
                'has_retriever': has_retriever,
                'has_history': has_history,
                'file_count': file_count
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to get user status: {str(e)}'}), 500

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)