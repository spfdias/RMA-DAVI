# SESSÃO — Sistema RMA Lar Ebenezer

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco**: PostgreSQL (Render) | SQLite (sql.js, fallback local)
- **Auth**: JWT + bcryptjs
- **Upload**: Multer (local filesystem, disco persistente)
- **Deploy**: Docker + Render

## Deploy (Render)
- Repositório: `https://github.com/spfdias/RMA-DAVI`
- URL: `https://rma-davi.onrender.com`
- Tipo: Blueprint (render.yaml)
- Login: `admin@rmadavi.com` / `admin123`

## Estrutura
```
rma-davi/
├── client/          # Frontend React
│   └── src/pages/   # 11 páginas
├── server/          # Backend Express
│   └── src/
│       ├── routes/      # acolhidos, relatorios, auth, categorias
│       ├── middleware/  # JWT auth
│       ├── database.ts  # PostgreSQL (pg) + fallback SQLite (sql.js)
│       └── index.ts     # Servidor Express
├── functions/       # Backend Firebase (alternativo)
├── Dockerfile       # Build Docker
├── render.yaml      # Config Render (web + PostgreSQL)
└── SESSION.md       # Este arquivo
```

## Banco de Dados
- **Render**: PostgreSQL (serviço `rma-davi-db`, free tier)
- **Local**: SQLite (`server/data/rma-davi.db`)
- Alternância automática: se `DATABASE_URL` existir → PostgreSQL; senão → SQLite
- Tabelas: acolhidos, desligamentos, relatorios, imagens_atividades, users, audit_log, categorias
- Seed automático na primeira execução (admin + 26 acolhidos da planilha + 10 categorias)
- Disco persistente Render: 1 GB montado em `/app/server/data` (uploads)

## Variáveis de Ambiente
| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor | 3001 |
| `DATABASE_URL` | Connection string PostgreSQL | (auto no Render) |
| `DB_PATH` | Diretório do banco SQLite / uploads | /app/server/data |
| `JWT_SECRET` | Chave JWT | (auto-generate no Render) |
| `CORS_ORIGIN` | Origem CORS | https://rma-davi.onrender.com |
| `NODE_ENV` | Ambiente | production |

## Rotas da API
- `GET /api/health` — Health check + diagnóstico do banco
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Registro
- `GET/POST/PUT/DELETE /api/acolhidos` — CRUD acolhidos
- `PUT /api/acolhidos/:id/desligar` — Desligamento
- `GET/POST/PUT/DELETE /api/relatorios` — CRUD relatórios
- `POST /api/relatorios/:id/imagens` — Upload imagens
- `DELETE /api/relatorios/imagens/:id` — Remover imagem
- `PUT /api/relatorios/imagens/:id/rotate` — Rotacionar imagem
- `GET/POST/DELETE /api/categorias` — CRUD categorias (admin)
- `GET /api/relatorios/audit` — Log de auditoria

## Alterações Realizadas
1. Upload de imagens movido para `data/uploads/` (disco persistente)
2. Servidor Express agora serve o frontend React (SPA)
3. Auto-seed de admin, acolhidos e categorias na inicialização
4. Botões Desligar/Reativar/Excluir na lista de acolhidos
5. Relatório de Acolhidos com filtros e impressão
6. Formatação editorial do relatório mensal (config-visual-relatorio.md)
7. Diagnóstico do banco via health endpoint
8. Migração de SQLite para PostgreSQL (com fallback local)
9. CRUD dinâmico de categorias (criar/excluir pelo admin)
10. Relatórios Anuais (placeholder)
11. Menu reorganizado: "Relatórios Mensais", "Novo Relatório Mensal", "Relatórios Anuais"
12. Importação de 26 acolhidos da planilha "Acolhidos com tempo de acolhimento.xlsx"
13. Cálculo automático de tempo de acolhimento e idade

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
