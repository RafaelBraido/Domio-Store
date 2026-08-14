/* ============================================================
   API LOCAL (modo demonstração)
   ------------------------------------------------------------
   Simula no navegador as mesmas rotas do back-end Node/Express.
   Tudo é salvo no localStorage. Serve para o site funcionar
   mesmo sem o servidor ligado.
   ============================================================ */

const CHAVE_BANCO = "dominio_banco";

const CELULARES_INICIAIS = [
  { nome: "Domínio X15 Pro Max", descricao: '6.8" OLED 120Hz, 512GB, 12GB RAM, câmera de 200MP.', preco: 7499.9, estoque: 12, categoria: "Premium" },
  { nome: "Domínio X15", descricao: '6.4" AMOLED, 256GB, 8GB RAM, bateria 5000mAh.', preco: 4299.9, estoque: 30, categoria: "Premium" },
  { nome: "Domínio Air Lite", descricao: '6.1" LCD, 128GB, 6GB RAM, carga rápida 33W.', preco: 1899.9, estoque: 54, categoria: "Intermediário" },
  { nome: "Domínio Neo Fold", descricao: 'Dobrável 7.6", 1TB, 16GB RAM.', preco: 11999.9, estoque: 3, categoria: "Premium" },
  { nome: "Domínio Essential 5G", descricao: '6.5" 90Hz, 128GB, 4GB RAM, 5G e NFC.', preco: 1299.9, estoque: 88, categoria: "Entrada" },
  { nome: "Domínio Ultra Camera", descricao: '6.7" AMOLED, 256GB, zoom óptico 10x.', preco: 5899.9, estoque: 0, categoria: "Premium" }
];

// Conta de administrador criada automaticamente na primeira abertura.
const ADMIN_PADRAO = {
  nome: "Rafael",
  sobrenome: "Braido",
  email: "rafaelbraido126@gmail.com",
  senha: "admin123",
  perfil: "admin"
};

function novoId() {
  return "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function gravarBanco(banco) {
  localStorage.setItem(CHAVE_BANCO, JSON.stringify(banco));
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
      usuarios: [
        {
          _id: novoId(),
          nome: ADMIN_PADRAO.nome,
          sobrenome: ADMIN_PADRAO.sobrenome,
          email: ADMIN_PADRAO.email,
          senha: ADMIN_PADRAO.senha,
          perfil: "admin",
          ativo: true,
          telefone: "",
          endereco: "",
          dataNascimento: "",
          foto: "",
          criadoEm: new Date().toISOString()
        }
      ],
      celulares: CELULARES_INICIAIS.map(function (item) {
        return {
          _id: novoId(),
          nome: item.nome,
          descricao: item.descricao,
          preco: item.preco,
          estoque: item.estoque,
          categoria: item.categoria,
          status: "ativo",
          imagem: "",
          criadoEm: new Date().toISOString()
        };
      }),
      pedidos: []
    };
    gravarBanco(banco);
  }

  // Garante que a conta de administrador exista (e esteja como admin).
  const admin = banco.usuarios.find(function (u) { return u.email === ADMIN_PADRAO.email; });
  if (!admin) {
    banco.usuarios.push({
      _id: novoId(),
      nome: ADMIN_PADRAO.nome,
      sobrenome: ADMIN_PADRAO.sobrenome,
      email: ADMIN_PADRAO.email,
      senha: ADMIN_PADRAO.senha,
      perfil: "admin",
      ativo: true,
      telefone: "",
      endereco: "",
      dataNascimento: "",
      foto: "",
      criadoEm: new Date().toISOString()
    });
    gravarBanco(banco);
  } else if (admin.perfil !== "admin" || !admin.ativo) {
    admin.perfil = "admin";
    admin.ativo = true;
    gravarBanco(banco);
  }

  return banco;
}

function erroApi(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status || 400;
  return erro;
}

function semSenha(usuario) {
  const copia = Object.assign({}, usuario);
  delete copia.senha;
  return copia;
}

function usuarioDoToken(banco) {
  const token = obterToken();
  if (!token) throw erroApi("Faça login para continuar.", 401);
  const id = String(token).replace("local-", "");
  const usuario = banco.usuarios.find(function (u) { return u._id === id; });
  if (!usuario || !usuario.ativo) throw erroApi("Sessão inválida.", 401);
  return usuario;
}

/* ---------------- Roteador da API local ---------------- */
async function apiLocal(caminho, config) {
  const banco = lerBanco();
  const metodo = (config.method || "GET").toUpperCase();
  const corpo = config.corpo || {};
  const partes = caminho.split("?")[0].split("/").filter(Boolean); // ex.: ["pedidos","id","cancelar"]
  const recurso = partes[0];

  /* ---------- AUTENTICAÇÃO ---------- */
  if (recurso === "auth") {
    if (partes[1] === "registrar" && metodo === "POST") {
      if (!corpo.nome || !corpo.email || !corpo.senha) throw erroApi("Preencha nome, e-mail e senha.");
      if (String(corpo.senha).length < 6) throw erroApi("A senha precisa ter ao menos 6 caracteres.");
      if (corpo.confirmarSenha !== undefined && corpo.senha !== corpo.confirmarSenha) {
        throw erroApi("As senhas não conferem.");
      }
      const email = String(corpo.email).toLowerCase().trim();
      if (banco.usuarios.some(function (u) { return u.email === email; })) {
        throw erroApi("Este e-mail já está cadastrado.", 409);
      }
      const usuario = {
        _id: novoId(),
        nome: corpo.nome,
        sobrenome: corpo.sobrenome || "",
        email: email,
        senha: corpo.senha,
        perfil: "cliente", // cadastro público sempre cria cliente
        ativo: true,
        telefone: "",
        endereco: "",
        dataNascimento: corpo.dataNascimento || "",
        foto: "",
        criadoEm: new Date().toISOString()
      };
      banco.usuarios.push(usuario);
      gravarBanco(banco);
      return { token: "local-" + usuario._id, usuario: semSenha(usuario) };
    }

    if (partes[1] === "login" && metodo === "POST") {
      const email = String(corpo.email || "").toLowerCase().trim();
      const usuario = banco.usuarios.find(function (u) { return u.email === email; });
      if (!usuario || usuario.senha !== corpo.senha) throw erroApi("E-mail ou senha inválidos.", 401);
      if (!usuario.ativo) throw erroApi("Usuário desativado.", 403);
      return { token: "local-" + usuario._id, usuario: semSenha(usuario) };
    }

    if (partes[1] === "perfil" && metodo === "GET") {
      return { usuario: semSenha(usuarioDoToken(banco)) };
    }

    if (partes[1] === "perfil" && metodo === "PUT") {
      const usuario = usuarioDoToken(banco);
      if (corpo.email && corpo.email.toLowerCase().trim() !== usuario.email) {
        const email = corpo.email.toLowerCase().trim();
        if (banco.usuarios.some(function (u) { return u.email === email; })) {
          throw erroApi("Este e-mail já está em uso.", 409);
        }
        usuario.email = email;
      }
      ["nome", "sobrenome", "telefone", "endereco", "dataNascimento", "foto"].forEach(function (campo) {
        if (corpo[campo] !== undefined) usuario[campo] = corpo[campo];
      });
      if (corpo.senha) {
        if (String(corpo.senha).length < 6) throw erroApi("A senha precisa ter ao menos 6 caracteres.");
        usuario.senha = corpo.senha;
      }
      gravarBanco(banco);
      return { usuario: semSenha(usuario) };
    }
  }

  /* ---------- PRODUTOS (celulares) ---------- */
  if (recurso === "celulares") {
    if (metodo === "GET") return banco.celulares;

    const usuario = usuarioDoToken(banco);
    if (usuario.perfil !== "admin") throw erroApi("Apenas administradores podem gerenciar produtos.", 403);

    if (metodo === "POST") {
      if (Number(corpo.preco) <= 0) throw erroApi("O preço deve ser maior que zero.");
      if (!Number.isInteger(Number(corpo.estoque)) || Number(corpo.estoque) < 0) {
        throw erroApi("O estoque deve ser um número inteiro e não negativo.");
      }
      const celular = {
        _id: novoId(),
        nome: corpo.nome,
        descricao: corpo.descricao || "",
        preco: Number(corpo.preco),
        estoque: Number(corpo.estoque),
        categoria: corpo.categoria || "Geral",
        status: corpo.status || "ativo",
        imagem: corpo.imagem || "",
        criadoEm: new Date().toISOString()
      };
      banco.celulares.push(celular);
      gravarBanco(banco);
      return celular;
    }

    const celular = banco.celulares.find(function (c) { return c._id === partes[1]; });
    if (!celular) throw erroApi("Produto não encontrado.", 404);

    if (metodo === "PUT") {
      if (corpo.preco !== undefined && Number(corpo.preco) <= 0) throw erroApi("O preço deve ser maior que zero.");
      if (corpo.estoque !== undefined && (!Number.isInteger(Number(corpo.estoque)) || Number(corpo.estoque) < 0)) {
        throw erroApi("Estoque inválido.");
      }
      ["nome", "descricao", "categoria", "status", "imagem"].forEach(function (campo) {
        if (corpo[campo] !== undefined) celular[campo] = corpo[campo];
      });
      if (corpo.preco !== undefined) celular.preco = Number(corpo.preco);
      if (corpo.estoque !== undefined) celular.estoque = Number(corpo.estoque);
      gravarBanco(banco);
      return celular;
    }

    if (metodo === "DELETE") {
      const usado = banco.pedidos.some(function (p) {
        return p.itens.some(function (i) { return i.celular === celular._id; });
      });
      if (usado) throw erroApi("Produto vinculado a pedidos: desative em vez de excluir.", 409);
      banco.celulares = banco.celulares.filter(function (c) { return c._id !== celular._id; });
      gravarBanco(banco);
      return { mensagem: "Produto excluído." };
    }
  }

  /* ---------- PEDIDOS ---------- */
  if (recurso === "pedidos") {
    const usuario = usuarioDoToken(banco);

    if (metodo === "GET" && !partes[1]) {
      const lista = usuario.perfil === "admin"
        ? banco.pedidos
        : banco.pedidos.filter(function (p) { return p.usuario === usuario._id; });
      return lista.slice().reverse().map(function (p) {
        const dono = banco.usuarios.find(function (u) { return u._id === p.usuario; });
        return Object.assign({}, p, { nomeUsuario: dono ? dono.nome + " " + dono.sobrenome : "—" });
      });
    }

    if (metodo === "POST" && !partes[1]) {
      const itens = Array.isArray(corpo.itens) ? corpo.itens : [];
      const formasAceitas = ["PIX", "CREDITO", "DEBITO"];
      const forma = String(corpo.formaPagamento || "PIX").toUpperCase();
      if (itens.length === 0) throw erroApi("Seu carrinho está vazio.");
      if (!corpo.cidade) throw erroApi("Selecione a cidade de entrega.");
      if (!formasAceitas.includes(forma)) throw erroApi("Forma de pagamento inválida.");
      if (forma === "PIX" && !corpo.comprovante) throw erroApi("Envie o comprovante do pagamento Pix.");

      const itensFinais = [];
      let total = 0;

      itens.forEach(function (item) {
        const celular = banco.celulares.find(function (c) { return c._id === item.celular; });
        if (!celular) throw erroApi("Produto do pedido não encontrado.", 404);
        if (celular.status !== "ativo") throw erroApi("O produto " + celular.nome + " está inativo.");
        const quantidade = Number(item.quantidade);
        if (!Number.isInteger(quantidade) || quantidade < 1) throw erroApi("Quantidade inválida.");
        if (celular.estoque < quantidade) {
          throw erroApi("Estoque insuficiente para " + celular.nome + ". Disponível: " + celular.estoque + ".");
        }
        const subtotal = celular.preco * quantidade;
        total += subtotal;
        itensFinais.push({
          celular: celular._id,
          nome: celular.nome,
          quantidade: quantidade,
          precoUnitario: celular.preco,
          subtotal: subtotal
        });
      });

      // baixa de estoque
      itensFinais.forEach(function (item) {
        const celular = banco.celulares.find(function (c) { return c._id === item.celular; });
        celular.estoque -= item.quantidade;
      });

      const pedido = {
        _id: novoId(),
        usuario: usuario._id,
        itens: itensFinais,
        valorTotal: Number(total.toFixed(2)),
        status: forma === "PIX" ? "PAGO" : "PENDENTE",
        formaPagamento: forma,
        parcelas: forma === "CREDITO" ? Number(corpo.parcelas || 1) : 1,
        cidade: corpo.cidade,
        comprovante: corpo.comprovante || "",
        criadoEm: new Date().toISOString()
      };

      // Conferência do valor: o que a tela mostrou tem que bater com o calculado aqui.
      if (corpo.valorInformado !== undefined) {
        const informado = Number(Number(corpo.valorInformado).toFixed(2));
        if (Math.abs(informado - pedido.valorTotal) > 0.009) {
          throw erroApi("O valor informado (" + informado + ") não confere com o total do pedido (" + pedido.valorTotal + ").");
        }
      }

      banco.pedidos.push(pedido);
      gravarBanco(banco);
      return pedido;
    }

    const pedido = banco.pedidos.find(function (p) { return p._id === partes[1]; });
    if (!pedido) throw erroApi("Pedido não encontrado.", 404);
    const ehDono = pedido.usuario === usuario._id;
    if (!ehDono && usuario.perfil !== "admin") throw erroApi("Acesso negado a este pedido.", 403);

    function devolverEstoque() {
      pedido.itens.forEach(function (item) {
        const celular = banco.celulares.find(function (c) { return c._id === item.celular; });
        if (celular) celular.estoque += item.quantidade;
      });
    }

    if (partes[2] === "status" && metodo === "PATCH") {
      if (usuario.perfil !== "admin") throw erroApi("Apenas administradores alteram o status.", 403);
      const permitidos = ["PENDENTE", "PAGO", "ENVIADO", "CANCELADO", "FINALIZADO"];
      if (!permitidos.includes(corpo.status)) throw erroApi("Status inválido.");
      if (["CANCELADO", "FINALIZADO"].includes(pedido.status)) {
        throw erroApi("Pedido " + pedido.status + " não pode mudar de status.", 409);
      }
      if (corpo.status === "CANCELADO") devolverEstoque();
      pedido.status = corpo.status;
      gravarBanco(banco);
      return pedido;
    }

    if (partes[2] === "cancelar" && metodo === "POST") {
      if (pedido.status === "CANCELADO") throw erroApi("Este pedido já foi cancelado.", 409);
      if (pedido.status === "FINALIZADO") throw erroApi("Pedido finalizado não pode ser cancelado.", 409);
      devolverEstoque();
      pedido.status = "CANCELADO";
      gravarBanco(banco);
      return pedido;
    }

    if (metodo === "GET") return pedido;
  }

  /* ---------- USUÁRIOS (somente admin) ---------- */
  if (recurso === "usuarios") {
    const usuario = usuarioDoToken(banco);
    if (usuario.perfil !== "admin") throw erroApi("Acesso restrito a administradores.", 403);

    if (metodo === "GET") return banco.usuarios.map(semSenha);

    const alvo = banco.usuarios.find(function (u) { return u._id === partes[1]; });
    if (!alvo) throw erroApi("Usuário não encontrado.", 404);

    if (metodo === "PATCH") {
      if (corpo.perfil) alvo.perfil = corpo.perfil;
      if (corpo.ativo !== undefined) alvo.ativo = !!corpo.ativo;
      gravarBanco(banco);
      return semSenha(alvo);
    }
  }

  /* ---------- ESTATÍSTICAS ---------- */
  if (recurso === "estatisticas") {
    const usuario = usuarioDoToken(banco);
    if (usuario.perfil !== "admin") throw erroApi("Acesso restrito a administradores.", 403);
    const pagos = banco.pedidos.filter(function (p) { return p.status !== "CANCELADO"; });

    // Série dos últimos 6 meses para os gráficos do painel.
    const meses = [];
    const agora = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const chave = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      meses.push({
        chave: chave,
        rotulo: d.toLocaleDateString("pt-BR", { month: "short" }),
        usuarios: 0,
        pedidos: 0
      });
    }
    function somar(lista, campo) {
      lista.forEach(function (registro) {
        const chave = String(registro.criadoEm || "").slice(0, 7);
        const mes = meses.find(function (m) { return m.chave === chave; });
        if (mes) mes[campo] += 1;
      });
    }
    somar(banco.usuarios, "usuarios");
    somar(banco.pedidos, "pedidos");

    return {
      totalUsuarios: banco.usuarios.length,
      totalProdutos: banco.celulares.length,
      totalPedidos: banco.pedidos.length,
      pedidosPendentes: banco.pedidos.filter(function (p) { return p.status === "PENDENTE"; }).length,
      semEstoque: banco.celulares.filter(function (c) { return c.estoque === 0; }).length,
      faturamento: pagos.reduce(function (soma, p) { return soma + p.valorTotal; }, 0),
      serie: meses
    };
  }

  throw erroApi("Rota não encontrada: " + caminho, 404);
}