const { useState, useEffect } = React;
const { useParams, useNavigate } = window.ReactRouterDOM;

function WhatsAppConfig() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [carregando, setCarregando] = useState(true);
  const [statusSessao, setStatusSessao] = useState('Desconectado');
  const [qrCode, setQrCode] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [processando, setProcessando] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [intervalo, setIntervalo] = useState(null);
  const [enviandoCobrancas, setEnviandoCobrancas] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState(null);
  const [statusOriginal, setStatusOriginal] = useState(null);

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
    
    // Limpa o intervalo quando o componente é desmontado
    return () => {
      if (intervalo) {
        clearInterval(intervalo);
      }
    };
  }, [id]);

  // Carrega os dados da empresa
  const loadEmpresa = async (empresaId) => {
    try {
      const empresa = await API.Empresa.obterEmpresa(empresaId);
      setEmpresa(empresa);
      
      // Verifica o status da sessão do WhatsApp
      await verificarStatusSessao(empresaId);
      
      // Configura um intervalo para verificar o status periodicamente
      const intervalId = setInterval(() => {
        verificarStatusSessao(empresaId);
      }, 10000); // Verifica a cada 10 segundos
      
      setIntervalo(intervalId);
      setCarregando(false);
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
      setCarregando(false);
      setErro('Erro ao carregar dados da empresa. Tente novamente mais tarde.');
    }
  };

  // Verifica o status da sessão do WhatsApp
  const verificarStatusSessao = async (empresaId) => {
    try {
      console.log('Verificando status da sessão do WhatsApp para empresa:', empresaId);
      const status = await API.Empresa.statusSessaoWhatsApp(empresaId);
      console.log('Status da sessão recebido:', status);
      
      // Converte o status para iniciar com letra maiúscula para exibição
      let statusFormatado = 'Desconectado';
      if (status.status === 'conectado') {
        statusFormatado = 'Conectado';
      } else if (status.status === 'aguardando_scan') {
        statusFormatado = 'Aguardando scan';
      } else if (status.status === 'iniciando') {
        statusFormatado = 'Iniciando...';
      } else if (status.status) {
        // Formata qualquer outro status, capitalizando a primeira letra
        statusFormatado = status.status.charAt(0).toUpperCase() + status.status.slice(1).replace(/_/g, ' ');
      }
      
      setStatusSessao(statusFormatado);
      // Armazena o status original para comparações
      setStatusOriginal(status.status);
      
      if (status.qrCode) {
        console.log('QR Code recebido com tamanho:', status.qrCode.length);
        setQrCode(status.qrCode);
      } else {
        console.log('Nenhum QR Code recebido');
        setQrCode(null);
      }
    } catch (error) {
      console.error('Erro ao verificar status da sessão WhatsApp:', error);
    }
  };

  // Inicia uma nova sessão do WhatsApp
  const iniciarSessao = async () => {
    setProcessando(true);
    setErro('');
    setSucesso('');
    
    try {
      const empresaId = id || usuario.empresaId;
      await API.Empresa.iniciarSessaoWhatsApp(empresaId);
      setSucesso('Iniciando sessão do WhatsApp. Aguardando QR Code...');
      
      // Verifica o status imediatamente após iniciar a sessão
      await verificarStatusSessao(empresaId);
    } catch (error) {
      setErro(error.message || 'Erro ao iniciar sessão do WhatsApp. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  // Encerra a sessão atual do WhatsApp
  const encerrarSessao = async () => {
    setProcessando(true);
    setErro('');
    setSucesso('');
    
    try {
      const empresaId = id || usuario.empresaId;
      await API.Empresa.encerrarSessaoWhatsApp(empresaId);
      setQrCode(null);
      setSucesso('Sessão do WhatsApp encerrada com sucesso.');
      
      // Verifica o status imediatamente após encerrar a sessão
      await verificarStatusSessao(empresaId);
    } catch (error) {
      setErro(error.message || 'Erro ao encerrar sessão do WhatsApp. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  // Envia as cobranças diárias manualmente
  const enviarCobrancasDiarias = async () => {
    setEnviandoCobrancas(true);
    setErro('');
    setSucesso('');
    setResultadoEnvio(null);
    
    try {
      const empresaId = id || usuario.empresaId;
      const resultado = await API.Empresa.enviarCobrancasDiarias(empresaId);
      
      setResultadoEnvio(resultado);
      setSucesso(`Cobranças processadas com sucesso! Enviadas: ${resultado.enviadas} de ${resultado.total}.`);
    } catch (error) {
      setErro('Erro ao enviar cobranças. Verifique se o WhatsApp está conectado.');
      console.error('Erro ao enviar cobranças diárias:', error);
    } finally {
      setEnviandoCobrancas(false);
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
                <h5 className="mb-0">Configurações do WhatsApp</h5>
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
              
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card border h-100">
                    <div className="card-body">
                      <h6 className="card-title">Status da Conexão</h6>
                      <div className="d-flex align-items-center mb-3">
                        <div className={`status-indicator ${statusOriginal === 'conectado' ? 'bg-success' : 'bg-danger'}`}></div>
                        <span className="ms-2">{statusSessao}</span>
                      </div>
                      
                      <p className="card-text">
                        {statusOriginal === 'conectado' 
                          ? 'O WhatsApp está conectado e pronto para enviar mensagens de cobrança.'
                          : 'O WhatsApp não está conectado. Inicie uma sessão e escaneie o QR Code com o seu celular.'}
                      </p>
                      
                      <div className="d-grid gap-2 d-md-flex">
                        {statusOriginal !== 'conectado' ? (
                          <button 
                            type="button" 
                            className="btn btn-primary me-md-2"
                            onClick={iniciarSessao}
                            disabled={processando}
                          >
                            {processando ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Conectando...
                              </>
                            ) : 'Iniciar Sessão'}
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            className="btn btn-danger me-md-2"
                            onClick={encerrarSessao}
                            disabled={processando}
                          >
                            {processando ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Desconectando...
                              </>
                            ) : 'Encerrar Sessão'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card border h-100">
                    <div className="card-body text-center">
                      <h6 className="card-title mb-3">QR Code para Conexão</h6>
                      
                      {qrCode ? (
                        <div className="qr-code-container">
                          <img src={qrCode} alt="QR Code para conexão do WhatsApp" className="img-fluid" />
                          <p className="card-text mt-3">
                            Escaneie este QR Code com o WhatsApp do seu celular para conectar.
                          </p>
                        </div>
                      ) : (
                        <div className="qr-code-placeholder d-flex flex-column align-items-center justify-content-center">
                          <i className="fas fa-qrcode fa-5x text-muted mb-3"></i>
                          {statusOriginal === 'conectado' ? (
                            <p className="card-text">
                              WhatsApp conectado com sucesso! Não é necessário escanear o QR Code.
                            </p>
                          ) : (
                            <p className="card-text">
                              Inicie uma sessão para gerar o QR Code de conexão.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card border mb-4">
                <div className="card-body">
                  <h6 className="card-title">Instruções de Uso</h6>
                  <ol className="mb-0">
                    <li className="mb-2">Clique em "Iniciar Sessão" para gerar um QR Code.</li>
                    <li className="mb-2">Abra o WhatsApp no seu celular.</li>
                    <li className="mb-2">Toque em Configurações (ou nos três pontos) &gt; WhatsApp Web.</li>
                    <li className="mb-2">Escaneie o QR Code exibido nesta página.</li>
                    <li>Após a conexão, o sistema poderá enviar mensagens de cobrança automaticamente.</li>
                  </ol>
                </div>
              </div>
              
              <div className="alert alert-warning" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Importante:</strong> Mantenha seu celular conectado à internet para que as mensagens possam ser enviadas.
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="border-bottom pb-2 mb-3">Envio Automático de Cobranças</h6>
                  <p className="mb-3">
                    O sistema enviará automaticamente as cobranças nos dias programados. 
                    Você também pode iniciar o envio manualmente clicando no botão abaixo.
                  </p>
                  
                  {resultadoEnvio && (
                    <div className="alert alert-info mb-3">
                      <strong>Último processamento:</strong>
                      <ul className="mb-0 mt-1">
                        <li>Total de cobranças: {resultadoEnvio.total}</li>
                        <li>Cobranças enviadas: {resultadoEnvio.enviadas}</li>
                        <li>Data/hora: {new Date().toLocaleString()}</li>
                      </ul>
                    </div>
                  )}
                  
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={enviarCobrancasDiarias}
                    disabled={enviandoCobrancas || statusOriginal !== 'conectado'}
                  >
                    {enviandoCobrancas ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processando cobranças...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Enviar Cobranças Agora
                      </>
                    )}
                  </button>
                  
                  {statusOriginal !== 'conectado' && (
                    <div className="alert alert-warning mt-3">
                      É necessário conectar o WhatsApp antes de enviar cobranças.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 