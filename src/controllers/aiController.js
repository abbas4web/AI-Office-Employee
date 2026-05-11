const { sendPromptWithContext } = require('../services/groqService');
const db = require('../db');

/**
 * POST /api/ai/ask
 * Fetches the user's real tasks + clients from DB and injects them
 * as context so the AI can give meaningful, data-aware answers.
 * Body: { prompt: string }
 */
const askAI = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const userId = req.user?.id;

    if (!prompt || !prompt.trim()) {
      const err = new Error('Prompt is required');
      err.statusCode = 400;
      return next(err);
    }

    // --- Fetch real data from DB ---
    const [tasksResult, clientsResult] = await Promise.all([
      db.query(
        `SELECT t.title, t.description, t.priority, t.status, t.due_date,
                u.name AS assigned_to, c.name AS client
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         LEFT JOIN clients c ON t.client_id = c.id
         ORDER BY t.due_date ASC NULLS LAST
         LIMIT 20`,
        []
      ),
      db.query('SELECT name, company, email FROM clients ORDER BY name LIMIT 10', []),
    ]);

    const tasks = tasksResult.rows;
    const clients = clientsResult.rows;

    // --- Build context string ---
    let context = '=== CURRENT SYSTEM DATA ===\n\n';

    if (tasks.length > 0) {
      context += 'TASKS:\n';
      tasks.forEach((t, i) => {
        context += `${i + 1}. [${t.priority?.toUpperCase()}] "${t.title}"`;
        context += ` | Status: ${t.status}`;
        if (t.assigned_to) context += ` | Assigned: ${t.assigned_to}`;
        if (t.client)      context += ` | Client: ${t.client}`;
        if (t.due_date)    context += ` | Due: ${new Date(t.due_date).toLocaleDateString()}`;
        context += '\n';
      });
    } else {
      context += 'TASKS: None found.\n';
    }

    if (clients.length > 0) {
      context += '\nCLIENTS:\n';
      clients.forEach((c, i) => {
        context += `${i + 1}. ${c.name}`;
        if (c.company) context += ` (${c.company})`;
        if (c.email)   context += ` — ${c.email}`;
        context += '\n';
      });
    }

    context += '\n=== END OF DATA ===\n';

    const reply = await sendPromptWithContext(context, prompt.trim());
    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};

module.exports = { askAI };
