(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* keep the fixed header just under the draft bar */
  const bar = $('.draftbar');
  const setBar = () => document.documentElement.style.setProperty('--bar', (bar && !bar.hidden ? bar.offsetHeight : 0) + 'px');
  setBar(); addEventListener('resize', setBar);

  /* ---------- & menu ---------- */
  const menu = $('#menu'), amp = $('#amp');
  function openMenu() {
    menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false');
    amp.setAttribute('aria-expanded', 'true'); amp.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
    $('#main').inert = true;
    setTimeout(() => $('a', menu).focus(), 50);
  }
  function closeMenu(returnFocus) {
    if (!menu.classList.contains('open')) return;
    menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true');
    amp.setAttribute('aria-expanded', 'false'); amp.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
    $('#main').inert = false;
    if (returnFocus) amp.focus();
  }
  amp.addEventListener('click', () => (menu.classList.contains('open') ? closeMenu(true) : openMenu()));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(true); });

  /* ---------- notes ---------- */
  $('#toggle-notes').addEventListener('click', e => {
    const clean = document.body.classList.toggle('clean');
    e.currentTarget.textContent = clean ? 'Show notes' : 'Hide notes';
    e.currentTarget.setAttribute('aria-pressed', String(clean));
  });

  /* ---------- home: live project label, overlay fades at the end ---------- */
  const panels = $$('[data-page="home"] .panel'), projName = $('#proj-name'), overlay = $('.overlay');
  function setProj(name) { if (projName.textContent !== name) projName.textContent = name; }
  if (panels.length) setProj(panels[0].dataset.name);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setProj(e.target.dataset.name); }), { rootMargin: '-50% 0px -50% 0px' });
    panels.forEach(p => io.observe(p));
    const end = $('.home-end');
    if (end) new IntersectionObserver(es => es.forEach(e => overlay.classList.toggle('gone', e.isIntersecting)), { threshold: 0.15 }).observe(end);
  }

  /* ---------- before / after ---------- */
  $$('.ba').forEach(ba => {
    const r = $('.ba-range', ba);
    const set = () => ba.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set); set();
  });

  /* ---------- about ---------- */
  const rb = $('#resume-btn');
  if (rb) rb.addEventListener('click', () => { $('#resume-msg').hidden = false; });

  /* ---------- contact ---------- */
  const form = $('#inquiry');
  if (form) {
    const radios = $$('[data-who]', form);
    const setWho = who => {
      radios.forEach(b => { const on = b.dataset.who === who; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
      $$('[data-for]', form).forEach(l => { l.hidden = !l.dataset.for.split(' ').includes(who); });
    };
    radios.forEach(b => b.addEventListener('click', () => setWho(b.dataset.who)));
    $('.who', form).addEventListener('keydown', e => {
      const i = radios.findIndex(b => b.getAttribute('aria-checked') === 'true');
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let n = null;
      if (e.key in map) n = radios[(i + map[e.key] + radios.length) % radios.length];
      if (e.key === 'Home') n = radios[0];
      if (e.key === 'End') n = radios[radios.length - 1];
      if (n) { setWho(n.dataset.who); n.focus(); e.preventDefault(); }
    });
    setWho('senior');
    const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#f-name'), email = $('#f-email');
      const checks = [[name, !name.value.trim()], [email, !emailOk(email.value)]];
      checks.forEach(([el, bad]) => { $('.err', el.closest('label')).hidden = !bad; el.setAttribute('aria-invalid', String(bad)); });
      const first = checks.find(([, bad]) => bad);
      $('#sent').hidden = !!first;
      if (first) { first[0].focus(); return; }
      $('#sent').scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
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
    const h = (location.hash || '#home').slice(1);
    const page = $$('.page').find(p => p.dataset.page === h) || $('.page[data-page="home"]');
    $$('.page').forEach(p => p.classList.toggle('on', p === page));
    const key = page.dataset.parent || page.dataset.page;
    document.body.classList.toggle('route-home', key === 'home');
    $$('[data-nav]').forEach(a => (a.dataset.nav === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    closeMenu(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (key === 'home' && panels.length) { setProj(panels[0].dataset.name); overlay.classList.remove('gone'); }
    const h1 = $('h1', page);
    document.title = key === 'home' ? 'Kaysen Lomax · Photographer & Multimedia Creator · Jonesboro, AR' : `${h1 ? h1.textContent.trim() : ''} · Kaysen Lomax`;
  }
  addEventListener('hashchange', route);
  /* clicking a link to the page you're already on still closes the menu and returns to the top */
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (a && a.getAttribute('href') === location.hash) route(); });
  route();
})();
