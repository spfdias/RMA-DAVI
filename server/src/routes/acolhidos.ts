import { Router, Request, Response } from 'express';
import { queryAll, queryOne, runQuery } from '../database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { status, busca } = req.query;
  let sql = `SELECT * FROM acolhidos WHERE 1=1`;
  const params: any[] = [];

  if (status === 'ativos') {
    sql += ` AND ativo = 1`;
  } else if (status === 'inativos') {
    sql += ` AND ativo = 0`;
  }

  if (busca && typeof busca === 'string') {
    sql += ` AND nome LIKE ?`;
    params.push(`%${busca}%`);
  }

  sql += ` ORDER BY nome ASC`;
  res.json(await queryAll(sql, params));
});

router.get('/:id', async (req: Request, res: Response) => {
  const row = await queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]);
  if (!row) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  res.json(row);
});

router.post('/', async (req: Request, res: Response) => {
  const { nome, data_nascimento, data_acolhimento, sexo, cor_raca, deficiencia, grau_dependencia, observacoes } = req.body;
  if (!nome || !data_nascimento || !data_acolhimento) {
    res.status(400).json({ error: 'Nome, data de nascimento e data de acolhimento são obrigatórios' });
    return;
  }
  const result = await runQuery(`
    INSERT INTO acolhidos (nome, data_nascimento, data_acolhimento, sexo, cor_raca, deficiencia, grau_dependencia, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [nome, data_nascimento, data_acolhimento, sexo || 'Masculino', cor_raca || '', deficiencia || '', grau_dependencia || '', observacoes || '']);
  res.status(201).json(await queryOne('SELECT * FROM acolhidos WHERE id = ?', [result.lastInsertRowid]));
});

router.put('/:id', async (req: Request, res: Response) => {
  const existing = await queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  const { nome, data_nascimento, data_acolhimento, sexo, cor_raca, deficiencia, grau_dependencia, observacoes } = req.body;
  await runQuery(`
    UPDATE acolhidos SET nome=?, data_nascimento=?, data_acolhimento=?, sexo=?, cor_raca=?, deficiencia=?, grau_dependencia=?, observacoes=?,
      updated_at = datetime('now', 'localtime')
    WHERE id=?
  `, [
    nome ?? existing.nome, data_nascimento ?? existing.data_nascimento, data_acolhimento ?? existing.data_acolhimento,
    sexo ?? existing.sexo, cor_raca ?? existing.cor_raca, deficiencia ?? existing.deficiencia,
    grau_dependencia ?? existing.grau_dependencia, observacoes ?? existing.observacoes,
    req.params.id,
  ]);
  res.json(await queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]));
});

router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  await runQuery('DELETE FROM acolhidos WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

router.put('/:id/desligar', async (req: Request, res: Response) => {
  const existing = await queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  const { data_desligamento, motivo, observacoes } = req.body;
  if (!data_desligamento || !motivo) {
    res.status(400).json({ error: 'Data de desligamento e motivo são obrigatórios' });
    return;
  }
  await runQuery(`
    INSERT INTO desligamentos (acolhido_id, data_desligamento, motivo, observacoes)
    VALUES (?, ?, ?, ?)
  `, [req.params.id, data_desligamento, motivo, observacoes || '']);
  await runQuery("UPDATE acolhidos SET ativo = 0, updated_at = datetime('now', 'localtime') WHERE id = ?", [req.params.id]);
  res.json(await queryOne('SELECT * FROM acolhidos WHERE id = ?', [req.params.id]));
});

export default router;
