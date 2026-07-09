/**
 * Script de validação local do template RMA
 * Gera PDF via Playwright e faz verificações estruturais
 *
 * Uso: node validar.js
 * Requer: Playwright (npx playwright install chromium)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = __dirname;
const HTML_PATH = path.join(TEMPLATE_DIR, 'index.html');
const OUTPUT_PDF = path.join(TEMPLATE_DIR, 'rma-validacao.pdf');

// ============================================================
// VALIDAÇÃO 1: Verificação estrutural do HTML
// ============================================================
function validarEstrutura() {
  console.log('\n=== VALIDAÇÃO ESTRUTURAL ===\n');

  const html = fs.readFileSync(HTML_PATH, 'utf-8');
  const erros = [];
  const avisos = [];

  // Verificar se existe brasão inline SVG
  if (html.includes('<svg') && html.includes('xmlns="http://www.w3.org/2000/svg"')) {
    console.log('  [OK] Brasão inline SVG encontrado');
  } else {
    erros.push('Brasão inline SVG não encontrado');
  }

  // Verificar se NÃO há links externos para imagens
  const imgSrcExterno = html.match(/<img[^>]+src=["']https?:\/\//g);
  if (imgSrcExterno) {
    erros.push(`Encontradas ${imgSrcExterno.length} imagem(ns) com URL externa`);
  } else {
    console.log('  [OK] Nenhuma imagem com URL externa');
  }

  // Verificar se existe @page com margin 20mm
  const css = fs.readFileSync(path.join(TEMPLATE_DIR, 'css', 'style.css'), 'utf-8');
  if (css.includes('margin: 20mm') || css.includes('margin:20mm')) {
    console.log('  [OK] @page com margin 20mm');
  } else {
    erros.push('@page sem margin 20mm');
  }

  // Verificar cores institucionais
  const azulCount = (css.match(/#4472C4/g) || []).length;
  const azulClaroCount = (css.match(/#B4C7E7/g) || []).length;
  console.log(`  [OK] #4472C4 (azul) aparece ${azulCount}x no CSS`);
  console.log(`  [OK] #B4C7E7 (azul claro) aparece ${azulClaroCount}x no CSS`);

  // Verificar fontes
  if (css.includes('Calibri')) {
    console.log('  [OK] Fonte Calibri configurada');
  } else {
    avisos.push('Fonte Calibri não encontrada no CSS');
  }

  // Verificar se há overflow:visible no H.1
  if (css.includes('.td-descricao') && css.includes('overflow: visible')) {
    console.log('  [OK] H.1 com overflow: visible');
  } else {
    erros.push('H.1 sem overflow: visible');
  }

  // Verificar break-inside:avoid nas linhas
  if (css.includes('tr') && (css.includes('break-inside: avoid') || css.includes('page-break-inside: avoid'))) {
    console.log('  [OK] Linhas de tabela protegidas contra quebra');
  } else {
    erros.push('Falta break-inside:avoid nas linhas de tabela');
  }

  // Verificarassinaturas protegidas
  if (css.includes('.signature-block') && (css.includes('break-inside: avoid') || css.includes('page-break-inside: avoid'))) {
    console.log('  [OK] Assinaturas protegidas contra quebra');
  } else {
    erros.push('Assinaturas sem proteção de quebra');
  }

  // Verificar se existe .photo-section com page-break-before: always
  if (css.includes('.photo-section') && css.includes('page-break-before: always')) {
    console.log('  [OK] Registro fotográfico inicia em nova página');
  } else {
    erros.push('Registro fotográfico sem page-break-before');
  }

  // Verificar se email está em linha separada no footer
  if (html.includes('semas@dourados.ms.gov.br')) {
    // Verificar se não está na mesma linha do telefone
    const footerMatch = html.match(/<div id="footer-fixed">(.*?)<\/div>/s);
    if (footerMatch) {
      const footerHtml = footerMatch[1];
      if (footerHtml.includes('3411-7746') && footerHtml.includes('semas@dourados.ms.gov.br')) {
        // Verificar se estão em elementos separados
        const phoneIndex = footerHtml.indexOf('3411-7746');
        const emailIndex = footerHtml.indexOf('semas@dourados.ms.gov.br');
        const between = footerHtml.substring(phoneIndex + 10, emailIndex);
        if (between.includes('</div>')) {
          console.log('  [OK] Email em linha separada do telefone');
        } else {
          avisos.push('Email pode estar na mesma linha do telefone');
        }
      }
    }
  }

  // Verificar se existe coluna TOTAL na tabela D
  if (html.includes('Total') && html.includes('total-col')) {
    console.log('  [OK] Coluna TOTAL na tabela D');
  } else {
    erros.push('Falta coluna TOTAL na tabela D');
  }

  // Resultado
  console.log('');
  if (erros.length === 0 && avisos.length === 0) {
    console.log('  ✅ Nenhum erro ou aviso encontrado');
  }
  if (erros.length > 0) {
    console.log(`  ❌ ${erros.length} erro(s):`);
    erros.forEach(e => console.log(`     - ${e}`));
  }
  if (avisos.length > 0) {
    console.log(`  ⚠️  ${avisos.length} aviso(s):`);
    avisos.forEach(a => console.log(`     - ${a}`));
  }

  return erros.length === 0;
}

// ============================================================
// VALIDAÇÃO 2: Gerar PDF via Playwright
// ============================================================
async function gerarPDF() {
  console.log('\n=== GERAÇÃO DE PDF VIA PLAYWRIGHT ===\n');

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Carregar o HTML (como file://)
    const fileUrl = 'file://' + HTML_PATH;
    console.log(`  Carregando: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 15000 });

    // Esperar dados preencherem
    await page.waitForTimeout(1000);

    // Verificar se o título foi preenchido
    const titulo = await page.title();
    console.log(`  Título da página: ${titulo}`);

    // Verificar se dados foram injetados
    const mesAno = await page.$eval('[data-field="mesAno"]', el => el.textContent).catch(() => null);
    console.log(`  Mês/Ano preenchido: ${mesAno || 'NÃO PREENCHIDO'}`);

    // Verificar se profissionais foram preenchidos
    const profCount = await page.$$eval('#profissionais-list tr', rows => rows.length).catch(() => 0);
    console.log(`  Profissionais na tabela: ${profCount} linha(s)`);

    // Gerar PDF
    console.log(`\n  Gerando PDF: ${OUTPUT_PDF}`);
    await page.pdf({
      path: OUTPUT_PDF,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    // Estatísticas do PDF
    const stats = fs.statSync(OUTPUT_PDF);
    const tamanhoKB = (stats.size / 1024).toFixed(1);
    console.log(`  PDF gerado: ${tamanhoKB} KB`);

    await browser.close();

    // Verificar número de páginas aproximado pelo tamanho
    // (cada página A4 em PDF simples ~10-20KB)
    const paginasEstimadas = Math.max(1, Math.round(stats.size / 15000));
    console.log(`  Páginas estimadas: ${paginasEstimadas}`);

    console.log('\n  ✅ PDF gerado com sucesso!');
    return true;
  } catch (err) {
    console.error(`\n  ❌ Erro ao gerar PDF: ${err.message}`);
    return false;
  }
}

// ============================================================
// EXECUÇÃO
// ============================================================
async function main() {
  console.log('='.repeat(55));
  console.log('  VALIDAÇÃO DO TEMPLATE RMA');
  console.log('='.repeat(55));

  const estruturalOK = validarEstrutura();
  const pdfOK = await gerarPDF();

  console.log('\n' + '='.repeat(55));
  console.log('  RESUMO');
  console.log('='.repeat(55));
  console.log(`  Estrutura:         ${estruturalOK ? '✅ OK' : '❌ COM ERROS'}`);
  console.log(`  PDF gerado:       ${pdfOK ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`  Arquivo PDF:       ${OUTPUT_PDF}`);
  console.log('='.repeat(55));
}

main().catch(console.error);
