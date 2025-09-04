# Baseball Schedule Manager - PostgreSQL Setup

## 🎯 Overview

This is a complete PostgreSQL setup for your Baseball Schedule Manager on Render. Everything is configured and ready to deploy!

## 📁 Files Included

### Core Application Files:
- `server.render.js` - PostgreSQL version of your server
- `render.yaml` - Render deployment configuration
- `package.json` - Updated with PostgreSQL dependencies

### Database Files:
- `pg-schema.sql` - Complete PostgreSQL database schema
- `scripts/migrate-sqlite-to-postgres.js` - Migration script from SQLite
- `scripts/test-postgres-connection.js` - Connection test script

### Documentation:
- `RENDER-POSTGRES-SETUP.md` - Complete setup guide
- `PG-ENVIRONMENT.md` - Environment variables guide
- `RENDER-CHECKLIST.md` - Step-by-step checklist

## 🚀 Quick Deploy (5 minutes)

### 1. Push to GitHub
```bash
./deploy-render.sh
```

### 2. Create Render Services
1. **PostgreSQL Database** (Starter plan - free)
2. **Web Service** (Starter plan - free)

### 3. Set Environment Variables
Copy from PostgreSQL service → Web service environment

### 4. Deploy!
Click "Create Web Service" and wait 5-10 minutes

## 🗄️ Database Schema

### Tables Created:
- `admin_users` - Admin authentication
- `schedules` - Game schedules with all details
- `plate_umpires` - Plate umpire directory
- `base_umpires` - Base umpire directory
- `concession_staff` - Concession staff directory
- `umpire_requests` - Umpire change requests
- `concession_staff_requests` - Concession staff requests
- `game_reminder_logs` - Email reminder tracking
- `season_visibility` - Season visibility settings
- `staff_directory` - General staff directory

### Sample Data Included:
- Default admin user (admin/admin123)
- Sample schedules for 2024 season
- Sample umpires and concession staff
- Test data for immediate functionality

## 🔧 Environment Variables

### Required for Render:
```env
NODE_ENV=production
PORT=10000
SESSION_SECRET=your-random-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
DB_DRIVER=postgres
PGHOST=[from PostgreSQL service]
PGPORT=[from PostgreSQL service]
PGUSER=[from PostgreSQL service]
PGPASSWORD=[from PostgreSQL service]
PGDATABASE=[from PostgreSQL service]
PGSSLMODE=require
```

## 🧪 Testing

### Test PostgreSQL Connection:
```bash
npm run pg:setup
node scripts/test-postgres-connection.js
```

### Test Migration (if you have existing SQLite data):
```bash
npm run pg:migrate
```

## 💰 Cost

### Free Tier (Perfect for 100-150 users):
- **Web Service**: $0/month
- **PostgreSQL**: $0/month
- **Total**: $0/month

### Paid Tier (if needed):
- **Web Service**: $7/month
- **PostgreSQL**: $7/month
- **Total**: ~$14/month

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ Session-based authentication
- ✅ Rate limiting on login
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ SQL injection protection
- ✅ HTTPS enforcement

## 📧 Email Features

- ✅ Gmail SMTP integration
- ✅ Request notifications to admin
- ✅ Approval/rejection notifications
- ✅ Assignment notifications
- ✅ Game reminder system (30 min before)
- ✅ HTML email templates

## 🎾 Features Included

### Public Website:
- View game schedules
- Submit umpire change requests
- Submit concession staff requests
- Responsive design

### Admin Panel:
- Manage schedules
- Manage umpires and staff
- Approve/reject requests
- CSV bulk upload
- Email management
- Game reminders

### Database Features:
- PostgreSQL with connection pooling
- Automatic table creation
- Sample data insertion
- Migration from SQLite
- Performance indexes

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check `package.json` dependencies
   - Verify build command: `npm install`

2. **Database Connection Error**
   - Verify all `PG*` environment variables
   - Check PostgreSQL service status
   - Ensure `PGSSLMODE=require`

3. **Email Not Working**
   - Verify Gmail app password
   - Check 2FA is enabled
   - Test email configuration

4. **Admin Login Issues**
   - Check `SESSION_SECRET` is set
   - Verify database connection
   - Check browser console

### Getting Help:
- Check Render logs
- Review application logs
- Test with provided scripts
- Verify environment variables

## 🎉 Success!

Once deployed, you'll have:
- ✅ Production-ready application
- ✅ PostgreSQL database
- ✅ Email notifications
- ✅ Admin management
- ✅ Public website
- ✅ Automatic HTTPS
- ✅ Scalable hosting

## 📞 Support

If you need help:
1. Check the logs first
2. Verify environment variables
3. Test database connection
4. Review the setup guides

Your Baseball Schedule Manager is ready for production! 🎾
