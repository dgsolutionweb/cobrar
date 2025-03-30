/**
 * Componente de listagem de cobranças
 */
const CobrancaList = () => {
  const [cobrancas, setCobrancas] = React.useState([]);
  const [cobrancasFiltradas, setCobrancasFiltradas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [cobrancaParaExcluir, setCobrancaParaExcluir] = React.useState(null);
  const [filtroStatus, setFiltroStatus] = React.useState('todas');
  const [termoBusca, setTermoBusca] = React.useState('');
  const [viewMode, setViewMode] = React.useState('tabela'); // 'tabela' ou 'cards'
  const [ordenacao, setOrdenacao] = React.useState({ campo: 'dia_cobranca', ordem: 'asc' });
  
  const navigate = window.ReactRouterDOM.useNavigate();
  
  React.useEffect(() => {
    const carregarCobrancas = async () => {
      try {
        setLoading(true);
        let data;
        
        if (filtroStatus === 'todas') {
          data = await API.cobrancas.getAll();
        } else {
          data = await API.cobrancas.getByStatus(filtroStatus);
        }
        
        // Aplicando ordenação padrão
        data = ordenarCobrancas(data, ordenacao.campo, ordenacao.ordem);
        
        setCobrancas(data);
        setCobrancasFiltradas(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar cobranças:', err);
        setError('Erro ao carregar cobranças. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    carregarCobrancas();
  }, [filtroStatus, ordenacao.campo, ordenacao.ordem]);
  
  // Filtra as cobranças baseado no termo de busca
  React.useEffect(() => {
    if (!termoBusca.trim()) {
      setCobrancasFiltradas(cobrancas);
      return;
    }
    
    const termoLower = termoBusca.toLowerCase();
    const filtradas = cobrancas.filter(cobranca => 
      (cobranca.descricao && cobranca.descricao.toLowerCase().includes(termoLower)) || 
      (cobranca.cliente && cobranca.cliente.nome.toLowerCase().includes(termoLower)) ||
      String(cobranca.valor).includes(termoLower) ||
      String(cobranca.dia_cobranca).includes(termoLower)
    );
    
    setCobrancasFiltradas(filtradas);
  }, [termoBusca, cobrancas]);
  
  const ordenarCobrancas = (lista, campo, ordem) => {
    return [...lista].sort((a, b) => {
      let valorA, valorB;
      
      if (campo === 'cliente') {
        valorA = a.cliente?.nome?.toLowerCase() || '';
        valorB = b.cliente?.nome?.toLowerCase() || '';
      } else if (campo === 'valor') {
        valorA = parseFloat(a.valor || 0);
        valorB = parseFloat(b.valor || 0);
      } else if (campo === 'dia_cobranca') {
        valorA = parseInt(a.dia_cobranca || 0);
        valorB = parseInt(b.dia_cobranca || 0);
      } else {
        valorA = a[campo] || '';
        valorB = b[campo] || '';
      }
      
      if (ordem === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
  };
  
  const handleMudarOrdenacao = (campo) => {
    setOrdenacao(prev => {
      if (prev.campo === campo) {
        return { campo, ordem: prev.ordem === 'asc' ? 'desc' : 'asc' };
      }
      return { campo, ordem: 'asc' };
    });
  };
  
  const handleExcluir = async () => {
    if (!cobrancaParaExcluir) return;
    
    try {
      await API.cobrancas.delete(cobrancaParaExcluir.id);
      
      // Atualiza a lista de cobranças
      setCobrancas(cobrancas.filter(cobranca => cobranca.id !== cobrancaParaExcluir.id));
      setCobrancaParaExcluir(null);
      
      // Fecha o modal
      const modalElement = document.getElementById('confirmarExclusaoModal');
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    } catch (err) {
      console.error('Erro ao excluir cobrança:', err);
      alert('Erro ao excluir cobrança. Por favor, tente novamente.');
    }
  };
  
  const handleEnviarWhatsApp = async (cobrancaId) => {
    try {
      await API.cobrancas.enviar(cobrancaId);
      
      // Atualiza a cobrança na lista
      const cobrancasAtualizadas = cobrancas.map(cobranca => {
        if (cobranca.id === cobrancaId) {
          return { ...cobranca, status: 'enviada' };
        }
        return cobranca;
      });
      
      setCobrancas(cobrancasAtualizadas);
      
      // Notificação de sucesso
      const toastElement = document.getElementById('toastSucesso');
      const toastTexto = document.getElementById('toastSucessoTexto');
      toastTexto.textContent = 'Cobrança enviada com sucesso pelo WhatsApp!';
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    } catch (err) {
      console.error('Erro ao enviar cobrança pelo WhatsApp:', err);
      
      // Notificação de erro
      const toastElement = document.getElementById('toastErro');
      const toastTexto = document.getElementById('toastErroTexto');
      toastTexto.textContent = 'Erro ao enviar cobrança. Por favor, tente novamente.';
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    }
  };
  
  const handleMarcarComoPaga = async (cobrancaId) => {
    try {
      await API.cobrancas.updateStatus(cobrancaId, 'paga');
      
      // Atualiza a cobrança na lista
      const cobrancasAtualizadas = cobrancas.map(cobranca => {
        if (cobranca.id === cobrancaId) {
          return { ...cobranca, status: 'paga' };
        }
        return cobranca;
      });
      
      setCobrancas(cobrancasAtualizadas);
      
      // Notificação de sucesso
      const toastElement = document.getElementById('toastSucesso');
      const toastTexto = document.getElementById('toastSucessoTexto');
      toastTexto.textContent = 'Cobrança marcada como paga com sucesso!';
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    } catch (err) {
      console.error('Erro ao marcar cobrança como paga:', err);
      
      // Notificação de erro
      const toastElement = document.getElementById('toastErro');
      const toastTexto = document.getElementById('toastErroTexto');
      toastTexto.textContent = 'Erro ao atualizar status. Por favor, tente novamente.';
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    }
  };
  
  // Função para obter a cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return 'warning';
      case 'enviada': return 'info';
      case 'paga': return 'success';
      default: return 'secondary';
    }
  };
  
  // Função para gerar cor de avatar baseada no nome
  const getAvatarColor = (name) => {
    if (!name) return 'primary';
    const colors = [
      'primary', 'success', 'danger', 'warning', 'info'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  // Função para obter classe de ordenação
  const getOrdenacaoClass = (campo) => {
    if (ordenacao.campo !== campo) return 'text-muted';
    return ordenacao.ordem === 'asc' ? 'text-primary fas fa-sort-up' : 'text-primary fas fa-sort-down';
  };
  
  // Função para formatação de data de vencimento
  const formatarDataVencimento = (dia) => {
    if (!dia) return '-';
    
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    let dataVencimento = new Date(anoAtual, mesAtual, dia);
    
    // Se o dia já passou neste mês, a próxima cobrança é no próximo mês
    if (diaAtual > dia) {
      dataVencimento = new Date(anoAtual, mesAtual + 1, dia);
    }
    
    return dataVencimento.toLocaleDateString('pt-BR');
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
  
  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Cobranças</h2>
        <window.ReactRouterDOM.Link to="/cobrancas/nova" className="btn btn-success">
          <i className="fas fa-plus-circle me-2"></i>
          Nova Cobrança
        </window.ReactRouterDOM.Link>
      </div>
      
      {/* Barra de busca e filtros */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="fas fa-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  placeholder="Buscar por cliente, descrição, valor..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${filtroStatus === 'todas' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFiltroStatus('todas')}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className={`btn ${filtroStatus === 'pendente' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => setFiltroStatus('pendente')}
                >
                  Pendentes
                </button>
                <button
                  type="button"
                  className={`btn ${filtroStatus === 'enviada' ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={() => setFiltroStatus('enviada')}
                >
                  Enviadas
                </button>
                <button
                  type="button"
                  className={`btn ${filtroStatus === 'paga' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setFiltroStatus('paga')}
                >
                  Pagas
                </button>
              </div>
            </div>
            <div className="col-md-3 d-flex justify-content-end">
              <div className="btn-group" role="group">
                <button 
                  type="button" 
                  className={`btn ${viewMode === 'tabela' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode('tabela')}
                >
                  <i className="fas fa-table"></i>
                </button>
                <button 
                  type="button" 
                  className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode('cards')}
                >
                  <i className="fas fa-th-large"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {cobrancasFiltradas.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-file-invoice-dollar fa-3x text-muted mb-3"></i>
            <h5>Nenhuma cobrança encontrada</h5>
            <p className="text-muted">
              {termoBusca ? 
                'Nenhuma cobrança corresponde aos critérios de busca.' : 
                'Nenhuma cobrança encontrada com o filtro selecionado.'}
            </p>
            {termoBusca && (
              <button 
                className="btn btn-outline-secondary mt-2"
                onClick={() => setTermoBusca('')}
              >
                <i className="fas fa-times me-2"></i>
                Limpar busca
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'tabela' ? (
        // Visualização em tabela
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="cursor-pointer" onClick={() => handleMudarOrdenacao('id')}>
                      <div className="d-flex align-items-center">
                        <span>ID</span>
                        <i className={`ms-1 fas fa-sort ${getOrdenacaoClass('id')}`}></i>
                      </div>
                    </th>
                    <th className="cursor-pointer" onClick={() => handleMudarOrdenacao('cliente')}>
                      <div className="d-flex align-items-center">
                        <span>Cliente</span>
                        <i className={`ms-1 ${getOrdenacaoClass('cliente')}`}></i>
                      </div>
                    </th>
                    <th>Descrição</th>
                    <th className="cursor-pointer" onClick={() => handleMudarOrdenacao('valor')}>
                      <div className="d-flex align-items-center">
                        <span>Valor</span>
                        <i className={`ms-1 ${getOrdenacaoClass('valor')}`}></i>
                      </div>
                    </th>
                    <th className="cursor-pointer" onClick={() => handleMudarOrdenacao('dia_cobranca')}>
                      <div className="d-flex align-items-center">
                        <span>Vencimento</span>
                        <i className={`ms-1 ${getOrdenacaoClass('dia_cobranca')}`}></i>
                      </div>
                    </th>
                    <th className="cursor-pointer" onClick={() => handleMudarOrdenacao('status')}>
                      <div className="d-flex align-items-center">
                        <span>Status</span>
                        <i className={`ms-1 ${getOrdenacaoClass('status')}`}></i>
                      </div>
                    </th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cobrancasFiltradas.map(cobranca => (
                    <tr key={cobranca.id}>
                      <td className="align-middle">{cobranca.id}</td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <div className={`avatar-circle me-2 bg-${getAvatarColor(cobranca.cliente?.nome)}`}>
                            {cobranca.cliente?.nome?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span>{cobranca.cliente?.nome || "Cliente não identificado"}</span>
                        </div>
                      </td>
                      <td className="align-middle">{cobranca.descricao}</td>
                      <td className="align-middle fw-bold">{API.formatarMoeda(cobranca.valor)}</td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <i className="far fa-calendar-alt text-muted me-2"></i>
                          {formatarDataVencimento(cobranca.dia_cobranca)}
                        </div>
                      </td>
                      <td className="align-middle">
                        <span className={`badge bg-${getStatusColor(cobranca.status)}`}>
                          {cobranca.status === 'pendente' && <i className="fas fa-clock me-1"></i>}
                          {cobranca.status === 'enviada' && <i className="fas fa-paper-plane me-1"></i>}
                          {cobranca.status === 'paga' && <i className="fas fa-check-circle me-1"></i>}
                          {API.formatarStatus(cobranca.status)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center">
                          <button 
                            className="btn btn-sm btn-outline-info btn-icon me-1"
                            onClick={() => navigate(`/cobrancas/${cobranca.id}`)}
                            title="Ver detalhes"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-outline-primary btn-icon me-1"
                            onClick={() => navigate(`/cobrancas/editar/${cobranca.id}`)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          
                          {cobranca.status === 'pendente' && (
                            <button 
                              className="btn btn-sm btn-outline-success btn-icon me-1"
                              onClick={() => handleEnviarWhatsApp(cobranca.id)}
                              title="Enviar via WhatsApp"
                            >
                              <i className="fab fa-whatsapp"></i>
                            </button>
                          )}
                          
                          {cobranca.status !== 'paga' && (
                            <button 
                              className="btn btn-sm btn-outline-success btn-icon me-1"
                              onClick={() => handleMarcarComoPaga(cobranca.id)}
                              title="Marcar como paga"
                            >
                              <i className="fas fa-check-circle"></i>
                            </button>
                          )}
                          
                          <button 
                            className="btn btn-sm btn-outline-danger btn-icon"
                            data-bs-toggle="modal" 
                            data-bs-target="#confirmarExclusaoModal"
                            onClick={() => setCobrancaParaExcluir(cobranca)}
                            title="Excluir"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer bg-white border-0">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">Mostrando {cobrancasFiltradas.length} de {cobrancas.length} cobranças</small>
            </div>
          </div>
        </div>
      ) : (
        // Visualização em cards
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {cobrancasFiltradas.map(cobranca => (
            <div key={cobranca.id} className="col">
              <div className="card h-100 border-0 shadow-sm">
                <div className={`card-header bg-${getStatusColor(cobranca.status)} bg-opacity-10 d-flex justify-content-between align-items-center`}>
                  <div className="d-flex align-items-center">
                    <div className={`avatar-circle me-2 bg-${getAvatarColor(cobranca.cliente?.nome)}`}>
                      {cobranca.cliente?.nome?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <h6 className="mb-0">{cobranca.cliente?.nome || "Cliente não identificado"}</h6>
                      <small className="text-muted">Cobrança #{cobranca.id}</small>
                    </div>
                  </div>
                  <span className={`badge bg-${getStatusColor(cobranca.status)}`}>
                    {cobranca.status === 'pendente' && <i className="fas fa-clock me-1"></i>}
                    {cobranca.status === 'enviada' && <i className="fas fa-paper-plane me-1"></i>}
                    {cobranca.status === 'paga' && <i className="fas fa-check-circle me-1"></i>}
                    {API.formatarStatus(cobranca.status)}
                  </span>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <h5 className="card-title mb-1">{cobranca.descricao}</h5>
                    <h3 className="text-success mb-0">{API.formatarMoeda(cobranca.valor)}</h3>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex mb-2">
                      <div className="text-muted me-2" style={{width: '24px'}}>
                        <i className="far fa-calendar-alt"></i>
                      </div>
                      <div>
                        <span className="fw-bold">Vencimento:</span> {formatarDataVencimento(cobranca.dia_cobranca)}
                      </div>
                    </div>
                    
                    {cobranca.dataPagamento && (
                      <div className="d-flex mb-2">
                        <div className="text-muted me-2" style={{width: '24px'}}>
                          <i className="fas fa-calendar-check"></i>
                        </div>
                        <div>
                          <span className="fw-bold">Data Pagamento:</span> {new Date(cobranca.dataPagamento).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    )}
                    
                    {cobranca.telefone && (
                      <div className="d-flex">
                        <div className="text-muted me-2" style={{width: '24px'}}>
                          <i className="fab fa-whatsapp text-success"></i>
                        </div>
                        <div>
                          {cobranca.cliente?.telefone}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-footer bg-white border-top-0">
                  <div className="d-flex justify-content-between">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/cobrancas/${cobranca.id}`)}
                    >
                      <i className="fas fa-eye me-1"></i>
                      Detalhes
                    </button>
                    
                    <div>
                      {cobranca.status === 'pendente' && (
                        <button 
                          className="btn btn-sm btn-outline-success btn-icon me-1"
                          onClick={() => handleEnviarWhatsApp(cobranca.id)}
                          title="Enviar via WhatsApp"
                        >
                          <i className="fab fa-whatsapp"></i>
                        </button>
                      )}
                      
                      {cobranca.status !== 'paga' && (
                        <button 
                          className="btn btn-sm btn-outline-success btn-icon me-1"
                          onClick={() => handleMarcarComoPaga(cobranca.id)}
                          title="Marcar como paga"
                        >
                          <i className="fas fa-check-circle"></i>
                        </button>
                      )}
                      
                      <button 
                        className="btn btn-sm btn-outline-danger btn-icon"
                        data-bs-toggle="modal" 
                        data-bs-target="#confirmarExclusaoModal"
                        onClick={() => setCobrancaParaExcluir(cobranca)}
                        title="Excluir"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de confirmação de exclusão */}
      <div className="modal fade" id="confirmarExclusaoModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirmar Exclusão</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {cobrancaParaExcluir && (
                <div className="text-center mb-4">
                  <div className={`avatar-circle mx-auto mb-3 bg-${getStatusColor(cobrancaParaExcluir.status)}`} style={{width: '64px', height: '64px', fontSize: '24px'}}>
                    <i className="fas fa-file-invoice-dollar" style={{fontSize: '24px'}}></i>
                  </div>
                  <h5>{cobrancaParaExcluir.descricao}</h5>
                  <p className="text-muted mb-1">Cliente: {cobrancaParaExcluir.cliente?.nome}</p>
                  <p className="fs-5 text-success fw-bold mb-3">{API.formatarMoeda(cobrancaParaExcluir.valor)}</p>
                  
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Tem certeza que deseja excluir esta cobrança?
                    <br />
                    <small className="text-danger">Esta ação não pode ser desfeita.</small>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={handleExcluir}>
                <i className="fas fa-trash me-2"></i>
                Excluir Cobrança
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toasts para notificações */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="toastSucesso" className="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
          <div className="d-flex">
            <div className="toast-body" id="toastSucessoTexto">
              Operação realizada com sucesso!
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
        
        <div id="toastErro" className="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
          <div className="d-flex">
            <div className="toast-body" id="toastErroTexto">
              Ocorreu um erro. Por favor, tente novamente.
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      </div>
    </div>
  );
}; 