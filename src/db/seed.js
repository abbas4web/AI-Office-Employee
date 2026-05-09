/**
 * Database Seeding Script
 * Run: node src/db/seed.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const runSeeder = async () => {
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
    
    // Read seed file
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    console.log('Running seeder...');
    await client.query(seedSQL);
    
    console.log('Seed data inserted successfully!');
    console.log('Added: 3 users, 3 clients, 4 tasks, 2 reminders');
    
    client.release();
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runSeeder();
