const { sendPrompt } = require('../services/groqService');

/**
 * POST /api/ai/ask
 * Body: { prompt: string }
 */
const askAI = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      const err = new Error('Prompt is required');
      err.statusCode = 400;
      return next(err);
    }

    const reply = await sendPrompt(prompt.trim());
    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};

module.exports = { askAI };
