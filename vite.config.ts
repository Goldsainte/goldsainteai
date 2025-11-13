import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Build-time diagnostic logging for Sentry DSN
  const processEnvDsn = process.env.VITE_SENTRY_DSN;
  const loadEnvDsn = env.VITE_SENTRY_DSN;
  console.log('[Vite Config] mode:', mode);
  console.log('[Vite Config] process.env.VITE_SENTRY_DSN present:', Boolean(processEnvDsn), processEnvDsn ? `prefix: ${processEnvDsn.substring(0, 20)}...` : 'empty');
  console.log('[Vite Config] loadEnv VITE_SENTRY_DSN present:', Boolean(loadEnvDsn), loadEnvDsn ? `prefix: ${loadEnvDsn.substring(0, 20)}...` : 'empty');
  
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
    },
    build: {
      sourcemap: true, // Enable source maps for Sentry
    },
  };
});
