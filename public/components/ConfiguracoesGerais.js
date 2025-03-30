const { useState, useEffect } = React;
const { Link, useNavigate } = window.ReactRouterDOM;

function ConfiguracoesGerais() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    // Carrega os dados do usuário logado
    const loadUsuario = async () => {
      try {
        const usuarioData = await Auth.getCurrentUser();
        setUsuario(usuarioData);
        
        if (usuarioData.empresaId) {
          loadEmpresa(usuarioData.empresaId);
        } else {
          setCarregando(false);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setErro('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
        setCarregando(false);
      }
    };
    
    loadUsuario();
  }, []);

  // Carrega os dados da empresa
  const loadEmpresa = async (empresaId) => {
    try {
      const empresaData = await API.Empresa.obterEmpresa(empresaId);
      setEmpresa(empresaData);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
      setErro('Erro ao carregar dados da empresa. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
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
              <h5 className="mb-0">Configurações do Sistema</h5>
            </div>
            <div className="card-body">
              {erro && (
                <div className="alert alert-danger" role="alert">
                  {erro}
                </div>
              )}
              
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div className="icon-wrapper bg-primary text-white me-3">
                          <i className="fas fa-building"></i>
                        </div>
                        <h5 className="card-title mb-0">Dados da Empresa</h5>
                      </div>
                      <p className="card-text">
                        Configure os dados da sua empresa, como nome, endereço e informações de pagamento que serão exibidos nas cobranças.
                      </p>
                      <Link
                        to={`/configuracoes/empresa/${usuario?.empresaId}`}
                        className="btn btn-outline-primary"
                      >
                        Configurar Empresa
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div className="icon-wrapper bg-success text-white me-3">
                          <i className="fab fa-whatsapp"></i>
                        </div>
                        <h5 className="card-title mb-0">WhatsApp</h5>
                      </div>
                      <p className="card-text">
                        Configure a integração com WhatsApp para envio automático de cobranças e notificações para seus clientes.
                      </p>
                      <Link
                        to={`/configuracoes/whatsapp/${usuario?.empresaId}`}
                        className="btn btn-outline-success"
                      >
                        Configurar WhatsApp
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div className="icon-wrapper bg-info text-white me-3">
                          <i className="fas fa-user"></i>
                        </div>
                        <h5 className="card-title mb-0">Perfil de Usuário</h5>
                      </div>
                      <p className="card-text">
                        Atualize seus dados pessoais, senha e preferências de notificação.
                      </p>
                      <Link
                        to="/configuracoes/perfil"
                        className="btn btn-outline-info"
                      >
                        Editar Perfil
                      </Link>
                    </div>
                  </div>
                </div>
                
                {usuario?.role === 'admin' && (
                  <div className="col-md-6 mb-4">
                    <div className="card h-100 border">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="icon-wrapper bg-warning text-white me-3">
                            <i className="fas fa-users"></i>
                          </div>
                          <h5 className="card-title mb-0">Usuários</h5>
                        </div>
                        <p className="card-text">
                          Gerencie os usuários que têm acesso ao sistema e configure suas permissões.
                        </p>
                        <Link
                          to="/configuracoes/usuarios"
                          className="btn btn-outline-warning"
                        >
                          Gerenciar Usuários
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          font-size: 1.25rem;
        }
      `}</style>
    </div>
  );
}

// Exporta o componente
window.ConfiguracoesGerais = ConfiguracoesGerais; 