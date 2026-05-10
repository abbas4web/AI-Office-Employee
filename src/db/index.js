const { Pool } = require("pg");

// Create a connection pool
// Uses DATABASE_URL if available (e.g., Neon, Render, Heroku)
// Falls back to individual env vars for local development
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

/**
 * Run a parameterized query against the database.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Test the database connection on startup.
 */
const testConnection = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected successfully");
  } catch (err) {
    console.error("PostgreSQL connection failed:", err.message);
  }
};

module.exports = { query, testConnection, pool };
