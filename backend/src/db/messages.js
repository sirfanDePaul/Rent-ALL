const { query, requireDb } = require('./pool');

function conversationIdFor(a, b) {
  return [a, b].map(v => String(v || '').toLowerCase()).sort().join(':');
}

function toMessage(row) {
  if (!row) return null;
  const metadata = row.metadata || {};
  return {
    id: row.id,
    conversationId: row.conversation_id,
    from: row.from_email,
    to: row.to_email,
    fromEmail: row.from_email,
    toEmail: row.to_email,
    body: row.body,
    timestamp: Number(row.timestamp || (row.created_at ? new Date(row.created_at).getTime() : Date.now())),
    read: !!row.read,
    type: row.type || null,
    rentalId: row.rental_id || null,
    request: metadata.request || null,
    payment: metadata.payment || null,
    rental: metadata.rental || null,
    dispute: metadata.dispute || null,
  };
}

async function getConversations(email) {
  requireDb();
  const res = await query(
    `SELECT conversation_id,
      MAX(COALESCE(timestamp, (EXTRACT(EPOCH FROM created_at) * 1000)::bigint)) AS timestamp,
      (array_agg(body ORDER BY COALESCE(timestamp, (EXTRACT(EPOCH FROM created_at) * 1000)::bigint) DESC))[1] AS lastBody,
      (array_agg(from_email ORDER BY COALESCE(timestamp, (EXTRACT(EPOCH FROM created_at) * 1000)::bigint) DESC))[1] AS lastFrom,
      (array_agg(to_email ORDER BY COALESCE(timestamp, (EXTRACT(EPOCH FROM created_at) * 1000)::bigint) DESC))[1] AS lastTo,
      SUM(CASE WHEN to_email = $1 AND read = false THEN 1 ELSE 0 END)::int AS unread
     FROM messages
     WHERE from_email = $1 OR to_email = $1
     GROUP BY conversation_id
     ORDER BY timestamp DESC`,
    [email]
  );
  return res.rows.map(r => ({ id: r.conversation_id, otherEmail: (r.lastfrom === email ? r.lastto : r.lastfrom), lastBody: r.lastbody, timestamp: Number(r.timestamp), unread: r.unread > 0 }));
}

async function getMessages(conversationId) {
  requireDb();
  const res = await query('SELECT * FROM messages WHERE conversation_id=$1 ORDER BY COALESCE(timestamp, (EXTRACT(EPOCH FROM created_at) * 1000)::bigint) ASC', [conversationId]);
  return res.rows.map(toMessage);
}

async function sendMessage({ from, to, body, conversationId, type, rentalId, metadata = {} }) {
  requireDb();
  const ts = Date.now();
  const res = await query(
    'INSERT INTO messages (conversation_id, from_email, to_email, body, timestamp, read, type, rental_id, metadata) VALUES ($1,lower($2),lower($3),$4,$5,$6,$7,$8,$9) RETURNING *',
    [conversationId || conversationIdFor(from, to), from, to, body, ts, false, type || null, rentalId || null, metadata]
  );
  return toMessage(res.rows[0]);
}

async function markRead(conversationId, email) {
  requireDb();
  await query('UPDATE messages SET read = true WHERE conversation_id = $1 AND to_email = $2', [conversationId, email]);
}

module.exports = { getConversations, getMessages, sendMessage, markRead, conversationIdFor, toMessage };
