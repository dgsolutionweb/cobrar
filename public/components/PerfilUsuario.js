const { useState, useEffect } = React;
const { useNavigate } = window.ReactRouterDOM;

function PerfilUsuario() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmacaoSenha: ''
  });

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Carrega os dados do usuário logado
    const loadUsuario = async () => {
      try {
        const usuarioData = await Auth.getCurrentUser();
        setUsuario(usuarioData);
        setFormData({
          nome: usuarioData.nome || '',
          email: usuarioData.email || '',
          senha: '',
          confirmacaoSenha: ''
        });
        setCarregando(false);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setErro('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
        setCarregando(false);
      }
    };
    
    loadUsuario();
  }, []);

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
        throw new Error('O nome é obrigatório');
      }

      if (!formData.email) {
        throw new Error('O email é obrigatório');
      }

      // Verifica se a senha e confirmação coincidem
      if (formData.senha && formData.senha !== formData.confirmacaoSenha) {
        throw new Error('As senhas não coincidem');
      }

      // Prepara os dados para envio
      const dadosAtualizados = {
        nome: formData.nome,
        email: formData.email
      };

      // Inclui a senha apenas se foi preenchida
      if (formData.senha) {
        dadosAtualizados.senha = formData.senha;
      }

      // Salva as alterações
      await Auth.updateUser(usuario.id, dadosAtualizados);
      
      // Limpa os campos de senha
      setFormData(prevState => ({
        ...prevState,
        senha: '',
        confirmacaoSenha: ''
      }));
      
      setSucesso('Perfil atualizado com sucesso!');
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSucesso('');
      }, 3000);
    } catch (error) {
      setErro(error.message || 'Erro ao atualizar perfil. Tente novamente.');
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
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Meu Perfil</h5>
                <button 
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => navigate('/configuracoes')}
                >
                  Voltar para Configurações
                </button>
              </div>
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
                    <h6 className="border-bottom pb-2 mb-3">Informações Pessoais</h6>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="nome" className="form-label">Nome *</label>
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
                    <label htmlFor="email" className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-12 mt-3">
                    <div className="alert alert-info" role="alert">
                      <i className="fas fa-info-circle me-2"></i>
                      <span>Empresa: <strong>{usuario?.empresa?.nome}</strong></span>
                      <br />
                      <i className="fas fa-user-shield me-2"></i>
                      <span>Função: <strong>{usuario?.role === 'admin' ? 'Administrador' : 'Usuário'}</strong></span>
                    </div>
                  </div>
                </div>
                
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Alterar Senha</h6>
                    <p className="text-muted small mb-3">
                      Preencha apenas se desejar alterar sua senha atual
                    </p>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="senha" className="form-label">Nova Senha</label>
                    <input
                      type="password"
                      className="form-control"
                      id="senha"
                      name="senha"
                      value={formData.senha}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="confirmacaoSenha" className="form-label">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmacaoSenha"
                      name="confirmacaoSenha"
                      value={formData.confirmacaoSenha}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => navigate('/configuracoes')}
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
                    ) : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exporta o componente
window.PerfilUsuario = PerfilUsuario; 