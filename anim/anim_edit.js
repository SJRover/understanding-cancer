/* Gene editing animation: CRISPR-Cas9 from guide to repair. Content follows
   the SL50187 CRISPR lectures (introduction, and CRISPR in Aspergillus). */
'use strict';

(() => {
  const K = Anim.kit;
  const { el, text, set, show, lerp, seg, ease } = K;
  const RNA = '#E11D48', TRACR = '#F59E0B', CAS = '#C7D2FE', CASE = '#4F46E5';
  const NEWC = '#16A34A';

  Anim.add({
    id: 'crispr', group: 'edit', groupName: 'Gene editing',
    title: 'CRISPR-Cas9: find, cut, repair',
    sub: 'A guide RNA takes Cas9 to one site',
    steps: [
      ['The guide and the enzyme',
       'In bacteria, Cas9 is guided by two RNAs. The crRNA carries a '
       + '20-nucleotide spacer that matches the target, and the '
       + 'tracrRNA pairs with the crRNA and holds it on Cas9. For gene '
       + 'editing the two are joined by a short loop into one single '
       + 'guide RNA, the sgRNA. Cas9 bound to its guide forms a '
       + 'ribonucleoprotein, or RNP.', 7],
      ['Scan for a PAM',
       'The RNP moves along the DNA looking for a PAM, the short '
       + 'motif NGG for Streptococcus pyogenes Cas9. Only when it finds'
       + ' a PAM does it check whether the 20 bases beside it match the'
       + ' guide. If they do not, it moves on, and without a PAM it '
       + 'never checks at all, however well the sequence matches.', 8],
      ['Match, then cut',
       'At a matching site Cas9 unwinds the DNA next to the PAM, and '
       + 'the guide pairs with one strand, forming an R-loop. If all 20'
       + ' bases match, Cas9\'s two nuclease domains each cut one '
       + 'strand, HNH the strand paired with the guide and RuvC the '
       + 'other, about 3 bases upstream of the PAM. The result is a '
       + 'double-strand break.', 8],
      ['The cell repairs the break',
       'The cell has to mend the break. Non-homologous end joining '
       + 'simply sticks the ends back together and often gains or loses'
       + ' a few bases, an indel that can shift the reading frame and '
       + 'knock the gene out. If a repair template with matching flanks'
       + ' is supplied, homologous recombination copies it instead, '
       + 'giving a precise change or a clean deletion.', 9]
    ],
    note: 'Many bacteria cannot carry out non-homologous end joining,'
        + ' so a break with no template kills them. That is the basis'
        + ' of CRISPR antimicrobials, and it also selects for edited '
        + 'cells, because once the target has changed Cas9 no longer '
        + 'cuts it.',
    init(g) {
      // ---------- stage 1: two RNAs become one guide, then an RNP
      const r = this.rna = el('g', null, g);
      this.cas1 = el('ellipse', { cx: 180, cy: 128, rx: 0, ry: 0, fill: CAS,
                                  stroke: CASE, 'stroke-width': 2 }, r);
      // crRNA: spacer then repeat
      el('line', { x1: 60, y1: 110, x2: 150, y2: 110, stroke: RNA, 'stroke-width': 5,
                   'stroke-linecap': 'round' }, r);
      el('line', { x1: 150, y1: 110, x2: 210, y2: 110, stroke: '#FB7185', 'stroke-width': 5,
                   'stroke-linecap': 'round' }, r);
      text(r, 105, 96, 'spacer, 20 nt', { 'font-size': 10, fill: RNA, 'font-weight': 700 });
      this.crT = text(r, 180, 96, 'crRNA', { 'font-size': 10.5, fill: '#BE123C', 'font-weight': 700 });
      // tracrRNA pairs with the repeat, then loops into the scaffold
      this.tracr = el('path', { d: 'M 150 122 L 210 122 Q 236 122 236 140 Q 236 158 214 158 '
                                  + 'Q 196 158 196 142 Q 196 132 224 132',
                                fill: 'none', stroke: TRACR, 'stroke-width': 5,
                                'stroke-linecap': 'round' }, r);
      this.pair = el('g', null, r);
      for (let x = 154; x <= 206; x += 7) {
        el('line', { x1: x, x2: x, y1: 113, y2: 119, stroke: '#9CA3AF', 'stroke-width': 1.5 }, this.pair);
      }
      this.trT = text(r, 270, 140, 'tracrRNA', { 'font-size': 10.5, fill: '#B45309', 'font-weight': 700 });
      this.loop = el('path', { d: 'M 210 110 Q 228 96 222 112 Q 218 120 210 122', fill: 'none',
                               stroke: '#7C3AED', 'stroke-width': 4, 'stroke-linecap': 'round' }, r);
      this.sgT = text(r, 180, 36, '', { 'font-size': 12, fill: K.INK, 'font-weight': 800 });
      this.sgT2 = text(r, 180, 54, '', { 'font-size': 10.5, fill: K.MUTED });
      this.rnpT = text(r, 180, 206, '', { 'font-size': 11.5, fill: CASE, 'font-weight': 800 });

      // ---------- stages 2 and 3: the DNA
      const d = this.dna = el('g', null, g);
      this.Y1 = 150; this.Y2 = 166;
      this.rungs = [];
      for (let x = 14; x <= 346; x += 7) {
        this.rungs.push({ x, l: el('line', { x1: x, x2: x, stroke: K.LINE, 'stroke-width': 1.4 }, d) });
      }
      this.top = el('path', { fill: 'none', stroke: K.INDIGO, 'stroke-width': 4,
                              'stroke-linecap': 'round' }, d);
      this.bot = el('path', { fill: 'none', stroke: K.TEAL, 'stroke-width': 4,
                              'stroke-linecap': 'round' }, d);
      this.proto = el('rect', { x: 200, y: this.Y1 - 3, width: 60, height: 6, rx: 2,
                                fill: '#FDE68A', opacity: 0.9 }, d);
      text(d, 7, 150, "5'", { 'font-size': 9, fill: K.MUTED });
      text(d, 7, 166, "3'", { 'font-size': 9, fill: K.MUTED });
      text(d, 346, 196, 'target DNA', { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'end' });
      this.guide = el('line', { y1: 0, y2: 0, stroke: RNA, 'stroke-width': 4,
                                'stroke-linecap': 'round' }, d);
      this.rnp = el('g', null, d);
      el('ellipse', { cx: 0, cy: -8, rx: 42, ry: 32, fill: CAS, stroke: CASE, 'stroke-width': 2,
                      opacity: 0.6 }, this.rnp);
      text(this.rnp, 0, -48, 'Cas9 + sgRNA', { 'font-size': 10, fill: CASE, 'font-weight': 800 });
      this.PAMS = [104, 262];                 // x of each NGG on the top strand
      this.pams = this.PAMS.map(x => {
        const p = el('g', null, d);
        el('rect', { x: x - 2, y: this.Y1 - 14, width: 20, height: 10, rx: 2, fill: K.AMBER }, p);
        text(p, x + 8, this.Y1 - 8.6, 'NGG', { 'font-size': 8, fill: '#fff', 'font-weight': 800 });
        return p;
      });
      this.cuts = [0, 1].map(() => {
        const c = el('g', null, d);
        el('path', { d: 'M -5 -6 L 0 0 L -5 6 M 5 -6 L 0 0 L 5 6', stroke: K.RED,
                     'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, c);
        return c;
      });
      this.dT = text(d, 180, 34, '', { 'font-size': 11.5, fill: K.INK, 'font-weight': 800 });
      this.dT2 = text(d, 180, 52, '', { 'font-size': 10.5, fill: K.MUTED });
      this.hnh = text(d, 300, 214, '', { 'font-size': 10, fill: K.RED, 'font-weight': 700 });

      // ---------- stage 4: two repairs
      const rp = this.rep = el('g', null, g);
      const strandPair = (y, parent) => {
        const L = el('g', null, parent), R = el('g', null, parent);
        el('line', { x1: 40, x2: 178, y1: y, y2: y, stroke: K.INDIGO, 'stroke-width': 4,
                     'stroke-linecap': 'round' }, L);
        el('line', { x1: 40, x2: 178, y1: y + 10, y2: y + 10, stroke: K.TEAL, 'stroke-width': 4,
                     'stroke-linecap': 'round' }, L);
        el('line', { x1: 182, x2: 320, y1: y, y2: y, stroke: K.INDIGO, 'stroke-width': 4,
                     'stroke-linecap': 'round' }, R);
        el('line', { x1: 182, x2: 320, y1: y + 10, y2: y + 10, stroke: K.TEAL, 'stroke-width': 4,
                     'stroke-linecap': 'round' }, R);
        return { L, R };
      };
      text(rp, 12, 30, 'NHEJ', { 'font-size': 11.5, fill: K.INK, 'font-weight': 800, 'text-anchor': 'start' });
      this.n = strandPair(62, rp);
      this.ins = el('rect', { x: 176, y: 58, width: 8, height: 18, rx: 2, fill: K.RED }, rp);
      this.nT = text(rp, 180, 100, '', { 'font-size': 10.5, fill: K.RED, 'font-weight': 700 });
      text(rp, 12, 130, 'HR', { 'font-size': 11.5, fill: K.INK, 'font-weight': 800, 'text-anchor': 'start' });
      this.donor = el('g', null, rp);
      el('line', { x1: 110, x2: 168, y1: 0, y2: 0, stroke: NEWC, 'stroke-width': 4, 'stroke-linecap': 'round' }, this.donor);
      el('line', { x1: 168, x2: 192, y1: 0, y2: 0, stroke: K.AMBER, 'stroke-width': 4, 'stroke-linecap': 'round' }, this.donor);
      el('line', { x1: 192, x2: 250, y1: 0, y2: 0, stroke: NEWC, 'stroke-width': 4, 'stroke-linecap': 'round' }, this.donor);
      this.donorT = text(rp, 180, 140, 'template: matching flanks, new middle', { 'font-size': 10,
        fill: NEWC, 'font-weight': 700 });
      this.h = strandPair(178, rp);
      this.fill = el('g', null, rp);
      el('rect', { x: 168, y: 174, width: 24, height: 18, rx: 2, fill: K.AMBER }, this.fill);
      this.hT = text(rp, 180, 218, '', { 'font-size': 10.5, fill: '#B45309', 'font-weight': 700 });
    },
    strands(open, broken) {
      // the DNA, bowed open between 196 and 262 by `open`, split at 251 by `broken`
      const Y1 = this.Y1, Y2 = this.Y2;
      const bow = x => {
        if (x < 192 || x > 266) return 0;
        const u = (x - 229) / 37;
        return Math.max(0, 1 - u * u);
      };
      const path = (y, dir) => {
        let d1 = '', d2 = '';
        for (let x = 14; x <= 346; x += 2) {
          const yy = y + dir * 16 * open * bow(x);
          const xx = x + (x < 251 ? -1 : 1) * 7 * broken;
          if (x < 251 || !broken) d1 += (d1 ? ' L ' : 'M ') + xx.toFixed(1) + ' ' + yy.toFixed(1);
          else d2 += (d2 ? ' L ' : 'M ') + xx.toFixed(1) + ' ' + yy.toFixed(1);
        }
        return d1 + (d2 ? ' ' + d2 : '');
      };
      set(this.top, { d: path(Y1, -1) });
      set(this.bot, { d: path(Y2, 1) });
      this.rungs.forEach(({ x, l }) => {
        const gone = open * bow(x) > 0.2;
        const xx = x + (x < 251 ? -1 : 1) * 7 * broken;
        set(l, { x1: xx, x2: xx, y1: Y1 + 2, y2: Y2 - 2, opacity: gone ? 0 : 1 });
      });
    },
    frame(k, p) {
      show(this.rna, k === 0);
      show(this.dna, k === 1 || k === 2);
      show(this.rep, k === 3);
      if (k === 0) {
        const join = ease(seg(p, 0.35, 0.6));
        const rnp = ease(seg(p, 0.65, 0.9));
        set(this.loop, { opacity: join });
        set(this.cas1, { rx: 118 * rnp, ry: 58 * rnp, opacity: 0.55 * rnp });
        show(this.pair, true);
        this.sgT.textContent = join > 0.5 ? 'one single guide RNA (sgRNA)' : 'two RNAs: crRNA and tracrRNA';
        this.sgT2.textContent = join > 0.5 ? 'crRNA and tracrRNA joined by a loop' : 'the tracrRNA pairs with the repeat';
        this.rnpT.textContent = rnp > 0.5 ? 'Cas9 + sgRNA = a ribonucleoprotein (RNP)' : '';
      }
      if (k === 1 || k === 2) {
        let cx = 236, msg = '', msg2 = '';
        if (k === 1) {
          if (p < 0.3) { cx = lerp(40, 112, ease(p / 0.3)); msg = 'scanning for a PAM'; }
          else if (p < 0.5) { cx = 112; msg = 'a PAM: test the next 20 nt'; msg2 = 'no match with the guide, so move on'; }
          else if (p < 0.85) { cx = lerp(112, 236, ease((p - 0.5) / 0.35)); msg = 'scanning for a PAM'; }
          else { cx = 236; msg = 'a PAM, and the next 20 nt match'; msg2 = 'this is the target'; }
        }
        set(this.rnp, { transform: `translate(${cx} 150)` });
        const open = k === 2 ? ease(seg(p, 0.05, 0.4)) : 0;
        const broken = k === 2 ? ease(seg(p, 0.75, 0.95)) : 0;
        this.strands(open, broken);
        // the guide pairs with the target (bottom) strand inside the bubble
        const gl = k === 2 ? seg(p, 0.3, 0.55) : 0;
        set(this.guide, { x1: 200 - 7 * broken, x2: lerp(200, 248, gl) - 7 * broken,
                          y1: this.Y2 + 8, y2: this.Y2 + 8, opacity: gl > 0 ? 1 : 0 });
        set(this.proto, { opacity: k === 2 ? 0 : 0.9 });
        this.pams.forEach((pm, i) => set(pm, { transform: k === 2 && i === 1 ? `translate(${7 * broken} ${-16 * open * 0.05})` : '' }));
        const cut = k === 2 && p > 0.6;
        set(this.cuts[0], { transform: `translate(${251 - 7 * broken} ${this.Y1 - 16 * open * 0.62})`, opacity: cut ? 1 : 0 });
        set(this.cuts[1], { transform: `translate(${251 - 7 * broken} ${this.Y2 + 16 * open * 0.62})`, opacity: cut ? 1 : 0 });
        if (k === 2) {
          msg = p < 0.3 ? 'unwind beside the PAM' : p < 0.6 ? 'R-loop: the guide pairs with one strand'
            : p < 0.75 ? 'HNH and RuvC each cut one strand' : 'a double-strand break';
          msg2 = p >= 0.6 ? 'about 3 bp upstream of the PAM' : 'the 20 nt protospacer must match';
        }
        this.dT.textContent = msg;
        this.dT2.textContent = msg2;
        this.hnh.textContent = '';
      }
      if (k === 3) {
        const a = ease(seg(p, 0.05, 0.4));
        set(this.n.L, { transform: `translate(${-8 * (1 - a)} 0)` });
        set(this.n.R, { transform: `translate(${8 * (1 - a)} 0)` });
        set(this.ins, { opacity: seg(p, 0.3, 0.42) });
        this.nT.textContent = p > 0.42 ? 'ends joined, a base gained or lost: an indel' : '';
        const b = ease(seg(p, 0.5, 0.75));
        set(this.donor, { transform: `translate(0 ${lerp(108, 156, b)})`, opacity: seg(p, 0.45, 0.55) });
        show(this.donorT, p > 0.5);
        set(this.h.L, { transform: `translate(${-10 * (1 - seg(p, 0.75, 0.9))} 0)` });
        set(this.h.R, { transform: `translate(${10 * (1 - seg(p, 0.75, 0.9))} 0)` });
        set(this.fill, { opacity: seg(p, 0.78, 0.9) });
        this.hT.textContent = p > 0.9 ? 'the template is copied in: a precise edit' : '';
      }
    }
  });
})();
