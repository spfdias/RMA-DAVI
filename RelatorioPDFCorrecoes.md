# Relatório PDF - Correções de Impressão

## Objetivo
Produzir PDF (via `window.print()`) do Relatório Mensal RMA-DAVI sem sobreposição de header/footer, com quebras de página corretas e texto visível em todas as páginas.

## Arquivo principal
`client/src/pages/RelatorioVisualizar.tsx`

## CSS - Regras de página (`@page` e `@media print`)

### `@page` (linha 123)
```css
@page { margin: 32mm 15mm 25mm; size: A4; }
```
- `margin-top: 32mm`: espaço para o cabeçalho fixo (~24mm de altura + folga)
- `margin-bottom: 25mm`: espaço para o rodapé fixo (~15mm) + 10mm de zona de segurança
- `margin-left/right: 15mm`: margens laterais padrão

### Footer fixo (linha 142)
```css
#footer-print { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; background: #fff; border-top: 1px solid #999; font-size: 7.5pt; line-height: 1.6; }
```

**Cálculo da altura do footer:** ~15mm (3 linhas × 7.5pt × 1.6 = ~12.7mm + padding 4px top/bottom = ~2.1mm + border 1px = ~0.3mm)

### Padding do conteúdo (linha 133)
```css
#relatorio-print { padding-top: 80px; padding-bottom: 40px; }
```
- `padding-bottom: 40px` (~10.5mm) — menor que os 25mm da `@page margin-bottom`, pois a margem já garante a folga

### Classes de cor exata (linha 134)
```css
.tb th, .tb .section-title, .tb tr[style*="background"] { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
```

## Blocos com quebra de página forçada

### A.6 (linha 283)
```tsx
<table className="tb tb-a6p" style={{ pageBreakBefore: 'always', marginTop: 0 }}>
```
- `.tb-a6p`: `margin-top: 100px !important` (para limpar o header fixo na nova página)

### D. Cor ou raça/nacionalidade (linha ~370)
```tsx
<div className="keep-together bloco-d" style={{ pageBreakBefore: 'always' }}>
```
- `.bloco-d`: `margin-top: 100px !important`
- Envolve D.1-D.2 + D.3-D.6 em uma única tabela com `keep-together`

### G. Encaminhamentos (linha ~488)
```tsx
<div className="keep-together bloco-g" style={{ pageBreakBefore: 'always' }}>
```
- `.bloco-g`: `margin-top: 150px !important`
- Contém F.4/F.5 texto + G.1-G.6 tabela

### Bloco III - H. Descrição das atividades (linha ~521)

**Estrutura dividida em duas tabelas:**
1. **Tabela do cabeçalho** (linha 522-530): `keep-together` com `breakAfter: 'avoid'`
   - Título "Bloco III – Descrição das atividades..."
   - Linha "H. Descrição das atividades"
2. **Tabela do conteúdo** (linha 531-540): `breakInside: 'auto'`, `pageBreakInside: 'auto'`
   - Texto H.1 com descrição — pode quebrar livremente entre páginas
   - **Importante:** usa `<td>` (não `<div>`), que no Chromium não quebra entre páginas

### Bloco II - F. Volume de atividades (linha ~448)

**Estrutura dividida em duas tabelas (mesmo padrão do Bloco III):**
1. **Tabela do cabeçalho** (linha 450-463): `keep-together` com `breakAfter: 'avoid'`
   - Título "Bloco II – Atividades realizadas..."
   - Linha "F. Volume de atividades realizadas"
2. **Tabela do conteúdo** (linha 465-487): sem `keep-together`
   - Linhas F.1 a F.12 — podem quebrar livremente entre páginas

### Fotos (linha ~542)
```tsx
<div className="img-print-page">
```
- `.img-print-page`: `page-break-before: always; margin-top: 100px !important`

## Estrutura geral do relatório (ordem no PDF)

1. **Cabeçalho fixo** (`#header-print`) - imagem CabecalhoReport.jpg
2. **Informações do profissional** (nome, função, vínculo/desvínculo)
3. **Bloco I – Volume de Atendimentos** (A.1 a A.5)
4. **A.6** (nova página)
5. **B. Capacidade, C. Usuários por gênero**
6. **D. Cor ou raça/nacionalidade** (nova página)
7. **E. Tempo de acolhimento**
8. **Bloco II – Atividades** (F.1 a F.12) — pode quebrar entre páginas
9. **F.4/F.5 texto + Bloco II – Encaminhamentos** (G.1 a G.6, nova página)
10. **Bloco III – Descrição das atividades** (H.1)
11. **Registro fotográfico** (nova página)
12. **Rodapé fixo** (`#footer-print`)

## Problemas conhecidos

1. **Bloco III (H.1) com texto longo:** `<td>` no Chromium não quebra entre páginas mesmo com `break-inside: auto`. Alternativa testada: `<div>` no lugar de `<td>` permite quebra, mas afetou outras tabelas. Pendente de solução definitiva.
2. **Bloco II (F.11/F.12):** O `keep-together` no Bloco II forçava as 12 linhas + bloco G a ficarem na mesma página, causando sumiço das últimas linhas. Corrigido removendo `keep-together` e separando header do conteúdo (commit fe7f7a2).
3. **A.5 na página 1:** Depende da quantidade de dados dos profissionais vinculados/desvinculados. Se houver muitos registros, A.5 pode ser empurrado para a página 2.

## Arquivo de teste
`teste-bloco3.html` — réplica do Bloco III com Cenário 1 (texto curto) e Cenário 2 (texto longo) para validação visual via Ctrl+P.

## Commits relevantes
| Commit | Descrição |
|--------|-----------|
| `657b961` | Aumenta @page margin-bottom de 15mm para 25mm |
| `daf88cf` | Adiciona break-after avoid + break-inside auto no Bloco III |
| `4375c91` | Divide tabela do Bloco III em duas |
| `b41edaa` | Remove pageBreakBefore do Bloco III |
| `f45dbd2` | Padroniza Bloco III com pageBreakBefore + margin-top |
| `c12f2e6` | Mescla G.1-G.6 em tabela única, move F.4/F.5 |
| `fe7f7a2` | Remove keep-together do Bloco II, separa header do conteúdo |

## Histórico de experimentos revertidos
- `<td>` → `<div>` no Bloco III (commit `ba3a9a4`, revertido em `2f1d92c`): quebrava outras tabelas
- Header nativo em HTML+CSS (commit `9064f23`, revertido em `4d7fa8a`): substituía imagem por texto nativo + barras CSS
