const taskService = require('../services/taskService');

/**
 * GET /tasks
 * Returns all tasks with optional filtering.
 */
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assigned_to } = req.query;
    const tasks = await taskService.getAllTasks({ status, priority, assigned_to });
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /tasks/:id
 * Returns a single task by ID.
 */
const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /tasks
 * Creates a new task.
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, due_date, assigned_to, client_id } = req.body;

    if (!title) {
      const error = new Error('Title is required');
      error.statusCode = 400;
      return next(error);
    }

    const task = await taskService.createTask({
      title,
      description,
      priority: priority || 'medium',
      status: status || 'pending',
      due_date,
      assigned_to,
      client_id
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /tasks/:id
 * Updates an existing task.
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, due_date, assigned_to, client_id } = req.body;

    const existingTask = await taskService.getTaskById(req.params.id);
    if (!existingTask) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }

    const task = await taskService.updateTask(req.params.id, {
      title,
      description,
      priority,
      status,
      due_date,
      assigned_to,
      client_id
    });

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /tasks/:id
 * Deletes a task.
 */
const deleteTask = async (req, res, next) => {
  try {
    const existingTask = await taskService.getTaskById(req.params.id);
    if (!existingTask) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }

    await taskService.deleteTask(req.params.id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
