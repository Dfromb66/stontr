import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const CategoryManager = ({ onClose, onCategoryCreated }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#4CAF50' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await apiService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      const createdCategory = await apiService.createCategory(newCategory);
      setCategories(prev => [...prev, createdCategory]);
      setNewCategory({ name: '', color: '#4CAF50' });
      
      if (onCategoryCreated) {
        onCategoryCreated(createdCategory);
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      alert(err.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    try {
      await apiService.deleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert(err.message || 'Failed to delete category');
    }
  };

  const predefinedColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', 
    '#00BCD4', '#FF5722', '#795548', '#607D8B', '#E91E63'
  ];

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>Manage Categories</h2>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Manage Categories</h2>
        
        {error && (
          <div className="error-message" style={{ color: '#f44336', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Create New Category */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          <h3>Create New Category</h3>
          <div className="form-group">
            <label htmlFor="categoryName">Category Name</label>
            <input
              id="categoryName"
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Health, Education, Travel"
              maxLength="50"
            />
          </div>
          
          <div className="form-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: newCategory.color === color ? '3px solid #333' : '2px solid #ccc',
                    backgroundColor: color,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title={color}
                />
              ))}
            </div>
            <input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
              style={{ marginTop: '10px', width: '100px', height: '40px' }}
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Create Category
            </button>
          </div>
        </form>

        {/* Existing Categories */}
        <div>
          <h3>Existing Categories</h3>
          {categories.length === 0 ? (
            <p>No categories found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {categories.map(category => (
                <div
                  key={category.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: category.color
                      }}
                    />
                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                      {category.name}
                    </span>
                  </div>
                  
                  {category.name !== 'social' && category.name !== 'professional' && category.name !== 'financial' && (
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions" style={{ marginTop: '30px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager; 