/* ------------------------------------------------------------------ *
 * Animations: how the techniques actually work, step by step.
 *
 * Each animation is a list of labelled stages and a frame(k, p) function
 * that draws stage k at progress p (0 to 1). Everything on screen is
 * computed from (k, p) alone, never accumulated from the previous frame, so
 * stepping backwards, jumping to a stage or scrubbing always shows exactly
 * what that moment should look like.
 *
 * The player respects prefers-reduced-motion: it does not autoplay, and each
 * stage is shown at its end state, which is the whole point of that stage.
 *
 * The animations themselves live in anim_seq.js, anim_pcr.js,
 * anim_micro.js and anim_rep.js, each of which calls Anim.add().
 * ------------------------------------------------------------------ */
'use strict';

const Anim = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const LIB = [];                  // in the order they are added
  const W = 360, H = 240;          // every stage is drawn in this box
  const reduced = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The player runs in the app and on the website, so it carries its own
  // DOM helper and only plays sounds where the app's Sfx exists.
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const tap = () => { if (typeof Sfx !== 'undefined') Sfx.tap(); };
  const turn = () => { if (typeof Sfx !== 'undefined') Sfx.page(); };

  // ---------------------------------------------------------------- kit
  /* Shared drawing helpers, handed to every animation. */
  const kit = {
    W, H,
    el(tag, attrs, parent) {
      const e = document.createElementNS(NS, tag);
      for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
      if (parent) parent.append(e);
      return e;
    },
    text(parent, x, y, s, attrs) {
      const t = kit.el('text', Object.assign({ x, y, 'font-size': 11,
        fill: '#1B2430', 'text-anchor': 'middle',
        'dominant-baseline': 'middle' }, attrs || {}), parent);
      t.textContent = s;
      return t;
    },
    set(e, attrs) { for (const k in attrs) e.setAttribute(k, attrs[k]); return e; },
    show(e, on) { e.style.display = on ? '' : 'none'; return e; },
    lerp: (a, b, t) => a + (b - a) * t,
    clamp: (t, a = 0, b = 1) => Math.max(a, Math.min(b, t)),
    ease: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    // progress of a sub-interval [a, b] within p, clamped to 0..1
    seg(p, a, b) { return kit.clamp((p - a) / (b - a)); },
    // an arrow whose ends can be moved: kit.arrow(g, '#333', 2).to(x1, y1, x2, y2)
    arrow(parent, colour, width) {
      const g = kit.el('g', null, parent);
      const ln = kit.el('line', { stroke: colour, 'stroke-width': width || 2,
                                  'stroke-linecap': 'round' }, g);
      const hd = kit.el('path', { fill: colour }, g);
      const hs = 4 + (width || 2) * 1.6;
      const o = {
        g,
        to(x1, y1, x2, y2) {
          const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a);
          kit.set(ln, { x1, y1, x2: x2 - c * hs * 0.8, y2: y2 - s * hs * 0.8 });
          const bx = x2 - c * hs, by = y2 - s * hs;
          kit.set(hd, { d: `M ${x2} ${y2} L ${bx + s * hs * 0.55} ${by - c * hs * 0.55} `
                         + `L ${bx - s * hs * 0.55} ${by + c * hs * 0.55} Z` });
          return o;
        }
      };
      return o;
    },
    // path data for a sine wave from x0 to x1 about y
    wave(x0, x1, y, amp, lam, ph) {
      let d = '';
      for (let x = x0; x <= x1 + 0.01; x += 2) {
        const yy = y - amp * Math.sin(2 * Math.PI * (x - x0) / lam + (ph || 0));
        d += (d ? ' L ' : 'M ') + x.toFixed(1) + ' ' + yy.toFixed(1);
      }
      return d;
    },
    // a biconvex lens, drawn edge-on; vertical unless told otherwise
    lens(parent, cx, cy, half, horizontal) {
      return kit.el('ellipse', { cx, cy, rx: horizontal ? half : 5,
        ry: horizontal ? 5 : half, fill: '#D6E8FA', stroke: '#6C9BD2',
        'stroke-width': 1.5 }, parent);
    },
    BASE: { A: '#2E9E5B', C: '#2C6FD1', G: '#2A2A2A', T: '#D64545' },
    INK: '#1B2430', MUTED: '#6B7280', LINE: '#C9CEDA',
    INDIGO: '#3B3FB6', TEAL: '#0E8C8C', GREEN: '#2FB36B', AMBER: '#D99A1A',
    RED: '#D64545', BLUE: '#2C6FD1', PALE: '#EEF0FA'
  };

  function add(spec) { LIB.push(spec); }
  function byId(id) { return LIB.find(a => a.id === id); }

  // ------------------------------------------------------------- layer
  let L = null, cur = null, raf = 0;
  let inline = false;          // true on the website: drawn in the page

  function layer() {
    if (L) return L;
    L = document.getElementById('anim');
    if (!L) {
      L = document.createElement('div');
      L.id = 'anim';
      L.className = 'layer';
      L.hidden = true;
      document.body.append(L);
    }
    return L;
  }

  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  // Keep the address in step with what is open, so a link can be shared.
  // Opened from an email attachment the page is a file, where some browsers
  // refuse to rewrite history; the player works the same without it.
  function setHash(id) {
    try {
      history.replaceState(null, '', id ? '#' + id : location.pathname + location.search);
    } catch (e) { /* a file: page; nothing to do */ }
  }

  function close() {
    stop();
    cur = null;
    if (inline) { gallery(); return; }
    layer().hidden = true;
    const c = document.getElementById('course');
    if (!c || c.hidden) document.body.classList.remove('modal');
  }

  function isOpen() { return L && !L.hidden; }

  function bar(title, sub, onBack) {
    // The same header the course pages use (rbar + mc-bar). Not 'bar',
    // which is the forecast chart's column on Home.
    const b = el('header', 'rbar mc-bar an-bar');
    if (onBack) {
      const x = el('button', 'x', inline ? '\u2190' : '\u00D7');
      x.setAttribute('aria-label', inline ? 'All animations' : 'Close');
      x.addEventListener('click', () => { tap(); onBack(); });
      b.append(x);
    }
    const t = el('div', 'mc-bartext');
    t.append(el('b', null, title));
    if (sub) t.append(el('span', null, sub));
    b.append(t);
    return b;
  }

  /* ----------------------------------------------------------- gallery */
  const GROUPS = [['seq', 'Sequencing'], ['pcr', 'PCR'],
                  ['micro', 'Microscopes'], ['rep', 'Reporter genes'],
                  ['edit', 'Gene editing'], ['lab', 'Lab skills']];

  function gallery() {
    stop();
    cur = null;
    const root = layer();
    root.hidden = false;
    if (!inline) document.body.classList.add('modal');
    root.innerHTML = '';
    root.append(bar('See it work', `${LIB.length} animations`, inline ? null : close));
    if (inline) setHash('');
    const body = el('div', 'rbody');
    const sheet = el('div', 'rsheet');
    // the website's page already says this above the player
    if (!inline) sheet.append(el('p', 'sub an-intro',
      'Each one plays a technique in labelled stages. Pause on any stage, '
      + 'step back and forth, or tap a stage to jump straight to it.'));
    GROUPS.forEach(([g, name]) => {
      const items = LIB.filter(a => a.group === g);
      if (!items.length) return;
      sheet.append(el('h2', 'lsec', name));
      items.forEach(a => {
        const b = el('button', 'an-item');
        b.dataset.g = g;
        const t = el('span', 'an-item-t');
        t.append(el('b', null, a.title), el('span', null, a.sub));
        b.append(t, el('span', 'an-item-n', `${a.steps.length} stages`));
        b.addEventListener('click', () => { turn(); play(a.id, true); });
        sheet.append(b);
      });
    });
    body.append(sheet);
    root.append(body);
  }

  /* ------------------------------------------------------------ player */
  function play(id, fromGallery) {
    const a = byId(id);
    if (!a) return;
    stop();
    const root = layer();
    root.hidden = false;
    if (!inline) document.body.classList.add('modal');
    root.innerHTML = '';
    const back = fromGallery || inline ? gallery : close;
    if (inline) {
      setHash(id);
      root.scrollIntoView({ block: 'start' });
    }
    root.append(bar(a.title, a.groupName || '', back));

    const body = el('div', 'rbody');
    const sheet = el('div', 'rsheet');
    const stage = el('div', 'an-stage');
    const svg = kit.el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img',
                                'aria-label': a.title });
    stage.append(svg);
    sheet.append(stage);

    const cap = el('section', 'an-cap');
    const capK = el('p', 'an-k');
    const capH = el('h3', 'an-h');
    const capP = el('p', 'an-p');
    cap.append(capK, capH, capP);

    const ctl = el('div', 'an-ctl');
    const prev = el('button', 'an-btn', '◀');
    prev.setAttribute('aria-label', 'Previous stage');
    const pp = el('button', 'an-btn an-play', '❚❚');
    pp.setAttribute('aria-label', 'Pause');
    const next = el('button', 'an-btn', '▶');
    next.setAttribute('aria-label', 'Next stage');
    ctl.append(prev, pp, next);
    sheet.append(ctl);

    const dots = el('div', 'an-dots');
    a.steps.forEach((s, i) => {
      const d = el('button', 'an-dot');
      d.setAttribute('aria-label', `Stage ${i + 1}: ${s[0]}`);
      d.append(el('span', null, String(i + 1)));
      d.addEventListener('click', () => { go(i, reduced ? 1 : 0); setPlaying(!reduced); });
      dots.append(d);
    });
    // how far through this stage, reading time included
    const prog = el('div', 'an-prog');
    const progFill = el('i');
    prog.append(progFill);
    sheet.append(prog, dots, cap);
    if (a.note) sheet.append(el('p', 'sub an-note', a.note));

    body.append(sheet);
    root.append(body);

    // Drawing state lives on a fresh object for each play, which inherits
    // the spec's helpers but cannot overwrite its title, sub or steps.
    const st = Object.create(a);
    const g = kit.el('g', null, svg);
    a.init.call(st, g, kit);

    let k = 0, p = 0, playing = !reduced, last = 0, hold = 0;
    // Each stage plays at half again its listed length, then holds its last
    // frame until there has been time to read the explanation, at about
    // three words a second.
    const PACE = 1.5;
    const runTime = i => (a.steps[i][2] || 4) * PACE;
    const holdTime = i => {
      const words = a.steps[i][1].split(/\s+/).length;
      return Math.max(2.5, words / 3 + 1.5 - runTime(i));
    };
    cur = { a, seek: (i, q) => { setPlaying(false); go(i, q); } };

    function draw() {
      a.frame.call(st, k, p);
      capK.textContent = `Stage ${k + 1} of ${a.steps.length}`;
      capH.textContent = a.steps[k][0];
      capP.textContent = a.steps[k][1];
      [...dots.children].forEach((d, i) => {
        d.classList.toggle('on', i === k);
        d.classList.toggle('done', i < k);
      });
      prev.disabled = k === 0 && p === 0;
      const total = runTime(k) + holdTime(k);
      progFill.style.width = Math.min(100, 100 * (p * runTime(k) + hold) / total) + '%';
    }
    function go(i, q) {
      k = Math.max(0, Math.min(a.steps.length - 1, i));
      p = q;
      hold = 0;
      draw();
    }
    function setPlaying(on) {
      playing = on;
      pp.textContent = on ? '❚❚' : '▶';
      pp.setAttribute('aria-label', on ? 'Pause' : 'Play');
      pp.classList.toggle('paused', !on);
      stop();
      if (on) { last = 0; raf = requestAnimationFrame(tick); }
    }
    function tick(ts) {
      if (!cur || cur.a !== a) return;
      if (!last) last = ts;
      const dt = Math.min(0.1, (ts - last) / 1000);
      last = ts;
      if (p < 1) {
        p = Math.min(1, p + dt / runTime(k));
      } else {
        hold += dt;
        if (hold >= holdTime(k)) {
          if (k < a.steps.length - 1) { k += 1; p = 0; hold = 0; }
          else { hold = holdTime(k); draw(); setPlaying(false); return; }
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    prev.addEventListener('click', () => {
      tap();
      if (p > 0.05 && !reduced) go(k, 0); else go(k - 1, reduced ? 1 : 0);
    });
    next.addEventListener('click', () => {
      tap();
      if (k < a.steps.length - 1) go(k + 1, reduced ? 1 : 0); else go(k, 1);
    });
    pp.addEventListener('click', () => {
      tap();
      if (!playing && k === a.steps.length - 1 && p >= 1) go(0, 0);   // replay
      setPlaying(!playing);
    });

    go(0, reduced ? 1 : 0);
    setPlaying(!reduced);
  }

  // seek pauses and shows stage i at progress q (used by tests and reviews)
  function seek(i, q) { if (cur) cur.seek(i, q); }

  // On the website the player lives inside the page rather than over it.
  // A link to page.html#sanger opens that animation directly.
  function mount(node) {
    L = node;
    inline = true;
    L.hidden = false;
    const id = decodeURIComponent(location.hash.slice(1));
    if (byId(id)) play(id); else gallery();
  }

  return { add, gallery, play, close, isOpen, seek, mount, list: () => LIB.slice(), kit };
})();
