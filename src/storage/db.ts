/**
 * Storage: uses Node.js built-in node:sqlite (Node 22.5+).
 * No native compilation needed. Falls back to in-memory if unavailable.
 */
import { RunState } from '../core/types.js';

// Suppress experimental warning for node:sqlite
// @ts-ignore
const { DatabaseSync } = await import('node:sqlite').catch(() => ({ DatabaseSync: null }));

let db: any = null;

function getDb() {
  if (db) return db;

  if (!DatabaseSync) {
    // Pure in-memory map fallback (should not happen on Node 24)
    console.warn('WARNING: node:sqlite unavailable, using volatile in-memory storage.');
    return null;
  }

  const dbPath = process.env.PENTIMENTO_DB_PATH || 'pentimento.db';
  db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      runId TEXT PRIMARY KEY,
      telegramUserId TEXT,
      state TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      runId TEXT NOT NULL,
      type TEXT NOT NULL,
      turn INTEGER NOT NULL,
      data TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      runId TEXT NOT NULL,
      scope TEXT NOT NULL,
      subjectId TEXT,
      summary TEXT NOT NULL,
      importance INTEGER NOT NULL,
      turn INTEGER NOT NULL
    );
  `);
  return db;
}

// ─── In-memory fallback (only if node:sqlite truly unavailable) ───────────────
const memRuns = new Map<string, { telegramUserId: string | null; state: RunState }>();
const memEvents: any[] = [];

// ─── Public API ───────────────────────────────────────────────────────────────

export function getRun(runId: string): RunState | null {
  const d = getDb();
  if (!d) {
    return memRuns.get(runId)?.state ?? null;
  }
  const row = d.prepare('SELECT state FROM runs WHERE runId = ?').get(runId) as { state: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.state) as RunState;
}

export function saveRun(runId: string, telegramUserId: string | null, state: RunState): void {
  const d = getDb();
  if (!d) {
    memRuns.set(runId, { telegramUserId, state });
    return;
  }
  d.prepare(`
    INSERT INTO runs (runId, telegramUserId, state)
    VALUES (?, ?, ?)
    ON CONFLICT(runId) DO UPDATE SET
      telegramUserId = excluded.telegramUserId,
      state = excluded.state,
      updatedAt = datetime('now')
  `).run(runId, telegramUserId, JSON.stringify(state));
}

export function getRunByTelegramUser(telegramUserId: string): { runId: string; state: RunState } | null {
  const d = getDb();
  if (!d) {
    for (const [runId, rec] of memRuns) {
      if (rec.telegramUserId === telegramUserId) return { runId, state: rec.state };
    }
    return null;
  }
  const row = d.prepare(
    'SELECT runId, state FROM runs WHERE telegramUserId = ? ORDER BY updatedAt DESC LIMIT 1'
  ).get(telegramUserId) as { runId: string; state: string } | undefined;
  if (!row) return null;
  return { runId: row.runId, state: JSON.parse(row.state) as RunState };
}

export function deleteRun(runId: string): void {
  const d = getDb();
  if (!d) {
    memRuns.delete(runId);
    return;
  }
  d.prepare('DELETE FROM runs WHERE runId = ?').run(runId);
  d.prepare('DELETE FROM events WHERE runId = ?').run(runId);
  d.prepare('DELETE FROM memories WHERE runId = ?').run(runId);
}

export function deleteRunsByTelegramUser(telegramUserId: string): void {
  const d = getDb();
  if (!d) {
    for (const [runId, rec] of memRuns) {
      if (rec.telegramUserId === telegramUserId) memRuns.delete(runId);
    }
    return;
  }
  d.prepare('DELETE FROM runs WHERE telegramUserId = ?').run(telegramUserId);
}

export function resetAllRuns(): void {
  const d = getDb();
  if (!d) {
    memRuns.clear();
    memEvents.length = 0;
    return;
  }
  d.prepare('DELETE FROM runs').run();
  d.prepare('DELETE FROM events').run();
  d.prepare('DELETE FROM memories').run();
}

export function appendEventToDb(id: string, runId: string, type: string, turn: number, data: object): void {
  const d = getDb();
  if (!d) {
    memEvents.push({ id, runId, type, turn, data, timestamp: new Date().toISOString() });
    return;
  }
  d.prepare(`
    INSERT OR IGNORE INTO events (id, runId, type, turn, data)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, runId, type, turn, JSON.stringify(data));
}
