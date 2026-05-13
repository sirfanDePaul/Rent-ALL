import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Listings from './components/Listings';
import Account from './components/Account';
import MyListings from './components/MyListings';
import Messages from './components/Messages';
import RentCheckout from './components/RentCheckout';
import Help from './components/Help';
import Login from './components/Login';
import SubscriptionSignup from './components/SubscriptionSignup';
import api, { getAuthToken, setAuthToken } from './api/api.js';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const normalizeRoute = (value) => {
  const route = (value || '').replace('#', '').trim().toLowerCase();
  if (!route) return 'Browse';
  const map = {
    browse: 'Browse',
    'my-listings': 'My Listings',
    messages: 'Messages',
    account: 'Account',
    subscriptions: 'Subscriptions',
    help: 'Help',
    login: 'Login',
  };
  return map[route] || 'Browse';
};

const toRoute = (tab) => tab.toLowerCase().replace(' ', '-');

const SESSION_KEY = 'rentall_session';

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
};

const isTokenValid = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
};

const saveSession = (user, token) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { user, token } = JSON.parse(raw);
    if (token && !isTokenValid(token)) { clearSession(); return null; }
    if (token) setAuthToken(token);
    return user || null;
  } catch {
    return null;
  }
};

export default function App() {
  const initialActive = normalizeRoute(window.location.hash);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => loadSession());
  const [active, setActive] = useState(initialActive);
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [query, setQuery] = useState('');
  const [tabAlerts, setTabAlerts] = useState({ messages: 0, myListings: 0, account: 0 });
  const [alertsSeenAt, setAlertsSeenAt] = useState({ messages: 0, myListings: 0, account: 0 });
  const tabs = ['Browse', 'My Listings', 'Messages', 'Account', 'Subscriptions', 'Help'];
  const requiresAuth = active === 'My Listings' || active === 'Messages' || active === 'Account' || active === 'Subscriptions';
  const knownUserNames = useMemo(() => currentUser ? { [currentUser.email]: currentUser.name } : {}, [currentUser]);

  const handleRent = (item) => {
    if (!currentUser) {
      navigateTo('Login');
      return;
    }
    if (item.owner === currentUser.email) {
      alert('You cannot rent your own listing.');
      return;
    }
    setCheckoutItem(item);
  };

  const exitCheckout = () => {
    setCheckoutItem(null);
  };

  const navigateTo = (tab) => {
    const now = Date.now();
    if (tab === 'Messages') {
      setAlertsSeenAt((prev) => ({ ...prev, messages: now }));
    }
    if (tab === 'My Listings') {
      setAlertsSeenAt((prev) => ({ ...prev, myListings: now }));
    }
    if (tab === 'Account') {
      setAlertsSeenAt((prev) => ({ ...prev, account: now }));
    }
    setCheckoutItem(null);
    setActive(tab);
    window.location.hash = toRoute(tab);
  };

  const handleLogin = async ({ email, password }) => {
    try {
      const { token, user, subscription } = await api.login({ email, password });
      const userWithSubscription = { ...user, subscription: subscription || null };
      setAuthToken(token);
      saveSession(userWithSubscription, token);
      setCurrentUser(userWithSubscription);
      navigateTo('Browse');
      return null;
    } catch (e) {
      console.error(e);
      return e.message || 'Server error';
    }
  };

  const handleSignup = async ({ name, email, password, location }) => {
    try {
      const { token, user, subscription } = await api.register({ name, email, password, location });
      const userWithSubscription = { ...user, subscription: subscription || null };
      setAuthToken(token);
      saveSession(userWithSubscription, token);
      setCurrentUser(userWithSubscription);
      navigateTo('Browse');
      return null;
    } catch (e) {
      console.error(e);
      return 'Server error';
    }
  };

  const handleGoogleAuth = useCallback(async (response) => {
    try {
      const { token, user, subscription } = await api.googleAuth(response.credential);
      const userWithSubscription = { ...user, subscription: subscription || null };
      setAuthToken(token);
      saveSession(userWithSubscription, token);
      setCurrentUser(userWithSubscription);
      navigateTo('Browse');
      return null;
    } catch (e) {
      console.error(e);
      return e.message || 'Google sign-in failed. Please try again.';
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setTabAlerts({ messages: 0, myListings: 0, account: 0 });
    setAlertsSeenAt({ messages: 0, myListings: 0, account: 0 });
    navigateTo('Browse');
  };

  useEffect(() => {
    if (!getAuthToken() && currentUser) {
      setCurrentUser(null);
      localStorage.removeItem('rentallUser');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let timerId;

    const loadAlerts = async () => {
      if (!currentUser) {
        if (mounted) setTabAlerts({ messages: 0, myListings: 0, account: 0 });
        return;
      }

      const [conversations, rentals] = await Promise.all([
        api.getConversations(currentUser.email),
        api.getRentals(),
      ]);

      if (!mounted) return;
      setTabAlerts({
        messages: conversations.filter((c) => c.unread && (c.timestamp || 0) > alertsSeenAt.messages).length,
        myListings: rentals.filter((r) => {
          const isMyListingsUpdate =
            r.ownerEmail === currentUser.email && (r.status === 'pending' || r.status === 'confirmed');
          if (!isMyListingsUpdate) return false;
          const eventTime = r.paidAt || r.respondedAt || r.createdAt || 0;
          return eventTime > alertsSeenAt.myListings;
        }).length,
        account: rentals.filter((r) => {
          const isAccountUpdate =
            r.renterEmail === currentUser.email &&
            (r.status === 'accepted' || r.status === 'confirmed' || r.status === 'declined');
          if (!isAccountUpdate) return false;
          const eventTime = r.paidAt || r.respondedAt || r.createdAt || 0;
          return eventTime > alertsSeenAt.account;
        }).length,
      });
    };

    loadAlerts();
    timerId = setInterval(loadAlerts, 5000);
    return () => {
      mounted = false;
      clearInterval(timerId);
    };
  }, [currentUser, active, alertsSeenAt]);

  const tabBadgeCount = (tab) => {
    if (tab === 'Messages') return tabAlerts.messages;
    if (tab === 'My Listings') return tabAlerts.myListings;
    if (tab === 'Account') return tabAlerts.account;
    return 0;
  };

  const handleSubscriptionUpdated = useCallback((subscription) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, subscription };
      saveSession(updatedUser, getAuthToken());
      return updatedUser;
    });
  }, []);

  const renderMain = () => {
    if (checkoutItem) return <RentCheckout item={checkoutItem} currentUser={currentUser} onBack={exitCheckout} onConfirmed={() => { setCheckoutItem(null); navigateTo('Messages'); }} />;
    if (active === 'Login') return <Login onLogin={handleLogin} onSignup={handleSignup} onGoogleAuth={handleGoogleAuth} googleClientId={GOOGLE_CLIENT_ID} />;
    if (requiresAuth && !currentUser) return <Login onLogin={handleLogin} onSignup={handleSignup} onGoogleAuth={handleGoogleAuth} googleClientId={GOOGLE_CLIENT_ID} />;
    if (active === 'Account') return <Account currentUser={currentUser} />;
    if (active === 'Subscriptions') {
      return (
        <SubscriptionSignup
          currentUser={currentUser}
          onSubscribed={handleSubscriptionUpdated}
        />
      );
    }
    if (active === 'My Listings') return <MyListings currentUser={currentUser} />;
    if (active === 'Messages') return <Messages currentUser={currentUser} knownUsers={knownUserNames} />;
    if (active === 'Help') return <Help />;
    return <Listings query={query} onRent={handleRent} />;
  };
  const viewKey = checkoutItem ? `checkout-${checkoutItem.id || checkoutItem.title || 'item'}` : active;

  return (
    <div className="app">
      <header className="header modern">
        <div className="header-top">
          <h1 className="logo" onClick={() => navigateTo('Browse')}>
            <span className="logo-mark" aria-hidden="true">
              <svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" role="img">
                <defs>
                  <linearGradient id="rentallLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--teal)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
                <rect x="3" y="3" width="50" height="50" rx="16" fill="url(#rentallLogoGrad)" />
                <path d="M28 14.5 13 27v14.5c0 1.4 1.1 2.5 2.5 2.5h25c1.4 0 2.5-1.1 2.5-2.5V27L28 14.5z" fill="#fff" fillOpacity=".95" />
                <path d="M25 44V33h6v11" stroke="url(#rentallLogoGrad)" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M20 30h16" stroke="url(#rentallLogoGrad)" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="38.5" cy="18.5" r="4.5" fill="#fff" fillOpacity=".95" />
                <path d="M40.8 18.5h4.4M42.8 17.1v2.8" stroke="url(#rentallLogoGrad)" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            </span>
            <span className="logo-wordmark"><span className="logo-rent">Rent</span><span className="logo-all">All</span></span>
          </h1>
          <div className="search-bar">
            <input className="search-input" placeholder="Search items, location, or category" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="auth-actions">
            {!currentUser ? (
              <button className="btn login-btn" onClick={() => navigateTo('Login')}>Login</button>
            ) : (
              <>
                <span className="auth-user">Hi, {currentUser.name}</span>
                <button className="btn logout-btn" onClick={handleLogout}>Logout</button>
              </>
            )}
          </div>
        </div>
        <nav className="nav">
          {tabs.map((t) => (
            <button key={t} className={"tab" + (active === t ? ' active' : '')} onClick={() => navigateTo(t)}>
              <span>{t}</span>
              {tabBadgeCount(t) > 0 && <span className="tab-badge">{tabBadgeCount(t)}</span>}
            </button>
          ))}
        </nav>
        {active !== 'Messages' && active !== 'Help' && active !== 'Login' && active !== 'Subscriptions' && !checkoutItem && <p className="sub">Browse items to rent or list your own</p>}
      </header>
      <main>
        <div key={viewKey} className="view-shell">
          {renderMain()}
        </div>
      </main>
    </div>
  );
}
