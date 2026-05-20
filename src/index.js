// Worker entry point.
// Routes /api/chat to the chat handler. Everything else falls through to
// the static assets in ./public via the ASSETS binding.

import { handleChat } from "./chat.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: "POST" },
        });
      }
      return handleChat(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
