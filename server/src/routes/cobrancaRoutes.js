const express = require('express');
const cobrancaController = require('../controllers/cobrancaController');
const authController = require('../controllers/authController');

const router = express.Router();

// Rota para buscar estatísticas para o dashboard
router.get('/estatisticas', authController.authenticateToken, cobrancaController.getEstatisticas);

// Rotas protegidas por autenticação
router.get('/', authController.authenticateToken, cobrancaController.getCobrancas);

// Rota para listar cobranças por status
router.get('/status/:status', authController.authenticateToken, cobrancaController.getCobrancasByStatus);

router.get('/cliente/:clienteId', authController.authenticateToken, cobrancaController.getCobrancasByCliente);
router.post('/', authController.authenticateToken, cobrancaController.createCobranca);

// Rota para buscar, atualizar ou excluir uma cobrança específica
router.get('/:id', authController.authenticateToken, cobrancaController.getCobrancaById);
router.put('/:id', authController.authenticateToken, cobrancaController.updateCobranca);
router.delete('/:id', authController.authenticateToken, cobrancaController.deleteCobranca);

// Rota para atualizar apenas o status de uma cobrança
router.patch('/:id/status', authController.authenticateToken, cobrancaController.updateCobrancaStatus);
router.put('/:id/pagar', authController.authenticateToken, cobrancaController.marcarComoPaga);
router.post('/:id/enviar', authController.authenticateToken, cobrancaController.enviarPorWhatsApp);

module.exports = router; 