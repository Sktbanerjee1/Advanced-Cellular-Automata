// Lineage panel: selected cell, its parent, sister and daughters, plus a clickable family-tree SVG.
import { phaseOf, phaseNames, quiescent } from './render.js';
const ST = ['alive', 'dead', 'divided', 'passaged out'];
const h = x => x.toFixed(1);
export function createLineage(el, sim, select) {
  el.addEventListener('click', e => { const id = e.target.closest('[data-id]')?.dataset.id; if (id != null) select(+id); });
  const link = (a, role) => a ? `<button class="chip ${role}" data-id="${a.id}">#${a.id} · ${ST[a.st]}</button>` : '<span class="muted">—</span>';
  function tree(sel) {
    let root = sel; for (let i = 0; i < 3 && root.p >= 0; i++) root = sim.rec[root.p];
    const nodes = [], edges = [], sis = sim.sister(sel), DEPTH = 6; let leaf = 0;
    (function lay(a, d) { const kids = a.k && d < DEPTH ? a.k.map(id => lay(sim.rec[id], d + 1)) : [];
      const x = kids.length ? (kids[0].x + kids[1].x) / 2 : leaf++; const n = { a, x, d }; nodes.push(n); kids.forEach(k => edges.push([n, k])); return n; })(root, 0);
    const sx = Math.max(12, Math.min(28, 300 / Math.max(leaf, 1))), X = n => 14 + n.x * sx, Y = n => 16 + n.d * 34, w = 28 + (leaf - 1) * sx, hh = 32 + DEPTH * 34;
    const cls = a => a === sel ? 'sel' : a === sis ? 'sis' : sel.k?.includes(a.id) ? 'kid' : a.id === sel.p ? 'par' : ['live', 'dead', 'div', 'gone'][a.st];
    return `<h4 class="sub">Family tree <small>from ancestor #${root.id}, ${sel.gen - root.gen} gen. up · click a node</small></h4><svg viewBox="0 0 ${Math.max(w, 120)} ${hh}" class="tree" role="img" aria-label="Family tree">${edges.map(([p, k]) => `<path d="M${X(p)} ${Y(p)}V${(Y(p) + Y(k)) / 2}H${X(k)}V${Y(k)}"/>`).join('')}
      ${nodes.map(n => `<circle data-id="${n.a.id}" class="${cls(n.a)}" cx="${X(n)}" cy="${Y(n)}" r="${n.a === sel ? 6 : 4.5}"><title>#${n.a.id} gen ${n.a.gen} · ${ST[n.a.st]}</title></circle>`).join('')}</svg>`;
  }
  return { update(id) {
    const a = id != null ? sim.rec[id] : null;
    if (!a) { el.innerHTML = '<p class="empty">Click any cell in the culture to follow it. You will see its parent, its <b class="t-sis">sister</b> (the other daughter of the same division), its <b class="t-kid">daughters</b> and a family tree.</p>'; return; }
    const sis = sim.sister(a), par = sim.rec[a.p], age = (a.d ?? (a.st === 1 ? a.dd : sim.t)) - a.b;
    el.innerHTML = `<div class="cellhead"><span class="dot sel"></span><b>Cell #${a.id}</b><span class="tag">${ST[a.st]}</span></div>
      <dl class="kv"><dt>Generation</dt><dd>${a.gen}</dd><dt>Founder clone</dt><dd>#${a.f}</dd><dt>Born</dt><dd>${h(a.b)} h</dd><dt>${['Age', 'Lifespan', 'Inter-division time', 'Age'][a.st]}</dt><dd>${h(age)} h</dd>
      <dt>${sim.cell.kind === 'bac' ? 'Cycle period' : 'Cycle phase'}</dt><dd>${a.st ? '—' : `${phaseNames(sim.cell.kind)[phaseOf(a, quiescent(sim))].split(' · ')[0]} · φ ${a.phi.toFixed(2)} / θ ${a.th.toFixed(2)}`}</dd>
      <dt>Rate factor rᵢ</dt><dd>${a.r.toFixed(2)} × µ</dd><dt>Living descendants</dt><dd>${sim.liveDesc(a.id)}</dd><dt>Clone size (alive)</dt><dd>${sim.liveDesc(a.f)} of ${sim.nL}</dd></dl>
      <p class="note">φ is cycle progress; the cell divides when φ reaches its threshold θ. rᵢ is its heritable speed relative to the population µ (mother–daughter correlation ≈ 0.5).</p>
      <div class="rel"><span>Parent</span>${link(par, 'par')}<span>Sister</span>${link(sis, 'sis')}<span>Daughters</span><div>${a.k ? a.k.map(k => link(sim.rec[k], 'kid')).join('') : '<span class="muted">not yet divided</span>'}</div></div>
      ${tree(a)}<div class="legend"><i class="sel"></i>selected<i class="sis"></i>sister<i class="kid"></i>daughter<i class="par"></i>parent<i class="live"></i>alive<i class="div"></i>divided<i class="dead"></i>dead<i class="gone"></i>passaged out</div>`;
  } };
}
