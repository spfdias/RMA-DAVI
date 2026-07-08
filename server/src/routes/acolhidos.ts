import { Router, Request, Response } from 'express';
import { getDatabase, queryAll, queryOne, runQuery } from '../database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { status, busca } = req.query;
  let sql = `SELECT * FROM acolhidos WHERE 1=1`;
  const params: any[] = [];

  if (status === 'ativos') {
    sql += ` AND ativo = 1`;
  } else if (status === 'inativos') {
    sql += ` AND ativo = 0`;
  }

  if (busca) {
    sql += ` AND nome LIKE ?`;
    params.push(`%${busca}%`);
  }

  sql += ` ORDER BY nome ASC`;
  res.json(queryAll(sql, params));
});

router.get('/:id', (req: Request, res: Response) => {
  const row = queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]);
  if (!row) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const { nome, data_nascimento, data_acolhimento, sexo, cor_raca, deficiencia, grau_dependencia, observacoes } = req.body;

  if (!nome || !data_nascimento || !data_acolhimento) {
    res.status(400).json({ error: 'Nome, data de nascimento e data de acolhimento são obrigatórios' });
    return;
  }

  const result = runQuery(`
    INSERT INTO acolhidos (nome, data_nascimento, data_acolhimento, sexo, cor_raca, deficiencia, grau_dependencia, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [nome, data_nascimento, data_acolhimento, sexo || 'Masculino', cor_raca || '', deficiencia || '', grau_dependencia || '', observacoes || '']);

  res.status(201).json(queryOne('SELECT * FROM acolhidos WHERE id = ?', [result.lastInsertRowid]));
});

router.put('/:id', (req: Request, res: Response) => {
  const { nome, data_nascimento, data_acolhimento, sexo, cor_raca, deficiencia, grau_dependencia, observacoes, ativo } = req.body;

  const existing = queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }

  runQuery(`
    UPDATE acolhidos SET
      nome = ?, data_nascimento = ?, data_acolhimento = ?,
      sexo = ?, cor_raca = ?, deficiencia = ?,
      grau_dependencia = ?, observacoes = ?, ativo = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `, [
    nome ?? existing.nome,
    data_nascimento ?? existing.data_nascimento,
    data_acolhimento ?? existing.data_acolhimento,
    sexo ?? existing.sexo,
    cor_raca ?? existing.cor_raca,
    deficiencia ?? existing.deficiencia,
    grau_dependencia ?? existing.grau_dependencia,
    observacoes ?? existing.observacoes,
    ativo !== undefined ? (ativo ? 1 : 0) : existing.ativo,
    req.params.id,
  ]);

  res.json(queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]));
});

router.delete('/:id', (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem excluir acolhidos' });
    return;
  }
  const existing = queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  runQuery('DELETE FROM acolhidos WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

router.post('/:id/desligar', (req: Request, res: Response) => {
  const { data_desligamento, motivo, observacoes } = req.body;

  if (!data_desligamento || !motivo) {
    res.status(400).json({ error: 'Data de desligamento e motivo são obrigatórios' });
    return;
  }

  const existing = queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }

  runQuery(`
    INSERT INTO desligamentos (acolhido_id, data_desligamento, motivo, observacoes)
    VALUES (?, ?, ?, ?)
  `, [req.params.id, data_desligamento, motivo, observacoes || '']);

  runQuery("UPDATE acolhidos SET ativo = 0, updated_at = datetime('now', 'localtime') WHERE id = ?", [req.params.id]);

  res.json(queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]));
});

export default router;
