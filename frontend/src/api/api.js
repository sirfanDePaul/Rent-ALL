const base = (process.env.REACT_APP_API_URL || '') + '/api';

let authToken = localStorage.getItem('rentallToken') || '';

export function setAuthToken(token) {
  authToken = token || '';
  if (authToken) localStorage.setItem('rentallToken', authToken);
  else localStorage.removeItem('rentallToken');
}

export function getAuthToken() {
  return authToken;
}

async function req(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(base + path, { ...opts, headers });
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const parseBody = async () => {
    if (res.status === 204) return null;
    const raw = await res.text();
    if (!raw) return null;
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    return raw;
  };

  if (!res.ok) {
    const body = await parseBody();
    let message = 'Request failed';
    if (body && typeof body === 'object') message = body.message || message;
    else if (typeof body === 'string') message = body || message;
    throw new Error(message || 'Request failed');
  }
  return parseBody();
}

export default {
  login: ({ email, password }) => req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: ({ name, email, password, location, subscriptionPlan }) => req('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, location, subscriptionPlan }) }),
  googleAuth: (credential) => req('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  getSubscriptionPlans: () => req('/subscriptions/plans'),
  getMySubscription: () => req('/subscriptions/me'),
  signupSubscription: (planCode) => req('/subscriptions/signup', { method: 'POST', body: JSON.stringify({ planCode }) }),
  cancelSubscription: () => req('/subscriptions/cancel', { method: 'POST' }),

  getListings: () => req('/listings'),
  getMyListings: () => req('/listings/mine'),
  createListing: (listing) => req('/listings', { method: 'POST', body: JSON.stringify(listing) }),
  publishListing: (id) => req(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) }),
  updateListing: (id, changes) => req(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  removeListing: (id) => req(`/listings/${id}`, { method: 'DELETE' }),

  createRentalRequest: (request) => req('/rentals/request', { method: 'POST', body: JSON.stringify(request) }),
  respondToRentalRequest: ({ rentalId, decision }) => req(`/rentals/${rentalId}/respond`, { method: 'POST', body: JSON.stringify({ decision }) }),
  submitRentalPayment: ({ rentalId }) => req(`/rentals/${rentalId}/payment`, { method: 'POST' }),
  initiateReturn: (rentalId) => req(`/rentals/${rentalId}/initiate-return`, { method: 'POST' }),
  confirmReturn: (rentalId) => req(`/rentals/${rentalId}/confirm-return`, { method: 'POST' }),
  fileDispute: (rentalId, reason, description, photos) => req(`/rentals/${rentalId}/dispute`, { method: 'POST', body: JSON.stringify({ reason, description, photos: photos || [] }) }),
  getRentals: () => req('/rentals'),

  getConversations: (email) => req(`/messages/conversations/${encodeURIComponent(email)}`),
  getMessages: (cid) => req(`/messages/${encodeURIComponent(cid)}`),
  sendMessage: ({ to, body }) => req('/messages', { method: 'POST', body: JSON.stringify({ to, body }) }),
  markRead: (conversationId) => req('/messages/mark-read', { method: 'POST', body: JSON.stringify({ conversationId }) }),

  createReview: ({ rentalId, rating, body }) => req('/reviews', { method: 'POST', body: JSON.stringify({ rentalId, rating, body }) }),
  getReviewsForUser: (email) => req(`/reviews/user/${encodeURIComponent(email)}`),
};
