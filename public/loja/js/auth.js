/* ============================================================
   LOGIN E CADASTRO
   ============================================================ */

const formCadastro = document.getElementById("form-cadastro");
const formLogin = document.getElementById("form-login");

if (formCadastro) {
  formCadastro.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const aviso = document.getElementById("aviso");
    const botao = formCadastro.querySelector("button[type=submit]");

    const dados = {
      nome: document.getElementById("nome").value.trim(),
      sobrenome: document.getElementById("sobrenome").value.trim(),
      email: document.getElementById("email").value.trim(),
      senha: document.getElementById("senha").value,
      confirmarSenha: document.getElementById("confirmar").value,
      dataNascimento: document.getElementById("nascimento").value.trim()
    };

    if (dados.senha !== dados.confirmarSenha) {
      mostrarAviso(aviso, "As senhas não conferem.", "erro");
      return;
    }

    botao.disabled = true;
    mostrarAviso(aviso, "Criando sua conta...", "info");
    try {
      const resposta = await ServicoAuth.registrar(dados);
      salvarSessao(resposta.token, resposta.usuario);
      mostrarAviso(aviso, "Conta criada! Redirecionando...", "ok");
      setTimeout(function () { window.location.href = "index.html"; }, 700);
    } catch (erro) {
      mostrarAviso(aviso, erro.message, "erro");
      botao.disabled = false;
    }
  });
}

if (formLogin) {
  formLogin.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const aviso = document.getElementById("aviso");
    const botao = formLogin.querySelector("button[type=submit]");

    botao.disabled = true;
    mostrarAviso(aviso, "Entrando...", "info");
    try {
      const resposta = await ServicoAuth.entrar(
        document.getElementById("email").value.trim(),
        document.getElementById("senha").value
      );
      salvarSessao(resposta.token, resposta.usuario);
      window.location.href = resposta.usuario.perfil === "admin" ? "admin.html" : "index.html";
    } catch (erro) {
      mostrarAviso(aviso, erro.message, "erro");
      botao.disabled = false;
    }
  });
}