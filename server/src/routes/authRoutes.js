const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authController.authenticateToken, authController.getMe);
router.put('/usuarios/:id', authController.authenticateToken, authController.updateUsuario);

module.exports = router; 