/*
 * SERVICE DE ESTATISTICAS
 * Monta os indicadores exibidos no painel do administrador.
 */
const Usuario = require("../models/Usuario");
const Celular = require("../models/Celular");
const Pedido = require("../models/Pedido");

async function resumo() {
  const [totalUsuarios, totalProdutos, pedidos, semEstoque] = await Promise.all([
    Usuario.countDocuments({}),
    Celular.countDocuments({}),
    Pedido.find({}),
    Celular.countDocuments({ estoque: 0 })
  ]);

  const validos = pedidos.filter((p) => p.status !== "CANCELADO");

  return {
    totalUsuarios,
    totalProdutos,
    totalPedidos: pedidos.length,
    pedidosPendentes: pedidos.filter((p) => p.status === "PENDENTE").length,
    semEstoque,
    faturamento: Number(validos.reduce((soma, p) => soma + p.valorTotal, 0).toFixed(2))
  };
}

module.exports = { resumo };