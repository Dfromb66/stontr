import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow, parseISO, addYears, addMonths, addDays } from 'date-fns';
import EventCard from './components/EventCard';
import AddEventModal from './components/AddEventModal';
import CategoryManager from './components/CategoryManager';
import apiService from './services/api';
import { calculateUrgency } from './utils/urgency';

function App() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load events and categories from database on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort events whenever events or selectedCategory changes
  useEffect(() => {
    let newFilteredEvents = [...events];

    // Filter by category
    if (selectedCategory !== 'all') {
      newFilteredEvents = newFilteredEvents.filter(event => event.category === selectedCategory);
    }

    // Filter by urgency
    if (urgencyFilter !== 'all') {
      newFilteredEvents = newFilteredEvents.filter(event => {
        const { status } = calculateUrgency(event.nextOccurrence);
        return status === urgencyFilter;
      });
    }
    
    // Sort by next occurrence date (soonest first)
    newFilteredEvents.sort((a, b) => {
      const dateA = new Date(a.nextOccurrence);
      const dateB = new Date(b.nextOccurrence);
      return dateA - dateB;
    });
    
    setFilteredEvents(newFilteredEvents);
  }, [events, selectedCategory, urgencyFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both events and categories
      const [eventsData, categoriesData] = await Promise.all([
        apiService.getEvents(),
        apiService.getCategories()
      ]);
      
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (eventData) => {
    try {
      const newEvent = await apiService.createEvent(eventData);
      setEvents(prev => [...prev, newEvent]);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to add event:', err);
      alert('Failed to add event. Please try again.');
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await apiService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const updateEvent = async (eventId, updatedData) => {
    try {
      const updatedEvent = await apiService.updateEvent(eventId, updatedData);
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ));
    } catch (err) {
      console.error('Failed to update event:', err);
      alert('Failed to update event. Please try again.');
    }
  };

  const updateEventNotes = async (eventId, notes) => {
    try {
      const updatedEvent = await apiService.updateEventNotes(eventId, notes);
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ));
    } catch (err) {
      console.error('Failed to update event notes:', err);
      alert('Failed to update event notes. Please try again.');
    }
  };

  const handleCategoryCreated = (newCategory) => {
    setCategories(prev => [...prev, newCategory]);
    setShowCategoryManager(false);
  };

  const handleCategoryDeleted = (deletedCategoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== deletedCategoryId));
  };

  if (loading) {
    return (
      <div className="container">
        <header className="header">
          <h1>Stontr</h1>
          <p>Stay On Track with your events and deadlines</p>
        </header>
        <div className="empty-state">
          <h3>Loading...</h3>
          <p>Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <header className="header">
          <h1>Stontr</h1>
          <p>Stay On Track with your events and deadlines</p>
        </header>
        <div className="empty-state">
          <h3>Connection Error</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={loadData}
            style={{ marginTop: '20px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const urgencyLevels = [
    { key: 'all', label: 'All', tooltip: 'Show all events' },
    { key: 'imminent', label: 'Imminent', tooltip: 'Within 7 days' },
    { key: 'approaching', label: 'Approaching', tooltip: '7-30 days away' },
    { key: 'far', label: 'Far Away', tooltip: 'More than 30 days away' },
  ];

  return (
    <div className="container">
      <header className="header">
        <h1>Stontr</h1>
        <p>Stay On Track with your events and deadlines</p>
      </header>

      <div className="filters-toolbar">
        <div className="urgency-filters">
          {urgencyLevels.map(level => (
            <button
              key={level.key}
              className={`urgency-btn ${urgencyFilter === level.key ? 'active' : ''}`}
              onClick={() => setUrgencyFilter(level.key)}
              title={level.tooltip}
            >
              {level.label}
            </button>
          ))}
        </div>
        
        <div className="category-filter-container">
          <select 
            className="category-select" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
              </option>
            ))}
          </select>
          <button
            className="manage-categories-btn"
            onClick={() => setShowCategoryManager(true)}
          >
            Manage
          </button>
        </div>
      </div>

      <div className="events-container">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <h3>No events match your filters</h3>
            <p>Try selecting a different category or urgency level.</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={deleteEvent}
              onUpdate={updateEvent}
              onNotesUpdate={updateEventNotes}
            />
          ))
        )}
      </div>

      <button 
        className="add-event-btn"
        onClick={() => setShowModal(true)}
        aria-label="Add new event"
      >
        +
      </button>

      {showModal && (
        <AddEventModal
          onClose={() => setShowModal(false)}
          onAdd={addEvent}
          categories={categories}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          onClose={() => setShowCategoryManager(false)}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </div>
  );
}

export default App; 