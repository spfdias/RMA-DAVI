import { Router, Request, Response } from 'express';
import { queryAll, queryOne, runQuery } from '../database';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const categorias = queryAll('SELECT * FROM categorias ORDER BY label ASC');
  res.json(categorias);
});

router.post('/', (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem criar categorias' });
    return;
  }
  const { value, label, icon } = req.body;
  if (!value || !label) {
    res.status(400).json({ error: 'Value e label são obrigatórios' });
    return;
  }
  const slug = value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const existing = queryOne('SELECT id FROM categorias WHERE value = ?', [slug]);
  if (existing) {
    res.status(400).json({ error: 'Categoria já existe' });
    return;
  }
  const result = runQuery(
    'INSERT INTO categorias (value, label, icon) VALUES (?, ?, ?)',
    [slug, label, icon || '📎']
  );
  res.status(201).json(queryOne('SELECT * FROM categorias WHERE id = ?', [result.lastInsertRowid]));
});

router.delete('/:id', (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem excluir categorias' });
    return;
  }
  const existing = queryOne('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Categoria não encontrada' });
    return;
  }
  const inUse = queryOne('SELECT COUNT(*) as total FROM imagens_atividades WHERE categoria = ?', [existing.value]);
  if (inUse && inUse.total > 0) {
    res.status(400).json({ error: `Categoria em uso por ${inUse.total} imagem(ns). Remova as imagens primeiro.` });
    return;
  }
  runQuery('DELETE FROM categorias WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

export default router;
