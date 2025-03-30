/**
 * Componente de listagem de clientes
 */
const ClienteList = () => {
  const [clientes, setClientes] = React.useState([]);
  const [clientesFiltrados, setClientesFiltrados] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [clienteParaExcluir, setClienteParaExcluir] = React.useState(null);
  const [termoBusca, setTermoBusca] = React.useState('');
  const [viewMode, setViewMode] = React.useState('tabela'); // 'tabela' ou 'cards'
  
  const navigate = window.ReactRouterDOM.useNavigate();
  
  React.useEffect(() => {
    const carregarClientes = async () => {
      try {
        setLoading(true);
        const data = await API.clientes.getAll();
        setClientes(data);
        setClientesFiltrados(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
        setError('Erro ao carregar clientes. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    carregarClientes();
  }, []);
  
  // Filtra os clientes baseado no termo de busca
  React.useEffect(() => {
    if (!termoBusca.trim()) {
      setClientesFiltrados(clientes);
      return;
    }
    
    const termoLower = termoBusca.toLowerCase();
    const filtrados = clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(termoLower) || 
      cliente.telefone.includes(termoLower) ||
      (cliente.email && cliente.email.toLowerCase().includes(termoLower))
    );
    
    setClientesFiltrados(filtrados);
  }, [termoBusca, clientes]);
  
  const handleExcluir = async () => {
    if (!clienteParaExcluir) return;
    
    try {
      await API.clientes.delete(clienteParaExcluir.id);
      
      // Atualiza a lista de clientes
      setClientes(clientes.filter(cliente => cliente.id !== clienteParaExcluir.id));
      setClienteParaExcluir(null);
      
      // Fecha o modal
      const modalElement = document.getElementById('confirmarExclusaoModal');
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      alert('Erro ao excluir cliente. Por favor, tente novamente.');
    }
  };
  
  // Função para gerar cor de avatar baseada no nome
  const getAvatarColor = (name) => {
    const colors = [
      'primary', 'success', 'danger', 'warning', 'info'
    ];
    
    // Gera um índice baseado no nome para escolher uma cor
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  // Função para formatar o número de telefone
  const formatarTelefone = (telefone) => {
    if (!telefone) return '';
    
    // Remove caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    
    // Verifica se é um número no formato brasileiro
    if (numeros.length === 11) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    } else if (numeros.length === 10) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }
    
    return telefone;
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
        <h2>Clientes</h2>
        <window.ReactRouterDOM.Link to="/clientes/novo" className="btn btn-primary">
          <i className="fas fa-user-plus me-2"></i>
          Novo Cliente
        </window.ReactRouterDOM.Link>
      </div>
      
      {/* Barra de busca e filtros */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="fas fa-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  placeholder="Buscar por nome, telefone ou email..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4 d-flex justify-content-end">
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
      
      {clientesFiltrados.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-users fa-3x text-muted mb-3"></i>
            <h5>Nenhum cliente encontrado</h5>
            <p className="text-muted">
              {termoBusca ? 
                'Nenhum cliente corresponde aos critérios de busca.' : 
                'Nenhum cliente cadastrado. Clique em "Novo Cliente" para adicionar.'}
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
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Email</th>
                    <th className="text-center">Cobranças</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map(cliente => (
                    <tr key={cliente.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className={`avatar-circle me-2 bg-${getAvatarColor(cliente.nome)}`}>
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold">{cliente.nome}</div>
                            <small className="text-muted">ID: {cliente.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href={`https://wa.me/${cliente.telefone.replace(/\D/g, '')}`} 
                           target="_blank" 
                           className="text-decoration-none"
                           title="Enviar mensagem pelo WhatsApp">
                          <i className="fab fa-whatsapp text-success me-2"></i>
                          {formatarTelefone(cliente.telefone)}
                        </a>
                      </td>
                      <td>{cliente.email || <span className="text-muted">—</span>}</td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark">
                          {cliente.cobrancas?.length || 0} cobranças
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center">
                          <button 
                            className="btn btn-sm btn-outline-info btn-icon me-1"
                            title="Ver detalhes"
                            onClick={() => navigate(`/clientes/${cliente.id}`)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-outline-primary btn-icon me-1"
                            title="Editar cliente"
                            onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-outline-danger btn-icon"
                            title="Excluir cliente"
                            data-bs-toggle="modal" 
                            data-bs-target="#confirmarExclusaoModal"
                            onClick={() => setClienteParaExcluir(cliente)}
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
              <small className="text-muted">Mostrando {clientesFiltrados.length} de {clientes.length} clientes</small>
            </div>
          </div>
        </div>
      ) : (
        // Visualização em cards
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {clientesFiltrados.map(cliente => (
            <div key={cliente.id} className="col">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className={`avatar-circle me-3 bg-${getAvatarColor(cliente.nome)}`} style={{width: '48px', height: '48px'}}>
                      {cliente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="card-title mb-0">{cliente.nome}</h5>
                      <small className="text-muted">ID: {cliente.id}</small>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex mb-2">
                      <div className="text-muted me-2" style={{width: '24px'}}>
                        <i className="fab fa-whatsapp text-success"></i>
                      </div>
                      <div>
                        <a href={`https://wa.me/${cliente.telefone.replace(/\D/g, '')}`} 
                           target="_blank" 
                           className="text-decoration-none">
                          {formatarTelefone(cliente.telefone)}
                        </a>
                      </div>
                    </div>
                    
                    {cliente.email && (
                      <div className="d-flex mb-2">
                        <div className="text-muted me-2" style={{width: '24px'}}>
                          <i className="fas fa-envelope"></i>
                        </div>
                        <div>
                          <a href={`mailto:${cliente.email}`} className="text-decoration-none">
                            {cliente.email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div className="d-flex">
                      <div className="text-muted me-2" style={{width: '24px'}}>
                        <i className="fas fa-file-invoice-dollar"></i>
                      </div>
                      <div>
                        {cliente.cobrancas?.length || 0} cobranças
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-white border-top-0">
                  <div className="d-flex justify-content-between">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/clientes/${cliente.id}`)}
                    >
                      <i className="fas fa-eye me-1"></i>
                      Detalhes
                    </button>
                    
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-primary btn-icon me-1"
                        title="Editar cliente"
                        onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      
                      <button 
                        className="btn btn-sm btn-outline-danger btn-icon"
                        title="Excluir cliente"
                        data-bs-toggle="modal" 
                        data-bs-target="#confirmarExclusaoModal"
                        onClick={() => setClienteParaExcluir(cliente)}
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
              {clienteParaExcluir && (
                <div className="text-center mb-4">
                  <div className={`avatar-circle mx-auto mb-3 bg-${getAvatarColor(clienteParaExcluir.nome)}`} style={{width: '64px', height: '64px', fontSize: '24px'}}>
                    {clienteParaExcluir.nome.charAt(0).toUpperCase()}
                  </div>
                  <h5>{clienteParaExcluir.nome}</h5>
                  <p className="text-muted">{formatarTelefone(clienteParaExcluir.telefone)}</p>
                  
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Tem certeza que deseja excluir este cliente?
                    <br />
                    <small className="text-danger">Esta ação não pode ser desfeita e todas as cobranças associadas serão excluídas.</small>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={handleExcluir}>
                <i className="fas fa-trash me-2"></i>
                Excluir Cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 