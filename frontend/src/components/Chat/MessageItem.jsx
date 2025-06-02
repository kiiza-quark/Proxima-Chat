import React from 'react';
import { FaUser, FaRobot, FaTrash } from 'react-icons/fa';
import { formatTime } from '../../utils/formatters';

function MessageItem({ message, index, isLoading, isLastMessage, onDeleteMessage }) {
  return (
    <div className="space-y-4">
      {/* User message */}
      <div className="flex gap-4">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <FaUser className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium">You</span>
            <span className="text-slate-400 text-sm">{formatTime(message.timestamp)}</span>
            <button 
              className="ml-auto p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
              onClick={() => onDeleteMessage(index)}
              title="Delete message"
            >
              <FaTrash />
            </button>
          </div>
          <div className="text-slate-300">{message.user}</div>
        </div>
      </div>
      
      {/* Bot message */}
      <div className="flex gap-4">
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
          <FaRobot className="text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium">AI</span>
            <span className="text-slate-400 text-sm">{formatTime(message.timestamp)}</span>
          </div>
          <div className="text-slate-300">
            {message.bot || (isLastMessage && isLoading ? (
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            ) : '')}
          </div>
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400 text-sm font-medium mb-2">Sources:</p>
              <ul className="space-y-1">
                {message.sources.map((source, i) => (
                  <li key={i} className="text-slate-300 text-sm">{source}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageItem;