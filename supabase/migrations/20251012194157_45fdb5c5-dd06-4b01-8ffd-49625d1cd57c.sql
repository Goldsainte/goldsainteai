-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_moments_user_id ON public.moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_expires_at ON public.moments(expires_at);

-- Make sure RLS is enabled on moments table
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active moments" ON public.moments;
DROP POLICY IF EXISTS "Users can create their own moments" ON public.moments;
DROP POLICY IF EXISTS "Users can delete their own moments" ON public.moments;
DROP POLICY IF EXISTS "Users can update their own moments" ON public.moments;

-- Create RLS policies for moments
-- Allow users to view all non-expired moments
CREATE POLICY "Anyone can view active moments"
ON public.moments
FOR SELECT
USING (expires_at > now());

-- Allow users to create their own moments
CREATE POLICY "Users can create their own moments"
ON public.moments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own moments
CREATE POLICY "Users can delete their own moments"
ON public.moments
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to update their own moments
CREATE POLICY "Users can update their own moments"
ON public.moments
FOR UPDATE
USING (auth.uid() = user_id);