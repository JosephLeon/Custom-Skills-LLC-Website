# Concierge Chatbot — Deployment & Local Testing

The site includes a floating chat widget powered by Anthropic Claude. It's
grounded in `functions/_lib/capabilities.js` and runs on a Cloudflare Pages
Function at `/api/chat`.

## What's in the box

| File | Purpose |
|---|---|
| `functions/_lib/capabilities.js` | Structured knowledge base, edit to update what the bot knows |
| `functions/api/chat.js` | Pages Function: calls Claude, streams response, parses citations |
| Widget markup in `index.html` | Floating launcher + panel + messages |
| Widget styles in `styles.css` | Dark-theme chat UI, mobile responsive |
| Widget logic in `script.js` | Open/close, streaming reader, citation chips |

## One-time setup (Cloudflare Pages dashboard)

1. Get an Anthropic API key at https://console.anthropic.com → API Keys.
2. In your Pages project: **Settings → Environment variables → Production**.
3. Add a variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key (starts with `sk-ant-…`)
   - **Type:** Encrypted (recommended)
4. Trigger a redeploy (push any commit, or click "Retry deployment").

The function will start working as soon as the variable is in place.

## Local testing

The widget needs the `/api/chat` endpoint to work, which means you need
Cloudflare's local dev server (not plain `python -m http.server`).

```sh
# one-time
brew install cloudflare-wrangler

# every time you want to test the chatbot locally:
export ANTHROPIC_API_KEY=sk-ant-…
wrangler pages dev .
```

Open the URL Wrangler prints (usually http://localhost:8788). The chat
widget will hit the local function.

## Editing what the bot knows

Open `functions/_lib/capabilities.js`. Each entry is a citable section:

```js
{
  id: "your-section-id",   // used in citations, lowercase + hyphens
  title: "Friendly Title", // shown as the citation chip in the UI
  body: `Plain-text content the bot should ground answers in.`
}
```

After editing, also update the `SECTION_TITLES` map at the top of the
`Concierge chat widget` block in `script.js` so the new section ID has
a display title. The bot will not invent answers outside this source.

## Cost & rate-limiting notes

- Model: `claude-haiku-4-5-20251001` — roughly $0.001 per chat turn.
- Prompt caching is enabled on the system prompt, so the (large)
  capabilities source costs ~$0.0005 the first time and ~$0.00005 on
  cache hits for the next 5 minutes.
- Conversation length is capped at the last 20 turns; messages over 4000
  chars are truncated server-side.
- The Pages free tier covers 100k function invocations/day.
