const express = require("express");
const controller = require("../controllers/estatisticas.controller");
const { autenticar, adminOuVendedor } = require("../middleware/auth");

const router = express.Router();

router.get("/", autenticar, adminOuVendedor, controller.resumo);

module.exports = router;