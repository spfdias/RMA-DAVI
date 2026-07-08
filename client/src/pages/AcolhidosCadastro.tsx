import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { acolhidosApi } from '../api';

export default function AcolhidosCadastro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '', data_nascimento: '', data_acolhimento: '',
    sexo: 'Masculino', cor_raca: '', deficiencia: '',
    grau_dependencia: '', observacoes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      acolhidosApi.buscar(Number(id)).then((data) => {
        setForm({
          nome: data.nome,
          data_nascimento: data.data_nascimento?.split('T')[0] || '',
          data_acolhimento: data.data_acolhimento?.split('T')[0] || '',
          sexo: data.sexo,
          cor_raca: data.cor_raca,
          deficiencia: data.deficiencia,
          grau_dependencia: data.grau_dependencia,
          observacoes: data.observacoes,
        });
      }).catch(() => navigate('/acolhidos/lista'));
    }
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.nome || !form.data_nascimento || !form.data_acolhimento) {
      setError('Preencha nome, data de nascimento e data de acolhimento.');
      return;
    }

    setSaving(true);
    try {
      if (id) {
        await acolhidosApi.atualizar(Number(id), form);
      } else {
        await acolhidosApi.criar(form);
      }
      navigate('/acolhidos/lista');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const,
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 };

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', color: '#1a237e' }}>
        {id ? 'Editar Acolhido' : 'Cadastrar Acolhido'}
      </h2>

      <form onSubmit={handleSubmit} style={{
        background: '#fff', borderRadius: 12, padding: 32,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: 700,
      }}>
        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nome Completo *</label>
            <input name="nome" value={form.nome} onChange={handleChange} style={inputStyle} placeholder="Nome do acolhido" />
          </div>

          <div>
            <label style={labelStyle}>Data de Nascimento *</label>
            <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Data de Acolhimento *</label>
            <input type="date" name="data_acolhimento" value={form.data_acolhimento} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Sexo</label>
            <select name="sexo" value={form.sexo} onChange={handleChange} style={inputStyle}>
              <option>Masculino</option>
              <option>Feminino</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Cor/Raça</label>
            <select name="cor_raca" value={form.cor_raca} onChange={handleChange} style={inputStyle}>
              <option value="">Selecione</option>
              <option>Branco</option>
              <option>Pardo</option>
              <option>Preto</option>
              <option>Amarelo</option>
              <option>Indígena</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Deficiência</label>
            <select name="deficiencia" value={form.deficiencia} onChange={handleChange} style={inputStyle}>
              <option value="">Nenhuma</option>
              <option>Deficiência múltipla</option>
              <option>Deficiência visual</option>
              <option>Deficiência auditiva</option>
              <option>Deficiência física</option>
              <option>Transtorno mental/psiquiátrico</option>
              <option>TEA</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Grau de Dependência</label>
            <select name="grau_dependencia" value={form.grau_dependencia} onChange={handleChange} style={inputStyle}>
              <option value="">Não se aplica</option>
              <option>I - Independente</option>
              <option>II - Dependência parcial</option>
              <option>III - Dependência total</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Observações</label>
          <textarea name="observacoes" value={form.observacoes} onChange={handleChange}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            placeholder="Observações relevantes..."
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="submit" disabled={saving} style={{
            background: '#1a237e', color: '#fff', border: 'none',
            padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Salvando...' : (id ? 'Atualizar' : 'Cadastrar')}
          </button>
          <button type="button" onClick={() => navigate('/acolhidos/lista')} style={{
            background: 'transparent', border: '1px solid #ddd',
            padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
          }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
