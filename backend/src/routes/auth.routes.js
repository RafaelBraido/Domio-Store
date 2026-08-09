const express = require("express");
const { registrar, login, perfil, atualizarPerfil } = require("../controllers/auth.controller");
const { autenticar } = require("../middleware/auth");

const router = express.Router();

router.post("/registrar", registrar);
router.post("/login", login);
router.get("/perfil", autenticar, perfil);
router.put("/perfil", autenticar, atualizarPerfil);

module.exports = router;