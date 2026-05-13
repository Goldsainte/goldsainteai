import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Inject a deploy-unique CACHE_VERSION into public/sw.js at build time so
// every deploy invalidates stale PWA caches. Sourced from common CI envs
// (commit SHA) with a timestamp fallback for local builds.
function swVersionPlugin() {
  const version =
    process.env.VITE_RELEASE_VERSION ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.COMMIT_SHA ||
    process.env.SOURCE_VERSION ||
    `build-${Date.now()}`;
  const shortVersion = version.slice(0, 12);
  return {
    name: "sw-version-injector",
    apply: "build" as const,
    closeBundle() {
      const swPath = path.resolve(__dirname, "dist/sw.js");
      if (!fs.existsSync(swPath)) return;
      const src = fs.readFileSync(swPath, "utf8");
      fs.writeFileSync(swPath, src.replace(/__CACHE_VERSION__/g, shortVersion));
      // eslint-disable-next-line no-console
      console.log(`[sw-version-injector] CACHE_VERSION=${shortVersion}`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const plugins = [
    react(),
    mode === "development" && componentTagger(),
    swVersionPlugin(),
  ].filter(Boolean);
  
  // Add Sentry plugin for source map uploads in production builds
  if (mode === 'production' && env.VITE_SENTRY_AUTH_TOKEN) {
    plugins.push(
      sentryVitePlugin({
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
        org: env.VITE_SENTRY_ORG || 'goldsainte',
        project: env.VITE_SENTRY_PROJECT || 'goldsainte-app',
        release: {
          name: env.VITE_RELEASE_VERSION || `goldsainte@${env.npm_package_version || '1.0.0'}`,
        },
        sourcemaps: {
          assets: './dist/**',
        },
      })
    );
  }
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      // Ensure a single React instance to prevent ReactCurrentDispatcher errors
      dedupe: ["react", "react-dom"],
    },
  define: {
    'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(process.env.VITE_SENTRY_DSN ?? env.VITE_SENTRY_DSN ?? ''),
    'import.meta.env.VITE_RELEASE_VERSION': JSON.stringify(
      env.VITE_RELEASE_VERSION || `goldsainte@${env.npm_package_version || '1.0.0'}`
    ),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? 'https://iwdevxltjuedijrcdejs.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZGV2eGx0anVlZGlqcmNkZWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQ4MDEsImV4cCI6MjA3NDc0MDgwMX0.syDQQrSgkyB1MEuE-OeMpxVt6wfoH17lDjMGGEzOiBc'
    ),
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(
      process.env.VITE_GOOGLE_MAPS_API_KEY ?? env.VITE_GOOGLE_MAPS_API_KEY ?? ''
    ),
  },
    build: {
      // 'hidden' generates .map files for Sentry upload but omits the
      // //# sourceMappingURL comment so browsers/CDN consumers can't
      // discover them from public bundles.
      sourcemap: 'hidden',
    },
  };
});
