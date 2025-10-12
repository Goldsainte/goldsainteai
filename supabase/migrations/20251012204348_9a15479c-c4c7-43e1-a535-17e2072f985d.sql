-- Enable RLS on moment_highlight_items if not already enabled
ALTER TABLE public.moment_highlight_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can add moments to their own vaults
CREATE POLICY "Users can add moments to their own vaults"
ON public.moment_highlight_items
FOR INSERT
TO authenticated
WITH CHECK (
  highlight_id IN (
    SELECT id FROM public.story_highlights
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can view moments in their vaults
CREATE POLICY "Users can view moments in their own vaults"
ON public.moment_highlight_items
FOR SELECT
TO authenticated
USING (
  highlight_id IN (
    SELECT id FROM public.story_highlights
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can remove moments from their vaults
CREATE POLICY "Users can remove moments from their vaults"
ON public.moment_highlight_items
FOR DELETE
TO authenticated
USING (
  highlight_id IN (
    SELECT id FROM public.story_highlights
    WHERE user_id = auth.uid()
  )
);