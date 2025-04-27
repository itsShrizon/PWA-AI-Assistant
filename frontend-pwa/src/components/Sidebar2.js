// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/api';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5173/chat';
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const RESPONSE_TYPE = 'code';
const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}&response_type=${RESPONSE_TYPE}&access_type=offline&prompt=consent`;


console.log('Client ID first few chars:', CLIENT_ID?.substring(0, 5));
console.log('Client Secret length:', CLIENT_SECRET?.length);
console.log('Redirect URI:', REDIRECT_URI);

const SidebarContainer = styled.div`
  width: 280px;
  height: 100%;
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
`;

const UserProfile = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
  }

  .user-info {
    display: flex;
    flex-direction: column;

    h3 {
      margin: 0;
      font-size: 1rem;
    }

    p {
      margin: 2px 0 8px;
      font-size: 0.85rem;
      color: #666;
    }

    .button-group {
      display: flex;
      gap: 8px;
    }

    button {
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #d32f2f;
      }

      &:nth-of-type(2) {
        background-color: #1976d2;

        &:hover {
          background-color: #1565c0;
        }
      }
    }
  }
`;

const NewChatButton = styled(Link)`
  margin: 1rem;
  padding: 0.75rem;
  background-color: #4285f4;
  color: white;
  text-align: center;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  
  &:hover {
    background-color: #3367d6;
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

const ConversationItem = styled(Link)`
  display: flex;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  text-decoration: none;
  color: #212121;
  position: relative;
  background-color: ${props => props.active ? '#e3f2fd' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.active ? '#e3f2fd' : '#f1f3f4'};
  }
  
  .title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.9rem;
  }
  
  .date {
    font-size: 0.75rem;
    color: #666;
    margin-top: 4px;
  }
  
  .delete {
    position: absolute;
    right: 8px;
    top: 8px;
    background: none;
    border: none;
    color: #d32f2f;
    font-size: 0.85rem;
    opacity: 0;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  &:hover .delete {
    opacity: 1;
  }
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
  }
  
  button {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #666;
    
    &:hover {
      color: #333;
    }
  }
`;

const AppsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AppItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f5f5f5;
    border-color: #bdbdbd;
  }
  
  img {
    width: 32px;
    height: 32px;
    margin-right: 16px;
  }
  
  .app-info {
    flex: 1;
    
    h3 {
      margin: 0;
      font-size: 1rem;
    }
    
    p {
      margin: 4px 0 0;
      font-size: 0.85rem;
      color: #666;
    }
  }
  
  .connect-button {
    background-color: ${props => props.connected ? '#4caf50' : '#4caf50'};
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
    
    &:hover {
      background-color: ${props => props.connected ? '#43a047' : '#43a047'};
    }
  }
`;

// Success Modal Styles
const SuccessModalContent = styled(ModalContent)`
  width: 500px;
`;

const SuccessHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  
  img {
    width: 40px;
    height: 40px;
    margin-right: 16px;
  }
  
  h2 {
    margin: 0;
    color: #4caf50;
  }
`;

const EventsList = styled.div`
  margin-top: 20px;
  max-height: 300px;
  overflow-y: auto;
`;

const EventItem = styled.div`
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  
  h4 {
    margin: 0 0 8px;
    color: #333;
  }
  
  .event-time {
    display: flex;
    align-items: center;
    margin-bottom: ${props => props.location ? '8px' : '0'};
    font-size: 0.9rem;
    color: #666;
    
    svg {
      margin-right: 8px;
    }
  }
  
  .event-location {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    color: #666;
    
    svg {
      margin-right: 8px;
    }
  }
`;

const CloseButton = styled.button`
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 16px;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #3367d6;
  }
`;

const NoEventsMessage = styled.div`
  text-align: center;
  padding: 16px;
  color: #666;
  font-style: italic;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  
  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid #4285f4;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ModalTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
`;

const ModalTab = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  border-bottom: ${props => props.active ? '2px solid #4285f4' : 'none'};
  color: ${props => props.active ? '#4285f4' : '#666'};
  
  &:hover {
    color: #4285f4;
  }
`;

const Sidebar = ({ activeConversationId }) => {
  const { currentUser, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('connect');
  const navigate = useNavigate();

  // Add state to track the email associated with the calendar connection
  const [connectedCalendarEmail, setConnectedCalendarEmail] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.user_id) {
      fetchConversations();
      
      // Check if calendar is already connected (from localStorage)
      const storedAccessToken = localStorage.getItem('googleCalendarAccessToken');
      const storedRefreshToken = localStorage.getItem('googleCalendarRefreshToken');
      const tokenExpiry = localStorage.getItem('googleCalendarTokenExpiry');
      const storedConnectedEmail = localStorage.getItem('googleCalendarConnectedEmail');
      
      // Check if the stored email matches the current user's email
      if (storedAccessToken && storedRefreshToken && storedConnectedEmail === currentUser.email) {
        setCalendarConnected(true);
        setAccessToken(storedAccessToken);
        setConnectedCalendarEmail(storedConnectedEmail);
        
        // Check if token is expired and refresh if needed
        if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
          refreshAccessToken(storedRefreshToken);
        } else {
          // If token is valid, fetch calendar events
          fetchCalendarEvents(storedAccessToken);
        }
      } else if (storedConnectedEmail && storedConnectedEmail !== currentUser.email) {
        // User has changed, but we still have stored calendar data for another user
        console.log('Different user logged in, calendar connection removed');
        // Don't disconnect here - keep the data but don't show as connected for this user
        setCalendarConnected(false);
      }
      
      // Check for OAuth code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        handleCalendarAuthCode(code);
        // Clean up URL after processing the code
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [currentUser, activeConversationId]);

  // Fetch conversations
  const fetchConversations = async () => {
    setLoading(true);
    try {
      console.log("Fetching conversations for user:", currentUser.user_id);
      const response = await chatApi.getConversations();
      console.log("Conversations response:", response.data);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback code
  const handleCalendarAuthCode = async (code) => {
    setLoadingEvents(true);
    try {
      // Exchange authorization code for tokens
      const tokens = await exchangeCodeForTokens(code);
      
      // Store tokens along with the current user's email
      localStorage.setItem('googleCalendarAccessToken', tokens.access_token);
      localStorage.setItem('googleCalendarRefreshToken', tokens.refresh_token);
      localStorage.setItem('googleCalendarConnectedEmail', currentUser.email);
      
      // Calculate and store expiry time
      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + tokens.expires_in);
      localStorage.setItem('googleCalendarTokenExpiry', expiryTime.toISOString());
      
      // Update state
      setAccessToken(tokens.access_token);
      setCalendarConnected(true);
      setConnectedCalendarEmail(currentUser.email);
      
      // Fetch calendar events with the new token
      await fetchCalendarEvents(tokens.access_token);
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      Swal.fire('Error', 'Failed to connect to Google Calendar', 'error');
    } finally {
      setLoadingEvents(false);
    }
  };
  
  // Exchange authorization code for tokens
  const exchangeCodeForTokens = async (code) => {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('grant_type', 'authorization_code');
    
    console.log('Token request params:', {
      code: code.substring(0, 10) + '...',  // Log partial code for security
      client_id: CLIENT_ID.substring(0, 10) + '...',
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange error:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText
      });
      throw new Error(`Failed to exchange code: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  };
  
  // Refresh access token when expired
  const refreshAccessToken = async (refreshToken) => {
    try {
      const tokenEndpoint = 'https://oauth2.googleapis.com/token';
      
      const params = new URLSearchParams();
      params.append('refresh_token', refreshToken);
      params.append('client_id', CLIENT_ID);
      params.append('client_secret', CLIENT_SECRET);
      params.append('grant_type', 'refresh_token');
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update access token and expiry
      localStorage.setItem('googleCalendarAccessToken', data.access_token);
      
      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + data.expires_in);
      localStorage.setItem('googleCalendarTokenExpiry', expiryTime.toISOString());
      
      setAccessToken(data.access_token);
      
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, disconnect calendar
      disconnectCalendar();
      throw error;
    }
  };

  // Fetch real calendar events from Google Calendar API
  const fetchCalendarEvents = async (token = accessToken) => {
    setLoadingEvents(true);
    try {
      if (!token) {
        throw new Error('No access token available');
      }
      
      // Get events from primary calendar
      const calendarId = 'primary';
      const timeMin = new Date().toISOString();
      const maxResults = 10;
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('googleCalendarRefreshToken');
          if (refreshToken) {
            const newToken = await refreshAccessToken(refreshToken);
            return fetchCalendarEvents(newToken); // Retry with new token
          }
        }
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform Google Calendar events to our format
      const events = data.items.map(event => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location || null,
        description: event.description || null,
        htmlLink: event.htmlLink
      }));
      
      setUpcomingEvents(events);
      return events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setUpcomingEvents([]);
      throw error;
    } finally {
      setLoadingEvents(false);
    }
  };

  const disconnectCalendar = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('googleCalendarAccessToken');
    localStorage.removeItem('googleCalendarRefreshToken');
    localStorage.removeItem('googleCalendarTokenExpiry');
    localStorage.removeItem('googleCalendarConnectedEmail');
    
    // Reset state
    setCalendarConnected(false);
    setAccessToken(null);
    setUpcomingEvents([]);
    setConnectedCalendarEmail(null);
    
    Swal.fire('Disconnected', 'Google Calendar has been disconnected', 'info');
  };

  const handleDeleteConversation = async (e, conversationId) => {
    e.preventDefault();
    e.stopPropagation();
  
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This conversation will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });
  
    if (result.isConfirmed) {
      try {
        await chatApi.deleteConversation(conversationId);
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
  
        if (activeConversationId === conversationId) {
          navigate('/chat');
        }
  
        Swal.fire('Deleted!', 'Your conversation has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting conversation:', error);
        Swal.fire('Error!', 'Failed to delete conversation.', 'error');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConnectMedias = () => {
    setShowModal(true);
    setActiveModalTab('connect');
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleConnectGoogleCalendar = () => {
    if (calendarConnected) {
      // Ask if user wants to disconnect
      Swal.fire({
        title: 'Disconnect Google Calendar?',
        text: 'You will need to reconnect to access your calendar events again.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, disconnect',
      }).then((result) => {
        if (result.isConfirmed) {
          disconnectCalendar();
        }
      });
    } else {
      // Connect to Google Calendar
      Swal.fire({
        title: 'Connecting to Google Calendar',
        text: 'Redirecting to Google authentication...',
        icon: 'info',
        showConfirmButton: false,
        timer: 1500,
      }).then(() => {
        window.location.href = authUrl;
      });
    }
    
    closeModal();
  };

  // const handleViewCalendar = () => {
  //   if (calendarConnected) {
  //     fetchCalendarEvents();
  //     setShowSuccessModal(true);
  //   } else {
  //     Swal.fire({
  //       title: 'Calendar Not Connected',
  //       text: 'You need to connect your Google Calendar first.',
  //       icon: 'info',
  //       showCancelButton: true,
  //       confirmButtonColor: '#4285f4',
  //       cancelButtonColor: '#6c757d',
  //       confirmButtonText: 'Connect Calendar',
  //       cancelButtonText: 'Cancel'
  //     }).then((result) => {
  //       if (result.isConfirmed) {
  //         window.location.href = authUrl;
  //       }
  //     });
  //   }
  // };

  // Format date and time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatEventTime = (startDateString, endDateString) => {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    
    // Check if this is an all-day event
    const isAllDay = !startDateString.includes('T');
    
    if (isAllDay) {
      return `All day, ${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }
    
    const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    return `${date}, ${startTime} - ${endTime}`;
  };

  // Get first user message for each conversation as title
  const getConversationTitle = (conversation) => {
    const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    return 'New Conversation';
  };

  // Show warning if connected with different email
  const getCalendarWarningMessage = () => {
    if (connectedCalendarEmail && connectedCalendarEmail !== currentUser.email) {
      return `Calendar connected to ${connectedCalendarEmail}. Please disconnect and reconnect with ${currentUser.email}.`;
    }
    return null;
  };

  return (
    <>
      <SidebarContainer>
        <UserProfile>
          <img
              src={
              currentUser?.picture ||
              'https://static.vecteezy.com/system/resources/previews/000/439/863/non_2x/vector-users-icon.jpg'
              }
              alt="Profile"
          />
          <div className="user-info">
              <h3>{currentUser?.name || 'User'}</h3>
              <p>{currentUser?.email || 'user@example.com'}</p>
              <div className="button-group">
                <button onClick={handleLogout}>Logout</button>
                <button onClick={handleConnectMedias}>Connect Apps</button>
              </div>
          </div>
        </UserProfile>
        
        <NewChatButton to="/chat">+ New Chat</NewChatButton>
        
        <ConversationList>
          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center' }}>No conversations yet</div>
          ) : (
            conversations.map(conversation => (
              <ConversationItem 
                key={conversation.id} 
                to={`/chat/${conversation.id}`}
                active={activeConversationId === conversation.id ? 1 : 0}
              >
                <div>
                  <div className="title">{getConversationTitle(conversation)}</div>
                  <div className="date">{formatDate(conversation.updated_at)}</div>
                </div>
                <button 
                  className="delete" 
                  onClick={(e) => handleDeleteConversation(e, conversation.id)}
                >
                  Delete
                </button>
              </ConversationItem>
            ))
          )}
        </ConversationList>
      </SidebarContainer>

      {/* Connect Apps Modal with Tabs */}
      {showModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Connected Apps</h2>
              <button onClick={closeModal}>&times;</button>
            </ModalHeader>
            
            <ModalTabs>
              <ModalTab 
                active={activeModalTab === 'connect'} 
                onClick={() => setActiveModalTab('connect')}
              >
                Connect Apps
              </ModalTab>
              <ModalTab 
                active={activeModalTab === 'calendar'} 
                onClick={() => setActiveModalTab('calendar')}
              >
                Calendar
              </ModalTab>
            </ModalTabs>
            
            {activeModalTab === 'connect' && (
              <AppsList>
                <AppItem 
                  onClick={handleConnectGoogleCalendar}
                  connected={calendarConnected && connectedCalendarEmail === currentUser.email}  
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" 
                    alt="Google Calendar" 
                  />
                  <div className="app-info">
                    <h3>Google Calendar</h3>
                    <p>Connect your calendar to schedule events and get reminders</p>
                    {getCalendarWarningMessage() && (
                      <p style={{ color: '#f44336', marginTop: '8px' }}>
                        {getCalendarWarningMessage()}
                      </p>
                    )}
                  </div>
                  <button className="connect-button">
                    {calendarConnected && connectedCalendarEmail === currentUser.email ? 'Disconnect' : 'Connect'}
                  </button>
                </AppItem>
                {/* You can add more app options here */}
              </AppsList>
            )}
            
            {activeModalTab === 'calendar' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h3>Your Google Calendar</h3>
                  {!calendarConnected || connectedCalendarEmail !== currentUser.email ? (
                    <p style={{ color: '#666' }}>
                      {connectedCalendarEmail && connectedCalendarEmail !== currentUser.email 
                        ? `Calendar is connected to another account (${connectedCalendarEmail}). Please disconnect and reconnect with your current account.`
                        : 'Calendar is not connected. Connect your Google Calendar to view your events here.'}
                    </p>
                  ) : loadingEvents ? (
                    <LoadingSpinner>
                      <div className="spinner"></div>
                    </LoadingSpinner>
                  ) : (
                    <EventsList>
                      {upcomingEvents.length > 0 ? (
                        upcomingEvents.map(event => (
                          <EventItem key={event.id} location={event.location}>
                            <h4>{event.title}</h4>
                            <div className="event-time">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z" fill="#666"/>
                                <path d="M13 7H11V13H17V11H13V7Z" fill="#666"/>
                              </svg>
                              {formatEventTime(event.start, event.end)}
                            </div>
                            {event.location && (
                              <div className="event-location">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#666"/>
                                </svg>
                                {event.location}
                              </div>
                            )}
                          </EventItem>
                        ))
                      ) : (
                        <NoEventsMessage>
                          No upcoming events found in your calendar.
                        </NoEventsMessage>
                      )}
                    </EventsList>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {calendarConnected && connectedCalendarEmail === currentUser.email ? (
                    <>
                      <button 
                        className="connect-button" 
                        style={{ 
                          backgroundColor: '#4285f4', 
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 16px',
                          cursor: 'pointer'
                        }}
                        onClick={() => fetchCalendarEvents()}
                      >
                        Refresh Events
                      </button>
                      <button 
                        className="connect-button" 
                        style={{ 
                          backgroundColor: '#f44336', 
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 16px',
                          cursor: 'pointer'
                        }}
                        onClick={disconnectCalendar}
                      >
                        Disconnect Calendar
                      </button>
                    </>
                  ) : (
                    <button 
                      className="connect-button" 
                      style={{ 
                        backgroundColor: '#4285f4', 
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer'
                      }}
                      onClick={handleConnectGoogleCalendar}
                    >
                      Connect Calendar
                    </button>
                  )}
                </div>
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Calendar Connected Success Modal */}
      {showSuccessModal && (
        <ModalOverlay onClick={closeSuccessModal}>
          <SuccessModalContent onClick={(e) => e.stopPropagation()}>
            <SuccessHeader>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" 
                alt="Google Calendar" 
              />
              <h2>Google Calendar Connected Successfully!</h2>
            </SuccessHeader>
            
            <p>Your Google Calendar is now connected. You can now schedule events and get reminders directly through our chat interface.</p>
            
            <h3>Upcoming Events</h3>
            <EventsList>
              {loadingEvents ? (
                <LoadingSpinner>
                  <div className="spinner"></div>
                </LoadingSpinner>
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <EventItem key={event.id} location={event.location}>
                    <h4>{event.title}</h4>
                    <div className="event-time">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z" fill="#666"/>
                        <path d="M13 7H11V13H17V11H13V7Z" fill="#666"/>
                      </svg>
                      {formatEventTime(event.start, event.end)}
                    </div>
                    {event.location && (
                      <div className="event-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#666"/>
                        </svg>
                        {event.location}
                      </div>
                    )}
                  </EventItem>
                ))
              ) : (
                <NoEventsMessage>
                  No upcoming events found in your calendar.
                </NoEventsMessage>
              )}
            </EventsList>
            
            
            <CloseButton onClick={closeSuccessModal}>Close</CloseButton>
          </SuccessModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default Sidebar;