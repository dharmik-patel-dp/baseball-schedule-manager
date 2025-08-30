# 📧 Email Notification Setup Guide

## **Environment Variables Required**

Create a `.env` file in your project root with these variables:

```bash
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Admin email addresses (comma-separated for multiple admins)
ADMIN_EMAILS=admin@baseball.com,manager@baseball.com

# Admin panel URL for email links
ADMIN_URL=http://localhost:3000/admin

# Database configuration
NODE_ENV=development
SESSION_SECRET=your-secret-key-change-in-production

# Server configuration
PORT=3000
```

## **Gmail App Password Setup**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Go to Google Account Settings** → Security
3. **Generate App Password** for "Mail"
4. **Use the generated password** as `EMAIL_PASS` (not your regular Gmail password)

## **Testing Email Notifications**

1. **Set up environment variables** in `.env` file
2. **Restart your server**
3. **Submit a request** through the public interface
4. **Check admin email** for notification
5. **Approve/reject request** in admin panel
6. **Check user email** for decision notification

## **Email Templates Available**

- ✅ **Request Submission** - Admin gets notified of new requests
- ✅ **Request Approval** - User gets notified when request is approved
- ✅ **Request Rejection** - User gets notified when request is rejected
- ✅ **Assignment Notification** - Umpires/staff get notified of new assignments

## **Customization**

Edit `email-config.js` to:
- Change email templates
- Modify sender information
- Add new notification types
- Customize email styling
