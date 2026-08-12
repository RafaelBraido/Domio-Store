/* ============================================================
   VITRINE: lista de celulares, carrinho, checkout Pix e pedidos
   ============================================================ */

const CIDADES = [
  "Guarapuava - PR",
  "Prudentópolis - PR",
  "Pitanga - PR",
  "Laranjeiras do Sul - PR",
  "Ponta Grossa - PR",
  "Curitiba - PR",
  "Cascavel - PR",
  "Outra cidade (combinar no WhatsApp)"
];

let produtos = [];
let carrinho = [];
let negociou = false;

/* ---------------- Carrinho no localStorage ---------------- */
function lerCarrinho() {
  try {
    carrinho = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) || "[]");
  } catch (erro) {
    carrinho = [];
  }
}

function gravarCarrinho() {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
}

function totalCarrinho() {
  return carrinho.reduce(function (soma, item) { return soma + item.preco * item.quantidade; }, 0);
}

/* ---------------- Cabeçalho ---------------- */
function montarCabecalho() {
  const area = document.getElementById("area-usuario");
  const usuario = obterUsuario();
  const linkAdmin = document.getElementById("link-admin");

  if (linkAdmin) linkAdmin.style.display = ehAdmin() ? "inline" : "none";

  if (!usuario) {
    area.innerHTML =
      '<a class="btn btn-claro" href="login.html">Entrar</a>' +
      '<a class="btn" href="cadastro.html">Criar conta</a>';
    return;
  }
  area.innerHTML =
    (usuario.foto ? '<img class="foto-topo" src="' + usuario.foto + '" alt="Foto de perfil">' : "") +
    '<a class="btn btn-claro" href="perfil.html">' + usuario.nome + "</a>" +
    '<button class="btn btn-claro" id="btn-sair">Sair</button>';
  document.getElementById("btn-sair").addEventListener("click", sair);
}

/* ---------------- Produtos ---------------- */
async function carregarProdutos() {
  const grade = document.getElementById("grade");
  grade.innerHTML = "<p>Carregando produtos...</p>";
  try {
    produtos = await ServicoProdutos.listar();
    montarCategorias();
    desenharProdutos();
  } catch (erro) {
    grade.innerHTML = '<p class="aviso aviso-erro">' + erro.message + "</p>";
  }
}

function montarCategorias() {
  const filtro = document.getElementById("filtro-categoria");
  const categorias = [];
  produtos.forEach(function (p) {
    if (p.categoria && categorias.indexOf(p.categoria) === -1) categorias.push(p.categoria);
  });
  filtro.innerHTML = '<option value="todas">Todas as categorias</option>' +
    categorias.map(function (c) { return '<option value="' + c + '">' + c + "</option>"; }).join("");
}

function produtosFiltrados() {
  const busca = document.getElementById("busca").value.toLowerCase().trim();
  const categoria = document.getElementById("filtro-categoria").value;
  const disponibilidade = document.getElementById("filtro-disponibilidade").value;

  return produtos.filter(function (p) {
    if (p.status !== "ativo") return false;
    const casaBusca = !busca || (p.nome + " " + p.descricao).toLowerCase().indexOf(busca) >= 0;
    const casaCategoria = categoria === "todas" || p.categoria === categoria;
    const casaDisponibilidade =
      disponibilidade === "todos" ||
      (disponibilidade === "disponiveis" && p.estoque > 0) ||
      (disponibilidade === "indisponiveis" && p.estoque === 0);
    return casaBusca && casaCategoria && casaDisponibilidade;
  });
}

function desenharProdutos() {
  const grade = document.getElementById("grade");
  const lista = produtosFiltrados();
  document.getElementById("contador").textContent = lista.length + " aparelho(s)";

  if (lista.length === 0) {
    grade.innerHTML = "<p>Nenhum aparelho encontrado.</p>";
    return;
  }

  grade.innerHTML = lista.map(function (p) {
    const imagem = p.imagem
      ? '<img src="' + p.imagem + '" alt="' + p.nome + '">'
      : '<img src="img/celular.svg" alt="' + p.nome + '">';
    const estoque = p.estoque > 0
      ? '<span class="etiqueta">' + p.estoque + " em estoque</span>"
      : '<span class="esgotado">Indisponível</span>';
    return (
      '<article class="card"><span class="chip">' + p.categoria + "</span>" + imagem +
      "<h3>" + p.nome + "</h3>" +
      '<p class="desc">' + (p.descricao || "") + "</p>" +
      '<span class="preco">' + formatarPreco(p.preco) + "</span>" + estoque +
      '<button class="btn" data-id="' + p._id + '"' + (p.estoque > 0 ? "" : " disabled") + ">Adicionar ao carrinho</button>" +
      "</article>"
    );
  }).join("");

  grade.querySelectorAll("button[data-id]").forEach(function (botao) {
    botao.addEventListener("click", function () { adicionarAoCarrinho(botao.getAttribute("data-id")); });
  });
}

/* ---------------- Ações do carrinho ---------------- */
function adicionarAoCarrinho(id) {
  const produto = produtos.find(function (p) { return p._id === id; });
  if (!produto) return;

  const item = carrinho.find(function (i) { return i.celular === id; });
  const quantidadeAtual = item ? item.quantidade : 0;

  if (quantidadeAtual + 1 > produto.estoque) {
    avisarCarrinho("Só temos " + produto.estoque + " unidade(s) de " + produto.nome + " em estoque.", "erro");
    return;
  }

  if (item) item.quantidade += 1;
  else carrinho.push({ celular: id, nome: produto.nome, preco: produto.preco, quantidade: 1 });

  gravarCarrinho();
  desenharCarrinho();
  avisarCarrinho(produto.nome + " adicionado ao carrinho.", "ok");
  abrirCarrinho(true);
}

function alterarQuantidade(id, delta) {
  const item = carrinho.find(function (i) { return i.celular === id; });
  const produto = produtos.find(function (p) { return p._id === id; });
  if (!item || !produto) return;

  const nova = item.quantidade + delta;
  if (nova < 1) {
    carrinho = carrinho.filter(function (i) { return i.celular !== id; });
  } else if (nova > produto.estoque) {
    avisarCarrinho("Estoque máximo de " + produto.nome + ": " + produto.estoque + ".", "erro");
    return;
  } else {
    item.quantidade = nova;
  }
  gravarCarrinho();
  desenharCarrinho();
}

function removerDoCarrinho(id) {
  carrinho = carrinho.filter(function (i) { return i.celular !== id; });
  gravarCarrinho();
  desenharCarrinho();
}

function avisarCarrinho(mensagem, tipo) {
  mostrarAviso(document.getElementById("aviso-carrinho"), mensagem, tipo);
}

function desenharCarrinho() {
  const area = document.getElementById("carrinho-itens");
  document.getElementById("contador-carrinho").textContent = carrinho.reduce(function (s, i) { return s + i.quantidade; }, 0);
  document.getElementById("total-carrinho").textContent = formatarPreco(totalCarrinho());
  document.getElementById("btn-checkout").disabled = carrinho.length === 0;

  if (carrinho.length === 0) {
    area.innerHTML = "<p>Seu carrinho está vazio.</p>";
    return;
  }

  area.innerHTML = carrinho.map(function (i) {
    return (
      '<div class="item-carrinho"><div><strong>' + i.nome + "</strong><br>" +
      formatarPreco(i.preco) + " x " + i.quantidade + "</div>" +
      '<div><button class="btn btn-claro" data-menos="' + i.celular + '">-</button> ' +
      '<button class="btn btn-claro" data-mais="' + i.celular + '">+</button> ' +
      '<button class="btn btn-claro" data-remover="' + i.celular + '">x</button></div></div>'
    );
  }).join("");

  area.querySelectorAll("[data-menos]").forEach(function (b) {
    b.addEventListener("click", function () { alterarQuantidade(b.getAttribute("data-menos"), -1); });
  });
  area.querySelectorAll("[data-mais]").forEach(function (b) {
    b.addEventListener("click", function () { alterarQuantidade(b.getAttribute("data-mais"), 1); });
  });
  area.querySelectorAll("[data-remover]").forEach(function (b) {
    b.addEventListener("click", function () { removerDoCarrinho(b.getAttribute("data-remover")); });
  });
}

function abrirCarrinho(abrir) {
  document.getElementById("carrinho").classList.toggle("aberto", abrir);
}

/* ---------------- Checkout: cidade -> vendedor -> Pix ---------------- */
function abrirCheckout() {
  if (!obterUsuario()) {
    window.location.href = "login.html";
    return;
  }
  negociou = false;
  irParaPasso(1);
  document.getElementById("valor-pagar").textContent = formatarPreco(totalCarrinho());
  document.getElementById("valor-pix").textContent = formatarPreco(totalCarrinho());
  document.getElementById("btn-ir-pagamento").disabled = true;
  mostrarAviso(document.getElementById("aviso-checkout"), "", "info");
  document.getElementById("modal-pagamento").classList.add("aberto");
}

function irParaPasso(numero) {
  document.querySelectorAll(".passo").forEach(function (passo) {
    passo.classList.toggle("ativo", passo.getAttribute("data-passo") === String(numero));
  });
}

function validarPasso1() {
  const cidade = document.getElementById("cidade").value;
  document.getElementById("btn-ir-pagamento").disabled = !(cidade && negociou);
}

function falarComVendedor() {
  const cidade = document.getElementById("cidade").value;
  if (!cidade) {
    mostrarAviso(document.getElementById("aviso-checkout"), "Selecione primeiro a sua cidade.", "erro");
    return;
  }
  const itens = carrinho.map(function (i) { return i.quantidade + "x " + i.nome; }).join(", ");
  const texto =
    "Olá! Sou " + obterUsuario().nome + ", da cidade " + cidade + "." +
    " Quero negociar a compra: " + itens + ". Total: " + formatarPreco(totalCarrinho()) + ".";
  window.open("https://wa.me/" + WHATSAPP_VENDEDOR + "?text=" + encodeURIComponent(texto), "_blank");
  negociou = true;
  mostrarAviso(document.getElementById("aviso-checkout"), "Negociação iniciada. Agora avance para o pagamento.", "ok");
  validarPasso1();
}

async function confirmarPagamento() {
  const aviso = document.getElementById("aviso-checkout");
  const botao = document.getElementById("btn-ja-paguei");
  botao.disabled = true;
  mostrarAviso(aviso, "Registrando seu pedido...", "info");
  try {
    const itens = carrinho.map(function (i) { return { celular: i.celular, quantidade: i.quantidade }; });
    await ServicoPedidos.criar(itens, document.getElementById("cidade").value);
    carrinho = [];
    gravarCarrinho();
    desenharCarrinho();
    await carregarProdutos();
    await carregarPedidos();
    irParaPasso(3);
  } catch (erro) {
    mostrarAviso(aviso, erro.message, "erro");
  }
  botao.disabled = false;
}

/* ---------------- Meus pedidos ---------------- */
async function carregarPedidos() {
  const area = document.getElementById("lista-pedidos");
  if (!obterUsuario()) {
    area.innerHTML = '<p>Faça <a href="login.html">login</a> para ver seus pedidos.</p>';
    return;
  }
  area.innerHTML = "<p>Carregando pedidos...</p>";
  try {
    const pedidos = await ServicoPedidos.listar();
    if (pedidos.length === 0) {
      area.innerHTML = "<p>Você ainda não fez pedidos.</p>";
      return;
    }
    area.innerHTML = pedidos.map(function (p) {
      const itens = p.itens.map(function (i) { return i.quantidade + "x " + i.nome; }).join(", ");
      const podeCancelar = p.status === "PENDENTE" || p.status === "PAGO";
      return (
        '<div class="bloco"><strong>' + itens + "</strong>" +
        "<p>Cidade: " + (p.cidade || "—") + " · Total: " + formatarPreco(p.valorTotal) +
        " · Status: <strong>" + p.status + "</strong></p>" +
        (podeCancelar ? '<button class="btn btn-perigo" data-cancelar="' + p._id + '">Cancelar pedido</button>' : "") +
        "</div>"
      );
    }).join("");

    area.querySelectorAll("[data-cancelar]").forEach(function (b) {
      b.addEventListener("click", async function () {
        b.disabled = true;
        try {
          await ServicoPedidos.cancelar(b.getAttribute("data-cancelar"));
          await carregarProdutos();
          await carregarPedidos();
        } catch (erro) {
          alert(erro.message);
          b.disabled = false;
        }
      });
    });
  } catch (erro) {
    area.innerHTML = '<p class="aviso aviso-erro">' + erro.message + "</p>";
  }
}

/* ---------------- Inicialização ---------------- */
document.getElementById("cidade").innerHTML =
  '<option value="">Selecione sua cidade</option>' +
  CIDADES.map(function (c) { return '<option value="' + c + '">' + c + "</option>"; }).join("");
document.getElementById("numero-vendedor").textContent = "+55 42 98422-4752";
document.getElementById("chave-pix").textContent = CHAVE_PIX;
document.getElementById("nome-pix").textContent = NOME_PIX;

document.getElementById("busca").addEventListener("input", desenharProdutos);
document.getElementById("filtro-categoria").addEventListener("change", desenharProdutos);
document.getElementById("filtro-disponibilidade").addEventListener("change", desenharProdutos);
document.getElementById("btn-carrinho").addEventListener("click", function () { abrirCarrinho(true); });
document.getElementById("btn-fechar-carrinho").addEventListener("click", function () { abrirCarrinho(false); });
document.getElementById("btn-checkout").addEventListener("click", abrirCheckout);
document.getElementById("btn-fechar-modal").addEventListener("click", function () {
  document.getElementById("modal-pagamento").classList.remove("aberto");
});
document.getElementById("cidade").addEventListener("change", validarPasso1);
document.getElementById("btn-whatsapp").addEventListener("click", falarComVendedor);
document.getElementById("btn-ir-pagamento").addEventListener("click", function () { irParaPasso(2); });
document.getElementById("btn-ja-paguei").addEventListener("click", confirmarPagamento);
document.getElementById("btn-fim").addEventListener("click", function () {
  document.getElementById("modal-pagamento").classList.remove("aberto");
});

lerCarrinho();
montarCabecalho();
desenharCarrinho();
carregarProdutos();
carregarPedidos();