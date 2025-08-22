const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('schedules.db');

// Database migration function
function migrateDatabase() {
  console.log('🔧 Checking database schema...');
  
  // Check if concession_staff column exists
  db.all("PRAGMA table_info(schedules)", [], (err, rows) => {
    if (err) {
      console.error('Error checking table schema:', err);
      return;
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

// Create tables
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

  // Umpire request table
  db.run(`CREATE TABLE IF NOT EXISTS umpire_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    current_plate_umpire TEXT NOT NULL,
    current_base_umpire TEXT NOT NULL,
    requested_plate_umpire TEXT,
    requested_base_umpire TEXT,
    reason TEXT NOT NULL,
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
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES schedules (id)
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
  
  // Run database migration
  migrateDatabase();
});

// Routes

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
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

// Get all schedules
app.get('/api/schedules', (req, res) => {
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
app.post('/api/umpire-requests', (req, res) => {
  const {
    game_id, current_plate_umpire, current_base_umpire,
    requested_plate_umpire, requested_base_umpire, reason
  } = req.body;

  const query = `INSERT INTO umpire_requests (
    game_id, current_plate_umpire, current_base_umpire,
    requested_plate_umpire, requested_base_umpire, reason
  ) VALUES (?, ?, ?, ?, ?, ?)`;

  db.run(query, [
    game_id, current_plate_umpire, current_base_umpire,
    requested_plate_umpire, requested_base_umpire, reason
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Request submitted successfully' });
  });
});

// Update umpire request status
app.put('/api/umpire-requests/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run('UPDATE umpire_requests SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Request status updated successfully' });
  });
});

// Concession Staff Request Routes
app.post('/api/concession-staff-requests', (req, res) => {
  const {
    game_id, current_concession_staff, requested_concession_staff, reason
  } = req.body;

  const query = `INSERT INTO concession_staff_requests (
    game_id, current_concession_staff, requested_concession_staff, reason
  ) VALUES (?, ?, ?, ?)`;

  db.run(query, [game_id, current_concession_staff, requested_concession_staff, reason], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Request submitted successfully' });
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

  db.run('UPDATE concession_staff_requests SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Request status updated successfully' });
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
      // Normalize keys by trimming and lowering
      const normalized = {};
      Object.keys(data || {}).forEach(k => {
        if (!k) return;
        const key = String(k).trim();
        normalized[key] = typeof data[k] === 'string' ? data[k].trim() : data[k];
      });
      console.log('📊 CSV row data:', normalized);
      results.push(normalized);
    })
    .on('end', () => {
      console.log(`📊 Processing ${results.length} CSV rows...`);
      
      if (results.length === 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'CSV file is empty',
          committed: false,
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          rowErrors: []
        });
      }

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
          if (err) {
            errors++;
          } else {
            inserted++;
          }

          if (index === results.length - 1) {
            res.json({
              message: 'CSV upload completed',
              inserted,
              errors,
              total: results.length
            });
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
    .on('end', () => {
      console.log(`📊 Processing ${results.length} staff CSV rows...`);
      
      if (results.length === 0) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
        return res.status(400).json({
          message: 'CSV file is empty',
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

// Start server
app.listen(PORT, () => {
  console.log(`Baseball/Softball Schedule Manager running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Public interface: http://localhost:${PORT}`);
}); 