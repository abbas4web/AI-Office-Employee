const clientService = require('../services/clientService');
const { logActivity } = require('../services/activityService');

/**
 * GET /clients
 * Returns all clients with optional filtering.
 */
const getClients = async (req, res, next) => {
  try {
    const { company } = req.query;
    const clients = await clientService.getAllClients({ company });
    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /clients/:id
 * Returns a single client by ID.
 */
const getClient = async (req, res, next) => {
  try {
    const client = await clientService.getClientById(req.params.id);

    if (!client) {
      const error = new Error('Client not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /clients
 * Creates a new client.
 */
const createClient = async (req, res, next) => {
  try {
    const { name, email, phone, company, notes } = req.body;

    if (!name) {
      const error = new Error('Name is required');
      error.statusCode = 400;
      return next(error);
    }

    const client = await clientService.createClient({
      name, email, phone, company, notes
    });

    // Log activity
    await logActivity(req.user?.id, 'CREATE', 'client', client.id, { name: client.name });

    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /clients/:id
 * Updates an existing client.
 */
const updateClient = async (req, res, next) => {
  try {
    const { name, email, phone, company, notes } = req.body;

    const existingClient = await clientService.getClientById(req.params.id);
    if (!existingClient) {
      const error = new Error('Client not found');
      error.statusCode = 404;
      return next(error);
    }

    const client = await clientService.updateClient(req.params.id, {
      name, email, phone, company, notes
    });

    // Log activity
    await logActivity(req.user?.id, 'UPDATE', 'client', client.id, { name: client.name });

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /clients/:id
 * Deletes a client.
 */
const deleteClient = async (req, res, next) => {
  try {
    const existingClient = await clientService.getClientById(req.params.id);
    if (!existingClient) {
      const error = new Error('Client not found');
      error.statusCode = 404;
      return next(error);
    }

    await clientService.deleteClient(req.params.id);

    // Log activity
    await logActivity(req.user?.id, 'DELETE', 'client', req.params.id, { name: existingClient.name });

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };
