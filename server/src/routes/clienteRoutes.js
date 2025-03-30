const express = require('express');
const clienteController = require('../controllers/clienteController');
const authController = require('../controllers/authController');

const router = express.Router();

// Todas as rotas são protegidas pela autenticação
router.get('/', authController.authenticateToken, clienteController.getClientes);
router.get('/:id', authController.authenticateToken, clienteController.getClienteById);
router.post('/', authController.authenticateToken, clienteController.createCliente);
router.put('/:id', authController.authenticateToken, clienteController.updateCliente);
router.delete('/:id', authController.authenticateToken, clienteController.deleteCliente);

module.exports = router; 