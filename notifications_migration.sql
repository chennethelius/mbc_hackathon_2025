-- Notifications Migration
-- Creates a notifications table for user notifications
-- Run this in your Supabase SQL Editor

-- =============================================
-- CREATE NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'match', 'vouch', 'market', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL, -- Related user (e.g., matched user)
  related_user_profile JSONB, -- Store profile data for quick access
  matcher_id TEXT REFERENCES profiles(id) ON DELETE SET NULL, -- User who made the match
  matcher_profile JSONB, -- Store matcher's profile data for quick access
  deadline TIMESTAMP WITH TIME ZONE, -- Deadline for match response
  requires_response BOOLEAN DEFAULT false, -- Whether this user needs to accept/reject the match
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Add matcher columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'matcher_id') THEN
    ALTER TABLE notifications ADD COLUMN matcher_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'matcher_profile') THEN
    ALTER TABLE notifications ADD COLUMN matcher_profile JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'deadline') THEN
    ALTER TABLE notifications ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'requires_response') THEN
    ALTER TABLE notifications ADD COLUMN requires_response BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE notifications IS 'Stores user notifications including matches, vouches, and other events';

