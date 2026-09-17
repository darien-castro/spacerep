const path = require('path');
const fs = require('fs');

// Ensure data folder exists in project directory
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'spacerep.db');

let dbDriver = null;
let isNativeNodeSqlite = false;

try {
  const Database = require('better-sqlite3');
  dbDriver = new Database(dbPath);
  // Enable WAL mode for better concurrency and performance
  dbDriver.pragma('journal_mode = WAL');
  dbDriver.pragma('foreign_keys = ON');
} catch (err) {
  console.warn('better-sqlite3 failed to load, falling back to node:sqlite built-in...', err.message);
  try {
    const { DatabaseSync } = require('node:sqlite');
    dbDriver = new DatabaseSync(dbPath);
    dbDriver.exec('PRAGMA foreign_keys = ON;');
    isNativeNodeSqlite = true;
  } catch (nodeSqliteErr) {
    console.error('Fatal: Could not load any SQLite driver.', nodeSqliteErr);
    throw nodeSqliteErr;
  }
}

// Unified wrapper to present a clean prepare().all(), .get(), .run() interface
class DBWrapper {
  constructor(rawDb, isNative) {
    this.rawDb = rawDb;
    this.isNative = isNative;
  }

  exec(sql) {
    return this.rawDb.exec(sql);
  }

  prepare(sql) {
    const stmt = this.rawDb.prepare(sql);
    if (!this.isNative) {
      return stmt; // better-sqlite3 already has .all(), .get(), .run()
    }
    return {
      all: (...args) => stmt.all(...args),
      get: (...args) => stmt.get(...args),
      run: (...args) => {
        const result = stmt.run(...args);
        return {
          changes: result.changes,
          lastInsertRowid: result.lastInsertRowid
        };
      }
    };
  }

  close() {
    if (this.rawDb.close) this.rawDb.close();
  }
}

const db = new DBWrapper(dbDriver, isNativeNodeSqlite);

// Schema initialization
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT '🚀',
      color TEXT DEFAULT '#38bdf8',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      hint TEXT DEFAULT '',
      orbit_level INTEGER DEFAULT 1,
      interval_days INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      due_date TEXT NOT NULL,
      last_reviewed_at TEXT,
      lapses INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck_id);
    CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(due_date);

    CREATE TABLE IF NOT EXISTS review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      deck_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      previous_interval INTEGER NOT NULL,
      new_interval INTEGER NOT NULL,
      orbit_level INTEGER NOT NULL,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_logs_date ON review_logs(reviewed_at);

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pilot_name TEXT DEFAULT 'Cosmo Cadence',
      stardust INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      highest_streak INTEGER DEFAULT 0,
      last_study_date TEXT,
      sound_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure default user profile exists
  const profile = db.prepare('SELECT id FROM user_profile WHERE id = 1').get();
  if (!profile) {
    db.prepare(`
      INSERT INTO user_profile (id, pilot_name, stardust, current_streak, highest_streak, sound_enabled)
      VALUES (1, 'Commander Stardust', 100, 1, 1, 1)
    `).run();
  }
}

initSchema();

module.exports = {
  db,
  dbPath
};
