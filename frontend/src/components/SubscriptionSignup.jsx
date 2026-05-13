import React, { useEffect, useState } from 'react';
import api from '../api/api.js';

const fallbackPlans = [
  {
    code: 'basic',
    name: 'Basic',
    monthlyPrice: 0,
    perks: ['Reduced service fees', 'One waived late fee per month', 'Member promo pricing'],
  },
  {
    code: 'plus',
    name: 'Plus',
    monthlyPrice: 19,
    perks: ['Priority access to popular listings', 'Free cancellation window', 'Priority support'],
  },
  {
    code: 'pro',
    name: 'Pro',
    monthlyPrice: 39,
    perks: ['Damage waiver coverage', 'Highest fee discounts', 'Fast-track booking approvals'],
  },
];

export default function SubscriptionSignup({ currentUser, onSubscribed }) {
  const [plans, setPlans] = useState(fallbackPlans);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [currentSubscription, setCurrentSubscription] = useState(currentUser?.subscription || null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [planData, subscription] = await Promise.all([
          api.getSubscriptionPlans(),
          api.getMySubscription(),
        ]);
        if (cancelled) return;
        if (Array.isArray(planData) && planData.length > 0) {
          setPlans(planData);
        }
        if (subscription) {
          setCurrentSubscription(subscription);
          setSelectedPlan(subscription.planCode);
          onSubscribed(subscription);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load subscription details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentUser?.email, onSubscribed]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const subscription = await api.signupSubscription(selectedPlan);
      setCurrentSubscription(subscription);
      onSubscribed(subscription);
      setSuccess(`You are now on the ${subscription.planName} plan.`);
    } catch (e) {
      setError(e.message || 'Could not activate subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPlan = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const subscription = await api.cancelSubscription();
      setCurrentSubscription(subscription);
      onSubscribed(subscription);
      setSelectedPlan('basic');
      setSuccess('Your subscription is now on the Basic plan.');
    } catch (e) {
      setError(e.message || 'Could not cancel subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <h2>Subscription Signup</h2>
        <p className="muted">
          Choose a plan for {currentUser?.name || currentUser?.email} to unlock rental perks.
        </p>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {success && <p className="subscription-success">{success}</p>}

      {currentSubscription && (
        <div className="subscription-current">
          <strong>Current plan:</strong> {currentSubscription.planName} (${currentSubscription.monthlyPrice}/month)
          {currentSubscription.status !== 'active' ? ` • ${currentSubscription.status}` : ''}
        </div>
      )}

      <form className="subscription-form" onSubmit={submit}>
        <div className="subscription-grid">
          {plans.map((plan) => (
            <label
              key={plan.code}
              className={`subscription-card${selectedPlan === plan.code ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name="subscription-plan"
                value={plan.code}
                checked={selectedPlan === plan.code}
                onChange={() => setSelectedPlan(plan.code)}
              />
              <div className="subscription-card-title">{plan.name}</div>
              <div className="subscription-card-price">${Number(plan.monthlyPrice || 0)}/month</div>
              <ul className="subscription-perks">
                {(plan.perks || []).map((perk) => (
                  <li key={`${plan.code}-${perk}`}>{perk}</li>
                ))}
              </ul>
            </label>
          ))}
        </div>
        {currentSubscription?.status === 'active' && currentSubscription?.planCode !== 'basic' && (
          <button
            type="button"
            className="btn subscription-cancel-btn"
            onClick={cancelPlan}
            disabled={submitting || loading}
          >
            {submitting ? 'Saving...' : 'Cancel Plan'}
          </button>
        )}
        <button type="submit" className="btn auth-submit" disabled={submitting || loading}>
          {submitting ? 'Saving...' : 'Activate Plan'}
        </button>
      </form>
    </div>
  );
}
