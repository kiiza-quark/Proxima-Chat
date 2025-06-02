import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatContainer from '../components/Chat/ChatContainer';
import ChatInputForm from '../components/Chat/ChatInputForm';
import SettingsPanel from '../components/Settings/SettingsPanel';
import ErrorMessage from '../components/Common/ErrorMessage';

import API_URL from '../utils/apiConfig';

function Dashboard() {
  // State
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [userStatus, setUserStatus] = useState({
    has_files: false,
    has_retriever: false,
    has_history: false,
    file_count: 0
  });

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch data on load
  useEffect(() => {
    fetchUserStatus();
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

  // Fetch user status
  const fetchUserStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/status`);
      if (response.data.success) {
        setUserStatus(response.data.status);
        setIsReady(response.data.status.has_retriever);
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  // Fetch files
  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/files`);
      
      if (response.data.success) {
        setFiles(response.data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to fetch files');
    }
  };

  // Fetch chat history
  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history`);
      
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
    if (files.length >= 10) {
      setError('Maximum of 10 files allowed');
      return;
    }
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        await fetchFiles();
        await fetchUserStatus();
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
      const response = await axios.delete(`${API_URL}/files/${fileId}`);
      
      if (response.data.success) {
        await fetchFiles();
        await fetchUserStatus();
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
      const response = await axios.post(`${API_URL}/process`);
      
      if (response.data.success) {
        setIsReady(true);
        await fetchUserStatus();
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
    
    // Add user message immediately for UI feedback
    const userMessage = {
      user: input,
      bot: '',
      sources: [],
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/chat`, {
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
          sources: [],
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
        sources: [],
        timestamp: new Date().toISOString()
      };
      setMessages([...messages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete history item
  const deleteHistoryItem = async (index) => {
    try {
      const response = await axios.delete(`${API_URL}/history/${index}`);
      if (response.data.success) {
        await fetchHistory();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting history item:', error);
      setError('Failed to delete history item');
    }
  };

  // Clear chat history
  const clearHistory = async () => {
    try {
      const response = await axios.delete(`${API_URL}/history`);
      if (response.data.success) {
        setMessages([]);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      setError('Failed to clear chat history');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Clear error message
  const clearError = () => {
    setError(null);
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <Sidebar 
        user={user}
        files={files}
        isLoading={isLoading}
        isProcessing={isProcessing}
        userStatus={userStatus}
        onLogout={handleLogout}
        onFileUpload={handleFileUpload}
        onDeleteFile={deleteFile}
        onProcessFiles={processFiles}
        onToggleSettings={toggleSettings}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat container */}
        <ChatContainer 
          messages={messages}
          isLoading={isLoading}
          onDeleteMessage={deleteHistoryItem}
          messagesEndRef={messagesEndRef}
        />
        
        {/* Input form */}
        <ChatInputForm 
          input={input}
          isReady={isReady}
          isLoading={isLoading}
          onChange={setInput}
          onSubmit={sendMessage}
        />
        
        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel 
            user={user}
            messages={messages}
            onClose={toggleSettings}
            onClearHistory={clearHistory}
            onLogout={handleLogout}
          />
        )}
      </div>
      
      {/* Error message */}
      <ErrorMessage 
        message={error}
        onClose={clearError}
      />
    </div>
  );
}

export default Dashboard;