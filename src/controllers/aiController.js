const { sendPromptWithContext, getTaskSummaryJSON, getProductivitySuggestions } = require('../services/groqService');
const { sendReminderEmail } = require('../services/emailService');
const db = require('../db');

/**
 * POST /api/ai/ask
 * Fetches ALL portal data from DB and injects it as context,
 * including the currently logged-in user from the JWT.
 */
const askAI = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const currentUser = req.user; // from JWT middleware

    if (!prompt || !prompt.trim()) {
      const err = new Error('Prompt is required');
      err.statusCode = 400;
      return next(err);
    }

    // --- Fetch all portal data in parallel ---
    const [tasksResult, clientsResult, usersResult, remindersResult, activityResult] = await Promise.all([
      // Tasks with assignee and client names
      db.query(
        `SELECT t.title, t.description, t.priority, t.status, t.due_date,
                u.name AS assigned_to, c.name AS client_name
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         LEFT JOIN clients c ON t.client_id = c.id
         ORDER BY t.due_date ASC NULLS LAST
         LIMIT 30`,
        []
      ),
      // All clients
      db.query(
        `SELECT name, company, email, phone, notes FROM clients ORDER BY name LIMIT 20`,
        []
      ),
      // All users/employees
      db.query(
        `SELECT name, email, role FROM users ORDER BY name`,
        []
      ),
      // Upcoming/unread reminders
      db.query(
        `SELECT r.title, r.message, r.is_read, t.title AS task_title
         FROM reminders r
         LEFT JOIN tasks t ON r.task_id = t.id
         ORDER BY r.created_at DESC LIMIT 10`,
        []
      ),
      // Recent activity
      db.query(
        `SELECT al.action, al.entity_type, al.details, al.created_at, u.name AS performed_by
         FROM activity_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC LIMIT 10`,
        []
      ),
    ]);

    // --- Build full context string ---
    let context = '=== PORTAL DATA ===\n\n';

    // Current logged-in user
    context += `CURRENTLY LOGGED IN USER:\n`;
    context += `  Name: ${currentUser.name}\n`;
    context += `  Email: ${currentUser.email}\n`;
    context += `  Role: ${currentUser.role}\n\n`;

    // Tasks
    const tasks = tasksResult.rows;
    context += `TASKS (${tasks.length} total):\n`;
    if (tasks.length > 0) {
      tasks.forEach((t, i) => {
        context += `  ${i + 1}. [${(t.priority || 'medium').toUpperCase()}] "${t.title}"`;
        context += ` | Status: ${t.status}`;
        if (t.assigned_to)  context += ` | Assigned to: ${t.assigned_to}`;
        if (t.client_name)  context += ` | Client: ${t.client_name}`;
        if (t.due_date)     context += ` | Due: ${new Date(t.due_date).toLocaleDateString('en-IN')}`;
        context += '\n';
      });
    } else {
      context += '  No tasks found.\n';
    }

    // Clients
    const clients = clientsResult.rows;
    context += `\nCLIENTS (${clients.length} total):\n`;
    if (clients.length > 0) {
      clients.forEach((c, i) => {
        context += `  ${i + 1}. ${c.name}`;
        if (c.company) context += ` (${c.company})`;
        if (c.email)   context += ` — ${c.email}`;
        if (c.phone)   context += ` | ${c.phone}`;
        context += '\n';
      });
    } else {
      context += '  No clients found.\n';
    }

    // Users/Employees
    const users = usersResult.rows;
    context += `\nEMPLOYEES / USERS (${users.length} total):\n`;
    users.forEach((u, i) => {
      context += `  ${i + 1}. ${u.name} — ${u.email} (${u.role})\n`;
    });

    // Reminders
    const reminders = remindersResult.rows;
    context += `\nREMINDERS (${reminders.length} recent):\n`;
    if (reminders.length > 0) {
      reminders.forEach((r, i) => {
        context += `  ${i + 1}. "${r.title}" — ${r.message}`;
        if (r.task_title) context += ` (Task: ${r.task_title})`;
        context += ` | Read: ${r.is_read ? 'Yes' : 'No'}\n`;
      });
    } else {
      context += '  No reminders found.\n';
    }

    // Recent Activity
    const activity = activityResult.rows;
    context += `\nRECENT ACTIVITY (last ${activity.length} events):\n`;
    if (activity.length > 0) {
      activity.forEach((a, i) => {
        const when = new Date(a.created_at).toLocaleString('en-IN');
        const detail = a.details?.title || a.details?.name || '';
        context += `  ${i + 1}. ${a.performed_by || 'System'} ${a.action} ${a.entity_type}`;
        if (detail) context += ` "${detail}"`;
        context += ` at ${when}\n`;
      });
    } else {
      context += '  No recent activity.\n';
    }

    context += '\n=== END OF PORTAL DATA ===\n';

    const aiMessage = await sendPromptWithContext(context, prompt.trim());

    // Check if the AI decided to call a tool
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      
      if (toolCall.function.name === 'send_email_reminder') {
        const args = JSON.parse(toolCall.function.arguments);
        
        try {
          await sendReminderEmail(args.to_email, {
            reminderTitle: 'Task Reminder from AI Assistant',
            message: args.message,
            taskTitle: args.task_title,
            dueDate: args.due_date || 'N/A'
          });
          
          return res.json({ 
            success: true, 
            reply: `✅ I have successfully sent an email reminder to **${args.to_email}** regarding the task **"${args.task_title}"**.` 
          });
        } catch (error) {
          console.error("Failed to send AI email:", error);
          return res.json({ 
            success: true, 
            reply: `⚠️ I tried to send an email to **${args.to_email}**, but there was a server error connecting to the email service.` 
          });
        }
      }
    }

    // Normal text response fallback
    res.json({ success: true, reply: aiMessage.content });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/task-summary
 * Fetches all tasks from DB, identifies urgent/overdue work,
 * and asks Groq to return a structured JSON daily summary.
 */
const taskSummary = async (req, res, next) => {
  try {
    const now = new Date();

    // Fetch all tasks with assignee info
    const result = await db.query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date,
              u.name AS assigned_to, c.name AS client_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN clients c ON t.client_id = c.id
       ORDER BY t.due_date ASC NULLS LAST`,
      []
    );

    const tasks = result.rows;

    // Pre-classify tasks (gives Groq cleaner input)
    const urgentTasks   = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
    const overdueTasks  = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed');
    const pendingTasks  = tasks.filter(t => t.status === 'pending');
    const inProgress    = tasks.filter(t => t.status === 'in_progress');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    // Build compact task list for the prompt
    const formatTask = (t) => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : null,
      assigned_to: t.assigned_to || null,
      client: t.client_name || null,
      is_overdue: t.due_date ? new Date(t.due_date) < now : false,
    });

    const taskPayload = {
      today: now.toISOString().split('T')[0],
      stats: {
        total: tasks.length,
        urgent: urgentTasks.length,
        overdue: overdueTasks.length,
        pending: pendingTasks.length,
        in_progress: inProgress.length,
        completed: completedTasks.length,
      },
      all_tasks: tasks.map(formatTask),
    };

    const summaryJSON = await getTaskSummaryJSON(taskPayload);
    res.json({ success: true, data: summaryJSON });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/productivity
 * Analyzes tasks + team workload and returns short, professional suggestions:
 * top priority, risks, workload issues, quick wins, productivity score.
 */
const productivitySuggestions = async (req, res, next) => {
  try {
    const now = new Date();

    // Fetch tasks + team size in parallel
    const [tasksResult, usersResult] = await Promise.all([
      db.query(
        `SELECT t.title, t.priority, t.status, t.due_date,
                u.name AS assigned_to
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         ORDER BY t.due_date ASC NULLS LAST
         LIMIT 30`,
        []
      ),
      db.query(`SELECT COUNT(*) AS total FROM users`, []),
    ]);

    const tasks = tasksResult.rows.map(t => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
      assigned_to: t.assigned_to || 'Unassigned',
      due_date: t.due_date ? t.due_date.toISOString().split('T')[0] : null,
      is_overdue: t.due_date && new Date(t.due_date) < now && t.status !== 'completed',
    }));

    const payload = {
      today: now.toISOString().split('T')[0],
      team_size: parseInt(usersResult.rows[0].total),
      task_count: tasks.length,
      urgent_count: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
      overdue_count: tasks.filter(t => t.is_overdue).length,
      pending_count: tasks.filter(t => t.status === 'pending').length,
      in_progress_count: tasks.filter(t => t.status === 'in_progress').length,
      completed_count: tasks.filter(t => t.status === 'completed').length,
      tasks,
    };

    const result = await getProductivitySuggestions(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { askAI, taskSummary, productivitySuggestions };
