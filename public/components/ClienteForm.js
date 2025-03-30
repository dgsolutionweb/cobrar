/**
 * Componente de formulário de cliente (para criar e editar)
 */
const ClienteForm = () => {
  const [formData, setFormData] = React.useState({
    nome: '',
    telefone: ''
  });
  
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [isEdicao, setIsEdicao] = React.useState(false);
  
  const params = window.ReactRouterDOM.useParams();
  const navigate = window.ReactRouterDOM.useNavigate();
  const clienteId = params.id;
  
  React.useEffect(() => {
    const carregarCliente = async () => {
      // Se tem ID, é edição
      if (clienteId) {
        setIsEdicao(true);
        try {
          setLoading(true);
          const cliente = await API.clientes.getById(clienteId);
          setFormData({
            nome: cliente.nome,
            telefone: cliente.telefone
          });
          setLoading(false);
        } catch (err) {
          console.error('Erro ao carregar cliente:', err);
          setError('Erro ao carregar dados do cliente. Por favor, tente novamente.');
          setLoading(false);
        }
      }
    };
    
    carregarCliente();
  }, [clienteId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome.trim() || !formData.telefone.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEdicao) {
        await API.clientes.update(clienteId, formData);
      } else {
        await API.clientes.create(formData);
      }
      
      setLoading(false);
      navigate('/clientes');
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      setError('Erro ao salvar cliente. Por favor, tente novamente.');
      setLoading(false);
    }
  };
  
  if (loading && isEdicao) {
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
      <h2 className="mb-4">{isEdicao ? 'Editar Cliente' : 'Novo Cliente'}</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="row">
        <div className="col-md-8 col-lg-6">
          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="nome" className="form-label">Nome</label>
                <input
                  type="text"
                  className="form-control"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="telefone" className="form-label">Telefone (formato internacional)</label>
                <input
                  type="text"
                  className="form-control"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="Ex: 5511999999999"
                  required
                />
                <small className="form-text text-muted">
                  Inclua o código do país (Ex: 55 para Brasil) e DDD, sem espaços ou caracteres especiais.
                </small>
              </div>
              
              <div className="d-flex justify-content-between">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => navigate('/clientes')}
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
    </div>
  );
}; 