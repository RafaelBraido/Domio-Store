const Usuario = require("../models/Usuario");
const Celular = require("../models/Celular");
const Pedido = require("../models/Pedido");

async function resumo(req, res) {
  try {
    const [totalUsuarios, totalCelulares, pedidos, estoqueAgregado] = await Promise.all([
      Usuario.countDocuments({}),
      Celular.countDocuments({}),
      Pedido.find({}),
      Celular.aggregate([{ $group: { _id: null, total: { $sum: "$estoque" } } }])
    ]);

    const vendasValidas = pedidos.filter((p) => p.status !== "CANCELADO");
    const faturamento = vendasValidas.reduce((acc, p) => acc + p.valorTotal, 0);

    const porStatus = {
      PENDENTE: pedidos.filter((p) => p.status === "PENDENTE").length,
      PAGO: pedidos.filter((p) => p.status === "PAGO").length,
      CANCELADO: pedidos.filter((p) => p.status === "CANCELADO").length,
      FINALIZADO: pedidos.filter((p) => p.status === "FINALIZADO").length
    };

    const contagemProdutos = {};
    for (const pedido of vendasValidas) {
      for (const item of pedido.itens) {
        contagemProdutos[item.nome] = (contagemProdutos[item.nome] || 0) + item.quantidade;
      }
    }
    const maisVendidos = Object.entries(contagemProdutos)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    return res.json({
      totalUsuarios,
      totalCelulares,
      totalVendas: vendasValidas.length,
      faturamento: Number(faturamento.toFixed(2)),
      estoqueTotal: estoqueAgregado.length ? estoqueAgregado[0].total : 0,
      pedidosPorStatus: porStatus,
      maisVendidos
    });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

module.exports = { resumo };