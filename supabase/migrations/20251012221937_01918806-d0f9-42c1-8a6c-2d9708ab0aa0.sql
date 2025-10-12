-- Add drawing_data column to moments table to store Fabric.js drawing JSON
ALTER TABLE public.moments 
ADD COLUMN IF NOT EXISTS drawing_data TEXT;