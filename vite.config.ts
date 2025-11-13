import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Build-time diagnostic logging for Sentry DSN
  const processEnvDsn = process.env.VITE_SENTRY_DSN;
  const loadEnvDsn = env.VITE_SENTRY_DSN;
  console.log('[Vite Config] mode:', mode);
  console.log('[Vite Config] process.env.VITE_SENTRY_DSN present:', Boolean(processEnvDsn), processEnvDsn ? `prefix: ${processEnvDsn.substring(0, 20)}...` : 'empty');
  console.log('[Vite Config] loadEnv VITE_SENTRY_DSN present:', Boolean(loadEnvDsn), loadEnvDsn ? `prefix: ${loadEnvDsn.substring(0, 20)}...` : 'empty');
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      // Ensure a single React instance to prevent ReactCurrentDispatcher errors
      dedupe: ["react", "react-dom"],
    },
    define: {
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(process.env.VITE_SENTRY_DSN ?? env.VITE_SENTRY_DSN ?? '')
    }
  };
});
