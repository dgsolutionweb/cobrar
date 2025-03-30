const express = require('express');
const empresaController = require('../controllers/empresaController');
const authController = require('../controllers/authController');
const whatsappController = require('../controllers/whatsappController');

const router = express.Router();

// Rotas públicas para registro inicial
router.post('/', empresaController.createEmpresa);

// Rotas protegidas
router.get('/', authController.authenticateToken, empresaController.getEmpresas);
router.get('/:id', authController.authenticateToken, empresaController.getEmpresaById);
router.put('/:id', authController.authenticateToken, empresaController.updateEmpresa);
router.delete('/:id', authController.authenticateToken, empresaController.deleteEmpresa);

// Rotas para WhatsApp
router.post('/:id/whatsapp/iniciar', authController.authenticateToken, whatsappController.iniciarSessao);
router.get('/:id/whatsapp/status', authController.authenticateToken, whatsappController.obterStatusSessao);
router.post('/:id/whatsapp/encerrar', authController.authenticateToken, whatsappController.encerrarSessao);
router.get('/:id/whatsapp/qrcode', authController.authenticateToken, whatsappController.obterQRCode);

// Rota para enviar cobranças diárias manualmente
router.post('/:id/whatsapp/enviar-cobrancas', authController.authenticateToken, whatsappController.enviarCobrancasDiarias);

module.exports = router; 