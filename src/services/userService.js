const db = require('../db');

/**
 * Fetch all users from the database.
 */
const getAllUsers = async () => {
  const result = await db.query('SELECT id, name, email FROM users ORDER BY id ASC');
  return result.rows;
};

/**
 * Fetch a single user by ID.
 * @param {number} id
 */
const getUserById = async (id) => {
  const result = await db.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Create a new user.
 * @param {string} name
 * @param {string} email
 */
const createUser = async (name, email) => {
  const result = await db.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email',
    [name, email]
  );
  return result.rows[0];
};

module.exports = { getAllUsers, getUserById, createUser };
