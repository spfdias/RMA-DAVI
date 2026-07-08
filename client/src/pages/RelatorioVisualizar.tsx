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
    pg: { margin: 0, fontSize: 12, lineHeight: 1.5, color: '#1a1a1a', fontFamily: '"Segoe UI", Roboto, Arial, sans-serif' },
    tituloBloco: { fontSize: 13, fontWeight: 700, color: '#0d1b4a', borderBottom: '2px solid #1a237e', paddingBottom: 4, margin: '20px 0 10px' },
    labelSec: { fontWeight: 600, fontSize: 11, color: '#333', margin: '10px 0 4px' },
    tabela: { width: '100%', borderCollapse: 'collapse' as const, margin: '4px 0 10px' },
    th: { border: '1px solid #bdbdbd', padding: '5px 8px', fontSize: 10, fontWeight: 700, background: '#e8eaf6', color: '#1a237e', textAlign: 'left' as const },
    td: { border: '1px solid #bdbdbd', padding: '4px 8px', fontSize: 11 },
    tdNum: { border: '1px solid #bdbdbd', padding: '4px 8px', fontSize: 11, textAlign: 'center' as const, width: 60 },
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
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
            aside { display: none !important; }
            main { background: #fff !important; padding: 0 !important; }
            .no-print { display: none !important; }
            @page { margin: 0.6in; size: A4; }
            #relatorio-print { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; background: #fff !important; }
            .page-break { page-break-before: always; }
            .keep-together { page-break-inside: avoid; }
          }
          @media screen {
            #relatorio-print { background: #fff; padding: 36px 44px; border-radius: 8px; box-shadow: 0 1px 12px rgba(0,0,0,0.12); max-width: 210mm; margin: 0 auto; }
          }
          .tb { width: 100%; border-collapse: collapse; margin: 4px 0 10px; }
          .tb th, .tb td { border: 1px solid #bdbdbd; padding: 4px 8px; font-size: 10.5px; vertical-align: top; }
          .tb th { background: #e8eaf6; font-weight: 700; color: #1a237e; text-align: left; }
          .tb .num { text-align: center; width: 55px; }
          .img-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
          .img-grid img { width: 160px; height: 160px; object-fit: cover; border-radius: 6px; border: 1px solid #bbb; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
          @media print { .img-grid img { width: 180px; height: 180px; } }
        `}</style>

        {/* ===== CABEÇALHO EXECUTIVO ===== */}
        <div className="keep-together" style={{
          background: 'linear-gradient(135deg, #0d1b4a 0%, #1a237e 50%, #283593 100%)',
          color: '#fff', borderRadius: 6, padding: '16px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 20,
          boxShadow: '0 3px 10px rgba(13,27,74,0.3)',
        }}>
          {(
            <img src="/cabecalho.jpg" alt="Governo MS"
              style={{ width: 65, height: 65, borderRadius: 4, objectFit: 'contain', background: '#fff', padding: 4, flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 500, margin: 0, opacity: 0.8, letterSpacing: 1 }}>GOVERNO DO ESTADO DE MATO GROSSO DO SUL</p>
            <p style={{ fontSize: 11, fontWeight: 600, margin: '2px 0', letterSpacing: 0.5 }}>SECRETARIA DE ESTADO DE DIREITOS HUMANOS, ASSISTÊNCIA SOCIAL E TRABALHO</p>
            <p style={{ fontSize: 10, fontWeight: 400, margin: 0, opacity: 0.9 }}>Serviço de Acolhimento Institucional — <strong>Lar Ebenezer</strong></p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{meses[Number(mesParam) - 1]}</p>
            <p style={{ fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{anoParam}</p>
          </div>
        </div>

        {/* TÍTULO */}
        <div className="keep-together" style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0d1b4a', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
            Relatório Mensal de Atendimento
          </p>
          <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0' }}>
            Proteção Social Especial — Alta Complexidade
          </p>
          <p style={{ fontSize: 10, color: '#777', margin: '2px 0 0' }}>
            Emissão: {dataAtual}
          </p>
        </div>

        {/* IDENTIFICAÇÃO */}
        <div className="keep-together" style={{ marginBottom: 16 }}>
          <table className="tb">
            <tbody>
              <tr><td style={{ width: '30%', fontWeight: 600, background: '#f5f5f5' }}>Unidade</td><td>{val('identificacao.unidade') || 'Lar Ebenezer'}</td></tr>
              <tr><td style={{ fontWeight: 600, background: '#f5f5f5' }}>Endereço</td><td>{val('identificacao.endereco') || '-'}</td></tr>
              <tr><td style={{ fontWeight: 600, background: '#f5f5f5' }}>Telefone</td><td>{val('identificacao.telefone') || '-'}</td></tr>
              <tr><td style={{ fontWeight: 600, background: '#f5f5f5' }}>E-mail</td><td>{val('identificacao.email') || '-'}</td></tr>
              <tr><td style={{ fontWeight: 600, background: '#f5f5f5' }}>Município / UF</td><td>Dourados / MS</td></tr>
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
        <div className="page-break">
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
        <div className="page-break">
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
        <div className="page-break">
          <p style={S.tituloBloco}>Bloco III — Descrição das Atividades</p>

          <p style={S.labelSec}>H.1. Atividades realizadas no mês</p>
          <p style={{ textAlign: 'justify', margin: '0 0 16px', fontSize: 11, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
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
        <div className="page-break">
          <p style={S.tituloBloco}>Bloco IV — Informações Complementares</p>

          {[
            ['limites', 'I.1. Limites e dificuldades enfrentadas no mês'],
            ['avancos', 'I.2. Avanços'],
            ['aquisicao', 'I.3. Aquisição do mês'],
          ].map(([campo, titulo]) => (
            <div key={campo} className="keep-together">
              <p style={S.labelSec}>{titulo}</p>
              <p style={{ textAlign: 'justify', margin: '0 0 10px', fontSize: 11, whiteSpace: 'pre-wrap' }}>
                {d.blocoI?.[campo] || 'N/A'}
              </p>
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
        <div className="keep-together" style={{ marginTop: 36, paddingTop: 20 }}>
          <div style={{
            borderTop: '2px solid #1a237e', width: '60%', margin: '0 auto 24px',
            display: 'flex', justifyContent: 'space-between', gap: 40,
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ margin: '24px 0 4px', borderTop: '1px solid #333', paddingTop: 6 }}>&nbsp;</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#555' }}>Técnica Responsável</p>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ margin: '24px 0 4px', borderTop: '1px solid #333', paddingTop: 6 }}>&nbsp;</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#555' }}>Coordenadora</p>
            </div>
          </div>
          <p style={{ fontSize: 9, textAlign: 'center', color: '#999', marginTop: 8 }}>
            Documento gerado em {dataAtual} — Sistema RMA Lar Ebenezer
          </p>
        </div>
      </div>
    </div>
  );
}
