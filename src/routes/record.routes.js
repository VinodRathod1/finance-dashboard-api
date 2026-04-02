const express = require('express');
const router = express.Router();
const recordController = require('../controllers/record.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// POST / → Create a new financial record (admin and analyst only)
router.post(
    '/',
    authenticate,
    requireRole('admin', 'analyst'),
    recordController.createRecord
);

// GET / → Get all records with optional filtering and pagination (all roles)
router.get(
    '/',
    authenticate,
    requireRole('admin', 'analyst', 'viewer'),
    recordController.getAllRecords
);

// GET /:id → Get a single record by ID (all roles)
router.get(
    '/:id',
    authenticate,
    requireRole('admin', 'analyst', 'viewer'),
    recordController.getRecordById
);

// PUT /:id → Update a record (admin and analyst only)
router.put(
    '/:id',
    authenticate,
    requireRole('admin', 'analyst'),
    recordController.updateRecord
);

// DELETE /:id → Soft delete a record (admin only)
router.delete(
    '/:id',
    authenticate,
    requireRole('admin'),
    recordController.deleteRecord
);

module.exports = router;
