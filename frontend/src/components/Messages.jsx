import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api.js';
import DisputeModal from './DisputeModal';

const DEFAULT_KNOWN_USERS = {
  'alex@example.com': 'Alex Morgan',
  'sarah@example.com': 'Sarah Chen',
  'mike@example.com': 'Mike Johnson',
  'jordan@example.com': 'Jordan Lee',
};

const displayName = (email, knownUsers) => knownUsers[email] || email;
const initials = (email, knownUsers) => displayName(email, knownUsers).split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

const fmtTime = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function Messages({ currentUser, knownUsers = {} }) {
  const ME = currentUser.email;
  const allKnownUsers = { ...DEFAULT_KNOWN_USERS, ...knownUsers, [ME]: currentUser.name };
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailErr, setNewEmailErr] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [respondingRentalId, setRespondingRentalId] = useState(null);
  const [payingRentalId, setPayingRentalId] = useState(null);
  const [confirmingReturnId, setConfirmingReturnId] = useState(null);
  const [disputeModal, setDisputeModal] = useState({ open: false, rentalId: null, rentalTitle: '' });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { loadConvs(); }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMsgs(activeId);
    api.markRead(activeId, ME);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConvs = async () => {
    setLoadingConversations(true);
    try {
      const convs = await api.getConversations(ME);
      setConversations(convs);
      if (convs.length && !activeId) setActiveId(convs[0].id);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMsgs = async (cid) => {
    setLoadingMessages(true);
    try {
      const msgs = await api.getMessages(cid);
      setMessages(msgs);
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectConv = (id) => {
    setActiveId(id);
    setShowNew(false);
    inputRef.current?.focus();
  };

  const startNewConv = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (email === ME) { setNewEmailErr("That's your own email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setNewEmailErr('Enter a valid email address.'); return; }
    const id = [ME, email].sort().join(':');
    setActiveId(id);
    setShowNew(false);
    setNewEmail('');
    setNewEmailErr('');
    const msgs = await api.getMessages(id);
    setMessages(msgs);
    await loadConvs();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    const [a, b] = activeId.split(':');
    const to = a === ME ? b : a;
    setSending(true);
    await api.sendMessage({ to, body: draft.trim() });
    setDraft('');
    setSending(false);
    await loadMsgs(activeId);
    await loadConvs();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); }
  };

  const respondRental = async (rentalId, decision) => {
    if (!activeId) return;
    setRespondingRentalId(rentalId);
    try {
      await api.respondToRentalRequest({ rentalId, decision });
      await loadMsgs(activeId);
      await loadConvs();
    } catch (err) {
      alert(err?.message || 'Could not update rental request.');
    } finally {
      setRespondingRentalId(null);
    }
  };

  const submitPayment = async (rentalId) => {
    if (!activeId) return;
    setPayingRentalId(rentalId);
    try {
      await api.submitRentalPayment({ rentalId });
      await loadMsgs(activeId);
      await loadConvs();
    } catch (err) {
      alert(err?.message || 'Could not submit payment.');
    } finally {
      setPayingRentalId(null);
    }
  };

  const confirmReturn = async (rentalId) => {
    if (!activeId) return;
    setConfirmingReturnId(rentalId);
    try {
      await api.confirmReturn(rentalId);
      await loadMsgs(activeId);
      await loadConvs();
    } catch (err) {
      alert(err?.message || 'Could not confirm return.');
    } finally {
      setConfirmingReturnId(null);
    }
  };

  const handleFileDispute = async (reason, description, photos) => {
    try {
      await api.fileDispute(disputeModal.rentalId, reason, description, photos);
      setDisputeModal({ open: false, rentalId: null, rentalTitle: '' });
      await loadMsgs(activeId);
      await loadConvs();
    } catch (err) {
      alert(err?.message || 'Could not file dispute.');
    }
  };

  const otherEmail = activeId ? activeId.split(':').find(e => e !== ME) : null;

  return (
    <div className="messages-page">
      {/* Left sidebar: conversation list */}
      <aside className="conv-list">
        <div className="conv-list-header">
          <h2>Messages</h2>
          <button className="new-conv-btn" onClick={() => setShowNew(v => !v)} title="New message">+</button>
        </div>

        {showNew && (
          <div className="new-conv-box">
            <input
              className="input"
              placeholder="Recipient email"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setNewEmailErr(''); }}
              onKeyDown={e => e.key === 'Enter' && startNewConv()}
              autoFocus
            />
            {newEmailErr && <p className="new-conv-err">{newEmailErr}</p>}
            <button className="btn" style={{ marginTop: 6, width: '100%' }} onClick={startNewConv}>Start conversation</button>
          </div>
        )}

        {loadingConversations && !showNew && (
          <div className="conv-skeleton-list" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`conv-skeleton-${index}`} className="conv-skeleton-item">
                <span className="conv-skeleton-avatar shimmer" />
                <div className="conv-skeleton-meta">
                  <span className="conv-skeleton-line shimmer" />
                  <span className="conv-skeleton-line short shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingConversations && conversations.length === 0 && !showNew && (
          <p className="muted conv-empty">No conversations yet. Press + to start one.</p>
        )}

        {conversations.map(c => (
          <button
            key={c.id}
            className={'conv-item' + (c.id === activeId ? ' conv-item--active' : '')}
            onClick={() => selectConv(c.id)}
          >
            <div className="conv-avatar">{initials(c.otherEmail, allKnownUsers)}</div>
            <div className="conv-meta">
              <div className="conv-name">{displayName(c.otherEmail, allKnownUsers)}</div>
              <div className="conv-preview">{c.lastBody}</div>
            </div>
            <div className="conv-time">{fmtTime(c.timestamp)}</div>
          </button>
        ))}
      </aside>

      {/* Right panel: chat thread */}
      <div className="chat-panel">
        {!activeId ? (
          <div className="chat-empty">
            <p>Select a conversation or start a new one.</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="conv-avatar">{initials(otherEmail, allKnownUsers)}</div>
              <div>
                <div className="chat-header-name">{displayName(otherEmail, allKnownUsers)}</div>
                <div className="chat-header-email muted">{otherEmail}</div>
              </div>
            </div>

            <div className="chat-messages">
              {loadingMessages && (
                <div className="message-skeleton-list" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={`msg-skeleton-${index}`} className={'message-skeleton-row' + (index % 2 ? ' mine' : '')}>
                      <span className="message-skeleton-bubble shimmer" />
                    </div>
                  ))}
                </div>
              )}
              {!loadingMessages && messages.length === 0 && (
                <div className="chat-empty-message">
                  <div className="empty-emoji" aria-hidden="true">💬</div>
                  <strong>No messages yet</strong>
                  <p>Start the conversation and coordinate your rental details here.</p>
                </div>
              )}
              {!loadingMessages && messages.map((m, i) => {
                const mine = m.from === ME;
                const showDate = i === 0 || fmtTime(messages[i-1].timestamp) !== fmtTime(m.timestamp);
                const isRentalRequest = m.type === 'rental_request' && m.request;
                const isPaymentRequest = m.type === 'payment_request' && m.payment;
                const isReturnInitiated = m.type === 'return_initiated';
                const isReturnConfirmed = m.type === 'return_confirmed';
                const isDisputeFiled = m.type === 'dispute_filed';
                const requestStatus = isRentalRequest ? (m.request.status || 'pending') : null;
                const canRespond = isRentalRequest && m.to === ME && requestStatus === 'pending';
                const canPay = isPaymentRequest && m.to === ME && m.payment.status === 'pending';
                const canConfirmReturn = isReturnInitiated && m.to === ME &&
                  !messages.some(other => other.rentalId === m.rentalId &&
                    (other.type === 'return_confirmed' || other.type === 'dispute_filed'));
                return (
                  <React.Fragment key={m.id}>
                    {showDate && i > 0 && <div className="chat-datestamp">{new Date(m.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                    <div className={'bubble-row' + (mine ? ' bubble-row--mine' : '')}>
                      {!mine && <div className="bubble-avatar">{initials(m.from, allKnownUsers)}</div>}
                      {isRentalRequest ? (
                        <div className={'rental-request-card' + (mine ? ' rental-request-card--mine' : '')}>
                          <div className="rental-request-title">Rental Request</div>
                          <div><strong>{m.request.title}</strong></div>
                          <div className="muted">{m.request.startDate} to {m.request.endDate} ({m.request.days} day{m.request.days !== 1 ? 's' : ''})</div>
                          <div className="muted">Quoted total: ${Number(m.request.total || 0).toFixed(2)}</div>
                          {m.request.note && <div className="muted">Note: {m.request.note}</div>}
                          <div className={'rental-status rental-status--' + requestStatus}>{requestStatus}</div>
                          {canRespond && (
                            <div className="rental-actions">
                              <button className="btn" disabled={respondingRentalId === m.rentalId} onClick={() => respondRental(m.rentalId, 'accepted')}>Accept</button>
                              <button className="btn rental-decline-btn" disabled={respondingRentalId === m.rentalId} onClick={() => respondRental(m.rentalId, 'declined')}>Decline</button>
                            </div>
                          )}
                          <span className="bubble-time">{fmtTime(m.timestamp)}</span>
                        </div>
                      ) : isPaymentRequest ? (
                        <div className={'rental-request-card' + (mine ? ' rental-request-card--mine' : '')}>
                          <div className="rental-request-title">Payment Required</div>
                          <div><strong>{m.payment.title}</strong></div>
                          <div className="muted">Amount due: ${Number(m.payment.total || 0).toFixed(2)}</div>
                          <div className={'rental-status rental-status--' + (m.payment.status === 'paid' ? 'confirmed' : 'pending')}>
                            {m.payment.status === 'paid' ? 'paid' : 'awaiting payment'}
                          </div>
                          {canPay && (
                            <div className="rental-actions">
                              <button className="btn" disabled={payingRentalId === m.rentalId} onClick={() => submitPayment(m.rentalId)}>
                                {payingRentalId === m.rentalId ? 'Processing...' : 'Pay & Confirm'}
                              </button>
                            </div>
                          )}
                          <span className="bubble-time">{fmtTime(m.timestamp)}</span>
                        </div>
                      ) : isReturnInitiated ? (
                        <div className={'rental-request-card' + (mine ? ' rental-request-card--mine' : '')}>
                          <div className="rental-request-title" style={{ color: '#059669' }}>📦 Return Initiated</div>
                          <div><strong>{m.rental?.title || 'Item'}</strong></div>
                          <div className="muted">{m.body}</div>
                          {canConfirmReturn && (
                            <div className="rental-actions">
                              <button
                                className="btn"
                                style={{ background: '#059669' }}
                                disabled={confirmingReturnId === m.rentalId}
                                onClick={() => confirmReturn(m.rentalId)}
                              >
                                {confirmingReturnId === m.rentalId ? 'Confirming...' : 'Confirm Return'}
                              </button>
                              <button
                                className="btn"
                                style={{ background: '#ef4444' }}
                                onClick={() => setDisputeModal({ open: true, rentalId: m.rentalId, rentalTitle: m.rental?.title || 'Item' })}
                              >
                                Report Issue
                              </button>
                            </div>
                          )}
                          <span className="bubble-time">{fmtTime(m.timestamp)}</span>
                        </div>
                      ) : isReturnConfirmed ? (
                        <div className={'rental-request-card' + (mine ? ' rental-request-card--mine' : '')}>
                          <div className="rental-request-title" style={{ color: '#059669' }}>✅ Return Confirmed</div>
                          <div><strong>{m.rental?.title || 'Item'}</strong></div>
                          <div className="muted">{m.body}</div>
                          <span className="bubble-time">{fmtTime(m.timestamp)}</span>
                        </div>
                      ) : isDisputeFiled ? (
                        <div className={'rental-request-card' + (mine ? ' rental-request-card--mine' : '')}>
                          <div className="rental-request-title" style={{ color: '#ef4444' }}>⚠ Dispute Filed</div>
                          <div><strong>{m.rental?.title || 'Item'}</strong></div>
                          {m.dispute && <div className="muted">Reason: {m.dispute.reason}</div>}
                          {m.dispute?.description && <div className="muted">Details: {m.dispute.description}</div>}
                          <div className="muted" style={{ marginTop: 4 }}>The RentAll admin team has been notified and will follow up within 24–48 hours.</div>
                          <span className="bubble-time">{fmtTime(m.timestamp)}</span>
                        </div>
                      ) : (
                        <div className={'bubble' + (mine ? ' bubble--mine' : '')}>
                          <span>{m.body}</span>
                          <span className="bubble-time">{fmtTime(m.timestamp)}</span>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input-row" onSubmit={send}>
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder={`Message ${displayName(otherEmail, allKnownUsers)}...`}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                disabled={sending}
              />
              <button type="submit" className="send-btn" disabled={!draft.trim() || sending}>
                ➤
              </button>
            </form>
          </>
        )}
      </div>
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
