const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * GET /api/users
 * Returns all users with pagination (excluding password_hash).
 * Query params: page (default 1), limit (default 50)
 */
const getUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const countResult = await db.query('SELECT COUNT(*) AS total FROM users');
    const total = parseInt(countResult.rows[0].total, 10);

    const result = await db.query(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 */
const getUser = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) {
      const e = new Error('User not found');
      e.statusCode = 404;
      return next(e);
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 * Body is pre-validated by Joi middleware (password complexity enforced there).
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check duplicate
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) {
      const e = new Error('A user with this email already exists');
      e.statusCode = 409;
      return next(e);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role || 'employee']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id
 * Body is pre-validated by Joi middleware.
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;

    const existing = await db.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) {
      const e = new Error('User not found');
      e.statusCode = 404;
      return next(e);
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (name)  { fields.push(`name = $${i++}`);  values.push(name); }
    if (email) { fields.push(`email = $${i++}`); values.push(email); }
    if (role)  { fields.push(`role = $${i++}`);  values.push(role); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${i++}`);
      values.push(hash);
    }

    if (!fields.length) {
      const e = new Error('Nothing to update');
      e.statusCode = 400;
      return next(e);
    }

    values.push(req.params.id);
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, name, email, role, created_at`,
      values
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Cannot delete your own account.
 */
const deleteUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      const e = new Error('You cannot delete your own account');
      e.statusCode = 400;
      return next(e);
    }
    const existing = await db.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) {
      const e = new Error('User not found');
      e.statusCode = 404;
      return next(e);
    }
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
