-- ==========================================
-- PRODUCTION FIXES FOR SOCIAL FEED SCALE
-- ==========================================

-- Critical Performance Indexes
CREATE INDEX IF NOT EXISTS idx_travel_posts_user_id ON travel_posts(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_travel_posts_created_at_desc ON travel_posts(created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_travel_posts_like_count_desc ON travel_posts(like_count DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_travel_posts_view_count_desc ON travel_posts(view_count DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_travel_posts_status_created ON travel_posts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moments_user_id ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_user_expires ON moments(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_created_at_desc ON moments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON post_likes(user_id, post_id);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Security - Require Authentication
DROP POLICY IF EXISTS "authenticated_post_insert" ON travel_posts;
CREATE POLICY "authenticated_post_insert" ON travel_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_moment_insert" ON moments;
CREATE POLICY "authenticated_moment_insert" ON moments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_comment_insert" ON post_comments;
CREATE POLICY "authenticated_comment_insert" ON post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Rate Limiting
DROP POLICY IF EXISTS "limit_post_rate" ON travel_posts;
CREATE POLICY "limit_post_rate" ON travel_posts FOR INSERT TO authenticated WITH CHECK ((SELECT COUNT(*) FROM travel_posts WHERE user_id = auth.uid() AND created_at > now() - interval '1 minute') < 5);

DROP POLICY IF EXISTS "limit_moment_rate" ON moments;
CREATE POLICY "limit_moment_rate" ON moments FOR INSERT TO authenticated WITH CHECK ((SELECT COUNT(*) FROM moments WHERE user_id = auth.uid() AND created_at > now() - interval '1 hour') < 10);

DROP POLICY IF EXISTS "limit_comment_rate" ON post_comments;
CREATE POLICY "limit_comment_rate" ON post_comments FOR INSERT TO authenticated WITH CHECK ((SELECT COUNT(*) FROM post_comments WHERE user_id = auth.uid() AND created_at > now() - interval '1 minute') < 20);