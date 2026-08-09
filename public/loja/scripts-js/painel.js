let celularesPainel = [];
let estatisticasPainel = null;

function protegerPainel() {
  const usuario = obterUsuario();
  if (!usuario) {
    window.location.href = "login.html";
    return false;
  }
  if (usuario.perfil !== "admin" && usuario.perfil !== "vendedor") {
    window.location.href = "index.html";
    return false;
  }
  const nome = document.getElementById("painel-usuario");
  if (nome) nome.textContent = usuario.nome + " (" + usuario.perfil + ")";
  return true;
}

function definirKpi(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function estatisticasLocais() {
  const totalEstoque = celularesPainel.reduce(function somar(acc, item) {
    return acc + Number(item.estoque || 0);
  }, 0);
  return {
    totalUsuarios: 0,
    totalCelulares: celularesPainel.length,
    totalVendas: 0,
    faturamento: 0,
    estoqueTotal: totalEstoque,
    pedidosPorStatus: { PENDENTE: 0, PAGO: 0, CANCELADO: 0, FINALIZADO: 0 },
    maisVendidos: []
  };
}

function desenharGraficoDonut(dados) {
  const canvas = document.getElementById("grafico-status");
  if (!canvas || !canvas.getContext) return;

  const contexto = canvas.getContext("2d");
  const largura = canvas.width;
  const altura = canvas.height;
  contexto.clearRect(0, 0, largura, altura);

  const entradas = Object.keys(dados).map(function mapear(chave) {
    return { rotulo: chave, valor: Number(dados[chave] || 0) };
  });
  const total = entradas.reduce(function somar(acc, item) {
    return acc + item.valor;
  }, 0);

  const cores = {
    PENDENTE: "#f0a202",
    PAGO: "#2d7ff9",
    CANCELADO: "#e0413e",
    FINALIZADO: "#1f9d55"
  };

  const centroX = largura / 2;
  const centroY = altura / 2;
  const raio = Math.min(largura, altura) / 2 - 10;
  const raioInterno = raio * 0.6;

  if (total === 0) {
    contexto.beginPath();
    contexto.arc(centroX, centroY, raio, 0, Math.PI * 2);
    contexto.fillStyle = "#e9e9ec";
    contexto.fill();
    contexto.beginPath();
    contexto.arc(centroX, centroY, raioInterno, 0, Math.PI * 2);
    contexto.fillStyle = "#ffffff";
    contexto.fill();
    contexto.fillStyle = "#707070";
    contexto.font = "14px system-ui, sans-serif";
    contexto.textAlign = "center";
    contexto.fillText("Sem pedidos", centroX, centroY + 5);
    return;
  }

  let anguloInicial = -Math.PI / 2;
  entradas.forEach(function fatia(entrada) {
    if (entrada.valor <= 0) return;
    const angulo = (entrada.valor / total) * Math.PI * 2;
    contexto.beginPath();
    contexto.moveTo(centroX, centroY);
    contexto.arc(centroX, centroY, raio, anguloInicial, anguloInicial + angulo);
    contexto.closePath();
    contexto.fillStyle = cores[entrada.rotulo] || "#999999";
    contexto.fill();
    anguloInicial += angulo;
  });

  contexto.beginPath();
  contexto.arc(centroX, centroY, raioInterno, 0, Math.PI * 2);
  contexto.fillStyle = "#ffffff";
  contexto.fill();

  contexto.fillStyle = "#111111";
  contexto.font = "bold 22px system-ui, sans-serif";
  contexto.textAlign = "center";
  contexto.fillText(String(total), centroX, centroY);
  contexto.fillStyle = "#707070";
  contexto.font = "12px system-ui, sans-serif";
  contexto.fillText("pedidos", centroX, centroY + 18);

  const legenda = document.getElementById("grafico-legenda");
  if (legenda) {
    legenda.innerHTML = entradas
      .map(function item(entrada) {
        const percentual = total ? Math.round((entrada.valor / total) * 100) : 0;
        return (
          '<li><span class="bolinha" style="background:' +
          (cores[entrada.rotulo] || "#999999") +
          '"></span>' +
          entrada.rotulo +
          " <strong>" +
          entrada.valor +
          "</strong> (" +
          percentual +
          "%)</li>"
        );
      })
      .join("");
  }
}

async function carregarEstatisticas() {
  try {
    estatisticasPainel = await api("/api/estatisticas");
  } catch (erro) {
    estatisticasPainel = estatisticasLocais();
  }

  definirKpi("kpi-usuarios", String(estatisticasPainel.totalUsuarios));
  definirKpi("kpi-vendas", String(estatisticasPainel.totalVendas));
  definirKpi("kpi-faturamento", formatarPreco(estatisticasPainel.faturamento));
  definirKpi("kpi-estoque", String(estatisticasPainel.estoqueTotal));

  desenharGraficoDonut(estatisticasPainel.pedidosPorStatus);

  const maisVendidos = document.getElementById("lista-mais-vendidos");
  if (maisVendidos) {
    const itens = estatisticasPainel.maisVendidos || [];
    maisVendidos.innerHTML = itens.length
      ? itens
          .map(function linha(item) {
            return "<li><span>" + item.nome + "</span><strong>" + item.quantidade + "</strong></li>";
          })
          .join("")
      : '<li class="vazio">Nenhuma venda registrada ainda.</li>';
  }
}

function linhaTabela(celular) {
  return (
    "<tr data-id='" + celular._id + "'>" +
    "<td class='celula-nome'>" +
    (celular.imagem
      ? "<img src='" + celular.imagem + "' alt='" + celular.nome + "'>"
      : "<span class='thumb-vazia'></span>") +
    "<div><strong>" + celular.nome + "</strong><small>" + (celular.categoria || "") + "</small></div></td>" +
    "<td><input type='number' step='0.01' min='0.01' class='campo-preco' value='" + celular.preco + "'></td>" +
    "<td><input type='number' step='1' min='0' class='campo-estoque' value='" + celular.estoque + "'></td>" +
    "<td><select class='campo-status'>" +
    "<option value='ativo'" + (celular.status === "ativo" ? " selected" : "") + ">Ativo</option>" +
    "<option value='inativo'" + (celular.status === "inativo" ? " selected" : "") + ">Inativo</option>" +
    "</select></td>" +
    "<td class='acoes'>" +
    "<button class='btn-mini btn-salvar'>Salvar</button>" +
    "<button class='btn-mini btn-excluir'>Excluir</button>" +
    "</td>" +
    "</tr>"
  );
}

async function carregarCelulares() {
  const corpo = document.getElementById("tabela-celulares");
  if (!corpo) return;

  corpo.innerHTML = "<tr><td colspan='5' class='vazio'>Carregando celulares...</td></tr>";

  try {
    celularesPainel = await api("/api/celulares");
  } catch (erro) {
    celularesPainel = [];
    corpo.innerHTML = "<tr><td colspan='5' class='vazio'>API indisponível: conecte a API no Render para gerenciar o catálogo.</td></tr>";
    return;
  }

  if (celularesPainel.length === 0) {
    corpo.innerHTML = "<tr><td colspan='5' class='vazio'>Nenhum celular cadastrado ainda.</td></tr>";
    return;
  }

  corpo.innerHTML = celularesPainel.map(linhaTabela).join("");

  Array.prototype.forEach.call(corpo.querySelectorAll("tr"), function ligar(linha) {
    const id = linha.getAttribute("data-id");
    const salvar = linha.querySelector(".btn-salvar");
    const excluir = linha.querySelector(".btn-excluir");

    if (salvar) {
      salvar.addEventListener("click", async function clicar() {
        const preco = Number(linha.querySelector(".campo-preco").value);
        const estoque = Number(linha.querySelector(".campo-estoque").value);
        const status = linha.querySelector(".campo-status").value;

        if (!(preco > 0)) {
          alert("O preço deve ser maior que zero.");
          return;
        }
        if (!Number.isInteger(estoque) || estoque < 0) {
          alert("O estoque deve ser inteiro e maior ou igual a zero.");
          return;
        }

        try {
          salvar.disabled = true;
          await api("/api/celulares/" + id, {
            method: "PATCH",
            body: JSON.stringify({ preco: preco, estoque: estoque, status: status })
          });
          salvar.textContent = "Salvo!";
          setTimeout(function voltar() {
            salvar.textContent = "Salvar";
            salvar.disabled = false;
          }, 1200);
          carregarEstatisticas();
        } catch (erro) {
          salvar.disabled = false;
          alert(erro.message);
        }
      });
    }

    if (excluir) {
      excluir.addEventListener("click", async function clicar() {
        if (!confirm("Excluir este celular do catálogo?")) return;
        try {
          await api("/api/celulares/" + id, { method: "DELETE" });
          carregarCelulares();
          carregarEstatisticas();
        } catch (erro) {
          alert(erro.message);
        }
      });
    }
  });
}

async function carregarPedidosPainel() {
  const corpo = document.getElementById("tabela-pedidos");
  if (!corpo) return;

  try {
    const pedidos = await api("/api/pedidos");
    if (!pedidos || pedidos.length === 0) {
      corpo.innerHTML = "<tr><td colspan='5' class='vazio'>Nenhum pedido registrado.</td></tr>";
      return;
    }

    corpo.innerHTML = pedidos
      .map(function linha(pedido) {
        const cliente = pedido.usuario ? pedido.usuario.nome + " (" + pedido.usuario.email + ")" : "-";
        const bloqueado = pedido.status === "CANCELADO" || pedido.status === "FINALIZADO";
        return (
          "<tr data-pedido='" + pedido._id + "'>" +
          "<td>#" + String(pedido._id).slice(-6).toUpperCase() + "</td>" +
          "<td>" + cliente + "</td>" +
          "<td>" + pedido.itens.length + " item(ns)</td>" +
          "<td>" + formatarPreco(pedido.valorTotal) + "</td>" +
          "<td><select class='campo-status-pedido'" + (bloqueado ? " disabled" : "") + ">" +
          ["PENDENTE", "PAGO", "CANCELADO", "FINALIZADO"]
            .map(function opcao(status) {
              return "<option value='" + status + "'" + (pedido.status === status ? " selected" : "") + ">" + status + "</option>";
            })
            .join("") +
          "</select></td>" +
          "</tr>"
        );
      })
      .join("");

    Array.prototype.forEach.call(corpo.querySelectorAll(".campo-status-pedido"), function ligar(seletor) {
      seletor.addEventListener("change", async function mudar() {
        const id = seletor.closest("tr").getAttribute("data-pedido");
        try {
          await api("/api/pedidos/" + id + "/status", {
            method: "PATCH",
            body: JSON.stringify({ status: seletor.value })
          });
          carregarPedidosPainel();
          carregarCelulares();
          carregarEstatisticas();
        } catch (erro) {
          alert(erro.message);
          carregarPedidosPainel();
        }
      });
    });
  } catch (erro) {
    corpo.innerHTML = "<tr><td colspan='5' class='vazio'>API indisponível para carregar pedidos.</td></tr>";
  }
}

function iniciarFormularioCelular() {
  const form = document.getElementById("form-celular");
  if (!form) return;
  const aviso = document.getElementById("form-aviso");

  form.addEventListener("submit", async function enviar(evento) {
    evento.preventDefault();

    const nome = document.getElementById("celular-nome").value.trim();
    const descricao = document.getElementById("celular-descricao").value.trim();
    const categoria = document.getElementById("celular-categoria").value.trim();
    const status = document.getElementById("celular-status").value;
    const imagemUrl = document.getElementById("celular-imagem-url").value.trim();
    const arquivo = document.getElementById("celular-imagem-arquivo").files[0];
    const preco = Number(document.getElementById("celular-preco").value);
    const estoque = Number(document.getElementById("celular-estoque").value);

    if (!nome) {
      mostrarAviso(aviso, "Informe o nome do celular.", "erro");
      return;
    }
    if (!(preco > 0)) {
      mostrarAviso(aviso, "O preço deve ser maior que zero.", "erro");
      return;
    }
    if (!Number.isInteger(estoque) || estoque < 0) {
      mostrarAviso(aviso, "O estoque deve ser inteiro e maior ou igual a zero.", "erro");
      return;
    }

    const dados = new FormData();
    dados.append("nome", nome);
    dados.append("descricao", descricao);
    dados.append("categoria", categoria || "Smartphones");
    dados.append("status", status);
    dados.append("preco", String(preco));
    dados.append("estoque", String(estoque));
    if (imagemUrl) dados.append("imagemUrl", imagemUrl);
    if (arquivo) dados.append("imagem", arquivo);

    try {
      mostrarAviso(aviso, "Cadastrando celular...", "info");
      await api("/api/celulares", { method: "POST", body: dados });
      mostrarAviso(aviso, "Celular cadastrado com sucesso!", "sucesso");
      form.reset();
      carregarCelulares();
      carregarEstatisticas();
    } catch (erro) {
      mostrarAviso(aviso, erro.message, "erro");
    }
  });
}

document.addEventListener("DOMContentLoaded", function iniciarPainel() {
  if (!document.getElementById("painel-dashboard")) return;
  if (!protegerPainel()) return;

  const sair = document.getElementById("btn-sair-painel");
  if (sair) sair.addEventListener("click", encerrarSessao);

  iniciarFormularioCelular();
  carregarCelulares();
  carregarPedidosPainel();
  carregarEstatisticas();
});