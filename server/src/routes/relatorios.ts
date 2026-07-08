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
      cb(new Error('Formato de imagem não suportado. Use: jpg, jpeg, png, gif, webp, bmp'));
    }
  },
});

router.get('/', (req: Request, res: Response) => {
  const { mes, ano } = req.query;

  if (mes && ano) {
    const row = queryOne('SELECT * FROM relatorios WHERE mes = ? AND ano = ?', [Number(mes), Number(ano)]);
    if (!row) {
      const empty = {
        mes: Number(mes),
        ano: Number(ano),
        dados: {},
        imagens: [],
      };
      res.json(empty);
      return;
    }
    const allImagens = queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ? ORDER BY categoria, created_at', [row.id]);
    res.json({
      ...row,
      dados: JSON.parse(row.dados),
      imagens: allImagens,
    });
    return;
  }

  const rows = queryAll('SELECT id, mes, ano, created_at, updated_at FROM relatorios ORDER BY ano DESC, mes DESC');
  res.json(rows);
});

router.get('/:id', (req: Request, res: Response) => {
  const row = queryOne('SELECT * FROM relatorios WHERE id = ?', [req.params.id]);
  if (!row) {
    res.status(404).json({ error: 'Relatório não encontrado' });
    return;
  }
  const imagens = queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ? ORDER BY categoria, created_at', [req.params.id]);
  res.json({
    ...row,
    dados: JSON.parse(row.dados),
    imagens,
  });
});

router.post('/', (req: Request, res: Response) => {
  const { mes, ano, dados, changeSummary } = req.body;
  const user = req.user;

  if (!mes || !ano) {
    res.status(400).json({ error: 'Mês e ano são obrigatórios' });
    return;
  }

  const existing = queryOne('SELECT id, dados FROM relatorios WHERE mes = ? AND ano = ?', [mes, ano]);

  if (existing) {
    if (user && user.role === 'user') {
      const oldDados = existing.dados;
      runQuery(`
        INSERT INTO audit_log (relatorio_id, user_id, user_name, changes)
        VALUES (?, ?, ?, ?)
      `, [existing.id, user.userId, user.nome, JSON.stringify({
        previous: JSON.parse(oldDados),
        current: dados || {},
        summary: changeSummary || 'Alteração realizada',
        timestamp: new Date().toISOString(),
      })]);
    }

    runQuery(`
      UPDATE relatorios SET dados = ?, updated_at = datetime('now', 'localtime')
      WHERE mes = ? AND ano = ?
    `, [JSON.stringify(dados || {}), mes, ano]);

    const row = queryOne('SELECT * FROM relatorios WHERE id = ?', [existing.id]);
    const imagens = queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ? ORDER BY categoria, created_at', [existing.id]);
    res.json({ ...row, dados: JSON.parse(row.dados), imagens });
    return;
  }

  const result = runQuery(`
    INSERT INTO relatorios (mes, ano, dados)
    VALUES (?, ?, ?)
  `, [mes, ano, JSON.stringify(dados || {})]);

  const row = queryOne('SELECT * FROM relatorios WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ ...row, dados: JSON.parse(row.dados), imagens: [] });
});

router.post('/:id/imagens', upload.array('imagens', 20), (req: Request, res: Response) => {
  const { categoria } = req.body;
  const files = req.files as Express.Multer.File[];

  console.log('[Upload Debug] Content-Type:', req.headers['content-type']);
  console.log('[Upload Debug] files:', files?.length, 'categoria:', categoria);

  if (!files || files.length === 0) {
    res.status(400).json({ error: 'Nenhuma imagem enviada' });
    return;
  }

  if (!categoria) {
    res.status(400).json({ error: 'Categoria é obrigatória' });
    return;
  }

  const existing = queryOne('SELECT id FROM relatorios WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Relatório não encontrado' });
    return;
  }

  const categoriasValidas = ['doacoes', 'contando_historias', 'passeios', 'oficinas', 'eventos', 'visitas', 'outros'];
  if (!categoriasValidas.includes(categoria)) {
    res.status(400).json({ error: `Categoria inválida. Use: ${categoriasValidas.join(', ')}` });
    return;
  }

  const inserted = [];
  for (const file of files) {
    const result = runQuery(`
      INSERT INTO imagens_atividades (relatorio_id, categoria, filename, original_name)
      VALUES (?, ?, ?, ?)
    `, [req.params.id, categoria, file.filename, file.originalname]);
    inserted.push(queryOne('SELECT * FROM imagens_atividades WHERE id = ?', [result.lastInsertRowid]));
  }

  res.status(201).json(inserted);
});

router.delete('/:id/imagens', (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem remover todas as imagens' });
    return;
  }
  const imagens = queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ?', [req.params.id]);
  for (const img of imagens) {
    const filePath = path.join(UPLOADS_DIR, img.filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }
  runQuery('DELETE FROM imagens_atividades WHERE relatorio_id = ?', [req.params.id]);
  res.json({ message: `${imagens.length} imagem(ns) removida(s)` });
});

router.delete('/:id', (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem excluir relatórios' });
    return;
  }
  const existing = queryOne('SELECT * FROM relatorios WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Relatório não encontrado' });
    return;
  }

  const imagens = queryAll('SELECT * FROM imagens_atividades WHERE relatorio_id = ?', [req.params.id]);
  for (const img of imagens) {
    const filePath = path.join(UPLOADS_DIR, img.filename);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Erro ao deletar arquivo:', err);
    }
  }

  runQuery('DELETE FROM imagens_atividades WHERE relatorio_id = ?', [req.params.id]);
  runQuery('DELETE FROM relatorios WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

router.delete('/imagens/:imagemId', (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem excluir imagens' });
    return;
  }
  const imagem = queryOne('SELECT * FROM imagens_atividades WHERE id = ?', [req.params.imagemId]);

  if (!imagem) {
    res.status(404).json({ error: 'Imagem não encontrada' });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, imagem.filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Erro ao deletar arquivo:', err);
  }

  runQuery('DELETE FROM imagens_atividades WHERE id = ?', [req.params.imagemId]);
  res.status(204).send();
});

router.put('/imagens/:imagemId/rotate', (req: Request, res: Response) => {
  const { rotation } = req.body;
  if (![0, 90, 180, 270].includes(rotation)) {
    res.status(400).json({ error: 'Rotação inválida. Use: 0, 90, 180, 270' });
    return;
  }
  const imagem = queryOne('SELECT * FROM imagens_atividades WHERE id = ?', [req.params.imagemId]);
  if (!imagem) {
    res.status(404).json({ error: 'Imagem não encontrada' });
    return;
  }
  runQuery('UPDATE imagens_atividades SET rotation = ? WHERE id = ?', [rotation, req.params.imagemId]);
  res.json({ ...imagem, rotation });
});

router.get('/audit', (req: Request, res: Response) => {
  const logs = queryAll('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200');
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

export default router;
