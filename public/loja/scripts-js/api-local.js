/*
 * API LOCAL DA DOMÍNIO STORE
 * -------------------------------------------------------------
 * Este arquivo simula, dentro do navegador, a mesma API que existe
 * na pasta "backend" (Node.js/Express + MongoDB).
 * Os dados ficam salvos no localStorage, então a loja funciona
 * mesmo sem o servidor do Render estar no ar.
 *
 * Para usar a API real, abra scripts-js/config.js e troque
 * USAR_API_LOCAL para false.
 */

const CHAVE_BANCO = "dominio_store_banco";

const CELULARES_INICIAIS = [
  { nome: "Domínio X15 Pro Max", descricao: '6.8" OLED 120Hz, 512GB, 12GB RAM, câmera tripla de 200MP.', preco: 7499.9, estoque: 12, categoria: "Premium" },
  { nome: "Domínio X15", descricao: '6.4" AMOLED, 256GB, 8GB RAM, bateria de 5000mAh.', preco: 4299.9, estoque: 30, categoria: "Premium" },
  { nome: "Domínio Air Lite", descricao: '6.1" LCD, 128GB, 6GB RAM, carregamento rápido 33W.', preco: 1899.9, estoque: 54, categoria: "Intermediário" },
  { nome: "Domínio Neo Fold", descricao: 'Dobrável 7.6", 1TB, 16GB RAM, dupla tela dinâmica.', preco: 11999.9, estoque: 3, categoria: "Premium" },
  { nome: "Domínio Essential 5G", descricao: '6.5" 90Hz, 128GB, 4GB RAM, 5G e NFC.', preco: 1299.9, estoque: 88, categoria: "Entrada" },
  { nome: "Domínio Ultra Camera", descricao: '6.7" AMOLED, 256GB, sensor periscópio com zoom óptico 10x.', preco: 5899.9, estoque: 7, categoria: "Premium" }
];

function novoId() {
  return "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function lerBanco() {
  let banco = null;
  try {
    banco = JSON.parse(localStorage.getItem(CHAVE_BANCO) || "null");
  } catch (erro) {
    banco = null;
  }

  if (!banco) {
    banco = {
      usuarios: [],
      celulares: CELULARES_INICIAIS.map(function criar(item) {
        return {
          _id: novoId(),
          nome: item.nome,
          descricao: item.descricao,
          preco: item.preco,
          estoque: item.estoque,
          categoria: item.categoria,
          status: "ativo",
          imagem: ""
        };
      }),
      pedidos: []
    };
    gravarBanco(banco);
  }
  return banco;
}

function gravarBanco(banco) {
  localStorage.setItem(CHAVE_BANCO, JSON.stringify(banco));
}

function erroApi(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status || 400;
  return erro;
}

function usuarioPublico(usuario) {
  return {
    _id: usuario._id,
    nome: usuario.nome,
    sobrenome: usuario.sobrenome,
    email: usuario.email,
    dataNascimento: usuario.dataNascimento,
    telefone: usuario.telefone || "",
    endereco: usuario.endereco || "",
    foto: usuario.foto || "",
    perfil: usuario.perfil
  };
}

function usuarioDoToken(banco, token) {
  if (!token || token.indexOf("local.") !== 0) return null;
  const id = token.slice(6);
  return (
    banco.usuarios.find(function achar(usuario) {
      return usuario._id === id;
    }) || null
  );
}

function lerArquivoComoImagem(arquivo) {
  return new Promise(function executar(resolver, rejeitar) {
    const leitor = new FileReader();
    leitor.onload = function pronto() {
      resolver(String(leitor.result));
    };
    leitor.onerror = function falhou() {
      rejeitar(erroApi("Não foi possível ler a imagem enviada."));
    };
    leitor.readAsDataURL(arquivo);
  });
}

async function corpoDaRequisicao(opcoes) {
  const corpo = opcoes.body;
  if (!corpo) return {};

  if (typeof FormData !== "undefined" && corpo instanceof FormData) {
    const dados = {};
    const entradas = Array.from(corpo.entries());
    for (let i = 0; i < entradas.length; i += 1) {
      const chave = entradas[i][0];
      const valor = entradas[i][1];
      if (typeof File !== "undefined" && valor instanceof File) {
        if (valor.size > 0) dados[chave] = await lerArquivoComoImagem(valor);
      } else {
        dados[chave] = valor;
      }
    }
    return dados;
  }

  try {
    return JSON.parse(corpo);
  } catch (erro) {
    return {};
  }
}

function calcularEstatisticas(banco) {
  const pedidosPorStatus = { PENDENTE: 0, PAGO: 0, CANCELADO: 0, FINALIZADO: 0 };
  const vendidosPorNome = {};
  let faturamento = 0;
  let totalVendas = 0;

  banco.pedidos.forEach(function contar(pedido) {
    pedidosPorStatus[pedido.status] = (pedidosPorStatus[pedido.status] || 0) + 1;
    if (pedido.status !== "CANCELADO") {
      totalVendas += 1;
      faturamento += pedido.valorTotal;
      pedido.itens.forEach(function somar(item) {
        vendidosPorNome[item.nome] = (vendidosPorNome[item.nome] || 0) + item.quantidade;
      });
    }
  });

  const maisVendidos = Object.keys(vendidosPorNome)
    .map(function mapear(nome) {
      return { nome: nome, quantidade: vendidosPorNome[nome] };
    })
    .sort(function ordenar(a, b) {
      return b.quantidade - a.quantidade;
    })
    .slice(0, 5);

  const estoqueTotal = banco.celulares.reduce(function somar(acc, item) {
    return acc + Number(item.estoque || 0);
  }, 0);

  return {
    totalUsuarios: banco.usuarios.length,
    totalCelulares: banco.celulares.length,
    totalVendas: totalVendas,
    faturamento: faturamento,
    estoqueTotal: estoqueTotal,
    pedidosPorStatus: pedidosPorStatus,
    maisVendidos: maisVendidos
  };
}

function devolverEstoque(banco, pedido) {
  pedido.itens.forEach(function repor(item) {
    const celular = banco.celulares.find(function achar(linha) {
      return linha._id === item.celular;
    });
    if (celular) celular.estoque += item.quantidade;
  });
}

/* ---------------------------------------------------------------
 * ROTAS
 * ------------------------------------------------------------- */
async function apiLocal(caminho, opcoes) {
  const config = opcoes || {};
  const metodo = (config.method || "GET").toUpperCase();
  const banco = lerBanco();
  const dados = await corpoDaRequisicao(config);
  const usuario = usuarioDoToken(banco, obterToken());
  const partes = caminho.split("?")[0].split("/").filter(Boolean); // ["api","celulares","id"]
  const recurso = partes[1];
  const id = partes[2];
  const acao = partes[3];

  function exigirLogin() {
    if (!usuario) throw erroApi("Faça login para continuar.", 401);
    return usuario;
  }

  function exigirGestor() {
    exigirLogin();
    if (usuario.perfil !== "admin" && usuario.perfil !== "vendedor") {
      throw erroApi("Acesso permitido apenas para administradores.", 403);
    }
    return usuario;
  }

  /* ---------------- AUTENTICAÇÃO ---------------- */
  if (recurso === "auth" && id === "registrar" && metodo === "POST") {
    const email = String(dados.email || "").trim().toLowerCase();
    if (!email || !dados.senha || !dados.nome) throw erroApi("Preencha e-mail, senha e nome.");
    if (String(dados.senha).length < 6) throw erroApi("A senha deve ter ao menos 6 caracteres.");

    const jaExiste = banco.usuarios.some(function achar(linha) {
      return linha.email === email;
    });
    if (jaExiste) throw erroApi("Já existe uma conta com este e-mail.");

    const novo = {
      _id: novoId(),
      nome: String(dados.nome).trim(),
      sobrenome: String(dados.sobrenome || "").trim(),
      email: email,
      senha: String(dados.senha),
      dataNascimento: dados.dataNascimento || "",
      telefone: "",
      endereco: "",
      foto: "",
      // A primeira conta criada na loja vira administradora.
      perfil: banco.usuarios.length === 0 ? "admin" : "cliente"
    };

    banco.usuarios.push(novo);
    gravarBanco(banco);
    return { token: "local." + novo._id, usuario: usuarioPublico(novo) };
  }

  if (recurso === "auth" && id === "login" && metodo === "POST") {
    const email = String(dados.email || "").trim().toLowerCase();
    const encontrado = banco.usuarios.find(function achar(linha) {
      return linha.email === email;
    });
    if (!encontrado || encontrado.senha !== String(dados.senha || "")) {
      throw erroApi("E-mail ou senha inválidos.", 401);
    }
    return { token: "local." + encontrado._id, usuario: usuarioPublico(encontrado) };
  }

  if (recurso === "auth" && id === "perfil" && metodo === "GET") {
    return usuarioPublico(exigirLogin());
  }

  if (recurso === "auth" && id === "perfil" && metodo === "PUT") {
    const atual = exigirLogin();
    if (dados.nome) atual.nome = String(dados.nome).trim();
    if (dados.sobrenome !== undefined) atual.sobrenome = String(dados.sobrenome).trim();
    if (dados.dataNascimento !== undefined) atual.dataNascimento = dados.dataNascimento;
    if (dados.telefone !== undefined) atual.telefone = dados.telefone;
    if (dados.endereco !== undefined) atual.endereco = dados.endereco;
    if (dados.imagem) atual.foto = dados.imagem;
    if (dados.foto) atual.foto = dados.foto;
    if (dados.senha) {
      if (String(dados.senha).length < 6) throw erroApi("A nova senha deve ter ao menos 6 caracteres.");
      atual.senha = String(dados.senha);
    }
    gravarBanco(banco);
    return { mensagem: "Perfil atualizado com sucesso.", usuario: usuarioPublico(atual) };
  }

  /* ---------------- CELULARES ---------------- */
  if (recurso === "celulares" && metodo === "GET" && !id) {
    return banco.celulares;
  }

  if (recurso === "celulares" && metodo === "POST") {
    exigirGestor();
    const preco = Number(dados.preco);
    const estoque = Number(dados.estoque);
    if (!dados.nome) throw erroApi("Informe o nome do celular.");
    if (!(preco > 0)) throw erroApi("O preço deve ser maior que zero.");
    if (!Number.isInteger(estoque) || estoque < 0) throw erroApi("Estoque inválido.");

    const celular = {
      _id: novoId(),
      nome: String(dados.nome).trim(),
      descricao: dados.descricao || "",
      categoria: dados.categoria || "Smartphones",
      status: dados.status === "inativo" ? "inativo" : "ativo",
      preco: preco,
      estoque: estoque,
      imagem: dados.imagem || dados.imagemUrl || ""
    };
    banco.celulares.unshift(celular);
    gravarBanco(banco);
    return { mensagem: "Celular cadastrado.", celular: celular };
  }

  if (recurso === "celulares" && id && (metodo === "PATCH" || metodo === "PUT")) {
    exigirGestor();
    const celular = banco.celulares.find(function achar(linha) {
      return linha._id === id;
    });
    if (!celular) throw erroApi("Celular não encontrado.", 404);

    if (dados.preco !== undefined) {
      const preco = Number(dados.preco);
      if (!(preco > 0)) throw erroApi("O preço deve ser maior que zero.");
      celular.preco = preco;
    }
    if (dados.estoque !== undefined) {
      const estoque = Number(dados.estoque);
      if (!Number.isInteger(estoque) || estoque < 0) throw erroApi("Estoque inválido.");
      celular.estoque = estoque;
    }
    if (dados.status) celular.status = dados.status;
    if (dados.nome) celular.nome = dados.nome;
    if (dados.descricao !== undefined) celular.descricao = dados.descricao;
    if (dados.imagem || dados.imagemUrl) celular.imagem = dados.imagem || dados.imagemUrl;

    gravarBanco(banco);
    return { mensagem: "Celular atualizado.", celular: celular };
  }

  if (recurso === "celulares" && id && metodo === "DELETE") {
    exigirGestor();
    banco.celulares = banco.celulares.filter(function filtrar(linha) {
      return linha._id !== id;
    });
    gravarBanco(banco);
    return { mensagem: "Celular removido." };
  }

  /* ---------------- PEDIDOS ---------------- */
  if (recurso === "pedidos" && metodo === "GET" && !id) {
    exigirLogin();
    const gestor = usuario.perfil === "admin" || usuario.perfil === "vendedor";
    return banco.pedidos
      .filter(function filtrar(pedido) {
        return gestor || pedido.usuario._id === usuario._id;
      })
      .slice()
      .reverse();
  }

  if (recurso === "pedidos" && metodo === "POST") {
    exigirLogin();
    const itensPedidos = Array.isArray(dados.itens) ? dados.itens : [];
    if (itensPedidos.length === 0) throw erroApi("Nenhum item no pedido.");

    const itens = [];
    let valorTotal = 0;

    for (let i = 0; i < itensPedidos.length; i += 1) {
      const linha = itensPedidos[i];
      const celular = banco.celulares.find(function achar(item) {
        return item._id === linha.celular;
      });
      if (!celular) throw erroApi("Celular não encontrado no catálogo.");
      const quantidade = Number(linha.quantidade || 0);
      if (!Number.isInteger(quantidade) || quantidade <= 0) throw erroApi("Quantidade inválida.");
      if (celular.status !== "ativo") throw erroApi(celular.nome + " não está disponível para venda.");
      if (quantidade > celular.estoque) {
        throw erroApi("Estoque insuficiente de " + celular.nome + ": restam " + celular.estoque + " unidade(s).");
      }
      itens.push({
        celular: celular._id,
        nome: celular.nome,
        precoUnitario: celular.preco,
        quantidade: quantidade
      });
      valorTotal += celular.preco * quantidade;
    }

    // Só baixa o estoque depois de validar todos os itens.
    itens.forEach(function baixar(item) {
      const celular = banco.celulares.find(function achar(linha) {
        return linha._id === item.celular;
      });
      celular.estoque -= item.quantidade;
    });

    const pedido = {
      _id: novoId(),
      usuario: { _id: usuario._id, nome: usuario.nome, email: usuario.email },
      itens: itens,
      valorTotal: valorTotal,
      status: "PENDENTE",
      criadoEm: new Date().toISOString()
    };
    banco.pedidos.push(pedido);
    gravarBanco(banco);
    return { mensagem: "Pedido criado.", pedido: pedido };
  }

  if (recurso === "pedidos" && id && acao === "cancelar" && metodo === "PATCH") {
    exigirLogin();
    const pedido = banco.pedidos.find(function achar(linha) {
      return linha._id === id;
    });
    if (!pedido) throw erroApi("Pedido não encontrado.", 404);

    const gestor = usuario.perfil === "admin" || usuario.perfil === "vendedor";
    if (!gestor && pedido.usuario._id !== usuario._id) throw erroApi("Este pedido não é seu.", 403);
    if (pedido.status === "CANCELADO") throw erroApi("Este pedido já foi cancelado.");
    if (pedido.status === "FINALIZADO") throw erroApi("Pedido finalizado não pode ser cancelado.");

    pedido.status = "CANCELADO";
    devolverEstoque(banco, pedido);
    gravarBanco(banco);
    return { mensagem: "Pedido cancelado e estoque devolvido.", pedido: pedido };
  }

  if (recurso === "pedidos" && id && acao === "status" && metodo === "PATCH") {
    exigirGestor();
    const pedido = banco.pedidos.find(function achar(linha) {
      return linha._id === id;
    });
    if (!pedido) throw erroApi("Pedido não encontrado.", 404);

    const status = String(dados.status || "").toUpperCase();
    if (["PENDENTE", "PAGO", "CANCELADO", "FINALIZADO"].indexOf(status) === -1) {
      throw erroApi("Status inválido.");
    }
    if (status === "CANCELADO" && pedido.status !== "CANCELADO") devolverEstoque(banco, pedido);
    pedido.status = status;
    gravarBanco(banco);
    return { mensagem: "Status atualizado.", pedido: pedido };
  }

  /* ---------------- ESTATÍSTICAS ---------------- */
  if (recurso === "estatisticas" && metodo === "GET") {
    exigirGestor();
    return calcularEstatisticas(banco);
  }

  throw erroApi("Rota não encontrada: " + metodo + " " + caminho, 404);
}
