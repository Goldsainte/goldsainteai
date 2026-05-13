// Reserved usernames – mirrored server-side via the
// `profiles_reserved_username_check` trigger. Keep this list aligned
// with the `reserved_usernames` table.
export const RESERVED_USERNAMES = new Set<string>([
  "admin","administrator","support","help","info","contact","official",
  "goldsainte","billing","team","hello","sales","security","abuse","root",
  "system","api","www","mail","ftp","app","m","mobile","ios","android",
  "beta","alpha","dev","test","staging","production","news","blog",
  "careers","jobs","status","moderator","mod","staff","owner","founder",
  "ceo","press","legal","privacy","terms","noreply","no-reply","postmaster",
]);

export function isReservedUsername(value: string | null | undefined): boolean {
  if (!value) return false;
  return RESERVED_USERNAMES.has(value.trim().toLowerCase().replace(/^@/, ""));
}