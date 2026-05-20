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
  4000 chars are truncated server-side.
- The Workers free tier covers 100k requests/day.
