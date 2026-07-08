import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setSuccess('');
    setLoading(true);
    try {
      const { authApi } = await import('../api');
      await authApi.register(nome, email, senha);
      setSuccess('Cadastro realizado! Aguarde aprovação do administrador.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao fazer cadastro');
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
        <h2 style={{ margin: '0 0 4px', color: '#1a237e', fontSize: 20, textAlign: 'center' }}>RMA</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888', textAlign: 'center' }}>Relatório Mensal de Atendimento</p>
        <h3 style={{ margin: '0 0 8px', color: '#333', fontSize: 16, textAlign: 'center' }}>Solicitar Cadastro</h3>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 24 }}>
          Preencha os dados para enviar sua solicitação
        </p>

        {erro && (
          <div style={{
            background: '#ffebee', color: '#c62828', padding: '10px 14px',
            borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: 'center',
          }}>{erro}</div>
        )}

        {success && (
          <div style={{
            background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px',
            borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: 'center',
          }}>{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Nome completo</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={4}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: '#1a237e', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            cursor: 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Enviando...' : 'Solicitar Cadastro'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
          Já tem conta? <Link to="/login" style={{ color: '#1a237e', fontWeight: 600 }}>Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
