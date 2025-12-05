-- Match Proposals and Voucher System Migration

-- 1. Vouchers Table (who vouched for whom)
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vouched_for_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, vouched_for_id)
);

-- 2. Match Proposals Table
CREATE TABLE IF NOT EXISTS match_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  girl_c_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'completed')) DEFAULT 'pending',
  date_time TIMESTAMP, -- Set by girl_c when accepting
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Markets Table (link blockchain contracts to match proposals)
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT UNIQUE NOT NULL,
  match_proposal_id UUID REFERENCES match_proposals(id) ON DELETE CASCADE,
  friend_b_id UUID REFERENCES profiles(id),
  girl_c_id UUID REFERENCES profiles(id),
  resolution_time TIMESTAMP NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  outcome BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Market Access (who can bet on which market)
CREATE TABLE IF NOT EXISTS market_access (
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IN ('vouched_for_b', 'vouched_for_c', 'matchmaker')),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (market_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_vouched_for_id ON vouchers(vouched_for_id);
CREATE INDEX IF NOT EXISTS idx_match_proposals_matchmaker ON match_proposals(matchmaker_id);
CREATE INDEX IF NOT EXISTS idx_match_proposals_friend_b ON match_proposals(friend_b_id);
CREATE INDEX IF NOT EXISTS idx_match_proposals_girl_c ON match_proposals(girl_c_id);
CREATE INDEX IF NOT EXISTS idx_match_proposals_status ON match_proposals(status);
CREATE INDEX IF NOT EXISTS idx_markets_contract_address ON markets(contract_address);
CREATE INDEX IF NOT EXISTS idx_markets_match_proposal ON markets(match_proposal_id);
CREATE INDEX IF NOT EXISTS idx_market_access_user ON market_access(user_id);

-- RLS Policies
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_access ENABLE ROW LEVEL SECURITY;

-- Vouchers: Users can view their own vouchers and vouchers for them
CREATE POLICY "Users can view their vouchers" ON vouchers
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = vouched_for_id);

CREATE POLICY "Users can create vouchers" ON vouchers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Match Proposals: Participants can view their proposals
CREATE POLICY "Users can view their match proposals" ON match_proposals
  FOR SELECT USING (
    auth.uid() = matchmaker_id OR 
    auth.uid() = friend_b_id OR 
    auth.uid() = girl_c_id
  );

CREATE POLICY "Matchmakers can create proposals" ON match_proposals
  FOR INSERT WITH CHECK (auth.uid() = matchmaker_id);

CREATE POLICY "Girl C can update proposals" ON match_proposals
  FOR UPDATE USING (auth.uid() = girl_c_id);

-- Markets: Anyone with access can view
CREATE POLICY "Users can view markets they have access to" ON markets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM market_access 
      WHERE market_access.market_id = markets.id 
      AND market_access.user_id = auth.uid()
    )
  );

-- Market Access: Users can view their own access
CREATE POLICY "Users can view their market access" ON market_access
  FOR SELECT USING (auth.uid() = user_id);
