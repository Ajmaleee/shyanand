/**
 * MindFlow — Shared JavaScript
 * Handles: nav scroll, mobile menu, scroll-reveal, 3D tilt,
 *          page transitions, scroll progress, back-to-top,
 *          particle canvas, counter animations, FAQ accordion.
 */

(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────── */
  const qs  = (s, ctx = document) => ctx.querySelector(s);
  const qsa = (s, ctx = document) => [...ctx.querySelectorAll(s)];

  /* ── Detect page color (green = yoga, blue = detox, dual = home) */
  const isYoga   = document.body.classList.contains('page-yoga');
  const isDetox  = document.body.classList.contains('page-detox');
  const accentColor = isYoga  ? '#3DAA6C'
                    : isDetox ? '#2B8FD0'
                    : '#3DAA6C';

  /* ══════════════════════════════════════════════════════════
     1. NAV — scroll shadow + mobile toggle
  ══════════════════════════════════════════════════════════ */
  const nav = qs('#nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  const menuBtn    = qs('#menuBtn');
  const mobileMenu = qs('#mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });
    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        mobileMenu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     2. SCROLL PROGRESS BAR
  ══════════════════════════════════════════════════════════ */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.style.background = accentColor;
  document.body.prepend(progressBar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
  }, { passive: true });

  /* ══════════════════════════════════════════════════════════
     3. BACK-TO-TOP BUTTON
  ══════════════════════════════════════════════════════════ */
  const btt = document.createElement('button');
  btt.className   = 'back-to-top';
  btt.setAttribute('aria-label', 'Back to top');
  btt.innerHTML   = '↑';
  btt.style.background = accentColor;
  btt.style.color      = '#fff';
  document.body.appendChild(btt);

  window.addEventListener('scroll', () => {
    btt.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btt.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ══════════════════════════════════════════════════════════
     4. SCROLL REVEAL (IntersectionObserver)
  ══════════════════════════════════════════════════════════ */
  const revealEls = qsa('.reveal, .reveal-group');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
     5. 3D TILT on .tilt-card elements
  ══════════════════════════════════════════════════════════ */
  const isMobile = () => window.innerWidth < 768;

  qsa('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      if (isMobile()) return;
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `translateY(-6px) rotateY(${dx * 7}deg) rotateX(${-dy * 7}deg) scale(1.015)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ══════════════════════════════════════════════════════════
     6. ANIMATED COUNTERS (.hero__stat-val with data-count)
  ══════════════════════════════════════════════════════════ */
  function animateCounter(el) {
    const raw    = el.textContent.trim();            // e.g. "500+", "4.9★", "12"
    const suffix = raw.replace(/[\d.]/g, '');        // "+", "★", ""
    const target = parseFloat(raw);
    if (isNaN(target)) return;

    const duration = 1200;
    const start    = performance.now();
    const isFloat  = raw.includes('.');

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counterEls = qsa('.hero__stat-val');
  if (counterEls.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => cio.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
     7. PARTICLE CANVAS (hero backgrounds only)
  ══════════════════════════════════════════════════════════ */
  const heroEl = qs('.hero, .yoga-hero, .detox-hero');
  if (heroEl) {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    heroEl.style.position = 'relative';
    heroEl.insertBefore(canvas, heroEl.firstChild);

    const ctx2d = canvas.getContext('2d');
    let W, H, particles;

    const PARTICLE_COUNT = 38;
    const COLOR_A = isDetox ? 'rgba(43,143,208,' : 'rgba(61,170,108,';
    const COLOR_B = isDetox ? 'rgba(26,90,135,'  : 'rgba(30,102,64,';

    class Particle {
      constructor() { this.reset(true); }
      reset(initial = false) {
        this.x  = Math.random() * W;
        this.y  = initial ? Math.random() * H : H + 10;
        this.r  = Math.random() * 3 + 1;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -(Math.random() * 0.5 + 0.2);
        this.alpha = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? COLOR_A : COLOR_B;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < -10) this.reset();
      }
      draw() {
        ctx2d.beginPath();
        ctx2d.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx2d.fillStyle = this.color + this.alpha + ')';
        ctx2d.fill();
      }
    }

    function resize() {
      W = canvas.width  = heroEl.offsetWidth;
      H = canvas.height = heroEl.offsetHeight;
    }

    function init() {
      resize();
      particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
    }

    function loop() {
      ctx2d.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize, { passive: true });
    init();
    loop();
  }

  /* ══════════════════════════════════════════════════════════
     8. CURSOR GLOW (desktop only)
  ══════════════════════════════════════════════════════════ */
  if (!isMobile()) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    const glowColor = isDetox
      ? 'radial-gradient(circle, rgba(43,143,208,0.08), transparent 70%)'
      : 'radial-gradient(circle, rgba(61,170,108,0.08), transparent 70%)';
    glow.style.background = glowColor;
    document.body.appendChild(glow);

    let gx = -500, gy = -500;
    document.addEventListener('mousemove', e => {
      gx = e.clientX; gy = e.clientY;
      glow.style.opacity = '1';
    });
    document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });

    (function animGlow() {
      glow.style.left = gx + 'px';
      glow.style.top  = gy + 'px';
      requestAnimationFrame(animGlow);
    })();
  }

  /* ══════════════════════════════════════════════════════════
     9. PAGE TRANSITIONS (fade-slide between pages)
  ══════════════════════════════════════════════════════════ */
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);

  // On internal link click — animate out
  document.addEventListener('click', e => {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    // Only internal .html links (not #anchors, not mailto/tel)
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel')) return;
    if (anchor.hostname && anchor.hostname !== location.hostname) return;
    if (!href.endsWith('.html') && !href.endsWith('/')) return;

    e.preventDefault();
    overlay.classList.add('leaving');
    setTimeout(() => { window.location.href = href; }, 320);
  });

  // Fade in on load
  window.addEventListener('pageshow', () => {
    overlay.classList.remove('leaving');
  });

  /* ══════════════════════════════════════════════════════════
     10. FAQ ACCORDION (dopamine-detox.html)
  ══════════════════════════════════════════════════════════ */
  qsa('.faq-item__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      // Close siblings
      qsa('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          qs('.faq-item__question', other)?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  /* ══════════════════════════════════════════════════════════
     11. CONTACT FORM (index.html)
  ══════════════════════════════════════════════════════════ */
  const contactForm = qs('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
      setTimeout(() => {
        this.style.display = 'none';
        const success = qs('#formSuccess');
        if (success) success.style.display = 'block';
      }, 800);
    });
  }

  /* ══════════════════════════════════════════════════════════
     12. SMOOTH ACTIVE NAV HIGHLIGHT on scroll (single-page sections)
  ══════════════════════════════════════════════════════════ */
  const sections = qsa('section[id]');
  if (sections.length) {
    const navLinks = qsa('.nav__links a, .nav__mobile a');
    const sio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id;
          navLinks.forEach(a => {
            if (a.getAttribute('href') === '#' + id) {
              // Don't override page-level active state
            }
          });
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    sections.forEach(s => sio.observe(s));
  }

})();
