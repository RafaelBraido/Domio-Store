const servico = require("../services/estatisticas.service");

async function resumo(req, res) {
  try {
    return res.json(await servico.resumo());
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
}

module.exports = { resumo };
