const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Create database connection
const db = new sqlite3.Database('schedules.db');

// Sample schedule data
const sampleSchedules = [
    {
        season: 'Spring',
        event_type: 'Baseball',
        day: 'Saturday',
        date: '2024-03-15',
        start_time: '6:00',
        am_pm: 'PM',
        division: 'Minor 9/10',
        home_team: 'Tigers',
        home_coach: 'John Smith',
        visitor_team: 'Lions',
        visitor_coach: 'Mike Johnson',
        venue: 'Central Park',
        plate_umpire: 'Tom Wilson',
        base_umpire: 'David Brown',
        concession_stand: 'Yes'
    },
    {
        season: 'Spring',
        event_type: 'Baseball',
        day: 'Saturday',
        date: '2024-03-15',
        start_time: '7:30',
        am_pm: 'PM',
        division: 'Minor 9/10',
        home_team: 'Bears',
        home_coach: 'Sarah Davis',
        visitor_team: 'Eagles',
        visitor_coach: 'Chris Lee',
        venue: 'Central Park',
        plate_umpire: 'Tom Wilson',
        base_umpire: 'David Brown',
        concession_stand: 'Yes'
    },
    {
        season: 'Spring',
        event_type: 'Softball',
        day: 'Sunday',
        date: '2024-03-16',
        start_time: '10:00',
        am_pm: 'AM',
        division: '12U',
        home_team: 'Thunder',
        home_coach: 'Emily White',
        visitor_team: 'Lightning',
        visitor_coach: 'Alex Chen',
        venue: 'Memorial Field',
        plate_umpire: 'Pat Johnson',
        base_umpire: 'Sam Miller',
        concession_stand: 'No'
    },
    {
        season: 'Spring',
        event_type: 'Softball',
        day: 'Sunday',
        date: '2024-03-16',
        start_time: '11:30',
        am_pm: 'AM',
        division: '12U',
        home_team: 'Storm',
        home_coach: 'Rachel Green',
        visitor_team: 'Cyclone',
        visitor_coach: 'Mark Taylor',
        venue: 'Memorial Field',
        plate_umpire: 'Pat Johnson',
        base_umpire: 'Sam Miller',
        concession_stand: 'No'
    },
    {
        season: 'Spring',
        event_type: 'Baseball',
        day: 'Saturday',
        date: '2024-03-22',
        start_time: '6:00',
        am_pm: 'PM',
        division: 'Senior 11/12',
        home_team: 'Warriors',
        home_coach: 'James Wilson',
        visitor_team: 'Knights',
        visitor_coach: 'Dan Martinez',
        venue: 'Central Park',
        plate_umpire: 'Tom Wilson',
        base_umpire: 'David Brown',
        concession_stand: 'Yes'
    },
    {
        season: 'Summer',
        event_type: 'Baseball',
        day: 'Tuesday',
        date: '2024-06-10',
        start_time: '6:00',
        am_pm: 'PM',
        division: 'T-Ball 6/7',
        home_team: 'Fireflies',
        home_coach: 'Robert Taylor',
        visitor_team: 'Butterflies',
        visitor_coach: 'Kim Lee',
        venue: 'Community Center',
        plate_umpire: 'Jim Davis',
        base_umpire: 'Bob Wilson',
        concession_stand: 'Yes'
    },
    {
        season: 'Summer',
        event_type: 'Softball',
        day: 'Thursday',
        date: '2024-06-12',
        start_time: '6:00',
        am_pm: 'PM',
        division: '16U',
        home_team: 'Phoenix',
        home_coach: 'Karen Johnson',
        visitor_team: 'Rebels',
        visitor_coach: 'Scott Brown',
        venue: 'Memorial Field',
        plate_umpire: 'Pat Johnson',
        base_umpire: 'Sam Miller',
        concession_stand: 'Yes'
    },
    {
        season: 'Fall',
        event_type: 'Baseball',
        day: 'Saturday',
        date: '2024-09-07',
        start_time: '5:00',
        am_pm: 'PM',
        division: 'Senior 13/16',
        home_team: 'Giants',
        home_coach: 'Chris Anderson',
        visitor_team: 'Titans',
        visitor_coach: 'Mark Johnson',
        venue: 'Central Park',
        plate_umpire: 'Tom Wilson',
        base_umpire: 'David Brown',
        concession_stand: 'Yes'
    }
];

// Sample umpire requests
const sampleUmpireRequests = [
    {
        game_id: 1,
        current_plate_umpire: 'Tom Wilson',
        current_base_umpire: 'David Brown',
        requested_plate_umpire: 'Mike Johnson',
        requested_base_umpire: null,
        reason: 'Schedule conflict with another game',
        status: 'pending'
    },
    {
        game_id: 3,
        current_plate_umpire: 'Pat Johnson',
        current_base_umpire: 'Sam Miller',
        requested_plate_umpire: null,
        requested_base_umpire: 'Alex Chen',
        reason: 'Base umpire unavailable due to injury',
        status: 'approved'
    }
];

console.log('🏟️  Populating Baseball/Softball Schedule Manager with demo data...\n');

// Insert sample schedules
db.serialize(() => {
    // Clear existing data
    db.run('DELETE FROM umpire_requests', (err) => {
        if (err) console.error('Error clearing umpire requests:', err);
    });
    
    db.run('DELETE FROM schedules', (err) => {
        if (err) console.error('Error clearing schedules:', err);
    });

    // Insert schedules
    const insertSchedule = db.prepare(`
        INSERT INTO schedules (
            season, event_type, day, date, start_time, am_pm, division,
            home_team, home_coach, visitor_team, visitor_coach,
            venue, plate_umpire, base_umpire, concession_stand
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sampleSchedules.forEach((schedule, index) => {
        insertSchedule.run([
            schedule.season, schedule.event_type, schedule.day, schedule.date,
            schedule.start_time, schedule.am_pm, schedule.division,
            schedule.home_team, schedule.home_coach, schedule.visitor_team, schedule.visitor_coach,
            schedule.venue, schedule.plate_umpire, schedule.base_umpire, schedule.concession_stand
        ], function(err) {
            if (err) {
                console.error(`Error inserting schedule ${index + 1}:`, err);
            } else {
                console.log(`✅ Added schedule: ${schedule.home_team} vs ${schedule.visitor_team} on ${schedule.date}`);
            }
        });
    });

    insertSchedule.finalize((err) => {
        if (err) {
            console.error('Error finalizing schedule insertions:', err);
        } else {
            console.log('\n📅 All schedules inserted successfully!');
            
            // Insert umpire requests after schedules
            setTimeout(() => {
                insertUmpireRequests();
            }, 1000);
        }
    });
});

function insertUmpireRequests() {
    const insertRequest = db.prepare(`
        INSERT INTO umpire_requests (
            game_id, current_plate_umpire, current_base_umpire,
            requested_plate_umpire, requested_base_umpire, reason, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    sampleUmpireRequests.forEach((request, index) => {
        insertRequest.run([
            request.game_id, request.current_plate_umpire, request.current_base_umpire,
            request.requested_plate_umpire, request.requested_base_umpire, request.reason, request.status
        ], function(err) {
            if (err) {
                console.error(`Error inserting umpire request ${index + 1}:`, err);
            } else {
                console.log(`✅ Added umpire request for game ${request.game_id}`);
            }
        });
    });

    insertRequest.finalize((err) => {
        if (err) {
            console.error('Error finalizing umpire request insertions:', err);
        } else {
            console.log('\n🎯 All umpire requests inserted successfully!');
            console.log('\n🎉 Demo data population complete!');
            console.log('\n📍 Public Interface: http://localhost:3000');
            console.log('🔐 Admin Panel: http://localhost:3000/admin');
            console.log('\nYou can now test the application with the sample data.');
            
            // Close database connection
            db.close();
        }
    });
} 