import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d1b4a 0%, #1a237e 50%, #283593 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px',
        width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#1a237e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 32, color: '#fff',
          }}>📋</div>
          <h2 style={{ margin: 0, color: '#1a237e', fontSize: 20 }}>RMA</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>Relatório Mensal de Atendimento</p>
        </div>

        {erro && (
          <div style={{
            background: '#ffebee', color: '#c62828', padding: '10px 14px',
            borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: 'center',
          }}>{erro}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Usuário / Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #ddd',
                borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
              }} placeholder="usuario@email.com" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #ddd',
                borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
              }} placeholder="••••••" />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: '#1a237e', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            cursor: 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
          Novo por aqui?{' '}
          <button onClick={() => navigate('/register')} style={{
            background: 'none', border: 'none', color: '#1a237e', fontWeight: 600,
            cursor: 'pointer', fontSize: 13, padding: 0, textDecoration: 'underline',
          }}>Solicitar cadastro</button>
        </p>
      </div>
    </div>
  );
}
