// Hybrid model: on-lattice stochastic cellular automaton (one agent = `scale` real cells/mL) coupled to a
// well-mixed medium ODE system. Each agent carries a cell-cycle phase φ and a lineage record.
import { growth, stepMedium, LN2 } from './kinetics.js';
import { compat } from '../data/media.js';
export const W = 128, H = 80;
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
export const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

export class Sim {
  reset(cell, med, env, X0) {
    Object.assign(this, { cell, med, env, t: 0, rec: [], cells: [], grid: new Int32Array(W * H).fill(-1), hist: [], nL: 0, nD: 0, lastH: -1 });
    this.cp = compat(cell, med); this.scale = cell.Xmax / (W * H); this.dt = Math.min(cell.td / 60 / 40, .5);
    const umax = LN2 / (cell.td / 60);
    this.s = { glc: med.glc, gln: med.gln, aa: med.aa, ser: med.ser, P: 0, nh4: 0, o2: env.o2s, pH: med.pH0, q: 1 / (Math.exp(umax * cell.lag) - 1) };
    this.s0 = { ...this.s }; this.seed(Math.max(1, Math.min(Math.round(X0 / this.scale), W * H * .6 | 0)));
    this.nL = this.nF = this.cells.length; this.r = growth(cell, med, this.s, env, this.cp.f); this.record();
  }
  seed(n) { for (let i = 0; i < n; i++) { let k; do k = Math.random() * W * H | 0; while (this.grid[k] >= 0); this.cells.push(this.add(null, k % W, k / W | 0)); } }
  add(p, x, y) {
    const id = this.rec.length, a = { id, p: p ? p.id : -1, f: p ? p.f : id, gen: p ? p.gen + 1 : 0, b: this.t, x, y, rx: p ? p.rx : x, ry: p ? p.ry : y,
      ang: p ? p.ang + gauss() * .25 : Math.random() * 6.283, phi: p ? 0 : Math.random() * .9, th: 1 + .12 * gauss(), st: 0, k: null,
      r: p ? Math.exp(.5 * Math.log(p.r) + .08 * gauss()) : Math.exp(.1 * gauss()), jx: Math.random() * .3 - .15, jy: Math.random() * .3 - .15 }; // mother–daughter rate correlation ≈ 0.5
    this.rec.push(a); this.grid[y * W + x] = id; return a;
  }
  free(x, y) { for (const [dx, dy] of shuffle([...N8])) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && this.grid[Y * W + X] < 0) return Y * W + X; } return null; }
  shove(x, y) { // colony growth: push a chain of cells outward along a random ray to make room
    for (let tr = 0; tr < 4; tr++) { const [dx, dy] = N8[Math.random() * 8 | 0];
      for (let i = 1; i <= 8; i++) { const X = x + i * dx, Y = y + i * dy; if (X < 0 || Y < 0 || X >= W || Y >= H) break;
        if (this.grid[Y * W + X] < 0) { for (let j = i; j > 1; j--) { const o = this.rec[this.grid[(y + (j - 1) * dy) * W + x + (j - 1) * dx]]; o.x += dx; o.y += dy; this.grid[o.y * W + o.x] = o.id; }
          const k = (y + dy) * W + x + dx; this.grid[k] = -1; return k; } } }
    return null;
  }
  divide(a) {
    const k = this.free(a.x, a.y) ?? (this.cell.mode === 'colony' ? this.shove(a.x, a.y) : null); if (k == null) return null;
    a.st = 2; a.d = this.t; const d1 = this.add(a, a.x, a.y), d2 = this.add(a, k % W, k / W | 0); a.k = [d1.id, d2.id];
    if (this.cell.asym) d1.phi = this.cell.asym; // stalked daughter skips the swarmer G1 period
    return [d1, d2];
  }
  move(a) { const k = this.free(a.x, a.y); if (k == null) return; this.grid[a.y * W + a.x] = -1; a.x = k % W; a.y = k / W | 0; this.grid[k] = a.id; }
  step() {
    const { cell: c, s, env, dt } = this, r = this.r = growth(c, this.med, s, env, this.cp.f), next = [], mv = { suspension: .3, adherent: .02, colony: 0 }[c.mode];
    let grow = 0, nD = 0;
    for (const a of shuffle(this.cells)) {
      if (a.st === 1) { if (this.t - a.dd > (c.kind === 'mam' || c.kind === 'ins' ? 8 : 2)) this.grid[a.y * W + a.x] = -1; else { next.push(a); nD++; } continue; }
      if (Math.random() < r.kd * dt) { a.st = 1; a.dd = this.t; next.push(a); nD++; continue; }
      if (a.phi < a.th) { a.phi += r.mu * a.r * dt / LN2; grow++; }
      const ds = a.phi >= a.th ? this.divide(a) : null;
      if (ds) next.push(...ds); else { a.arr = a.phi >= a.th; next.push(a); if (Math.random() < mv) this.move(a); }
    }
    this.cells = next; this.nD = nD; this.nL = next.length - nD;
    stepMedium(c, this.med, s, env, r, grow * this.scale, this.nL * this.scale, dt); this.t += dt;
    if (this.t - this.lastH >= Math.max(dt, c.td / 60 / 8)) this.record();
  }
  record() {
    this.lastH = this.t; const s = this.s; this.hist.push({ t: this.t, X: this.nL * this.scale || this.cells.length * this.scale, D: this.nD * this.scale, glc: s.glc, gln: s.gln, aa: s.aa, P: s.P, nh4: s.nh4, o2: s.o2, pH: s.pH, mu: this.r.mu });
    if (this.hist.length > 1500) this.hist = this.hist.filter((_, i) => i % 2 === 0);
  }
  muObs() { const h = this.hist, n = h.length; if (n < 3) return 0; const a = h[Math.max(0, n - 9)], b = h[n - 1]; return b.t > a.t && a.X > 0 && b.X > 0 ? Math.log(b.X / a.X) / (b.t - a.t) : 0; }
  liveDesc(id) { const a = this.rec[id]; return a.st === 0 ? 1 : a.k ? this.liveDesc(a.k[0]) + this.liveDesc(a.k[1]) : 0; }
  sister(a) { const p = this.rec[a.p]; return p && p.k ? this.rec[p.k[0] === a.id ? p.k[1] : p.k[0]] : null; }
  feed() { Object.assign(this.s, { glc: this.s0.glc, gln: this.s0.gln, aa: this.s0.aa, P: 0, nh4: 0, pH: this.s0.pH, o2: this.env.o2s }); } // full medium exchange
  passage(f = 1 / 8) { // split culture: keep a random fraction of live cells, reseed at random sites in fresh medium
    const keep = shuffle(this.cells.filter(a => a.st === 0)).slice(0, Math.max(1, Math.round(this.nL * f)));
    this.cells.filter(a => !keep.includes(a)).forEach(a => { if (a.st === 0) a.st = 3; });
    this.grid.fill(-1); keep.forEach(a => { let k; do k = Math.random() * W * H | 0; while (this.grid[k] >= 0); a.x = a.rx = k % W; a.y = a.ry = k / W | 0; this.grid[k] = a.id; });
    this.cells = keep; this.nL = keep.length; this.nD = 0; this.feed(); this.record();
  }
}
