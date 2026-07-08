# SESSÃO — Sistema RMA Lar Ebenezer

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript + SQLite (sql.js)
- **Auth**: JWT + bcryptjs
- **Upload**: Multer (local filesystem)
- **Deploy**: Docker + Render

## Deploy (Render)
- Repositório: `https://github.com/spfdias/RMA-DAVI`
- URL: `https://rma-davi.onrender.com`
- Tipo: Blueprint (render.yaml)
- Login: `admin@rmadavi.com`

## Estrutura
```
rma-davi/
├── client/          # Frontend React
│   └── src/pages/   # 11 páginas
├── server/          # Backend Express + SQLite
│   └── src/
│       ├── routes/      # acolhidos, relatorios, auth
│       ├── middleware/  # JWT auth
│       ├── database.ts  # SQLite com sql.js
│       └── index.ts     # Servidor Express
├── functions/       # Backend Firebase (alternativo)
├── Dockerfile       # Build Docker
├── render.yaml      # Config Render
└── SESSION.md       # Este arquivo
```

## Banco de Dados
- SQLite (arquivo único): `server/data/rma-davi.db`
- Tabelas: acolhidos, desligamentos, relatorios, imagens_atividades, users, audit_log
- Seed automático na primeira execução (admin + 13 acolhidos exemplo)
- Disco persistente Render: 1 GB montado em `/app/server/data`

## Variáveis de Ambiente
| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor | 3001 |
| `DB_PATH` | Diretório do banco | /app/server/data |
| `JWT_SECRET` | Chave JWT | (auto-generate no Render) |
| `CORS_ORIGIN` | Origem CORS | https://rma-davi.onrender.com |

## Rotas da API
- `GET /api/health` — Health check + diagnóstico do banco
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Registro
- `GET/POST/PUT/DELETE /api/acolhidos` — CRUD acolhidos
- `POST /api/acolhidos/:id/desligar` — Desligamento
- `GET/POST/PUT/DELETE /api/relatorios` — CRUD relatórios
- `POST /api/relatorios/:id/imagens` — Upload imagens
- `DELETE /api/relatorios/imagens/:id` — Remover imagem
- `PUT /api/relatorios/imagens/:id/rotate` — Rotacionar imagem

## Alterações Realizadas
1. Upload de imagens movido para `data/uploads/` (disco persistente)
2. Servidor Express agora serve o frontend React (SPA)
3. Auto-seed de admin e acolhidos na inicialização
4. Botões Desligar/Reativar/Excluir na lista de acolhidos
5. Relatório de Acolhidos com filtros e impressão
6. Formatação editorial do relatório mensal (config-visual-relatorio.md)
7. Diagnóstico do banco via health endpoint

## Para Desenvolver Local
```bash
cd rma-davi
npm run dev
# Server: http://localhost:3001
# Client: http://localhost:5173
```

## Para Buildar
```bash
cd rma-davi
npm run build
```

## Para Deploy no Render
```bash
git add -A
git commit -m "mensagem"
git push
# Render auto-deploy (ou Manual Deploy no dashboard)
```
