const taskService = require('../services/taskService');
const { logActivity } = require('../services/activityService');
const { generateCompletionEmails } = require('../services/groqService');
const { sendAITaskCompletionEmails } = require('../services/emailService');
const db = require('../db');

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

    // Log activity
    await logActivity(req.user?.id, 'CREATE', 'task', task.id, { title: task.title });

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

    // Use distinct action when a task is marked as completed
    const action = status === 'completed' ? 'COMPLETE' : 'UPDATE';
    await logActivity(req.user?.id, action, 'task', task.id, {
      title: task.title,
      status: task.status,
      previous_status: existingTask.status,
    });

    // --- AI Auto Email Logic ---
    // If status changed to 'completed', send AI emails in the background
    if (status === 'completed' && existingTask.status !== 'completed') {
      // Fetch rich details for AI context
      db.query(`
        SELECT t.title, t.description, 
               u.name AS employee_name, u.email AS employee_email,
               c.name AS client_name, c.email AS client_email
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN clients c ON t.client_id = c.id
        WHERE t.id = $1
      `, [task.id]).then(async (result) => {
        if (result.rows.length > 0) {
          const tInfo = result.rows[0];
          const hasClientEmail = !!tInfo.client_email;
          const hasEmployeeEmail = !!tInfo.employee_email;
          
          if (hasClientEmail || hasEmployeeEmail) {
            try {
              console.log(`Generating AI completion emails for task ${task.id}...`);
              const aiEmails = await generateCompletionEmails({
                title: tInfo.title,
                description: tInfo.description,
                clientName: tInfo.client_name,
                employeeName: tInfo.employee_name
              });
              
              await sendAITaskCompletionEmails(
                hasClientEmail ? tInfo.client_email : null,
                hasEmployeeEmail ? tInfo.employee_email : null,
                aiEmails
              );
              console.log(`✅ AI emails sent successfully for task ${task.id}`);
            } catch (aiErr) {
              console.error(`❌ Failed to send AI completion emails for task ${task.id}:`, aiErr);
            }
          }
        }
      }).catch(err => console.error("Error fetching task details for email:", err));
    }

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

    // Log activity
    await logActivity(req.user?.id, 'DELETE', 'task', req.params.id, { title: existingTask.title });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
