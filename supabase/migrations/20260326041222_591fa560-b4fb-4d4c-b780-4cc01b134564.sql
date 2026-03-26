ALTER TABLE public.storyboard_items
  ADD COLUMN IF NOT EXISTS repinned_from_item_id uuid REFERENCES public.storyboard_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS repinned_from_user_id uuid;