# Domínio Store — API (Render)

Node.js + Express + MongoDB (Mongoose) + JWT + bcryptjs + Multer.

## Rodar localmente

```bash
cd backend
cp .env.example .env
npm install
npm start
```

## Deploy no Render

- Build Command: `npm install`
- Start Command: `npm start`
- Environment: `JWT_SECRET`, `MONGO_URI` (a porta vem de `process.env.PORT`)

## Endpoints

| Método | Rota | Acesso |
| --- | --- | --- |
| POST | `/api/auth/registrar` | público (cria sempre `cliente`) |
| POST | `/api/auth/login` | público |
| GET/PUT | `/api/auth/perfil` | autenticado |
| GET | `/api/celulares` | público |
| POST/PUT/PATCH/DELETE | `/api/celulares` | admin/vendedor |
| POST/GET | `/api/pedidos` | autenticado |
| PATCH | `/api/pedidos/:id/status` | admin/vendedor |
| PATCH | `/api/pedidos/:id/cancelar` | dono do pedido ou gestor |
| GET | `/api/estatisticas` | admin/vendedor |
| `/api/usuarios` | CRUD | somente admin |

## Criar o primeiro admin

Cadastre-se pela tela pública e altere o campo `perfil` para `admin` diretamente no MongoDB.