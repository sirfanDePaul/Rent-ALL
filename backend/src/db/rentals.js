const { query, requireDb } = require('./pool');
const listingsDb = require('./index');
const messagesDb = require('./messages');

function toRental(row) {
  if (!row) return null;
  return {
    id: row.id,
    listingId: row.listing_id,
    title: row.title,
    image: row.image,
    location: row.location,
    pricePerDay: Number(row.price_per_day || 0),
    renterEmail: row.renter_email,
    ownerEmail: row.owner_email,
    renterName: row.renter_name,
    ownerName: row.owner_name,
    renterPhone: row.renter_phone,
    note: row.note,
    startDate: row.start_date ? row.start_date.toISOString?.().split('T')[0] || String(row.start_date).split('T')[0] : null,
    endDate: row.end_date ? row.end_date.toISOString?.().split('T')[0] || String(row.end_date).split('T')[0] : null,
    days: row.days,
    status: row.status,
    total: Number(row.total || 0),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    respondedAt: row.responded_at ? new Date(row.responded_at).getTime() : 0,
    paidAt: row.paid_at ? new Date(row.paid_at).getTime() : 0,
  };
}

async function createNotification(userEmail, type, subject, body) {
  await query(
    'INSERT INTO notifications (user_email, type, subject, body) VALUES (lower($1),$2,$3,$4)',
    [userEmail, type, subject, body]
  );
}

async function createRental(rental) {
  requireDb();
  const res = await query(
    `INSERT INTO rentals
      (listing_id, title, image, location, price_per_day, renter_email, owner_email, renter_name, owner_name, renter_phone, note, start_date, end_date, days, status, total)
     VALUES ($1,$2,$3,$4,$5,lower($6),lower($7),$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [
      rental.listingId || null,
      rental.title || null,
      rental.image || null,
      rental.location || null,
      rental.pricePerDay || null,
      rental.renterEmail,
      rental.ownerEmail,
      rental.renterName || null,
      rental.ownerName || null,
      rental.renterPhone || null,
      rental.note || null,
      rental.startDate || null,
      rental.endDate || null,
      rental.days || null,
      rental.status || 'pending',
      rental.total || null,
    ]
  );
  return toRental(res.rows[0]);
}

async function createRentalRequest(request, currentUser) {
  requireDb();
  const listing = await listingsDb.getListingById(Number(request.listingId));
  if (!listing || listing.status !== 'active') {
    const err = new Error('Listing is not available');
    err.status = 400;
    throw err;
  }
  if (listing.ownerEmail === currentUser.email) {
    const err = new Error('You cannot rent your own listing');
    err.status = 400;
    throw err;
  }
  const start = new Date(request.startDate);
  const end = new Date(request.endDate);
  const days = Math.ceil((end - start) / 86400000);
  if (!request.startDate || !request.endDate || !Number.isFinite(days) || days <= 0) {
    const err = new Error('Valid rental dates are required');
    err.status = 400;
    throw err;
  }
  const rental = await createRental({
    listingId: listing.id,
    title: listing.title,
    image: listing.image,
    location: listing.location,
    pricePerDay: listing.price,
    ownerEmail: listing.ownerEmail,
    renterEmail: currentUser.email,
    renterName: currentUser.name,
    renterPhone: request.renterPhone || '',
    note: request.note || '',
    startDate: request.startDate,
    endDate: request.endDate,
    days,
    total: days * Number(listing.price || 0),
    status: 'pending',
  });
  await messagesDb.sendMessage({
    from: currentUser.email,
    to: listing.ownerEmail,
    body: `Rental request for ${listing.title}`,
    type: 'rental_request',
    rentalId: rental.id,
    metadata: { request: rental },
  });
  await createNotification(listing.ownerEmail, 'rental_request', 'New rental request', `${currentUser.name} requested ${listing.title}.`);
  return rental;
}

async function respondToRentalRequest(rentalId, responderEmail, decision) {
  requireDb();
  const now = new Date();
  const status = decision === 'accepted' ? 'accepted' : 'declined';
  const res = await query(
    'UPDATE rentals SET status=$1, responded_at=$2, updated_at=now() WHERE id=$3 AND lower(owner_email)=lower($4) RETURNING *',
    [status, now, rentalId, responderEmail]
  );
  const rental = toRental(res.rows[0]);
  if (!rental) return null;
  await query(
    `UPDATE messages SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{request,status}', to_jsonb($1::text), true)
     WHERE rental_id = $2 AND metadata ? 'request'`,
    [status, rental.id]
  );
  await messagesDb.sendMessage({
    from: rental.ownerEmail,
    to: rental.renterEmail,
    body: status === 'accepted' ? `Rental accepted for ${rental.title}. Payment required.` : `Rental declined for ${rental.title}.`,
    type: status === 'accepted' ? 'payment_request' : 'rental_update',
    rentalId: rental.id,
    metadata: status === 'accepted' ? { payment: { ...rental, status: 'pending' } } : { request: rental },
  });
  await createNotification(rental.renterEmail, 'rental_update', 'Rental request updated', `Your request for ${rental.title} was ${status}.`);
  return rental;
}

async function submitRentalPayment(rentalId, payerEmail) {
  requireDb();
  const now = new Date();
  const res = await query(
    'UPDATE rentals SET status=$1, paid_at=$2, updated_at=now() WHERE id=$3 AND lower(renter_email)=lower($4) AND status=$5 RETURNING *',
    ['confirmed', now, rentalId, payerEmail, 'accepted']
  );
  const rental = toRental(res.rows[0]);
  if (!rental) return null;
  await query('UPDATE listings SET status=$1, updated_at=now() WHERE id=$2', ['rented', rental.listingId]);
  await query(
    `UPDATE messages SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{payment,status}', to_jsonb('paid'::text), true)
     WHERE rental_id = $1 AND metadata ? 'payment'`,
    [rental.id]
  );
  await messagesDb.sendMessage({
    from: rental.renterEmail,
    to: rental.ownerEmail,
    body: `Payment submitted for ${rental.title}. Rental confirmed.`,
    type: 'payment_update',
    rentalId: rental.id,
    metadata: { payment: { ...rental, status: 'paid' } },
  });
  await createNotification(rental.ownerEmail, 'payment', 'Rental confirmed', `${rental.renterName} confirmed payment for ${rental.title}.`);
  return rental;
}

async function getRentals(email) {
  requireDb();
  const res = await query(
    `SELECT * FROM rentals
     WHERE (lower(owner_email)=lower($1) OR lower(renter_email)=lower($1))
       AND status != 'cancelled'
     ORDER BY created_at DESC`,
    [email]
  );
  return res.rows.map(toRental);
}

async function initiateReturn(rentalId, renterEmail) {
  requireDb();
  const res = await query(
    `UPDATE rentals SET status='return_pending', updated_at=now()
     WHERE id=$1 AND lower(renter_email)=lower($2) AND status='confirmed'
     RETURNING *`,
    [rentalId, renterEmail]
  );
  const rental = toRental(res.rows[0]);
  if (!rental) return null;
  await messagesDb.sendMessage({
    from: rental.renterEmail,
    to: rental.ownerEmail,
    body: `${rental.renterName || rental.renterEmail} has marked "${rental.title}" as returned. Please confirm you received the item back in acceptable condition.`,
    type: 'return_initiated',
    rentalId: rental.id,
    metadata: { rental },
  });
  await createNotification(rental.ownerEmail, 'return_initiated', 'Item marked as returned',
    `${rental.renterName || rental.renterEmail} has marked "${rental.title}" as returned. Please confirm.`);
  return rental;
}

async function confirmReturn(rentalId, ownerEmail) {
  requireDb();
  const res = await query(
    `UPDATE rentals SET status='completed', updated_at=now()
     WHERE id=$1 AND lower(owner_email)=lower($2) AND status='return_pending'
     RETURNING *`,
    [rentalId, ownerEmail]
  );
  const rental = toRental(res.rows[0]);
  if (!rental) return null;
  await query('UPDATE listings SET status=$1, updated_at=now() WHERE id=$2', ['active', rental.listingId]);
  await messagesDb.sendMessage({
    from: rental.ownerEmail,
    to: rental.renterEmail,
    body: `Return confirmed for "${rental.title}". Rental complete — thanks for using RentAll!`,
    type: 'return_confirmed',
    rentalId: rental.id,
    metadata: { rental },
  });
  await createNotification(rental.renterEmail, 'return_confirmed', 'Return confirmed',
    `Your return of "${rental.title}" has been confirmed. Rental complete!`);
  return rental;
}

async function fileDispute(rentalId, ownerEmail, reason, description, photos) {
  requireDb();
  const res = await query(
    `UPDATE rentals SET status='disputed', updated_at=now()
     WHERE id=$1 AND lower(owner_email)=lower($2) AND (status='return_pending' OR status='confirmed')
     RETURNING *`,
    [rentalId, ownerEmail]
  );
  const rental = toRental(res.rows[0]);
  if (!rental) return null;
  await messagesDb.sendMessage({
    from: rental.ownerEmail,
    to: rental.renterEmail,
    body: `A dispute has been filed for "${rental.title}". Reason: ${reason}. The RentAll admin team has been notified and will follow up within 24–48 hours.`,
    type: 'dispute_filed',
    rentalId: rental.id,
    metadata: { rental, dispute: { reason, description, photos: photos || [] } },
  });
  await createNotification(rental.renterEmail, 'dispute', 'Dispute filed',
    `A dispute has been filed for your rental of "${rental.title}". Reason: ${reason}.`);
  return rental;
}

module.exports = { createRental, createRentalRequest, respondToRentalRequest, submitRentalPayment, getRentals, initiateReturn, confirmReturn, fileDispute, toRental };
