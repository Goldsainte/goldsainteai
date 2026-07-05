# Why the live site is stale

## What I checked

- `https://goldsainte.ai/` responds `200` with `cache-control: no-cache, must-revalidate, max-age=0` and `x-deployment-id: a23381f1-13ef-4e4d-a949-e6ce97ac772a` — Cloudflare/hosting is serving a **specific old deployment**, not caching a fresh one.
- `https://goldsainte.ai/build-version.txt` returns `2026-05-26T23:49:32Z`, matching the value committed in the repo at `public/build-version.txt`. That's the deploy currently live.
- The live `index.html` references bundle `assets/index-C63S7mvy.js` — an older hashed build.
- The service worker (`public/sw.js`) is network-first with cache fallback and evicts old cache names on activate, so it is **not** the cause of staleness for online users.

## Root cause

Lovable auto-deploys **backend** changes (edge functions, DB migrations via the GitHub Actions workflow), but **frontend** changes (React UI, client code) require an explicit **Publish → Update** click in the editor. The last six turns' frontend edits are compiled into the sandbox preview but were never promoted to the `goldsainte.ai` production deployment, so the hosting layer is still serving the May 26 build.

I can't push a frontend deploy from here — only you can approve it. There is nothing to fix in code.

## What to do

1. In the Lovable editor, click **Publish** (top-right) → **Update** in the dialog. That triggers the frontend build + deploy to `goldsainte.ai`.
2. Wait ~1–2 minutes. Then hard-refresh the site (Ctrl/Cmd+Shift+R) or check `https://goldsainte.ai/build-version.txt` — it should show today's timestamp.
3. If it still looks stale after that, it will be a service-worker cache on your device — DevTools → Application → Service Workers → Unregister, then reload.

## Technical notes

- Backend deploys (edge functions + migrations) go out automatically via `.github/workflows/deploy-supabase.yml` on push to `main`, so the security-finding migration from the previous turn should already be live in the database independent of this frontend publish.
- Before you publish, worth running a security scan (there was a recent migration touching column grants); I can run it on your say-so.
- No code changes required for this issue. The only next action is your click on Publish.

<presentation-actions>
<presentation-open-publish>Publish your app</presentation-open-publish>
</presentation-actions>
