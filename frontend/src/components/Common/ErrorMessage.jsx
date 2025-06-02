import React from 'react';
import { FaTimes } from 'react-icons/fa';

function ErrorMessage({ message, onClose }) {
  if (!message) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-red-900/30 text-red-300 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
      <p className="flex-1">{message}</p>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-red-800/30 rounded-lg transition"
      >
        <FaTimes />
      </button>
    </div>
  );
}

export default ErrorMessage;