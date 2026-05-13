const { query, requireDb } = require('./pool');

function toReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    rentalId: row.rental_id,
    listingId: row.listing_id,
    reviewerEmail: row.reviewer_email,
    revieweeEmail: row.reviewee_email,
    rating: row.rating,
    body: row.body || '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

async function createReview({ rentalId, reviewerEmail, rating, body }) {
  requireDb();
  const rentalRes = await query(
    `SELECT * FROM rentals
     WHERE id=$1 AND status='confirmed' AND (lower(renter_email)=lower($2) OR lower(owner_email)=lower($2))`,
    [rentalId, reviewerEmail]
  );
  const rental = rentalRes.rows[0];
  if (!rental) {
    const err = new Error('Confirmed rental not found');
    err.status = 404;
    throw err;
  }
  const revieweeEmail = rental.renter_email.toLowerCase() === reviewerEmail.toLowerCase()
    ? rental.owner_email
    : rental.renter_email;
  const res = await query(
    `INSERT INTO reviews (rental_id, listing_id, reviewer_email, reviewee_email, rating, body)
     VALUES ($1,$2,lower($3),lower($4),$5,$6)
     ON CONFLICT (rental_id, reviewer_email) DO UPDATE SET rating=$5, body=$6
     RETURNING *`,
    [rentalId, rental.listing_id, reviewerEmail, revieweeEmail, rating, body || '']
  );
  return toReview(res.rows[0]);
}

async function getReviewsForUser(email) {
  requireDb();
  const res = await query('SELECT * FROM reviews WHERE lower(reviewee_email)=lower($1) ORDER BY created_at DESC', [email]);
  return res.rows.map(toReview);
}

module.exports = { createReview, getReviewsForUser };
