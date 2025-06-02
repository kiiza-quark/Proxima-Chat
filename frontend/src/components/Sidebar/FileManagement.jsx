import React, { useRef } from 'react';
import { FaUpload, FaFile, FaTrash } from 'react-icons/fa';

function FileManagement({ files, isLoading, onFileUpload, onDeleteFile }) {
  const fileInputRef = useRef(null);

  return (
    <div className="bg-slate-700 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Files</h2>
        <span className="text-slate-400 text-sm">{files.length}/10</span>
      </div>

      <div>
        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => fileInputRef.current.click()}
          disabled={isLoading || files.length >= 10}
        >
          <FaUpload /> Upload PDF
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          className="hidden"
          accept=".pdf"
        />
      </div>
      
      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg">
              <FaFile className="text-blue-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm truncate flex-1">{file.name}</span>
              <button 
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onDeleteFile(file.id)}
                disabled={isLoading}
                title="Delete file"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm">No files uploaded</p>
        </div>
      )}
    </div>
  );
}

export default FileManagement;