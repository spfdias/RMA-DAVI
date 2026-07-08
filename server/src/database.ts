import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

const IS_PG = !!process.env.DATABASE_URL;
let pgPool: Pool | null = null;

let SQL: any;
let sqliteDb: any;

function getDbDir() {
  return process.env.DB_PATH || path.join(__dirname, '..', 'data');
}

function getDbPath() {
  return path.join(getDbDir(), 'rma-davi.db');
}

// ====== PostgreSQL helpers ======

function pgConvert(sql: string, params: any[]): { text: string; values: any[] } {
  let idx = 0;
  const text = sql
    .replace(/\?/g, () => `$${++idx}`)
    .replace(/datetime\('now',\s*'localtime'\)/gi, 'NOW()')
    .replace(/datetime\('now'\)/gi, 'NOW()');
  return { text, values: params };
}

async function pgQueryAll(sql: string, params: any[] = []): Promise<any[]> {
  const { text, values } = pgConvert(sql, params);
  const result = await pgPool!.query(text, values);
  return result.rows;
}

async function pgQueryOne(sql: string, params: any[] = []): Promise<any | null> {
  const { text, values } = pgConvert(sql, params);
  const result = await pgPool!.query(text, values);
  return result.rows[0] || null;
}

async function pgRunQuery(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  let finalSql = sql;
  const isInsert = /^\s*INSERT\s/i.test(finalSql);
  if (isInsert && !/RETURNING/i.test(finalSql)) {
    finalSql += ' RETURNING id';
  }
  const { text, values } = pgConvert(finalSql, params);
  const result = await pgPool!.query(text, values);
  return { lastInsertRowid: result.rows[0]?.id || 0, changes: result.rowCount || 0 };
}

// ====== SQLite helpers (fallback) ======

function sqliteQueryAll(sql: string, params: any[] = []): any[] {
  const stmt = sqliteDb.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function sqliteQueryOne(sql: string, params: any[] = []): any | null {
  const stmt = sqliteDb.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let result: any = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function sqliteRunQuery(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  const stmt = sqliteDb.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();
  const lastId = sqliteQueryOne('SELECT last_insert_rowid() as id')?.id || 0;
  const changes = sqliteQueryOne('SELECT changes() as c')?.c || 0;
  saveSqliteDb();
  return { lastInsertRowid: lastId, changes };
}

function saveSqliteDb() {
  const dir = getDbDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = sqliteDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(getDbPath(), buffer);
}

// ====== Unified public API ======

export async function queryAll(sql: string, params: any[] = []): Promise<any[]> {
  if (IS_PG) return pgQueryAll(sql, params);
  return sqliteQueryAll(sql, params);
}

export async function queryOne(sql: string, params: any[] = []): Promise<any | null> {
  if (IS_PG) return pgQueryOne(sql, params);
  return sqliteQueryOne(sql, params);
}

export async function runQuery(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  if (IS_PG) return pgRunQuery(sql, params);
  return sqliteRunQuery(sql, params);
}

export function getDbInfo() {
  if (IS_PG) {
    return {
      path: 'postgres://' + (process.env.DATABASE_URL || '').replace(/\/\/.*@/, '//***@'),
      dir: 'postgresql',
      exists: true,
      size: 0,
      env_db_path: process.env.DATABASE_URL ? '(set)' : '(not set)',
    };
  }
  const p = getDbPath();
  const exists = fs.existsSync(p);
  return {
    path: p,
    dir: getDbDir(),
    exists,
    size: exists ? fs.statSync(p).size : 0,
    env_db_path: process.env.DB_PATH || '(not set)',
  };
}

export function getDatabase(): any {
  if (IS_PG) return pgPool;
  return sqliteDb;
}

// ====== Schema & Seed ======

async function run(sql: string, params: any[] = []): Promise<void> {
  if (IS_PG) {
    const { text, values } = pgConvert(sql, params);
    await pgPool!.query(text, values);
  } else {
    sqliteRunQuery(sql, params);
  }
}

async function initializeSchema(): Promise<void> {
  const autoPk = IS_PG ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const nowFn = IS_PG ? 'NOW()' : "datetime('now', 'localtime')";

  const sqls: string[] = [];

  sqls.push(`
    CREATE TABLE IF NOT EXISTS acolhidos (
      id ${autoPk},
      nome TEXT NOT NULL,
      data_nascimento TEXT NOT NULL,
      data_acolhimento TEXT NOT NULL,
      sexo TEXT NOT NULL DEFAULT 'Masculino',
      cor_raca TEXT DEFAULT '',
      deficiencia TEXT DEFAULT '',
      grau_dependencia TEXT DEFAULT '',
      observacoes TEXT DEFAULT '',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (${nowFn}),
      updated_at TEXT NOT NULL DEFAULT (${nowFn})
    )
  `);

  sqls.push(`
    CREATE TABLE IF NOT EXISTS desligamentos (
      id ${autoPk},
      acolhido_id INTEGER NOT NULL,
      data_desligamento TEXT NOT NULL,
      motivo TEXT NOT NULL,
      observacoes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (${nowFn}),
      FOREIGN KEY (acolhido_id) REFERENCES acolhidos(id)
    )
  `);

  sqls.push(`
    CREATE TABLE IF NOT EXISTS relatorios (
      id ${autoPk},
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      dados TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (${nowFn}),
      updated_at TEXT NOT NULL DEFAULT (${nowFn}),
      UNIQUE(mes, ano)
    )
  `);

  sqls.push(`
    CREATE TABLE IF NOT EXISTS imagens_atividades (
      id ${autoPk},
      relatorio_id INTEGER NOT NULL,
      categoria TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      descricao TEXT DEFAULT '',
      rotation INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (${nowFn}),
      FOREIGN KEY (relatorio_id) REFERENCES relatorios(id) ON DELETE CASCADE
    )
  `);

  sqls.push(`
    CREATE TABLE IF NOT EXISTS users (
      id ${autoPk},
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (${nowFn})
    )
  `);

  sqls.push(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id ${autoPk},
      relatorio_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      changes TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (${nowFn}),
      FOREIGN KEY (relatorio_id) REFERENCES relatorios(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  sqls.push(`
    CREATE TABLE IF NOT EXISTS categorias (
      id ${autoPk},
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📎',
      created_at TEXT NOT NULL DEFAULT (${nowFn})
    )
  `);

  for (const sql of sqls) {
    await run(sql);
  }

  if (!IS_PG) {
    try {
      sqliteRunQuery('ALTER TABLE imagens_atividades ADD COLUMN rotation INTEGER NOT NULL DEFAULT 0');
    } catch {}
  }
}

async function seedData(): Promise<void> {
  if (!IS_PG) {
    const bcrypt = require('bcryptjs');
    const userCount = await queryOne('SELECT COUNT(*) as total FROM users');
    if (userCount && userCount.total === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await run(`
        INSERT INTO users (nome, email, password_hash, role, approved)
        VALUES (?, ?, ?, 'admin', 1)
      `, ['Administrador', 'admin@rmadavi.com', hash]);
      console.log('[seed] Admin criado: admin@rmadavi.com');
    } else {
      await run("UPDATE users SET email = 'admin@rmadavi.com' WHERE email = 'admin@ebenezer.com'");
    }

    const acolhidoCount = await queryOne('SELECT COUNT(*) as total FROM acolhidos');
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
        await run(`
          INSERT INTO acolhidos (nome, data_nascimento, data_acolhimento, sexo)
          VALUES (?, ?, ?, ?)
        `, [a.nome, a.data_nascimento, a.data_acolhimento, a.sexo]);
      }
      console.log(`[seed] ${acolhidos.length} acolhidos importados`);
    }
  }

  const catCount = await queryOne('SELECT COUNT(*) as total FROM categorias');
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
      await run('INSERT INTO categorias (value, label, icon) VALUES (?, ?, ?)', [c.value, c.label, c.icon]);
    }
    console.log(`[seed] ${defaultCategorias.length} categorias importadas`);
  }
}

export async function initDatabase(): Promise<void> {
  if (IS_PG) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    await pgPool.connect();
    console.log('[pg] Conectado ao PostgreSQL');
    await initializeSchema();
    await seedData();
    const result = await pgPool.query('SELECT COUNT(*) as total FROM categorias');
    console.log('[pg] Categorias:', result.rows[0]?.total);
    return;
  }

  if (sqliteDb) return;
  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();

  const dbPath = getDbPath();
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqliteDb = new SQL.Database(buffer);
  } else {
    sqliteDb = new SQL.Database();
  }
  sqliteDb.run('PRAGMA foreign_keys = ON');

  await initializeSchema();
  await seedData();
  saveSqliteDb();
}
