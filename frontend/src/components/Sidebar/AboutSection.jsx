import React from 'react';

function AboutSection() {
  return (
    <div className="bg-slate-700 rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold text-white">About</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Model:</span>
          <span className="text-slate-300">DeepSeek R1 (1.5B)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Vector Store:</span>
          <span className="text-slate-300">FAISS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Embeddings:</span>
          <span className="text-slate-300">HuggingFace</span>
        </div>
      </div>
    </div>
  );
}

export default AboutSection;