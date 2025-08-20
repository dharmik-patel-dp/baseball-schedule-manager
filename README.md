# ⚾🥎 Baseball/Softball Schedule Manager

A comprehensive, modern web application for managing baseball and softball schedules, staff directories, and concession stand operations. Built with Node.js, Express, SQLite, and Bootstrap 5.

![Baseball Schedule Manager](https://img.shields.io/badge/Baseball-Schedule%20Manager-blue?style=for-the-badge&logo=baseball)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18+-black?style=for-the-badge&logo=express)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3+-purple?style=for-the-badge&logo=bootstrap)

## 🌟 **Features**

### **📅 Schedule Management**
- **Multi-season support**: Spring, Summer, Fall seasons
- **Sport types**: Baseball and Softball
- **Team management**: Home/Visitor teams with coaches
- **Venue tracking**: Multiple field locations
- **Umpire assignment**: Plate and base umpires
- **Time management**: Date, time, and day scheduling

### **🏪 Concession Stand Operations**
- **Stand locations**: Multiple concession stands per venue
- **Staff assignment**: Track who's working each stand
- **Availability status**: Show which stands are open
- **Public display**: Real-time concession information

### **👥 Staff Directory**
- **Comprehensive profiles**: Name, email, phone, role
- **Parent information**: For youth sports organizations
- **Role management**: Staff, Coach, Umpire, Concession
- **Contact details**: Easy access to staff information

### **📊 Admin Panel**
- **Full CRUD operations**: Create, Read, Update, Delete schedules
- **Bulk CSV upload**: Import multiple schedules at once
- **Staff management**: Add, edit, remove staff members
- **Umpire requests**: Handle umpire change requests
- **Real-time updates**: Instant changes across the system

### **🌐 Public Interface**
- **Schedule viewing**: Public access to game schedules
- **Advanced filtering**: Search by season, team, venue, date
- **Concession info**: See which stands are open
- **Mobile responsive**: Works perfectly on all devices
- **Umpire requests**: Public can request umpire changes

## 🛠️ **Technology Stack**

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite3** - Lightweight database
- **Multer** - File upload handling
- **CSV Parser** - Bulk data import

### **Frontend**
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **JavaScript (ES6+)** - Dynamic functionality
- **Bootstrap 5.3** - Responsive UI framework
- **Font Awesome 6** - Icon library

### **Security & Performance**
- **Helmet.js** - Security headers
- **CORS protection** - Cross-origin security
- **Input validation** - SQL injection prevention
- **File upload limits** - 5MB max file size
- **Error handling** - Graceful error management

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 16+ 
- npm 8+
- Git

### **Installation**
```bash
# Clone the repository
git clone https://github.com/yourusername/baseball-schedule-manager.git
cd baseball-schedule-manager

# Install dependencies
npm install

# Start the application
npm start
```

### **Access Points**
- **Admin Panel**: http://localhost:3000/admin
- **Public Interface**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/*

## 📁 **Project Structure**

```
baseball-schedule-manager/
├── public/                 # Frontend files
│   ├── index.html         # Public interface
│   ├── admin.html         # Admin panel
│   ├── public.js          # Public interface logic
│   └── admin.js           # Admin panel logic
├── server.js              # Main server file
├── config.js              # Environment configuration
├── package.json           # Dependencies and scripts
├── schedules.db           # SQLite database
├── sample-schedules.csv   # Sample data for import
└── README.md              # This file
```

## 📊 **Database Schema**

### **Schedules Table**
```sql
CREATE TABLE schedules (
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
);
```

### **Staff Directory Table**
```sql
CREATE TABLE staff_directory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  role TEXT DEFAULT 'Staff',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
NODE_ENV=production          # Environment (development/production)
PORT=3000                   # Server port
DATABASE_PATH=./schedules.db # Database file path
UPLOADS_PATH=./uploads      # File upload directory
ALLOWED_ORIGINS=*           # CORS allowed origins
```

### **Available Scripts**
```bash
npm start                   # Start production server
npm run dev                 # Start development server with nodemon
npm run start:prod         # Start production server with environment
npm run build              # Build preparation (no build step required)
```

## 📤 **CSV Import Format**

The application supports bulk CSV uploads with the following format:

```csv
season,event_type,day,date,start_time,am_pm,division,home_team,home_coach,visitor_team,visitor_coach,venue,plate_umpire,base_umpire,concession_stand,concession_staff
Spring,Baseball,Saturday,2024-03-15,6:00,PM,Minor 9/10,Tigers,Alex Normandie,Lions,Mike Upton,LeBlanc Field - LeBlanc Park,Dylan LeLacheur,Scott Patenaude,Boutin Stand - LeBlanc Park,Dylan LeLacheur
```

See `sample-schedules.csv` for complete examples.

## 🌐 **Deployment**

### **Local Development**
```bash
npm run dev
```

### **Production Deployment**
```bash
npm run start:prod
```

### **Cloud Deployment Options**
- **Render.com** - Free tier available
- **Railway.app** - $5/month with 500 hours free
- **Heroku** - $7/month
- **DigitalOcean** - $6/month VPS

See `DEPLOYMENT-GUIDE.md` for detailed deployment instructions.

## 🔒 **Security Features**

- **Input validation** - Prevents SQL injection
- **File upload restrictions** - CSV files only, 5MB limit
- **CORS protection** - Configurable cross-origin access
- **Security headers** - XSS and other attack prevention
- **Error handling** - No sensitive data exposure

## 📱 **Mobile Support**

- **Responsive design** - Works on all screen sizes
- **Touch-friendly** - Optimized for mobile devices
- **Progressive Web App** - Can be added to home screen
- **Mobile-first** - Designed for mobile users first

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Bootstrap** - For the responsive UI framework
- **Font Awesome** - For the icon library
- **Express.js** - For the web framework
- **SQLite** - For the lightweight database

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/yourusername/baseball-schedule-manager/issues)
- **Documentation**: See `DEPLOYMENT-GUIDE.md` and `CSV-UPLOAD-GUIDE.md`
- **Email**: [Your Email]

---

**Made with ❤️ for Baseball and Softball communities everywhere!**

⭐ **Star this repository if you find it helpful!** 