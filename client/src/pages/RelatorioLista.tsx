import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { relatoriosApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function RelatorioLista() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  function carregar() {
    setLoading(true);
    relatoriosApi.listar().then((data) => {
      setRelatorios(Array.isArray(data) ? data : []);
    }).finally(() => setLoading(false));
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1a237e' }}>Relatórios Mensais</h2>
        <button onClick={() => navigate('/relatorios/novo')} style={{
          background: '#1a237e', color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>+ Novo Relatório</button>
      </div>

      {loading ? (
        <p style={{ color: '#999' }}>Carregando...</p>
      ) : relatorios.length === 0 ? (
        <p style={{ color: '#999' }}>Nenhum relatório encontrado.</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Mês/Ano</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Criado em</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Última atualização</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {relatorios.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: 14 }}>
                    {meses[r.mes - 1]} / {r.ano}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>
                    {new Date(r.created_at + 'Z').toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>
                    {r.updated_at ? new Date(r.updated_at + 'Z').toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
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
                          }}>Sim</button>
                          <button onClick={() => setConfirmDelete(null)} style={{
                            background: '#eee', border: 'none', color: '#333',
                            padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                          }}>Não</button>
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
        </div>
      )}
    </div>
  );
}
