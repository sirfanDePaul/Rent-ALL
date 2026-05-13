CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  location TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Change id to userId (generate a longer unique id)
