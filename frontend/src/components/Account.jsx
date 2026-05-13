import React, { useEffect, useState } from 'react';
import api from '../api/api.js';
import fallbackImage from '../fallbackImage';
import RentalTimer from './RentalTimer';

export default function Account({ currentUser }) {
  const user = currentUser || {};

  const [listings, setListings] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [initiatingReturn, setInitiatingReturn] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    const [data, rentalData, reviewData] = await Promise.all([api.getMyListings(), api.getRentals(), api.getReviewsForUser(user.email)]);
    setListings(data || []);
    setRentals(rentalData || []);
    setReviews(reviewData || []);
    setLoading(false);
  };

  const submitReview = async (rentalId) => {
    const draft = reviewDrafts[rentalId] || { rating: 5, body: '' };
    await api.createReview({ rentalId, rating: Number(draft.rating || 5), body: draft.body || '' });
    setReviewDrafts((prev) => ({ ...prev, [rentalId]: { rating: 5, body: '' } }));
    await load();
  };

  const handleInitiateReturn = async (rentalId) => {
    setInitiatingReturn(rentalId);
    try {
      await api.initiateReturn(rentalId);
      await load();
    } catch (err) {
      alert(err?.message || 'Could not initiate return.');
    } finally {
      setInitiatingReturn(null);
    }
  };

  const myListings = listings;
  const myRentals = rentals.filter(r =>
    r.renterEmail === user.email &&
    ['pending', 'accepted', 'confirmed', 'return_pending', 'completed', 'disputed'].includes(r.status)
  );
  const acceptedOnMyListings = rentals.filter(r =>
    r.ownerEmail === user.email &&
    ['accepted', 'confirmed', 'return_pending', 'disputed'].includes(r.status)
  );
  const pendingOnMyListings = rentals.filter(r => r.ownerEmail === user.email && r.status === 'pending');
  const activeCount = myListings.filter(l => l.status === 'active').length;
  const memberSince = user.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A';

  const statusLabel = (status) => {
    const map = {
      pending: 'Pending approval',
      accepted: 'Awaiting payment',
      confirmed: 'Active rental',
      return_pending: 'Return pending confirmation',
      completed: 'Completed',
      disputed: 'Disputed',
    };
    return map[status] || status;
  };

  const listingStatusLabel = (status) => {
    const map = { pending: 'Pending review', active: 'Active', rented: 'Currently rented' };
    return map[status] || status;
  };

  return (
    <div className="account-page">
      <div className="account-top">
        <div className="profile">
          <div className="profile-pic">
            {user.image ? <img src={user.image} alt="Profile" /> : <div className="avatar-placeholder">{user.name[0]}</div>}
          </div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <p>Age: {user.age ?? 'N/A'} • {user.location || 'Not set'}</p>
          </div>
        </div>

        <div className="account-main">
          <div className="stats">
            <div className="stat">
              <div className="stat-title">Total Rentals</div>
              <div className="stat-value">{myRentals.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Active Listings</div>
              <div className="stat-value">{activeCount}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Member Since</div>
              <div className="stat-value">{memberSince}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Avg Rating</div>
              <div className="stat-value">{reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="transactions">
        <h3>Your rentals</h3>
        <div className="tx-list">
          {loading && <p className="muted">Loading...</p>}
          {!loading && myRentals.length === 0 && <p className="muted">No rentals found</p>}
          {!loading && myRentals.map(i => (
            <div key={i.id} className="tx-item">
              <img src={i.image || fallbackImage} alt={i.title} onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }} />
              <div>
                <strong>{i.title}</strong>
                <div className="price">${Number(i.total || 0).toFixed(2)} total • {i.location}</div>
                <div className="muted">{i.startDate} to {i.endDate} • {i.days} day{i.days !== 1 ? 's' : ''} • {statusLabel(i.status)}</div>

                {i.status === 'pending' && (
                  <div className="muted" style={{ marginTop: 8, fontStyle: 'italic' }}>
                    ⏳ Waiting for the owner to respond to your request
                  </div>
                )}

                {i.status === 'accepted' && (
                  <div className="muted" style={{ marginTop: 8, fontStyle: 'italic' }}>
                    ✅ Request accepted — open Messages to complete payment
                  </div>
                )}

                {i.status === 'confirmed' && i.endDate && (
                  <RentalTimer startDate={i.startDate} endDate={i.endDate} />
                )}

                {i.status === 'confirmed' && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn"
                      style={{ background: '#059669' }}
                      disabled={initiatingReturn === i.id}
                      onClick={() => handleInitiateReturn(i.id)}
                    >
                      {initiatingReturn === i.id ? 'Submitting...' : 'Mark as Returned'}
                    </button>
                  </div>
                )}

                {i.status === 'return_pending' && (
                  <div className="muted" style={{ marginTop: 8, fontStyle: 'italic' }}>
                    ✅ Return submitted — awaiting owner confirmation
                  </div>
                )}

                {i.status === 'completed' && (
                  <div className="review-row">
                    <select className="input review-rating" value={reviewDrafts[i.id]?.rating || 5} onChange={(e) => setReviewDrafts(prev => ({ ...prev, [i.id]: { ...(prev[i.id] || {}), rating: e.target.value } }))}>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} stars</option>)}
                    </select>
                    <input className="input" placeholder="Leave a review" value={reviewDrafts[i.id]?.body || ''} onChange={(e) => setReviewDrafts(prev => ({ ...prev, [i.id]: { ...(prev[i.id] || {}), body: e.target.value } }))} />
                    <button className="btn" onClick={() => submitReview(i.id)}>Review</button>
                  </div>
                )}

                {i.status === 'disputed' && (
                  <div className="muted" style={{ marginTop: 8, color: '#ef4444', fontStyle: 'italic' }}>
                    ⚠ A dispute has been filed. The admin team will follow up within 24–48 hours.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <h3 style={{marginTop:18}}>Your listings</h3>
        <div className="tx-list">
          {loading && <p className="muted">Loading...</p>}
          {!loading && myListings.length === 0 && <p className="muted">No listings found</p>}
          {!loading && myListings.map(i => {
            const hasPendingRequest = rentals.some(r => r.ownerEmail === user.email && r.status === 'pending' && (r.listingId === i.id || r.title === i.title));
            return (
              <div key={i.id} className="tx-item">
                <img src={i.image} alt={i.title} />
                <div>
                  <strong>{i.title}</strong>
                  <div className="price">${i.price}/day • {i.location}</div>
                  <div className="muted">{listingStatusLabel(i.status)}{hasPendingRequest && <span style={{ marginLeft: 8, background: '#f59e0b', color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 12, fontWeight: 600 }}>🔔 New request</span>}</div>
                </div>
              </div>
            );
          })}
        </div>

        <h3 style={{marginTop:18}}>Incoming rental requests</h3>
        <div className="tx-list">
          {loading && <p className="muted">Loading...</p>}
          {!loading && pendingOnMyListings.length === 0 && <p className="muted">No pending requests</p>}
          {!loading && pendingOnMyListings.map(i => (
            <div key={i.id} className="tx-item">
              <img src={i.image || fallbackImage} alt={i.title} onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }} />
              <div>
                <strong>{i.title}</strong>
                <div className="price">{i.renterName} ({i.renterEmail})</div>
                <div className="muted">{i.startDate} to {i.endDate} • ${Number(i.total || 0).toFixed(2)}</div>
                <div className="muted" style={{ color: '#f59e0b', fontWeight: 600 }}>🔔 Awaiting your response — check Messages</div>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{marginTop:18}}>Active &amp; recent requests on your listings</h3>
        <div className="tx-list">
          {loading && <p className="muted">Loading...</p>}
          {!loading && acceptedOnMyListings.length === 0 && <p className="muted">No active requests</p>}
          {!loading && acceptedOnMyListings.map(i => (
            <div key={i.id} className="tx-item">
              <img src={i.image || fallbackImage} alt={i.title} onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }} />
              <div>
                <strong>{i.title}</strong>
                <div className="price">{i.renterName} ({i.renterEmail})</div>
                <div className="muted">{i.startDate} to {i.endDate} • ${Number(i.total || 0).toFixed(2)} • {statusLabel(i.status)}</div>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{marginTop:18}}>Reviews about you</h3>
        <div className="tx-list">
          {!reviews.length && <p className="muted">No reviews yet</p>}
          {reviews.map(r => (
            <div key={r.id} className="tx-item">
              <div>
                <strong>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</strong>
                <div className="muted">{r.body || 'No comment'} • {r.reviewerEmail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
