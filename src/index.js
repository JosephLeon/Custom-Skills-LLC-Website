// Worker entry point.
// Routes /api/* to handlers. Everything else falls through to
// the static assets in ./public via the ASSETS binding.

import { handleChat } from "./chat.js";
import { handleLogChat } from "./log-chat.js";

/** Canonical production host. */
const PRIMARY_HOST = "contextbridgeworks.com";

/**
 * Hosts that permanently redirect (301) to PRIMARY_HOST, preserving
 * path + query. Keep both apex and www for the old brand, plus www
 * of the new brand so everything converges on the apex.
 */
const REDIRECT_HOSTS = new Set([
  "customskillsllc.com",
  "www.customskillsllc.com",
  "www.contextbridgeworks.com",
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (REDIRECT_HOSTS.has(host)) {
      url.hostname = PRIMARY_HOST;
      url.protocol = "https:";
      url.port = "";
      return new Response(null, {
        status: 301,
        headers: {
          Location: url.toString(),
          // Cache the redirect so clients and CDNs stop hitting the old host.
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return methodNotAllowed("POST");
      }
      return handleChat(request, env);
    }

    if (url.pathname === "/api/log-chat") {
      if (request.method !== "POST") {
        return methodNotAllowed("POST");
      }
      return handleLogChat(request, env, ctx);
    }

    if (url.pathname === "/api/config") {
      // Public bootstrap config for the frontend (Turnstile sitekey).
      // No secrets here — sitekey is meant to be public.
      return new Response(
        JSON.stringify({
          turnstileSitekey: env.TURNSTILE_SITEKEY || "",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300", // 5 min
          },
        }
      );
    }

    return serveAsset(request, env);
  },
};

/**
 * Serve a static asset. HTML pages get styles.css inlined in place of
 * its <link>, so first paint is fully styled (no layout shift) without
 * a render-blocking stylesheet request.
 */
async function serveAsset(request, env) {
  const accept = request.headers.get("Accept") || "";
  if (request.method !== "GET" || !accept.includes("text/html")) {
    return env.ASSETS.fetch(request);
  }

  // Strip conditional headers: the page's ETag doesn't cover the inlined
  // CSS, so a 304 could pin a stale stylesheet.
  const headers = new Headers(request.headers);
  headers.delete("If-None-Match");
  headers.delete("If-Modified-Since");
  const response = await env.ASSETS.fetch(new Request(request, { headers }));

  const type = response.headers.get("Content-Type") || "";
  if (!type.includes("text/html")) {
    return response;
  }

  const cssResponse = await env.ASSETS.fetch(new URL("/styles.css", request.url));
  const css = cssResponse.ok ? await cssResponse.text() : "";
  if (!css || css.includes("</style")) {
    return response;
  }

  const rewritten = new HTMLRewriter()
    .on('link[rel="stylesheet"][href$="styles.css"]', {
      element(el) {
        el.replace(`<style>${css}</style>`, { html: true });
      },
    })
    .transform(response);

  const out = new Response(rewritten.body, rewritten);
  out.headers.delete("ETag");
  return out;
}

function methodNotAllowed(allow) {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allow },
  });
}
