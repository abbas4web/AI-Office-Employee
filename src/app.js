const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const clientRoutes = require('./routes/clientRoutes');
const cronRoutes = require('./routes/cronRoutes');
const debugRoutes = require('./routes/debugRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/debug', debugRoutes);

// --- Error Handler (must be last) ---
app.use(errorHandler);

module.exports = app;
