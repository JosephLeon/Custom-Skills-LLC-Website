// Abuse-prevention layer for the /api/chat endpoint.
//
// Defenses, in order of cheap → expensive:
//   1. Origin / Referer allowlist
//   2. Per-IP rate limit (Cloudflare KV)
//   3. Cloudflare Turnstile token validation
//
// Each defense gracefully degrades if not configured: missing
// TURNSTILE_SECRET skips Turnstile; missing RATE_LIMIT KV binding
// skips rate-limiting. Origin check always runs.

const ALWAYS_ALLOWED_HOSTS = new Set([
  "contextbridgeworks.com",
  "www.contextbridgeworks.com",
  // Legacy brand — still allowed during redirect transition / bookmarks
  "customskillsllc.com",
  "www.customskillsllc.com",
  "customskillsllc.joseph-354.workers.dev",
  "localhost",
  "127.0.0.1",
]);

// Rate-limit configuration
const RATE_LIMIT_PER_HOUR = 30; // chats per IP per hour for non-whitelisted IPs

// ---------- Public API ----------

export async function guardChatRequest(request, env) {
  // 1. Origin check (cheap, no async work)
  const originResult = checkOrigin(request, env);
  if (!originResult.ok) return blocked(403, originResult.reason);

  // 2. Rate limit (KV lookup, fast)
  if (env.RATE_LIMIT) {
    const rlResult = await checkRateLimit(request, env);
    if (!rlResult.ok) return blocked(429, rlResult.reason);
  }

  // 3. Turnstile (one network round-trip to Cloudflare, ~50-150ms)
  if (env.TURNSTILE_SECRET) {
    const tsResult = await checkTurnstile(request, env);
    if (!tsResult.ok) return blocked(403, tsResult.reason);
  }

  return { ok: true };
}

// ---------- Defense 1: Origin check ----------

function checkOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const referer = request.headers.get("Referer") || "";
  // Build set: defaults + comma-separated env extras
  const allowed = new Set(ALWAYS_ALLOWED_HOSTS);
  if (env.ALLOWED_HOSTS) {
    for (const h of String(env.ALLOWED_HOSTS).split(",")) {
      const trimmed = h.trim().toLowerCase();
      if (trimmed) allowed.add(trimmed);
    }
  }
  const isAllowedHost = (urlStr) => {
    if (!urlStr) return false;
    try {
      const u = new URL(urlStr);
      return allowed.has(u.hostname.toLowerCase());
    } catch {
      return false;
    }
  };
  if (isAllowedHost(origin)) return { ok: true };
  if (isAllowedHost(referer)) return { ok: true };
  return {
    ok: false,
    reason: "Requests must originate from an allowed host.",
  };
}

// ---------- Defense 2: Rate limit ----------

async function checkRateLimit(request, env) {
  const ip = clientIp(request);
  if (!ip) return { ok: true }; // no IP to track; let it through (rare)

  // Whitelist check
  const whitelist = new Set();
  if (env.RATE_LIMIT_WHITELIST) {
    for (const x of String(env.RATE_LIMIT_WHITELIST).split(",")) {
      const trimmed = x.trim();
      if (trimmed) whitelist.add(trimmed);
    }
  }
  // Loopback IPs are always whitelisted (local dev)
  whitelist.add("127.0.0.1");
  whitelist.add("::1");
  if (whitelist.has(ip)) return { ok: true };

  const hourBucket = Math.floor(Date.now() / (60 * 60 * 1000));
  const key = `rl:${ip}:${hourBucket}`;

  let count = 0;
  try {
    const stored = await env.RATE_LIMIT.get(key);
    count = stored ? parseInt(stored, 10) : 0;
  } catch {
    return { ok: true }; // KV unavailable; fail open rather than break the site
  }

  if (count >= RATE_LIMIT_PER_HOUR) {
    return {
      ok: false,
      reason: `Rate limit exceeded (${RATE_LIMIT_PER_HOUR} messages/hour per IP). Try again later or use the contact form.`,
    };
  }

  // Increment (best effort; KV is eventually consistent)
  await env.RATE_LIMIT.put(key, String(count + 1), {
    expirationTtl: 60 * 60 + 60, // 1h + buffer
  }).catch(() => {});

  return { ok: true };
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    null
  );
}

// ---------- Defense 3: Turnstile ----------

async function checkTurnstile(request, env) {
  const token =
    request.headers.get("X-Turnstile-Token") ||
    (await peekBody(request, "turnstileToken"));
  if (!token) {
    return { ok: false, reason: "Missing verification token." };
  }

  try {
    const verify = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token,
          remoteip: clientIp(request) || "",
        }).toString(),
      }
    );
    const data = await verify.json().catch(() => ({}));
    if (data.success) return { ok: true };
    return {
      ok: false,
      reason: `Verification failed${data["error-codes"] ? `: ${data["error-codes"].join(", ")}` : ""}.`,
    };
  } catch {
    return { ok: false, reason: "Verification service unavailable." };
  }
}

// peekBody clones the request and reads a JSON field without consuming the
// original body (so the chat handler can still read it). Pass-through if
// the body isn't JSON.
async function peekBody(request, field) {
  try {
    const clone = request.clone();
    const data = await clone.json();
    return data && typeof data[field] === "string" ? data[field] : null;
  } catch {
    return null;
  }
}

// ---------- Helper ----------

function blocked(status, reason) {
  return {
    ok: false,
    response: new Response(JSON.stringify({ error: reason }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  };
}
