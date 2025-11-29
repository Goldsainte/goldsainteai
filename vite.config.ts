import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const plugins = [react(), mode === "development" && componentTagger()].filter(Boolean);
  
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
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? ''),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''),
  },
    build: {
      sourcemap: true, // Enable source maps for Sentry
    },
  };
});
