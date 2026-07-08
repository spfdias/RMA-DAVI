import { useEffect, useState } from 'react';
import { authApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState('user');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordUserId, setEditPasswordUserId] = useState<number | null>(null);

  function showMsg(text: string, type: 'success' | 'error' = 'success') {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    authApi.listUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, [user, navigate]);

  async function approve(id: number) {
    try {
      await authApi.approveUser(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, approved: 1 } : u));
      showMsg('Usuário aprovado!');
    } catch { showMsg('Erro ao aprovar', 'error'); }
  }

  async function remove(id: number) {
    if (!confirm('Excluir este usuário?')) return;
    try {
      await authApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showMsg('Usuário removido');
    } catch { showMsg('Erro ao remover', 'error'); }
  }

  async function handleChangeRole(id: number) {
    try {
      await authApi.changeRole(id, editRole);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: editRole } : u));
      setEditUserId(null);
      showMsg('Nível alterado!');
    } catch { showMsg('Erro ao alterar nível', 'error'); }
  }

  async function handleResetPassword(id: number) {
    if (editPassword.length < 4) { showMsg('Senha deve ter no mínimo 4 caracteres', 'error'); return; }
    try {
      await authApi.resetPassword(id, editPassword);
      setEditPasswordUserId(null);
      setEditPassword('');
      showMsg('Senha redefinida!');
    } catch { showMsg('Erro ao redefinir senha', 'error'); }
  }

  if (loading) return <p style={{ color: '#999' }}>Carregando...</p>;

  return (
    <div>
      <h2 style={{ color: '#1a237e', marginBottom: 20 }}>Gerenciar Usuários</h2>

      {msg && (
        <div style={{
          background: msgType === 'success' ? '#e8f5e9' : '#ffebee',
          color: msgType === 'success' ? '#2e7d32' : '#c62828',
          padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
        }}>{msg}</div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e8eaf6' }}>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#666' }}>Nome</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#666' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#666' }}>Nível</th>
            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: 13, color: '#666' }}>Aprovado</th>
            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: 13, color: '#666' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px 12px', fontSize: 13 }}>{u.nome}</td>
              <td style={{ padding: '10px 12px', fontSize: 13 }}>{u.email}</td>
              <td style={{ padding: '10px 12px', fontSize: 13 }}>
                {editUserId === u.id ? (
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #ccc', fontSize: 12 }}>
                      <option value="admin">Admin</option>
                      <option value="user">Usuário</option>
                    </select>
                    <button onClick={() => handleChangeRole(u.id)} style={{
                      background: '#1a237e', color: '#fff', border: 'none',
                      padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11,
                    }}>OK</button>
                    <button onClick={() => setEditUserId(null)} style={{
                      background: '#eee', border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11,
                    }}>X</button>
                  </span>
                ) : (
                  <span style={{
                    background: u.role === 'admin' ? '#1a237e' : '#e8eaf6',
                    color: u.role === 'admin' ? '#fff' : '#1a237e',
                    padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }} onClick={() => { setEditUserId(u.id); setEditRole(u.role); }}>
                    {u.role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                )}
              </td>
              <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                {u.approved ? (
                  <span style={{ color: '#2e7d32', fontSize: 16 }}>✓</span>
                ) : (
                  <span style={{ color: '#c62828', fontSize: 16 }}>✕</span>
                )}
              </td>
              <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                {!u.approved && (
                  <button onClick={() => approve(u.id)} style={{
                    background: '#2e7d32', color: '#fff', border: 'none',
                    padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, marginRight: 4,
                  }}>Aprovar</button>
                )}
                {editPasswordUserId === u.id ? (
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input type="text" value={editPassword} onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Nova senha" style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #ccc', fontSize: 11, width: 90 }} />
                    <button onClick={() => handleResetPassword(u.id)} style={{
                      background: '#1a237e', color: '#fff', border: 'none',
                      padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11,
                    }}>OK</button>
                    <button onClick={() => { setEditPasswordUserId(null); setEditPassword(''); }} style={{
                      background: '#eee', border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11,
                    }}>X</button>
                  </span>
                ) : (
                  <button onClick={() => { setEditPasswordUserId(u.id); setEditPassword(''); }} style={{
                    background: '#ff8f00', color: '#fff', border: 'none',
                    padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, marginRight: 4,
                  }}>Redefinir Senha</button>
                )}
                {u.role !== 'admin' && (
                  <button onClick={() => remove(u.id)} style={{
                    background: '#c62828', color: '#fff', border: 'none',
                    padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                  }}>Excluir</button>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#999' }}>Nenhum usuário cadastrado</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
