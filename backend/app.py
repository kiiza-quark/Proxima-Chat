from flask import Flask, request, jsonify
import os
import tempfile
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from flask_cors import CORS

from langchain_community.document_loaders import PDFPlumberLoader
from langchain_experimental.text_splitter import SemanticChunker
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains.llm import LLMChain
from langchain.chains.combine_documents.stuff import StuffDocumentsChain
from langchain.chains import RetrievalQA, ConversationalRetrievalChain

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = tempfile.mkdtemp()
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILES = 5

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# In-memory storage
user_files = {}  # Store user files: {user_id: {file_id: {name, path, size, uploaded_at}}}
user_retrievers = {}  # Store user retrievers: {user_id: retriever}
user_chat_history = {}  # Store user chat history: {user_id: [{user, bot, timestamp}]}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_user_files(user_id):
    """Process all files for a user and create a retriever"""
    if user_id not in user_files or not user_files[user_id]:
        return {"success": False, "message": "No files uploaded"}
    
    # Load all documents
    all_documents = []
    for file_id, file_info in user_files[user_id].items():
        try:
            loader = PDFPlumberLoader(file_info['path'])
            docs = loader.load()
            # Add source information
            for doc in docs:
                doc.metadata['source'] = file_info['name']
            all_documents.extend(docs)
        except Exception as e:
            return {"success": False, "message": f"Error loading {file_info['name']}: {str(e)}"}
    
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
        return {"success": True, "message": "Files processed successfully"}
    except Exception as e:
        return {"success": False, "message": f"Error processing files: {str(e)}"}

def generate_response(user_id, user_input):
    """Generate a response using the RAG system"""
    if user_id not in user_retrievers:
        return {"success": False, "message": "Please upload and process files first"}
    
    retriever = user_retrievers[user_id]
    
    try:
        # Define LLM
        llm = Ollama(model="deepseek-r1:1.5b")
        
        # Define the prompt template
        prompt = """
            Use the following pieces of context to answer the question at the end. 
            If you don't know the answer, say you don't know, but don't make up an answer.
            Be concise but thorough.

            Chat History:
            {chat_history}

            Context: 
            {context}

            Question: {question}

            Helpful Answer:
            """
        
        # Create prompt template
        QA_CHAIN_PROMPT = PromptTemplate.from_template(prompt)
        
        # Create the LLM chain
        llm_chain = LLMChain(
            llm=llm,
            prompt=QA_CHAIN_PROMPT,
            verbose=False
        )
        
        # Create document prompt
        document_prompt = PromptTemplate(
            input_variables=["page_content", "source"],
            template="Content: {page_content}\nSource: {source}\n"
        )
        
        # Create the document chain
        combine_documents_chain = StuffDocumentsChain(
            llm_chain=llm_chain,
            document_variable_name="context",
            document_prompt=document_prompt
        )
        
        # Initialize chat history if it doesn't exist
        if user_id not in user_chat_history:
            user_chat_history[user_id] = []
            
        # Format chat history for the chain
        formatted_history = []
        if user_chat_history[user_id]:
            for entry in user_chat_history[user_id][-5:]:
                formatted_history.append((entry['user'], entry['bot']))
        
        # Create the QA chain
        qa = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            chain_type="stuff",
            combine_docs_chain_kwargs={"prompt": QA_CHAIN_PROMPT},
            return_source_documents=True
        )
        
        # Generate response
        print(f"User Input: {user_input}")
        response = qa({"question": user_input, "chat_history": formatted_history})
        
        # Format sources
        sources = []
        for doc in response.get("source_documents", []):
            source = doc.metadata.get("source", "Unknown")
            page = doc.metadata.get("page", "")
            if source not in sources:
                sources.append(f"{source} (page {page})" if page else source)
        
        # Add current exchange to chat history
        user_chat_history[user_id].append({
            'user': user_input,
            'bot': response['answer'],  
            'timestamp': datetime.now().isoformat()
        })
        
        return {
            "success": True, 
            "message": response['answer'],
            "sources": sources
        }
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"success": False, "message": f"Error generating response: {str(e)}"}

# Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "API is running"})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload a file to the server"""
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file part"}), 400
        
    # Get user ID (in a real app, this would come from authentication)
    user_id = request.form.get('user_id', 'default_user')
    
    # Initialize user storage if needed
    if user_id not in user_files:
        user_files[user_id] = {}
    
    # Check if max files limit is reached
    if len(user_files[user_id]) >= MAX_FILES:
        return jsonify({"success": False, "message": f"Maximum of {MAX_FILES} files allowed"}), 400
        
    file = request.files['file']
    
    # Check if file selected
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400
        
    # Check file type
    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "File type not allowed"}), 400
        
    # Save file
    try:
        filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{filename}")
        file.save(file_path)
        
        # Store file info
        user_files[user_id][file_id] = {
            'name': filename,
            'path': file_path,
            'size': os.path.getsize(file_path),
            'uploaded_at': datetime.now().isoformat()
        }
        
        return jsonify({
            "success": True, 
            "message": "File uploaded successfully",
            "file_id": file_id,
            "file_name": filename,
            "file_count": len(user_files[user_id])
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Error uploading file: {str(e)}"}), 500

@app.route('/api/files', methods=['GET'])
def get_files():
    """Get list of uploaded files for a user"""
    # Get user ID (in a real app, this would come from authentication)
    user_id = request.args.get('user_id', 'default_user')
    
    if user_id not in user_files:
        return jsonify({"success": True, "files": []})
    
    files_list = []
    for file_id, file_info in user_files[user_id].items():
        files_list.append({
            "id": file_id,
            "name": file_info['name'],
            "size": file_info['size'],
            "uploaded_at": file_info['uploaded_at']
        })
    
    return jsonify({"success": True, "files": files_list})

@app.route('/api/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """Delete a file"""
    # Get user ID (in a real app, this would come from authentication)
    user_id = request.args.get('user_id', 'default_user')
    
    if user_id not in user_files or file_id not in user_files[user_id]:
        return jsonify({"success": False, "message": "File not found"}), 404
    
    try:
        # Remove file from disk
        os.remove(user_files[user_id][file_id]['path'])
        
        # Remove from storage
        del user_files[user_id][file_id]
        
        # Clear retriever if no files left
        if not user_files[user_id] and user_id in user_retrievers:
            del user_retrievers[user_id]
        
        return jsonify({"success": True, "message": "File deleted successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error deleting file: {str(e)}"}), 500

@app.route('/api/process', methods=['POST'])
def process_files():
    """Process files and create retriever"""
    # Get user ID (in a real app, this would come from authentication)
    user_id = request.json.get('user_id', 'default_user')
    
    result = process_user_files(user_id)
    
    if result["success"]:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/chat', methods=['POST'])
def chat():
    """Generate a response"""
    # Get user ID (in a real app, this would come from authentication)
    user_id = request.json.get('user_id', 'default_user')
    user_input = request.json.get('message', '')
    
    if not user_input:
        return jsonify({"success": False, "message": "Message is required"}), 400
    
    result = generate_response(user_id, user_input)
    print(f"Generate Response Result: {result}")
    
    if result["success"]:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get chat history for a user"""
    # Get user ID (in a real app, this would come from authentication)
    user_id = request.args.get('user_id', 'default_user')
    
    if user_id not in user_chat_history:
        return jsonify({"success": True, "history": []})
    
    return jsonify({
        "success": True, 
        "history": user_chat_history[user_id]
    })

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    """Clear chat history for a user"""
    # Get user ID (in a real app, this would come from authentication)
    user_id = request.json.get('user_id', 'default_user')
    
    if user_id in user_chat_history:
        user_chat_history[user_id] = []
    
    return jsonify({
        "success": True, 
        "message": "Chat history cleared"
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)