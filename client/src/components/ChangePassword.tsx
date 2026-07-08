import { useState } from 'react';
import { authApi } from '../api';

interface Props {
  onClose: () => void;
}

export default function ChangePassword({ onClose }: Props) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setMsg('');
    if (novaSenha !== confirmar) { setErro('Senhas não conferem'); return; }
    if (novaSenha.length < 4) { setErro('Nova senha deve ter no mínimo 4 caracteres'); return; }
    setLoading(true);
    try {
      await authApi.changeMyPassword(senhaAtual, novaSenha);
      setMsg('Senha alterada com sucesso!');
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 32, width: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', color: '#1a237e' }}>Alterar Senha</h3>

        {msg && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>{msg}</div>}
        {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Senha atual</label>
            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Nova senha</label>
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Confirmar nova senha</label>
            <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              background: '#eee', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{
              background: '#1a237e', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: loading ? 0.7 : 1,
            }}>{loading ? 'Alterando...' : 'Alterar Senha'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
