const { PrismaClient } = require('@prisma/client');
const whatsappService = require('../services/whatsappService');
const prisma = new PrismaClient();

/**
 * Busca todas as cobranças
 */
const getCobrancas = async (req, res) => {
  try {
    const empresaId = req.user.empresaId;
    
    const cobrancas = await prisma.cobranca.findMany({
      where: {
        empresaId: Number(empresaId)
      },
      include: {
        cliente: true
      },
      orderBy: {
        dia_cobranca: 'asc'
      }
    });
    res.json(cobrancas);
  } catch (error) {
    console.error('Erro ao buscar cobranças:', error);
    res.status(500).json({ error: 'Erro ao buscar cobranças' });
  }
};

/**
 * Busca cobranças com filtro de status
 */
const getCobrancasByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['pendente', 'enviada', 'paga'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }
    
    const cobrancas = await prisma.cobranca.findMany({
      where: {
        status: status
      },
      include: {
        cliente: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(cobrancas);
  } catch (error) {
    console.error('Erro ao buscar cobranças por status:', error);
    res.status(500).json({ erro: 'Erro ao buscar cobranças', detalhes: error.message });
  }
};

/**
 * Busca uma cobrança pelo ID
 */
const getCobrancaById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaId;
    
    const cobranca = await prisma.cobranca.findFirst({
      where: {
        id: Number(id)
      },
      include: {
        cliente: true
      }
    });
    
    if (!cobranca) {
      return res.status(404).json({ error: 'Cobrança não encontrada' });
    }
    
    if (cobranca.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar esta cobrança' });
    }
    
    res.json(cobranca);
  } catch (error) {
    console.error('Erro ao buscar cobrança:', error);
    res.status(500).json({ error: 'Erro ao buscar cobrança' });
  }
};

/**
 * Busca cobranças por cliente
 */
const getCobrancasByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const empresaId = req.user.empresaId;
    
    const cliente = await prisma.cliente.findUnique({
      where: {
        id: Number(clienteId)
      }
    });
    
    if (!cliente || cliente.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar as cobranças deste cliente' });
    }
    
    const cobrancas = await prisma.cobranca.findMany({
      where: {
        clienteId: Number(clienteId),
        empresaId: Number(empresaId)
      },
      orderBy: {
        dia_cobranca: 'asc'
      }
    });
    
    res.json(cobrancas);
  } catch (error) {
    console.error('Erro ao buscar cobranças do cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cobranças do cliente' });
  }
};

/**
 * Cria uma nova cobrança
 */
const createCobranca = async (req, res) => {
  try {
    const { clienteId, descricao, valor, dataVencimento, dia_cobranca, status } = req.body;
    const empresaId = req.user.empresaId;
    
    console.log('Dados recebidos:', req.body);
    
    if (!clienteId || !descricao || !valor) {
      return res.status(400).json({ error: 'Campos obrigatórios: clienteId, descricao, valor' });
    }
    
    // Verifica se foi fornecido dia_cobranca ou dataVencimento
    if (!dia_cobranca && !dataVencimento) {
      return res.status(400).json({ error: 'É necessário fornecer dia_cobranca ou dataVencimento' });
    }
    
    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(clienteId) }
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    if (cliente.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Você não tem permissão para criar cobranças para este cliente' });
    }
    
    // Define os dados básicos da cobrança
    const dados = {
      descricao,
      valor: Number(valor),
      dia_cobranca: dia_cobranca ? Number(dia_cobranca) : new Date(dataVencimento).getDate(),
      status: status || 'pendente',
      cliente: {
        connect: { id: Number(clienteId) }
      },
      empresa: {
        connect: { id: Number(empresaId) }
      }
    };
    
    const cobranca = await prisma.cobranca.create({
      data: dados
    });
    
    res.status(201).json(cobranca);
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    res.status(500).json({ error: 'Erro ao criar cobrança', detalhes: error.message });
  }
};

/**
 * Atualiza uma cobrança existente
 */
const updateCobranca = async (req, res) => {
  try {
    const { id } = req.params;
    const { clienteId, descricao, valor, dataVencimento, pago } = req.body;
    const empresaId = req.user.empresaId;
    
    const cobrancaExistente = await prisma.cobranca.findUnique({
      where: {
        id: Number(id)
      }
    });
    
    if (!cobrancaExistente) {
      return res.status(404).json({ error: 'Cobrança não encontrada' });
    }
    
    if (cobrancaExistente.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Você não tem permissão para atualizar esta cobrança' });
    }
    
    if (clienteId && clienteId !== cobrancaExistente.clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: {
          id: Number(clienteId)
        }
      });
      
      if (!cliente || cliente.empresaId !== empresaId) {
        return res.status(403).json({ error: 'Você não tem permissão para associar a cobrança a este cliente' });
      }
    }
    
    const dados = {};
    
    if (descricao !== undefined) dados.descricao = descricao;
    if (valor !== undefined) dados.valor = Number(valor);
    if (dataVencimento !== undefined) dados.dataVencimento = new Date(dataVencimento);
    if (pago !== undefined) {
      dados.pago = Boolean(pago);
      if (pago) {
        dados.dataPagamento = new Date();
      } else {
        dados.dataPagamento = null;
      }
    }
    
    if (clienteId) {
      dados.cliente = {
        connect: { id: Number(clienteId) }
      };
    }
    
    const cobranca = await prisma.cobranca.update({
      where: {
        id: Number(id)
      },
      data: dados,
      include: {
        cliente: true
      }
    });
    
    res.json(cobranca);
  } catch (error) {
    console.error('Erro ao atualizar cobrança:', error);
    res.status(500).json({ error: 'Erro ao atualizar cobrança' });
  }
};

/**
 * Atualiza o status de uma cobrança
 */
const updateCobrancaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pendente', 'enviada', 'paga'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }
    
    const cobrancaAtualizada = await prisma.cobranca.update({
      where: {
        id: Number(id)
      },
      data: {
        status
      }
    });
    
    res.json(cobrancaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar status da cobrança:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ erro: 'Cobrança não encontrada' });
    }
    
    res.status(500).json({ erro: 'Erro ao atualizar status', detalhes: error.message });
  }
};

/**
 * Remove uma cobrança existente
 */
const deleteCobranca = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaId;
    
    const cobrancaExistente = await prisma.cobranca.findUnique({
      where: {
        id: Number(id)
      }
    });
    
    if (!cobrancaExistente) {
      return res.status(404).json({ error: 'Cobrança não encontrada' });
    }
    
    if (cobrancaExistente.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir esta cobrança' });
    }
    
    await prisma.cobranca.delete({
      where: {
        id: Number(id)
      }
    });
    
    res.json({ message: 'Cobrança excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cobrança:', error);
    res.status(500).json({ error: 'Erro ao excluir cobrança' });
  }
};

/**
 * Marcar cobrança como paga
 */
const marcarComoPaga = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaId;
    
    const cobrancaExistente = await prisma.cobranca.findUnique({
      where: {
        id: Number(id)
      }
    });
    
    if (!cobrancaExistente) {
      return res.status(404).json({ error: 'Cobrança não encontrada' });
    }
    
    if (cobrancaExistente.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Você não tem permissão para atualizar esta cobrança' });
    }
    
    const cobranca = await prisma.cobranca.update({
      where: {
        id: Number(id)
      },
      data: {
        pago: true,
        dataPagamento: new Date()
      },
      include: {
        cliente: true
      }
    });
    
    res.json(cobranca);
  } catch (error) {
    console.error('Erro ao marcar cobrança como paga:', error);
    res.status(500).json({ error: 'Erro ao marcar cobrança como paga' });
  }
};

/**
 * Envia uma cobrança específica via WhatsApp
 */
const enviarPorWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaId;
    
    const cobranca = await prisma.cobranca.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        cliente: true
      }
    });
    
    if (!cobranca) {
      return res.status(404).json({ error: 'Cobrança não encontrada' });
    }
    
    if (cobranca.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Você não tem permissão para enviar esta cobrança' });
    }
    
    if (!cobranca.cliente.telefone) {
      return res.status(400).json({ 
        error: 'O cliente não possui telefone cadastrado. Adicione um telefone ao cliente para enviar mensagens.' 
      });
    }
    
    const empresa = await prisma.empresa.findUnique({
      where: {
        id: Number(empresaId)
      }
    });
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    const mensagem = whatsappService.gerarMensagemCobranca(cobranca.cliente, cobranca, empresa);
    
    const sucesso = await whatsappService.enviarMensagem(empresaId, cobranca.cliente.telefone, mensagem);
    
    if (!sucesso) {
      return res.status(500).json({ 
        error: 'Erro ao enviar mensagem. Verifique se o WhatsApp está conectado.' 
      });
    }
    
    const cobrancaAtualizada = await prisma.cobranca.update({
      where: {
        id: Number(id)
      },
      data: {
        ultimaNotificacao: new Date()
      },
      include: {
        cliente: true
      }
    });
    
    res.json({ 
      message: 'Mensagem enviada com sucesso', 
      cobranca: cobrancaAtualizada 
    });
  } catch (error) {
    console.error('Erro ao enviar cobrança por WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao enviar cobrança por WhatsApp' });
  }
};

/**
 * Busca estatísticas das cobranças (dashboard)
 */
const getEstatisticas = async (req, res) => {
  try {
    const empresaId = req.user.empresaId;
    console.log('getEstatisticas - empresaId:', empresaId);
    
    let pendentes = 0;
    let enviadas = 0;
    let pagas = 0;
    let valorPendente = 0;
    let valorEnviado = 0;
    let valorPago = 0;
    let totalClientes = 0;
    
    try {
      // Adiciona o filtro de empresaId em todas as consultas
      pendentes = await prisma.cobranca.count({ 
        where: { 
          status: 'pendente',
          empresaId: Number(empresaId)
        } 
      });
    } catch (e) {
      console.error('Erro ao contar cobranças pendentes:', e);
    }
    
    try {
      enviadas = await prisma.cobranca.count({ 
        where: { 
          status: 'enviada',
          empresaId: Number(empresaId)
        } 
      });
    } catch (e) {
      console.error('Erro ao contar cobranças enviadas:', e);
    }
    
    try {
      pagas = await prisma.cobranca.count({ 
        where: { 
          status: 'paga',
          empresaId: Number(empresaId)
        } 
      });
    } catch (e) {
      console.error('Erro ao contar cobranças pagas:', e);
    }
    
    try {
      const resultPendente = await prisma.cobranca.aggregate({
        where: { 
          status: 'pendente',
          empresaId: Number(empresaId)
        },
        _sum: { valor: true }
      });
      valorPendente = resultPendente._sum?.valor || 0;
    } catch (e) {
      console.error('Erro ao somar valores pendentes:', e);
    }
    
    try {
      const resultEnviado = await prisma.cobranca.aggregate({
        where: { 
          status: 'enviada',
          empresaId: Number(empresaId)
        },
        _sum: { valor: true }
      });
      valorEnviado = resultEnviado._sum?.valor || 0;
    } catch (e) {
      console.error('Erro ao somar valores enviados:', e);
    }
    
    try {
      const resultPago = await prisma.cobranca.aggregate({
        where: { 
          status: 'paga',
          empresaId: Number(empresaId)
        },
        _sum: { valor: true }
      });
      valorPago = resultPago._sum?.valor || 0;
    } catch (e) {
      console.error('Erro ao somar valores pagos:', e);
    }
    
    try {
      totalClientes = await prisma.cliente.count({
        where: {
          empresaId: Number(empresaId)
        }
      });
    } catch (e) {
      console.error('Erro ao contar clientes:', e);
    }
    
    // Garante que os valores não serão null ou undefined
    const response = {
      contagem: {
        pendentes: pendentes || 0,
        enviadas: enviadas || 0,
        pagas: pagas || 0,
        total: (pendentes || 0) + (enviadas || 0) + (pagas || 0)
      },
      valores: {
        pendente: valorPendente || 0,
        enviado: valorEnviado || 0,
        pago: valorPago || 0
      },
      totalClientes: totalClientes || 0
    };
    
    console.log('getEstatisticas - response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    // Retorna um objeto vazio com a estrutura esperada em caso de erro
    res.status(200).json({
      contagem: { pendentes: 0, enviadas: 0, pagas: 0, total: 0 },
      valores: { pendente: 0, enviado: 0, pago: 0 },
      totalClientes: 0
    });
  }
};

module.exports = {
  getCobrancas,
  getCobrancasByStatus,
  getCobrancaById,
  getCobrancasByCliente,
  createCobranca,
  updateCobranca,
  updateCobrancaStatus,
  deleteCobranca,
  marcarComoPaga,
  enviarPorWhatsApp,
  getEstatisticas
}; 