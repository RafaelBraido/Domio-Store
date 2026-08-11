/* ============================================================
   MINHA CONTA: editar dados, foto e senha
   ============================================================ */

const avisoPerfil = document.getElementById("aviso");
let fotoBase64 = "";

if (!obterUsuario()) {
  window.location.href = "login.html";
}

document.getElementById("btn-sair").addEventListener("click", sair);
if (ehAdmin()) document.getElementById("link-admin").style.display = "inline";

function preencher(usuario) {
  document.getElementById("nome").value = usuario.nome || "";
  document.getElementById("sobrenome").value = usuario.sobrenome || "";
  document.getElementById("email").value = usuario.email || "";
  document.getElementById("telefone").value = usuario.telefone || "";
  document.getElementById("endereco").value = usuario.endereco || "";
  fotoBase64 = usuario.foto || "";
  document.getElementById("previa-foto").src = fotoBase64 || "img/celular.svg";
}

document.getElementById("foto").addEventListener("change", function (evento) {
  const arquivo = evento.target.files[0];
  if (!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = function () {
    fotoBase64 = leitor.result;
    document.getElementById("previa-foto").src = fotoBase64;
  };
  leitor.readAsDataURL(arquivo);
});

document.getElementById("form-perfil").addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const dados = {
    nome: document.getElementById("nome").value.trim(),
    sobrenome: document.getElementById("sobrenome").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    endereco: document.getElementById("endereco").value.trim(),
    foto: fotoBase64
  };
  const senha = document.getElementById("senha").value;
  if (senha) dados.senha = senha;

  try {
    const resposta = await ServicoAuth.atualizarPerfil(dados);
    salvarSessao(obterToken(), resposta.usuario);
    preencher(resposta.usuario);
    document.getElementById("senha").value = "";
    mostrarAviso(avisoPerfil, "Dados atualizados com sucesso.", "ok");
  } catch (erro) {
    mostrarAviso(avisoPerfil, erro.message, "erro");
  }
});

(async function iniciar() {
  try {
    const resposta = await ServicoAuth.meuPerfil();
    preencher(resposta.usuario);
  } catch (erro) {
    mostrarAviso(avisoPerfil, erro.message, "erro");
  }
})();