CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC,
  location TEXT,
  image TEXT,
  owner_email TEXT,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Add status column when missing and set default to active
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Change id to listings id (change id to longer unique id)
