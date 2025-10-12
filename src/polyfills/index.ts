// Polyfills for browser environment
// Ensures libraries that expect a Node-like `process` don't crash in Vite

// Only define if missing to avoid interfering with other environments
if (!(globalThis as any).process) {
  (globalThis as any).process = { env: {} } as any;
  // Optional: mark as browser
  try {
    (globalThis as any).process.browser = true;
  } catch {}
}
