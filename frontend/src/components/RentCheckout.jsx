import React, { useState } from 'react';
import api from '../api/api.js';
import fallbackImage from '../fallbackImage';

const today = () => new Date().toISOString().split('T')[0];

const calcDays = (start, end) => {
  if (!start || !end) return 0;
  const ms = new Date(end) - new Date(start);
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
};

export default function RentCheckout({ item, currentUser, onBack, onConfirmed }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const days = calcDays(startDate, endDate);
  const total = days * Number(item.price);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (days <= 0 || !currentUser) return;
    if (phone.trim()) {
      const phonePattern = /^\d{3}-\d{3}-\d{4}$|^\d{10}$/;
      if (!phonePattern.test(phone.trim())) {
        alert('Please enter a valid phone number in the format 123-456-7890 or 1234567890');
        return;
      }
    }
    setSubmitting(true);
    const rentalRequest = {
      listingId: item.id,
      title: item.title,
      image: item.image,
      location: item.location,
      pricePerDay: item.price,
      startDate,
      endDate,
      days,
      total,
      renterName: currentUser.name,
      renterEmail: currentUser.email,
      renterPhone: phone,
      note,
    };
    await api.createRentalRequest(rentalRequest);
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="checkout-page">
        <div className="checkout-confirm">
          <div className="confirm-icon">✓</div>
          <h2>Rental Request Sent</h2>
          <p>Your request for <strong>{item.title}</strong> ({days} day{days !== 1 ? 's' : ''}) was sent to the listing owner.</p>
          <p className="confirm-total">Quoted total: <span className="teal">${total.toFixed(2)}</span></p>
          <p className="muted">No charge was made. The owner can accept or decline in Messages.</p>
          <button className="btn" onClick={onConfirmed}>Go to Messages</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="checkout-layout">
        {/* Item summary */}
        <div className="checkout-item-card">
          <img src={item.image || fallbackImage} alt={item.title} className="checkout-img" onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }} />
          <div className="checkout-item-info">
            <h2>{item.title}</h2>
            <p className="price">${item.price}/day</p>
            <p className="location">{item.location}</p>
            {item.desc && <p className="muted">{item.desc}</p>}
          </div>
        </div>

        {/* Rental form */}
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h3>Rental Details</h3>

          <div className="form-row">
            <div className="field">
              <label>Start Date</label>
              <input
                type="date"
                className="input"
                min={today()}
                value={startDate}
                onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate(''); }}
                required
              />
            </div>
            <div className="field">
              <label>End Date</label>
              <input
                type="date"
                className="input"
                min={startDate || today()}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {days > 0 && (
            <div className="cost-summary">
              <span>{days} day{days !== 1 ? 's' : ''} × ${item.price}/day</span>
              <span className="teal cost-total">${total.toFixed(2)}</span>
            </div>
          )}

          <h3>Your Information</h3>

          <div className="form-row">
            <div className="field">
              <label>Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} required readOnly />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required readOnly />
            </div>
          </div>

          <div className="field">
            <label>Phone (optional)</label>
            <input className="input" placeholder="123-456-7890 or 1234567890" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div className="field">
            <label>Note to owner (optional)</label>
            <textarea className="textarea" value={note} onChange={e => setNote(e.target.value)} rows={3} />
          </div>

          <button
            type="submit"
            className="btn checkout-submit"
            disabled={submitting || days <= 0 || !currentUser}
          >
            {submitting ? 'Sending request...' : days > 0 ? `Send Rental Request — $${total.toFixed(2)}` : 'Select dates to continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
