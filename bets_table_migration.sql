-- Create bets table to track all bets placed on markets
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  position BOOLEAN NOT NULL, -- true = YES, false = NO
  amount NUMERIC NOT NULL, -- Amount in USDC
  transaction_hash TEXT,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bets_market_id ON bets(market_id);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_contract_address ON bets(contract_address);
CREATE INDEX IF NOT EXISTS idx_bets_wallet_address ON bets(wallet_address);

-- RLS policies
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all bets" ON bets
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own bets" ON bets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own bets" ON bets
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Comments
COMMENT ON TABLE bets IS 'Tracks all bets placed on prediction markets';
COMMENT ON COLUMN bets.position IS 'true = bet on YES, false = bet on NO';
COMMENT ON COLUMN bets.amount IS 'Bet amount in USDC (decimal format, e.g., 10.50)';
COMMENT ON COLUMN bets.claimed IS 'Whether the user has claimed their winnings after market resolution';
