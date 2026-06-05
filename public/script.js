// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Logo → scroll to top (the #top anchor sits on the sticky header, so we handle it manually)
document.querySelectorAll('a.logo').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.primary-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Reveal-on-scroll for cards / sections
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document
  .querySelectorAll('.service-card, .approach-steps li, .cap-item, .stat')
  .forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

// Contact form — submits to Formspree via AJAX, shows inline status
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  const status = contactForm.querySelector('.form-status');
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.textContent : '';

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!status || !submitBtn) return;

    status.className = 'form-status';
    status.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        contactForm.reset();
        status.className = 'form-status form-status-success';
        status.textContent = "Thanks, we'll be in touch within one business day.";
        submitBtn.textContent = 'Sent';
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data.errors && data.errors.map((x) => x.message).join(', ')) ||
          'Something went wrong. Please email contact@customskillsllc.com directly.';
        status.className = 'form-status form-status-error';
        status.textContent = msg;
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    } catch (err) {
      status.className = 'form-status form-status-error';
      status.textContent =
        'Network error. Please email contact@customskillsllc.com directly.';
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

// =============================================================
// Hero chat preview — typewriter that cycles sample questions
// =============================================================
(() => {
  const target = document.querySelector('[data-typewriter]');
  if (!target) return;

  // Respect users' motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  if (prefersReducedMotion) return; // keep the static initial text

  const PHRASES = [
    'How is RAG different from a custom GPT?',
    'What systems can you connect to?',
    'Is our data safe with you?',
    "What's an example of an agentic workflow?",
  ];

  const TYPE_MS = 55;
  const ERASE_MS = 25;
  const HOLD_TYPED_MS = 1800;
  const HOLD_EMPTY_MS = 350;

  let phraseIdx = 0;
  let cancelled = false;

  // Pause the typewriter when the tab is hidden so background tabs don't
  // race through phrases pointlessly.
  let paused = document.visibilityState === 'hidden';
  document.addEventListener('visibilitychange', () => {
    paused = document.visibilityState === 'hidden';
  });

  const sleep = (ms) =>
    new Promise((resolve) => {
      const tick = () => {
        if (cancelled) return resolve();
        if (paused) {
          setTimeout(tick, 200); // recheck soon
        } else {
          setTimeout(resolve, ms);
        }
      };
      tick();
    });

  async function loop() {
    // Clear the initial static text so we type from a blank slate
    target.textContent = '';
    while (!cancelled) {
      const phrase = PHRASES[phraseIdx];
      // Type characters
      for (let i = 1; i <= phrase.length; i++) {
        if (cancelled) return;
        target.textContent = phrase.slice(0, i);
        await sleep(TYPE_MS + (Math.random() * 30 - 15)); // slight jitter
      }
      await sleep(HOLD_TYPED_MS);
      // Erase characters
      for (let i = phrase.length - 1; i >= 0; i--) {
        if (cancelled) return;
        target.textContent = phrase.slice(0, i);
        await sleep(ERASE_MS);
      }
      await sleep(HOLD_EMPTY_MS);
      phraseIdx = (phraseIdx + 1) % PHRASES.length;
    }
  }

  // Stop the typewriter if the hero element ever gets removed
  window.addEventListener('pagehide', () => { cancelled = true; });

  loop();
})();

// =============================================================
// Concierge chat widget
// =============================================================
(() => {
  const root = document.getElementById('concierge');
  if (!root) return;

  const launcher = root.querySelector('.concierge-launcher');
  const closeBtn = root.querySelector('.concierge-close');
  const panel = root.querySelector('.concierge-panel');
  const form = root.querySelector('#concierge-form');
  const textarea = root.querySelector('#concierge-textarea');
  const sendBtn = root.querySelector('.concierge-send');
  const messagesEl = root.querySelector('#concierge-messages');
  const suggestionsEl = root.querySelector('.concierge-suggestions');
  const header = root.querySelector('.concierge-header');

  // Each citable section maps to a friendly title AND a page anchor to
  // smooth-scroll to when the user clicks the chip.
  const SECTIONS = {
    overview: { title: 'Overview', anchor: 'main' },
    'services-summary': { title: 'Services', anchor: 'services' },
    'knowledge-rag': { title: 'Knowledge Orchestration & RAG', anchor: 'service-knowledge-rag' },
    mcp: { title: 'Connectivity & Infrastructure (MCP)', anchor: 'service-mcp' },
    agentic: { title: 'Agentic Operations & Marketing', anchor: 'service-agentic' },
    internal: { title: 'Internal Business Solutions', anchor: 'service-internal' },
    'app-web-development': { title: 'Application & Web Development', anchor: 'service-app-web' },
    'cadence-lab': { title: 'Cadence Lab (Featured Work)', anchor: 'work' },
    engagement: { title: 'Engagement Model', anchor: 'contact' },
  };

  // Follow-up questions to suggest after a response, keyed by the
  // sections the bot just cited. The first matching section wins.
  // Each list has 3 questions; we pick a deterministic rotating subset
  // so repeated topics surface variety.
  const FOLLOW_UPS = {
    'knowledge-rag': [
      'Can it handle thousands of messy PDFs?',
      'How does the citation feature work?',
      'What does setup actually look like?',
    ],
    mcp: [
      'What systems can you connect to?',
      'Is our data safe during all this?',
      'How long does an MCP integration take?',
    ],
    agentic: [
      "What's an example of an agentic workflow?",
      'Does the agent run with no human oversight?',
      'Can it integrate with our CRM and Slack?',
    ],
    internal: [
      'Do we have to replace our existing software?',
      'Can this handle compliance reporting?',
      'How do you handle sensitive internal data?',
    ],
    'app-web-development': [
      'What stacks do you work in?',
      'Do you do mobile apps too?',
      'Can you build the UI around a RAG backend?',
    ],
    'cadence-lab': [
      'What stack is Cadence Lab built in?',
      'How does the agentic review layer work?',
      'Could you build something similar for us?',
    ],
    engagement: [
      'What does a typical engagement look like?',
      'Do you offer retainer or fractional work?',
      'How quickly can we start?',
    ],
    'services-summary': [
      'How is RAG different from a custom GPT?',
      'What does an MCP integration involve?',
      'What does an engagement look like?',
    ],
    overview: [
      'What kind of clients do you work with?',
      'How is RAG different from a custom GPT?',
      'What does an engagement look like?',
    ],
  };

  const GENERIC_FOLLOW_UPS = [
    'What does an engagement look like?',
    'Is our data safe with you?',
    'How is this priced?',
  ];

  // Track which follow-ups have already been shown to avoid repetition
  const usedFollowUps = new Set();

  // ---------- Persistence ----------
  const STORAGE_KEY = 'cs-concierge-v1';
  const STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.messages)) return null;
      if (Date.now() - (parsed.savedAt || 0) > STORAGE_TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sessionId,
          messages: history,
          savedAt: Date.now(),
        })
      );
    } catch {
      // localStorage may be unavailable in some contexts; that's fine
    }
  }
  function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const saved = loadSavedState();
  const history = saved && saved.messages ? saved.messages.slice() : [];
  const sessionId =
    (saved && saved.sessionId) ||
    (crypto && crypto.randomUUID && crypto.randomUUID()) ||
    String(Date.now()) + '-' + Math.random().toString(36).slice(2, 10);
  let loggedAtTurns = userTurnCount();

  function userTurnCount() {
    return history.filter((m) => m.role === 'user' && (m.content || '').trim()).length;
  }

  // ---------- Restore prior conversation if any ----------
  if (history.length > 0) {
    // Remove the initial greeting + suggestion chips
    messagesEl.innerHTML = '';
    let lastAssistantEl = null;
    let lastAssistantRaw = '';
    for (const m of history) {
      if (m.role === 'user') {
        appendUserMessage(m.content);
      } else if (m.role === 'assistant') {
        const el = appendAssistantPlaceholder();
        removeTypingIndicator(el);
        const bubble = el.querySelector('.concierge-bubble');
        bubble.innerHTML = renderMarkdown(stripCitations(m.content));
        renderCitations(el, m.content);
        lastAssistantEl = el;
        lastAssistantRaw = m.content;
      }
    }
    // Show follow-ups only on the most recent assistant turn
    if (lastAssistantEl) renderFollowUps(lastAssistantEl, lastAssistantRaw);
    addNewConversationButton();
  }

  // ---------- Open / close ----------
  function setOpen(open) {
    root.dataset.state = open ? 'open' : 'closed';
    launcher.setAttribute('aria-expanded', String(open));
    // Use `inert` so the panel's focusable children are properly excluded
    // from the tab order and AT when closed. Removing inert makes them
    // available again.
    if (open) {
      panel.removeAttribute('inert');
      // Lazy-init Turnstile on first open so non-chat visitors don't pay
      // the script-download cost.
      ensureTurnstile();
    } else {
      panel.setAttribute('inert', '');
    }
    if (open) setTimeout(() => textarea.focus(), 150);
    if (!open) logConversation();
  }

  // ---------- Turnstile (bot challenge) ----------
  let turnstileSitekey = null;
  let turnstileReady = false;
  let turnstileWidgetId = null;
  let turnstileInitPromise = null;

  async function fetchConfig() {
    try {
      const res = await fetch('/api/config', { cache: 'no-store' });
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  }

  function loadTurnstileScript() {
    return new Promise((resolve, reject) => {
      if (window.turnstile) return resolve();
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Turnstile'));
      document.head.appendChild(s);
    });
  }

  function ensureTurnstile() {
    if (turnstileInitPromise) return turnstileInitPromise;
    turnstileInitPromise = (async () => {
      const cfg = await fetchConfig();
      if (!cfg.turnstileSitekey) {
        // Turnstile not configured server-side; skip silently.
        // (Server-side will also skip validation, so the chat still works.)
        return;
      }
      turnstileSitekey = cfg.turnstileSitekey;
      await loadTurnstileScript();
      // Render an invisible widget anchored to a hidden container
      let container = document.getElementById('concierge-turnstile');
      if (!container) {
        container = document.createElement('div');
        container.id = 'concierge-turnstile';
        container.style.cssText = 'position:fixed;bottom:0;right:0;width:0;height:0;overflow:hidden;pointer-events:none;';
        document.body.appendChild(container);
      }
      // Wait for window.turnstile to be available (it's loaded async)
      const waitForApi = () =>
        new Promise((resolve) => {
          const tick = () => {
            if (window.turnstile && window.turnstile.render) return resolve();
            setTimeout(tick, 50);
          };
          tick();
        });
      await waitForApi();
      turnstileWidgetId = window.turnstile.render(container, {
        sitekey: turnstileSitekey,
        size: 'invisible',
        // We call execute() explicitly before each chat submit.
        // execution: 'execute' delays token generation until we ask.
        execution: 'execute',
      });
      turnstileReady = true;
    })().catch(() => {
      // Failure to init Turnstile shouldn't block the chat entirely.
      // If the server REQUIRES a token (TURNSTILE_SECRET set), the
      // request will fail and the user sees a clear error. If it
      // doesn't, things just work.
    });
    return turnstileInitPromise;
  }

  async function getTurnstileToken() {
    if (!turnstileSitekey) return null;
    if (!turnstileReady) await ensureTurnstile();
    if (!turnstileReady || !window.turnstile || turnstileWidgetId == null) return null;
    return new Promise((resolve) => {
      try {
        window.turnstile.execute(turnstileWidgetId, {
          callback: (token) => {
            // Reset for next use so we can issue a new token
            try { window.turnstile.reset(turnstileWidgetId); } catch {}
            resolve(token || null);
          },
          'error-callback': () => resolve(null),
          'timeout-callback': () => resolve(null),
        });
      } catch {
        resolve(null);
      }
    });
  }

  launcher.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));

  // Any element with [data-open-concierge] opens the widget on click.
  // If it also has [data-prefill], the textarea is populated and submitted.
  document.querySelectorAll('[data-open-concierge]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(true);
      const prefill = el.getAttribute('data-prefill');
      if (prefill) {
        // Defer so the panel can open and focus before we submit
        setTimeout(() => {
          textarea.value = prefill;
          textarea.dispatchEvent(new Event('input'));
          form.requestSubmit();
        }, 220);
      }
    });
  });

  // Esc closes the panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.dataset.state === 'open') setOpen(false);
  });

  // Auto-resize textarea
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });

  // Enter sends, Shift+Enter newlines
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  // Suggested prompts
  if (suggestionsEl) {
    suggestionsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.concierge-suggestion');
      if (!btn) return;
      textarea.value = btn.textContent.trim();
      textarea.dispatchEvent(new Event('input'));
      form.requestSubmit();
    });
  }

  // ---------- Logging ----------
  function logConversation() {
    const turns = userTurnCount();
    if (turns === 0 || turns === loggedAtTurns) return;
    loggedAtTurns = turns;
    const payload = JSON.stringify({
      sessionId,
      pageUrl: location.href,
      messages: history,
    });
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon && navigator.sendBeacon('/api/log-chat', blob)) {
        return;
      }
    } catch {
      // fall through
    }
    fetch('/api/log-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
  window.addEventListener('pagehide', logConversation);
  window.addEventListener('beforeunload', logConversation);

  // ---------- Submit ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text || sendBtn.disabled) return;

    if (suggestionsEl && suggestionsEl.parentNode) {
      suggestionsEl.remove();
    }
    addNewConversationButton();

    appendUserMessage(text);
    textarea.value = '';
    textarea.style.height = 'auto';
    sendBtn.disabled = true;

    history.push({ role: 'user', content: text });
    saveState();

    const assistantEl = appendAssistantPlaceholder();
    const bubble = assistantEl.querySelector('.concierge-bubble');

    try {
      // Get a fresh Turnstile token (no-op if Turnstile isn't configured)
      const turnstileToken = await getTurnstileToken();
      const headers = { 'Content-Type': 'application/json' };
      if (turnstileToken) headers['X-Turnstile-Token'] = turnstileToken;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: history,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let raw = '';

      removeTypingIndicator(assistantEl);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) {
              raw += parsed.delta;
              // During streaming, render markdown incrementally
              bubble.innerHTML = renderMarkdown(stripCitations(raw));
              scrollToBottom();
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (parseErr) {
            // ignore non-JSON lines
          }
        }
      }

      bubble.innerHTML = renderMarkdown(stripCitations(raw));
      renderCitations(assistantEl, raw);
      renderFollowUps(assistantEl, raw);
      history.push({ role: 'assistant', content: raw });
      saveState();
    } catch (err) {
      bubble.remove();
      const indicator = assistantEl.querySelector('.concierge-typing');
      if (indicator) indicator.remove();
      const errBox = document.createElement('div');
      errBox.className = 'concierge-error';
      errBox.textContent =
        (err && err.message) ||
        "Couldn't reach the concierge. Try again, or use the contact form below.";
      assistantEl.appendChild(errBox);
    } finally {
      sendBtn.disabled = false;
      textarea.focus();
      scrollToBottom();
    }
  });

  // ---------- DOM helpers ----------
  function appendUserMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'concierge-msg concierge-msg-user';
    const bubble = document.createElement('div');
    bubble.className = 'concierge-bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function appendAssistantPlaceholder() {
    const wrap = document.createElement('div');
    wrap.className = 'concierge-msg concierge-msg-assistant';
    const bubble = document.createElement('div');
    bubble.className = 'concierge-bubble';
    const typing = document.createElement('div');
    typing.className = 'concierge-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    bubble.appendChild(typing);
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function removeTypingIndicator(assistantEl) {
    const t = assistantEl.querySelector('.concierge-typing');
    if (t) t.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function stripCitations(text) {
    return text.replace(/\s*\[cite:[a-z0-9-]+\]/gi, '').trim();
  }

  // ---------- Citations ----------
  function renderCitations(assistantEl, raw) {
    const matches = [...raw.matchAll(/\[cite:([a-z0-9-]+)\]/gi)];
    if (matches.length === 0) return;
    const seen = new Set();
    const ids = [];
    for (const m of matches) {
      const id = m[1].toLowerCase();
      if (!seen.has(id) && SECTIONS[id]) {
        seen.add(id);
        ids.push(id);
      }
    }
    if (ids.length === 0) return;

    // Remove existing citation strip (if re-rendering)
    const existing = assistantEl.querySelector('.concierge-citations');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.className = 'concierge-citations';
    for (const id of ids) {
      const section = SECTIONS[id];
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'concierge-cite';
      chip.textContent = section.title;
      chip.setAttribute('aria-label', `Jump to ${section.title} section`);
      chip.dataset.anchor = section.anchor;
      chip.addEventListener('click', () => jumpToSection(section.anchor));
      wrap.appendChild(chip);
    }
    assistantEl.appendChild(wrap);
  }

  // ---------- Suggested follow-ups ----------
  function renderFollowUps(assistantEl, raw) {
    // Find which sections the bot cited so we can pick relevant follow-ups
    const cited = [];
    for (const m of raw.matchAll(/\[cite:([a-z0-9-]+)\]/gi)) {
      const id = m[1].toLowerCase();
      if (FOLLOW_UPS[id] && !cited.includes(id)) cited.push(id);
    }

    // Pull 2 unique follow-ups from the first cited section, plus one
    // generic to keep variety
    const pool = [];
    for (const id of cited) {
      for (const q of FOLLOW_UPS[id]) {
        if (!usedFollowUps.has(q)) pool.push(q);
      }
      if (pool.length >= 2) break;
    }
    for (const q of GENERIC_FOLLOW_UPS) {
      if (!usedFollowUps.has(q) && !pool.includes(q)) pool.push(q);
      if (pool.length >= 3) break;
    }

    const picks = pool.slice(0, 3);
    if (picks.length === 0) return;
    picks.forEach((q) => usedFollowUps.add(q));

    const wrap = document.createElement('div');
    wrap.className = 'concierge-followups';
    const label = document.createElement('span');
    label.className = 'concierge-followups-label';
    label.textContent = 'You might also ask:';
    wrap.appendChild(label);
    for (const q of picks) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'concierge-followup';
      btn.textContent = q;
      btn.addEventListener('click', () => {
        textarea.value = q;
        textarea.dispatchEvent(new Event('input'));
        form.requestSubmit();
      });
      wrap.appendChild(btn);
    }
    assistantEl.appendChild(wrap);
  }

  function jumpToSection(anchorId) {
    const target = document.getElementById(anchorId);
    if (!target) return;
    setOpen(false); // close panel so user can see the section
    // Defer scroll until after the close animation begins
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Brief highlight to confirm where they landed
      target.classList.add('cs-flash');
      setTimeout(() => target.classList.remove('cs-flash'), 1800);
    }, 100);
  }

  // ---------- "New conversation" button ----------
  function addNewConversationButton() {
    if (!header || header.querySelector('.concierge-reset')) return;
    const closeBtnEl = header.querySelector('.concierge-close');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'concierge-reset';
    btn.setAttribute('aria-label', 'Start a new conversation');
    btn.title = 'New conversation';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';
    btn.addEventListener('click', () => {
      if (!confirm('Start a new conversation? The current chat will be cleared.')) return;
      history.length = 0;
      loggedAtTurns = 0;
      clearState();
      location.reload();
    });
    header.insertBefore(btn, closeBtnEl);
  }

  // ---------- Markdown rendering ----------
  // Minimal, XSS-safe markdown subset: paragraphs, bold, italic, inline
  // code, fenced code blocks, links, bullet and numbered lists, and
  // line breaks. Escapes HTML first, then applies transformations.
  function renderMarkdown(src) {
    if (!src) return '';

    // 1. Escape HTML
    let s = src
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Extract fenced code blocks so their content isn't further processed
    const codeBlocks = [];
    s = s.replace(/```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g, (_, lang, body) => {
      const idx = codeBlocks.length;
      codeBlocks.push(
        `<pre class="md-pre"><code${lang ? ` class="language-${lang}"` : ''}>${body.replace(/\n$/, '')}</code></pre>`
      );
      return ` CODE${idx} `;
    });

    // 3. Inline code
    s = s.replace(/`([^`\n]+?)`/g, '<code class="md-code">$1</code>');

    // 4. Bold (**...**) and italic (*...*)
    s = s.replace(/\*\*([^\n*]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^\n*]+?)\*(?!\*)/g, '$1<em>$2</em>');

    // 5. Links [text](url) — only http(s) and mailto for safety
    s = s.replace(
      /\[([^\]\n]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|\/[^)\s]*|#[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // 6. Lists: convert lines starting with "-", "*", or "1." into list items
    const lines = s.split('\n');
    const out = [];
    let listType = null; // 'ul' or 'ol'
    let paragraph = [];
    function flushParagraph() {
      if (paragraph.length) {
        out.push('<p>' + paragraph.join(' ') + '</p>');
        paragraph = [];
      }
    }
    function closeList() {
      if (listType) {
        out.push(`</${listType}>`);
        listType = null;
      }
    }
    for (const line of lines) {
      const trimmed = line.trim();
      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (ulMatch) {
        flushParagraph();
        if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
        out.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        flushParagraph();
        if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
        out.push(`<li>${olMatch[2]}</li>`);
      } else if (trimmed === '') {
        flushParagraph();
        closeList();
      } else {
        closeList();
        paragraph.push(line);
      }
    }
    flushParagraph();
    closeList();

    let html = out.join('');

    // 7. Restore fenced code blocks
    html = html.replace(/ CODE(\d+) /g, (_, i) => codeBlocks[Number(i)]);

    return html;
  }
})();
