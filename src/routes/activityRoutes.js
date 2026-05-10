const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityController');

// GET /api/activity-logs
// Optional query: ?entity_type=task&action=COMPLETE&limit=50&offset=0
router.get('/', getActivityLogs);

module.exports = router;
