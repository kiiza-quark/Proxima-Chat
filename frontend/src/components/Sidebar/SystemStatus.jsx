import React from 'react';
import { FaSync, FaCog } from 'react-icons/fa';

function SystemStatus({ userStatus, isProcessing, onProcessFiles, onToggleSettings }) {
  return (
    <div className="bg-slate-700 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white">System Status</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Documents:</span>
          <span className={`px-2 py-1 rounded text-sm ${userStatus.has_files ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
            {userStatus.has_files ? 'Loaded' : 'Not Loaded'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Knowledge Base:</span>
          <span className={`px-2 py-1 rounded text-sm ${userStatus.has_retriever ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
            {userStatus.has_retriever ? 'Ready' : 'Not Ready'}
          </span>
        </div>
      </div>
      
      {userStatus.has_files && !userStatus.has_retriever && (
        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onProcessFiles}
          disabled={isProcessing || userStatus.file_count === 0}
        >
          {isProcessing ? (
            <>
              <FaSync className="animate-spin" /> Processing...
            </>
          ) : (
            <>
              <FaSync /> Process Files
            </>
          )}
        </button>
      )}

      <button 
        className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
        onClick={onToggleSettings}
      >
        <FaCog /> Settings
      </button>
    </div>
  );
}

export default SystemStatus;