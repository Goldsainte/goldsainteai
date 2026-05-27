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

// Generate public/newsroom-sitemap.xml at dev start and build time by
// calling the deployed sitemap-newsroom edge function. Lovable hosting
// does not process _redirects files, so we must materialize the sitemap
// as a real static file under public/ for /newsroom-sitemap.xml to work.
function newsroomSitemapPlugin(supabaseUrl?: string) {
  const SUPABASE_URL = supabaseUrl || 'https://iwdevxltjuedijrcdejs.supabase.co';
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/sitemap-newsroom`;
  const OUT = path.resolve(__dirname, "public/newsroom-sitemap.xml");

  async function write() {
    try {
      const res = await fetch(ENDPOINT, { headers: { accept: "application/xml" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      if (!xml.startsWith("<?xml")) throw new Error("non-xml response");
      fs.writeFileSync(OUT, xml, "utf8");
      // eslint-disable-next-line no-console
      console.log(`[newsroom-sitemap] wrote ${OUT} (${xml.length} bytes)`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[newsroom-sitemap] skipped: ${(e as Error).message}`);
    }
  }

  return {
    name: "newsroom-sitemap",
    async buildStart() {
      await write();
    },
    async configureServer() {
      await write();
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
    newsroomSitemapPlugin(env.VITE_SUPABASE_URL),
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
        "@/integrations/supabase/client": path.resolve(
          __dirname,
          "./src/integrations/supabase/client-managed.ts"
        ),
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
      process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? ''
    ),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
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
    // Strip noisy debug calls from production bundles. console.warn /
    // console.error / console.info are preserved so real problems still
    // surface in production. Dev builds keep everything for debugging.
    esbuild: mode === 'production'
      ? { drop: ['debugger'], pure: ['console.log', 'console.debug', 'console.trace'] }
      : undefined,
  };
});
