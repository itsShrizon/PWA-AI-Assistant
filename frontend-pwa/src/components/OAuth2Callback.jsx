// src/components/OAuth2Callback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../services/api';

const OAuth2Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Get code from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          // Send code to your backend
          await chatApi.exchangeGoogleAuthCode(code);
          
          // Redirect to chat page after successful connection
          navigate('/chat');
        } catch (error) {
          console.error('Error handling OAuth callback:', error);
          // Handle error - maybe redirect to error page
          navigate('/chat?error=auth_failed');
        }
      } else {
        // No code found, redirect to chat
        navigate('/chat');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div>Processing authentication...</div>
  );
};

export default OAuth2Callback;