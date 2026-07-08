import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from 'cloudinary';
import { authMiddleware } from './middleware/auth';
import acolhidosRouter from './routes/acolhidos';
import relatoriosRouter from './routes/relatorios';
import authRouter from './routes/auth';

admin.initializeApp();

const cf = functions.config()?.cloudinary || {};
cloudinary.v2.config({
  cloud_name: cf.cloud_name || 'rxehahad',
  api_key: cf.api_key || '212477523725991',
  api_secret: cf.api_secret || 'Ru15U4YHRiDTvWX2ieoHUdPE_Ww',
});

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRouter);
app.use('/api/acolhidos', authMiddleware, acolhidosRouter);
app.use('/api/relatorios', authMiddleware, relatoriosRouter);

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'tmp', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagem não suportado'));
    }
  },
});

app.post('/api/relatorios/:id/imagens', authMiddleware, upload.array('imagens', 20), async (req: any, res: any) => {
  const { categoria } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({ error: 'Nenhuma imagem enviada' });
    return;
  }
  if (!categoria) {
    res.status(400).json({ error: 'Categoria é obrigatória' });
    return;
  }

  const relDoc = await db.collection('relatorios').doc(req.params.id as string).get();
  if (!relDoc.exists) {
    res.status(404).json({ error: 'Relatório não encontrado' });
    return;
  }

  const categoriasValidas = ['doacoes', 'contando_historias', 'passeios', 'oficinas', 'eventos', 'visitas', 'outros'];
  if (!categoriasValidas.includes(categoria)) {
    res.status(400).json({ error: 'Categoria inválida' });
    return;
  }

  const inserted: any[] = [];
  for (const file of files) {
    const publicId = `rma/${req.params.id}/${categoria}/${path.parse(file.filename).name}`;
    const result = await cloudinary.v2.uploader.upload(file.path, {
      public_id: publicId,
      resource_type: 'image',
    });
    // Clean up temp file
    try { fs.unlinkSync(file.path); } catch {}

    const docRef = await db.collection('imagens_atividades').add({
      relatorio_id: req.params.id as string,
      categoria,
      filename: result.public_id,
      url: result.secure_url,
      original_name: file.originalname,
      rotation: 0,
      created_at: FieldValue.serverTimestamp(),
    });
    const snap = await docRef.get();
    inserted.push({ id: docRef.id, ...snap.data() });
  }
  res.status(201).json(inserted);
});

app.put('/api/relatorios/imagens/:imagemId/rotate', authMiddleware, async (req: any, res: any) => {
  const { rotation } = req.body;
  if (![0, 90, 180, 270].includes(rotation)) {
    res.status(400).json({ error: 'Rotação inválida' });
    return;
  }
  await db.collection('imagens_atividades').doc(req.params.imagemId as string).update({ rotation });
  const snap = await db.collection('imagens_atividades').doc(req.params.imagemId as string).get();
  res.json({ id: snap.id, ...snap.data() });
});

app.delete('/api/relatorios/imagens/:imagemId', authMiddleware, async (req: any, res: any) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores' });
    return;
  }
  const snap = await db.collection('imagens_atividades').doc(req.params.imagemId as string).get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Imagem não encontrada' });
    return;
  }
  const data = snap.data()!;
  try {
    await cloudinary.v2.uploader.destroy(data.filename);
  } catch {}
  await snap.ref.delete();
  res.status(204).send();
});

app.get('/api/health', (_req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Erro:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Arquivo muito grande. Máximo: 10MB' });
    return;
  }
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Função de seed — pode ser chamada manualmente após o deploy
export const seed = functions.https.onRequest(async (_req: any, res: any) => {
  const { seed } = await import('./seed');
  try {
    await seed();
    res.json({ message: 'Seed concluído com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const api = functions.https.onRequest(app);
