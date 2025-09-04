# PostgreSQL Environment Variables for Render

## Required Environment Variables

Set these in your Render web service environment settings:

```env
# Database Configuration
DB_DRIVER=postgres
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-postgres-user
PGPASSWORD=your-postgres-password
PGDATABASE=your-postgres-database
PGSSLMODE=require

# Application Configuration
NODE_ENV=production
PORT=10000
SESSION_SECRET=your-super-secret-random-key-here

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

## How to Get PostgreSQL Connection Details

1. **Go to your Render dashboard**
2. **Click on your PostgreSQL service**
3. **Go to the "Connections" tab**
4. **Copy the connection details:**

### Example Connection Details:
```
Host: dpg-abc123-a.oregon-postgres.render.com
Port: 5432
Database: baseball_schedule
User: baseball_user
Password: your-generated-password
```

### Environment Variables Mapping:
- `PGHOST` = Host (from Connections tab)
- `PGPORT` = Port (from Connections tab)
- `PGUSER` = User (from Connections tab)
- `PGPASSWORD` = Password (from Connections tab)
- `PGDATABASE` = Database (from Connections tab)
- `PGSSLMODE` = Always set to `require` for Render

## Gmail App Password Setup

1. **Go to Google Account Security**: https://myaccount.google.com/security
2. **Enable 2-Factor Authentication** (if not already enabled)
3. **Go to "App passwords"**
4. **Generate a new app password for "Mail"**
5. **Use this password for `EMAIL_PASS`** (not your regular Gmail password)

## Session Secret

Generate a random session secret:
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## Testing Connection

After setting up environment variables, test the connection:

```bash
# Test PostgreSQL connection
psql "postgresql://username:password@host:port/database?sslmode=require"

# Or test from your application
curl https://your-app-url.onrender.com/api/schedules
```

## Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Check if PostgreSQL service is "Available"
   - Verify all connection details are correct
   - Ensure `PGSSLMODE=require` is set

2. **Authentication Failed**
   - Double-check username and password
   - Verify the user has proper permissions

3. **SSL Error**
   - Ensure `PGSSLMODE=require` is set
   - Check if SSL is properly configured

4. **Database Not Found**
   - Verify the database name is correct
   - Check if the database exists in PostgreSQL

### Getting Help:
- Check Render logs in the dashboard
- Review PostgreSQL service status
- Test connection with psql command
- Verify all environment variables are set correctly