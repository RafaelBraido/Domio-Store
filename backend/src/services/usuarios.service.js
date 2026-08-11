/*
 * SERVICE DE USUARIOS (uso administrativo)
 */
const Usuario = require("../models/Usuario");

async function listar() {
  return Usuario.find({}).sort({ criadoEm: -1 });
}

async function atualizar(id, dados, usuarioLogado) {
  const usuario = await Usuario.findById(id);
  if (!usuario) {
    const e = new Error("Usuario nao encontrado.");
    e.status = 404;
    throw e;
  }
  if (dados.perfil && ["admin", "vendedor", "cliente"].includes(dados.perfil)) {
    usuario.perfil = dados.perfil;
  }
  if (dados.ativo !== undefined) {
    if (usuario._id.toString() === usuarioLogado._id.toString() && !dados.ativo) {
      const e = new Error("Voce nao pode desativar a si mesmo.");
      e.status = 400;
      throw e;
    }
    usuario.ativo = !!dados.ativo;
  }
  await usuario.save();
  return usuario;
}

module.exports = { listar, atualizar };