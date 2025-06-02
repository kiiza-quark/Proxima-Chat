// pages/WelcomePage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaSearch, FaHistory } from 'react-icons/fa';

function WelcomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-600 p-4 rounded-xl mb-4">
            <span className="text-4xl">🇺🇬</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Proxima Chat</h1>
          <h2 className="text-xl text-blue-400">Document Intelligence System</h2>
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-8">
          <p className="text-slate-300 text-center mb-8">
            Welcome to the Proxima Chat's Document Intelligence System. 
            This system allows you to ask questions about parliamentary documents and get accurate answers.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-700 p-6 rounded-lg text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FaUpload className="text-white text-xl" />
              </div>
              <h3 className="text-white font-semibold mb-2">Upload Documents</h3>
              <p className="text-slate-400">Upload PDF documents to the system</p>
            </div>

            <div className="bg-slate-700 p-6 rounded-lg text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FaSearch className="text-white text-xl" />
              </div>
              <h3 className="text-white font-semibold mb-2">Ask Questions</h3>
              <p className="text-slate-400">Get accurate answers from your documents</p>
            </div>

            <div className="bg-slate-700 p-6 rounded-lg text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FaHistory className="text-white text-xl" />
              </div>
              <h3 className="text-white font-semibold mb-2">Track History</h3>
              <p className="text-slate-400">All your conversations are saved securely</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              Register
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} Proxima Chat | All rights reserved
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;