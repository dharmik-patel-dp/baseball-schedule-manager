-- PostgreSQL Schema for Baseball Schedule Manager
-- This file creates all necessary tables for the application

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff directory table
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
);

-- Enhanced Schedule table with concession stand staff
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    season VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    day VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    am_pm VARCHAR(5) NOT NULL,
    division VARCHAR(50) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    home_coach VARCHAR(100) NOT NULL,
    visitor_team VARCHAR(100) NOT NULL,
    visitor_coach VARCHAR(100) NOT NULL,
    venue VARCHAR(100) NOT NULL,
    plate_umpire VARCHAR(100) NOT NULL,
    base_umpire VARCHAR(100) NOT NULL,
    concession_stand VARCHAR(100) NOT NULL,
    concession_staff VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Umpire request table
CREATE TABLE IF NOT EXISTS umpire_requests (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES schedules(id),
    current_plate_umpire VARCHAR(100) NOT NULL,
    current_base_umpire VARCHAR(100) NOT NULL,
    requested_plate_umpire VARCHAR(100),
    requested_base_umpire VARCHAR(100),
    reason TEXT NOT NULL,
    requester_name VARCHAR(100) NOT NULL,
    requester_email VARCHAR(100) NOT NULL,
    requester_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Concession staff request table
CREATE TABLE IF NOT EXISTS concession_staff_requests (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES schedules(id),
    current_concession_staff VARCHAR(100) NOT NULL,
    requested_concession_staff VARCHAR(100),
    reason TEXT NOT NULL,
    requester_name VARCHAR(100) NOT NULL,
    requester_email VARCHAR(100) NOT NULL,
    requester_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Season visibility table
CREATE TABLE IF NOT EXISTS season_visibility (
    id SERIAL PRIMARY KEY,
    season_name VARCHAR(100) NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plate umpires table
CREATE TABLE IF NOT EXISTS plate_umpires (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Base umpires table
CREATE TABLE IF NOT EXISTS base_umpires (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Concession staff table
CREATE TABLE IF NOT EXISTS concession_staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game reminder logs table
CREATE TABLE IF NOT EXISTS game_reminder_logs (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES schedules(id),
    reminder_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_season ON schedules(season);
CREATE INDEX IF NOT EXISTS idx_umpire_requests_game_id ON umpire_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_concession_staff_requests_game_id ON concession_staff_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_game_reminder_logs_game_id ON game_reminder_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_game_reminder_logs_sent_at ON game_reminder_logs(sent_at);

-- Insert default admin user
INSERT INTO admin_users (username, password_hash, email, role) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@baseball.com', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample data
INSERT INTO schedules (season, event_type, day, date, start_time, am_pm, division, home_team, home_coach, visitor_team, visitor_coach, venue, plate_umpire, base_umpire, concession_stand, concession_staff) VALUES
('2024', 'Game', 'Saturday', '2024-03-15', '18:00:00', 'PM', 'Majors', 'Yankees', 'John Smith', 'Red Sox', 'Mike Johnson', 'Field 1', 'David Brown', 'Lisa Davis', 'Concession Stand 1', 'Sarah Wilson'),
('2024', 'Game', 'Sunday', '2024-03-16', '19:30:00', 'PM', 'Minors', 'Dodgers', 'Robert Taylor', 'Giants', 'Jennifer White', 'Field 2', 'Chris Miller', 'Tom Anderson', 'Concession Stand 2', 'Amy Wilson'),
('2024', 'Game', 'Monday', '2024-03-17', '17:00:00', 'PM', 'Majors', 'Cubs', 'Michael Brown', 'Cardinals', 'Sarah Johnson', 'Field 1', 'David Wilson', 'Lisa Anderson', 'Concession Stand 1', 'Chris Davis')
ON CONFLICT DO NOTHING;

-- Insert sample plate umpires
INSERT INTO plate_umpires (name, email, phone) VALUES
('David Brown', 'david.brown@email.com', '555-0101'),
('Chris Miller', 'chris.miller@email.com', '555-0102'),
('David Wilson', 'david.wilson@email.com', '555-0103')
ON CONFLICT DO NOTHING;

-- Insert sample base umpires
INSERT INTO base_umpires (name, email, phone) VALUES
('Lisa Davis', 'lisa.davis@email.com', '555-0201'),
('Tom Anderson', 'tom.anderson@email.com', '555-0202'),
('Lisa Anderson', 'lisa.anderson@email.com', '555-0203')
ON CONFLICT DO NOTHING;

-- Insert sample concession staff
INSERT INTO concession_staff (name, email, phone) VALUES
('Sarah Wilson', 'sarah.wilson@email.com', '555-0301'),
('Amy Wilson', 'amy.wilson@email.com', '555-0302'),
('Chris Davis', 'chris.davis@email.com', '555-0303')
ON CONFLICT DO NOTHING;

-- Insert sample season visibility
INSERT INTO season_visibility (season_name, is_visible) VALUES
('2024', true),
('2023', false)
ON CONFLICT DO NOTHING;