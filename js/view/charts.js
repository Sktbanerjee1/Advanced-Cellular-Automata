// Chart.js time courses: population (log) and medium composition.
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const ds = (label, color, o = {}) => ({ label, borderColor: color, backgroundColor: color, data: [], borderWidth: 1.75, pointRadius: 0, tension: .25, ...o });
const base = (y, y2) => ({ animation: false, responsive: true, maintainAspectRatio: false, parsing: false, interaction: { mode: 'index', intersect: false },
  plugins: { legend: { labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, color: css('--text-2'), font: { size: 11 } } } },
  scales: { x: { type: 'linear', title: { display: true, text: 'time (h)', color: css('--text-3') }, grid: { color: css('--grid') }, ticks: { color: css('--text-3') } },
    y: { grid: { color: css('--grid') }, ticks: { color: css('--text-3') }, ...y }, ...(y2 ? { y2: { position: 'right', grid: { display: false }, ticks: { color: css('--text-3') }, ...y2 } } : {}) } });
export function createCharts(gEl, mEl) {
  const growth = new Chart(gEl, { type: 'line', data: { datasets: [ds('live', css('--accent')), ds('dead', css('--danger'), { borderDash: [4, 3] })] },
    options: base({ type: 'logarithmic', title: { display: true, text: 'cells / mL', color: css('--text-3') }, ticks: { color: css('--text-3'), callback: v => Number.isInteger(Math.log10(v)) ? `1e${Math.log10(v)}` : '' } }) });
  const medium = new Chart(mEl, { type: 'line', data: { datasets: [ds('glucose', css('--c-glc')), ds('glutamine', css('--c-gln')), ds('peptone g/L', css('--c-aa')),
    ds('byproduct', css('--c-byp')), ds('NH₄⁺', css('--c-nh4')), ds('pH', css('--text-2'), { yAxisID: 'y2', borderDash: [5, 4] })] },
    options: base({ min: 0, title: { display: true, text: 'mM', color: css('--text-3') } }, { min: 3, max: 9.5, title: { display: true, text: 'pH', color: css('--text-3') } }) });
  return { update(h, byp) {
    growth.data.datasets[0].data = h.map(p => ({ x: p.t, y: Math.max(p.X, 1) })); growth.data.datasets[1].data = h.map(p => ({ x: p.t, y: Math.max(p.D, 1) }));
    ['glc', 'gln', 'aa', 'P', 'nh4', 'pH'].forEach((k, i) => medium.data.datasets[i].data = h.map(p => ({ x: p.t, y: p[k] })));
    medium.data.datasets[3].label = byp; growth.update('none'); medium.update('none'); } };
}
