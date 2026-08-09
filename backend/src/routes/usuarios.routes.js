const express = require("express");
const controller = require("../controllers/usuarios.controller");
const { autenticar, somenteAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", autenticar, somenteAdmin, controller.listar);
router.post("/", autenticar, somenteAdmin, controller.criar);
router.patch("/:id/perfil", autenticar, somenteAdmin, controller.alterarPerfil);
router.patch("/:id/ativo", autenticar, somenteAdmin, controller.alternarAtivo);
router.delete("/:id", autenticar, somenteAdmin, controller.remover);

module.exports = router;