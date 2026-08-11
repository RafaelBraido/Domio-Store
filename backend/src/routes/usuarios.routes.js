const express = require("express");
const servico = require("../services/usuarios.service");
const { autenticar, somenteAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", autenticar, somenteAdmin, async (req, res) => {
  try {
    return res.json(await servico.listar());
  } catch (erro) {
    return res.status(500).json({ mensagem: erro.message });
  }
});

router.patch("/:id", autenticar, somenteAdmin, async (req, res) => {
  try {
    return res.json(await servico.atualizar(req.params.id, req.body, req.usuario));
  } catch (erro) {
    return res.status(erro.status || 500).json({ mensagem: erro.message });
  }
});

module.exports = router;
