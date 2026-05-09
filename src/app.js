const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
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

// --- Error Handler (must be last) ---
app.use(errorHandler);

module.exports = app;
