-- Add proposal_id to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS proposal_id INTEGER REFERENCES match_proposals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_proposal_id ON notifications(proposal_id);
