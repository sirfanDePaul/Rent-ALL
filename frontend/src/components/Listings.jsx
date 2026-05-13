import React, { useState, useEffect } from 'react';
import ListingCard from './ListingCard';
import api from '../api/api.js';

export default function Listings({ query = '', onRent }) {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getListings();
        if (!mounted) return;
        setItems(Array.isArray(data) ? data.filter(i => i.status === 'active') : []);
      } catch (e) {
        console.error(e);
        if (mounted) setError('Could not load listings. Make sure the backend is running.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const q = (query || '').trim().toLowerCase();
  const categories = ['All', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];
  const activeCount = items.length;
  const categoryCount = Math.max(categories.length - 1, 0);
  const filtered = items.filter(i => {
    if (category !== 'All' && i.category !== category) return false;
    if (!q) return true;
    return i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q);
  });

  return (
    <div className="listings">
      <section className="marketplace-hero">
        <span className="hero-badge">Trending rentals</span>
        <h2 className="hero-title">Find something great to rent today</h2>
        <p className="hero-sub">From campus essentials to weekend gear, discover listings near you with a smoother marketplace experience.</p>
        <div className="hero-stats">
          <div className="hero-stat"><strong>{activeCount}</strong><span>active listings</span></div>
          <div className="hero-stat"><strong>{categoryCount}</strong><span>categories</span></div>
          <div className="hero-stat"><strong>{filtered.length}</strong><span>matching your filters</span></div>
        </div>
        <div className="hero-graphics" aria-hidden="true">
          <svg className="hero-wave" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 98C38 50 64 86 97 52C125 23 155 23 186 36C198 41 207 38 217 31" />
            <path d="M10 112C46 66 68 101 101 68C132 37 158 44 192 56C202 60 210 58 218 52" />
          </svg>
          <div className="graphic-card graphic-card-primary">
            <div className="graphic-dot" />
            <div className="graphic-lines">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="graphic-card graphic-card-secondary">
            <div className="graphic-ring" />
            <div className="graphic-sparkles">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="graphic-orb" />
        </div>
      </section>
      {error && <p className="listings-error">{error}</p>}
      <div className="category-bar">
        {loading ? (
          <>
            <span className="chip-skeleton" />
            <span className="chip-skeleton" />
            <span className="chip-skeleton" />
            <span className="chip-skeleton" />
          </>
        ) : (
          categories.map(c => (
            <button key={c} className={'category-chip' + (category === c ? ' active' : '')} onClick={() => setCategory(c)}>{c}</button>
          ))
        )}
      </div>
      <div className="grid">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="card listing-skeleton">
              <div className="listing-skeleton-image shimmer" />
              <div className="listing-skeleton-body">
                <span className="listing-skeleton-line shimmer" />
                <span className="listing-skeleton-line short shimmer" />
                <span className="listing-skeleton-line mid shimmer" />
                <span className="listing-skeleton-btn shimmer" />
              </div>
            </div>
          ))
          : filtered.map((i, index) => (
            <ListingCard key={i.id} item={i} onSelect={onRent} index={index} />
          ))}
      </div>
      {!loading && !filtered.length && !error && (
        <div className="empty-state polished-empty-state">
          <div className="empty-emoji" aria-hidden="true">🔎</div>
          <strong>No matching listings yet</strong>
          <p>Try a different keyword or switch categories to discover more rentals nearby.</p>
        </div>
      )}
    </div>
  );
}
