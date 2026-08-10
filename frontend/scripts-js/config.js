// Endereço da API real (Node.js/Express no Render).
const API_URL = "https://dominio-store-api.onrender.com";

// true  = usa a API local do navegador (scripts-js/api-local.js) — funciona sem servidor.
// false = usa a API real hospedada em API_URL.
const USAR_API_LOCAL = true;

const STORAGE_TOKEN = "dominio_store_token";
const STORAGE_USUARIO = "dominio_store_usuario";
const STORAGE_CARRINHO = "dominio_store_carrinho";

function salvarSessao(token, usuario) {
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USUARIO, JSON.stringify(usuario));
}

function obterToken() {
  return localStorage.getItem(STORAGE_TOKEN);
}

function obterUsuario() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USUARIO) || "null");
  } catch (erro) {
    return null;
  }
}

function encerrarSessao() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USUARIO);
  window.location.href = "login.html";
}

function ehGestor() {
  const usuario = obterUsuario();
  return !!usuario && (usuario.perfil === "admin" || usuario.perfil === "vendedor");
}

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

async function api(caminho, opcoes) {
  const config = opcoes || {};

  if (USAR_API_LOCAL) {
    return apiLocal(caminho, config);
  }

  const headers = config.headers ? Object.assign({}, config.headers) : {};
  const token = obterToken();

  if (token) {
    headers.Authorization = "Bearer " + token;
  }
  if (config.body && !(config.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const resposta = await fetch(API_URL + caminho, {
    method: config.method || "GET",
    headers: headers,
    body: config.body
  });

  const texto = await resposta.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch (erro) {
    dados = { mensagem: texto };
  }

  if (!resposta.ok) {
    const mensagem = (dados && dados.mensagem) || "Erro na requisicao (" + resposta.status + ")";
    throw new Error(mensagem);
  }

  return dados;
}

function mostrarAviso(elemento, mensagem, tipo) {
  if (!elemento) return;
  elemento.textContent = mensagem;
  elemento.className = "aviso aviso-" + (tipo || "info");
  elemento.style.display = "block";
}