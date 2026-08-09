const express = require("express");
const controller = require("../controllers/pedidos.controller");
const { autenticar, adminOuVendedor } = require("../middleware/auth");

const router = express.Router();

router.post("/", autenticar, controller.criar);
router.get("/", autenticar, controller.listar);
router.get("/:id", autenticar, controller.obter);
router.patch("/:id/status", autenticar, adminOuVendedor, controller.alterarStatus);
router.patch("/:id/cancelar", autenticar, controller.cancelar);

module.exports = router;