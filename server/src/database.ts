import { SqlJsStatic, Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_PATH || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'rma-davi.db');

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

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();
  db = loadDatabase();
  db.run('PRAGMA foreign_keys = ON');

  initializeDatabase();
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
