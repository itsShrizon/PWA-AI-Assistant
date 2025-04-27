// src/components/GoogleSignIn.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  h2 {
    margin-bottom: 2rem;
    font-size: 1.8rem;
  }
  
  .login-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
`;

const GoogleSignIn = () => {
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Failed to log in with Google. Please try again.');
    }
  };

  const handleError = () => {
    console.error('Login Failed');
    alert('Login failed. Please try again.');
  };

  return (
    <LoginContainer>
      <h2>Welcome to AI Assistant</h2>
      <div className="login-wrapper">
        <p>Please sign in to continue</p>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap
        />
      </div>
    </LoginContainer>
  );
};

export default GoogleSignIn;