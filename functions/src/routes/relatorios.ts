import { Router, Request, Response } from 'express';
import cloudinary from 'cloudinary';
import { db, FieldValue } from '../firebase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { mes, ano } = req.query;

  if (mes && ano) {
    const snap = await db.collection('relatorios')
      .where('mes', '==', Number(mes))
      .where('ano', '==', Number(ano))
      .limit(1).get();

    if (snap.empty) {
      const empty = { mes: Number(mes), ano: Number(ano), dados: {}, imagens: [] };
      res.json(empty);
      return;
    }
    const rel = snap.docs[0];
    const imgsSnap = await db.collection('imagens_atividades')
      .where('relatorio_id', '==', rel.id)
      .orderBy('created_at', 'asc').get();
    const imagens = imgsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ id: rel.id, ...rel.data(), imagens });
    return;
  }

  const snap = await db.collection('relatorios')
    .orderBy('ano', 'desc')
    .orderBy('mes', 'desc')
    .get();
  const relatorios = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json(relatorios);
});

router.get('/:id', async (req: Request, res: Response) => {
  const doc = await db.collection('relatorios').doc(req.params.id as string).get();
  if (!doc.exists) {
    res.status(404).json({ error: 'Relatório não encontrado' });
    return;
  }
  const imgsSnap = await db.collection('imagens_atividades')
    .where('relatorio_id', '==', req.params.id as string)
    .orderBy('created_at', 'asc').get();
  const imagens = imgsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json({ id: doc.id, ...doc.data(), imagens });
});

router.post('/', async (req: Request, res: Response) => {
  const { mes, ano, dados, changeSummary } = req.body;
  const user = req.user;

  if (!mes || !ano) {
    res.status(400).json({ error: 'Mês e ano são obrigatórios' });
    return;
  }

  const existing = await db.collection('relatorios')
    .where('mes', '==', Number(mes))
    .where('ano', '==', Number(ano))
    .limit(1).get();

  if (!existing.empty) {
    const relDoc = existing.docs[0];
    const relId = relDoc.id;

    if (user && user.role === 'user') {
      const oldData = relDoc.data()!.dados;
      await db.collection('audit_log').add({
        relatorio_id: relId, user_id: user.userId, user_name: user.nome,
        changes: { previous: oldData, current: dados || {}, summary: changeSummary || 'Alteração realizada', timestamp: new Date().toISOString() },
        created_at: FieldValue.serverTimestamp(),
      });
    }

    await relDoc.ref.update({
      dados: dados || {},
      updated_at: FieldValue.serverTimestamp(),
    });

    const updated = await relDoc.ref.get();
    const imgsSnap = await db.collection('imagens_atividades')
      .where('relatorio_id', '==', relId)
      .orderBy('created_at', 'asc').get();
    const imagens = imgsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ id: relId, ...updated.data(), imagens });
    return;
  }

  const docRef = await db.collection('relatorios').add({
    mes: Number(mes), ano: Number(ano), dados: dados || {},
    created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
  });
  const snap = await docRef.get();
  res.status(201).json({ id: snap.id, ...snap.data(), imagens: [] });
});

router.delete('/:id/imagens', async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem remover todas as imagens' });
    return;
  }
  const imgsSnap = await db.collection('imagens_atividades')
    .where('relatorio_id', '==', req.params.id as string).get();
  for (const img of imgsSnap.docs) {
    const data = img.data();
    try { await cloudinary.v2.uploader.destroy(data.filename); } catch {}
    await img.ref.delete();
  }
  res.json({ message: `${imgsSnap.size} imagem(ns) removida(s)` });
});

router.delete('/:id', async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem excluir relatórios' });
    return;
  }
  const doc = db.collection('relatorios').doc(req.params.id as string);
  const snap = await doc.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Relatório não encontrado' });
    return;
  }

  const imgsSnap = await db.collection('imagens_atividades')
    .where('relatorio_id', '==', req.params.id as string).get();
  for (const img of imgsSnap.docs) {
    const data = img.data();
    try { await cloudinary.v2.uploader.destroy(data.filename); } catch {}
    await img.ref.delete();
  }
  await doc.delete();
  res.status(204).send();
});

router.get('/audit', async (_req: Request, res: Response) => {
  const snap = await db.collection('audit_log')
    .orderBy('created_at', 'desc').limit(200).get();
  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json(logs);
});

export default router;
