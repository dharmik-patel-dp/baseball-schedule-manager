const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
};

async function testConnection() {
  const pool = new Pool(pgConfig);
  
  try {
    console.log('🔍 Testing PostgreSQL connection...');
    console.log('📋 Configuration:');
    console.log(`   Host: ${pgConfig.host}`);
    console.log(`   Port: ${pgConfig.port}`);
    console.log(`   Database: ${pgConfig.database}`);
    console.log(`   User: ${pgConfig.user}`);
    console.log(`   SSL: ${pgConfig.ssl ? 'Enabled' : 'Disabled'}`);
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Database Info:');
    console.log(`   Current Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].postgres_version}`);
    
    // Test table creation
    console.log('🔧 Testing table creation...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table creation test passed');
    
    // Test insert
    await client.query('INSERT INTO test_table (name) VALUES ($1)', ['Test Record']);
    console.log('✅ Insert test passed');
    
    // Test select
    const testResult = await client.query('SELECT * FROM test_table WHERE name = $1', ['Test Record']);
    console.log('✅ Select test passed');
    console.log(`   Found ${testResult.rows.length} test record(s)`);
    
    // Clean up test table
    await client.query('DROP TABLE test_table');
    console.log('🧹 Cleaned up test table');
    
    client.release();
    console.log('🎉 All tests passed! PostgreSQL is ready for your application.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('🔧 Troubleshooting:');
    console.error('   1. Check if PostgreSQL service is "Available" in Render');
    console.error('   2. Verify all environment variables are set correctly');
    console.error('   3. Ensure PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE are set');
    console.error('   4. Make sure PGSSLMODE=require is set');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run test
testConnection();
