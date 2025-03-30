const { useState, useEffect } = React;
const { useParams, useNavigate } = window.ReactRouterDOM;

function EmpresaConfig() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    endereco: '',
    chavePix: '',
    pixTipo: 'CPF',
    whatsappToken: ''
  });
  
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Carrega os dados do usuário
    const loadUsuario = async () => {
      try {
        const data = await Auth.getCurrentUser();
        setUsuario(data);
        
        // Se não foi especificado um ID, usa o ID da empresa do usuário logado
        if (!id && data.empresa) {
          loadEmpresa(data.empresaId);
        } else if (id) {
          loadEmpresa(id);
        } else {
          setCarregando(false);
          setErro('Empresa não encontrada');
        }
      } catch (error) {
        setCarregando(false);
        setErro('Erro ao carregar dados do usuário');
      }
    };
    
    loadUsuario();
  }, [id]);

  // Carrega os dados da empresa
  const loadEmpresa = async (empresaId) => {
    try {
      const empresa = await API.Empresa.obterEmpresa(empresaId);
      console.log('Dados da empresa carregados:', empresa);
      setFormData({
        nome: empresa.nome || '',
        cpfCnpj: empresa.cpfCnpj || '',
        telefone: empresa.telefone || '',
        endereco: empresa.endereco || '',
        chavePix: empresa.chavePix || '',
        pixTipo: empresa.pixTipo || 'CPF',
        whatsappToken: empresa.whatsappToken || ''
      });
      setCarregando(false);
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
      setCarregando(false);
      setErro('Erro ao carregar dados da empresa. Tente novamente mais tarde.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      // Valida os dados
      if (!formData.nome) {
        throw new Error('O nome da empresa é obrigatório');
      }

      // Salva as alterações
      const empresaId = id || usuario.empresaId;
      await API.Empresa.atualizar(empresaId, formData);
      
      setSucesso('Configurações salvas com sucesso!');
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSucesso('');
      }, 3000);
    } catch (error) {
      setErro(error.message || 'Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Configurações da Empresa</h5>
            </div>
            <div className="card-body">
              {erro && (
                <div className="alert alert-danger" role="alert">
                  {erro}
                </div>
              )}
              
              {sucesso && (
                <div className="alert alert-success" role="alert">
                  {sucesso}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Informações Gerais</h6>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="nome" className="form-label">Nome da Empresa *</label>
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
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="cpfCnpj" className="form-label">CPF/CNPJ</label>
                    <input
                      type="text"
                      className="form-control"
                      id="cpfCnpj"
                      name="cpfCnpj"
                      value={formData.cpfCnpj}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="telefone" className="form-label">Telefone</label>
                    <input
                      type="text"
                      className="form-control"
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="endereco" className="form-label">Endereço</label>
                    <input
                      type="text"
                      className="form-control"
                      id="endereco"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Configurações de PIX</h6>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="chavePix" className="form-label">Chave PIX</label>
                    <input
                      type="text"
                      className="form-control"
                      id="chavePix"
                      name="chavePix"
                      value={formData.chavePix}
                      onChange={handleChange}
                      placeholder="Ex: seu@email.com, 12345678900, etc."
                    />
                    <div className="form-text">
                      A chave PIX será incluída nas mensagens de cobrança enviadas aos clientes
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="pixTipo" className="form-label">Tipo de Chave PIX</label>
                    <select
                      className="form-select"
                      id="pixTipo"
                      name="pixTipo"
                      value={formData.pixTipo}
                      onChange={handleChange}
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="TELEFONE">Telefone</option>
                      <option value="ALEATORIA">Chave Aleatória</option>
                    </select>
                  </div>
                </div>
                
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => navigate(-1)}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={salvando}
                  >
                    {salvando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Salvando...
                      </>
                    ) : 'Salvar Configurações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 