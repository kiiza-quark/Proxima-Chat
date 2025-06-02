import React from 'react';
import SidebarHeader from './SidebarHeader';
import FileManagement from './FileManagement';
import SystemStatus from './SystemStatus';
import AboutSection from './AboutSection';

function Sidebar({ 
  user, 
  files, 
  isLoading, 
  isProcessing, 
  userStatus, 
  onLogout, 
  onFileUpload, 
  onDeleteFile, 
  onProcessFiles, 
  onToggleSettings 
}) {
  return (
    <div className="w-80 h-screen bg-slate-800 flex flex-col border-r border-slate-700">
      <SidebarHeader user={user} onLogout={onLogout} />
      
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6">
        <FileManagement 
          files={files} 
          isLoading={isLoading} 
          onFileUpload={onFileUpload} 
          onDeleteFile={onDeleteFile} 
        />
        
        <SystemStatus 
          userStatus={userStatus} 
          isProcessing={isProcessing} 
          onProcessFiles={onProcessFiles} 
          onToggleSettings={onToggleSettings} 
        />
        
        <AboutSection />
      </div>
    </div>
  );
}

export default Sidebar;