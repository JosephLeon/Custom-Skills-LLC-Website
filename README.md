# Custom Skills LLC — Website

Marketing site and live RAG concierge for [customskillsllc.com](https://customskillsllc.com).

Deployed as a Cloudflare Worker with static-asset hosting. The site dog-foods
the studio's core product: a chat widget grounded in the company's
capabilities statement, with citations that smooth-scroll back to the
relevant section of the page.

## Stack

| Layer | Tech |
|---|---|
| Hosting | Cloudflare Workers + Static Assets |
| Site | Static HTML/CSS/JS in `public/` |
| Backend | Cloudflare Worker in `src/` |
| Chat model | Anthropic Claude Haiku 4.5 |
| Contact form | Formspree (free tier) |
| Fonts | Self-hosted (Inter, JetBrains Mono) |
| Analytics | Cloudflare Web Analytics (privacy-first) |
| CI/CD | Cloudflare GitHub integration (auto-deploy on push to `master`) |

No build step. No npm dependencies in the runtime code. Pure ES modules.

## Project structure

```
.
├── public/                       # Static site (served by Cloudflare assets)
│   ├── index.html                # Main page
│   ├── 404.html                  # Branded 404
│   ├── privacy.html              # Privacy policy
│   ├── terms.html                # Terms of service
│   ├── styles.css                # All styles
│   ├── script.js                 # Concierge widget + contact form + misc
│   ├── fonts.css                 # @font-face for self-hosted fonts
│   ├── fonts/                    # 14 woff2 files (Inter + JetBrains Mono)
│   ├── favicon.svg               # Gradient CS mark
│   ├── og-image.jpg              # 1200×630 social-share image
│   ├── og-image.svg              # Source for the OG image
│   ├── robots.txt                # Crawler instructions
│   └── sitemap.xml               # XML sitemap
├── src/                          # Cloudflare Worker (server-side)
│   ├── index.js                  # Worker entry. Routes /api/* and falls through to ASSETS
│   ├── chat.js                   # Streams Claude responses for /api/chat
│   ├── log-chat.js               # Records conversation transcripts to Formspree
│   ├── capabilities.js           # Citable knowledge base used in the system prompt
│   └── abuse-guard.js            # Origin check, rate limit, Turnstile validation
├── wrangler.jsonc                # Cloudflare Worker config
├── .dev.vars.example             # Template for local-dev secrets
├── CHATBOT.md                    # Detailed concierge setup & abuse-protection guide
└── README.md
```

## Local development

```sh
# one-time setup
brew install cloudflare-wrangler
cp .dev.vars.example .dev.vars
# edit .dev.vars and paste your real ANTHROPIC_API_KEY

# run the local dev server
wrangler dev
# open http://localhost:8787
```

Wrangler boots a local Cloudflare Worker runtime that serves the static
files from `public/` and runs `/api/chat`, `/api/log-chat`, and
`/api/config` exactly as they will in production. Changes to files in
`public/` and `src/` are hot-reloaded.

## Production deployment

Cloudflare's GitHub integration handles deploys automatically:

```sh
git push origin master
```

Within ~30 seconds the new version is live at
`https://customskillsllc.joseph-354.workers.dev` and (once the custom
domain is connected) at `https://customskillsllc.com`.

## Configuration

All secrets live in the Cloudflare dashboard, not in the repo. Add via
**Workers & Pages → customskillsllc → Settings → Variables and Secrets**.

| Variable | Type | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | Secret | Required for the concierge to work |
| `TURNSTILE_SITEKEY` | Variable | Public Turnstile sitekey (loaded by the browser) |
| `TURNSTILE_SECRET` | Secret | Server-side Turnstile validation secret |
| `RATE_LIMIT_WHITELIST` | Variable | Comma-separated IPs that bypass per-IP rate limiting |
| `ALLOWED_HOSTS` | Variable | Extra hostnames (beyond the defaults) allowed to call /api/chat |

KV namespace binding (also in `wrangler.jsonc`):

| Binding | What it does |
|---|---|
| `RATE_LIMIT` | KV namespace used to track per-IP request counts |

If a variable or binding is missing, the corresponding defense gracefully
degrades — the site still works, just with one less layer of protection.

## Key features

- **RAG concierge** in `public/script.js` / `src/chat.js`. Streams Claude
  responses, parses `[cite:section-id]` markers into clickable chips, and
  smooth-scrolls to the cited section on the page.
- **Conversation persistence** via `localStorage` with a 24-hour TTL.
- **Suggested follow-up questions** after each assistant response,
  selected from a topic-keyed map.
- **Abuse protection** in `src/abuse-guard.js`: origin allowlist,
  per-IP rate limit, Cloudflare Turnstile validation. Each layer is
  optional and degrades gracefully.
- **Conversation logging** to your Formspree inbox so you can see what
  prospects actually ask. Uses `navigator.sendBeacon` on tab close.
- **A11y**: skip-to-content link, `:focus-visible` rings, `inert` on
  the chat panel when closed, semantic heading hierarchy, WCAG AA color
  contrast.
- **SEO**: Open Graph + Twitter cards, JSON-LD (Organization,
  ProfessionalService, FAQPage, WebSite), canonical URLs, sitemap,
  robots.

## Related docs

- [`CHATBOT.md`](CHATBOT.md) — concierge architecture, abuse protection
  setup, cost notes, knowledge-base editing.

## License

Proprietary. © Custom Skills LLC.
