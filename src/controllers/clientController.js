const clientService = require('../services/clientService');
const { logActivity } = require('../services/activityService');

/**
 * GET /clients
 * Returns clients with optional filtering and pagination.
 * Query params: company, page (default 1), limit (default 50)
 */
const getClients = async (req, res, next) => {
  try {
    const { company } = req.query;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const { clients, total } = await clientService.getAllClients({ company }, { limit, offset });

    res.json({
      success: true,
      data: clients,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /clients/:id
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
 * Body is pre-validated by Joi middleware.
 */
const createClient = async (req, res, next) => {
  try {
    const { name, email, phone, company, notes } = req.body;

    const client = await clientService.createClient({ name, email, phone, company, notes });
    await logActivity(req.user?.id, 'CREATE', 'client', client.id, { name: client.name });

    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /clients/:id
 * Body is pre-validated by Joi middleware.
 */
const updateClient = async (req, res, next) => {
  try {
    const existingClient = await clientService.getClientById(req.params.id);
    if (!existingClient) {
      const error = new Error('Client not found');
      error.statusCode = 404;
      return next(error);
    }

    const { name, email, phone, company, notes } = req.body;
    const client = await clientService.updateClient(req.params.id, { name, email, phone, company, notes });
    await logActivity(req.user?.id, 'UPDATE', 'client', client.id, { name: client.name });

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /clients/:id
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
    await logActivity(req.user?.id, 'DELETE', 'client', req.params.id, { name: existingClient.name });

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };
