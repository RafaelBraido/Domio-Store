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
  desenharGrafico("grafico-usuarios", dados.serie || [], "usuarios", "#2563eb");
  desenharGrafico("grafico-pedidos", dados.serie || [], "pedidos", "#16a34a");
}

/* Gráfico de barras simples, feito só com Canvas (sem bibliotecas). */
function desenharGrafico(idCanvas, serie, campo, cor) {
  const canvas = document.getElementById(idCanvas);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const largura = canvas.width;
  const altura = canvas.height;
  const base = altura - 26;
  ctx.clearRect(0, 0, largura, altura);

  const maior = Math.max(1, ...serie.map(function (m) { return m[campo]; }));
  const espaco = largura / Math.max(1, serie.length);
  const larguraBarra = espaco * 0.5;

  ctx.strokeStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(0, base);
  ctx.lineTo(largura, base);
  ctx.stroke();

  serie.forEach(function (mes, i) {
    const valor = mes[campo];
    const alturaBarra = (valor / maior) * (base - 24);
    const x = i * espaco + (espaco - larguraBarra) / 2;
    ctx.fillStyle = cor;
    ctx.fillRect(x, base - alturaBarra, larguraBarra, alturaBarra);
    ctx.fillStyle = "#111827";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(valor), x + larguraBarra / 2, base - alturaBarra - 6);
    ctx.fillStyle = "#6b7280";
    ctx.fillText(mes.rotulo, x + larguraBarra / 2, base + 16);
  });
}

async function carregarPedidos() {
  const pedidos = await ServicoPedidos.listar();
  todosPedidos = pedidos;
  const corpo = document.getElementById("tabela-pedidos");
  const emAndamento = pedidos.filter(function (p) { return ["PENDENTE", "PAGO", "ENVIADO"].includes(p.status); });
  corpo.innerHTML = emAndamento.map(function (p) {
    const itens = p.itens.map(function (i) { return i.quantidade + "x " + i.nome; }).join(", ");
    const comprovante = p.comprovante
      ? '<a class="btn btn-claro" href="' + p.comprovante + '" target="_blank" rel="noopener">Ver comprovante</a>'
      : '<span class="etiqueta">Sem comprovante</span>';

    // Botões diretos, um para cada próximo passo do pedido.
    let botoes = "";
    if (p.status === "PENDENTE") {
      botoes += '<button class="btn" data-status="PAGO" data-pedido="' + p._id + '">CONFIRMAR PAGAMENTO</button> ';
    }
    if (p.status === "PENDENTE" || p.status === "PAGO") {
      botoes += '<button class="btn" data-status="ENVIADO" data-pedido="' + p._id + '">MARCAR COMO ENVIADO</button> ';
    }
    if (p.status === "ENVIADO") {
      botoes += '<button class="btn" data-status="FINALIZADO" data-pedido="' + p._id + '">FINALIZAR</button> ';
    }
    botoes += '<button class="btn btn-perigo" data-status="CANCELADO" data-pedido="' + p._id + '">CANCELAR</button>';

    return (
      "<tr><td>" + p.nomeUsuario + "</td><td>" + itens + "</td><td>" + (p.cidade || "—") + "</td>" +
      "<td>" + (p.formaPagamento || "PIX") + "</td>" +
      "<td>" + formatarPreco(p.valorTotal) + "</td><td>" + comprovante + "</td>" +
      "<td><strong>" + p.status + "</strong></td><td>" + botoes + "</td></tr>"
    );
  }).join("");
  if (emAndamento.length === 0) {
    corpo.innerHTML = '<tr><td colspan="8">Nenhum pedido em andamento.</td></tr>';
  }

  corpo.querySelectorAll("[data-pedido]").forEach(function (b) {
    b.addEventListener("click", function () {
      const id = b.getAttribute("data-pedido");
      const status = b.getAttribute("data-status");
      acao(function () { return ServicoPedidos.alterarStatus(id, status); }, "Pedido atualizado para " + status + ".");
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
    ? '<tr><td colspan="7">Nenhum pedido encontrado.</td></tr>'
    : lista.map(function (p) {
        const itens = p.itens.map(function (i) { return i.quantidade + "x " + i.nome; }).join(", ");
        const data = new Date(p.criadoEm).toLocaleString("pt-BR");
        return (
          "<tr><td>" + data + "</td><td>" + p.nomeUsuario + "</td><td>" + itens + "</td>" +
          "<td>" + (p.cidade || "—") + "</td><td>" + (p.formaPagamento || "PIX") + "</td>" +
          "<td>" + formatarPreco(p.valorTotal) + "</td>" +
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
    await carregarTudo();
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