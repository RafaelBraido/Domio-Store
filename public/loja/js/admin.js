/* ============================================================
   PAINEL DO ADMINISTRADOR
   ============================================================ */

const aviso = document.getElementById("aviso");

// Somente administradores entram aqui (o back-end também valida).
if (!ehAdmin()) {
  window.location.href = "login.html";
}

document.getElementById("nome-admin").textContent = (obterUsuario() || {}).nome || "";
document.getElementById("btn-sair").addEventListener("click", sair);

let todosPedidos = [];

const filtroHistorico = document.getElementById("filtro-historico");
if (filtroHistorico) filtroHistorico.addEventListener("change", desenharHistorico);

async function carregarIndicadores() {
  const dados = await ServicoEstatisticas.obter();
  document.getElementById("kpi-usuarios").textContent = dados.totalUsuarios;
  document.getElementById("kpi-produtos").textContent = dados.totalProdutos;
  document.getElementById("kpi-pedidos").textContent = dados.totalPedidos;
  document.getElementById("kpi-pendentes").textContent = dados.pedidosPendentes;
  document.getElementById("kpi-sem-estoque").textContent = dados.semEstoque;
  document.getElementById("kpi-faturamento").textContent = formatarPreco(dados.faturamento);
}

async function carregarPedidos() {
  const pedidos = await ServicoPedidos.listar();
  todosPedidos = pedidos;
  const corpo = document.getElementById("tabela-pedidos");
  const emAndamento = pedidos.filter(function (p) { return ["PENDENTE", "PAGO", "ENVIADO"].includes(p.status); });
  corpo.innerHTML = emAndamento.map(function (p) {
    const itens = p.itens.map(function (i) { return i.quantidade + "x " + i.nome; }).join(", ");
    const finalizado = ["CANCELADO", "FINALIZADO"].includes(p.status);
    const comprovante = p.comprovante
      ? '<a class="btn btn-claro" href="' + p.comprovante + '" target="_blank" rel="noopener">Comprovante</a>'
      : "—";
    const opcoes = ["PENDENTE", "PAGO", "ENVIADO", "CANCELADO", "FINALIZADO"].map(function (s) {
      return '<option value="' + s + '"' + (s === p.status ? " selected" : "") + ">" + s + "</option>";
    }).join("");
    return (
      "<tr><td>" + p.nomeUsuario + "</td><td>" + itens + "</td><td>" + (p.cidade || "—") + "</td>" +
      "<td>" + formatarPreco(p.valorTotal) + "</td><td>" + comprovante + "</td>" +
      '<td><select data-status-pedido="' + p._id + '"' + (finalizado ? " disabled" : "") + ">" + opcoes + "</select></td>" +
      '<td>' + (finalizado ? "—" : '<button class="btn" data-aplicar="' + p._id + '">Aplicar</button>') + "</td></tr>"
    );
  }).join("");
  if (emAndamento.length === 0) {
    corpo.innerHTML = '<tr><td colspan="7">Nenhum pedido em andamento.</td></tr>';
  }

  corpo.querySelectorAll("[data-aplicar]").forEach(function (b) {
    b.addEventListener("click", function () {
      const id = b.getAttribute("data-aplicar");
      const status = corpo.querySelector('[data-status-pedido="' + id + '"]').value;
      acao(function () { return ServicoPedidos.alterarStatus(id, status); });
    });
  });

  desenharHistorico();
}

// Histórico: todos os pedidos da loja, com filtro por status.
function desenharHistorico() {
  const corpo = document.getElementById("tabela-historico");
  if (!corpo) return;
  const filtro = document.getElementById("filtro-historico").value;
  const lista = todosPedidos.filter(function (p) { return filtro === "TODOS" || p.status === filtro; });
  document.getElementById("contador-historico").textContent = lista.length + " pedido(s)";
  corpo.innerHTML = lista.length === 0
    ? '<tr><td colspan="6">Nenhum pedido encontrado.</td></tr>'
    : lista.map(function (p) {
        const itens = p.itens.map(function (i) { return i.quantidade + "x " + i.nome; }).join(", ");
        const data = new Date(p.criadoEm).toLocaleString("pt-BR");
        return (
          "<tr><td>" + data + "</td><td>" + p.nomeUsuario + "</td><td>" + itens + "</td>" +
          "<td>" + (p.cidade || "—") + "</td><td>" + formatarPreco(p.valorTotal) + "</td>" +
          "<td>" + p.status + "</td></tr>"
        );
      }).join("");
}

async function carregarUsuarios() {
  const usuarios = await ServicoUsuarios.listar();
  const corpo = document.getElementById("tabela-usuarios");
  corpo.innerHTML = usuarios.map(function (u) {
    return (
      "<tr><td>" + u.nome + " " + (u.sobrenome || "") + "</td><td>" + u.email + "</td>" +
      "<td>" + u.perfil + "</td><td>" + (u.ativo ? "ativo" : "inativo") + "</td>" +
      '<td><button class="btn btn-claro" data-perfil="' + u._id + '">' +
      (u.perfil === "admin" ? "Tornar cliente" : "Tornar admin") + "</button> " +
      '<button class="btn btn-claro" data-ativo="' + u._id + '">' + (u.ativo ? "Desativar" : "Ativar") + "</button></td></tr>"
    );
  }).join("");

  corpo.querySelectorAll("[data-perfil]").forEach(function (b) {
    b.addEventListener("click", function () {
      const id = b.getAttribute("data-perfil");
      const usuario = usuarios.find(function (u) { return u._id === id; });
      acao(function () { return ServicoUsuarios.atualizar(id, { perfil: usuario.perfil === "admin" ? "cliente" : "admin" }); });
    });
  });
  corpo.querySelectorAll("[data-ativo]").forEach(function (b) {
    b.addEventListener("click", function () {
      const id = b.getAttribute("data-ativo");
      const usuario = usuarios.find(function (u) { return u._id === id; });
      acao(function () { return ServicoUsuarios.atualizar(id, { ativo: !usuario.ativo }); });
    });
  });
}

// Executa uma ação e recarrega todas as listas.
async function acao(funcao, mensagemOk) {
  try {
    await funcao();
    await exigirAdmin().then(function (liberado) {
  if (liberado) carregarTudo();
});
    mostrarAviso(aviso, mensagemOk || "Alteração salva.", "ok");
  } catch (erro) {
    mostrarAviso(aviso, erro.message, "erro");
  }
}

async function carregarTudo() {
  try {
    await carregarIndicadores();
    await carregarPedidos();
    await carregarUsuarios();
  } catch (erro) {
    mostrarAviso(aviso, erro.message, "erro");
  }
}

exigirAdmin().then(function (liberado) {
  if (liberado) carregarTudo();
});