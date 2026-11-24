-- Comptes Yam's : données privées (jamais dans Firestore)
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  pseudo TEXT,
  pseudo_norm TEXT UNIQUE,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS codes (
  email TEXT PRIMARY KEY,
  hash TEXT,
  expires INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL,
  day TEXT NOT NULL,
  day_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS passkeys (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS passkeys_uid ON passkeys(uid);
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  challenge TEXT NOT NULL,
  uid TEXT,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ratelimit (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires INTEGER NOT NULL
);
