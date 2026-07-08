import { useEffect, useState } from 'react';
import { acolhidosApi } from '../api';

function calcularIdade(dataNascimento: string): string {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
  if (idade < 0) return '0 anos';
  return `${idade} anos`;
}

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

export default function RelatorioAcolhidos() {
  const [acolhidos, setAcolhidos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  function carregar() {
    setLoading(true);
    acolhidosApi.listar({ status: filtro, busca: busca || undefined })
      .then((data) => {
        const lista = (Array.isArray(data) ? data : []).map((a: any) => ({
          ...a,
          idadeLabel: calcularIdade(a.data_nascimento),
          tempoAcolhimento: calcularTempoAcolhimento(a.data_acolhimento),
        }));
        setAcolhidos(lista);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { carregar(); }, [filtro]);

  function imprimir() {
    window.print();
  }

  return (
    <div>
      <style>{`
        @media print {
          body { background: #fff !important; }
          @page { margin: 15mm; }
          aside { display: none !important; }
          main { background: #fff !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .report-table th { background: #1a237e !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-table td { border-color: #ccc !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1a237e' }}>Relatório de Acolhidos</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{
            padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13,
          }}>
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Desligados</option>
          </select>
          <input placeholder="Buscar nome..." value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregar()}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, minWidth: 180 }}
          />
          <button onClick={carregar} style={{
            background: '#e8eaf6', color: '#1a237e', border: 'none',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}>Filtrar</button>
          <button onClick={imprimir} style={{
            background: '#1a237e', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>🖨️ Imprimir</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '2px solid #1a237e', background: '#fafafa' }}>
          <h3 style={{ margin: 0, color: '#1a237e', fontSize: 16 }}>
            RELATÓRIO DE ACOLHIDOS
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
            {filtro === 'todos' ? 'Todos os acolhidos' : filtro === 'ativos' ? 'Apenas acolhidos ativos' : 'Apenas acolhidos desligados'}
            {' '}| {new Date().toLocaleDateString('pt-BR')} | Total: {acolhidos.length}
          </p>
        </div>

        {loading ? (
          <p style={{ padding: 24, color: '#999' }}>Carregando...</p>
        ) : acolhidos.length === 0 ? (
          <p style={{ padding: 24, color: '#999' }}>Nenhum acolhido encontrado.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#1a237e', color: '#fff' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Nome</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Idade</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Sexo</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Cor/Raça</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Deficiência</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Grau Dependência</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Acolhimento</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Tempo</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {acolhidos.map((a: any, idx: number) => (
                  <tr key={a.id} style={{
                    borderBottom: '1px solid #e0e0e0',
                    background: idx % 2 === 0 ? '#fff' : '#fafafa',
                  }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{a.nome}</td>
                    <td style={{ padding: '8px 12px' }}>{a.idadeLabel}</td>
                    <td style={{ padding: '8px 12px' }}>{a.sexo}</td>
                    <td style={{ padding: '8px 12px' }}>{a.cor_raca || '-'}</td>
                    <td style={{ padding: '8px 12px' }}>{a.deficiencia || '-'}</td>
                    <td style={{ padding: '8px 12px' }}>{a.grau_dependencia || '-'}</td>
                    <td style={{ padding: '8px 12px' }}>{new Date(a.data_acolhimento).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '8px 12px' }}>{a.tempoAcolhimento}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        background: a.ativo ? '#e8f5e9' : '#ffebee',
                        color: a.ativo ? '#2e7d32' : '#c62828',
                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                      }}>
                        {a.ativo ? 'Ativo' : 'Desligado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {acolhidos.length > 0 && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid #e0e0e0', fontSize: 12, color: '#666', textAlign: 'right' }}>
            Total de acolhidos: {acolhidos.length} |
            Ativos: {acolhidos.filter((a) => a.ativo).length} |
            Desligados: {acolhidos.filter((a) => !a.ativo).length}
          </div>
        )}
      </div>
    </div>
  );
}
