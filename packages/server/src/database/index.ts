/**
 * @vayu/server — Database Module
 *
 * Initialises and manages a SQLite database via sql.js (pure-JS SQLite
 * implementation, no native bindings required).
 *
 * The database file is read into memory on startup and written back to disk
 * on explicit save calls. A periodic auto-save runs every 60 seconds.
 *
 * Usage:
 *   import { initDatabase, getDb, saveDatabase } from './database/index.js';
 *   await initDatabase('./data/vayu.db');
 *   const db = getDb();
 *   db.run('INSERT INTO sessions ...');
 *   saveDatabase('./data/vayu.db');
 */

import initSqlJs, { type Database } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let db: Database | null = null;
let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise the SQLite database.
 *
 * - If a file exists at `dbPath`, it is loaded into memory.
 * - If it does not exist, a fresh in-memory database is created.
 * - After loading, all pending migrations are executed.
 * - A periodic auto-save is started (every 60 s).
 *
 * @param dbPath Absolute or relative path to the `.db` file.
 * @returns The sql.js Database instance.
 */
export async function initDatabase(dbPath: string): Promise<Database> {
  const SQL = await initSqlJs();

  // Ensure the parent directory exists
  const dir = path.dirname(path.resolve(dbPath));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing database or create a new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log(`Database loaded from ${dbPath}`);
  } else {
    db = new SQL.Database();
    console.log(`New database created (will be saved to ${dbPath})`);
  }

  // Enable WAL-like pragmas for better performance in sql.js
  db.run('PRAGMA journal_mode = MEMORY');
  db.run('PRAGMA foreign_keys = ON');

  // Run all pending migrations
  runMigrations(db);

  // Initial save to persist migrations
  saveDatabase(dbPath);

  // Auto-save every 60 seconds
  autoSaveInterval = setInterval(() => {
    saveDatabase(dbPath);
  }, 60_000);

  return db;
}

/**
 * Get the current database instance.
 * Throws if `initDatabase` has not been called.
 */
export function getDb(): Database {
  if (!db) {
    throw new Error(
      'Database not initialised. Call initDatabase() before getDb().',
    );
  }
  return db;
}

/**
 * Write the in-memory database to disk.
 * Safe to call frequently — it is a no-op if there is no active database.
 */
export function saveDatabase(dbPath: string): void {
  if (!db) return;

  try {
    const data = db.export();
    const buffer = Buffer.from(data);

    // Ensure directory exists (defensive — should already exist from init)
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

/**
 * Close the database and stop auto-save.
 * Call during graceful shutdown.
 */
export function closeDatabase(dbPath: string): void {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }

  if (db) {
    saveDatabase(dbPath);
    db.close();
    db = null;
    console.log('Database closed');
  }
}

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------

/**
 * Run all SQL migration files from the `migrations/` directory that
 * have not yet been applied.
 *
 * Migration tracking uses a `_migrations` table that records filenames.
 * Files are executed in alphabetical order (use numeric prefixes like
 * `001-initial.sql`, `002-add-columns.sql`).
 */
function runMigrations(database: Database): void {
  // Create the migrations tracking table if it does not exist
  database.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      filename  TEXT    NOT NULL UNIQUE,
      applied   TEXT    NOT NULL
    )
  `);

  // Resolve the migrations directory relative to this file
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.join(thisDir, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.warn(`Migrations directory not found: ${migrationsDir}`);
    return;
  }

  // Collect already-applied migration filenames
  const applied = new Set<string>();
  const rows = database.exec('SELECT filename FROM _migrations');
  if (rows.length > 0) {
    for (const row of rows[0].values) {
      applied.add(row[0] as string);
    }
  }

  // Read, sort, and apply pending migrations
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`Running migration: ${file}`);
    try {
      database.run(sql);
      database.run(
        'INSERT INTO _migrations (filename, applied) VALUES (?, ?)',
        [file, new Date().toISOString()],
      );
    } catch (err) {
      console.error(`Migration failed: ${file}`, err);
      throw err;
    }
  }
}
