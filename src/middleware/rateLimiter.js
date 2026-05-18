const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter — applies to all /api routes.
 * 100 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Strict limiter for auth endpoints (login/register).
 * 10 attempts per 15 minutes per IP — prevents brute force.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
});

/**
 * AI endpoint limiter — Groq API calls are expensive.
 * 30 requests per 15 minutes per IP.
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait before sending more.',
  },
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
