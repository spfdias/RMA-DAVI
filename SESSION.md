# SESSÃO — Sistema RMA Lar Ebenezer

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco**: PostgreSQL (Render) | SQLite (sql.js, fallback local)
- **Auth**: JWT + bcryptjs
- **Upload**: Multer (local filesystem, disco persistente)
- **Deploy**: Docker + Render

## Repositório
- GitHub: `https://github.com/spfdias/RMA-DAVI`
- Branch principal: `main`
- Branch backup sql.js: `backup-sqljs` (código original antes da migração PG)
- Clonar: `git clone https://github.com/spfdias/RMA-DAVI.git`

## Render (Dashboard: https://dashboard.render.com)

### Web Service
- **Nome**: `rma-davi`
- **URL**: `https://rma-davi.onrender.com`
- **Tipo**: Blueprint (render.yaml) / Docker
- **Região**: Oregon (free tier)
- **Runtime**: Docker (Dockerfile na raiz)

### PostgreSQL
- **Nome**: `rma-davi-db`
- **Connection String**: Internal Database URL (em Connections no dashboard)
- **Região**: Oregon (free tier, 1GB)
- **DATABASE_URL**: setado automaticamente via blueprint ou manual em Environment

### Deploy
```bash
git add -A
git commit -m "mensagem"
git push
# Render auto-deploy (ou Manual Deploy no dashboard)
```

**Manual Deploy**: Dashboard > rma-davi > Manual Deploy > Deploy latest commit

### Variáveis de Ambiente (Web Service > Environment)
| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `PORT` | Porta do servidor (3001) | Não (default 3001) |
| `NODE_ENV` | production | Sim (para SSL no PG) |
| `JWT_SECRET` | Chave secreta JWT | Sim (gerar no Render) |
| `CORS_ORIGIN` | https://rma-davi.onrender.com | Sim |
| `DB_PATH` | /app/server/data (uploads + SQLite fallback) | Sim |
| `DATABASE_URL` | Internal Database URL do PostgreSQL | Sim (para usar PG) |

> Se `DATABASE_URL` existir → usa PostgreSQL. Senão → usa SQLite local.

### Discos Persistente
- **Nome**: `rma-davi-data`
- **Tamanho**: 1 GB
- **Mount**: `/app/server/data`
- **Conteúdo**: uploads de imagens
- **Monitoramento**: alerta no Dashboard quando atingir 90%

### Logs
Dashboard > rma-davi > Logs (úteis para debug de erros de inicialização)

---

## Acesso
- **Login**: `admin@rmadavi.com`
- **Senha**: `admin123`

---

## Estrutura do Projeto
```
rma-davi/
├── client/                    # Frontend React (Vite)
│   └── src/
│       ├── api/index.ts       # API client (axios)
│       ├── components/        # Sidebar, StorageAlert, ChangePassword
│       ├── contexts/          # AuthContext
│       └── pages/             # 12 páginas
│           ├── Dashboard.tsx
│           ├── Login.tsx
│           ├── AcolhidosLista.tsx
│           ├── AcolhidosCadastro.tsx
│           ├── RelatorioMensal.tsx
│           ├── RelatorioLista.tsx
│           ├── RelatorioVisualizar.tsx
│           ├── RelatorioAcolhidos.tsx
│           ├── RelatoriosAnuais.tsx      # Placeholder
│           ├── AdminCategorias.tsx       # CRUD categorias
│           ├── AdminUsers.tsx
│           └── AuditLog.tsx
├── server/                    # Backend Express
│   └── src/
│       ├── routes/
│       │   ├── acolhidos.ts       # CRUD acolhidos
│       │   ├── relatorios.ts      # CRUD relatorios + imagens + recover
│       │   ├── auth.ts            # Login, registro, admin users
│       │   ├── categorias.ts      # CRUD categorias
│       │   └── storage.ts         # Monitoramento de disco
│       ├── middleware/auth.ts     # JWT middleware
│       ├── database.ts            # PostgreSQL (pg) + fallback SQLite (sql.js)
│       ├── index.ts               # Servidor Express
│       ├── seed.ts                # Script de seed manual
│       ├── import-acolhidos.ts    # Import da planilha (one-time)
│       ├── reset-admin.ts         # Reset senha admin
│       ├── check-login.ts         # Debug login
│       └── check-images.ts        # Debug imagens
├── functions/                # Backend Firebase (alternativo, não usado)
├── Dockerfile                # Build Docker
├── render.yaml               # Config Render (blueprint)
└── SESSION.md                # Este arquivo
```

## Banco de Dados

### PostgreSQL (Render)
- Conexão automática via `DATABASE_URL`
- Schema criado automaticamente na inicialização
- Seed automático: admin + 26 acolhidos + 10 categorias

### SQLite (local, fallback)
- Arquivo: `server/data/rma-davi.db`
- Usado quando `DATABASE_URL` não está definida
- Alterna automaticamente

### Tabelas
| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema |
| `acolhidos` | Moradores da instituição |
| `desligamentos` | Registro de desligamentos |
| `relatorios` | Relatórios mensais (dados em JSON) |
| `imagens_atividades` | Metadados das imagens por categoria |
| `audit_log` | Log de alterações em relatórios |
| `categorias` | Categorias de imagens (dinâmicas) |

### Atenção: Imagens
- **Arquivos**: salvos em `/app/server/data/uploads/`
- **Metadados**: tabela `imagens_atividades`
- **Nome dos arquivos**: `R{relatorio}_{categoria}_{uuid}_ID{imagem}.{ext}`
  - Ex: `R5_eventos_26b1e711_ID3.jpg`
- **Recuperação**: `POST /api/relatorios/recover` (admin) escaneia uploads e reconstrói registros

> Se o banco for recriado, as imagens no disco podem ser recuperadas pelo nome do arquivo, que contém o ID do relatório e a categoria.

## Rotas da API

### Públicas
- `GET /api/health` — Health check + diagnóstico
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Registro

### Autenticadas (token JWT no header `Authorization: Bearer <token>`)
- `GET/POST/PUT/DELETE /api/acolhidos` — CRUD acolhidos
- `PUT /api/acolhidos/:id/desligar` — Desligamento
- `GET/POST/PUT/DELETE /api/relatorios` — CRUD relatórios
- `POST /api/relatorios/:id/imagens` — Upload imagens
- `DELETE /api/relatorios/:id/imagens` — Remover todas imagens
- `DELETE /api/relatorios/imagens/:imagemId` — Remover uma imagem
- `PUT /api/relatorios/imagens/:imagemId/rotate` — Rotacionar (0/90/180/270)
- `POST /api/relatorios/recover` — Recuperar imagens órfãs (admin)
- `GET /api/relatorios/audit` — Log de auditoria
- `GET /api/relatorios/imagens/:filename` — Servir arquivo de imagem
- `GET/POST/DELETE /api/categorias` — CRUD categorias (admin)
- `GET /api/storage` — Status de armazenamento
- `GET/PUT/DELETE /api/auth/users` — Gerenciamento de usuários (admin)
- `PUT /api/auth/change-password` — Alterar própria senha

## Funcionalidades Implementadas
1. Upload de imagens com disco persistente (Render)
2. Auto-seed de admin, 26 acolhidos e 10 categorias na inicialização
3. CRUD completo de acolhidos (cadastro, edição, desligamento, exclusão)
4. Relatórios Mensais com 9 blocos de dados (A a I)
5. Relatório de Acolhidos com filtros e impressão
6. Visualização de relatório com formatação editorial (Segoe UI)
7. Upload de imagens por categoria nos relatórios
8. Categorias dinâmicas (criar/excluir pelo admin)
9. Menu reorganizado: Relatórios Mensais, Novo Relatório Mensal, Relatórios Anuais
10. Monitoramento de armazenamento com alerta em 90%
11. Nomenclatura autodescritiva de imagens para recuperação após crash
12. Rota de recuperação de imagens órfãs (`POST /api/relatorios/recover`)
13. Suporte a PostgreSQL (Render) + SQLite (local) — alternância automática
14. Gerenciamento de usuários (aprovação, níveis, reset de senha)
15. Log de auditoria para alterações em relatórios

## Para Desenvolver Local
```bash
cd rma-davi

# Terminal 1 - Server
cd server && npm run dev
# http://localhost:3001

# Terminal 2 - Client
cd client && npm run dev
# http://localhost:5173 (com Vite proxy para API)

# Login: admin@rmadavi.com / admin123
```

## Para Buildar
```bash
cd rma-davi
npm run build
# Gera client/dist/ e server/dist/
```

## Comandos Úteis
```bash
# Resetar senha admin
cd server && npx tsx src/reset-admin.ts

# Seed manual
cd server && npx tsx src/seed.ts

# Importar planilha (one-time)
cd server && npx tsx src/import-acolhidos.ts

# Compilar TypeScript
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```

## Docker
```bash
# Build local
docker build -t rma-davi .
docker run -p 3001:3001 rma-davi
```

## Troubleshooting

### Login não funciona (401)
1. Verificar se `DATABASE_URL` está configurada no Render
2. Rodar `cd server && npx tsx src/reset-admin.ts` localmente (ou redeploy no Render)
3. Checar logs no Render Dashboard

### Imagens sumiram
1. Verificar se arquivos ainda existem em `/app/server/data/uploads/`
2. Rodar `POST /api/relatorios/recover` como admin
3. Se não recuperar, refazer upload

### Erro de sintaxe SQL
- O schema se adapta automaticamente: PostgreSQL usa `SERIAL PRIMARY KEY` e `NOW()`, SQLite usa `INTEGER PRIMARY KEY AUTOINCREMENT` e `datetime('now', 'localtime')`
- Se houver erro, verificar se a alternância (`IS_PG`) está funcionando corretamente

### Banco PostgreSQL não conecta
- Verificar `DATABASE_URL` nas variáveis de ambiente
- Verificar se o serviço PostgreSQL está ativo no Render
- Verificar logs do servidor

---

## Melhorias e Correções (Julho/2026)

### Profissionais e Capacitações Dinâmicos
- **Arquivo**: `client/src/pages/RelatorioMensal.tsx`
- Botão **×** por linha para remover profissionais/capacitações
- Botão **+ Adicionar** abaixo de cada tabela para inserir novas linhas
- Três grupos: Profissionais da Unidade, Vinculados no Mês, Desvinculados no Mês

### Visualização Fiel ao Modelo da Prefeitura
- **Arquivo**: `client/src/pages/RelatorioVisualizar.tsx`
- Reescrita completa para espelhar o documento Word oficial (`Modelo RMA Lar Ebenezer.docx`)
- Cabeçalho exato: "RELATÓRIO MENSAL DE ATENDIMENTO / PROTEÇÃO SOCIAL ESPECIAL – ALTA COMPLEXIDADE / SERVIÇO DE ACOLHIMENTO INSTITUCIONAL / LAR EBENEZER"
- Tabela de profissionais mesclada em seções (Profissional, Vinculado, Desvinculado) com OBS
- Bloco A.6 formatado com parênteses para múltipla escolha
- Bloco C com descrições dos Graus de Dependência (I, II, III)
- Bloco E em tabela horizontal com 7 colunas
- Notas F.4 e F.5 conforme modelo
- Assinaturas: Técnica responsável e Coordenadora com linhas centralizadas
- Rodapé com imagem `RodapeReport.jpg` fixa em todas as páginas (position: fixed)

### Imagens (CabecalhoReport.jpg e RodapeReport.jpg)
- `CabecalhoReport.jpg` — exibido no topo do relatório, antes do título
- `RodapeReport.jpg` — exibido no rodapé em todas as páginas na impressão
- Arquivos copiados para `client/public/` e referenciados como `/CabecalhoReport.jpg` e `/RodapeReport.jpg`

### Estilo Visual (Cores e Layout)
- **Cabeçalhos de tabela**: Fundo azul `#5B9BD5`, texto branco, caixa alta, negrito, centralizado
- **Título do relatório**: Mesmo fundo azul com texto branco
- **Identificação**: Fundo branco com bordas pretas (estilo formulário)
- **Bordas**: Todas `1px solid #000` (grade preta)
- **Fonte**: Arial / Times New Roman (padrão órgãos públicos)

### Correção de Impressão (PDF)
- Adicionado `-webkit-print-color-adjust: exact` e `print-color-adjust: exact` para manter cores azuis no PDF
- Sidebar (`<aside>`) oculta na impressão
- `main` com fundo branco no print
- Rodapé e assinaturas centralizados

### Imagens no Banco de Dados (Base64)
- **Problema**: Imagens perdidas após deploy no Render (disco efêmero)
- **Solução**: Imagens convertidas para base64 e armazenadas na coluna `data` da tabela `imagens_atividades` no PostgreSQL
- **Arquivo**: `server/src/routes/relatorios.ts` — upload salva base64 no banco
- **Arquivo**: `server/src/database.ts` — migration adiciona coluna `data TEXT`
- **Frontend**: `img.data` como fonte primária, fallback para URL do arquivo
- Imagens novas daqui em diante persistem no PostgreSQL independentemente de deploy

---

## Sessão 08/07/2026 — Correções de Impressão PDF

### Arquivo Principal
`client/src/pages/RelatorioVisualizar.tsx` (674 linhas)

### O que foi feito

#### 1. Quebra de Página Confiável ( @page margin )
- **Problema**: Conteúdo em novas páginas (após page-break) ficava atrás do cabeçalho fixo (`CabecalhoReport.jpg` ~20.5mm)
- **Solução**: `@page { margin: 24mm 15mm 20mm }` — margem superior maior que o cabeçalho. Em **todas as páginas**, o conteúdo começa sempre abaixo do cabeçalho
- `padding-top: 80px` no `#relatorio-print` mantém a primeira página com espaçamento original

#### 2. Bloco A.6 (Total de usuários desligados)
- Separado em tabela própria com `pageBreakBefore: 'always'` — vai para a próxima página na impressão
- Margem 100px no print (`.tb-a6p`) para limpar o cabeçalho
- Na tela: aparece logo abaixo do A.5 (marginTop: 0)

#### 3. Bloco D.1-D.6 (Cor/Raça)
- **D.1-D.2**: Branco, Pardo — ficam na tabela principal
- **D.3-D.6**: Preto, Amarelo, Indígena, Imigrantes — tabela separada com `pageBreakBefore: 'always'` (`.tb-d4p`)
- Margem 100px no print

#### 4. Bloco G.1-G.6 (Encaminhamentos)
- **G.1-G.2**: Mercado de trabalho, Cursos — tabela principal com `pageBreakBefore: 'always'`
- **G.3-G.6**: Políticas públicas, Rede socioassistencial, Documentos, Outros — tabela separada sem page-break extra (`.tb-g3p`)
- Todo o Bloco II Encaminhamentos vai para a próxima página

#### 5. Bloco IV (Informações Complementares)
- `keep-together` + `pageBreakBefore: 'always'` — vai inteiro para a próxima página

#### 6. Registro Fotográfico (Imagens por Categoria)
- **Problema anterior**: Flexbox (`display:flex; flex-wrap:wrap`) causava duplicação de fotos entre páginas no Chrome print
- **Solução atual**: Cada linha de 4 imagens é uma `<table>` independente com `<tr>` e 4 `<td>`
- **`<table className="img-tbl">`**: `table-layout: fixed`, `width: 100%`
- **`<tr style={{ pageBreakInside: 'avoid' }}>`**: linha inteira não corta entre páginas
- **`<td>`**: 25% largura, 160×160 (170×170 no print), imagem com `object-fit: contain`
- **`keep-together`** nas categorias (título + fotos) — bloco intacto se couber na página
- **`.img-print-page`**: `page-break-before: always; margin-top: 100px`
- **`.categoria-titulo`**: `break-after: avoid` — título não fica órfão
- **Observação**: Ainda há problemas com imagens grandes (>4 por categoria) ou muitas categorias — pode haver sobreposição ou corte no topo de páginas seguintes

#### 7. Espaçamentos Ajustados
- **Bloco I → Bloco II**: redução de `marginBottom: 50, paddingBottom: 20` para `marginBottom: 4`
- **Bloco E → Bloco II**: espaçamento mínimo
- **Bloco III (H)**: `keep-together` apenas na tabela H, imagens fora (podem quebrar)

### Pendências para 09/07/2026
- **Anexar Imagens por Categoria**: Imagens ainda estão se perdendo ou não mostrando por completo na impressão quando há muitas imagens em uma categoria
- Revisar a fragmentação de `<table>` nas linhas de imagem — pode ser necessário um container único com múltiplas `<tr>` em vez de uma tabela por linha
- Verificar se o `padding-top: 80px` + `@page margin 24mm` não criou espaçamento excessivo na primeira página
- Testar com diferentes quantidades de imagens (2, 6, 10+) para garantir que todas aparecem sem corte
