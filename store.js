'use strict';
// Persists the whole app state as one JSON document.
// With DATABASE_URL set it lives in Postgres (survives redeploys on free hosts);
// otherwise it's a JSON file in DATA_DIR (default ./data).
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'db.json');

let pool = null;

async function load() {
  if (DATABASE_URL) {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });
    await pool.query('CREATE TABLE IF NOT EXISTS app_state (id INT PRIMARY KEY, data TEXT NOT NULL)');
    const r = await pool.query('SELECT data FROM app_state WHERE id = 1');
    console.log('Storage: Postgres');
    return r.rows[0] ? JSON.parse(r.rows[0].data) : null;
  }
  console.log(`Storage: ${FILE}`);
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

async function save(state) {
  const json = JSON.stringify(state);
  if (pool) {
    await pool.query(
      'INSERT INTO app_state (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data',
      [json]
    );
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, FILE);
}

module.exports = { load, save };
