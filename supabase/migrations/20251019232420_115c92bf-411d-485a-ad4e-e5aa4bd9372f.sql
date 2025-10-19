-- Force PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';