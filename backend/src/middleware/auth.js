const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

async function autenticar(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ mensagem: "Token nao informado." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(payload.id);

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ mensagem: "Usuario invalido ou desativado." });
    }

    req.usuario = usuario;
    return next();
  } catch (erro) {
    return res.status(401).json({ mensagem: "Token invalido ou expirado." });
  }
}

function autorizar(...perfis) {
  return function verificar(req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ mensagem: "Nao autenticado." });
    }
    if (!perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ mensagem: "Acesso negado para o seu perfil." });
    }
    return next();
  };
}

const somenteAdmin = autorizar("admin");
const adminOuVendedor = autorizar("admin", "vendedor");

module.exports = { autenticar, autorizar, somenteAdmin, adminOuVendedor };