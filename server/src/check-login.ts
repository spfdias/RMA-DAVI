import { initDatabase, queryOne, queryAll } from './database';

async function main() {
  console.log('Initializing database...');
  await initDatabase();
  console.log('Database initialized');

  const user = await queryOne('SELECT id, nome, email, role, approved FROM users WHERE email = ?', ['admin@rmadavi.com']);
  console.log('Admin found:', !!user);
  if (user) {
    console.log('User:', JSON.stringify(user));
  } else {
    console.log('ADMIN NOT FOUND! Checking all users...');
    const all = await queryAll('SELECT id, nome, email, role, approved FROM users');
    console.log('All users:', JSON.stringify(all));
  }
}

main().catch(e => console.error('Error:', e));
