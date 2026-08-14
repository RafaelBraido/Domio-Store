/* ============================================================
   SERVICES — camada que conversa com a API
   ------------------------------------------------------------
   As telas nunca chamam fetch direto: elas usam estes serviços.
   ============================================================ */

const ServicoAuth = {
  registrar: function (dados) { return requisitar("/auth/registrar", { method: "POST", corpo: dados }); },
  entrar: function (email, senha) { return requisitar("/auth/login", { method: "POST", corpo: { email: email, senha: senha } }); },
  meuPerfil: function () { return requisitar("/auth/perfil"); },
  atualizarPerfil: function (dados) { return requisitar("/auth/perfil", { method: "PUT", corpo: dados }); }
};

const ServicoProdutos = {
  listar: function () { return requisitar("/celulares"); },
  criar: function (dados) { return requisitar("/celulares", { method: "POST", corpo: dados }); },
  atualizar: function (id, dados) { return requisitar("/celulares/" + id, { method: "PUT", corpo: dados }); },
  excluir: function (id) { return requisitar("/celulares/" + id, { method: "DELETE" }); }
};

const ServicoPedidos = {
  listar: function () { return requisitar("/pedidos"); },
  criar: function (dados) {
    return requisitar("/pedidos", { method: "POST", corpo: dados });
  },
  alterarStatus: function (id, status) { return requisitar("/pedidos/" + id + "/status", { method: "PATCH", corpo: { status: status } }); },
  cancelar: function (id) { return requisitar("/pedidos/" + id + "/cancelar", { method: "POST" }); }
};

const ServicoUsuarios = {
  listar: function () { return requisitar("/usuarios"); },
  atualizar: function (id, dados) { return requisitar("/usuarios/" + id, { method: "PATCH", corpo: dados }); }
};

const ServicoEstatisticas = {
  obter: function () { return requisitar("/estatisticas"); }
};