const db = require('../db');

/**
 * Fetch all users from the database.
 */
const getAllUsers = async () => {
  const result = await db.query('SELECT id, name, email, role FROM users ORDER BY created_at ASC');
  return result.rows;
};

/**
 * Fetch a single user by ID.
 * @param {string} id - UUID
 */
const getUserById = async (id) => {
  const result = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Create a new user.
 * @param {string} name
 * @param {string} email
 */
const createUser = async (name, email) => {
  const result = await db.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, role',
    [name, email]
  );
  return result.rows[0];
};

/**
 * Update an existing user (partial update).
 * @param {string} id
 * @param {{ name?: string, email?: string, role?: string }} updates
 */
const updateUser = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.role !== undefined) {
    fields.push(`role = $${paramIndex++}`);
    values.push(updates.role);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const result = await db.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, role`,
    values
  );
  return result.rows[0];
};

/**
 * Delete a user by ID.
 * @param {string} id
 */
const deleteUser = async (id) => {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
