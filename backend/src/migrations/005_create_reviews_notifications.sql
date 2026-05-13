CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS rental_id INTEGER,
  ADD COLUMN IF NOT EXISTS listing_id INTEGER,
  ADD COLUMN IF NOT EXISTS reviewer_email TEXT,
  ADD COLUMN IF NOT EXISTS reviewee_email TEXT,
  ADD COLUMN IF NOT EXISTS rating INTEGER,
  ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_rental_reviewer ON reviews(rental_id, reviewer_email);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_email ON reviews(reviewee_email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email);
