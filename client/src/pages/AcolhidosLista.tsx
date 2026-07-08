import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acolhidosApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const [acolhidos, setAcolhidos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('ativos');
  const [busca, setBusca] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('nome');
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [desligarModal, setDesligarModal] = useState<any | null>(null);
  const [desligarForm, setDesligarForm] = useState({ data_desligamento: '', motivo: '', observacoes: '' });

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

  async function handleExcluir(id: number) {
    try {
      await acolhidosApi.excluir(id);
      setConfirmDelete(null);
      carregar();
    } catch {
      alert('Erro ao excluir acolhido');
    }
  }

  async function handleDesligar(id: number) {
    try {
      await acolhidosApi.desligar(id, desligarForm);
      setDesligarModal(null);
      setDesligarForm({ data_desligamento: '', motivo: '', observacoes: '' });
      carregar();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao desligar acolhido');
    }
  }

  async function handleReativar(id: number) {
    try {
      await acolhidosApi.atualizar(id, { ativo: true });
      carregar();
    } catch {
      alert('Erro ao reativar acolhido');
    }
  }

  function openDesligar(acolhido: any) {
    setDesligarForm({
      data_desligamento: new Date().toISOString().split('T')[0],
      motivo: '',
      observacoes: '',
    });
    setDesligarModal(acolhido);
  }

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
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/acolhidos/cadastro/${a.id}`)} style={{
                        background: 'transparent', border: '1px solid #1a237e',
                        color: '#1a237e', padding: '4px 12px', borderRadius: 6,
                        cursor: 'pointer', fontSize: 12,
                      }}>Editar</button>

                      {a.ativo ? (
                        <button onClick={() => openDesligar(a)} style={{
                          background: '#fff3e0', border: '1px solid #ef6c00',
                          color: '#ef6c00', padding: '4px 12px', borderRadius: 6,
                          cursor: 'pointer', fontSize: 12,
                        }}>Desligar</button>
                      ) : user?.role === 'admin' && (
                        <button onClick={() => handleReativar(a.id)} style={{
                          background: '#e8f5e9', border: '1px solid #2e7d32',
                          color: '#2e7d32', padding: '4px 12px', borderRadius: 6,
                          cursor: 'pointer', fontSize: 12,
                        }}>Reativar</button>
                      )}

                      {user?.role === 'admin' && (
                        confirmDelete === a.id ? (
                          <span style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => handleExcluir(a.id)} style={{
                              background: '#c62828', border: 'none', color: '#fff',
                              padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                            }}>Confirmar</button>
                            <button onClick={() => setConfirmDelete(null)} style={{
                              background: '#eee', border: 'none', color: '#333',
                              padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                            }}>Cancelar</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDelete(a.id)} style={{
                            background: 'transparent', border: '1px solid #e53935',
                            color: '#e53935', padding: '4px 12px', borderRadius: 6,
                            cursor: 'pointer', fontSize: 12,
                          }}>Excluir</button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Desligamento */}
      {desligarModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setDesligarModal(null)}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 32, maxWidth: 480, width: '90%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', color: '#1a237e' }}>Desligar Acolhido</h3>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: 14 }}>
              {desligarModal.nome}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Data de Desligamento *</label>
              <input type="date" value={desligarForm.data_desligamento}
                onChange={(e) => setDesligarForm({ ...desligarForm, data_desligamento: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Motivo *</label>
              <select value={desligarForm.motivo}
                onChange={(e) => setDesligarForm({ ...desligarForm, motivo: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}>
                <option value="">Selecione</option>
                <option>Transferência</option>
                <option>Falecimento</option>
                <option>Desistência</option>
                <option>Maioridade</option>
                <option>Evadir</option>
                <option>Outro</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Observações</label>
              <textarea value={desligarForm.observacoes}
                onChange={(e) => setDesligarForm({ ...desligarForm, observacoes: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', minHeight: 60, resize: 'vertical' }}
                placeholder="Observações..." />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setDesligarModal(null)} style={{
                background: 'transparent', border: '1px solid #ddd',
                padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
              }}>Cancelar</button>
              <button onClick={() => handleDesligar(desligarModal.id)}
                disabled={!desligarForm.data_desligamento || !desligarForm.motivo}
                style={{
                  background: '#ef6c00', color: '#fff', border: 'none',
                  padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  opacity: (!desligarForm.data_desligamento || !desligarForm.motivo) ? 0.6 : 1,
                }}>Confirmar Desligamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
