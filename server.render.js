// Load environment variables
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { emailService } = require('./email-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const dbConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
};

// Create PostgreSQL connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Security middleware with CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for local development (HTTP)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup - PostgreSQL connection pool already created above

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

// Database migration function
function migrateDatabase() {
  console.log('🔧 Checking database schema...');
  
  // Check if concession_staff column exists
  db.all("PRAGMA table_info(schedules)", [], (err, rows) => {
    if (err) {
      console.error('Error checking table schema:', err);
    }

    const hasConcessionStaff = rows.some(row => row.name === 'concession_staff');
    
    if (!hasConcessionStaff) {
      console.log('📝 Adding missing concession_staff column...');
      db.run("ALTER TABLE schedules ADD COLUMN concession_staff TEXT", (err) => {
        if (err) {
          console.error('Error adding concession_staff column:', err);
        } else {
          console.log('✅ Successfully added concession_staff column');
        }
      });
    } else {
      console.log('✅ Database schema is up to date');
    }
  });
}

// Initialize PostgreSQL database
async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'admin',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_directory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        parent_name VARCHAR(100),
        parent_email VARCHAR(100),
        parent_phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'Staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user
    await createDefaultAdmin();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Create additional tables
db.serialize(() => {
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add updated_at column to existing schedules table if it doesn't exist
  db.run(`ALTER TABLE schedules ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('ℹ️ updated_at column already exists or added successfully');
    }
  });

  // Create trigger to automatically update updated_at timestamp
  db.run(`CREATE TRIGGER IF NOT EXISTS update_schedules_timestamp 
          AFTER UPDATE ON schedules 
          BEGIN 
            UPDATE schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
          END`, (err) => {
    if (err) {
      console.log('ℹ️ Trigger already exists or created successfully');
    }
  });

  // Umpire request table
  db.run(`CREATE TABLE IF NOT EXISTS umpire_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    current_plate_umpire TEXT NOT NULL,
    current_base_umpire TEXT NOT NULL,
    requested_plate_umpire TEXT,
    requested_base_umpire TEXT,
    reason TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES schedules (id)
  )`);

  // Concession staff request table
  db.run(`CREATE TABLE IF NOT EXISTS concession_staff_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    current_concession_staff TEXT NOT NULL,
    requested_concession_staff TEXT,
    reason TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES schedules (id)
  )`);

  // Season visibility control table - Admin only
  db.run(`CREATE TABLE IF NOT EXISTS season_visibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season TEXT NOT NULL UNIQUE,
    is_visible BOOLEAN DEFAULT 0,
    published_by TEXT DEFAULT 'Admin',
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Plate Umpires table
  db.run(`CREATE TABLE IF NOT EXISTS plate_umpires (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    availability TEXT DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Base Umpires table
  db.run(`CREATE TABLE IF NOT EXISTS base_umpires (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    availability TEXT DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Concession Staff table
  db.run(`CREATE TABLE IF NOT EXISTS concession_staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    availability TEXT DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Insert sample plate umpires if table is empty
  db.get("SELECT COUNT(*) as count FROM plate_umpires", [], (err, row) => {
    if (err) {
      console.error('Error checking plate umpires count:', err);
      return;
    }
    
    if (row.count === 0) {
      const samplePlateUmpires = [
        ['Dylan LeLacheur', 'dlelacheur16@gmail.com', '978-337-8174', 'Available'],
        ['Arthur DeSouza', '', '', 'Available'],
        ['Connor Stevens', '', '', 'Available'],
        ['James Kane', '', '', 'Available'],
        ['Nathan Nelson', '', '', 'Available'],
        ['Scott Patenaude', '', '', 'Available']
      ];

      const insertPlateUmpire = db.prepare("INSERT INTO plate_umpires (name, email, phone, availability) VALUES (?, ?, ?, ?)");
      
      samplePlateUmpires.forEach(umpire => {
        insertPlateUmpire.run(umpire);
      });
      
      insertPlateUmpire.finalize();
      console.log('Sample plate umpires data inserted');
    }
  });

  // Insert sample base umpires if table is empty
  db.get("SELECT COUNT(*) as count FROM base_umpires", [], (err, row) => {
    if (err) {
      console.error('Error checking base umpires count:', err);
      return;
    }
    
    if (row.count === 0) {
      const sampleBaseUmpires = [
        ['Scott Patenaude', '', '', 'Available'],
        ['Brady Foote', '', '', 'Available'],
        ['Jack Duffy', '', '', 'Available'],
        ['Logan Kelly', '', '', 'Available'],
        ['Ryan Abrams', '', '', 'Available'],
        ['Zach Chachus', '', '', 'Available']
      ];

      const insertBaseUmpire = db.prepare("INSERT INTO base_umpires (name, email, phone, availability) VALUES (?, ?, ?, ?)");
      
      sampleBaseUmpires.forEach(umpire => {
        insertBaseUmpire.run(umpire);
      });
      
      insertBaseUmpire.finalize();
      console.log('Sample base umpires data inserted');
    }
  });

  // Insert sample concession staff if table is empty
  db.get("SELECT COUNT(*) as count FROM concession_staff", [], (err, row) => {
    if (err) {
      console.error('Error checking concession staff count:', err);
      return;
    }
    
    if (row.count === 0) {
      const sampleConcessionStaff = [
        ['Dylan LeLacheur', 'dlelacheur16@gmail.com', '978-337-8174', 'Available'],
        ['Emily Lelacheur', '', '', 'Available'],
        ['Kate LeLacheur', '', '978-995-4048', 'Available'],
        ['Andrey LeMay', '', '', 'Available'],
        ['Ben Durkin', '', '', 'Available'],
        ['Danny Gallo', '', '', 'Available'],
        ['Brayden Shea', '', '', 'Available']
      ];

      const insertConcessionStaff = db.prepare("INSERT INTO concession_staff (name, email, phone, availability) VALUES (?, ?, ?, ?)");
      
      sampleConcessionStaff.forEach(staff => {
        insertConcessionStaff.run(staff);
      });
      
      insertConcessionStaff.finalize();
      console.log('Sample concession staff data inserted');
    }
  });
  
  // Run database migration
  migrateDatabase();
});

// Routes

// Serve admin login page
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Serve admin debug test page
app.get('/admin-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-test.html'));
});

// Serve admin panel (protected)
app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚾</text></svg>');
});

// Serve public interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes

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

// Plate Umpires Routes
app.get('/api/plate-umpires', (req, res) => {
  const query = 'SELECT * FROM plate_umpires WHERE availability = "Available" ORDER BY name';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Base Umpires Routes
app.get('/api/base-umpires', (req, res) => {
  const query = 'SELECT * FROM base_umpires WHERE availability = "Available" ORDER BY name';
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

// Plate Umpires Routes
app.get('/api/plate-umpires', (req, res) => {
  const query = 'SELECT * FROM plate_umpires ORDER BY name';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Concession Staff Routes
app.get('/api/concession-staff', (req, res) => {
  const query = 'SELECT * FROM concession_staff ORDER BY name';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/concession-staff', (req, res) => {
  const { name, email, phone, availability } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const query = `INSERT INTO concession_staff (name, email, phone, availability) 
                 VALUES (?, ?, ?, ?)`;

  db.run(query, [name, email || '', phone || '', availability || 'Available'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Concession staff added successfully' });
  });
});

app.put('/api/concession-staff/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, availability } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const query = `UPDATE concession_staff SET 
                 name = ?, email = ?, phone = ?, availability = ?
                 WHERE id = ?`;

  db.run(query, [name, email || '', phone || '', availability || 'Available', id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Concession staff updated successfully' });
  });
});

app.delete('/api/concession-staff/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM concession_staff WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Concession staff deleted successfully' });
  });
});

// Bulk delete concession staff
app.post('/api/concession-staff/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No valid IDs provided' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM concession_staff WHERE id IN (${placeholders})`;

  db.run(query, ids, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `${this.changes} concession staff members deleted successfully` });
  });
});

app.post('/api/plate-umpires', (req, res) => {
  const { name, email, phone, availability } = req.body;
  
  const query = `INSERT INTO plate_umpires (name, email, phone, availability) VALUES (?, ?, ?, ?)`;

  db.run(query, [name, email || '', phone || '', availability || 'Available'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Plate umpire added successfully' });
  });
});

app.put('/api/plate-umpires/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, availability } = req.body;
  
  const query = `UPDATE plate_umpires SET name = ?, email = ?, phone = ?, availability = ? WHERE id = ?`;

  db.run(query, [name, email || '', phone || '', availability || 'Available', id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Plate umpire updated successfully' });
  });
});

app.delete('/api/plate-umpires/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM plate_umpires WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Plate umpire deleted successfully' });
  });
});

// Bulk delete plate umpires
app.post('/api/plate-umpires/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No valid IDs provided' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM plate_umpires WHERE id IN (${placeholders})`;

  db.run(query, ids, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `${this.changes} plate umpires deleted successfully` });
  });
});

// Base Umpires Routes
app.get('/api/base-umpires', (req, res) => {
  const query = 'SELECT * FROM base_umpires ORDER BY name';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/base-umpires', (req, res) => {
  const { name, email, phone, availability } = req.body;
  
  const query = `INSERT INTO base_umpires (name, email, phone, availability) VALUES (?, ?, ?, ?)`;

  db.run(query, [name, email || '', phone || '', availability || 'Available'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Base umpire added successfully' });
  });
});

app.put('/api/base-umpires/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, availability } = req.body;
  
  const query = `UPDATE base_umpires SET name = ?, email = ?, phone = ?, availability = ? WHERE id = ?`;

  db.run(query, [name, email || '', phone || '', availability || 'Available', id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Base umpire updated successfully' });
  });
});

app.delete('/api/base-umpires/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM base_umpires WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Base umpire deleted successfully' });
  });
});

// Bulk delete base umpires
app.post('/api/base-umpires/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No valid IDs provided' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM base_umpires WHERE id IN (${placeholders})`;

  db.run(query, ids, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `${this.changes} base umpires deleted successfully` });
  });
});

// Get all schedules (only visible seasons for public, all for admin)
app.get('/api/schedules', (req, res) => {
  // Public always sees only visible seasons
  const query = `
    SELECT s.* FROM schedules s
    INNER JOIN season_visibility sv ON s.season = sv.season
    WHERE sv.is_visible = 1
    ORDER BY s.date, start_time
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Admin-specific endpoint to get ALL schedules (including unpublished seasons)
app.get('/api/admin/schedules', (req, res) => {
  // Admin can see all schedules regardless of visibility
  const query = 'SELECT * FROM schedules ORDER BY date, start_time';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new schedule
app.post('/api/schedules', (req, res) => {
  const {
    season, event_type, day, date, start_time, am_pm, division,
    home_team, home_coach, visitor_team, visitor_coach,
    venue, plate_umpire, base_umpire, concession_stand, concession_staff
  } = req.body;

  const query = `INSERT INTO schedules (
    season, event_type, day, date, start_time, am_pm, division,
    home_team, home_coach, visitor_team, visitor_coach,
    venue, plate_umpire, base_umpire, concession_stand, concession_staff
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [
    season, event_type, day, date, start_time, am_pm, division,
    home_team, home_coach, visitor_team, visitor_coach,
    venue, plate_umpire, base_umpire, concession_stand, concession_staff
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Schedule created successfully' });
  });
});

// Update schedule
app.put('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const {
    season, event_type, day, date, start_time, am_pm, division,
    home_team, home_coach, visitor_team, visitor_coach,
    venue, plate_umpire, base_umpire, concession_stand, concession_staff
  } = req.body;

  const query = `UPDATE schedules SET 
    season = ?, event_type = ?, day = ?, date = ?, start_time = ?, am_pm = ?, division = ?,
    home_team = ?, home_coach = ?, visitor_team = ?, visitor_coach = ?,
    venue = ?, plate_umpire = ?, base_umpire = ?, concession_stand = ?, concession_staff = ?
    WHERE id = ?`;

  db.run(query, [
    season, event_type, day, date, start_time, am_pm, division,
    home_team, home_coach, visitor_team, visitor_coach,
    venue, plate_umpire, base_umpire, concession_stand, concession_staff, id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Schedule updated successfully' });
  });
});

// Delete schedule
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

// Bulk delete schedules
app.post('/api/schedules/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No valid IDs provided' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM schedules WHERE id IN (${placeholders})`;

  db.run(query, ids, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `${this.changes} schedules deleted successfully` });
  });
});

// Get umpire requests
app.get('/api/umpire-requests', (req, res) => {
  const query = `
    SELECT ur.*, s.date, s.start_time, s.home_team, s.visitor_team, s.venue
    FROM umpire_requests ur
    JOIN schedules s ON ur.game_id = s.id
    ORDER BY ur.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create umpire request
app.post('/api/umpire-requests', async (req, res) => {
  const {
    game_id, current_plate_umpire, current_base_umpire,
    requested_plate_umpire, requested_base_umpire, reason,
    requester_name, requester_email, requester_phone
  } = req.body;

  // Validate required fields
  if (!game_id || !requester_name || !requester_email) {
    return res.status(400).json({ error: 'Game ID, requester name, and email are required' });
  }

  // Get current game details first
  db.get("SELECT * FROM schedules WHERE id = ?", [game_id], (err, game) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const query = `INSERT INTO umpire_requests (
      game_id, current_plate_umpire, current_base_umpire,
      requested_plate_umpire, requested_base_umpire, reason,
      requester_name, requester_email, requester_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [
      game_id, current_plate_umpire || '', current_base_umpire || '',
      requested_plate_umpire || '', requested_base_umpire || '', reason || '',
      requester_name, requester_email, requester_phone || ''
    ], async function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const requestId = this.lastID;

      try {
        // Send email notification to admin
        const requestData = {
          gameDate: game.date,
          gameTime: `${game.start_time} ${game.am_pm}`,
          homeTeam: game.home_team,
          visitorTeam: game.visitor_team,
          venue: game.venue,
          division: game.division,
          plateUmpireChange: requested_plate_umpire && requested_plate_umpire !== game.plate_umpire,
          baseUmpireChange: requested_base_umpire && requested_base_umpire !== game.base_umpire,
          currentPlateUmpire: game.plate_umpire || 'Not assigned',
          requestedPlateUmpire: requested_plate_umpire || 'No change',
          currentBaseUmpire: game.base_umpire || 'Not assigned',
          requestedBaseUmpire: requested_base_umpire || 'No change',
          requesterName: requester_name,
          requesterEmail: requester_email,
          requesterPhone: requester_phone || 'Not provided',
          reason: reason || 'No reason provided'
        };
        
        const emailResult = await emailService.notifyAdminOfRequest(requestData);
        console.log('📧 Admin notification email result:', emailResult);
        
      } catch (emailError) {
        console.error('❌ Failed to send admin notification email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({ id: requestId, message: 'Request submitted successfully' });
    });
  });
});

// Update umpire request status
app.put('/api/umpire-requests/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  // First, get the umpire request details to know which game and what umpires were requested
  db.get('SELECT * FROM umpire_requests WHERE id = ?', [id], (err, request) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!request) {
      res.status(404).json({ error: 'Umpire request not found' });
      return;
    }

    // Get game details for email notifications
    db.get('SELECT * FROM schedules WHERE id = ?', [request.game_id], (err, game) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Start a transaction to update both the request status and the game schedule
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          res.status(500).json({ error: 'Failed to start transaction' });
          return;
        }

        // Update the umpire request status
        db.run('UPDATE umpire_requests SET status = ? WHERE id = ?', [status, id], function(err) {
          if (err) {
            db.run('ROLLBACK', () => {});
            res.status(500).json({ error: err.message });
            return;
          }

          // If the request is approved, update the game schedule with the new umpire assignments
          if (status === 'approved') {
            const updateQuery = `
              UPDATE schedules 
              SET plate_umpire = ?, base_umpire = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;
            
            const updateValues = [
              request.requested_plate_umpire || request.current_plate_umpire,
              request.requested_base_umpire || request.current_base_umpire,
              request.game_id
            ];

            db.run(updateQuery, updateValues, function(err) {
              if (err) {
                db.run('ROLLBACK', () => {});
                res.status(500).json({ error: 'Failed to update game schedule: ' + err.message });
                return;
              }

              // Commit the transaction
              db.run('COMMIT', async (err) => {
                if (err) {
                  res.status(500).json({ error: 'Failed to commit transaction' });
                  return;
                }

                console.log(`✅ Umpire request ${id} approved and game schedule updated for game ${request.game_id}`);
                
                // Send email notifications
                try {
                  // Notify user of approval
                  const userNotificationData = {
                    gameDate: game.date,
                    gameTime: `${game.start_time} ${game.am_pm}`,
                    homeTeam: game.home_team,
                    visitorTeam: game.visitor_team,
                    venue: game.venue,
                    division: game.division,
                    plateUmpireChange: request.requested_plate_umpire && request.requested_plate_umpire !== game.plate_umpire,
                    baseUmpireChange: request.requested_base_umpire && request.requested_base_umpire !== game.base_umpire,
                    currentPlateUmpire: game.plate_umpire || 'Not assigned',
                    requestedPlateUmpire: request.requested_plate_umpire || 'No change',
                    currentBaseUmpire: game.base_umpire || 'Not assigned',
                    requestedBaseUmpire: request.requested_base_umpire || 'No change',
                    status: 'approved',
                    adminNotes: adminNotes || '',
                    requesterEmail: request.requester_email
                  };
                  
                  const userEmailResult = await emailService.notifyUserOfDecision(userNotificationData);
                  console.log('📧 User approval notification email result:', userEmailResult);
                  
                  // Notify newly assigned umpires
                  const plateUmpireEmail = request.requested_plate_umpire ? await getStaffEmail(request.requested_plate_umpire) : null;
                  const baseUmpireEmail = request.requested_base_umpire ? await getStaffEmail(request.requested_base_umpire) : null;
                  
                  const assignmentData = {
                    gameDate: game.date,
                    gameTime: `${game.start_time} ${game.am_pm}`,
                    homeTeam: game.home_team,
                    visitorTeam: game.visitor_team,
                    venue: game.venue,
                    division: game.division,
                    plateUmpire: request.requested_plate_umpire || request.current_plate_umpire,
                    baseUmpire: request.requested_base_umpire || request.current_base_umpire,
                    plateUmpireEmail: plateUmpireEmail,
                    baseUmpireEmail: baseUmpireEmail,
                    assignedBy: 'Admin',
                    assignmentDate: new Date().toLocaleDateString()
                  };
                  
                  const assignmentEmailResult = await emailService.notifyAssignment(assignmentData);
                  console.log('📧 Assignment notification email result:', assignmentEmailResult);
                  
                } catch (emailError) {
                  console.error('❌ Failed to send email notifications:', emailError);
                  // Don't fail the request if email fails
                }
                
                res.json({ 
                  message: 'Request approved and game schedule updated successfully',
                  gameId: request.game_id,
                  updatedUmpires: {
                    plate_umpire: request.requested_plate_umpire || request.current_plate_umpire,
                    base_umpire: request.requested_base_umpire || request.current_base_umpire
                  }
                });
              });
            });
          } else {
            // If not approved, just commit the status update
            db.run('COMMIT', async (err) => {
              if (err) {
                res.status(500).json({ error: 'Failed to commit transaction' });
                return;
              }

              console.log(`✅ Umpire request ${id} status updated to: ${status}`);
              
              // Send rejection notification to user
              try {
                const userNotificationData = {
                  gameDate: game.date,
                  gameTime: `${game.start_time} ${game.am_pm}`,
                  homeTeam: game.home_team,
                  visitorTeam: game.visitor_team,
                  venue: game.venue,
                  division: game.division,
                  plateUmpireChange: request.requested_plate_umpire && request.requested_plate_umpire !== game.plate_umpire,
                  baseUmpireChange: request.requested_base_umpire && request.requested_base_umpire !== game.base_umpire,
                  currentPlateUmpire: game.plate_umpire || 'Not assigned',
                  requestedPlateUmpire: request.requested_plate_umpire || 'No change',
                  currentBaseUmpire: game.base_umpire || 'Not assigned',
                  requestedBaseUmpire: request.requested_base_umpire || 'No change',
                  status: 'rejected',
                  adminNotes: adminNotes || 'No reason provided',
                  requesterEmail: request.requester_email
                };
                
                const userEmailResult = await emailService.notifyUserOfDecision(userNotificationData);
                console.log('📧 User rejection notification email result:', userEmailResult);
                
              } catch (emailError) {
                console.error('❌ Failed to send rejection notification email:', emailError);
                // Don't fail the request if email fails
              }
              
              res.json({ 
                message: 'Request status updated successfully',
                status: status
              });
            });
          }
        });
      });
    });
  });
});

// Helper function to get staff email
function getStaffEmail(staffName) {
  if (!staffName) return null;
  
  // Try to find email in concession staff table first
  return new Promise((resolve) => {
    db.get('SELECT email FROM concession_staff WHERE name = ?', [staffName], (err, row) => {
      if (err || !row || !row.email) {
        // If not found in concession staff, try plate umpires
        db.get('SELECT email FROM plate_umpires WHERE name = ?', [staffName], (err2, row2) => {
          if (err2 || !row2 || !row2.email) {
            // If not found in plate umpires, try base umpires
            db.get('SELECT email FROM base_umpires WHERE name = ?', [staffName], (err3, row3) => {
              if (err3 || !row3 || !row3.email) {
                // If not found anywhere, return null
                resolve(null);
              } else {
                resolve(row3.email);
              }
            });
          } else {
            resolve(row2.email);
          }
        });
      } else {
        resolve(row.email);
      }
    });
  });
}

// Concession Staff Request Routes
app.post('/api/concession-staff-requests', async (req, res) => {
  const {
    game_id, current_concession_staff, requested_concession_staff, reason,
    requester_name, requester_email, requester_phone
  } = req.body;

  // Validate required fields
  if (!game_id || !requester_name || !requester_email) {
    return res.status(400).json({ error: 'Game ID, requester name, and email are required' });
  }

  // Get current game details first
  db.get("SELECT * FROM schedules WHERE id = ?", [game_id], (err, game) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const query = `INSERT INTO concession_staff_requests (
      game_id, current_concession_staff, requested_concession_staff, reason,
      requester_name, requester_email, requester_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [
      game_id, current_concession_staff || '', requested_concession_staff || '', reason || '',
      requester_name, requester_email, requester_phone || ''
    ], async function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const requestId = this.lastID;

      try {
        // Send email notification to admin
        const requestData = {
          gameDate: game.date,
          gameTime: `${game.start_time} ${game.am_pm}`,
          homeTeam: game.home_team,
          visitorTeam: game.visitor_team,
          venue: game.venue,
          division: game.division,
          concessionStaffChange: requested_concession_staff && requested_concession_staff !== game.concession_staff,
          currentConcessionStaff: game.concession_staff || 'Not assigned',
          requestedConcessionStaff: requested_concession_staff || 'No change',
          requesterName: requester_name,
          requesterEmail: requester_email,
          requesterPhone: requester_phone || 'Not provided',
          reason: reason || 'No reason provided'
        };
        
        const emailResult = await emailService.notifyAdminOfRequest(requestData);
        console.log('📧 Admin concession staff notification email result:', emailResult);
        
      } catch (emailError) {
        console.error('❌ Failed to send admin notification email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({ id: requestId, message: 'Request submitted successfully' });
    });
  });
});

app.get('/api/concession-staff-requests', (req, res) => {
  const query = `
    SELECT csr.*, s.date, s.start_time, s.home_team, s.visitor_team, s.venue
    FROM concession_staff_requests csr
    JOIN schedules s ON csr.game_id = s.id
    ORDER BY csr.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.put('/api/concession-staff-requests/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // First, get the concession staff request details to know which game and what staff was requested
  db.get('SELECT * FROM concession_staff_requests WHERE id = ?', [id], (err, request) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!request) {
      res.status(404).json({ error: 'Concession staff request not found' });
      return;
    }

    // Start a transaction to update both the request status and the game schedule
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to start transaction' });
        return;
      }

      // Update the concession staff request status
      db.run('UPDATE concession_staff_requests SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
          db.run('ROLLBACK', () => {});
          res.status(500).json({ error: err.message });
          return;
        }

        // If the request is approved, update the game schedule with the new concession staff assignment
        if (status === 'approved') {
          const updateQuery = `
            UPDATE schedules 
            SET concession_staff = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          
          const updateValues = [
            request.requested_concession_staff || request.current_concession_staff,
            request.game_id
          ];

          db.run(updateQuery, updateValues, function(err) {
            if (err) {
              db.run('ROLLBACK', () => {});
              res.status(500).json({ error: 'Failed to update game schedule: ' + err.message });
              return;
            }

            // Commit the transaction
            db.run('COMMIT', async (err) => {
              if (err) {
                res.status(500).json({ error: 'Failed to commit transaction' });
                return;
              }

              console.log(`✅ Concession staff request ${id} approved and game schedule updated for game ${request.game_id}`);
              
              // Send email notifications
              try {
                // Get game details for email notifications
                db.get('SELECT * FROM schedules WHERE id = ?', [request.game_id], async (err, game) => {
                  if (!err && game) {
                    // Notify user of approval
                    const userNotificationData = {
                      gameDate: game.date,
                      gameTime: `${game.start_time} ${game.am_pm}`,
                      homeTeam: game.home_team,
                      visitorTeam: game.visitor_team,
                      venue: game.venue,
                      division: game.division,
                      concessionStaffChange: request.requested_concession_staff && request.requested_concession_staff !== game.concession_staff,
                      currentConcessionStaff: game.concession_staff || 'Not assigned',
                      requestedConcessionStaff: request.requested_concession_staff || 'No change',
                      status: 'approved',
                      adminNotes: '',
                      requesterEmail: request.requester_email
                    };
                    
                    const userEmailResult = await emailService.notifyUserOfDecision(userNotificationData);
                    console.log('📧 User concession staff approval notification email result:', userEmailResult);
                    
                    // Notify newly assigned concession staff
                    const concessionStaffEmail = request.requested_concession_staff ? await getStaffEmail(request.requested_concession_staff) : null;
                    
                    const assignmentData = {
                      gameDate: game.date,
                      gameTime: `${game.start_time} ${game.am_pm}`,
                      homeTeam: game.home_team,
                      visitorTeam: game.visitor_team,
                      venue: game.venue,
                      division: game.division,
                      concessionStaff: request.requested_concession_staff || request.current_concession_staff,
                      concessionStaffEmail: concessionStaffEmail,
                      assignedBy: 'Admin',
                      assignmentDate: new Date().toLocaleDateString()
                    };
                    
                    const assignmentEmailResult = await emailService.notifyAssignment(assignmentData);
                    console.log('📧 Concession staff assignment notification email result:', assignmentEmailResult);
                  }
                });
                
              } catch (emailError) {
                console.error('❌ Failed to send email notifications:', emailError);
                // Don't fail the request if email fails
              }
              
              res.json({ 
                message: 'Request approved and game schedule updated successfully',
                gameId: request.game_id,
                updatedConcessionStaff: request.requested_concession_staff || request.current_concession_staff
              });
            });
          });
        } else {
          // If not approved, just commit the status update
          db.run('COMMIT', async (err) => {
            if (err) {
              res.status(500).json({ error: 'Failed to commit transaction' });
              return;
            }

            console.log(`✅ Concession staff request ${id} status updated to: ${status}`);
            
            // Send rejection notification to user
            try {
              // Get game details for email notifications
              db.get('SELECT * FROM schedules WHERE id = ?', [request.game_id], async (err, game) => {
                if (!err && game) {
                  const userNotificationData = {
                    gameDate: game.date,
                    gameTime: `${game.start_time} ${game.am_pm}`,
                    homeTeam: game.home_team,
                    visitorTeam: game.visitor_team,
                    venue: game.venue,
                    division: game.division,
                    concessionStaffChange: request.requested_concession_staff && request.requested_concession_staff !== game.concession_staff,
                    currentConcessionStaff: game.concession_staff || 'Not assigned',
                    requestedConcessionStaff: request.requested_concession_staff || 'No change',
                    status: 'rejected',
                    adminNotes: 'No reason provided',
                    requesterEmail: request.requester_email
                  };
                  
                  const userEmailResult = await emailService.notifyUserOfDecision(userNotificationData);
                  console.log('📧 User concession staff rejection notification email result:', userEmailResult);
                }
              });
              
            } catch (emailError) {
              console.error('❌ Failed to send rejection notification email:', emailError);
              // Don't fail the request if email fails
            }
            
            res.json({ 
              message: 'Request status updated successfully',
              status: status
            });
          });
        }
      });
    });
  });
});

// CSV upload endpoint
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload-csv', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const rowErrors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Debug: Log the raw data first
      console.log('📊 Raw CSV row data:', data);
      
      // Check if data has any non-empty values
      const hasData = Object.values(data).some(val => val && String(val).trim() !== '');
      if (!hasData) {
        console.log('⚠️ Skipping empty row');
        return;
      }
      
      // Normalize keys by trimming and lowering
      const normalized = {};
      Object.keys(data || {}).forEach(k => {
        if (!k) return;
        const key = String(k).trim();
        normalized[key] = typeof data[k] === 'string' ? data[k].trim() : data[k];
      });
      console.log('📊 Normalized CSV row data:', normalized);
      results.push(normalized);
    })
    .on('error', (error) => {
      console.error('❌ CSV parsing error:', error);
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
      return res.status(400).json({
        message: 'CSV parsing failed',
        committed: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        rowErrors: [{ row: 0, errors: [error.message] }]
      });
    })
    .on('end', () => {
      console.log(`📊 Processing ${results.length} CSV rows...`);
      
      if (results.length === 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'CSV file is empty or contains no valid data',
          committed: false,
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          rowErrors: []
        });
      }

      // Log the first row to debug column structure
      console.log('🔍 First row columns:', Object.keys(results[0]));
      console.log('🔍 First row values:', Object.values(results[0]));

      // Check CSV format - required columns
      const requiredColumns = ['season', 'event_type', 'day', 'date', 'division', 'home_team', 'visitor_team', 'venue'];
      const firstRow = results[0];
      const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
      
      if (missingColumns.length > 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'CSV format does not match expected structure',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: results.length,
          rowErrors: [{
            row: 0,
            errors: [`Missing required columns: ${missingColumns.join(', ')}`]
          }],
          formatError: true,
          expectedColumns: requiredColumns,
          receivedColumns: Object.keys(firstRow)
        });
      }

      // Basic validation helpers
      function isEmpty(value) {
        return value === undefined || value === null || String(value).trim() === '';
      }

      function validateRow(row, index) {
        const errors = [];
        // Required fields
        requiredColumns.forEach(field => {
          if (isEmpty(row[field])) {
            errors.push(`${field} is required`);
          }
        });

        // Optional fields validation (only validate if provided)
        if (!isEmpty(row.plate_umpire)) {
          // plate_umpire is optional, but if provided, it should be valid
        }
        
        if (!isEmpty(row.base_umpire)) {
          // base_umpire is optional, but if provided, it should be valid
        }
        
        if (!isEmpty(row.concession_stand)) {
          // concession_stand is optional, but if provided, it should be valid
        }
        
        if (!isEmpty(row.concession_staff)) {
          // concession_staff is optional, but if provided, it should be valid
        }

        // event_type suggested values
        if (!isEmpty(row.event_type)) {
          const ev = String(row.event_type).toLowerCase();
          if (ev !== 'baseball' && ev !== 'softball') {
            errors.push('event_type should be Baseball or Softball');
          }
        }

        // date should be parseable (YYYY-MM-DD preferred)
        if (!isEmpty(row.date)) {
          const d = new Date(row.date);
          if (isNaN(d.getTime())) {
            errors.push('date is invalid (use YYYY-MM-DD)');
          }
        }

        // If start_time provided, am_pm should be provided too
        if (!isEmpty(row.start_time) && isEmpty(row.am_pm)) {
          errors.push('am_pm is required when start_time is provided');
        }

        if (errors.length > 0) {
          rowErrors.push({ row: index + 1, errors });
          return false;
        }
        return true;
      }

      // Validate all rows first
      results.forEach((row, idx) => validateRow(row, idx));

      if (rowErrors.length > 0) {
        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'CSV failed validation',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: rowErrors.length,
          rowErrors
        });
      }

      // Process CSV data and insert into database
      let successCount = 0;
      let errorCount = 0;
      let processedCount = 0;

      results.forEach((row, index) => {
        const query = `INSERT INTO schedules (
          season, event_type, day, date, start_time, am_pm, division,
          home_team, home_coach, visitor_team, visitor_coach,
          venue, plate_umpire, base_umpire, concession_stand, concession_staff
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(query, [
          row.season, row.event_type, row.day, row.date, row.start_time, row.am_pm, row.division,
          row.home_team, row.home_coach, row.visitor_team, row.visitor_coach,
          row.venue, row.plate_umpire, row.base_umpire, row.concession_stand, row.concession_staff || ''
        ], function(err) {
          processedCount++;
          
          if (err) {
            console.error(`❌ Error inserting row ${index + 1}:`, err);
            errorCount++;
            rowErrors.push({ row: index + 1, errors: [err.message] });
          } else {
            console.log(`✅ Row ${index + 1} inserted successfully, ID: ${this.lastID}`);
            successCount++;
          }

          if (processedCount === results.length) {
            if (errorCount > 0) {
              // Clean up uploaded file
              fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
              });
              res.status(400).json({
                message: 'CSV processing failed',
                committed: false,
                totalRows: results.length,
                successCount,
                errorCount,
                rowErrors
              });
            } else {
              // Clean up uploaded file
              fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
              });
              console.log(`✅ CSV processed successfully: ${successCount} rows inserted`);
              res.json({
                message: 'CSV processed successfully',
                committed: true,
                totalRows: results.length,
                successCount,
                errorCount,
                rowErrors: []
              });
            }
          }
        });
      });
    });
});

// Staff Directory CSV upload endpoint
app.post('/api/upload-staff-csv', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const rowErrors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Normalize keys by trimming and lowering
      const normalized = {};
      Object.keys(data || {}).forEach(k => {
        if (!k) return;
        const key = String(k).trim();
        normalized[key] = typeof data[k] === 'string' ? data[k].trim() : data[k];
      });
      console.log('📊 Staff CSV row data:', normalized);
      results.push(normalized);
    })
    .on('error', (error) => {
      console.error('❌ CSV parsing error:', error);
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
      return res.status(400).json({
        message: 'Staff CSV parsing failed',
        committed: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        rowErrors: [{ row: 0, errors: [error.message] }]
      });
    })
    .on('end', () => {
      console.log(`📊 Processing ${results.length} staff CSV rows...`);
      
      if (results.length === 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Staff CSV file is empty or contains no valid data',
          committed: false,
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          rowErrors: []
        });
      }

      // Check CSV format - required columns
      const requiredColumns = ['name'];
      const firstRow = results[0];
      const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
      
      if (missingColumns.length > 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Staff CSV format does not match expected structure',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: rowErrors.length,
          rowErrors: [{
            row: 0,
            errors: [`Missing required columns: ${missingColumns.join(', ')}`]
          }],
          formatError: true,
          expectedColumns: requiredColumns,
          receivedColumns: Object.keys(firstRow)
        });
      }

      // Basic validation helpers
      function isEmpty(value) {
        return value === undefined || value === null || String(value).trim() === '';
      }

      function validateStaffRow(row, index) {
        const errors = [];
        // Required fields
        if (isEmpty(row.name)) {
          errors.push('name is required');
        }
        
        // Optional fields validation
        if (!isEmpty(row.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push('email format is invalid');
        }
        
        if (!isEmpty(row.phone) && !/^[\d\-\+\(\)\s]+$/.test(row.phone)) {
          errors.push('phone format is invalid');
        }

        if (errors.length > 0) {
          rowErrors.push({ row: index + 1, errors });
          return false;
        }
        return true;
      }

      // Validate all rows first
      results.forEach((row, idx) => validateStaffRow(row, idx));

      if (rowErrors.length > 0) {
        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Staff CSV failed validation',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: rowErrors.length,
          rowErrors
        });
      }

      // Start transaction
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
          });
          return res.status(500).json({
            message: 'Database transaction failed',
            committed: false,
            totalRows: results.length,
            successCount: 0,
            errorCount: results.length,
            rowErrors: [{ row: 0, errors: [err.message] }]
          });
        }

        let successCount = 0;
        let errorCount = 0;
        let processedCount = 0;

        results.forEach((row, index) => {
          const query = `
            INSERT INTO staff_directory (
              name, email, phone, parent_name, parent_email, parent_phone, role
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          const values = [
            row.name,
            row.email || '',
            row.phone || '',
            row.parent_name || '',
            row.parent_email || '',
            row.parent_phone || '',
            row.role || 'Staff'
          ];

          db.run(query, values, function(err) {
            processedCount++;
            
            if (err) {
              console.error(`❌ Error inserting staff row ${index + 1}:`, err);
              errorCount++;
              rowErrors.push({ row: index + 1, errors: [err.message] });
            } else {
              console.log(`✅ Staff row ${index + 1} inserted successfully, ID: ${this.lastID}`);
              successCount++;
            }

            if (processedCount === results.length) {
              if (errorCount > 0) {
                // Rollback transaction if there were errors
                db.run('ROLLBACK', (rollbackErr) => {
                  if (rollbackErr) console.error('Error rolling back transaction:', rollbackErr);
                  
                  // Clean up uploaded file
                  fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                  });

                  res.status(400).json({
                    message: 'Staff CSV processing failed',
                    committed: false,
                    totalRows: results.length,
                    successCount,
                    errorCount,
                    rowErrors
                  });
                });
              } else {
                // Commit transaction if all successful
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) console.error('Error committing transaction:', commitErr);
                  
                  // Clean up uploaded file
                  fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                  });

                  console.log(`✅ Staff CSV processed successfully: ${successCount} rows inserted`);
                  res.json({
                    message: 'Staff CSV processed successfully',
                    committed: true,
                    totalRows: results.length,
                    successCount,
                    errorCount,
                    rowErrors: []
                  });
                });
              }
            }
          });
        });
      });
    });
});

// Plate Umpires CSV upload endpoint
app.post('/api/upload-plate-umpires-csv', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const rowErrors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Normalize keys by trimming and lowering
      const normalized = {};
      Object.keys(data || {}).forEach(k => {
        if (!k) return;
        const key = String(k).trim();
        normalized[key] = typeof data[k] === 'string' ? data[k].trim() : data[k];
      });
      console.log('📊 Plate Umpires CSV row data:', normalized);
      results.push(normalized);
    })
    .on('error', (error) => {
      console.error('❌ CSV parsing error:', error);
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
      return res.status(400).json({
        message: 'Plate Umpires CSV parsing failed',
        committed: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        rowErrors: [{ row: 0, errors: [error.message] }]
      });
    })
    .on('end', () => {
      console.log(`📊 Processing ${results.length} plate umpires CSV rows...`);
      
      if (results.length === 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Plate Umpires CSV file is empty or contains no valid data',
          committed: false,
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          rowErrors: []
        });
      }

      // Check CSV format - required columns
      const requiredColumns = ['name'];
      const firstRow = results[0];
      const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
      
      if (missingColumns.length > 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Plate Umpires CSV format does not match expected structure',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: rowErrors.length,
          rowErrors: [{
            row: 0,
            errors: [`Missing required columns: ${missingColumns.join(', ')}`]
          }],
          formatError: true,
          expectedColumns: requiredColumns,
          receivedColumns: Object.keys(firstRow)
        });
      }

      // Basic validation helpers
      function isEmpty(value) {
        return value === undefined || value === null || String(value).trim() === '';
      }

      function validatePlateUmpireRow(row, index) {
        const errors = [];
        // Required fields
        if (isEmpty(row.name)) {
          errors.push('name is required');
        }
        
        // Optional fields validation
        if (!isEmpty(row.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push('email format is invalid');
        }
        
        if (!isEmpty(row.phone) && !/^[\d\-\+\(\)\s]+$/.test(row.phone)) {
          errors.push('phone format is invalid');
        }

        if (errors.length > 0) {
          rowErrors.push({ row: index + 1, errors });
          return false;
        }
        return true;
      }

      // Validate all rows first
      results.forEach((row, idx) => validatePlateUmpireRow(row, idx));

      if (rowErrors.length > 0) {
        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Plate Umpires CSV failed validation',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: rowErrors.length,
          rowErrors
        });
      }

      // Start transaction
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
          });
          return res.status(500).json({
            message: 'Database transaction failed',
            committed: false,
            totalRows: results.length,
            successCount: 0,
            errorCount: results.length,
            rowErrors: [{ row: 0, errors: [err.message] }]
          });
        }

        let successCount = 0;
        let errorCount = 0;
        let processedCount = 0;

        results.forEach((row, index) => {
          const query = `
            INSERT INTO plate_umpires (
              name, email, phone, availability
            ) VALUES (?, ?, ?, ?)
          `;
          
          const values = [
            row.name,
            row.email || '',
            row.phone || '',
            'Available' // Default availability
          ];

          db.run(query, values, function(err) {
            processedCount++;
            
            if (err) {
              console.error(`❌ Error inserting plate umpire row ${index + 1}:`, err);
              errorCount++;
              rowErrors.push({ row: index + 1, errors: [err.message] });
            } else {
              console.log(`✅ Plate umpire row ${index + 1} inserted successfully, ID: ${this.lastID}`);
              successCount++;
            }

            if (processedCount === results.length) {
              if (errorCount > 0) {
                // Rollback transaction if there were errors
                db.run('ROLLBACK', (rollbackErr) => {
                  if (rollbackErr) console.error('Error rolling back transaction:', rollbackErr);
                  
                  // Clean up uploaded file
                  fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                  });

                  res.status(400).json({
                    message: 'Plate Umpires CSV processing failed',
                    committed: false,
                    totalRows: results.length,
                    successCount,
                    errorCount,
                    rowErrors
                  });
                });
              } else {
                // Commit transaction if all successful
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) console.error('Error committing transaction:', commitErr);
                  
                  // Clean up uploaded file
                  fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                  });

                  console.log(`✅ Plate Umpires CSV processed successfully: ${successCount} rows inserted`);
                  res.json({
                    message: 'Plate Umpires CSV processed successfully',
                    committed: true,
                    totalRows: results.length,
                    successCount,
                    errorCount,
                    rowErrors: []
                  });
                });
              }
            }
          });
        });
      });
    });
});

// Base Umpires CSV upload endpoint
app.post('/api/upload-base-umpires-csv', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const rowErrors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Normalize keys by trimming and lowering
      const normalized = {};
      Object.keys(data || {}).forEach(k => {
        if (!k) return;
        const key = String(k).trim();
        normalized[key] = typeof data[k] === 'string' ? data[k].trim() : data[k];
      });
      console.log('📊 Base Umpires CSV row data:', normalized);
      results.push(normalized);
    })
    .on('error', (error) => {
      console.error('❌ CSV parsing error:', error);
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
      return res.status(400).json({
        message: 'Base Umpires CSV parsing failed',
        committed: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        rowErrors: [{ row: 0, errors: [error.message] }]
      });
    })
    .on('end', () => {
      console.log(`📊 Processing ${results.length} base umpires CSV rows...`);
      
      if (results.length === 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Base Umpires CSV file is empty or contains no valid data',
          committed: false,
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          rowErrors: []
        });
      }

      // Check CSV format - required columns
      const requiredColumns = ['name'];
      const firstRow = results[0];
      const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
      
      if (missingColumns.length > 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Base Umpires CSV format does not match expected structure',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: rowErrors.length,
          rowErrors: [{
            row: 0,
            errors: [`Missing required columns: ${missingColumns.join(', ')}`]
          }],
          formatError: true,
          expectedColumns: requiredColumns,
          receivedColumns: Object.keys(firstRow)
        });
      }

      // Basic validation helpers
      function isEmpty(value) {
        return value === undefined || value === null || String(value).trim() === '';
      }

      function validateBaseUmpireRow(row, index) {
        const errors = [];
        // Required fields
        if (isEmpty(row.name)) {
          errors.push('name is required');
        }
        
        // Optional fields validation
        if (!isEmpty(row.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push('email format is invalid');
        }
        
        if (!isEmpty(row.phone) && !/^[\d\-\+\(\)\s]+$/.test(row.phone)) {
          errors.push('phone format is invalid');
        }

        if (errors.length > 0) {
          rowErrors.push({ row: index + 1, errors });
          return false;
        }
        return true;
      }

      // Validate all rows first
      results.forEach((row, idx) => validateBaseUmpireRow(row, idx));

      if (rowErrors.length > 0) {
        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Base Umpires CSV failed validation',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: rowErrors.length,
          rowErrors
        });
      }

      // Start transaction
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
          });
          return res.status(500).json({
            message: 'Database transaction failed',
            committed: false,
            totalRows: results.length,
            successCount: 0,
            errorCount: results.length,
            rowErrors: [{ row: 0, errors: [err.message] }]
          });
        }

        let successCount = 0;
        let errorCount = 0;
        let processedCount = 0;

        results.forEach((row, index) => {
          const query = `
            INSERT INTO base_umpires (
              name, email, phone, availability
            ) VALUES (?, ?, ?, ?)
          `;
          
          const values = [
            row.name,
            row.email || '',
            row.phone || '',
            'Available' // Default availability
          ];

          db.run(query, values, function(err) {
            processedCount++;
            
            if (err) {
              console.error(`❌ Error inserting base umpire row ${index + 1}:`, err);
              errorCount++;
              rowErrors.push({ row: index + 1, errors: [err.message] });
            } else {
              console.log(`✅ Base umpire row ${index + 1} inserted successfully, ID: ${this.lastID}`);
              successCount++;
            }

            if (processedCount === results.length) {
              if (errorCount > 0) {
                // Rollback transaction if there were errors
                db.run('ROLLBACK', (rollbackErr) => {
                  if (rollbackErr) console.error('Error rolling back transaction:', rollbackErr);
                  
                  // Clean up uploaded file
                  fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                  });

                  res.status(400).json({
                    message: 'Base Umpires CSV processing failed',
                    committed: false,
                    totalRows: results.length,
                    successCount,
                    errorCount,
                    rowErrors
                  });
                });
              } else {
                // Commit transaction if all successful
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) console.error('Error committing transaction:', commitErr);
                  
                  // Clean up uploaded file
                  fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                  });

                  console.log(`✅ Base Umpires CSV processed successfully: ${successCount} rows inserted`);
                  res.json({
                    message: 'Base Umpires CSV processed successfully',
                    committed: true,
                    totalRows: results.length,
                    successCount,
                    errorCount,
                    rowErrors: []
                  });
                });
              }
            }
          });
        });
      });
    });
});

// Concession Staff CSV upload endpoint
app.post('/api/upload-concession-staff-csv', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const rowErrors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Normalize keys by trimming and lowering
      const normalized = {};
      Object.keys(data || {}).forEach(k => {
        if (!k) return;
        const key = String(k).trim();
        normalized[key] = typeof data[k] === 'string' ? data[k].trim() : data[k];
      });
      console.log('📊 Concession Staff CSV row data:', normalized);
      results.push(normalized);
    })
    .on('error', (error) => {
      console.error('❌ CSV parsing error:', error);
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
      return res.status(400).json({
        message: 'Concession Staff CSV parsing failed',
        committed: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        rowErrors: [{ row: 0, errors: [error.message] }]
      });
    })
    .on('end', () => {
      console.log(`📊 Processing ${results.length} concession staff CSV rows...`);
      
      if (results.length === 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Concession Staff CSV file is empty or contains no valid data',
          committed: false,
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          rowErrors: []
        });
      }

      // Check CSV format - required columns
      const requiredColumns = ['name'];
      const firstRow = results[0];
      const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
      
      if (missingColumns.length > 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Concession Staff CSV format does not match expected structure',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: rowErrors.length,
          rowErrors: [{
            row: 0,
            errors: [`Missing required columns: ${missingColumns.join(', ')}`]
          }],
          formatError: true,
          expectedColumns: requiredColumns,
          receivedColumns: Object.keys(firstRow)
        });
      }

      // Basic validation helpers
      function isEmpty(value) {
        return value === undefined || value === null || String(value).trim() === '';
      }

      function validateConcessionStaffRow(row, index) {
        const errors = [];
        // Required fields
        if (isEmpty(row.name)) {
          errors.push('name is required');
        }
        
        // Optional fields validation
        if (!isEmpty(row.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push('email format is invalid');
        }
        
        if (!isEmpty(row.phone) && !/^[\d\-\+\(\)\s]+$/.test(row.phone)) {
          errors.push('phone format is invalid');
        }

        if (errors.length > 0) {
          rowErrors.push({ row: index + 1, errors });
          return false;
        }
        return true;
      }

      // Validate all rows first
      results.forEach((row, idx) => validateConcessionStaffRow(row, idx));

      if (rowErrors.length > 0) {
        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'Concession Staff CSV failed validation',
          committed: false,
          totalRows: results.length,
          successCount: 0,
          errorCount: rowErrors.length,
          rowErrors
        });
      }

      // Start transaction
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
          });
          return res.status(500).json({
            message: 'Database transaction failed',
            committed: false,
            totalRows: results.length,
            successCount: 0,
            errorCount: results.length,
            rowErrors: [{ row: 0, errors: [err.message] }]
          });
        }

        let successCount = 0;
        let errorCount = 0;
        let processedCount = 0;

        results.forEach((row, index) => {
          const query = `
            INSERT INTO concession_staff (
              name, email, phone, availability
            ) VALUES (?, ?, ?, ?)
          `;
          
          const values = [
            row.name,
            row.email || '',
            row.phone || '',
            row.availability || 'Available' // Use provided availability or default to Available
          ];

          db.run(query, values, function(err) {
            processedCount++;
            
            if (err) {
              console.error(`❌ Error inserting concession staff row ${index + 1}:`, err);
              errorCount++;
              rowErrors.push({ row: index + 1, errors: [err.message] });
            } else {
              console.log(`✅ Concession staff row ${index + 1} inserted successfully, ID: ${this.lastID}`);
              successCount++;
            }

            if (processedCount === results.length) {
              if (errorCount > 0) {
                // Rollback transaction if there were errors
                db.run('ROLLBACK', (rollbackErr) => {
                  if (rollbackErr) console.error('Error rolling back transaction:', rollbackErr);
                  
                  // Clean up uploaded file
                  fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                  });

                  res.json({
                    message: 'Concession Staff CSV processing failed',
                    committed: false,
                    totalRows: results.length,
                    successCount,
                    errorCount,
                    rowErrors
                  });
                });
              } else {
                // Commit transaction on success
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    console.error('Error committing transaction:', commitErr);
                    // Clean up uploaded file
                    fs.unlink(req.file.path, (err) => {
                      if (err) console.error('Error deleting uploaded file:', err);
                    });
                    return res.status(500).json({
                      message: 'Database commit failed',
                      committed: false,
                      totalRows: results.length,
                      successCount: 0,
                      errorCount: results.length,
                      rowErrors: [{ row: 0, errors: [commitErr.message] }]
                    });
                  }

                  // Clean up uploaded file
                  fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                  });

                  console.log(`✅ Concession Staff CSV processed successfully: ${successCount} rows inserted`);
                  res.json({
                    message: 'Concession Staff CSV processed successfully',
                    committed: true,
                    totalRows: results.length,
                    successCount,
                    errorCount,
                    rowErrors: []
                  });
                });
              }
            }
          });
        });
      });
    });
});

// Get unique values for filters
app.get('/api/filters', (req, res) => {
  const filters = {};
  
  const filterFields = [
    'season', 'event_type', 'day', 'division', 'home_team', 'visitor_team',
    'home_coach', 'visitor_coach', 'venue', 'plate_umpire', 'base_umpire', 'concession_stand', 'concession_staff'
  ];

  let completed = 0;
  
  filterFields.forEach(field => {
    db.all(`SELECT DISTINCT ${field} FROM schedules WHERE ${field} IS NOT NULL AND ${field} != ''`, [], (err, rows) => {
      if (!err) {
        filters[field] = rows.map(row => row[field]);
      }
      completed++;
      
      if (completed === filterFields.length) {
        res.json(filters);
      }
    });
  });
});

// Add missing API endpoint for getting all staff names for filters
app.get('/api/staff-names', (req, res) => {
  const query = 'SELECT name, role FROM staff_directory ORDER BY name';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// ===== SEASON VISIBILITY CONTROL API =====
// Get all season visibility status
app.get('/api/season-visibility', (req, res) => {
  const query = 'SELECT * FROM season_visibility ORDER BY season';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Toggle season visibility (Admin only)
app.put('/api/season-visibility/:season', (req, res) => {
  const { season } = req.params;
  const { is_visible } = req.body;
  
  // Check if season exists in visibility table
  db.get('SELECT * FROM season_visibility WHERE season = ?', [season], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      // Update existing season visibility
      db.run('UPDATE season_visibility SET is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE season = ?', 
        [is_visible ? 1 : 0, season], (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ 
          message: `${season} season ${is_visible ? 'published' : 'unpublished'} successfully`,
          season,
          is_visible: is_visible ? 1 : 0
        });
      });
    } else {
      // Insert new season visibility
      db.run('INSERT INTO season_visibility (season, is_visible) VALUES (?, ?)', 
        [season, is_visible ? 1 : 0], (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ 
          message: `${season} season ${is_visible ? 'published' : 'unpublished'} successfully`,
          season,
          is_visible: is_visible ? 1 : 0
        });
      });
    }
  });
});

// Get visible seasons for public interface
app.get('/api/visible-seasons', (req, res) => {
  const query = 'SELECT season FROM season_visibility WHERE is_visible = 1';
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const visibleSeasons = rows.map(row => row.season);
    res.json({ visibleSeasons });
  });
});

// ===== GAME REMINDER SERVICE =====
// This service automatically sends reminder emails 30 minutes before games

// Function to send game reminders
async function sendGameReminders() {
    try {
        console.log('🔔 Checking for games that need reminders...');
        
        // Get current time and calculate 30 minutes from now
        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
        
        // Format times for database comparison
        const currentTimeStr = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const reminderTimeStr = thirtyMinutesFromNow.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        console.log(`🕐 Current time: ${currentTimeStr}, Checking for games at: ${reminderTimeStr}`);
        
        // Query for games starting in approximately 30 minutes
        const query = `
            SELECT * FROM schedules 
            WHERE date = ? 
            AND start_time = ? 
            AND (plate_umpire IS NOT NULL AND plate_umpire != '' 
                 OR base_umpire IS NOT NULL AND base_umpire != '' 
                 OR concession_staff IS NOT NULL AND concession_staff != '')
        `;
        
        const today = now.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: '2-digit' 
        });
        
        db.all(query, [today, reminderTimeStr], async (err, games) => {
            if (err) {
                console.error('❌ Error querying games for reminders:', err);
                return;
            }
            
            if (games.length === 0) {
                console.log('📅 No games found that need reminders at this time');
                return;
            }
            
            console.log(`🔔 Found ${games.length} game(s) that need reminders`);
            
            for (const game of games) {
                try {
                    console.log(`📧 Sending reminder for game: ${game.home_team} vs ${game.visitor_team} at ${game.start_time}`);
                    
                    // Get email addresses for assigned staff
                    const plateUmpireEmail = game.plate_umpire ? await getStaffEmail(game.plate_umpire) : null;
                    const baseUmpireEmail = game.base_umpire ? await getStaffEmail(game.base_umpire) : null;
                    const concessionStaffEmail = game.concession_staff ? await getStaffEmail(game.concession_staff) : null;
                    
                    // Calculate arrival time (15 minutes before game)
                    const gameTime = new Date();
                    const [hours, minutes] = game.start_time.split(':');
                    gameTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    const arrivalTime = new Date(gameTime.getTime() - 15 * 60 * 1000);
                    const arrivalTimeStr = arrivalTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                    });
                    
                    // Prepare reminder data
                    const reminderData = {
                        gameDate: game.date,
                        gameTime: `${game.start_time} ${game.am_pm}`,
                        homeTeam: game.home_team,
                        visitorTeam: game.visitor_team,
                        venue: game.venue,
                        division: game.division,
                        season: game.season,
                        plateUmpire: game.plate_umpire,
                        baseUmpire: game.base_umpire,
                        concessionStaff: game.concession_staff,
                        plateUmpireEmail: plateUmpireEmail,
                        baseUmpireEmail: baseUmpireEmail,
                        concessionStaffEmail: concessionStaffEmail,
                        arrivalTime: arrivalTimeStr,
                        requiredEquipment: getRequiredEquipment(game.plate_umpire, game.base_umpire, game.concession_staff),
                        adminContact: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',')[0] : 'Admin Panel'
                    };
                    
                    // Send reminder emails
                    const reminderResult = await emailService.sendGameReminder(reminderData);
                    console.log('✅ Game reminder emails sent:', reminderResult);
                    
                    // Log reminder sent to prevent duplicate emails
                    const reminderLogQuery = `
                        INSERT OR IGNORE INTO game_reminder_logs 
                        (game_id, reminder_time, sent_to) 
                        VALUES (?, ?, ?)
                    `;
                    
                    const sentTo = [];
                    if (plateUmpireEmail) sentTo.push('plate_umpire');
                    if (baseUmpireEmail) sentTo.push('base_umpire');
                    if (concessionStaffEmail) sentTo.push('concession_staff');
                    
                    db.run(reminderLogQuery, [
                        game.id, 
                        now.toISOString(), 
                        sentTo.join(',')
                    ], (err) => {
                        if (err) {
                            console.error('❌ Error logging reminder:', err);
                        } else {
                            console.log('📝 Reminder logged to database');
                        }
                    });
                    
                } catch (gameError) {
                    console.error(`❌ Error sending reminder for game ${game.id}:`, gameError);
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error in game reminder service:', error);
    }
}

// Helper function to determine required equipment based on role
function getRequiredEquipment(plateUmpire, baseUmpire, concessionStaff) {
    const equipment = [];
    
    if (plateUmpire) {
        equipment.push('Plate umpire: Mask, chest protector, shin guards, ball/strike indicator');
    }
    
    if (baseUmpire) {
        equipment.push('Base umpire: Cap, base umpire indicator');
    }
    
    if (concessionStaff) {
        equipment.push('Concession staff: Appropriate attire, name tag');
    }
    
    return equipment.length > 0 ? equipment.join('; ') : 'Standard equipment for your role';
}

// Create reminder logs table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS game_reminder_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        reminder_time DATETIME NOT NULL,
        sent_to TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES schedules (id)
    )
`);

// Start the reminder service
// Check every 5 minutes for games that need reminders
setInterval(sendGameReminders, 5 * 60 * 1000);

// Also run once when server starts
setTimeout(sendGameReminders, 10000); // Wait 10 seconds after server starts

console.log('🔔 Game reminder service started - checking every 5 minutes');

// ===== GAME REMINDER ADMIN ENDPOINTS =====

// Manual trigger for game reminders (for testing)
app.post('/api/admin/trigger-game-reminders', requireAuth, async (req, res) => {
    try {
        console.log('🔔 Manual trigger of game reminders requested by admin');
        await sendGameReminders();
        res.json({ message: 'Game reminders triggered successfully' });
    } catch (error) {
        console.error('❌ Error triggering game reminders:', error);
        res.status(500).json({ error: 'Failed to trigger game reminders' });
    }
});

// Get reminder logs
app.get('/api/admin/reminder-logs', requireAuth, (req, res) => {
    const query = `
        SELECT grl.*, s.home_team, s.visitor_team, s.date, s.start_time, s.am_pm
        FROM game_reminder_logs grl
        JOIN schedules s ON grl.game_id = s.id
        ORDER BY grl.created_at DESC
        LIMIT 100
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get upcoming games that will need reminders
app.get('/api/admin/upcoming-reminders', requireAuth, (req, res) => {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: '2-digit' 
    });
    
    const query = `
        SELECT * FROM schedules 
        WHERE date >= ? 
        AND (plate_umpire IS NOT NULL AND plate_umpire != '' 
             OR base_umpire IS NOT NULL AND base_umpire != '' 
             OR concession_staff IS NOT NULL AND concession_staff != '')
        ORDER BY date ASC, start_time ASC
        LIMIT 50
    `;
    
    db.all(query, [today], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Filter games that will need reminders in the next few hours
        const upcomingReminders = rows.filter(game => {
            const gameTime = new Date();
            const [hours, minutes] = game.start_time.split(':');
            gameTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const timeUntilGame = gameTime.getTime() - now.getTime();
            const timeUntilReminder = timeUntilGame - (30 * 60 * 1000); // 30 minutes before
            
            return timeUntilReminder > 0 && timeUntilReminder < (4 * 60 * 60 * 1000); // Next 4 hours
        });
        
        res.json(upcomingReminders);
    });
});

// Start server
app.listen(PORT, () => {
  console.log(`Baseball/Softball Schedule Manager running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Public interface: http://localhost:${PORT}`);
}); 