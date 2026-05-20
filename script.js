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
        status.textContent = "Thanks — we'll be in touch within one business day.";
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
