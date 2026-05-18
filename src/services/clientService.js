const db = require('../db');

/**
 * Fetch clients with optional filters and pagination.
 * Returns { clients, total }.
 */
const getAllClients = async (filters = {}, pagination = {}) => {
  const { limit = 50, offset = 0 } = pagination;

  const conditions = ['1=1'];
  const params = [];
  let paramIndex = 1;

  if (filters.company) {
    conditions.push(`company ILIKE $${paramIndex++}`);
    params.push(`%${filters.company}%`);
  }

  const where = conditions.join(' AND ');

  const countResult = await db.query(
    `SELECT COUNT(*) AS total FROM clients WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataParams = [...params, limit, offset];
  const dataResult = await db.query(
    `SELECT * FROM clients
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    dataParams
  );

  return { clients: dataResult.rows, total };
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
    [name, email || null, phone || null, company || null, notes || null]
  );
  return result.rows[0];
};

/**
 * Update an existing client (only provided fields are updated).
 */
const updateClient = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowed = ['name', 'email', 'phone', 'company', 'notes'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(updates[key]);
    }
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
 * Delete a client by ID.
 */
const deleteClient = async (id) => {
  await db.query('DELETE FROM clients WHERE id = $1', [id]);
};

module.exports = { getAllClients, getClientById, createClient, updateClient, deleteClient };
