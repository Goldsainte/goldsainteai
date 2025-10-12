-- Add text_styling column to moments table for rich text formatting
ALTER TABLE moments 
ADD COLUMN IF NOT EXISTS text_styling jsonb DEFAULT NULL;

-- Update media_type to allow 'text' type
-- First, drop the existing constraint if it exists
ALTER TABLE moments DROP CONSTRAINT IF EXISTS moments_media_type_check;

-- Add new constraint with text type
ALTER TABLE moments 
ADD CONSTRAINT moments_media_type_check 
CHECK (media_type IN ('image', 'video', 'text'));

-- Make media_url nullable since text-only moments won't have media
ALTER TABLE moments 
ALTER COLUMN media_url DROP NOT NULL;