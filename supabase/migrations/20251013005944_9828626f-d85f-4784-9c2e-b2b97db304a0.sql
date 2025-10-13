-- Sync existing follow counts for all users
UPDATE profiles p
SET following_count = (
  SELECT COUNT(*)
  FROM user_follows
  WHERE follower_id = p.id
);

UPDATE profiles p
SET followers_count = (
  SELECT COUNT(*)
  FROM user_follows
  WHERE following_id = p.id
);