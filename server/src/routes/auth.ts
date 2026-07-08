import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, runQuery } from '../database';
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
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    res.status(400).json({ error: 'Email já cadastrado' });
    return;
  }
  const hash = bcrypt.hashSync(senha, 10);
  const role = 'user';
  const approved = 0;
  const result = await runQuery(
    'INSERT INTO users (nome, email, password_hash, role, approved) VALUES (?, ?, ?, ?, ?)',
    [nome, email, hash, role, approved]
  );
  res.status(201).json({
    id: result.lastInsertRowid,
    message: 'Cadastro realizado. Aguarde aprovação do administrador.',
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }
  const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    res.status(401).json({ error: 'Email ou senha inválidos' });
    return;
  }
  if (!bcrypt.compareSync(senha, user.password_hash)) {
    res.status(401).json({ error: 'Email ou senha inválidos' });
    return;
  }
  if (!user.approved) {
    res.status(403).json({ error: 'Seu cadastro ainda não foi aprovado pelo administrador' });
    return;
  }
  const payload: AuthPayload = {
    userId: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    approved: !!user.approved,
  };
  const token = gerarToken(payload);
  res.json({ token, user: payload });
});

router.get('/users', authMiddleware, adminOnly, async (_req: Request, res: Response) => {
  const users = await queryAll('SELECT id, nome, email, role, approved, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

router.post('/users/:id/approve', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  await runQuery('UPDATE users SET approved = 1 WHERE id = ?', [id]);
  res.json({ message: 'Usuário aprovado com sucesso' });
});

router.delete('/users/:id', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  await runQuery('DELETE FROM users WHERE id = ?', [id]);
  res.status(204).send();
});

router.put('/users/:id/role', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role || !['admin', 'user'].includes(role)) {
    res.status(400).json({ error: 'Nível inválido. Use: admin ou user' });
    return;
  }
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  await runQuery('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  res.json({ message: `Nível alterado para ${role}` });
});

router.put('/users/:id/reset-password', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { senha } = req.body;
  if (!senha || senha.length < 4) {
    res.status(400).json({ error: 'Senha deve ter no mínimo 4 caracteres' });
    return;
  }
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  const hash = bcrypt.hashSync(senha, 10);
  await runQuery('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
  res.json({ message: 'Senha redefinida com sucesso' });
});

router.put('/change-password', authMiddleware, async (req: Request, res: Response) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha) {
    res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    return;
  }
  if (novaSenha.length < 4) {
    res.status(400).json({ error: 'Nova senha deve ter no mínimo 4 caracteres' });
    return;
  }
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user!.userId]);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  if (!bcrypt.compareSync(senhaAtual, user.password_hash)) {
    res.status(401).json({ error: 'Senha atual incorreta' });
    return;
  }
  const hash = bcrypt.hashSync(novaSenha, 10);
  await runQuery('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
  res.json({ message: 'Senha alterada com sucesso' });
});

export default router;
