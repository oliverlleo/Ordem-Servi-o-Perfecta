// config.js
// Configurações e constantes do sistema

// Define a URL da sua API no Firebase. Todas as requisições do frontend usarão esta URL.
const API_URL = "https://us-central1-os---perfecta.cloudfunctions.net/api";

// Formatadores de data
const formatarData = (dataString) => {
  if (!dataString) return "";

  // Corrigindo problema de fuso horário para garantir que a data seja interpretada corretamente
  const dataAjustada = dataString.includes("T")
    ? dataString
    : `${dataString}T12:00:00`;

  const data = new Date(dataAjustada);

  // Formatando para o padrão brasileiro (DD/MM/YYYY)
  return data.toLocaleDateString("pt-BR");
};

const formatarDataHora = (dataString) => {
  if (!dataString) return "";

  const data = new Date(dataString);
  return (
    data.toLocaleDateString("pt-BR") + " " + data.toLocaleTimeString("pt-BR")
  );
};

// Função de utilidade para mostrar mensagens na tela
const mostrarMensagem = (mensagem, tipo = "info") => {
  // Verificar se já existe um elemento de mensagem
  let mensagemElement = document.getElementById("mensagem-sistema");

  if (!mensagemElement) {
    // Criar elemento de mensagem
    mensagemElement = document.createElement("div");
    mensagemElement.id = "mensagem-sistema";
    document.body.appendChild(mensagemElement);
  }

  // Definir classe baseada no tipo
  mensagemElement.className = `mensagem mensagem-${tipo}`;
  mensagemElement.textContent = mensagem;

  // Mostrar mensagem
  mensagemElement.style.display = "block";

  // Esconder após 5 segundos
  setTimeout(() => {
    if (mensagemElement) {
      mensagemElement.style.display = "none";
    }
  }, 5000);
};

// Função para obter parâmetros da URL
const obterParametroUrl = (nome) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(nome);
};
