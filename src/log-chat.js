// Concierge conversation logger.
// Receives a transcript from the widget when the user closes the chat
// (or when the tab is closing) and forwards it as an email via Formspree.
//
// Only logs conversations that look real (≥1 user message, reasonable length).
// Fire-and-forget on the server — the response returns quickly so the browser
// doesn't block its own unload.

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xjgzgazb";
const MAX_TRANSCRIPT_CHARS = 12000;
const MAX_MSG_CHARS = 4000;

export async function handleLogChat(request, env, ctx) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonOk({ logged: false, reason: "invalid_body" });
  }

  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const sessionId = String(payload?.sessionId || "").slice(0, 64) || crypto.randomUUID();
  const pageUrl = String(payload?.pageUrl || "").slice(0, 500);
  const userAgent = String(request.headers.get("User-Agent") || "").slice(0, 300);
  const country = request.headers.get("CF-IPCountry") || "";

  const userTurns = messages.filter((m) => m && m.role === "user" && (m.content || "").trim());
  if (userTurns.length === 0) {
    return jsonOk({ logged: false, reason: "no_user_turns" });
  }

  // Format the transcript
  const transcript = messages
    .slice(-40)
    .map((m) => {
      const role = m.role === "assistant" ? "BOT" : "USER";
      const content = String(m.content || "").slice(0, MAX_MSG_CHARS);
      return `[${role}]\n${content}`;
    })
    .join("\n\n")
    .slice(0, MAX_TRANSCRIPT_CHARS);

  const subject = `Concierge chat — ${userTurns.length} turn${userTurns.length === 1 ? "" : "s"}`;
  const summary = userTurns[0].content.slice(0, 120);

  const body = new URLSearchParams({
    _subject: subject,
    name: "Concierge session",
    email: "concierge@customskillsllc.com",
    company: country ? `(visitor from ${country})` : "(anonymous visitor)",
    message:
      `First question: ${summary}\n\n` +
      `Session: ${sessionId}\n` +
      `Page: ${pageUrl || "(unknown)"}\n` +
      `User agent: ${userAgent}\n\n` +
      `--- TRANSCRIPT ---\n${transcript}`,
  });

  // Forward to Formspree. Don't await — this is fire-and-forget so the
  // browser's beforeunload path completes immediately.
  const forward = fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  }).catch(() => {});

  // Allow the Worker to keep the request alive until forward completes,
  // even after we've returned the response to the browser.
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(forward);
  }

  return jsonOk({ logged: true, sessionId });
}

function jsonOk(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
