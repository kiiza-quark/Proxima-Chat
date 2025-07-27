import React from 'react';
import { FaRobot } from 'react-icons/fa';

function WelcomeMessage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center mb-6">
        <FaRobot className="text-blue-400 text-3xl" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Proxima Chat</h2>
      <p className="text-slate-400 mb-8">Upload PDF documents and ask questions about them.</p>
      
      <div className="max-w-md w-full space-y-4">
        <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-lg">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium">1</span>
          </div>
          <div className="text-slate-300 text-left">Upload PDFs (max 10)</div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-lg">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium">2</span>
          </div>
          <div className="text-slate-300 text-left">Process the files</div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-lg">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium">3</span>
          </div>
          <div className="text-slate-300 text-left">Ask questions about your documents</div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeMessage;