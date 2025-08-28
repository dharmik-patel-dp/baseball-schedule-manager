#!/bin/bash

# Baseball Project Deployment Script for DigitalOcean
# This script deploys your Baseball project to DigitalOcean

echo "🚀 Starting Baseball Project Deployment to DigitalOcean..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="baseball-schedule-manager"
DOMAIN="your-domain.com"  # Change this to your actual domain
DROPLET_IP="your-droplet-ip"  # Change this to your DigitalOcean droplet IP
SSH_KEY="~/.ssh/id_rsa"  # Change this to your SSH key path

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Project: ${PROJECT_NAME}"
echo -e "  Domain: ${DOMAIN}"
echo -e "  Droplet IP: ${DROPLET_IP}"
echo -e "  SSH Key: ${SSH_KEY}"

# Check if required tools are installed
echo -e "\n${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v ssh &> /dev/null; then
    echo -e "${RED}❌ SSH is not installed${NC}"
    exit 1
fi

if ! command -v scp &> /dev/null; then
    echo -e "${RED}❌ SCP is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create production build
echo -e "\n${BLUE}📦 Preparing production build...${NC}"

# Remove development files
rm -rf node_modules
rm -f .env
rm -f *.log

# Create production package
tar -czf ${PROJECT_NAME}.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.env' \
    --exclude='uploads/*' \
    --exclude='*.db' \
    .

echo -e "${GREEN}✅ Production package created: ${PROJECT_NAME}.tar.gz${NC}"

# Deploy to DigitalOcean
echo -e "\n${BLUE}🚀 Deploying to DigitalOcean...${NC}"

# Upload project files
echo -e "${YELLOW}📤 Uploading project files...${NC}"
scp -i ${SSH_KEY} ${PROJECT_NAME}.tar.gz root@${DROPLET_IP}:/var/www/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files uploaded successfully${NC}"
else
    echo -e "${RED}❌ File upload failed${NC}"
    exit 1
fi

# Execute deployment commands on server
echo -e "${YELLOW}🔧 Executing deployment commands...${NC}"
ssh -i ${SSH_KEY} root@${DROPLET_IP} << 'EOF'
    cd /var/www
    
    # Stop existing service
    pm2 stop ${PROJECT_NAME} 2>/dev/null || true
    pm2 delete ${PROJECT_NAME} 2>/dev/null || true
    
    # Extract new version
    rm -rf ${PROJECT_NAME}
    tar -xzf ${PROJECT_NAME}.tar.gz
    mv baseball ${PROJECT_NAME}
    cd ${PROJECT_NAME}
    
    # Install dependencies
    npm install --production
    
    # Set proper permissions
    chown -R www-data:www-data /var/www/${PROJECT_NAME}
    chmod -R 755 /var/www/${PROJECT_NAME}
    
    # Create necessary directories
    mkdir -p /var/log/baseball
    mkdir -p /var/www/baseball/uploads
    chown -R www-data:www-data /var/log/baseball
    chown -R www-data:www-data /var/www/baseball/uploads
    
    # Start service
    pm2 start server.prod.js --name ${PROJECT_NAME}
    pm2 save
    pm2 startup
    
    # Clean up
    rm -f /var/www/${PROJECT_NAME}.tar.gz
    
    echo "✅ Deployment completed successfully"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Clean up local files
echo -e "\n${BLUE}🧹 Cleaning up local files...${NC}"
rm -f ${PROJECT_NAME}.tar.gz

echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}🌐 Your Baseball project is now live at: https://${DOMAIN}${NC}"
echo -e "${BLUE}🔐 Admin panel: https://${DOMAIN}/admin-login${NC}"
echo -e "${BLUE}📱 Public interface: https://${DOMAIN}${NC}"

echo -e "\n${YELLOW}⚠️  Important:${NC}"
echo -e "  1. Update your GoDaddy DNS to point to ${DROPLET_IP}"
echo -e "  2. Change default admin password (admin/admin123)"
echo -e "  3. Set up SSL certificate with Let's Encrypt"
echo -e "  4. Configure firewall rules"
echo -e "  5. Set up monitoring and backups"

echo -e "\n${GREEN}🚀 Your Baseball project is now running on DigitalOcean!${NC}"
