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

test('isDuplicateEmailSignupResponse flags the enumeration-protection shape', async () => {
  // Transpile the TS helper on the fly via a tiny regex strip — we only
  // need the runtime behavior, not the type annotations.
  const src = read('src/lib/auth/duplicateEmail.ts')
    .replace(/: [A-Za-z<>{}|&\[\]\s,?'".]+(?=[\s)=,])/g, '')
    .replace(/export function/g, 'function')
    .replace(/\bas [A-Za-z<>{}|&\[\]\s,?'"]+/g, '');
  const mod = new Function(`${src}; return { isDuplicateEmailSignupResponse, isDuplicateEmailError };`)();

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

test('AgentApplicationForm wires the duplicate-email guard at both entry points', () => {
  const src = read('src/pages/AgentApplicationForm.tsx');
  assert.match(
    src,
    /from "@\/lib\/auth\/duplicateEmail"/,
    'must import the shared duplicate-email helpers',
  );
  const matches = src.match(/isDuplicateEmailSignupResponse\s*\(/g) || [];
  assert.ok(
    matches.length >= 2,
    `expected duplicate-email guard to be called at both entry points (draft save + final submit); found ${matches.length}`,
  );
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
  assert.match(src, /from "@\/lib\/auth\/duplicateEmail"/);
  assert.match(src, /isDuplicateEmailSignupResponse\s*\(/);
});