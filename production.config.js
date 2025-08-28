// Production Configuration for DigitalOcean Hosting
module.exports = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: 'production',
  
  // Security Configuration
  sessionSecret: process.env.SESSION_SECRET || 'your-super-secure-session-secret-change-this-in-production',
  secureCookies: true,
  corsOrigin: process.env.CORS_ORIGIN || 'https://your-domain.com',
  
  // Database Configuration
  dbPath: '/var/www/baseball/schedules.db',
  
  // Logging Configuration
  logLevel: 'info',
  logFile: '/var/log/baseball/app.log',
  
  // Performance Configuration
  nodeOptions: '--max-old-space-size=512',
  
  // SSL Configuration
  ssl: {
    enabled: true,
    key: '/etc/ssl/private/your-domain.key',
    cert: '/etc/ssl/certs/your-domain.crt'
  }
};
