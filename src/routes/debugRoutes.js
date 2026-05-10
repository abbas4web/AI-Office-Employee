const express = require('express');
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

module.exports = router;
