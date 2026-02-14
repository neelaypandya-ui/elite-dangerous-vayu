-- ---------------------------------------------------------------------------
-- 001-initial.sql — VAYU initial database schema
--
-- Tables for persisting session data, journal events, logbook entries,
-- trivia scores, screenshots, and mining sessions.
-- ---------------------------------------------------------------------------

-- Game sessions (one per launch / play session)
CREATE TABLE IF NOT EXISTS sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time  TEXT    NOT NULL,
  end_time    TEXT,
  jumps       INTEGER DEFAULT 0,
  distance    REAL    DEFAULT 0,
  earnings    INTEGER DEFAULT 0,
  commander   TEXT
);

-- Raw journal events (archived for replay and analytics)
CREATE TABLE IF NOT EXISTS journal_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT    NOT NULL,
  event       TEXT    NOT NULL,
  data        TEXT    NOT NULL,
  session_id  INTEGER REFERENCES sessions(id)
);

-- Commander logbook entries (user-authored or auto-generated)
CREATE TABLE IF NOT EXISTS logbook_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT    NOT NULL,
  title       TEXT,
  content     TEXT    NOT NULL,
  system      TEXT,
  body        TEXT,
  station     TEXT,
  ship        TEXT,
  tags        TEXT
);

-- Trivia game scores
CREATE TABLE IF NOT EXISTS trivia_scores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  correct     INTEGER NOT NULL,
  total       INTEGER NOT NULL,
  difficulty  TEXT
);

-- Screenshot metadata
CREATE TABLE IF NOT EXISTS screenshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  filename    TEXT    NOT NULL UNIQUE,
  filepath    TEXT    NOT NULL,
  timestamp   TEXT    NOT NULL,
  system      TEXT,
  body        TEXT,
  station     TEXT,
  ship        TEXT,
  event_type  TEXT,
  tags        TEXT
);

-- Mining session tracking
CREATE TABLE IF NOT EXISTS mining_sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time    TEXT    NOT NULL,
  end_time      TEXT,
  system        TEXT,
  ring_type     TEXT,
  method        TEXT,
  total_refined INTEGER DEFAULT 0,
  total_value   INTEGER DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_journal_events_timestamp ON journal_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_journal_events_event     ON journal_events(event);
CREATE INDEX IF NOT EXISTS idx_journal_events_session   ON journal_events(session_id);
CREATE INDEX IF NOT EXISTS idx_logbook_entries_system    ON logbook_entries(system);
CREATE INDEX IF NOT EXISTS idx_logbook_entries_timestamp ON logbook_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_screenshots_system        ON screenshots(system);
CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp     ON screenshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_system    ON mining_sessions(system);
