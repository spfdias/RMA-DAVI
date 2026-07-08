import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, runQuery } from '../database';
import fs from 'fs';

const router = Router();

const DATA_DIR = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const relId = req.params.id || 'unknown';
    const cat = (req.body && req.body.categoria) || 'unknown';
    const safeCat = cat.replace(/[^a-z0-9_]/gi, '_');
    cb(null, `R${relId}_${safeCat}_${uuidv4()}${ext}`);
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
      cb(new Error('Formato de imagem não suportado. Use: jpg, jpeg, png, gif, webp, bmp'));
    }
  },
});

router.get('/', async (req: Request, res: Response) => {
  const { mes, ano } = req.query;

  if (mes && ano) {
    const row = await queryOne('SELECT * FROM relatorios WHERE mes = ? AND ano = ?', [Number(mes), Number(ano)]);
    if (!row) {
      res.json({ mes: Number(mes), ano: Number(ano), dados: {}, imagens: [] });
      return;
    }
    const allImagens = await queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ? ORDER BY categoria, created_at', [row.id]);
    res.json({ ...row, dados: JSON.parse(row.dados), imagens: allImagens });
    return;
  }

  const rows = await queryAll('SELECT id, mes, ano, created_at, updated_at FROM relatorios ORDER BY ano DESC, mes DESC');
  res.json(rows);
});

router.get('/:id', async (req: Request, res: Response) => {
  const row = await queryOne('SELECT * FROM relatorios WHERE id = ?', [req.params.id]);
  if (!row) {
    res.status(404).json({ error: 'Relatório não encontrado' });
    return;
  }
  const imagens = await queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ? ORDER BY categoria, created_at', [req.params.id]);
  res.json({ ...row, dados: JSON.parse(row.dados), imagens });
});

router.post('/', async (req: Request, res: Response) => {
  const { mes, ano, dados, changeSummary } = req.body;
  const user = req.user;

  if (!mes || !ano) {
    res.status(400).json({ error: 'Mês e ano são obrigatórios' });
    return;
  }

  const existing = await queryOne('SELECT id, dados FROM relatorios WHERE mes = ? AND ano = ?', [mes, ano]);

  if (existing) {
    if (user && user.role === 'user') {
      const oldDados = existing.dados;
      await runQuery(`
        INSERT INTO audit_log (relatorio_id, user_id, user_name, changes)
        VALUES (?, ?, ?, ?)
      `, [existing.id, user.userId, user.nome, JSON.stringify({
        previous: JSON.parse(oldDados),
        current: dados || {},
        summary: changeSummary || 'Alteração realizada',
        timestamp: new Date().toISOString(),
      })]);
    }

    await runQuery(`
      UPDATE relatorios SET dados = ?, updated_at = NOW()
      WHERE mes = ? AND ano = ?
    `, [JSON.stringify(dados || {}), mes, ano]);

    const row = await queryOne('SELECT * FROM relatorios WHERE id = ?', [existing.id]);
    const imagens = await queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ? ORDER BY categoria, created_at', [existing.id]);
    res.json({ ...row, dados: JSON.parse(row.dados), imagens });
    return;
  }

  const result = await runQuery(`
    INSERT INTO relatorios (mes, ano, dados)
    VALUES (?, ?, ?)
  `, [mes, ano, JSON.stringify(dados || {})]);

  const row = await queryOne('SELECT * FROM relatorios WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ ...row, dados: JSON.parse(row.dados), imagens: [] });
});

router.post('/:id/imagens', upload.array('imagens', 20), async (req: Request, res: Response) => {
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

  const existing = await queryOne('SELECT id FROM relatorios WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Relatório não encontrado' });
    return;
  }

  const categoriasValidas = (await queryAll('SELECT value FROM categorias')).map((c: any) => c.value);
  if (!categoriasValidas.includes(categoria)) {
    res.status(400).json({ error: 'Categoria inválida' });
    return;
  }

  const inserted = [];
  for (const file of files) {
    const fileBuffer = fs.readFileSync(file.path);
    const base64Data = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;

    const result = await runQuery(`
      INSERT INTO imagens_atividades (relatorio_id, categoria, filename, original_name, data)
      VALUES (?, ?, ?, ?, ?)
    `, [req.params.id, categoria, file.filename, file.originalname, base64Data]);
    const imgId = result.lastInsertRowid;
    // Rename file to include DB id for future recovery
    const oldPath = file.path;
    const ext = path.extname(file.filename);
    const base = path.basename(file.filename, ext);
    const newFilename = `${base}_ID${imgId}${ext}`;
    const newPath = path.join(UPLOADS_DIR, newFilename);
    try {
      fs.renameSync(oldPath, newPath);
      await runQuery('UPDATE imagens_atividades SET filename = ? WHERE id = ?', [newFilename, imgId]);
    } catch {}
    inserted.push(await queryOne('SELECT * FROM imagens_atividades WHERE id = ?', [imgId]));
  }

  res.status(201).json(inserted);
});

router.delete('/:id/imagens', async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem remover todas as imagens' });
    return;
  }
  const imagens = await queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ?', [req.params.id]);
  for (const img of imagens) {
    const filePath = path.join(UPLOADS_DIR, img.filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }
  await runQuery('DELETE FROM imagens_atividades WHERE relatorio_id = ?', [req.params.id]);
  res.json({ message: `${imagens.length} imagem(ns) removida(s)` });
});

router.delete('/:id', async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem excluir relatórios' });
    return;
  }
  const existing = await queryOne('SELECT * FROM relatorios WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Relatório não encontrado' });
    return;
  }

  const imagens = await queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ?', [req.params.id]);
  for (const img of imagens) {
    const filePath = path.join(UPLOADS_DIR, img.filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }

  await runQuery('DELETE FROM imagens_atividades WHERE relatorio_id = ?', [req.params.id]);
  await runQuery('DELETE FROM relatorios WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

router.delete('/imagens/:imagemId', async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem excluir imagens' });
    return;
  }
  const imagem = await queryOne('SELECT * FROM imagens_atividades WHERE id = ?', [req.params.imagemId]);
  if (!imagem) {
    res.status(404).json({ error: 'Imagem não encontrada' });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, imagem.filename);
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}

  await runQuery('DELETE FROM imagens_atividades WHERE id = ?', [req.params.imagemId]);
  res.status(204).send();
});

router.put('/imagens/:imagemId/rotate', async (req: Request, res: Response) => {
  const { rotation } = req.body;
  if (![0, 90, 180, 270].includes(rotation)) {
    res.status(400).json({ error: 'Rotação inválida. Use: 0, 90, 180, 270' });
    return;
  }
  const imagem = await queryOne('SELECT * FROM imagens_atividades WHERE id = ?', [req.params.imagemId]);
  if (!imagem) {
    res.status(404).json({ error: 'Imagem não encontrada' });
    return;
  }
  await runQuery('UPDATE imagens_atividades SET rotation = ? WHERE id = ?', [rotation, req.params.imagemId]);
  res.json({ ...imagem, rotation });
});

router.get('/audit', async (req: Request, res: Response) => {
  const logs = await queryAll('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200');
  res.json(logs);
});

router.get('/imagens/:filename', (req: Request, res: Response) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename as string);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Imagem não encontrada' });
    return;
  }
  res.sendFile(filePath);
});

// Recovery: scan uploads dir and reconstruct DB records from filenames
router.post('/recover', async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores' });
    return;
  }

  const recovered: any[] = [];
  const orphaned: string[] = [];

  if (!fs.existsSync(UPLOADS_DIR)) {
    res.json({ recovered: [], orphaned: [] });
    return;
  }

  const files = fs.readdirSync(UPLOADS_DIR);
  const filenamePattern = /^R(\d+)_([^_]+)_(.+)_ID(\d+)\.\w+$/;

  for (const f of files) {
    // Check if already in DB
    const existing = await queryOne('SELECT id FROM imagens_atividades WHERE filename = ?', [f]);
    if (existing) continue;

    const match = f.match(filenamePattern);
    if (!match) {
      orphaned.push(f);
      continue;
    }

    const relatorioId = parseInt(match[1]);
    const categoria = match[2];
    const originalName = f;

    // Verify relatorio exists
    const rel = await queryOne('SELECT id FROM relatorios WHERE id = ?', [relatorioId]);
    if (!rel) {
      orphaned.push(f);
      continue;
    }

    // Check if categoria is valid
    const cats = await queryAll('SELECT value FROM categorias');
    const validCats = cats.map((c: any) => c.value);
    const finalCat = validCats.includes(categoria) ? categoria : 'outros';

    await runQuery(`
      INSERT INTO imagens_atividades (relatorio_id, categoria, filename, original_name)
      VALUES (?, ?, ?, ?)
    `, [relatorioId, finalCat, f, originalName]);
    recovered.push({ filename: f, relatorio_id: relatorioId, categoria: finalCat });
  }

  res.json({ recovered, orphaned });
});

export default router;
