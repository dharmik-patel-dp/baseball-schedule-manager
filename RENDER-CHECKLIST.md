# Render Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Repository Setup
- [ ] Code pushed to GitHub
- [ ] `server.render.js` created (PostgreSQL version)
- [ ] `render.yaml` configuration file
- [ ] `package.json` includes `pg` dependency
- [ ] All environment variables documented

### 2. Gmail Setup
- [ ] Enable 2-Factor Authentication on Gmail
- [ ] Generate App Password for "Mail"
- [ ] Note down the app password (not regular Gmail password)

## ✅ Render Setup

### 3. Create PostgreSQL Database
- [ ] Go to render.com → "New +" → "PostgreSQL"
- [ ] Plan: Starter (free)
- [ ] Name: `baseball-db`
- [ ] Database: `baseball_schedule`
- [ ] User: `baseball_user`
- [ ] Wait for "Available" status

### 4. Create Web Service
- [ ] Go to render.com → "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select your repository
- [ ] Configure:
  - Name: `baseball-schedule-manager`
  - Environment: `Node`
  - Build Command: `npm install`
  - Start Command: `node server.render.js`
  - Plan: `Starter` (free)

### 5. Set Environment Variables
In your web service settings, add:
```
NODE_ENV=production
PORT=10000
SESSION_SECRET=your-random-secret-key-here
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
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Check logs for any errors

## ✅ Post-Deployment Testing

### 7. Test Application
- [ ] Visit your app URL
- [ ] Test public website loads
- [ ] Test admin login (admin/admin123)
- [ ] Test all CRUD operations
- [ ] Test email notifications
- [ ] Test CSV uploads

### 8. Security
- [ ] Change default admin password
- [ ] Verify HTTPS is working
- [ ] Test all endpoints

## ✅ Optional: Custom Domain
- [ ] Add custom domain in Render
- [ ] Update DNS records
- [ ] Wait for SSL certificate

## ✅ Optional: Cron Jobs
- [ ] Create Cron Job for game reminders
- [ ] Schedule: `*/5 * * * *` (every 5 minutes)
- [ ] Command: `curl -X POST https://your-app-url.onrender.com/api/admin/trigger-game-reminders`

## 🚨 Troubleshooting

### Common Issues:
1. **Build fails**: Check `package.json` dependencies
2. **Database connection**: Verify environment variables
3. **Email not working**: Check Gmail app password
4. **Session issues**: Verify SESSION_SECRET

### Getting Help:
- Check Render logs in dashboard
- Review application logs
- Test endpoints with curl

## 💰 Cost
- **Free tier**: $0/month (with limitations)
- **Paid tier**: ~$21/month (if you need more resources)

## 🎉 Success!
Your Baseball Schedule Manager is now live on Render!
