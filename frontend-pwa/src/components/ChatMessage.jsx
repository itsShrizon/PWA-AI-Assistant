// src/components/ChatMessage.jsx
import React from 'react';
import styled from 'styled-components';

const MessageContainer = styled.div`
  display: flex;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
  margin-bottom: 1rem;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: ${props => props.isUser ? '0 0 0 12px' : '0 12px 0 0'};
  background-color: ${props => props.isUser ? '#4285f4' : '#e0e0e0'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isUser ? 'white' : '#333'};
  font-weight: bold;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MessageContent = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${props => props.isUser ? '#e3f2fd' : '#f5f5f5'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  
  p {
    margin: 0;
    white-space: pre-wrap;
  }
  
  img {
    max-width: 100%;
    border-radius: 4px;
    margin-top: 8px;
  }
`;

const SystemMessage = styled.div`
  width: 100%;
  padding: 8px 12px;
  background-color: #fffde7;
  border-left: 4px solid #ffd600;
  margin-bottom: 1rem;
  font-style: italic;
`;

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  if (isSystem) {
    return <SystemMessage>{message.content}</SystemMessage>;
  }
  
  return (
    <MessageContainer isUser={isUser}>
      <Avatar isUser={isUser}>
        {isUser ? 'U' : 'AI'}
      </Avatar>
      <MessageContent isUser={isUser}>
        {message.content_type === 'text' && <p>{message.content}</p>}
        {message.content_type === 'image' && (
          <>
            <p>{message.content}</p>
            {message.image_url && <img src={"http://localhost:8000"+message.image_url} alt="Generated image" />}
          </>
        )}
      </MessageContent>
    </MessageContainer>
  );
};

export default ChatMessage;