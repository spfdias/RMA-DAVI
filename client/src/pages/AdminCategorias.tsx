import { useEffect, useState } from 'react';
import { categoriasApi } from '../api';

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ value: '', label: '', icon: '📎' });

  function carregar() {
    setLoading(true);
    categoriasApi.listar().then((data) => {
      setCategorias(Array.isArray(data) ? data : []);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { carregar(); }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.value || !form.label) return;
    try {
      await categoriasApi.criar(form);
      setForm({ value: '', label: '', icon: '📎' });
      setShowForm(false);
      carregar();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar categoria');
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await categoriasApi.excluir(id);
      carregar();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir categoria');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1a237e' }}>Gerenciar Categorias</h2>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: '#1a237e', color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>
          {showForm ? 'Cancelar' : '+ Nova Categoria'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCriar} style={{
          background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: 500,
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Valor (slug)</label>
            <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="ex: corte_cabelo"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Nome (exibição)</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="ex: Corte de Cabelo"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Ícone (emoji)</label>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="📎"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{
            background: '#1a237e', color: '#fff', border: 'none',
            padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>Criar Categoria</button>
        </form>
      )}

      {loading ? (
        <p style={{ color: '#999' }}>Carregando...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Ícone</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Valor</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Nome</th>
                <th style={{ padding: '12px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 16px', fontSize: 20 }}>{c.icon}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#666', fontFamily: 'monospace' }}>{c.value}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 500, fontSize: 14 }}>{c.label}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleExcluir(c.id)} style={{
                      background: 'transparent', border: '1px solid #e53935',
                      color: '#e53935', padding: '4px 12px', borderRadius: 6,
                      cursor: 'pointer', fontSize: 12,
                    }}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
