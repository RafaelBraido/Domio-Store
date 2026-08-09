const Celular = require("../models/Celular");
const Pedido = require("../models/Pedido");

function montarUrlImagem(req, arquivo, urlExterna) {
  if (arquivo) {
    return `${req.protocol}://${req.get("host")}/uploads/${arquivo.filename}`;
  }
  return urlExterna || "";
}

async function listar(req, res) {
  try {
    const { busca, categoria, status } = req.query;
    const filtro = {};

    if (busca) {
      filtro.$or = [
        { nome: { $regex: busca, $options: "i" } },
        { descricao: { $regex: busca, $options: "i" } }
      ];
    }
    if (categoria && categoria !== "todas") filtro.categoria = categoria;
    if (status) filtro.status = status;

    const celulares = await Celular.find(filtro).sort({ criadoEm: -1 });
    return res.json(celulares);
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function obter(req, res) {
  try {
    const celular = await Celular.findById(req.params.id);
    if (!celular) return res.status(404).json({ mensagem: "Celular nao encontrado." });
    return res.json(celular);
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function criar(req, res) {
  try {
    const { nome, descricao, categoria, status, imagemUrl } = req.body;
    const preco = Number(req.body.preco);
    const estoque = Number(req.body.estoque);

    if (!nome) return res.status(400).json({ mensagem: "O nome do celular e obrigatorio." });
    if (!(preco > 0)) return res.status(400).json({ mensagem: "O preco deve ser maior que zero." });
    if (!Number.isInteger(estoque) || estoque < 0) {
      return res.status(400).json({ mensagem: "O estoque deve ser inteiro e maior ou igual a zero." });
    }

    const celular = await Celular.create({
      nome,
      descricao: descricao || "",
      preco,
      estoque,
      categoria: categoria || "Smartphones",
      status: status === "inativo" ? "inativo" : "ativo",
      imagem: montarUrlImagem(req, req.file, imagemUrl),
      criadoPor: req.usuario._id
    });

    return res.status(201).json({ mensagem: "Celular cadastrado.", celular });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function atualizar(req, res) {
  try {
    const celular = await Celular.findById(req.params.id);
    if (!celular) return res.status(404).json({ mensagem: "Celular nao encontrado." });

    const { nome, descricao, categoria, status, imagemUrl } = req.body;

    if (nome !== undefined) celular.nome = nome;
    if (descricao !== undefined) celular.descricao = descricao;
    if (categoria !== undefined) celular.categoria = categoria;
    if (status !== undefined) celular.status = status === "inativo" ? "inativo" : "ativo";

    if (req.body.preco !== undefined) {
      const preco = Number(req.body.preco);
      if (!(preco > 0)) return res.status(400).json({ mensagem: "O preco deve ser maior que zero." });
      celular.preco = preco;
    }

    if (req.body.estoque !== undefined) {
      const estoque = Number(req.body.estoque);
      if (!Number.isInteger(estoque) || estoque < 0) {
        return res.status(400).json({ mensagem: "O estoque deve ser inteiro e maior ou igual a zero." });
      }
      celular.estoque = estoque;
    }

    if (req.file || imagemUrl) {
      celular.imagem = montarUrlImagem(req, req.file, imagemUrl);
    }

    await celular.save();
    return res.json({ mensagem: "Celular atualizado.", celular });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function remover(req, res) {
  try {
    const celular = await Celular.findById(req.params.id);
    if (!celular) return res.status(404).json({ mensagem: "Celular nao encontrado." });

    const vinculado = await Pedido.exists({ "itens.celular": celular._id });
    if (vinculado) {
      return res.status(409).json({
        mensagem: "Nao e possivel excluir: existem pedidos vinculados a este celular. Desative-o."
      });
    }

    await celular.deleteOne();
    return res.json({ mensagem: "Celular excluido." });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

module.exports = { listar, obter, criar, atualizar, remover };