const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Busca todas as empresas (apenas para administradores)
 */
const getEmpresas = async (req, res) => {
  try {
    // Apenas administradores podem ver todas as empresas
    if (req.user.role !== 'admin') {
      return res.status(403).json({ erro: 'Permissão negada' });
    }
    
    const empresas = await prisma.empresa.findMany({
      orderBy: {
        nome: 'asc'
      }
    });
    res.json(empresas);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ erro: 'Erro ao buscar empresas', detalhes: error.message });
  }
};

/**
 * Busca uma empresa pelo ID, verificando permissões
 */
const getEmpresaById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = Number(id);
    
    // Verifica se o usuário tem permissão para acessar esta empresa
    if (req.user.empresaId !== empresaId && req.user.role !== 'admin') {
      return res.status(403).json({ erro: 'Permissão negada' });
    }
    
    const empresa = await prisma.empresa.findUnique({
      where: {
        id: empresaId
      }
    });
    
    if (!empresa) {
      return res.status(404).json({ erro: 'Empresa não encontrada' });
    }
    
    res.json(empresa);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ erro: 'Erro ao buscar empresa', detalhes: error.message });
  }
};

/**
 * Cria uma nova empresa (endpoint público para registro)
 */
const createEmpresa = async (req, res) => {
  try {
    const { nome, logo, endereco, cpfCnpj, chavePix } = req.body;
    
    // Validação básica
    if (!nome) {
      return res.status(400).json({ erro: 'Nome da empresa é obrigatório' });
    }
    
    const novaEmpresa = await prisma.empresa.create({
      data: {
        nome,
        logo,
        endereco,
        cpfCnpj,
        chavePix
      }
    });
    
    res.status(201).json(novaEmpresa);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ erro: 'Erro ao criar empresa', detalhes: error.message });
  }
};

/**
 * Atualiza uma empresa existente, verificando permissões
 */
const updateEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = Number(id);
    const { nome, logo, endereco, cpfCnpj, chavePix, whatsappToken } = req.body;
    
    // Verifica se o usuário tem permissão para atualizar esta empresa
    if (req.user.empresaId !== empresaId && req.user.role !== 'admin') {
      return res.status(403).json({ erro: 'Permissão negada' });
    }
    
    // Validação básica
    if (!nome) {
      return res.status(400).json({ erro: 'Nome da empresa é obrigatório' });
    }
    
    const empresaAtualizada = await prisma.empresa.update({
      where: {
        id: empresaId
      },
      data: {
        nome,
        logo,
        endereco,
        cpfCnpj,
        chavePix,
        whatsappToken
      }
    });
    
    res.json(empresaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ erro: 'Empresa não encontrada' });
    }
    
    res.status(500).json({ erro: 'Erro ao atualizar empresa', detalhes: error.message });
  }
};

/**
 * Remove uma empresa existente (apenas para administradores)
 */
const deleteEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = Number(id);
    
    // Apenas administradores podem excluir empresas
    if (req.user.role !== 'admin') {
      return res.status(403).json({ erro: 'Permissão negada' });
    }
    
    await prisma.empresa.delete({
      where: {
        id: empresaId
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ erro: 'Empresa não encontrada' });
    }
    
    res.status(500).json({ erro: 'Erro ao excluir empresa', detalhes: error.message });
  }
};

module.exports = {
  getEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa
}; 