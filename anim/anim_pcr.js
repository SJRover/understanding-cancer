/* PCR animations: the cycle, where the amplicon comes from, reading a gel,
   RT-PCR, the two qPCR chemistries and the amplification plot.
   Temperatures and terms follow the SL50168 Techniques 3 PCR sections. */
'use strict';

(() => {
  const K = Anim.kit;
  const { el, text, set, show, lerp, seg, ease } = K;
  const fmt = n => Math.round(n).toLocaleString('en-GB');
  const NEW_T = '#8C8FE0', NEW_B = '#5FBDBD';          // newly made strands
  const PROBE = '#7B3FB6';

  // a primer drawn as an arrow pointing at its 3' end
  function primerPath(x0, x1, y) {
    const dir = x1 > x0 ? 1 : -1, b = x1 - dir * 8;
    return `M ${x0} ${y - 3} L ${b} ${y - 3} L ${b} ${y - 6} L ${x1} ${y} `
         + `L ${b} ${y + 6} L ${b} ${y + 3} L ${x0} ${y + 3} Z`;
  }

  /* ============================================================ PCR cycle */
  Anim.add({
    id: 'pcr', group: 'pcr', groupName: 'PCR',
    title: 'PCR: one cycle, three temperatures',
    sub: 'Denature, anneal, extend, and repeat',
    steps: [
      ['Denature: 92 to 95 °C',
       'The reaction starts by heating the DNA to 92 to 95 °C. At '
       + 'this temperature the hydrogen bonds that hold the base pairs '
       + 'together break, and the two strands of the double helix '
       + 'separate. The bases are now exposed, so each single strand '
       + 'can act as a template.', 5],
      ['Anneal: 50 to 68 °C',
       'The tube is cooled so the two primers can bind their '
       + 'complementary sequences, one on each strand, pointing towards'
       + ' each other across the target. The annealing temperature is '
       + 'the setting you tune. Too cool, and primers stick to '
       + 'sequences that only partly match, giving extra bands; too '
       + 'hot, and they cannot bind at all, giving no product.', 6],
      ['Extend: 72 °C',
       'At 72 °C a heat-stable polymerase such as Taq adds '
       + 'nucleotides to the 3\' end of each primer, building the new '
       + 'strand in the 5\' to 3\' direction along its template. By the '
       + 'end of the cycle each original strand has a new partner, so '
       + 'the amount of target DNA has doubled.', 6],
      ['Then again, about 30 times',
       'The three steps are repeated, and the products of each cycle '
       + 'become templates in the next, so the number of copies doubles'
       + ' every cycle. After 30 cycles a single molecule could in '
       + 'theory become about a billion. In a real tube the reaction '
       + 'slows and levels off as primers and nucleotides run out, '
       + 'which is why the final amount does not tell you how much you '
       + 'started with.', 8]
    ],
    note: 'Taq cannot proofread its own mistakes, so DNA that will be'
        + ' cloned, expressed or sequenced is usually made with a '
        + 'high-fidelity polymerase that can.',
    init(g) {
      const TY = T => 62 - (T - 40) * 0.8;
      this.TY = TY;
      // one cycle's temperature profile
      this.prof = el('g', null, g);
      this.SEGS = [[[30, 95], [120, 95]],
                   [[120, 95], [140, 60], [220, 60]],
                   [[220, 60], [235, 72], [340, 72]]];
      const all = [[30, 95], [120, 95], [140, 60], [220, 60], [235, 72], [340, 72]];
      el('path', { d: 'M ' + all.map(([x, T]) => `${x} ${TY(T)}`).join(' L '),
                   fill: 'none', stroke: K.LINE, 'stroke-width': 3 }, this.prof);
      this.HOT = [K.RED, K.BLUE, K.GREEN];
      this.hot = this.SEGS.map((s, i) => el('path', {
        d: 'M ' + s.map(([x, T]) => `${x} ${TY(T)}`).join(' L '),
        fill: 'none', stroke: this.HOT[i], 'stroke-width': 3.5 }, this.prof));
      text(this.prof, 75, 9, '92–95 °C', { 'font-size': 10, fill: K.RED, 'font-weight': 700 });
      text(this.prof, 180, 57, '50–68 °C', { 'font-size': 10, fill: K.BLUE, 'font-weight': 700 });
      text(this.prof, 288, 26, '72 °C', { 'font-size': 10, fill: K.GREEN, 'font-weight': 700 });
      this.dot = el('circle', { r: 5, stroke: '#fff', 'stroke-width': 1.5 }, this.prof);

      // the DNA
      this.dna = el('g', null, g);
      this.tgt = el('rect', { x: 120, y: 84, width: 130, height: 110, rx: 6,
                              fill: '#FFF6DD' }, this.dna);
      this.tgtT = text(this.dna, 185, 204, 'target region', { 'font-size': 10,
        fill: K.AMBER, 'font-weight': 700 });
      this.rungs = [];
      for (let x = 36; x <= 324; x += 9) {
        this.rungs.push(el('line', { x1: x, x2: x, stroke: K.LINE,
                                     'stroke-width': 1.5 }, this.dna));
      }
      this.top = el('line', { x1: 30, x2: 330, stroke: K.INDIGO, 'stroke-width': 4,
                              'stroke-linecap': 'round' }, this.dna);
      this.bot = el('line', { x1: 30, x2: 330, stroke: K.TEAL, 'stroke-width': 4,
                              'stroke-linecap': 'round' }, this.dna);
      const lab = s => text(this.dna, 0, 0, s, { 'font-size': 10, fill: K.MUTED });
      this.ends = [lab("5'"), lab("3'"), lab("3'"), lab("5'")];
      this.newT = el('line', { y1: 152, y2: 152, stroke: NEW_T, 'stroke-width': 4,
                               'stroke-linecap': 'round' }, this.dna);
      this.newB = el('line', { y1: 116, y2: 116, stroke: NEW_B, 'stroke-width': 4,
                               'stroke-linecap': 'round' }, this.dna);
      this.fwd = el('path', { fill: K.AMBER }, this.dna);
      this.rev = el('path', { fill: K.AMBER }, this.dna);
      this.fwdT = text(this.dna, 133, 180, 'forward primer', { 'font-size': 10, fill: K.AMBER });
      this.revT = text(this.dna, 240, 96, 'reverse primer', { 'font-size': 10, fill: K.AMBER });
      this.taq = [0, 1].map(() => {
        const e = el('g', null, this.dna);
        el('ellipse', { rx: 11, ry: 8, fill: K.GREEN }, e);
        text(e, 0, 0.5, 'Taq', { 'font-size': 8, fill: '#fff', 'font-weight': 700 });
        return e;
      });
      this.count = text(this.dna, 180, 224, '', { 'font-size': 11.5, fill: K.INK,
                                           'font-weight': 700 });

      // thirty cycles
      this.cyc = el('g', null, g);
      this.cw = 310 / 30;
      this.cycPath = i0 => {
        let d = '';
        for (let i = 0; i < i0; i++) {
          const x = 30 + i * this.cw, w = this.cw;
          d += `${d ? ' L' : 'M'} ${x} ${TY(95)} L ${x + w * 0.3} ${TY(95)} L ${x + w * 0.42} ${TY(60)} `
             + `L ${x + w * 0.7} ${TY(60)} L ${x + w * 0.76} ${TY(72)} L ${x + w} ${TY(72)}`;
        }
        return d;
      };
      el('path', { d: this.cycPath(30), fill: 'none', stroke: K.LINE, 'stroke-width': 1.5 }, this.cyc);
      this.cycDone = el('path', { fill: 'none', stroke: K.RED, 'stroke-width': 1.8 }, this.cyc);
      this.cycN = text(this.cyc, 180, 82, '', { 'font-size': 15, 'font-weight': 800, fill: K.INK });
      this.cycC = text(this.cyc, 180, 104, '', { 'font-size': 12, fill: K.INDIGO, 'font-weight': 700 });
      el('line', { x1: 40, y1: 205, x2: 332, y2: 205, stroke: K.LINE }, this.cyc);
      el('line', { x1: 40, y1: 128, x2: 40, y2: 205, stroke: K.LINE }, this.cyc);
      text(this.cyc, 44, 124, 'copies, on an ordinary scale', { 'font-size': 10,
        fill: K.MUTED, 'text-anchor': 'start' });
      this.pts = [];
      for (let i = 1; i <= 30; i++) {
        this.pts.push(el('circle', { cx: 40 + i * (290 / 30), r: 2.6, fill: K.INDIGO,
          cy: 205 - 74 * Math.pow(2, i - 30) }, this.cyc));
      }
      this.cycF = text(this.cyc, 186, 224, 'most of the product is made in the last few cycles',
                       { 'font-size': 10.5, fill: K.MUTED });
    },
    frame(k, p) {
      const TY = this.TY;
      show(this.prof, k <= 2);
      show(this.dna, k <= 2);
      show(this.cyc, k === 3);
      if (k <= 2) {
        // the dot rides along this stage's part of the profile
        const s = this.SEGS[k];
        const x = lerp(s[0][0], s[s.length - 1][0], p);
        let T = s[0][1];
        for (let i = 1; i < s.length; i++) {
          if (x <= s[i][0]) {
            T = lerp(s[i - 1][1], s[i][1], (x - s[i - 1][0]) / (s[i][0] - s[i - 1][0] || 1));
            break;
          }
        }
        set(this.dot, { cx: x, cy: TY(T), fill: this.HOT[k] });
        this.hot.forEach((h, i) => set(h, { opacity: i === k ? 1 : 0.18 }));

        const sep = k === 0 ? ease(seg(p, 0.15, 0.8)) : 1;
        const yt = lerp(128, 104, sep), yb = lerp(140, 164, sep);
        set(this.top, { y1: yt, y2: yt });
        set(this.bot, { y1: yb, y2: yb });
        this.rungs.forEach(r => set(r, { y1: yt + 2, y2: yb - 2,
          opacity: k === 0 ? 1 - seg(p, 0.1, 0.45) : 0 }));
        [[20, yt], [340, yt], [20, yb], [340, yb]].forEach(([x, y], i) =>
          set(this.ends[i], { x, y }));
        set(this.tgt, { opacity: k === 0 ? 0 : k === 1 ? seg(p, 0, 0.3) : 1 });
        show(this.tgtT, k >= 1);

        const a = k === 0 ? 0 : k === 1 ? ease(seg(p, 0.15, 0.7)) : 1;
        set(this.fwd, { d: primerPath(120, 152, lerp(134, 152, a)), opacity: a });
        set(this.rev, { d: primerPath(250, 222, lerp(134, 116, a)), opacity: a });
        show(this.fwdT, a > 0.5);
        show(this.revT, a > 0.5);

        const e = k === 2 ? ease(seg(p, 0.05, 0.9)) : 0;
        const xt = lerp(152, 330, e), xb = lerp(222, 30, e);
        set(this.newT, { x1: 152, x2: xt, opacity: k === 2 ? 1 : 0 });
        set(this.newB, { x1: xb, x2: 222, opacity: k === 2 ? 1 : 0 });
        set(this.taq[0], { transform: `translate(${xt + 6} 140)`, opacity: k === 2 && e < 1 ? 1 : 0 });
        set(this.taq[1], { transform: `translate(${xb - 6} 128)`, opacity: k === 2 && e < 1 ? 1 : 0 });

        this.count.textContent =
          k === 0 ? (p < 0.8 ? 'one double-stranded molecule' : 'two single strands')
          : k === 1 ? (a < 1 ? 'primers find their sites' : 'each strand has a primer bound')
          : (e < 1 ? 'each primer is extended along its template'
                   : 'two double-stranded molecules: twice the DNA');
      }
      if (k === 3) {
        const n = Math.max(1, Math.min(30, Math.ceil(p * 30.5)));
        set(this.cycDone, { d: this.cycPath(n) });
        this.cycN.textContent = `cycle ${n} of 30`;
        const c = Math.pow(2, n);
        this.cycC.textContent = n === 30 ? `${fmt(c)} copies: about a billion`
          : `${fmt(c)} cop${c === 1 ? 'y' : 'ies'} from one molecule`;
        this.pts.forEach((pt, i) => show(pt, i < n));
        show(this.cycF, n >= 26);
      }
    }
  });

  /* ======================================================= the amplicon */
  const EXT = { O: [30, 330], 'L+': [130, 330], 'L-': [30, 230], S: [130, 230] };
  const COL = { O: '#9AA1B2', L: K.AMBER, S: K.INDIGO };
  const CYCLES = [
    [['O', 'L-', 'b'], ['L+', 'O', 't']],
    [['O', 'L-', 'b'], ['L+', 'O', 't'], ['L+', 'S', 'b'], ['S', 'L-', 't']],
    [['O', 'L-', 'b'], ['L+', 'O', 't'], ['L+', 'S', 'b'], ['L+', 'S', 'b'],
     ['S', 'L-', 't'], ['S', 'L-', 't'], ['S', 'S', 'b'], ['S', 'S', 't']]
  ];
  Anim.add({
    id: 'amplicon', group: 'pcr', groupName: 'PCR',
    title: 'Where the amplicon comes from',
    sub: 'The first two cycles run long; from cycle 3, primer to primer',
    steps: [
      ['Cycle 1: long products',
       'In the first cycle each primer binds the original template '
       + 'and is extended as far as the polymerase gets, well past the '
       + 'other primer\'s site. This gives two long products. Each has a'
       + ' defined start, set by its primer, but no defined end.', 6],
      ['Cycle 2: the first primer-to-primer strands',
       'In the second cycle the long products become templates too. '
       + 'When the opposite primer copies a long product, the '
       + 'polymerase stops where that product ends, which is at the '
       + 'first primer. These new strands therefore run exactly from '
       + 'one primer to the other, although each is still paired with a'
       + ' longer strand.', 7],
      ['Cycle 3: the first exact amplicons',
       'In the third cycle the primer-to-primer strands are copied in'
       + ' their turn. The copies are the same length as their '
       + 'templates, so for the first time there are double-stranded '
       + 'molecules with both ends set by the primers. These are the '
       + 'exact amplicons, and there are two of them.', 7],
      ['Then the amplicon takes over',
       'From here the exact amplicons double every cycle, while the '
       + 'long products increase by only two per cycle. After n cycles '
       + 'there are 2 to the power n, minus 2n, exact amplicons: none '
       + 'until cycle 3, but nearly all of the roughly one billion '
       + 'molecules by cycle 30. That is why the gel shows one band of '
       + 'the expected size.', 8]
    ],
    init(g) {
      this.band = el('rect', { x: 130, y: 26, width: 100, height: 184, rx: 4,
                               fill: K.PALE }, g);
      this.head = text(g, 180, 14, '', { 'font-size': 11.5, 'font-weight': 700, fill: K.INK });
      this.mols = [];
      for (let i = 0; i < 8; i++) {
        const m = el('g', null, g);
        const bg = el('rect', { x: 124, width: 112, height: 16, rx: 4, fill: '#DCDDF7' }, m);
        const t = el('line', { 'stroke-width': 3.5, 'stroke-linecap': 'round' }, m);
        const b = el('line', { 'stroke-width': 3.5, 'stroke-linecap': 'round' }, m);
        this.mols.push({ m, bg, t, b });
      }
      this.key = el('g', null, g);
      [['original', COL.O, 70], ['long product', COL.L, 172], ['exact amplicon', COL.S, 284]]
        .forEach(([s, c, x]) => {
          el('rect', { x: x - 44, y: 222, width: 12, height: 4, rx: 2, fill: c }, this.key);
          text(this.key, x - 28, 224, s, { 'font-size': 10, fill: K.INK, 'text-anchor': 'start' });
        });

      // the table
      this.tab = el('g', null, g);
      [['cycle', 52], ['all molecules', 170], ['exact amplicons', 290]].forEach(([s, x]) =>
        text(this.tab, x, 30, s, { 'font-size': 11, 'font-weight': 800, fill: K.INK }));
      el('line', { x1: 20, y1: 40, x2: 345, y2: 40, stroke: K.LINE }, this.tab);
      this.rows = [1, 2, 3, 4, 5, 10, 20, 30].map((n, i) => {
        const y = 56 + i * 19.5;
        const r = el('g', null, this.tab);
        const hi = n === 3;
        const at = { 'font-size': 11.5, 'font-family': 'monospace',
                     fill: hi ? K.INDIGO : K.INK, 'font-weight': hi ? 800 : 400 };
        text(r, 52, y, String(n), at);
        text(r, 170, y, fmt(Math.pow(2, n)), at);
        text(r, 290, y, fmt(Math.pow(2, n) - 2 * n), at);
        return r;
      });
      this.tabF = text(this.tab, 182, 222,
        'by cycle 30, all but 60 of the 1.07 billion are exact',
        { 'font-size': 10.5, fill: K.INDIGO, 'font-weight': 700 });
    },
    frame(k, p) {
      show(this.tab, k === 3);
      show(this.band, k <= 2);
      show(this.key, k <= 2);
      show(this.head, k <= 2);
      this.mols.forEach(o => show(o.m, false));
      if (k <= 2) {
        const list = CYCLES[k];
        const n = list.length, c = k + 1;
        const e = ease(seg(p, 0.1, 0.85));
        const y0 = 118 - (n - 1) * 11.5;
        list.forEach(([tp, bt, nw], i) => {
          const o = this.mols[i];
          show(o.m, true);
          const y = y0 + i * 23;
          const exact = tp === 'S' && bt === 'S';
          set(o.bg, { y: y - 5, opacity: exact && (nw === 't' || nw === 'b') ? e : 0 });
          const [ta, tb] = EXT[tp === 'O' ? 'O' : tp];
          const [ba, bb] = EXT[bt === 'O' ? 'O' : bt];
          // + strands grow rightwards from their 5' end, - strands leftwards
          const tx2 = nw === 't' ? lerp(ta, tb, e) : tb;
          const bx1 = nw === 'b' ? lerp(bb, ba, e) : ba;
          set(o.t, { x1: ta, x2: Math.max(ta + 0.1, tx2), y1: y, y2: y,
                     stroke: COL[tp[0]], opacity: nw === 't' && e === 0 ? 0 : 1 });
          set(o.b, { x1: Math.min(bb - 0.1, bx1), x2: bb, y1: y + 6, y2: y + 6,
                     stroke: COL[bt[0]], opacity: nw === 'b' && e === 0 ? 0 : 1 });
        });
        const ex = Math.pow(2, c) - 2 * c;
        this.head.textContent = `cycle ${c}: ${Math.pow(2, c)} molecules, `
          + `${ex} exact amplicon${ex === 1 ? '' : 's'}`;
      }
      if (k === 3) {
        const r = Math.floor(p * 9.5);
        this.rows.forEach((row, i) => show(row, i < r));
        show(this.tabF, r >= 8);
      }
    }
  });

  /* ================================================================== gel */
  const SIZES = { L: [1000, 700, 500, 400, 300, 200, 100], 1: [400],
                  2: [400, 250, 150], 3: [50], NTC: [] };
  Anim.add({
    id: 'gel', group: 'pcr', groupName: 'PCR',
    title: 'Reading a PCR on a gel',
    sub: 'Size, direction, the ladder and the control',
    steps: [
      ['Load the wells',
       'Each PCR product is mixed with loading dye, which contains '
       + 'glycerol so the sample sinks into the well instead of '
       + 'floating away, and coloured dyes so you can follow the run. '
       + 'One lane takes a ladder of fragments of known size, and '
       + 'another takes the no-template control, the reaction that had '
       + 'water instead of DNA.', 4],
      ['Run towards the positive electrode',
       'DNA\'s phosphate backbone carries a negative charge, so when '
       + 'the current is switched on the fragments move towards the '
       + 'positive electrode, usually the red one. The agarose forms a '
       + 'mesh that slows long fragments more than short ones, so in '
       + 'the same time smaller fragments travel further down the gel.', 7],
      ['Stain and look',
       'DNA cannot be seen on its own. A stain such as SYBR Safe or '
       + 'ethidium bromide slips in between the bases and glows under '
       + 'blue or UV light, so a band appears wherever there is DNA, '
       + 'brighter where there is more of it.', 4],
      ['Read it',
       'Each band\'s size is read by comparing how far it ran with the'
       + ' ladder bands beside it. A single bright band at the expected'
       + ' size means the PCR worked. Extra bands usually mean the '
       + 'primers also bound partial matches, and a faint smudge near '
       + 'the bottom is primer-dimer. The no-template control must be '
       + 'empty; a band there means a reagent is contaminated, and then'
       + ' nothing on the gel can be trusted.', 9]
    ],
    init(g) {
      this.LANES = ['L', '1', '2', '3', 'NTC'];
      this.lx = i => 66 + i * 38;
      this.ys = s => 56 + (3 - Math.log10(s)) * 110;
      text(g, 138, 13, '−  negative electrode', { 'font-size': 10, fill: K.MUTED });
      text(g, 138, 228, '+  positive electrode', { 'font-size': 10, fill: K.RED, 'font-weight': 700 });
      this.gel = el('rect', { x: 44, y: 32, width: 188, height: 182, rx: 4 }, g);
      this.LANES.forEach((l, i) => {
        text(g, this.lx(i), 26, l, { 'font-size': 10, 'font-weight': 700, fill: K.INK });
        el('rect', { x: this.lx(i) - 12, y: 38, width: 24, height: 5, rx: 1,
                     fill: '#5B5F78' }, g);
      });
      this.ladT = el('g', null, g);
      [1000, 500, 300, 200, 100].forEach(s =>
        text(this.ladT, 40, this.ys(s), String(s), { 'font-size': 9, fill: K.MUTED,
                                                     'text-anchor': 'end' }));
      this.bands = [];
      this.LANES.forEach((l, i) => SIZES[l].forEach(s => {
        const faint = l === '3' || (l === '2' && s !== 400);
        this.bands.push({ s, l, faint, r: el('rect', { x: this.lx(i) - 12, width: 24,
          height: 4, rx: 1.5 }, g) });
      }));
      this.dye = el('g', null, g);
      this.LANES.forEach((l, i) => el('rect', { x: this.lx(i) - 12, width: 24, height: 3,
        fill: '#6D5BD0', opacity: 0.55, class: 'dye' }, this.dye));
      this.side = el('g', null, g);
      this.notes = [];
      for (let i = 0; i < 7; i++) {
        this.notes.push(text(this.side, 244, 0, '', { 'font-size': 10,
          'text-anchor': 'start', fill: K.INK }));
      }
    },
    say(lines) {
      this.notes.forEach((t, i) => {
        const L = lines[i];
        t.textContent = L ? L[0] : '';
        if (L) set(t, { y: L[1], fill: L[2] || K.INK, 'font-weight': L[3] ? 700 : 400 });
      });
    },
    frame(k, p) {
      const stained = k >= 2;
      const glow = k === 2 ? seg(p, 0.2, 0.8) : k === 3 ? 1 : 0;
      set(this.gel, { fill: stained ? (glow > 0.5 ? '#1E2235' : '#3A3F5C') : '#EEF1F8',
                      stroke: K.LINE });
      show(this.ladT, k === 3);
      const run = k === 0 ? 0 : k === 1 ? ease(p) : 1;
      this.bands.forEach(b => {
        const y = lerp(40, this.ys(b.s), run);
        show(b.r, k >= 1);
        set(b.r, { y: y - 2,
          fill: stained ? '#C8F7B8' : '#B9BED0',
          opacity: stained ? glow * (b.faint ? 0.45 : 1) : (k === 1 ? 0.35 : 0) });
      });
      [...this.dye.children].forEach(r => {
        set(r, { y: lerp(40, this.ys(300), run) - 1.5 });
      });
      show(this.dye, k <= 1 && !(k === 0 && p < 0.3));
      if (k === 0) {
        this.say([['L: ladder, known sizes', 70], ['1, 2, 3: your PCRs', 92],
                  ['NTC: no-template', 114], ['control, water only', 128],
                  ['purple: loading dye', 156, '#6D5BD0']]);
      } else if (k === 1) {
        this.say([['DNA is negative,', 70], ['so it runs to +', 84],
                  ['small fragments', 108], ['run furthest', 122],
                  ['drawn faintly here:', 150, K.MUTED], ['unseen until stained', 164, K.MUTED]]);
      } else if (k === 2) {
        this.say([['the dye intercalates', 80], ['and glows under', 94],
                  ['blue or UV light', 108]]);
      } else {
        const n = Math.floor(p * 5.5);
        this.say([
          ['1: one band, 400 bp', 66, K.GREEN, true],
          ['2: extra bands:', 92, K.AMBER, true], ['anneal hotter', 106, K.AMBER],
          ['3: primer-dimer only', 132, K.RED, true],
          ['NTC: empty, so the', 158, K.INDIGO, true], ['bands are real', 172, K.INDIGO]
        ].filter((l, i) => [0, 1, 1, 2, 3, 3][i] < n));
      }
    }
  });

  /* =============================================================== RT-PCR */
  Anim.add({
    id: 'rtpcr', group: 'pcr', groupName: 'PCR',
    title: 'RT-PCR: from RNA to DNA',
    sub: 'Reverse transcription first, then PCR',
    steps: [
      ['Start from mRNA',
       'PCR can only copy DNA, because the heat-stable polymerases it'
       + ' uses cannot read RNA. To study gene expression you therefore'
       + ' start from mRNA and turn it into DNA first. A mature mRNA '
       + 'has already been spliced, so it contains only exons, and it '
       + 'carries a protective cap at its 5\' end and a poly(A) tail at '
       + 'its 3\' end.', 5],
      ['A primer on the tail',
       'Reverse transcriptase, like other polymerases, can only '
       + 'extend an existing primer. An oligo(dT) primer, a short run '
       + 'of T bases, pairs with the poly(A) tail, so only mature mRNAs'
       + ' are copied. Random primers, which bind all along every RNA, '
       + 'or a primer specific to one gene, are the alternatives.', 5],
      ['Reverse transcriptase makes cDNA',
       'Reverse transcriptase, an enzyme borrowed from retroviruses '
       + 'such as M-MLV or AMV, extends the primer and copies the mRNA '
       + 'into a complementary DNA strand, called cDNA. The cDNA runs '
       + 'in the opposite direction to the message and, because the '
       + 'mRNA was spliced, it has no introns.', 6],
      ['Second strand, then ordinary PCR',
       'The RNA strand is removed, and a primer and DNA polymerase '
       + 'make the second DNA strand, giving double-stranded cDNA. From'
       + ' here on it is ordinary PCR. Running the product on a gel '
       + 'tells you whether the RNA was there, which is RT-PCR; '
       + 'following the product cycle by cycle tells you how much was '
       + 'there, which is RT-qPCR.', 8]
    ],
    note: 'Placing the primers in different exons tells cDNA apart '
        + 'from contaminating genomic DNA, because genomic DNA still '
        + 'has the intron between them and gives a longer product or '
        + 'none. A no-RT control, with the reverse transcriptase left'
        + ' out, catches DNA contamination directly.',
    init(g) {
      this.rna = el('g', null, g);
      text(this.rna, 150, 30, 'mRNA: spliced, exons only', { 'font-size': 11,
        fill: K.RED, 'font-weight': 700 });
      this.rnaL = [[40, 118], [122, 198], [202, 260]].map(([a, b], i) => {
        el('line', { x1: a, x2: b, y1: 80, y2: 80, stroke: K.RED, 'stroke-width': 5,
                     'stroke-linecap': 'round' }, this.rna);
        text(this.rna, (a + b) / 2, 62, `exon ${i + 1}`, { 'font-size': 10, fill: K.MUTED });
        return null;
      });
      el('circle', { cx: 32, cy: 80, r: 5, fill: K.RED }, this.rna);
      text(this.rna, 32, 64, 'cap', { 'font-size': 9.5, fill: K.MUTED });
      this.polyA = text(this.rna, 292, 80, 'AAAAAA', { 'font-size': 12,
        'font-family': 'monospace', 'font-weight': 700, fill: K.RED });
      text(this.rna, 14, 80, "5'", { 'font-size': 10, fill: K.MUTED });
      text(this.rna, 336, 80, "3'", { 'font-size': 10, fill: K.MUTED });
      this.cut = el('g', null, g);
      for (let i = 0; i < 9; i++) {
        el('line', { x1: 40 + i * 31, x2: 54 + i * 31, y1: 80, y2: 80,
                     stroke: K.RED, 'stroke-width': 5, 'stroke-linecap': 'round' }, this.cut);
      }

      this.dT = text(g, 292, 100, 'TTTTTT', { 'font-size': 12,
        'font-family': 'monospace', 'font-weight': 700, fill: K.AMBER });
      this.dTL = text(g, 292, 120, 'oligo(dT) primer', { 'font-size': 10, fill: K.AMBER });
      this.cdna = el('line', { y1: 100, y2: 100, stroke: K.INDIGO, 'stroke-width': 5,
                               'stroke-linecap': 'round' }, g);
      this.cdnaE = el('g', null, g);
      text(this.cdnaE, 14, 100, "3'", { 'font-size': 10, fill: K.MUTED });
      text(this.cdnaE, 336, 100, "5'", { 'font-size': 10, fill: K.MUTED });
      text(this.cdnaE, 150, 120, 'cDNA', { 'font-size': 11, fill: K.INDIGO, 'font-weight': 700 });
      this.rt = el('g', null, g);
      el('ellipse', { rx: 16, ry: 11, fill: PROBE }, this.rt);
      text(this.rt, 0, 0.5, 'RT', { 'font-size': 9, fill: '#fff', 'font-weight': 700 });
      this.rtT = text(g, 150, 148, 'reverse transcriptase copies RNA into DNA',
                      { 'font-size': 10.5, fill: PROBE });
      this.second = el('line', { y1: 80, y2: 80, stroke: K.TEAL, 'stroke-width': 5,
                                 'stroke-linecap': 'round' }, g);
      this.msg = text(g, 180, 140, '', { 'font-size': 11, fill: K.INK, 'font-weight': 700 });
      this.mini = [];
      for (let i = 0; i < 8; i++) {
        const m = el('g', null, g);
        const x = 40 + (i % 4) * 74, y = 162 + Math.floor(i / 4) * 26;
        el('line', { x1: x, x2: x + 56, y1: y, y2: y, stroke: K.TEAL, 'stroke-width': 3.5,
                     'stroke-linecap': 'round' }, m);
        el('line', { x1: x, x2: x + 56, y1: y + 6, y2: y + 6, stroke: K.INDIGO,
                     'stroke-width': 3.5, 'stroke-linecap': 'round' }, m);
        this.mini.push(m);
      }
      this.miniT = text(g, 180, 224, '', { 'font-size': 11, fill: K.INDIGO, 'font-weight': 700 });
    },
    frame(k, p) {
      const gone = k === 3 ? seg(p, 0.0, 0.3) : 0;
      set(this.rna, { opacity: k < 3 ? 1 : 1 - seg(p, 0, 0.12) });
      set(this.cut, { opacity: k === 3 ? (p < 0.12 ? 0 : 1 - seg(p, 0.12, 0.32)) : 0 });
      set(this.cut, { transform: `translate(0 ${-14 * gone})` });
      const a = k === 0 ? 0 : k === 1 ? ease(seg(p, 0.1, 0.7)) : 1;
      set(this.dT, { y: lerp(132, 100, a), opacity: a });
      show(this.dTL, k === 1 && a > 0.6 || k === 2);
      const e = k < 2 ? 0 : k === 2 ? ease(seg(p, 0.05, 0.9)) : 1;
      set(this.cdna, { x1: lerp(262, 40, e), x2: 262, opacity: e > 0 ? 1 : 0 });
      show(this.cdnaE, e >= 1);
      show(this.rt, k === 2 && e < 1);
      set(this.rt, { transform: `translate(${lerp(262, 40, e) - 10} 100)` });
      show(this.rtT, k === 2);
      const s = k === 3 ? ease(seg(p, 0.32, 0.62)) : 0;
      set(this.second, { x1: 40, x2: lerp(40, 316, s), opacity: s > 0 ? 1 : 0 });
      const m = k === 3 ? seg(p, 0.66, 1) : 0;
      const n = k === 3 && p >= 0.66 ? Math.pow(2, Math.min(3, Math.floor(m * 4))) : 0;
      this.mini.forEach((o, i) => show(o, i < n));
      this.miniT.textContent = n ? `PCR: ${n} cop${n === 1 ? 'y' : 'ies'}, then on doubling` : '';
      this.msg.textContent = k !== 3 ? ''
        : p < 0.32 ? 'the RNA strand is removed'
        : p < 0.66 ? 'a second DNA strand: double-stranded cDNA' : '';
    }
  });

  /* ======================================================= qPCR chemistry */
  Anim.add({
    id: 'qchem', group: 'pcr', groupName: 'PCR',
    title: 'qPCR: SYBR Green and TaqMan',
    sub: 'Two ways to make the product glow',
    steps: [
      ['SYBR Green binds any duplex',
       'SYBR Green is a dye that barely fluoresces when it floats '
       + 'free in solution but glows strongly once it binds double-'
       + 'stranded DNA. As the PCR makes more double-stranded product '
       + 'each cycle, more dye binds and the signal rises. It is cheap '
       + 'and works with any pair of primers, because nothing about it '
       + 'is specific to the target.', 6],
      ['The catch, and the melt curve',
       'Because SYBR Green lights up any double-stranded DNA, primer-'
       + 'dimers and off-target products add to the signal too. So the '
       + 'run ends with a melt curve: the products are heated slowly, '
       + 'and the fluorescence falls as each one separates into single '
       + 'strands. One specific product melts at one temperature and '
       + 'gives a single sharp peak, while short primer-dimers melt at '
       + 'a lower temperature.', 7],
      ['TaqMan: a probe with a quencher',
       'A TaqMan probe is a short oligo that binds the target between'
       + ' the two primers. It carries a reporter dye such as FAM at '
       + 'its 5\' end and a quencher at its 3\' end. While the probe is '
       + 'intact, the quencher sits close enough to take the reporter\'s'
       + ' energy, so no light is given off.', 6],
      ['Taq cuts the probe: light',
       'As Taq extends the primer it reaches the probe, and its 5\' to'
       + ' 3\' exonuclease activity breaks the probe apart. The reporter'
       + ' is released, drifts away from the quencher and now '
       + 'fluoresces. One reporter is freed for each new copy, and only'
       + ' when the probe has found its exact target, which makes '
       + 'TaqMan more specific than SYBR Green.', 8]
    ],
    init(g) {
      // SYBR
      this.sy = el('g', null, g);
      this.rungs = el('g', null, this.sy);
      for (let x = 56; x <= 304; x += 10) {
        el('line', { x1: x, x2: x, y1: 106, y2: 126, stroke: K.LINE, 'stroke-width': 1.5 }, this.rungs);
      }
      el('line', { x1: 50, x2: 310, y1: 104, y2: 104, stroke: K.INDIGO, 'stroke-width': 4,
                   'stroke-linecap': 'round' }, this.sy);
      el('line', { x1: 50, x2: 310, y1: 128, y2: 128, stroke: K.TEAL, 'stroke-width': 4,
                   'stroke-linecap': 'round' }, this.sy);
      text(this.sy, 180, 150, 'double-stranded product', { 'font-size': 10, fill: K.MUTED });
      const rng = (n => () => (n = (n * 16807) % 2147483647) / 2147483647)(11);
      this.dye = [];
      for (let i = 0; i < 12; i++) {
        const top = i % 2 === 0;
        const halo = el('circle', { r: 9, fill: '#22C55E', opacity: 0 }, this.sy);
        const c = el('circle', { r: 4.5 }, this.sy);
        this.dye.push({ c, halo, fx: 40 + rng() * 280, fy: top ? 38 + rng() * 40 : 166 + rng() * 34,
                        bx: 70 + i * 20 });
      }
      this.syT1 = text(this.sy, 92, 22, 'free dye: barely glows', { 'font-size': 10.5, fill: K.MUTED });
      this.syT2 = text(this.sy, 180, 222, 'bound to the duplex: bright', { 'font-size': 11,
        fill: '#15803D', 'font-weight': 700 });

      // melt curve
      this.mc = el('g', null, g);
      this.mx = T => 50 + (T - 60) * 8;
      el('line', { x1: 50, y1: 200, x2: 330, y2: 200, stroke: K.LINE }, this.mc);
      el('line', { x1: 50, y1: 36, x2: 50, y2: 200, stroke: K.LINE }, this.mc);
      [60, 70, 80, 90].forEach(T => text(this.mc, this.mx(T), 212, String(T),
        { 'font-size': 10, fill: K.MUTED }));
      text(this.mc, 300, 228, 'temperature, °C', { 'font-size': 10, fill: K.MUTED });
      text(this.mc, 56, 30, 'how fast the signal drops (−dF/dT)', { 'font-size': 10,
        fill: K.MUTED, 'text-anchor': 'start' });
      this.prod = el('path', { fill: 'none', stroke: '#15803D', 'stroke-width': 2.5 }, this.mc);
      this.dim = el('path', { fill: 'none', stroke: K.AMBER, 'stroke-width': 2,
                              'stroke-dasharray': '5 3' }, this.mc);
      this.prodT = text(this.mc, 150, 70, 'your product: one sharp peak', { 'font-size': 10.5,
        fill: '#15803D', 'font-weight': 700 });
      this.dimT = text(this.mc, 160, 134, 'primer-dimer melts lower', { 'font-size': 10.5,
        fill: K.AMBER, 'font-weight': 700 });

      // TaqMan
      this.tq = el('g', null, g);
      el('line', { x1: 20, x2: 340, y1: 160, y2: 160, stroke: K.TEAL, 'stroke-width': 4,
                   'stroke-linecap': 'round' }, this.tq);
      text(this.tq, 100, 180, 'template strand', { 'font-size': 10, fill: K.TEAL });
      this.newS = el('line', { y1: 150, y2: 150, stroke: K.INDIGO, 'stroke-width': 4,
                               'stroke-linecap': 'round' }, this.tq);
      this.prim = el('path', { fill: K.AMBER }, this.tq);
      this.primT = text(this.tq, 56, 132, 'primer', { 'font-size': 10, fill: K.AMBER });
      this.probe = el('line', { y1: 150, y2: 150, stroke: PROBE, 'stroke-width': 5,
                                'stroke-linecap': 'round' }, this.tq);
      this.probeT = text(this.tq, 221, 168, 'probe', { 'font-size': 10, fill: PROBE });
      this.bits = [];
      for (let i = 0; i < 5; i++) {
        this.bits.push(el('line', { stroke: PROBE, 'stroke-width': 4, 'stroke-linecap': 'round' }, this.tq));
      }
      this.rHalo = el('circle', { r: 14, fill: '#22C55E', opacity: 0 }, this.tq);
      this.rep = el('circle', { r: 7 }, this.tq);
      this.qu = el('circle', { r: 7, fill: '#374151' }, this.tq);
      this.repT = text(this.tq, 0, 0, '', { 'font-size': 10.5, 'font-weight': 700 });
      this.quT = text(this.tq, 278, 124, 'quencher', { 'font-size': 10, fill: '#374151' });
      this.fret = el('path', { d: 'M 182 140 Q 222 106 262 140', fill: 'none',
        stroke: K.MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, this.tq);
      this.fretT = text(this.tq, 222, 98, 'energy goes to the quencher: no light',
                        { 'font-size': 10, fill: K.MUTED });
      this.taq = el('g', null, this.tq);
      el('ellipse', { rx: 14, ry: 10, fill: K.GREEN }, this.taq);
      text(this.taq, 0, 0.5, 'Taq', { 'font-size': 9, fill: '#fff', 'font-weight': 700 });
    },
    frame(k, p) {
      show(this.sy, k === 0);
      show(this.mc, k === 1);
      show(this.tq, k >= 2);
      if (k === 0) {
        this.dye.forEach((d, i) => {
          const t = ease(seg(p, 0.08 + i * 0.035, 0.45 + i * 0.035));
          const x = lerp(d.fx, d.bx, t), y = lerp(d.fy, 116, t);
          const on = t > 0.97;
          set(d.c, { cx: x, cy: y, fill: on ? '#22C55E' : '#A9CDB0', opacity: on ? 1 : 0.75 });
          set(d.halo, { cx: x, cy: y, opacity: on ? 0.28 : 0 });
        });
        show(this.syT2, p > 0.6);
      }
      if (k === 1) {
        const Tm = lerp(60, 95, ease(seg(p, 0.05, 0.9)));
        const curve = (c, s, h) => {
          let d = '';
          for (let T = 60; T <= Tm + 0.01; T += 0.25) {
            const y = 200 - 150 * h * Math.exp(-((T - c) ** 2) / (2 * s * s));
            d += (d ? ' L ' : 'M ') + this.mx(T).toFixed(1) + ' ' + y.toFixed(1);
          }
          return d;
        };
        set(this.prod, { d: curve(86, 1.2, 1) });
        set(this.dim, { d: curve(76, 1.5, 0.32) });
        show(this.dimT, Tm > 78);
        show(this.prodT, Tm > 88);
      }
      if (k >= 2) {
        const a = k === 2 ? ease(seg(p, 0.05, 0.5)) : 1;
        set(this.prim, { d: primerPath(40, 72, lerp(120, 150, a)), opacity: a });
        set(this.probe, { opacity: a });
        show(this.primT, a > 0.5);
        const xt = k === 3 ? lerp(72, 330, ease(seg(p, 0.02, 0.9))) : 72;
        set(this.newS, { x1: 72, x2: xt, opacity: xt > 73 ? 1 : 0 });
        set(this.taq, { transform: `translate(${xt + 4} 140)`, opacity: k === 3 ? 1 : 0 });
        // what is left of the probe ahead of Taq
        const pa = Math.max(180, Math.min(262, xt));
        set(this.probe, { x1: pa, x2: 262, y1: lerp(120, 150, a), y2: lerp(120, 150, a),
                          opacity: pa >= 261.5 ? 0 : a });
        show(this.probeT, k === 2 && a > 0.5);
        this.bits.forEach((b, i) => {
          const bx = 186 + i * 16;
          const t = k === 3 ? seg(xt, bx, bx + 50) : 0;
          set(b, { x1: bx - 5, x2: bx + 5, y1: 150 - 60 * t, y2: 146 - 60 * t,
                   opacity: t > 0 && t < 1 ? 1 - t : 0 });
        });
        const freed = k === 3 ? ease(seg(xt, 180, 230)) : 0;
        const rx = lerp(176, 140, freed), ry = lerp(lerp(120, 150, a), 70, freed);
        set(this.rep, { cx: rx, cy: ry, fill: freed > 0.9 ? '#22C55E' : '#9DBFA3', opacity: a });
        set(this.rHalo, { cx: rx, cy: ry, opacity: freed > 0.9 ? 0.3 : 0 });
        const qf = k === 3 ? ease(seg(xt, 262, 320)) : 0;
        set(this.qu, { cx: lerp(266, 300, qf), cy: lerp(lerp(120, 150, a), 96, qf), opacity: a });
        show(this.quT, k === 2 && a > 0.5);
        show(this.fret, k === 2 && p > 0.55);
        show(this.fretT, k === 2 && p > 0.55);
        this.repT.textContent = freed > 0.9 ? 'free reporter: glows' : 'reporter (FAM)';
        set(this.repT, { x: freed > 0.9 ? 140 : 132, y: freed > 0.9 ? 46 : 126,
          fill: freed > 0.9 ? '#15803D' : '#4B7B57', opacity: k === 3 || a > 0.5 ? 1 : 0 });
      }
    }
  });

  /* ======================================================= the qPCR plot */
  const S = 1 / Math.LN2;               // a slope of exactly one doubling per cycle
  // midpoints chosen so the first curve crosses the threshold at exactly 17
  const C50 = [0, 1, 2, 3].map(i => 17 + S * Math.log(9) + i * 3.32);
  const CQ = C50.map(c => c - S * Math.log(9));      // crossing at 10% of plateau
  const QC = [K.INDIGO, K.TEAL, K.GREEN, K.AMBER];
  const QL = ['10⁶', '10⁵', '10⁴', '10³'];
  Anim.add({
    id: 'qpcr', group: 'pcr', groupName: 'PCR',
    title: 'qPCR: reading the amplification plot',
    sub: 'Threshold, Cq and the standard curve',
    steps: [
      ['A curve for every sample',
       'A qPCR machine measures the fluorescence in every tube at the'
       + ' end of each cycle. Each sample traces an S-shaped curve: a '
       + 'flat baseline while there is too little product to detect, an'
       + ' exponential rise in which the product doubles every cycle, '
       + 'and a plateau as the reagents run out. These four curves come'
       + ' from ten-fold dilutions of the same template.', 8],
      ['Threshold and Cq',
       'A threshold is set above the background, within the '
       + 'exponential part of the curves. The cycle at which a curve '
       + 'crosses it is that sample\'s Cq, the quantification cycle. A '
       + 'sample that started with more template reaches the threshold '
       + 'sooner, so it has a lower Cq.', 6],
      ['Ten-fold less, 3.3 cycles later',
       'Because the product doubles every cycle, it takes about 3.32 '
       + 'cycles to grow ten-fold, since 2 to the power 3.32 is 10. So,'
       + ' with perfect efficiency, each ten-fold dilution crosses the '
       + 'threshold 3.32 cycles later than the one before. Evenly '
       + 'spaced curves are the sign of a well-behaved assay.', 6],
      ['The standard curve',
       'Plotting Cq against the log of the starting copy number gives'
       + ' a straight line, the standard curve. A slope of minus 3.32 '
       + 'means 100% efficiency, because efficiency equals 10 to the '
       + 'power of minus one over the slope, minus one. The Cq of an '
       + 'unknown can then be read off the line as a starting copy '
       + 'number, which is absolute quantification.', 8]
    ],
    note: 'For relative quantification you compare a target gene with'
        + ' a reference gene in the same samples instead. The fold '
        + 'change is 2 to the power of minus delta-delta-Cq, which '
        + 'holds when both genes amplify at close to 100% efficiency.',
    init(g) {
      this.X = c => 48 + c * 7.3;
      this.Y = f => 200 - f * 158;
      this.plot = el('g', null, g);
      el('line', { x1: 48, y1: 200, x2: 342, y2: 200, stroke: K.LINE }, this.plot);
      el('line', { x1: 48, y1: 36, x2: 48, y2: 200, stroke: K.LINE }, this.plot);
      [0, 10, 20, 30, 40].forEach(c => text(this.plot, this.X(c), 211, String(c),
        { 'font-size': 10, fill: K.MUTED }));
      text(this.plot, 318, 226, 'cycle', { 'font-size': 10, fill: K.MUTED });
      text(this.plot, 52, 30, 'fluorescence', { 'font-size': 10, fill: K.MUTED,
                                                'text-anchor': 'start' });
      this.curves = QC.map(c => el('path', { fill: 'none', stroke: c, 'stroke-width': 2.4 }, this.plot));
      // legend in the top left, where every curve is still at baseline
      text(this.plot, 78, 46, 'copies', { 'font-size': 9.5, fill: K.MUTED, 'text-anchor': 'start' });
      this.cqH = text(this.plot, 116, 46, 'Cq', { 'font-size': 9.5, fill: K.MUTED,
                                                  'text-anchor': 'start' });
      this.leg = QC.map((c, i) => {
        const y = 62 + i * 16;
        el('rect', { x: 58, y: y - 2, width: 14, height: 4, rx: 2, fill: c }, this.plot);
        text(this.plot, 78, y, QL[i], { 'font-size': 10.5, fill: K.INK, 'text-anchor': 'start' });
        return text(this.plot, 116, y, '', { 'font-size': 10.5, fill: c,
                                             'font-weight': 700, 'text-anchor': 'start' });
      });
      this.thr = el('line', { x1: 48, x2: 342, stroke: K.RED, 'stroke-width': 1.5,
                              'stroke-dasharray': '6 4' }, this.plot);
      this.thrT = text(this.plot, 338, 0, 'threshold', { 'font-size': 10, fill: K.RED,
                                                         'text-anchor': 'end' });
      this.cq = QC.map(c => el('line', { stroke: c, 'stroke-width': 1.5,
                                         'stroke-dasharray': '3 3' }, this.plot));
      this.gapT = text(this.plot, 0, 0, '', { 'font-size': 10, fill: K.INK, 'font-weight': 700 });

      // standard curve
      this.sc = el('g', null, g);
      this.LX = l => 60 + (l - 2) * 54;
      this.CY = c => 200 - (c - 10) * 6.4;
      el('line', { x1: 60, y1: 200, x2: 336, y2: 200, stroke: K.LINE }, this.sc);
      el('line', { x1: 60, y1: 36, x2: 60, y2: 200, stroke: K.LINE }, this.sc);
      [2, 3, 4, 5, 6, 7].forEach(l => text(this.sc, this.LX(l), 211, `10${'⁰¹²³⁴⁵⁶⁷'[l]}`,
        { 'font-size': 10, fill: K.MUTED }));
      [15, 20, 25, 30, 35].forEach(c => text(this.sc, 54, this.CY(c), String(c),
        { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'end' }));
      text(this.sc, 300, 226, 'starting copies (log scale)', { 'font-size': 10, fill: K.MUTED });
      text(this.sc, 66, 30, 'Cq', { 'font-size': 10.5, fill: K.MUTED, 'text-anchor': 'start',
                                    'font-weight': 700 });
      this.fit = el('line', { stroke: K.INDIGO, 'stroke-width': 2 }, this.sc);
      this.dots = QC.map(c => el('circle', { r: 5, fill: c, stroke: '#fff', 'stroke-width': 1.5 }, this.sc));
      this.slopeT = text(this.sc, 250, 52, 'slope −3.32: 100% efficient',
        { 'font-size': 11, fill: K.INDIGO, 'font-weight': 700 });
      this.unk = el('path', { fill: 'none', stroke: K.RED, 'stroke-width': 1.5,
                              'stroke-dasharray': '4 3' }, this.sc);
      this.unkD = el('circle', { r: 5, fill: K.RED }, this.sc);
      this.unkT = text(this.sc, 250, 76, '', { 'font-size': 10.5, fill: K.RED, 'font-weight': 700 });
      this.unkT2 = text(this.sc, 250, 92, '', { 'font-size': 10.5, fill: K.RED, 'font-weight': 700 });
    },
    F(c, i) { return 0.015 + 0.985 / (1 + Math.exp(-(c - C50[i]) / S)); },
    frame(k, p) {
      show(this.plot, k <= 2);
      show(this.sc, k === 3);
      if (k <= 2) {
        const cmax = k === 0 ? 40 * p : 40;
        this.curves.forEach((path, i) => {
          let d = '';
          for (let c = 0; c <= cmax + 0.001; c += 0.25) {
            d += (d ? ' L ' : 'M ') + this.X(c).toFixed(1) + ' ' + this.Y(this.F(c, i)).toFixed(1);
          }
          set(path, { d });
        });
        const ty = this.Y(0.1 + 0.015 * 0.9);
        const thrOn = k >= 1 ? seg(p, 0, 0.25) : 0;
        set(this.thr, { y1: ty, y2: ty, opacity: k === 1 ? thrOn : k === 2 ? 1 : 0 });
        set(this.thrT, { y: ty - 7, opacity: k >= 1 ? (k === 1 ? thrOn : 1) : 0 });
        const nCq = k === 0 ? 0 : k === 1 ? (p > 0.4 ? 1 : 0) : 1 + Math.min(3, Math.floor(p * 4));
        this.cq.forEach((l, i) => {
          const x = this.X(CQ[i]);
          set(l, { x1: x, x2: x, y1: ty, y2: 200, opacity: i < nCq ? 1 : 0 });
        });
        this.leg.forEach((t, i) => { t.textContent = i < nCq ? CQ[i].toFixed(2) : ''; });
        show(this.cqH, nCq > 0);
        const showGap = k === 2 && nCq >= 2;
        this.gapT.textContent = showGap ? '3.32 cycles apart' : '';
        set(this.gapT, { x: (this.X(CQ[0]) + this.X(CQ[1])) / 2, y: 224 });
      }
      if (k === 3) {
        const n = Math.min(4, Math.floor(p * 6));
        this.dots.forEach((d, i) => {
          set(d, { cx: this.LX(6 - i), cy: this.CY(CQ[i]), opacity: i < n ? 1 : 0 });
        });
        const cy = l => CQ[0] + (6 - l) * 3.32;
        const fitOn = p > 0.62;
        set(this.fit, { x1: this.LX(2.6), y1: this.CY(cy(2.6)), x2: this.LX(6.8),
                        y2: this.CY(cy(6.8)), opacity: fitOn ? 1 : 0 });
        show(this.slopeT, fitOn);
        const uOn = p > 0.8;
        const uCq = 21.8, ul = 6 - (uCq - CQ[0]) / 3.32;
        set(this.unk, { d: `M 60 ${this.CY(uCq)} L ${this.LX(ul)} ${this.CY(uCq)} L ${this.LX(ul)} 200`,
                        opacity: uOn ? 1 : 0 });
        set(this.unkD, { cx: this.LX(ul), cy: this.CY(uCq), opacity: uOn ? 1 : 0 });
        const copies = Math.pow(10, ul);
        this.unkT.textContent = uOn ? `an unknown at Cq ${uCq}` : '';
        this.unkT2.textContent = uOn ? `≈ ${fmt(Math.round(copies / 100) * 100)} copies` : '';
      }
    }
  });
})();
