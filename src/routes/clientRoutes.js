const express = require('express');
const router = express.Router();
const { getClients, getClient, createClient, updateClient, deleteClient } = require('../controllers/clientController');

// GET /clients          - get all clients (with optional query filters)
router.get('/', getClients);

// GET /clients/:id      - get client by ID
router.get('/:id', getClient);

// POST /clients         - create a new client
router.post('/', createClient);

// PATCH /clients/:id    - update a client
router.patch('/:id', updateClient);

// DELETE /clients/:id   - delete a client
router.delete('/:id', deleteClient);

module.exports = router;
