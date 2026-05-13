import React, { useEffect, useRef, useState } from 'react';
import TermsModal from './TermsModal';

export default function Login({ onLogin, onSignup, onGoogleAuth, googleClientId }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const googleButtonRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupLocation, setSignupLocation] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    const loginError = await onLogin({ email, password });
    if (loginError) setError(loginError);
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!ageConfirmed) {
      setError('You must confirm you are at least 16 years old.');
      return;
    }
    if (!termsAccepted) {
      setError('You must agree to the Terms and Conditions.');
      return;
    }
    const signupError = await onSignup({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      location: signupLocation,
    });
    if (signupError) setError(signupError);
  };

  useEffect(() => {
    setGoogleError('');
    if (!googleClientId) {
      setGoogleError('Google sign-in is not configured yet.');
      return;
    }
    let cancelled = false;
    let attempts = 0;

    const renderGoogleButton = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        attempts += 1;
        if (attempts > 20) {
          setGoogleError('Google sign-in is temporarily unavailable.');
          return;
        }
        setTimeout(renderGoogleButton, 250);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          setError('');
          const authError = await onGoogleAuth(response);
          if (authError) setError(authError);
        },
      });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: 360,
        text: mode === 'login' ? 'signin_with' : 'signup_with',
      });
    };

    renderGoogleButton();
    return () => {
      cancelled = true;
    };
  }, [googleClientId, mode, onGoogleAuth]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{mode === 'login' ? 'Login to RentAll' : 'Create your account'}</h2>
        <p className="muted auth-sub">
          {mode === 'login'
            ? 'Use your account credentials to continue.'
            : 'Sign up to create listings, message owners, and manage rentals.'}
        </p>
        {error && <p className="auth-error">{error}</p>}

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn auth-submit" type="submit">Login</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitSignup}>
            <input
              className="input"
              placeholder="Full name"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              required
            />
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              minLength={8}
            />
            <input
              className="input"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
            <input
              className="input"
              placeholder="Location (city, state)"
              value={signupLocation}
              onChange={(e) => setSignupLocation(e.target.value)}
              required
            />
            <label className="age-confirm-label">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
              />
              I confirm I am at least 16 years old
            </label>
            <label className="age-confirm-label">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              I agree to the{' '}
              <button
                type="button"
                className="terms-link-btn"
                onClick={() => setTermsOpen(true)}
              >
                Terms and Conditions
              </button>
            </label>
            <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
            <button className="btn auth-submit" type="submit">Create Account</button>
          </form>
        )}

        <div className="auth-divider"><span>or</span></div>
        <div className="google-auth-wrap">
          <div ref={googleButtonRef} />
          {googleError && <p className="muted google-auth-note">{googleError}</p>}
        </div>

        <div className="auth-switch">
          {mode === 'login' ? (
            <button type="button" className="auth-link-btn" onClick={() => { setError(''); setMode('signup'); }}>
              Don't have an account? Sign up
            </button>
          ) : (
            <button type="button" className="auth-link-btn" onClick={() => { setError(''); setMode('login'); }}>
              Already have an account? Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
