-- Create messages table if missing, and ensure required columns exist for compatibility with different schemas
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY
);

-- Change id to messagesId (change to longer unique id)

-- Add columns if they do not already exist (safe to run multiple times)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS conversation_id TEXT,
  ADD COLUMN IF NOT EXISTS from_email TEXT,
  ADD COLUMN IF NOT EXISTS to_email TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS "timestamp" BIGINT,
  ADD COLUMN IF NOT EXISTS "read" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS rental_id INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'conversation_id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
    ALTER TABLE messages ALTER COLUMN conversation_id TYPE TEXT USING conversation_id::text;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'content'
  ) THEN
    ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
  END IF;
END$$;

-- Create indexes if possible
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'messages'::regclass AND attname = 'conversation_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'messages'::regclass AND attname = 'from_email') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_from_email ON messages(from_email)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'messages'::regclass AND attname = 'to_email') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_to_email ON messages(to_email)';
  END IF;
END$$;
