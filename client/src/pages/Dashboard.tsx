import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acolhidosApi, relatoriosApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ ativos: 0, total: 0, relatorios: 0 });
  const [ultimosRelatorios, setUltimosRelatorios] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  function carregar() {
    Promise.all([
      acolhidosApi.listar({ status: 'ativos' }),
      acolhidosApi.listar(),
      relatoriosApi.listar(),
    ]).then(([ativos, todos, rels]) => {
      setStats({
        ativos: Array.isArray(ativos) ? ativos.length : 0,
        total: Array.isArray(todos) ? todos.length : 0,
        relatorios: Array.isArray(rels) ? rels.length : 0,
      });
      setUltimosRelatorios(Array.isArray(rels) ? rels : []);
    });
  }

  useEffect(() => { carregar(); }, []);

  async function handleExcluir(id: number) {
    try {
      await relatoriosApi.excluir(id);
      setConfirmDelete(null);
      carregar();
    } catch {
      alert('Erro ao excluir relatório');
    }
  }

  const cards = [
    { titulo: 'Acolhidos Ativos', valor: stats.ativos, cor: '#43a047', icone: '👥' },
    { titulo: 'Total Cadastrados', valor: stats.total, cor: '#1e88e5', icone: '📋' },
    { titulo: 'Relatórios', valor: stats.relatorios, cor: '#fb8c00', icone: '📄' },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', color: '#1a237e' }}>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map((card) => (
          <div key={card.titulo} style={{
            background: '#fff', borderRadius: 12, padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${card.cor}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: '#666' }}>{card.titulo}</p>
                <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, color: '#333' }}>{card.valor}</p>
              </div>
              <span style={{ fontSize: 32 }}>{card.icone}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#1a237e', fontSize: 18 }}>Relatórios</h3>
          <button onClick={() => navigate('/relatorios/novo')} style={{
            background: '#1a237e', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}>Novo Relatório</button>
        </div>

        {ultimosRelatorios.length === 0 ? (
          <p style={{ color: '#999', fontSize: 14 }}>Nenhum relatório criado ainda.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#666' }}>Mês/Ano</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#666' }}>Criado em</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: '#666' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ultimosRelatorios.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 500 }}>
                    {meses[r.mes - 1]} / {r.ano}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#666' }}>
                    {new Date(r.created_at + 'Z').toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/relatorios/${r.mes}/${r.ano}`)} style={{
                        background: 'transparent', border: '1px solid #1a237e', color: '#1a237e',
                        padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                      }}>Editar</button>
                      <button onClick={() => navigate(`/relatorios/${r.mes}/${r.ano}/visualizar`)} style={{
                        background: '#e8eaf6', border: '1px solid #5c6bc0', color: '#283593',
                        padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                      }}>Visualizar</button>
                      {confirmDelete === r.id ? (
                        <span style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => handleExcluir(r.id)} style={{
                            background: '#c62828', border: 'none', color: '#fff',
                            padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                          }}>Confirmar</button>
                          <button onClick={() => setConfirmDelete(null)} style={{
                            background: '#eee', border: 'none', color: '#333',
                            padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                          }}>Cancelar</button>
                        </span>
                      ) : user?.role === 'admin' && (
                        <button onClick={() => setConfirmDelete(r.id)} style={{
                          background: 'transparent', border: '1px solid #e53935', color: '#e53935',
                          padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                        }}>Excluir</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
