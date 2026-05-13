const { Pool } = require('pg');
require('dotenv').config();

let pool;
let isConfigured = false;

const connectionString = process.env.DATABASE_URL;
const hasPgUser = process.env.PGUSER && process.env.PGUSER !== 'youruser';

if (connectionString || hasPgUser) {
  try {
    pool = connectionString
      ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
      : new Pool();
    isConfigured = true;
  } catch (e) {
    isConfigured = false;
  }
}

async function query(text, params) {
  if (!isConfigured) throw new Error('Database not configured');
  return pool.query(text, params);
}

function requireDb() {
  if (!isConfigured) {
    const err = new Error('Database not configured');
    err.status = 503;
    throw err;
  }
}

module.exports = { query, isConfigured, requireDb };
