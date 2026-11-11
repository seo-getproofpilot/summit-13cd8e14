/* Summit Solutions — concept redesign */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------- nav + mobile bar ---------------- */
  const nav = $('#nav'), mbar = $('.mbar'), film = $('.film');
  const onScrollChrome = () => {
    const past = scrollY > film.offsetHeight - innerHeight * 1.05;
    nav.classList.toggle('solid', scrollY > 40 && past);
    mbar.classList.toggle('show', past);
  };
  addEventListener('scroll', onScrollChrome, { passive: true });
  onScrollChrome();

  /* ---------------- hero film (scroll-scrubbed) ---------------- */
  // Timeline (seconds in the encoded film) and the story beats.
  // Segments: hold = scroll with the frame parked, play = scroll drives time.
  const T = window.__FILM || { dur: 26.0, stops: [0, 7.02, 13.02, 19.02, 24.4] };
  const segs = [];
  const HOLD = [0.9, 0.55, 0.55, 0.7, 0.9]; // scroll weight of each held beat
  T.stops.forEach((t, i) => {
    segs.push({ hold: true, t, w: HOLD[i], beat: i });
    if (i < T.stops.length - 1) segs.push({ hold: false, a: t, b: T.stops[i + 1], w: (T.stops[i + 1] - t) / 6.2, beat: i });
  });
  const totalW = segs.reduce((s, x) => s + x.w, 0);

  const vid = $('.film-vid'), intro = $('.film-intro');
  const chaps = $$('.chap'), railSpans = $$('.film-rail span'), rail = $('.film-rail');
  const small = matchMedia('(max-width: 760px)').matches;
  vid.src = `assets/video/${small ? 'film-m' : 'film-d'}.mp4?v=a00fd1b8`;
  let ready = false, target = 0, shown = 0, seeking = false;
  vid.addEventListener('loadeddata', () => { ready = true; vid.classList.add('ready'); });
  vid.addEventListener('seeked', () => { seeking = false; });
  // iOS needs a gesture before it decodes frames for seeking
  const prime = () => { vid.play().then(() => vid.pause()).catch(() => {}); removeEventListener('touchstart', prime); };
  addEventListener('touchstart', prime, { passive: true });

  function filmState() {
    const r = film.getBoundingClientRect();
    const p = clamp(-r.top / (film.offsetHeight - innerHeight), 0, 1);
    let w = p * totalW, t = 0, beat = 0, within = 0, hold = false;
    for (const s of segs) {
      if (w <= s.w || s === segs[segs.length - 1]) {
        const f = clamp(w / s.w, 0, 1);
        if (s.hold) { t = s.t; beat = s.beat; within = f; hold = true; }
        else { t = s.a + (s.b - s.a) * f; beat = f < 0.5 ? s.beat : s.beat + 1; within = -1; }
        break;
      }
      w -= s.w;
    }
    return { p, t, beat, hold };
  }

  let lastBeat = -1;
  function tick() {
    const st = filmState();
    target = st.t;
    // intro shows on the first held beat, chapters take over after
    const introOn = st.p < 0.035;
    intro.style.opacity = introOn ? 1 : 0;
    intro.style.transform = introOn ? 'none' : 'translateY(-20px)';
    intro.style.pointerEvents = introOn ? 'auto' : 'none';
    intro.style.transition = 'opacity .45s, transform .55s';
    const beat = introOn ? -1 : st.beat;
    if (beat !== lastBeat) {
      chaps.forEach((c, i) => c.classList.toggle('on', i === beat));
      railSpans.forEach((s, i) => s.classList.toggle('on', i <= Math.max(beat, 0)));
      lastBeat = beat;
    }
    rail.style.setProperty('--p', st.p.toFixed(4));

    // ease the playhead toward the scroll target
    shown += (target - shown) * (reduce || window.__instant ? 1 : 0.14);
    // held beats park on the exact crisp keyframe that ends each clip
    if (Math.abs(target - shown) < (st.hold ? 0.09 : 0.004)) shown = target;
    if (ready && !seeking && !window.__instant && Math.abs(vid.currentTime - shown) > 1 / 96) {
      seeking = true;
      if (vid.fastSeek && Math.abs(vid.currentTime - shown) > 2) vid.fastSeek(shown); else vid.currentTime = shown;
      setTimeout(() => { seeking = false; }, 120);
    }
    requestAnimationFrame(tick);
  }
  chaps.forEach((c, i) => c.querySelector('.chap-k').dataset.n = `0${i + 1}`);
  requestAnimationFrame(tick);
  window.__film = { filmState, segs, totalW };

  /* ---------------- territory map ---------------- */
  async function drawMap() {
    const svg = d3.select('#map');
    if (!window.d3 || !window.topojson) return;
    let us;
    try { us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json'); } catch (e) { return; }
    const states = topojson.feature(us, us.objects.states).features;
    const ON = { '48': 'Texas', '40': 'Oklahoma', '12': 'Florida' };
    const frameIds = ['48', '40', '12', '22', '05', '20', '35', '28', '01', '13'];
    const frame = { type: 'FeatureCollection', features: states.filter(f => ['48', '40', '12'].includes(f.id)) };
    const proj = d3.geoAlbers().rotate([92, 0]).center([0, 31]).parallels([27, 36]);
    proj.fitExtent([[20, 30], [880, 620]], frame);
    const path = d3.geoPath(proj);

    const defs = svg.append('defs');
    const pat = defs.append('pattern').attr('id', 'hailFill').attr('width', 7).attr('height', 7).attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(35)');
    pat.append('rect').attr('width', 2).attr('height', 7).attr('fill', 'rgba(199,208,218,.16)');
    defs.append('clipPath').attr('id', 'land').selectAll('path').data(states).join('path').attr('d', path);

    svg.append('g').selectAll('path').data(states).join('path')
      .attr('class', d => 'st' + (ON[d.id] ? ' on' : '')).attr('d', path);

    // Hail Alley: the band from the Texas Panhandle up through Oklahoma and the plains
    const hail = [[-104.2, 31.2], [-100.2, 30.6], [-96.4, 32.2], [-95.0, 36.4], [-96.0, 41.5], [-101.5, 42.5], [-104.6, 38.5]];
    svg.append('path').attr('class', 'hail').attr('clip-path', 'url(#land)')
      .attr('d', 'M' + hail.map(c => proj(c).join(',')).join('L') + 'Z');
    const hl = proj([-101.6, 36.9]);
    svg.append('text').attr('class', 'hail-lab').attr('x', hl[0]).attr('y', hl[1]).attr('text-anchor', 'middle').text('HAIL ALLEY');

    // state labels
    const lab = { '48': [-99.3, 30.6], '40': [-97.4, 35.4], '12': [-81.6, 27.6] };
    Object.entries(lab).forEach(([id, c]) => {
      const p = proj(c);
      svg.append('text').attr('class', 'st-lab').attr('x', p[0]).attr('y', p[1]).attr('text-anchor', 'middle').text(ON[id]);
    });
    // South Florida service bracket
    const sf = proj([-80.4, 26.0]);
    svg.append('text').attr('class', 'city').attr('x', sf[0] - 6).attr('y', sf[1] + 26).attr('text-anchor', 'end').text('SOUTH FLORIDA');

    // cities served
    [['Houston', -95.37, 29.76], ['Oklahoma City', -97.52, 35.47], ['Tulsa', -95.99, 36.15], ['Miami', -80.19, 25.76]].forEach(([n, x, y]) => {
      const p = proj([x, y]);
      svg.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 2.6).attr('fill', '#c7d0da');
      svg.append('text').attr('class', 'city').attr('x', p[0] + 7).attr('y', p[1] + 4).text(n);
    });

    // offices
    const offices = [['The Colony', -96.89, 33.09, 1], ['Austin', -97.74, 30.27, 1], ['Midland', -102.08, 31.997, -1]];
    const g = svg.append('g');
    offices.forEach(([n, x, y, side], i) => {
      const p = proj([x, y]);
      const o = g.append('g').attr('transform', `translate(${p[0]},${p[1]})`);
      o.append('circle').attr('class', 'office-ring').attr('r', 9).style('animation-delay', `${i * .7}s`);
      o.append('circle').attr('class', 'office-dot').attr('r', 6);
      o.append('text').attr('class', 'office-lab').attr('x', side * 14).attr('y', 6).attr('text-anchor', side > 0 ? 'start' : 'end').text(n);
    });
  }
  const mapIO = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { mapIO.disconnect(); drawMap(); } }, { rootMargin: '400px' });
  mapIO.observe($('#map'));

  /* ---------------- roof system ---------------- */
  const pins = $$('.pin'), layers = $$('.sys-list li');
  const setLayer = l => {
    pins.forEach(p => p.classList.toggle('on', p.dataset.l === l));
    layers.forEach(li => li.classList.toggle('on', li.dataset.l === l));
  };
  pins.forEach(p => p.addEventListener('click', () => setLayer(p.dataset.l)));
  layers.forEach(li => {
    li.addEventListener('click', () => setLayer(li.dataset.l));
    li.addEventListener('mouseenter', () => setLayer(li.dataset.l));
  });
  setLayer('7');
  // auto-walk the layers once when the section scrolls in
  let walked = false;
  new IntersectionObserver((es, io) => {
    if (walked || !es[0].isIntersecting || reduce) return;
    walked = true; io.disconnect();
    let l = 7;
    const step = () => { if (--l >= 1) { setLayer(String(l)); setTimeout(step, 900); } else setTimeout(() => setLayer('6'), 900); };
    setTimeout(step, 900);
  }, { threshold: .45 }).observe($('.sys-body'));

  /* ---------------- services index ---------------- */
  const svcFig = $('.svc-fig img'), svcItems = $$('.svc-list li');
  svcItems.forEach(li => {
    const on = () => {
      svcItems.forEach(x => x.classList.toggle('is-on', x === li));
      if (svcFig && svcFig.getAttribute('src') !== li.dataset.img) {
        svcFig.style.opacity = 0;
        const im = new Image(); im.src = li.dataset.img;
        im.onload = () => { svcFig.src = li.dataset.img; svcFig.style.opacity = 1; };
      }
    };
    li.addEventListener('mouseenter', on);
    li.addEventListener('focusin', on);
  });

  /* ---------------- testimonial videos: one at a time ---------------- */
  const rvs = $$('.rv video');
  rvs.forEach(v => v.addEventListener('play', () => rvs.forEach(o => o !== v && o.pause())));

  /* ---------------- booking form (concept: no submission) ---------------- */
  const form = $('#bookForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', form).forEach(i => {
      const bad = !i.value.trim();
      i.classList.toggle('bad', bad);
      if (bad && ok) { i.focus(); ok = false; }
    });
    if (!ok) return;
    $('.form-done', form).hidden = false;
    $('button[type=submit]', form).disabled = true;
  });

  /* ---------------- reveals ---------------- */
  if (!reduce) {
    const els = $$('.h-xl, .lede, .hit, .pair, .fw, .proc-track li, .rv, .rev-quotes blockquote, .terr-offices div, .plate-list li');
    els.forEach((el, i) => { el.classList.add('rv-in'); el.style.transitionDelay = `${(i % 4) * 70}ms`; });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }
})();
