const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Category Management
  async getCategories() {
    return this.request('/categories');
  }

  async createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Event Management
  async getEvents(category = 'all') {
    const endpoint = category === 'all' ? '/events' : `/events?category=${category}`;
    return this.request(endpoint);
  }

  // Create a new event
  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Update an existing event
  async updateEvent(id, eventData) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  // Delete an event
  async deleteEvent(id) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Export events as CSV
  async exportEvents() {
    const response = await fetch(`${API_BASE_URL}/events/export`);
    if (!response.ok) {
      throw new Error('Failed to export events.');
    }
    return response.blob();
  }

  // Import events from CSV
  async importEvents(formData) {
    // Note: We are not using the standard `request` method here
    // because it's configured for JSON, not multipart/form-data.
    const url = `${API_BASE_URL}/events/import`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API import failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Update event notes
  async updateEventNotes(id, notes) {
    return this.request(`/events/${id}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  }
}

export default new ApiService(); 