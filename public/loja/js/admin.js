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

let imagemProduto = "";

document.getElementById("p-imagem").addEventListener("change", function (evento) {
  const arquivo = evento.target.files[0];
  if (!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = function () { imagemProduto = leitor.result; };
  leitor.readAsDataURL(arquivo);
});

async function carregarIndicadores() {
  const dados = await ServicoEstatisticas.obter();
  document.getElementById("kpi-usuarios").textContent = dados.totalUsuarios;
  document.getElementById("kpi-produtos").textContent = dados.totalProdutos;
  document.getElementById("kpi-pedidos").textContent = dados.totalPedidos;
  document.getElementById("kpi-pendentes").textContent = dados.pedidosPendentes;
  document.getElementById("kpi-sem-estoque").textContent = dados.semEstoque;
  document.getElementById("kpi-faturamento").textContent = formatarPreco(dados.faturamento);
}

async function carregarProdutos() {
  const produtos = await ServicoProdutos.listar();
  const corpo = document.getElementById("tabela-produtos");
  corpo.innerHTML = produtos.map(function (p) {
    return (
      "<tr><td>" + p.nome + "</td>" +
      '<td><input type="number" step="0.01" min="0.01" value="' + p.preco + '" data-preco="' + p._id + '" style="width:110px"></td>' +
      '<td><input type="number" step="1" min="0" value="' + p.estoque + '" data-estoque="' + p._id + '" style="width:80px"></td>' +
      "<td>" + p.status + "</td>" +
      '<td><button class="btn" data-salvar="' + p._id + '">Salvar</button> ' +
      '<button class="btn btn-claro" data-status="' + p._id + '">' + (p.status === "ativo" ? "Desativar" : "Ativar") + "</button> " +
      '<button class="btn btn-perigo" data-excluir="' + p._id + '">Excluir</button></td></tr>'
    );
  }).join("");

  corpo.querySelectorAll("[data-salvar]").forEach(function (b) {
    b.addEventListener("click", function () {
      const id = b.getAttribute("data-salvar");
      acao(function () {
        return ServicoProdutos.atualizar(id, {
          preco: Number(corpo.querySelector('[data-preco="' + id + '"]').value),
          estoque: Number(corpo.querySelector('[data-estoque="' + id + '"]').value)
        });
      });
    });
  });
  corpo.querySelectorAll("[data-status]").forEach(function (b) {
    b.addEventListener("click", function () {
      const id = b.getAttribute("data-status");
      const produto = produtos.find(function (p) { return p._id === id; });
      acao(function () {
        return ServicoProdutos.atualizar(id, { status: produto.status === "ativo" ? "inativo" : "ativo" });
      });
    });
  });
  corpo.querySelectorAll("[data-excluir]").forEach(function (b) {
    b.addEventListener("click", function () {
      acao(function () { return ServicoProdutos.excluir(b.getAttribute("data-excluir")); });
    });
  });
}

async function carregarPedidos() {
  const pedidos = await ServicoPedidos.listar();
  const corpo = document.getElementById("tabela-pedidos");
  corpo.innerHTML = pedidos.map(function (p) {
    const itens = p.itens.map(function (i) { return i.quantidade + "x " + i.nome; }).join(", ");
    const finalizado = ["CANCELADO", "FINALIZADO"].includes(p.status);
    const opcoes = ["PENDENTE", "PAGO", "CANCELADO", "FINALIZADO"].map(function (s) {
      return '<option value="' + s + '"' + (s === p.status ? " selected" : "") + ">" + s + "</option>";
    }).join("");
    return (
      "<tr><td>" + p.nomeUsuario + "</td><td>" + itens + "</td><td>" + (p.cidade || "—") + "</td>" +
      "<td>" + formatarPreco(p.valorTotal) + "</td>" +
      '<td><select data-status-pedido="' + p._id + '"' + (finalizado ? " disabled" : "") + ">" + opcoes + "</select></td>" +
      '<td>' + (finalizado ? "—" : '<button class="btn" data-aplicar="' + p._id + '">Aplicar</button>') + "</td></tr>"
    );
  }).join("");

  corpo.querySelectorAll("[data-aplicar]").forEach(function (b) {
    b.addEventListener("click", function () {
      const id = b.getAttribute("data-aplicar");
      const status = corpo.querySelector('[data-status-pedido="' + id + '"]').value;
      acao(function () { return ServicoPedidos.alterarStatus(id, status); });
    });
  });
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

document.getElementById("form-produto").addEventListener("submit", function (evento) {
  evento.preventDefault();
  acao(async function () {
    await ServicoProdutos.criar({
      nome: document.getElementById("p-nome").value.trim(),
      categoria: document.getElementById("p-categoria").value.trim() || "Geral",
      preco: Number(document.getElementById("p-preco").value),
      estoque: Number(document.getElementById("p-estoque").value),
      descricao: document.getElementById("p-descricao").value.trim(),
      imagem: imagemProduto
    });
    document.getElementById("form-produto").reset();
    imagemProduto = "";
  }, "Produto salvo com sucesso.");
});

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
    await carregarProdutos();
    await carregarPedidos();
    await carregarUsuarios();
  } catch (erro) {
    mostrarAviso(aviso, erro.message, "erro");
  }
}

carregarTudo();