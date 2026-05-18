const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validate');

// POST /api/auth/login    - public
router.post('/login', validate(schemas.login), login);

// POST /api/auth/register - public
router.post('/register', validate(schemas.register), register);

module.exports = router;
