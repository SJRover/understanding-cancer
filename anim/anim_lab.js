/* Lab skills animation: a serial dilution, how errors carry, and reading an
   unknown off a standard curve. The curve uses typical methylene blue
   readings at 665 nm on a plate reader. */
'use strict';

(() => {
  const K = Anim.kit;
  const { el, text, set, show, lerp, seg, ease } = K;
  const BLUE = '#1D4ED8';
  const TX = [50, 120, 190, 260, 330];
  const CONC = [2000, 200, 20, 2, 0.2];
  const fmt = c => c >= 100 ? Math.round(c).toLocaleString('en-GB')
    : c >= 1 ? c.toFixed(c >= 10 ? 1 : 2).replace(/\.0+$/, '') : c.toFixed(3).replace(/0+$/, '');
  // median readings of methylene blue standards, with the middle half of plates
  const STD = [[0, 0.040, 0.038, 0.042], [25, 0.128, 0.112, 0.143], [125, 0.526, 0.467, 0.587],
               [250, 1.003, 0.859, 1.074], [500, 1.810, 1.637, 1.913], [750, 2.442, 2.348, 2.535],
               [1000, 2.870, 2.766, 2.935], [1500, 3.343, 3.303, 3.373]];
  const C0 = 0.0608, M = 0.003559;         // the straight part, 0 to 500 µg/ml

  Anim.add({
    id: 'dilution', group: 'lab', groupName: 'Lab skills',
    title: 'Serial dilution and the standard curve',
    sub: 'C1V1 = C2V2, then reading an unknown',
    steps: [
      ['A ten-fold serial dilution',
       'In a ten-fold serial dilution, 100 µl of the previous tube is'
       + ' added to 900 µl of water. The final volume is 1,000 µl, so '
       + 'the sample is diluted 1 in 10 at each step and every tube is '
       + 'a tenth as concentrated as the one before. The total dilution'
       + ' is the product of the steps, so four steps give 10 x 10 x 10'
       + ' x 10, a 10,000-fold dilution.', 8],
      ['Errors carry forward',
       'Because each tube is made from the one before it, a mistake '
       + 'in one transfer is passed on to every tube after it. Here 120'
       + ' µl was moved instead of 100 µl, so the second tube is 18% '
       + 'too strong, and every later tube inherits the same 18% error.'
       + ' Mixing each tube well before taking from it matters for the '
       + 'same reason.', 7],
      ['Standards make a curve',
       'Standards of known concentration are read in triplicate, and '
       + 'their absorbance is plotted against concentration. At low '
       + 'concentrations the points fall on a straight line, as the '
       + 'Beer-Lambert law predicts. At high concentrations the plate '
       + 'reader saturates and the curve bends over, so only the '
       + 'straight part can be used to measure unknowns.', 7],
      ['Reading an unknown',
       'To find an unknown\'s concentration, read its absorbance '
       + 'across to the line and down to the concentration axis, or '
       + 'rearrange the line\'s equation, y = mx + c, as x = (y − c) / '
       + 'm. An unknown that reads above the straight part cannot be '
       + 'measured this way. It has to be diluted, read again, and the '
       + 'result multiplied back by the dilution factor.', 8]
    ],
    note: 'Every volume here comes from C1 × V1 = C2 × V2. A 1 in 10 '
        + 'dilution means 1 part sample in 10 parts in total, that is'
        + ' 1 part sample plus 9 parts water.',
    init(g) {
      // ---------- tubes
      const t = this.tubes = el('g', null, g);
      this.tb = TX.map((x, i) => {
        const tg = el('g', null, t);
        const liquid = el('path', { d: `M ${x - 16} 92 L ${x - 16} 140 Q ${x - 16} 158 ${x} 158 `
                                       + `Q ${x + 16} 158 ${x + 16} 140 L ${x + 16} 92 Z` }, tg);
        el('path', { d: `M ${x - 17} 70 L ${x - 17} 140 Q ${x - 17} 160 ${x} 160 `
                       + `Q ${x + 17} 160 ${x + 17} 140 L ${x + 17} 70`, fill: 'none',
                     stroke: K.INK, 'stroke-width': 1.6 }, tg);
        const lab = text(tg, x, 176, '', { 'font-size': 11, 'font-weight': 800, fill: K.INK });
        const err = text(tg, x, 192, '', { 'font-size': 10, 'font-weight': 700, fill: K.RED });
        return { liquid, lab, err };
      });
      text(t, 190, 210, 'µg/ml', { 'font-size': 10, fill: K.MUTED });
      this.arr = [0, 1, 2, 3].map(i => {
        const a = K.arrow(t, K.MUTED, 1.6);
        a.to(TX[i] + 10, 56, TX[i + 1] - 10, 56);
        const at = text(t, (TX[i] + TX[i + 1]) / 2, 46, '100 µl', { 'font-size': 9.5, fill: K.MUTED });
        return { a, at };
      });
      this.drop = el('circle', { r: 5, fill: BLUE }, t);
      this.tT = text(t, 180, 18, '', { 'font-size': 11.5, fill: K.INK, 'font-weight': 800 });
      this.tT2 = text(t, 180, 228, '', { 'font-size': 10.5, fill: K.INDIGO, 'font-weight': 700 });

      // ---------- curve
      const c = this.cv = el('g', null, g);
      this.X = x => 52 + x * (280 / 1600);
      this.Y = a => 200 - a * (156 / 3.6);
      el('rect', { x: this.X(0), y: 40, width: this.X(500) - this.X(0), height: 160,
                   fill: '#ECFDF5' }, c);
      el('line', { x1: 52, y1: 200, x2: 336, y2: 200, stroke: K.LINE }, c);
      el('line', { x1: 52, y1: 40, x2: 52, y2: 200, stroke: K.LINE }, c);
      [0, 500, 1000, 1500].forEach(v => text(c, this.X(v), 211, String(v), { 'font-size': 10, fill: K.MUTED }));
      [0, 1, 2, 3].forEach(v => text(c, 46, this.Y(v), String(v), { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'end' }));
      text(c, 300, 226, 'methylene blue, µg/ml', { 'font-size': 10, fill: K.MUTED });
      text(c, 58, 32, 'absorbance at 665 nm', { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'start' });
      text(c, this.X(250), 192, 'straight part', { 'font-size': 9.5, fill: '#15803D', 'font-weight': 700 });
      this.fitL = el('line', { x1: this.X(0), y1: this.Y(C0), x2: this.X(560), y2: this.Y(C0 + M * 560),
                               stroke: K.INDIGO, 'stroke-width': 2 }, c);
      this.fitX = el('line', { x1: this.X(560), y1: this.Y(C0 + M * 560), x2: this.X(950),
                               y2: this.Y(C0 + M * 950), stroke: K.INDIGO, 'stroke-width': 1.5,
                               'stroke-dasharray': '4 4' }, c);
      this.pts = STD.map(([x, m, q1, q3]) => {
        const pg = el('g', null, c);
        el('line', { x1: this.X(x), x2: this.X(x), y1: this.Y(q1), y2: this.Y(q3), stroke: K.INK,
                     'stroke-width': 1.4 }, pg);
        el('circle', { cx: this.X(x), cy: this.Y(m), r: 4.2, fill: x > 500 ? K.AMBER : K.INDIGO,
                       stroke: '#fff', 'stroke-width': 1.2 }, pg);
        return pg;
      });
      this.fitT = text(c, 238, 150, 'y = 0.00356x + 0.061,  R² = 0.998', { 'font-size': 10,
        fill: K.INDIGO, 'font-weight': 700 });
      this.satT = el('g', null, c);
      text(this.satT, 300, 104, 'saturating:', { 'font-size': 10, fill: '#B45309', 'font-weight': 700 });
      text(this.satT, 300, 118, 'the curve bends', { 'font-size': 10, fill: '#B45309', 'font-weight': 700 });
      this.uY = el('path', { fill: 'none', stroke: K.RED, 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }, c);
      this.uX = el('path', { fill: 'none', stroke: '#B45309', 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }, c);
      this.uYT = text(c, 0, 0, '', { 'font-size': 10.5, fill: K.RED, 'font-weight': 800, 'text-anchor': 'start' });
      this.uXT = text(c, 0, 0, '', { 'font-size': 10.5, fill: '#B45309', 'font-weight': 800, 'text-anchor': 'start' });
    },
    paint(i, c) {
      const a = Math.max(0.04, Math.min(1, (Math.log10(c) + 1.2) / 4.5));
      set(this.tb[i].liquid, { fill: BLUE, 'fill-opacity': a });
    },
    frame(k, p) {
      show(this.tubes, k <= 1);
      show(this.cv, k >= 2);
      if (k <= 1) {
        const bad = k === 1;
        // the actual concentrations, with a 120 µl first transfer in stage 2
        const act = CONC.slice();
        if (bad) for (let i = 1; i < 5; i++) act[i] = (i === 1 ? 2000 * 120 / 1020 : act[i - 1] / 10);
        const step = Math.min(4, Math.floor(p * 4.4));
        const q = p * 4.4 - step;
        this.tb.forEach((tb, i) => {
          const done = i === 0 || i <= step;
          this.paint(i, done ? act[i] : 0.0001);
          tb.lab.textContent = done ? fmt(act[i]) : 'water';
          tb.err.textContent = bad && done && i > 0 ? '+18%' : '';
        });
        this.arr.forEach((a, i) => {
          a.at.textContent = bad && i === 0 ? '120 µl!' : '100 µl';
          set(a.at, { fill: bad && i === 0 ? K.RED : K.MUTED, 'font-weight': bad && i === 0 ? 800 : 400 });
          set(a.a.g, { opacity: i < step || (i === step && q > 0) ? 1 : 0.25 });
        });
        if (step < 4) {
          const i = step;
          set(this.drop, { cx: lerp(TX[i], TX[i + 1], ease(K.clamp(q))),
                           cy: 72 - 22 * Math.sin(Math.PI * K.clamp(q)), opacity: q < 1 ? 1 : 0 });
        } else set(this.drop, { opacity: 0 });
        this.tT.textContent = bad ? 'one transfer of 120 µl instead of 100 µl'
          : 'each step: 100 µl into 900 µl, a 1 in 10 dilution';
        this.tT2.textContent = step === 4 ? (bad ? 'every later tube is 18% too strong'
          : '10 × 10 × 10 × 10 = 10,000-fold in total') : '';
      }
      if (k >= 2) {
        const n = k === 2 ? Math.floor(seg(p, 0, 0.6) * 8.99) : 8;
        this.pts.forEach((pt, i) => show(pt, i < n));
        const f = k === 2 ? seg(p, 0.6, 0.8) : 1;
        set(this.fitL, { opacity: f });
        set(this.fitX, { opacity: f });
        show(this.fitT, f > 0.5);
        show(this.satT, k === 2 ? p > 0.85 : true);
        const y = k === 3 ? ease(seg(p, 0.05, 0.4)) : 0;
        const yA = 1.10, yC = (yA - C0) / M;
        set(this.uY, { d: y > 0 ? `M 52 ${this.Y(yA)} L ${lerp(52, this.X(yC), y)} ${this.Y(yA)}`
          + (y >= 1 ? ` L ${this.X(yC)} 200` : '') : '' });
        this.uYT.textContent = y >= 1 ? `Y: A = 1.10 → ${Math.round(yC / 10) * 10} µg/ml` : '';
        set(this.uYT, { x: this.X(yC) + 6, y: this.Y(yA) + 16 });
        const x = k === 3 ? ease(seg(p, 0.5, 0.85)) : 0;
        const xA = 2.42;
        set(this.uX, { d: x > 0 ? `M 52 ${this.Y(xA)} L ${lerp(52, this.X(760), x)} ${this.Y(xA)}` : '' });
        this.uXT.textContent = x >= 1 ? 'X: A = 2.42, past the straight part' : '';
        set(this.uXT, { x: 60, y: this.Y(xA) + 14 });
        if (k === 3 && p > 0.9) this.uXT.textContent = 'X: past the straight part: dilute, re-read';
      }
    }
  });
})();
