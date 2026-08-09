const Usuario = require("../models/Usuario");

async function listar(req, res) {
  try {
    const usuarios = await Usuario.find({}).sort({ criadoEm: -1 });
    return res.json(usuarios);
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function criar(req, res) {
  try {
    const { nome, sobrenome, email, senha, perfil } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: "Nome, e-mail e senha sao obrigatorios." });
    }

    const emailNormalizado = String(email).toLowerCase().trim();
    if (await Usuario.findOne({ email: emailNormalizado })) {
      return res.status(409).json({ mensagem: "E-mail ja cadastrado." });
    }

    const usuario = await Usuario.create({
      nome,
      sobrenome: sobrenome || "",
      email: emailNormalizado,
      senha,
      perfil: ["admin", "vendedor", "cliente"].includes(perfil) ? perfil : "cliente"
    });

    return res.status(201).json({ mensagem: "Usuario criado.", usuario: usuario.toJSON() });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function alterarPerfil(req, res) {
  try {
    const { perfil } = req.body;
    if (!["admin", "vendedor", "cliente"].includes(perfil)) {
      return res.status(400).json({ mensagem: "Perfil invalido." });
    }
    const usuario = await Usuario.findByIdAndUpdate(req.params.id, { perfil }, { new: true });
    if (!usuario) return res.status(404).json({ mensagem: "Usuario nao encontrado." });
    return res.json({ mensagem: "Perfil alterado.", usuario: usuario.toJSON() });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function alternarAtivo(req, res) {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensagem: "Usuario nao encontrado." });
    if (usuario._id.toString() === req.usuario._id.toString()) {
      return res.status(400).json({ mensagem: "Voce nao pode desativar a si mesmo." });
    }
    usuario.ativo = !usuario.ativo;
    await usuario.save();
    return res.json({ mensagem: usuario.ativo ? "Usuario ativado." : "Usuario desativado.", usuario: usuario.toJSON() });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function remover(req, res) {
  try {
    if (req.params.id === req.usuario._id.toString()) {
      return res.status(400).json({ mensagem: "Voce nao pode excluir a si mesmo." });
    }
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ mensagem: "Usuario nao encontrado." });
    return res.json({ mensagem: "Usuario excluido." });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

module.exports = { listar, criar, alterarPerfil, alternarAtivo, remover };