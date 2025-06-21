import React, { useState, useEffect } from 'react';

const NotesModal = ({ isOpen, onClose, notes, onSave, onDelete }) => {
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNoteText(notes || '');
    }
  }, [isOpen, notes]);

  const handleSave = () => {
    onSave(noteText);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete these notes?')) {
      onDelete();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Event Notes</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <textarea
            className="notes-textarea"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your notes here..."
            rows={8}
          />
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {notes && (
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesModal; 