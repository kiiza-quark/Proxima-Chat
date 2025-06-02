import React from 'react';
import WelcomeMessage from './WelcomeMessage';
import MessageList from './MessageList';

function ChatContainer({ messages, isLoading, onDeleteMessage, messagesEndRef }) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-900">
      {messages.length === 0 ? (
        <WelcomeMessage />
      ) : (
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          onDeleteMessage={onDeleteMessage}
          messagesEndRef={messagesEndRef}
        />
      )}
    </div>
  );
}

export default ChatContainer;