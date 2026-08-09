const express = require("express");
const controller = require("../controllers/celulares.controller");
const { autenticar, adminOuVendedor } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", controller.listar);
router.get("/:id", controller.obter);
router.post("/", autenticar, adminOuVendedor, upload.single("imagem"), controller.criar);
router.put("/:id", autenticar, adminOuVendedor, upload.single("imagem"), controller.atualizar);
router.patch("/:id", autenticar, adminOuVendedor, controller.atualizar);
router.delete("/:id", autenticar, adminOuVendedor, controller.remover);

module.exports = router;