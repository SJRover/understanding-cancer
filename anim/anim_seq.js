/* Sequencing animations: Sanger, Illumina, PacBio, Nanopore.
   Content follows the SL50168 Techniques 3 sequencing and long-read
   sections; numbers are the ones the deck uses. */
'use strict';

(() => {
  const K = Anim.kit;
  const { el, text, set, show, lerp, seg, ease, BASE } = K;

  /* ================================================================ Sanger */
  Anim.add({
    id: 'sanger', group: 'seq', groupName: 'Sequencing',
    title: 'Sanger sequencing',
    sub: 'Chain termination, then separation by length',
    steps: [
      ['The reaction mix',
       'Sanger sequencing copies a single-stranded template, starting'
       + ' from a short primer annealed just before the region you want'
       + ' to read. The tube holds DNA polymerase, plenty of the four '
       + 'normal nucleotides (dNTPs) and a small amount of each '
       + 'dideoxynucleotide (ddNTP). Each of the four ddNTPs carries a '
       + 'different fluorescent dye, so whichever one ends a strand '
       + 'tells you which base it is.', 4],
      ['Every chain stops somewhere',
       'The polymerase extends the primer one base at a time, '
       + 'matching each base in the template. Usually it adds a normal '
       + 'dNTP and carries on, but now and then it adds a ddNTP '
       + 'instead. A ddNTP has no 3\' hydroxyl group, so nothing more '
       + 'can be joined and that strand stops. With millions of copies '
       + 'in the tube, some stop at every position, giving fragments '
       + 'that differ in length by one base, each ending in a coloured '
       + 'base.', 6],
      ['Separate by length',
       'The fragments are pulled through a thin capillary filled with'
       + ' a gel-like polymer towards the positive electrode, because '
       + 'DNA is negatively charged. The polymer holds back longer '
       + 'fragments more than shorter ones, so the fragments line up in'
       + ' order of length. The separation is fine enough that '
       + 'fragments differing by a single nucleotide arrive at '
       + 'different times.', 6],
      ['Read the colours in order',
       'Near the end of the capillary a laser excites each fragment '
       + 'as it passes, and a detector records the colour of its dye. '
       + 'The shortest fragment arrives first and ends at the first '
       + 'base after the primer, so reading the colours in order spells'
       + ' out the new strand from 5\' to 3\'. Plotted against time, the '
       + 'signals form the chromatogram you see in a Sanger trace, one '
       + 'peak per base.', 8]
    ],
    note: 'Sanger reads are up to about 1,000 bases long and highly '
        + 'accurate, which is why Sanger is still the standard way to'
        + ' check a cloned insert or confirm a single mutation, even '
        + 'though each reaction reads only one fragment.',
    init(g) {
      const SEQ = 'GATTACAGCT';
      const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
      this.SEQ = SEQ;
      const x0 = 70, dx = 26;
      this.x = i => x0 + i * dx;
      // template, read 3' to 5' above the new strand
      this.tpl = el('g', null, g);
      text(this.tpl, 30, 30, "3'", { fill: K.MUTED, 'font-size': 10 });
      text(this.tpl, x0 + 10 * dx, 30, "5'", { fill: K.MUTED, 'font-size': 10 });
      el('line', { x1: 40, y1: 38, x2: x0 + 10 * dx - 8, y2: 38,
                   stroke: K.LINE, 'stroke-width': 2 }, this.tpl);
      [...SEQ].forEach((b, i) => text(this.tpl, this.x(i), 30, COMP[b],
        { 'font-size': 11, fill: K.MUTED, 'font-family': 'monospace' }));
      text(this.tpl, 170, 13, 'template strand', { fill: K.MUTED, 'font-size': 10 });
      this.primer = el('rect', { x: 32, y: 44, width: 30, height: 7, rx: 2,
                                 fill: K.AMBER }, g);
      this.primerT = text(g, 47, 60, 'primer', { 'font-size': 10, fill: K.AMBER });

      // the pool
      this.pool = el('g', null, g);
      const rng = (n => () => (n = (n * 16807) % 2147483647) / 2147483647)(7);
      this.dots = [];
      for (let i = 0; i < 34; i++) {
        const dd = i % 4 === 0;
        const b = 'ACGT'[(i >> 2) % 4];
        const c = el('circle', { r: dd ? 5 : 4,
          fill: dd ? BASE[b] : '#BFC5D2', stroke: dd ? '#fff' : 'none',
          'stroke-width': 1.5 }, this.pool);
        this.dots.push({ c, x: 30 + rng() * 300, y: 85 + rng() * 115,
                         ph: rng() * 6.28 });
      }
      text(this.pool, 95, 226, 'grey: dNTPs', { 'font-size': 10, fill: K.MUTED });
      text(this.pool, 240, 226, 'coloured: dye-labelled ddNTPs',
           { 'font-size': 10, fill: K.MUTED });

      // ten products, one ending at each position
      this.rows = el('g', null, g);
      this.prods = [];
      for (let L = 1; L <= 10; L++) {
        const y = 74 + (L - 1) * 14.5;
        const row = el('g', null, this.rows);
        el('rect', { x: 32, y: y - 3, width: 30, height: 6, rx: 2, fill: K.AMBER }, row);
        const bases = [];
        for (let i = 0; i < L; i++) {
          const last = i === L - 1;
          bases.push(text(row, this.x(i), y, SEQ[i], { 'font-size': 11,
            'font-family': 'monospace', 'font-weight': last ? 700 : 400,
            fill: last ? BASE[SEQ[i]] : K.INK }));
        }
        const end = el('circle', { r: 4.5, fill: BASE[SEQ[L - 1]] }, row);
        this.prods.push({ bases, end, L, y });
      }

      // capillary and detector; DNA runs towards the positive end
      this.cap = el('g', null, g);
      el('rect', { x: 20, y: 60, width: 320, height: 22, rx: 11,
                   fill: '#F1F2FB', stroke: K.LINE }, this.cap);
      text(this.cap, 10, 71, '−', { 'font-size': 15, fill: K.MUTED });
      text(this.cap, 350, 71, '+', { 'font-size': 15, fill: K.MUTED });
      text(this.cap, 82, 48, 'gel-filled capillary', { 'font-size': 10, fill: K.MUTED });
      this.det = el('rect', { x: 286, y: 54, width: 14, height: 34, rx: 3,
                              fill: '#FDE68A', stroke: K.AMBER }, this.cap);
      text(this.cap, 293, 42, 'laser + detector', { 'font-size': 10, fill: K.AMBER });
      this.bands = [];
      for (let L = 1; L <= 10; L++) {
        this.bands.push(el('rect', { y: 64, height: 14, rx: 2, width: 6,
                                     fill: BASE[SEQ[L - 1]] }, this.cap));
      }
      this.faster = text(g, 170, 102, 'shorter fragments move faster →',
                         { 'font-size': 11, fill: K.INDIGO, 'font-weight': 700 });
      // where each band has reached at the end of stage 3 (t = 1)
      this.bx = (L, t) => 26 + t * (280 - (L - 1) * 15 - 26);

      // chromatogram
      this.chrom = el('g', null, g);
      el('line', { x1: 28, y1: 200, x2: 332, y2: 200, stroke: K.LINE }, this.chrom);
      this.peaks = [];
      for (let i = 0; i < 10; i++) {
        const cx = 45 + i * 29;
        const path = el('path', { fill: 'none', stroke: BASE[SEQ[i]],
                                  'stroke-width': 2.2 }, this.chrom);
        const t = text(this.chrom, cx, 214, SEQ[i], { 'font-size': 12,
          'font-weight': 700, fill: BASE[SEQ[i]], 'font-family': 'monospace' });
        const h = 40 + ((i * 37) % 11) * 2;
        set(path, { d: `M ${cx - 14} 200 C ${cx - 8} 200 ${cx - 5} ${200 - h} ${cx} ${200 - h} `
                     + `C ${cx + 5} ${200 - h} ${cx + 8} 200 ${cx + 14} 200` });
        this.peaks.push({ path, t });
      }
      this.read = text(this.chrom, 180, 124, '', { 'font-size': 12,
        fill: K.INK, 'font-family': 'monospace', 'font-weight': 700 });
    },
    frame(k, p) {
      const SEQ = this.SEQ;
      show(this.tpl, k <= 1);
      show(this.pool, k === 0);
      show(this.rows, k === 1);
      show(this.primer, k <= 1);
      show(this.primerT, k <= 1);
      show(this.cap, k >= 2);
      show(this.chrom, k >= 3);
      show(this.faster, k === 2 && p > 0.25);

      if (k === 0) {
        this.dots.forEach(d => set(d.c, {
          cx: d.x + 6 * Math.sin(p * 6.28 + d.ph),
          cy: d.y + 5 * Math.cos(p * 6.28 + d.ph) }));
      }
      if (k === 1) {
        const grow = ease(K.clamp(p * 1.15));
        this.prods.forEach(pr => {
          const n = Math.min(pr.L, grow * 10);
          pr.bases.forEach((b, i) => show(b, i < Math.floor(n + 0.001)));
          show(pr.end, n >= pr.L - 0.001);
          set(pr.end, { cx: this.x(pr.L - 1) + 11, cy: pr.y });
        });
      }
      if (k >= 2) {
        // stage 2 brings every band to just short of the detector; stage 3
        // carries on at the same speeds, so each crosses it in length order
        const t = k === 2 ? p : 1 + p * 1.3;
        let n = 0, flash = -1;
        this.bands.forEach((b, i) => {
          const x = this.bx(i + 1, t);
          if (x >= 290) {
            n += 1;
            if (x < 304) flash = i;
          }
          show(b, x < 290);
          set(b, { x });
        });
        set(this.det, { fill: flash >= 0 ? BASE[SEQ[flash]] : '#FDE68A' });
        if (k === 3) {
          this.peaks.forEach((pk, i) => { show(pk.path, i < n); show(pk.t, i < n); });
          this.read.textContent = n ? `5'-${SEQ.slice(0, n)}${n === 10 ? "-3'" : ''}` : '';
        }
      }
    }
  });

  /* ============================================================== Illumina */
  Anim.add({
    id: 'illumina', group: 'seq', groupName: 'Sequencing',
    title: 'Illumina: sequencing by synthesis',
    sub: 'Clusters, then one fluorescent base per cycle',
    steps: [
      ['Fragments get adapters',
       'The DNA is first broken into short fragments, typically a few'
       + ' hundred base pairs long, and short synthetic adapters are '
       + 'joined to both ends of every fragment. The adapters do two '
       + 'jobs. They let each fragment bind the oligos that coat the '
       + 'flow cell, and they give the sequencing primer a known place '
       + 'to bind, whatever sequence lies in between.', 5],
      ['Bridge amplification builds a cluster',
       'A single fragment binds a matching oligo on the flow cell and'
       + ' is copied, so a copy is now fixed to the surface. That copy '
       + 'bends over, its free end binds a neighbouring oligo of the '
       + 'second kind to form a bridge, and it is copied again. '
       + 'Repeated many times, this builds a tight cluster of about a '
       + 'thousand identical copies in one spot, enough for the camera '
       + 'to see. Strands of one orientation are then cut away, so '
       + 'every strand in the cluster reads in the same direction.', 9],
      ['One base per cycle',
       'In each cycle all four nucleotides flow across the flow cell '
       + 'together. Each carries its own fluorescent dye and a '
       + 'reversible terminator that stops the polymerase after one '
       + 'base, so every strand in every cluster grows by exactly one. '
       + 'A camera photographs the flow cell and records each cluster\'s'
       + ' colour, then the dye and terminator are removed chemically '
       + 'so the next cycle can add the next base.', 10],
      ['Millions of clusters at once',
       'Every cluster on the flow cell is imaged in the same cycle, '
       + 'so millions of fragments are read side by side, which is what'
       + ' massively parallel sequencing means. Each read is short, '
       + 'often 150 bases from each end of a fragment, but accuracy is '
       + 'about 99.9% per base and one run can produce hundreds of '
       + 'gigabases of sequence.', 5]
    ],
    note: 'Read length is limited because strands in a cluster slowly'
        + ' fall out of step. In each cycle a few miss a base or add '
        + 'an extra one, so after a few hundred cycles the colour '
        + 'from each cluster is blurred.',
    init(g) {
      // stage 1: fragments and adapters
      this.lib = el('g', null, g);
      text(this.lib, 180, 24, 'the genome, cut into short fragments',
           { 'font-size': 11, fill: K.MUTED });
      this.cuts = [[20, 66], [66, 118], [118, 174], [174, 226], [226, 284], [284, 340]]
        .map(([a, b]) => ({ a, b, l: el('line', { y1: 46, y2: 46, stroke: '#9AA1B2',
          'stroke-width': 5, 'stroke-linecap': 'butt' }, this.lib) }));
      this.frag = el('g', null, this.lib);
      el('line', { x1: 110, y1: 120, x2: 250, y2: 120, stroke: '#7B8494',
                   'stroke-width': 7, 'stroke-linecap': 'round' }, this.frag);
      text(this.frag, 180, 100, 'one fragment, a few hundred bp', { 'font-size': 11, fill: K.MUTED });
      this.adL = el('line', { y1: 120, y2: 120, stroke: K.INDIGO,
                              'stroke-width': 7, 'stroke-linecap': 'round' }, this.lib);
      this.adR = el('line', { y1: 120, y2: 120, stroke: K.TEAL,
                              'stroke-width': 7, 'stroke-linecap': 'round' }, this.lib);
      this.adT = text(this.lib, 180, 152, 'adapters joined to both ends',
                      { 'font-size': 11.5, fill: K.INDIGO, 'font-weight': 700 });

      // stage 2: flow cell and bridge amplification
      this.fc = el('g', null, g);
      el('rect', { x: 10, y: 200, width: 340, height: 14, fill: '#E3E6F3' }, this.fc);
      text(this.fc, 180, 228, 'flow cell surface, coated with two kinds of oligo',
           { 'font-size': 10, fill: K.MUTED });
      for (let i = 0; i < 22; i++) {
        el('line', { x1: 18 + i * 15.5, y1: 200, x2: 18 + i * 15.5, y2: 192,
          stroke: i % 2 ? K.TEAL : K.INDIGO, 'stroke-width': 2.5 }, this.fc);
      }
      this.X1 = 18 + 8 * 15.5;           // an indigo oligo
      this.X2 = 18 + 11 * 15.5;          // a teal one nearby
      this.arch = el('path', { fill: 'none', stroke: K.INDIGO, 'stroke-width': 3.5,
                               'stroke-linecap': 'round' }, this.fc);
      this.arch2 = el('path', { fill: 'none', stroke: K.TEAL, 'stroke-width': 3.5,
                                'stroke-linecap': 'round', pathLength: 1 }, this.fc);
      this.strands = [];
      for (let i = 0; i < 24; i++) {
        this.strands.push(el('line', { stroke: i % 2 ? K.TEAL : K.INDIGO,
          'stroke-width': 3, 'stroke-linecap': 'round' }, this.fc));
      }
      this.phaseT = text(this.fc, 180, 34, '', { 'font-size': 12.5,
        'font-weight': 700, fill: K.INK });
      this.count = text(this.fc, 180, 56, '', { 'font-size': 11, fill: K.MUTED });

      // stage 3: four clusters, one base per cycle
      this.sbs = el('g', null, g);
      this.SEQS = ['ACGTA', 'GGTAC', 'TCAGG', 'CATTG'];
      this.cl = this.SEQS.map((s, i) => {
        const x = 50 + i * 87;
        const halo = el('circle', { cx: x, cy: 86, r: 26, fill: '#fff' }, this.sbs);
        const core = el('circle', { cx: x, cy: 86, r: 18, fill: '#D5D9E6' }, this.sbs);
        const lab = text(this.sbs, x, 86, '', { 'font-size': 16,
          'font-weight': 800, fill: '#fff' });
        text(this.sbs, x, 124, `cluster ${i + 1}`, { 'font-size': 10, fill: K.MUTED });
        const read = text(this.sbs, x, 145, '', { 'font-size': 14,
          'font-family': 'monospace', 'font-weight': 700, fill: K.INK });
        return { halo, core, lab, read };
      });
      this.phase = text(this.sbs, 180, 184, '', { 'font-size': 12,
        'font-weight': 700, fill: K.INDIGO });
      this.cyc = text(this.sbs, 180, 205, '', { 'font-size': 11, fill: K.MUTED });
      this.rain = [];
      for (let i = 0; i < 16; i++) {
        this.rain.push(el('circle', { r: 3.5, fill: BASE['ACGT'[i % 4]] }, this.sbs));
      }

      // stage 4: the grid
      this.grid = el('g', null, g);
      this.gd = [];
      for (let r = 0; r < 9; r++) for (let c = 0; c < 16; c++) {
        this.gd.push(el('circle', { cx: 22 + c * 21 + (r % 2) * 6,
          cy: 22 + r * 21, r: 6.5 }, this.grid));
      }
      this.gridT = text(this.grid, 180, 220, '', { 'font-size': 11,
        fill: K.INK, 'font-weight': 700 });
    },
    frame(k, p) {
      show(this.lib, k === 0);
      show(this.fc, k === 1);
      show(this.sbs, k === 2);
      show(this.grid, k === 3);

      if (k === 0) {
        const gap = 8 * ease(seg(p, 0.05, 0.3));
        this.cuts.forEach(c => set(c.l, { x1: c.a + gap / 2, x2: c.b - gap / 2 }));
        set(this.frag, { opacity: seg(p, 0.3, 0.45) });
        const t = ease(seg(p, 0.45, 0.8));
        set(this.adL, { x1: lerp(30, 85, t), x2: lerp(55, 110, t),
                        opacity: seg(p, 0.4, 0.5) });
        set(this.adR, { x1: lerp(330, 275, t), x2: lerp(305, 250, t),
                        opacity: seg(p, 0.4, 0.5) });
        show(this.adT, p > 0.8);
      }

      if (k === 1) {
        const X1 = this.X1, X2 = this.X2;
        const a = ease(seg(p, 0.0, 0.16));      // copy stands up on X1
        const b = ease(seg(p, 0.16, 0.34));     // bends over to X2
        const c = seg(p, 0.34, 0.5);            // copied across the bridge
        const dn = seg(p, 0.5, 0.62);           // denatured into two strands
        const m = seg(p, 0.62, 1.0);            // repeated into a cluster
        let phase, count;
        if (p < 0.16) {
          set(this.arch, { d: `M ${X1} 192 L ${X1} ${192 - 64 * a}`, opacity: 1 });
          phase = 'a fragment binds an oligo, and is copied'; count = '1 copy';
        } else if (p < 0.5) {
          const ex = lerp(X1, X2, b), ey = lerp(128, 192, b);
          set(this.arch, { d: `M ${X1} 192 C ${X1} 112 ${ex} 112 ${ex} ${ey}`, opacity: 1 });
          phase = p < 0.34 ? 'the copy bends over to a neighbouring oligo'
                           : 'and is copied across the bridge';
          count = p < 0.34 ? '1 copy' : '1 copy, and a second being made';
        } else {
          set(this.arch, { d: `M ${X1} 192 C ${X1} 112 ${X2} 112 ${X2} 192`,
                           opacity: 1 - dn });
          phase = p < 0.62 ? 'denatured: two strands, one on each oligo'
                           : 'repeated, over and over: a cluster';
        }
        set(this.arch2, { d: `M ${X2} 192 C ${X2} 120 ${X1} 120 ${X1} 192`,
                          'stroke-dasharray': `${p >= 0.5 ? 1 : c} 1`,
                          opacity: p < 0.34 ? 0 : 1 - dn });
        // the cluster: two strands, then many
        const n = p < 0.5 ? 0 : p < 0.62 ? 2
          : Math.min(24, Math.round(2 * Math.pow(2, m * 3.6)));
        this.strands.forEach((s, i) => {
          const on = i < n;
          show(s, on);
          if (on) {
            const x = i < 2 ? (i ? X2 : X1)
              : (X1 + X2) / 2 + (i % 2 ? 1 : -1) * ((Math.floor(i / 2)) * 7.5 + 3.5);
            const h = i < 2 ? 64 * dn : 60;
            set(s, { x1: x, y1: 192, x2: x, y2: 192 - h });
          }
        });
        if (p >= 0.5) {
          const copies = p < 0.62 ? 2 : Math.min(1000, Math.round(2 * Math.pow(2, m * 9)));
          count = m >= 0.98 ? 'about 1,000 identical copies in one spot'
            : `${copies.toLocaleString()} copies`;
        }
        this.phaseT.textContent = phase;
        this.count.textContent = count;
      }

      if (k === 2) {
        const cycles = 3;          // slow enough to read each step
        const f = p * cycles;
        const ci = Math.min(cycles - 1, Math.floor(f));
        const q = Math.min(1, f - ci);
        const names = ['all four flood in, each with dye and terminator',
                       'one base added to every strand',
                       'camera: each cluster shows one colour',
                       'dye and terminator cleaved off'];
        const ph = q < 0.3 ? 0 : q < 0.5 ? 1 : q < 0.8 ? 2 : 3;
        this.phase.textContent = names[ph];
        this.cyc.textContent = `cycle ${ci + 1} of ${cycles}`;
        this.rain.forEach((d, i) => {
          show(d, ph === 0);
          if (ph === 0) set(d, { cx: 20 + i * 21, cy: lerp(8, 54, (q / 0.3 + (i % 3) * 0.15) % 1) });
        });
        this.cl.forEach((c, i) => {
          const b = this.SEQS[i][ci];
          const lit = ph === 2;
          set(c.core, { fill: lit ? BASE[b] : '#D5D9E6' });
          set(c.halo, { fill: lit ? BASE[b] : '#fff', opacity: lit ? 0.25 : 1 });
          c.lab.textContent = lit ? b : '';
          c.read.textContent = this.SEQS[i].slice(0, ci + (ph >= 2 ? 1 : 0));
        });
      }

      if (k === 3) {
        const cyc = Math.floor(p * 8);
        this.gd.forEach((d, i) => {
          const b = 'ACGT'[(i * 7 + cyc * 3 + (i >> 3)) % 4];
          const on = ((i * 13 + cyc * 5) % 7) !== 0;
          set(d, { fill: on ? BASE[b] : '#D5D9E6', opacity: on ? 0.9 : 0.5 });
        });
        this.gridT.textContent = `cycle ${cyc + 1}: one image, every cluster at once`;
      }
    }
  });

  /* ================================================================ PacBio */
  const FL = { A: BASE.A, C: BASE.C, G: K.AMBER, T: BASE.T };   // flash colours
  Anim.add({
    id: 'pacbio', group: 'seq', groupName: 'Sequencing',
    title: 'PacBio SMRT and HiFi',
    sub: 'One circular molecule, read round and round',
    steps: [
      ['Make the molecule a circle',
       'PacBio reads long single molecules. Hairpin adapters are '
       + 'joined to both ends of a double-stranded fragment, which '
       + 'closes it into a continuous loop called a SMRTbell. Because '
       + 'the molecule is now a circle, a polymerase can travel round '
       + 'it again and again, reading both strands each time.', 5],
      ['One molecule per well',
       'The SMRT cell holds millions of tiny wells called zero-mode '
       + 'waveguides, each narrower than the wavelength of light. One '
       + 'polymerase is fixed to the bottom of each well, holding one '
       + 'SMRTbell. Light shone from below cannot travel up such a '
       + 'narrow well, so only the very bottom, where the polymerase '
       + 'works, is lit.', 5],
      ['A flash for every base',
       'Each of the four nucleotides carries a different dye, '
       + 'attached to its phosphate chain rather than to the base. '
       + 'While the polymerase holds the right nucleotide in its active'
       + ' site, the dye sits in the lit volume long enough to give a '
       + 'flash of its colour. Joining the nucleotide releases the dye '
       + 'with the pyrophosphate, so the new DNA carries no label. The '
       + 'time between flashes also changes at modified bases, which is'
       + ' how PacBio detects methylation directly.', 8],
      ['Round and round, then a consensus',
       'Because the polymerase goes round the circle many times, it '
       + 'produces several reads of the same molecule, called subreads.'
       + ' Each subread contains errors, but they fall in random '
       + 'places, so combining the passes into a consensus cancels most'
       + ' of them out. The result, a HiFi read, is about 99.9% '
       + 'accurate or better and typically 10 to 20 kilobases long.', 8]
    ],
    note: 'Reads this long and this accurate span repeats and '
        + 'structural variants that short reads cannot place, which '
        + 'is why HiFi reads are used to assemble genomes and to '
        + 'resolve complex regions.',
    init(g) {
      // the circle
      this.bell = el('g', null, g);
      el('line', { x1: 130, y1: 95, x2: 230, y2: 95,
        stroke: K.INDIGO, 'stroke-width': 6, 'stroke-linecap': 'round' }, this.bell);
      el('line', { x1: 130, y1: 125, x2: 230, y2: 125,
        stroke: K.TEAL, 'stroke-width': 6, 'stroke-linecap': 'round' }, this.bell);
      this.hpL = el('path', { fill: 'none', stroke: K.AMBER, 'stroke-width': 6,
                              'stroke-linecap': 'round' }, this.bell);
      this.hpR = el('path', { fill: 'none', stroke: K.AMBER, 'stroke-width': 6,
                              'stroke-linecap': 'round' }, this.bell);
      this.hpT = el('g', null, this.bell);
      text(this.hpT, 112, 150, 'hairpin adapter', { 'font-size': 10, fill: K.AMBER });
      text(this.hpT, 248, 150, 'hairpin adapter', { 'font-size': 10, fill: K.AMBER });
      this.bellT = text(this.bell, 180, 185, '', { 'font-size': 12, fill: K.INK,
                                                   'font-weight': 700 });

      // the well
      this.well = el('g', null, g);
      el('rect', { x: 0, y: 70, width: 360, height: 120, fill: '#9AA1B2' }, this.well);
      el('rect', { x: 130, y: 70, width: 100, height: 120, fill: '#FBFBFE' }, this.well);
      this.glow = el('rect', { x: 130, y: 160, width: 100, height: 30,
                               fill: '#FFF3C4' }, this.well);
      el('rect', { x: 0, y: 190, width: 360, height: 10, fill: '#CBD5F0' }, this.well);
      text(this.well, 65, 92, 'metal film', { 'font-size': 10, fill: '#fff' });
      text(this.well, 295, 92, 'one zero-mode', { 'font-size': 10, fill: '#fff' });
      text(this.well, 295, 105, 'waveguide', { 'font-size': 10, fill: '#fff' });
      text(this.well, 70, 128, 'SMRTbell', { 'font-size': 10, fill: '#fff', 'font-weight': 700 });
      el('line', { x1: 98, y1: 128, x2: 146, y2: 128, stroke: '#fff', 'stroke-width': 1 }, this.well);
      text(this.well, 70, 170, 'polymerase', { 'font-size': 10, fill: '#fff', 'font-weight': 700 });
      el('line', { x1: 102, y1: 170, x2: 166, y2: 170, stroke: '#fff', 'stroke-width': 1 }, this.well);
      text(this.well, 180, 214, 'light from below reaches only the bottom',
           { 'font-size': 10, fill: K.MUTED });
      this.loop = el('ellipse', { cx: 180, cy: 128, rx: 30, ry: 26, fill: 'none',
                                  stroke: K.INDIGO, 'stroke-width': 4 }, this.well);
      this.pol = el('circle', { cx: 180, cy: 170, r: 12, fill: K.GREEN }, this.well);
      this.marker = el('circle', { r: 5, fill: K.AMBER }, this.well);
      this.nucs = [];
      for (let i = 0; i < 4; i++) {
        this.nucs.push(el('circle', { r: 5, fill: FL['ACGT'[i]] }, this.well));
      }
      // trace
      this.trace = el('g', null, g);
      el('line', { x1: 20, y1: 58, x2: 340, y2: 58, stroke: K.LINE }, this.trace);
      text(this.trace, 20, 18, 'light from the bottom of the well', { 'font-size': 10,
        fill: K.MUTED, 'text-anchor': 'start' });
      this.READ = 'GATTACAGCTAGGC';
      this.pulses = [];
      for (let i = 0; i < 14; i++) {
        const h = 12 + (i % 3) * 4;
        this.pulses.push(el('rect', { x: 24 + i * 22, y: 58 - h, width: 8, height: h,
          rx: 2, fill: FL[this.READ[i]] }, this.trace));
      }

      // subreads and consensus
      this.reads = el('g', null, g);
      this.passes = [];
      for (let r = 0; r < 5; r++) {
        const y = 30 + r * 22;
        const row = el('g', null, this.reads);
        el('rect', { x: 50, y, width: 280, height: 10, rx: 3, fill: '#C9CEDA' }, row);
        for (let e = 0; e < 3; e++) {
          el('rect', { x: 60 + ((r * 97 + e * 61) % 250), y: y - 2,
            width: 5, height: 14, fill: K.RED }, row);
        }
        text(row, 26, y + 5, `pass ${r + 1}`, { 'font-size': 10, fill: K.MUTED });
        this.passes.push(row);
      }
      this.errT = text(this.reads, 190, 152, 'red: errors, in different places each pass',
                       { 'font-size': 10.5, fill: K.RED });
      this.cons = el('g', null, this.reads);
      el('rect', { x: 50, y: 172, width: 280, height: 12, rx: 3, fill: K.GREEN }, this.cons);
      text(this.cons, 190, 202, 'consensus: the errors cancel out',
           { 'font-size': 12, 'font-weight': 700, fill: K.GREEN });
    },
    frame(k, p) {
      show(this.bell, k === 0);
      show(this.well, k === 1 || k === 2);
      show(this.trace, k === 2);
      show(this.reads, k === 3);
      if (k === 0) {
        const t = ease(seg(p, 0.15, 0.75));
        set(this.hpL, { d: 'M 130 95 A 15 15 0 0 0 130 125', opacity: t });
        set(this.hpR, { d: 'M 230 95 A 15 15 0 0 1 230 125', opacity: t });
        set(this.hpT, { opacity: seg(p, 0.5, 0.75) });
        this.bellT.textContent = p > 0.75 ? 'a closed circle: the SMRTbell'
          : 'a double-stranded fragment';
      }
      if (k === 1 || k === 2) {
        const ang = (k === 2 ? p * 2 : p * 0.5) * Math.PI * 2;
        set(this.marker, { cx: 180 + 30 * Math.cos(ang + Math.PI / 2),
                           cy: 128 + 26 * Math.sin(ang + Math.PI / 2) });
        const flash = k === 2 ? Math.min(13, Math.floor(p * 14)) : -1;
        const inFlash = k === 2 && (p * 14 - flash) < 0.55;
        const b = this.READ[Math.max(0, flash)];
        set(this.glow, { fill: inFlash ? FL[b] : '#FFF3C4',
                         opacity: inFlash ? 0.6 : 1 });
        this.nucs.forEach((n, i) => {
          const t = (p * 3 + i * 0.27) % 1;
          set(n, { cx: 150 + i * 20 + 8 * Math.sin(t * 9), cy: lerp(80, 150, t),
                   opacity: k === 2 ? 1 : 0.6 });
        });
        if (k === 2) {
          this.pulses.forEach((r, i) => show(r, i < flash || (i === flash && inFlash)));
        }
      }
      if (k === 3) {
        const n = Math.min(5, Math.floor(p * 6.2));
        this.passes.forEach((row, i) => show(row, i < n));
        show(this.errT, n >= 2);
        show(this.cons, p > 0.85);
      }
    }
  });

  /* ============================================================= Nanopore */
  Anim.add({
    id: 'nanopore', group: 'seq', groupName: 'Sequencing',
    title: 'Oxford Nanopore',
    sub: 'A strand through a pore, read as a current',
    steps: [
      ['A pore in a membrane',
       'A protein nanopore sits in a thin membrane that separates two'
       + ' salt solutions, with a voltage across it. Ions can only '
       + 'cross the membrane by passing through the pore, and their '
       + 'flow is measured as a steady electric current.', 4],
      ['The strand threads through',
       'A motor protein on top of the pore unwinds the DNA and feeds '
       + 'one strand through at a controlled speed. At any moment a few'
       + ' bases sit in the narrowest part of the pore and partly block'
       + ' the flow of ions, by an amount that depends on exactly which'
       + ' bases they are. As the strand moves on, the current steps up'
       + ' and down in a pattern often called a squiggle.', 9],
      ['From squiggle to sequence',
       'A neural-network basecaller has learned which current '
       + 'patterns belong to which sequences, and it turns the squiggle'
       + ' into bases. No polymerase copies the DNA and no fluorescence'
       + ' is needed, so a read lasts as long as the molecule does, '
       + 'often tens of thousands of bases. RNA can also be passed '
       + 'through directly, without first being copied into cDNA.', 6]
    ],
    note: 'The newer R10 pores read the strand at two points along a '
        + 'longer barrel, which made them much better at counting '
        + 'runs of the same base, a long-standing weakness of '
        + 'nanopore reads.',
    init(g) {
      const PX = 110;
      this.PX = PX;
      text(g, 22, 40, '−', { 'font-size': 16, fill: K.MUTED });
      text(g, 22, 200, '+', { 'font-size': 16, fill: K.MUTED });
      el('rect', { x: 0, y: 92, width: PX - 30, height: 26, fill: '#E9DFC7' }, g);
      el('rect', { x: PX + 30, y: 92, width: 360 - PX - 30, height: 26, fill: '#E9DFC7' }, g);
      text(g, 290, 105, 'membrane', { 'font-size': 10, fill: '#8A7A52' });
      el('path', { d: `M ${PX - 30} 80 L ${PX - 15} 92 L ${PX - 15} 118 L ${PX - 30} 130 `
                    + `L ${PX + 30} 130 L ${PX + 15} 118 L ${PX + 15} 92 L ${PX + 30} 80 Z`,
                   fill: '#C9B6E4', stroke: '#6A3B9E', 'stroke-width': 2 }, g);
      text(g, PX + 36, 86, 'protein pore', { 'font-size': 10, fill: '#6A3B9E',
                                             'text-anchor': 'start' });
      this.motor = el('ellipse', { cx: PX, cy: 70, rx: 26, ry: 12,
                                   fill: '#F4C46B', stroke: K.AMBER, 'stroke-width': 2 }, g);
      this.motorT = text(g, PX + 32, 58, 'motor protein', { 'font-size': 10,
        fill: K.AMBER, 'text-anchor': 'start' });
      this.ions = [];
      for (let i = 0; i < 8; i++) this.ions.push(el('circle', { r: 2.6, fill: K.BLUE }, g));
      // the strand: base 0 leads, so the read comes out in this order
      this.SEQ = 'GATTACAGGCTTAC';
      this.strand = el('g', null, g);
      this.bases = [...this.SEQ].map(b => {
        const r = el('rect', { x: PX - 8, width: 16, height: 11, rx: 2, fill: BASE[b] }, this.strand);
        const t = text(this.strand, PX, 0, b, { 'font-size': 9, fill: '#fff',
          'font-weight': 700 });
        return { r, t, b };
      });
      // current trace, to the right of the pore
      el('line', { x1: 190, y1: 138, x2: 190, y2: 200, stroke: K.LINE }, g);
      text(g, 196, 132, 'current', { 'font-size': 10, fill: K.MUTED, 'text-anchor': 'start' });
      this.trace = el('path', { fill: 'none', stroke: K.RED, 'stroke-width': 2 }, g);
      this.bc = el('g', null, g);
      text(this.bc, 268, 214, 'basecaller (neural network)', { 'font-size': 10,
        fill: K.INDIGO, 'font-weight': 700 });
      this.called = text(this.bc, 268, 231, '', { 'font-size': 12,
        'font-family': 'monospace', 'font-weight': 700, fill: K.INK });
      this.LEV = { A: 0.35, C: 0.6, G: 0.85, T: 0.15 };
    },
    frame(k, p) {
      const PX = this.PX;
      // ions always flow, fewer when a strand is in the pore
      this.ions.forEach((d, i) => {
        const t = ((k === 0 ? p * 3 : p * 1.5) + i / 8) % 1;
        set(d, { cx: PX + ((i % 3) - 1) * 6, cy: lerp(60, 150, t),
                 opacity: k === 0 ? 1 : 0.5 });
      });
      show(this.motor, k >= 1);
      show(this.motorT, k >= 1);
      show(this.bc, k === 2);
      const offset = (k === 0 ? 0 : k === 1 ? p : 1) * 230;
      let passed = 0;
      this.bases.forEach((b, j) => {
        const y = 58 - j * 13 + offset;
        const on = k >= 1 && y > 22 && y < 212;
        show(b.r, on); show(b.t, on);
        set(b.r, { y: y - 5.5 });
        set(b.t, { y });
        if (k >= 1 && y > 105) passed = j + 1;
      });
      let d;
      if (k === 0) {
        d = `M 190 146 L ${190 + 150 * p} 146`;
      } else {
        d = 'M 190 146 L 196 146';
        for (let i = 0; i < passed; i++) {
          const y = 152 + this.LEV[this.SEQ[i]] * 44;
          const x0 = 196 + i * 10.6;
          d += ` L ${x0} ${y} L ${x0 + 10.6} ${y + ((i * 7) % 3) - 1}`;
        }
      }
      set(this.trace, { d });
      this.called.textContent = k === 2
        ? this.SEQ.slice(0, Math.min(14, Math.floor(p * 15))) : '';
    }
  });
})();
