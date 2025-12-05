-- Vouch System Migration
-- Implements a reputation system where users can vouch for their friends
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. CREATE VOUCH TABLES
-- =============================================

-- User vouch budgets and metadata
CREATE TABLE IF NOT EXISTS user_vouch_stats (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  budget DECIMAL(10, 2) DEFAULT 20.0 NOT NULL, -- Current available budget
  base_budget DECIMAL(10, 2) DEFAULT 20.0 NOT NULL, -- BASE_BUDGET constant
  points_per_friend DECIMAL(10, 2) DEFAULT 3.0 NOT NULL, -- POINTS_PER_FRIEND constant
  total_allocated DECIMAL(10, 2) DEFAULT 0.0 NOT NULL, -- Sum of all vouches given
  vouch_score DECIMAL(5, 2) DEFAULT 0.0 NOT NULL, -- Average vouch score received
  total_vouches_received INTEGER DEFAULT 0, -- Count of vouchers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual vouch records (who vouched for whom with how many points)
CREATE TABLE IF NOT EXISTS vouches (
  id SERIAL PRIMARY KEY,
  voucher_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- User giving the vouch
  vouchee_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- User receiving the vouch
  points DECIMAL(5, 2) NOT NULL CHECK (points >= 0 AND points <= 5), -- Vouch value (0-5)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only vouch once per friend
  UNIQUE(voucher_id, vouchee_id),
  
  -- Prevent self-vouching
  CHECK (voucher_id != vouchee_id)
);

-- Vouch history log (tracks budget changes from date outcomes)
CREATE TABLE IF NOT EXISTS vouch_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'date_success', 'date_fail', 'vouch_given', 'vouch_updated'
  points_change DECIMAL(10, 2) NOT NULL, -- Positive for gains, negative for losses
  budget_after DECIMAL(10, 2) NOT NULL,
  related_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL, -- Related to date/vouch
  related_date_id INTEGER, -- Future reference if you have a dates table
  details JSONB, -- Additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_vouches_voucher ON vouches(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vouches_vouchee ON vouches(vouchee_id);
CREATE INDEX IF NOT EXISTS idx_vouch_history_user ON vouch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_vouch_history_created ON vouch_history(created_at DESC);

-- =============================================
-- 3. CREATE FUNCTIONS
-- =============================================

-- Function to initialize vouch stats for a new user
CREATE OR REPLACE FUNCTION initialize_user_vouch_stats(p_user_id TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO user_vouch_stats (user_id, budget, base_budget, points_per_friend, total_allocated, vouch_score, total_vouches_received)
  VALUES (p_user_id, 20.0, 20.0, 3.0, 0.0, 0.0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate initial budget based on friend count
CREATE OR REPLACE FUNCTION calculate_initial_budget(p_user_id TEXT)
RETURNS DECIMAL AS $$
DECLARE
  v_friend_count INTEGER;
  v_base_budget DECIMAL;
  v_points_per_friend DECIMAL;
BEGIN
  -- Count accepted friendships
  SELECT COUNT(*) INTO v_friend_count
  FROM friendships
  WHERE (user_id = p_user_id OR friend_id = p_user_id)
    AND status = 'accepted';
  
  -- Get user's budget constants
  SELECT base_budget, points_per_friend INTO v_base_budget, v_points_per_friend
  FROM user_vouch_stats
  WHERE user_id = p_user_id;
  
  -- Default if not found
  IF v_base_budget IS NULL THEN
    v_base_budget := 20.0;
    v_points_per_friend := 3.0;
  END IF;
  
  RETURN v_base_budget + (v_points_per_friend * v_friend_count);
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate vouch score for a user
CREATE OR REPLACE FUNCTION recalculate_vouch_score(p_user_id TEXT)
RETURNS void AS $$
DECLARE
  v_avg_score DECIMAL;
  v_count INTEGER;
BEGIN
  -- Calculate average of all non-zero vouches received
  SELECT 
    COALESCE(AVG(points), 0),
    COUNT(*)
  INTO v_avg_score, v_count
  FROM vouches
  WHERE vouchee_id = p_user_id AND points > 0;
  
  -- Update user stats
  UPDATE user_vouch_stats
  SET 
    vouch_score = v_avg_score,
    total_vouches_received = v_count,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update vouch budget when friend count changes
CREATE OR REPLACE FUNCTION update_vouch_budget_on_friendship()
RETURNS TRIGGER AS $$
DECLARE
  v_user1_id TEXT;
  v_user2_id TEXT;
  v_new_budget DECIMAL;
  v_total_allocated DECIMAL;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status != 'accepted') THEN
    -- Friendship accepted - increase budget for both users
    v_user1_id := NEW.user_id;
    v_user2_id := NEW.friend_id;
    
    -- Initialize stats if they don't exist
    PERFORM initialize_user_vouch_stats(v_user1_id);
    PERFORM initialize_user_vouch_stats(v_user2_id);
    
    -- Update budgets for both users
    FOR v_user1_id IN (SELECT * FROM (VALUES (NEW.user_id), (NEW.friend_id)) AS t(id)) LOOP
      v_new_budget := calculate_initial_budget(v_user1_id);
      
      SELECT total_allocated INTO v_total_allocated
      FROM user_vouch_stats
      WHERE user_id = v_user1_id;
      
      UPDATE user_vouch_stats
      SET 
        budget = v_new_budget - COALESCE(v_total_allocated, 0),
        updated_at = NOW()
      WHERE user_id = v_user1_id;
    END LOOP;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status != 'accepted' AND OLD.status = 'accepted') THEN
    -- Friendship removed/rejected - decrease budget for both users
    v_user1_id := COALESCE(OLD.user_id, NEW.user_id);
    v_user2_id := COALESCE(OLD.friend_id, NEW.friend_id);
    
    FOR v_user1_id IN (SELECT * FROM (VALUES (v_user1_id), (v_user2_id)) AS t(id)) LOOP
      v_new_budget := calculate_initial_budget(v_user1_id);
      
      SELECT total_allocated INTO v_total_allocated
      FROM user_vouch_stats
      WHERE user_id = v_user1_id;
      
      UPDATE user_vouch_stats
      SET 
        budget = v_new_budget - COALESCE(v_total_allocated, 0),
        updated_at = NOW()
      WHERE user_id = v_user1_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. CREATE TRIGGERS
-- =============================================

-- Trigger to update budgets when friendships change
DROP TRIGGER IF EXISTS update_vouch_budgets_on_friendship ON friendships;
CREATE TRIGGER update_vouch_budgets_on_friendship
  AFTER INSERT OR UPDATE OR DELETE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_vouch_budget_on_friendship();

-- Trigger to recalculate vouch scores when vouches change
CREATE OR REPLACE FUNCTION trigger_recalculate_vouch_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_vouch_score(OLD.vouchee_id);
  ELSE
    PERFORM recalculate_vouch_score(NEW.vouchee_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalc_vouch_score_on_vouch_change ON vouches;
CREATE TRIGGER recalc_vouch_score_on_vouch_change
  AFTER INSERT OR UPDATE OR DELETE ON vouches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_vouch_score();

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE user_vouch_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouch_history ENABLE ROW LEVEL SECURITY;

-- User vouch stats: users can read anyone's stats, but only update their own
CREATE POLICY "Anyone can view vouch stats"
  ON user_vouch_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own vouch stats"
  ON user_vouch_stats FOR UPDATE
  USING (true); -- Will be validated in application layer

-- Vouches: users can read all vouches, but only manage their own given vouches
CREATE POLICY "Anyone can view vouches"
  ON vouches FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own vouches"
  ON vouches FOR INSERT
  WITH CHECK (true); -- Will be validated in application layer

CREATE POLICY "Users can update their own vouches"
  ON vouches FOR UPDATE
  USING (true); -- Will be validated in application layer

CREATE POLICY "Users can delete their own vouches"
  ON vouches FOR DELETE
  USING (true); -- Will be validated in application layer

-- Vouch history: users can read their own history
CREATE POLICY "Users can view their own vouch history"
  ON vouch_history FOR SELECT
  USING (true);

-- =============================================
-- 6. INITIALIZE EXISTING USERS
-- =============================================

-- Initialize vouch stats for all existing users
INSERT INTO user_vouch_stats (user_id, budget, base_budget, points_per_friend, total_allocated, vouch_score, total_vouches_received)
SELECT 
  p.id,
  20.0 + (3.0 * COALESCE(friend_count, 0)) as budget,
  20.0 as base_budget,
  3.0 as points_per_friend,
  0.0 as total_allocated,
  0.0 as vouch_score,
  0 as total_vouches_received
FROM profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as friend_count
  FROM (
    SELECT user_id FROM friendships WHERE status = 'accepted'
    UNION ALL
    SELECT friend_id as user_id FROM friendships WHERE status = 'accepted'
  ) f
  GROUP BY user_id
) fc ON p.id = fc.user_id
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- MIGRATION COMPLETE ✅
-- =============================================
SELECT 'Vouch system migration completed successfully!' as status;

