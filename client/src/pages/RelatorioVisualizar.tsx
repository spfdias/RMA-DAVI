import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { relatoriosApi, categoriasApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';
const IMG_BASE = API_URL + '/uploads';
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];


export default function RelatorioVisualizar() {
  const { mes: mesParam, ano: anoParam } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState<any>(null);
  const [imagens, setImagens] = useState<any[]>([]);
  const [relatorioId, setRelatorioId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    categoriasApi.listar().then((data) => {
      if (Array.isArray(data)) setCategorias(data);
    });
  }, []);

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
    if (!confirm(`Tem certeza que deseja remover TODAS as ${imagens.length} imagem(ns)?`)) return;
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

  const dataAtual = new Date().toLocaleDateString('pt-BR');

  const S = {
    section: { marginBottom: 18 },
    label: { fontWeight: 700, fontSize: '10pt', margin: '14px 0 6px' },
    obs: { fontSize: '9pt', margin: '6px 0 10px', fontStyle: 'italic' as const },
  };

  const labelBlocoA: Record<string, string> = {
    A1: 'A.1. Capacidade total de usuários na Unidade',
    A2: 'A.2. Total de usuários acolhidos na Unidade',
    A3: 'A.3. Total de usuários conveniados /SEMAS',
    A4: 'A.4. Total de usuários conveniados/SEMAS acolhidos na Unidade',
    A5: 'A.5. Novos usuários inseridos no mês',
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }} className="no-print">
        <button onClick={() => window.print()}
          style={{ background: '#1a237e', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Imprimir / Exportar PDF
        </button>
        <button onClick={() => navigate(`/relatorios/${mesParam}/${anoParam}`)}
          style={{ background: '#fff', color: '#1a237e', border: '1px solid #1a237e', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Editar
        </button>
        {user?.role === 'admin' && imagens.length > 0 && (
          <button onClick={handleRemoverTodasImagens}
            style={{ background: '#c62828', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Limpar imagens ({imagens.length})
          </button>
        )}
      </div>

      {/* ===== HEADER IMAGE - outside content container for reliable print ===== */}
      <div id="header-print">
        <img src="/CabecalhoReport.jpg" alt="Cabeçalho" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      <div id="relatorio-print" style={{
        fontSize: '10pt', lineHeight: 1.5, color: '#000',
      }}>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, 'Times New Roman', serif; }
          @page { margin: 32mm 15mm 25mm; size: A4; }
          @media print {
            body { font-family: Arial, 'Times New Roman', serif; color: #000; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            aside, .sidebar, nav[class*="sidebar"], header[class*="sidebar"] { display: none !important; }
            main { background: #fff !important; padding: 0 !important; margin: 0 !important; }
            .no-print { display: none !important; }
            .keep-together { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr, thead { page-break-inside: avoid; }
            .td-descricao { height: auto !important; overflow: visible !important; white-space: pre-wrap; }
            textarea { display: block; width: 100%; border: none; height: auto !important; overflow: visible !important; white-space: pre-wrap; }
            #header-print { position: fixed; top: 0; left: 0; right: 0; text-align: center; background: #fff; z-index: 1000; }
            #header-print img { width: 100%; height: auto; display: block; }
            #footer-print { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; background: #fff; border-top: 1px solid #999; font-size: 7.5pt; line-height: 1.6; height: 15mm; }
            #relatorio-print { padding-top: 80px; padding-bottom: 40px; }
            .tb th, .tb .section-title, .tb tr[style*="background"] { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .tb-a6p { margin-top: 100px !important; }
            .bloco-d { margin-top: 100px !important; }
            .bloco-g { margin-top: 150px !important; }
            .img-print-page { page-break-before: always; margin-top: 100px !important; }
            .img-tbl td { height: 170px !important; }
          }
          @media screen {
            #header-print { max-width: 210mm; margin: 0 auto; background: #fff; border-radius: 4px 4px 0 0; }
            #header-print img { width: 100%; height: auto; display: block; border-radius: 4px 4px 0 0; }
            #relatorio-print { background: #fff; padding: 8mm 15mm 20mm; border-radius: 0 0 4px 4px; box-shadow: 0 1px 12px rgba(0,0,0,0.12); max-width: 210mm; margin: 0 auto; font-family: Arial, 'Times New Roman', serif; }
          }
          .tb { width: 100%; border-collapse: collapse; margin: 8px 0 14px; }
          .tb th, .tb td { border: 1px solid #000; padding: 5px 8px; font-size: 9pt; vertical-align: top; text-align: left; }
          .tb th { background: #5B9BD5; color: #fff; font-weight: 700; text-align: center; text-transform: uppercase; }
          .tb .num { text-align: center; width: 50px; }
          .tb .num-sm { text-align: center; width: 40px; }
          .tb .section-title { background: #5B9BD5; color: #fff; font-weight: 700; text-align: center; text-transform: uppercase; font-size: 10pt; }
          .img-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .img-tbl td { width: 25%; padding: 4px; text-align: center; vertical-align: middle; border: none; }
          .categoria-titulo { break-after: avoid; page-break-after: avoid; }
        `}</style>

        {/* ===== HEADER TITLE (first page only) ===== */}
        <div className="keep-together avoid-break" style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #000', background: '#5B9BD5', color: '#fff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <p style={{ fontSize: '13pt', fontWeight: 700, lineHeight: 1.4, padding: '12px 0 16px' }}>
            RELATÓRIO MENSAL DE ATENDIMENTO<br />
            PROTEÇÃO SOCIAL ESPECIAL – ALTA COMPLEXIDADE<br />
            SERVIÇO DE ACOLHIMENTO INSTITUCIONAL<br />
            LAR EBENEZER
          </p>
        </div>

        {/* ===== IDENTIFICAÇÃO ===== */}
        <div className="keep-together avoid-break" style={S.section}>
          <table className="tb">
            <tbody>
              <tr>
                <td style={{ width: '35%', fontWeight: 700 }}>Mês e Ano de Referência:</td>
                <td>{mesAnoLabel}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Nome da Unidade:</td>
                <td>{val('identificacao.unidade') || 'Lar Ebenezer'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Endereço:</td>
                <td>{val('identificacao.endereco') || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Telefone:</td>
                <td>{val('identificacao.telefone') || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Email:</td>
                <td>{val('identificacao.email') || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Município: DOURADOS</td>
                <td>UF: MS</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== PROFISSIONAIS (merged table as in template) ===== */}
        <div className="keep-together" style={S.section}>
          <table className="tb">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>NOME DO PROFISSIONAL</th>
                <th style={{ width: '30%' }}>FUNÇÃO</th>
                <th style={{ width: '30%' }}>TIPO DE VÍNCULO</th>
              </tr>
            </thead>
            <tbody>
              {(d.profissionais?.filter((p: any) => p?.nome)?.length
                ? d.profissionais.filter((p: any) => p?.nome)
                : [{ nome: '', funcao: '', vinculo: '' }]
              ).map((p: any, i: number) => (
                <tr key={`p-${i}`}>
                  <td>{p.nome || '-'}</td>
                  <td>{p.funcao || '-'}</td>
                  <td>{p.vinculo || '-'}</td>
                </tr>
              ))}

              <tr style={{ background: '#e8e8e8' }}>
                <td style={{ fontWeight: 700, border: '1px solid #000' }} colSpan={3}>
                  NOME DO PROFISSIONAL VINCULADO NO MÊS
                </td>
              </tr>
              {(d.profissionaisVinculados?.filter((p: any) => p?.nome)?.length
                ? d.profissionaisVinculados.filter((p: any) => p?.nome)
                : [{ nome: '', funcao: '', vinculo: '' }]
              ).map((p: any, i: number) => (
                <tr key={`pv-${i}`}>
                  <td>{p.nome || '-'}</td>
                  <td>{p.funcao || '-'}</td>
                  <td>{p.vinculo || '-'}</td>
                </tr>
              ))}

              <tr style={{ background: '#e8e8e8' }}>
                <td style={{ fontWeight: 700, border: '1px solid #000' }} colSpan={3}>
                  NOME DO PROFISSIONAL DESVINCULADO NO MÊS
                </td>
              </tr>
              {(d.profissionaisDesvinculados?.filter((p: any) => p?.nome)?.length
                ? d.profissionaisDesvinculados.filter((p: any) => p?.nome)
                : [{ nome: '', funcao: '', vinculo: '' }]
              ).map((p: any, i: number) => (
                <tr key={`pd-${i}`}>
                  <td>{p.nome || '-'}</td>
                  <td>{p.funcao || '-'}</td>
                  <td>{p.vinculo || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={S.obs}>
            OBS: Quando o Profissional Vinculado no Mês é necessário em anexo a ficha do contendo as informações RH para cadastro no SISTEMA MDS/GSI (solicitar no DGSUAS a ficha com as informações necessária, caso não tenha.)
          </p>
        </div>

        {/* ===== BLOCO I ===== */}
        <div style={S.section}>
          <table className="tb">
            <tbody>
              <tr className="section-title">
                <td style={{ fontSize: '11pt' }} colSpan={2}>
                  Bloco I – Volume de Atendimentos
                </td>
              </tr>
              <tr style={{ background: '#5B9BD5', color: '#fff' }}>
                <td style={{ fontWeight: 700, width: '80%' }}>A. Volume de usuários</td>
                <td style={{ fontWeight: 700, textAlign: 'center', width: '20%' }}>Total</td>
              </tr>

              {Object.entries(labelBlocoA).map(([k, lbl]) => (
                <tr key={k}>
                  <td>{lbl}</td>
                  <td className="num">{d.blocoA?.[k] ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="tb tb-a6p" style={{ pageBreakBefore: 'always', marginTop: 0 }}>
            <tbody>
              <tr>
                <td style={{ padding: '5px 8px', fontSize: '9pt', verticalAlign: 'top', width: '80%' }}>
                  A.6. Total de usuários desligados<br />
                  {[
                    ['A6_familia_extensa', 'Família extensa'],
                    ['A6_familia_origem', 'Família de origem'],
                    ['A6_familia_substituta', 'Família substituta'],
                    ['A6_maioridade', 'Maioridade'],
                    ['A6_falecimento', 'Falecimento'],
                    ['A6_transferencia', 'Transferida para outra unidade'],
                  ].map(([key, label]) => {
                    const v = d.blocoA?.[key] ?? 0;
                    return (
                      <div key={key} style={{ marginBottom: 2, fontSize: '9pt', whiteSpace: 'nowrap' }}>
                        {v > 0 ? '( X )' : '(   )'} {label}{v > 0 ? ` (${v})` : ''}
                      </div>
                    );
                  })}
                </td>
                <td className="num" style={{ width: '20%' }}>-</td>
              </tr>
            </tbody>
          </table>

          <p style={S.obs}>OBS: A.6. especificar entre parênteses a quantidade</p>

          {/* B. Faixa etária */}
          <table className="tb">
            <thead>
              <tr style={{ background: '#5B9BD5', color: '#fff' }}>
                <th style={{ width: '60%' }}>B. Faixa etária dos usuários conveniados/SEMAS</th>
                <th style={{ width: '20%' }}>Masculino</th>
                <th style={{ width: '20%' }}>Feminino</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['B1', 'B.1.  0 a 6 anos', 'B1_M', 'B1_F'],
                ['B2', 'B.2.  07 a 14 anos', 'B2_M', 'B2_F'],
                ['B3', 'B.3  15 a 17 anos', 'B3_M', 'B3_F'],
              ].map(([id, lbl, mk, fk]) => (
                <tr key={id}>
                  <td style={{ paddingLeft: 20 }}>{lbl}</td>
                  <td className="num">{d.blocoB?.[mk] ?? '-'}</td>
                  <td className="num">{d.blocoB?.[fk] ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* C. Deficiências */}
          <table className="tb">
            <tbody>
              <tr style={{ background: '#5B9BD5', color: '#fff' }}>
                <td style={{ fontWeight: 700 }} rowSpan={2}>C. - Deficiências dos usuários conveniados/SEMAS</td>
                <td style={{ fontWeight: 700, textAlign: 'center' }} colSpan={3}>Total / Grau de dependência</td>
              </tr>
              <tr style={{ background: '#5B9BD5', color: '#fff' }}>
                <td style={{ fontWeight: 700, textAlign: 'center', width: '12%' }}>I</td>
                <td style={{ fontWeight: 700, textAlign: 'center', width: '12%' }}>II</td>
                <td style={{ fontWeight: 700, textAlign: 'center', width: '12%' }}>III</td>
              </tr>
              {[
                ['C1', 'C.1. Deficiência múltipla (uma ou mais deficiências)'],
                ['C2', 'C.2. Deficiência visual'],
                ['C3', 'C.3. Deficiência auditiva'],
                ['C4', 'C.4. Deficiência física'],
                ['C5', 'C.5. Transtorno mental e ou psiquiatrico'],
                ['C6', 'C.6 TEA (Transtorno Espectro Autista)'],
              ].map(([ck, lbl]) => (
                <tr key={ck}>
                  <td>{lbl}</td>
                  {['I', 'II', 'III'].map(g => (
                    <td key={g} className="num">{d.blocoC?.[ck]?.[g] ?? '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <p style={S.obs}>OBS: Especificar a quantidade em cada grau de dependência</p>
          <p style={{ fontSize: '9pt', margin: '4px 0' }}>
            <strong>GRAU DE DEPENDÊNCIA I</strong> – Idosos independentes, mesmo que requeiram uso de equipamento de auto-ajuda
          </p>
          <p style={{ fontSize: '9pt', margin: '4px 0' }}>
            <strong>GRAU DE DEPENDÊNCIA II</strong> – Idosos com dependência em até três atividades de autocuidado para a vida diária
          </p>
          <p style={{ fontSize: '9pt', margin: '4px 0 12px' }}>
            <strong>GRAU DE DEPENDÊNCIA III</strong> – Idosos com dependência que requeiram assistência em todas as atividades de autocuidado para a vida diária e/ ou com comprometimento cognitivo
          </p>

          {/* D. Cor / Raça */}
          <div className="keep-together bloco-d" style={{ pageBreakBefore: 'always' }}>
            <table className="tb">
              <thead>
                <tr className="section-title">
                  <th style={{ fontSize: '10pt' }} colSpan={3}>D. Cor ou raça/ nacionalidade dos usuários conveniados/SEMAS</th>
                </tr>
                <tr style={{ background: '#5B9BD5', color: '#fff' }}>
                  <th style={{ width: '60%' }}>&nbsp;</th>
                  <th style={{ width: '20%' }}>Feminino</th>
                  <th style={{ width: '20%' }}>Masculino</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['D1', 'D.1. Branco'],
                  ['D2', 'D.2. Pardo'],
                ].map(([dk, lbl]) => (
                  <tr key={dk}>
                    <td>{lbl}</td>
                    <td className="num">{d.blocoD?.[dk]?.feminino ?? '-'}</td>
                    <td className="num">{d.blocoD?.[dk]?.masculino ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="tb" style={{ marginTop: 0 }}>
              <tbody>
                {[
                  ['D3', 'D.3. Preto'],
                  ['D4', 'D.4. Amarelo'],
                  ['D5', 'D.5. Indígena'],
                  ['D6', 'D.6. Imigrantes. Especifique a nacionalidade\nPaís:'],
                ].map(([dk, lbl]) => (
                  <tr key={dk}>
                    <td style={{ width: '60%' }}>{lbl}</td>
                    <td className="num">{d.blocoD?.[dk]?.feminino ?? '-'}</td>
                    <td className="num">{d.blocoD?.[dk]?.masculino ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* E. Tempo de acolhimento */}
          <div className="keep-together" style={{ pageBreakBefore: 'auto', marginBottom: 4, paddingBottom: 0 }}>
            <p style={{ ...S.label, pageBreakAfter: 'avoid' }}>E. Informe há quanto tempo os conveniados/SEMAS estão acolhidos na Unidade</p>
            <table className="tb">
              <thead>
                <tr>
                  {[
                    'Menos de 1 mês', '1 a 6 meses', '7 a 12 meses',
                    '1 a 2 anos', '3 a 5 anos', '6 a 8 anos', 'Acima 9 anos',
                  ].map((lbl, i) => (
                    <th key={i} style={{ fontSize: '8pt' }}>{lbl}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[
                    'menos_1m', '1a6m', '7a12m', '1a2a', '3a5a', '6a8a', 'acima_9a',
                  ].map((ek) => (
                    <td key={ek} className="num">{d.blocoE?.[ek] ?? '-'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== BLOCO II – ATIVIDADES ===== */}
        <div style={{ ...S.section, pageBreakBefore: 'avoid' }}>
          <div className="keep-together" style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
            <table className="tb" style={{ marginBottom: 0 }}>
              <tbody>
                <tr className="section-title">
                  <td style={{ fontSize: '11pt' }} colSpan={2}>
                    Bloco II – Atividades realizadas com os usuários conveniados/SEMAS
                  </td>
                </tr>
                <tr style={{ background: '#5B9BD5', color: '#fff' }}>
                  <td style={{ fontWeight: 700, width: '80%' }}>F. Volume de atividades realizadas</td>
                  <td style={{ fontWeight: 700, textAlign: 'center', width: '20%' }}>Total</td>
                </tr>
              </tbody>
            </table>
          </div>
          <table className="tb" style={{ marginTop: 0, borderTop: 'none' }}>
            <tbody>
              {[
                ['F1', 'F.1. Total de atendimentos individualizados realizados pela equipe técnica'],
                ['F2', 'F.2. Total de atendimentos em grupo realizados pela equipe técnica'],
                ['F3', 'F.3. Oficinas/palestras com os usuários'],
                ['F4', 'F.4. Passeios com os usuários'],
                ['F5', 'F.5. Datas comemorativas/ Aniversariantes do mês/ Eventos'],
                ['F6', 'F.6. Visitas domiciliares'],
                ['F7', 'F.7. Total de atendimentos individualizados realizados pela equipe técnica aos familiares'],
                ['F8', 'F.8. Visitas dos familiares na Unidade'],
                ['F9', 'F.9. Reunião de equipe'],
                ['F10', 'F.10. Reunião com a rede socioassistencial/intersetorial'],
                ['F11', 'F.11. Participação em audiências'],
                ['F12', 'F.12. Atendimento remoto'],
              ].map(([fk, lbl]) => (
                <tr key={fk}>
                  <td>{lbl}</td>
                  <td className="num">{d.blocoF?.[fk] ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="keep-together bloco-g" style={{ pageBreakBefore: 'always' }}>
            <p style={{ fontSize: '9pt', marginLeft: 20 }}>F.4. Quantidade de passeios</p>
            <p style={{ fontSize: '9pt', marginLeft: 20, marginBottom: 14 }}>F.5 Quantidade de atividades realizadas</p>
            <table className="tb" style={{ marginTop: 0 }}>
              <tbody>
                <tr className="section-title">
                  <td style={{ fontSize: '11pt' }} colSpan={2}>
                    Bloco II – Encaminhamentos aos usuários conveniados/SEMAS
                  </td>
                </tr>
                <tr style={{ background: '#5B9BD5', color: '#fff' }}>
                  <td style={{ fontWeight: 700, width: '80%' }}>G. Volume de encaminhamentos</td>
                  <td style={{ fontWeight: 700, textAlign: 'center', width: '20%' }}>Total</td>
                </tr>
                {[
                  ['G1', 'G.1. Encaminhamentos realizados para o mercado de trabalho'],
                  ['G2', 'G.2. Encaminhamentos realizados para cursos de qualificação'],
                  ['G3', 'G.3. Encaminhamentos realizados para outras políticas públicas (saúde, educação)'],
                  ['G4', 'G.4. Encaminhamentos realizados para a rede socioassistencial (famílias)'],
                  ['G5', 'G.5. Encaminhamentos de documentos e relatórios para Fórum e MP'],
                  ['G6', 'G.6. Outros. Especifique'],
                ].map(([gk, lbl]) => (
                  <tr key={gk}>
                    <td>{lbl}</td>
                    <td className="num">{d.blocoG?.[gk] ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== BLOCO III – DESCRIÇÃO ===== */}
        <div style={S.section}>
          <div className="keep-together" style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
            <table className="tb" style={{ marginBottom: 0 }}>
              <tbody>
                <tr>
                  <td className="section-title" style={{ fontSize: '11pt', background: '#5B9BD5', color: '#fff', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase' }}>
                    Bloco III – Descrição das atividades mensal realizadas com os usuários/SEMAS
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, background: '#5B9BD5', color: '#fff', borderBottom: 'none' }}>H. Descrição das atividades</td>
                </tr>
              </tbody>
            </table>
          </div>
          <table className="tb" style={{ marginTop: 0, borderTop: 'none', breakInside: 'auto', pageBreakInside: 'auto' }}>
            <tbody>
              <tr>
                <td className="td-descricao" style={{ minHeight: 60, padding: '10px 8px', lineHeight: 1.6, textAlign: 'justify', borderTop: 'none', breakInside: 'auto', pageBreakInside: 'auto' }}>
                  <p style={{ marginBottom: 6, fontWeight: 600 }}>H.1. Descreva quais atividades os usuários realizaram durante o mês (convivência, socioeducativa, passeios, visitas a outros locais, atendimento médico, atividades da vida diária, para independência, de auto cuidado, cursos, etc)</p>
                  {d.blocoH?.descricao || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>

          {imagens.length > 0 && (
            <div className="img-print-page">
              <p style={{ ...S.label, marginTop: 16 }}>Registro fotográfico</p>
              {categorias.map((cat) => {
                const catImgs = imagens.filter((i) => i.categoria === cat.value);
                if (catImgs.length === 0) return null;

                // Divide as imagens da categoria em linhas de 4, para que cada
                // linha seja tratada como um bloco atômico na impressão
                // (o flex-wrap sozinho não é reconhecido como "linhas" pelo
                // motor de paginação do navegador).
                const IMAGES_PER_ROW = 4;
                const rows: any[][] = [];
                for (let i = 0; i < catImgs.length; i += IMAGES_PER_ROW) {
                  rows.push(catImgs.slice(i, i + IMAGES_PER_ROW));
                }

                return (
                  <div key={cat.value} className="keep-together" style={{ marginBottom: 12 }}>
                    <p className="categoria-titulo" style={{ fontWeight: 700, fontSize: '10pt', margin: '0 0 4px' }}>
                      {cat.label} ({catImgs.length})
                    </p>
                    {rows.map((linha, rowIndex) => (
                      <table key={rowIndex} className="img-tbl">
                        <tbody>
                          <tr style={{ pageBreakInside: 'avoid' }}>
                            {linha.map((img: any) => (
                              <td key={img.id} style={{ width: '25%', padding: 4, textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', height: 160 }}>
                                <img
                                  src={img.data || img.url || `${IMG_BASE}/${img.filename}`}
                                  alt={img.original_name}
                                  style={{
                                    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                                    transform: `rotate(${img.rotation || 0}deg)`,
                                  }}
                                />
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== BLOCO IV ===== */}
        <div style={{ ...S.section, pageBreakBefore: 'always' }}>
          <div className="keep-together" style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
            <table className="tb" style={{ marginBottom: 0 }}>
              <tbody>
                <tr className="section-title">
                  <td style={{ fontSize: '11pt' }} colSpan={2}>
                    Bloco IV – Informações complementares
                  </td>
                </tr>
                <tr style={{ background: '#5B9BD5', color: '#fff' }}>
                  <td style={{ fontWeight: 700, textAlign: 'center' }} colSpan={2}>I. Informações</td>
                </tr>
              </tbody>
            </table>
          </div>
          <table className="tb" style={{ marginTop: 0, borderTop: 'none' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, width: '40%', verticalAlign: 'top' }}>I.1. Limites e dificuldades enfrentadas no mês:</td>
                <td className="td-descricao" style={{ width: '60%', textAlign: 'justify' }}>{d.blocoI?.limites || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, verticalAlign: 'top' }}>I.2. Avanços:</td>
                <td className="td-descricao" style={{ textAlign: 'justify' }}>{d.blocoI?.avancos || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, verticalAlign: 'top' }}>I.3. Aquisição do mês:</td>
                <td style={{ textAlign: 'justify' }}>{d.blocoI?.aquisicao || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, verticalAlign: 'top' }}>I.4. A equipe participou de alguma capacitação este mês:</td>
                <td style={{ textAlign: 'justify' }}>
                  {(d.blocoI?.capacitacoes?.filter((c: any) => c?.nome || c?.nome_capacitacao)?.length || 0) > 0
                    ? d.blocoI.capacitacoes.filter((c: any) => c?.nome || c?.nome_capacitacao).map((c: any, i: number) => (
                        <span key={i}>{c.nome || '-'} — {c.nome_capacitacao || '-'}{i < d.blocoI.capacitacoes.filter((cx: any) => cx?.nome || cx?.nome_capacitacao).length - 1 ? '; ' : ''}</span>
                      ))
                    : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>

          {(d.blocoI?.capacitacoes?.filter((c: any) => c?.nome || c?.nome_capacitacao)?.length || 0) > 0 && (
            <table className="tb" style={{ marginTop: 4 }}>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Nome do Profissional</th>
                  <th style={{ width: '50%' }}>Nome da Capacitação</th>
                </tr>
              </thead>
              <tbody>
                {d.blocoI.capacitacoes.filter((c: any) => c?.nome || c?.nome_capacitacao).map((c: any, i: number) => (
                  <tr key={i}>
                    <td>{c.nome || '-'}</td>
                    <td>{c.nome_capacitacao || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ===== ASSINATURAS ===== */}
        <div className="keep-together" style={{ marginTop: 30, paddingTop: 10, textAlign: 'center' }}>
          <p style={{ marginTop: 40, borderTop: '1px solid #000', paddingTop: 4, width: '60%', marginLeft: 'auto', marginRight: 'auto' }}>&nbsp;</p>
          <p style={{ fontSize: '10pt', fontWeight: 700 }}>Técnica responsável</p>

          <p style={{ marginTop: 40, borderTop: '1px solid #000', paddingTop: 4, width: '60%', marginLeft: 'auto', marginRight: 'auto' }}>&nbsp;</p>
          <p style={{ fontSize: '10pt', fontWeight: 700 }}>Coordenadora</p>
        </div>

        {/* ===== FOOTER ===== */}
        <div id="footer-print" style={{ textAlign: 'center', fontSize: '7.5pt', lineHeight: 1.6, padding: '4px 0', borderTop: '1px solid #999' }}>
          <div style={{ color: '#1a3a6b', fontWeight: 600 }}>www.dourados.ms.gov.br/index.php/categoria/semas/</div>
          <div style={{ color: '#2a2a2a' }}>Rua Coronel Ponciano, 1700 . Pq. do Jequitibás . Bloco Anexo . 79830-200 . Dourados-MS</div>
          <div>
            <span style={{ color: '#1a3a6b', fontWeight: 600 }}>67 3411-7710 / 3411-7746</span>
            <span style={{ color: '#2a2a2a' }}> . semas@dourados.ms.gov.br</span>
          </div>
        </div>
      </div>
    </div>
  );
}
