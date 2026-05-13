const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  try {
    const raw = process.env.DATABASE_URL || '';
    try {
      const url = new URL(raw);
      console.log('Parsed DB URL; host:', url.hostname, 'port:', url.port, 'db:', url.pathname.slice(1));
      console.log('Password length:', url.password ? url.password.length : 0);
    } catch (e) {
      console.log('DATABASE_URL could not be parsed as URL. Raw value length:', raw.length);
    }

    const pool = new Pool({ connectionString: raw, ssl: { rejectUnauthorized: false } });
    const res = await pool.query('SELECT 1 as ok');
    console.log('Connected OK:', res.rows[0]);
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Connection error:', e);
    process.exit(1);
  }
})();
