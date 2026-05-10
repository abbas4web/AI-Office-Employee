const express = require('express');
const { query } = require('../db');
const router = express.Router();

// GET /api/debug/env - Check environment variables
router.get('/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET'
  });
});

// GET /api/debug/db - Test database connection
router.get('/db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time, COUNT(*) as task_count FROM tasks');
    res.json({
      success: true,
      dbConnected: true,
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      dbConnected: false,
      error: err.message
    });
  }
});

module.exports = router;
