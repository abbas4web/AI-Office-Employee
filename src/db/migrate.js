/**
 * Database Migration Script
 * Run: node src/db/migrate.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const runMigration = async () => {
  const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
    : new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running schema migration...');
    await client.query(schemaSQL);
    
    console.log('Migration completed successfully!');
    console.log('Tables created: users, clients, tasks, reminders, activity_logs');
    
    client.release();
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigration();
