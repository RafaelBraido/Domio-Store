const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usuarioSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    sobrenome: { type: String, default: "", trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    senha: { type: String, required: true, minlength: 6, select: false },
    dataNascimento: { type: String, default: "" },
    perfil: {
      type: String,
      enum: ["cliente", "vendedor", "admin"],
      default: "cliente"
    },
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

usuarioSchema.pre("save", async function hashSenha(next) {
  if (!this.isModified("senha")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  return next();
});

usuarioSchema.methods.compararSenha = function compararSenha(senhaPlana) {
  return bcrypt.compare(senhaPlana, this.senha);
};

usuarioSchema.methods.toJSON = function toJSON() {
  const objeto = this.toObject();
  delete objeto.senha;
  return objeto;
};

module.exports = mongoose.model("Usuario", usuarioSchema);