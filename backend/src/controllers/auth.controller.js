const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario._id.toString(), perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function registrar(req, res) {
  try {
    const { nome, sobrenome, email, senha, dataNascimento } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: "Nome, e-mail e senha sao obrigatorios." });
    }
    if (String(senha).length < 6) {
      return res.status(400).json({ mensagem: "A senha deve ter ao menos 6 caracteres." });
    }

    const emailNormalizado = String(email).toLowerCase().trim();
    const jaExiste = await Usuario.findOne({ email: emailNormalizado });
    if (jaExiste) {
      return res.status(409).json({ mensagem: "Este e-mail ja esta cadastrado." });
    }

    const usuario = await Usuario.create({
      nome,
      sobrenome: sobrenome || "",
      email: emailNormalizado,
      senha,
      dataNascimento: dataNascimento || "",
      perfil: "cliente"
    });

    return res.status(201).json({
      mensagem: "Conta criada com sucesso.",
      token: gerarToken(usuario),
      usuario: usuario.toJSON()
    });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ mensagem: "E-mail e senha sao obrigatorios." });
    }

    const usuario = await Usuario.findOne({ email: String(email).toLowerCase().trim() }).select("+senha");
    if (!usuario) {
      return res.status(401).json({ mensagem: "Credenciais invalidas." });
    }
    if (!usuario.ativo) {
      return res.status(403).json({ mensagem: "Usuario desativado." });
    }

    const senhaConfere = await usuario.compararSenha(senha);
    if (!senhaConfere) {
      return res.status(401).json({ mensagem: "Credenciais invalidas." });
    }

    return res.json({
      mensagem: "Login realizado com sucesso.",
      token: gerarToken(usuario),
      usuario: usuario.toJSON()
    });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

async function perfil(req, res) {
  return res.json({ usuario: req.usuario.toJSON() });
}

async function atualizarPerfil(req, res) {
  try {
    const { nome, sobrenome, dataNascimento, email, senha } = req.body;
    const usuario = await Usuario.findById(req.usuario._id).select("+senha");

    if (email && email.toLowerCase().trim() !== usuario.email) {
      const emailEmUso = await Usuario.findOne({ email: email.toLowerCase().trim() });
      if (emailEmUso) {
        return res.status(409).json({ mensagem: "Este e-mail ja esta em uso." });
      }
      usuario.email = email.toLowerCase().trim();
    }

    if (nome) usuario.nome = nome;
    if (sobrenome !== undefined) usuario.sobrenome = sobrenome;
    if (dataNascimento !== undefined) usuario.dataNascimento = dataNascimento;

    if (senha) {
      if (String(senha).length < 6) {
        return res.status(400).json({ mensagem: "A senha deve ter ao menos 6 caracteres." });
      }
      usuario.senha = senha;
    }

    await usuario.save();
    return res.json({ mensagem: "Perfil atualizado.", usuario: usuario.toJSON() });
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

module.exports = { registrar, login, perfil, atualizarPerfil };