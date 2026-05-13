require('dotenv').config();

const { query, requireDb } = require('./pool');

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    location: row.location,
    image: row.image,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  };
}

async function getUserByEmail(email) {
  requireDb();
  const res = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return toUser(res.rows[0]);
}

async function createUser({ email, passwordHash, name, location }) {
  requireDb();
  const res = await query(
    'INSERT INTO users (email, password_hash, name, location) VALUES (lower($1),$2,$3,$4) RETURNING *',
    [email, passwordHash, name, location]
  );
  return toUser(res.rows[0]);
}

async function createOAuthUser({ email, name, image, oauthProvider, oauthId }) {
  requireDb();
  // password_hash is NOT NULL in the current schema, so we store a placeholder.
  // It cannot match any bcrypt hash, so password login is blocked for OAuth accounts.
  const oauthPlaceholder = `oauth:${oauthProvider}:${oauthId}`;
  const res = await query(
    'INSERT INTO users (email, password_hash, name, image, location) VALUES (lower($1),$2,$3,$4,$5) RETURNING *',
    [email, oauthPlaceholder, name, image, '']
  );
  return toUser(res.rows[0]);
}

module.exports = { getUserByEmail, createUser, createOAuthUser, toUser };
