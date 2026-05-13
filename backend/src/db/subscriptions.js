const { query, requireDb } = require('./pool');

const PLAN_CATALOG = {
  basic: {
    code: 'basic',
    name: 'Basic',
    monthlyPrice: 0,
    perks: ['Reduced service fees', 'One waived late fee per month', 'Member promo pricing'],
  },
  plus: {
    code: 'plus',
    name: 'Plus',
    monthlyPrice: 19,
    perks: ['Priority access to popular listings', 'Free cancellation window', 'Priority support'],
  },
  pro: {
    code: 'pro',
    name: 'Pro',
    monthlyPrice: 39,
    perks: ['Damage waiver coverage', 'Highest fee discounts', 'Fast-track booking approvals'],
  },
};
const DEFAULT_PLAN_CODE = 'basic';

function normalizePlanCode(value) {
  const code = String(value || '').trim().toLowerCase();
  if (!code || !PLAN_CATALOG[code]) return null;
  return code;
}

function toSubscription(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    planCode: row.plan_code,
    planName: row.plan_name,
    monthlyPrice: Number(row.monthly_price || 0),
    perks: Array.isArray(row.perks) ? row.perks : [],
    status: row.status,
    startedAt: row.started_at ? new Date(row.started_at).getTime() : 0,
    renewalDate: row.renewal_date ? new Date(row.renewal_date).getTime() : 0,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0,
  };
}

function listPlans() {
  return Object.values(PLAN_CATALOG);
}

async function getSubscriptionByUserEmail(email) {
  requireDb();
  const res = await query(
    `SELECT s.*
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE lower(u.email) = lower($1)
     ORDER BY s.updated_at DESC
     LIMIT 1`,
    [email]
  );
  const existing = toSubscription(res.rows[0]);
  if (existing) return existing;
  return upsertSubscriptionByUserEmail(email, DEFAULT_PLAN_CODE);
}

async function upsertSubscriptionByUserId(userId, planCode) {
  requireDb();
  const normalizedPlanCode = normalizePlanCode(planCode);
  if (!normalizedPlanCode) {
    const err = new Error('Valid planCode is required');
    err.status = 400;
    throw err;
  }

  const plan = PLAN_CATALOG[normalizedPlanCode];
  const res = await query(
    `INSERT INTO subscriptions
      (user_id, plan_code, plan_name, monthly_price, perks, status, started_at, renewal_date, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, 'active', now(), now() + interval '1 month', now())
     ON CONFLICT (user_id) DO UPDATE
     SET plan_code = EXCLUDED.plan_code,
         plan_name = EXCLUDED.plan_name,
         monthly_price = EXCLUDED.monthly_price,
         perks = EXCLUDED.perks,
         status = 'active',
         started_at = now(),
         renewal_date = now() + interval '1 month',
         updated_at = now()
     RETURNING *`,
    [userId, plan.code, plan.name, plan.monthlyPrice, JSON.stringify(plan.perks)]
  );
  return toSubscription(res.rows[0]);
}

async function upsertSubscriptionByUserEmail(email, planCode) {
  requireDb();
  const normalizedPlanCode = normalizePlanCode(planCode);
  if (!normalizedPlanCode) {
    const err = new Error('Valid planCode is required');
    err.status = 400;
    throw err;
  }

  const userRes = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
  const userId = userRes.rows[0]?.id;
  if (!userId) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return upsertSubscriptionByUserId(userId, normalizedPlanCode);
}

async function cancelSubscriptionByUserEmail(email) {
  requireDb();
  const current = await getSubscriptionByUserEmail(email);
  if (current.planCode === DEFAULT_PLAN_CODE && current.status === 'active') return current;
  return upsertSubscriptionByUserEmail(email, DEFAULT_PLAN_CODE);
}

module.exports = {
  listPlans,
  normalizePlanCode,
  getSubscriptionByUserEmail,
  upsertSubscriptionByUserId,
  upsertSubscriptionByUserEmail,
  cancelSubscriptionByUserEmail,
};
