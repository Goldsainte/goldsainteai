// Backend project credentials — PINNED to the live project.

// Pinned to the correct live project so every file that imports

// from here uses the same backend as src/integrations/supabase/client.ts.

const CURRENT_BACKEND_URL = "https://ktzsgqrqvwtxlimctkaf.supabase.co";

const CURRENT_BACKEND_PUBLISHABLE_KEY =

"sb_publishable_i5xwYqNzT3JOevhcl7-J3w_J2oofXm5";

export const SUPABASE_URL = CURRENT_BACKEND_URL;

export const SUPABASE_PUBLISHABLE_KEY = CURRENT_BACKEND_PUBLISHABLE_KEY;

export function getEdgeFunctionUrl(functionName: string) {
return `${SUPABASE_URL}/functions/v1/${functionName}`;
}

export function getPublicStorageUrl(bucket: string, filePath: string) {
return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
}
