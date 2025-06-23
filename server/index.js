const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const papaparse = require('papaparse');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'stontr.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  // Create categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#4CAF50',
      createdAt TEXT NOT NULL
    )
  `);

  // Create events table with category_id foreign key
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      nextOccurrence TEXT NOT NULL,
      isRecurring BOOLEAN NOT NULL DEFAULT 0,
      recurrenceInterval INTEGER DEFAULT 1,
      recurrenceUnit TEXT DEFAULT 'years',
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // Insert default categories if they don't exist
  const defaultCategories = [
    { name: 'social', color: '#2196F3' },
    { name: 'professional', color: '#FF9800' },
    { name: 'financial', color: '#9C27B0' }
  ];

  defaultCategories.forEach(category => {
    db.run(
      'INSERT OR IGNORE INTO categories (name, color, createdAt) VALUES (?, ?, ?)',
      [category.name, category.color, new Date().toISOString()]
    );
  });
});

// API Routes

// Get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name ASC', (err, rows) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(rows);
  });
});

// Create new category
app.post('/api/categories', (req, res) => {
  const { name, color } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO categories (name, color, createdAt) VALUES (?, ?, ?)',
    [name.trim().toLowerCase(), color || '#4CAF50', now],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Category already exists' });
        }
        console.error('Error creating category:', err);
        return res.status(500).json({ error: 'Failed to create category' });
      }
      
      // Fetch the created category
      db.get('SELECT * FROM categories WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Error fetching created category:', err);
          return res.status(500).json({ error: 'Failed to fetch created category' });
        }
        res.status(201).json(row);
      });
    }
  );
});

// Delete category (only if no events are using it)
app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  
  // Check if category is being used by any events
  db.get('SELECT COUNT(*) as count FROM events WHERE category_id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error checking category usage:', err);
      return res.status(500).json({ error: 'Failed to check category usage' });
    }
    
    if (row.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category that has events. Please move or delete the events first.' 
      });
    }
    
    // Delete the category
    db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting category:', err);
        return res.status(500).json({ error: 'Failed to delete category' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    });
  });
});

// Get all events with category information
app.get('/api/events', (req, res) => {
  const { category } = req.query;
  
  let query = `
    SELECT e.*, c.name as category_name, c.color as category_color 
    FROM events e 
    JOIN categories c ON e.category_id = c.id 
    ORDER BY e.nextOccurrence ASC
  `;
  let params = [];
  
  if (category && category !== 'all') {
    query = `
      SELECT e.*, c.name as category_name, c.color as category_color 
      FROM events e 
      JOIN categories c ON e.category_id = c.id 
      WHERE c.name = ? 
      ORDER BY e.nextOccurrence ASC
    `;
    params = [category];
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
    
    // Convert boolean values and format response
    const events = rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category_name,
      categoryColor: row.category_color,
      nextOccurrence: row.nextOccurrence,
      isRecurring: Boolean(row.isRecurring),
      recurrenceInterval: row.recurrenceInterval,
      recurrenceUnit: row.recurrenceUnit,
      notes: row.notes || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
    
    res.json(events);
  });
});

// Create new event
app.post('/api/events', (req, res) => {
  const {
    title,
    category,
    nextOccurrence,
    isRecurring,
    recurrenceInterval,
    recurrenceUnit
  } = req.body;
  
  const now = new Date().toISOString();
  
  // First, get the category ID
  db.get('SELECT id FROM categories WHERE name = ?', [category], (err, categoryRow) => {
    if (err) {
      console.error('Error finding category:', err);
      return res.status(500).json({ error: 'Failed to find category' });
    }
    
    if (!categoryRow) {
      return res.status(400).json({ error: 'Category not found' });
    }
    
    const query = `
      INSERT INTO events (title, category_id, nextOccurrence, isRecurring, recurrenceInterval, recurrenceUnit, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      title,
      categoryRow.id,
      nextOccurrence,
      isRecurring ? 1 : 0,
      recurrenceInterval || 1,
      recurrenceUnit || 'years',
      now,
      now
    ];
    
    db.run(query, params, function(err) {
      if (err) {
        console.error('Error creating event:', err);
        return res.status(500).json({ error: 'Failed to create event' });
      }
      
      // Fetch the created event with category info
      const eventQuery = `
        SELECT e.*, c.name as category_name, c.color as category_color 
        FROM events e 
        JOIN categories c ON e.category_id = c.id 
        WHERE e.id = ?
      `;
      
      db.get(eventQuery, [this.lastID], (err, row) => {
        if (err) {
          console.error('Error fetching created event:', err);
          return res.status(500).json({ error: 'Failed to fetch created event' });
        }
        
        const event = {
          id: row.id,
          title: row.title,
          category: row.category_name,
          categoryColor: row.category_color,
          nextOccurrence: row.nextOccurrence,
          isRecurring: Boolean(row.isRecurring),
          recurrenceInterval: row.recurrenceInterval,
          recurrenceUnit: row.recurrenceUnit,
          notes: row.notes || null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        };
        
        res.status(201).json(event);
      });
    });
  });
});

// Update event
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    category,
    nextOccurrence,
    isRecurring,
    recurrenceInterval,
    recurrenceUnit,
    notes
  } = req.body;
  
  const now = new Date().toISOString();
  
  // First, get the category ID
  db.get('SELECT id FROM categories WHERE name = ?', [category], (err, categoryRow) => {
    if (err) {
      console.error('Error finding category:', err);
      return res.status(500).json({ error: 'Failed to find category' });
    }
    
    if (!categoryRow) {
      return res.status(400).json({ error: 'Category not found' });
    }
    
    const query = `
      UPDATE events 
      SET title = ?, category_id = ?, nextOccurrence = ?, isRecurring = ?, 
          recurrenceInterval = ?, recurrenceUnit = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `;
    
    const params = [
      title,
      categoryRow.id,
      nextOccurrence,
      isRecurring ? 1 : 0,
      recurrenceInterval || 1,
      recurrenceUnit || 'years',
      notes || null,
      now,
      id
    ];
    
    db.run(query, params, function(err) {
      if (err) {
        console.error('Error updating event:', err);
        return res.status(500).json({ error: 'Failed to update event' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Fetch the updated event with category info
      const eventQuery = `
        SELECT e.*, c.name as category_name, c.color as category_color 
        FROM events e 
        JOIN categories c ON e.category_id = c.id 
        WHERE e.id = ?
      `;
      
      db.get(eventQuery, [id], (err, row) => {
        if (err) {
          console.error('Error fetching updated event:', err);
          return res.status(500).json({ error: 'Failed to fetch updated event' });
        }
        
        const event = {
          id: row.id,
          title: row.title,
          category: row.category_name,
          categoryColor: row.category_color,
          nextOccurrence: row.nextOccurrence,
          isRecurring: Boolean(row.isRecurring),
          recurrenceInterval: row.recurrenceInterval,
          recurrenceUnit: row.recurrenceUnit,
          notes: row.notes || null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        };
        
        res.json(event);
      });
    });
  });
});

// Delete event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting event:', err);
      return res.status(500).json({ error: 'Failed to delete event' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  });
});

// Update event notes
app.put('/api/events/:id/notes', (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  const now = new Date().toISOString();
  
  const query = `
    UPDATE events 
    SET notes = ?, updatedAt = ?
    WHERE id = ?
  `;
  
  const params = [notes || null, now, id];
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Error updating event notes:', err);
      return res.status(500).json({ error: 'Failed to update event notes' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Fetch the updated event with category info
    const eventQuery = `
      SELECT e.*, c.name as category_name, c.color as category_color 
      FROM events e 
      JOIN categories c ON e.category_id = c.id 
      WHERE e.id = ?
    `;
    
    db.get(eventQuery, [id], (err, row) => {
      if (err) {
        console.error('Error fetching updated event:', err);
        return res.status(500).json({ error: 'Failed to fetch updated event' });
      }
      
      const event = {
        id: row.id,
        title: row.title,
        category: row.category_name,
        categoryColor: row.category_color,
        nextOccurrence: row.nextOccurrence,
        isRecurring: Boolean(row.isRecurring),
        recurrenceInterval: row.recurrenceInterval,
        recurrenceUnit: row.recurrenceUnit,
        notes: row.notes || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
      
      res.json(event);
    });
  });
});

// Export events to CSV
app.get('/api/events/export', (req, res) => {
  const query = `
    SELECT 
      e.title, 
      c.name as category, 
      e.nextOccurrence, 
      e.isRecurring, 
      e.recurrenceInterval, 
      e.recurrenceUnit, 
      e.notes
    FROM events e 
    JOIN categories c ON e.category_id = c.id 
    ORDER BY e.nextOccurrence ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching events for export:', err);
      return res.status(500).json({ error: 'Failed to fetch events for export' });
    }
    
    // Convert boolean to 'yes'/'no' for CSV clarity
    const eventsToExport = rows.map(row => ({
      ...row,
      isRecurring: row.isRecurring ? 'yes' : 'no'
    }));

    const csv = papaparse.unparse(eventsToExport);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('stontr_events.csv');
    res.send(csv);
  });
});

// Import events from CSV
app.post('/api/events/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const fileContent = fs.readFileSync(filePath, 'utf8');
  fs.unlinkSync(filePath); // Clean up uploaded file from server

  papaparse.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const eventsToImport = results.data;
      let importedCount = 0;
      let failedCount = 0;

      // Use a transaction to ensure all-or-nothing import
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to start transaction.' });
          }
        });

        const promises = eventsToImport.map(event => {
          return new Promise(async (resolve, reject) => {
            try {
              // Step 1: Find or Create Category
              const categoryName = (event.category || 'general').trim().toLowerCase();
              
              let category = await new Promise((resolveDb, rejectDb) => {
                db.get('SELECT * FROM categories WHERE name = ?', [categoryName], (err, row) => {
                  if (err) return rejectDb(err);
                  resolveDb(row);
                });
              });

              if (!category) {
                category = await new Promise((resolveDb, rejectDb) => {
                  const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                  db.run(
                    'INSERT INTO categories (name, color, createdAt) VALUES (?, ?, ?)',
                    [categoryName, randomColor, new Date().toISOString()],
                    function (err) {
                      if (err) return rejectDb(err);
                      db.get('SELECT * FROM categories WHERE id = ?', this.lastID, (err, row) => {
                        if (err) return rejectDb(err);
                        resolveDb(row);
                      });
                    }
                  );
                });
              }

              // Step 2: Insert Event
              const now = new Date().toISOString();
              const insertQuery = `
                INSERT INTO events (title, category_id, nextOccurrence, isRecurring, recurrenceInterval, recurrenceUnit, notes, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `;
              const params = [
                event.title,
                category.id,
                new Date(event.nextOccurrence).toISOString(),
                (event.isRecurring || '').toLowerCase() === 'yes' ? 1 : 0,
                event.recurrenceInterval || null,
                event.recurrenceUnit || null,
                event.notes || null,
                now,
                now
              ];
              
              await new Promise((resolveDb, rejectDb) => {
                 db.run(insertQuery, params, (err) => {
                     if(err) return rejectDb(err);
                     importedCount++;
                     resolveDb();
                 });
              });
              
              resolve();
            } catch (err) {
              failedCount++;
              console.error('Failed to import row:', event, err);
              resolve(); // Resolve even on error to not break Promise.all
            }
          });
        });

        Promise.all(promises).then(() => {
          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Transaction failed, rolled back.' });
            }
            res.json({ 
              message: `Import complete. ${importedCount} events imported, ${failedCount} events failed.`,
              importedCount,
              failedCount
            });
          });
        });
      });
    },
    error: (error) => {
      console.error('CSV parsing error:', error.message);
      res.status(400).json({ error: 'Failed to parse CSV file.' });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Stontr API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Stontr server running on port ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
}); 