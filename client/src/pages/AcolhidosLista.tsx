import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acolhidosApi } from '../api';

function calcularTempoAcolhimento(dataAcolhimento: string): string {
  const inicio = new Date(dataAcolhimento);
  const hoje = new Date();
  if (inicio > hoje) return '0 meses';
  const anos = hoje.getFullYear() - inicio.getFullYear();
  const meses = hoje.getMonth() - inicio.getMonth();
  let totalMeses = anos * 12 + meses;
  if (hoje.getDate() < inicio.getDate()) totalMeses--;
  if (totalMeses < 0) return '0 meses';
  const a = Math.floor(totalMeses / 12);
  const m = totalMeses % 12;
  let r = '';
  if (a > 0) r += `${a} ano${a > 1 ? 's' : ''}`;
  if (m > 0) r += `${r ? ' e ' : ''}${m} mês${m > 1 ? 'es' : ''}`;
  return r || '0 meses';
}

function calcularIdade(dataNascimento: string): string {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
  if (idade < 0) return '0 anos';
  return `${idade} anos`;
}

export default function AcolhidosLista() {
  const navigate = useNavigate();
  const [acolhidos, setAcolhidos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('ativos');
  const [busca, setBusca] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('nome');
  const [loading, setLoading] = useState(true);

  function carregar() {
    setLoading(true);
    acolhidosApi.listar({ status: filtro, busca: busca || undefined })
      .then((data) => {
        let lista = Array.isArray(data) ? data : [];
        lista = lista.map((a: any) => ({
          ...a,
          tempoAcolhimento: calcularTempoAcolhimento(a.data_acolhimento),
          idadeLabel: calcularIdade(a.data_nascimento),
        }));
        if (ordenarPor === 'tempo') {
          lista.sort((a: any, b: any) => new Date(b.data_acolhimento).getTime() - new Date(a.data_acolhimento).getTime());
        } else if (ordenarPor === 'idade') {
          lista.sort((a: any, b: any) => new Date(b.data_nascimento).getTime() - new Date(a.data_nascimento).getTime());
        } else {
          lista.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
        }
        setAcolhidos(lista);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { carregar(); }, [filtro, ordenarPor]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1a237e' }}>Acolhidos</h2>
        <button onClick={() => navigate('/acolhidos/cadastro')} style={{
          background: '#1a237e', color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>
          + Novo Acolhido
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && carregar()}
          style={{
            flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #ddd',
            borderRadius: 8, fontSize: 14,
          }}
        />
        <button onClick={carregar} style={{
          background: '#e8eaf6', color: '#1a237e', border: 'none',
          padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
        }}>Buscar</button>

        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{
          padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13,
        }}>
          <option value="todos">Todos</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Desligados</option>
        </select>

        <select value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)} style={{
          padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13,
        }}>
          <option value="nome">Ordenar por Nome</option>
          <option value="tempo">Ordenar por Tempo</option>
          <option value="idade">Ordenar por Idade</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#999' }}>Carregando...</p>
      ) : acolhidos.length === 0 ? (
        <p style={{ color: '#999' }}>Nenhum acolhido encontrado.</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Nome</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Idade</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Acolhimento</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Tempo</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}></th>
              </tr>
            </thead>
            <tbody>
              {acolhidos.map((a: any) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: 14 }}>{a.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{a.idadeLabel}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>
                    {new Date(a.data_acolhimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{a.tempoAcolhimento}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: a.ativo ? '#e8f5e9' : '#ffebee',
                      color: a.ativo ? '#2e7d32' : '#c62828',
                      padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                    }}>
                      {a.ativo ? 'Ativo' : 'Desligado'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => navigate(`/acolhidos/cadastro/${a.id}`)} style={{
                      background: 'transparent', border: '1px solid #1a237e',
                      color: '#1a237e', padding: '4px 12px', borderRadius: 6,
                      cursor: 'pointer', fontSize: 12,
                    }}>Editar</button>
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
