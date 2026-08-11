const mongoose = require("mongoose");

const itemPedidoSchema = new mongoose.Schema(
  {
    celular: { type: mongoose.Schema.Types.ObjectId, ref: "Celular", required: true },
    nome: { type: String, required: true },
    quantidade: { type: Number, required: true, min: 1 },
    precoUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 }
  },
  { _id: false, versionKey: false }
);

const pedidoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
    itens: { type: [itemPedidoSchema], required: true },
    valorTotal: { type: Number, required: true, min: 0 },
    cidade: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDENTE", "PAGO", "CANCELADO", "FINALIZADO"],
      default: "PENDENTE"
    },
    criadoEm: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Pedido", pedidoSchema);