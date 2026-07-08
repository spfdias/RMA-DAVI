import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { relatoriosApi, categoriasApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = API_URL + '/api';
const IMG_BASE = API_URL + '/uploads';

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];



function Notification({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'success' ? '#e8f5e9' : '#ffebee';
  const color = type === 'success' ? '#2e7d32' : '#c62828';
  const border = type === 'success' ? '#a5d6a7' : '#ef9a9a';

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: bg, color: color, border: `1px solid ${border}`,
      padding: '14px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      maxWidth: 400, display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideIn 0.3s ease',
    }}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: 'inherit',
        cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0,
      }}>×</button>
    </div>
  );
}

interface DadosRMA {
  identificacao: { mes: number; ano: number; unidade: string; endereco: string; telefone: string; email: string };
  profissionais: { nome: string; funcao: string; vinculo: string }[];
  profissionaisVinculados: { nome: string; funcao: string; vinculo: string }[];
  profissionaisDesvinculados: { nome: string; funcao: string; vinculo: string }[];
  blocoA: Record<string, number>;
  blocoB: Record<string, number>;
  blocoC: Record<string, { I: number; II: number; III: number }>;
  blocoD: Record<string, { feminino: number; masculino: number }>;
  blocoE: Record<string, number>;
  blocoF: Record<string, number>;
  blocoG: Record<string, number>;
  blocoH: { descricao: string };
  blocoI: { limites: string; avancos: string; aquisicao: string; capacitacoes: { nome: string; nome_capacitacao: string }[] };
}

const dadosVazios: DadosRMA = {
  identificacao: { mes: new Date().getMonth() + 1, ano: new Date().getFullYear(), unidade: 'Lar Ebenezer', endereco: '', telefone: '', email: '' },
  profissionais: [{ nome: '', funcao: '', vinculo: '' }, { nome: '', funcao: '', vinculo: '' }],
  profissionaisVinculados: [{ nome: '', funcao: '', vinculo: '' }, { nome: '', funcao: '', vinculo: '' }],
  profissionaisDesvinculados: [{ nome: '', funcao: '', vinculo: '' }, { nome: '', funcao: '', vinculo: '' }],
  blocoA: { A1: 0, A2: 0, A3: 0, A4: 0, A5: 0, A6_familia_extensa: 0, A6_familia_origem: 0, A6_familia_substituta: 0, A6_maioridade: 0, A6_falecimento: 0, A6_transferencia: 0 },
  blocoB: { B1_M: 0, B1_F: 0, B2_M: 0, B2_F: 0, B3_M: 0, B3_F: 0 },
  blocoC: {
    C1: { I: 0, II: 0, III: 0 }, C2: { I: 0, II: 0, III: 0 }, C3: { I: 0, II: 0, III: 0 },
    C4: { I: 0, II: 0, III: 0 }, C5: { I: 0, II: 0, III: 0 }, C6: { I: 0, II: 0, III: 0 },
  },
  blocoD: {
    D1: { feminino: 0, masculino: 0 }, D2: { feminino: 0, masculino: 0 }, D3: { feminino: 0, masculino: 0 },
    D4: { feminino: 0, masculino: 0 }, D5: { feminino: 0, masculino: 0 }, D6: { feminino: 0, masculino: 0 },
  },
  blocoE: { menos_1m: 0, '1a6m': 0, '7a12m': 0, '1a2a': 0, '3a5a': 0, '6a8a': 0, acima_9a: 0 },
  blocoF: { F1: 0, F2: 0, F3: 0, F4: 0, F5: 0, F6: 0, F7: 0, F8: 0, F9: 0, F10: 0, F11: 0, F12: 0 },
  blocoG: { G1: 0, G2: 0, G3: 0, G4: 0, G5: 0, G6: 0 },
  blocoH: { descricao: '' },
  blocoI: { limites: '', avancos: '', aquisicao: '', capacitacoes: [{ nome: '', nome_capacitacao: '' }] },
};

export default function RelatorioMensal() {
  const { mes: mesParam, ano: anoParam } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState<DadosRMA>(dadosVazios);
  const [relatorioId, setRelatorioId] = useState<number | null>(null);
  const [imagens, setImagens] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<{ value: string; label: string; icon: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { user } = useAuth();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const saveCount = useRef(0);

  const showNotify = useCallback((type: 'success' | 'error', message: string) => {
    setNotify({ type, message });
  }, []);

  const closeNotify = useCallback(() => {
    setNotify(null);
  }, []);

  function triggerFilePicker(categoria: string) {
    fileInputRefs.current[categoria]?.click();
  }

  useEffect(() => {
    categoriasApi.listar().then((data) => {
      if (Array.isArray(data)) setCategorias(data);
    });
  }, []);

  useEffect(() => {
    if (mesParam && anoParam) {
      relatoriosApi.listar({ mes: Number(mesParam), ano: Number(anoParam) }).then((data) => {
        if (data.dados && Object.keys(data.dados).length > 0) {
          setDados({ ...dadosVazios, ...data.dados });
        } else {
          setDados((prev) => ({ ...prev, identificacao: { ...prev.identificacao, mes: Number(mesParam), ano: Number(anoParam) } }));
        }
        if (data.id) setRelatorioId(data.id);
        if (data.imagens) setImagens(data.imagens);
      });
    }
  }, [mesParam, anoParam]);

  function atualizar(caminho: string, valor: any) {
    setDados((prev) => {
      const novo = structuredClone(prev);
      const keys = caminho.split('.');
      let obj: any = novo;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = valor;
      return novo;
    });
  }

  async function handleSalvar() {
    saveCount.current += 1;
    const attempt = saveCount.current;
    console.log(`[Save #${attempt}] Iniciando salvamento...`, {
      mes: dados.identificacao.mes,
      ano: dados.identificacao.ano,
    });

    setSaving(true);
    setNotify(null);
    try {
      const payload = {
        mes: dados.identificacao.mes,
        ano: dados.identificacao.ano,
        dados,
      };
      console.log(`[Save #${attempt}] Enviando...`);
      const result = await relatoriosApi.salvar(payload);
      console.log(`[Save #${attempt}] Resposta:`, result);
      setRelatorioId(result.id);
      showNotify('success', `Relatório de ${meses[payload.mes - 1]}/${payload.ano} salvo com sucesso!`);
    } catch (err: any) {
      console.error(`[Save #${attempt}] ERRO:`, err);
      const msg = err.response?.data?.error || err.message || 'Erro ao salvar relatório';
      showNotify('error', msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(categoria: string, files: FileList | null) {
    if (!files || files.length === 0 || !relatorioId) return;
    const filesArray = Array.from(files);
    setUploading(categoria);
    try {
      const novas = await relatoriosApi.uploadImagens(relatorioId, categoria, filesArray);
      setImagens((prev) => [...prev, ...novas]);
      showNotify('success', `${files.length} imagem(ns) adicionada(s) em "${categorias.find(c => c.value === categoria)?.label}"`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao enviar imagens';
      showNotify('error', msg);
    } finally {
      setUploading(null);
      if (fileInputRefs.current[categoria]) {
        fileInputRefs.current[categoria]!.value = '';
      }
    }
  }

  async function handleRemoverImagem(imagemId: number) {
    try {
      await relatoriosApi.removerImagem(imagemId);
      setImagens((prev) => prev.filter((i) => i.id !== imagemId));
    } catch {
      showNotify('error', 'Erro ao remover imagem');
    }
  }

  async function handleRotacionarImagem(imagemId: number, rotationAtual: number) {
    const novaRotacao = (rotationAtual + 90) % 360;
    try {
      const atualizada = await relatoriosApi.rotacionarImagem(imagemId, novaRotacao);
      setImagens((prev) => prev.map((i) => i.id === imagemId ? { ...i, rotation: novaRotacao } : i));
    } catch {
      showNotify('error', 'Erro ao rotacionar imagem');
    }
  }

  async function handleRemoverTodasImagens() {
    if (!relatorioId) return;
    const total = imagens.length;
    if (total === 0) return;
    if (!confirm(`Tem certeza que deseja remover TODAS as ${total} imagem(ns) deste relatório? As imagens serão apagadas permanentemente do servidor.`)) return;
    try {
      await relatoriosApi.removerTodasImagens(relatorioId);
      setImagens([]);
      showNotify('success', `${total} imagem(ns) removida(s) com sucesso!`);
    } catch {
      showNotify('error', 'Erro ao remover imagens');
    }
  }

  const mesAtual = dados.identificacao.mes;
  const anoAtual = dados.identificacao.ano;

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 };
  const inputNum = { ...inputStyle, width: 80, textAlign: 'center' as const };
  const sectionStyle = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20 };
  const sectionTitle = { fontSize: 16, fontWeight: 700, color: '#1a237e', margin: '0 0 16px', paddingBottom: 8, borderBottom: '2px solid #e8eaf6' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1a237e' }}>
          Relatório Mensal de Atendimento
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={mesAtual} onChange={(e) => atualizar('identificacao.mes', Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}>
            {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={anoAtual} onChange={(e) => atualizar('identificacao.ano', Number(e.target.value))}
            style={{ ...inputStyle, width: 90 }} />
        </div>
      </div>

      {notify && <Notification type={notify.type} message={notify.message} onClose={closeNotify} />}

      {/* IDENTIFICAÇÃO */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Identificação da Unidade</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Nome da Unidade</label><input value={dados.identificacao.unidade} onChange={(e) => atualizar('identificacao.unidade', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Endereço</label><input value={dados.identificacao.endereco} onChange={(e) => atualizar('identificacao.endereco', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Telefone</label><input value={dados.identificacao.telefone} onChange={(e) => atualizar('identificacao.telefone', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Email</label><input value={dados.identificacao.email} onChange={(e) => atualizar('identificacao.email', e.target.value)} style={inputStyle} /></div>
        </div>
      </div>

      {/* PROFISSIONAIS */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Profissionais</h3>
        {['profissionais', 'profissionaisVinculados', 'profissionaisDesvinculados'].map((campo) => (
          <div key={campo} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#666', margin: '0 0 8px' }}>
              {campo === 'profissionais' ? 'Profissionais da Unidade' : campo === 'profissionaisVinculados' ? 'Vinculados no Mês' : 'Desvinculados no Mês'}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 12, color: '#666' }}>Nome</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 12, color: '#666' }}>Função</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 12, color: '#666' }}>Vínculo</th>
              </tr></thead>
              <tbody>
                {(dados as any)[campo].map((p: any, i: number) => (
                  <tr key={i}>
                    <td style={{ padding: 4 }}><input value={p.nome} onChange={(e) => atualizar(`${campo}.${i}.nome`, e.target.value)} style={{ ...inputStyle, fontSize: 13 }} /></td>
                    <td style={{ padding: 4 }}><input value={p.funcao} onChange={(e) => atualizar(`${campo}.${i}.funcao`, e.target.value)} style={{ ...inputStyle, fontSize: 13 }} /></td>
                    <td style={{ padding: 4 }}><input value={p.vinculo} onChange={(e) => atualizar(`${campo}.${i}.vinculo`, e.target.value)} style={{ ...inputStyle, fontSize: 13 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* BLOCO I - A. Volume de usuários */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Bloco I - Volume de Atendimentos</h3>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 12 }}>A. Volume de usuários</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          {[
            ['A1', 'A.1. Capacidade total de usuários na Unidade'],
            ['A2', 'A.2. Total de usuários acolhidos na Unidade'],
            ['A3', 'A.3. Total de usuários conveniados/SEMAS'],
            ['A4', 'A.4. Total de usuários conveniados/SEMAS acolhidos na Unidade'],
            ['A5', 'A.5. Novos usuários inseridos no mês'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'contents' }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <input type="number" min={0} value={(dados.blocoA as any)[key]} onChange={(e) => atualizar(`blocoA.${key}`, Number(e.target.value))} style={inputNum} />
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, color: '#666', margin: '16px 0 8px' }}>A.6. Total de usuários desligados</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['A6_familia_extensa', 'Família extensa'],
            ['A6_familia_origem', 'Família de origem'],
            ['A6_familia_substituta', 'Família substituta'],
            ['A6_maioridade', 'Maioridade'],
            ['A6_falecimento', 'Falecimento'],
            ['A6_transferencia', 'Transferência'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, flex: 1 }}>{label}</span>
              <input type="number" min={0} value={(dados.blocoA as any)[key]} onChange={(e) => atualizar(`blocoA.${key}`, Number(e.target.value))} style={inputNum} />
            </div>
          ))}
        </div>
      </div>

      {/* B. Faixa etária */}
      <div style={sectionStyle}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 12 }}>B. Faixa etária dos usuários conveniados/SEMAS</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ textAlign: 'left', padding: '6px 12px', fontSize: 12, color: '#666' }}>Faixa</th>
            <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 12, color: '#666' }}>Masculino</th>
            <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 12, color: '#666' }}>Feminino</th>
          </tr></thead>
          <tbody>
            {[
              ['B1', 'B.1. 0 a 6 anos'],
              ['B2', 'B.2. 07 a 14 anos'],
              ['B3', 'B.3. 15 a 17 anos'],
            ].map(([key, label]) => (
              <tr key={key}>
                <td style={{ padding: '6px 12px', fontSize: 13 }}>{label}</td>
                <td style={{ textAlign: 'center' }}>
                  <input type="number" min={0} value={(dados.blocoB as any)[`${key}_M`]} onChange={(e) => atualizar(`blocoB.${key}_M`, Number(e.target.value))} style={inputNum} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input type="number" min={0} value={(dados.blocoB as any)[`${key}_F`]} onChange={(e) => atualizar(`blocoB.${key}_F`, Number(e.target.value))} style={inputNum} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* C. Deficiências */}
      <div style={sectionStyle}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 12 }}>C. Deficiências dos usuários conveniados/SEMAS</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ textAlign: 'left', padding: '6px 12px', fontSize: 12, color: '#666' }}>Tipo</th>
            <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 12, color: '#666' }}>Grau I</th>
            <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 12, color: '#666' }}>Grau II</th>
            <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 12, color: '#666' }}>Grau III</th>
          </tr></thead>
          <tbody>
            {[
              ['C1', 'C.1. Deficiência múltipla'],
              ['C2', 'C.2. Deficiência visual'],
              ['C3', 'C.3. Deficiência auditiva'],
              ['C4', 'C.4. Deficiência física'],
              ['C5', 'C.5. Transtorno mental/psiquiátrico'],
              ['C6', 'C.6. TEA'],
            ].map(([key, label]) => (
              <tr key={key}>
                <td style={{ padding: '6px 12px', fontSize: 13 }}>{label}</td>
                {['I', 'II', 'III'].map((g) => (
                  <td key={g} style={{ textAlign: 'center' }}>
                    <input type="number" min={0} value={(dados.blocoC as any)[key][g]}
                      onChange={(e) => atualizar(`blocoC.${key}.${g}`, Number(e.target.value))} style={inputNum} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* D. Cor/Raça */}
      <div style={sectionStyle}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 12 }}>D. Cor ou raça/nacionalidade dos usuários conveniados/SEMAS</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ textAlign: 'left', padding: '6px 12px', fontSize: 12, color: '#666' }}></th>
            <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 12, color: '#666' }}>Feminino</th>
            <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 12, color: '#666' }}>Masculino</th>
          </tr></thead>
          <tbody>
            {[
              ['D1', 'D.1. Branco'],
              ['D2', 'D.2. Pardo'],
              ['D3', 'D.3. Preto'],
              ['D4', 'D.4. Amarelo'],
              ['D5', 'D.5. Indígena'],
              ['D6', 'D.6. Imigrantes'],
            ].map(([key, label]) => (
              <tr key={key}>
                <td style={{ padding: '6px 12px', fontSize: 13 }}>{label}</td>
                {['feminino', 'masculino'].map((g) => (
                  <td key={g} style={{ textAlign: 'center' }}>
                    <input type="number" min={0} value={(dados.blocoD as any)[key][g]}
                      onChange={(e) => atualizar(`blocoD.${key}.${g}`, Number(e.target.value))} style={inputNum} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* E. Tempo de acolhimento */}
      <div style={sectionStyle}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 12 }}>E. Tempo de acolhimento</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            ['menos_1m', 'Menos de 1 mês'],
            ['1a6m', '1 a 6 meses'],
            ['7a12m', '7 a 12 meses'],
            ['1a2a', '1 a 2 anos'],
            ['3a5a', '3 a 5 anos'],
            ['6a8a', '6 a 8 anos'],
            ['acima_9a', 'Acima de 9 anos'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>{label}</span>
              <input type="number" min={0} value={(dados.blocoE as any)[key]}
                onChange={(e) => atualizar(`blocoE.${key}`, Number(e.target.value))} style={inputNum} />
            </div>
          ))}
        </div>
      </div>

      {/* BLOCO II - F. Atividades */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Bloco II - Atividades Realizadas</h3>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 12 }}>F. Volume de atividades realizadas</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          {[
            ['F1', 'F.1. Atendimentos individualizados'],
            ['F2', 'F.2. Atendimentos em grupo'],
            ['F3', 'F.3. Oficinas/palestras'],
            ['F4', 'F.4. Passeios'],
            ['F5', 'F.5. Datas comemorativas/Eventos'],
            ['F6', 'F.6. Visitas domiciliares'],
            ['F7', 'F.7. Atendimentos aos familiares'],
            ['F8', 'F.8. Visitas dos familiares'],
            ['F9', 'F.9. Reunião de equipe'],
            ['F10', 'F.10. Reunião com rede socioassistencial'],
            ['F11', 'F.11. Participação em audiências'],
            ['F12', 'F.12. Atendimento remoto'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'contents' }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <input type="number" min={0} value={(dados.blocoF as any)[key]} onChange={(e) => atualizar(`blocoF.${key}`, Number(e.target.value))} style={inputNum} />
            </div>
          ))}
        </div>
      </div>

      {/* G. Encaminhamentos */}
      <div style={sectionStyle}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 12 }}>G. Volume de encaminhamentos</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          {[
            ['G1', 'G.1. Mercado de trabalho'],
            ['G2', 'G.2. Cursos de qualificação'],
            ['G3', 'G.3. Outras políticas públicas'],
            ['G4', 'G.4. Rede socioassistencial'],
            ['G5', 'G.5. Documentos/Relatórios para Fórum e MP'],
            ['G6', 'G.6. Outros'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'contents' }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <input type="number" min={0} value={(dados.blocoG as any)[key]} onChange={(e) => atualizar(`blocoG.${key}`, Number(e.target.value))} style={inputNum} />
            </div>
          ))}
        </div>
      </div>

      {/* BLOCO III - H. Descrição das atividades */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Bloco III - Descrição das Atividades</h3>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
          H.1. Descreva quais atividades os usuários realizaram durante o mês
        </p>
        <textarea value={dados.blocoH.descricao} onChange={(e) => atualizar('blocoH.descricao', e.target.value)}
          style={{ ...inputStyle, minHeight: 150, resize: 'vertical' }}
          placeholder="Descreva as atividades realizadas: convivência, socioeducativas, passeios, visitas, atendimentos médicos, atividades da vida diária, cursos, etc."
        />

        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1a237e', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #e8eaf6' }}>
            Anexar Imagens por Categoria
          </p>

          {!relatorioId && (
            <div style={{ background: '#fff8e1', color: '#856404', border: '1px solid #ffc107', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              ⚠️ Preencha os dados acima e clique em <strong>Salvar Relatório</strong> para habilitar o upload de imagens.
            </div>
          )}

          {relatorioId && user?.role === 'admin' && imagens.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleRemoverTodasImagens} style={{
                background: '#c62828', color: '#fff', border: 'none',
                padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
              }}>
                🗑️ Remover todas as imagens ({imagens.length})
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {categorias.map((cat) => {
              const imagensCat = imagens.filter((i) => i.categoria === cat.value);
              return (
                <div key={cat.value} style={{
                  border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden',
                  background: '#fafafa',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 16px', background: '#f0f0f0',
                    borderBottom: '1px solid #e0e0e0',
                  }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{cat.label}</span>
                    {imagensCat.length > 0 && (
                      <span style={{
                        marginLeft: 'auto', background: '#1a237e', color: '#fff',
                        borderRadius: 12, padding: '1px 8px', fontSize: 11,
                      }}>
                        {imagensCat.length}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: 12 }}>
                    {imagensCat.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
                        {imagensCat.map((img) => (
                          <div key={img.id} style={{
                            position: 'relative', width: '100%', aspectRatio: '1',
                            borderRadius: 8, overflow: 'hidden', border: '1px solid #e0e0e0',
                            background: '#fff',
                          }}>
                            <img
                              src={img.url || `${IMG_BASE}/${img.filename}`}
                              alt={img.original_name}
                              style={{
                                width: '100%', height: '100%',
                                objectFit: 'cover', display: 'block',
                                transition: 'transform 0.2s',
                                transform: `rotate(${img.rotation || 0}deg)`,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = `rotate(${img.rotation || 0}deg) scale(1.08)`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = `rotate(${img.rotation || 0}deg)`;
                              }}
                            />
                            <div style={{
                              position: 'absolute', top: 4, right: 4,
                              display: 'flex', gap: 4,
                            }}>
                              <button
                                onClick={() => handleRotacionarImagem(img.id, img.rotation || 0)}
                                title="Girar imagem"
                                style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  border: 'none', background: 'rgba(0,0,0,0.55)',
                                  color: '#fff', fontSize: 12, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  lineHeight: 1,
                                }}
                              >↻</button>
                              <button
                                onClick={() => handleRemoverImagem(img.id)}
                                title="Remover imagem"
                                style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  border: 'none', background: 'rgba(229,57,53,0.85)',
                                  color: '#fff', fontSize: 13, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  lineHeight: 1, fontWeight: 700,
                                }}
                              >×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => triggerFilePicker(cat.value)}
                      disabled={!relatorioId || uploading === cat.value}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', padding: '12px',
                        border: `2px dashed ${relatorioId ? '#bbb' : '#e0e0e0'}`,
                        borderRadius: 8, background: relatorioId ? '#fff' : '#f5f5f5',
                        color: relatorioId ? '#555' : '#bbb', fontSize: 13,
                        cursor: relatorioId ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (relatorioId && uploading !== cat.value) {
                          e.currentTarget.style.borderColor = '#1a237e';
                          e.currentTarget.style.background = '#e8eaf6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = relatorioId ? '#bbb' : '#e0e0e0';
                        e.currentTarget.style.background = relatorioId ? '#fff' : '#f5f5f5';
                      }}
                    >
                      {uploading === cat.value ? (
                        <>⏳ Enviando...</>
                      ) : (
                        <>📷 Clique para selecionar fotos</>
                      )}
                    </button>

                    <input
                      ref={(el) => { fileInputRefs.current[cat.value] = el; }}
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleUpload(cat.value, e.target.files)}
                      disabled={uploading === cat.value}
                    />

                    {imagensCat.length > 0 && (
                      <p style={{ fontSize: 11, color: '#999', margin: '8px 0 0', textAlign: 'center' }}>
                        {imagensCat.length} imagem(ns) - clique no × para remover
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BLOCO IV - Informações complementares */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Bloco IV - Informações Complementares</h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={labelStyle}>I.1. Limites e dificuldades enfrentadas no mês</label>
            <textarea value={dados.blocoI.limites} onChange={(e) => atualizar('blocoI.limites', e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>I.2. Avanços</label>
            <textarea value={dados.blocoI.avancos} onChange={(e) => atualizar('blocoI.avancos', e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>I.3. Aquisição do mês</label>
            <textarea value={dados.blocoI.aquisicao} onChange={(e) => atualizar('blocoI.aquisicao', e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>I.4. Capacitações da equipe</label>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead><tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 12, color: '#666' }}>Profissional</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 12, color: '#666' }}>Capacitação</th>
              </tr></thead>
              <tbody>
                {dados.blocoI.capacitacoes.map((cap, i) => (
                  <tr key={i}>
                    <td style={{ padding: 4 }}>
                      <input value={cap.nome} onChange={(e) => atualizar(`blocoI.capacitacoes.${i}.nome`, e.target.value)}
                        style={{ ...inputStyle, fontSize: 13 }} />
                    </td>
                    <td style={{ padding: 4 }}>
                      <input value={cap.nome_capacitacao} onChange={(e) => atualizar(`blocoI.capacitacoes.${i}.nome_capacitacao`, e.target.value)}
                        style={{ ...inputStyle, fontSize: 13 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={handleSalvar} disabled={saving} style={{
          background: '#1a237e', color: '#fff', border: 'none',
          padding: '12px 32px', borderRadius: 8, cursor: 'pointer',
          fontSize: 15, fontWeight: 600, opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Salvando...' : 'Salvar Relatório'}
        </button>
      </div>
    </div>
  );
}
