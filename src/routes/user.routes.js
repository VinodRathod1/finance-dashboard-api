const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validateUpdateUser, validateChangePassword } = require('../middleware/validate.middleware');

router.get('/me', authenticate, userController.getMe);
router.get('/', authenticate, requireRole('admin'), userController.getAllUsers);
router.get('/:id', authenticate, requireRole('admin', 'analyst', 'viewer'), userController.getUserById);
router.put('/:id', authenticate, requireRole('admin', 'analyst', 'viewer'), validateUpdateUser, userController.updateUser);
router.delete('/:id', authenticate, requireRole('admin'), userController.deleteUser);
router.post('/change-password', authenticate, validateChangePassword, userController.changePassword);

module.exports = router;
