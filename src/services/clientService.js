const db = require('../db');

/**
 * Fetch all clients with optional filters.
 */
const getAllClients = async (filters = {}) => {
  let sql = 'SELECT * FROM clients WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (filters.company) {
    sql += ` AND company ILIKE $${paramIndex++}`;
    params.push(`%${filters.company}%`);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await db.query(sql, params);
  return result.rows;
};

/**
 * Fetch a single client by ID.
 */
const getClientById = async (id) => {
  const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Create a new client.
 */
const createClient = async ({ name, email, phone, company, notes }) => {
  const result = await db.query(
    `INSERT INTO clients (name, email, phone, company, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, email, phone, company, notes]
  );
  return result.rows[0];
};

/**
 * Update an existing client.
 */
const updateClient = async (id, updates) => {
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
  if (updates.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(updates.phone);
  }
  if (updates.company !== undefined) {
    fields.push(`company = $${paramIndex++}`);
    values.push(updates.company);
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(updates.notes);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const result = await db.query(
    `UPDATE clients SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Delete a client.
 */
const deleteClient = async (id) => {
  await db.query('DELETE FROM clients WHERE id = $1', [id]);
};

module.exports = { getAllClients, getClientById, createClient, updateClient, deleteClient };
