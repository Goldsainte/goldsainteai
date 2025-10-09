-- Ensure public storage buckets and safe policies for profile photos and video thumbnails
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'travel-videos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('travel-videos', 'travel-videos', true);
  END IF;
END $$;

-- Policies for avatars bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read avatars'
  ) THEN
    CREATE POLICY "Public read avatars"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own avatars'
  ) THEN
    CREATE POLICY "Users can upload own avatars"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own avatars'
  ) THEN
    CREATE POLICY "Users can update own avatars"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own avatars'
  ) THEN
    CREATE POLICY "Users can delete own avatars"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Policies for travel-videos bucket (videos and thumbnails)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read travel-videos'
  ) THEN
    CREATE POLICY "Public read travel-videos"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'travel-videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own travel-videos'
  ) THEN
    CREATE POLICY "Users can upload own travel-videos"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'travel-videos'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own travel-videos'
  ) THEN
    CREATE POLICY "Users can update own travel-videos"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'travel-videos'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own travel-videos'
  ) THEN
    CREATE POLICY "Users can delete own travel-videos"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'travel-videos'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;