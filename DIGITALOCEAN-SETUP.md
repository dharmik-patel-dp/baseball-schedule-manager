# 🚀 DigitalOcean Hosting Setup Guide

This guide will help you deploy your Baseball Schedule Manager to DigitalOcean hosting with a GoDaddy domain.

## 📋 Prerequisites

- DigitalOcean account
- GoDaddy domain
- SSH key pair
- Basic command line knowledge

## 🌐 Phase 1: DigitalOcean Setup

### Step 1: Create DigitalOcean Account
1. Go to [digitalocean.com](https://digitalocean.com)
2. Sign up for an account
3. Add payment method

### Step 2: Create a Droplet
1. **Click "Create" → "Droplets"**
2. **Choose an image**: Ubuntu 22.04 LTS
3. **Choose a plan**: Basic ($12/month) - Perfect for 100-150 users
4. **Choose a datacenter region**: Choose closest to your users
5. **Authentication**: Add your SSH key
6. **Finalize and create**

### Step 3: Access Your Droplet
```bash
# Connect to your droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y
```

### Step 4: Install Required Software
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (Process Manager)
npm install -g pm2

# Install Nginx
apt install nginx -y

# Install Certbot for SSL
apt install certbot python3-certbot-nginx -y

# Install Git
apt install git -y
```

### Step 5: Create Project Directory
```bash
# Create project directory
mkdir -p /var/www/baseball
cd /var/www/baseball

# Set proper permissions
chown -R www-data:www-data /var/www/baseball
chmod -R 755 /var/www/baseball
```

## 🔧 Phase 2: Server Configuration

### Step 1: Configure Nginx
```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/baseball
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 2: Enable Site
```bash
# Enable the site
ln -s /etc/nginx/sites-available/baseball /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Step 3: Configure Firewall
```bash
# Allow SSH, HTTP, and HTTPS
ufw allow ssh
ufw allow 80
ufw allow 443

# Enable firewall
ufw enable
```

## 🌐 Phase 3: GoDaddy Domain Configuration

### Step 1: Access GoDaddy DNS
1. Log into your GoDaddy account
2. Go to "My Products" → "DNS"
3. Click "Manage" next to your domain

### Step 2: Update DNS Records
1. **Find the A record** (usually named `@`)
2. **Change the value** to your DigitalOcean droplet IP
3. **Save changes**

DNS Configuration:
```
Type: A
Name: @ (or leave blank)
Value: YOUR_DROPLET_IP
TTL: 600 (or default)
```

### Step 3: Wait for DNS Propagation
- DNS changes can take 15 minutes to 48 hours
- You can check propagation at [whatsmydns.net](https://whatsmydns.net)

## 🚀 Phase 4: Deploy Your Project

### Step 1: Upload Your Code
```bash
# From your local machine
cd /path/to/your/baseball/project

# Upload to DigitalOcean
scp -r . root@YOUR_DROPLET_IP:/var/www/baseball/
```

### Step 2: Install Dependencies
```bash
# On your droplet
cd /var/www/baseball
npm install --production
```

### Step 3: Start Your Application
```bash
# Start with PM2
pm2 start server.prod.js --name "baseball-app"

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
```

## 🔒 Phase 5: SSL Certificate Setup

### Step 1: Get SSL Certificate
```bash
# Get SSL certificate from Let's Encrypt
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Step 2: Auto-renewal
```bash
# Test auto-renewal
certbot renew --dry-run

# Add to crontab for auto-renewal
crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Phase 6: Monitoring & Maintenance

### Step 1: Set Up Logs
```bash
# Create log directory
mkdir -p /var/log/baseball

# Set permissions
chown -R www-data:www-data /var/log/baseball
```

### Step 2: Monitor Your App
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs baseball-app

# Monitor resources
pm2 monit
```

### Step 3: Set Up Backups
```bash
# Create backup script
nano /root/backup-baseball.sh
```

Backup script content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/baseball"
mkdir -p $BACKUP_DIR

# Backup database
cp /var/www/baseball/schedules.db $BACKUP_DIR/schedules_$DATE.db

# Backup application files
tar -czf $BACKUP_DIR/baseball_$DATE.tar.gz /var/www/baseball

# Keep only last 7 backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

## 🎯 Phase 7: Testing & Verification

### Step 1: Test Your Application
1. **Public Interface**: Visit `https://your-domain.com`
2. **Admin Login**: Visit `https://your-domain.com/admin-login`
3. **Admin Panel**: Login with `admin` / `admin123`

### Step 2: Security Checklist
- [ ] HTTPS is working
- [ ] Admin panel is protected
- [ ] Firewall is configured
- [ ] SSL certificate is valid
- [ ] Default passwords are changed

## 💰 Cost Breakdown

| Service | Monthly Cost | Annual Cost |
|---------|--------------|-------------|
| **DigitalOcean Droplet** | $12 | $144 |
| **GoDaddy Domain** | $2.92 | $35 |
| **Total** | **$14.92** | **$179** |

## 🔧 Troubleshooting

### Common Issues:

#### 1. App Not Starting
```bash
# Check PM2 logs
pm2 logs baseball-app

# Check if port 3000 is in use
netstat -tlnp | grep :3000
```

#### 2. Nginx Errors
```bash
# Check Nginx status
systemctl status nginx

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

#### 3. SSL Issues
```bash
# Check SSL certificate
certbot certificates

# Renew manually if needed
certbot renew
```

## 📚 Additional Resources

- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

## 🎉 Congratulations!

Your Baseball Schedule Manager is now running on professional hosting with:
- ✅ **99.99% uptime** guarantee
- ✅ **HTTPS security** with SSL
- ✅ **Professional infrastructure**
- ✅ **Automatic scaling** capabilities
- ✅ **Professional support** available

**Your Baseball project is now enterprise-grade!** ⚾🚀
