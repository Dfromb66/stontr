import React, { useState, useEffect } from 'react';

const AddEventModal = ({ onClose, onAdd, categories }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'social',
    nextOccurrence: '',
    isRecurring: false,
    recurrenceInterval: 1,
    recurrenceUnit: 'years'
  });

  const [errors, setErrors] = useState({});

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, nextOccurrence: today }));
  }, []);

  // Set default category to first available category
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0].name }));
    }
  }, [categories]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }
    
    if (!formData.nextOccurrence) {
      newErrors.nextOccurrence = 'Date is required';
    } else {
      const selectedDate = new Date(formData.nextOccurrence);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.nextOccurrence = 'Date cannot be in the past';
      }
    }
    
    if (formData.isRecurring) {
      if (formData.recurrenceInterval < 1) {
        newErrors.recurrenceInterval = 'Interval must be at least 1';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAdd(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const suggestCategory = (title) => {
    const lowerTitle = title.toLowerCase();
    
    // Check for exact matches first
    for (const category of categories) {
      if (lowerTitle.includes(category.name.toLowerCase())) {
        return category.name;
      }
    }
    
    // Check for keyword matches
    if (lowerTitle.includes('birthday') || lowerTitle.includes('wedding') || 
        lowerTitle.includes('party') || lowerTitle.includes('meeting') ||
        lowerTitle.includes('dinner') || lowerTitle.includes('lunch')) {
      return 'social';
    } else if (lowerTitle.includes('license') || lowerTitle.includes('renewal') ||
               lowerTitle.includes('certification') || lowerTitle.includes('exam') ||
               lowerTitle.includes('deadline') || lowerTitle.includes('report')) {
      return 'professional';
    } else if (lowerTitle.includes('tax') || lowerTitle.includes('payment') ||
               lowerTitle.includes('bill') || lowerTitle.includes('insurance') ||
               lowerTitle.includes('subscription') || lowerTitle.includes('fee')) {
      return 'financial';
    }
    
    // Return first available category as default
    return categories.length > 0 ? categories[0].name : 'social';
  };

  const handleTitleChange = (value) => {
    handleInputChange('title', value);
    
    // Auto-suggest category based on title
    if (value.trim() && categories.length > 0) {
      const suggestedCategory = suggestCategory(value);
      setFormData(prev => ({ ...prev, category: suggestedCategory }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Event</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Driver's License Renewal, Sarah's Birthday"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="nextOccurrence">Date *</label>
            <input
              id="nextOccurrence"
              type="date"
              value={formData.nextOccurrence}
              onChange={(e) => handleInputChange('nextOccurrence', e.target.value)}
              className={errors.nextOccurrence ? 'error' : ''}
            />
            {errors.nextOccurrence && <span className="error-text">{errors.nextOccurrence}</span>}
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
              />
              This is a recurring event
            </label>
          </div>
          
          {formData.isRecurring && (
            <div className="form-group">
              <label>Recurrence</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span>Every</span>
                <input
                  type="number"
                  min="1"
                  value={formData.recurrenceInterval}
                  onChange={(e) => handleInputChange('recurrenceInterval', parseInt(e.target.value) || 1)}
                  style={{ width: '80px' }}
                  className={errors.recurrenceInterval ? 'error' : ''}
                />
                <select
                  value={formData.recurrenceUnit}
                  onChange={(e) => handleInputChange('recurrenceUnit', e.target.value)}
                >
                  <option value="days">Day(s)</option>
                  <option value="months">Month(s)</option>
                  <option value="years">Year(s)</option>
                </select>
              </div>
              {errors.recurrenceInterval && <span className="error-text">{errors.recurrenceInterval}</span>}
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal; 