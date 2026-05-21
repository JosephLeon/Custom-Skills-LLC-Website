# Concierge Chatbot — Deployment & Local Testing

The site includes a floating chat widget powered by Anthropic Claude.
It is grounded in `src/capabilities.js` and runs as a Cloudflare Worker
at the `/api/chat` route.

## Architecture

The project is a Cloudflare Worker with static-asset serving:

| Path | What it does |
|---|---|
| `wrangler.jsonc` | Worker config: main entry, assets directory, compat flags |
| `src/index.js` | Worker entry. Routes `/api/chat` to the chat handler; falls through to ASSETS for static files |
| `src/chat.js` | Calls Claude (streaming) with the capabilities doc cached in the system prompt |
| `src/capabilities.js` | Structured knowledge base. Edit this to change what the bot knows |
| `public/` | Static site (HTML, CSS, JS, images). Served at the root URL |

## One-time production setup (Cloudflare dashboard)

1. Get an Anthropic API key at https://console.anthropic.com → API Keys.
2. In your Worker project: **Settings → Variables and Secrets**.
3. Add (Production environment):
   - **Type:** `Secret` (encrypted at rest)
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your `sk-ant-…` key
4. Trigger a redeploy (push any commit, or **Deployments → Retry deployment**).

The Worker is live as soon as the redeploy completes.

## Local development

The widget needs the `/api/chat` route to work locally, which requires
the Workers dev server (NOT `python -m http.server`).

```sh
# one-time
brew install cloudflare-wrangler
cp .dev.vars.example .dev.vars
# edit .dev.vars and paste your real ANTHROPIC_API_KEY

# every time you want to test locally:
wrangler dev
```

Wrangler will print a URL (usually http://localhost:8787). The chat
widget will hit the local Worker, which reads the key from `.dev.vars`.

## Editing what the bot knows

Open `src/capabilities.js`. Each entry is a citable section:

```js
{
  id: "your-section-id",   // used in citations, lowercase + hyphens
  title: "Friendly Title", // shown as the citation chip in the UI
  body: `Plain-text content the bot should ground answers in.`
}
```

After editing, also update the `SECTION_TITLES` map in
`public/script.js` (inside the concierge widget block) so the new
section ID has a display title. The bot will not invent answers
outside this source.

## Cost & rate-limiting notes

- Model: `claude-haiku-4-5-20251001`. Roughly $0.001 per chat turn.
- Prompt caching is enabled on the system prompt, so the capabilities
  source costs about $0.0005 the first time and about $0.00005 on
  cache hits for the next 5 minutes.
- Conversation length is capped at the last 20 turns; messages over
  1000 chars are truncated server-side.
- The Workers free tier covers 100k requests/day.

## Abuse protection

The `/api/chat` endpoint runs three layers of defenses BEFORE calling
Claude, each gracefully degrading if not configured:

1. **Origin / Referer allowlist.** Always on. Only requests from
   `customskillsllc.com`, `www.customskillsllc.com`,
   `customskillsllc.joseph-354.workers.dev`, `localhost`, and
   `127.0.0.1` are accepted. Extra hosts can be added via the
   `ALLOWED_HOSTS` env var (comma-separated hostnames).
2. **Per-IP rate limit.** Requires a KV namespace binding named
   `RATE_LIMIT`. Allows 30 chats per hour per IP. Whitelisted IPs
   bypass the limit via the `RATE_LIMIT_WHITELIST` env var
   (comma-separated). Loopback IPs (`127.0.0.1`, `::1`) are always
   whitelisted for local dev.
3. **Cloudflare Turnstile.** Requires `TURNSTILE_SITEKEY` (public
   variable) and `TURNSTILE_SECRET` (encrypted secret). Tokens are
   validated server-side before any Claude API call.

### Anthropic spend cap (do this first — most important)

Set a hard monthly cap on your Anthropic account so an attack cannot
produce a runaway bill:

1. https://console.anthropic.com → **Plans & Billing**
2. Set a **monthly spend limit** (e.g., $25 or $50)
3. Enable email alerts at 50% and 80%

Once exceeded, Anthropic returns errors and stops billing. This is
your safety net even if every other defense fails.

### Setting up Turnstile (free, ~10 min)

1. https://dash.cloudflare.com → **Turnstile** → **Add Site**
2. Domain: `customskillsllc.com` (or your workers.dev URL for testing)
3. Widget type: **Invisible**
4. Copy the **Site Key** and **Secret Key**
5. In your Worker project → **Settings → Variables and Secrets**:
   - Add `TURNSTILE_SITEKEY` (type: Variable / plaintext, the site key)
   - Add `TURNSTILE_SECRET` (type: Secret / encrypted, the secret key)
6. Redeploy.

The widget loads lazily when a visitor opens the chat (so it costs
non-chat visitors nothing). Tokens are fresh on every chat request.

### Setting up per-IP rate-limiting (free, ~5 min)

1. https://dash.cloudflare.com → **Workers & Pages → KV → Create
   a namespace**. Name it something like `customskillsllc-rate-limit`.
2. Copy the namespace ID it generates.
3. Edit `wrangler.jsonc` and add the binding (template in the file's
   comments):
   ```jsonc
   "kv_namespaces": [
     { "binding": "RATE_LIMIT", "id": "<your-kv-namespace-id>" }
   ]
   ```
4. Push and redeploy.

### Whitelisting your own IP

Add an env var to bypass rate-limiting for yourself during testing:

1. Find your public IP at https://ifconfig.me
2. Worker → **Settings → Variables and Secrets**:
   - Add `RATE_LIMIT_WHITELIST` (type: Variable, value: your IP)
   - Multiple IPs allowed, comma-separated
3. Redeploy.

### Verifying defenses are active

After deploying with all the above set, you can sanity-check from a
terminal that isn't your whitelisted IP:

```sh
# Should return 403 (no allowed Origin header)
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://customskillsllc.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}]}'

# Should also return 403 (Origin spoofed but no Turnstile token)
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://customskillsllc.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://customskillsllc.com" \
  -d '{"messages":[{"role":"user","content":"hi"}]}'
```
