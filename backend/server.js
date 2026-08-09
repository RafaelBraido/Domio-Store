require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");

const conectarBanco = require("./src/config/db");

const authRoutes = require("./src/routes/auth.routes");
const celularesRoutes = require("./src/routes/celulares.routes");
const pedidosRoutes = require("./src/routes/pedidos.routes");
const estatisticasRoutes = require("./src/routes/estatisticas.routes");
const usuariosRoutes = require("./src/routes/usuarios.routes");

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.json({
    api: "Dominio Store API",
    status: "online",
    versao: "1.0.0",
    endpoints: [
      "/api/auth",
      "/api/celulares",
      "/api/pedidos",
      "/api/estatisticas",
      "/api/usuarios"
    ]
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/celulares", celularesRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/estatisticas", estatisticasRoutes);
app.use("/api/usuarios", usuariosRoutes);

app.use((req, res) => {
  res.status(404).json({ mensagem: "Rota nao encontrada." });
});

app.use((erro, req, res, next) => {
  console.error("Erro nao tratado:", erro);
  res.status(erro.status || 500).json({ mensagem: erro.message || "Erro interno do servidor." });
});

const PORT = process.env.PORT || 3000;

conectarBanco()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Dominio Store API rodando na porta ${PORT}`);
    });
  })
  .catch((erro) => {
    console.error("Falha ao conectar no MongoDB:", erro.message);
    app.listen(PORT, () => {
      console.log(`Dominio Store API rodando na porta ${PORT} (sem banco conectado)`);
    });
  });

module.exports = app;