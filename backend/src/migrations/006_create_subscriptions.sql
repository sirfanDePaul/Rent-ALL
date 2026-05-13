CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP NOT NULL DEFAULT now(),
  renewal_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_plan_code_chk CHECK (plan_code IN ('basic', 'plus', 'pro')),
  CONSTRAINT subscriptions_status_chk CHECK (status IN ('active', 'cancelled', 'past_due'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_unique ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_code ON subscriptions(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
