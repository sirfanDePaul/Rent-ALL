import React from 'react';

export default function Modal({ open = false, title = '', onCancel = () => {}, onConfirm = null, confirmColor = '#ef4444' }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{title}</h3>
        <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:12}}>
          <button className="btn" onClick={onCancel} style={{background:'#e5e7eb', color:'#111'}}>Cancel</button>
          <button className="btn" onClick={() => { if (onConfirm) onConfirm(); else onCancel(); }} style={{background: confirmColor}}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
