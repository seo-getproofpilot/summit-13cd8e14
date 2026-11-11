/* Summit Solutions — concept redesign v2 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, el.offsetHeight - innerHeight), 0, 1); };

  const nav = $('#nav'), mbar = $('.mbar'), film = $('.film');

  /* ================= HERO: cover → intro → film ================= */
  const T = window.__FILM || { stops: [0, 7.02, 13.02, 19.02, 24.4] };
  const segs = [{ hold: true, t: 0, w: 1.15, beat: -2, cover: true }, { hold: true, t: 0, w: .75, beat: -1 }];
  const HOLD = [0.9, 0.55, 0.55, 0.7, 0.9];
  T.stops.forEach((t, i) => {
    segs.push({ hold: true, t, w: HOLD[i], beat: i });
    if (i < T.stops.length - 1) segs.push({ hold: false, a: t, b: T.stops[i + 1], w: (T.stops[i + 1] - t) / 6.2, beat: i });
  });
  const totalW = segs.reduce((s, x) => s + x.w, 0);

  function filmState() {
    const p = prog(film);
    let w = p * totalW; const out = { p, t: 0, beat: 0, hold: false, cover: 1 };
    for (const s of segs) {
      if (w <= s.w || s === segs[segs.length - 1]) {
        const f = clamp(w / s.w, 0, 1);
        if (s.hold) { out.t = s.t; out.beat = s.beat; out.hold = true; if (s.cover) out.cover = f; }
        else { out.t = s.a + (s.b - s.a) * f; out.beat = f < 0.5 ? s.beat : s.beat + 1; }
        break;
      }
      w -= s.w;
    }
    return out;
  }

  const vid = $('.film-vid'), intro = $('.film-intro');
  const chaps = $$('.chap'), railSpans = $$('.film-rail span'), rail = $('.film-rail');
  const small = matchMedia('(max-width: 760px)').matches;
  vid.src = `assets/video/${small ? 'film-m' : 'film-d'}.mp4?v=ba077d85`;
  let ready = false, shown = 0, seeking = false;
  vid.addEventListener('loadeddata', () => { ready = true; vid.classList.add('ready'); });
  vid.addEventListener('seeked', () => { seeking = false; });
  const prime = () => { vid.play().then(() => vid.pause()).catch(() => {}); removeEventListener('touchstart', prime); };
  addEventListener('touchstart', prime, { passive: true });
  chaps.forEach((c, i) => c.querySelector('.chap-k').dataset.n = `0${i + 1}`);

  // Summit cover: their mark + wordmark cut out of a navy plate, zooming through the blue peak
  const cover = $('.cover'), coverGs = $$('.cover-g'), coverSolid = $('.cover-solid'), coverFill = $('.cover-fill'), hint = $('.cover-hint');
  const O = { x: 117.3, y: 81.5 }, GC = { x: 96, y: 93 };
  function drawCover(k) {
    if (k >= 1) { cover.style.display = 'none'; hint.style.opacity = 0; return; }
    cover.style.display = '';
    const vw = innerWidth, vh = innerHeight;
    const s0 = Math.min(vw * (vw < 760 ? .72 : vw < 1080 ? .38 : .4), vh * (vw < 760 ? .42 : .56) * 192 / 186) / 192;
    const e = ease(clamp(k / .9, 0, 1));
    const s = s0 * Math.pow(90, e);
    const cx0 = vw >= 760 ? vw * (vw >= 1080 ? .36 : .3) : vw / 2, cy0 = vw < 760 ? vh * .36 : vh / 2;
    const p0x = cx0 + (O.x - GC.x) * s0, p0y = cy0 + (O.y - GC.y) * s0;
    const px = lerp(p0x, vw / 2, e), py = lerp(p0y, vh * .5, e);
    const tf = `translate(${px.toFixed(2)} ${py.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-O.x} ${-O.y})`;
    coverGs.forEach(g => g.setAttribute('transform', tf));
    coverSolid.style.opacity = clamp(1 - k * 3.2, 0, 1);
    coverFill.style.opacity = clamp((1 - k) * 6, 0, 1);
    hint.style.opacity = clamp(1 - k * 6, 0, 1);
  }
  addEventListener('resize', () => { lastCover = -1; });

  const coverForm = $('.cover-form');
  let lastBeat = 99, lastCover = -1;
  function heroTick() {
    const st = filmState();
    if (st.cover !== lastCover) { drawCover(st.cover); lastCover = st.cover; }
    coverForm.classList.toggle('gone', !(st.beat === -2 && st.cover < .025) || scrollY > film.offsetHeight);
    const introOn = st.beat === -1 || (st.beat === -2 && st.cover > .8);
    intro.style.opacity = introOn ? 1 : 0;
    intro.style.transform = introOn ? 'none' : 'translateY(18px)';
    intro.style.pointerEvents = introOn ? 'auto' : 'none';
    intro.style.transition = 'opacity .5s, transform .6s';
    const beat = st.beat < 0 ? -1 : st.beat;
    if (beat !== lastBeat) {
      chaps.forEach((c, i) => c.classList.toggle('on', i === beat));
      railSpans.forEach((s, i) => s.classList.toggle('on', i <= Math.max(beat, 0)));
      lastBeat = beat;
    }
    rail.style.opacity = st.beat === -2 ? 0 : 1;
    const pre = segs[0].w + segs[1].w;
    rail.style.setProperty('--p', clamp((st.p * totalW - pre) / (totalW - pre), 0, 1).toFixed(4));

    shown += (st.t - shown) * (reduce || window.__instant ? 1 : 0.14);
    if (Math.abs(st.t - shown) < (st.hold ? 0.09 : 0.004)) shown = st.t;
    if (ready && !seeking && !window.__instant && Math.abs(vid.currentTime - shown) > 1 / 96) {
      seeking = true;
      if (vid.fastSeek && Math.abs(vid.currentTime - shown) > 2) vid.fastSeek(shown); else vid.currentTime = shown;
      setTimeout(() => { seeking = false; }, 120);
    }
    const pastFilm = scrollY > film.offsetHeight - innerHeight * 1.05;
    nav.classList.toggle('hide', st.cover < 1 && scrollY < film.offsetHeight);
    nav.classList.toggle('solid', pastFilm);
    mbar.classList.toggle('show', pastFilm);
  }
  window.__film = { filmState, segs, totalW };

  /* ================= LAYERS: the roof lifts apart (scroll-scrubbed) ================= */
  const lay = $('.layers'), lvid = $('.lc-vid'), lItems = $$('.lay-list li'), lPins = $('.lc-pins'), lPinEls = $$('.lc-pins span');
  lvid.src = `assets/video/${small ? 'layers-m' : 'layers-d'}.mp4?v=1`;
  let lReady = false, lShown = 0, lSeek = false;
  lvid.addEventListener('loadeddata', () => { lReady = true; lvid.classList.add('ready'); });
  lvid.addEventListener('seeked', () => { lSeek = false; });
  // seconds in the clip where each layer is the one lifting
  const LDUR = 6.96, LWIN = [[.7, 1.65], [1.65, 2.45], [2.45, 3.25], [3.25, 3.95], [3.95, 4.65], [4.65, 99]];
  let lLast = -2;
  function layersTick() {
    const r = lay.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
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
      lItems.forEach((li, i) => { li.classList.toggle('on', i === act); li.classList.toggle('seen', lShown >= LWIN[i][0] - .01); });
      lPinEls.forEach((s, i) => s.classList.toggle('on', i === act));
      lLast = act;
    }
    if (p > .86) lItems.forEach(li => li.classList.add('seen'));
    lPins.classList.toggle('show', lShown > LDUR - .5);
  }
  window.__layers = { vid: lvid, state: () => ({ t: lShown, p: prog(lay) }) };
  // once the stack has settled, hovering a pin or a list item highlights that layer
  const pinOn = i => { lItems.forEach((li, j) => li.classList.toggle('on', j === i)); lPinEls.forEach((s, j) => s.classList.toggle('on', j === i)); };
  lPinEls.forEach((s, i) => s.addEventListener('mouseenter', () => prog(lay) > .86 && pinOn(i)));
  lItems.forEach((li, i) => li.addEventListener('mouseenter', () => prog(lay) > .86 && pinOn(i)));

  /* ================= PICK YOUR ROOF ================= */
  const ROOFS = {
    charcoal: { name: 'Charcoal', sys: 'Architectural laminated shingle', war: '30-yr manufacturer + lifetime labor', for: 'Most homes, best value per square foot' },
    wood: { name: 'Weathered wood', sys: 'Architectural laminated shingle', war: '30-yr manufacturer + lifetime labor', for: 'Warm brick and stone exteriors' },
    'black-metal': { name: 'Matte black', sys: 'Standing seam metal', war: 'Manufacturer warranty + lifetime labor', for: 'Modern looks and commercial buildings' },
    galv: { name: 'Galvalume', sys: 'Standing seam metal', war: 'Manufacturer warranty + lifetime labor', for: 'Shops, barns and commercial roofs' },
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

  /* ================= REEL: SUMMIT wordmark over drone footage ================= */
  const reel = $('.reel'), reelVid = $('.reel-vid'), reelWord = $('.reel-word'), reelFill = $('.reel-fill'), reelCopy = $('.reel-copy');
  function reelLayout() {
    const vw = innerWidth, vh = innerHeight;
    reelWord.setAttribute('x', vw / 2); reelWord.setAttribute('y', vh / 2 + vw * .06);
    reelWord.setAttribute('font-size', (vw * .17).toFixed(1));
    reelWord.setAttribute('textLength', (vw * .9).toFixed(1)); reelWord.setAttribute('lengthAdjust', 'spacingAndGlyphs');
  }
  reelLayout(); addEventListener('resize', reelLayout);
  function reelTick() {
    const r = reel.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { if (!reelVid.paused) reelVid.pause(); return; }
    if (window.__recT != null) {          // frame-stepped recording: drive the reel by the recorder's clock
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

  /* ================= WORK: pinned horizontal track ================= */
  const work = $('.work'), track = $('.work-track');
  let trackSpan = 0;
  function workLayout() {
    trackSpan = Math.max(0, track.scrollWidth - innerWidth);
    work.style.height = `${innerHeight + trackSpan * 1.1}px`;
  }
  addEventListener('resize', workLayout); addEventListener('load', workLayout); workLayout();
  function workTick() {
    const r = work.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    track.style.transform = `translate3d(${(-prog(work) * trackSpan).toFixed(1)}px,0,0)`;
  }

  /* ================= loop ================= */
  function tick() { heroTick(); layersTick(); reelTick(); workTick(); requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  window.__tick = () => { heroTick(); layersTick(); reelTick(); workTick(); };

  /* ================= map ================= */
  async function drawMap() {
    if (!window.d3 || !window.topojson) return;
    const svg = d3.select('#map');
    let us;
    try { us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json'); } catch (e) { return; }
    const states = topojson.feature(us, us.objects.states).features;
    const ON = { '48': 'Texas', '40': 'Oklahoma', '12': 'Florida' };
    const frame = { type: 'FeatureCollection', features: states.filter(f => ON[f.id]) };
    const proj = d3.geoAlbers().rotate([92, 0]).center([0, 31]).parallels([27, 36]);
    proj.fitExtent([[20, 30], [880, 620]], frame);
    const path = d3.geoPath(proj);
    const defs = svg.append('defs');
    const pat = defs.append('pattern').attr('id', 'hailFill').attr('width', 7).attr('height', 7).attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(35)');
    pat.append('rect').attr('width', 2).attr('height', 7).attr('fill', 'rgba(199,208,218,.16)');
    defs.append('clipPath').attr('id', 'land').selectAll('path').data(states).join('path').attr('d', path);
    svg.append('g').selectAll('path').data(states).join('path').attr('class', d => 'st' + (ON[d.id] ? ' on' : '')).attr('d', path);
    const hail = [[-104.2, 31.2], [-100.2, 30.6], [-96.4, 32.2], [-95.0, 36.4], [-96.0, 41.5], [-101.5, 42.5], [-104.6, 38.5]];
    svg.append('path').attr('class', 'hail').attr('clip-path', 'url(#land)').attr('d', 'M' + hail.map(c => proj(c).join(',')).join('L') + 'Z');
    const hl = proj([-101.6, 36.9]);
    svg.append('text').attr('class', 'hail-lab').attr('x', hl[0]).attr('y', hl[1]).attr('text-anchor', 'middle').text('HAIL ALLEY');
    const lab = { '48': [-99.3, 30.6], '40': [-97.4, 35.4], '12': [-81.6, 27.6] };
    Object.entries(lab).forEach(([id, c]) => { const p = proj(c); svg.append('text').attr('class', 'st-lab').attr('x', p[0]).attr('y', p[1]).attr('text-anchor', 'middle').text(ON[id]); });
    const sf = proj([-80.4, 26.0]);
    svg.append('text').attr('class', 'city').attr('x', sf[0] - 6).attr('y', sf[1] + 26).attr('text-anchor', 'end').text('SOUTH FLORIDA');
    [['Houston', -95.37, 29.76], ['Oklahoma City', -97.52, 35.47], ['Tulsa', -95.99, 36.15], ['Miami', -80.19, 25.76]].forEach(([n, x, y]) => {
      const p = proj([x, y]);
      svg.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 2.6).attr('fill', '#c7d0da');
      svg.append('text').attr('class', 'city').attr('x', p[0] + 7).attr('y', p[1] + 4).text(n);
    });
    const g = svg.append('g');
    [['The Colony', -96.89, 33.09, 1], ['Austin', -97.74, 30.27, 1], ['Midland', -102.08, 31.997, -1]].forEach(([n, x, y, side], i) => {
      const p = proj([x, y]);
      const o = g.append('g').attr('transform', `translate(${p[0]},${p[1]})`);
      o.append('circle').attr('class', 'office-ring').attr('r', 9).style('animation-delay', `${i * .7}s`);
      o.append('circle').attr('class', 'office-dot').attr('r', 6);
      o.append('text').attr('class', 'office-lab').attr('x', side * 14).attr('y', 6).attr('text-anchor', side > 0 ? 'start' : 'end').text(n);
    });
  }
  const mapIO = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { mapIO.disconnect(); drawMap(); } }, { rootMargin: '400px' });
  mapIO.observe($('#map'));

  /* ================= inspection: chalk circles traced over the real hits ================= */
  const HITS = [[260,55,10,7],[453,50,10,7],[568,47,10,7],[372,110,10,7],[467,95,9,6],[460,123,10,7],[427,125,9,7],[200,131,11,8],[556,117,10,7],[580,140,10,7],[465,143,10,7],[660,85,9,7],[302,196,11,8],[263,213,16,13],[287,233,9,7],[452,205,10,7],[478,216,10,7],[559,187,10,7],[687,168,10,8],[718,143,9,7],[498,260,11,8],[210,285,13,8],[416,367,12,9]];
  const chalk = $('.chalk'), report = $('.report'), countEl = $('[data-count]');
  HITS.forEach(([x, y, rx, ry]) => {
    const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    e.setAttribute('cx', x); e.setAttribute('cy', y); e.setAttribute('rx', rx + 5); e.setAttribute('ry', ry + 4);
    e.setAttribute('transform', `rotate(${(x * 7) % 30 - 15} ${x} ${y})`);
    e.style.setProperty('--len', Math.ceil(2 * Math.PI * Math.max(rx, ry) + 30));
    chalk.appendChild(e);
  });
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return; io.disconnect();
    const els = $$('ellipse', chalk);
    els.forEach((e, i) => setTimeout(() => { e.classList.add('drawn'); countEl.textContent = i + 1; if (i === els.length - 1) report.classList.add('done'); }, reduce ? 0 : 220 + i * 120));
  }, { threshold: .45 }).observe(report);

  /* ================= services: expanding panels ================= */
  const pns = $$('.pn');
  pns.forEach(pn => {
    const on = () => pns.forEach(o => o.classList.toggle('on', o === pn));
    pn.addEventListener('mouseenter', on); pn.addEventListener('focusin', on);
    pn.addEventListener('click', e => { if (!pn.classList.contains('on')) { e.preventDefault(); on(); } });
  });

  /* ================= testimonials: featured player + thumbnails ================= */
  const rvMain = $('.rv-main video'), rvts = $$('.rvt');
  rvts.forEach(b => b.addEventListener('click', () => {
    rvts.forEach(o => o.classList.toggle('on', o === b));
    rvMain.pause(); rvMain.poster = b.dataset.poster; rvMain.src = b.dataset.src; rvMain.play().catch(() => {});
  }));

  /* ================= booking form (concept: no submission) ================= */
  $$('#bookForm, .cf').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', form).forEach(i => { const bad = !i.value.trim(); i.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) return;
    $('.form-done, .cf-done', form).hidden = false;
    $('button[type=submit]', form).disabled = true;
  }));

  /* ================= reveals ================= */
  if (!reduce) {
    const els = $$('.proof .h-xl, .territory .h-xl, .services .h-xl, .reviews .h-xl, .book .h-xl, .lede, .pair, .std-steps li, .std-facts li, .rev-more blockquote, .terr-offices div');
    els.forEach((el, i) => { el.classList.add('rv-in'); el.style.transitionDelay = `${(i % 4) * 70}ms`; });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }
})();
