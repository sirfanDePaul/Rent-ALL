import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import Modal from './Modal';
import fallbackImage from '../fallbackImage';

const DEFAULT_IMAGE = fallbackImage;

export default function MyListings({ currentUser }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [desc, setDesc] = useState('');
  const [listings, setListings] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({ open: false, title: '', onConfirm: null });
  const [disputeModal, setDisputeModal] = useState({ open: false, rentalId: null, rentalTitle: '' });
  const [actionLoading, setActionLoading] = useState(null);

  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [data, rentalData] = await Promise.all([api.getMyListings(), api.getRentals()]);
    setListings(data);
    setRentals(rentalData);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(''); setPrice(''); setCategory(''); setLocation('');
    setImageFile(null); setImagePreview(''); setDesc('');
  };

  const validateImage = (file) => {
    if (!file) return { ok: false, message: 'No file' };
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) return { ok: false, message: 'Only JPG/PNG allowed' };
    if (file.size > 2 * 1024 * 1024) return { ok: false, message: 'Max 2MB' };
    return { ok: true };
  };

  const readImage = (file, setPreview) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onImageChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const v = validateImage(file);
    if (!v.ok) return alert(v.message);
    setImageFile(file);
    readImage(file, setImagePreview);
  };

  const onEditImageChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const v = validateImage(file);
    if (!v.ok) return alert(v.message);
    setEditImageFile(file);
    readImage(file, setEditImagePreview);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Please enter a title');
    if (!price || parseFloat(price) <= 0) return alert('Please enter a valid price');
    if (!category.trim()) return alert('Please enter a category');
    if (!location.trim()) return alert('Please enter a location');
    const listing = {
      title: title.trim(),
      price: parseFloat(price) || 0,
      category: category.trim() || 'General',
      location: location.trim(),
      image: imagePreview || DEFAULT_IMAGE,
      desc: desc.trim(),
      status: 'pending'
    };
    setLoading(true);
    try {
      await api.createListing(listing);
      await load();
      resetForm();
    } catch (err) {
      alert(err?.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (l) => {
    setEditId(l.id);
    setEditTitle(l.title);
    setEditPrice(l.price);
    setEditCategory(l.category || 'General');
    setEditLocation(l.location);
    setEditImageFile(null);
    setEditImagePreview(l.image);
    setEditDesc(l.desc || '');
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle(''); setEditPrice(''); setEditLocation('');
    setEditImageFile(null); setEditImagePreview(''); setEditDesc('');
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return alert('Title is required');
    const changes = {
      title: editTitle.trim(),
      price: parseFloat(editPrice) || 0,
      location: editLocation.trim(),
      image: editImagePreview || DEFAULT_IMAGE,
      desc: editDesc.trim()
    };
    setLoading(true);
    await api.updateListing(id, changes);
    await load();
    setLoading(false);
    cancelEdit();
  };

  const confirmPublish = (id) => {
    setModal({
      open: true, title: 'Publish this listing?', confirmColor: '#059669',
      onConfirm: async () => { await api.publishListing(id); await load(); setModal({ open: false }); }
    });
  };

  const confirmDelete = (id) => {
    setModal({
      open: true, title: 'Remove this listing? This cannot be undone.',
      onConfirm: async () => { await api.removeListing(id); await load(); setModal({ open: false }); }
    });
  };

  const myListings = listings.filter(l => l.owner === currentUser.email);
  const pending = myListings.filter(l => l.status === 'pending');
  const active = myListings.filter(l => l.status === 'active');
  const rented = myListings.filter(l => l.status === 'rented');
  const incomingRequests = rentals.filter(r => r.ownerEmail === currentUser.email && r.status === 'pending');
  const acceptedRequests = rentals
    .filter(r => r.ownerEmail === currentUser.email && ['accepted', 'confirmed', 'return_pending', 'disputed'].includes(r.status))
    .sort((a, b) => (b.respondedAt || b.createdAt || 0) - (a.respondedAt || a.createdAt || 0));

  const handleConfirmReturn = async (rentalId) => {
    setActionLoading(rentalId + '-confirm');
    try {
      await api.confirmReturn(rentalId);
      await load();
    } catch (err) {
      alert(err?.message || 'Could not confirm return.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDispute = (r) => {
    setDisputeModal({ open: true, rentalId: r.id, rentalTitle: r.title });
  };

  const handleFileDispute = async (reason, description, photos) => {
    setActionLoading(disputeModal.rentalId + '-dispute');
    try {
      await api.fileDispute(disputeModal.rentalId, reason, description, photos);
      setDisputeModal({ open: false, rentalId: null, rentalTitle: '' });
      await load();
    } catch (err) {
      alert(err?.message || 'Could not file dispute.');
    } finally {
      setActionLoading(null);
    }
  };

  const rentalStatusLabel = (status) => {
    const map = {
      accepted: 'Awaiting payment',
      confirmed: 'Active rental',
      return_pending: 'Return pending — awaiting your confirmation',
      completed: 'Completed',
      disputed: 'Disputed',
    };
    return map[status] || status;
  };

  const EditForm = ({ id }) => (
    <div className="edit-form">
      <div className="form-row">
        <input className="input" placeholder="Title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
        <input className="input" placeholder="Price (per day)" type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
      </div>
      <div className="form-row">
        <input className="input" placeholder="Location" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
        <input className="input" type="file" accept="image/jpeg,image/png" onChange={onEditImageChange} />
      </div>
      {editImagePreview && <img src={editImagePreview} alt="preview" className="image-preview" />}
      <textarea className="textarea" placeholder="Description" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
      <div className="actions">
        <button className="btn" onClick={() => saveEdit(id)} disabled={loading}>Save changes</button>
        <button className="btn" style={{ background: '#6b7280' }} onClick={cancelEdit}>Cancel</button>
      </div>
    </div>
  );

  const ListingRow = ({ l, showPublish = false }) => (
    <div key={l.id} className="listing-card">
      {editId === l.id ? (
        <div style={{ flex: 1 }}>
          <EditForm id={l.id} />
        </div>
      ) : (
        <>
          <img src={l.image || fallbackImage} alt={l.title} onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }} />
          <div className="listing-body" style={{ flex: 1 }}>
            <strong>{l.title}</strong>
            {l.location && <div className="location">{l.location}</div>}
            <div className="price">${l.price}/day</div>
            {l.desc && <div className="muted" style={{ fontSize: 13 }}>{l.desc}</div>}
            <div className="actions">
              <button className="btn" onClick={() => startEdit(l)}>Edit</button>
              {showPublish && (
                <button className="btn" style={{ background: '#059669' }} onClick={() => confirmPublish(l.id)}>Publish</button>
              )}
              <button className="btn" style={{ background: '#ef4444' }} onClick={() => confirmDelete(l.id)}>Remove</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="mylistings">
      <div className="create-section">
        <h2>Create a new listing</h2>
        <form className="create-form" onSubmit={handleCreate}>
          <div className="form-row">
            <input className="input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <input className="input" placeholder="Price (per day)" type="number" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className="form-row">
            <input className="input" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
          </div>
          <div className="form-row">
            <input className="input" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
            <input className="input" placeholder="Image (JPG/PNG, max 2MB)" type="file" accept="image/*" onChange={onImageChange} />
          </div>
          {imagePreview && <img src={imagePreview} alt="preview" className="image-preview" />}
          <textarea className="textarea" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="form-actions">
            <button className="btn" type="submit" disabled={loading || !title.trim() || !price || parseFloat(price) <= 0 || !category.trim() || !location.trim()}>{loading ? 'Posting...' : 'Post listing'}</button>
            <button type="button" className="btn" onClick={resetForm} style={{ background: '#6b7280' }}>Reset</button>
          </div>
        </form>
      </div>

      <div className="pending-section">
        <h2>Pending listings</h2>
        {loading && (
          <div className="mylistings-skeleton-list" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`pending-skeleton-${index}`} className="listing-card listing-row-skeleton">
                <span className="listing-row-skeleton-image shimmer" />
                <div className="listing-row-skeleton-body">
                  <span className="listing-row-skeleton-line shimmer" />
                  <span className="listing-row-skeleton-line short shimmer" />
                  <span className="listing-row-skeleton-line mid shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !pending.length && <div className="section-empty-state">No pending listings. Create one above to get started.</div>}
        <div className="pending-list">
          {pending.map(l => <ListingRow key={l.id} l={l} showPublish />)}
        </div>
      </div>

      <div className="active-section" style={{ marginTop: 20 }}>
        <h2>Active listings</h2>
        {!loading && !active.length && <div className="section-empty-state">No active listings yet. Publish a pending listing to make it live.</div>}
        <div className="pending-list">
          {active.map(l => <ListingRow key={l.id} l={l} />)}
        </div>
      </div>

      <div className="active-section" style={{ marginTop: 20 }}>
        <h2>Incoming rental requests {incomingRequests.length > 0 && <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 10, padding: '2px 10px', fontSize: 14, marginLeft: 8 }}>{incomingRequests.length} new</span>}</h2>
        {!loading && !incomingRequests.length && <div className="section-empty-state">No new incoming requests right now.</div>}
        <div className="pending-list">
          {incomingRequests.map(r => (
            <div key={r.id} className="listing-card">
              <img src={r.image} alt={r.title} />
              <div className="listing-body">
                <strong>{r.title}</strong>
                <div className="location">{r.location}</div>
                <div className="muted">{r.startDate} to {r.endDate} &bull; {r.days} day{r.days !== 1 ? 's' : ''}</div>
                <div className="price">${Number(r.total || 0).toFixed(2)} total &bull; {r.renterName} ({r.renterEmail})</div>
                <div className="muted" style={{ color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>🔔 Open Messages to accept or decline</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="active-section" style={{ marginTop: 20 }}>
        <h2>Accepted rental requests</h2>
        {!loading && !acceptedRequests.length && <div className="section-empty-state">No accepted rental requests yet.</div>}
        <div className="pending-list">
          {acceptedRequests.map(r => (
            <div key={r.id} className="listing-card">
              <img src={r.image || fallbackImage} alt={r.title} onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }} />
              <div className="listing-body">
                <strong>{r.title}</strong>
                <div className="location">{r.location}</div>
                <div className="muted">
                  {r.startDate} to {r.endDate} &bull; {r.days} day{r.days !== 1 ? 's' : ''}
                </div>
                <div className="price">${Number(r.total || 0).toFixed(2)} total &bull; {r.renterName} ({r.renterEmail})</div>
                <div className="muted">Status: {rentalStatusLabel(r.status)}</div>
                {r.status === 'return_pending' && (
                  <div className="actions" style={{ marginTop: 8 }}>
                    <button
                      className="btn"
                      style={{ background: '#059669' }}
                      disabled={actionLoading === r.id + '-confirm'}
                      onClick={() => handleConfirmReturn(r.id)}
                    >
                      {actionLoading === r.id + '-confirm' ? 'Confirming...' : 'Confirm Return'}
                    </button>
                    <button
                      className="btn"
                      style={{ background: '#ef4444' }}
                      disabled={actionLoading === r.id + '-dispute'}
                      onClick={() => handleOpenDispute(r)}
                    >
                      Report Issue
                    </button>
                  </div>
                )}
                {r.status === 'confirmed' && (
                  <div className="actions" style={{ marginTop: 8 }}>
                    <button
                      className="btn"
                      style={{ background: '#ef4444' }}
                      disabled={actionLoading === r.id + '-dispute'}
                      onClick={() => handleOpenDispute(r)}
                    >
                      Report Issue
                    </button>
                  </div>
                )}
                {r.status === 'disputed' && (
                  <div className="muted" style={{ marginTop: 6, color: '#ef4444', fontStyle: 'italic' }}>
                    ⚠ Dispute filed — admin team will follow up within 24–48 hours.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="active-section" style={{ marginTop: 20 }}>
        <h2>Rented listings</h2>
        {!loading && !rented.length && <div className="section-empty-state">No rented listings yet.</div>}
        <div className="pending-list">
          {rented.map(l => {
            const rentalRecord = rentals.find(r => r.ownerEmail === currentUser.email && r.status === 'confirmed' && (r.listingId === l.id || r.title === l.title));
            return (
              <div key={l.id} className="listing-card">
                <img src={l.image || fallbackImage} alt={l.title} onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }} />
                <div className="listing-body">
                  <strong>{l.title}</strong>
                  <div className="location">{l.location}</div>
                  <div className="muted">Booked by {rentalRecord?.renterName || rentalRecord?.renterEmail || 'Renter'}</div>
                  {rentalRecord && <div className="muted">{rentalRecord.startDate} to {rentalRecord.endDate}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={modal.open} title={modal.title} onCancel={() => setModal({ open: false })} onConfirm={modal.onConfirm} confirmColor={modal.confirmColor} />
      {disputeModal.open && (
        <DisputeModal
          rentalTitle={disputeModal.rentalTitle}
          onSubmit={handleFileDispute}
          onClose={() => setDisputeModal({ open: false, rentalId: null, rentalTitle: '' })}
        />
      )}
    </div>
  );
}
