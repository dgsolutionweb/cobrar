const venom = require('venom-bot');
const { PrismaClient } = require('@prisma/client');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Mapa para armazenar as sessões do WhatsApp por empresa
const clientesWhatsapp = new Map();

// Mapa para armazenar os QR Codes gerados
const qrCodes = new Map();

// Mapa para armazenar os status das sessões
const statusSessoes = new Map();

// Pasta para armazenar os tokens das sessões
const tokensDir = path.join(__dirname, '../../../tokens');
if (!fs.existsSync(tokensDir)) {
  fs.mkdirSync(tokensDir, { recursive: true });
}

/**
 * Inicia a sessão do WhatsApp usando o Venom-bot
 */
async function iniciarSessao(empresaId, whatsappToken) {
  console.log(`[WHATSAPP] Solicitação para iniciar sessão da empresa ${empresaId}`);
  
  // Se já existe uma sessão para esta empresa, encerre-a primeiro
  if (clientesWhatsapp.has(empresaId)) {
    console.log(`[WHATSAPP] Sessão já existe para empresa ${empresaId}, encerrando para reiniciar`);
    await encerrarSessao(empresaId);
  }
  
  // Configuração de pasta específica para cada empresa
  const empresaTokenDir = path.join(tokensDir, `empresa_${empresaId}`);
  if (!fs.existsSync(empresaTokenDir)) {
    fs.mkdirSync(empresaTokenDir, { recursive: true });
    console.log(`[WHATSAPP] Diretório de tokens criado: ${empresaTokenDir}`);
  }
  
  try {
    // Define status como iniciando
    statusSessoes.set(empresaId, 'iniciando');
    console.log(`[WHATSAPP] Status definido como 'iniciando' para empresa ${empresaId}`);
    
    // Limpa o QR code anterior se houver
    qrCodes.delete(empresaId);
    
    const cliente = await venom.create(
      `empresa_${empresaId}`,
      (base64Qrimg, asciiQR, attempts) => {
        console.log(`[WHATSAPP] QR Code gerado para empresa ${empresaId}. Tentativa ${attempts}`);
        
        // Armazena o QR code para exibir na interface
        qrCodes.set(empresaId, base64Qrimg);
        statusSessoes.set(empresaId, 'aguardando_scan');
        console.log(`[WHATSAPP] Status definido como 'aguardando_scan' para empresa ${empresaId}`);
        
        // Verifica se o QR code está no mapa
        console.log(`[WHATSAPP] QR Code armazenado: ${qrCodes.has(empresaId) ? 'SIM' : 'NÃO'}`);
        if (qrCodes.has(empresaId)) {
          console.log(`[WHATSAPP] Tamanho do QR Code: ${base64Qrimg.length} caracteres`);
        }
      },
      (statusSession, session) => {
        console.log(`[WHATSAPP] Status da sessão [${empresaId}]: ${statusSession}`);
        
        // Atualiza o status da sessão
        if (statusSession === 'qrReadSuccess') {
          statusSessoes.set(empresaId, 'conectando');
          // Limpa o QR code após ser escaneado
          qrCodes.delete(empresaId);
        } else if (statusSession === 'qrReadFail') {
          statusSessoes.set(empresaId, 'erro_qr_code');
        } else if (statusSession === 'inChat' || statusSession === 'isLogged') {
          statusSessoes.set(empresaId, 'conectado');
          // Limpa o QR code após conexão
          qrCodes.delete(empresaId);
        } else if (statusSession === 'desconnectedMobile') {
          statusSessoes.set(empresaId, 'desconectado_celular');
        } else if (statusSession === 'browserClose') {
          statusSessoes.set(empresaId, 'desconectado');
          // Remove a sessão do mapa quando o navegador é fechado
          clientesWhatsapp.delete(empresaId);
        }
      },
      {
        folderNameToken: empresaTokenDir,
        headless: true,
        useChrome: false,
        debug: false,
        logQR: true,  // Ativar log do QR code
        autoClose: 0, // Não fechar automaticamente
        disableWelcome: true,
        createPathFileToken: true,
        multidevice: true, // Suporte para multi-dispositivo do WhatsApp
      },
      undefined,
      undefined,
      undefined,
      undefined,
      true // Forçar nova sessão
    );
    
    // Armazena o cliente no mapa
    clientesWhatsapp.set(empresaId, cliente);
    
    // Atualiza o token na base de dados se necessário
    if (!whatsappToken) {
      await prisma.empresa.update({
        where: { id: empresaId },
        data: { whatsappToken: `empresa_${empresaId}` },
      });
    }
    
    console.log(`[WHATSAPP] Cliente WhatsApp iniciado com sucesso para empresa ${empresaId}`);
    return cliente;
  } catch (error) {
    console.error(`[WHATSAPP] Erro ao iniciar cliente WhatsApp para empresa ${empresaId}:`, error);
    statusSessoes.set(empresaId, 'erro');
    throw error;
  }
}

/**
 * Envia uma mensagem de cobrança para um cliente específico
 * @param {string} telefone - Número de telefone do cliente (formato internacional)
 * @param {string} mensagem - Mensagem a ser enviada
 */
async function enviarMensagem(empresaId, telefone, mensagem) {
  try {
    let cliente = clientesWhatsapp.get(empresaId);
    
    // Se não houver cliente, tenta iniciar a sessão
    if (!cliente) {
      const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
      });
      
      if (!empresa || !empresa.whatsappToken) {
        throw new Error(`Empresa ${empresaId} não encontrada ou sem token WhatsApp configurado`);
      }
      
      cliente = await iniciarSessao(empresaId, empresa.whatsappToken);
    }
    
    // Formata o número de telefone
    const numeroFormatado = formatarNumeroTelefone(telefone);
    
    // Envia a mensagem
    await cliente.sendText(`${numeroFormatado}@c.us`, mensagem);
    console.log(`Mensagem enviada para ${numeroFormatado} da empresa ${empresaId}`);
    return true;
  } catch (error) {
    console.error(`Erro ao enviar mensagem para ${telefone} da empresa ${empresaId}:`, error);
    return false;
  }
}

/**
 * Formata o número de telefone para o padrão do WhatsApp
 * @param {string} telefone - Número de telefone (formato internacional)
 * @returns {string} Número formatado para o WhatsApp
 */
function formatarNumeroTelefone(telefone) {
  // Remove todos os caracteres não numéricos
  const numeros = telefone.replace(/\D/g, '');
  
  // Se o número começar com 0, remove o 0
  if (numeros.startsWith('0')) {
    return numeros.substring(1);
  }
  
  // Adiciona o código do país (55) se não existir e o número tiver menos de 13 dígitos
  if (!numeros.startsWith('55') && numeros.length < 13) {
    return `55${numeros}`;
  }
  
  return numeros;
}

/**
 * Verifica e envia cobranças programadas para o dia atual
 */
async function enviarCobrancasDiarias(empresaId) {
  try {
    console.log(`[WHATSAPP] Iniciando envio de cobranças diárias para empresa ${empresaId}`);
    
    // Busca a empresa
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    
    if (!empresa) {
      throw new Error(`Empresa ${empresaId} não encontrada`);
    }
    
    // Obtém o dia atual e o dia de amanhã
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);
    
    const diaAtual = hoje.getDate();
    const diaAmanha = amanha.getDate();
    
    console.log(`[WHATSAPP] Buscando cobranças para os dias ${diaAtual} e ${diaAmanha}`);
    
    // Busca cobranças cujo dia_cobranca é hoje ou amanhã e que não estão pagas
    const cobrancas = await prisma.cobranca.findMany({
      where: {
        empresaId,
        status: { not: 'paga' }, // Não pagas
        OR: [
          { dia_cobranca: diaAtual },  // Cobranças para hoje
          { dia_cobranca: diaAmanha }, // Pré-avisos para amanhã
        ],
      },
      include: {
        cliente: true,
      },
    });
    
    console.log(`[WHATSAPP] Encontradas ${cobrancas.length} cobranças para notificar da empresa ${empresaId}`);
    
    let cobrancasEnviadas = 0;
    
    // Envia mensagens para cada cobrança
    for (const cobranca of cobrancas) {
      if (!cobranca.cliente.telefone) {
        console.log(`[WHATSAPP] Cliente ${cobranca.cliente.id} não possui telefone cadastrado.`);
        continue;
      }
      
      // Se a cobrança já foi notificada hoje, pula
      if (cobranca.ultimaNotificacao) {
        const dataNotificacao = new Date(cobranca.ultimaNotificacao);
        if (dataNotificacao.toDateString() === hoje.toDateString()) {
          console.log(`[WHATSAPP] Cobrança ${cobranca.id} já foi notificada hoje.`);
          continue;
        }
      }
      
      try {
        // Constrói a mensagem de cobrança
        const mensagem = gerarMensagemCobranca(cobranca.cliente, cobranca, empresa);
        
        // Determina se a cobrança é para hoje ou amanhã
        const ehCobrancaDeHoje = cobranca.dia_cobranca === diaAtual;
        
        // Adiciona um prefixo específico para cobranças de amanhã (pré-aviso)
        let mensagemFinal = mensagem;
        if (!ehCobrancaDeHoje) {
          mensagemFinal = `*PRÉ-AVISO*\n\n${mensagem}`;
        }
        
        // Envia a mensagem
        const sucesso = await enviarMensagem(empresaId, cobranca.cliente.telefone, mensagemFinal);
        
        // Atualiza a data da última notificação e o status (se for cobrança de hoje)
        if (sucesso) {
          const dadosAtualizacao = { 
            ultimaNotificacao: new Date()
          };
          
          // Se for cobrança do dia atual, marca como enviada
          if (ehCobrancaDeHoje) {
            dadosAtualizacao.status = 'enviada';
          }
          
          await prisma.cobranca.update({
            where: { id: cobranca.id },
            data: dadosAtualizacao
          });
          
          cobrancasEnviadas++;
        }
      } catch (erroEnvio) {
        console.error(`[WHATSAPP] Erro ao enviar cobrança ${cobranca.id}:`, erroEnvio);
      }
    }
    
    console.log(`[WHATSAPP] Finalizado envio de cobranças diárias para empresa ${empresaId}. Enviadas: ${cobrancasEnviadas} de ${cobrancas.length}`);
    return { total: cobrancas.length, enviadas: cobrancasEnviadas };
  } catch (error) {
    console.error('[WHATSAPP] Erro ao enviar cobranças diárias:', error);
    throw error;
  }
}

/**
 * Gera a mensagem personalizada de cobrança
 * @param {Object} cobranca - Objeto de cobrança com dados do cliente
 * @returns {string} Mensagem formatada
 */
function gerarMensagemCobranca(cliente, cobranca, empresa) {
  // Calcula a data de vencimento baseado no dia_cobranca
  const dataVencimento = calcularDataVencimento(cobranca.dia_cobranca);
  const dataFormatada = dataVencimento.toLocaleDateString('pt-BR');
  const valorFormatado = cobranca.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  console.log(`Gerando mensagem para cobrança ID ${cobranca.id}, dia_cobranca: ${cobranca.dia_cobranca}, data calculada: ${dataFormatada}`);
  console.log('Dados da empresa:', JSON.stringify(empresa, null, 2));
  
  let mensagem = `*AVISO DE COBRANÇA*\n\n`;
  mensagem += `Olá ${cliente.nome},\n\n`;
  mensagem += `Este é um lembrete sobre o pagamento no valor de ${valorFormatado} com vencimento em ${dataFormatada}.\n\n`;
  mensagem += `Descrição: ${cobranca.descricao}\n`;
  
  if (empresa && empresa.chavePix) {
    console.log(`Empresa tem chave PIX: ${empresa.chavePix}`);
    mensagem += `\n*Dados para pagamento via PIX:*\n`;
    mensagem += `Chave PIX: ${empresa.chavePix}\n`;
    mensagem += `Titular: ${empresa.nome}\n`;
    
    if (empresa.cpfCnpj) {
      mensagem += `CPF/CNPJ: ${empresa.cpfCnpj}\n`;
    }
  } else {
    console.log('Empresa não tem chave PIX ou o objeto empresa é inválido');
    if (empresa) {
      console.log('Propriedades disponíveis na empresa:', Object.keys(empresa));
    }
  }
  
  mensagem += `\nPor favor, desconsidere caso o pagamento já tenha sido efetuado.\n\n`;
  mensagem += `Atenciosamente,\n${empresa ? empresa.nome : 'Equipe de Cobranças'}`;
  
  return mensagem;
}

/**
 * Calcula a data de vencimento com base no dia do mês informado
 * @param {number} diaCobranca - Dia do mês para cobrança (1-31)
 * @returns {Date} Data de vencimento calculada
 */
function calcularDataVencimento(diaCobranca) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  // Cria uma data para o dia de cobrança no mês atual
  let dataVencimento = new Date(anoAtual, mesAtual, diaCobranca);
  
  // Se o dia já passou no mês atual, ajusta para o próximo mês
  if (dataVencimento < hoje) {
    // Move para o próximo mês
    dataVencimento.setMonth(mesAtual + 1);
  }
  
  // Ajusta para o último dia do mês se o dia informado for maior que o número de dias no mês
  const ultimoDiaDoMes = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth() + 1, 0).getDate();
  if (diaCobranca > ultimoDiaDoMes) {
    dataVencimento.setDate(ultimoDiaDoMes);
  }
  
  return dataVencimento;
}

/**
 * Encerra a sessão do WhatsApp
 */
async function encerrarSessao(empresaId) {
  try {
    const cliente = clientesWhatsapp.get(empresaId);
    if (cliente) {
      await cliente.close();
      clientesWhatsapp.delete(empresaId);
      qrCodes.delete(empresaId);
      statusSessoes.set(empresaId, 'desconectado');
      console.log(`Sessão WhatsApp encerrada para empresa ${empresaId}`);
    }
  } catch (error) {
    console.error(`Erro ao encerrar sessão WhatsApp para empresa ${empresaId}:`, error);
    statusSessoes.set(empresaId, 'erro');
  }
}

// Encerra todas as sessões
async function encerrarTodasSessoes() {
  const promessas = [];
  for (const empresaId of clientesWhatsapp.keys()) {
    promessas.push(encerrarSessao(empresaId));
  }
  await Promise.all(promessas);
  console.log('Todas as sessões WhatsApp foram encerradas');
}

// Obter status da sessão
function obterStatusSessao(empresaId) {
  let status = statusSessoes.get(empresaId) || 'desconectado';
  let qrCode = null;
  
  // Se estiver aguardando scan e tiver um QR code, inclui na resposta
  if (status === 'aguardando_scan' || status === 'iniciando') {
    qrCode = qrCodes.get(empresaId);
    console.log(`[WHATSAPP] Status '${status}' para empresa ${empresaId}, QR Code ${qrCode ? 'encontrado' : 'não encontrado'}`);
    if (qrCode) {
      console.log(`[WHATSAPP] Tamanho do QR Code obtido: ${qrCode.length} caracteres`);
    }
  }
  
  console.log(`[WHATSAPP] obterStatusSessao - empresa ${empresaId}, status: ${status}, QR presente: ${qrCode ? 'SIM' : 'NÃO'}`);
  
  return {
    status,
    qrCode,
    conectado: status === 'conectado',
    timestamp: new Date().toISOString()
  };
}

// Obter QR Code da sessão
function obterQRCode(empresaId) {
  const qrCode = qrCodes.get(empresaId);
  console.log(`[WHATSAPP] obterQRCode - empresa ${empresaId}, QR disponível: ${qrCode ? 'SIM' : 'NÃO'}`);
  return qrCode;
}

module.exports = {
  iniciarSessao,
  encerrarSessao,
  encerrarTodasSessoes,
  enviarMensagem,
  gerarMensagemCobranca,
  enviarCobrancasDiarias,
  obterStatusSessao,
  obterQRCode,
}; 