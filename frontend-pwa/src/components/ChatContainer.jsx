// src/components/ChatContainer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/api';
import styled from 'styled-components';
import ChatMessage from './ChatMessage';
import Welcome from './Welcome';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: white;
  
  input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  button {
    margin-left: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    
    &:hover {
      background-color: #3367d6;
    }
    
    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  }
`;

const ModelSelector = styled.select`
  padding: 0.75rem;
  margin-right: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
`;

const ChatContainer = () => {
    const { conversationId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState('chat');
    const messagesEndRef = useRef(null);
  
    // Fetch conversation if conversation ID exists
    useEffect(() => {
      if (conversationId) {
        fetchConversation();
      } else {
        // New conversation
        setMessages([]);
      }
    }, [conversationId]);
  
    // Scroll to bottom when messages change
    useEffect(() => {
      scrollToBottom();
    }, [messages]);
  
    const fetchConversation = async () => {
      try {
        const response = await chatApi.getConversation(conversationId);
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        navigate('/chat');
      }
    };
  
    const handleSendMessage = async (messageText = input) => {
        if (!messageText.trim() || isLoading) return;
    
        const userMessage = {
        role: 'user',
        content: messageText,
        content_type: 'text'
        };
    
        // Update UI immediately
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
    
        try {
        // Make sure all required fields are included
        const payload = {
            messages: [...messages, userMessage],
            user_id: currentUser.user_id,
            conversation_id: conversationId || undefined,
            // Only include force_type if model is selected
            ...(model !== 'chat' && { force_type: model })
        };
    
        console.log('Sending payload:', payload);
        const response = await chatApi.sendMessage(payload);
        
        // If this is a new conversation, update the URL
        if (!conversationId) {
            navigate(`/chat/${response.data.conversation_id}`, { replace: true });
        }
    
        // Add assistant response to messages
        setMessages(prev => [...prev, response.data.message]);
        } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
        } finally {
        setIsLoading(false);
        }
    };
  
    const handleFormSubmit = (e) => {
      e.preventDefault();
      handleSendMessage();
    };
  
    const handleSuggestionClick = (suggestion) => {
      handleSendMessage(suggestion);
    };
  
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
  
    // Show welcome screen if no conversation is selected and no messages
    if (!conversationId && messages.length === 0) {
      return (
        <Welcome onStartChat={handleSuggestionClick} />
      );
    }
  
    return (
      <Container>
        <MessagesContainer>
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>
        
        <InputContainer>
          <ModelSelector 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoading}
          >
            <option value="chat">Standard Chat</option>
            <option value="search">Web Search</option>
            <option value="image">Generate Image</option>
            <option value="mini">Quick Response</option>
          </ModelSelector>
          
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                onKeyUp={(e) => e.key === 'Enter' && handleFormSubmit(e)}
            />
            
            <button 
                onClick={handleFormSubmit}
                disabled={isLoading || !input.trim()}
            >
                {isLoading ? 'Sending...' : 'Send'}
            </button>
        </InputContainer>
      </Container>
    );
  };
  
  export default ChatContainer;