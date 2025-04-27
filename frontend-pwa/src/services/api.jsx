// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Removing this interceptor to avoid adding user_id twice
/*
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // For GET requests, add as query param
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          user_id: user.user_id,
        };
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
*/

// Chat API methods
const chatApi = {
  sendMessage: (payload) => {
    return api.post('/unified-chat', payload);
  },
  
  getConversations: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.user_id) {
      console.error('No user_id found in local storage');
      return Promise.reject(new Error('No user_id found'));
    }
    return api.get(`/conversations?user_id=${user.user_id}`);
  },
  
  getConversation: (conversationId) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.user_id) {
      console.error('No user_id found in local storage');
      return Promise.reject(new Error('No user_id found'));
    }
    return api.get(`/conversations/${conversationId}?user_id=${user.user_id}`);
  },
  
  deleteConversation: (conversationId) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.user_id) {
      console.error('No user_id found in local storage');
      return Promise.reject(new Error('No user_id found'));
    }
    return api.delete(`/conversations/${conversationId}?user_id=${user.user_id}`);
  }
};

// User API methods
const userApi = {
  saveUser: (userData) => {
    return api.post('/users', userData);
  }
};

export { chatApi, userApi };
export default api;