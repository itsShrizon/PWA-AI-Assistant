import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import styled from 'styled-components';

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

const ErrorMessage = styled.div`
  text-align: center;
  padding: 16px;
  color: #f44336;
  font-style: italic;
`;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5173/chat';
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const RESPONSE_TYPE = 'code';
const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}&response_type=${RESPONSE_TYPE}&access_type=offline&prompt=consent`;

const CalendarFeature = ({ user, onDisconnect }) => {
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [connectedCalendarEmail, setConnectedCalendarEmail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.user_id) {
      const storedAccessToken = localStorage.getItem('googleCalendarAccessToken');
      const storedRefreshToken = localStorage.getItem('googleCalendarRefreshToken');
      const tokenExpiry = localStorage.getItem('googleCalendarTokenExpiry');
      const storedConnectedEmail = localStorage.getItem('googleCalendarConnectedEmail');
      
      if (storedAccessToken && storedRefreshToken && storedConnectedEmail === user.email) {
        setCalendarConnected(true);
        setAccessToken(storedAccessToken);
        setConnectedCalendarEmail(storedConnectedEmail);
        
        if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
          refreshAccessToken(storedRefreshToken);
        } else {
          fetchCalendarEvents(storedAccessToken);
        }
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        handleCalendarAuthCode(code);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user]);

  const handleCalendarAuthCode = async (code) => {
    setLoadingEvents(true);
    setError(null);
    try {
      const tokens = await exchangeCodeForTokens(code);
      
      localStorage.setItem('googleCalendarAccessToken', tokens.access_token);
      localStorage.setItem('googleCalendarRefreshToken', tokens.refresh_token);
      localStorage.setItem('googleCalendarConnectedEmail', user.email);
      
      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + tokens.expires_in);
      localStorage.setItem('googleCalendarTokenExpiry', expiryTime.toISOString());
      
      setAccessToken(tokens.access_token);
      setCalendarConnected(true);
      setConnectedCalendarEmail(user.email);
      
      await fetchCalendarEvents(tokens.access_token);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setError('Failed to connect to Google Calendar. Please try again.');
      Swal.fire('Error', 'Failed to connect to Google Calendar', 'error');
    } finally {
      setLoadingEvents(false);
    }
  };

  const exchangeCodeForTokens = async (code) => {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('grant_type', 'authorization_code');
    
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

  const refreshAccessToken = async (refreshToken) => {
    setError(null);
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
      
      localStorage.setItem('googleCalendarAccessToken', data.access_token);
      
      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + data.expires_in);
      localStorage.setItem('googleCalendarTokenExpiry', expiryTime.toISOString());
      
      setAccessToken(data.access_token);
      
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      disconnectCalendar();
      setError('Failed to refresh calendar access. Please reconnect.');
      throw error;
    }
  };

  const fetchCalendarEvents = async (token = accessToken) => {
    setLoadingEvents(true);
    setError(null);
    try {
      if (!token) {
        throw new Error('No access token available');
      }
      
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
          const refreshToken = localStorage.getItem('googleCalendarRefreshToken');
          if (refreshToken) {
            const newToken = await refreshAccessToken(refreshToken);
            return fetchCalendarEvents(newToken);
          }
        }
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      
      const data = await response.json();
      
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
      setError('Failed to load calendar events. Please try again.');
      throw error;
    } finally {
      setLoadingEvents(false);
    }
  };

  const disconnectCalendar = () => {
    localStorage.removeItem('googleCalendarAccessToken');
    localStorage.removeItem('googleCalendarRefreshToken');
    localStorage.removeItem('googleCalendarTokenExpiry');
    localStorage.removeItem('googleCalendarConnectedEmail');
    
    setCalendarConnected(false);
    setAccessToken(null);
    setUpcomingEvents([]);
    setConnectedCalendarEmail(null);
    setError(null);
    
    onDisconnect();
    Swal.fire('Disconnected', 'Google Calendar has been disconnected', 'info');
  };

  const handleConnectGoogleCalendar = () => {
    if (calendarConnected) {
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
  };

  const formatEventTime = (startDateString, endDateString) => {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    
    const isAllDay = !startDateString.includes('T');
    
    if (isAllDay) {
      return `All day, ${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }
    
    const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    return `${date}, ${startTime} - ${endTime}`;
  };

  return {
    calendarConnected,
    connectedCalendarEmail,
    handleConnectGoogleCalendar,
    fetchCalendarEvents,
    upcomingEvents,
    loadingEvents,
    error,
    renderSuccessModal: () => (
      showSuccessModal && (
        <ModalOverlay onClick={() => setShowSuccessModal(false)}>
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
              {error ? (
                <ErrorMessage>{error}</ErrorMessage>
              ) : loadingEvents ? (
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
            
            <CloseButton onClick={() => setShowSuccessModal(false)}>Close</CloseButton>
          </SuccessModalContent>
        </ModalOverlay>
      )
    )
  };
};

export default CalendarFeature;