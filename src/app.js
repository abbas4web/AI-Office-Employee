const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const clientRoutes = require('./routes/clientRoutes');
const cronRoutes = require('./routes/cronRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const debugRoutes = require('./routes/debugRoutes');
const activityRoutes = require('./routes/activityRoutes');
const aiRoutes = require('./routes/aiRoutes');
const gmailRoutes = require('./routes/gmailRoutes');
const emailRoutes = require('./routes/emailRoutes');
const errorHandler = require('./middleware/errorHandler');
const { protect } = require('./middleware/authMiddleware');
const { apiLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Always allow localhost in development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
    },
    credentials: true,
  })
);

// ─── Request Logging ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── Health Check (public, no auth, no rate limit) ───────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'AI Office Employee API is running', version: '1.0.0' });
});

// ─── Public Routes ────────────────────────────────────────────────────────────
// Auth routes get their own stricter rate limiter
app.use('/api/auth', authLimiter, authRoutes);

// Gmail OAuth callback must be public (Google redirects here)
app.use('/api/gmail', gmailRoutes);

// ─── Protected Routes (JWT required) ─────────────────────────────────────────
app.use('/api/users', protect, userRoutes);
app.use('/api/tasks', protect, taskRoutes);
app.use('/api/clients', protect, clientRoutes);
app.use('/api/cron', protect, cronRoutes);
app.use('/api/reminders', protect, reminderRoutes);
app.use('/api/debug', protect, debugRoutes);
app.use('/api/activity-logs', protect, activityRoutes);
app.use('/api/email', protect, emailRoutes);

// AI routes get their own rate limiter (Groq API cost control)
app.use('/api/ai', protect, aiLimiter, aiRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
