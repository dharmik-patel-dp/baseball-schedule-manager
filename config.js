// Configuration file for different environments
const config = {
  development: {
    port: process.env.PORT || 3000,
    database: './schedules.db',
    uploads: './uploads',
    cors: {
      origin: 'http://localhost:3000',
      credentials: true
    }
  },
  production: {
    port: process.env.PORT || 3000,
    database: process.env.DATABASE_PATH || './schedules.db',
    uploads: process.env.UPLOADS_PATH || './uploads',
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
      credentials: true
    }
  }
};

// Get current environment
const env = process.env.NODE_ENV || 'development';

// Export configuration for current environment
module.exports = config[env];
