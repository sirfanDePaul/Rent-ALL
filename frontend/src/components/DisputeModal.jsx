import React, { useState } from 'react';

const REASONS = [
  'Item not returned',
  'Item returned damaged',
  'Item returned late',
  'Item returned incomplete',
  'Other',
];

const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

export default function DisputeModal({ rentalTitle, onSubmit, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e) => {
    setPhotoError('');
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > MAX_PHOTOS) {
      setPhotoError(`You can attach up to ${MAX_PHOTOS} photos.`);
      e.target.value = '';
      return;
    }
    const invalid = files.find(f => !['image/jpeg', 'image/png'].includes(f.type) || f.size > MAX_PHOTO_SIZE);
    if (invalid) {
      setPhotoError('Each photo must be JPG or PNG and under 2MB.');
      e.target.value = '';
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(reason, description, photos);
    setSubmitting(false);
  };

  return (
    <div className="dispute-modal-backdrop" onClick={onClose}>
      <div className="dispute-modal" onClick={e => e.stopPropagation()}>
        <div className="dispute-modal-header">
          <h3>File a Dispute</h3>
          <button className="terms-close-btn" onClick={onClose}>×</button>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Rental: <strong>{rentalTitle}</strong>
        </p>
        <p className="muted" style={{ fontSize: 13 }}>
          The RentAll admin team will review your dispute and follow up within 24–48 hours.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="dispute-label">Reason</label>
          <select className="input dispute-select" value={reason} onChange={e => setReason(e.target.value)}>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="dispute-label" style={{ marginTop: 12 }}>Description (optional)</label>
          <textarea
            className="textarea"
            placeholder="Provide any additional details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />
          <label className="dispute-label" style={{ marginTop: 12 }}>
            Photos (optional, up to {MAX_PHOTOS}, JPG/PNG, max 2MB each)
          </label>
          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {photos.map((src, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img src={src} alt={`Dispute photo ${idx + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, lineHeight: '20px', textAlign: 'center', padding: 0 }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
          {photos.length < MAX_PHOTOS && (
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handlePhotoChange}
              style={{ marginBottom: 4 }}
            />
          )}
          {photoError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 6 }}>{photoError}</div>}
          <div className="dispute-actions">
            <button className="btn" style={{ background: '#ef4444' }} type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
            <button className="btn" style={{ background: '#6b7280' }} type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
