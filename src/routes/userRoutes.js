const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { validate, schemas } = require('../middleware/validate');

// GET /api/users       - get all users
router.get('/', getUsers);

// GET /api/users/:id   - get user by ID
router.get('/:id', getUser);

// POST /api/users      - create a new user (admin)
router.post('/', validate(schemas.createUser), createUser);

// PATCH /api/users/:id - update a user
router.patch('/:id', validate(schemas.updateUser), updateUser);

// DELETE /api/users/:id - delete a user
router.delete('/:id', deleteUser);

module.exports = router;
