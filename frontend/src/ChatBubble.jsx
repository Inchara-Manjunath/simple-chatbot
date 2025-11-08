import React from 'react';

export default function ChatBubble({ msg }) {
  const isBot = msg.sender === 'bot';
  return (
    <div className={`chat-row ${isBot ? 'bot' : 'user'}`}>
      <div className="avatar">
        {isBot ? (
          <div className="robot">🤖</div>
        ) : (
          <div className="user-avatar">👤</div>
        )}
      </div>
      <div className="bubble">{msg.text}</div>
    </div>
  );
}
