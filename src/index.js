// Worker entry point.
// Routes /api/* to handlers. Everything else falls through to
// the static assets in ./public via the ASSETS binding.

import { handleChat } from "./chat.js";
import { handleLogChat } from "./log-chat.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

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

    return env.ASSETS.fetch(request);
  },
};

function methodNotAllowed(allow) {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allow },
  });
}
