-- Ejecutar en Neon SQL Editor (neon.tech → SQL Editor)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS despachos (
  id         SERIAL PRIMARY KEY,
  nombre     TEXT NOT NULL,
  admin_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS despacho_members (
  despacho_id INTEGER REFERENCES despachos(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (despacho_id, user_id)
);

CREATE TABLE IF NOT EXISTS contribuyentes (
  id          SERIAL PRIMARY KEY,
  rfc         TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  datos       JSONB DEFAULT '{}',
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  despacho_id INTEGER REFERENCES despachos(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (rfc, user_id)
);

CREATE TABLE IF NOT EXISTS lista_69b (
  rfc        TEXT PRIMARY KEY,
  tipo       TEXT,
  situacion  TEXT
);

CREATE TABLE IF NOT EXISTS lista_69b_sync (
  id            SERIAL PRIMARY KEY,
  synced_at     TIMESTAMPTZ DEFAULT NOW(),
  records_count INTEGER,
  synced_by     INTEGER REFERENCES users(id) ON DELETE SET NULL
);
