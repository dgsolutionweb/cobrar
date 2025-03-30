// Gerenciamento de autenticação
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Obter o token de autenticação do localStorage
function getToken() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  console.log('getToken - Token recuperado do localStorage:', token ? 'Token presente' : 'Token AUSENTE');
  return token;
}

// Salvar o token no localStorage
function setToken(token) {
  console.log('setToken - Salvando token no localStorage:', token ? 'Token presente' : 'Token AUSENTE');
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

// Salvar os dados do usuário no localStorage
function setUserData(userData) {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

// Obter os dados do usuário do localStorage
function getUserData() {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
}

// Verificar se o usuário está autenticado
function isAuthenticated() {
  return !!getToken();
}

// Fazer logout do usuário
function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  window.location.href = '/#/login';
}

// Fazer login do usuário
async function login(email, senha) {
  try {
    console.log('Iniciando login para:', email);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      let errorMsg = 'Falha na autenticação';
      try {
        const error = await response.json();
        errorMsg = error.erro || error.message || errorMsg;
      } catch (e) {
        // Se não conseguir ler o JSON, mantém a mensagem padrão
      }
      console.error('Erro de autenticação:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log('Login bem-sucedido. Dados recebidos:', {
      token: data.token ? 'Token recebido' : 'Token não recebido',
      usuario: data.usuario ? 'Dados do usuário recebidos' : 'Dados do usuário não recebidos'
    });
    
    // Verifica se o token foi recebido
    if (!data.token) {
      console.error('Token não recebido do servidor');
      throw new Error('Token de autenticação não recebido');
    }
    
    // Armazena o token e os dados do usuário
    setToken(data.token);
    
    // Verifica se os dados do usuário foram recebidos
    if (data.usuario) {
      setUserData(data.usuario);
    } else if (data.user) {
      // Caso o servidor retorne a chave 'user' em vez de 'usuario'
      setUserData(data.user);
    }
    
    // Verifica se o token foi armazenado
    const storedToken = getToken();
    if (!storedToken) {
      console.error('Token não foi armazenado corretamente');
    } else {
      console.log('Token armazenado com sucesso');
    }
    
    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// Registrar novo usuário
async function register(userData) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha no registro');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
}

// Obter dados do usuário atual
async function getCurrentUser() {
  try {
    // Verifica se existe um token
    const token = getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    // Usa o mecanismo de fetchWithAuth para manter consistência
    const response = await fetch('/api/auth/me', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Se a resposta não for ok, trata o erro
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.error('Token inválido ou expirado, fazendo logout');
        logout();
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      // Tenta obter detalhes do erro
      try {
        const errorData = await response.json();
        throw new Error(errorData.erro || errorData.message || 'Erro ao obter dados do usuário');
      } catch (e) {
        throw new Error('Erro ao obter dados do usuário');
      }
    }

    // Processa os dados
    const data = await response.json();
    console.log('Dados do usuário obtidos com sucesso:', data);
    setUserData(data);
    return data;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    throw error;
  }
}

// Atualizar os dados do usuário
async function updateUser(userId, userData) {
  try {
    const response = await fetch(`/api/auth/usuarios/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar usuário');
    }

    const data = await response.json();
    
    // Se for o usuário atual, atualiza no localStorage
    const currentUser = getUserData();
    if (currentUser && currentUser.id === userId) {
      setUserData(data);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
}

// Exportar as funções de autenticação
window.Auth = {
  login,
  logout,
  register,
  getToken,
  isAuthenticated,
  getUserData,
  getCurrentUser,
  updateUser,
}; 