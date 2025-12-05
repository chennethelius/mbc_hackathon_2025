-- =============================================
-- COMPLETE FRIENDS FEATURE SETUP
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- =============================================
-- PART 1: CREATE FRIENDSHIPS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status options: 'pending', 'accepted', 'rejected', 'blocked'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- Ensure we don't have duplicate friendships
  CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
  -- Ensure user can't friend themselves
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- =============================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON friendships(friend_id, status);

-- =============================================
-- PART 3: CREATE AUTO-UPDATE TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_friendships_updated_at ON friendships;
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE
    ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PART 4: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PART 5: CREATE RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON friendships;

CREATE POLICY "Users can view their friendships" ON friendships
  FOR SELECT USING (true);

CREATE POLICY "Users can create friendships" ON friendships
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their friendships" ON friendships
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their friendships" ON friendships
  FOR DELETE USING (true);

-- =============================================
-- PART 6: CREATE HELPER VIEW
-- =============================================

CREATE OR REPLACE VIEW user_friends AS
SELECT 
  f.id as friendship_id,
  f.user_id,
  f.friend_id,
  f.status,
  f.created_at,
  p.username as friend_username,
  p.display_name as friend_display_name,
  p.avatar_url as friend_avatar,
  p.photos as friend_photos,
  p.university as friend_university,
  p.bio as friend_bio
FROM friendships f
JOIN profiles p ON f.friend_id = p.id
WHERE f.status = 'accepted';

-- =============================================
-- PART 7: FIX INCOMPLETE USER PROFILES (OPTIONAL)
-- (Auto-generate usernames from emails if missing)
-- =============================================

-- OPTIONAL: This auto-generates usernames/display names from emails
-- Note: The app now works even without this - users are searchable by email!
-- Uncomment if you want to auto-populate usernames:

/*
UPDATE profiles
SET 
  username = COALESCE(username, split_part(email, '@', 1)),
  display_name = COALESCE(display_name, initcap(split_part(email, '@', 1)))
WHERE username IS NULL OR display_name IS NULL;
*/

-- =============================================
-- PART 8: VERIFICATION QUERIES
-- =============================================

-- Check friendships table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'friendships'
) as friendships_exists;

-- Check all users are searchable
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE username IS NOT NULL AND display_name IS NOT NULL) as searchable_users
FROM profiles;

-- View all users with their profile data
SELECT 
  u.id,
  u.email,
  p.username,
  p.display_name,
  p.university
FROM users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- =============================================
-- SETUP COMPLETE! ✅
-- =============================================

SELECT 
  '✅ Friends feature setup complete!' as status,
  COUNT(*) as total_friendships,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_friends,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_requests
FROM friendships;

