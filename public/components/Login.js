const { useState } = React;
const { Navigate, useNavigate } = window.ReactRouterDOM;

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Redireciona para o dashboard se já estiver autenticado
  if (Auth.isAuthenticated()) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    // Validações básicas
    if (!email || !senha) {
      setErro('Por favor, preencha todos os campos.');
      setCarregando(false);
      return;
    }

    try {
      await Auth.login(email, senha);
      navigate('/');
    } catch (error) {
      setErro(error.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Sistema de Cobranças</h2>
              <h5 className="text-center mb-4">Login</h5>
              
              {erro && (
                <div className="alert alert-danger" role="alert">
                  {erro}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={carregando}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="senha" className="form-label">Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    id="senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={carregando}
                    required
                  />
                </div>
                
                <div className="d-grid gap-2 mt-4">
                  <button type="submit" className="btn btn-primary" disabled={carregando}>
                    {carregando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Entrando...
                      </>
                    ) : 'Entrar'}
                  </button>
                </div>
              </form>
              
              <div className="mt-3 text-center">
                <p>Não tem uma conta? <a href="/#/register" className="text-decoration-none">Registre-se</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 