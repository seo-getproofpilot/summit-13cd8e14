/* Summit Solutions — concept redesign v4 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 760px)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, el.offsetHeight - innerHeight), 0, 1); };
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

  /* ================= load-in: the mark draws, then the page is revealed ================= */
  const intro = $('.intro');
  history.scrollRestoration = 'manual'; scrollTo(0, 0);
  const endIntro = () => {
    if (!intro || intro.classList.contains('out')) return;
    intro.classList.add('out');
    setTimeout(() => { document.body.classList.remove('is-intro'); }, 250);
    setTimeout(() => intro.remove(), 1000);
  };
  setTimeout(endIntro, reduce || window.__noIntro ? 0 : 2300);
  intro && intro.addEventListener('click', endIntro);

  const nav = $('#nav'), mbar = $('.mbar'), film = $('.film');

  /* ================= HERO: intro line → story beats, form rides along ================= */
  const STOPS = [0, 7.02, 13.02, 19.02, 24.4];
  const segs = [{ hold: true, t: 0, w: .9, beat: -1 }];
  const HOLD = [0.9, 0.55, 0.55, 0.7, 0.9];
  STOPS.forEach((t, i) => {
    segs.push({ hold: true, t, w: HOLD[i], beat: i });
    if (i < STOPS.length - 1) segs.push({ hold: false, a: t, b: STOPS[i + 1], w: (STOPS[i + 1] - t) / 6.2, beat: i });
  });
  const totalW = segs.reduce((s, x) => s + x.w, 0);
  function filmState() {
    const p = prog(film);
    let w = p * totalW; const out = { p, t: 0, beat: -1, hold: false };
    for (const s of segs) {
      if (w <= s.w || s === segs[segs.length - 1]) {
        const f = clamp(w / s.w, 0, 1);
        if (s.hold) { out.t = s.t; out.beat = s.beat; out.hold = true; }
        else { out.t = s.a + (s.b - s.a) * f; out.beat = f < .5 ? s.beat : s.beat + 1; }
        break;
      }
      w -= s.w;
    }
    return out;
  }
  const filmStage = $('.film-stage');
  const vid = $('.film-vid'), fIntro = $('.film-intro'), chaps = $$('.chap'), rail = $('.film-rail'), railSpans = $$('.film-rail span');
  vid.src = `assets/video/${small ? 'film-m' : 'film-d'}.mp4?v=2d15a69d`;
  let ready = false, shown = 0, seeking = false, lastBeat = 99;
  vid.addEventListener('loadeddata', () => { ready = true; vid.classList.add('ready'); });
  vid.addEventListener('seeked', () => { seeking = false; });
  const prime = () => { [vid, $('.lc-vid')].forEach(v => v.play().then(() => v.pause()).catch(() => {})); removeEventListener('touchstart', prime); };
  addEventListener('touchstart', prime, { passive: true });

  function heroTick() {
    const st = filmState();
    if (st.beat !== lastBeat) {
      fIntro.classList.toggle('off', st.beat >= 0);
      chaps.forEach((c, i) => c.classList.toggle('on', i === st.beat));
      railSpans.forEach((s, i) => s.classList.toggle('on', i <= st.beat));
      rail.classList.toggle('show', st.beat >= 0);
      lastBeat = st.beat;
    }
    rail.style.setProperty('--p', clamp((st.p * totalW - segs[0].w) / (totalW - segs[0].w), 0, 1).toFixed(4));
    shown += (st.t - shown) * (reduce || window.__instant ? 1 : 0.14);
    if (Math.abs(st.t - shown) < (st.hold ? 0.09 : 0.004)) shown = st.t;
    if (ready && !seeking && !window.__instant && Math.abs(vid.currentTime - shown) > 1 / 96) {
      seeking = true;
      if (vid.fastSeek && Math.abs(vid.currentTime - shown) > 2) vid.fastSeek(shown); else vid.currentTime = shown;
      setTimeout(() => { seeking = false; }, 120);
    }
    filmStage.classList.toggle('brand-on', st.t > 22.6);
    const pastFilm = scrollY > film.offsetHeight - innerHeight * 1.05;
    nav.classList.toggle('solid', pastFilm);
    nav.classList.toggle('brand-show', scrollY > film.offsetHeight - innerHeight * .3);
    mbar.classList.toggle('show', pastFilm);
  }
  window.__film = { filmState, segs, totalW, vid };

  // phones: the hero form is a bottom sheet
  const heroForm = $('#heroForm');
  $('.hero-sheet-btn').addEventListener('click', () => heroForm.classList.add('open'));
  $('.hf-close').addEventListener('click', () => heroForm.classList.remove('open'));

  /* ================= BUILD YOUR ROOF: pick it, then the roof lifts apart ================= */
  const lay = $('.rb'), lvid = $('.lc-vid'), lPoster = $('.lc-poster'), lItems = $$('.lay-list li'), lPins = $('.lc-pins'), lPinEls = $$('.lc-pins span');
  const ROOFS = {
    charcoal: { name: 'Charcoal shingle', sys: 'Architectural laminated shingle', war: '30-yr manufacturer + lifetime labor', for: 'Most homes, best value per square foot' },
    wood: { name: 'Weathered wood shingle', sys: 'Architectural laminated shingle', war: '30-yr manufacturer + lifetime labor', for: 'Warm brick and stone exteriors' },
    'black-metal': { name: 'Matte black metal', sys: 'Standing seam metal', war: 'Manufacturer warranty + lifetime labor', for: 'Modern looks and commercial buildings' },
    galv: { name: 'Galvalume metal', sys: 'Standing seam metal', war: 'Manufacturer warranty + lifetime labor', for: 'Shops, barns and commercial roofs' },
  };
  const LAYTXT = {
    shingle: { ridge: 'Ridge cap &amp; vent', 'ridge-p': "Lets attic heat out along the peak, so shingles don't cook from underneath in August.",
      top: 'Architectural shingles', 'top-p': 'Laminated and heavier than 3-tab, sealed on a starter row at every edge. IKO and TAMKO, by a crew certified for both.' },
    metal: { ridge: 'Metal ridge cap &amp; vent', 'ridge-p': 'A formed metal cap over a vented ridge, so attic heat gets out and rain stays out.',
      top: 'Standing seam panels', 'top-p': 'Panels lock together at raised seams with the fasteners hidden underneath, so there are no exposed screws to leak.' },
  };
  const MATC = { charcoal: '#34383d', wood: '#6b5442', 'black-metal': '#1d1f22', galv: '#b9c0c6' };
  const vsrc = k => `assets/video/${k === 'charcoal' ? 'layers' : 'layers-' + k}-${small ? 'm' : 'd'}.mp4?v=2`;
  let roof = 'charcoal';
  const lxN = $('[data-lx-n]');
  lvid.src = vsrc(roof);
  let lReady = false, lShown = 0, lSeek = false, lLast = -2;
  lvid.addEventListener('loadeddata', () => { lReady = true; lvid.classList.add('ready'); lvid.currentTime = lShown; });
  lvid.addEventListener('seeked', () => { lSeek = false; });
  const LDUR = 6.96, LWIN = [[.7, 1.65], [1.65, 2.45], [2.45, 3.25], [3.25, 3.95], [3.95, 4.65], [4.65, 99]];
  const SPLIT = .13, T0 = .17, T1 = .86, DONE = .9;
  const lt = p => clamp((p - T0) / (T1 - T0), 0, 1) * LDUR;
  function layersTick() {
    if (!inView(lay)) return;
    const p = prog(lay);
    lay.classList.toggle('split', p > SPLIT);
    const t = lt(p);
    lShown += (t - lShown) * (reduce || window.__instant ? 1 : 0.16);
    if (Math.abs(t - lShown) < .004) lShown = t;
    if (lReady && !lSeek && !window.__instant && Math.abs(lvid.currentTime - lShown) > 1 / 96) {
      lSeek = true; lvid.currentTime = lShown; setTimeout(() => { lSeek = false; }, 120);
    }
    let act = -1;
    LWIN.forEach(([a, b], i) => { if (lShown >= a && lShown < b) act = i; });
    if (p > DONE) act = -1;
    if (act !== lLast) {
      lItems.forEach((li, i) => { li.classList.toggle('on', i === act); li.classList.toggle('seen', lShown >= LWIN[i][0] - .01 || p > DONE); });
      lPinEls.forEach((s, i) => s.classList.toggle('on', i === act));
      lxN.textContent = '0' + (act < 0 ? (p > DONE ? 6 : 0) : act + 1);
      lLast = act;
    }
    lPins.classList.toggle('show', lShown > LDUR - .5);
  }
  window.__layers = { vid: lvid, t: () => lt(prog(lay)) };
  const pinOn = i => { lItems.forEach((li, j) => li.classList.toggle('on', j === i)); lPinEls.forEach((s, j) => s.classList.toggle('on', j === i)); };
  lPinEls.forEach((s, i) => s.addEventListener('mouseenter', () => prog(lay) > DONE && pinOn(i)));
  lItems.forEach((li, i) => li.addEventListener('mouseenter', () => prog(lay) > DONE && pinOn(i)));

  const sws = $$('.rb .sw9'), tabs = $$('.rb .pick-tabs button'), swGroups = $$('.rb .pick-sw');
  const pickSet = k => {
    if (k === roof) return; roof = k;
    sws.forEach(b => b.classList.toggle('on', b.dataset.k === k));
    Object.entries(ROOFS[k]).forEach(([f, v]) => $$(`.rb [data-f="${f}"]`).forEach(el => { el.textContent = v; }));
    const txt = LAYTXT[k.includes('metal') || k === 'galv' ? 'metal' : 'shingle'];
    Object.entries(txt).forEach(([f, v]) => { const el = $(`.rb [data-l="${f}"]`); if (el) el.innerHTML = v; });
    lPoster.src = `assets/img/rb/${k}.webp`;
    $('.rb-chip img').src = `assets/img/rb/sw-${k}.webp`;
    lay.style.setProperty('--mat', MATC[k]);
    lReady = false; lvid.classList.remove('ready'); lvid.src = vsrc(k); lvid.load();
  };
  sws.forEach(b => b.addEventListener('click', () => pickSet(b.dataset.k)));
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(o => o.setAttribute('aria-selected', o === t));
    swGroups.forEach(g => { g.hidden = g.dataset.type !== t.dataset.type; });
    pickSet(t.dataset.type === 'metal' ? 'black-metal' : 'charcoal');
  }));
  $('.rb-chip').addEventListener('click', () => scrollTo({ top: lay.offsetTop, behavior: reduce ? 'auto' : 'smooth' }));
  ['wood', 'black-metal', 'galv'].forEach(k => { const im = new Image(); im.src = `assets/img/rb/${k}.webp`; });

  /* ================= INSPECTION: chalk circles on the hits, steps fill ================= */
  const HITS = [[825,340],[928,330],[1078,365],[680,370],[600,322],[510,400],[920,437],[1035,505],[748,525],[537,515],[1138,560],[720,670],[520,695],[432,640],[1455,378],[1172,207],[1100,262]];
  const chalk = $('.insp .chalk'), countEl = $('[data-count]'), isteps = $$('.insp-steps li');
  HITS.forEach(([x, y], i) => {
    const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    const rx = 40 + (i * 7) % 12, ry = 27 + (i * 5) % 8;
    e.setAttribute('cx', x); e.setAttribute('cy', y); e.setAttribute('rx', rx); e.setAttribute('ry', ry);
    e.setAttribute('transform', `rotate(${(i * 23) % 40 - 20} ${x} ${y})`);
    e.style.setProperty('--len', Math.ceil(2 * Math.PI * rx + 20));
    chalk.appendChild(e);
  });
  let inspRan = false;
  const runInsp = () => {
    if (inspRan) return; inspRan = true;
    const els = $$('ellipse', chalk), step = reduce ? 0 : 140;
    els.forEach((e, i) => setTimeout(() => { e.classList.add('drawn'); countEl.textContent = i + 1; }, 250 + i * step));
    isteps.forEach((li, i) => setTimeout(() => li.classList.add('ok'), 300 + i * (reduce ? 0 : 520)));
  };
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); runInsp(); } }, { threshold: .4 }).observe($('.insp-photo'));
  window.__report = runInsp;

  /* ================= BEFORE / AFTER: one big slider, four jobs ================= */
  const baStage = $('.ba2-stage'), baRange = $('.ba-range', baStage), baB = $('.ba2-before'), baA = $('.ba2-after'), baTabs = $$('.ba2-tabs button');
  const baSet = v => { baRange.value = v; baStage.style.setProperty('--pos', v + '%'); };
  baRange.addEventListener('input', () => baSet(baRange.value));
  const sfx = small ? '-m.webp' : '.webp';
  const pickSrc = src => src.includes('/v5/') ? src.replace('.webp', sfx) : src;
  baTabs.forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('on')) return;
    baTabs.forEach(o => { o.classList.toggle('on', o === b); o.setAttribute('aria-selected', o === b); });
    baStage.classList.add('swap');
    const im1 = new Image(), im2 = new Image(); let n = 0;
    const done = () => { if (++n < 2) return; baB.src = im1.src; baA.src = im2.src; baSet(50); requestAnimationFrame(() => baStage.classList.remove('swap')); nudge(); };
    im1.onload = im2.onload = done; im1.src = pickSrc(b.dataset.b); im2.src = pickSrc(b.dataset.a);
  }));
  const baCap = $('.ba2-cap');
  baTabs.forEach(b => b.addEventListener('click', () => {
    if (!baCap) return;
    setTimeout(() => { baCap.querySelector('b').textContent = $('b', b).textContent; baCap.querySelector('span').textContent = $('em', b).textContent; }, 180);
  }));
  /* crew clips play only while on screen */
  const crewVids = $$('.cw video');
  const crewIO = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting && !reduce) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
  }), { threshold: .35 });
  crewVids.forEach(v => crewIO.observe(v));
  let nudging = false;
  const nudge = () => {
    if (reduce || nudging) return; nudging = true; let t0 = null;
    const anim = ts => { if (t0 === null) t0 = ts; const k = Math.min((ts - t0) / 1600, 1);
      baSet((50 + Math.sin(k * Math.PI * 2) * 24).toFixed(1)); if (k < 1) requestAnimationFrame(anim); else nudging = false; };
    requestAnimationFrame(anim);
  };
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); nudge(); } }, { threshold: .55 }).observe(baStage);

  /* ================= SERVICES: architectural directory ================= */
  function svxTick() {}
  const sdRows = $$('.sd-row'), sdImgs = $$('.sd-img'), sdLink = $('.sd-link'), sdBody = $('.sd-body');
  const sdCap = { k: $('.sd-k'), t: $('.sd-t'), d: $('.sd-d') }, sdSrc = $('.sd-src');
  const touch = matchMedia('(hover: none)').matches;
  let sdOn = 0;
  const sdLine = () => {
    const r = sdRows[sdOn].getBoundingClientRect(), b = sdBody.getBoundingClientRect();
    sdLink.style.transform = `translateY(${(r.top - b.top + r.height / 2).toFixed(1)}px)`;
  };
  const sdSet = i => {
    if (i === sdOn) return;
    sdOn = i; const row = sdRows[i];
    sdRows.forEach((r, j) => r.classList.toggle('on', j === i));
    sdImgs.forEach((im, j) => im.classList.toggle('on', j === i));
    sdCap.k.textContent = row.dataset.k; sdCap.t.innerHTML = row.dataset.t; sdCap.d.textContent = row.dataset.d;
    sdSrc.textContent = row.dataset.real === '1' ? 'Summit job site' : 'Illustration';
    sdLine();
  };
  sdRows.forEach((r, i) => {
    r.addEventListener('mouseenter', () => !touch && sdSet(i));
    r.addEventListener('focus', () => sdSet(i));
    r.addEventListener('click', e => { if (touch && i !== sdOn) { e.preventDefault(); sdSet(i); } });
  });
  addEventListener('resize', sdLine); addEventListener('load', sdLine); requestAnimationFrame(sdLine);

  /* ================= WORK track ================= */
  const work = $('.work'), track = $('.work-track');
  let trackSpan = 0;
  const workLayout = () => { trackSpan = Math.max(0, track.scrollWidth - innerWidth); work.style.height = `${innerHeight + trackSpan * 1.1}px`; };
  addEventListener('resize', workLayout); addEventListener('load', workLayout); workLayout();
  function workTick() { if (inView(work)) track.style.transform = `translate3d(${(-prog(work) * trackSpan).toFixed(1)}px,0,0)`; }

  /* ================= loop ================= */
  function tick() { heroTick(); layersTick(); svxTick(); workTick(); requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  window.__tick = () => { heroTick(); layersTick(); svxTick(); workTick(); };

  /* ================= Google reviews carousel ================= */
  const RV = window.SUMMIT_REVIEWS;
  if (RV) {
    $('[data-rating]').textContent = RV.rating.toFixed(1);
    $('[data-count-reviews]').textContent = `${RV.count} reviews`;
    const star = '<svg><use href="#i-star"/></svg>'.repeat(5);
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const card = r => `<article class="rc"><div class="rc-top"><span class="rc-av">${esc(r.n[0])}</span><div><b>${esc(r.n)}</b><span>${esc(r.t)}</span></div><img class="rc-g" src="assets/img/google.webp" alt=""></div><span class="stars">${star}</span><p>${esc(r.x)}</p></article>`;
    const rows = [RV.items.filter((_, i) => i % 2 === 0), RV.items.filter((_, i) => i % 2 === 1)];
    $$('.rv-track').forEach((tr, i) => {
      const html = rows[i].map(card).join('');
      tr.innerHTML = html + html;
      tr.style.setProperty('--dur', `${rows[i].length * 7}s`);
    });
  }

  /* ================= service area: Texas ================= */
  const txPins = $$('.tx-pin'), txBtns = $$('.tx-list button');
  const txOn = k => { txPins.forEach(g => g.classList.toggle('on', g.dataset.k === k)); txBtns.forEach(b => b.classList.toggle('on', b.dataset.k === k)); };
  txBtns.forEach(b => { b.addEventListener('mouseenter', () => txOn(b.dataset.k)); b.addEventListener('focus', () => txOn(b.dataset.k)); b.addEventListener('click', () => txOn(b.dataset.k)); });
  txOn('colony');
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); $('.tx').classList.add('seen'); } }, { threshold: .3 }).observe($('.tx'));

  /* ================= FAQ: shingle courses ================= */
  const crs = $$('.crs');
  crs.forEach(c => $('.crs-q', c).addEventListener('click', () => {
    const open = !c.classList.contains('on');
    crs.forEach(o => { o.classList.toggle('on', o === c && open); $('.crs-q', o).setAttribute('aria-expanded', o === c && open); });
  }));
  const today = $('[data-today]');
  if (today) today.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  /* ================= hero form ================= */
  const hf = $('.hf');
  hf.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', hf).forEach(i => { const bad = !i.value.trim(); i.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) return;
    $$('.in9, .btn9', hf).forEach(el => { el.hidden = true; el.style.display = 'none'; });
    $('.hf-done', hf).hidden = false;
  });

  /* ================= closing form ================= */
  const cf = $('.close-form');
  cf.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', cf).forEach(i => { const bad = !i.value.trim(); i.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) return;
    $('[data-echo="phone"]', cf).textContent = cf.elements.phone.value.trim();
    $('[data-echo="address"]', cf).textContent = cf.elements.address.value.trim();
    cf.classList.add('sent'); $('.cf-done', cf).hidden = false;
  });

  /* ================= reveals ================= */
  if (!reduce) {
    const els = $$('.bax-side, .tm-copy, .ig9-head, .prc-head, .work-head, .rv-head, .tx-side, .fq10-side, .end-copy, .tk');
    els.forEach((el, i) => { el.classList.add('rv-in'); el.style.transitionDelay = `${(i % 3) * 80}ms`; });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }
})();
