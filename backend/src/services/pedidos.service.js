/*
 * SERVICE DE PEDIDOS
 * Concentra as regras de negocio: validacao de produtos, calculo do
 * valor total no back-end, baixa e devolucao de estoque.
 */
const mongoose = require("mongoose");
const Celular = require("../models/Celular");
const Pedido = require("../models/Pedido");

function erro(mensagem, status) {
  const e = new Error(mensagem);
  e.status = status || 400;
  return e;
}

async function criarPedido(usuario, itensRecebidos, cidade) {
  if (!Array.isArray(itensRecebidos) || itensRecebidos.length === 0) {
    throw erro("Informe ao menos um celular no pedido.");
  }
  if (!cidade) throw erro("Informe a cidade de entrega.");

  const itensFinais = [];
  let valorTotal = 0;

  for (const item of itensRecebidos) {
    const quantidade = Number(item.quantidade);
    if (!mongoose.isValidObjectId(item.celular)) throw erro("Identificador de celular invalido.");
    if (!Number.isInteger(quantidade) || quantidade < 1) throw erro("Quantidade invalida no pedido.");

    const celular = await Celular.findById(item.celular);
    if (!celular) throw erro("Celular do pedido nao encontrado.", 404);
    if (celular.status !== "ativo") throw erro(`O celular ${celular.nome} esta inativo.`);
    if (celular.estoque < quantidade) {
      throw erro(`Estoque insuficiente para ${celular.nome}. Disponivel: ${celular.estoque}.`);
    }

    const subtotal = celular.preco * quantidade;
    valorTotal += subtotal;
    itensFinais.push({
      celular: celular._id,
      nome: celular.nome,
      quantidade,
      precoUnitario: celular.preco,
      subtotal
    });
  }

  for (const item of itensFinais) {
    await Celular.updateOne({ _id: item.celular }, { $inc: { estoque: -item.quantidade } });
  }

  return Pedido.create({
    usuario: usuario._id,
    itens: itensFinais,
    valorTotal: Number(valorTotal.toFixed(2)),
    cidade,
    status: "PENDENTE"
  });
}

async function devolverEstoque(pedido) {
  for (const item of pedido.itens) {
    await Celular.updateOne({ _id: item.celular }, { $inc: { estoque: item.quantidade } });
  }
}

async function listarPedidos(usuario, status) {
  const ehGestor = ["admin", "vendedor"].includes(usuario.perfil);
  const filtro = ehGestor ? {} : { usuario: usuario._id };
  if (status) filtro.status = status;
  return Pedido.find(filtro).populate("usuario", "nome sobrenome email perfil").sort({ criadoEm: -1 });
}

async function alterarStatus(id, status) {
  const permitidos = ["PENDENTE", "PAGO", "CANCELADO", "FINALIZADO"];
  if (!permitidos.includes(status)) throw erro("Status invalido.");

  const pedido = await Pedido.findById(id);
  if (!pedido) throw erro("Pedido nao encontrado.", 404);
  if (["CANCELADO", "FINALIZADO"].includes(pedido.status)) {
    throw erro(`Pedido ${pedido.status} nao pode mudar de status.`, 409);
  }
  if (status === "CANCELADO") await devolverEstoque(pedido);
  pedido.status = status;
  await pedido.save();
  return pedido;
}

async function cancelar(id, usuario) {
  const pedido = await Pedido.findById(id);
  if (!pedido) throw erro("Pedido nao encontrado.", 404);

  const ehGestor = ["admin", "vendedor"].includes(usuario.perfil);
  const ehDono = pedido.usuario.toString() === usuario._id.toString();
  if (!ehGestor && !ehDono) throw erro("Voce so pode cancelar seus proprios pedidos.", 403);
  if (pedido.status === "CANCELADO") throw erro("Este pedido ja foi cancelado.", 409);
  if (pedido.status === "FINALIZADO") throw erro("Pedido finalizado nao pode ser cancelado.", 409);

  await devolverEstoque(pedido);
  pedido.status = "CANCELADO";
  await pedido.save();
  return pedido;
}

module.exports = { criarPedido, listarPedidos, alterarStatus, cancelar };