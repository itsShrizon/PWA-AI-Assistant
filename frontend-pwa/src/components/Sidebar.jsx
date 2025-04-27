// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/api';
import CalendarFeature from './CalendarFeature';
import CalendarCrudOperations from './CalendarCrudOperations';

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
  width: ${props => props.isEventForm ? '500px' : '400px'};
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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

const ModalTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  overflow-x: auto;
`;

const ModalTab = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  border-bottom: ${props => props.active ? '2px solid #4285f4' : 'none'};
  color: ${props => props.active ? '#4285f4' : '#666'};
  white-space: nowrap;
  
  &:hover {
    color: #4285f4;
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
  position: relative;
  
  h4 {
    margin: 0 0 8px;
    color: #333;
    padding-right: 40px;
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
  
  .event-actions {
    position: absolute;
    top: 12px;
    right: 12px;
    
    button {
      background: none;
      border: none;
      color: #4285f4;
      cursor: pointer;
      padding: 4px;
      margin-left: 8px;
      
      &:hover {
        color: #3367d6;
      }
    }
  }
`;

const CreateEventButton = styled.button`
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-bottom: 20px;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    background-color: #3367d6;
  }
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

const NoEventsMessage = styled.div`
  text-align: center;
  padding: 16px;
  color: #666;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 16px;
  color: #f44336;
  font-style: italic;
`;

const Sidebar = ({ activeConversationId }) => {
  const { currentUser, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('connect');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventFormVisible, setIsEventFormVisible] = useState(false);
  const navigate = useNavigate();
  
  const {
    calendarConnected, 
    connectedCalendarEmail, 
    handleConnectGoogleCalendar, 
    fetchCalendarEvents, 
    upcomingEvents,
    setUpcomingEvents,
    loadingEvents, 
    error, 
    renderSuccessModal
  } = CalendarFeature({ 
    user: currentUser, 
    onDisconnect: () => setShowModal(false)
  });

  useEffect(() => {
    if (currentUser && currentUser.user_id) {
      fetchConversations();
    }
  }, [currentUser, activeConversationId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await chatApi.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
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
    setIsEventFormVisible(false);
    setSelectedEvent(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getConversationTitle = (conversation) => {
    const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    return 'New Conversation';
  };

  const getCalendarWarningMessage = () => {
    if (connectedCalendarEmail && connectedCalendarEmail !== currentUser.email) {
      return `Calendar connected to ${connectedCalendarEmail}. Please disconnect and reconnect with ${currentUser.email}.`;
    }
    return null;
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

  const handleCreateEvent = () => {
    setIsEventFormVisible(true);
    setSelectedEvent(null);
    setActiveModalTab('create-event');
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEventFormVisible(true);
    setActiveModalTab('create-event');
  };

  const handleEventCreated = async (newEvent) => {
    // Process the newly created event
    if (newEvent && newEvent.id) {
      // Add the new event to the upcomingEvents list without refetching
      // This provides immediate UI feedback
      setUpcomingEvents(prev => [...prev, newEvent].sort((a, b) => 
        new Date(a.start) - new Date(b.start)
      ));
      
      // Show success message
      Swal.fire({
        title: 'Event Created',
        text: `"${newEvent.title}" has been added to your calendar`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
    
    // Close form and reset state
    setIsEventFormVisible(false);
    setActiveModalTab('calendar');
    
    // Optionally refresh all events to ensure synchronization
    await fetchCalendarEvents();
  };

  const handleEventUpdated = async (updatedEvent) => {
    // Process the updated event
    if (updatedEvent && updatedEvent.id) {
      // Update the event in the upcomingEvents list without refetching
      setUpcomingEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));
      
      // Show success message
      Swal.fire({
        title: 'Event Updated',
        text: `"${updatedEvent.title}" has been updated in your calendar`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
    
    // Reset state and close form
    setIsEventFormVisible(false);
    setSelectedEvent(null);
    setActiveModalTab('calendar');
    
    // Optionally refresh all events to ensure synchronization
    await fetchCalendarEvents();
  };

  const handleEventDeleted = async (deletedEventId) => {
    // Process the deleted event
    if (deletedEventId) {
      // Remove the event from the upcomingEvents list without refetching
      setUpcomingEvents(prev => prev.filter(event => event.id !== deletedEventId));
      
      // Show success message
      Swal.fire({
        title: 'Event Deleted',
        text: 'The event has been removed from your calendar',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
    
    // Reset state and close form
    setIsEventFormVisible(false);
    setSelectedEvent(null);
    setActiveModalTab('calendar');
    
    // Optionally refresh all events to ensure synchronization
    await fetchCalendarEvents();
  };
  
  const handleCancelEventForm = () => {
    setIsEventFormVisible(false);
    setSelectedEvent(null);
    setActiveModalTab('calendar');
  };

  // Get access token from localStorage
  const getAccessToken = () => {
    return localStorage.getItem('googleCalendarAccessToken');
  };

  return (
    <>
      <SidebarContainer>
        <UserProfile>
          <img src={ currentUser?.picture || 'https://static.vecteezy.com/system/resources/previews/000/439/863/non_2x/vector-users-icon.jpg'} alt="Profile"/>
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
              <ConversationItem key={conversation.id} to={`/chat/${conversation.id}`} active={activeConversationId === conversation.id ? 1 : 0}>
                <div>
                  <div className="title">{getConversationTitle(conversation)}</div>
                  <div className="date">{formatDate(conversation.updated_at)}</div>
                </div>
                <button className="delete" onClick={(e) => handleDeleteConversation(e, conversation.id)}>Delete</button>
              </ConversationItem>
            ))
          )}
        </ConversationList>
      </SidebarContainer>

      {showModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()} isEventForm={isEventFormVisible}>
            <ModalHeader>
              <h2>
                {isEventFormVisible 
                  ? selectedEvent 
                    ? 'Edit Calendar Event' 
                    : 'Create Calendar Event'
                  : 'Connected Apps'
                }
              </h2>
              <button onClick={closeModal}>×</button>
            </ModalHeader>
            
            {!isEventFormVisible && (
              <ModalTabs>
                <ModalTab 
                  active={activeModalTab === 'connect'} 
                  onClick={() => setActiveModalTab('connect')}
                >
                  Connect Apps
                </ModalTab>
                <ModalTab 
                  active={activeModalTab === 'calendar'} 
                  onClick={() => {
                    setActiveModalTab('calendar');
                    if (calendarConnected && connectedCalendarEmail === currentUser.email) {
                      fetchCalendarEvents();
                    }
                  }}
                >
                  Calendar
                </ModalTab>
                {calendarConnected && connectedCalendarEmail === currentUser.email && (
                  <ModalTab 
                    active={activeModalTab === 'create-event'} 
                    onClick={handleCreateEvent}
                  >
                    Create Event
                  </ModalTab>
                )}
              </ModalTabs>
            )}
            
            {activeModalTab === 'connect' && !isEventFormVisible && (
              <AppsList>
                <AppItem onClick={handleConnectGoogleCalendar} connected={calendarConnected && connectedCalendarEmail === currentUser.email}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" />
                  <div className="app-info">
                    <h3>Google Calendar</h3>
                    <p>Connect your calendar to schedule events and get reminders</p>
                    {getCalendarWarningMessage() && (<p style={{ color: '#f44336', marginTop: '8px' }}>{getCalendarWarningMessage()}</p>)}
                  </div>
                  <button className="connect-button">{calendarConnected && connectedCalendarEmail === currentUser.email ? 'Disconnect' : 'Connect'}</button>
                </AppItem>
              </AppsList>
            )}
            
            {activeModalTab === 'connect' && !isEventFormVisible && (
              <AppsList style={{ marginTop: '16px' }}>
                <AppItem onClick={x => x.preventDefault()} connected={false}>
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiXN9xSEe8unzPBEQOeAKXd9Q55efGHGB9BA&s" alt="Facebook" />
                  <div className="app-info">
                    <h3>Facebook Page</h3>
                    <p>Connect your facebook page to get notifications and messages</p>
                    <p style={{ color: '#666', fontSize: '0.85rem' }}>
                      <strong>Note:</strong> This feature is not yet available.
                    </p>
                  </div>
                  <button className="connect-button">Connect</button>
                </AppItem>
              </AppsList>
            )}
            
            {activeModalTab === 'calendar' && !isEventFormVisible && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h3>Your Google Calendar</h3>
                  
                  {calendarConnected && connectedCalendarEmail === currentUser.email && (
                    <CreateEventButton onClick={handleCreateEvent}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Create New Event
                    </CreateEventButton>
                  )}
                  
                  {!calendarConnected || connectedCalendarEmail !== currentUser.email ? (
                    <p style={{ color: '#666' }}>
                      {connectedCalendarEmail && connectedCalendarEmail !== currentUser.email 
                        ? `Calendar is connected to another account (${connectedCalendarEmail}). Please disconnect and reconnect with your current account.`
                        : 'Calendar is not connected. Connect your Google Calendar to view your events here.'}
                    </p>
                  ) : (
                    <EventsList>
                      {error ? (
                        <ErrorMessage>{error}</ErrorMessage>
                      ) : loadingEvents ? (
                        <LoadingSpinner><div className="spinner"></div></LoadingSpinner>
                      ) : upcomingEvents.length > 0 ? (
                        upcomingEvents.map(event => (
                          <EventItem key={event.id} location={event.location}>
                            <div className="event-actions">
                              <button onClick={() => handleEditEvent(event)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                            </div>
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
                        <NoEventsMessage>No upcoming events found in your calendar.</NoEventsMessage>
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
                        onClick={handleConnectGoogleCalendar}
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
            
            {(activeModalTab === 'create-event' || isEventFormVisible) && calendarConnected && (
              <CalendarCrudOperations
                accessToken={getAccessToken()}
                selectedEvent={selectedEvent}
                onEventCreated={handleEventCreated}
                onEventUpdated={handleEventUpdated}
                onEventDeleted={handleEventDeleted}
                onCancel={handleCancelEventForm}
              />
            )}
          </ModalContent>
        </ModalOverlay>
      )}
      
      {renderSuccessModal()}
    </>
  );
};

export default Sidebar;