const { PrismaClient } = require('@prisma/client');
const whatsappService = require('../services/whatsappService');

const prisma = new PrismaClient();

// Iniciar uma sessão do WhatsApp para uma empresa específica
const iniciarSessao = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) }
    });
    
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    
    // Verifica se o usuário tem permissão para acessar esta empresa
    if (req.user.empresaId !== Number(id) && req.user.cargo !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão para acessar esta empresa' });
    }
    
    // Inicia a sessão do WhatsApp
    await whatsappService.iniciarSessao(Number(id), empresa.whatsappToken);
    
    return res.json({ message: 'Sessão iniciada com sucesso', status: 'iniciando' });
  } catch (error) {
    console.error('Erro ao iniciar sessão WhatsApp:', error);
    return res.status(500).json({ message: 'Erro ao iniciar sessão do WhatsApp', error: error.message });
  }
};

// Obter o status da sessão do WhatsApp
const obterStatusSessao = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) }
    });
    
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    
    // Verifica se o usuário tem permissão para acessar esta empresa
    if (req.user.empresaId !== Number(id) && req.user.cargo !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão para acessar esta empresa' });
    }
    
    // Obtém o status da sessão do WhatsApp
    const status = whatsappService.obterStatusSessao(Number(id));
    
    return res.json(status);
  } catch (error) {
    console.error('Erro ao obter status da sessão WhatsApp:', error);
    return res.status(500).json({ message: 'Erro ao obter status da sessão do WhatsApp', error: error.message });
  }
};

// Encerrar a sessão do WhatsApp
const encerrarSessao = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) }
    });
    
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    
    // Verifica se o usuário tem permissão para acessar esta empresa
    if (req.user.empresaId !== Number(id) && req.user.cargo !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão para acessar esta empresa' });
    }
    
    // Encerra a sessão do WhatsApp
    await whatsappService.encerrarSessao(Number(id));
    
    return res.json({ message: 'Sessão encerrada com sucesso' });
  } catch (error) {
    console.error('Erro ao encerrar sessão WhatsApp:', error);
    return res.status(500).json({ message: 'Erro ao encerrar sessão do WhatsApp', error: error.message });
  }
};

// Obter o QR Code da sessão do WhatsApp
const obterQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) }
    });
    
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    
    // Verifica se o usuário tem permissão para acessar esta empresa
    if (req.user.empresaId !== Number(id) && req.user.cargo !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão para acessar esta empresa' });
    }
    
    // Obtém o QR Code da sessão do WhatsApp
    const qrCode = whatsappService.obterQRCode(Number(id));
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR Code não disponível no momento' });
    }
    
    return res.json({ qrCode });
  } catch (error) {
    console.error('Erro ao obter QR Code da sessão WhatsApp:', error);
    return res.status(500).json({ message: 'Erro ao obter QR Code da sessão do WhatsApp', error: error.message });
  }
};

// Enviar cobranças diárias para uma empresa específica
const enviarCobrancasDiarias = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) }
    });
    
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    
    // Verifica se o usuário tem permissão para acessar esta empresa
    if (req.user.empresaId !== Number(id) && req.user.cargo !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão para acessar esta empresa' });
    }
    
    // Envia as cobranças diárias
    const resultado = await whatsappService.enviarCobrancasDiarias(Number(id));
    
    return res.json({ 
      message: `Cobranças enviadas com sucesso: ${resultado.enviadas} de ${resultado.total}`,
      ...resultado
    });
  } catch (error) {
    console.error('Erro ao enviar cobranças diárias:', error);
    return res.status(500).json({ message: 'Erro ao enviar cobranças diárias', error: error.message });
  }
};

module.exports = {
  iniciarSessao,
  obterStatusSessao,
  encerrarSessao,
  obterQRCode,
  enviarCobrancasDiarias,
}; 