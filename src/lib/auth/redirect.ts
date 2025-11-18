export const AUTH_REDIRECT_STORAGE_KEY = "goldsainte:authRedirect";

export const sanitizeRedirectPath = (path: string | null) => {
  if (!path) return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  return path;
};

export const getRedirectPathFromSearch = (search: string) => {
  const params = new URLSearchParams(search);
  const redirectParam = sanitizeRedirectPath(params.get("redirect"));
  if (redirectParam) return redirectParam;
  return sanitizeRedirectPath(params.get("returnTo"));
};
