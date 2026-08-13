/* ============================================================
   PÁGINA DE ESTOQUE (somente administrador)
   Cadastra celulares, edita preço/estoque e troca a imagem.
   ============================================================ */

const aviso = document.getElementById("aviso");

if (!ehAdmin()) {
  window.location.href = "login.html";
}

document.getElementById("nome-admin").textContent = (obterUsuario() || {}).nome || "";
document.getElementById("btn-sair").addEventListener("click", sair);

let imagemNova = "";

// Lê um arquivo de imagem e devolve o conteúdo em Base64.
function lerImagem(arquivo) {
  return new Promise(function (resolver, rejeitar) {
    const leitor = new FileReader();
    leitor.onload = function () { resolver(leitor.result); };
    leitor.onerror = function () { rejeitar(new Error("Não foi possível ler a imagem.")); };
    leitor.readAsDataURL(arquivo);
  });
}

document.getElementById("p-imagem").addEventListener("change", async function (evento) {
  const arquivo = evento.target.files[0];
  imagemNova = arquivo ? await lerImagem(arquivo) : "";
});

async function carregarProdutos() {
  const produtos = await ServicoProdutos.listar();
  const corpo = document.getElementById("tabela-produtos");

  corpo.innerHTML = produtos.map(function (p) {
    const imagem = p.imagem || "img/celular.svg";
    return (
      "<tr>" +
      '<td><img src="' + imagem + '" alt="' + p.nome + '" style="width:56px;height:56px;object-fit:cover;border-radius:10px"><br>' +
      '<input type="file" accept="image/*" data-imagem="' + p._id + '" style="width:130px;font-size:11px"></td>' +
      "<td>" + p.nome + "</td>" +
      '<td><input type="number" step="0.01" min="0.01" value="' + p.preco + '" data-preco="' + p._id + '" style="width:110px"></td>' +
      '<td><input type="number" step="1" min="0" value="' + p.estoque + '" data-estoque="' + p._id + '" style="width:80px"></td>' +
      "<td>" + p.status + "</td>" +
      '<td><button class="btn" data-salvar="' + p._id + '">Salvar</button> ' +
      '<button class="btn btn-claro" data-status="' + p._id + '">' + (p.status === "ativo" ? "Desativar" : "Ativar") + "</button> " +
      '<button class="btn btn-perigo" data-excluir="' + p._id + '">Excluir</button></td>' +
      "</tr>"
    );
  }).join("");

  if (produtos.length === 0) {
    corpo.innerHTML = '<tr><td colspan="6">Nenhum celular cadastrado.</td></tr>';
  }

  corpo.querySelectorAll("[data-salvar]").forEach(function (b) {
    b.addEventListener("click", function () {
      const id = b.getAttribute("data-salvar");
      acao(async function () {
        const dados = {
          preco: Number(corpo.querySelector('[data-preco="' + id + '"]').value),
          estoque: Number(corpo.querySelector('[data-estoque="' + id + '"]').value)
        };
        const campoImagem = corpo.querySelector('[data-imagem="' + id + '"]');
        if (campoImagem && campoImagem.files[0]) {
          dados.imagem = await lerImagem(campoImagem.files[0]);
        }
        return ServicoProdutos.atualizar(id, dados);
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

document.getElementById("form-produto").addEventListener("submit", function (evento) {
  evento.preventDefault();
  acao(async function () {
    await ServicoProdutos.criar({
      nome: document.getElementById("p-nome").value.trim(),
      categoria: document.getElementById("p-categoria").value.trim() || "Geral",
      preco: Number(document.getElementById("p-preco").value),
      estoque: Number(document.getElementById("p-estoque").value),
      descricao: document.getElementById("p-descricao").value.trim(),
      imagem: imagemNova
    });
    document.getElementById("form-produto").reset();
    imagemNova = "";
  }, "Celular salvo com sucesso.");
});

async function acao(funcao, mensagemOk) {
  try {
    await funcao();
    await carregarProdutos();
    mostrarAviso(aviso, mensagemOk || "Alteração salva.", "ok");
  } catch (erro) {
    mostrarAviso(aviso, erro.message, "erro");
  }
}

carregarProdutos();
