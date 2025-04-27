// src/components/Welcome.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  height: 100%;
  text-align: center;
`;

const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  
  h1 {
    margin-bottom: 1.5rem;
    font-size: 2.5rem;
    color: #4285f4;
  }
  
  p {
    font-size: 1.1rem;
    max-width: 600px;
    margin-bottom: 2rem;
    color: #666;
  }
`;

const SuggestionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 800px;
`;

const SuggestionCard = styled.button`
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  h3 {
    margin-top: 0;
    font-size: 1.1rem;
    color: #4285f4;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: white;
  width: 100%;
  max-width: 800px;
  margin-top: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
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

const Welcome = ({ onStartChat }) => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  
  const chatSuggestions = [
    {
      title: "Ask me anything",
      description: "I can help with answers on a wide range of topics."
    },
    {
      title: "Generate an image",
      description: "Describe an image and I'll create it for you."
    },
    {
      title: "Web search",
      description: "Ask me to search the web for current information."
    },
    {
      title: "Quick response",
      description: "Get concise answers for simple questions."
    }
  ];
  
  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onStartChat(input);
      setInput('');
    }
  };
  
  return (
    <WelcomeContainer>
      <ContentSection>
        <h1>Welcome to AI Assistant, {currentUser?.given_name || 'there'}!</h1>
        <p>
          Start a new conversation by selecting a suggestion below or typing your message directly.
        </p>
        
        <SuggestionGrid>
          {chatSuggestions.map((suggestion, index) => (
            <SuggestionCard 
              key={index} 
              onClick={() => onStartChat(suggestion.title)}
            >
              <h3>{suggestion.title}</h3>
              <p>{suggestion.description}</p>
            </SuggestionCard>
          ))}
        </SuggestionGrid>
      </ContentSection>
      
      <InputContainer>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message to start a conversation..."
          onKeyUp={(e) => e.key === 'Enter' && handleInputSubmit(e)}
        />
        <button 
          onClick={handleInputSubmit}
          disabled={!input.trim()}
        >
          Send
        </button>
      </InputContainer>
    </WelcomeContainer>
  );
};

export default Welcome;