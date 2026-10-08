/* ATGD — global micro-interactions (no dependencies) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Split text into per-character spans, keeping words unbroken */
  document.querySelectorAll('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'w';
            [...part].forEach(c => {
              const s = document.createElement('span');
              s.className = 'ch';
              s.style.setProperty('--i', i++);
              s.textContent = c;
              w.append(s);
            });
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    walk(el);
    el.classList.add('split');
  });

  /* Appear on scroll: .reveal, .split, .head-line */
  const targets = document.querySelectorAll('.reveal, .split, .head-line');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    targets.forEach(el => io.observe(el));
  }

  /* Rolling labels: <span class="roll" data-roll>TEXT</span> → two stacked copies */
  document.querySelectorAll('[data-roll]').forEach(el => {
    const text = el.textContent.trim();
    el.innerHTML = `<span>${text}</span><span aria-hidden="true">${text}</span>`;
  });

  /* Duplicate marquee tracks so the loop is seamless */
  document.querySelectorAll('.marquee').forEach(m => {
    const track = m.querySelector('.marquee__track');
    if (!track || m.dataset.cloned) return;
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    m.append(clone);
    m.dataset.cloned = '1';
  });

  /* Live UK clock: <span class="clock" data-clock></span> */
  const clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Europe/London'
    });
    const tick = () => {
      const t = fmt.format(new Date()).replace(':', ' ').toUpperCase();
      clocks.forEach(c => { c.textContent = c.dataset.clock === 'short' ? t.replace(/\s?[AP]M$/, '') : t; });
    };
    tick();
    setInterval(tick, 10000);
  }
})();

/* Hero load-in + menu overlay */
(() => {
  const root = document.documentElement;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));

  const btn = document.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('menu');
  if (!btn || !menu) return;

  const setOpen = open => {
    root.classList.toggle('is-menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.inert = !open;
    if (open) menu.querySelector('a')?.focus({ preventScroll: true });
  };
  menu.inert = true;

  btn.addEventListener('click', () => setOpen(!root.classList.contains('is-menu-open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('is-menu-open')) { setOpen(false); btn.focus(); }
  });
})();

/* Subtle 3D tilt toward the pointer: <div data-tilt> */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach(el => {
    const max = 8;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(1200px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) scale(1.03)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
})();

/* Count-up numbers: <span data-count="21" data-pad="2"> */
(() => {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (el, n) => String(n).padStart(+el.dataset.pad || 0, '0');
  const run = el => {
    const target = +el.dataset.count, dur = 1400, t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = fmt(el, Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (reduce || !('IntersectionObserver' in window)) return;
  els.forEach(el => { el.textContent = fmt(el, 0); });
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
  }), { threshold: .6 });
  els.forEach(el => io.observe(el));
})();

/* FAQ accordion */
(() => {
  document.querySelectorAll('.faq__item').forEach(item => {
    const btn = item.querySelector('.faq__q button');
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
})();
