import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

function SidebarHeader({ user, onLogout }) {
  return (
    <div className="bg-slate-800 p-4 border-b border-slate-700">
      <h1 className="text-xl font-bold text-white mb-4">Proxima Chat</h1>
      <div className="flex items-center justify-between">
        <span className="text-slate-300 text-sm truncate">{user.email}</span>
        <button 
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          onClick={onLogout}
          title="Logout"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}

export default SidebarHeader;