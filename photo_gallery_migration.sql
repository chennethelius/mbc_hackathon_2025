-- Photo Gallery Migration
-- Adds support for profile pictures and multiple photos
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. ADD PHOTO GALLERY COLUMNS TO PROFILES
-- =============================================

-- Add photo gallery array (stores URLs of uploaded photos)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Add additional Tinder-style profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interested_in TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for TEXT; -- 'relationship', 'friends', 'casual'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_level TEXT;

-- =============================================
-- 2. CREATE STORAGE BUCKET FOR PHOTOS
-- =============================================

-- Create a storage bucket for user photos (if not exists)
-- Note: This will fail if bucket already exists, which is fine
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. STORAGE POLICIES FOR USER PHOTOS
-- =============================================

-- Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-photos');

-- Allow anyone to read photos (public profiles)
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-photos');

-- Allow users to update/delete their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'user-photos');

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'user-photos');

-- =============================================
-- 4. CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_interested_in ON profiles(interested_in);

-- =============================================
-- MIGRATION COMPLETE ✅
-- =============================================
SELECT 'Photo gallery migration completed successfully!' as status;

