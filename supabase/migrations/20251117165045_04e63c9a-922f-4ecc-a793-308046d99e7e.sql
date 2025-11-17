-- Add related_concierge_session_id to storyboards table
alter table storyboards
  add column if not exists related_concierge_session_id uuid
  references concierge_sessions(id) on delete set null;