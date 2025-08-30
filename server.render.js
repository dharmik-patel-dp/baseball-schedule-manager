const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 10000;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression());

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Session configuration for Render
app.use(session({
  secret: process.env.SESSION_SECRET || 'render-production-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Render provides HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
}));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup for Render
const dbPath = path.join(__dirname, 'schedules.db');
const db = new sqlite3.Database(dbPath);

// Admin authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Create default admin user if none exists
function createDefaultAdmin() {
  const defaultUsername = 'admin';
  const defaultPassword = 'admin123'; // Change this in production!
  
  db.get("SELECT id FROM admin_users WHERE username = ?", [defaultUsername], (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err);
      return;
    }
    
    if (!row) {
      const passwordHash = bcrypt.hashSync(defaultPassword, 10);
      db.run("INSERT INTO admin_users (username, password_hash, email, role) VALUES (?, ?, ?, ?)", 
        [defaultUsername, passwordHash, 'admin@baseball.com', 'admin'], (err) => {
        if (err) {
          console.error('Error creating default admin:', err);
        } else {
          console.log('✅ Default admin user created');
          console.log('⚠️  Username: admin, Password: admin123 - CHANGE THESE IN PRODUCTION!');
        }
      });
    } else {
      console.log('✅ Admin user already exists');
    }
  });
}

// Admin authentication routes
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  db.get("SELECT * FROM admin_users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    db.run("UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
    
    // Create session
    req.session.adminId = user.id;
    req.session.adminUsername = user.username;
    req.session.adminRole = user.role;
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

app.get('/api/admin/me', requireAuth, (req, res) => {
  db.get("SELECT id, username, email, role, last_login FROM admin_users WHERE id = ?", 
    [req.session.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ user });
  });
});

// Routes
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-test.html'));
});

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/favicon.ico', (req, res) => {
  res.redirect(301, 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚾</text></svg>');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create tables
db.serialize(() => {
  // Admin users table
  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'admin',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Schedules table
  db.run(`CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    field TEXT,
    age_group TEXT,
    division TEXT,
    umpire TEXT,
    plate_umpire TEXT,
    concession_staff TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Staff directory table
  db.run(`CREATE TABLE IF NOT EXISTS staff_directory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create default admin user
  createDefaultAdmin();
});

// API Routes for schedules
app.get('/api/schedules', (req, res) => {
  const query = 'SELECT * FROM schedules ORDER BY date, time';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/schedules', (req, res) => {
  const { date, time, home_team, away_team, field, age_group, division, umpire, plate_umpire, concession_staff, notes } = req.body;
  
  const query = `INSERT INTO schedules (date, time, home_team, away_team, field, age_group, division, umpire, plate_umpire, concession_staff, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [date, time, home_team, away_team, field, age_group, division, umpire, plate_umpire, concession_staff, notes], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Schedule added successfully' });
  });
});

app.put('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const { date, time, home_team, away_team, field, age_group, division, umpire, plate_umpire, concession_staff, notes } = req.body;
  
  const query = `UPDATE schedules SET 
                 date = ?, time = ?, home_team = ?, away_team = ?, field = ?, 
                 age_group = ?, division = ?, umpire = ?, plate_umpire = ?, concession_staff = ?, notes = ?
                 WHERE id = ?`;

  db.run(query, [date, time, home_team, away_team, field, age_group, division, umpire, plate_umpire, concession_staff, notes, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Schedule updated successfully' });
  });
});

app.delete('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM schedules WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Schedule deleted successfully' });
  });
});

// Staff Directory Routes
app.get('/api/staff', (req, res) => {
  const query = 'SELECT * FROM staff_directory ORDER BY name';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/staff', (req, res) => {
  const { name, email, phone, parent_name, parent_email, parent_phone, role } = req.body;
  
  const query = `INSERT INTO staff_directory (name, email, phone, parent_name, parent_email, parent_phone, role) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [name, email, phone, parent_name, parent_email, parent_phone, role], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Staff member added successfully' });
  });
});

app.put('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, parent_name, parent_email, parent_phone, role } = req.body;
  
  const query = `UPDATE staff_directory SET 
                 name = ?, email = ?, phone = ?, parent_name = ?, parent_email = ?, parent_phone = ?, role = ?
                 WHERE id = ?`;

  db.run(query, [name, email, phone, parent_name, parent_email, parent_phone, role, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Staff member updated successfully' });
  });
});

app.delete('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM staff_directory WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Staff member deleted successfully' });
  });
});

// Bulk delete staff members
app.post('/api/staff/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No valid IDs provided' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM staff_directory WHERE id IN (${placeholders})`;

  db.run(query, ids, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `${this.changes} staff members deleted successfully` });
  });
});

// CSV Upload Routes
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload/schedules', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Process CSV data and insert into database
      let inserted = 0;
      let errors = 0;

      results.forEach((row, index) => {
        const { date, time, home_team, away_team, field, age_group, division, umpire, plate_umpire, concession_staff, notes } = row;
        
        if (date && time && home_team && away_team) {
          const query = `INSERT INTO schedules (date, time, home_team, away_team, field, age_group, division, umpire, plate_umpire, concession_staff, notes) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          
          db.run(query, [date, time, home_team, away_team, field || '', age_group || '', division || '', umpire || '', plate_umpire || '', concession_staff || '', notes || ''], function(err) {
            if (err) {
              errors++;
              console.error(`Error inserting row ${index + 1}:`, err);
            } else {
              inserted++;
            }
          });
        } else {
          errors++;
        }
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      setTimeout(() => {
        res.json({ 
          message: `CSV processed successfully. Inserted: ${inserted}, Errors: ${errors}`,
          inserted,
          errors
        });
      }, 1000);
    });
});

app.post('/api/upload/staff', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      let inserted = 0;
      let errors = 0;

      results.forEach((row, index) => {
        const { name, email, phone, parent_name, parent_email, parent_phone, role } = row;
        
        if (name) {
          const query = `INSERT INTO staff_directory (name, email, phone, parent_name, parent_email, parent_phone, role) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
          
          db.run(query, [name, email || '', phone || '', parent_name || '', parent_email || '', parent_phone || '', role || ''], function(err) {
            if (err) {
              errors++;
              console.error(`Error inserting row ${index + 1}:`, err);
            } else {
              inserted++;
            }
          });
        } else {
          errors++;
        }
      });

      fs.unlinkSync(req.file.path);

      setTimeout(() => {
        res.json({ 
          message: `Staff CSV processed successfully. Inserted: ${inserted}, Errors: ${errors}`,
          inserted,
          errors
        });
      }, 1000);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Baseball Schedule Manager running on Render port ${PORT}`);
  console.log(`🌐 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🏠 Public interface: http://localhost:${PORT}`);
  console.log('✅ Ready for production deployment!');
});
