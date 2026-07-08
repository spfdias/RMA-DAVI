import { Router, Request, Response } from 'express';
import { db, FieldValue } from '../firebase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { status, busca } = req.query;
  let query: FirebaseFirestore.Query = db.collection('acolhidos');

  if (status === 'ativos') query = query.where('ativo', '==', true);
  else if (status === 'inativos') query = query.where('ativo', '==', false);

  query = query.orderBy('nome', 'asc');

  const snap = await query.get();
  let acolhidos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (busca) {
    const term = String(busca).toLowerCase();
    acolhidos = acolhidos.filter((a: any) => a.nome.toLowerCase().includes(term));
  }

  res.json(acolhidos);
});

router.get('/:id', async (req: Request, res: Response) => {
  const doc = await db.collection('acolhidos').doc(req.params.id as string).get();
  if (!doc.exists) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  res.json({ id: doc.id, ...doc.data() });
});

router.post('/', async (req: Request, res: Response) => {
  const { nome, data_nascimento, data_acolhimento, sexo, cor_raca, deficiencia, grau_dependencia, observacoes } = req.body;
  if (!nome || !data_nascimento || !data_acolhimento) {
    res.status(400).json({ error: 'Nome, data de nascimento e data de acolhimento são obrigatórios' });
    return;
  }
  const docRef = await db.collection('acolhidos').add({
    nome, data_nascimento, data_acolhimento,
    sexo: sexo || 'Masculino', cor_raca: cor_raca || '', deficiencia: deficiencia || '',
    grau_dependencia: grau_dependencia || '', observacoes: observacoes || '',
    ativo: true, created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
  });
  const snap = await docRef.get();
  res.status(201).json({ id: snap.id, ...snap.data() });
});

router.put('/:id', async (req: Request, res: Response) => {
  const doc = db.collection('acolhidos').doc(req.params.id as string);
  const snap = await doc.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  const updates: any = { ...req.body, updated_at: FieldValue.serverTimestamp() };
  if (updates.ativo !== undefined) updates.ativo = !!updates.ativo;
  await doc.update(updates);
  const updated = await doc.get();
  res.json({ id: updated.id, ...updated.data() });
});

router.delete('/:id', async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem excluir acolhidos' });
    return;
  }
  const doc = db.collection('acolhidos').doc(req.params.id as string);
  const snap = await doc.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  await doc.delete();
  res.status(204).send();
});

router.post('/:id/desligar', async (req: Request, res: Response) => {
  const { data_desligamento, motivo, observacoes } = req.body;
  if (!data_desligamento || !motivo) {
    res.status(400).json({ error: 'Data de desligamento e motivo são obrigatórios' });
    return;
  }
  const doc = db.collection('acolhidos').doc(req.params.id as string);
  const snap = await doc.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Acolhido não encontrado' });
    return;
  }
  await db.collection('desligamentos').add({
    acolhido_id: req.params.id as string, data_desligamento, motivo,
    observacoes: observacoes || '', created_at: FieldValue.serverTimestamp(),
  });
  await doc.update({ ativo: false, updated_at: FieldValue.serverTimestamp() });
  const updated = await doc.get();
  res.json({ id: updated.id, ...updated.data() });
});

export default router;
