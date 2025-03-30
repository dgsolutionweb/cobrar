const { useState, useEffect } = React;
const { HashRouter, Routes, Route, Link, useParams, useNavigate } = window.ReactRouterDOM;

/**
 * Calcula a data de vencimento com base no dia do mês
 * @param {number} diaCobranca - Dia do mês para cobrança (1-31)
 * @returns {Date} Data de vencimento calculada
 */
function calcularDataVencimento(diaCobranca) {
  if (!diaCobranca) return new Date();
  
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  // Cria uma data para o dia de cobrança no mês atual
  let dataVencimento = new Date(anoAtual, mesAtual, diaCobranca);
  
  // Se o dia já passou no mês atual, ajusta para o próximo mês
  if (dataVencimento < hoje) {
    // Move para o próximo mês
    dataVencimento.setMonth(mesAtual + 1);
  }
  
  // Ajusta para o último dia do mês se o dia informado for maior que o número de dias no mês
  const ultimoDiaDoMes = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth() + 1, 0).getDate();
  if (diaCobranca > ultimoDiaDoMes) {
    dataVencimento.setDate(ultimoDiaDoMes);
  }
  
  return dataVencimento;
}

/**
 * Componente principal da aplicação
 */
const App = () => {
  // Garante acesso ao ReactRouterDOM do objeto window
  const { HashRouter, Routes, Route, Navigate } = window.ReactRouterDOM;
  const [authenticated, setAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [usuario, setUsuario] = React.useState(null);

  React.useEffect(() => {
    // Verifica se o usuário está autenticado
    const checkAuth = async () => {
      try {
        if (Auth.isAuthenticated()) {
          // Obtém os dados do usuário atual
          const userData = await Auth.getCurrentUser();
          setUsuario(userData);
          setAuthenticated(true);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        Auth.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Manipulador de logout
  const handleLogout = () => {
    Auth.logout();
    setAuthenticated(false);
    setUsuario(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }
  
  return (
    <HashRouter>
      {authenticated && <NavBar usuario={usuario} onLogout={handleLogout} />}
      
      <main>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/clientes" element={
            <PrivateRoute>
              <ClienteList />
            </PrivateRoute>
          } />
          
          <Route path="/clientes/novo" element={
            <PrivateRoute>
              <ClienteForm />
            </PrivateRoute>
          } />
          
          <Route path="/clientes/editar/:id" element={
            <PrivateRoute>
              <ClienteForm />
            </PrivateRoute>
          } />
          
          <Route path="/clientes/:id" element={
            <PrivateRoute>
              <ClienteDetails />
            </PrivateRoute>
          } />
          
          <Route path="/cobrancas" element={
            <PrivateRoute>
              <CobrancaList />
            </PrivateRoute>
          } />
          
          <Route path="/cobrancas/nova" element={
            <PrivateRoute>
              <CobrancaForm />
            </PrivateRoute>
          } />
          
          <Route path="/cobrancas/editar/:id" element={
            <PrivateRoute>
              <CobrancaForm />
            </PrivateRoute>
          } />
          
          <Route path="/cobrancas/:id" element={
            <PrivateRoute>
              <CobrancaDetails />
            </PrivateRoute>
          } />
          
          <Route path="/configuracoes" element={
            <PrivateRoute>
              <ConfiguracoesGerais />
            </PrivateRoute>
          } />
          
          <Route path="/configuracoes/empresa/:id" element={
            <PrivateRoute>
              <EmpresaConfig />
            </PrivateRoute>
          } />
          
          <Route path="/configuracoes/whatsapp/:id" element={
            <PrivateRoute>
              <WhatsAppConfig />
            </PrivateRoute>
          } />
          
          <Route path="/configuracoes/perfil" element={
            <PrivateRoute>
              <PerfilUsuario />
            </PrivateRoute>
          } />
          
          {/* Rota de fallback para páginas não encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </HashRouter>
  );
};

/**
 * Componente para exibir detalhes de um cliente
 */
const ClienteDetails = () => {
  const [cliente, setCliente] = React.useState(null);
  const [cobrancas, setCobrancas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  const params = window.ReactRouterDOM.useParams();
  const navigate = window.ReactRouterDOM.useNavigate();
  const clienteId = params.id;
  
  React.useEffect(() => {
    const carregarCliente = async () => {
      try {
        setLoading(true);
        const clienteData = await API.Cliente.obterCliente(clienteId);
        setCliente(clienteData);
        
        // Busca as cobranças deste cliente
        const cobrancasDoCliente = await API.Cobranca.listarCobrancasPorCliente(clienteId);
        setCobrancas(cobrancasDoCliente);
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados do cliente:', err);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    carregarCliente();
  }, [clienteId]);
  
  const handleExcluir = async () => {
    if (window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      try {
        await API.Cliente.excluirCliente(clienteId);
        navigate('/clientes');
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        setError('Erro ao excluir cliente. Tente novamente mais tarde.');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/clientes')}
        >
          Voltar para a lista de clientes
        </button>
      </div>
    );
  }
  
  if (!cliente) {
    return (
      <div className="container">
        <div className="alert alert-warning" role="alert">
          Cliente não encontrado.
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/clientes')}
        >
          Voltar para a lista de clientes
        </button>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Detalhes do Cliente</h2>
        <div>
          <button 
            className="btn btn-danger me-2"
            onClick={handleExcluir}
          >
            <i className="fas fa-trash me-1"></i>
            Excluir
          </button>
          
          <button 
            className="btn btn-primary me-2"
            onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
          >
            <i className="fas fa-edit me-1"></i>
            Editar
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/clientes')}
          >
            Voltar
          </button>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Informações do Cliente</h5>
            </div>
            <div className="card-body">
              <p><strong>ID:</strong> {cliente.id}</p>
              <p><strong>Nome:</strong> {cliente.nome}</p>
              <p><strong>Email:</strong> {cliente.email || '-'}</p>
              <p><strong>Telefone:</strong> {cliente.telefone || '-'}</p>
              <p><strong>Documento:</strong> {cliente.documento || '-'}</p>
              <p><strong>Endereço:</strong> {cliente.endereco || '-'}</p>
              <p><strong>Data de Cadastro:</strong> {new Date(cliente.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Cobranças deste Cliente</h5>
              <button 
                className="btn btn-sm btn-success"
                onClick={() => navigate('/cobrancas/nova', { state: { clienteId: cliente.id } })}
              >
                <i className="fas fa-plus-circle me-1"></i>
                Nova Cobrança
              </button>
            </div>
            <div className="card-body">
              {cobrancas.length === 0 ? (
                <p className="text-center">Nenhuma cobrança cadastrada para este cliente.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cobrancas.map(cobranca => (
                        <tr key={cobranca.id}>
                          <td>{cobranca.id}</td>
                          <td>{cobranca.descricao}</td>
                          <td>
                            {cobranca.valor.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            })}
                          </td>
                          <td>{calcularDataVencimento(cobranca.dia_cobranca).toLocaleDateString('pt-BR')}</td>
                          <td>
                            <span className={`status-badge status-${cobranca.status}`}>
                              {cobranca.status === 'paga' ? 'Paga' : cobranca.status === 'enviada' ? 'Enviada' : 'Pendente'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info btn-action"
                              onClick={() => navigate(`/cobrancas/${cobranca.id}`)}
                              title="Ver detalhes"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente para exibir detalhes de uma cobrança
 */
const CobrancaDetails = () => {
  const [cobranca, setCobranca] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [enviando, setEnviando] = React.useState(false);
  const [marcandoPago, setMarcandoPago] = React.useState(false);
  
  const params = window.ReactRouterDOM.useParams();
  const navigate = window.ReactRouterDOM.useNavigate();
  const cobrancaId = params.id;
  
  React.useEffect(() => {
    const carregarCobranca = async () => {
      try {
        setLoading(true);
        const cobrancaData = await API.Cobranca.obterCobranca(cobrancaId);
        setCobranca(cobrancaData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados da cobrança:', err);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    carregarCobranca();
  }, [cobrancaId]);
  
  const handleEnviarWhatsApp = async () => {
    if (!cobranca) return;
    
    setEnviando(true);
    try {
      await API.Cobranca.enviarPorWhatsApp(cobranca.id);
      alert('Mensagem enviada com sucesso!');
      
      // Recarrega a cobrança para atualizar a data da última notificação
      const cobrancaAtualizada = await API.Cobranca.obterCobranca(cobranca.id);
      setCobranca(cobrancaAtualizada);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Verifique se o WhatsApp está conectado.');
    } finally {
      setEnviando(false);
    }
  };
  
  const handleMarcarComoPaga = async () => {
    if (!cobranca) return;
    
    setMarcandoPago(true);
    try {
      const cobrancaAtualizada = await API.Cobranca.marcarComoPaga(cobranca.id);
      setCobranca(cobrancaAtualizada);
      alert('Cobrança marcada como paga com sucesso!');
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
      alert('Erro ao marcar cobrança como paga.');
    } finally {
      setMarcandoPago(false);
    }
  };
  
  const handleExcluir = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.')) {
      try {
        await API.Cobranca.excluirCobranca(cobrancaId);
        navigate('/cobrancas');
      } catch (error) {
        console.error('Erro ao excluir cobrança:', error);
        setError('Erro ao excluir cobrança. Tente novamente mais tarde.');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/cobrancas')}
        >
          Voltar para a lista de cobranças
        </button>
      </div>
    );
  }
  
  if (!cobranca) {
    return (
      <div className="container">
        <div className="alert alert-warning" role="alert">
          Cobrança não encontrada.
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/cobrancas')}
        >
          Voltar para a lista de cobranças
        </button>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Detalhes da Cobrança</h2>
        <div>
          <button 
            className="btn btn-danger me-2"
            onClick={handleExcluir}
          >
            <i className="fas fa-trash me-1"></i>
            Excluir
          </button>
          
          {!cobranca.pago && (
            <button 
              className="btn btn-primary me-2"
              onClick={() => navigate(`/cobrancas/editar/${cobranca.id}`)}
            >
              <i className="fas fa-edit me-1"></i>
              Editar
            </button>
          )}
          
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/cobrancas')}
          >
            Voltar
          </button>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Informações da Cobrança</h5>
            </div>
            <div className="card-body">
              <p><strong>ID:</strong> {cobranca.id}</p>
              <p><strong>Descrição:</strong> {cobranca.descricao}</p>
              <p>
                <strong>Valor:</strong> {cobranca.valor.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </p>
              <p>
                <strong>Data de Vencimento:</strong> {calcularDataVencimento(cobranca.dia_cobranca).toLocaleDateString('pt-BR')}
              </p>
              <p>
                <strong>Dia de Cobrança:</strong> {cobranca.dia_cobranca}
              </p>
              <p>
                <strong>Status:</strong> <span className={`badge ${cobranca.status === 'paga' ? 'bg-success' : cobranca.status === 'enviada' ? 'bg-warning' : 'bg-danger'}`}>
                  {cobranca.status === 'paga' ? 'Paga' : cobranca.status === 'enviada' ? 'Enviada' : 'Pendente'}
                </span>
              </p>
              {cobranca.status === 'paga' && cobranca.dataPagamento && (
                <p>
                  <strong>Data de Pagamento:</strong> {new Date(cobranca.dataPagamento).toLocaleDateString('pt-BR')}
                </p>
              )}
              <p>
                <strong>Última Notificação:</strong> {cobranca.ultimaNotificacao 
                  ? new Date(cobranca.ultimaNotificacao).toLocaleDateString('pt-BR') 
                  : 'Nunca notificado'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Cliente</h5>
            </div>
            <div className="card-body">
              <p>
                <strong>Nome:</strong> <a href={`/#/clientes/${cobranca.cliente.id}`}>{cobranca.cliente.nome}</a>
              </p>
              <p><strong>Telefone:</strong> {cobranca.cliente.telefone || '-'}</p>
              <p><strong>Email:</strong> {cobranca.cliente.email || '-'}</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Ações</h5>
            </div>
            <div className="card-body">
              {!cobranca.pago && (
                <button 
                  className="btn btn-success w-100 mb-3"
                  onClick={handleMarcarComoPaga}
                  disabled={marcandoPago}
                >
                  {marcandoPago ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle me-2"></i>
                      Marcar como Paga
                    </>
                  )}
                </button>
              )}
              
              <button 
                className="btn btn-primary w-100"
                onClick={handleEnviarWhatsApp}
                disabled={enviando || !cobranca.cliente.telefone}
              >
                {enviando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fab fa-whatsapp me-2"></i>
                    Enviar por WhatsApp
                  </>
                )}
              </button>
              
              {!cobranca.cliente.telefone && (
                <div className="alert alert-warning mt-3 mb-0">
                  O cliente não possui telefone cadastrado. Adicione um telefone para enviar mensagens pelo WhatsApp.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Renderiza o componente principal
ReactDOM.render(
  <App />,
  document.getElementById('root')
); 