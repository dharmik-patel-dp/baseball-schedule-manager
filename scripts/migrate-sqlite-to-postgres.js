const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
};

// SQLite database path
const sqlitePath = process.env.SQLITE_PATH || 'schedules.db';

// Create PostgreSQL connection pool
const pool = new Pool(pgConfig);

// Create SQLite connection
const db = new sqlite3.Database(sqlitePath);

async function migrateData() {
  try {
    console.log('🚀 Starting migration from SQLite to PostgreSQL...');
    
    // Test PostgreSQL connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL');
    
    // Test SQLite connection
    await new Promise((resolve, reject) => {
      db.get('SELECT 1', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Connected to SQLite');
    
    // Create tables in PostgreSQL
    console.log('📋 Creating PostgreSQL tables...');
    const schema = fs.readFileSync(path.join(__dirname, '../pg-schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ PostgreSQL tables created');
    
    // Migrate admin_users
    console.log('👤 Migrating admin users...');
    const adminUsers = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM admin_users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const user of adminUsers) {
      await pool.query(
        'INSERT INTO admin_users (username, password_hash, email, role, last_login, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING',
        [user.username, user.password_hash, user.email, user.role, user.last_login, user.created_at]
      );
    }
    console.log(`✅ Migrated ${adminUsers.length} admin users`);
    
    // Migrate schedules
    console.log('📅 Migrating schedules...');
    const schedules = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM schedules', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const schedule of schedules) {
      await pool.query(
        'INSERT INTO schedules (season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) ON CONFLICT DO NOTHING',
        [schedule.season, schedule.event_type, schedule.day, schedule.date, schedule.start_time, schedule.am_pm, schedule.division, schedule.home_team, schedule.home_coach, schedule.visitor_team, schedule.visitor_coach, schedule.venue, schedule.plate_umpire, schedule.base_umpire, schedule.concession_stand, schedule.concession_staff, schedule.created_at, schedule.updated_at]
      );
    }
    console.log(`✅ Migrated ${schedules.length} schedules`);
    
    // Migrate plate umpires
    console.log('🏟️ Migrating plate umpires...');
    const plateUmpires = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM plate_umpires', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const umpire of plateUmpires) {
      await pool.query(
        'INSERT INTO plate_umpires (name, email, phone, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [umpire.name, umpire.email, umpire.phone, umpire.created_at]
      );
    }
    console.log(`✅ Migrated ${plateUmpires.length} plate umpires`);
    
    // Migrate base umpires
    console.log('🏟️ Migrating base umpires...');
    const baseUmpires = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM base_umpires', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const umpire of baseUmpires) {
      await pool.query(
        'INSERT INTO base_umpires (name, email, phone, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [umpire.name, umpire.email, umpire.phone, umpire.created_at]
      );
    }
    console.log(`✅ Migrated ${baseUmpires.length} base umpires`);
    
    // Migrate concession staff
    console.log('🍿 Migrating concession staff...');
    const concessionStaff = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM concession_staff', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const staff of concessionStaff) {
      await pool.query(
        'INSERT INTO concession_staff (name, email, phone, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [staff.name, staff.email, staff.phone, staff.created_at]
      );
    }
    console.log(`✅ Migrated ${concessionStaff.length} concession staff`);
    
    // Migrate umpire requests
    console.log('📝 Migrating umpire requests...');
    const umpireRequests = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM umpire_requests', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const request of umpireRequests) {
      await pool.query(
        'INSERT INTO umpire_requests (game_id, current_plate_umpire, current_base_umpire, requested_plate_umpire, requested_base_umpire, reason, requester_name, requester_email, requester_phone, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING',
        [request.game_id, request.current_plate_umpire, request.current_base_umpire, request.requested_plate_umpire, request.requested_base_umpire, request.reason, request.requester_name, request.requester_email, request.requester_phone, request.status, request.created_at]
      );
    }
    console.log(`✅ Migrated ${umpireRequests.length} umpire requests`);
    
    // Migrate concession staff requests
    console.log('📝 Migrating concession staff requests...');
    const concessionStaffRequests = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM concession_staff_requests', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const request of concessionStaffRequests) {
      await pool.query(
        'INSERT INTO concession_staff_requests (game_id, current_concession_staff, requested_concession_staff, reason, requester_name, requester_email, requester_phone, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING',
        [request.game_id, request.current_concession_staff, request.requested_concession_staff, request.reason, request.requester_name, request.requester_email, request.requester_phone, request.status, request.created_at]
      );
    }
    console.log(`✅ Migrated ${concessionStaffRequests.length} concession staff requests`);
    
    // Migrate game reminder logs
    console.log('📧 Migrating game reminder logs...');
    const reminderLogs = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM game_reminder_logs', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const log of reminderLogs) {
      await pool.query(
        'INSERT INTO game_reminder_logs (game_id, reminder_type, recipient_email, sent_at, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
        [log.game_id, log.reminder_type, log.recipient_email, log.sent_at, log.status]
      );
    }
    console.log(`✅ Migrated ${reminderLogs.length} game reminder logs`);
    
    console.log('🎉 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Admin users: ${adminUsers.length}`);
    console.log(`   - Schedules: ${schedules.length}`);
    console.log(`   - Plate umpires: ${plateUmpires.length}`);
    console.log(`   - Base umpires: ${baseUmpires.length}`);
    console.log(`   - Concession staff: ${concessionStaff.length}`);
    console.log(`   - Umpire requests: ${umpireRequests.length}`);
    console.log(`   - Concession staff requests: ${concessionStaffRequests.length}`);
    console.log(`   - Game reminder logs: ${reminderLogs.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    db.close();
    await pool.end();
  }
}

// Run migration
migrateData();