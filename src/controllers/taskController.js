const taskService = require('../services/taskService');
const { logActivity } = require('../services/activityService');
const { generateCompletionEmails } = require('../services/groqService');
const { sendAITaskCompletionEmails } = require('../services/emailService');
const db = require('../db');

/**
 * GET /tasks
 * Returns tasks with optional filtering and pagination.
 * Query params: status, priority, assigned_to, page (default 1), limit (default 50)
 */
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assigned_to } = req.query;

    // Pagination
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const { tasks, total } = await taskService.getAllTasks(
      { status, priority, assigned_to },
      { limit, offset }
    );

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /tasks/:id
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
 * Body is pre-validated by Joi middleware.
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, due_date, assigned_to, client_id } = req.body;

    const task = await taskService.createTask({
      title,
      description,
      priority,
      status,
      due_date,
      assigned_to,
      client_id,
    });

    await logActivity(req.user?.id, 'CREATE', 'task', task.id, { title: task.title });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /tasks/:id
 * Body is pre-validated by Joi middleware.
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
      client_id,
    });

    const action = status === 'completed' ? 'COMPLETE' : 'UPDATE';
    await logActivity(req.user?.id, action, 'task', task.id, {
      title: task.title,
      status: task.status,
      previous_status: existingTask.status,
    });

    // AI auto-email on task completion (non-blocking failure)
    if (status === 'completed' && existingTask.status !== 'completed') {
      _sendCompletionEmailsAsync(task.id).catch((err) => {
        console.error(`[AI Email] Failed for task ${task.id}:`, err.message);
      });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /tasks/:id
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
    await logActivity(req.user?.id, 'DELETE', 'task', req.params.id, { title: existingTask.title });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Internal helper: fetch task details and send AI completion emails.
 * Runs fire-and-forget after the response is sent.
 */
async function _sendCompletionEmailsAsync(taskId) {
  const result = await db.query(
    `SELECT t.title, t.description,
            u.name AS employee_name, u.email AS employee_email,
            c.name AS client_name, c.email AS client_email
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     LEFT JOIN clients c ON t.client_id = c.id
     WHERE t.id = $1`,
    [taskId]
  );

  if (!result.rows.length) return;

  const tInfo = result.rows[0];
  const hasClientEmail   = !!tInfo.client_email;
  const hasEmployeeEmail = !!tInfo.employee_email;

  if (!hasClientEmail && !hasEmployeeEmail) return;

  console.log(`[AI Email] Generating completion emails for task ${taskId}...`);
  const aiEmails = await generateCompletionEmails({
    title: tInfo.title,
    description: tInfo.description,
    clientName: tInfo.client_name,
    employeeName: tInfo.employee_name,
  });

  await sendAITaskCompletionEmails(
    hasClientEmail   ? tInfo.client_email   : null,
    hasEmployeeEmail ? tInfo.employee_email : null,
    aiEmails
  );

  console.log(`[AI Email] ✅ Sent for task ${taskId}`);
}

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
