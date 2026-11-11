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
  const vid = $('.film-vid'), fIntro = $('.film-intro'), chaps = $$('.chap'), rail = $('.film-rail'), railSpans = $$('.film-rail span');
  vid.src = `assets/video/${small ? 'film-m' : 'film-d'}.mp4?v=70b625f8`;
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
    const pastFilm = scrollY > film.offsetHeight - innerHeight * 1.05;
    nav.classList.toggle('solid', pastFilm);
    mbar.classList.toggle('show', pastFilm);
  }
  window.__film = { filmState, segs, totalW, vid };

  // phones: the hero form is a bottom sheet
  const heroForm = $('#heroForm');
  $('.hero-sheet-btn').addEventListener('click', () => heroForm.classList.add('open'));
  $('.hf-close').addEventListener('click', () => heroForm.classList.remove('open'));

  /* ================= LAYERS: the roof lifts apart ================= */
  const lay = $('.layers'), lvid = $('.lc-vid'), lItems = $$('.lay-list li'), lPins = $('.lc-pins'), lPinEls = $$('.lc-pins span');
  lvid.src = `assets/video/${small ? 'layers-m' : 'layers-d'}.mp4?v=1`;
  let lReady = false, lShown = 0, lSeek = false, lLast = -2;
  lvid.addEventListener('loadeddata', () => { lReady = true; lvid.classList.add('ready'); });
  lvid.addEventListener('seeked', () => { lSeek = false; });
  const LDUR = 6.96, LWIN = [[.7, 1.65], [1.65, 2.45], [2.45, 3.25], [3.25, 3.95], [3.95, 4.65], [4.65, 99]];
  function layersTick() {
    if (!inView(lay)) return;
    const p = prog(lay);
    const t = clamp((p - .06) / .74, 0, 1) * LDUR;
    lShown += (t - lShown) * (reduce || window.__instant ? 1 : 0.16);
    if (Math.abs(t - lShown) < .004) lShown = t;
    if (lReady && !lSeek && !window.__instant && Math.abs(lvid.currentTime - lShown) > 1 / 96) {
      lSeek = true; lvid.currentTime = lShown; setTimeout(() => { lSeek = false; }, 120);
    }
    let act = -1;
    LWIN.forEach(([a, b], i) => { if (lShown >= a && lShown < b) act = i; });
    if (p > .86) act = -1;
    if (act !== lLast) {
      lItems.forEach((li, i) => { li.classList.toggle('on', i === act); li.classList.toggle('seen', lShown >= LWIN[i][0] - .01 || p > .86); });
      lPinEls.forEach((s, i) => s.classList.toggle('on', i === act));
      lLast = act;
    }
    lPins.classList.toggle('show', lShown > LDUR - .5);
  }
  window.__layers = { vid: lvid, t: () => clamp((prog(lay) - .06) / .74, 0, 1) * LDUR };
  const pinOn = i => { lItems.forEach((li, j) => li.classList.toggle('on', j === i)); lPinEls.forEach((s, j) => s.classList.toggle('on', j === i)); };
  lPinEls.forEach((s, i) => s.addEventListener('mouseenter', () => prog(lay) > .86 && pinOn(i)));
  lItems.forEach((li, i) => li.addEventListener('mouseenter', () => prog(lay) > .86 && pinOn(i)));

  /* ================= PICK YOUR ROOF ================= */
  const ROOFS = {
    charcoal: { sys: 'Architectural laminated shingle', war: '30-yr manufacturer + lifetime labor', for: 'Most homes, best value per square foot' },
    wood: { sys: 'Architectural laminated shingle', war: '30-yr manufacturer + lifetime labor', for: 'Warm brick and stone exteriors' },
    'black-metal': { sys: 'Standing seam metal', war: 'Manufacturer warranty + lifetime labor', for: 'Modern looks and commercial buildings' },
    galv: { sys: 'Standing seam metal', war: 'Manufacturer warranty + lifetime labor', for: 'Shops, barns and commercial roofs' },
  };
  const pickImgs = $$('.pick-imgs img'), sws = $$('.sw'), tabs = $$('.pick-tabs button'), swGroups = $$('.pick-sw');
  const pickSet = k => {
    pickImgs.forEach(im => im.classList.toggle('on', im.dataset.k === k));
    sws.forEach(b => b.classList.toggle('on', b.dataset.k === k));
    Object.entries(ROOFS[k]).forEach(([f, v]) => { const el = $(`.pick-spec [data-f="${f}"]`); if (el) el.textContent = v; });
  };
  if (small) pickImgs.forEach(im => { im.src = im.getAttribute('src').replace('.webp', '-m.webp'); });
  sws.forEach(b => b.addEventListener('click', () => pickSet(b.dataset.k)));
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(o => o.setAttribute('aria-selected', o === t));
    swGroups.forEach(g => { g.hidden = g.dataset.type !== t.dataset.type; });
    pickSet(t.dataset.type === 'metal' ? 'black-metal' : 'charcoal');
  }));

  /* ================= STORM REPORT: chalk, loupe, checklist ================= */
  const HITS = [[260,55,10,7],[453,50,10,7],[568,47,10,7],[372,110,10,7],[467,95,9,6],[460,123,10,7],[427,125,9,7],[200,131,11,8],[556,117,10,7],[580,140,10,7],[465,143,10,7],[660,85,9,7],[302,196,11,8],[263,213,16,13],[287,233,9,7],[452,205,10,7],[478,216,10,7],[559,187,10,7],[687,168,10,8],[718,143,9,7],[498,260,11,8],[210,285,13,8],[416,367,12,9]];
  const chalk = $('.chalk'), sheet = $('.rs-sheet'), countEl = $('[data-count]'), checks = $$('.rs-checks li');
  HITS.forEach(([x, y, rx, ry]) => {
    const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    e.setAttribute('cx', x); e.setAttribute('cy', y); e.setAttribute('rx', rx + 5); e.setAttribute('ry', ry + 4);
    e.setAttribute('transform', `rotate(${(x * 7) % 30 - 15} ${x} ${y})`);
    e.style.setProperty('--len', Math.ceil(2 * Math.PI * Math.max(rx, ry) + 30));
    chalk.appendChild(e);
  });
  let reportRan = false;
  const runReport = () => {
    if (reportRan) return; reportRan = true;
    const els = $$('ellipse', chalk), step = reduce ? 0 : 110;
    els.forEach((e, i) => setTimeout(() => { e.classList.add('drawn'); countEl.textContent = i + 1; }, 200 + i * step));
    checks.forEach((li, i) => setTimeout(() => li.classList.add('ok'), 400 + i * (reduce ? 0 : 420)));
    setTimeout(() => sheet.classList.add('done'), reduce ? 0 : 400 + checks.length * 420 + 200);
  };
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); runReport(); } }, { threshold: .35 }).observe($('.rs-grid'));
  window.__report = runReport;
  // loupe: follows the pointer, and tours the hits on its own when idle
  const photo = $('.rs-photo'), pimg = $('.rs-photo img'), loupe = $('.loupe'), Z = 2.5;
  loupe.style.backgroundImage = `url(${pimg.getAttribute('src')})`;
  let manual = 0, tourI = 0, tourT = 0, lx = .5, ly = .5;
  const placeLoupe = (fx, fy) => {
    const w = photo.clientWidth, h = photo.clientHeight;
    loupe.style.left = fx * w + 'px'; loupe.style.top = fy * h + 'px';
    loupe.style.backgroundSize = `${w * Z}px ${h * Z}px`;
    const L = loupe.offsetWidth;
    loupe.style.backgroundPosition = `${-(fx * w * Z - L / 2)}px ${-(fy * h * Z - L / 2)}px`;
  };
  photo.addEventListener('pointermove', e => {
    const r = photo.getBoundingClientRect();
    manual = performance.now(); loupe.classList.add('on');
    lx = clamp((e.clientX - r.left) / r.width, 0, 1); ly = clamp((e.clientY - r.top) / r.height, 0, 1);
    placeLoupe(lx, ly);
  });
  function loupeTick(now) {
    if (!reportRan || !inView(photo) || now - manual < 2500) return;
    loupe.classList.add('on');
    if (now - tourT > 1700) { tourI = (tourI + 5) % HITS.length; tourT = now; }
    const [hx, hy] = HITS[tourI];
    lx += (hx / 730 - lx) * .06; ly += (hy / 447 - ly) * .06;
    placeLoupe(lx, ly);
  }

  /* ================= BEFORE / AFTER sliders ================= */
  $$('.ba-frame').forEach(f => {
    const r = $('.ba-range', f);
    const set = () => f.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set); set();
  });
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting || reduce) return; io.disconnect();
    $$('.ba-frame').forEach((f, i) => {
      const r = $('.ba-range', f); let t0 = null;
      const anim = ts => {
        if (t0 === null) t0 = ts;
        const k = (ts - t0 - i * 180) / 1400;
        if (k < 0) return requestAnimationFrame(anim);
        r.value = 50 + Math.sin(Math.min(k, 1) * Math.PI * 2) * 22; f.style.setProperty('--pos', r.value + '%');
        if (k < 1) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    });
  }, { threshold: .5 }).observe($('.ba-grid'));

  /* ================= REEL ================= */
  const reel = $('.reel'), reelVid = $('.reel-vid'), reelWord = $('.reel-word'), reelFill = $('.reel-fill'), reelCopy = $('.reel-copy');
  function reelLayout() {
    const vw = innerWidth, vh = innerHeight;
    reelWord.setAttribute('x', vw / 2); reelWord.setAttribute('y', vh / 2 + vw * .06);
    reelWord.setAttribute('font-size', (vw * .17).toFixed(1));
    reelWord.setAttribute('textLength', (vw * .9).toFixed(1)); reelWord.setAttribute('lengthAdjust', 'spacingAndGlyphs');
  }
  reelLayout(); addEventListener('resize', reelLayout);
  function reelTick() {
    if (!inView(reel)) { if (!reelVid.paused) reelVid.pause(); return; }
    if (window.__recT != null) {
      reelVid.preload = 'auto'; if (!reelVid.paused) reelVid.pause();
      const want = window.__recT % (reelVid.duration || 26);
      if (reelVid.readyState >= 1 && Math.abs(reelVid.currentTime - want) > .02) { reelVid.dataset.recSeek = '1'; reelVid.currentTime = want; }
    } else if (reelVid.paused) { reelVid.preload = 'auto'; reelVid.play().catch(() => {}); }
    const q = prog(reel);
    const z = ease(clamp((q - .12) / .5, 0, 1));
    const s = 1 + z * 2.4, cx = innerWidth / 2, cy = innerHeight / 2;
    reelWord.setAttribute('transform', `translate(${cx} ${cy}) scale(${s.toFixed(3)}) translate(${-cx} ${-cy})`);
    reelFill.style.opacity = (1 - clamp((q - .3) / .3, 0, 1)).toFixed(3);
    reelCopy.classList.toggle('on', q > .58);
  }

  /* ================= WORK track ================= */
  const work = $('.work'), track = $('.work-track');
  let trackSpan = 0;
  const workLayout = () => { trackSpan = Math.max(0, track.scrollWidth - innerWidth); work.style.height = `${innerHeight + trackSpan * 1.1}px`; };
  addEventListener('resize', workLayout); addEventListener('load', workLayout); workLayout();
  function workTick() { if (inView(work)) track.style.transform = `translate3d(${(-prog(work) * trackSpan).toFixed(1)}px,0,0)`; }

  /* ================= loop ================= */
  function tick(now) { heroTick(); layersTick(); reelTick(); workTick(); loupeTick(now || performance.now()); requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  window.__tick = () => { heroTick(); layersTick(); reelTick(); workTick(); };

  /* ================= services panels ================= */
  const pns = $$('.pn');
  pns.forEach(pn => {
    const on = () => pns.forEach(o => o.classList.toggle('on', o === pn));
    pn.addEventListener('mouseenter', on); pn.addEventListener('focusin', on);
    pn.addEventListener('click', e => { if (!pn.classList.contains('on')) { e.preventDefault(); on(); } });
  });

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

  /* ================= service-area map ================= */
  let map, spots = {};
  const ALL = small ? [[26.2, -104.2], [36.9, -93.4]] : [[25.0, -103.5], [36.8, -78.6]];
  const pad = () => small ? { padding: [10, 10] } : { paddingTopLeft: [400, 30], paddingBottomRight: [30, 30] };
  function initMap() {
    if (map || !window.L) return;
    map = L.map('leaf', { scrollWheelZoom: false, zoomControl: true, zoomSnap: .25 });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors', maxZoom: 18,
    }).addTo(map);
    const mark = '<svg viewBox="0 0 192 93"><use href="#mk-roof"/><use href="#mk-peak" class="pk"/></svg>';
    const office = (ll, name, sub) => L.marker(ll, { icon: L.divIcon({ className: 'sm-pin', html: `<i></i>${mark}<b>${name}<small>${sub}</small></b>`, iconSize: [0, 0] }) }).addTo(map);
    const dot = (ll, name) => L.marker(ll, { icon: L.divIcon({ className: 'sm-dot', html: `<i></i><b>${name}</b>`, iconSize: [0, 0] }) }).addTo(map);
    const region = (ll, r, name) => {
      L.circle(ll, { radius: r, color: '#4a90e2', weight: 2, fillColor: '#4a90e2', fillOpacity: .14, dashArray: '6 6' }).addTo(map);
      L.marker(ll, { icon: L.divIcon({ className: 'sm-reg', html: `<b>${name}</b>`, iconSize: [0, 0] }), interactive: false }).addTo(map);
    };
    region([35.45, -97.5], 230000, 'Oklahoma');
    region([26.25, -80.35], 120000, 'South Florida');
    region([29.3, -94.9], 70000, 'Gulf Coast');
    region([32.8, -97.05], 62000, 'DFW'); dot([29.76, -95.37], 'Houston');
    office([33.096, -96.894], 'The Colony', 'Headquarters'); office([30.27, -97.74], 'Austin', 'Office'); office([31.997, -102.078], 'Midland', 'Office');
    spots = {
      colony: [[33.0, -96.95], 9.5], austin: [[30.27, -97.74], 10], midland: [[31.997, -102.078], 10],
      houston: [[29.55, -95.2], 8.5], oklahoma: [[35.45, -97.5], 6.5], sfl: [[26.25, -80.35], 8],
    };
    map.fitBounds(ALL, pad());
  }
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); initMap(); } }, { rootMargin: '300px' }).observe($('#leaf'));
  $$('[data-go]').forEach(b => b.addEventListener('click', () => {
    initMap();
    $$('.areas-list button').forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.go === 'all') { map.flyToBounds(ALL, { ...pad(), duration: 1.2 }); return; }
    const [ll, z] = spots[b.dataset.go]; map.flyTo(ll, z, { duration: 1.2 });
  }));

  /* ================= hero form ================= */
  const hf = $('.hf');
  hf.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', hf).forEach(i => { const bad = !i.value.trim(); i.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) return;
    $$('.fld, .hf-why, .btn', hf).forEach(el => { el.hidden = true; el.style.display = 'none'; });
    $('.hf-done', hf).hidden = false;
  });

  /* ================= booking wizard ================= */
  const wiz = $('#wiz'), wForm = $('form', wiz), steps = $$('.wz', wiz), stepNo = $('[data-step]', wiz), prog3 = $('.wiz-prog', wiz);
  const PROG = { 1: .1, 2: .45, 3: .78, 4: 1 };
  const go = (n, focus = true) => {
    steps.forEach(s => s.classList.toggle('on', +s.dataset.s === n));
    stepNo.textContent = Math.min(n, 3);
    prog3.style.setProperty('--f', PROG[n]); prog3.style.setProperty('--pk', n === 4 ? 1 : 0);
    $('.wiz-step', wiz).style.visibility = n === 4 ? 'hidden' : 'visible';
    const f = $(`.wz[data-s="${n}"] input:not([type=radio])`, wiz);
    if (focus && f && !small) setTimeout(() => f.focus({ preventScroll: true }), 250);
  };
  $$('.wz-tiles button', wiz).forEach(b => b.addEventListener('click', () => {
    $$('.wz-tiles button', wiz).forEach(o => o.classList.toggle('picked', o === b));
    setTimeout(() => go(2), 220);
  }));
  $$('.wz-back', wiz).forEach(b => b.addEventListener('click', () => go(+b.closest('.wz').dataset.s - 1)));
  const need = names => { let ok = true; names.forEach(n => { const i = wForm.elements[n]; const bad = !i.value.trim(); i.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } }); return ok; };
  $('.wz-next', wiz).addEventListener('click', () => { if (need(['address'])) go(3); });
  wForm.addEventListener('keydown', e => { if (e.key === 'Enter' && $('.wz.on', wiz).dataset.s === '2') { e.preventDefault(); $('.wz-next', wiz).click(); } });
  wForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!need(['name', 'phone'])) return;
    $('[data-echo="phone"]', wiz).textContent = wForm.elements.phone.value.trim();
    $('[data-echo="address"]', wiz).textContent = wForm.elements.address.value.trim();
    go(4); $('.wiz-fine', wiz).hidden = true;
  });
  go(1, false);
  window.__wiz = go;

  /* ================= reveals ================= */
  if (!reduce) {
    const els = $$('.rs-head, .ba-head, .ba, .work-head, .svc-head, .rv-head, .book-copy, .wiz, .faq-cols');
    els.forEach((el, i) => { el.classList.add('rv-in'); el.style.transitionDelay = `${(i % 3) * 80}ms`; });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }
})();
