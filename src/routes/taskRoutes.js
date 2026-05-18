const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { validate, schemas } = require('../middleware/validate');

// GET /tasks          - get all tasks (with optional query filters + pagination)
router.get('/', getTasks);

// GET /tasks/:id      - get task by ID
router.get('/:id', getTask);

// POST /tasks         - create a new task
router.post('/', validate(schemas.createTask), createTask);

// PATCH /tasks/:id    - update a task
router.patch('/:id', validate(schemas.updateTask), updateTask);

// DELETE /tasks/:id   - delete a task
router.delete('/:id', deleteTask);

module.exports = router;
