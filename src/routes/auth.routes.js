const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /register → auth.controller.register
router.post('/register', authController.register);

// POST /login → auth.controller.login
router.post('/login', authController.login);

module.exports = router;
