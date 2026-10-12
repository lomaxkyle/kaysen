(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  document.documentElement.classList.add('js');
  const KL = (window.KL = window.KL || {});

  /* ---------- menu, notes, header ---------- */
  const nav = $('#site-nav'), menuBtn = $('#menu-btn');
  function closeMenu() {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menu';
    document.body.style.overflow = '';
  }
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(); });

  $('#toggle-notes').addEventListener('click', e => {
    const clean = document.body.classList.toggle('clean');
    e.currentTarget.textContent = clean ? 'Show notes' : 'Hide notes';
    e.currentTarget.setAttribute('aria-pressed', String(clean));
  });
  addEventListener('scroll', () => document.body.classList.toggle('scrolled', scrollY > 24), { passive: true });

  /* ---------- reveal on enter ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' })
    : null;
  function revealIn(page) {
    $$('.reveal', page).forEach((el, i) => {
      el.classList.remove('in');
      el.style.transitionDelay = `${(i % 6) * 60}ms`;
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  /* ---------- work: filters, grid/index views, preview ---------- */
  const items = $$('[data-page="work"] .item');
  const index = $('.work-index'), preview = $('.index-preview');
  if (index) {
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.dataset.type = it.dataset.type;
      const link = $('a', it), img = $('img', it);
      const inner = link ? document.createElement('a') : document.createElement('div');
      if (link) { inner.href = link.getAttribute('href'); if (link.target) { inner.target = link.target; inner.rel = 'noopener'; } }
      else inner.className = 'row';
      inner.innerHTML = `<img class="thumb" alt="" loading="lazy"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t"></span><span class="m"></span><span class="go">${link ? '→' : ''}</span>`;
      $('.thumb', inner).src = img.getAttribute('src');
      $('.t', inner).textContent = it.dataset.title;
      $('.m', inner).textContent = it.dataset.meta;
      li.appendChild(inner);
      li.addEventListener('mouseenter', () => { preview.src = img.getAttribute('src'); preview.classList.add('show'); li.classList.add('on'); });
      li.addEventListener('mouseleave', () => { preview.classList.remove('show'); li.classList.remove('on'); });
      index.appendChild(li);
    });
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const step = () => { x += (tx - x) * 0.18; y += (ty - y) * 0.18; preview.style.left = x + 18 + 'px'; preview.style.top = y + 'px'; raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(step) : 0; };
    index.addEventListener('mousemove', e => { tx = e.clientX + 140; ty = e.clientY; if (!x) { x = tx; y = ty; } if (!raf) raf = requestAnimationFrame(step); });
  }
  function setFilter(f) {
    if (!['all', 'photography', 'video', 'design', 'marketing'].includes(f)) f = 'all';
    $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
    const show = el => f === 'all' || el.dataset.type.split(' ').includes(f);
    items.forEach(it => { it.hidden = !show(it); });
    $$('.work-index li').forEach(li => { li.hidden = !show(li); });
    $$('[data-page="work"] .work-ph').forEach(ph => { ph.hidden = !(f === 'all' || f === 'photography'); });
  }
  $$('[data-filter]').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
  function setView(v) {
    $('#view-grid').setAttribute('aria-pressed', String(v === 'grid'));
    $('#view-index').setAttribute('aria-pressed', String(v === 'index'));
    $('.work-grid').hidden = v !== 'grid';
    index.hidden = v !== 'index';
    if (v !== 'index') preview.classList.remove('show');
  }
  if ($('#view-grid')) {
    $('#view-grid').addEventListener('click', () => setView('grid'));
    $('#view-index').addEventListener('click', () => setView('index'));
  }
  KL.setFilter = setFilter;

  /* ---------- before / after slider ---------- */
  $$('.ba').forEach(ba => {
    const r = $('.ba-range', ba);
    const set = () => ba.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set);
    set();
  });

  /* ---------- about: résumé note ---------- */
  const rb = $('#resume-btn');
  if (rb) rb.addEventListener('click', () => { $('#resume-msg').hidden = false; });

  /* ---------- contact: who-chips, validation, copy ---------- */
  const form = $('#inquiry');
  if (form) {
    const setWho = who => {
      $$('[data-who]', form).forEach(b => b.setAttribute('aria-checked', String(b.dataset.who === who)));
      $$('[data-for]', form).forEach(l => { l.hidden = !l.dataset.for.split(' ').includes(who); });
    };
    $$('[data-who]', form).forEach(b => b.addEventListener('click', () => setWho(b.dataset.who)));
    $('.who', form).addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const bs = $$('[data-who]', form), i = bs.findIndex(b => b.getAttribute('aria-checked') === 'true');
      const n = bs[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length];
      setWho(n.dataset.who); n.focus(); e.preventDefault();
    });
    setWho('senior');
    const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#f-name'), email = $('#f-email');
      const bad = [[name, !name.value.trim()], [email, !emailOk(email.value)]];
      bad.forEach(([el, isBad]) => { $('.err', el.closest('label')).hidden = !isBad; el.setAttribute('aria-invalid', String(isBad)); });
      const first = bad.find(([, b]) => b);
      if (first) { $('#sent').hidden = true; first[0].focus(); return; }
      $('#sent').hidden = false;
      $('#sent').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }
  const cb = $('#copy-email');
  if (cb) cb.addEventListener('click', () => {
    const el = $('#email');
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); cb.textContent = 'Selected'; };
    try { navigator.clipboard.writeText(el.textContent).then(() => { cb.textContent = 'Copied'; setTimeout(() => (cb.textContent = 'Copy'), 1600); }, fallback); } catch (err) { fallback(); }
  });

  /* ---------- router ---------- */
  function route() {
    let h = (location.hash || '#home').slice(1), sub = null;
    if (h.startsWith('work-')) { sub = h.slice(5); h = 'work'; }
    const page = $(`.page[data-page="${h}"]`) || $('.page[data-page="home"]');
    $$('.page').forEach(p => p.classList.toggle('on', p === page));
    const key = page.dataset.parent || page.dataset.page;
    $$('[data-nav]').forEach(a => (a.dataset.nav === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    if (KL.setFilter && key === 'work' && !page.dataset.parent) KL.setFilter(sub || 'all');
    closeMenu();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const h1 = $('h1', page);
    document.title = key === 'home'
      ? 'Kaysen Lomax · Photographer & Multimedia Creator · Jonesboro, AR'
      : `${h1 ? h1.textContent.trim() : 'Kaysen Lomax'} · Kaysen Lomax`;
    revealIn(page);
  }
  KL.route = route;
  addEventListener('hashchange', route);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', route); else route();
})();
