/* ============================================================
   CONFIGURAÇÃO GERAL DA LOJA
   ------------------------------------------------------------
   USAR_API_LOCAL = true  -> a loja funciona sozinha no navegador
                             (dados salvos no localStorage).
   USAR_API_LOCAL = false -> a loja conversa com o back-end
                             Node/Express rodando em API_URL.
   ============================================================ */

const API_URL = "http://localhost:3000/api"; // back-end local (PORT=3000)
const USAR_API_LOCAL = true;

// Dados do vendedor usados no checkout
const WHATSAPP_VENDEDOR = "5542984224752";
const CHAVE_PIX = "786dbf00-d282-4ee8-bea8-81283e4e156e";
const NOME_PIX = "RAFAEL BRAIDO LABIAK";

const CHAVE_TOKEN = "dominio_token";
const CHAVE_USUARIO = "dominio_usuario";
const CHAVE_CARRINHO = "dominio_carrinho";

/* ---------------- Sessão ---------------- */
function salvarSessao(token, usuario) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN);
}

function obterUsuario() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO) || "null");
  } catch (erro) {
    return null;
  }
}

function sair() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
  window.location.href = "index.html";
}

function ehAdmin() {
  const usuario = obterUsuario();
  return !!usuario && usuario.perfil === "admin";
}

/* ---------------- Utilidades ---------------- */
function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mostrarAviso(elemento, mensagem, tipo) {
  if (!elemento) return;
  elemento.textContent = mensagem;
  elemento.className = "aviso aviso-" + (tipo || "info");
  elemento.style.display = mensagem ? "block" : "none";
}

/* ---------------- Requisição HTTP ----------------
   Uma única função para falar com a API (real ou local). */
async function requisitar(caminho, opcoes) {
  const config = opcoes || {};

  if (USAR_API_LOCAL) {
    return apiLocal(caminho, config);
  }

  const headers = Object.assign({ "Content-Type": "application/json" }, config.headers || {});
  const token = obterToken();
  if (token) headers.Authorization = "Bearer " + token;

  const resposta = await fetch(API_URL + caminho, {
    method: config.method || "GET",
    headers: headers,
    body: config.corpo ? JSON.stringify(config.corpo) : undefined
  });

  const texto = await resposta.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch (erro) {
    dados = { mensagem: texto };
  }

  if (!resposta.ok) {
    throw new Error((dados && dados.mensagem) || "Erro na requisição (" + resposta.status + ")");
  }
  return dados;
}