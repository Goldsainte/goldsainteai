-- Function to update follower/following counts when a follow happens
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following_count for the follower
    UPDATE profiles
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;
    
    -- Increment followers_count for the person being followed
    UPDATE profiles
    SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE id = NEW.following_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following_count for the follower
    UPDATE profiles
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = OLD.follower_id;
    
    -- Decrement followers_count for the person being unfollowed
    UPDATE profiles
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE id = OLD.following_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for insert
CREATE TRIGGER trigger_update_follow_counts_insert
AFTER INSERT ON user_follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- Create trigger for delete
CREATE TRIGGER trigger_update_follow_counts_delete
AFTER DELETE ON user_follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();