const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export DATABASE_URL or create backend/.env');
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      console.log('Running', f);
      await pool.query(sql);
    }
    console.log('Migrations complete');
    process.exit(0);
  } catch (e) {
    console.error('Migration error', e);
    process.exit(1);
  }
})();
