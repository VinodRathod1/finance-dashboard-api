const express = require('express');
const router = express.Router();
const recordController = require('../controllers/record.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.post('/', authenticate, requireRole('admin', 'analyst'), recordController.createRecord);
router.get('/', authenticate, requireRole('admin', 'analyst', 'viewer'), recordController.getAllRecords);
router.get('/:id', authenticate, requireRole('admin', 'analyst', 'viewer'), recordController.getRecordById);
router.put('/:id', authenticate, requireRole('admin', 'analyst'), recordController.updateRecord);
router.delete('/:id', authenticate, requireRole('admin'), recordController.deleteRecord);

module.exports = router;
