-- Fix RLS policies to allow service role (backend) to insert
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create proposals" ON match_proposals;
DROP POLICY IF EXISTS "Users can create vouchers" ON vouchers;

-- Allow service role to insert (backend operations)
CREATE POLICY "Allow service role to manage proposals"
  ON match_proposals FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to manage vouchers"
  ON vouchers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Users can also create their own proposals
CREATE POLICY "Users can create their own proposals"
  ON match_proposals FOR INSERT
  WITH CHECK (auth.uid()::text = matchmaker_id);

-- Users can also create their own vouchers
CREATE POLICY "Users can create their own vouchers"
  ON vouchers FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);
