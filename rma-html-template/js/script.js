/**
 * RMA – Relatório Mensal de Atendimento
 * Script para preenchimento de dados e geração de PDF via Playwright
 *
 * Uso: Apenas para injeção de dados. Nenhuma função de layout.
 * ============================================================ */

(function () {
  'use strict';

  /**
   * Dados padrão do relatório.
   * Preencher com valores reais antes de gerar o PDF.
   */
  var dados = {
    mes: 1,
    ano: 2026,
    identificacao: {
      unidade: 'Lar Ebenezer',
      endereco: 'Rua Exemplo, 123 – Bairro Centro',
      telefone: '(67) 99999-0000',
      email: 'larebenezer@dourados.ms.gov.br'
    },
    profissionais: [
      { nome: 'Ana Silva', funcao: 'Assistente Social', vinculo: 'CLT' },
      { nome: 'João Santos', funcao: 'Psicólogo', vinculo: 'CLT' },
      { nome: 'Maria Oliveira', funcao: 'Educador Social', vinculo: 'PJ' }
    ],
    profissionaisVinculados: [
      { nome: 'Carlos Pereira', funcao: 'Orientador Social', vinculo: 'Temporário' }
    ],
    profissionaisDesvinculados: [
      { nome: 'Lucia Souza', funcao: 'Auxiliar Administrativo', vinculo: 'Término de Contrato' }
    ],
    blocoA: {
      A1: 30,
      A2: 26,
      A3: 22,
      A4: 20,
      A5: 2,
      A6_familia_extensa: 1,
      A6_familia_origem: 0,
      A6_familia_substituta: 0,
      A6_maioridade: 1,
      A6_falecimento: 0,
      A6_transferencia: 0
    },
    blocoB: {
      B1_M: 3, B1_F: 2,
      B2_M: 4, B2_F: 3,
      B3_M: 5, B3_F: 5
    },
    blocoC: {
      C1: { I: 1, II: 1, III: 0 },
      C2: { I: 1, II: 0, III: 0 },
      C3: { I: 0, II: 0, III: 0 },
      C4: { I: 1, II: 0, III: 0 },
      C5: { I: 1, II: 1, III: 0 },
      C6: { I: 1, II: 1, III: 1 }
    },
    blocoD: {
      D1: { feminino: 4, masculino: 5 },
      D2: { feminino: 3, masculino: 4 },
      D3: { feminino: 1, masculino: 1 },
      D4: { feminino: 1, masculino: 0 },
      D5: { feminino: 0, masculino: 1 },
      D6: { feminino: 1, masculino: 1 }
    },
    blocoE: {
      menos_1m: 2,
      '1a6m': 5,
      '7a12m': 4,
      '1a2a': 6,
      '3a5a': 5,
      '6a8a': 3,
      acima_9a: 1
    },
    blocoF: {
      F1: 45, F2: 12, F3: 8, F4: 4, F5: 3,
      F6: 6, F7: 20, F8: 15, F9: 4, F10: 2,
      F11: 1, F12: 10
    },
    blocoG: {
      G1: 2, G2: 3, G3: 5, G4: 4, G5: 2, G6: 1
    },
    blocoH: {
      descricao: 'Durante o mês de referência, os usuários participaram de diversas atividades planejadas pela equipe técnica. Foram realizadas oficinas de artesanato com foco em coordenação motora e expressão criativa. Os passeios ao parque municipal ocorreram semanalmente, proporcionando integração social e recreação. As rodas de conversa abordaram temas como convivência familiar, autoestima e projeto de vida. Houve atendimentos médicos e odontológicos na rede pública de saúde, com acompanhamento dos educadores. As atividades da vida diária foram estimuladas continuamente, incluindo cuidado com a higiene pessoal, organização do espaço coletivo e preparação de refeições. Os cursos de informática básica tiveram frequência regular, com progresso significativo na alfabetização digital dos participantes.'
    },
    blocoI: {
      limites: 'Dificuldade no transporte para atendimentos externos devido à indisponibilidade do veículo institucional durante alguns dias do mês. Necessidade de reforço na equipe noturna.',
      avancos: 'Melhora significativa na integração entre os acolhidos, com redução de conflitos interpessoais. Dois usuários foram inseridos no mercado de trabalho através do programa Jovem Aprendiz.',
      aquisicao: 'Aquisição de novos colchões, armários e materiais pedagógicos para as oficinas. Recebimento de doações de roupas e calçados.',
      capacitacoes: [
        { nome: 'Ana Silva', nome_capacitacao: 'Capacitação em Mediação de Conflitos' },
        { nome: 'João Santos', nome_capacitacao: 'Atualização em Políticas Públicas de Assistência Social' }
      ]
    },
    fotos: {
      doacoes: [
        { src: 'assets/images/placeholder.svg', legenda: 'Entrega de doações recebidas no mês' }
      ],
      eventos: [
        { src: 'assets/images/placeholder.svg', legenda: 'Festa de aniversariantes do mês' },
        { src: 'assets/images/placeholder.svg', legenda: 'Comemoração de data festiva' }
      ],
      passeios: [
        { src: 'assets/images/placeholder.svg', legenda: 'Passeio ao parque municipal' }
      ],
      capacitacoes: [
        { src: 'assets/images/placeholder.svg', legenda: 'Capacitação da equipe técnica' }
      ],
      atividades: [
        { src: 'assets/images/placeholder.svg', legenda: 'Oficina de artesanato' },
        { src: 'assets/images/placeholder.svg', legenda: 'Roda de conversa' }
      ],
      visitas: [
        { src: 'assets/images/placeholder.svg', legenda: 'Visita de familiares' }
      ],
      outras: []
    }
  };

  var meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  /**
   * Preenche um campo data-field com valor
   */
  function preencherCampo(el, valor) {
    if (el) {
      el.textContent = (valor !== null && valor !== undefined) ? String(valor) : '___';
    }
  }

  /**
   * Obtém valor aninhado via caminho tipo "blocoA.A1"
   */
  function obterValor(caminho) {
    var partes = caminho.split('.');
    var valor = dados;
    for (var i = 0; i < partes.length; i++) {
      if (valor === null || valor === undefined) return undefined;
      valor = valor[partes[i]];
    }
    return valor;
  }

  /**
   * Preenche todos os campos data-field do documento
   */
  function preencherDados() {
    // Mês e Ano
    var mesAno = document.querySelector('[data-field="mesAno"]');
    if (mesAno) {
      mesAno.textContent = meses[dados.mes - 1] + ' / ' + dados.ano;
    }

    // Campos simples via data-field
    var campos = document.querySelectorAll('[data-field]');
    for (var i = 0; i < campos.length; i++) {
      var el = campos[i];
      var field = el.getAttribute('data-field');
      if (!field || field === 'mesAno') continue;

      // Pular campos que são arrays (tratados separadamente)
      if (field.indexOf('blocoI.capacitacoes') === 0) continue;

      var valor = obterValor(field);
      if (valor !== undefined) {
        preencherCampo(el, valor);
      }
    }

    // Profissionais
    preencherProfissionais('profissionais-list', dados.profissionais);
    preencherProfissionais('profissionais-vinculados-list', dados.profissionaisVinculados);
    preencherProfissionais('profissionais-desvinculados-list', dados.profissionaisDesvinculados);

    // Bloco A.6 – checkboxes
    var a6Itens = document.querySelectorAll('#blocoA6-list .checkbox-count');
    for (var a = 0; a < a6Itens.length; a++) {
      var item = a6Itens[a];
      var campoA6 = item.getAttribute('data-field');
      var valA6 = obterValor(campoA6) || 0;
      var marcador = item.previousElementSibling;
      if (marcador && marcador.classList.contains('checkbox-marker')) {
        // Encontrar o checkbox pai
        var li = item.parentNode;
        if (li) {
          var marker = li.querySelector('.checkbox-marker');
          if (marker) {
            if (valA6 > 0) {
              marker.innerHTML = '( X )';
              marker.style.color = '#4472C4';
            } else {
              marker.innerHTML = '(   )';
            }
            // Adicionar contagem
            if (valA6 > 0) {
              var countSpan = document.createElement('span');
              countSpan.textContent = ' (' + valA6 + ')';
              countSpan.style.color = '#4472C4';
              countSpan.style.fontWeight = '700';
              item.parentNode.appendChild(countSpan);
            }
          }
        }
      }
    }

    // Bloco D – calcular totais
    var totaisD = document.querySelectorAll('[data-calc]');
    for (var d = 0; d < totaisD.length; d++) {
      var td = totaisD[d];
      var key = td.getAttribute('data-calc');
      var feminino = obterValor('blocoD.' + key + '.feminino') || 0;
      var masculino = obterValor('blocoD.' + key + '.masculino') || 0;
      td.textContent = (feminino + masculino);
    }

    // Bloco H – descrição
    var hDesc = document.getElementById('blocoH-descricao');
    if (hDesc && dados.blocoH && dados.blocoH.descricao) {
      hDesc.textContent = dados.blocoH.descricao;
    }

    // Bloco I – Capacitações
    var capacTextBox = document.querySelector('[data-field="blocoI.capacitacoes"]');
    if (dados.blocoI && dados.blocoI.capacitacoes && dados.blocoI.capacitacoes.length > 0) {
      var caps = dados.blocoI.capacitacoes;
      var capsText = '';
      for (var c = 0; c < caps.length; c++) {
        if (caps[c].nome || caps[c].nome_capacitacao) {
          capsText += (caps[c].nome || '-') + ' — ' + (caps[c].nome_capacitacao || '-');
          if (c < caps.length - 1) capsText += '; ';
        }
      }
      if (capsText) {
        if (capacTextBox) capacTextBox.textContent = capsText;
        // Mostrar tabela de capacitações
        var capsTable = document.getElementById('capacitacoes-table');
        var capsList = document.getElementById('capacitacoes-list');
        if (capsTable && capsList) {
          capsTable.style.display = 'table';
          capsList.innerHTML = '';
          for (var c2 = 0; c2 < caps.length; c2++) {
            if (caps[c2].nome || caps[c2].nome_capacitacao) {
              var tr = document.createElement('tr');
              var td1 = document.createElement('td');
              td1.textContent = caps[c2].nome || '-';
              var td2 = document.createElement('td');
              td2.textContent = caps[c2].nome_capacitacao || '-';
              tr.appendChild(td1);
              tr.appendChild(td2);
              capsList.appendChild(tr);
            }
          }
        }
      }
    } else {
      if (capacTextBox) capacTextBox.textContent = 'N/A';
    }

    // Fotos
    preencherFotos();
  }

  /**
   * Preenche a tabela de profissionais
   */
  function preencherProfissionais(listId, profissionais) {
    var tbody = document.getElementById(listId);
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!profissionais || profissionais.length === 0) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.setAttribute('colspan', '3');
      td.textContent = 'Nenhum profissional registrado.';
      td.style.textAlign = 'center';
      td.style.color = '#999';
      td.style.fontStyle = 'italic';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    for (var i = 0; i < profissionais.length; i++) {
      var p = profissionais[i];
      var tr = document.createElement('tr');
      var tdNome = document.createElement('td');
      tdNome.textContent = p.nome || '-';
      var tdFuncao = document.createElement('td');
      tdFuncao.textContent = p.funcao || '-';
      var tdVinculo = document.createElement('td');
      tdVinculo.textContent = p.vinculo || '-';
      tr.appendChild(tdNome);
      tr.appendChild(tdFuncao);
      tr.appendChild(tdVinculo);
      tbody.appendChild(tr);
    }
  }

  /**
   * Preenche as fotos do registro fotográfico
   */
  function preencherFotos() {
    var categorias = ['doacoes', 'eventos', 'passeios', 'capacitacoes', 'atividades', 'visitas', 'outras'];

    for (var i = 0; i < categorias.length; i++) {
      var cat = categorias[i];
      var fotos = dados.fotos && dados.fotos[cat];
      var container = document.getElementById('photos-' + cat);
      if (!container) continue;

      container.innerHTML = '';

      if (!fotos || fotos.length === 0) {
        var catDiv = container.closest('.photo-category');
        if (catDiv) {
          catDiv.style.display = 'none';
        }
        continue;
      }

      for (var f = 0; f < fotos.length; f++) {
        var foto = fotos[f];
        var card = document.createElement('div');
        card.className = 'photo-card';

        var frame = document.createElement('div');
        frame.className = 'photo-frame';

        var img = document.createElement('img');
        img.src = foto.src || 'assets/images/placeholder.svg';
        img.alt = foto.legenda || 'Foto';
        img.setAttribute('data-src', foto.src || '');
        frame.appendChild(img);

        var caption = document.createElement('div');
        caption.className = 'photo-caption';
        caption.textContent = foto.legenda || 'Sem legenda';

        card.appendChild(frame);
        card.appendChild(caption);
        container.appendChild(card);
      }
    }
  }

  /**
   * Gera PDF via Playwright – chamado pelo botão na toolbar
   * Utilizado quando o Playwright abre esta página e executa este método
   */
  window.gerarPDFPlaywright = function () {
    // Oculta elementos não-impressos
    var toolbars = document.querySelectorAll('.toolbar');
    for (var i = 0; i < toolbars.length; i++) {
      toolbars[i].style.display = 'none';
    }

    // Mostra primeira página
    document.body.className = '';

    // Aciona impressão (para debug em tela)
    window.print();
  };

  /**
   * Inicialização – preenche dados quando o DOM estiver pronto
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preencherDados);
  } else {
    preencherDados();
  }

})();
