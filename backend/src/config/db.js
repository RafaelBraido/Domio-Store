const mongoose = require("mongoose");

async function conectarBanco() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI nao definida no ambiente.");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB conectado com sucesso.");
  return mongoose.connection;
}

module.exports = conectarBanco;