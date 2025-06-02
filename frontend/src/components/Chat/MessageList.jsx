import React from 'react';
import MessageItem from './MessageItem';

function MessageList({ messages, isLoading, onDeleteMessage, messagesEndRef }) {
  return (
    <div className="flex flex-col space-y-6 p-4">
      {messages.map((msg, index) => (
        <MessageItem 
          key={index}
          message={msg}
          index={index}
          isLoading={isLoading}
          isLastMessage={index === messages.length - 1}
          onDeleteMessage={onDeleteMessage}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;