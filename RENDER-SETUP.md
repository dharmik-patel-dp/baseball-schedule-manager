# Render Deployment Setup

## Quick Start (5 minutes)

### 1. Prepare Repository
- Push your code to GitHub
- Make sure `package.json` has all dependencies
- Include `server.render.js` and `render.yaml`

### 2. Create Render Account
- Go to render.com
- Sign up with GitHub
- Connect your repository

### 3. Create PostgreSQL Database
- Click "New +" → "PostgreSQL"
- Plan: Starter (free)
- Name: `baseball-db`
- Database: `baseball_schedule`
- User: `baseball_user`

### 4. Create Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Build Command: `npm install`
- Start Command: `node server.render.js`
- Plan: Starter (free)

### 5. Set Environment Variables
```
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

### 6. Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Test your app URL

## Gmail Setup
1. Enable 2-Factor Authentication
2. Go to Google Account → Security → App passwords
3. Generate app password for "Mail"
4. Use this password for EMAIL_PASS

## Cost
- **Free tier**: $0/month (with limitations)
- **Paid tier**: ~$21/month (if you need more resources)

## Default Login
- Username: `admin`
- Password: `admin123`
- **Change this after first login!**
