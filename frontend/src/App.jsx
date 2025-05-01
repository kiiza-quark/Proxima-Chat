// App.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaRobot, FaUser, FaFile, FaTrash, FaPaperPlane, FaCog, FaTimes, FaSync, FaUpload, FaInfoCircle } from 'react-icons/fa';
import './App.css';

// API configuration
const API_URL = 'http://localhost:5000/api';
const USER_ID = 'default_user'; // In a real app, this would come from authentication

function App() {
  // State
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch files on load
  useEffect(() => {
    fetchFiles();
    fetchHistory();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  };

  // Fetch files
  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/files`, {
        params: { user_id: USER_ID }
      });
      
      if (response.data.success) {
        setFiles(response.data.files);
        // If files exist, check if retriever is ready
        if (response.data.files.length > 0) {
          try {
            const chatResponse = await axios.post(`${API_URL}/chat`, {
              user_id: USER_ID,
              message: 'system_check'
            });
            setIsReady(chatResponse.data.success);
          } catch (error) {
            setIsReady(false);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to fetch files');
    }
  };

  // Fetch chat history
  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history`, {
        params: { user_id: USER_ID }
      });
      
      if (response.data.success) {
        setMessages(response.data.history);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check max files
    if (files.length >= 5) {
      setError('Maximum of 5 files allowed');
      return;
    }
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', USER_ID);
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        await fetchFiles();
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete file
  const deleteFile = async (fileId) => {
    try {
      setIsLoading(true);
      const response = await axios.delete(`${API_URL}/files/${fileId}`, {
        params: { user_id: USER_ID }
      });
      
      if (response.data.success) {
        await fetchFiles();
        // If no files left, system is not ready
        if (files.length <= 1) {
          setIsReady(false);
        }
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
    } finally {
      setIsLoading(false);
    }
  };

  // Process files
  const processFiles = async () => {
    if (files.length === 0) {
      setError('Please upload files first');
      return;
    }
    
    try {
      setIsProcessing(true);
      const response = await axios.post(`${API_URL}/process`, {
        user_id: USER_ID
      });
      
      if (response.data.success) {
        setIsReady(true);
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      setError('Failed to process files');
    } finally {
      setIsProcessing(false);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || !isReady) return;
    
    // Add user message immediately
    const userMessage = {
      user: input,
      bot: '',
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/chat`, {
        user_id: USER_ID,
        message: input
      });
      
      if (response.data.success) {
        // Fetch updated history
        await fetchHistory();
      } else {
        // Add error message
        const errorMessage = {
          user: input,
          bot: `Error: ${response.data.message}`,
          timestamp: new Date().toISOString()
        };
        setMessages([...messages, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage = {
        user: input,
        bot: 'Error: Failed to communicate with the server',
        timestamp: new Date().toISOString()
      };
      setMessages([...messages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history
  const clearHistory = async () => {
    try {
      await axios.delete(`${API_URL}/history`, {
        data: { user_id: USER_ID }
      });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      setError('Failed to clear chat history');
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>RAG Chat</h1>
          <button 
            className="icon-button settings-button" 
            onClick={() => setShowSettings(!showSettings)}
          >
            <FaCog />
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="section">
            <h2>Files ({files.length}/5)</h2>
            <div className="file-actions">
              <button 
                className="upload-button"
                onClick={() => fileInputRef.current.click()}
                disabled={isLoading || files.length >= 5}
              >
                <FaUpload /> Upload PDF
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept=".pdf"
              />
            </div>
            
            {files.length > 0 ? (
              <div className="file-list">
                {files.map((file) => (
                  <div key={file.id} className="file-item">
                    <span className="file-icon"><FaFile /></span>
                    <span className="file-name">{file.name}</span>
                    <button 
                      className="icon-button delete-button"
                      onClick={() => deleteFile(file.id)}
                      disabled={isLoading}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No files uploaded</p>
              </div>
            )}
          </div>
          
          <div className="section">
            <h2>System Status</h2>
            <div className="status-item">
              <span>Documents:</span>
              <span className={files.length > 0 ? 'status-ok' : 'status-error'}>
                {files.length > 0 ? 'Loaded' : 'Not Loaded'}
              </span>
            </div>
            <div className="status-item">
              <span>Knowledge Base:</span>
              <span className={isReady ? 'status-ok' : 'status-error'}>
                {isReady ? 'Ready' : 'Not Ready'}
              </span>
            </div>
            
            {files.length > 0 && !isReady && (
              <button 
                className="process-button"
                onClick={processFiles}
                disabled={isProcessing || files.length === 0}
              >
                {isProcessing ? (
                  <>
                    <FaSync className="loading-icon" /> Processing...
                  </>
                ) : (
                  <>
                    <FaSync /> Process Files
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="section">
            <h2>About</h2>
            <div className="about-content">
              <p><strong>Model:</strong> DeepSeek R1 (1.5B)</p>
              <p><strong>Vector Store:</strong> FAISS</p>
              <p><strong>Embeddings:</strong> HuggingFace</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main">
        {/* Chat messages */}
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-icon">
                <FaRobot />
              </div>
              <h2>Welcome to RAG Chat!</h2>
              <p>Upload PDF documents and ask questions about them.</p>
              <div className="welcome-steps">
                <div className="welcome-step">
                  <div className="step-number">1</div>
                  <div className="step-text">Upload PDFs (max 5)</div>
                </div>
                <div className="welcome-step">
                  <div className="step-number">2</div>
                  <div className="step-text">Process the files</div>
                </div>
                <div className="welcome-step">
                  <div className="step-number">3</div>
                  <div className="step-text">Ask questions about your documents</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg, index) => (
                <div key={index} className="message-group">
                  {/* User message */}
                  <div className="message user-message">
                    <div className="message-avatar">
                      <FaUser />
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">You</span>
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="message-text">{msg.user}</div>
                    </div>
                  </div>
                  
                  {/* Bot message */}
                  <div className="message bot-message">
                    <div className="message-avatar">
                      <FaRobot />
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">AI</span>
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="message-text">
                        {msg.bot || (index === messages.length - 1 && isLoading ? (
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        ) : '')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input form */}
        <form className="input-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReady ? "Ask a question about your documents..." : "Upload and process documents to begin"}
            disabled={!isReady || isLoading}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!isReady || !input.trim() || isLoading}
          >
            <FaPaperPlane />
          </button>
        </form>
        {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h2>Settings</h2>
            <button 
              className="icon-button close-button"
              onClick={() => setShowSettings(false)}
            >
              <FaTimes />
            </button>
          </div>
          <div className="settings-content">
            <div className="settings-section">
              <h3>Chat</h3>
              <button 
                className="settings-button"
                onClick={clearHistory}
                disabled={messages.length === 0}
              >
                Clear Chat History
              </button>
            </div>
            <div className="settings-section">
              <h3>Information</h3>
              <div className="info-box">
                <div className="info-icon"><FaInfoCircle /></div>
                <div className="info-content">
                  <p>This RAG system uses DeepSeek R1 (1.5B) running locally through Ollama.</p>
                  <p>Upload PDF documents (maximum 5) to have AI answer questions based on their content.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      
      
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;