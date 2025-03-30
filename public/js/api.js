/**
 * Serviço API para comunicação com o backend
 */
const API = {
  /**
   * URL base da API
   */
  baseUrl: '/api',

  /**
   * Helper função para obter o token de autenticação
   */
  getAuthHeaders: () => {
    const token = window.Auth?.getToken();
    console.log('getAuthHeaders - Token para requisição:', token ? 'Token presente' : 'Token AUSENTE');
    
    if (!token) {
      console.warn('getAuthHeaders - ATENÇÃO: Token não encontrado para requisição');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  /**
   * Método para realizar requisições com autenticação
   */
  fetchWithAuth: async (url, options = {}) => {
    const headers = API.getAuthHeaders();
    
    const config = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    };
    
    try {
      const response = await fetch(url, config);
      
      // Se o token expirou, faz logout
      if (response.status === 401 || response.status === 403) {
        window.Auth?.logout();
        window.location.href = '/#/login';
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      return response;
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  },

  /**
   * Métodos para Clientes
   */
  clientes: {
    /**
     * Busca todos os clientes
     */
    getAll: async () => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/clientes`);
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        throw error;
      }
    },

    /**
     * Busca um cliente pelo ID
     */
    getById: async (id) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/clientes/${id}`);
        return await response.json();
      } catch (error) {
        console.error(`Erro ao buscar cliente #${id}:`, error);
        throw error;
      }
    },

    /**
     * Cria um novo cliente
     */
    create: async (clienteData) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/clientes`, {
          method: 'POST',
          body: JSON.stringify(clienteData)
        });
        return await response.json();
      } catch (error) {
        console.error('Erro ao criar cliente:', error);
        throw error;
      }
    },

    /**
     * Atualiza um cliente existente
     */
    update: async (id, clienteData) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/clientes/${id}`, {
          method: 'PUT',
          body: JSON.stringify(clienteData)
        });
        return await response.json();
      } catch (error) {
        console.error(`Erro ao atualizar cliente #${id}:`, error);
        throw error;
      }
    },

    /**
     * Remove um cliente
     */
    delete: async (id) => {
      try {
        await API.fetchWithAuth(`${API.baseUrl}/clientes/${id}`, {
          method: 'DELETE'
        });
        return true;
      } catch (error) {
        console.error(`Erro ao excluir cliente #${id}:`, error);
        throw error;
      }
    }
  },

  /**
   * Métodos para Cobranças
   */
  cobrancas: {
    /**
     * Busca todas as cobranças
     */
    getAll: async () => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas`);
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar cobranças:', error);
        throw error;
      }
    },

    /**
     * Busca cobranças por status
     */
    getByStatus: async (status) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas/status/${status}`);
        return await response.json();
      } catch (error) {
        console.error(`Erro ao buscar cobranças com status ${status}:`, error);
        throw error;
      }
    },

    /**
     * Busca uma cobrança pelo ID
     */
    getById: async (id) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas/${id}`);
        return await response.json();
      } catch (error) {
        console.error(`Erro ao buscar cobrança #${id}:`, error);
        throw error;
      }
    },

    /**
     * Cria uma nova cobrança
     */
    create: async (cobrancaData) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas`, {
          method: 'POST',
          body: JSON.stringify(cobrancaData)
        });
        return await response.json();
      } catch (error) {
        console.error('Erro ao criar cobrança:', error);
        throw error;
      }
    },

    /**
     * Atualiza uma cobrança existente
     */
    update: async (id, cobrancaData) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas/${id}`, {
          method: 'PUT',
          body: JSON.stringify(cobrancaData)
        });
        return await response.json();
      } catch (error) {
        console.error(`Erro ao atualizar cobrança #${id}:`, error);
        throw error;
      }
    },

    /**
     * Atualiza apenas o status de uma cobrança
     */
    updateStatus: async (id, status) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        return await response.json();
      } catch (error) {
        console.error(`Erro ao atualizar status da cobrança #${id}:`, error);
        throw error;
      }
    },

    /**
     * Envia uma cobrança via WhatsApp
     */
    enviar: async (id) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas/${id}/enviar`, {
          method: 'POST'
        });
        return await response.json();
      } catch (error) {
        console.error(`Erro ao enviar cobrança #${id}:`, error);
        throw error;
      }
    },

    /**
     * Remove uma cobrança
     */
    delete: async (id) => {
      try {
        await API.fetchWithAuth(`${API.baseUrl}/cobrancas/${id}`, {
          method: 'DELETE'
        });
        return true;
      } catch (error) {
        console.error(`Erro ao excluir cobrança #${id}:`, error);
        throw error;
      }
    },

    /**
     * Busca estatísticas para o dashboard
     */
    getEstatisticas: async () => {
      try {
        console.log('API: Solicitando estatísticas...');
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas/estatisticas`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API: Erro HTTP ${response.status} ao buscar estatísticas:`, errorText);
          // Retorna estrutura padrão em caso de erro HTTP
          return {
            contagem: { pendentes: 0, enviadas: 0, pagas: 0, total: 0 },
            valores: { pendente: 0, enviado: 0, pago: 0 },
            totalClientes: 0
          };
        }
        const data = await response.json();
        console.log('API: Estatísticas recebidas com sucesso:', data);
        
        // Garante que a estrutura está completa
        return {
          contagem: { 
            pendentes: data?.contagem?.pendentes || 0, 
            enviadas: data?.contagem?.enviadas || 0, 
            pagas: data?.contagem?.pagas || 0, 
            total: data?.contagem?.total || 0 
          },
          valores: { 
            pendente: data?.valores?.pendente || 0, 
            enviado: data?.valores?.enviado || 0, 
            pago: data?.valores?.pago || 0 
          },
          totalClientes: data?.totalClientes || 0
        };
      } catch (error) {
        console.error('API: Erro ao buscar estatísticas:', error);
        // Retorna estrutura padrão em caso de exceção
        return {
          contagem: { pendentes: 0, enviadas: 0, pagas: 0, total: 0 },
          valores: { pendente: 0, enviado: 0, pago: 0 },
          totalClientes: 0
        };
      }
    }
  },

  /**
   * Formata um valor para moeda brasileira
   */
  formatarMoeda: (valor) => {
    return parseFloat(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  },

  /**
   * Formata um status para exibição
   */
  formatarStatus: (status) => {
    const statusMap = {
      pendente: 'Pendente',
      enviada: 'Enviada',
      paga: 'Paga'
    };
    return statusMap[status] || status;
  },

  /**
   * Métodos para Empresas
   */
  Empresa: {
    /**
     * Busca todas as empresas
     */
    getAll: async () => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/empresas`);
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
        throw error;
      }
    },

    /**
     * Busca uma empresa pelo ID
     */
    obterEmpresa: async (id) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/empresas/${id}`);
        return await response.json();
      } catch (error) {
        console.error(`Erro ao buscar empresa #${id}:`, error);
        throw error;
      }
    },

    /**
     * Cria uma nova empresa
     */
    criar: async (empresaData) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/empresas`, {
          method: 'POST',
          body: JSON.stringify(empresaData)
        });
        return await response.json();
      } catch (error) {
        console.error('Erro ao criar empresa:', error);
        throw error;
      }
    },

    /**
     * Alias para criar uma nova empresa (manter compatibilidade)
     */
    criarEmpresa: async (empresaData) => {
      return API.Empresa.criar(empresaData);
    },

    /**
     * Atualiza uma empresa existente
     */
    atualizar: async (id, empresaData) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/empresas/${id}`, {
          method: 'PUT',
          body: JSON.stringify(empresaData)
        });
        return await response.json();
      } catch (error) {
        console.error(`Erro ao atualizar empresa #${id}:`, error);
        throw error;
      }
    },

    /**
     * Alias para atualizar uma empresa (manter compatibilidade)
     */
    atualizarEmpresa: async (id, empresaData) => {
      return API.Empresa.atualizar(id, empresaData);
    },

    /**
     * Remove uma empresa
     */
    excluir: async (id) => {
      try {
        await API.fetchWithAuth(`${API.baseUrl}/empresas/${id}`, {
          method: 'DELETE'
        });
        return true;
      } catch (error) {
        console.error(`Erro ao excluir empresa #${id}:`, error);
        throw error;
      }
    },

    /**
     * Inicia uma sessão do WhatsApp para a empresa
     */
    iniciarSessaoWhatsApp: async (id) => {
      try {
        console.log(`API: Iniciando sessão WhatsApp para empresa ${id}`);
        const response = await API.fetchWithAuth(`${API.baseUrl}/empresas/${id}/whatsapp/iniciar`, {
          method: 'POST'
        });
        const data = await response.json();
        console.log(`API: Resposta ao iniciar sessão WhatsApp:`, data);
        return data;
      } catch (error) {
        console.error(`Erro ao iniciar sessão WhatsApp para empresa #${id}:`, error);
        throw error;
      }
    },

    /**
     * Obtém o status da sessão do WhatsApp
     */
    statusSessaoWhatsApp: async (id) => {
      try {
        console.log(`API: Verificando status da sessão WhatsApp para empresa ${id}`);
        const response = await API.fetchWithAuth(`${API.baseUrl}/empresas/${id}/whatsapp/status`);
        const data = await response.json();
        console.log(`API: Status da sessão WhatsApp recebido:`, data);
        
        if (data.qrCode) {
          console.log(`API: QR Code presente no status, tamanho: ${data.qrCode.length}`);
        } else {
          console.log(`API: Nenhum QR Code presente no status`);
        }
        
        return data;
      } catch (error) {
        console.error(`Erro ao obter status da sessão WhatsApp para empresa #${id}:`, error);
        throw error;
      }
    },

    /**
     * Encerra a sessão do WhatsApp
     */
    encerrarSessaoWhatsApp: async (id) => {
      try {
        console.log(`API: Encerrando sessão WhatsApp para empresa ${id}`);
        const response = await API.fetchWithAuth(`${API.baseUrl}/empresas/${id}/whatsapp/encerrar`, {
          method: 'POST'
        });
        const data = await response.json();
        console.log(`API: Resposta ao encerrar sessão WhatsApp:`, data);
        return data;
      } catch (error) {
        console.error(`Erro ao encerrar sessão WhatsApp para empresa #${id}:`, error);
        throw error;
      }
    },

    /**
     * Obtém o QR Code para autenticação do WhatsApp
     */
    obterQRCodeWhatsApp: async (id) => {
      try {
        console.log(`API: Obtendo QR Code WhatsApp para empresa ${id}`);
        const response = await API.fetchWithAuth(`${API.baseUrl}/empresas/${id}/whatsapp/qrcode`);
        const data = await response.json();
        
        if (data.qrCode) {
          console.log(`API: QR Code obtido, tamanho: ${data.qrCode.length}`);
        } else {
          console.log(`API: Nenhum QR Code obtido`);
        }
        
        return data;
      } catch (error) {
        console.error(`Erro ao obter QR Code WhatsApp para empresa #${id}:`, error);
        throw error;
      }
    },
    
    /**
     * Envia cobranças diárias manualmente
     */
    enviarCobrancasDiarias: async (id) => {
      try {
        console.log(`API: Enviando cobranças diárias para empresa ${id}`);
        const response = await API.fetchWithAuth(`${API.baseUrl}/empresas/${id}/whatsapp/enviar-cobrancas`, {
          method: 'POST'
        });
        const data = await response.json();
        console.log(`API: Resposta ao enviar cobranças diárias:`, data);
        return data;
      } catch (error) {
        console.error(`Erro ao enviar cobranças diárias para empresa #${id}:`, error);
        throw error;
      }
    }
  },

  /**
   * Métodos para Cliente (aliases compatíveis)
   */
  Cliente: {
    listarClientes: async () => {
      return await API.clientes.getAll();
    },
    
    obterCliente: async (id) => {
      return await API.clientes.getById(id);
    },
    
    criarCliente: async (cliente) => {
      return await API.clientes.create(cliente);
    },
    
    atualizarCliente: async (id, cliente) => {
      return await API.clientes.update(id, cliente);
    },
    
    excluirCliente: async (id) => {
      return await API.clientes.delete(id);
    }
  },

  /**
   * Métodos para Cobrança (aliases compatíveis)
   */
  Cobranca: {
    listarCobrancas: async () => {
      return await API.cobrancas.getAll();
    },
    
    obterCobranca: async (id) => {
      return await API.cobrancas.getById(id);
    },
    
    listarCobrancasPorCliente: async (clienteId) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas/cliente/${clienteId}`);
        return await response.json();
      } catch (error) {
        console.error(`Erro ao buscar cobranças do cliente #${clienteId}:`, error);
        throw error;
      }
    },
    
    criarCobranca: async (cobranca) => {
      return await API.cobrancas.create(cobranca);
    },
    
    atualizarCobranca: async (id, cobranca) => {
      return await API.cobrancas.update(id, cobranca);
    },
    
    excluirCobranca: async (id) => {
      return await API.cobrancas.delete(id);
    },
    
    marcarComoPaga: async (id) => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/cobrancas/${id}/pagar`, {
          method: 'PUT'
        });
        return await response.json();
      } catch (error) {
        console.error(`Erro ao marcar cobrança #${id} como paga:`, error);
        throw error;
      }
    },
    
    enviarPorWhatsApp: async (id) => {
      return await API.cobrancas.enviar(id);
    }
  },

  /**
   * Métodos para Dashboard (compatíveis)
   */
  Dashboard: {
    obterDados: async () => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/dashboard`);
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        throw error;
      }
    },
    
    obterEstatisticasCobrancas: async (periodo = 'mes') => {
      try {
        const response = await API.fetchWithAuth(`${API.baseUrl}/dashboard/estatisticas?periodo=${periodo}`);
        return await response.json();
      } catch (error) {
        console.error(`Erro ao buscar estatísticas de cobranças:`, error);
        throw error;
      }
    }
  }
};

// Exporta o API para uso global
window.API = API; 