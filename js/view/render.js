// p5.js microscope view. Hot loop draws straight to the 2D context for speed; p5 owns the loop, sizing and input.
import { W, H } from '../model/sim.js';
import { phenolRed } from '../data/media.js';
const TAU = Math.PI * 2, PHASE = ['oklch(0.80 0.12 175)', 'oklch(0.84 0.13 85)', 'oklch(0.72 0.15 295)', 'oklch(0.74 0.18 340)', 'oklch(0.55 0.03 250)'];
const ROLE = { sel: 'oklch(0.98 0 0)', sis: 'oklch(0.80 0.12 230)', kid: 'oklch(0.75 0.17 340)' }, DEAD = 'oklch(0.55 0.14 25)', OTHER = 'oklch(0.40 0.02 250)', MINE = 'oklch(0.85 0.15 175)';
// Bacteria have no G1/S/G2/M: Cooper–Helmstetter periods B (pre-replication), C (replication), D (segregation → septation)
export const phaseNames = k => [...(k === 'bac' ? ['B · pre-replication', 'C · chromosome replication', 'D · segregation', 'D · septation'] : ['G1 · growth', 'S · DNA synthesis', 'G2 · pre-mitosis', 'M · mitosis']), 'Arrested · no space or µ ≈ 0'];
export const quiescent = sim => sim.r.mu < .02 * sim.r.umax; // starved / stationary: cells stop cycling (G0 / stationary phase)
export const phaseOf = (a, q) => a.arr || q ? 4 : a.phi < .45 ? 0 : a.phi < .75 ? 1 : a.phi < .93 ? 2 : 3;
const lin = [], gen = [], G = g => Math.min(g, 40);
export const genCol = g => (gen[g] ??= `oklch(${(.88 - G(g) * .008).toFixed(3)} 0.13 ${200 + G(g) * 4})`); // monotonic ramp, saturates at 40
export const cloneCol = f => (lin[f] ??= `oklch(0.78 0.13 ${(f * 137.508) % 360})`);
const colorOf = (a, mode, clone, q) => mode === 'phase' ? PHASE[phaseOf(a, q)] : mode === 'gen' ? genCol(a.gen) : mode === 'clone' ? (clone(a) ? MINE : OTHER) : cloneCol(a.f);
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

export function createView(el, sim, hooks) {
  const v = { z: 1, ox: 0, oy: 0, mode: 'lineage', sel: null };
  v.p5 = new p5(p => {
    let drag = null, cs = 1, x0 = 0, y0 = 0;
    p.setup = () => { p.createCanvas(el.clientWidth, el.clientHeight).parent(el); p.frameRate(60); new ResizeObserver(() => p.resizeCanvas(el.clientWidth, el.clientHeight)).observe(el); };
    const toGrid = (mx, my) => [Math.floor((mx - x0) / cs), Math.floor((my - y0) / cs)];
    p.mouseWheel = e => { if (!inside()) return; const f = Math.exp(-e.delta * .0015), nz = Math.min(12, Math.max(1, v.z * f)), k = nz / v.z;
      v.ox = p.mouseX - (p.mouseX - v.ox - p.width / 2) * k - p.width / 2; v.oy = p.mouseY - (p.mouseY - v.oy - p.height / 2) * k - p.height / 2; v.z = nz; if (v.z === 1) v.ox = v.oy = 0; return false; };
    const inside = () => p.mouseX >= 0 && p.mouseY >= 0 && p.mouseX < p.width && p.mouseY < p.height;
    p.mousePressed = () => { if (inside()) drag = { x: p.mouseX, y: p.mouseY, ox: v.ox, oy: v.oy, m: 0 }; };
    p.mouseDragged = () => { if (!drag) return; drag.m = Math.hypot(p.mouseX - drag.x, p.mouseY - drag.y); if (drag.m > 4) { v.ox = drag.ox + p.mouseX - drag.x; v.oy = drag.oy + p.mouseY - drag.y; } };
    p.mouseReleased = () => { if (drag && drag.m <= 4) { const [gx, gy] = toGrid(p.mouseX, p.mouseY), id = gx >= 0 && gy >= 0 && gx < W && gy < H ? sim.grid[gy * W + gx] : -1; hooks.select(id >= 0 ? id : null); } drag = null; };
    p.draw = () => {
      hooks.frame(); const ctx = p.drawingContext, { s, med, cell } = sim, t = p.millis() / 1000;
      cs = Math.min(p.width / W, p.height / H) * v.z; x0 = (p.width - W * cs) / 2 + v.ox; y0 = (p.height - H * cs) / 2 + v.oy;
      const [r, g, b] = med.pr ? phenolRed(s.pH) : hexRgb(med.col), qs = quiescent(sim);
      ctx.fillStyle = '#0b0f15'; ctx.fillRect(0, 0, p.width, p.height);
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},0.16)`; ctx.fillRect(x0, y0, W * cs, H * cs);
      const sel = v.sel != null ? sim.rec[v.sel] : null, clone = a => { if (!sel) return false; let q = a; while (q && q.gen > sel.gen) q = sim.rec[q.p]; return q === sel; };
      for (const a of sim.cells) {
        a.rx += (a.x - a.rx) * .25; a.ry += (a.y - a.ry) * .25;
        const x = x0 + (a.rx + .5 + a.jx) * cs, y = y0 + (a.ry + .5 + a.jy) * cs, col = a.st ? DEAD : colorOf(a, v.mode, clone, qs);
        if (x < -cs || y < -cs || x > p.width + cs || y > p.height + cs) continue;
        ctx.fillStyle = ctx.strokeStyle = col; shape(ctx, a.st ? 'dead' : cell.shape, x, y, cs, a, t);
      }
      if (sel) { const sis = sim.sister(sel), ring = (a, c) => { if (!a || a.st === 2 || a.st === 3 || !sim.cells.includes(a)) return; ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, cs * .1);
          ctx.beginPath(); ctx.arc(x0 + (a.rx + .5 + a.jx) * cs, y0 + (a.ry + .5 + a.jy) * cs, cs * .75 + 2, 0, TAU); ctx.stroke(); };
        ring(sis, ROLE.sis); (sel.k || []).forEach(id => ring(sim.rec[id], ROLE.kid)); ring(sel, ROLE.sel); }
      const vg = ctx.createRadialGradient(p.width / 2, p.height / 2, Math.min(p.width, p.height) * .35, p.width / 2, p.height / 2, Math.max(p.width, p.height) * .75);
      vg.addColorStop(0, 'rgba(11,15,21,0)'); vg.addColorStop(1, 'rgba(11,15,21,0.7)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, p.width, p.height);
      scaleBar(ctx, cs, cell.d * 1.15, p.height);
    };
  });
  return v;
}
// On-canvas legend for the active colour mode, with live fractions of living cells.
export function legendHTML(sim, mode, selId) {
  const live = sim.cells.filter(a => a.st === 0), n = live.length || 1, sel = selId != null ? sim.rec[selId] : null, pc = k => `${Math.round(k / n * 100)} %`;
  const sw = (c, l, v = '') => `<span><i style="background:${c}"></i>${l}<b>${v}</b></span>`, rg = (c, l) => `<span><i class="r" style="border-color:${c}"></i>${l}</span>`;
  let h, b;
  if (mode === 'phase') { const q = quiescent(sim), k = [0, 0, 0, 0, 0]; live.forEach(a => k[phaseOf(a, q)]++);
    h = sim.cell.kind === 'bac' ? 'Cell-cycle period (B/C/D, schematic)' : 'Cell-cycle phase'; b = phaseNames(sim.cell.kind).map((l, i) => sw(PHASE[i], l, pc(k[i]))).join(''); }
  else if (mode === 'gen') { const mx = live.reduce((m, a) => Math.max(m, a.gen), 0), N = G(mx), st = Array.from({ length: N + 1 }, (_, g) => genCol(g));
    h = 'Generation · divisions since inoculation'; b = `<div class="ramp" style="background:linear-gradient(90deg,${st.join(',')},${st[N]})"></div><div class="ticks"><span>0</span><span>${N}${mx > 40 ? '+' : ''}</span></div>`; }
  else if (mode === 'clone') { const d = sel ? sim.liveDesc(sel.id) : 0; h = 'Selected clone';
    b = sel ? sw(MINE, `#${sel.id} and its descendants`, d) + sw(OTHER, 'Other living cells', live.length - d) : '<p>Click a cell to highlight it and all its descendants.</p>'; }
  else { const k = {}; live.forEach(a => k[a.f] = (k[a.f] || 0) + 1); const top = Object.entries(k).sort((x, y) => y[1] - x[1]);
    h = 'Clone · progeny of one inoculated cell'; b = top.slice(0, 5).map(([f, v]) => sw(cloneCol(+f), `Founder #${f}`, pc(v))).join('')
      + `<p>${top.length} of ${sim.nF} founder clones alive${top.length > 5 ? ' (top 5 shown)' : ''}. Hues repeat: similar colours do not mean related cells.</p>`; }
  b += sw(DEAD, `Dead · cleared after ${['mam', 'ins'].includes(sim.cell.kind) ? 8 : 2} h`);
  if (sel) b += `<div class="rings">${rg(ROLE.sel, 'selected')}${rg(ROLE.sis, 'sister')}${rg(ROLE.kid, 'daughters')}</div>`;
  return `<h5>${h}</h5>${b}`;
}
function scaleBar(ctx, cs, umPerSite, h) {
  const target = 110 / cs * umPerSite, e = 10 ** Math.floor(Math.log10(target)), um = [1, 2, 5, 10].map(k => k * e).filter(x => x <= target).pop(), px = um / umPerSite * cs;
  ctx.fillStyle = 'oklch(0.95 0.005 250)'; ctx.fillRect(16, h - 22, px, 3); ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.fillText(um >= 1000 ? `${um / 1000} mm` : `${um} µm`, 16, h - 30);
}
function poly(ctx, x, y, n, rad) { ctx.beginPath(); for (let i = 0; i < n; i++) { const r = rad(i), q = i / n * TAU; i ? ctx.lineTo(x + Math.cos(q) * r, y + Math.sin(q) * r) : ctx.moveTo(x + Math.cos(q) * r, y + Math.sin(q) * r); } ctx.closePath(); ctx.fill(); }
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function nucleus(ctx, x, y, r) { const f = ctx.fillStyle; ctx.fillStyle = 'rgba(8,10,16,0.45)'; circ(ctx, x, y, r); ctx.fillStyle = f; }
function rod(ctx, x, y, a, len, w, gap) {
  const c = Math.cos(a.ang), s = Math.sin(a.ang); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath();
  if (gap) { ctx.moveTo(x - c * len, y - s * len); ctx.lineTo(x - c * w * .45, y - s * w * .45); ctx.moveTo(x + c * w * .45, y + s * w * .45); ctx.lineTo(x + c * len, y + s * len); }
  else { ctx.moveTo(x - c * len, y - s * len); ctx.lineTo(x + c * len, y + s * len); } ctx.stroke();
}
function shape(ctx, k, x, y, s, a, t) {
  const f = a.phi, c = Math.cos(a.ang), sn = Math.sin(a.ang);
  switch (k) {
    case 'dead': return circ(ctx, x, y, s * .2);
    case 'rod': case 'crescent': return rod(ctx, x, y, a, s * (.16 + .22 * f), s * .4, f > .88);
    case 'fission': rod(ctx, x, y, a, s * (.2 + .22 * f), s * .48, false); if (f > .88) { ctx.strokeStyle = 'rgba(8,10,16,0.6)'; ctx.lineWidth = Math.max(1, s * .06); ctx.beginPath(); ctx.moveTo(x - sn * s * .22, y + c * s * .22); ctx.lineTo(x + sn * s * .22, y - c * s * .22); ctx.stroke(); } return;
    case 'coccus': { const r = s * .3 * (1 + .15 * f); if (f > .75) { const o = r * (f - .6); circ(ctx, x - c * o, y - sn * o, r); circ(ctx, x + c * o, y + sn * o, r); } else circ(ctx, x, y, r); return; }
    case 'bud': { const r = s * .34, br = r * .85 * Math.min(1, f); ctx.beginPath(); ctx.ellipse(x, y, r, r * .88, a.ang, 0, TAU); ctx.fill(); if (br > .5) circ(ctx, x + c * (r + br * .7), y + sn * (r + br * .7), br); return; }
    case 'amoeba': return poly(ctx, x, y, 7, i => s * .42 * (1 + .2 * Math.sin(t * 1.5 + a.id + i * 1.9)));
    case 'ciliate': ctx.beginPath(); ctx.ellipse(x, y, s * .48, s * .3 * (1 - .25 * Math.max(0, f - .8) * 5), a.ang, 0, TAU); ctx.fill(); return nucleus(ctx, x, y, s * .1);
    case 'fibro': if (f > .93) { circ(ctx, x, y, s * .3); return; } ctx.beginPath(); ctx.ellipse(x, y, s * .7, s * .2, a.ang, 0, TAU); ctx.fill(); return nucleus(ctx, x, y, s * .13);
    case 'round': { const r = s * .38 * (.9 + .15 * f); if (f > .95) { circ(ctx, x - c * r * .5, y - sn * r * .5, r * .75); circ(ctx, x + c * r * .5, y + sn * r * .5, r * .75); return; } circ(ctx, x, y, r); return nucleus(ctx, x, y, r * .45); }
    default: if (f > .93) return circ(ctx, x, y, s * .3); // epithelial: polygonal, rounds up in mitosis
      poly(ctx, x, y, 6, i => s * (.5 + .08 * Math.sin(a.id * 7.3 + i * 2.1))); return nucleus(ctx, x, y, s * .16);
  }
}
