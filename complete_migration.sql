-- Complete Migration: Match Proposals, Vouchers, and Notifications
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. VOUCHERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  vouched_for_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vouched_for_id)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_vouched_for_id ON vouchers(vouched_for_id);

-- =============================================
-- 2. MATCH PROPOSALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS match_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  friend_b_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  girl_c_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'completed')) DEFAULT 'pending',
  date_time TIMESTAMP WITH TIME ZONE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_proposals_matchmaker ON match_proposals(matchmaker_id);
CREATE INDEX IF NOT EXISTS idx_match_proposals_friend_b ON match_proposals(friend_b_id);
CREATE INDEX IF NOT EXISTS idx_match_proposals_girl_c ON match_proposals(girl_c_id);
CREATE INDEX IF NOT EXISTS idx_match_proposals_status ON match_proposals(status);

-- =============================================
-- 3. MARKETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT UNIQUE NOT NULL,
  match_proposal_id UUID REFERENCES match_proposals(id) ON DELETE CASCADE,
  friend_b_id TEXT REFERENCES profiles(id),
  girl_c_id TEXT REFERENCES profiles(id),
  resolution_time TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  outcome BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_markets_contract_address ON markets(contract_address);
CREATE INDEX IF NOT EXISTS idx_markets_proposal_id ON markets(match_proposal_id);

-- =============================================
-- 4. MARKET ACCESS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS market_access (
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IN ('vouched_for_b', 'vouched_for_c', 'matchmaker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (market_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_market_access_user_id ON market_access(user_id);

-- =============================================
-- 5. ADD PROPOSAL_ID TO NOTIFICATIONS
-- =============================================
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES match_proposals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_proposal_id ON notifications(proposal_id);

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_access ENABLE ROW LEVEL SECURITY;

-- Vouchers policies
CREATE POLICY "Users can view their own vouchers"
  ON vouchers FOR SELECT
  USING (auth.uid()::text = user_id OR auth.uid()::text = vouched_for_id);

CREATE POLICY "Users can create vouchers"
  ON vouchers FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own vouchers"
  ON vouchers FOR DELETE
  USING (auth.uid()::text = user_id);

-- Match proposals policies
CREATE POLICY "Users can view proposals they're involved in"
  ON match_proposals FOR SELECT
  USING (
    auth.uid()::text = matchmaker_id OR 
    auth.uid()::text = friend_b_id OR 
    auth.uid()::text = girl_c_id
  );

CREATE POLICY "Users can create proposals"
  ON match_proposals FOR INSERT
  WITH CHECK (auth.uid()::text = matchmaker_id);

CREATE POLICY "Participants can update proposals"
  ON match_proposals FOR UPDATE
  USING (
    auth.uid()::text = friend_b_id OR 
    auth.uid()::text = girl_c_id
  );

-- Markets policies
CREATE POLICY "Users can view markets they have access to"
  ON markets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM market_access 
      WHERE market_id = markets.id 
      AND user_id = auth.uid()::text
    )
  );

-- Market access policies
CREATE POLICY "Users can view their own market access"
  ON market_access FOR SELECT
  USING (auth.uid()::text = user_id);
