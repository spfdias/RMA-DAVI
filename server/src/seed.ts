import { initDatabase, queryOne, runQuery } from './database';

const acolhidos = [
  { nome: 'Cristóvão Braga Lopes', data_nascimento: '2010-09-15', data_acolhimento: '2025-02-21', sexo: 'Masculino' },
  { nome: 'Nicholas Braga Lopes', data_nascimento: '2011-03-10', data_acolhimento: '2025-02-21', sexo: 'Masculino' },
  { nome: 'Elias Ezequiel De Almeida Gimenes', data_nascimento: '2025-09-01', data_acolhimento: '2025-09-05', sexo: 'Masculino' },
  { nome: 'Endrick Gabriel Ribas Ribeiro', data_nascimento: '2025-12-15', data_acolhimento: '2025-06-07', sexo: 'Masculino' },
  { nome: 'Luiz Miguel Rodrigues Sampaio', data_nascimento: '2023-03-11', data_acolhimento: '2026-03-11', sexo: 'Masculino' },
  { nome: 'Everton Junior Arcanjo Da Silva', data_nascimento: '2011-03-20', data_acolhimento: '2021-02-02', sexo: 'Masculino' },
  { nome: 'Luciano Ribas Ribeiro', data_nascimento: '2016-07-18', data_acolhimento: '2025-06-07', sexo: 'Masculino' },
  { nome: 'Maykon Felix Arcanjo Da Silva', data_nascimento: '2008-11-05', data_acolhimento: '2021-02-02', sexo: 'Masculino' },
  { nome: 'Moises de Sousa Dias', data_nascimento: '2015-04-22', data_acolhimento: '2026-03-06', sexo: 'Masculino' },
  { nome: 'Kauan Menegarti Feitoza', data_nascimento: '2010-08-14', data_acolhimento: '2026-04-22', sexo: 'Masculino' },
  { nome: 'Luan Menegarti Feitoza', data_nascimento: '2015-12-01', data_acolhimento: '2026-04-22', sexo: 'Masculino' },
  { nome: 'Gustavo Menegarti Feitoza', data_nascimento: '2016-06-30', data_acolhimento: '2026-04-22', sexo: 'Masculino' },
  { nome: 'Daniel Soares dos Santos', data_nascimento: '2013-09-10', data_acolhimento: '2026-06-18', sexo: 'Masculino' },
];

async function main() {
  await initDatabase();

  const count = await queryOne('SELECT COUNT(*) as total FROM acolhidos');
  if (count && Number(count.total) === 0) {
    for (const a of acolhidos) {
      await runQuery(`
        INSERT INTO acolhidos (nome, data_nascimento, data_acolhimento, sexo)
        VALUES (?, ?, ?, ?)
      `, [a.nome, a.data_nascimento, a.data_acolhimento, a.sexo]);
    }
    console.log(`${acolhidos.length} acolhidos importados com sucesso.`);
  }

  const adminCount = await queryOne('SELECT COUNT(*) as total FROM users');
  if (adminCount && Number(adminCount.total) === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    await runQuery(`
      INSERT INTO users (nome, email, password_hash, role, approved)
      VALUES (?, ?, ?, 'admin', 1)
    `, ['Administrador', 'admin@rmadavi.com', hash]);
    console.log('Usuário admin criado: admin@rmadavi.com');
  }

  console.log('Seed concluído.');
}

main().catch(console.error);
