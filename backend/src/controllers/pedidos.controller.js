const mongoose = require("mongoose");
const Celular = require("../models/Celular");
const Pedido = require("../models/Pedido");

const TRANSICOES_BLOQUEADAS = ["CANCELADO", "FINALIZADO"];

async function criar(req, res) {
  try {
    const itensRecebidos = Array.isArray(req.body.itens) ? req.body.itens : [];
    if (itensRecebidos.length === 0) {
      return res.status(400).json({ mensagem: "Informe ao menos um celular no pedido." });
    }

    const itensFinais = [];
    let valorTotal = 0;

    for (const item of itensRecebidos) {
      const quantidade = Number(item.quantidade);
      if (!mongoose.isValidObjectId(item.celular)) {
        return res.status(400).json({ mensagem: "Identificador de celular invalido." });
      }
      if (!Number.isInteger(quantidade) || quantidade < 1) {
        return res.status(400).json({ mensagem: "Quantidade invalida no pedido." });
      }

      const celular = await Celular.findById(item.celular);
      if (!celular) {
        return res.status(404).json({ mensagem: "Celular do pedido nao encontrado." });
      }
      if (celular.status !== "ativo") {
        return res.status(400).json({ mensagem: `O celular ${celular.nome} esta inativo.` });
      }
      if (celular.estoque < quantidade) {
        return res.status(400).json({
          mensagem: `Estoque insuficiente para ${celular.nome}. Disponivel: ${celular.estoque}.`
        });
      }

      const precoUnitario = celular.preco;
      const subtotal = precoUnitario * quantidade;
      valorTotal += subtotal;

      itensFinais.push({
        celular: celular._id,
        nome: celular.nome,
        quantidade,
        precoUnitario,
        subtotal
      });
    }

    for (const item of itensFinais) {
      await Celular.updateOne({ _id: item.celular }, { $inc: { estoque: -item.quantidade } });
    }

    const pedido = await Pedido.create({
      usuario: req.usuario._id,
      itens: itensFinais,
      valorTotal: Number(valorTotal.toFixed(2)),
      status: "PENDENTE"
    });

    return res.status(201).json({ mensagem: "Pedido criado com sucesso.", pedido });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function listar(req, res) {
  try {
    const ehGestor = ["admin", "vendedor"].includes(req.usuario.perfil);
    const filtro = ehGestor ? {} : { usuario: req.usuario._id };
    if (req.query.status) filtro.status = req.query.status;

    const pedidos = await Pedido.find(filtro)
      .populate("usuario", "nome sobrenome email perfil")
      .sort({ criadoEm: -1 });

    return res.json(pedidos);
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function obter(req, res) {
  try {
    const pedido = await Pedido.findById(req.params.id).populate("usuario", "nome email perfil");
    if (!pedido) return res.status(404).json({ mensagem: "Pedido nao encontrado." });

    const ehGestor = ["admin", "vendedor"].includes(req.usuario.perfil);
    const ehDono = pedido.usuario && pedido.usuario._id.toString() === req.usuario._id.toString();
    if (!ehGestor && !ehDono) {
      return res.status(403).json({ mensagem: "Acesso negado a este pedido." });
    }

    return res.json(pedido);
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function alterarStatus(req, res) {
  try {
    const { status } = req.body;
    const permitidos = ["PENDENTE", "PAGO", "CANCELADO", "FINALIZADO"];
    if (!permitidos.includes(status)) {
      return res.status(400).json({ mensagem: "Status invalido." });
    }

    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ mensagem: "Pedido nao encontrado." });

    if (TRANSICOES_BLOQUEADAS.includes(pedido.status)) {
      return res.status(409).json({
        mensagem: `Pedido ${pedido.status} nao pode voltar para status anteriores.`
      });
    }

    if (status === "CANCELADO") {
      for (const item of pedido.itens) {
        await Celular.updateOne({ _id: item.celular }, { $inc: { estoque: item.quantidade } });
      }
    }

    pedido.status = status;
    await pedido.save();

    return res.json({ mensagem: "Status atualizado.", pedido });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function cancelar(req, res) {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ mensagem: "Pedido nao encontrado." });

    const ehGestor = ["admin", "vendedor"].includes(req.usuario.perfil);
    const ehDono = pedido.usuario.toString() === req.usuario._id.toString();
    if (!ehGestor && !ehDono) {
      return res.status(403).json({ mensagem: "Voce so pode cancelar seus proprios pedidos." });
    }

    if (pedido.status === "CANCELADO") {
      return res.status(409).json({ mensagem: "Este pedido ja foi cancelado." });
    }
    if (pedido.status === "FINALIZADO") {
      return res.status(409).json({ mensagem: "Pedido finalizado nao pode ser cancelado." });
    }

    for (const item of pedido.itens) {
      await Celular.updateOne({ _id: item.celular }, { $inc: { estoque: item.quantidade } });
    }

    pedido.status = "CANCELADO";
    await pedido.save();

    return res.json({ mensagem: "Pedido cancelado e estoque estornado.", pedido });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

module.exports = { criar, listar, obter, alterarStatus, cancelar };