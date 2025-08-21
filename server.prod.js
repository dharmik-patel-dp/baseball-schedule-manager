const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Database setup
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'schedules.db');
const db = new sqlite3.Database(dbPath);

// Database initialization
db.serialize(() => {
    // Create schedules table
    db.run(`CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        season TEXT NOT NULL,
        event_type TEXT NOT NULL,
        day TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT,
        am_pm TEXT,
        division TEXT,
        home_team TEXT,
        visitor_team TEXT,
        venue TEXT,
        home_coach TEXT,
        visitor_coach TEXT,
        plate_umpire TEXT,
        base_umpire TEXT,
        concession_stand TEXT,
        concession_staff TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create umpire_requests table
    db.run(`CREATE TABLE IF NOT EXISTS umpire_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        current_plate_umpire TEXT,
        current_base_umpire TEXT,
        requested_plate_umpire TEXT,
        requested_base_umpire TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create concession_staff_requests table
    db.run(`CREATE TABLE IF NOT EXISTS concession_staff_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        current_concession_staff TEXT,
        requested_concession_staff TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create staff_directory table
    db.run(`CREATE TABLE IF NOT EXISTS staff_directory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        parent_name TEXT,
        parent_phone TEXT,
        parent_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

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
            const hasAmPm = rows.some(row => row.name === 'am_pm');
            const hasUpdatedAt = rows.some(row => row.name === 'updated_at');

            if (!hasConcessionStaff) {
                console.log('📝 Adding missing concession_staff column...');
                db.run("ALTER TABLE schedules ADD COLUMN concession_staff TEXT", (err) => {
                    if (err) {
                        console.error('Error adding concession_staff column:', err);
                    } else {
                        console.log('✅ Successfully added concession_staff column');
                    }
                });
            }

            if (!hasAmPm) {
                console.log('📝 Adding missing am_pm column...');
                db.run("ALTER TABLE schedules ADD COLUMN am_pm TEXT", (err) => {
                    if (err) {
                        console.error('Error adding am_pm column:', err);
                    } else {
                        console.log('✅ Successfully added am_pm column');
                    }
                });
            }

            if (!hasUpdatedAt) {
                console.log('📝 Adding missing updated_at column...');
                // SQLite doesn't support DEFAULT CURRENT_TIMESTAMP in ALTER TABLE, so we add it without default
                db.run("ALTER TABLE schedules ADD COLUMN updated_at DATETIME", (err) => {
                    if (err) {
                        console.error('Error adding updated_at column:', err);
                    } else {
                        console.log('✅ Successfully added updated_at column');
                        // Now set the default value for existing rows
                        db.run("UPDATE schedules SET updated_at = created_at WHERE updated_at IS NULL", (err2) => {
                            if (err2) {
                                console.error('Error setting default updated_at values:', err2);
                            } else {
                                console.log('✅ Successfully set default updated_at values');
                            }
                        });
                    }
                });
            }

            console.log('✅ Database schema is up to date');
        });
    }

    // Run database migration
    migrateDatabase();

    // Insert sample staff data if table is empty
    db.get("SELECT COUNT(*) as count FROM staff_directory", [], (err, row) => {
        if (err) {
            console.error('Error checking staff count:', err);
            return;
        }

        if (row.count === 0) {
            console.log('📝 Inserting sample staff data...');
            const sampleStaff = [
                ['Dylan LeLacheur', 'Umpire', '555-0101', 'dylan@example.com', 'John LeLacheur', '555-0102', 'john@example.com'],
                ['Scott Patenaude', 'Umpire', '555-0103', 'scott@example.com', 'Mary Patenaude', '555-0104', 'mary@example.com'],
                ['Matthew Rurak', 'Umpire', '555-0105', 'matthew@example.com', 'David Rurak', '555-0106', 'david@example.com'],
                ['Zach Chachus', 'Umpire', '555-0107', 'zach@example.com', 'Lisa Chachus', '555-0108', 'lisa@example.com'],
                ['Emily Lelacheur', 'Concession Staff', '555-0109', 'emily@example.com', 'John LeLacheur', '555-0102', 'john@example.com'],
                ['Danny Gallo', 'Concession Staff', '555-0110', 'danny@example.com', 'Sarah Gallo', '555-0111', 'sarah@example.com']
            ];

            const insertStaff = db.prepare("INSERT INTO staff_directory (name, role, phone, email, parent_name, parent_phone, parent_email) VALUES (?, ?, ?, ?, ?, ?, ?)");
            
            sampleStaff.forEach(staff => {
                insertStaff.run(staff, (err) => {
                    if (err) {
                        console.error('Error inserting staff:', err);
                    }
                });
            });
            
            insertStaff.finalize((err) => {
                if (err) {
                    console.error('Error finalizing staff insert:', err);
                } else {
                    console.log('✅ Sample staff data inserted');
                }
            });
        }
    });
});

// API Routes

// Get all schedules
app.get('/api/schedules', (req, res) => {
    const query = `
        SELECT s.*, 
               sr.name as requested_plate_umpire_name,
               sr2.name as requested_base_umpire_name
        FROM schedules s
        LEFT JOIN staff_directory sr ON sr.name = s.plate_umpire
        LEFT JOIN staff_directory sr2 ON sr2.name = s.base_umpire
        ORDER BY s.date ASC, s.start_time ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching schedules:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get filters
app.get('/api/filters', (req, res) => {
    const filterFields = ['season', 'event_type', 'day', 'division', 'home_team', 'visitor_team', 'venue', 'home_coach', 'visitor_coach', 'plate_umpire', 'base_umpire', 'concession_stand', 'concession_staff'];
    
    const filterOptions = {};
    let completedFields = 0;
    
    filterFields.forEach(field => {
        const query = `SELECT DISTINCT ${field} FROM schedules WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY ${field}`;
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error(`Error fetching ${field} options:`, err);
                filterOptions[field] = [];
            } else {
                filterOptions[field] = rows.map(row => row[field]);
            }
            
            completedFields++;
            
            // Check if all filters are loaded
            if (completedFields === filterFields.length) {
                res.json(filterOptions);
            }
        });
    });
});

// Get all staff
app.get('/api/staff', (req, res) => {
    db.all("SELECT * FROM staff_directory ORDER BY name", [], (err, rows) => {
        if (err) {
            console.error('Error fetching staff:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get staff names only
app.get('/api/staff-names', (req, res) => {
    db.all("SELECT name, role FROM staff_directory ORDER BY name", [], (err, rows) => {
        if (err) {
            console.error('Error fetching staff names:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        // Return just the names as strings
        res.json(rows.map(row => row.name));
    });
});

// Create new schedule
app.post('/api/schedules', (req, res) => {
    const schedule = req.body;
    const query = `
        INSERT INTO schedules (
            season, event_type, day, date, start_time, am_pm, division,
            home_team, visitor_team, venue, home_coach, visitor_coach,
            plate_umpire, base_umpire, concession_stand, concession_staff
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
        schedule.season, schedule.event_type, schedule.day, schedule.date,
        schedule.start_time, schedule.am_pm, schedule.division,
        schedule.home_team, schedule.visitor_team, schedule.venue,
        schedule.home_coach, schedule.visitor_coach, schedule.plate_umpire,
        schedule.base_umpire, schedule.concession_stand, schedule.concession_staff
    ];
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('Error creating schedule:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Schedule created successfully' });
    });
});

// Update schedule
app.put('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const schedule = req.body;
    
    const query = `
        UPDATE schedules SET 
            season = ?, event_type = ?, day = ?, date = ?, start_time = ?, am_pm = ?, division = ?,
            home_team = ?, visitor_team = ?, venue = ?, home_coach = ?, visitor_coach = ?,
            plate_umpire = ?, base_umpire = ?, concession_stand = ?, concession_staff = ?
        WHERE id = ?
    `;
    
    const values = [
        schedule.season, schedule.event_type, schedule.day, schedule.date,
        schedule.start_time, schedule.am_pm, schedule.division,
        schedule.home_team, schedule.visitor_team, schedule.venue,
        schedule.home_coach, schedule.visitor_coach, schedule.plate_umpire,
        schedule.base_umpire, schedule.concession_stand, schedule.concession_staff, id
    ];
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('Error updating schedule:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Schedule not found' });
            return;
        }
        console.log(`✅ Successfully updated schedule ${id}`);
        res.json({ message: 'Schedule updated successfully' });
    });
});

// Delete schedule
app.delete('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    
    db.run("DELETE FROM schedules WHERE id = ?", [id], function(err) {
        if (err) {
            console.error('Error deleting schedule:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Schedule not found' });
            return;
        }
        res.json({ message: 'Schedule deleted successfully' });
    });
});

// Staff CRUD operations
app.post('/api/staff', (req, res) => {
    const staff = req.body;
    const query = `
        INSERT INTO staff_directory (name, role, phone, email, parent_name, parent_phone, parent_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
        staff.name, staff.role, staff.phone, staff.email,
        staff.parent_name, staff.parent_phone, staff.parent_email
    ];
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('Error creating staff member:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Staff member created successfully' });
    });
});

app.put('/api/staff/:id', (req, res) => {
    const { id } = req.params;
    const staff = req.body;
    
    const query = `
        UPDATE staff_directory SET 
            name = ?, role = ?, phone = ?, email = ?, 
            parent_name = ?, parent_phone = ?, parent_email = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    const values = [
        staff.name, staff.role, staff.phone, staff.email,
        staff.parent_name, staff.parent_phone, staff.parent_email, id
    ];
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('Error updating staff member:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Staff member not found' });
            return;
        }
        res.json({ message: 'Staff member updated successfully' });
    });
});

app.delete('/api/staff/:id', (req, res) => {
    const { id } = req.params;
    
    db.run("DELETE FROM staff_directory WHERE id = ?", [id], function(err) {
        if (err) {
            console.error('Error deleting staff member:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Staff member not found' });
            return;
        }
        res.json({ message: 'Staff member deleted successfully' });
    });
});

// Umpire request operations
app.post('/api/umpire-requests', (req, res) => {
    const request = req.body;
    const query = `
        INSERT INTO umpire_requests (
            game_id, current_plate_umpire, current_base_umpire,
            requested_plate_umpire, requested_base_umpire, reason
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
        request.game_id, request.current_plate_umpire, request.current_base_umpire,
        request.requested_plate_umpire, request.requested_base_umpire, request.reason
    ];
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('Error creating umpire request:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Umpire request submitted successfully' });
    });
});

// Get umpire requests (for admin dashboard)
app.get('/api/umpire-requests', (req, res) => {
    const query = `
        SELECT ur.*, s.date, s.start_time, s.am_pm, s.home_team, s.visitor_team, s.venue, s.division
        FROM umpire_requests ur
        JOIN schedules s ON ur.game_id = s.id
        ORDER BY ur.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching umpire requests:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Update umpire request status (alias route to match frontend)
app.put('/api/umpire-requests/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.run("UPDATE umpire_requests SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) {
            console.error('Error updating umpire request:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Umpire request not found' });
            return;
        }

        if (status === 'approved') {
            // Apply approved changes to the schedule
            db.get("SELECT * FROM umpire_requests WHERE id = ?", [id], (err2, request) => {
                if (err2 || !request) {
                    if (err2) console.error('Error fetching umpire request:', err2);
                    return res.json({ message: 'Umpire request updated successfully' });
                }
                
                // Build update query dynamically based on what was requested
                let updateFields = [];
                let updateValues = [];
                
                if (request.requested_plate_umpire && request.requested_plate_umpire.trim() !== '') {
                    updateFields.push('plate_umpire = ?');
                    updateValues.push(request.requested_plate_umpire);
                }
                
                if (request.requested_base_umpire && request.requested_base_umpire.trim() !== '') {
                    updateFields.push('base_umpire = ?');
                    updateValues.push(request.requested_base_umpire);
                }
                
                if (updateFields.length === 0) {
                    return res.json({ message: 'Umpire request approved but no changes to apply' });
                }
                
                // Add game_id to values
                updateValues.push(request.game_id);
                
                const updateQuery = `UPDATE schedules SET ${updateFields.join(', ')} WHERE id = ?`;
                
                db.run(updateQuery, updateValues, function(err3) {
                    if (err3) {
                        console.error('Error applying approved umpire changes:', err3);
                        return res.json({ message: 'Umpire request updated but schedule not changed' });
                    }
                    console.log(`✅ Successfully updated schedule ${request.game_id} with umpire changes`);
                    return res.json({ message: 'Umpire request approved and schedule updated' });
                });
            });
        } else {
            res.json({ message: 'Umpire request updated successfully' });
        }
    });
});

// Keep original update route for compatibility
app.put('/api/umpire-requests/:id', (req, res) => {
    // Redirect to the main status update route
    req.params.id = req.params.id;
    req.body = req.body;
    // This will be handled by the main route above
    res.redirect(307, `/api/umpire-requests/${req.params.id}/status`);
});

// Concession staff request operations
app.post('/api/concession-staff-requests', (req, res) => {
    const request = req.body;
    const query = `
        INSERT INTO concession_staff_requests (
            game_id, current_concession_staff, requested_concession_staff, reason
        ) VALUES (?, ?, ?, ?)
    `;
    
    const values = [
        request.game_id, request.current_concession_staff, request.requested_concession_staff, request.reason
    ];
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('Error creating concession staff request:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Concession staff request submitted successfully' });
    });
});

app.get('/api/concession-staff-requests', (req, res) => {
    const query = `
        SELECT csr.*, s.date, s.start_time, s.am_pm, s.home_team, s.visitor_team, s.venue, s.division, s.concession_stand
        FROM concession_staff_requests csr
        JOIN schedules s ON csr.game_id = s.id
        ORDER BY csr.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching concession staff requests:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.put('/api/concession-staff-requests/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.run("UPDATE concession_staff_requests SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) {
            console.error('Error updating concession staff request:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Concession staff request not found' });
            return;
        }

        if (status === 'approved') {
            // Apply approved changes to the schedule
            db.get("SELECT * FROM concession_staff_requests WHERE id = ?", [id], (err2, request) => {
                if (err2 || !request) {
                    if (err2) console.error('Error fetching concession staff request:', err2);
                    return res.json({ message: 'Concession staff request updated successfully' });
                }
                
                if (!request.requested_concession_staff || request.requested_concession_staff.trim() === '') {
                    return res.json({ message: 'Concession staff request approved but no staff requested' });
                }
                
                const updateQuery = `UPDATE schedules SET concession_staff = ? WHERE id = ?`;
                const values = [request.requested_concession_staff, request.game_id];
                
                db.run(updateQuery, values, function(err3) {
                    if (err3) {
                        console.error('Error applying approved concession staff changes:', err3);
                        return res.json({ message: 'Concession staff request updated but schedule not changed' });
                    }
                    console.log(`✅ Successfully updated schedule ${request.game_id} with concession staff change`);
                    return res.json({ message: 'Concession staff request approved and schedule updated' });
                });
            });
        } else {
            res.json({ message: 'Concession staff request updated successfully' });
        }
    });
});

// CSV upload endpoint
app.post('/api/upload-csv', upload.single('csv'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 CSV file uploaded:', req.file.originalname, 'at', req.file.path);

    // Import required modules
    const csv = require('csv-parser');
    const fs = require('fs');
    const results = [];

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            console.log('📊 CSV row data:', data);
            results.push(data);
        })
        .on('end', () => {
            console.log(`📊 Processing ${results.length} CSV rows...`);
            
            if (results.length === 0) {
                // Clean up uploaded file
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                });
                return res.status(400).json({ error: 'CSV file is empty or invalid' });
            }

            // Process CSV data and insert into database
            let successCount = 0;
            let errorCount = 0;
            let processedCount = 0;

            // Use a transaction for better performance and error handling
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                results.forEach((row, index) => {
                    const query = `
                        INSERT INTO schedules (
                            season, event_type, day, date, start_time, am_pm, division,
                            home_team, visitor_team, venue, home_coach, visitor_coach,
                            plate_umpire, base_umpire, concession_stand, concession_staff
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    const values = [
                        row.season || 'Spring', 
                        row.event_type || 'Baseball', 
                        row.day || 'Saturday',
                        row.date || '', 
                        row.start_time || '', 
                        row.am_pm || '', 
                        row.division || '',
                        row.home_team || '', 
                        row.visitor_team || '', 
                        row.venue || '',
                        row.home_coach || '', 
                        row.visitor_coach || '', 
                        row.plate_umpire || '',
                        row.base_umpire || '', 
                        row.concession_stand || '', 
                        row.concession_staff || ''
                    ];

                    db.run(query, values, function(err) {
                        processedCount++;
                        
                        if (err) {
                            console.error(`❌ Error inserting row ${index + 1}:`, err);
                            errorCount++;
                        } else {
                            console.log(`✅ Row ${index + 1} inserted successfully, ID: ${this.lastID}`);
                            successCount++;
                        }

                        // Check if all rows have been processed
                        if (processedCount === results.length) {
                            if (errorCount > 0) {
                                // Rollback transaction if there were errors
                                db.run('ROLLBACK', (rollbackErr) => {
                                    if (rollbackErr) console.error('Error rolling back transaction:', rollbackErr);
                                    
                                    // Clean up uploaded file
                                    fs.unlink(req.file.path, (err) => {
                                        if (err) console.error('Error deleting uploaded file:', err);
                                    });

                                    res.status(500).json({
                                        error: 'CSV processing failed',
                                        totalRows: results.length,
                                        successCount,
                                        errorCount,
                                        message: 'Transaction rolled back due to errors'
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

                                    console.log(`✅ CSV processed successfully: ${successCount} rows inserted`);
                                    res.json({
                                        message: 'CSV processed successfully',
                                        totalRows: results.length,
                                        successCount,
                                        errorCount
                                    });
                                });
                            }
                        }
                    });
                });
            });
        })
        .on('error', (error) => {
            console.error('❌ Error processing CSV:', error);
            
            // Clean up uploaded file
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
            
            res.status(500).json({ error: 'Error processing CSV file: ' + error.message });
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
            console.error('Error deleting schedules:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: `${this.changes} schedules deleted successfully` });
    });
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Baseball/Softball Schedule Manager running on port ${PORT}`);
    console.log(`🌐 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`📱 Public interface: http://localhost:${PORT}`);
    console.log(`✅ Production mode enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
