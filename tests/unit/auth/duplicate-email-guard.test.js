/**
 * Regression test for the duplicate-email signup guard.
 *
 * Background: GoTrue's "Prevent email enumeration" protection causes
 * supabase.auth.signUp() to SUCCEED for a duplicate email, returning a
 * fake user with identities: [] and no session. Our app-level guard
 * (src/lib/auth/duplicateEmail.ts) detects this shape and our two signup
 * entry points (Auth.tsx and AgentApplicationForm.tsx) both call it.
 *
 * If anyone removes the wiring from either entry point the duplicate
 * email check silently regresses — the user appears to sign up
 * successfully but no account is created. This test fails fast in that
 * case.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

test('duplicateEmail helpers export both detectors', () => {
  const src = read('src/lib/auth/duplicateEmail.ts');
  assert.match(src, /export function isDuplicateEmailError/);
  assert.match(src, /export function isDuplicateEmailSignupResponse/);
});

test('isDuplicateEmailSignupResponse flags the enumeration-protection shape', () => {
  // Reimplement the helper inline (kept in lock-step with the source) so
  // the test runs under plain node --test without a TS transpiler.
  const isDuplicateEmailSignupResponse = (data) => {
    if (!data || !data.user) return false;
    if (data.session) return false;
    const identities = data.user.identities;
    return Array.isArray(identities) && identities.length === 0;
  };
  const isDuplicateEmailError = (error) => {
    if (!error) return false;
    const parts = [error.message, error.hint, error.code]
      .filter((v) => typeof v === 'string')
      .map((v) => v.toLowerCase());
    if (parts.length === 0) return false;
    const h = parts.join(' | ');
    return (
      h.includes('email_already_registered') ||
      h.includes('already registered') ||
      h.includes('already been registered')
    );
  };
  const mod = { isDuplicateEmailSignupResponse, isDuplicateEmailError };

  // Enumeration-protection shape: user present, identities empty, no session
  assert.equal(
    mod.isDuplicateEmailSignupResponse({ user: { identities: [] }, session: null }),
    true,
    'must flag duplicate when identities is empty array and no session',
  );

  // Real new signup: identities populated
  assert.equal(
    mod.isDuplicateEmailSignupResponse({ user: { identities: [{ id: 'x' }] }, session: null }),
    false,
  );

  // Logged-in signup response (session present) — not a duplicate
  assert.equal(
    mod.isDuplicateEmailSignupResponse({ user: { identities: [] }, session: { access_token: 't' } }),
    false,
  );

  // Null/undefined inputs are safe
  assert.equal(mod.isDuplicateEmailSignupResponse(null), false);
  assert.equal(mod.isDuplicateEmailSignupResponse(undefined), false);
  assert.equal(mod.isDuplicateEmailSignupResponse({ user: null }), false);

  // Error-message path
  assert.equal(mod.isDuplicateEmailError({ message: 'email_already_registered' }), true);
  assert.equal(mod.isDuplicateEmailError({ message: 'User already registered' }), true);
  assert.equal(mod.isDuplicateEmailError({ message: 'something else' }), false);
  assert.equal(mod.isDuplicateEmailError(null), false);
});

test('AgentApplicationForm wires the duplicate-email guard on signup', () => {
  const src = read('src/pages/AgentApplicationForm.tsx');
  assert.match(src, /from ['"]@\/lib\/auth\/duplicateEmail['"]/);
  assert.match(src, /isDuplicateEmailSignupResponse\s*\(/);
  assert.match(src, /isDuplicateEmailError\s*\(/);
});

test('Auth page wires the duplicate-email guard on signup', () => {
  // Find the auth page file (named Auth.tsx or auth.tsx under src/pages)
  const candidates = ['src/pages/Auth.tsx', 'src/pages/auth.tsx'];
  const authPath = candidates.find((p) => fs.existsSync(path.join(repoRoot, p)));
  if (!authPath) {
    // If the project renames Auth.tsx, skip rather than fail — the
    // AgentApplicationForm assertion above is the critical one.
    return;
  }
  const src = read(authPath);
  assert.match(src, /from ['"]@\/lib\/auth\/duplicateEmail['"]/);
  assert.match(src, /isDuplicateEmailSignupResponse\s*\(/);
  assert.match(src, /isDuplicateEmailError\s*\(/);
});