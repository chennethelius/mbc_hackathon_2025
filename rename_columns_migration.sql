-- Rename columns in match_proposals to be gender-neutral
-- girl_c -> matched_person (the person being matched with, who accepts)
-- friend_b -> vouched_friend (the friend being vouched for)

-- Rename columns in match_proposals table
ALTER TABLE match_proposals 
  RENAME COLUMN friend_b_id TO vouched_friend_id;

ALTER TABLE match_proposals 
  RENAME COLUMN girl_c_id TO matched_person_id;

-- Rename columns in markets table
ALTER TABLE markets 
  RENAME COLUMN friend_b_id TO vouched_friend_id;

ALTER TABLE markets 
  RENAME COLUMN girl_c_id TO matched_person_id;

-- Update indexes
DROP INDEX IF EXISTS idx_match_proposals_friend_b;
DROP INDEX IF EXISTS idx_match_proposals_girl_c;

CREATE INDEX IF NOT EXISTS idx_match_proposals_vouched_friend ON match_proposals(vouched_friend_id);
CREATE INDEX IF NOT EXISTS idx_match_proposals_matched_person ON match_proposals(matched_person_id);

-- Update vouchers table comment for clarity
COMMENT ON TABLE vouchers IS 'Tracks who vouches for whom. Vouchers can bet on markets involving the person they vouched for.';
COMMENT ON COLUMN vouchers.vouched_for_id IS 'The user being vouched for';
COMMENT ON COLUMN vouchers.user_id IS 'The user doing the vouching';

-- Update match_proposals comments
COMMENT ON COLUMN match_proposals.matchmaker_id IS 'Person A: Creates the match proposal';
COMMENT ON COLUMN match_proposals.vouched_friend_id IS 'Person B: The friend being vouched for and matched';
COMMENT ON COLUMN match_proposals.matched_person_id IS 'Person C: The person being matched with Person B - must accept';

-- Update markets table comments
COMMENT ON TABLE markets IS 'Blockchain markets created when matched_person accepts a proposal';
COMMENT ON COLUMN markets.vouched_friend_id IS 'Person B: The friend being vouched for';
COMMENT ON COLUMN markets.matched_person_id IS 'Person C: The person who accepted the match';

-- Update RLS policies
DROP POLICY IF EXISTS "Girl C can update proposals" ON match_proposals;
DROP POLICY IF EXISTS "Users can view proposals they are involved in" ON match_proposals;

CREATE POLICY "Users can view proposals they are involved in" ON match_proposals
  FOR SELECT USING (
    auth.uid()::text = matchmaker_id OR
    auth.uid()::text = vouched_friend_id OR
    auth.uid()::text = matched_person_id
  );

CREATE POLICY "Matched person can update proposals" ON match_proposals
  FOR UPDATE USING (auth.uid()::text = matched_person_id);

-- Verify changes
SELECT 
  'match_proposals' as table_name,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'match_proposals' 
  AND column_name IN ('matchmaker_id', 'vouched_friend_id', 'matched_person_id')
UNION ALL
SELECT 
  'markets' as table_name,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'markets' 
  AND column_name IN ('vouched_friend_id', 'matched_person_id')
ORDER BY table_name, column_name;
