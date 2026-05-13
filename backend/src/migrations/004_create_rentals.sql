CREATE TABLE IF NOT EXISTS rentals (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS listing_id INTEGER,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS price_per_day NUMERIC,
  ADD COLUMN IF NOT EXISTS renter_email TEXT,
  ADD COLUMN IF NOT EXISTS owner_email TEXT,
  ADD COLUMN IF NOT EXISTS renter_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS renter_phone TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS days INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS total NUMERIC,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

ALTER TABLE rentals ALTER COLUMN status SET DEFAULT 'pending';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rentals' AND column_name = 'total_price'
  ) THEN
    ALTER TABLE rentals ALTER COLUMN total_price DROP NOT NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_rentals_listing_id ON rentals(listing_id);
CREATE INDEX IF NOT EXISTS idx_rentals_owner_email ON rentals(owner_email);
CREATE INDEX IF NOT EXISTS idx_rentals_renter_email ON rentals(renter_email);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
