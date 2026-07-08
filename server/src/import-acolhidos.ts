import { initDatabase, runQuery, queryAll } from './database';

const XLSX = require('xlsx');

// Known birth dates from seed data
const KNOWN_BIRTHDAYS: Record<string, string> = {
  'Cristóvão Braga Lopes': '2010-09-15',
  'Nicholas Braga Lopes': '2011-03-10',
  'Elias Ezequiel De Almeida Gimenes': '2025-09-01',
  'Endrick Gabriel Ribas Ribeiro': '2025-12-15',
  'Luiz Miguel Rodrigues Sampaio': '2023-03-11',
  'Everton Junior Arcanjo Da Silva': '2011-03-20',
  'Luciano Ribas Ribeiro': '2016-07-18',
  'Maykon Felix Arcanjo Da Silva': '2008-11-05',
  'Moises de Sousa Dias': '2015-04-22',
  'Kauan Menegarti Feitoza': '2010-08-14',
  'Luan Menegarti Feitoza': '2015-12-01',
  'Gustavo Menegarti Feitoza': '2016-06-30',
  'Daniel Soares dos Santos': '2013-09-10',
};

// Female names list
const FEMALE_NAMES = [
  'Ana Beatriz', 'Andressa', 'Deysi', 'Gabrielle', 'Yngrid',
  'Luana', 'Ludimila', 'Sandriele', 'Marta', 'Emanuelly',
  'Raphaella', 'Thais', 'Vitória',
];

function isFeminino(nome: string): boolean {
  return FEMALE_NAMES.some(f => nome.startsWith(f));
}

function estimateBirthDate(idadeStr: string, refDate: Date): string {
  const idadeLower = idadeStr.toLowerCase().trim();
  let anos = 0, meses = 0;

  const anosMatch = idadeLower.match(/(\d+)\s*ano/);
  if (anosMatch) anos = parseInt(anosMatch[1]);

  const mesesMatch = idadeLower.match(/(\d+)\s*m[êe]se/);
  if (mesesMatch) meses = parseInt(mesesMatch[1]);

  const ref = new Date(refDate);
  let birthYear = ref.getFullYear() - anos;
  let birthMonth = ref.getMonth() - meses;
  if (birthMonth <= 0) { birthYear -= 1; birthMonth += 12; }
  return `${birthYear}-${String(birthMonth).padStart(2, '0')}-01`;
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function main() {
  await initDatabase();

  // Read spreadsheet
  const wb = XLSX.readFile('../Acolhidos com tempo de acolhimento.xlsx', { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

  interface AcolhidoRow {
    nome: string;
    data_nascimento: string;
    data_acolhimento: string;
    sexo: string;
    idade_str: string;
  }

  const acolhidos: AcolhidoRow[] = [];
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[1]) continue;
    const nome = r[1].toString().trim();
    const idadeStr = r[2] ? r[2].toString().trim() : '';
    const rawDate = r[3] ? r[3].toString().trim() : '';

    if (!nome || !rawDate) continue;

    // Parse admission date
    const parts = rawDate.split('/');
    let dataAcolh: Date;
    if (parts.length === 3) {
      let month = parseInt(parts[0]), day = parseInt(parts[1]), year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      dataAcolh = new Date(year, month - 1, day);
    } else {
      dataAcolh = new Date(rawDate);
    }

    if (isNaN(dataAcolh.getTime())) continue;

    // Determine birth date
    const knownBirth = KNOWN_BIRTHDAYS[nome];
    let dataNasc: string;
    if (knownBirth) {
      dataNasc = knownBirth;
    } else {
      dataNasc = estimateBirthDate(idadeStr, now);
    }

    // Determine sexo
    const sexo = isFeminino(nome) ? 'Feminino' : 'Masculino';

    acolhidos.push({
      nome,
      data_nascimento: dataNasc,
      data_acolhimento: formatDateStr(dataAcolh),
      sexo,
      idade_str: idadeStr,
    });
  }

  console.log(`Total de acolhidos na planilha: ${acolhidos.length}`);

  // Clear existing data
  await runQuery('DELETE FROM desligamentos');
  await runQuery('DELETE FROM acolhidos');
  console.log('Dados antigos removidos');

  // Insert new data
  for (const a of acolhidos) {
    await runQuery(`
      INSERT INTO acolhidos (nome, data_nascimento, data_acolhimento, sexo)
      VALUES (?, ?, ?, ?)
    `, [a.nome, a.data_nascimento, a.data_acolhimento, a.sexo]);
  }

  console.log(`${acolhidos.length} acolhidos importados com sucesso.`);

  // Print summary
  console.log('\n=== Acolhidos Importados ===');
  const imported = await queryAll('SELECT id, nome, data_nascimento, data_acolhimento, sexo, ativo FROM acolhidos ORDER BY nome ASC');
  for (const a of imported) {
    const adm = new Date(a.data_acolhimento);
    const hoje = new Date();
    const diffMs = hoje.getTime() - adm.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const anos = Math.floor(diffDays / 365);
    const meses = Math.floor((diffDays % 365) / 30);
    let tempoAcolhimento = '';
    if (anos > 0) tempoAcolhimento += `${anos} ano(s) `;
    tempoAcolhimento += `${meses} mês(es)`;
    console.log(`${a.nome} | Nasc: ${a.data_nascimento} | Acolh: ${a.data_acolhimento} | Tempo: ${tempoAcolhimento}`);
  }
}

main().catch(console.error);
