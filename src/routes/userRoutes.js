const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser } = require('../controllers/userController');

// GET /api/users       - get all users
router.get('/', getUsers);

// GET /api/users/:id   - get user by ID
router.get('/:id', getUser);

// POST /api/users      - create a new user
router.post('/', createUser);

module.exports = router;
