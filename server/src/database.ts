import { SqlJsStatic, Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_PATH || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'rma-davi.db');

export function getDbInfo() {
  const exists = fs.existsSync(DB_PATH);
  return {
    path: DB_PATH,
    dir: DB_DIR,
    exists,
    size: exists ? fs.statSync(DB_PATH).size : 0,
    env_db_path: process.env.DB_PATH || '(not set)',
  };
}

let SQL: SqlJsStatic;
let db: SqlJsDatabase;

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadDatabase(): SqlJsDatabase {
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    return new SQL.Database(buffer);
  }
  return new SQL.Database();
}

function saveDatabase() {
  ensureDir();
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function seedInitialData() {
  const bcrypt = require('bcryptjs');

  const userCount = queryOne('SELECT COUNT(*) as total FROM users');
  if (userCount && userCount.total === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    runQuery(`
      INSERT INTO users (nome, email, password_hash, role, approved)
      VALUES (?, ?, ?, 'admin', 1)
    `, ['Administrador', 'admin@rmadavi.com', hash]);
    console.log('[seed] Admin criado: admin@rmadavi.com');
  } else {
    runQuery("UPDATE users SET email = 'admin@rmadavi.com' WHERE email = 'admin@ebenezer.com'");
  }

  const acolhidoCount = queryOne('SELECT COUNT(*) as total FROM acolhidos');
  if (acolhidoCount && acolhidoCount.total === 0) {
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
    for (const a of acolhidos) {
      runQuery(`
        INSERT INTO acolhidos (nome, data_nascimento, data_acolhimento, sexo)
        VALUES (?, ?, ?, ?)
      `, [a.nome, a.data_nascimento, a.data_acolhimento, a.sexo]);
    }
    console.log(`[seed] ${acolhidos.length} acolhidos importados`);
  }

  const catCount = queryOne('SELECT COUNT(*) as total FROM categorias');
  if (catCount && catCount.total === 0) {
    const defaultCategorias = [
      { value: 'doacoes', label: 'Doações', icon: '🎁' },
      { value: 'contando_historias', label: 'Contando Histórias', icon: '📖' },
      { value: 'passeios', label: 'Passeios', icon: '🚌' },
      { value: 'oficinas', label: 'Oficinas/Palestras', icon: '🎨' },
      { value: 'eventos', label: 'Eventos/Datas Comemorativas', icon: '🎉' },
      { value: 'visitas', label: 'Visitas', icon: '🤝' },
      { value: 'corte_cabelo', label: 'Corte de Cabelo', icon: '💇' },
      { value: 'visita_igrejas', label: 'Visita de Igrejas', icon: '⛪' },
      { value: 'visita_familiares', label: 'Visita de Familiares', icon: '👨‍👩‍👧‍👦' },
      { value: 'outros', label: 'Outros', icon: '📎' },
    ];
    for (const c of defaultCategorias) {
      runQuery('INSERT INTO categorias (value, label, icon) VALUES (?, ?, ?)', [c.value, c.label, c.icon]);
    }
    console.log(`[seed] ${defaultCategorias.length} categorias importadas`);
  }
}

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();
  db = loadDatabase();
  db.run('PRAGMA foreign_keys = ON');

  initializeDatabase();
  seedInitialData();
  saveDatabase();
  return db;
}

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS acolhidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      data_nascimento TEXT NOT NULL,
      data_acolhimento TEXT NOT NULL,
      sexo TEXT NOT NULL DEFAULT 'Masculino',
      cor_raca TEXT DEFAULT '',
      deficiencia TEXT DEFAULT '',
      grau_dependencia TEXT DEFAULT '',
      observacoes TEXT DEFAULT '',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS desligamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      acolhido_id INTEGER NOT NULL,
      data_desligamento TEXT NOT NULL,
      motivo TEXT NOT NULL,
      observacoes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (acolhido_id) REFERENCES acolhidos(id)
    );

    CREATE TABLE IF NOT EXISTS relatorios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      dados TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(mes, ano)
    );

    CREATE TABLE IF NOT EXISTS imagens_atividades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      relatorio_id INTEGER NOT NULL,
      categoria TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      descricao TEXT DEFAULT '',
      rotation INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (relatorio_id) REFERENCES relatorios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      relatorio_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      changes TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (relatorio_id) REFERENCES relatorios(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📎',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  try {
    db.run('ALTER TABLE imagens_atividades ADD COLUMN rotation INTEGER NOT NULL DEFAULT 0');
  } catch {}
}

export function getDatabase(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(sql: string, params: any[] = []): any | null {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let result: any = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

export function runQuery(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();
  const lastId = queryOne('SELECT last_insert_rowid() as id')?.id || 0;
  const changes = queryOne('SELECT changes() as c')?.c || 0;
  saveDatabase();
  return { lastInsertRowid: lastId, changes };
}
