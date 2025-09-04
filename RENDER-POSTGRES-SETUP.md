# Complete Render + PostgreSQL Setup Guide

## 🚀 Quick Start (20 minutes)

### Step 1: Push Your Code to GitHub
```bash
# Run the deployment script
./deploy-render.sh
```

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### Step 3: Create PostgreSQL Database
1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Configure:
   - **Name**: `baseball-db`
   - **Plan**: `Starter` (free)
   - **Database Name**: `baseball_schedule`
   - **User**: `baseball_user`
4. Click **"Create Database"**
5. Wait for status to show **"Available"** (2-3 minutes)

### Step 4: Create Web Service
1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Select your repository
5. Configure:
   - **Name**: `baseball-schedule-manager`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.render.js`
   - **Plan**: `Starter` (free)

### Step 5: Set Environment Variables
In your web service settings, go to **"Environment"** and add:

```env
NODE_ENV=production
PORT=10000
SESSION_SECRET=your-super-secret-random-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
DB_DRIVER=postgres
PGHOST=[copy from PostgreSQL service]
PGPORT=[copy from PostgreSQL service]
PGUSER=[copy from PostgreSQL service]
PGPASSWORD=[copy from PostgreSQL service]
PGDATABASE=[copy from PostgreSQL service]
PGSSLMODE=require
```

**To get PostgreSQL connection details:**
1. Go to your PostgreSQL service
2. Click on **"Connections"** tab
3. Copy the connection details

### Step 6: Set Up Gmail App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Factor Authentication** if not already enabled
3. Go to **"App passwords"**
4. Generate a new app password for **"Mail"**
5. Use this password for `EMAIL_PASS` (not your regular Gmail password)

### Step 7: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Check the logs for any errors

### Step 8: Test Your Application
1. Visit your app URL (provided by Render)
2. Test the public website
3. Test admin login: `admin` / `admin123`
4. **Important**: Change the admin password after first login!

## 📊 Database Schema

Your PostgreSQL database will include these tables:

### Core Tables:
- `admin_users` - Admin authentication
- `schedules` - Game schedules
- `plate_umpires` - Plate umpire directory
- `base_umpires` - Base umpire directory
- `concession_staff` - Concession staff directory

### Request Tables:
- `umpire_requests` - Umpire change requests
- `concession_staff_requests` - Concession staff requests

### System Tables:
- `game_reminder_logs` - Email reminder logs
- `season_visibility` - Season visibility settings
- `staff_directory` - General staff directory

## 🔧 Configuration Details

### Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ Change these immediately after deployment!**

### Environment Variables Explained
- `NODE_ENV=production` - Sets production mode
- `PORT=10000` - Render's default port
- `SESSION_SECRET` - Random string for session security
- `EMAIL_USER` - Your Gmail address
- `EMAIL_PASS` - Gmail app password (not regular password)
- `DB_DRIVER=postgres` - Use PostgreSQL instead of SQLite
- `PG*` variables - PostgreSQL connection details from Render

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check that `package.json` has all dependencies
   - Verify build command is `npm install`

2. **Database Connection Error**
   - Verify all `PG*` environment variables are set
   - Check that PostgreSQL service is "Available"
   - Ensure `PGSSLMODE=require` is set

3. **Email Not Working**
   - Verify Gmail app password is correct
   - Check that 2FA is enabled on Gmail
   - Test with a simple email first

4. **Admin Login Not Working**
   - Check that `SESSION_SECRET` is set
   - Verify database connection
   - Check browser console for errors

### Getting Help:
- Check Render logs in the dashboard
- Review application logs for errors
- Test individual endpoints with curl

## 💰 Cost Breakdown

### Free Tier (Recommended for 100-150 users):
- **Web Service**: Free (with limitations)
- **PostgreSQL**: Free (with limitations)
- **Total**: $0/month

### Paid Tier (if you need more resources):
- **Web Service**: $7/month
- **PostgreSQL**: $7/month
- **Total**: ~$14/month

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Use strong SESSION_SECRET
- [ ] Verify HTTPS is working
- [ ] Test all authentication flows
- [ ] Review email configuration

## 📁 Files Created for You

1. **`server.render.js`** - PostgreSQL version of your server
2. **`render.yaml`** - Render configuration
3. **`pg-schema.sql`** - PostgreSQL database schema
4. **`scripts/migrate-sqlite-to-postgres.js`** - Migration script
5. **`PG-ENVIRONMENT.md`** - Environment variables guide
6. **`deploy-render.sh`** - Deployment script

## 🎉 Success!

Once deployed, your Baseball Schedule Manager will have:
- ✅ Public website for viewing schedules
- ✅ Admin panel for management
- ✅ Email notifications for requests
- ✅ Game reminder system
- ✅ CSV upload functionality
- ✅ PostgreSQL database
- ✅ Automatic HTTPS
- ✅ Scalable hosting

## 📞 Support

If you encounter issues:
1. Check the Render logs first
2. Verify all environment variables
3. Test the database connection
4. Review the application logs

Your Baseball Schedule Manager is now live and ready for your 100-150 users! 🎾
