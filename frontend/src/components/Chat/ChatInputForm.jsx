import React from 'react';
import { FaPaperPlane } from 'react-icons/fa';

function ChatInputForm({ input, isReady, isLoading, onChange, onSubmit }) {
  return (
    <form className="p-4 border-t border-slate-700 bg-slate-800" onSubmit={onSubmit}>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isReady ? "Ask a question about your documents..." : "Upload and process documents to begin"}
          disabled={!isReady || isLoading}
          className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isReady || !input.trim() || isLoading}
        >
          <FaPaperPlane />
        </button>
      </div>
    </form>
  );
}

export default ChatInputForm;