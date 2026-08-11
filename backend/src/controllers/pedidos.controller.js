/*
 * CONTROLLER DE PEDIDOS
 * Recebe a requisicao, chama o service e devolve a resposta.
 */
const servico = require("../services/pedidos.service");

async function criar(req, res) {
  try {
    const pedido = await servico.criarPedido(req.usuario, req.body.itens, req.body.cidade);
    return res.status(201).json(pedido);
  } catch (erro) {
    return res.status(erro.status || 500).json({ mensagem: erro.message });
  }
}

async function listar(req, res) {
  try {
    return res.json(await servico.listarPedidos(req.usuario, req.query.status));
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function alterarStatus(req, res) {
  try {
    return res.json(await servico.alterarStatus(req.params.id, req.body.status));
  } catch (erro) {
    return res.status(erro.status || 500).json({ mensagem: erro.message });
  }
}

async function cancelar(req, res) {
  try {
    return res.json(await servico.cancelar(req.params.id, req.usuario));
  } catch (erro) {
    return res.status(erro.status || 500).json({ mensagem: erro.message });
  }
}

module.exports = { criar, listar, alterarStatus, cancelar };
