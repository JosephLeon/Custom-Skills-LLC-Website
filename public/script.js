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

  const SECTION_TITLES = {
    overview: 'Overview',
    'services-summary': 'Services Summary',
    'knowledge-rag': 'Knowledge Orchestration & RAG',
    mcp: 'Connectivity & Infrastructure (MCP)',
    agentic: 'Agentic Operations & Marketing',
    internal: 'Internal Business Solutions',
    'app-web-development': 'Application & Web Development',
    engagement: 'Engagement Model',
  };

  // Conversation history sent to the API. We do NOT include the greeting.
  const history = [];

  // Session ID for log correlation
  const sessionId =
    (crypto && crypto.randomUUID && crypto.randomUUID()) ||
    String(Date.now()) + '-' + Math.random().toString(36).slice(2, 10);
  let loggedAtTurns = 0; // how many user turns were in the last log we sent

  function setOpen(open) {
    root.dataset.state = open ? 'open' : 'closed';
    launcher.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    if (open) setTimeout(() => textarea.focus(), 150);
    if (!open) logConversation();
  }

  function userTurnCount() {
    return history.filter((m) => m.role === 'user' && (m.content || '').trim()).length;
  }

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

  // Fire a final log on tab close / navigate-away
  window.addEventListener('pagehide', logConversation);
  window.addEventListener('beforeunload', logConversation);

  launcher.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));

  // Any element with [data-open-concierge] opens the widget on click
  document.querySelectorAll('[data-open-concierge]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(true);
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text || sendBtn.disabled) return;

    // Hide suggestions after first user turn
    if (suggestionsEl && suggestionsEl.parentNode) {
      suggestionsEl.remove();
    }

    appendUserMessage(text);
    textarea.value = '';
    textarea.style.height = 'auto';
    sendBtn.disabled = true;

    history.push({ role: 'user', content: text });

    const assistantEl = appendAssistantPlaceholder();
    const bubble = assistantEl.querySelector('.concierge-bubble');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      // Stream tokens
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
              bubble.textContent = stripCitations(raw);
              scrollToBottom();
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (parseErr) {
            // ignore non-JSON lines
          }
        }
      }

      // Final render: strip citation markers from bubble, render chips below
      bubble.textContent = stripCitations(raw);
      renderCitations(assistantEl, raw);
      history.push({ role: 'assistant', content: raw });
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

  function stripCitations(text) {
    return text.replace(/\s*\[cite:[a-z0-9-]+\]/gi, '').trim();
  }

  function renderCitations(assistantEl, raw) {
    const matches = [...raw.matchAll(/\[cite:([a-z0-9-]+)\]/gi)];
    if (matches.length === 0) return;
    const seen = new Set();
    const ids = [];
    for (const m of matches) {
      const id = m[1].toLowerCase();
      if (!seen.has(id) && SECTION_TITLES[id]) {
        seen.add(id);
        ids.push(id);
      }
    }
    if (ids.length === 0) return;
    const wrap = document.createElement('div');
    wrap.className = 'concierge-citations';
    for (const id of ids) {
      const chip = document.createElement('span');
      chip.className = 'concierge-cite';
      chip.textContent = SECTION_TITLES[id];
      wrap.appendChild(chip);
    }
    assistantEl.appendChild(wrap);
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
})();
