const { Navigate } = window.ReactRouterDOM;

// Componente para proteger rotas, permitindo acesso apenas a usuários autenticados
// Redireciona para a página de login se o usuário não estiver autenticado
function PrivateRoute({ children }) {
  const isAuthenticated = Auth.isAuthenticated();
  console.log('PrivateRoute: isAuthenticated =', isAuthenticated);
  
  // Debug: verificar se o token existe
  const token = Auth.getToken();
  console.log('PrivateRoute: token exists =', !!token);
  
  if (!isAuthenticated) {
    console.log('PrivateRoute: Redirecionando para login por não estar autenticado');
    return <Navigate to="/login" />;
  }
  
  // Debug: verificar dados do usuário
  try {
    const userData = Auth.getUserData();
    console.log('PrivateRoute: userData exists =', !!userData);
  } catch (e) {
    console.error('PrivateRoute: Erro ao obter dados do usuário', e);
  }
  
  return children;
}; 