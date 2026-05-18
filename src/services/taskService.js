const db = require('../db');

/**
 * Fetch tasks with optional filters and pagination.
 * Returns { tasks, total } so the controller can build pagination metadata.
 */
const getAllTasks = async (filters = {}, pagination = {}) => {
  const { limit = 50, offset = 0 } = pagination;

  // Build WHERE clause
  const conditions = ['1=1'];
  const params = [];
  let paramIndex = 1;

  if (filters.status) {
    conditions.push(`t.status = $${paramIndex++}`);
    params.push(filters.status);
  }
  if (filters.priority) {
    conditions.push(`t.priority = $${paramIndex++}`);
    params.push(filters.priority);
  }
  if (filters.assigned_to) {
    conditions.push(`t.assigned_to = $${paramIndex++}`);
    params.push(filters.assigned_to);
  }

  const where = conditions.join(' AND ');

  // Count query (same filters, no pagination)
  const countResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     LEFT JOIN clients c ON t.client_id = c.id
     WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query with pagination
  const dataParams = [...params, limit, offset];
  const dataResult = await db.query(
    `SELECT t.*,
            u.name AS assigned_user_name,
            c.name AS client_name
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     LEFT JOIN clients c ON t.client_id = c.id
     WHERE ${where}
     ORDER BY t.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    dataParams
  );

  return { tasks: dataResult.rows, total };
};

/**
 * Fetch a single task by ID.
 */
const getTaskById = async (id) => {
  const result = await db.query(
    `SELECT t.*,
            u.name AS assigned_user_name,
            c.name AS client_name
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     LEFT JOIN clients c ON t.client_id = c.id
     WHERE t.id = $1`,
    [id]
  );
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
    [title, description || null, priority, status, due_date || null, assigned_to || null, client_id || null]
  );
  return result.rows[0];
};

/**
 * Update an existing task (only provided fields are updated).
 */
const updateTask = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowed = ['title', 'description', 'priority', 'status', 'due_date', 'assigned_to', 'client_id'];

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
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Delete a task by ID.
 */
const deleteTask = async (id) => {
  await db.query('DELETE FROM tasks WHERE id = $1', [id]);
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
