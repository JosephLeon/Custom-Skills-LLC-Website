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
    engagement: { title: 'Engagement Model', anchor: 'contact' },
  };

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
    for (const m of history) {
      if (m.role === 'user') {
        appendUserMessage(m.content);
      } else if (m.role === 'assistant') {
        const el = appendAssistantPlaceholder();
        removeTypingIndicator(el);
        const bubble = el.querySelector('.concierge-bubble');
        bubble.innerHTML = renderMarkdown(stripCitations(m.content));
        renderCitations(el, m.content);
      }
    }
    addNewConversationButton();
  }

  // ---------- Open / close ----------
  function setOpen(open) {
    root.dataset.state = open ? 'open' : 'closed';
    launcher.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    if (open) setTimeout(() => textarea.focus(), 150);
    if (!open) logConversation();
  }

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
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
