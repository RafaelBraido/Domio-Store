const mongoose = require("mongoose");

const celularSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, default: "", trim: true },
    preco: {
      type: Number,
      required: true,
      validate: {
        validator: (valor) => valor > 0,
        message: "O preco deve ser maior que zero."
      }
    },
    estoque: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: (valor) => Number.isInteger(valor) && valor >= 0,
        message: "O estoque deve ser um numero inteiro maior ou igual a zero."
      }
    },
    categoria: { type: String, default: "Smartphones", trim: true },
    status: { type: String, enum: ["ativo", "inativo"], default: "ativo" },
    imagem: { type: String, default: "" },
    criadoEm: { type: Date, default: Date.now },
    criadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }
  },
  { versionKey: false }
);

celularSchema.virtual("disponivel").get(function disponivel() {
  return this.status === "ativo" && this.estoque > 0;
});

celularSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Celular", celularSchema);