const { useState, useEffect } = React;
const { Navigate, useNavigate } = window.ReactRouterDOM;

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    empresaNome: '',
    documento: '',
    telefone: '',
    endereco: '',
  });
  
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // Redireciona para o dashboard se já estiver autenticado
  if (Auth.isAuthenticated()) {
    return <Navigate to="/" />;
  }

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
    setCarregando(true);

    // Validações básicas
    if (formData.senha !== formData.confirmarSenha) {
      setErro('As senhas não coincidem.');
      setCarregando(false);
      return;
    }

    // Verificar se todos os campos obrigatórios estão preenchidos
    const camposObrigatorios = ['nome', 'email', 'senha', 'empresaNome'];
    for (const campo of camposObrigatorios) {
      if (!formData[campo]) {
        setErro(`O campo ${campo.replace('empresa', 'empresa ')} é obrigatório.`);
        setCarregando(false);
        return;
      }
    }

    try {
      // Primeiro criar a empresa
      const empresaResponse = await API.Empresa.criarEmpresa({
        nome: formData.empresaNome,
        documento: formData.documento,
        telefone: formData.telefone,
        endereco: formData.endereco
      });

      // Em seguida, registrar o usuário vinculado à empresa
      const usuarioResponse = await Auth.register({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        empresaId: empresaResponse.id,
        cargo: 'Administrador'
      });

      setSucesso(true);
      
      // Redireciona para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setErro(error.message || 'Falha no registro. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Cadastre sua Empresa</h2>
              
              {erro && (
                <div className="alert alert-danger" role="alert">
                  {erro}
                </div>
              )}
              
              {sucesso && (
                <div className="alert alert-success" role="alert">
                  Empresa e usuário criados com sucesso! Redirecionando para a página de login...
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <h5 className="border-bottom pb-2 mb-3">Dados da Empresa</h5>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="empresaNome" className="form-label">Nome da Empresa *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="empresaNome"
                      name="empresaNome"
                      value={formData.empresaNome}
                      onChange={handleChange}
                      disabled={carregando || sucesso}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="documento" className="form-label">CNPJ/CPF</label>
                    <input
                      type="text"
                      className="form-control"
                      id="documento"
                      name="documento"
                      value={formData.documento}
                      onChange={handleChange}
                      disabled={carregando || sucesso}
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="telefone" className="form-label">Telefone</label>
                    <input
                      type="text"
                      className="form-control"
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      disabled={carregando || sucesso}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="endereco" className="form-label">Endereço</label>
                    <input
                      type="text"
                      className="form-control"
                      id="endereco"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleChange}
                      disabled={carregando || sucesso}
                    />
                  </div>
                </div>
                
                <h5 className="border-bottom pb-2 mb-3 mt-4">Dados do Administrador</h5>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="nome" className="form-label">Nome Completo *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      disabled={carregando || sucesso}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={carregando || sucesso}
                      required
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="senha" className="form-label">Senha *</label>
                    <input
                      type="password"
                      className="form-control"
                      id="senha"
                      name="senha"
                      value={formData.senha}
                      onChange={handleChange}
                      disabled={carregando || sucesso}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="confirmarSenha" className="form-label">Confirmar Senha *</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmarSenha"
                      name="confirmarSenha"
                      value={formData.confirmarSenha}
                      onChange={handleChange}
                      disabled={carregando || sucesso}
                      required
                    />
                  </div>
                </div>
                
                <div className="d-grid gap-2 mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={carregando || sucesso}
                  >
                    {carregando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processando...
                      </>
                    ) : 'Cadastrar Empresa'}
                  </button>
                </div>
              </form>
              
              <div className="mt-3 text-center">
                <p>Já tem uma conta? <a href="/#/login" className="text-decoration-none">Faça login</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 