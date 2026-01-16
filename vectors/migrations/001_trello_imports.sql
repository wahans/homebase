-- Trello Import Tracking Table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/eddnrkrvbbrbuzwxlgfc/sql

-- Create trello_imports table to track imported boards
CREATE TABLE IF NOT EXISTS trello_imports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  trello_board_id TEXT NOT NULL,
  trello_board_name TEXT NOT NULL,
  vectors_board_id BIGINT REFERENCES boards(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  cards_imported INTEGER DEFAULT 0,
  UNIQUE(user_id, trello_board_id)
);

-- Enable Row Level Security
ALTER TABLE trello_imports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/manage their own imports
CREATE POLICY "Users can view own imports" ON trello_imports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own imports" ON trello_imports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own imports" ON trello_imports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own imports" ON trello_imports
  FOR DELETE USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_trello_imports_user ON trello_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_trello_imports_board ON trello_imports(trello_board_id);

-- Grant necessary permissions (for partnerships - if partner should see import history)
-- Uncomment if needed:
-- CREATE POLICY "Partners can view shared imports" ON trello_imports
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM partnerships p
--       WHERE (p.user1_id = auth.uid() AND p.user2_id = trello_imports.user_id)
--          OR (p.user2_id = auth.uid() AND p.user1_id = trello_imports.user_id)
--     )
--   );
