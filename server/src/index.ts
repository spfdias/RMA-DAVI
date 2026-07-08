import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import acolhidosRouter from './routes/acolhidos';
import relatoriosRouter from './routes/relatorios';
import authRouter from './routes/auth';
import categoriasRouter from './routes/categorias';
import storageRouter from './routes/storage';
import { authMiddleware } from './middleware/auth';
import { initDatabase, getDbInfo } from './database';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DATA_DIR = process.env.DB_PATH || path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// API routes
app.use('/api/auth', authRouter);
app.use('/api/acolhidos', authMiddleware, acolhidosRouter);
app.use('/api/relatorios', authMiddleware, relatoriosRouter);
app.use('/api/categorias', authMiddleware, categoriasRouter);
app.use('/api/storage', authMiddleware, storageRouter);
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_req, res) => {
  const info = getDbInfo();
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: info });
});

// Serve client static files
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro detalhado:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Arquivo muito grande. Máximo: 10MB' });
    return;
  }
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: `Erro no upload: ${err.message}` });
    return;
  }
  if (err.message?.includes('Formato de imagem')) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Erro interno do servidor' });
});

initDatabase().then(() => {
  const info = getDbInfo();
  console.log(`=== Diagnóstico do Banco ===`);
  console.log(`DB_PATH:  ${info.path}`);
  console.log(`DATA_DIR: ${info.dir}`);
  console.log(`Existe:   ${info.exists}`);
  console.log(`Tamanho:  ${info.size} bytes`);
  console.log(`ENV DB_PATH: ${info.env_db_path}`);
  console.log(`============================`);
  app.listen(PORT, () => {
    console.log(`Servidor Lar Ebenezer rodando em http://localhost:${PORT}`);
    console.log(`API disponível em http://localhost:${PORT}/api`);
  });
}).catch((err) => {
  console.error('Erro ao inicializar banco de dados:', err);
  process.exit(1);
});
