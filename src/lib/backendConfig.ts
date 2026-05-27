const CURRENT_BACKEND_URL = "https://iwdevxltjuedijrcdejs.supabase.co";
const CURRENT_BACKEND_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZGV2eGx0anVlZGlqcmNkZWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQ4MDEsImV4cCI6MjA3NDc0MDgwMX0.syDQQrSgkyB1MEuE-OeMpxVt6wfoH17lDjMGGEzOiBc";

export const SUPABASE_URL = CURRENT_BACKEND_URL;
export const SUPABASE_PUBLISHABLE_KEY = CURRENT_BACKEND_PUBLISHABLE_KEY;

export function getEdgeFunctionUrl(functionName: string) {
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
}

export function getPublicStorageUrl(bucket: string, filePath: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
}