/* Página "Minha conta": edita dados pessoais, foto e senha. */

let fotoSelecionada = "";

function preencherFormularioPerfil(usuario) {
  document.getElementById("perfil-nome").value = usuario.nome || "";
  document.getElementById("perfil-sobrenome").value = usuario.sobrenome || "";
  document.getElementById("perfil-email").value = usuario.email || "";
  document.getElementById("perfil-nascimento").value = usuario.dataNascimento || "";
  document.getElementById("perfil-telefone").value = usuario.telefone || "";
  document.getElementById("perfil-endereco").value = usuario.endereco || "";

  const previa = document.getElementById("perfil-foto-previa");
  previa.src = usuario.foto || "";
  previa.style.display = usuario.foto ? "block" : "none";

  const resumo = document.getElementById("perfil-resumo");
  resumo.textContent = usuario.email + " — perfil: " + usuario.perfil;

  const linkPainel = document.getElementById("link-painel");
  if (linkPainel) {
    linkPainel.style.display =
      usuario.perfil === "admin" || usuario.perfil === "vendedor" ? "inline-flex" : "none";
  }
}

document.addEventListener("DOMContentLoaded", async function iniciarPerfil() {
  const form = document.getElementById("form-perfil");
  if (!form) return;

  const aviso = document.getElementById("perfil-aviso");
  const sair = document.getElementById("btn-sair-perfil");
  if (sair) sair.addEventListener("click", encerrarSessao);

  if (!obterToken()) {
    window.location.href = "login.html";
    return;
  }

  try {
    const usuario = await api("/api/auth/perfil");
    preencherFormularioPerfil(usuario);
  } catch (erro) {
    mostrarAviso(aviso, erro.message, "erro");
    return;
  }

  document.getElementById("perfil-foto").addEventListener("change", function trocar(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function pronto() {
      fotoSelecionada = String(leitor.result);
      const previa = document.getElementById("perfil-foto-previa");
      previa.src = fotoSelecionada;
      previa.style.display = "block";
    };
    leitor.readAsDataURL(arquivo);
  });

  form.addEventListener("submit", async function enviar(evento) {
    evento.preventDefault();

    const dados = {
      nome: document.getElementById("perfil-nome").value.trim(),
      sobrenome: document.getElementById("perfil-sobrenome").value.trim(),
      dataNascimento: document.getElementById("perfil-nascimento").value.trim(),
      telefone: document.getElementById("perfil-telefone").value.trim(),
      endereco: document.getElementById("perfil-endereco").value.trim()
    };

    const senha = document.getElementById("perfil-senha").value;
    if (senha) {
      if (senha.length < 6) {
        mostrarAviso(aviso, "A nova senha deve ter ao menos 6 caracteres.", "erro");
        return;
      }
      dados.senha = senha;
    }
    if (fotoSelecionada) dados.foto = fotoSelecionada;

    try {
      mostrarAviso(aviso, "Salvando...", "info");
      const resposta = await api("/api/auth/perfil", {
        method: "PUT",
        body: JSON.stringify(dados)
      });
      salvarSessao(obterToken(), resposta.usuario);
      preencherFormularioPerfil(resposta.usuario);
      document.getElementById("perfil-senha").value = "";
      mostrarAviso(aviso, "Dados atualizados com sucesso!", "sucesso");
    } catch (erro) {
      mostrarAviso(aviso, erro.message, "erro");
    }
  });
});
