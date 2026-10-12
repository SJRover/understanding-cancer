/* Reporter gene animations: fusions, lacZ and X-gal, firefly luciferase,
   GFP, and split GFP with BiFC. Content follows the SL50168 Techniques 3
   reporter section. */
'use strict';

(() => {
  const K = Anim.kit;
  const { el, text, set, show, lerp, seg, ease } = K;
  const G1 = '#22C55E', G2 = '#15803D', PURPLE = '#7B3FB6';
  const rng = seed => (n => () => (n = (n * 16807) % 2147483647) / 2147483647)(seed);

  // a GFP-like barrel, centred on 0,0, about 40 x 52 before scaling
  function barrel(parent, cx, cy, s, body, edge) {
    const g = el('g', { transform: `translate(${cx} ${cy}) scale(${s})` }, parent);
    const glow = el('circle', { r: 38, fill: body, opacity: 0 }, g);
    const b = el('rect', { x: -20, y: -26, width: 40, height: 52, rx: 12, fill: body,
                           stroke: edge, 'stroke-width': 1.5 }, g);
    [-12, -4, 4, 12].forEach(x => el('line', { x1: x, x2: x, y1: -21, y2: 21, stroke: edge,
      'stroke-width': 1.2, opacity: 0.6 }, g));
    el('ellipse', { cx: 0, cy: -21, rx: 16, ry: 4.5, fill: 'rgba(255,255,255,.5)' }, g);
    return { g, glow, b };
  }
  function hexPts(cx, cy, r) {
    const p = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 90);
      p.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return p.join(' ');
  }
  // a sugar ring with its name in it
  function sugar(parent, name, fill, edge) {
    const g = el('g', null, parent);
    el('polygon', { points: hexPts(0, 0, 15), fill, stroke: edge, 'stroke-width': 1.8 }, g);
    text(g, 0, 1, name, { 'font-size': 9, 'font-weight': 700, fill: edge });
    return g;
  }
  // an indole: a six-ring fused to a five-ring, the five-ring on the right
  function indole(parent) {
    const g = el('g', null, parent);
    const r = 13, x1 = r * Math.cos(Math.PI / 6);
    const hex = el('polygon', { points: hexPts(0, 0, r), 'stroke-width': 1.8 }, g);
    const pent = el('polygon', { points: `${x1},${-r / 2} ${x1},${r / 2} ${x1 + r * 0.95},${r * 0.8} `
      + `${x1 + r * 1.5},0 ${x1 + r * 0.95},${-r * 0.8}`, 'stroke-width': 1.8 }, g);
    const paint = (f, s) => { set(hex, { fill: f, stroke: s }); set(pent, { fill: f, stroke: s }); };
    paint('#E5E7EB', '#6B7280');
    return { g, paint };
  }
  const place = (g, x, y, s) => set(g, { transform: `translate(${x} ${y})${s ? ` scale(${s})` : ''}` });

  /* ============================================================== fusions */
  Anim.add({
    id: 'fusion', group: 'rep', groupName: 'Reporter genes',
    title: 'Reporter fusions',
    sub: 'Transcriptional or translational: promoter or protein?',
    steps: [
      ['What a reporter is',
       'A reporter is a gene whose product is easy to detect, used to'
       + ' report that something else has happened, such as a promoter '
       + 'switching on, a protein being made or a construct getting '
       + 'into a cell. GFP glows, luciferase makes light and lacZ turns'
       + ' a substrate blue. Reporters are read with a microscope, a '
       + 'plate reader or a flow cytometer.', 6],
      ['Transcriptional fusion: is the promoter on?',
       'In a transcriptional fusion the reporter\'s coding sequence is'
       + ' placed behind the promoter you are studying, in place of the'
       + ' gene itself, and it keeps its own ribosome-binding site or '
       + 'Kozak sequence. Whenever that promoter is switched on the '
       + 'reporter is made, so the signal shows when, where and how '
       + 'strongly the gene is transcribed. The reporter protein is '
       + 'free in the cell, so it fills it.', 8],
      ['Translational fusion: where is the protein?',
       'In a translational fusion the reporter\'s coding sequence is '
       + 'joined in frame to the gene\'s own coding sequence, usually '
       + 'through a short linker and with no stop codon between them. '
       + 'The cell makes one fusion protein, so the signal follows the '
       + 'protein itself and shows how much of it there is and where it'
       + ' goes, here into the nucleus.', 8],
      ['Reading the two',
       'A transcriptional fusion tells you whether the promoter is '
       + 'active, but nothing about the protein, which is no longer '
       + 'made. A translational fusion shows the protein\'s amount and '
       + 'location, but you have modified that protein, and the tag can'
       + ' change how it folds, moves or works. That is why tagged '
       + 'proteins are checked to make sure they still behave normally.', 7]
    ],
    note: 'A selectable marker on its own promoter, beside the gene, '
        + 'reports only whether the construct went in.',
    init(g) {
      // stage 1: three kinds
      const w = this.what = el('g', null, g);
      this.icons = [];
      let ic = el('g', null, w);
      const gb = barrel(ic, 70, 80, 0.9, '#86EFAC', G2);
      set(gb.glow, { opacity: 0.3 });
      text(ic, 70, 128, 'GFP', { 'font-size': 11.5, 'font-weight': 800, fill: G2 });
      text(ic, 70, 142, 'fluoresces', { 'font-size': 10, fill: K.MUTED });
      this.icons.push(ic);
      ic = el('g', null, w);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        el('line', { x1: 180 + 24 * Math.cos(a), y1: 80 + 24 * Math.sin(a),
                     x2: 180 + 34 * Math.cos(a), y2: 80 + 34 * Math.sin(a),
                     stroke: '#EAB308', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, ic);
      }
      el('circle', { cx: 180, cy: 80, r: 18, fill: '#FEF08A', stroke: K.AMBER, 'stroke-width': 2 }, ic);
      text(ic, 180, 128, 'luciferase', { 'font-size': 11.5, 'font-weight': 800, fill: '#A16207' });
      text(ic, 180, 142, 'makes light', { 'font-size': 10, fill: K.MUTED });
      this.icons.push(ic);
      ic = el('g', null, w);
      el('circle', { cx: 290, cy: 80, r: 28, fill: '#FEF9EF', stroke: K.LINE, 'stroke-width': 2 }, ic);
      [[280, 70], [298, 74], [286, 90], [302, 92], [272, 86]].forEach(([x, y], i) =>
        el('circle', { cx: x, cy: y, r: 4.5, fill: i === 3 ? '#fff' : '#1E40AF',
                       stroke: '#94A3B8', 'stroke-width': 0.8 }, ic));
      text(ic, 290, 128, 'lacZ', { 'font-size': 11.5, 'font-weight': 800, fill: '#1E40AF' });
      text(ic, 290, 142, 'turns X-gal blue', { 'font-size': 10, fill: K.MUTED });
      this.icons.push(ic);
      this.whatT = el('g', null, w);
      text(this.whatT, 180, 176, 'a gene whose product is easy to detect', { 'font-size': 12,
        'font-weight': 800, fill: K.INK });
      text(this.whatT, 180, 198, 'sensitive, quantifiable, quick, non-toxic,', { 'font-size': 10.5, fill: K.MUTED });
      text(this.whatT, 180, 212, 'and not already present in the cell', { 'font-size': 10.5, fill: K.MUTED });

      // stages 2 and 3: constructs and a cell
      const c = this.con = el('g', null, g);
      el('line', { x1: 16, x2: 300, y1: 50, y2: 50, stroke: '#9CA3AF', 'stroke-width': 2 }, c);
      el('line', { x1: 40, x2: 40, y1: 50, y2: 34, stroke: K.INK, 'stroke-width': 2 }, c);
      K.arrow(c, K.INK, 2).to(40, 34, 64, 34);
      text(c, 64, 20, "your gene's promoter", { 'font-size': 10, fill: K.INK, 'font-weight': 700 });
      el('path', { d: 'M 262 50 L 262 40 A 5 5 0 1 1 270 40 L 270 50', fill: 'none',
                   stroke: K.INK, 'stroke-width': 1.6 }, c);
      this.tx = el('g', null, c);
      el('rect', { x: 84, y: 42, width: 150, height: 16, rx: 3, fill: G1 }, this.tx);
      text(this.tx, 159, 50.5, 'GFP coding sequence', { 'font-size': 9.5, fill: '#fff', 'font-weight': 700 });
      text(this.tx, 159, 72, 'the reporter, in place of the gene', { 'font-size': 10, fill: G2 });
      this.tl = el('g', null, c);
      el('rect', { x: 70, y: 42, width: 108, height: 16, rx: 3, fill: K.INDIGO }, this.tl);
      text(this.tl, 124, 50.5, 'your gene', { 'font-size': 9.5, fill: '#fff', 'font-weight': 700 });
      el('rect', { x: 178, y: 46, width: 12, height: 8, fill: '#9CA3AF' }, this.tl);
      el('rect', { x: 190, y: 42, width: 64, height: 16, rx: 3, fill: G1 }, this.tl);
      text(this.tl, 222, 50.5, 'GFP', { 'font-size': 9.5, fill: '#fff', 'font-weight': 700 });
      text(this.tl, 160, 72, 'in frame, linker, no stop codon between', { 'font-size': 10, fill: K.INDIGO });
      this.pol = el('ellipse', { rx: 12, ry: 8, fill: '#F59E0B' }, c);
      this.mrna = el('path', { fill: 'none', stroke: K.RED, 'stroke-width': 2 }, c);
      this.mrnaT = text(c, 40, 92, 'mRNA', { 'font-size': 10, fill: K.RED, 'font-weight': 700 });
      el('rect', { x: 30, y: 106, width: 300, height: 122, rx: 20, fill: '#F8FAFC', stroke: K.LINE,
                   'stroke-width': 1.5 }, c);
      el('ellipse', { cx: 180, cy: 162, rx: 46, ry: 32, fill: '#EEF2FF', stroke: '#C7D2FE',
                      'stroke-width': 1.5 }, c);
      text(c, 180, 162, 'nucleus', { 'font-size': 9.5, fill: '#A5B4FC' });
      const r = rng(5);
      this.free = [];
      for (let i = 0; i < 40; i++) {
        this.free.push(el('circle', { cx: 46 + r() * 268, cy: 118 + r() * 92, r: 3.4, fill: G1 }, c));
      }
      this.fus = [];
      for (let i = 0; i < 14; i++) {
        let sx, sy;
        do { sx = 50 + r() * 260; sy = 118 + r() * 90; }
        while (((sx - 180) / 56) ** 2 + ((sy - 162) / 40) ** 2 < 1);
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.75;
        const f = el('g', null, c);
        el('circle', { cx: -3.5, cy: 0, r: 4, fill: K.INDIGO }, f);
        el('circle', { cx: 3.5, cy: 0, r: 4, fill: G1 }, f);
        this.fus.push({ f, sx, sy, ex: 180 + 40 * d * Math.cos(a), ey: 162 + 26 * d * Math.sin(a) });
      }
      this.cellT = text(c, 180, 218, '', { 'font-size': 10.5, fill: G2, 'font-weight': 700 });

      // stage 4: side by side
      const s = this.side = el('g', null, g);
      [[94, 'transcriptional fusion', 'is the promoter on?', true],
       [266, 'translational fusion', 'where is the protein?', false]].forEach(([x, h, q, diffuse]) => {
        text(s, x, 30, h, { 'font-size': 11, 'font-weight': 800, fill: diffuse ? G2 : K.INDIGO });
        el('rect', { x: x - 78, y: 44, width: 156, height: 128, rx: 18,
                     fill: diffuse ? '#BBF7D0' : '#F8FAFC', stroke: K.LINE, 'stroke-width': 1.5 }, s);
        el('ellipse', { cx: x, cy: 108, rx: 34, ry: 26, fill: diffuse ? '#A7F3D0' : '#4ADE80',
                        stroke: diffuse ? '#6EE7B7' : G2, 'stroke-width': 1.5 }, s);
        text(s, x, 190, q, { 'font-size': 10.5, fill: K.INK, 'font-weight': 700 });
      });
      text(s, 180, 220, 'a tag can change the protein: check it still works',
           { 'font-size': 10.5, fill: K.MUTED });
    },
    frame(k, p) {
      show(this.what, k === 0);
      show(this.con, k === 1 || k === 2);
      show(this.side, k === 3);
      if (k === 0) {
        this.icons.forEach((ic, i) => set(ic, { opacity: seg(p, i * 0.18, i * 0.18 + 0.2) }));
        set(this.whatT, { opacity: seg(p, 0.6, 0.8) });
      }
      if (k === 1 || k === 2) {
        const tl = k === 2;
        show(this.tx, !tl);
        show(this.tl, tl);
        const x0 = tl ? 70 : 84, x1 = tl ? 254 : 234;
        const t = ease(seg(p, 0.02, 0.35));
        const xp = lerp(40, x1, t);
        set(this.pol, { cx: xp, cy: 50, opacity: t < 1 ? 1 : 0 });
        set(this.mrna, { d: xp > x0 + 2 ? K.wave(x0, xp, 90, 2.5, 10, 0) : '' });
        show(this.mrnaT, xp > x0 + 20);
        const m = seg(p, 0.4, 0.75);
        this.free.forEach((d, i) => show(d, !tl && i < m * this.free.length));
        const mv = ease(seg(p, 0.6, 0.95));
        this.fus.forEach((o, i) => {
          show(o.f, tl && i < seg(p, 0.38, 0.55) * this.fus.length);
          place(o.f, lerp(o.sx, o.ex, mv), lerp(o.sy, o.ey, mv));
        });
        this.cellT.textContent = p < 0.75 ? '' : tl ? 'the fusion goes where your protein goes'
          : 'free GFP fills the whole cell: the promoter is on';
      }
    }
  });

  /* ================================================================ lacZ */
  Anim.add({
    id: 'lacz', group: 'rep', groupName: 'Reporter genes',
    title: 'lacZ and X-gal',
    sub: 'An enzyme reporter you can see by eye',
    steps: [
      ['β-galactosidase splits lactose',
       'The E. coli lacZ gene encodes β-galactosidase, the enzyme '
       + 'that breaks down lactose. Lactose is a disaccharide made of '
       + 'galactose joined to glucose, and the enzyme cuts the '
       + 'β-glycosidic bond between them.', 5],
      ['X-gal: the same bond, a different partner',
       'X-gal is an artificial substrate in which galactose is joined'
       + ' to a substituted indole instead of to glucose, and it is '
       + 'colourless. β-galactosidase recognises the galactose and cuts'
       + ' the same bond, releasing the indole.', 6],
      ['Two indoles make the blue',
       'The freed indoles pair up and are oxidised by air into an '
       + 'insoluble blue pigment, 5,5\'-dibromo-4,4\'-dichloro-indigo. '
       + 'Because the pigment does not dissolve, it stays where the '
       + 'enzyme was working. The colour comes from the released '
       + 'indole, not from the sugar.', 6],
      ['Reading it: by eye, or in numbers',
       'On a plate containing X-gal, colonies with a working lacZ '
       + 'turn blue and those without it stay white, which is easy to '
       + 'score by eye. For numbers, the Miller assay uses ONPG, which '
       + 'the enzyme cleaves into yellow o-nitrophenol. Its absorbance '
       + 'at 420 nm is divided by the culture\'s density at 600 nm, and '
       + 'by time and volume, to give the activity in Miller units.', 8]
    ],
    note: 'In blue-white cloning screens, an insert in the cloning '
        + 'site disrupts lacZ-alpha, so the colonies you want are the'
        + ' white ones.',
    init(g) {
      const m = this.mol = el('g', null, g);
      this.enz = el('g', null, m);
      const R = 30, a = 28 * Math.PI / 180;
      // a round enzyme with its active site opening upwards
      el('path', { d: `M 0 0 L ${-R * Math.sin(a)} ${-R * Math.cos(a)} A ${R} ${R} 0 1 0 `
                    + `${R * Math.sin(a)} ${-R * Math.cos(a)} Z`, fill: '#DDD6FE',
                   stroke: PURPLE, 'stroke-width': 2 }, this.enz);
      text(this.enz, 0, 50, 'β-galactosidase', { 'font-size': 10.5, fill: PURPLE, 'font-weight': 700 });
      this.gal = sugar(m, 'Gal', '#FBCFE8', '#BE185D');
      this.glc = sugar(m, 'Glc', '#FEF3C7', '#B45309');
      this.ind = indole(m);
      this.ind2 = indole(m);
      this.bond = el('line', { stroke: K.INK, 'stroke-width': 2.2 }, m);
      this.t1 = text(m, 200, 44, '', { 'font-size': 11.5, 'font-weight': 800, fill: K.INK });
      // product names sit above the molecules, clear of the enzyme below
      this.tl = text(m, 160, 76, '', { 'font-size': 10.5, fill: '#BE185D', 'font-weight': 700 });
      this.tr = text(m, 280, 76, '', { 'font-size': 10.5, fill: K.INK, 'font-weight': 700 });
      this.t2 = text(m, 180, 160, '', { 'font-size': 10, fill: K.INK });
      this.t3 = text(m, 180, 178, '', { 'font-size': 11, fill: '#1E40AF', 'font-weight': 800 });
      this.ppt = [];
      const r = rng(9);
      for (let i = 0; i < 26; i++) {
        this.ppt.push(el('circle', { cx: 110 + r() * 140, cy: 196 + r() * 26, r: 2 + r() * 2,
                                     fill: '#1E40AF', opacity: 0 }, m));
      }

      // reading
      const rd = this.read = el('g', null, g);
      el('circle', { cx: 95, cy: 104, r: 74, fill: '#FEF9EF', stroke: K.LINE, 'stroke-width': 2 }, rd);
      this.cols = [];
      const rc = rng(21);
      for (let i = 0; i < 16; i++) {
        let x, y;
        do { x = 95 + (rc() - 0.5) * 130; y = 104 + (rc() - 0.5) * 130; }
        while ((x - 95) ** 2 + (y - 104) ** 2 > 60 * 60);
        this.cols.push({ c: el('circle', { cx: x, cy: y, r: 6, fill: '#fff', stroke: '#94A3B8',
                                           'stroke-width': 1 }, rd), blue: i % 3 !== 0 });
      }
      text(rd, 95, 198, 'X-gal plate: lacZ working, blue;', { 'font-size': 10, fill: K.INK });
      text(rd, 95, 212, 'not working, white', { 'font-size': 10, fill: K.INK });
      el('rect', { x: 232, y: 40, width: 36, height: 110, rx: 4, fill: '#F8FAFC', stroke: K.INK,
                   'stroke-width': 1.5 }, rd);
      this.yel = el('rect', { x: 234, y: 60, width: 32, height: 88, rx: 3, fill: '#FACC15', opacity: 0 }, rd);
      [['ONPG → yellow', 168], ['o-nitrophenol', 182], ['read OD420, per OD600:', 204],
       ['Miller units', 218]].forEach(([t, y], i) =>
        text(rd, 260, y, t, { 'font-size': 10, fill: i === 3 ? '#A16207' : K.INK,
                              'font-weight': i === 3 ? 800 : 400 }));
    },
    frame(k, p) {
      show(this.mol, k <= 2);
      show(this.read, k === 3);
      if (k <= 2) {
        const sp = k < 2 ? ease(seg(p, 0.55, 0.85)) : 0;
        const up = k < 2 ? ease(seg(p, 0.1, 0.5)) : 0;
        show(this.enz, k < 2);
        place(this.enz, 218, lerp(200, 132, up) - (sp > 0 ? 10 * sp : 0));
        show(this.gal, k < 2);
        place(this.gal, lerp(200, 160, sp), 100);
        show(this.glc, k === 0);
        place(this.glc, lerp(236, 276, sp), 100);
        show(this.ind.g, k >= 1);
        show(this.ind2.g, k === 2);
        set(this.bond, { x1: 214, x2: 222, y1: 100, y2: 100, opacity: k < 2 && sp === 0 ? 1 : 0 });
        if (k === 1) { place(this.ind.g, lerp(229, 262, sp), 100); this.ind.paint('#E5E7EB', '#6B7280'); }
        this.tl.textContent = sp > 0.6 ? 'galactose' : '';
        if (k === 0) {
          this.t1.textContent = sp > 0.6 ? 'split at the β-glycosidic bond' : 'lactose';
          this.tr.textContent = sp > 0.6 ? 'glucose' : '';
          set(this.tr, { fill: '#B45309' });
        }
        if (k === 1) {
          this.t1.textContent = sp > 0.6 ? 'the same cut frees the indole' : 'X-gal: colourless';
          this.tr.textContent = sp > 0.6 ? 'indole, freed' : '';
          set(this.tr, { fill: '#4B5563' });
        }
        if (k === 2) {
          const j = ease(seg(p, 0.05, 0.45));
          place(this.ind.g, lerp(100, 148, j), 100);
          place(this.ind2.g, lerp(260, 212, j), 100, '-1 1');
          set(this.bond, { x1: 178, x2: 182, y1: 100, y2: 100, opacity: j >= 1 ? 1 : 0 });
          const blue = seg(p, 0.45, 0.65);
          const col = blue > 0.5 ? ['#1E40AF', '#1E3A8A'] : ['#E5E7EB', '#6B7280'];
          this.ind.paint(...col);
          this.ind2.paint(...col);
          this.t1.textContent = 'two freed indoles pair up and oxidise';
          this.tr.textContent = '';
          this.t2.textContent = blue > 0.5 ? "5,5'-dibromo-4,4'-dichloro-indigo" : '';
          this.t3.textContent = blue > 0.5 ? 'insoluble blue: it stays where it was made' : '';
          const n = seg(p, 0.65, 1) * this.ppt.length;
          this.ppt.forEach((d, i) => set(d, { opacity: i < n ? 0.85 : 0 }));
        } else {
          this.t2.textContent = '';
          this.t3.textContent = '';
          this.ppt.forEach(d => set(d, { opacity: 0 }));
        }
      }
      if (k === 3) {
        const b = seg(p, 0.05, 0.6);
        this.cols.forEach((c, i) => set(c.c, { fill: c.blue && i / this.cols.length < b ? '#1E40AF' : '#fff' }));
        set(this.yel, { opacity: 0.85 * seg(p, 0.4, 0.95) });
      }
    }
  });

  /* =========================================================== luciferase */
  Anim.add({
    id: 'luciferase', group: 'rep', groupName: 'Reporter genes',
    title: 'Firefly luciferase',
    sub: 'Light from a chemical reaction',
    steps: [
      ['The enzyme, then its substrate',
       'The reporter gene makes firefly luciferase, an enzyme. On its'
       + ' own the enzyme gives no light, because it needs a substrate,'
       + ' D-luciferin, which is added to the cells or to an extract. '
       + 'Living cells already supply the other ingredients, ATP and '
       + 'oxygen.', 5],
      ['Luciferin is activated by ATP',
       'In the enzyme\'s active site, with magnesium ions present, '
       + 'luciferase joins luciferin to AMP taken from ATP. This makes '
       + 'an activated intermediate, luciferyl-AMP, and releases '
       + 'pyrophosphate.', 6],
      ['Oxygen, then light',
       'Oxygen then reacts with luciferyl-AMP to form oxyluciferin in'
       + ' an excited, high-energy state, releasing carbon dioxide and '
       + 'AMP. As the oxyluciferin drops back to its ground state it '
       + 'gives out the energy as a photon of yellow-green light, at '
       + 'around 560 nm.', 6],
      ['Counting the light',
       'The light is measured in a luminometer, which counts photons '
       + 'in the dark. Because no light has to be shone in to excite '
       + 'anything, there is almost no background, so luminescence is '
       + 'extremely sensitive. Firefly luciferase needs ATP, magnesium '
       + 'and oxygen, so it also reports whether cells are alive, while'
       + ' the bacterial lux operon makes its own substrate and needs '
       + 'nothing added.', 7]
    ],
    note: 'Bioluminescence is light from a chemical reaction, '
        + 'fluorescence needs light shone in to give light out, and '
        + 'neither is incandescence, which is light from heat.',
    init(g) {
      // stage 1: a cell
      const c = this.cell = el('g', null, g);
      this.halo = el('rect', { x: 50, y: 34, width: 260, height: 160, rx: 34, fill: '#ECFCCB', opacity: 0 }, c);
      el('rect', { x: 60, y: 44, width: 240, height: 140, rx: 26, fill: '#1F2937' }, c);
      this.cglow = el('rect', { x: 60, y: 44, width: 240, height: 140, rx: 26, fill: '#D9F99D', opacity: 0 }, c);
      const r = rng(13);
      for (let i = 0; i < 9; i++) {
        el('ellipse', { cx: 84 + r() * 190, cy: 64 + r() * 100, rx: 7, ry: 5, fill: '#FDE68A',
                        opacity: 0.55 }, c);
      }
      this.drops = [];
      for (let i = 0; i < 10; i++) {
        this.drops.push({ c: el('circle', { r: 3.5, fill: '#FACC15' }, c), x: 90 + i * 20, d: (i * 7) % 10 / 10 });
      }
      text(c, 64, 22, 'D-luciferin added', { 'font-size': 10.5, fill: '#A16207', 'font-weight': 700,
                                             'text-anchor': 'start' });
      text(c, 290, 22, 'luciferase in the cell', { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'end' });
      this.cellT = text(c, 180, 210, 'a living cell already has the ATP and O₂',
                        { 'font-size': 10.5, fill: K.INK });

      // stages 2 and 3: the reaction
      const rx = this.rx = el('g', null, g);
      el('path', { d: 'M 114 120 Q 114 74 160 74 L 166 92 Q 180 104 194 92 L 200 74 '
                    + 'Q 246 74 246 120 Q 246 166 180 166 Q 114 166 114 120 Z',
                   fill: '#FEF3C7', stroke: K.AMBER, 'stroke-width': 2 }, rx);
      text(rx, 180, 140, 'firefly luciferase', { 'font-size': 11, fill: '#A16207', 'font-weight': 700 });
      text(rx, 180, 156, 'Mg²⁺ in the active site', { 'font-size': 9.5, fill: K.MUTED });
      // the flash, drawn over the enzyme so every ray shows
      this.burst = el('g', null, rx);
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        el('line', { x1: 172 + 18 * Math.cos(a), y1: 92 + 18 * Math.sin(a),
                     x2: 172 + 40 * Math.cos(a), y2: 92 + 40 * Math.sin(a),
                     stroke: '#84CC16', 'stroke-width': 3, 'stroke-linecap': 'round' }, this.burst);
      }
      const tag = (fill, label, tfill) => {
        const t = el('g', null, rx);
        el('circle', { r: 11, fill }, t);
        text(t, 0, 0.5, label, { 'font-size': 8.5, fill: tfill || '#fff', 'font-weight': 800 });
        return t;
      };
      this.luc = el('g', null, rx);
      this.lucHex = el('polygon', { points: hexPts(0, 0, 12), fill: '#FACC15', stroke: '#A16207',
                                    'stroke-width': 1.6 }, this.luc);
      this.lucT = text(rx, 0, 0, '', { 'font-size': 10, 'font-weight': 700, fill: '#A16207' });
      this.atp = tag('#F97316', 'ATP');
      this.amp = tag('#F97316', 'AMP');
      this.ppi = tag('#FDBA74', 'PPi', '#7C2D12');
      this.o2 = tag('#7DD3FC', 'O₂', '#075985');
      this.co2 = tag('#CBD5E1', 'CO₂', '#334155');
      this.rT = text(rx, 180, 196, '', { 'font-size': 11, fill: K.INK, 'font-weight': 700 });
      this.rT2 = text(rx, 180, 214, '', { 'font-size': 10.5, fill: K.MUTED });

      // stage 4: luminometer
      const lm = this.lm = el('g', null, g);
      el('rect', { x: 26, y: 30, width: 128, height: 150, rx: 10, fill: '#111827' }, lm);
      el('rect', { x: 66, y: 40, width: 48, height: 16, rx: 3, fill: '#374151' }, lm);
      text(lm, 90, 48.5, 'detector', { 'font-size': 8.5, fill: '#D1D5DB' });
      el('rect', { x: 74, y: 104, width: 32, height: 62, rx: 6, fill: '#D9F99D', opacity: 0.92 }, lm);
      this.ph = [];
      for (let i = 0; i < 8; i++) this.ph.push(el('circle', { r: 2.4, fill: '#ECFCCB' }, lm));
      this.cnt = text(lm, 90, 198, '', { 'font-size': 11.5, 'font-weight': 800, fill: K.INK });
      [['no light shone in, so', 50, K.INK, 400], ['almost no background', 64, K.INK, 700],
       ['firefly needs ATP, Mg²⁺', 92, K.INK, 400], ['and O₂: it reports', 106, K.INK, 400],
       ['viability too', 120, K.INK, 400],
       ['the bacterial lux operon', 148, K.INK, 400], ['makes its own substrate', 162, '#A16207', 700]]
        .forEach(([t, y, col, wgt]) => text(lm, 168, y, t, { 'font-size': 10.5, fill: col,
          'font-weight': wgt, 'text-anchor': 'start' }));
    },
    frame(k, p) {
      show(this.cell, k === 0);
      show(this.rx, k === 1 || k === 2);
      show(this.lm, k === 3);
      if (k === 0) {
        this.drops.forEach(d => {
          const t = seg(p, 0.1 + d.d * 0.3, 0.4 + d.d * 0.3);
          set(d.c, { cx: d.x, cy: lerp(30, 140, t), opacity: t > 0 && t < 1 ? 1 : 0 });
        });
        set(this.cglow, { opacity: 0.9 * seg(p, 0.6, 0.95) });
        set(this.halo, { opacity: 0.9 * seg(p, 0.7, 1) });
        show(this.cellT, p > 0.6);
      }
      if (k === 1 || k === 2) {
        const at = (o, x, y, on) => { place(o, x, y); set(o, { opacity: on ? 1 : 0 }); };
        if (k === 1) {
          const m = ease(seg(p, 0.05, 0.45)), out = ease(seg(p, 0.6, 0.95));
          at(this.luc, lerp(60, 172, m), lerp(40, 92, m), true);
          at(this.atp, lerp(300, 194, m), lerp(40, 90, m), p < 0.55);
          at(this.amp, 192, 92, p >= 0.55);
          at(this.ppi, lerp(194, 300, out), lerp(90, 40, out), p >= 0.55);
          at(this.o2, 0, 0, false); at(this.co2, 0, 0, false);
          set(this.lucHex, { fill: '#FACC15' });
          show(this.burst, false);
          this.lucT.textContent = '';
          this.rT.textContent = p < 0.55 ? 'luciferin + ATP' : 'luciferyl-AMP, and PPi leaves';
          this.rT2.textContent = '';
        } else {
          const m = ease(seg(p, 0.05, 0.35)), out = ease(seg(p, 0.55, 0.9));
          const lit = p >= 0.4 && p < 0.85;
          at(this.luc, 172, 92, true);
          at(this.amp, lerp(192, 310, out), lerp(92, 150, out), true);
          at(this.o2, lerp(40, 168, m), lerp(40, 70, m), p < 0.4);
          at(this.co2, lerp(170, 300, out), lerp(70, 34, out), p >= 0.4);
          at(this.atp, 0, 0, false); at(this.ppi, 0, 0, false);
          set(this.lucHex, { fill: lit ? '#D9F99D' : p >= 0.85 ? '#FEF9C3' : '#FACC15' });
          show(this.burst, lit);
          set(this.burst, { opacity: lit ? 1 - seg(p, 0.6, 0.85) * 0.6 : 0 });
          this.rT.textContent = p < 0.4 ? 'oxygen comes in' : 'light: about 560 nm, yellow-green';
          this.rT2.textContent = p >= 0.55 ? 'oxyluciferin, CO₂ and AMP are left' : '';
        }
      }
      if (k === 3) {
        this.ph.forEach((d, i) => {
          const t = (p * 4 + i / 8) % 1;
          set(d, { cx: 82 + (i % 4) * 6, cy: lerp(110, 58, t), opacity: 1 - t * 0.6 });
        });
        this.cnt.textContent = `${Math.round(48000 * ease(p)).toLocaleString('en-GB')} photons counted`;
      }
    }
  });

  /* ================================================================== GFP */
  Anim.add({
    id: 'gfp', group: 'rep', groupName: 'Reporter genes',
    title: 'GFP: a protein that makes its own light',
    sub: 'The barrel, the chromophore, and the colours',
    steps: [
      ['A barrel with a light inside',
       'Green fluorescent protein comes from the jellyfish Aequorea '
       + 'victoria. It is a barrel built from 11 β-strands, 238 amino '
       + 'acids and about 27 kDa, with a helix running through its '
       + 'middle. The light-emitting chromophore sits inside the '
       + 'barrel, which shields it from the surrounding water.', 6],
      ['The chromophore makes itself',
       'The chromophore forms from three of GFP\'s own amino acids, '
       + 'serine 65, tyrosine 66 and glycine 67, which cyclise inside '
       + 'the barrel to make a ring. Oxygen then completes it. Nothing '
       + 'else has to be supplied, which is why a single gene is enough'
       + ' to make a cell glow.', 7],
      ['Blue in, green out',
       'GFP absorbs blue light and emits green light, at about 510 '
       + 'nm. It needs no substrate, so it can be watched in living '
       + 'cells, in real time and repeatedly. The costs are that it '
       + 'needs oxygen to mature, takes time to fold before it glows, '
       + 'and fades under prolonged illumination, which is called '
       + 'photobleaching.', 6],
      ['A palette from mutations',
       'Changing the chromophore and the amino acids around it '
       + 'produced new colours. Y66H gives blue fluorescent protein, '
       + 'Y66W gives cyan, S65T gives the brighter enhanced GFP, and '
       + 'T203Y gives yellow. Glycine 67 is never changed in any '
       + 'variant, because it is the residue that lets the backbone '
       + 'cyclise.', 7]
    ],
    note: 'Shimomura, Chalfie and Tsien shared the 2008 Nobel Prize '
        + 'in Chemistry for GFP. Most red and far-red proteins came '
        + 'from other organisms, mainly Discosoma coral.',
    init(g) {
      // the barrel
      const b = this.bar = el('g', null, g);
      el('rect', { x: 130, y: 36, width: 100, height: 134, rx: 34, fill: '#DCFCE7', stroke: G2,
                   'stroke-width': 2 }, b);
      for (let x = 142; x <= 218; x += 12.6) {
        el('line', { x1: x, x2: x, y1: 50, y2: 156, stroke: '#86EFAC', 'stroke-width': 2 }, b);
      }
      let d = '';
      for (let y = 46; y <= 160; y += 2) d += (d ? ' L ' : 'M ') + (180 + 7 * Math.sin(y / 5)).toFixed(1) + ' ' + y;
      el('path', { d, fill: 'none', stroke: '#16A34A', 'stroke-width': 2, opacity: 0.6 }, b);
      this.chH = el('circle', { cx: 180, cy: 103, r: 18, fill: G1, opacity: 0 }, b);
      el('polygon', { points: hexPts(180, 103, 9), fill: G1, stroke: G2, 'stroke-width': 1.5 }, b);
      text(b, 8, 92, '11-stranded', { 'font-size': 10.5, fill: K.INK, 'text-anchor': 'start', 'font-weight': 700 });
      text(b, 8, 106, 'β-barrel', { 'font-size': 10.5, fill: K.INK, 'text-anchor': 'start', 'font-weight': 700 });
      el('line', { x1: 72, y1: 99, x2: 128, y2: 99, stroke: K.MUTED, 'stroke-width': 1 }, b);
      text(b, 242, 98, 'chromophore,', { 'font-size': 10.5, fill: G2, 'text-anchor': 'start', 'font-weight': 700 });
      text(b, 242, 112, 'inside', { 'font-size': 10.5, fill: G2, 'text-anchor': 'start', 'font-weight': 700 });
      el('line', { x1: 192, y1: 103, x2: 238, y2: 103, stroke: K.MUTED, 'stroke-width': 1 }, b);
      text(b, 180, 194, '238 amino acids, 27 kDa', { 'font-size': 10.5, fill: K.INK });
      text(b, 180, 212, 'from the jellyfish Aequorea victoria', { 'font-size': 10.5, fill: K.MUTED });

      // the chromophore forming
      const c = this.chr = el('g', null, g);
      text(c, 180, 34, 'Ser65 – Tyr66 – Gly67', { 'font-size': 12, 'font-weight': 800, fill: K.INK });
      this.bb1 = el('line', { stroke: '#9CA3AF', 'stroke-width': 3 }, c);
      this.bb2 = el('line', { stroke: '#9CA3AF', 'stroke-width': 3 }, c);
      this.close = el('line', { stroke: G2, 'stroke-width': 3 }, c);
      this.ringF = el('polygon', { fill: G1, opacity: 0 }, c);
      this.res = [['S', '#F9A8D4'], ['Y', '#FDE68A'], ['G', '#C7D2FE']].map(([s, f]) => {
        const r = el('g', null, c);
        el('circle', { r: 15, fill: f, stroke: K.INK, 'stroke-width': 1.5 }, r);
        text(r, 0, 1, s, { 'font-size': 12, 'font-weight': 800, fill: K.INK });
        return r;
      });
      this.ox = el('g', null, c);
      el('circle', { cx: -5, cy: 0, r: 6, fill: '#7DD3FC', stroke: '#0369A1' }, this.ox);
      el('circle', { cx: 5, cy: 0, r: 6, fill: '#7DD3FC', stroke: '#0369A1' }, this.ox);
      this.cT1 = text(c, 180, 176, 'the backbone cyclises', { 'font-size': 11, fill: K.INK, 'font-weight': 700 });
      this.cT2 = text(c, 180, 196, 'oxygen finishes it: nothing else is needed', { 'font-size': 11,
        fill: '#0369A1', 'font-weight': 700 });

      // blue in, green out
      const w = this.wv = el('g', null, g);
      this.wb = barrel(w, 180, 100, 1.25, '#86EFAC', G2);
      this.inW = el('path', { fill: 'none', stroke: '#2563EB', 'stroke-width': 2.5 }, w);
      this.outW = el('path', { fill: 'none', stroke: '#16A34A', 'stroke-width': 2.5 }, w);
      text(w, 74, 66, 'absorbs blue', { 'font-size': 11, fill: '#2563EB', 'font-weight': 700 });
      this.outT = text(w, 284, 66, 'emits green, ~510 nm', { 'font-size': 11, fill: '#16A34A',
                                                             'font-weight': 700 });
      this.wT1 = text(w, 180, 186, 'no substrate: live cells, real time', { 'font-size': 11,
        fill: K.INK, 'font-weight': 700 });
      this.wT2 = text(w, 180, 206, 'but it needs oxygen to mature, and it bleaches',
                      { 'font-size': 10.5, fill: K.MUTED });

      // palette
      const pl = this.pal = el('g', null, g);
      this.vars = [['BFP', 'Y66H', '#93C5FD', '#2563EB'], ['CFP', 'Y66W', '#67E8F9', '#0891B2'],
                   ['EGFP', 'S65T', '#86EFAC', '#16A34A'], ['YFP', 'T203Y', '#FDE047', '#A16207']]
        .map(([n, m, f, e], i) => {
          const v = el('g', null, pl);
          const bb = barrel(v, 60 + i * 80, 86, 0.95, f, e);
          set(bb.glow, { opacity: 0.35 });
          text(v, 60 + i * 80, 138, n, { 'font-size': 12, 'font-weight': 800, fill: e });
          text(v, 60 + i * 80, 154, m, { 'font-size': 10.5, fill: K.INK, 'font-family': 'monospace' });
          return v;
        });
      this.palT = text(pl, 180, 192, 'Gly67 never changes: it lets the backbone cyclise',
                       { 'font-size': 10.5, fill: K.INK, 'font-weight': 700 });
    },
    frame(k, p) {
      show(this.bar, k === 0);
      show(this.chr, k === 1);
      show(this.wv, k === 2);
      show(this.pal, k === 3);
      const t = p * Math.PI * 6;
      if (k === 0) {
        set(this.bar, { opacity: seg(p, 0, 0.25) });
        set(this.chH, { opacity: 0.35 * seg(p, 0.45, 0.7) });
      }
      if (k === 1) {
        const c = ease(seg(p, 0.05, 0.45));
        const P = [[lerp(120, 158, c), lerp(110, 128, c)], [180, lerp(110, 92, c)],
                   [lerp(240, 202, c), lerp(110, 128, c)]];
        this.res.forEach((r, i) => place(r, P[i][0], P[i][1]));
        set(this.bb1, { x1: P[0][0], y1: P[0][1], x2: P[1][0], y2: P[1][1] });
        set(this.bb2, { x1: P[1][0], y1: P[1][1], x2: P[2][0], y2: P[2][1] });
        set(this.close, { x1: P[0][0], y1: P[0][1], x2: P[2][0], y2: P[2][1], opacity: c >= 1 ? 1 : 0 });
        const o = ease(seg(p, 0.5, 0.75));
        place(this.ox, lerp(330, 210, o), lerp(60, 100, o));
        set(this.ox, { opacity: p > 0.5 && p < 0.8 ? 1 : 0 });
        set(this.ringF, { points: P.map(q => q.join(',')).join(' '),
                          opacity: 0.45 * seg(p, 0.75, 0.9) });
        show(this.cT1, p > 0.35);
        show(this.cT2, p > 0.7);
      }
      if (k === 2) {
        const a = seg(p, 0, 0.4), b = seg(p, 0.45, 0.95);
        set(this.inW, { d: a > 0 ? K.wave(20, lerp(20, 148, a), 100, 9, 22, -t) : '' });
        set(this.outW, { d: b > 0 ? K.wave(212, lerp(212, 340, b), 100, 9, 32, -t) : '' });
        set(this.wb.glow, { opacity: 0.35 * seg(p, 0.35, 0.5) });
        set(this.wb.b, { fill: p > 0.4 ? G1 : '#86EFAC' });
        show(this.outT, b > 0.3);
        show(this.wT1, p > 0.75);
        show(this.wT2, p > 0.85);
      }
      if (k === 3) {
        this.vars.forEach((v, i) => set(v, { opacity: seg(p, i * 0.17, i * 0.17 + 0.15) }));
        show(this.palT, p > 0.75);
      }
    }
  });

  /* ======================================================= split and BiFC */
  const HALF_N = 'M 0 -26 L -8 -26 Q -20 -26 -20 -14 L -20 14 Q -20 26 -8 26 L 0 26 Z';
  const HALF_C = 'M 0 -26 L 8 -26 Q 20 -26 20 -14 L 20 14 Q 20 26 8 26 L 0 26 Z';
  Anim.add({
    id: 'split', group: 'rep', groupName: 'Reporter genes',
    title: 'Split GFP and BiFC',
    sub: 'Two pieces, one signal, and what it proves',
    steps: [
      ['Split GFP: a tag and a detector',
       'In self-associating split GFP the protein is divided into two'
       + ' unequal parts. Strand 11, only 16 amino acids long, is '
       + 'attached to your protein as a small tag, and the large '
       + 'fragment, GFP1-10, is made separately. Neither part glows on '
       + 'its own, but the two find each other in the cell and assemble'
       + ' into a fluorescent protein.', 7],
      ['What the small tag buys',
       'The tag is small enough that it rarely disturbs the protein '
       + 'it is attached to. Repeating it, for example as seven copies '
       + 'of GFP11, binds several GFP1-10 fragments and multiplies the '
       + 'signal without turning up the laser, which would only bleach '
       + 'the sample. Making GFP1-10 from a tissue-specific GAL4 driver'
       + ' means the signal appears only in that tissue, while the '
       + 'tagged protein stays at its normal level.', 7],
      ['BiFC: halves that do not self-associate',
       'Bimolecular fluorescence complementation uses a fluorescent '
       + 'protein split into two halves that cannot assemble on their '
       + 'own. One half is fused to protein X and the other to protein '
       + 'Y. While X and Y stay apart, the halves stay apart too, and '
       + 'nothing glows.', 6],
      ['An interaction brings them together',
       'If X binds Y, the two halves are held close enough to fold '
       + 'together into a working fluorescent protein, so the cell '
       + 'glows exactly where the two proteins interact. Once formed, '
       + 'though, the reassembled protein is essentially irreversible, '
       + 'so BiFC shows that an interaction happened rather than '
       + 'following it as it comes and goes.', 8]
    ],
    init(g) {
      // split GFP
      const s = this.sp = el('g', null, g);
      text(s, 92, 40, 'your protein,', { 'font-size': 10.5, fill: K.INDIGO, 'font-weight': 700 });
      text(s, 92, 54, 'tagged with GFP11', { 'font-size': 10.5, fill: K.INDIGO, 'font-weight': 700 });
      text(s, 254, 40, 'GFP1–10,', { 'font-size': 10.5, fill: G2, 'font-weight': 700 });
      text(s, 254, 54, 'expressed separately', { 'font-size': 10.5, fill: G2, 'font-weight': 700 });
      this.big = barrel(s, 248, 116, 1.4, '#D1FAE5', '#6EE7B7');
      el('rect', { x: -3.5, y: -20, width: 7, height: 40, rx: 2, fill: '#fff' }, this.big.g);
      this.xp = el('g', null, s);
      el('ellipse', { cx: 0, cy: 0, rx: 22, ry: 18, fill: K.INDIGO }, this.xp);
      text(this.xp, 0, 1, 'X', { 'font-size': 12, fill: '#fff', 'font-weight': 800 });
      el('line', { x1: 22, x2: 46, y1: 0, y2: 0, stroke: '#9CA3AF', 'stroke-width': 2 }, this.xp);
      el('rect', { x: 50.5, y: -26, width: 7, height: 52, rx: 2, fill: G1 }, this.xp);
      this.spT = text(s, 180, 204, '', { 'font-size': 11, 'font-weight': 700 });

      // the tag repeated
      const u = this.use = el('g', null, g);
      el('ellipse', { cx: 50, cy: 92, rx: 26, ry: 20, fill: K.INDIGO }, u);
      text(u, 50, 93, 'X', { 'font-size': 12, fill: '#fff', 'font-weight': 800 });
      el('line', { x1: 76, x2: 322, y1: 92, y2: 92, stroke: '#9CA3AF', 'stroke-width': 2 }, u);
      this.reps = [];
      for (let i = 0; i < 7; i++) {
        const bb = barrel(u, 100 + i * 36, 92, 0.6, '#D1FAE5', '#6EE7B7');
        this.reps.push(bb);
      }
      text(u, 180, 40, '7 × GFP11 on one protein', { 'font-size': 11.5, fill: K.INK, 'font-weight': 800 });
      this.uT = el('g', null, u);
      text(this.uT, 180, 150, 'seven times the signal, no extra laser', { 'font-size': 11, fill: G2,
        'font-weight': 700 });
      text(this.uT, 180, 184, 'GFP1–10 from a tissue-specific GAL4 driver:', { 'font-size': 10.5, fill: K.INK });
      text(this.uT, 180, 198, 'signal only in that tissue, protein at native levels',
           { 'font-size': 10.5, fill: K.INK });

      // BiFC
      const b = this.bi = el('g', null, g);
      const partner = (name, fill, half, side) => {
        const o = el('g', null, b);
        el('ellipse', { cx: 0, cy: 0, rx: 22, ry: 18, fill }, o);
        text(o, 0, 1, name, { 'font-size': 12, fill: '#fff', 'font-weight': 800 });
        el('line', { x1: side * 22, x2: side * 40, y1: 0, y2: 0, stroke: '#9CA3AF', 'stroke-width': 2 }, o);
        const h = el('path', { d: half, transform: `translate(${side * 40} 0)`, 'stroke-width': 1.6 }, o);
        return { o, h };
      };
      this.glowB = el('circle', { r: 44, fill: '#BEF264', opacity: 0 }, b);
      this.X = partner('X', K.INDIGO, HALF_N, 1);
      this.Y = partner('Y', K.TEAL, HALF_C, -1);
      this.bT1 = text(b, 180, 30, '', { 'font-size': 11, fill: K.INK, 'font-weight': 800 });
      this.bT2 = text(b, 180, 192, '', { 'font-size': 11, fill: '#4D7C0F', 'font-weight': 800 });
      this.bT3 = text(b, 180, 212, '', { 'font-size': 10.5, fill: K.MUTED });
      this.bT4 = text(b, 180, 226, '', { 'font-size': 10.5, fill: K.MUTED });
    },
    frame(k, p) {
      show(this.sp, k === 0);
      show(this.use, k === 1);
      show(this.bi, k >= 2);
      if (k === 0) {
        const m = ease(seg(p, 0.05, 0.6));
        place(this.xp, lerp(70, 194, m), 116);
        const lit = seg(p, 0.65, 0.8);
        set(this.big.b, { fill: lit > 0.5 ? '#4ADE80' : '#D1FAE5', stroke: lit > 0.5 ? G2 : '#6EE7B7' });
        set(this.big.glow, { fill: G1, opacity: 0.3 * lit });
        this.spT.textContent = lit > 0.5 ? 'they find each other: it glows' : 'apart, neither piece glows';
        set(this.spT, { fill: lit > 0.5 ? G2 : K.MUTED });
      }
      if (k === 1) {
        this.reps.forEach((r, i) => {
          const on = seg(p, i * 0.08, i * 0.08 + 0.1);
          set(r.b, { fill: on > 0.5 ? '#4ADE80' : '#D1FAE5', stroke: on > 0.5 ? G2 : '#6EE7B7' });
          set(r.glow, { fill: G1, opacity: 0.3 * on });
        });
        set(this.uT, { opacity: seg(p, 0.6, 0.8) });
      }
      if (k >= 2) {
        let xx, xy, yx, yy, joined = 0;
        if (k === 2) {
          const t = p * Math.PI * 2;
          xx = 96 + 10 * Math.sin(t); xy = 92 + 8 * Math.cos(t * 1.3);
          yx = 266 + 10 * Math.cos(t); yy = 146 + 8 * Math.sin(t * 1.2);
        } else {
          const m = ease(seg(p, 0.05, 0.45));
          xx = lerp(96, 150, m); xy = lerp(92, 116, m);
          yx = lerp(266, 230, m); yy = lerp(146, 116, m);
          joined = seg(p, 0.45, 0.6);
        }
        place(this.X.o, xx, xy);
        place(this.Y.o, yx, yy);
        const on = joined > 0.5;
        [this.X.h, this.Y.h].forEach(h => set(h, { fill: on ? '#BEF264' : '#E5E7EB',
                                                   stroke: on ? '#4D7C0F' : '#9CA3AF' }));
        set(this.glowB, { cx: 190, cy: 116, opacity: 0.4 * joined });
        this.bT1.textContent = k === 2 ? 'X with one half, Y with the other'
          : on ? 'X binds Y: the halves fold together' : 'X and Y meet';
        this.bT2.textContent = k === 2 ? (p > 0.4 ? 'no interaction, no signal' : '')
          : on ? 'fluorescence where X and Y interact' : '';
        set(this.bT2, { fill: k === 2 ? K.MUTED : '#4D7C0F' });
        this.bT3.textContent = k === 3 && p > 0.75 ? 'but complementation is essentially irreversible:' : '';
        this.bT4.textContent = k === 3 && p > 0.75 ? 'it shows an interaction happened, not when it ends' : '';
      }
    }
  });
})();
