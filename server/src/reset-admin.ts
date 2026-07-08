import { initDatabase, queryOne, runQuery } from './database';
const bcrypt = require('bcryptjs');

async function main() {
  await initDatabase();
  const hash = bcrypt.hashSync('admin123', 10);
  const existing = await queryOne('SELECT id, email FROM users WHERE email = ?', ['admin@rmadavi.com']);
  if (existing) {
    await runQuery('UPDATE users SET password_hash = ? WHERE email = ?', [hash, 'admin@rmadavi.com']);
    console.log('Senha do admin redefinida para: admin123');
  } else {
    await runQuery(
      "INSERT INTO users (nome, email, password_hash, role, approved) VALUES (?, ?, ?, 'admin', 1)",
      ['Administrador', 'admin@rmadavi.com', hash]
    );
    console.log('Admin criado com email admin@rmadavi.com e senha admin123');
  }
  console.log('OK');
}

main().catch(console.error);
