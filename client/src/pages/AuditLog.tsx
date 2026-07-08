import { useEffect, useState } from 'react';
import { relatoriosApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function AuditLog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    relatoriosApi.listarAudit()
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <p style={{ color: '#999' }}>Carregando...</p>;

  return (
    <div>
      <h2 style={{ color: '#1a237e', marginBottom: 20 }}>Histórico de Alterações</h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
        Alterações realizadas por colaboradores nos relatórios mensais
      </p>

      {logs.length === 0 ? (
        <p style={{ color: '#999' }}>Nenhuma alteração registrada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {logs.map((log) => {
            const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
            return (
              <div key={log.id} style={{
                background: '#fff', borderRadius: 10, padding: 16,
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14 }}>{log.user_name}</strong>
                    <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <button
                    onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                    style={{
                      background: '#e8eaf6', border: 'none', padding: '4px 12px',
                      borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#1a237e',
                    }}
                  >
                    {expandido === log.id ? 'Recolher' : 'Detalhes'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>
                  Relatório #{log.relatorio_id} — {changes.summary || 'Alteração realizada'}
                </div>
                {expandido === log.id && (
                  <div style={{
                    marginTop: 12, padding: 12, background: '#f5f5f5',
                    borderRadius: 8, fontSize: 11, fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto',
                  }}>
                    {JSON.stringify(changes, null, 2)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
