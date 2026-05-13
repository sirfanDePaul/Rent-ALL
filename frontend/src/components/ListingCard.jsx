import React from 'react';
import fallbackImage from '../fallbackImage';

export default function ListingCard({ item, onSelect, index = 0 }) {
  return (
    <div className="card marketplace-card" style={{ '--card-index': index % 12 }}>
      <div className="card-media">
        <img src={item.image || fallbackImage} alt={item.title} className="card-img" onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }} />
      </div>
      <div className="card-body">
        <h3>{item.title}</h3>
        {item.category && <p className="category-label">{item.category}</p>}
        <p className="price">${item.price}/day</p>
        <p className="location">{item.location}</p>
        <button className="btn" onClick={() => onSelect(item)}>Rent now</button>
      </div>
    </div>
  );
}
