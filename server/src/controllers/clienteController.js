const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Busca todos os clientes da empresa do usuário
 */
const getClientes = async (req, res) => {
  try {
    const empresaId = req.user.empresaId;
    
    const clientes = await prisma.cliente.findMany({
      where: {
        empresaId: empresaId
      },
      orderBy: {
        nome: 'asc'
      }
    });
    
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ erro: 'Erro ao buscar clientes', detalhes: error.message });
  }
};

/**
 * Busca um cliente pelo ID, verificando se pertence à empresa do usuário
 */
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaId;
    
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: Number(id),
        empresaId: empresaId
      },
      include: {
        cobrancas: true
      }
    });
    
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ erro: 'Erro ao buscar cliente', detalhes: error.message });
  }
};

/**
 * Cria um novo cliente para a empresa do usuário
 */
const createCliente = async (req, res) => {
  try {
    const { nome, telefone } = req.body;
    const empresaId = req.user.empresaId;
    
    // Validação básica
    if (!nome || !telefone) {
      return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' });
    }
    
    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        telefone,
        empresaId
      }
    });
    
    res.status(201).json(novoCliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ erro: 'Erro ao criar cliente', detalhes: error.message });
  }
};

/**
 * Atualiza um cliente existente, verificando se pertence à empresa do usuário
 */
const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone } = req.body;
    const empresaId = req.user.empresaId;
    
    // Validação básica
    if (!nome || !telefone) {
      return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' });
    }
    
    // Verificar se o cliente pertence à empresa do usuário
    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        id: Number(id),
        empresaId: empresaId
      }
    });
    
    if (!clienteExistente) {
      return res.status(404).json({ erro: 'Cliente não encontrado ou sem permissão' });
    }
    
    const clienteAtualizado = await prisma.cliente.update({
      where: {
        id: Number(id)
      },
      data: {
        nome,
        telefone
      }
    });
    
    res.json(clienteAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.status(500).json({ erro: 'Erro ao atualizar cliente', detalhes: error.message });
  }
};

/**
 * Remove um cliente existente, verificando se pertence à empresa do usuário
 */
const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaId;
    
    // Verificar se o cliente pertence à empresa do usuário
    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        id: Number(id),
        empresaId: empresaId
      }
    });
    
    if (!clienteExistente) {
      return res.status(404).json({ erro: 'Cliente não encontrado ou sem permissão' });
    }
    
    await prisma.cliente.delete({
      where: {
        id: Number(id)
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.status(500).json({ erro: 'Erro ao excluir cliente', detalhes: error.message });
  }
};

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
}; 