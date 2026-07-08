import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, FieldValue } from '../firebase';
import { gerarToken, authMiddleware, adminOnly, AuthPayload } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    return;
  }
  if (senha.length < 4) {
    res.status(400).json({ error: 'Senha deve ter no mínimo 4 caracteres' });
    return;
  }
  const existing = await db.collection('users').where('email', '==', email).get();
  if (!existing.empty) {
    res.status(400).json({ error: 'Email já cadastrado' });
    return;
  }
  const hash = bcrypt.hashSync(senha, 10);
  const docRef = await db.collection('users').add({
    nome, email, password_hash: hash, role: 'user', approved: false,
    created_at: FieldValue.serverTimestamp(),
  });
  res.status(201).json({
    id: docRef.id,
    message: 'Cadastro realizado. Aguarde aprovação do administrador.',
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }
  const snap = await db.collection('users').where('email', '==', email).get();
  if (snap.empty) {
    res.status(401).json({ error: 'Email ou senha inválidos' });
    return;
  }
  const user = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
  if (!bcrypt.compareSync(senha, user.password_hash)) {
    res.status(401).json({ error: 'Email ou senha inválidos' });
    return;
  }
  if (!user.approved) {
    res.status(403).json({ error: 'Seu cadastro ainda não foi aprovado pelo administrador' });
    return;
  }
  const payload: AuthPayload = {
    userId: user.id, nome: user.nome, email: user.email,
    role: user.role, approved: !!user.approved,
  };
  const token = gerarToken(payload);
  res.json({ token, user: payload });
});

router.get('/users', authMiddleware, adminOnly, async (_req: Request, res: Response) => {
  const snap = await db.collection('users').orderBy('created_at', 'desc').get();
  const users = snap.docs.map((d) => ({ id: d.id, nome: d.data().nome, email: d.data().email, role: d.data().role, approved: d.data().approved, created_at: d.data().created_at }));
  res.json(users);
});

router.post('/users/:id/approve', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const doc = db.collection('users').doc(req.params.id as string);
  const snap = await doc.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  await doc.update({ approved: true });
  res.json({ message: 'Usuário aprovado com sucesso' });
});

router.delete('/users/:id', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const doc = db.collection('users').doc(req.params.id as string);
  const snap = await doc.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  await doc.delete();
  res.status(204).send();
});

router.put('/users/:id/role', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!role || !['admin', 'user'].includes(role)) {
    res.status(400).json({ error: 'Nível inválido' });
    return;
  }
  const doc = db.collection('users').doc(req.params.id as string);
  const snap = await doc.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  await doc.update({ role });
  res.json({ message: `Nível alterado para ${role}` });
});

router.put('/users/:id/reset-password', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const { senha } = req.body;
  if (!senha || senha.length < 4) {
    res.status(400).json({ error: 'Senha deve ter no mínimo 4 caracteres' });
    return;
  }
  const doc = db.collection('users').doc(req.params.id as string);
  const snap = await doc.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  await doc.update({ password_hash: bcrypt.hashSync(senha, 10) });
  res.json({ message: 'Senha redefinida com sucesso' });
});

router.put('/change-password', authMiddleware, async (req: Request, res: Response) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha || novaSenha.length < 4) {
    res.status(400).json({ error: 'Dados inválidos' });
    return;
  }
  const doc = db.collection('users').doc(req.user!.userId);
  const snap = await doc.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  const user = snap.data()!;
  if (!bcrypt.compareSync(senhaAtual, user.password_hash)) {
    res.status(401).json({ error: 'Senha atual incorreta' });
    return;
  }
  await doc.update({ password_hash: bcrypt.hashSync(novaSenha, 10) });
  res.json({ message: 'Senha alterada com sucesso' });
});

export default router;
