-- Update travel-videos bucket to allow image uploads for thumbnails
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'travel-videos';