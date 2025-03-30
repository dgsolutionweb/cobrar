const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const clienteRoutes = require('./routes/clienteRoutes');
const cobrancaRoutes = require('./routes/cobrancaRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const authRoutes = require('./routes/authRoutes');
const whatsappService = require('./services/whatsappService');
const authController = require('./controllers/authController');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Rotas públicas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresaRoutes);

// Rotas protegidas
app.use('/api/clientes', authController.authenticateToken, clienteRoutes);
app.use('/api/cobrancas', authController.authenticateToken, cobrancaRoutes);

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Inicializa a instância do WhatsApp para cada empresa na inicialização
const inicializarSessoesWhatsapp = async () => {
  try {
    const empresas = await prisma.empresa.findMany({
      where: {
        whatsappToken: {
          not: null
        }
      }
    });
    
    for (const empresa of empresas) {
      try {
        await whatsappService.iniciarSessao(empresa.id, empresa.whatsappToken);
        console.log(`Sessão WhatsApp iniciada para empresa ${empresa.id} (${empresa.nome})`);
      } catch (error) {
        console.error(`Erro ao iniciar sessão WhatsApp para empresa ${empresa.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar sessões WhatsApp:', error);
  }
};

// Cron job para verificar cobranças diariamente às 8:00
cron.schedule('0 8 * * *', async () => {
  console.log('Executando verificação diária de cobranças...');
  try {
    // Busca todas as empresas com WhatsApp configurado
    const empresas = await prisma.empresa.findMany({
      where: {
        whatsappToken: {
          not: null
        }
      }
    });
    
    for (const empresa of empresas) {
      try {
        console.log(`Processando cobranças da empresa ${empresa.id} (${empresa.nome})...`);
        await whatsappService.enviarCobrancasDiarias(empresa.id);
      } catch (error) {
        console.error(`Erro ao processar cobranças da empresa ${empresa.id}:`, error);
      }
    }
    
    console.log('Verificação de cobranças concluída com sucesso.');
  } catch (error) {
    console.error('Erro na verificação diária de cobranças:', error);
  }
});

// Inicializa as sessões do WhatsApp
inicializarSessoesWhatsapp().catch(err => {
  console.error('Erro ao inicializar sessões do WhatsApp:', err);
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  // Fecha todas as sessões do WhatsApp
  await whatsappService.encerrarTodasSessoes();
  
  await prisma.$disconnect();
  console.log('Conexão com o banco de dados encerrada.');
  process.exit(0);
}); 