/* ============================================================
   CONFIGURAÇÃO GERAL DA LOJA
   ------------------------------------------------------------
   O sistema é 100% HTML + CSS + JavaScript.
   Não existe servidor: os dados ficam salvos no localStorage
   do navegador (arquivo js/api-local.js).
   ============================================================ */

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

/* ---------------- Ponto único de acesso aos dados ----------------
   Todas as telas chamam requisitar(); ela repassa para a "API local". */
async function requisitar(caminho, opcoes) {
  return apiLocal(caminho, opcoes || {});
}
