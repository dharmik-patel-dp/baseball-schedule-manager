# 🚀 Quick Start Guide

## Baseball/Softball Schedule Manager

Get your Baseball/Softball Schedule Manager up and running in minutes!

### ⚡ Quick Setup (3 steps)

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start the Application
```bash
npm start
```

#### 3. Access the Application
- **Public Interface**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

### 🎯 What You Get

✅ **Fully Functional Web Application**
- Modern, responsive design
- SQLite database (auto-created)
- RESTful API endpoints
- Real-time filtering and updates

✅ **Admin Features**
- Create/edit/delete game schedules
- Bulk CSV import
- Manage umpire change requests
- Comprehensive schedule management

✅ **Public Features**
- View all game schedules
- Advanced filtering options
- Submit umpire change requests
- Mobile-optimized interface

### 📊 Sample Data Included

The application comes with sample data including:
- 8 sample game schedules
- 2 sample umpire change requests
- Various seasons, divisions, and teams

### 🔧 Alternative Startup Methods

#### Using the startup script:
```bash
./start.sh
```

#### Using nodemon for development:
```bash
npm run dev
```

### 📁 Key Files

- `server.js` - Main server application
- `public/index.html` - Public interface
- `public/admin.html` - Admin panel
- `public/public.js` - Public interface logic
- `public/admin.js` - Admin panel logic
- `schedules.db` - SQLite database (auto-created)

### 🎮 Testing the Application

1. **View Schedules**: Visit http://localhost:3000
2. **Admin Panel**: Visit http://localhost:3000/admin
3. **Create Schedule**: Use the admin form to add new games
4. **CSV Upload**: Try uploading the included `sample-schedules.csv`
5. **Umpire Requests**: Submit requests from the public interface

### 🚨 Troubleshooting

- **Port 3000 in use**: Change PORT in server.js or kill existing process
- **Database issues**: Delete `schedules.db` and restart
- **Dependencies**: Run `npm install` again

### 📚 Full Documentation

See `README.md` for comprehensive documentation and advanced features.

---

**Ready to manage your baseball/softball league schedules! 🏟️⚾🥎** 