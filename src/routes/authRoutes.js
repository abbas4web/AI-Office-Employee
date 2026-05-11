const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');

// POST /api/auth/login    - public
router.post('/login', login);

// POST /api/auth/register - public
router.post('/register', register);

module.exports = router;
