# Load tests

k6 scripts that exercise the highest-risk public surfaces of Goldsainte
before flipping production. Run against **staging** (or the preview URL),
never the live custom domain.

## Install

```bash
# macOS
brew install k6
# Linux
sudo apt-get install k6
# Docs: https://k6.io/docs/get-started/installation/
```

## Configure

All scripts read from environment variables. Defaults target the Lovable
preview URL.

| Var | Default | Notes |
| --- | --- | --- |
| `BASE_URL` | `https://goldsainteai.lovable.app` | Storyboard + general HTTP |
| `SUPABASE_URL` | `https://iwdevxltjuedijrcdejs.supabase.co` | Auth + checkout |
| `SUPABASE_ANON_KEY` | (project anon key) | Required for auth |
| `STORYBOARD_SLUG` | `sample` | Public storyboard slug to hit |
| `TRIP_ID` | `00000000-0000-0000-0000-000000000000` | Trip used by checkout |

## Run

```bash
k6 run load-tests/01-signups.js
k6 run load-tests/02-checkouts.js
k6 run load-tests/03-storyboard-views.js
```

## Pass criteria

- p95 latency < 1500 ms
- HTTP error rate < 1%
- No 5xx spikes during the steady-state window

## Cleanup

`01-signups.js` creates real auth users. After the run, delete users
matching `loadtest+*@goldsainte.test` via the admin moderation flow.
