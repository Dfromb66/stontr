# Stontr - Stay On Track

A modern web application to help you stay on track with your upcoming and recurring events. Built with React, Express.js, and SQLite.

![Stontr App](https://img.shields.io/badge/React-18.0.0-blue)
![Express](https://img.shields.io/badge/Express-4.18.0-green)
![SQLite](https://img.shields.io/badge/SQLite-3.0-lightgrey)

## 🎯 Features

### Event Management
- **Create events** with custom titles, categories, and dates
- **Recurring events** support (years, months, days)
- **Progress bars** showing time remaining with urgency indicators
- **Event notes** - add detailed notes to any event
- **Complete events** - mark as done or advance to next occurrence

### Categories & Organization
- **Custom categories** with color coding
- **Category management** - create, view, and delete categories
- **Filter by category** to focus on specific areas of your life

### Smart Filtering
- **Urgency filters**: Imminent (≤7 days), Approaching (7-30 days), Far Away (>30 days)
- **Category filters** to view events by type
- **Combined filtering** for precise event management

### Visual Design
- **Modern UI** with gradient backgrounds and smooth animations
- **Responsive design** that works on desktop and mobile
- **Progress indicators** with color-coded urgency levels
- **Compact card layout** for efficient viewing of many events

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stontr.git
   cd stontr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend server**
   ```bash
   cd server
   npm install
   node index.js
   ```
   The server will start on `http://localhost:5000`

4. **Start the React app** (in a new terminal)
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

## 📖 How to Use

### Adding Events
1. Click the **+** button in the bottom right
2. Fill in the event details:
   - **Title**: What you need to do
   - **Category**: Choose from existing categories or create new ones
   - **Date**: When it's due
   - **Recurring**: Check if this repeats (e.g., yearly birthdays)
3. Click **Add Event**

### Managing Categories
1. Click **Manage** next to the category dropdown
2. **Create new categories** with custom colors
3. **Delete categories** (only if no events are using them)

### Adding Notes to Events
1. Click the **📝** icon next to any event title
2. Write your notes in the popup
3. Click **Save** to store them
4. The icon will be **colored** when notes exist, **greyed out** when empty

### Filtering Events
- Use **urgency filters** to see events by time sensitivity
- Use **category dropdown** to focus on specific areas
- Combine both for precise filtering

### Completing Events
- Click **Complete** for one-time events (removes them)
- Click **Complete & Next** for recurring events (advances to next occurrence)

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **CSS3** - Custom styling with modern features
- **date-fns** - Date manipulation and formatting

### Backend
- **Express.js** - RESTful API server
- **SQLite3** - Lightweight database
- **CORS** - Cross-origin resource sharing

### Database Schema
```sql
-- Categories table
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#4CAF50',
  createdAt TEXT NOT NULL
);

-- Events table
CREATE TABLE events (
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
);
```

## 📁 Project Structure

```
stontr/
├── public/                 # Static files
├── server/                 # Backend API
│   ├── index.js           # Express server
│   └── stontr.db          # SQLite database
├── src/                   # React frontend
│   ├── components/        # React components
│   │   ├── AddEventModal.js
│   │   ├── CategoryManager.js
│   │   ├── EventCard.js
│   │   └── NotesModal.js
│   ├── services/          # API services
│   │   └── api.js
│   ├── utils/             # Utility functions
│   │   └── urgency.js
│   ├── App.js             # Main app component
│   └── index.js           # App entry point
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🔧 API Endpoints

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `PUT /api/events/:id/notes` - Update event notes

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `DELETE /api/categories/:id` - Delete category

## 🎨 Customization

### Adding New Categories
Categories are automatically created when you add events, or you can use the Category Manager to create them in advance.

### Styling
The app uses custom CSS with modern design principles. You can modify `src/index.css` to change colors, spacing, and layout.

### Database
The SQLite database is stored in `server/stontr.db`. You can backup this file or migrate to other databases by modifying the server code.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with React and Express.js
- Icons and emojis for visual elements
- Modern CSS techniques for responsive design

---

**Stontr** - Because staying on track shouldn't be hard! 📅✨ 