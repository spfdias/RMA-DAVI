# Configuração Visual — Relatório Técnico de Segurança

Referência completa de CSS extraída de `RELATORIO TECNICO DE SEGURANCA - CAMARA CACOAL_TEMP.html`.

---

## 1. Configuração de Página (@page)

### Página padrão (todas)
```css
@page {
  size: A4;
  margin: 12mm 0 0;
}
```

### Primeira página
```css
@page :first {
  margin: 0;
}
```

---

## 2. Estrutura de Layout

### Flex container principal (`body`)
```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #fff;
}
```

### Page wrapper (`.page`)
```css
.page {
  max-width: 210mm;
  width: 100%;
  margin: 0 auto;
  padding: 0 10mm;
  display: flex;
  flex-direction: column;
  flex: 1;
}
```

### Page body (`.page-body`)
```css
.page-body {
  flex: 1;
}
```

### Spacer para empurrar footer
```html
<div style="min-height: 439px;"></div>
```
*Div vazia entre `.page-body` e `.footer` para garantir que o footer fique no final da página quando o conteúdo for curto.*

### Reset global
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html { height: 100%; }
```

---

## 3. Tipografia

### Família tipográfica
```css
font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
```

### Hierarchy

| Elemento | Tamanho | Weight | Cor |
|----------|---------|--------|-----|
| `body` | 10pt | — | `#1a1a2e` |
| `.header h1` | 22pt | 700 | `#fff` |
| `.header .subtitle` | 11pt | 300 | `#fff` (opacity 0.85) |
| `h2` | 14pt | bold | `#1a3a5c` |
| `h3` | 12pt | bold | `#1a3a5c` |
| `p` | 10pt | — | `#333` |
| `th` | 8pt | 700 | `#fff` |
| `td` | 9pt | — | `#333` (print: `#000`) |
| `li` | 10pt | — | `#333` |
| `.meta-bar` | 9pt | — | `#555` |
| `.footer` | 8pt | — | `#fff` |
| `.classification` | 9pt | 700 | `#fff` |
| `.sev-*` | 8pt | 700 | `#fff` |
| `.vuln-header` | 10pt | 700 | — |
| `.vuln-header .title` | 10pt | — | `#1a1a2e` |
| `.vuln-header .id` | 9pt | — | `#888` |
| `.vuln-header .badge` | 8pt | 700 | variável por severidade |
| `.field-label` | 8pt | 700 | `#1a3a5c` |
| `.field-value` | 9pt | — | `#444` |
| `.risk-box .label` | 9pt | 700 | `#c0392b` |
| `.risk-box .value` | 22pt | 800 | `#c0392b` |
| `.risk-box .desc` | 9pt | — | `#555` |
| `.rec-card h4` | 10pt | bold | `#1a3a5c` |
| `.rec-card li` | 9pt | — | `#444` |
| `.action-list li` | 10pt | — | `#333` |
| `.summary-grid td` | 9pt | 700 | `#fff` |
| `.summary-grid .num` | 24pt | 800 | `#fff` |
| `.signature-block p` | 10pt | — | — |
| `.signature-block .name` | 11pt | 700 | — |
| `.signature-block .title` | 9pt | — | `#666` |

### Line-height geral
```css
body { line-height: 1.6; }
.footer { line-height: 1.6; }
.risk-box .value { line-height: 1.1; }
.summary-grid .num { line-height: 1; }
.action-list li { line-height: 1.6; }
```

---

## 4. Paleta de Cores

### Gradiente de cabeçalho e rodapé (azul escuro)
```css
background: linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 50%, #1a5276 100%);
```

### Tons de azul
| Uso | Cor |
|-----|-----|
| Títulos `h2`, `h3`, `th`, `.field-label` | `#1a3a5c` |
| Borda `th` | `#0f2a44` |
| Borda `signature-block` | `#1a3a5c` |
| Borda `rec-card` (esquerda) | `#1a3a5c` |
| `meta-bar strong` | `#1a3a5c` |
| `.action-list li strong` | `#1a3a5c` |
| `body` texto principal | `#1a1a2e` |

### Severidade — Crítico
| Propriedade | Cor |
|-------------|-----|
| Badge `.sev-critical` | `#c0392b` |
| `.risk-box` borda | `#c0392b` |
| `.risk-box .label` / `.value` | `#c0392b` |
| `.risk-box` bg | `#fff5f5` |
| `.vuln-header.critical` bg | `#fde8e8` |
| `.vuln-header.critical` borda inferior | `2px solid #c0392b` |
| `.vuln-header.critical` borda esquerda | `4px solid #c0392b` |
| `.badge.critical` texto | `#c0392b` |
| `h2` / `h3` borda | `3px solid #c0392b` |
| `.summary-grid .crit` bg | `#c0392b` |
| `.classification` bg | `#c0392b` |

### Severidade — Alto
| Propriedade | Cor |
|-------------|-----|
| Badge `.sev-high` | `#e67e22` |
| `.vuln-header.high` bg | `#fef0e0` |
| `.vuln-header.high` borda inferior | `2px solid #e67e22` |
| `.vuln-header.high` borda esquerda | `4px solid #e67e22` |
| `.badge.high` texto | `#e67e22` |
| `.summary-grid .high` bg | `#e67e22` |

### Severidade — Médio
| Propriedade | Cor |
|-------------|-----|
| Badge `.sev-medium` | `#f39c12` |
| `.vuln-header.medium` bg | `#fef9e7` |
| `.vuln-header.medium` borda inferior | `2px solid #f39c12` |
| `.vuln-header.medium` borda esquerda | `4px solid #f39c12` |
| `.badge.medium` texto | `#f39c12` |
| `.summary-grid .med` bg | `#f39c12` |

### Severidade — Baixo
```css
.sev-low { background: #27ae60; }
```

### Cores auxiliares
| Uso | Cor |
|-----|-----|
| `.meta-bar` bg | `#f4f6f8` |
| `.meta-bar` borda inferior | `1px solid #e0e4e8` |
| `.meta-item + .meta-item::before` | `#ccc` |
| `table` borda | `1px solid #ccc` |
| `td` borda | `1px solid #ddd` |
| `tr:nth-child(even) td` bg | `#f7f9fc` |
| `.vuln-card` borda | `1px solid #ddd` |
| `.vuln-header` bg | `#fafafa` |
| `thead` bg | `#1a3a5c` |
| `.rec-card` borda | `1px solid #d0dce8` |
| `.rec-card` bg | `#f4f8fc` |
| `.signature-block` bg | `#fafbfc` |
| `.signature-block` borda superior | `2px solid #1a3a5c` |

---

## 5. Cabeçalho (`.header`)

```css
.header {
  background: linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 50%, #1a5276 100%);
  color: #fff;
  margin: 0 -10mm;
  padding: 40px 10mm 32px;
  text-align: center;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.header h1 {
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #fff;
  margin-bottom: 4px;
}
.header .subtitle {
  font-size: 11pt;
  opacity: 0.85;
  font-weight: 300;
}
.header .classification {
  display: inline-block;
  background: #c0392b;
  color: #fff;
  padding: 4px 14px;
  font-size: 9pt;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-top: 14px;
}
```

### Meta-bar (abaixo do header)
```css
.meta-bar {
  background: #f4f6f8;
  padding: 10px 10mm;
  margin: 0 -10mm 12px;
  border-bottom: 1px solid #e0e4e8;
  font-size: 9pt;
  color: #555;
  text-align: center;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.meta-bar strong { color: #1a3a5c; }
.meta-item + .meta-item { margin-left: 14px; }
.meta-item + .meta-item::before { content: "| "; color: #ccc; }
```

---

## 6. Rodapé (`.footer`)

```css
.footer {
  background: linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 50%, #1a5276 100%);
  color: #fff;
  margin: 0px -10mm -30mm;
  padding: 42px 20mm 48px;
  text-align: center;
  font-size: 8pt;
  line-height: 1.6;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.footer strong { color: #fff; }
```

**Mecanismo de posicionamento:**
- Margem negativa inferior (`-30mm`) puxa o footer para baixo, compensando o `@page margin: 12mm 0 0`.
- Margem horizontal negativa (`-10mm`) estende o footer até as bordas do papel.
- O spacer `min-height: 439px` antes do footer garante que o conteúdo não fique sobreposto.
- O `.page-body { flex: 1 }` + spacer empurram o footer para o final da viewport em telas.

---

## 7. Cartões

### Cartão de Vulnerabilidade (`.vuln-card`)
```css
.vuln-card {
  border: 1px solid #ddd;
  margin-bottom: 12px;
}
.vuln-header {
  padding: 8px 14px;
  font-weight: 700;
  font-size: 10pt;
  border-bottom: 1px solid #ddd;
  background: #fafafa;
}
.vuln-header.critical {
  background: #fde8e8;
  border-bottom: 2px solid #c0392b;
  border-left: 4px solid #c0392b;
}
.vuln-header.high {
  background: #fef0e0;
  border-bottom: 2px solid #e67e22;
  border-left: 4px solid #e67e22;
}
.vuln-header.medium {
  background: #fef9e7;
  border-bottom: 2px solid #f39c12;
  border-left: 4px solid #f39c12;
}
.vuln-header .badge { font-size: 8pt; margin-right: 6px; text-transform: uppercase; }
.vuln-header .badge.critical { color: #c0392b; }
.vuln-header .badge.high { color: #e67e22; }
.vuln-header .badge.medium { color: #f39c12; }
.vuln-header .id { color: #888; margin-right: 6px; font-size: 9pt; }
.vuln-header .title { color: #1a1a2e; font-size: 10pt; }
.vuln-body { padding: 10px 14px; }
.vuln-body .field { margin-bottom: 6px; }
.vuln-body .field-label {
  font-size: 8pt;
  color: #1a3a5c;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1px;
}
.vuln-body .field-value { font-size: 9pt; color: #444; }
.vuln-body .field-value ul { margin: 2px 0 0 16px; }
.vuln-body .field-value ul li { font-size: 9pt; margin-bottom: 1px; }
```

### Cartão de Recomendação (`.rec-card`)
```css
.rec-card {
  border: 1px solid #d0dce8;
  border-left: 4px solid #1a3a5c;
  padding: 10px 14px;
  margin: 8px 0;
  background: #f4f8fc;
}
.rec-card h4 { color: #1a3a5c; font-size: 10pt; margin-bottom: 3px; }
.rec-card ul { margin: 2px 0 0 14px; }
.rec-card ul li { font-size: 9pt; margin-bottom: 2px; color: #444; }
```

### Risk Box (`.risk-box`)
```css
.risk-box {
  border: 2px solid #c0392b;
  padding: 12px 16px;
  margin: 12px 0;
  background: #fff5f5;
}
.risk-box .label {
  font-size: 9pt;
  color: #c0392b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
.risk-box .value {
  font-size: 22pt;
  font-weight: 800;
  color: #c0392b;
  line-height: 1.1;
}
.risk-box .desc {
  font-size: 9pt;
  color: #555;
  margin-top: 4px;
}
```

---

## 8. Tabelas

```css
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0 20px;
  font-size: 9pt;
  border: 1px solid #ccc;
}
thead { background: #1a3a5c; color: #fff; }
th {
  padding: 6px 10px;
  text-align: left;
  font-weight: 700;
  font-size: 8pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid #0f2a44;
}
td {
  padding: 5px 10px;
  border: 1px solid #ddd;
  vertical-align: top;
  font-size: 9pt;
}
tr:nth-child(even) td { background: #f7f9fc; }
```

### Severity badges (inline, usados dentro de tabelas)
```css
.sev-critical { display: inline-block; background: #c0392b; color: #fff; padding: 1px 8px; font-size: 8pt; font-weight: 700; }
.sev-high { display: inline-block; background: #e67e22; color: #fff; padding: 1px 8px; font-size: 8pt; font-weight: 700; }
.sev-medium { display: inline-block; background: #f39c12; color: #fff; padding: 1px 8px; font-size: 8pt; font-weight: 700; }
.sev-low { display: inline-block; background: #27ae60; color: #fff; padding: 1px 8px; font-size: 8pt; font-weight: 700; }
```

---

## 9. Grid de Sumário (`.summary-grid`)

```css
.summary-grid { margin: 10px 0; page-break-inside: avoid; }
.summary-grid table {
  width: auto;
  margin: 0 auto;
  border: none;
  border-collapse: separate;
  border-spacing: 6px;
}
.summary-grid td {
  padding: 10px 18px;
  text-align: center;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 9pt;
  min-width: 80px;
  color: #fff;
}
.summary-grid .num {
  font-size: 24pt;
  font-weight: 800;
  display: block;
  line-height: 1;
  margin-bottom: 2px;
}
.summary-grid .crit { background: #c0392b; }
.summary-grid .crit .num { color: #fff; }
.summary-grid .high { background: #e67e22; }
.summary-grid .high .num { color: #fff; }
.summary-grid .med { background: #f39c12; }
.summary-grid .med .num { color: #fff; }
```

---

## 10. Bloco de Assinatura (`.signature-block`)

```css
.signature-block {
  margin: 24px -10mm 0;
  padding: 20px 10mm;
  text-align: center;
  border-top: 2px solid #1a3a5c;
  background: #fafbfc;
}
.signature-block p { font-size: 10pt; margin-bottom: 4px; }
.signature-block .name { font-weight: 700; font-size: 11pt; margin-top: 14px; }
.signature-block .title { font-size: 9pt; color: #666; }
```

---

## 11. Configurações de Impressão (`@media print`)

```css
@media print {
  body {
    padding: 0;
    color: #000;
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }
  .page {
    max-width: none;
    margin: 0;
    padding: 0 10mm;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .page-body { flex: 1; }

  /* Forçar cores de fundo e gradientes na impressão */
  .header,
  .meta-bar,
  .signature-block,
  .footer,
  .summary-grid td,
  thead,
  th,
  .sev-critical, .sev-high, .sev-medium, .sev-low,
  .vuln-header.critical, .vuln-header.high, .vuln-header.medium,
  .risk-box,
  .rec-card {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Zebrado mais sutil na impressão */
  tr:nth-child(even) td { background: #f2f4f8 !important; }

  /* Texto dos parágrafos, listas e células preto na impressão */
  p, li, td { color: #000; }
}
```

---

## 12. Regras de Quebra de Página

### Quebras forçadas (`page-break-before: always`)
Aplicadas nos seguintes elementos via `style` inline:

```html
<h2 style="page-break-before: always;">Vulnerabilidades Identificadas</h2>
<div class="vuln-card" style="page-break-before: always;">  <!-- A03 -->
<h3 style="page-break-before: always;">Web Application Firewall (WAF)</h3>
<h2 style="page-break-before: always;">Conclusão</h2>
```

### Prevenção de quebra no sumário
```css
.summary-grid { page-break-inside: avoid; }
```

---

## 13. Espaçamentos (Margens e Paddings)

### Margens externas
| Elemento | Margem |
|----------|--------|
| `@page` (padrão) | `12mm 0 0` (topo 12mm, laterais 0, inferior 0) |
| `@page :first` | `0` (sem margem na primeira página) |
| `.page` | `0 auto` (centralizado) |
| `.header` | `0 -10mm` (negativa para sangria) |
| `.meta-bar` | `0 -10mm 12px` |
| `.footer` | `0px -10mm -30mm` (negativa inferior) |
| `.signature-block` | `24px -10mm 0` |
| `h2` | `8px 0 8px` |
| `h3` | `6px 0 6px` |
| `p` | `0 0 6px 0` |
| `table` | `16px 0 20px` |
| `.vuln-card` | `0 0 12px 0` |
| `.risk-box` | `12px 0` |
| `.rec-card` | `8px 0` |
| `.summary-grid` | `10px 0` |
| `.action-list` | `12px 0 12px 20px` |
| `ul` | `4px 0 6px 18px` |

### Paddings internos
| Elemento | Padding |
|----------|---------|
| `.page` | `0 10mm` |
| `.header` | `40px 10mm 32px` |
| `.meta-bar` | `10px 10mm` |
| `.footer` | `42px 20mm 48px` |
| `.vuln-header` | `8px 14px` |
| `.vuln-body` | `10px 14px` |
| `.vuln-body .field` | `0 0 6px 0` (margin-bottom) |
| `.field-label` | `0 0 1px 0` (margin-bottom) |
| `th` | `6px 10px` |
| `td` | `5px 10px` |
| `.risk-box` | `12px 16px` |
| `.rec-card` | `10px 14px` |
| `.summary-grid td` | `10px 18px` |
| `.signature-block` | `20px 10mm` |
| `.classification` | `4px 14px` |
| `.sev-*` | `1px 8px` |
| `.action-list` | `0 0 0 20px` (margin-left) |
| `h3` | `8px 0 6px 8px` (padding-left) |
| `h2` | `10px 0 8px 0` (padding-top) |
| `ul` | `0 0 0 18px` (margin-left) |

### Gap / separação entre itens de meta
```css
.meta-item + .meta-item { margin-left: 14px; }
```

### Altura mínima do spacer
```css
min-height: 439px;
```

### Border-radius
```css
.summary-grid td { border-radius: 6px; }
```
