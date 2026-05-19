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

// Contact form (frontend-only stub; wire to a real endpoint later)
function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  const subject = encodeURIComponent(`New inquiry from ${data.name || 'website'}`);
  const body = encodeURIComponent(
    `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || '-'}\n\n${data.message}`
  );
  window.location.href = `mailto:joseph@customskillsllc.com?subject=${subject}&body=${body}`;
  return false;
}
window.handleContactSubmit = handleContactSubmit;
