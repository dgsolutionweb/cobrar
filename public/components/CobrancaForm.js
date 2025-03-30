/**
 * Componente de formulário de cobrança (para criar e editar)
 */
const CobrancaForm = () => {
  const [formData, setFormData] = React.useState({
    descricao: '',
    valor: '',
    dia_cobranca: '',
    clienteId: '',
    status: 'pendente'
  });
  
  const [clientes, setClientes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingClientes, setLoadingClientes] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isEdicao, setIsEdicao] = React.useState(false);
  
  const params = window.ReactRouterDOM.useParams();
  const navigate = window.ReactRouterDOM.useNavigate();
  const cobrancaId = params.id;
  
  React.useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carrega a lista de clientes
        setLoadingClientes(true);
        const clientesData = await API.clientes.getAll();
        setClientes(clientesData);
        setLoadingClientes(false);
        
        // Se tem ID, é edição
        if (cobrancaId) {
          setIsEdicao(true);
          setLoading(true);
          const cobranca = await API.cobrancas.getById(cobrancaId);
          setFormData({
            descricao: cobranca.descricao,
            valor: cobranca.valor.toString(),
            dia_cobranca: cobranca.dia_cobranca.toString(),
            clienteId: cobranca.clienteId.toString(),
            status: cobranca.status
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
        setLoading(false);
        setLoadingClientes(false);
      }
    };
    
    carregarDados();
  }, [cobrancaId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.descricao.trim() || !formData.valor || !formData.dia_cobranca || !formData.clienteId) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    // Valida o dia de cobrança (1-31)
    const dia = parseInt(formData.dia_cobranca);
    if (isNaN(dia) || dia < 1 || dia > 31) {
      setError('O dia de cobrança deve ser um número entre 1 e 31.');
      return;
    }
    
    // Valida o valor
    const valor = parseFloat(formData.valor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setError('O valor deve ser um número positivo.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepara os dados para envio
      const cobrancaData = {
        ...formData,
        valor: valor,
        dia_cobranca: dia,
        clienteId: parseInt(formData.clienteId)
      };
      
      if (isEdicao) {
        await API.cobrancas.update(cobrancaId, cobrancaData);
      } else {
        await API.cobrancas.create(cobrancaData);
      }
      
      setLoading(false);
      navigate('/cobrancas');
    } catch (err) {
      console.error('Erro ao salvar cobrança:', err);
      setError('Erro ao salvar cobrança. Por favor, tente novamente.');
      setLoading(false);
    }
  };
  
  if ((loading && isEdicao) || loadingClientes) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <h2 className="mb-4">{isEdicao ? 'Editar Cobrança' : 'Nova Cobrança'}</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {clientes.length === 0 ? (
        <div className="alert alert-warning" role="alert">
          Você precisa cadastrar um cliente antes de criar uma cobrança.
          <br />
          <window.ReactRouterDOM.Link to="/clientes/novo" className="btn btn-primary mt-2">
            Cadastrar Cliente
          </window.ReactRouterDOM.Link>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-8 col-lg-6">
            <div className="form-container">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="clienteId" className="form-label">Cliente</label>
                  <select
                    className="form-select"
                    id="clienteId"
                    name="clienteId"
                    value={formData.clienteId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome} ({cliente.telefone})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="descricao" className="form-label">Descrição</label>
                  <input
                    type="text"
                    className="form-control"
                    id="descricao"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="valor" className="form-label">Valor (R$)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="valor"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                    placeholder="Ex: 99.90"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="dia_cobranca" className="form-label">Dia de Cobrança</label>
                  <input
                    type="number"
                    className="form-control"
                    id="dia_cobranca"
                    name="dia_cobranca"
                    value={formData.dia_cobranca}
                    onChange={handleChange}
                    min="1"
                    max="31"
                    required
                  />
                  <small className="form-text text-muted">
                    Dia do mês em que a cobrança deve ser enviada (1-31).
                  </small>
                </div>
                
                {isEdicao && (
                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">Status</label>
                    <select
                      className="form-select"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="pendente">Pendente</option>
                      <option value="enviada">Enviada</option>
                      <option value="paga">Paga</option>
                    </select>
                  </div>
                )}
                
                <div className="d-flex justify-content-between">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => navigate('/cobrancas')}
                  >
                    Cancelar
                  </button>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 