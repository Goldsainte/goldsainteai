-- Create user_preferences table for volume settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  native_video_volume INTEGER NOT NULL DEFAULT 100,
  music_volume INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create validation trigger function for volume range
CREATE OR REPLACE FUNCTION public.validate_volume_range()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.native_video_volume IS NOT NULL AND (NEW.native_video_volume < 0 OR NEW.native_video_volume > 100) THEN
    RAISE EXCEPTION 'native_video_volume must be between 0 and 100';
  END IF;
  
  IF NEW.music_volume IS NOT NULL AND (NEW.music_volume < 0 OR NEW.music_volume > 100) THEN
    RAISE EXCEPTION 'music_volume must be between 0 and 100';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach validation trigger
CREATE TRIGGER validate_volumes_before_insert_update
  BEFORE INSERT OR UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_volume_range();

-- Trigger for updated_at
CREATE TRIGGER handle_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();