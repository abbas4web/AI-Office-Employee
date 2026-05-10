const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const clientRoutes = require('./routes/clientRoutes');
const cronRoutes = require('./routes/cronRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const debugRoutes = require('./routes/debugRoutes');
const activityRoutes = require('./routes/activityRoutes');
const errorHandler = require('./middleware/errorHandler');
const { protect } = require('./middleware/authMiddleware');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Public Routes ---
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Auth route is public (no JWT required)
app.use('/api/auth', authRoutes);

// --- Protected Routes (JWT required) ---
app.use('/api/users', protect, userRoutes);
app.use('/api/tasks', protect, taskRoutes);
app.use('/api/clients', protect, clientRoutes);
app.use('/api/cron', protect, cronRoutes);
app.use('/api/reminders', protect, reminderRoutes);
app.use('/api/debug', protect, debugRoutes);
app.use('/api/activity-logs', protect, activityRoutes);

// --- Error Handler (must be last) ---
app.use(errorHandler);

module.exports = app;
