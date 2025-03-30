const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// Use uma única chave secreta
const JWT_SECRET = 'cobrar-app-secret-key-2023';

/**
 * Registra um novo usuário
 */
const register = async (req, res) => {
  try {
    const { nome, email, senha, empresaId } = req.body;
    
    // Validação básica
    if (!nome || !email || !senha || !empresaId) {
      return res.status(400).json({ 
        erro: 'Nome, email, senha e ID da empresa são obrigatórios' 
      });
    }
    
    // Verifica se o email já está em uso
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });
    
    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Email já está em uso' });
    }
    
    // Verifica se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(empresaId) }
    });
    
    if (!empresa) {
      return res.status(400).json({ erro: 'Empresa não encontrada' });
    }
    
    // Hash da senha
    const hashedSenha = await bcrypt.hash(senha, 10);
    
    // Cria o usuário
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: hashedSenha,
        empresaId: Number(empresaId),
        role: 'admin' // Primeiro usuário da empresa é admin
      }
    });
    
    // Remove a senha do objeto de retorno
    const { senha: _, ...usuarioSemSenha } = novoUsuario;
    
    res.status(201).json(usuarioSemSenha);
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ erro: 'Erro ao registrar usuário', detalhes: error.message });
  }
};

/**
 * Autentica um usuário e retorna um token JWT
 */
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }
    
    // Busca o usuário pelo email
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { empresa: true }
    });
    
    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }
    
    // Verifica a senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }
    
    // Gera o token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, empresaId: usuario.empresaId, role: usuario.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Remove a senha do objeto de retorno
    const { senha: _, ...usuarioSemSenha } = usuario;
    
    res.json({
      usuario: usuarioSemSenha,
      token,
      empresa: usuario.empresa
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ erro: 'Erro ao fazer login', detalhes: error.message });
  }
};

/**
 * Middleware para verificar autenticação
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('authenticateToken - headers:', JSON.stringify(req.headers));
    console.log('authenticateToken - authorization header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('authenticateToken - token extraído:', token ? 'Token presente' : 'Token ausente');
    
    if (!token) {
      console.log('authenticateToken - Erro: token não fornecido');
      return res.status(401).json({ erro: 'Token de autenticação não fornecido' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.error('authenticateToken - Erro na verificação do JWT:', err.message);
        return res.status(403).json({ erro: 'Token inválido ou expirado', detalhes: err.message });
      }
      
      console.log('authenticateToken - Token verificado com sucesso, user ID:', user.id);
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('authenticateToken - Erro inesperado:', error);
    return res.status(500).json({ erro: 'Erro interno ao autenticar token', detalhes: error.message });
  }
};

/**
 * Atualiza um usuário existente
 */
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, role } = req.body;
    
    // Apenas administradores podem alterar roles
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ erro: 'Permissão negada para alterar função do usuário' });
    }
    
    // Verifica se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) }
    });
    
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    // Verifica se o usuário pertence à mesma empresa do usuário autenticado
    if (usuario.empresaId !== req.user.empresaId && req.user.role !== 'admin') {
      return res.status(403).json({ erro: 'Permissão negada' });
    }
    
    // Prepara os dados para atualização
    const updateData = { nome, email, role };
    
    // Se a senha foi fornecida, faz o hash
    if (senha) {
      updateData.senha = await bcrypt.hash(senha, 10);
    }
    
    // Atualiza o usuário
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data: updateData
    });
    
    // Remove a senha do objeto de retorno
    const { senha: _, ...usuarioSemSenha } = usuarioAtualizado;
    
    res.json(usuarioSemSenha);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    res.status(500).json({ erro: 'Erro ao atualizar usuário', detalhes: error.message });
  }
};

/**
 * Obtém os dados do usuário atual
 */
const getMe = async (req, res) => {
  try {
    console.log('getMe - Iniciando busca para usuário ID:', req.user.id);
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      include: { empresa: true }
    });
    
    if (!usuario) {
      console.log('getMe - Usuário não encontrado na base de dados, ID:', req.user.id);
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    console.log(`getMe - Usuário encontrado: ${usuario.nome} (${usuario.email})`);
    
    // Remove a senha do objeto de retorno
    const { senha, ...usuarioSemSenha } = usuario;
    
    res.json(usuarioSemSenha);
  } catch (error) {
    console.error('getMe - Erro ao buscar dados do usuário:', error);
    res.status(500).json({ erro: 'Erro ao buscar dados do usuário', detalhes: error.message });
  }
};

module.exports = {
  register,
  login,
  authenticateToken,
  updateUsuario,
  getMe
}; 