const db = require('../db');

/**
 * Fetch all tasks with optional filters.
 */
const getAllTasks = async (filters = {}) => {
  let sql = `
    SELECT t.*, 
           u.name as assigned_user_name,
           c.name as client_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN clients c ON t.client_id = c.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.status) {
    sql += ` AND t.status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.priority) {
    sql += ` AND t.priority = $${paramIndex++}`;
    params.push(filters.priority);
  }

  if (filters.assigned_to) {
    sql += ` AND t.assigned_to = $${paramIndex++}`;
    params.push(filters.assigned_to);
  }

  sql += ' ORDER BY t.created_at DESC';

  const result = await db.query(sql, params);
  return result.rows;
};

/**
 * Fetch a single task by ID.
 */
const getTaskById = async (id) => {
  const result = await db.query(`
    SELECT t.*, 
           u.name as assigned_user_name,
           c.name as client_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN clients c ON t.client_id = c.id
    WHERE t.id = $1
  `, [id]);
  return result.rows[0] || null;
};

/**
 * Create a new task.
 */
const createTask = async ({ title, description, priority, status, due_date, assigned_to, client_id }) => {
  const result = await db.query(
    `INSERT INTO tasks (title, description, priority, status, due_date, assigned_to, client_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title, description, priority, status, due_date, assigned_to, client_id]
  );
  return result.rows[0];
};

/**
 * Update an existing task.
 */
const updateTask = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`);
    values.push(updates.priority);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.due_date !== undefined) {
    fields.push(`due_date = $${paramIndex++}`);
    values.push(updates.due_date);
  }
  if (updates.assigned_to !== undefined) {
    fields.push(`assigned_to = $${paramIndex++}`);
    values.push(updates.assigned_to);
  }
  if (updates.client_id !== undefined) {
    fields.push(`client_id = $${paramIndex++}`);
    values.push(updates.client_id);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const result = await db.query(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Delete a task.
 */
const deleteTask = async (id) => {
  await db.query('DELETE FROM tasks WHERE id = $1', [id]);
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
