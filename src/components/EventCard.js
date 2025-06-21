import React, { useState, useMemo } from 'react';
import { format, parseISO, addYears, addMonths, addDays } from 'date-fns';
import { calculateProgress } from '../utils/urgency';
import NotesModal from './NotesModal';

const EventCard = ({ event, onDelete, onUpdate, onNotesUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: event.title,
    category: event.category,
    nextOccurrence: event.nextOccurrence.split('T')[0], // Ensure correct format for date input
    isRecurring: event.isRecurring,
    recurrenceInterval: event.recurrenceInterval || 1,
    recurrenceUnit: event.recurrenceUnit || 'years'
  });

  const progressData = useMemo(() => calculateProgress(event), [event]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(event.id, editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form to original event state
    setEditForm({
      title: event.title,
      category: event.category,
      nextOccurrence: event.nextOccurrence.split('T')[0],
      isRecurring: event.isRecurring,
      recurrenceInterval: event.recurrenceInterval || 1,
      recurrenceUnit: event.recurrenceUnit || 'years'
    });
    setIsEditing(false);
  };

  const handleComplete = () => {
    if (event.isRecurring) {
      let nextDate = new Date(event.nextOccurrence);
      switch (event.recurrenceUnit) {
        case 'years':
          nextDate = addYears(nextDate, event.recurrenceInterval);
          break;
        case 'months':
          nextDate = addMonths(nextDate, event.recurrenceInterval);
          break;
        case 'days':
          nextDate = addDays(nextDate, event.recurrenceInterval);
          break;
        default:
          nextDate = addYears(nextDate, event.recurrenceInterval);
      }
      
      onUpdate(event.id, {
        ...event, // Pass all event data
        nextOccurrence: nextDate.toISOString().split('T')[0]
      });
    } else {
      onDelete(event.id);
    }
  };

  const handleNotesSave = (notes) => {
    onNotesUpdate(event.id, notes);
  };

  const handleNotesDelete = () => {
    onNotesUpdate(event.id, null);
  };

  const categoryColor = event.categoryColor || '#4CAF50';
  const hasNotes = event.notes && event.notes.trim().length > 0;

  if (isEditing) {
    return (
      <div className="event-card" style={{ borderLeftColor: categoryColor }}>
        {/* Simplified Edit form for brevity - assumes categories are managed elsewhere */}
        <div className="form-group">
          <label>Event Title</label>
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        
        <div className="form-group">
          <label>Next Occurrence</label>
          <input
            type="date"
            value={editForm.nextOccurrence}
            onChange={(e) => setEditForm(prev => ({ ...prev, nextOccurrence: e.target.value }))}
          />
        </div>
        
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="event-card" style={{ borderLeftColor: categoryColor }}>
        <div className="event-header">
          <div className="event-title-container">
            <h3 className="event-title">{event.title}</h3>
            <button 
              className={`notes-icon ${hasNotes ? 'has-notes' : ''}`}
              onClick={() => setIsNotesModalOpen(true)}
              title={hasNotes ? 'Edit notes' : 'Add notes'}
            >
              📝
            </button>
          </div>
          <div className="event-header-right">
            <span 
              className="event-category"
              style={{
                backgroundColor: `${categoryColor}20`,
                color: categoryColor
              }}
            >
              {event.category}
            </span>
            <div className="event-type">
              {event.isRecurring ? 'Recurring' : 'One-time'}
            </div>
          </div>
        </div>
        
        <div className="event-date">
          Next: {format(parseISO(event.nextOccurrence), 'MMMM d, yyyy')}
          {event.isRecurring && (
            <span className="recurrence-info"> (every {event.recurrenceInterval} {event.recurrenceUnit})</span>
          )}
        </div>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className={`progress-fill ${progressData.progressClass}`}
              style={{ width: `${progressData.progressPercent}%` }}
            />
          </div>
          <div className="time-remaining">
            {progressData.timeRemainingText}
          </div>
        </div>
        
        <div className="form-actions">
          <button className="btn btn-secondary btn-edit" onClick={handleEdit}>
            Edit
          </button>
          <button className="btn btn-primary" onClick={handleComplete}>
            {event.isRecurring ? 'Complete & Next' : 'Complete'}
          </button>
          <button className="btn btn-secondary btn-delete" onClick={() => onDelete(event.id)}>
            Delete
          </button>
        </div>
      </div>

      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        notes={event.notes}
        onSave={handleNotesSave}
        onDelete={handleNotesDelete}
      />
    </>
  );
};

export default EventCard; 