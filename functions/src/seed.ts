import bcrypt from 'bcryptjs';

const { db, FieldValue } = require('./index');

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

export async function seed() {
  const existing = await db.collection('users').limit(1).get();
  if (!existing.empty) {
    throw new Error('Banco já possui dados. Seed ignorado.');
  }

  const batch = db.batch();
  for (const a of acolhidos) {
    const ref = db.collection('acolhidos').doc();
    batch.set(ref, {
      ...a, ativo: true,
      cor_raca: '', deficiencia: '', grau_dependencia: '', observacoes: '',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  const hash = bcrypt.hashSync('admin123', 10);
  await db.collection('users').add({
    nome: 'Administrador',
    email: 'admin@ebenezer.com',
    password_hash: hash,
    role: 'admin',
    approved: true,
    created_at: FieldValue.serverTimestamp(),
  });
}
