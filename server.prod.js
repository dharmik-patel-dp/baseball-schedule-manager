const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const csv = require('csv-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');

const app = express();

// Production security middleware
app.use(helmet()); // Add security headers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors(config.cors));

// Serve static files
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database(config.database);

// Create tables if they don't exist
db.serialize(() => {
  // Staff directory table
  db.run(`CREATE TABLE IF NOT EXISTS staff_directory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    role TEXT DEFAULT 'Staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Enhanced Schedule table with concession stand staff
  db.run(`CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season TEXT NOT NULL,
    event_type TEXT NOT NULL,
    day TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    am_pm TEXT NOT NULL,
    division TEXT NOT NULL,
    home_team TEXT NOT NULL,
    home_coach TEXT NOT NULL,
    visitor_team TEXT NOT NULL,
    visitor_coach TEXT NOT NULL,
    venue TEXT NOT NULL,
    plate_umpire TEXT NOT NULL,
    base_umpire TEXT NOT NULL,
    concession_stand TEXT NOT NULL,
    concession_staff TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Umpire requests table
  db.run(`CREATE TABLE IF NOT EXISTS umpire_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER,
    umpire_name TEXT NOT NULL,
    request_date TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules (id)
  )`);

  // Insert sample staff data if table is empty
  db.get("SELECT COUNT(*) as count FROM staff_directory", [], (err, row) => {
    if (err) {
      console.error('Error checking staff count:', err);
      return;
    }

    if (row.count === 0) {
      const sampleStaff = [
        ['Andrey LeMay', '', '', '', '', '', 'Staff'],
        ['Arthur DeSouza', '', '', '', '', '', 'Staff'],
        ['Ben Durkin', '', '', '', '', '', 'Staff'],
        ['Brady Foote', '', '', '', '', '', 'Staff'],
        ['Brayden Shea', '', '', '', '', '', 'Staff'],
        ['Connor Stevens', '', '', '', '', '', 'Staff'],
        ['Danny Gallo', '', '', '', '', '', 'Staff'],
        ['Jack Duffy', '', '', '', '', '', 'Staff'],
        ['James Kane', '', '', '', '', '', 'Staff'],
        ['Logan Kelly', '', '', '', '', '', 'Staff'],
        ['Matthew Rurak', '', '', '', '', '', 'Staff'],
        ['Nathan Nelson', '', '', '', '', '', 'Staff'],
        ['Ryan Abrams', '', '', '', '', '', 'Staff'],
        ['Scott Patenaude', '', '', '', '', '', 'Staff'],
        ['Zach Chachus', '', '', '', '', '', 'Staff'],
        ['Dylan LeLacheur', 'dlelacheur16@gmail.com', '978-337-8174', 'Matt LeLacheur', 'mlforlowell@gmail.com', '978-944-9333', 'Staff'],
        ['Emily Lelacheur', '', '', 'Matt LeLacheur', 'mlforlowell@gmail.com', '978-944-9333', 'Staff'],
        ['Kate LeLacheur', '', '978-995-4048', 'Matt LeLacheur', 'mlforlowell@gmail.com', '978-944-9333', 'Staff'],
        ['PATCHED UMPIRE', '', '', '', '', '', 'Umpire']
      ];

      const insertStaff = db.prepare("INSERT INTO staff_directory (name, email, phone, parent_name, parent_email, parent_phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)");

      sampleStaff.forEach(staff => {
        insertStaff.run(staff);
      });

      insertStaff.finalize();
      console.log('Sample staff data inserted');
    }
  });
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(config.uploads)) {
      fs.mkdirSync(config.uploads, { recursive: true });
    }
    cb(null, config.uploads);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// API Routes
app.get('/api/schedules', (req, res) => {
  db.all("SELECT * FROM schedules ORDER BY date, start_time", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/schedules', (req, res) => {
  const { season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff } = req.body;
  
  db.run(`INSERT INTO schedules (season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Schedule created successfully' });
    });
});

app.put('/api/schedules/:id', (req, res) => {
  const { season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff } = req.body;
  
  db.run(`UPDATE schedules SET season=?, event_type=?, day=?, date=?, start_time=?, am_pm=?, division=?, home_team=?, home_coach=?, visitor_team=?, visitor_coach=?, venue=?, plate_umpire=?, base_umpire=?, concession_stand=?, concession_staff=? WHERE id=?`,
    [season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Schedule updated successfully', changes: this.changes });
    });
});

app.delete('/api/schedules/:id', (req, res) => {
  db.run("DELETE FROM schedules WHERE id=?", [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Schedule deleted successfully', changes: this.changes });
  });
});

// Staff API endpoints
app.get('/api/staff', (req, res) => {
  db.all("SELECT * FROM staff_directory ORDER BY name", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/staff-names', (req, res) => {
  db.all("SELECT name FROM staff_directory ORDER BY name", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => row.name));
  });
});

app.post('/api/staff', (req, res) => {
  const { name, email, phone, parent_name, parent_email, parent_phone, role } = req.body;
  
  db.run(`INSERT INTO staff_directory (name, email, phone, parent_name, parent_email, parent_phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone, parent_name, parent_email, parent_phone, role],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Staff member added successfully' });
    });
});

app.put('/api/staff/:id', (req, res) => {
  const { name, email, phone, parent_name, parent_email, parent_phone, role } = req.body;
  
  db.run(`UPDATE staff_directory SET name=?, email=?, phone=?, parent_name=?, parent_email=?, parent_phone=?, role=? WHERE id=?`,
    [name, email, phone, parent_name, parent_email, parent_phone, role, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Staff member updated successfully', changes: this.changes });
    });
});

app.delete('/api/staff/:id', (req, res) => {
  db.run("DELETE FROM staff_directory WHERE id=?", [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Staff member deleted successfully', changes: this.changes });
  });
});

// Umpire requests API
app.get('/api/umpire-requests', (req, res) => {
  db.all("SELECT * FROM umpire_requests ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/umpire-requests', (req, res) => {
  const { schedule_id, umpire_name, request_date } = req.body;
  
  db.run(`INSERT INTO umpire_requests (schedule_id, umpire_name, request_date) VALUES (?, ?, ?)`,
    [schedule_id, umpire_name, request_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Umpire request submitted successfully' });
    });
});

app.put('/api/umpire-requests/:id/status', (req, res) => {
  const { status } = req.body;
  
  db.run("UPDATE umpire_requests SET status=? WHERE id=?", [status, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Status updated successfully', changes: this.changes });
  });
});

// CSV upload endpoint
app.post('/api/upload-csv', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Process CSV data and insert into database
      let successCount = 0;
      let errorCount = 0;

      results.forEach((row) => {
        const { season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff } = row;
        
        db.run(`INSERT INTO schedules (season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff],
          function(err) {
            if (err) {
              errorCount++;
              console.error('Error inserting row:', err);
            } else {
              successCount++;
            }
          });
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({ 
        message: 'CSV processed successfully', 
        successCount, 
        errorCount,
        totalRows: results.length 
      });
    })
    .on('error', (error) => {
      res.status(500).json({ error: 'Error processing CSV file' });
    });
});

// Get filter options
app.get('/api/filters', (req, res) => {
  const filterFields = ['season', 'event_type', 'day', 'division', 'home_team', 'visitor_team', 'venue', 'home_coach', 'visitor_coach', 'plate_umpire', 'base_umpire', 'concession_stand', 'concession_staff'];
  
  const filterOptions = {};
  
  filterFields.forEach(field => {
    db.all(`SELECT DISTINCT ${field} FROM schedules WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY ${field}`, [], (err, rows) => {
      if (err) {
        console.error(`Error getting ${field} options:`, err);
        return;
      }
      filterOptions[field] = rows.map(row => row[field]);
      
      // Check if all fields have been processed
      if (Object.keys(filterOptions).length === filterFields.length) {
        res.json(filterOptions);
      }
    });
  });
});

// Serve the main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Baseball/Softball Schedule Manager running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🌐 Public interface: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.close(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.close(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});
