import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Swal from 'sweetalert2';

// Styled components remain the same...
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-weight: 500;
    color: #333;
    font-size: 0.9rem;
  }

  input, textarea, select {
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: #4285f4;
    }
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }
`;

const DateTimeContainer = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 20px;
  }

  span:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + span {
    background-color: #4285f4;
  }

  input:checked + span:before {
    transform: translateX(20px);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border: none;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f1f3f4;
  color: #333;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const SaveButton = styled(Button)`
  background-color: #4285f4;
  color: white;
  
  &:hover {
    background-color: #3367d6;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #f44336;
  color: white;
  margin-right: auto;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

const ErrorText = styled.div`
  color: #f44336;
  font-size: 0.85rem;
  margin-top: 4px;
`;

const CalendarCrudOperations = ({ accessToken, selectedEvent, onEventCreated, onEventUpdated, onEventDeleted, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00'
  });

  useEffect(() => {
    if (selectedEvent) {
      // Handle existing event data
      const startDate = new Date(selectedEvent.start);
      const endDate = new Date(selectedEvent.end);
      const isAllDayEvent = !selectedEvent.start.includes('T');
      
      setIsAllDay(isAllDayEvent);
      
      setFormData({
        title: selectedEvent.title || '',
        location: selectedEvent.location || '',
        description: selectedEvent.description || '',
        startDate: formatDateForInput(startDate),
        startTime: isAllDayEvent ? '00:00' : formatTimeForInput(startDate),
        endDate: formatDateForInput(endDate),
        endTime: isAllDayEvent ? '23:59' : formatTimeForInput(endDate)
      });
    } else {
      // Set default dates for new event
      const now = new Date();
      const hourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
      
      setFormData({
        title: '',
        location: '',
        description: '',
        startDate: formatDateForInput(now),
        startTime: formatTimeForInput(now),
        endDate: formatDateForInput(now),
        endTime: formatTimeForInput(hourLater)
      });
      
      // Default to not all-day for new events
      setIsAllDay(false);
    }
  }, [selectedEvent]);

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTimeForInput = (date) => {
    return date.toTimeString().substring(0, 5);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any previous errors when user makes changes
    if (error) setError(null);
  };

  const handleAllDayToggle = () => {
    setIsAllDay(!isAllDay);
    // Clear any previous errors when user makes changes
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Event title is required');
      return false;
    }
    
    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }
    
    if (!formData.endDate) {
      setError('End date is required');
      return false;
    }
    
    // Check if end date/time is after start date/time
    const startDateTime = new Date(`${formData.startDate}T${isAllDay ? '00:00' : formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${isAllDay ? '23:59' : formData.endTime}`);
    
    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return false;
    }
    
    setError(null);
    return true;
  };

  const createEvent = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Get timezone offset in the format +HHMM or -HHMM
      const tzOffset = new Date().toTimeString().match(/GMT([+-]\d{4})/)[1];
      
      const eventData = {
        summary: formData.title,
        location: formData.location,
        description: formData.description,
        start: isAllDay
          ? { date: formData.startDate }
          : { dateTime: `${formData.startDate}T${formData.startTime}:00${tzOffset}` },
        end: isAllDay
          ? { date: formData.endDate }
          : { dateTime: `${formData.endDate}T${formData.endTime}:00${tzOffset}` }
      };
      
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
    );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to create event: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create formatted event object to return to parent component
      const createdEvent = {
        id: data.id,
        title: data.summary || 'Untitled Event',
        start: isAllDay ? data.start.date : data.start.dateTime,
        end: isAllDay ? data.end.date : data.end.dateTime,
        location: data.location || '',
        description: data.description || '',
        htmlLink: data.htmlLink
      };
      
      // Pass the created event back to the parent component
      if (onEventCreated) onEventCreated(createdEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      setError(`Failed to create event: ${error.message}`);
      Swal.fire('Error', `Failed to create event: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvent = async () => {
    if (!validateForm() || !selectedEvent) return;
    
    setIsLoading(true);
    
    try {
      // Get timezone offset in the format +HHMM or -HHMM
      const tzOffset = new Date().toTimeString().match(/GMT([+-]\d{4})/)[1];
      
      const eventData = {
        summary: formData.title,
        location: formData.location,
        description: formData.description,
        start: isAllDay
          ? { date: formData.startDate }
          : { dateTime: `${formData.startDate}T${formData.startTime}:00${tzOffset}` },
        end: isAllDay
          ? { date: formData.endDate }
          : { dateTime: `${formData.endDate}T${formData.endTime}:00${tzOffset}` }
      };
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${selectedEvent.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to update event: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create formatted event object to return to parent component
      const updatedEvent = {
        id: data.id,
        title: data.summary || 'Untitled Event',
        start: isAllDay ? data.start.date : data.start.dateTime,
        end: isAllDay ? data.end.date : data.end.dateTime,
        location: data.location || '',
        description: data.description || '',
        htmlLink: data.htmlLink
      };
      
      // Pass the updated event back to the parent component
      if (onEventUpdated) onEventUpdated(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      setError(`Failed to update event: ${error.message}`);
      Swal.fire('Error', `Failed to update event: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async () => {
    if (!selectedEvent) return;
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This event will be permanently deleted from your calendar!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${selectedEvent.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to delete event: ${response.status}`);
      }
      
      // Pass the event ID back to the parent component
      if (onEventDeleted) onEventDeleted(selectedEvent.id);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(`Failed to delete event: ${error.message}`);
      Swal.fire('Error', `Failed to delete event: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedEvent) {
      updateEvent();
    } else {
      createEvent();
    }
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <label htmlFor="title">Event Title*</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Add title"
            required
          />
        </FormGroup>
        
        <SwitchContainer>
          <Switch>
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={handleAllDayToggle}
            />
            <span></span>
          </Switch>
          <label>All-day event</label>
        </SwitchContainer>
        
        <FormGroup>
          <label>Start</label>
          <DateTimeContainer>
            <input
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
            {!isAllDay && (
              <input
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            )}
          </DateTimeContainer>
        </FormGroup>
        
        <FormGroup>
          <label>End</label>
          <DateTimeContainer>
            <input
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              required
            />
            {!isAllDay && (
              <input
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            )}
          </DateTimeContainer>
        </FormGroup>
        
        <FormGroup>
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Add location"
          />
        </FormGroup>
        
        <FormGroup>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Add description"
          />
        </FormGroup>
        
        {error && <ErrorText>{error}</ErrorText>}
        
        <ButtonGroup>
          {selectedEvent && (
            <DeleteButton
              type="button"
              onClick={deleteEvent}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </DeleteButton>
          )}
          <CancelButton
            type="button"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </CancelButton>
          <SaveButton
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : selectedEvent ? 'Update' : 'Create'}
          </SaveButton>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
};

export default CalendarCrudOperations;