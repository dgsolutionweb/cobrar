/**
 * Componente da barra de navegação
 */
const NavBar = ({ usuario, onLogout }) => {
  const navigate = window.ReactRouterDOM.useNavigate();
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <a className="navbar-brand" href="/#/">
          <i className="fas fa-comment-dollar me-2"></i>
          Sistema de Cobranças
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link" href="/#/">
                <i className="fas fa-tachometer-alt me-1"></i>
                Dashboard
              </a>
            </li>
            
            <li className="nav-item">
              <a className="nav-link" href="/#/clientes">
                <i className="fas fa-users me-1"></i>
                Clientes
              </a>
            </li>
            
            <li className="nav-item">
              <a className="nav-link" href="/#/cobrancas">
                <i className="fas fa-file-invoice-dollar me-1"></i>
                Cobranças
              </a>
            </li>
            
            <li className="nav-item">
              <a className="nav-link" href="/#/configuracoes">
                <i className="fas fa-cog me-1"></i>
                Configurações
              </a>
            </li>
          </ul>
          
          {usuario && (
            <div className="dropdown">
              <button 
                className="btn btn-primary dropdown-toggle" 
                type="button" 
                id="userDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <i className="fas fa-user-circle me-1"></i>
                {usuario.nome || 'Usuário'}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <div className="dropdown-item-text">
                    <div className="fw-bold">{usuario.nome}</div>
                    <div className="small text-muted">{usuario.email}</div>
                    {usuario.empresa && (
                      <div className="small text-muted mt-1">
                        <i className="fas fa-building me-1"></i>
                        {usuario.empresa.nome}
                      </div>
                    )}
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a className="dropdown-item" href="/#/configuracoes">
                    <i className="fas fa-cog me-2"></i>
                    Configurações
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/#/configuracoes/whatsapp">
                    <i className="fab fa-whatsapp me-2"></i>
                    Configurar WhatsApp
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item" onClick={onLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Sair
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}; 