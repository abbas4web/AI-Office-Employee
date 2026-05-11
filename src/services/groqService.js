const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Send a prompt to Groq and return the text reply.
 * @param {string} prompt
 * @param {string} model - defaults to llama-3.1-8b-instant (fast & free)
 */
const sendPrompt = async (prompt, model = 'llama-3.1-8b-instant') => {
  const response = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for an office management system. Be concise and professional.',
      },
      { role: 'user', content: prompt },
    ],
  });

  return response.choices[0].message.content;
};

module.exports = { sendPrompt };
