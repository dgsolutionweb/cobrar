/**
 * Componente do Dashboard
 */
const Dashboard = () => {
  const defaultStats = {
    contagem: { pendentes: 0, enviadas: 0, pagas: 0, total: 0 },
    valores: { pendente: 0, enviado: 0, pago: 0 },
    totalClientes: 0
  };
  
  const [estatisticas, setEstatisticas] = React.useState(defaultStats);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [cobrancasRecentes, setCobrancasRecentes] = React.useState([]);
  const [statusWhatsApp, setStatusWhatsApp] = React.useState('desconectado');
  const [periodoFiltro, setPeriodoFiltro] = React.useState('mes');
  const [cobrancastPorVencer, setCobrancasPorVencer] = React.useState([]);
  
  React.useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        
        // Busca estatísticas
        let stats;
        try {
          stats = await API.cobrancas.getEstatisticas();
          console.log('Estatísticas recebidas:', stats);
          
          // Verifica se a resposta contém a estrutura esperada
          if (!stats || !stats.contagem || !stats.valores) {
            console.warn('Resposta de estatísticas inválida:', stats);
            stats = defaultStats;
          }
        } catch (statErr) {
          console.error('Erro ao buscar estatísticas:', statErr);
          stats = defaultStats;
        }
        
        setEstatisticas(stats);
        
        // Busca cobranças recentes
        try {
          const cobrancas = await API.cobrancas.getAll();
          setCobrancasRecentes(Array.isArray(cobrancas) ? cobrancas.slice(0, 5) : []); 
          
          // Filtra cobranças por vencer nos próximos 7 dias
          const hoje = new Date();
          const diaAtual = hoje.getDate();
          const proximosDias = [diaAtual, diaAtual+1, diaAtual+2, diaAtual+3, diaAtual+4, diaAtual+5, diaAtual+6];
          const proximasCobrancas = Array.isArray(cobrancas) 
            ? cobrancas.filter(c => 
                c.status !== 'paga' && proximosDias.includes(c.dia_cobranca)
              ).slice(0, 3)
            : [];
          setCobrancasPorVencer(proximasCobrancas);
        } catch (cobrancasErr) {
          console.error('Erro ao buscar cobranças recentes:', cobrancasErr);
          setCobrancasRecentes([]);
          setCobrancasPorVencer([]);
        }
        
        // Verifica status do WhatsApp
        try {
          const userData = await Auth.getCurrentUser();
          if (userData && userData.empresaId) {
            const status = await API.Empresa.statusSessaoWhatsApp(userData.empresaId);
            setStatusWhatsApp(status.status);
          }
        } catch (whatsappErr) {
          console.error('Erro ao verificar status do WhatsApp:', whatsappErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
        setEstatisticas(defaultStats);
        setCobrancasRecentes([]);
        setCobrancasPorVencer([]);
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [periodoFiltro]);
  
  const calcularProgresso = () => {
    const { pendentes, enviadas, pagas, total } = estatisticas.contagem;
    if (total === 0) return 0;
    return Math.round((pagas / total) * 100);
  };
  
  const renderizarGrafico = () => {
    const { pendentes, enviadas, pagas } = estatisticas.contagem;
    const total = pendentes + enviadas + pagas;
    
    if (total === 0) {
      return (
        <div className="text-center text-muted p-4">
          <i className="fas fa-chart-pie fa-3x mb-3"></i>
          <p>Não há dados para exibir.</p>
        </div>
      );
    }
    
    const pendentePct = Math.round((pendentes / total) * 100);
    const enviadaPct = Math.round((enviadas / total) * 100);
    const pagaPct = Math.round((pagas / total) * 100);
    
    return (
      <div className="chart-container">
        <div className="progress" style={{ height: '30px' }}>
          <div 
            className="progress-bar bg-warning" 
            role="progressbar" 
            style={{ width: `${pendentePct}%` }} 
            aria-valuenow={pendentePct} 
            aria-valuemin="0" 
            aria-valuemax="100"
          >
            {pendentes > 0 && `${pendentePct}%`}
          </div>
          <div 
            className="progress-bar bg-info" 
            role="progressbar" 
            style={{ width: `${enviadaPct}%` }} 
            aria-valuenow={enviadaPct} 
            aria-valuemin="0" 
            aria-valuemax="100"
          >
            {enviadas > 0 && `${enviadaPct}%`}
          </div>
          <div 
            className="progress-bar bg-success" 
            role="progressbar" 
            style={{ width: `${pagaPct}%` }} 
            aria-valuenow={pagaPct} 
            aria-valuemin="0" 
            aria-valuemax="100"
          >
            {pagas > 0 && `${pagaPct}%`}
          </div>
        </div>
        <div className="d-flex justify-content-between mt-2">
          <div className="legend">
            <span className="badge bg-warning me-1">&nbsp;</span>
            <small>Pendentes</small>
          </div>
          <div className="legend">
            <span className="badge bg-info me-1">&nbsp;</span>
            <small>Enviadas</small>
          </div>
          <div className="legend">
            <span className="badge bg-success me-1">&nbsp;</span>
            <small>Pagas</small>
          </div>
        </div>
      </div>
    );
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
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  
  const progresso = calcularProgresso();
  
  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Dashboard</h2>
        <div>
          <select 
            className="form-select form-select-sm" 
            value={periodoFiltro} 
            onChange={(e) => setPeriodoFiltro(e.target.value)}
          >
            <option value="dia">Hoje</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mês</option>
            <option value="ano">Este ano</option>
          </select>
        </div>
      </div>
      
      {/* Primeira linha - Cards principais */}
      <div className="row mb-4">
        {/* Card de valor total */}
        <div className="col-lg-6 col-md-12 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Resumo Financeiro</h5>
                <span className="badge bg-primary">
                  {periodoFiltro === 'dia' ? 'Hoje' : 
                   periodoFiltro === 'semana' ? 'Esta semana' : 
                   periodoFiltro === 'mes' ? 'Este mês' : 'Este ano'}
                </span>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-container bg-light-primary me-3">
                      <i className="fas fa-money-bill-wave text-primary"></i>
                    </div>
                    <div>
                      <p className="text-muted mb-0">Total a receber</p>
                      <h3 className="mb-0">{API.formatarMoeda(estatisticas.valores.pendente + estatisticas.valores.enviado)}</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-container bg-light-success me-3">
                      <i className="fas fa-check-circle text-success"></i>
                    </div>
                    <div>
                      <p className="text-muted mb-0">Total recebido</p>
                      <h3 className="mb-0">{API.formatarMoeda(estatisticas.valores.pago)}</h3>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-muted mb-2">Progresso de recebimentos</p>
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{width: `${progresso}%`}} 
                    aria-valuenow={progresso} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <small className="text-muted">0%</small>
                  <small className="text-muted">{progresso}%</small>
                  <small className="text-muted">100%</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card de estatísticas */}
        <div className="col-lg-6 col-md-12 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Status das Cobranças</h5>
                <span className="badge bg-primary">{estatisticas.contagem.total} cobranças</span>
              </div>
              
              {renderizarGrafico()}
              
              <div className="row mt-4">
                <div className="col-4 text-center">
                  <div className="mb-2">
                    <span className="badge rounded-pill bg-warning p-2">
                      <i className="fas fa-clock"></i>
                    </span>
                  </div>
                  <h4 className="mb-0">{estatisticas.contagem.pendentes}</h4>
                  <p className="text-muted mb-0">Pendentes</p>
                </div>
                <div className="col-4 text-center">
                  <div className="mb-2">
                    <span className="badge rounded-pill bg-info p-2">
                      <i className="fas fa-paper-plane"></i>
                    </span>
                  </div>
                  <h4 className="mb-0">{estatisticas.contagem.enviadas}</h4>
                  <p className="text-muted mb-0">Enviadas</p>
                </div>
                <div className="col-4 text-center">
                  <div className="mb-2">
                    <span className="badge rounded-pill bg-success p-2">
                      <i className="fas fa-check-circle"></i>
                    </span>
                  </div>
                  <h4 className="mb-0">{estatisticas.contagem.pagas}</h4>
                  <p className="text-muted mb-0">Pagas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Segunda linha - Cobranças recentes e informações adicionais */}
      <div className="row">
        {/* Cobranças Recentes */}
        <div className="col-lg-8 col-md-12 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0">Cobranças Recentes</h5>
              <window.ReactRouterDOM.Link to="/cobrancas" className="btn btn-sm btn-outline-primary">
                Ver todas
              </window.ReactRouterDOM.Link>
            </div>
            <div className="card-body p-0">
              {cobrancasRecentes.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Cliente</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th className="text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cobrancasRecentes.map(cobranca => (
                        <tr key={cobranca.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-circle me-2 bg-primary">
                                {cobranca.cliente.nome.charAt(0).toUpperCase()}
                              </div>
                              <div>{cobranca.cliente.nome}</div>
                            </div>
                          </td>
                          <td>{cobranca.descricao}</td>
                          <td><strong>{API.formatarMoeda(cobranca.valor)}</strong></td>
                          <td>{calcularDataVencimento(cobranca.dia_cobranca).toLocaleDateString('pt-BR')}</td>
                          <td>
                            <span className={`badge bg-${
                              cobranca.status === 'paga' ? 'success' : 
                              cobranca.status === 'enviada' ? 'info' : 'warning'
                            } rounded-pill`}>
                              {API.formatarStatus(cobranca.status)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-center">
                              <window.ReactRouterDOM.Link 
                                to={`/cobrancas/${cobranca.id}`} 
                                className="btn btn-sm btn-outline-secondary btn-icon me-1"
                                title="Ver detalhes"
                              >
                                <i className="fas fa-eye"></i>
                              </window.ReactRouterDOM.Link>
                              
                              {cobranca.status === 'pendente' && (
                                <button 
                                  className="btn btn-sm btn-outline-success btn-icon me-1"
                                  title="Enviar por WhatsApp"
                                  onClick={async () => {
                                    try {
                                      await API.cobrancas.enviar(cobranca.id);
                                      window.location.reload();
                                    } catch (error) {
                                      alert('Erro ao enviar cobrança. Tente novamente.');
                                    }
                                  }}
                                >
                                  <i className="fab fa-whatsapp"></i>
                                </button>
                              )}
                              
                              {cobranca.status !== 'paga' && (
                                <button 
                                  className="btn btn-sm btn-outline-primary btn-icon"
                                  title="Marcar como paga"
                                  onClick={async () => {
                                    try {
                                      await API.cobrancas.updateStatus(cobranca.id, 'paga');
                                      window.location.reload();
                                    } catch (error) {
                                      alert('Erro ao marcar como paga. Tente novamente.');
                                    }
                                  }}
                                >
                                  <i className="fas fa-check-circle"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i className="fas fa-file-invoice-dollar fa-3x text-muted"></i>
                  </div>
                  <p className="text-muted">Nenhuma cobrança encontrada.</p>
                  <window.ReactRouterDOM.Link to="/cobrancas/novo" className="btn btn-sm btn-primary">
                    Criar Cobrança
                  </window.ReactRouterDOM.Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Cards de informações e ações rápidas */}
        <div className="col-lg-4 col-md-12">
          {/* Status do WhatsApp */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">WhatsApp</h6>
                  <h5 className="card-title mb-0">
                    Status: <span className={`text-${statusWhatsApp === 'conectado' ? 'success' : 'danger'}`}>
                      {statusWhatsApp === 'conectado' ? 'Conectado' : 'Desconectado'}
                    </span>
                  </h5>
                </div>
                <div className="icon-container large bg-light-primary">
                  <i className="fab fa-whatsapp fa-lg text-primary"></i>
                </div>
              </div>
              <div className="mt-3">
                <window.ReactRouterDOM.Link to="/configuracoes/whatsapp" className="btn btn-sm btn-primary w-100">
                  Configurar WhatsApp
                </window.ReactRouterDOM.Link>
              </div>
            </div>
          </div>
          
          {/* Clientes */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">Clientes</h6>
                  <h5 className="card-title">{estatisticas.totalClientes}</h5>
                  <p className="card-text text-muted">Clientes cadastrados</p>
                </div>
                <div className="icon-container large bg-light-success">
                  <i className="fas fa-users fa-lg text-success"></i>
                </div>
              </div>
              <div className="mt-2">
                <window.ReactRouterDOM.Link to="/clientes/novo" className="btn btn-sm btn-outline-primary w-100">
                  Novo cliente
                </window.ReactRouterDOM.Link>
              </div>
            </div>
          </div>
          
          {/* Próximas cobranças */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">Próximas Cobranças</h5>
            </div>
            <div className="card-body p-0">
              {cobrancastPorVencer.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {cobrancastPorVencer.map(cobranca => (
                    <li key={cobranca.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{cobranca.cliente.nome}</strong>
                          <div className="text-muted small">{cobranca.descricao}</div>
                          <div className="small">
                            Vencimento: {calcularDataVencimento(cobranca.dia_cobranca).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div>
                          <span className="badge bg-primary rounded-pill">
                            {API.formatarMoeda(cobranca.valor)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">Nenhuma cobrança próxima.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 