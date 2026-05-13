const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * GET /api/users
 * Returns all users (excluding password_hash).
 */
const getUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * GET /api/users/:id
 */
const getUser = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) {
      const e = new Error('User not found'); e.statusCode = 404; return next(e);
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * POST /api/users
 * Admin creates a new employee with a hashed password.
 * Body: { name, email, password, role }
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      const e = new Error('Name, email, and password are required');
      e.statusCode = 400; return next(e);
    }
    if (password.length < 6) {
      const e = new Error('Password must be at least 6 characters');
      e.statusCode = 400; return next(e);
    }

    // Check duplicate
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (exists.rows.length) {
      const e = new Error('A user with this email already exists');
      e.statusCode = 409; return next(e);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase().trim(), passwordHash, role || 'employee']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/users/:id
 * Update name, email, or role. Optionally reset password.
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;

    const existing = await db.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) {
      const e = new Error('User not found'); e.statusCode = 404; return next(e);
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    let i = 1;

    if (name)  { fields.push(`name = $${i++}`);  values.push(name); }
    if (email) { fields.push(`email = $${i++}`); values.push(email.toLowerCase().trim()); }
    if (role)  { fields.push(`role = $${i++}`);  values.push(role); }
    if (password && password.length >= 6) {
      const hash = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${i++}`);
      values.push(hash);
    }

    if (!fields.length) {
      const e = new Error('Nothing to update'); e.statusCode = 400; return next(e);
    }

    values.push(req.params.id);
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, name, email, role, created_at`,
      values
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/users/:id
 * Admin deletes an employee. Cannot delete yourself.
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      const e = new Error('You cannot delete your own account');
      e.statusCode = 400; return next(e);
    }
    const existing = await db.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) {
      const e = new Error('User not found'); e.statusCode = 404; return next(e);
    }
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) { next(err); }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
