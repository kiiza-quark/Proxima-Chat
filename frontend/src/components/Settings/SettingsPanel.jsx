import React from 'react';
import { FaTimes, FaInfoCircle, FaSignOutAlt } from 'react-icons/fa';

function SettingsPanel({ user, messages, onClose, onClearHistory, onLogout }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Chat Section */}
          <div className="space-y-3">
            <h3 className="text-white font-medium">Chat</h3>
            <button 
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClearHistory}
              disabled={messages.length === 0}
            >
              Clear Chat History
            </button>
          </div>

          {/* Account Section */}
          <div className="space-y-3">
            <h3 className="text-white font-medium">Account</h3>
            <div className="bg-slate-700 p-4 rounded-lg space-y-2">
              <p className="text-slate-300"><span className="text-slate-400">Email:</span> {user.email}</p>
              <p className="text-slate-300"><span className="text-slate-400">User ID:</span> {user.id}</p>
            </div>
            <button 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              onClick={onLogout}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>

          {/* Information Section */}
          <div className="space-y-3">
            <h3 className="text-white font-medium">Information</h3>
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex gap-3">
                <div className="text-blue-400 mt-1">
                  <FaInfoCircle className="text-xl" />
                </div>
                <div className="space-y-2 text-slate-300 text-sm">
                  <p>This system uses DeepSeek R1 (1.5B) running locally through Ollama.</p>
                  <p>Upload PDF documents (maximum 10) to have AI answer questions based on their content.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;