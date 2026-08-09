document.addEventListener("DOMContentLoaded", function iniciarAuth() {
  const formCadastro = document.getElementById("signup-form");
  const formLogin = document.getElementById("login-form");

  if (formCadastro) {
    let aviso = document.getElementById("auth-aviso");
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.id = "auth-aviso";
      aviso.style.display = "none";
      formCadastro.appendChild(aviso);
    }

    formCadastro.addEventListener("submit", async function enviar(evento) {
      evento.preventDefault();

      const dados = {
        email: document.getElementById("email").value.trim(),
        senha: document.getElementById("senha").value,
        nome: document.getElementById("nome").value.trim(),
        sobrenome: document.getElementById("sobrenome").value.trim(),
        dataNascimento: document.getElementById("dataNascimento").value.trim()
      };

      if (dados.senha.length < 6) {
        mostrarAviso(aviso, "A senha deve ter ao menos 6 caracteres.", "erro");
        return;
      }

      try {
        mostrarAviso(aviso, "Criando sua conta...", "info");
        const resposta = await api("/api/auth/registrar", {
          method: "POST",
          body: JSON.stringify(dados)
        });
        salvarSessao(resposta.token, resposta.usuario);
        mostrarAviso(aviso, "Conta criada com sucesso! Redirecionando...", "sucesso");
        setTimeout(function redirecionar() {
          window.location.href = "index.html";
        }, 900);
      } catch (erro) {
        mostrarAviso(aviso, erro.message, "erro");
      }
    });
  }

  if (formLogin) {
    let aviso = document.getElementById("auth-aviso");
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.id = "auth-aviso";
      aviso.style.display = "none";
      formLogin.appendChild(aviso);
    }

    formLogin.addEventListener("submit", async function enviar(evento) {
      evento.preventDefault();

      const dados = {
        email: document.getElementById("login-email").value.trim(),
        senha: document.getElementById("login-senha").value
      };

      try {
        mostrarAviso(aviso, "Entrando...", "info");
        const resposta = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(dados)
        });
        salvarSessao(resposta.token, resposta.usuario);
        mostrarAviso(aviso, "Bem-vindo(a), " + resposta.usuario.nome + "!", "sucesso");
        setTimeout(function redirecionar() {
          const destino =
            resposta.usuario.perfil === "admin" || resposta.usuario.perfil === "vendedor"
              ? "dashboard.html"
              : "index.html";
          window.location.href = destino;
        }, 900);
      } catch (erro) {
        mostrarAviso(aviso, erro.message, "erro");
      }
    });
  }
});