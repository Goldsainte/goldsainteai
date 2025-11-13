/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_SUPABASE_PROJECT_ID: string
  readonly VITE_MAPBOX_PUBLIC_TOKEN: string
  readonly VITE_INSTAGRAM_APP_ID: string
  readonly VITE_GOOGLE_PLACES_API_KEY: string
  readonly VITE_SENTRY_DSN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
