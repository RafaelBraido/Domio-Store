let catalogo = [];
let carrinho = [];

function carregarCarrinho() {
  try {
    carrinho = JSON.parse(localStorage.getItem(STORAGE_CARRINHO) || "[]");
  } catch (erro) {
    carrinho = [];
  }
}

function persistirCarrinho() {
  localStorage.setItem(STORAGE_CARRINHO, JSON.stringify(carrinho));
}

function iniciaisDoNome(nome) {
  return String(nome || "?")
    .split(" ")
    .slice(0, 2)
    .map(function pegar(parte) {
      return parte.charAt(0).toUpperCase();
    })
    .join("");
}

function renderizarHeader() {
  const usuario = obterUsuario();
  const area = document.getElementById("area-usuario");
  const linkPainel = document.getElementById("link-painel");

  if (linkPainel) {
    linkPainel.style.display = ehGestor() ? "inline-flex" : "none";
  }
  if (!area) return;

  if (usuario) {
    const avatar = usuario.foto
      ? '<img class="usuario-foto" src="' + usuario.foto + '" alt="Foto de ' + usuario.nome + '">'
      : '<span class="usuario-chip">' + iniciaisDoNome(usuario.nome + " " + (usuario.sobrenome || "")) + "</span>";
    area.innerHTML =
      avatar +
      '<a class="btn-ghost" href="perfil.html">Minha conta</a>' +
      '<span class="usuario-nome">' +
      usuario.nome +
      "</span>" +
      '<button class="btn-ghost" id="btn-sair">Sair</button>';
    const botao = document.getElementById("btn-sair");
    if (botao) botao.addEventListener("click", encerrarSessao);
  } else {
    area.innerHTML =
      '<a class="btn-ghost" href="login.html">Entrar</a>' +
      '<a class="btn-solid" href="cadastro.html">Criar conta</a>';
  }
}

function categoriasDoCatalogo() {
  const lista = catalogo.map(function pegar(item) {
    return item.categoria || "Outros";
  });
  return Array.from(new Set(lista)).sort();
}

function renderizarFiltros() {
  const seletor = document.getElementById("filtro-categoria");
  if (!seletor) return;
  const atual = seletor.value || "todas";
  seletor.innerHTML = '<option value="todas">Todas as categorias</option>';
  categoriasDoCatalogo().forEach(function adicionar(categoria) {
    const opcao = document.createElement("option");
    opcao.value = categoria;
    opcao.textContent = categoria;
    seletor.appendChild(opcao);
  });
  seletor.value = atual;
}

function produtosFiltrados() {
  const busca = (document.getElementById("campo-busca") || {}).value || "";
  const categoria = (document.getElementById("filtro-categoria") || {}).value || "todas";
  const disponibilidade = (document.getElementById("filtro-disponibilidade") || {}).value || "todos";
  const termo = busca.trim().toLowerCase();

  return catalogo
    .filter(function ativo(item) {
      return item.status === "ativo";
    })
    .filter(function porTermo(item) {
      if (!termo) return true;
      return (
        String(item.nome).toLowerCase().includes(termo) ||
        String(item.descricao || "").toLowerCase().includes(termo)
      );
    })
    .filter(function porCategoria(item) {
      return categoria === "todas" || item.categoria === categoria;
    })
    .filter(function porEstoque(item) {
      if (disponibilidade === "disponiveis") return item.estoque > 0;
      if (disponibilidade === "indisponiveis") return item.estoque <= 0;
      return true;
    });
}

function cartaoProduto(item) {
  const indisponivel = item.estoque <= 0;
  const midia = item.imagem
    ? '<img src="' + item.imagem + '" alt="' + item.nome + '" loading="lazy">'
    : '<div class="produto-placeholder"><span>' + iniciaisDoNome(item.nome) + "</span></div>";

  return (
    '<article class="produto-card' +
    (indisponivel ? " produto-indisponivel" : "") +
    '">' +
    '<div class="produto-midia">' +
    midia +
    '<span class="produto-tag">' +
    (item.categoria || "Outros") +
    "</span>" +
    (indisponivel ? '<span class="produto-badge">Indisponível</span>' : "") +
    "</div>" +
    '<div class="produto-corpo">' +
    "<h3>" +
    item.nome +
    "</h3>" +
    "<p>" +
    (item.descricao || "") +
    "</p>" +
    '<div class="produto-rodape">' +
    '<div><strong class="produto-preco">' +
    formatarPreco(item.preco) +
    "</strong>" +
    '<span class="produto-estoque">' +
    (indisponivel ? "Sem estoque" : item.estoque + " em estoque") +
    "</span></div>" +
    '<button class="btn-comprar" data-id="' +
    item._id +
    '"' +
    (indisponivel ? " disabled" : "") +
    ">" +
    (indisponivel ? "Esgotado" : "Adicionar") +
    "</button>" +
    "</div>" +
    "</div>" +
    "</article>"
  );
}

function renderizarVitrine() {
  const grade = document.getElementById("grade-produtos");
  const contador = document.getElementById("contador-produtos");
  if (!grade) return;

  const lista = produtosFiltrados();
  if (contador) {
    contador.textContent = lista.length + (lista.length === 1 ? " aparelho" : " aparelhos");
  }

  if (lista.length === 0) {
    grade.innerHTML = '<p class="vazio">Nenhum celular encontrado com esses filtros.</p>';
    return;
  }

  grade.innerHTML = lista.map(cartaoProduto).join("");
  Array.prototype.forEach.call(grade.querySelectorAll(".btn-comprar"), function ligar(botao) {
    botao.addEventListener("click", function clicar() {
      adicionarAoCarrinho(botao.getAttribute("data-id"));
    });
  });
}

function avisarCarrinho(mensagem, tipo) {
  const aviso = document.getElementById("carrinho-aviso");
  mostrarAviso(aviso, mensagem, tipo);
}

function adicionarAoCarrinho(id) {
  const produto = catalogo.find(function achar(item) {
    return String(item._id) === String(id);
  });
  if (!produto) return;
  if (produto.status !== "ativo" || produto.estoque <= 0) {
    avisarCarrinho(produto.nome + " está sem estoque.", "erro");
    abrirCarrinho(true);
    return;
  }

  const existente = carrinho.find(function achar(item) {
    return String(item.celular) === String(id);
  });

  if (existente) {
    // Só permite adicionar se ainda existir estoque suficiente.
    if (existente.quantidade + 1 > produto.estoque) {
      avisarCarrinho("Estoque máximo de " + produto.nome + ": " + produto.estoque + " unidade(s).", "erro");
      abrirCarrinho(true);
      return;
    }
    existente.quantidade += 1;
  } else {
    carrinho.push({
      celular: produto._id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1
    });
  }

  persistirCarrinho();
  renderizarCarrinho();
  avisarCarrinho(produto.nome + " adicionado ao carrinho.", "sucesso");
  abrirCarrinho(true);
}

function alterarQuantidade(id, delta) {
  const item = carrinho.find(function achar(linha) {
    return String(linha.celular) === String(id);
  });
  if (!item) return;

  const produto = catalogo.find(function achar(linha) {
    return String(linha._id) === String(id);
  });
  const estoqueDisponivel = produto ? produto.estoque : item.quantidade;

  if (delta > 0 && item.quantidade + delta > estoqueDisponivel) {
    avisarCarrinho("Só há " + estoqueDisponivel + " unidade(s) em estoque.", "erro");
    return;
  }

  item.quantidade += delta;
  if (item.quantidade <= 0) {
    carrinho = carrinho.filter(function filtrar(linha) {
      return String(linha.celular) !== String(id);
    });
  }
  persistirCarrinho();
  renderizarCarrinho();
}

function totalCarrinho() {
  return carrinho.reduce(function somar(acc, item) {
    return acc + item.preco * item.quantidade;
  }, 0);
}

function renderizarCarrinho() {
  const lista = document.getElementById("carrinho-itens");
  const total = document.getElementById("carrinho-total");
  const contador = document.getElementById("carrinho-contador");

  const quantidadeTotal = carrinho.reduce(function somar(acc, item) {
    return acc + item.quantidade;
  }, 0);

  if (contador) {
    contador.textContent = String(quantidadeTotal);
    contador.style.display = quantidadeTotal > 0 ? "inline-flex" : "none";
  }
  if (total) total.textContent = formatarPreco(totalCarrinho());
  if (!lista) return;

  if (carrinho.length === 0) {
    lista.innerHTML = '<p class="vazio">Seu carrinho está vazio.</p>';
    return;
  }

  lista.innerHTML = carrinho
    .map(function linha(item) {
      return (
        '<div class="carrinho-linha">' +
        '<div class="carrinho-info"><strong>' +
        item.nome +
        "</strong><span>" +
        formatarPreco(item.preco) +
        "</span></div>" +
        '<div class="carrinho-controles">' +
        '<button data-acao="menos" data-id="' + item.celular + '">-</button>' +
        "<span>" + item.quantidade + "</span>" +
        '<button data-acao="mais" data-id="' + item.celular + '">+</button>' +
        "</div>" +
        "</div>"
      );
    })
    .join("");

  Array.prototype.forEach.call(lista.querySelectorAll("button"), function ligar(botao) {
    botao.addEventListener("click", function clicar() {
      alterarQuantidade(botao.getAttribute("data-id"), botao.getAttribute("data-acao") === "mais" ? 1 : -1);
    });
  });
}

function abrirCarrinho(forcarAbrir) {
  const painel = document.getElementById("carrinho-painel");
  if (!painel) return;
  if (forcarAbrir) {
    painel.classList.add("aberto");
  } else {
    painel.classList.toggle("aberto");
  }
}

async function finalizarPedido() {
  const aviso = document.getElementById("carrinho-aviso");

  if (carrinho.length === 0) {
    mostrarAviso(aviso, "Adicione ao menos um celular ao carrinho.", "erro");
    return;
  }
  if (!obterToken()) {
    mostrarAviso(aviso, "Faça login para finalizar a compra.", "erro");
    setTimeout(function ir() {
      window.location.href = "login.html";
    }, 1200);
    return;
  }

  try {
    mostrarAviso(aviso, "Processando pedido...", "info");
    const itens = carrinho.map(function mapear(item) {
      return { celular: item.celular, quantidade: item.quantidade };
    });
    const resposta = await api("/api/pedidos", {
      method: "POST",
      body: JSON.stringify({ itens: itens })
    });
    carrinho = [];
    persistirCarrinho();
    renderizarCarrinho();
    mostrarAviso(aviso, "Pedido criado! Total " + formatarPreco(resposta.pedido.valorTotal), "sucesso");
    setTimeout(function fechar() {
      document.getElementById("carrinho-painel").classList.remove("aberto");
    }, 1500);
    carregarMeusPedidos();
    carregarCatalogo();
  } catch (erro) {
    mostrarAviso(aviso, erro.message, "erro");
  }
}

async function carregarMeusPedidos() {
  const secao = document.getElementById("secao-pedidos");
  const lista = document.getElementById("lista-pedidos");
  if (!secao || !lista) return;

  if (!obterToken()) {
    secao.style.display = "none";
    return;
  }

  try {
    const pedidos = await api("/api/pedidos");
    secao.style.display = "block";

    if (!pedidos || pedidos.length === 0) {
      lista.innerHTML = '<p class="vazio">Você ainda não fez nenhum pedido.</p>';
      return;
    }

    lista.innerHTML = pedidos
      .map(function linha(pedido) {
        const podeCancelar = pedido.status === "PENDENTE" || pedido.status === "PAGO";
        return (
          '<div class="pedido-card">' +
          '<div class="pedido-topo"><strong>#' +
          String(pedido._id).slice(-6).toUpperCase() +
          '</strong><span class="status status-' +
          pedido.status +
          '">' +
          pedido.status +
          "</span></div>" +
          "<ul>" +
          pedido.itens
            .map(function item(linhaItem) {
              return "<li>" + linhaItem.quantidade + "x " + linhaItem.nome + " — " + formatarPreco(linhaItem.precoUnitario) + "</li>";
            })
            .join("") +
          "</ul>" +
          '<div class="pedido-rodape"><strong>' +
          formatarPreco(pedido.valorTotal) +
          "</strong>" +
          (podeCancelar
            ? '<button class="btn-ghost" data-cancelar="' + pedido._id + '">Cancelar pedido</button>'
            : "") +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    Array.prototype.forEach.call(lista.querySelectorAll("[data-cancelar]"), function ligar(botao) {
      botao.addEventListener("click", async function clicar() {
        try {
          await api("/api/pedidos/" + botao.getAttribute("data-cancelar") + "/cancelar", { method: "PATCH" });
          carregarMeusPedidos();
          carregarCatalogo();
        } catch (erro) {
          alert(erro.message);
        }
      });
    });
  } catch (erro) {
    secao.style.display = "none";
  }
}

async function carregarCatalogo() {
  const grade = document.getElementById("grade-produtos");
  const avisoApi = document.getElementById("aviso-api");

  if (grade) {
    grade.innerHTML = '<p class="vazio">Carregando celulares...</p>';
  }

  try {
    const dados = await api("/api/celulares");
    catalogo = Array.isArray(dados) ? dados : [];
    if (avisoApi) avisoApi.style.display = "none";
  } catch (erro) {
    catalogo = [];
    if (avisoApi) {
      avisoApi.style.display = "block";
      avisoApi.textContent = "Não foi possível carregar o catálogo: " + erro.message;
    }
  }

  renderizarFiltros();
  renderizarVitrine();
}

document.addEventListener("DOMContentLoaded", function iniciarVitrine() {
  if (!document.getElementById("grade-produtos")) return;

  carregarCarrinho();
  renderizarHeader();
  renderizarCarrinho();
  carregarCatalogo();
  carregarMeusPedidos();

  const busca = document.getElementById("campo-busca");
  const categoria = document.getElementById("filtro-categoria");
  const disponibilidade = document.getElementById("filtro-disponibilidade");
  const botaoCarrinho = document.getElementById("btn-carrinho");
  const fecharCarrinho = document.getElementById("btn-fechar-carrinho");
  const finalizar = document.getElementById("btn-finalizar");

  if (busca) busca.addEventListener("input", renderizarVitrine);
  if (categoria) categoria.addEventListener("change", renderizarVitrine);
  if (disponibilidade) disponibilidade.addEventListener("change", renderizarVitrine);
  if (botaoCarrinho) botaoCarrinho.addEventListener("click", function abrir() {
    abrirCarrinho(false);
  });
  if (fecharCarrinho) fecharCarrinho.addEventListener("click", function fechar() {
    document.getElementById("carrinho-painel").classList.remove("aberto");
  });
  if (finalizar) finalizar.addEventListener("click", finalizarPedido);
});