/*
 * Cria (ou promove) a conta de administrador.
 * Uso: npm run criar-admin
 * Login padrao: admin@dominio.com / admin123
 */
require("dotenv").config();
const mongoose = require("mongoose");
const conectarBanco = require("../src/config/db");
const Usuario = require("../src/models/Usuario");

const EMAIL = process.env.ADMIN_EMAIL || "admin@dominio.com";
const SENHA = process.env.ADMIN_SENHA || "admin123";

(async function executar() {
  try {
    await conectarBanco();
    let usuario = await Usuario.findOne({ email: EMAIL });

    if (usuario) {
      usuario.perfil = "admin";
      usuario.ativo = true;
      usuario.senha = SENHA;
      await usuario.save();
      console.log(`Usuario ${EMAIL} promovido a administrador.`);
    } else {
      usuario = await Usuario.create({
        nome: "Administrador",
        sobrenome: "Dominio",
        email: EMAIL,
        senha: SENHA,
        perfil: "admin"
      });
      console.log(`Administrador criado: ${EMAIL} / ${SENHA}`);
    }
  } catch (erro) {
    console.error("Falha ao criar admin:", erro.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();