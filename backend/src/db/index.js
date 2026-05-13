const { query, requireDb } = require('./pool');

function toListing(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    desc: row.description || '',
    description: row.description || '',
    category: row.category || '',
    price: Number(row.price || 0),
    location: row.location || '',
    image: row.image || '',
    owner: row.owner_email || '',
    ownerEmail: row.owner_email || '',
    status: row.status || 'active',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0,
  };
}

async function getListings({ includeInactive = false, ownerEmail = null } = {}) {
  requireDb();
  const clauses = ["status != 'removed'"];
  const params = [];
  if (ownerEmail) {
    params.push(ownerEmail);
    clauses.push(`lower(owner_email) = lower($${params.length})`);
    if (!includeInactive) clauses.push("status != 'removed'");
  } else {
    clauses.push("status = 'active'");
  }
  const where = `WHERE ${clauses.join(' AND ')}`;
  const res = await query(`SELECT * FROM listings ${where} ORDER BY created_at DESC`, params);
  return res.rows.map(toListing);
}

async function getListingById(id) {
  requireDb();
  const res = await query('SELECT * FROM listings WHERE id = $1', [id]);
  return toListing(res.rows[0]);
}

async function createListing(item, ownerEmail) {
  requireDb();
  const res = await query(
    `INSERT INTO listings (title, description, category, price, location, image, owner_email, status)
     VALUES ($1, $2, $3, $4, $5, $6, lower($7), $8) RETURNING *`,
    [
      item.title,
      item.desc || item.description || '',
      item.category || 'General',
      item.price || 0,
      item.location || '',
      item.image || '',
      ownerEmail,
      item.status === 'active' ? 'active' : 'pending',
    ]
  );
  return toListing(res.rows[0]);
}

async function updateListing(id, ownerEmail, changes) {
  requireDb();
  const SAFE_COLUMNS = new Set(['title', 'price', 'location', 'image', 'description', 'status', 'category',
    'renter_name', 'renter_email', 'rented_start_date', 'rented_end_date']);
  const sets = [];
  const params = [];
  for (const [key, val] of Object.entries(changes)) {
    const col = key === 'desc' ? 'description' : key;
    if (!SAFE_COLUMNS.has(col)) continue;
    sets.push(`${col} = $${params.length + 1}`);
    params.push(val);
  }
  if (!sets.length) return getListingById(id);
  params.push(id, ownerEmail);
  const res = await query(
    `UPDATE listings SET ${sets.join(', ')}, updated_at = now()
     WHERE id = $${params.length - 1} AND (lower(owner_email) = lower($${params.length}) OR owner_email IS NULL OR owner_email = '')
     RETURNING *`,
    params
  );
  return toListing(res.rows[0]);
}

async function removeListing(id, ownerEmail) {
  requireDb();
  const res = await query(
    `UPDATE listings SET status = 'removed', updated_at = now()
     WHERE id = $1 AND (lower(owner_email) = lower($2) OR owner_email IS NULL OR owner_email = '') RETURNING *`,
    [id, ownerEmail]
  );
  // Cancel any pending rental requests for this listing so they don't linger
  await query(
    `UPDATE rentals SET status = 'cancelled', updated_at = now()
     WHERE listing_id = $1 AND status = 'pending'`,
    [id]
  );
  return toListing(res.rows[0]);
}

module.exports = { getListings, getListingById, createListing, updateListing, removeListing };
