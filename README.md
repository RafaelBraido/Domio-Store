# Domínio Store: Your Mobile Hub

Atue como um Engenheiro de Software Full Stack Sênior. Sua tarefa é CRIAR E GERAR O CÓDIGO FONTE COMPLETO, 100% funcional, sem resumos, sem comentários de atalho e sem omitir nenhuma linha de código para um sistema de venda de celulares chamado "Domínio Store". Entregue todo o código-fonte de cada arquivo sem ocultar linhas.

O desenvolvimento da aplicação da loja de celulares Domínio Store deve utilizar estritamente JavaScript no Back-end (Node.js/Express) hospedado no Render e HTML5, CSS3 e JavaScript Vanilla no Front-end hospedado na Vercel.

Após tudo, me dê os arquivos e me dê uma pré-visualização do site.

A aplicação deve atender rigorosamente a todas as especificações visuais, regras de negócio, autenticação e requisitos de segurança descritos a seguir:

---

### 🚀 1. ARQUITETURA E HOSPEDAGEM

O sistema de venda de celulares Domínio Store deve ser dividido em dois repositórios/pastas independentes para hospedagem em plataformas separadas:

1. BACK-END (Hospedado no Render):

   - Tecnologias: Desenvolvido inteiramente em JavaScript utilizando Node.js com Express, MongoDB, Mongoose, JWT, bcryptjs e Multer.

   - Configurado para ambiente cloud no Render (portas dinâmicas via process.env.PORT e middleware cors habilitado).

   - Gerencia catálogo de celulares, upload/URL de imagens, controle de estoque, usuários, pedidos e cálculo de estatísticas gerenciais para o Dashboard.

2. FRONT-END (Hospedado na Vercel):

   - Tecnologias: Desenvolvido puramente com arquivos estáticos em HTML5, CSS3 e JavaScript Vanilla.

   - Configurado e pronto para deploy contínuo na Vercel.

   - Todo o consumo HTTP DEVE utilizar a constante global API_URL apontando para a URL da API do sistema Domínio Store no Render (https://dominio-store-api.onrender.com).

---

### 🔐 2. AUTENTICAÇÃO, SEGURANÇA E PERFIS DE ACESSO

- Perfis de Acesso:

  * Administrador / Vendedor: EXCLUSIVIDADE total para adicionar novos celulares ao catálogo, cadastrar quantidades/estoque, alterar preços, atualizar nomes/especificações e inserir/upload de foto/imagem do produto. Possui acesso ao Dashboard gerencial com indicadores e gestão do status de todos os pedidos.

  * Usuário Comum / Cliente: Pode criar conta, realizar login, navegar pela vitrine de celulares, adicionar produtos ao carrinho, realizar compras/pedidos, visualizar somente seu próprio histórico de pedidos, cancelar seus próprios pedidos (quando permitido) e editar dados do seu perfil.

- Regras Obrigatórias de Segurança:

  * O cadastro público cria EXCLUSIVAMENTE usuários com perfil de cliente comum (bloqueado cadastro direto como admin/vendedor).

  * A permissão para cadastrar celulares, alterar preços e atualizar estoque DEVE ser validada obrigatoriamente no BACK-END via middleware de autenticação JWT, garantindo que usuários comuns não consigam realizar edições via API.

  * Senhas salvas com hash seguro via bcryptjs. Criptografar novamente em caso de alteração no perfil.

  * NUNCA retornar a senha nas requisições da API.

  * Impedir e-mails duplicados na base de dados.

  * Somente administradores podem excluir ou desativar usuários.

---

### 📦 3. REGRAS DE NEGÓCIO: PRODUTOS E ESTOQUE

- Atributos do Produto: Nome, Descrição, Preço, Estoque (Quantidade disponível), Categoria, Status (Ativo/Inativo), Data de Criação e Imagem (File Upload via Multer ou URL externa).

- Regras de Gerenciamento (Admins/Vendedores):

  * Apenas Admins e Vendedores podem criar celulares, alterar quantidades em estoque, atualizar preços e vincular imagens aos aparelhos.

  * O preço deve ser obrigatoriamente maior que zero (> 0).

  * O estoque deve ser um número inteiro maior ou igual a zero (>= 0).

  * Celulares inativos NÃO podem ser adicionados a pedidos nem comprados por clientes.

  * Celulares sem estoque aparecem automaticamente na vitrine como "Indisponíveis".

  * BLOQUEAR a exclusão de celulares que possuam histórico de vendas/pedidos vinculados.

---

### 🛒 4. REGRAS DE NEGÓCIO: PEDIDOS E TRANSAÇÕES

- Atributos do Pedido: Usuário responsável, Lista de produtos (celulares), Quantidade, Preço unitário, Valor total, Status (PENDENTE, PAGO, CANCELADO, FINALIZADO) e Data de criação.

- Regras de Processamento no Back-end:

  * O valor total e os preços unitários são calculados estritamente NO SERVIDOR em JavaScript (buscando do banco). O front-end não define preços.

  * O preço gravado no pedido permanece congelado na data da compra, mesmo se o Admin/Vendedor alterar o preço do celular futuramente no painel.

  * A dedução no estoque ocorre automaticamente na criação do pedido.

  * Ao CANCELAR um pedido, os celulares voltam automaticamente para o estoque.

  * Impedir que um pedido seja cancelado mais de uma vez.

  * Pedidos cancelados ou finalizados não podem retornar a status anteriores.

---

### 🎨 5. ESTRUTURA VISUAL E CSS OBRIGATÓRIOS

#### A) Tela de Cadastro (cadastro.html):

<!DOCTYPE html>

<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Criar Conta - Domínio Store</title>

    <link rel="stylesheet" href="estilo-visual/vitrine.css">

</head>

<body>

    <div class="signup-container">

        <div class="logo">

            <svg height="24" width="60" viewBox="0 0 24 24" fill="#111"><path d="M21 6.5c-2.3 0-6.1 1.7-8.1 3.5L8 14.2c-1 .9-1.5 2-1.2 3.1.4 1.4 2 2 3.7 1.4 1.7-.6 4-3.1 7.2-7.4 2.1-2.9 3.2-4.8 3.3-4.8z"/></svg>

        </div>

        

        <h2>SUA CONTA PARA TUDO DA DOMÍNIO STORE</h2>

        

        <form id="signup-form">

            <div class="input-group">

                <input type="email" id="email" placeholder="Endereço de e-mail" required>

            </div>

            

            <div class="input-group">

                <input type="password" id="senha" placeholder="Senha" required>

            </div>

            <div class="input-group">

                <input type="text" id="nome" placeholder="Nome" required>

            </div>

            <div class="input-group">

                <input type="text" id="sobrenome" placeholder="Sobrenome" required>

            </div>

            <div class="input-group">

                <input type="text" id="dataNascimento" placeholder="Data de nascimento (DD/MM/AAAA)" required>

            </div>

            <p class="terms">

                Ao criar uma conta, você concorda com a <a href="#">Política de Privacidade</a> e com os <a href="#">Termos de Uso</a> da Domínio Store.

            </p>

            <button type="submit" class="btn-submit">CRIAR CONTA</button>

        </form>

    </div>

</body>

</html>

#### B) Tela de Login (login.html):

<!DOCTYPE html>

<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Entrar - Domínio Store</title>

    <link rel="stylesheet" href="estilo-visual/vitrine.css">

</head>

<body>

    <div class="login-container">

        <div class="logo">

            <svg height="24" width="60" viewBox="0 0 24 24" fill="#111"><path d="M21 6.5c-2.3 0-6.1 1.7-8.1 3.5L8 14.2c-1 .9-1.5 2-1.2 3.1.4 1.4 2 2 3.7 1.4 1.7-.6 4-3.1 7.2-7.4 2.1-2.9 3.2-4.8 3.3-4.8z"/></svg>

        </div>

        

        <h2>ENTRAR EM SUA CONTA DA DOMÍNIO STORE</h2>

        

        <form id="login-form">

            <div class="input-group">

                <input type="email" id="login-email" placeholder="Endereço de e-mail" required>

            </div>

            

            <div class="input-group">

                <input type="password" id="login-senha" placeholder="Sua senha" required>

            </div>

            <button type="submit" class="btn-login">ENTRAR EM SUA CONTA</button>

            <p class="signup-link">

                Não tem uma conta? <a href="cadastro.html">Criar conta</a>

            </p>

        </form>

    </div>

</body>

</html>

#### C) Estilo Visual Obrigatório (estilo-visual/vitrine.css):

No arquivo CSS principal (estilo-visual/vitrine.css), você DEVE incluir integralmente o seguinte bloco de variáveis e regras CSS:

:root {

  --made-with-panda: "🐼"; 

  --animations-spin: spin 1s linear infinite; 

  --animations-ping: ping 1s cubic-bezier(0,0,0.2,1) infinite; 

  --aspect-ratios-square: 1/1; 

  --aspect-ratios-landscape: 16/9; 

  --aspect-ratios-landscape-portrait: 9/16; 

  --aspect-ratios-golden: 1.618/1; 

  --aspect-ratios-custom-4-3: 4/3; 

  --aspect-ratios-custom-3-4: 3/4; 

  --aspect-ratios-ultrawide: 21/9; 

  --aspect-ratios-ultrawide-portrait: 9/21; 

  --assets-logo: url(/static/logo.png); 

  --assets-checkmark: url("data:image/svg+xml,%3csvg%3e%3c/svg%3e"); 

  --durations-xsmall: 150ms; 

  --durations-small: 300ms; 

  --durations-medium: 500ms; 

  --durations-large: 1s; 

  --easings-ease-in-out: cubic-bezier(0.4,0,0.2,1); 

  --easings-ease-in: cubic-bezier(0.4,0,1,1); 

  --easings-ease-out: cubic-bezier(0,0,0.2,1); 

  --easings-ease-sharp: cubic-bezier(0.4,0,0.6,1); 

  --font-sizes-xsmall: 12px; 

  --font-sizes-small: 14px; 

  --font-sizes-base: 16px;

}

.btn-submit {

    width: 100%;

    background-color: #111111;

    color: #ffffff;

    border: none;

    padding: 16px;

    font-size: 15px;

    font-weight: 700;

    border-radius: 30px;

    cursor: pointer;

    letter-spacing: 0.5px;

    transition: background-color 0.2s ease;

}

.btn-submit:hover {

    background-color: #707070;

}

.btn-login {

    width: 100%;

    background-color: #111111;

    color: #ffffff;

    border: none;

    padding: 16px;

    font-size: 15px;

    font-weight: 700;

    border-radius: 30px;

    cursor: pointer;

    letter-spacing: 0.5px;

    transition: background-color 0.2s ease;

}

.btn-login:hover {

    background-color: #707070;

}

---

### 📂 6. ARQUIVOS OBRIGATÓRIOS A SEREM ENTREGUES

#### Back-end (JavaScript / Node.js para Render):

1. package.json (com scripts "start": "node server.js" e dependências express, cors, dotenv, jsonwebtoken, bcryptjs, multer, mongoose).

2. .env.example (PORT=3000, JWT_SECRET, MONGO_URI).

3. server.js (Ponto de entrada da API em JS, middlewares de CORS, rotas estáticas para uploads de imagens de celulares e conexão com o banco).

4. Rotas/Controllers em JavaScript:

   - Auth (/api/auth): Registro e login.

   - Celulares (/api/celulares): Cadastro, adição de fotos, edição de preços/quantidades e controle de estoque (protegido para Admin/Vendedor).

   - Pedidos (/api/pedidos): Criação, alteração de status e cancelamento com estorno.

   - Estatísticas (/api/estatisticas): Cálculo de KPIs para o Dashboard gerencial.

   - Usuários (/api/usuarios): Gestão de usuários para administradores.

#### Front-end (HTML5, CSS3 e JS Vanilla para Vercel):

1. index.html: Vitrine da Domínio Store em HTML listando os celulares, busca, filtros e carrinho de compras.

2. login.html: Tela "Entrar em sua conta" em HTML com a estrutura definida e o botão estilizado .btn-login.

3. cadastro.html: Estrutura de cadastro em HTML exatamente idêntica à especificada acima.

4. dashboard.html: Painel exclusivo do Admin/Vendedor em HTML com formulário de inserção de novos celulares (com envio de imagem, quantidade em estoque e preço), cards de KPIs (Total de Usuários, Vendas, Faturamento R$, Estoque), Gráfico Circular (pizza/donut) de estatísticas e planilha/tabela interativa de alteração rápida de preços e estoque.

5. estilo-visual/vitrine.css: Folha de estilo em CSS completa contendo o bloco de variáveis obrigatórias e as estilizações de .btn-login e .btn-submit.

6. estilo-visual/painel.css: Estilização em CSS para o Dashboard, formulários de upload/cadastro, gráficos e tabelas.

7. scripts-js/config.js: Arquivo JS contendo a constante API_URL apontando para o Render.

8. scripts-js/vitrine.js: Lógica JS para exibição dinâmica da vitrine de celulares e carrinho.

9. scripts-js/auth.js: Lógica JS para integração com os formulários de autenticação e login.

10. scripts-js/painel.js: Lógica JS exclusiva para Admins/Vendedores (cadastro de celulares com foto, alteração de preços/estoque em tempo real, renderização do gráfico circular e carregamento dos KPIs).

---

### ⚠️ REQUISITOS FINAIS DE ENTREGA:

1. Entregue todo o código-fonte de cada arquivo sem ocultar linhas.

2. Após tudo, me dê os arquivos e me dê uma pré-visualização do site.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/394b6c82-0923-4778-9bdc-705a8a19959e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
