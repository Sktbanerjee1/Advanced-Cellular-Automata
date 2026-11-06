// Controller: binds UI ↔ model ↔ views and runs the simulation inside the p5 frame loop.
import { CELLS } from './data/cells.js';
import { MEDIA, compat } from './data/media.js';
import { Sim } from './model/sim.js';
import { O2SAT } from './model/kinetics.js';
import { createView, legendHTML } from './view/render.js';
import { createCharts } from './view/charts.js';
import { createEquations } from './view/equations.js';
import { createLineage } from './view/lineage.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', sci = x => { if (!(x > 0)) return '0'; const e = Math.floor(Math.log10(x)); return e < 4 ? Math.round(x).toLocaleString() : `${(x / 10 ** e).toFixed(2)}×10${[...String(e)].map(d => SUP[d]).join('')}`; };
const ATM = { shake: ['Aerobic, shaking flask', 150, O2SAT], static: ['Aerobic, static', 4, O2SAT], co2: ['Incubator, 5 % CO₂ static', 3, O2SAT * .95], anaer: ['Anaerobic chamber', 0, 0] };
const SPEED = [1, 2, 4, 8, 16, 32, 64], COMP = [['glc', 'Carbon (hexose-eq)', 'mM'], ['gln', 'L-Glutamine', 'mM'], ['aa', 'Peptone / amino acids', 'g/L'], ['ser', 'Serum (FBS)', '%'], ['beta', 'Buffer capacity β', 'mM/pH'], ['pH0', 'Initial pH', '']];
const st = { run: false, sel: null, f: 0, tab: 'lin' }, sim = new Sim(), env = { T: 37, kLa: 150, o2s: O2SAT };
let cell = CELLS[0], med = { ...MEDIA[0] };
const group = (list, sel) => { const g = {}; list.forEach(x => (g[x.group] ??= []).push(x)); sel.innerHTML = Object.entries(g).map(([k, v]) => `<optgroup label="${k}">${v.map(x => `<option value="${x.id}">${x.name}</option>`).join('')}</optgroup>`).join(''); };
group(CELLS, $('#cell')); group(MEDIA, $('#medium'));
$('#atm').innerHTML = Object.entries(ATM).map(([k, [l, kla]]) => `<option value="${k}">${l} · kLa ${kla} h⁻¹</option>`).join('');
$('#comp').innerHTML = COMP.map(([k, l, u]) => `<label><span>${l}</span><input data-k="${k}" type="number" step="any" min="0"><em>${u}</em></label>`).join('');
const perArea = () => cell.mode === 'adherent', unit = () => perArea() ? 'cells/cm²' : 'cells/mL', disp = x => perArea() ? x * .2 : x;

function setCell(id) {
  cell = CELLS.find(c => c.id === id); $('#cell').value = id;
  $('#cellInfo').innerHTML = `<dl class="kv"><dt>Doubling (optimal)</dt><dd>${cell.td >= 120 ? (cell.td / 60).toFixed(1) + ' h' : cell.td + ' min'}</dd><dt>T min/opt/max</dt><dd>${cell.T.join(' / ')} °C</dd>
    <dt>pH min/opt/max</dt><dd>${cell.pH.join(' / ')}</dd><dt>Size</dt><dd>${cell.d} µm</dd><dt>Growth</dt><dd>${{ colony: 'colony / biofilm', adherent: 'adherent monolayer', suspension: 'suspension' }[cell.mode]}</dd>
    <dt>O₂</dt><dd>${{ a: 'obligate aerobe', f: 'facultative', n: 'aerotolerant', x: 'obligate anaerobe' }[cell.oxy]}</dd></dl>${cell.info ? `<p class="note">${cell.info}</p>` : ''}${cell.aux ? `<p class="note">Genotype: ${cell.aux}</p>` : ''}`;
  $('#temp').value = cell.T[1]; $('#atm').value = cell.oxy === 'x' ? 'anaer' : { mam: 'co2', ins: 'static' }[cell.kind] || 'shake';
  const sc = cell.Xmax / (128 * 80); $('#inoc').min = Math.log10(sc).toFixed(2); $('#inoc').max = Math.log10(cell.Xmax * .5).toFixed(2);
  $('#inoc').value = Math.log10(['bac', 'yst'].includes(cell.kind) ? sc * 6 : cell.Xmax * .1); setMedium(cell.media[0]);
}
function setMedium(id) { med = { ...MEDIA.find(m => m.id === id) }; $('#medium').value = id; $$('#comp input').forEach(i => i.value = med[i.dataset.k]); $('#medNote').textContent = med.note || ''; reset(); }
function reset() {
  $$('#comp input').forEach(i => med[i.dataset.k] = Math.max(0, +i.value || 0)); syncEnv(); const c = compat(cell, med);
  $('#compat').className = `badge ${c.lvl}`; $('#compat').innerHTML = `<i></i>${c.msg} · ${Math.round(c.f * 100)} % of µ<sub>max</sub>`;
  sim.reset(cell, med, env, 10 ** +$('#inoc').value); st.sel = null; view.sel = null; $('#liveUnit').textContent = unit(); refresh(true);
}
function syncEnv() { const [, kla, o2s] = ATM[$('#atm').value]; Object.assign(env, { T: +$('#temp').value, kLa: kla, o2s, dpH: med.pr && med.id !== 'l15' && $('#atm').value !== 'co2' ? .5 : 0 }); $('#tempOut').textContent = `${env.T} °C`; // dpH: bicarbonate media drift alkaline without 5 % CO₂
  $('#inocOut').textContent = `${sci(disp(10 ** +$('#inoc').value))} ${unit()}`; $('#speedOut').textContent = `×${SPEED[$('#speed').value]}`; }
function select(id) { st.sel = view.sel = id; lineage.update(id); if (st.tab !== 'lin') tab('lin'); }
function tab(t) { st.tab = t; $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); $$('.tab').forEach(p => p.classList.toggle('on', p.id === `tab-${t}`)); refresh(true); }
function setRun(on) { st.run = on; $('#play').classList.toggle('on', on); $('#play').setAttribute('aria-label', on ? 'Pause' : 'Play'); }

function meters() {
  const s = sim.s, s0 = sim.s0, r = sim.r, row =(l, v, v0, u, c, max) => { const p = Math.min(100, (max ? v / max : v0 > 0 ? v / v0 : 0) * 100);
    return `<div class="meter"><div class="mh"><span><i style="background:var(${c})"></i>${l}</span><b>${v.toFixed(v < 10 ? 2 : 1)} <small>${u}</small></b></div><div class="bar"><div style="width:${p}%;background:var(${c})"></div></div></div>`; };
  const F = [['Lag adaptation α', r.alpha], ['Temperature γ<sub>T</sub>', r.gT], ['pH γ<sub>pH</sub>', r.gpH], ['Medium suitability φ<sub>M</sub>', sim.cp.f], cell.Ser && ['Serum φ<sub>ser</sub>', r.fS],
    ['Carbon / energy C', r.C], cell.Yq && ['Glutamine E', r.E], cell.oxy !== 'n' && ['Oxygen O', r.O], ['Waste inhibition I', r.I]].filter(Boolean), lo = Math.min(...F.map(f => f[1]));
  const fac = ([l, v]) => `<div class="meter${v === lo && v < .95 ? ' lim' : ''}"><div class="mh"><span>${l}</span><b>${(v * 100).toFixed(0)} %</b></div><div class="bar"><div style="width:${v * 100}%;background:var(${v < .2 ? '--danger' : v < .5 ? '--warn' : '--accent'})"></div></div></div>`;
  $('#tab-med').innerHTML = `<h4 class="sub">Growth factors now <small>multiplied · 100 % = not limiting</small></h4>${F.map(fac).join('')}
    <p class="note">µ = µ<sub>max</sub> × factors = ${r.umax.toFixed(3)} × ${(r.mu / r.umax).toFixed(3)} = <b>${r.mu.toFixed(3)} h⁻¹</b>. Death k<sub>d</sub> = ${r.kd.toFixed(3)} h⁻¹, so net (µ − k<sub>d</sub>) = ${(r.mu - r.kd).toFixed(3)} h⁻¹.</p>
    <h4 class="sub">Substrates <small>bar = fraction of fresh medium left</small></h4>${row('Carbon (hexose-eq.)', s.glc, s0.glc, 'mM', '--c-glc')}${s0.gln || cell.Yq ? row('L-Glutamine', s.gln, s0.gln, 'mM', '--c-gln') : ''}${s0.aa ? row('Peptone / amino acids', s.aa, s0.aa, 'g/L', '--c-aa') : ''}
    ${row('Dissolved O₂ <small>(bar = air sat.)</small>', s.o2 * 1000, O2SAT * 1000, 'µM', '--c-o2')}<h4 class="sub">Waste <small>bar full = K<sub>I</sub>, where µ is halved</small></h4>${cell.byp !== 'none' ? row(`Byproduct (${cell.byp})`, s.P, 0, 'mM', '--c-byp', cell.KIL) : ''}${row('Ammonium NH₄⁺', s.nh4, 0, 'mM', '--c-nh4', cell.KIA)}
    <div class="phbox"><span>pH</span><b>${s.pH.toFixed(2)}</b><div class="phscale"><i style="left:${(s.pH - 3) / 6.5 * 100}%"></i><em style="left:${(cell.pH[0] - 3) / 6.5 * 100}%;width:${(cell.pH[2] - cell.pH[0]) / 6.5 * 100}%"></em></div><small>band = growth range of ${cell.name.split(' (')[0]}</small></div>
`;
}
function refresh(all) {
  const X = sim.nL * sim.scale, mu = sim.muObs(), maxGen = sim.cells.reduce((m, a) => Math.max(m, a.gen), 0);
  $('#live').textContent = sci(disp(X)); $('#legend').innerHTML = legendHTML(sim, view.mode, st.sel); $('#clock').textContent = `${sim.t.toFixed(sim.t < 10 ? 2 : 1)} h`; $('#clockSub').textContent = `${(sim.t / 24).toFixed(2)} d · Δt ${(sim.dt * 60).toFixed(1)} min`;
  $('#stats').innerHTML = `<dt>Dead</dt><dd>${sci(disp(sim.nD * sim.scale))}</dd><dt>Viability</dt><dd>${sim.cells.length ? (sim.nL / sim.cells.length * 100).toFixed(1) : 0} %</dd><dt>µ model / observed</dt><dd>${sim.r.mu.toFixed(3)} / ${mu.toFixed(3)} h⁻¹</dd>
    <dt>Doubling (obs.)</dt><dd>${mu > .005 ? (Math.LN2 / mu).toFixed(2) + ' h' : '—'}</dd><dt>Agents · max gen</dt><dd>${sim.nL} · ${maxGen}</dd><dt>Occupancy</dt><dd>${(sim.cells.length / (128 * 80) * 100).toFixed(1)} %</dd>`;
  if (all || st.f % 3 === 0) { charts.update(sim.hist, cell.byp); if (st.tab === 'med') meters(); if (st.tab === 'eq') eqs.update(sim); if (st.tab === 'lin') lineage.update(st.sel); }
}

const view = createView($('#view'), sim, { select, frame() {
  if (st.run) { const n = SPEED[$('#speed').value]; for (let i = 0; i < n && sim.nL > 0; i++) sim.step(); if (sim.nL === 0) setRun(false); }
  if (++st.f % 8 === 0) refresh(); } });
const charts = createCharts($('#gChart'), $('#mChart')), eqs = createEquations($('#tab-eq')), lineage = createLineage($('#tab-lin'), sim, select);

$('#cell').onchange = e => setCell(e.target.value); $('#medium').onchange = e => setMedium(e.target.value);
$('#cellSearch').oninput = e => { const q = e.target.value.toLowerCase(); $$('#cell option').forEach(o => o.hidden = !o.textContent.toLowerCase().includes(q));
  const first = $$('#cell option').find(o => !o.hidden); if (first && $('#cell').selectedOptions[0]?.hidden) setCell(first.value); };
$('#comp').onchange = reset; $('#inoc').onchange = reset; $('#inoc').oninput = syncEnv; $('#temp').oninput = syncEnv; $('#atm').onchange = syncEnv; $('#speed').oninput = syncEnv;
$('#play').onclick = () => setRun(!st.run); $('#step').onclick = () => { sim.step(); refresh(true); }; $('#reset').onclick = reset;
$('#feed').onclick = () => { sim.feed(); refresh(true); }; $('#passage').onclick = () => { sim.passage(); refresh(true); };
$$('.modes button').forEach(b => b.onclick = () => { view.mode = b.dataset.mode; $$('.modes button').forEach(x => x.classList.toggle('on', x === b)); refresh(true); });
$$('.tabs button').forEach(b => b.onclick = () => tab(b.dataset.tab));
document.addEventListener('keydown', e => { if (e.target.matches('input,select')) return; if (e.code === 'Space') { e.preventDefault(); setRun(!st.run); } });
setCell('eco');
