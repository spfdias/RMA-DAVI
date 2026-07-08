import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { relatoriosApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = API_URL + '/api';
const IMG_BASE = API_URL + '/uploads';
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const labelsBlocoA: Record<string, string> = {
  A1: 'Capacidade total da Unidade', A2: 'Total de usuários acolhidos',
  A3: 'Total de usuários conveniados/SEMAS', A4: 'Total conveniados/SEMAS acolhidos',
  A5: 'Novos usuários no mês', A6_familia_extensa: 'Família extensa',
  A6_familia_origem: 'Família de origem', A6_familia_substituta: 'Família substituta',
  A6_maioridade: 'Maioridade', A6_falecimento: 'Falecimento', A6_transferencia: 'Transferência',
};

const labelsBlocoF: Record<string, string> = {
  F1: 'Atendimentos individualizados', F2: 'Atendimentos em grupo',
  F3: 'Oficinas/palestras', F4: 'Passeios', F5: 'Datas comemorativas/Eventos',
  F6: 'Visitas domiciliares', F7: 'Atendimentos aos familiares',
  F8: 'Visitas dos familiares', F9: 'Reunião de equipe',
  F10: 'Reunião com rede socioassistencial', F11: 'Participação em audiências',
  F12: 'Atendimento remoto',
};

const labelsBlocoG: Record<string, string> = {
  G1: 'Mercado de trabalho', G2: 'Cursos de qualificação',
  G3: 'Outras políticas públicas', G4: 'Rede socioassistencial',
  G5: 'Documentos/Relatórios para Fórum e MP', G6: 'Outros',
};

const categoriasImagem: Record<string, string> = {
  doacoes: 'Doações', contando_historias: 'Contando Histórias', passeios: 'Passeios',
  oficinas: 'Oficinas/Palestras', eventoss: 'Eventos', visitas: 'Visitas', outros: 'Outros',
};

export default function RelatorioVisualizar() {
  const { mes: mesParam, ano: anoParam } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState<any>(null);
  const [imagens, setImagens] = useState<any[]>([]);
  const [relatorioId, setRelatorioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!mesParam || !anoParam) return;
    relatoriosApi.listar({ mes: Number(mesParam), ano: Number(anoParam) })
      .then((data) => {
        if (!data.dados || Object.keys(data.dados).length === 0) {
          setError('Relatório vazio. Edite o relatório primeiro.');
          return;
        }
        setDados(data.dados);
        setRelatorioId(data.id);
        if (data.imagens) setImagens(data.imagens);
      })
      .catch(() => setError('Erro ao carregar relatório'))
      .finally(() => setLoading(false));
  }, [mesParam, anoParam]);

  async function handleRemoverTodasImagens() {
    if (!relatorioId || imagens.length === 0) return;
    const total = imagens.length;
    if (!confirm(`Tem certeza que deseja remover TODAS as ${total} imagem(ns) deste relatório? Esta ação é irreversível e as imagens serão apagadas permanentemente.`)) return;
    try {
      await relatoriosApi.removerTodasImagens(relatorioId);
      setImagens([]);
    } catch {
      alert('Erro ao remover imagens');
    }
  }

  if (loading) return <p style={{ color: '#999' }}>Carregando...</p>;
  if (error) return (
    <div>
      <p style={{ color: '#c62828' }}>{error}</p>
      <button onClick={() => navigate(`/relatorios/${mesParam}/${anoParam}`)}
        style={{ background: '#1a237e', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', marginTop: 12 }}>
        Editar Relatório
      </button>
    </div>
  );
  if (!dados) return null;

  const d = dados;
  const mesAnoLabel = `${meses[Number(mesParam) - 1]} / ${anoParam}`;

  function val(caminho: string): any {
    const keys = caminho.split('.');
    let v: any = d;
    for (const k of keys) v = v?.[k];
    return v;
  }

  function filtrar(obj: any, labels: Record<string, string>) {
    return Object.entries(obj || {}).filter(([k]) => labels[k]);
  }

  const dataAtual = new Date().toLocaleDateString('pt-BR');

  const S = {
    pg: { margin: 0, fontSize: 10, lineHeight: 1.6, color: '#1a1a2e', fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" },
    tituloPrincipal: { fontSize: 22, fontWeight: 700, color: '#fff', textAlign: 'center' as const, margin: 0, letterSpacing: 0.5 },
    tituloBloco: { fontSize: 14, fontWeight: 700, color: '#1a3a5c', borderBottom: '1px solid #1a3a5c', paddingBottom: 4, margin: '20px 0 10px', pageBreakAfter: 'avoid' as const },
    labelSec: { fontWeight: 700, fontSize: 10, color: '#1a3a5c', margin: '12px 0 5px', pageBreakAfter: 'avoid' as const },
    tabela: { width: '100%', borderCollapse: 'collapse' as const, margin: '10px 0 16px' },
    th: { border: '1px solid #0f2a44', padding: '5px 8px', fontSize: 8, fontWeight: 700, background: '#1a3a5c', color: '#fff', textAlign: 'left' as const, letterSpacing: 0.3, textTransform: 'uppercase' as const },
    td: { border: '1px solid #ddd', padding: '4px 8px', fontSize: 9, color: '#333' },
    tdNum: { border: '1px solid #ddd', padding: '4px 8px', fontSize: 9, color: '#333', textAlign: 'center' as const, width: 50 },
    textoJustificado: { textAlign: 'justify' as const, margin: '0 0 8px', fontSize: 10, lineHeight: 1.7, orphans: 3, widows: 3, color: '#333' },
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }} className="no-print">
        <button onClick={() => window.print()}
          style={{ background: '#1a237e', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          🖨️ Imprimir / Exportar PDF
        </button>
        <button onClick={() => navigate(`/relatorios/${mesParam}/${anoParam}`)}
          style={{ background: '#fff', color: '#1a237e', border: '1px solid #1a237e', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          ✏️ Editar
        </button>
        {user?.role === 'admin' && imagens.length > 0 && (
          <button onClick={handleRemoverTodasImagens}
            style={{ background: '#c62828', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            🗑️ Limpar imagens ({imagens.length})
          </button>
        )}
      </div>

      <div id="relatorio-print" style={S.pg}>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; color: #000; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; display: flex; flex-direction: column; min-height: 100%; }
            aside { display: none !important; }
            main { background: #fff !important; padding: 0 !important; }
            .no-print { display: none !important; }
            @page { margin: 12mm 0 0; size: A4; }
            @page :first { margin: 0; }
            #relatorio-print { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; background: #fff !important; }
            .keep-together { page-break-inside: avoid; }
            .avoid-break-after { page-break-after: avoid; }
            p { orphans: 3; widows: 3; }
            h2, h3, h4 { page-break-after: avoid; }
            table { font-size: 9pt; }
            th { background: #1a3a5c !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            img { max-width: 100% !important; }
            p, li, td { color: #000; }
            tr:nth-child(even) td { background: #f2f4f8 !important; }

          }
          @media screen {
            #relatorio-print { background: #fff; padding: 0; border-radius: 8px; box-shadow: 0 1px 12px rgba(0,0,0,0.12); max-width: 210mm; margin: 0 auto; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; }
          }
          .tb { width: 100%; border-collapse: collapse; margin: 10px 0 16px; border: 1px solid #ccc; }
          .tb th, .tb td { border: 1px solid #ddd; padding: 4px 8px; font-size: 9pt; vertical-align: top; }
          .tb th { background: #1a3a5c; font-weight: 700; color: #fff; text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.3px; }
          .tb td { color: #333; }
          .tb .num { text-align: center; width: 45px; }
          .tb.zebra tr:nth-child(even) td { background: #f7f9fc; }
          .img-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
          .img-grid img { width: 150px; height: 150px; object-fit: cover; border: 1px solid #aaa; }
          @media print { .img-grid img { width: 170px; height: 170px; } }
          .report-text { text-align: justify; margin: 0 0 8px; font-size: 10pt; line-height: 1.7; orphans: 3; widows: 3; color: #333; }
          .meta-item + .meta-item { margin-left: 14px; }
          .meta-item + .meta-item::before { content: "| "; color: #ccc; }
        `}</style>

        {/* ===== HEADER ===== */}
        <div className="keep-together" style={{
          background: 'linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 50%, #1a5276 100%)',
          color: '#fff', margin: '0 0 0', padding: '36px 10mm 28px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, fontWeight: 500, marginBottom: 2, opacity: 0.85, letterSpacing: 0.8 }}>GOVERNO DO ESTADO DE MATO GROSSO DO SUL</p>
          <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, letterSpacing: 0.4 }}>SECRETARIA DE ESTADO DE DIREITOS HUMANOS, ASSISTÊNCIA SOCIAL E TRABALHO</p>
          <p style={{ fontSize: 10, fontWeight: 400, marginBottom: 16, opacity: 0.9 }}>Serviço de Acolhimento Institucional — <strong>Lar Ebenezer</strong></p>
          <h1 style={S.tituloPrincipal}>Relatório Mensal de Atendimento</h1>
          <p style={{ fontSize: 11, opacity: 0.85, fontWeight: 300, marginTop: 4 }}>Proteção Social Especial — Alta Complexidade</p>
          <div style={{
            display: 'inline-block', background: '#1a5276', color: '#fff',
            padding: '4px 16px', marginTop: 14, fontSize: 9, fontWeight: 700,
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            {meses[Number(mesParam) - 1]} / {anoParam}
          </div>
        </div>

        {/* ===== META BAR ===== */}
        <div className="keep-together" style={{
          background: '#f4f6f8', padding: '8px 10mm', margin: '0 0 14px',
          borderBottom: '1px solid #e0e4e8', fontSize: 9, color: '#555', textAlign: 'center',
        }}>
          <span className="meta-item"><strong>Unidade:</strong> {val('identificacao.unidade') || 'Lar Ebenezer'}</span>
          <span className="meta-item"><strong>Município:</strong> Dourados / MS</span>
          <span className="meta-item"><strong>Emissão:</strong> {dataAtual}</span>
        </div>

        {/* IDENTIFICAÇÃO */}
        <div className="keep-together avoid-break-after" style={{ marginBottom: 14 }}>
          <table className="tb" style={{ fontSize: '9.5pt' }}>
            <tbody>
              <tr><td style={{ width: '22%', fontWeight: 600, background: '#f5f5f5', fontSize: '9.5pt' }}>Unidade</td><td style={{ fontSize: '9.5pt' }}>{val('identificacao.unidade') || 'Lar Ebenezer'}</td></tr>
              <tr><td style={{ fontWeight: 600, background: '#f5f5f5', fontSize: '9.5pt' }}>Endereço</td><td style={{ fontSize: '9.5pt' }}>{val('identificacao.endereco') || '-'}</td></tr>
              <tr><td style={{ fontWeight: 600, background: '#f5f5f5', fontSize: '9.5pt' }}>Telefone</td><td style={{ fontSize: '9.5pt' }}>{val('identificacao.telefone') || '-'}</td></tr>
              <tr><td style={{ fontWeight: 600, background: '#f5f5f5', fontSize: '9.5pt' }}>E-mail</td><td style={{ fontSize: '9.5pt' }}>{val('identificacao.email') || '-'}</td></tr>
              <tr><td style={{ fontWeight: 600, background: '#f5f5f5', fontSize: '9.5pt' }}>Município / UF</td><td style={{ fontSize: '9.5pt' }}>Dourados / MS</td></tr>
            </tbody>
          </table>
        </div>

        {/* PROFISSIONAIS */}
        {['profissionais', 'profissionaisVinculados', 'profissionaisDesvinculados'].map((campo) => {
          const lista = d[campo]?.filter((p: any) => p?.nome) || [];
          if (lista.length === 0) return null;
          const titulo = campo === 'profissionais' ? 'Profissionais da Unidade'
            : campo === 'profissionaisVinculados' ? 'Profissionais Vinculados no Mês' : 'Profissionais Desvinculados no Mês';
          return (
            <div key={campo} className="keep-together">
              <p style={S.labelSec}>{titulo}</p>
              <table className="tb">
                <thead><tr><th>Nome</th><th>Função</th><th>Vínculo</th></tr></thead>
                <tbody>{lista.map((p: any, i: number) => (
                  <tr key={i}><td>{p.nome || '-'}</td><td>{p.funcao || '-'}</td><td>{p.vinculo || '-'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          );
        })}

        {/* ===== BLOCO I ===== */}
        <div>
          <p style={S.tituloBloco}>Bloco I — Volume de Atendimentos</p>

          <p style={S.labelSec}>A. Volume de usuários</p>
          <table className="tb">
            <tbody>
              {filtrar(d.blocoA, labelsBlocoA).map(([k, v]: any) => (
                <tr key={k}><td>{labelsBlocoA[k]}</td><td className="num">{v ?? '-'}</td></tr>
              ))}
            </tbody>
          </table>

          <p style={S.labelSec}>B. Faixa etária</p>
          <table className="tb">
            <thead><tr><th>Faixa</th><th className="num">Masc.</th><th className="num">Fem.</th></tr></thead>
            <tbody>
              {[['0 a 6 anos','B1_M','B1_F'],['07 a 14 anos','B2_M','B2_F'],['15 a 17 anos','B3_M','B3_F']].map(([lbl,mk,fk]) => (
                <tr key={lbl}><td>{lbl}</td><td className="num">{d.blocoB?.[mk] ?? '-'}</td><td className="num">{d.blocoB?.[fk] ?? '-'}</td></tr>
              ))}
            </tbody>
          </table>

          <p style={S.labelSec}>C. Deficiências</p>
          <table className="tb">
            <thead><tr><th>Tipo</th><th className="num">I</th><th className="num">II</th><th className="num">III</th></tr></thead>
            <tbody>
              {[['C1','Múltipla'],['C2','Visual'],['C3','Auditiva'],['C4','Física'],['C5','Mental/Psiquiátrico'],['C6','TEA']].map(([ck,lbl]) => (
                <tr key={ck}><td>{lbl}</td>
                  {['I','II','III'].map(g => <td key={g} className="num">{d.blocoC?.[ck]?.[g] ?? '-'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>

          <p style={S.labelSec}>D. Cor / Raça</p>
          <table className="tb">
            <thead><tr><th></th><th className="num">Fem.</th><th className="num">Masc.</th></tr></thead>
            <tbody>
              {[['D1','Branco'],['D2','Pardo'],['D3','Preto'],['D4','Amarelo'],['D5','Indígena'],['D6','Imigrantes']].map(([dk,lbl]) => (
                <tr key={dk}><td>{lbl}</td>
                  <td className="num">{d.blocoD?.[dk]?.feminino ?? '-'}</td>
                  <td className="num">{d.blocoD?.[dk]?.masculino ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={S.labelSec}>E. Tempo de acolhimento</p>
          <table className="tb">
            <tbody>
              {[['menos_1m','< 1 mês'],['1a6m','1 a 6 meses'],['7a12m','7 a 12 meses'],['1a2a','1 a 2 anos'],['3a5a','3 a 5 anos'],['6a8a','6 a 8 anos'],['acima_9a','> 9 anos']].map(([ek,lbl]) => (
                <tr key={ek}><td>{lbl}</td><td className="num">{d.blocoE?.[ek] ?? '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== BLOCO II ===== */}
        <div>
          <p style={S.tituloBloco}>Bloco II — Atividades Realizadas</p>

          <p style={S.labelSec}>F. Volume de atividades</p>
          <table className="tb">
            <tbody>
              {filtrar(d.blocoF, labelsBlocoF).map(([k, v]: any) => (
                <tr key={k}><td>{labelsBlocoF[k]}</td><td className="num">{v ?? '-'}</td></tr>
              ))}
            </tbody>
          </table>

          <p style={S.labelSec}>G. Encaminhamentos</p>
          <table className="tb">
            <tbody>
              {filtrar(d.blocoG, labelsBlocoG).map(([k, v]: any) => (
                <tr key={k}><td>{labelsBlocoG[k]}</td><td className="num">{v ?? '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== BLOCO III ===== */}
        <div>
          <p style={S.tituloBloco}>Bloco III — Descrição das Atividades</p>

          <p style={S.labelSec}>H.1. Atividades realizadas no mês</p>
          <p className="report-text" style={{ whiteSpace: 'pre-wrap' }}>
            {d.blocoH?.descricao || 'N/A'}
          </p>

          {imagens.length > 0 && (
            <div>
              <p style={{ ...S.labelSec, marginTop: 16 }}>Registro fotográfico por categoria</p>
              {Object.entries(categoriasImagem).map(([cat, catLabel]) => {
                const catImgs = imagens.filter((i) => i.categoria === cat);
                if (catImgs.length === 0) return null;
                return (
                  <div key={cat} className="keep-together" style={{ marginBottom: 12 }}>
                    <p style={{ fontWeight: 600, fontSize: 10.5, margin: '0 0 4px', color: '#333' }}>
                      {catLabel} <span style={{ fontWeight: 400, color: '#999' }}>({catImgs.length})</span>
                    </p>
                    <div className="img-grid">
                      {catImgs.map((img: any) => (
                        <div key={img.id} style={{
                          width: 160, height: 160, overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 6, border: '1px solid #bbb',
                        }}>
                          <img
                            src={img.url || `${IMG_BASE}/${img.filename}`}
                            alt={img.original_name}
                            style={{
                              maxWidth: '100%', maxHeight: '100%',
                              objectFit: 'contain',
                              transform: `rotate(${img.rotation || 0}deg)`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== BLOCO IV ===== */}
        <div>
          <p style={S.tituloBloco}>Bloco IV — Informações Complementares</p>

          {[
            ['limites', 'I.1. Limites e dificuldades enfrentadas no mês'],
            ['avancos', 'I.2. Avanços'],
            ['aquisicao', 'I.3. Aquisição do mês'],
          ].map(([campo, titulo]) => (
            <div key={campo} className="keep-together">
              <p style={S.labelSec}>{titulo}</p>
              {d.blocoI?.[campo] && d.blocoI[campo].length > 100
                ? d.blocoI[campo].split('\n').filter((l: string) => l.trim()).map((par: string, i: number) => (
                    <p key={i} className="report-text">{par}</p>
                  ))
                : <p className="report-text">{d.blocoI?.[campo] || 'N/A'}</p>
              }
            </div>
          ))}

          <div className="keep-together">
            <p style={S.labelSec}>I.4. Capacitações da equipe</p>
            {(d.blocoI?.capacitacoes?.filter((c: any) => c?.nome || c?.nome_capacitacao)?.length || 0) > 0 ? (
              <table className="tb">
                <thead><tr><th>Profissional</th><th>Capacitação</th></tr></thead>
                <tbody>
                  {d.blocoI.capacitacoes.filter((c: any) => c?.nome || c?.nome_capacitacao).map((c: any, i: number) => (
                    <tr key={i}><td>{c.nome || '-'}</td><td>{c.nome_capacitacao || '-'}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ fontSize: 11, color: '#999' }}>N/A</p>}
          </div>
        </div>

        {/* ===== ASSINATURAS ===== */}
        <div className="keep-together" style={{
          margin: '24px 0 0', padding: '20px 0', textAlign: 'center',
          borderTop: '2px solid #1a3a5c', background: '#fafbfc',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 60 }}>
            <div style={{ textAlign: 'center', minWidth: 200 }}>
              <p style={{ margin: '30px 0 4px', borderTop: '1px solid #333', paddingTop: 6, width: '80%', marginLeft: 'auto', marginRight: 'auto' }}>&nbsp;</p>
              <p style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>Técnica Responsável</p>
              <p style={{ fontSize: 9, color: '#666' }}>Serviço de Acolhimento</p>
            </div>
            <div style={{ textAlign: 'center', minWidth: 200 }}>
              <p style={{ margin: '30px 0 4px', borderTop: '1px solid #333', paddingTop: 6, width: '80%', marginLeft: 'auto', marginRight: 'auto' }}>&nbsp;</p>
              <p style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>Coordenadora</p>
              <p style={{ fontSize: 9, color: '#666' }}>Lar Ebenezer</p>
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div style={{
          background: 'linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 50%, #1a5276 100%)',
          color: '#fff', padding: '14px 20mm', margin: '0',
          textAlign: 'center', fontSize: 8, lineHeight: 1.6,
        }}>
          <p style={{ margin: 0, color: '#fff' }}>
            Documento gerado em {dataAtual} — <strong>Sistema RMA</strong> — Lar Ebenezer
          </p>
          <p style={{ margin: '4px 0 0', color: '#fff', opacity: 0.7 }}>
            Relatório Mensal de Atendimento — Proteção Social Especial — Alta Complexidade
          </p>
        </div>
      </div>
    </div>
  );
}
