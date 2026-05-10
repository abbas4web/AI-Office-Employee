/**
 * One-time migration: Add password_hash column to existing users table.
 * Run: node src/db/add_password_column.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const run = async () => {
  const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });

  try {
    console.log('Connecting to database...');

    // Add the column only if it doesn't already exist (safe to re-run)
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    `);

    console.log('✅ password_hash column added to users table.');
    console.log('   Now run: npm run seed');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
