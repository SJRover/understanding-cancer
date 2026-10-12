/* Microscope animations: bright field, phase contrast, DIC,
   epifluorescence and confocal. Content follows the SL50168 Techniques 2
   microscopy section. Optics are drawn as schematics: the light paths are
   right in kind, not to scale. */
'use strict';

(() => {
  const K = Anim.kit;
  const { el, text, set, show, lerp, seg, ease } = K;
  const LIGHT = '#F4C430', PURPLE = '#7B3FB6';
  const pts = a => a.map(p => p.join(',')).join(' ');
  // a polyline drawn as far as fraction f of its length
  function partial(points, f) {
    const L = [];
    let tot = 0;
    for (let i = 1; i < points.length; i++) {
      const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      L.push(d); tot += d;
    }
    let left = tot * K.clamp(f), d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length && left > 0; i++) {
      const t = Math.min(1, left / L[i - 1]);
      d += ` L ${lerp(points[i - 1][0], points[i][0], t)} ${lerp(points[i - 1][1], points[i][1], t)}`;
      left -= L[i - 1];
    }
    return f > 0 ? d : '';
  }

  /* ========================================================== bright field */
  Anim.add({
    id: 'brightfield', group: 'micro', groupName: 'Microscopes',
    title: 'The compound light microscope',
    sub: 'Two lenses, and the limit on detail',
    steps: [
      ['Light up through the specimen',
       'In a bright-field microscope a lamp below the stage shines '
       + 'light up through the specimen. The condenser lens gathers '
       + 'that light into a cone that fills the objective, and when it '
       + 'is set up properly this gives the best resolution, even '
       + 'lighting and no glare. Most cells are nearly transparent, so '
       + 'they are usually stained to give enough contrast to see.', 6],
      ['The objective makes a real image',
       'The objective lens, just above the specimen, collects the '
       + 'light and forms a magnified image inside the microscope tube.'
       + ' This image is real, meaning it could be projected onto a '
       + 'screen, and it is inverted: upside down and back to front.', 6],
      ['The eyepiece magnifies it again',
       'The eyepiece works like a magnifying glass on that image, '
       + 'enlarging it again into the virtual image you see. Because '
       + 'the image stays inverted, moving the slide one way makes the '
       + 'specimen appear to move the other way. Total magnification is'
       + ' the objective\'s multiplied by the eyepiece\'s, so a 40x '
       + 'objective with a 10x eyepiece gives 400x.', 6],
      ['Magnification is not resolution',
       'Resolution is the ability to tell two points close together '
       + 'apart, and it is limited by the wavelength of light. With '
       + 'visible light, between 400 and 700 nm, two points closer than'
       + ' about 200 nm blur into one spot however much the image is '
       + 'magnified. Enlarging a blur only gives a bigger blur, which '
       + 'is why smaller structures need an electron microscope.', 9]
    ],
    note: 'The unaided eye resolves about 0.2 mm, a light microscope '
        + 'about 200 nm and an electron microscope about 0.2 nm.',
    init(g) {
      const o = this.optics = el('g', null, g);
      this.ill = [
        el('polygon', { points: '24,112 58,84 58,140' }, o),
        el('polygon', { points: '58,84 92,112 58,140' }, o),
        el('polygon', { points: '92,112 130,90 130,134' }, o)
      ];
      this.ill.forEach(p => set(p, { fill: '#FDE68A', opacity: 0 }));
      el('line', { x1: 10, y1: 112, x2: 350, y2: 112, stroke: K.LINE,
                   'stroke-dasharray': '2 4' }, o);
      el('circle', { cx: 18, cy: 112, r: 9, fill: '#FFF3C4', stroke: K.AMBER,
                     'stroke-width': 2 }, o);
      K.lens(o, 58, 112, 34);
      el('rect', { x: 90, y: 72, width: 4, height: 80, fill: '#E8EEF8', stroke: K.LINE }, o);
      K.arrow(o, K.RED, 2.5).to(92, 112, 92, 98);
      K.lens(o, 130, 112, 30);
      K.lens(o, 280, 112, 34);
      this.eye = el('g', null, o);
      el('ellipse', { cx: 342, cy: 94, rx: 11, ry: 18, fill: '#fff', stroke: K.INK,
                      'stroke-width': 1.5 }, this.eye);
      el('circle', { cx: 339, cy: 94, r: 5, fill: K.INK }, this.eye);
      [['lamp', 18, 134], ['condenser', 58, 68], ['specimen', 92, 166],
       ['objective', 130, 74], ['eyepiece', 280, 68], ['eye', 342, 126]]
        .forEach(([s, x, y]) => text(o, x, y, s, { 'font-size': 10, fill: K.MUTED }));
      this.r1 = el('path', { fill: 'none', stroke: K.RED, 'stroke-width': 1.4 }, o);
      this.r2 = el('path', { fill: 'none', stroke: K.RED, 'stroke-width': 1.4 }, o);
      this.img = K.arrow(o, K.RED, 2.5);
      this.imgT = text(o, 230, 166, 'real, inverted image', { 'font-size': 10, fill: K.RED });
      this.r3 = el('path', { fill: 'none', stroke: K.RED, 'stroke-width': 1.4 }, o);
      this.r4 = el('path', { fill: 'none', stroke: K.RED, 'stroke-width': 1.4 }, o);
      this.objX = text(o, 130, 186, '40×', { 'font-size': 13, 'font-weight': 800, fill: K.INDIGO });
      this.eyeX = text(o, 280, 186, '10×', { 'font-size': 13, 'font-weight': 800, fill: K.INDIGO });
      this.sum = text(o, 180, 216, '40× objective × 10× eyepiece = 400×',
                      { 'font-size': 12.5, 'font-weight': 800, fill: K.INK });

      // resolution
      const r = this.res = el('g', null, g);
      const defs = el('defs', null, r);
      const gr = el('radialGradient', { id: 'an-blur' }, defs);
      [['0%', '#F0FFF4', 1], ['30%', '#86EFAC', 0.8], ['100%', '#22C55E', 0]].forEach(([o2, c, op]) =>
        el('stop', { offset: o2, 'stop-color': c, 'stop-opacity': op }, gr));
      el('rect', { x: 40, y: 32, width: 280, height: 86, rx: 8, fill: '#0F172A' }, r);
      text(r, 48, 44, 'what you see', { 'font-size': 9.5, fill: '#94A3B8', 'text-anchor': 'start' });
      this.bA = el('circle', { cy: 76, r: 44, fill: 'url(#an-blur)', style: 'mix-blend-mode:screen' }, r);
      this.bB = el('circle', { cy: 76, r: 44, fill: 'url(#an-blur)', style: 'mix-blend-mode:screen' }, r);
      text(r, 44, 138, 'brightness across the image', { 'font-size': 10, fill: K.MUTED,
                                                        'text-anchor': 'start' });
      el('line', { x1: 40, y1: 206, x2: 320, y2: 206, stroke: K.LINE }, r);
      this.prof = el('path', { fill: 'rgba(34,197,94,.15)', stroke: '#15803D', 'stroke-width': 2 }, r);
      this.tA = el('line', { y1: 208, y2: 215, stroke: K.RED, 'stroke-width': 2 }, r);
      this.tB = el('line', { y1: 208, y2: 215, stroke: K.RED, 'stroke-width': 2 }, r);
      this.dT = text(r, 180, 18, '', { 'font-size': 12, 'font-weight': 800, fill: K.INK });
      this.st = text(r, 180, 230, '', { 'font-size': 11.5, 'font-weight': 700 });
    },
    frame(k, p) {
      show(this.optics, k <= 2);
      show(this.res, k === 3);
      if (k <= 2) {
        const il = k === 0 ? p : 1;
        this.ill.forEach((poly, i) => set(poly, { opacity: 0.6 * seg(il, i * 0.3, i * 0.3 + 0.35) }));
        const e = k === 0 ? 0 : k === 1 ? ease(seg(p, 0.1, 0.85)) : 1;
        const IX = 230, IY = 112 + 34.2;
        set(this.r1, { d: partial([[92, 98], [130, 98], [IX, IY]], e) });
        set(this.r2, { d: partial([[92, 98], [IX, IY]], e) });
        show(this.img.g, e > 0.6);
        this.img.to(IX, 112, IX, lerp(112, IY, seg(e, 0.6, 1)) + 0.01);
        show(this.imgT, e >= 1);
        show(this.objX, e >= 1);
        const f = k === 2 ? ease(seg(p, 0.05, 0.75)) : 0;
        set(this.r3, { d: partial([[IX, IY], [280, 112], [328, 112 - 0.684 * 48]], f) });
        set(this.r4, { d: partial([[IX, IY], [280, IY], [328, IY - 0.684 * 48]], f) });
        show(this.eyeX, k === 2 && f > 0.5);
        show(this.sum, k === 2 && p > 0.75);
      }
      if (k === 3) {
        const d = lerp(600, 100, ease(seg(p, 0.05, 0.85)));
        const a = d * 0.2 / 2, s = 17;
        set(this.bA, { cx: 180 - a });
        set(this.bB, { cx: 180 + a });
        let path = 'M 40 206';
        for (let x = 40; x <= 320; x += 2) {
          const I = Math.exp(-((x - 180 + a) ** 2) / (2 * s * s)) + Math.exp(-((x - 180 - a) ** 2) / (2 * s * s));
          path += ` L ${x} ${(206 - 40 * I).toFixed(1)}`;
        }
        set(this.prof, { d: path + ' L 320 206 Z' });
        set(this.tA, { x1: 180 - a, x2: 180 - a });
        set(this.tB, { x1: 180 + a, x2: 180 + a });
        this.dT.textContent = `two points ${Math.round(d / 10) * 10} nm apart`;
        const [msg, col] = d >= 250 ? ['two separate points', '#15803D']
          : d >= 200 ? ['only just two: near the limit', K.AMBER]
          : ['one blur: below the limit', K.RED];
        this.st.textContent = msg;
        set(this.st, { fill: col });
      }
    }
  });

  /* ======================================================= phase contrast */
  Anim.add({
    id: 'phase', group: 'micro', groupName: 'Microscopes',
    title: 'Phase contrast',
    sub: 'Turning invisible delays into visible contrast',
    steps: [
      ['Unstained cells are nearly invisible',
       'A living cell absorbs almost no light, so in bright field it '
       + 'barely shows up. Light passing through it is slowed slightly,'
       + ' though, because the cell has a higher refractive index than '
       + 'the medium around it, and it comes out about a quarter of a '
       + 'wavelength behind light that missed the cell. Eyes and '
       + 'cameras register only brightness, not this delay, so the '
       + 'difference stays invisible.', 8],
      ['A hollow cone of light',
       'Phase contrast starts with an annular ring in the condenser, '
       + 'which lets only a ring of light through and so lights the '
       + 'specimen with a hollow cone. Light that misses the specimen '
       + 'carries straight on and is called direct light. Light that '
       + 'interacts with the specimen is scattered into a wider spread '
       + 'and is called diffracted light.', 7],
      ['The phase plate',
       'Inside the objective is a phase plate with a ring that lines '
       + 'up exactly with the direct light from the annulus. The ring '
       + 'shifts the direct light by a further quarter of a wavelength '
       + 'and dims it, so it does not swamp the weaker diffracted '
       + 'light. The diffracted light is spread out, so most of it '
       + 'passes beside the ring and is unchanged.', 6],
      ['Interference makes contrast',
       'When the direct and diffracted light recombine to form the '
       + 'image, they are now half a wavelength out of step, so they '
       + 'partly cancel each other out. The specimen therefore looks '
       + 'dark against a bright background. A difference in phase that '
       + 'the eye could not see has become a difference in brightness '
       + 'that it can, with no stain, so living cells can be watched as'
       + ' they are.', 8]
    ],
    note: 'The bright halo around each cell is a known artefact of '
        + 'phase contrast. DIC avoids it and gives sharper edges.',
    init(g) {
      // stage 1: two waves
      this.w = el('g', null, g);
      text(this.w, 180, 40, 'through the medium only', { 'font-size': 10.5, fill: K.MUTED });
      this.wa = el('path', { fill: 'none', stroke: LIGHT, 'stroke-width': 2.5 }, this.w);
      el('ellipse', { cx: 180, cy: 150, rx: 40, ry: 30, fill: '#EDE9FE', stroke: '#A78BFA',
                      'stroke-width': 1.5 }, this.w);
      text(this.w, 180, 108, 'through a cell', { 'font-size': 10.5, fill: PURPLE });
      this.ghost = el('path', { fill: 'none', stroke: '#C9CEDA', 'stroke-width': 2,
                                'stroke-dasharray': '4 3' }, this.w);
      this.wb = el('path', { fill: 'none', stroke: LIGHT, 'stroke-width': 2.5 }, this.w);
      this.wT = text(this.w, 282, 194, 'a quarter wavelength behind', { 'font-size': 10.5,
        fill: PURPLE, 'font-weight': 700 });
      this.wT2 = text(this.w, 180, 224, 'same brightness, so the eye cannot tell',
                      { 'font-size': 10.5, fill: K.INK });

      // stages 2 and 3: the light path
      const o = this.opt = el('g', null, g);
      [[40, 66], [78, 146], [158, 184]].forEach(([a, b]) =>
        el('rect', { x: 27, y: a, width: 6, height: b - a, fill: '#4B5563' }, o));
      K.lens(o, 70, 112, 64);
      el('rect', { x: 148, y: 52, width: 4, height: 120, fill: '#E8EEF8', stroke: K.LINE }, o);
      el('ellipse', { cx: 150, cy: 112, rx: 7, ry: 14, fill: '#EDE9FE', stroke: '#A78BFA' }, o);
      K.lens(o, 210, 112, 64);
      el('rect', { x: 248, y: 44, width: 5, height: 136, fill: '#E5E7EB' }, o);
      this.rings = [66, 146].map(y => el('rect', { x: 247, y, width: 7, height: 12,
                                                    fill: PURPLE }, o));
      el('rect', { x: 334, y: 62, width: 5, height: 100, fill: '#D1D5DB' }, o);
      [['annular ring', 30, 30], ['condenser', 70, 196], ['specimen', 150, 196],
       ['objective', 210, 196], ['phase plate', 250, 30], ['image', 336, 52]]
        .forEach(([s, x, y]) => text(o, x, y, s, { 'font-size': 10, fill: K.MUTED }));
      this.dif = el('polygon', { points: pts([[150, 112], [210, 82], [210, 142]]),
                                 fill: '#22C55E', opacity: 0 }, o);
      this.dif2 = el('polygon', { points: pts([[210, 82], [210, 142], [336, 112]]),
                                  fill: '#22C55E', opacity: 0 }, o);
      this.D1 = [[6, 72], [70, 72], [150, 112], [210, 152], [250, 152], [336, 112]];
      this.D2 = [[6, 152], [70, 152], [150, 112], [210, 72], [250, 72], [336, 112]];
      this.d1 = el('path', { fill: 'none', stroke: LIGHT, 'stroke-width': 3 }, o);
      this.d2 = el('path', { fill: 'none', stroke: LIGHT, 'stroke-width': 3 }, o);
      this.d1b = el('path', { fill: 'none', stroke: '#B45309', 'stroke-width': 1.8 }, o);
      this.d2b = el('path', { fill: 'none', stroke: '#B45309', 'stroke-width': 1.8 }, o);
      this.key1 = text(o, 180, 214, '', { 'font-size': 10.5, fill: '#B45309', 'font-weight': 700 });
      this.key2 = text(o, 180, 229, '', { 'font-size': 10.5, fill: '#15803D', 'font-weight': 700 });

      // stage 4: interference and the result
      const r = this.res = el('g', null, g);
      this.s1 = el('path', { fill: 'none', stroke: '#B45309', 'stroke-width': 2.2 }, r);
      this.s2 = el('path', { fill: 'none', stroke: '#15803D', 'stroke-width': 2.2 }, r);
      this.s3 = el('path', { fill: 'none', stroke: K.INK, 'stroke-width': 2.6 }, r);
      text(r, 110, 30, 'direct light, dimmed', { 'font-size': 10.5, fill: '#B45309' });
      text(r, 110, 90, 'diffracted, half a wave out', { 'font-size': 10.5, fill: '#15803D' });
      this.s3T = text(r, 110, 152, 'together, they partly cancel: dark', { 'font-size': 10.5,
        fill: K.INK, 'font-weight': 700 });
      const thumb = (y, label, cell, halo) => {
        const t = el('g', null, r);
        el('rect', { x: 226, y, width: 116, height: 72, rx: 6, fill: '#C9CDD6' }, t);
        if (halo) el('ellipse', { cx: 284, cy: y + 36, rx: 30, ry: 22, fill: '#F1F3F7' }, t);
        el('ellipse', { cx: 284, cy: y + 36, rx: 24, ry: 17, fill: cell }, t);
        if (halo) el('ellipse', { cx: 286, cy: y + 37, rx: 8, ry: 6, fill: '#3B3F4C' }, t);
        text(t, 284, y + 86, label, { 'font-size': 10.5, fill: K.INK, 'font-weight': 700 });
        return t;
      };
      this.th1 = thumb(18, 'bright field', '#C2C6CF', false);
      this.th2 = thumb(124, 'phase contrast', '#6B7080', true);
    },
    frame(k, p) {
      show(this.w, k === 0);
      show(this.opt, k === 1 || k === 2);
      show(this.res, k === 3);
      const t = p * Math.PI * 4;
      if (k === 0) {
        set(this.wa, { d: K.wave(20, 340, 70, 12, 40, -t) });
        let d = '', gd = '';
        for (let x = 20; x <= 340; x += 2) {
          const ph = 2 * Math.PI * (x - 20) / 40 + (Math.PI / 2) * K.clamp((x - 140) / 80);
          d += (d ? ' L ' : 'M ') + x + ' ' + (150 - 12 * Math.sin(ph - t)).toFixed(1);
          if (x >= 224) {
            gd += (gd ? ' L ' : 'M ') + x + ' ' + (150 - 12 * Math.sin(2 * Math.PI * (x - 20) / 40 - t)).toFixed(1);
          }
        }
        set(this.wb, { d });
        set(this.ghost, { d: gd, opacity: seg(p, 0.3, 0.5) });
        show(this.wT, p > 0.4);
        show(this.wT2, p > 0.6);
      }
      if (k === 1 || k === 2) {
        const e = k === 1 ? ease(seg(p, 0.0, 0.55)) : 1;
        set(this.d1, { d: partial(this.D1, e) });
        set(this.d2, { d: partial(this.D2, e) });
        const f = k === 1 ? seg(p, 0.5, 0.85) : 1;
        set(this.dif, { opacity: 0.22 * f });
        set(this.dif2, { opacity: 0.22 * f });
        // stage 3: after the ring the direct light is shifted and dimmed
        const r = k === 2 ? seg(p, 0.15, 0.6) : 0;
        const after1 = this.D1.slice(4), after2 = this.D2.slice(4);
        set(this.d1b, { d: r > 0 ? partial(after1, r) : '' });
        set(this.d2b, { d: r > 0 ? partial(after2, r) : '' });
        set(this.d1, { d: partial(r > 0 ? this.D1.slice(0, 5) : this.D1, r > 0 ? 1 : e) });
        set(this.d2, { d: partial(r > 0 ? this.D2.slice(0, 5) : this.D2, r > 0 ? 1 : e) });
        const pulse = k === 2 ? 0.55 + 0.45 * Math.sin(p * Math.PI * 6) : 1;
        this.rings.forEach(rg => set(rg, { opacity: pulse }));
        this.key1.textContent = k === 1 ? (e > 0.9 ? 'yellow: direct light' : '')
          : 'phase ring: direct light shifted a quarter wave, dimmed';
        this.key2.textContent = k === 1 ? (f > 0.5 ? 'green: diffracted by the specimen' : '')
          : (p > 0.6 ? 'diffracted light misses the ring, unchanged' : '');
      }
      if (k === 3) {
        set(this.s1, { d: K.wave(20, 200, 56, 14, 40, -t) });
        set(this.s2, { d: K.wave(20, 200, 116, 10, 40, -t + Math.PI), opacity: seg(p, 0.1, 0.25) });
        set(this.s3, { d: K.wave(20, 200, 178, 4, 40, -t), opacity: seg(p, 0.3, 0.45) });
        show(this.s3T, p > 0.35);
        set(this.th1, { opacity: seg(p, 0.45, 0.6) });
        set(this.th2, { opacity: seg(p, 0.65, 0.8) });
      }
    }
  });

  /* ================================================================== DIC */
  const bump = x => {
    const u = (x - 180) / 70;
    return Math.abs(u) < 1 ? 40 * Math.pow(1 - u * u, 1.5) : 0;
  };
  Anim.add({
    id: 'dic', group: 'micro', groupName: 'Microscopes',
    title: 'DIC: differential interference contrast',
    sub: 'Two beams a hair apart, compared',
    steps: [
      ['Polarise the light',
       'DIC begins with a polariser below the condenser. Ordinary '
       + 'light vibrates in every direction, and the polariser lets '
       + 'through only the light that vibrates in one plane.', 4],
      ['Split it in two',
       'A Wollaston prism then splits the polarised light into two '
       + 'beams, polarised at right angles to each other. The beams '
       + 'travel side by side, separated by a tiny shear distance that '
       + 'is smaller than the objective can resolve, so they pass '
       + 'through neighbouring points of the specimen.', 5],
      ['Through the specimen',
       'Where the specimen is flat, both beams are slowed by the same'
       + ' amount. At an edge, where the thickness or refractive index '
       + 'changes over a short distance, one beam is delayed more than '
       + 'its neighbour.', 8],
      ['Recombine, interfere, read out',
       'A second prism recombines the two beams, and an analyser lets'
       + ' them interfere. Where the two delays were equal nothing '
       + 'changes, but where they differed the interference changes the'
       + ' brightness, so one side of each edge looks bright and the '
       + 'other dark. This gives DIC its shaded, three-dimensional look'
       + ' and the sharpest edges of bright field, phase contrast and '
       + 'DIC.', 8]
    ],
    init(g) {
      const o = this.top = el('g', null, g);
      const AY = 70;
      // the train
      this.parts = [];
      const part = () => { const p = el('g', null, o); this.parts.push(p); return p; };
      let p = part();
      el('rect', { x: 37, y: 40, width: 6, height: 60, fill: '#CBD5E1' }, p);
      for (let y = 44; y < 98; y += 6) el('line', { x1: 38, x2: 42, y1: y, y2: y + 4, stroke: '#64748B' }, p);
      text(p, 40, 114, 'polariser', { 'font-size': 10, fill: K.MUTED });
      p = part();
      el('polygon', { points: '82,44 98,44 82,96', fill: '#C7D2FE', stroke: '#818CF8' }, p);
      el('polygon', { points: '98,44 98,96 82,96', fill: '#A5B4FC', stroke: '#818CF8' }, p);
      text(p, 90, 32, 'Wollaston prism', { 'font-size': 10, fill: K.MUTED });
      p = part();
      el('ellipse', { cx: 160, cy: AY, rx: 12, ry: 22, fill: '#EDE9FE', stroke: '#A78BFA' }, p);
      text(p, 160, 114, 'specimen', { 'font-size': 10, fill: K.MUTED });
      p = part();
      el('polygon', { points: '222,44 238,44 238,96', fill: '#C7D2FE', stroke: '#818CF8' }, p);
      el('polygon', { points: '222,44 222,96 238,96', fill: '#A5B4FC', stroke: '#818CF8' }, p);
      text(p, 230, 32, 'second prism', { 'font-size': 10, fill: K.MUTED });
      p = part();
      el('rect', { x: 277, y: 40, width: 6, height: 60, fill: '#CBD5E1' }, p);
      for (let y = 46; y < 98; y += 6) el('line', { x1: 277, x2: 283, y1: y, y2: y, stroke: '#64748B' }, p);
      text(p, 280, 114, 'analyser', { 'font-size': 10, fill: K.MUTED });
      p = part();
      el('rect', { x: 332, y: 40, width: 6, height: 60, fill: '#D1D5DB' }, p);
      text(p, 335, 32, 'image', { 'font-size': 10, fill: K.MUTED });

      const beam = (x1, x2, y, c) => el('line', { x1, x2, y1: y, y2: y, stroke: c,
        'stroke-width': 3, 'stroke-linecap': 'round' }, o);
      this.b0 = beam(6, 36, AY, LIGHT);
      this.un = el('g', null, o);
      [0, 45, 90, 135].forEach(a => {
        const c = Math.cos(a * Math.PI / 180) * 7, s = Math.sin(a * Math.PI / 180) * 7;
        el('line', { x1: 20 - c, y1: AY - s, x2: 20 + c, y2: AY + s, stroke: '#B45309',
                     'stroke-width': 1.3 }, this.un);
      });
      this.b1 = beam(44, 81, AY, LIGHT);
      this.pol = el('g', null, o);
      [56, 68].forEach(x => el('line', { x1: x, x2: x, y1: AY - 7, y2: AY + 7,
                                         stroke: '#B45309', 'stroke-width': 1.3 }, this.pol));
      this.bA = beam(99, 221, AY - 7, K.INDIGO);
      this.bB = beam(99, 221, AY + 7, K.TEAL);
      this.shear = el('g', null, o);
      el('line', { x1: 118, x2: 118, y1: AY - 7, y2: AY + 7, stroke: K.INK, 'stroke-width': 1 }, this.shear);
      text(this.shear, 124, AY + 1, 'shear', { 'font-size': 9.5, fill: K.INK, 'text-anchor': 'start' });
      this.b2 = beam(239, 276, AY, LIGHT);
      this.b3 = beam(284, 331, AY, LIGHT);

      // the detail: a specimen seen from the side
      const d = this.det = el('g', null, g);
      let path = 'M 40 206';
      for (let x = 40; x <= 320; x += 2) path += ` L ${x} ${206 - bump(x)}`;
      el('path', { d: path + ' L 320 206 Z', fill: '#EDE9FE', stroke: '#A78BFA' }, d);
      text(d, 330, 196, 'specimen, side view', { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'end' });
      this.pa = el('line', { y1: 140, y2: 206, stroke: K.INDIGO, 'stroke-width': 1.5 }, d);
      this.pb = el('line', { y1: 140, y2: 206, stroke: K.TEAL, 'stroke-width': 1.5 }, d);
      this.ta = el('line', { stroke: K.INDIGO, 'stroke-width': 5 }, d);
      this.tb = el('line', { stroke: K.TEAL, 'stroke-width': 5 }, d);
      this.dmsg = text(d, 180, 226, '', { 'font-size': 11, 'font-weight': 700, fill: K.INK });
      this.strip = el('g', null, g);
      this.cells = [];
      for (let x = 40; x < 320; x += 4) {
        const I = 0.5 + 0.045 * (bump(x + 9) - bump(x - 5));
        const c = Math.round(255 * K.clamp(I, 0.03, 0.97));
        this.cells.push(el('rect', { x, y: 134, width: 4.4, height: 16,
          fill: `rgb(${c},${c},${Math.min(255, c + 6)})` }, this.strip));
      }
      text(this.strip, 40, 128, 'the image across that line', { 'font-size': 10, fill: K.MUTED,
                                                                'text-anchor': 'start' });
      this.smsg = text(this.strip, 180, 226, 'bright on one side of the edge, dark on the other',
                       { 'font-size': 11, 'font-weight': 700, fill: K.INK });
    },
    frame(k, p) {
      // reveal the train left to right, stage by stage
      const lit = [1, 2, 3, 6][k];
      this.parts.forEach((pt, i) => set(pt, { opacity: i < lit ? 1 : 0.25 }));
      const e = ease(p);
      set(this.b1, { x2: k === 0 ? lerp(44, 81, e) : 81 });
      show(this.pol, k > 0 || p > 0.5);
      const reach = k === 0 ? 0 : k === 1 ? lerp(99, 148, e) : 221;
      [this.bA, this.bB].forEach(b => { set(b, { x2: reach }); show(b, k >= 1); });
      show(this.shear, k >= 1 && (k > 1 || p > 0.5));
      show(this.b2, k === 3);
      show(this.b3, k === 3);
      set(this.b2, { x2: k === 3 ? lerp(239, 276, seg(p, 0, 0.3)) : 239 });
      set(this.b3, { x2: k === 3 ? lerp(284, 331, seg(p, 0.3, 0.5)) : 284 });
      show(this.det, k >= 2);
      show(this.strip, k === 3);
      if (k >= 2) {
        const x0 = k === 2 ? lerp(70, 290, ease(seg(p, 0.05, 0.95))) : 180;
        const xa = x0 - 7, xb = x0 + 7;
        set(this.pa, { x1: xa, x2: xa, opacity: k === 2 ? 1 : 0 });
        set(this.pb, { x1: xb, x2: xb, opacity: k === 2 ? 1 : 0 });
        set(this.ta, { x1: xa, x2: xa, y1: 206, y2: 206 - bump(xa), opacity: k === 2 ? 1 : 0 });
        set(this.tb, { x1: xb, x2: xb, y1: 206, y2: 206 - bump(xb), opacity: k === 2 ? 1 : 0 });
        const diff = bump(xb) - bump(xa);
        this.dmsg.textContent = k !== 2 ? ''
          : Math.abs(diff) < 1.5 ? (bump(x0) > 1 ? 'flat top: both delayed alike' : 'no specimen: no difference')
          : 'an edge: one beam delayed more';
        set(this.dmsg, { fill: Math.abs(diff) < 1.5 ? K.INK : K.RED });
        const n = k === 3 ? Math.floor(seg(p, 0.45, 0.95) * this.cells.length) : 0;
        this.cells.forEach((c, i) => show(c, i < n));
        show(this.smsg, k === 3 && p > 0.9);
      }
    }
  });

  /* ===================================================== epifluorescence */
  const SP = nm => 40 + (nm - 400) * 1.12;
  Anim.add({
    id: 'epi', group: 'micro', groupName: 'Microscopes',
    title: 'The fluorescence microscope',
    sub: 'Excite with one colour, see another',
    steps: [
      ['Blue in, green out',
       'A fluorophore absorbs light of one wavelength and, a few '
       + 'nanoseconds later, gives out light of a longer wavelength; '
       + 'the difference is called the Stokes shift. EGFP, for example,'
       + ' absorbs blue light at 488 nm and emits green light at about '
       + '510 nm. Fluorescence converts light from one colour to '
       + 'another rather than making new light, which is what '
       + 'luminescence does.', 7],
      ['The excitation path',
       'White light from the lamp first passes an excitation filter '
       + 'that lets only blue through. A dichroic mirror then reflects '
       + 'the blue light down through the objective onto the sample. '
       + 'Epi means upon: the light reaches the specimen from above, '
       + 'through the same objective used to view it, rather than from '
       + 'below as in bright field.', 7],
      ['The emission path',
       'The labelled structures absorb the blue light and glow green.'
       + ' Their green light travels back up through the objective to '
       + 'the dichroic mirror, which reflects short wavelengths but '
       + 'lets longer ones through, so the green passes straight on. An'
       + ' emission filter then removes any blue that is left, so only '
       + 'the fluorescence reaches the eye or camera.', 7],
      ['One colour at a time, then merge',
       'Each fluorophore needs its own set of filters, so each colour'
       + ' is imaged separately and the channels are overlaid '
       + 'afterwards. Because the whole depth of the sample is lit, '
       + 'light from above and below the focal plane is collected too, '
       + 'and thick samples look hazy. Removing that haze is exactly '
       + 'what a confocal microscope does.', 7]
    ],
    note: 'Live/dead staining uses the same optics. SYTO 9 enters '
        + 'every cell and stains it green, while propidium iodide '
        + 'enters only cells with damaged membranes and turns them '
        + 'red.',
    init(g) {
      // stage 1: the Stokes shift
      const s = this.st = el('g', null, g);
      this.inW = el('path', { fill: 'none', stroke: '#2563EB', 'stroke-width': 2.5 }, s);
      this.outW = el('path', { fill: 'none', stroke: '#16A34A', 'stroke-width': 2.5 }, s);
      this.molH = el('circle', { cx: 180, cy: 70, r: 34, fill: '#22C55E', opacity: 0 }, s);
      el('circle', { cx: 180, cy: 70, r: 22, fill: '#DCFCE7', stroke: '#16A34A', 'stroke-width': 2 }, s);
      text(s, 180, 71, 'GFP', { 'font-size': 11, 'font-weight': 800, fill: '#166534' });
      text(s, 92, 40, 'blue in, 488 nm', { 'font-size': 10.5, fill: '#2563EB', 'font-weight': 700 });
      this.outT = text(s, 272, 40, 'green out, ~510 nm', { 'font-size': 10.5, fill: '#16A34A',
                                                           'font-weight': 700 });
      const defs = el('defs', null, s);
      const lg = el('linearGradient', { id: 'an-spec' }, defs);
      [['0%', '#7C3AED'], ['18%', '#2563EB'], ['36%', '#06B6D4'], ['48%', '#22C55E'],
       ['66%', '#EAB308'], ['80%', '#F97316'], ['100%', '#DC2626']].forEach(([o2, c]) =>
        el('stop', { offset: o2, 'stop-color': c }, lg));
      el('rect', { x: SP(400), y: 200, width: SP(650) - SP(400), height: 7, rx: 2,
                   fill: 'url(#an-spec)' }, s);
      [400, 500, 600].forEach(nm => text(s, SP(nm), 218, `${nm} nm`, { 'font-size': 9.5, fill: K.MUTED }));
      const curve = (peak, sl, sr, col, dash) => {
        let d = '';
        for (let nm = 400; nm <= 650; nm += 2) {
          const sd = nm < peak ? sl : sr;
          const y = 194 - 66 * Math.exp(-((nm - peak) ** 2) / (2 * sd * sd));
          d += (d ? ' L ' : 'M ') + SP(nm).toFixed(1) + ' ' + y.toFixed(1);
        }
        return el('path', { d, fill: 'none', stroke: col, 'stroke-width': 2.2,
                            'stroke-dasharray': dash || 'none' }, s);
      };
      curve(488, 22, 12, '#2563EB', '5 3');
      this.emC = curve(507, 10, 30, '#16A34A');
      text(s, SP(455), 140, 'absorbs', { 'font-size': 10, fill: '#2563EB' });
      text(s, SP(560), 140, 'emits', { 'font-size': 10, fill: '#16A34A' });
      text(s, SP(498), 116, 'Stokes shift', { 'font-size': 10, fill: K.INK, 'font-weight': 700 });

      // stages 2 and 3: the light path
      const o = this.opt = el('g', null, g);
      el('circle', { cx: 334, cy: 92, r: 11, fill: '#FFF7CC', stroke: K.AMBER, 'stroke-width': 2 }, o);
      el('rect', { x: 282, y: 76, width: 8, height: 32, fill: '#2563EB', opacity: 0.55 }, o);
      el('line', { x1: 160, y1: 112, x2: 200, y2: 72, stroke: '#94A3B8', 'stroke-width': 4 }, o);
      K.lens(o, 180, 150, 30, true);
      el('rect', { x: 120, y: 196, width: 120, height: 7, fill: '#E5E7EB' }, o);
      this.cellsE = [158, 180, 202].map(x => el('circle', { cx: x, cy: 189, r: 6,
                                                             fill: '#D1FAE5', stroke: '#86EFAC' }, o));
      el('rect', { x: 164, y: 38, width: 32, height: 7, fill: '#16A34A', opacity: 0.55 }, o);
      el('rect', { x: 170, y: 6, width: 20, height: 14, rx: 3, fill: K.INK }, o);
      [['lamp', 334, 70, 'middle'], ['excitation', 286, 124, 'middle'], ['filter', 286, 136, 'middle'],
       ['dichroic mirror', 150, 66, 'end'], ['objective', 216, 150, 'start'],
       ['sample', 248, 200, 'start'], ['emission filter', 204, 42, 'start'],
       ['eye or camera', 198, 13, 'start']]
        .forEach(([t, x, y, a]) => text(o, x, y, t, { 'font-size': 10, fill: K.MUTED, 'text-anchor': a }));
      this.white = [[88, '#DC2626'], [92, '#16A34A'], [96, '#2563EB']].map(([y, c]) =>
        el('line', { x1: 323, y1: y, x2: 290, y2: y, stroke: c, 'stroke-width': 2 }, o));
      this.blueP = [[282, 92], [180, 92], [180, 188]];
      this.blue = el('path', { fill: 'none', stroke: '#2563EB', 'stroke-width': 3.5 }, o);
      this.greenP = [[186, 186], [186, 20]];
      this.green = el('path', { fill: 'none', stroke: '#16A34A', 'stroke-width': 3.5 }, o);

      // stage 4: channels and merge
      const m = this.mg = el('g', null, g);
      const CELLS = [[30, 32], [64, 58], [34, 74]];
      [['GFP filter set', 18, 'g'], ['DAPI filter set', 132, 'd'], ['merged', 246, 'gd']]
        .forEach(([label, x, ch], i) => {
          const pnl = el('g', null, m);
          el('rect', { x, y: 30, width: 96, height: 96, rx: 6, fill: '#0B1020' }, pnl);
          CELLS.forEach(([cx, cy]) => {
            if (ch.includes('g')) el('ellipse', { cx: x + cx, cy: 30 + cy, rx: 17, ry: 13,
                                                   fill: '#22C55E', opacity: 0.8 }, pnl);
            if (ch.includes('d')) el('circle', { cx: x + cx + 2, cy: 30 + cy, r: 6.5,
                                                  fill: '#3B82F6', opacity: 0.95 }, pnl);
          });
          text(pnl, x + 48, 142, label, { 'font-size': 10.5, fill: K.INK, 'font-weight': 700 });
          this['pn' + i] = pnl;
        });
      this.mT1 = text(m, 180, 176, 'one filter set per colour, then overlay', { 'font-size': 11,
        fill: K.INK, 'font-weight': 700 });
      this.mT2 = text(m, 180, 198, 'but every depth glows, so thick samples look hazy',
                      { 'font-size': 10.5, fill: K.MUTED });
    },
    frame(k, p) {
      show(this.st, k === 0);
      show(this.opt, k === 1 || k === 2);
      show(this.mg, k === 3);
      const t = p * Math.PI * 6;
      if (k === 0) {
        const a = seg(p, 0, 0.4), b = seg(p, 0.45, 0.95);
        set(this.inW, { d: a > 0 ? K.wave(20, lerp(20, 156, a), 70, 9, 22, -t) : '' });
        set(this.molH, { opacity: 0.3 * seg(p, 0.35, 0.5) * (1 - 0.5 * seg(p, 0.9, 1)) });
        set(this.outW, { d: b > 0 ? K.wave(204, lerp(204, 340, b), 70, 9, 34, -t) : '' });
        show(this.outT, b > 0.3);
      }
      if (k === 1 || k === 2) {
        const w = k === 1 ? seg(p, 0, 0.25) : 1;
        this.white.forEach(l => set(l, { x2: lerp(323, 290, w) }));
        const bl = k === 1 ? ease(seg(p, 0.25, 0.95)) : 1;
        set(this.blue, { d: partial(this.blueP, bl) });
        const glow = k === 2 ? seg(p, 0, 0.2) : 0;
        this.cellsE.forEach(c => set(c, { fill: glow > 0.5 ? '#22C55E' : '#D1FAE5',
                                          stroke: glow > 0.5 ? '#15803D' : '#86EFAC' }));
        set(this.green, { d: k === 2 ? partial(this.greenP, ease(seg(p, 0.15, 0.85))) : '' });
      }
      if (k === 3) {
        [this.pn0, this.pn1, this.pn2].forEach((pn, i) => set(pn, { opacity: seg(p, i * 0.22, i * 0.22 + 0.15) }));
        show(this.mT1, p > 0.6);
        show(this.mT2, p > 0.78);
      }
    }
  });

  /* ============================================================= confocal */
  const F = 1 / (1 / 62 + 1 / 90);                 // lens 130; focal plane 192 images to 40
  Anim.add({
    id: 'confocal', group: 'micro', groupName: 'Microscopes',
    title: 'The confocal microscope',
    sub: 'A pinhole rejects out-of-focus light',
    steps: [
      ['A laser focused to a point',
       'Instead of lighting the whole field at once, a confocal '
       + 'microscope focuses a laser to a single spot in the sample. On'
       + ' its way in and out, the cone of laser light also passes '
       + 'through the layers above and below that spot and excites '
       + 'their fluorophores more weakly, so out-of-focus light is '
       + 'still produced.', 6],
      ['The pinhole',
       'The light coming back from the sample is focused onto a '
       + 'pinhole in front of the detector. Light from the focal point '
       + 'comes to a focus exactly at the pinhole and passes through. '
       + 'Light from above or below the focal plane comes to a focus in'
       + ' front of or behind the pinhole, so it is spread out when it '
       + 'arrives and most of it is blocked.', 9],
      ['Scan point by point',
       'Because only one point is recorded at a time, mirrors sweep '
       + 'the laser spot across the sample line by line. The detector '
       + 'measures the brightness of each point in turn, and the '
       + 'computer assembles the measurements into an image.', 7],
      ['Optical sections, then 3D',
       'Each scan gives a thin optical section through the sample at '
       + 'one depth. Moving the focus up or down in small steps '
       + 'collects a stack of sections, a z-stack, which can be '
       + 'combined into a 3D reconstruction. This is why confocal is '
       + 'used for co-localisation, fine detail inside cells and thick '
       + 'specimens.', 7]
    ],
    note: 'A confocal microscope does not make the signal brighter; '
        + 'it removes the out-of-focus light. The price is slower '
        + 'imaging and more light on the sample, which can bleach it.',
    init(g) {
      const o = this.opt = el('g', null, g);
      el('rect', { x: 160, y: 4, width: 40, height: 14, rx: 3, fill: '#374151' }, o);
      text(o, 154, 12, 'detector', { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'end' });
      el('rect', { x: 100, y: 37, width: 76, height: 6, fill: '#111827' }, o);
      el('rect', { x: 184, y: 37, width: 76, height: 6, fill: '#111827' }, o);
      text(o, 266, 41, 'pinhole', { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'start' });
      el('rect', { x: 300, y: 70, width: 44, height: 16, rx: 3, fill: '#1F2937' }, o);
      text(o, 322, 62, 'laser', { 'font-size': 10, fill: K.MUTED });
      el('line', { x1: 164, y1: 94, x2: 196, y2: 62, stroke: '#94A3B8', 'stroke-width': 4 }, o);
      text(o, 140, 106, 'dichroic', { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'end' });
      K.lens(o, 180, 130, 30, true);
      el('rect', { x: 110, y: 160, width: 140, height: 64, fill: '#F1F5F9', stroke: K.LINE }, o);
      el('line', { x1: 110, x2: 250, y1: 192, y2: 192, stroke: K.MUTED, 'stroke-dasharray': '4 3' }, o);
      text(o, 256, 192, 'focal plane', { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'start' });
      this.beam = el('path', { fill: 'none', stroke: '#0EA5E9', 'stroke-width': 3 }, o);
      // converging to the focus, then spreading out again below it
      this.cone = el('path', { d: 'M 150 130 L 210 130 L 180 192 Z M 180 192 L 196.5 224 L 163.5 224 Z',
                               fill: '#0EA5E9', opacity: 0 }, o);
      this.dots = [];
      for (let i = 0; i < 28; i++) {
        const x = 118 + (i % 7) * 20 + ((i * 7) % 5), y = 166 + Math.floor(i / 7) * 16 + ((i * 3) % 4);
        this.dots.push({ c: el('circle', { cx: x, cy: y, r: 3.2, fill: '#C7D2C9' }, o), x, y });
      }
      this.rays = el('g', null, o);
      this.SRC = [[192, '#16A34A'], [176, K.AMBER], [212, K.AMBER]];
      this.ray = this.SRC.map(([ys, c]) => [0, 1].map(() =>
        el('path', { fill: 'none', stroke: c, 'stroke-width': 1.8 }, this.rays)));
      this.srcDot = this.SRC.map(([ys, c]) => el('circle', { cx: 180, cy: ys, r: 4, fill: c }, this.rays));
      this.leg = el('g', null, o);
      [['green: in focus,', 168, '#16A34A', 700], ['passes the pinhole', 181, K.INK, 400],
       ['amber: out of focus,', 202, '#B45309', 700], ['blocked', 215, K.INK, 400]]
        .forEach(([t, y, c, w]) => text(this.leg, 6, y, t, { 'font-size': 9.5, fill: c,
          'font-weight': w, 'text-anchor': 'start' }));

      // scanning
      const sc = this.scan = el('g', null, g);
      el('rect', { x: 20, y: 30, width: 150, height: 120, rx: 6, fill: '#F1F5F9', stroke: K.LINE }, sc);
      el('ellipse', { cx: 95, cy: 90, rx: 60, ry: 42, fill: '#E2F5E8', stroke: '#BBE5C8' }, sc);
      el('ellipse', { cx: 100, cy: 90, rx: 24, ry: 18, fill: '#C6EBD2', stroke: '#9BD4AE' }, sc);
      this.spot = el('circle', { r: 5, fill: '#0EA5E9', stroke: '#fff', 'stroke-width': 1.5 }, sc);
      el('rect', { x: 190, y: 30, width: 150, height: 120, rx: 6, fill: '#0B1020' }, sc);
      this.px = [];
      for (let v = 0; v < 12; v++) for (let u = 0; u < 15; u++) {
        const inC = ((u - 7) / 6) ** 2 + ((v - 5.5) / 4.4) ** 2 < 1;
        const inN = ((u - 7.4) / 2.5) ** 2 + ((v - 5.5) / 1.9) ** 2 < 1;
        const b = inN ? 1 : inC ? 0.55 : 0.04;
        this.px.push(el('rect', { x: 190 + u * 10, y: 30 + v * 10, width: 10, height: 10,
          fill: `rgba(34,197,94,${b})` }, sc));
      }
      text(sc, 95, 166, 'sample: the spot sweeps across', { 'font-size': 10, fill: K.MUTED });
      text(sc, 265, 166, 'image: built point by point', { 'font-size': 10, fill: K.MUTED });
      this.scT = text(sc, 180, 200, '', { 'font-size': 11, fill: K.INK, 'font-weight': 700 });

      // z-stack
      const z = this.zs = el('g', null, g);
      text(z, 100, 24, 'the focus steps through a cell', { 'font-size': 10, fill: K.MUTED });
      el('circle', { cx: 100, cy: 124, r: 62, fill: '#E2F5E8', stroke: '#86C99A' }, z);
      this.plane = el('line', { x1: 24, x2: 176, stroke: '#0EA5E9', 'stroke-width': 2.5 }, z);
      text(z, 268, 24, 'optical sections', { 'font-size': 10, fill: K.MUTED });
      this.secs = [];
      for (let i = 0; i < 7; i++) {
        const zz = -62 + (i + 0.5) * (124 / 7);
        const rx = Math.sqrt(62 * 62 - zz * zz) * 0.62;
        this.secs.push({ e: el('ellipse', { cx: 268, cy: 196 - i * 23, rx, ry: rx * 0.3,
          fill: '#22C55E', 'fill-opacity': 0.35, stroke: '#15803D' }, z), zz });
      }
      this.zT = text(z, 180, 228, 'stacked, they rebuild the cell in 3D', { 'font-size': 11,
        fill: K.INK, 'font-weight': 700 });
    },
    frame(k, p) {
      show(this.opt, k <= 1);
      show(this.scan, k === 2);
      show(this.zs, k === 3);
      if (k <= 1) {
        const b = k === 0 ? ease(seg(p, 0, 0.5)) : 1;
        set(this.beam, { d: partial([[300, 78], [180, 78], [180, 128]], b) });
        const c = k === 0 ? seg(p, 0.45, 0.75) : 1;
        set(this.cone, { opacity: 0.18 * c });
        this.dots.forEach(d => {
          const w = 30 * Math.abs(d.y - 192) / 62 + 3;
          const inside = Math.abs(d.x - 180) < w;
          const s = inside ? K.clamp(6 / w) * c : 0;
          set(d.c, { fill: s > 0.05 ? `rgba(34,197,94,${0.25 + 0.75 * s})` : '#C7D2C9' });
        });
        show(this.rays, k === 1);
        show(this.leg, k === 1);
        if (k === 1) {
          this.SRC.forEach(([ys], j) => {
            const on = seg(p, j * 0.33, j * 0.33 + 0.25);
            const di = 1 / (1 / F - 1 / (ys - 130));
            const iy = 130 - di;                         // where this point comes to a focus
            const inFocus = Math.abs(iy - 40) < 2;
            [150, 210].forEach((lx, s2) => {
              // beyond the lens, follow the line towards the focus to the pinhole plate
              const tEnd = (130 - (inFocus ? 18 : 43)) / (130 - iy);
              const ex = lx + (180 - lx) * tEnd;
              set(this.ray[j][s2], { d: partial([[180, ys], [lx, 130], [ex, 130 - (130 - iy) * tEnd]], on) });
            });
            set(this.srcDot[j], { opacity: on > 0 ? 1 : 0 });
          });
        }
      }
      if (k === 2) {
        const n = Math.floor(ease(seg(p, 0.02, 0.95)) * this.px.length);
        this.px.forEach((r, i) => show(r, i < n));
        const i = Math.min(this.px.length - 1, n);
        const u = i % 15, v = Math.floor(i / 15);
        set(this.spot, { cx: 20 + 5 + u * 10, cy: 30 + 5 + v * 10, opacity: n < this.px.length ? 1 : 0 });
        this.scT.textContent = n < this.px.length ? `line ${v + 1} of 12` : 'one optical section';
      }
      if (k === 3) {
        const zp = lerp(186, 62, ease(seg(p, 0.05, 0.9)));
        const half = Math.sqrt(Math.max(0, 62 * 62 - (zp - 124) ** 2));
        set(this.plane, { y1: zp, y2: zp, x1: 100 - half - 12, x2: 100 + half + 12 });
        this.secs.forEach((s, i) => {
          const yPlane = 124 - s.zz;
          set(s.e, { opacity: zp <= yPlane ? 1 : 0 });
        });
        show(this.zT, p > 0.9);
      }
    }
  });
})();
