// Live equation panel (KaTeX). Each block shows the symbolic law and the same law with current numbers.
import { fluxes, LN2, KDEG } from '../model/kinetics.js';
const n = (x, p = 3) => { if (!isFinite(x)) return '\\infty'; if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x)));
  return e >= 4 || e <= -3 ? `${(x / 10 ** e).toFixed(2)}\\!\\times\\!10^{${e}}` : (+x.toPrecision(p)).toString(); };
const BLOCKS = [
  ['Specific growth rate', 'Multiplicative (gamma-concept) model: lag × temperature × pH × medium × serum × substrates × O₂ × inhibition.',
    (c, s, r) => [`\\mu=\\mu_{max}\\,\\alpha\\,\\gamma_T\\,\\gamma_{pH}\\,\\phi_M\\,\\phi_{ser}\\,C\\,E\\,O\\,I`,
      `\\mu=${n(r.umax)}\\cdot${n(r.alpha, 2)}\\cdot${n(r.gT, 2)}\\cdot${n(r.gpH, 2)}\\cdot${n(r.M, 2)}\\cdot${n(r.fS, 2)}\\cdot${n(r.C, 2)}\\cdot${n(r.E, 2)}\\cdot${n(r.O, 2)}\\cdot${n(r.I, 2)}`,
      `\\mu=\\mathbf{${n(r.mu)}}\\ \\text{h}^{-1},\\quad t_d=\\frac{\\ln 2}{\\mu}=${r.mu > 1e-6 ? n(LN2 / r.mu) + '\\ \\text{h}' : '\\infty'}`]],
  ['Carbon & nitrogen (Monod)', 'Glucose S and peptone A are substitutable; glutamine Q is essential for animal cells.',
    (c, s, r) => [`C=1-\\Big(1-\\frac{S}{K_S+S}\\Big)\\Big(1-w_A\\frac{A}{K_A+A}\\Big)=1-(1-${n(r.g, 2)})(1-${n(r.a, 2)})=${n(r.C, 3)}`,
      `E=e_0+(1-e_0)\\frac{Q}{K_Q+Q}=${n(r.E, 3)},\\quad I=\\frac{K_{IP}}{K_{IP}+P}\\cdot\\frac{K_{IA}}{K_{IA}+N}=${n(r.I, 3)}`]],
  ['Cardinal temperature & pH (CTMI / CPM)', 'Rosso et al. 1993, 1995. Each factor is 1 at the optimum and 0 outside [min, max].',
    (c, s, r, e) => [`\\gamma_T=\\frac{(T-T_{max})(T-T_{min})^2}{(T_{opt}-T_{min})[(T_{opt}-T_{min})(T-T_{opt})-(T_{opt}-T_{max})(T_{opt}+T_{min}-2T)]}`,
      `T=${e.T}\\,{}^{\\circ}\\text{C},\\ [${c.T.join(',\\ ')}]\\Rightarrow\\gamma_T=${n(r.gT, 3)}`,
      `\\gamma_{pH}=\\frac{(pH-pH_{min})(pH-pH_{max})}{(pH-pH_{min})(pH-pH_{max})-(pH-pH_{opt})^2}`, `pH=${s.pH.toFixed(2)},\\ [${c.pH.join(',\\ ')}]\\Rightarrow\\gamma_{pH}=${n(r.gpH, 3)}`]],
  ['Lag phase (Baranyi–Roberts)', 'Physiological state q; α → 1 as cells adapt to the medium.',
    (c, s, r) => [`\\alpha=\\frac{q}{1+q},\\quad\\frac{dq}{dt}=\\mu_{env}\\,q,\\quad q_0=\\frac{1}{e^{\\mu_{max}\\lambda}-1}`, `q=${n(s.q)},\\ \\lambda=${c.lag}\\ \\text{h}\\Rightarrow\\alpha=${n(r.alpha, 3)}`]],
  ['Population balance', 'Death combines basal, starvation, toxicity and out-of-range stresses.',
    (c, s, r, e, sim) => [`\\frac{dX}{dt}=(\\mu-k_d)X`, `X=${n(sim.nL * sim.scale)}\\ \\text{mL}^{-1},\\ k_d=${n(r.kd)}\\ \\text{h}^{-1}\\Rightarrow\\frac{dX}{dt}=${n((r.mu - r.kd) * sim.nL * sim.scale)}\\ \\text{mL}^{-1}\\text{h}^{-1}`]],
  ['Substrate consumption (Pirt)', 'Growth-associated uptake plus maintenance. f_S is the share of carbon flux from glucose (the rest comes from peptone). Non-growing cells pay maintenance only.',
    (c, s, r, e, sim, f) => [`\\frac{dS}{dt}=-\\Big(\\frac{\\mu f_S}{Y_{X/S}}+m_S\\frac{S}{K_S+S}\\Big)X,\\quad f_S=${n(r.fg, 2)}`, `q_S=${n(f.qg)}\\ \\mu\\text{mol cell}^{-1}\\text{h}^{-1},\\ Y_{X/S}=${n(c.Yg)}\\ \\text{cells}/\\mu\\text{mol},\\ S=${n(s.glc)}\\ \\text{mM}`,
      `\\frac{dQ}{dt}=-q_Q X-k_{deg}Q,\\ k_{deg}=${KDEG}\\ \\text{h}^{-1},\\ Q=${n(s.gln)}\\ \\text{mM}`]],
  ['Byproducts & pH', 'Overflow metabolite P is tied to carbon flux; ammonia N comes from deamination of Gln or peptone. ΔpH(CO₂) = +0.5 for bicarbonate media held outside 5 % CO₂.',
    (c, s, r, e, sim, f) => [`\\frac{dP}{dt}=Y_{P/S}\\,q_S X,\\quad pH=pH_0+\\Delta pH_{CO_2}-\\frac{aP-bN}{\\beta}`,
      `P_{\\text{${c.byp}}}=${n(s.P)}\\ \\text{mM},\\ N=${n(s.nh4)}\\ \\text{mM},\\ a=${c.acid},\\ b=0.3,\\ \\Delta pH_{CO_2}=${e.dpH || 0},\\ \\beta=${sim.med.beta}\\Rightarrow pH=${s.pH.toFixed(2)}`]],
  ['Oxygen transfer', 'Gas–liquid transfer vs. cellular respiration.',
    (c, s, r, e, sim, f) => [`\\frac{dO_2}{dt}=k_La(O_2^*-O_2)-q_{O_2}X`, `k_La=${e.kLa}\\ \\text{h}^{-1},\\ O_2=${n(s.o2 * 1000)}\\ \\mu\\text{M},\\ q_{O_2}=${n(f.qO)}\\Rightarrow O=${n(r.O, 3)}`]],
  ['Cellular-automaton rule', 'Each agent advances its cycle phase φ; division needs a free Moore neighbour (colonies can shove).',
    (c, s, r, e, sim) => [`\\frac{d\\varphi_i}{dt}=\\frac{\\mu\\,r_i}{\\ln 2},\\quad \\varphi_i\\ge\\theta_i\\sim\\mathcal N(1,0.12^2)\\Rightarrow i\\to(d_1,d_2)`,
      `P(\\text{death in }\\Delta t)=k_d\\Delta t=${n(r.kd * sim.dt)},\\ \\Delta t=${n(sim.dt * 60)}\\ \\text{min},\\ 1\\text{ agent}=${n(sim.scale)}\\ \\text{cells/mL}`]],
];
export function createEquations(el) {
  el.innerHTML = '<p class="note eqintro">Each block shows the general law, then the same law with the current values. Growth factors run from 0 to 1, where 1 means not limiting. The <b>highlighted</b> number is the result.</p>' + BLOCKS.map(([t, d], i) => `<section class="eq"><h4>${t}</h4><p>${d}</p><div id="eq${i}"></div></section>`).join('');
  const slots = BLOCKS.map((_, i) => el.querySelector(`#eq${i}`)), last = [];
  return { update(sim) {
    const r = { ...sim.r, M: sim.cp.f }, f = fluxes(sim.cell, sim.med, sim.s, sim.r, sim.r.mu);
    BLOCKS.forEach(([, , fn], i) => { const tex = fn(sim.cell, sim.s, r, sim.env, sim, f).map(x => `\\displaystyle ${x}`).join('\\\\[6pt]');
      if (tex !== last[i]) { katex.render(`\\begin{gathered}${tex}\\end{gathered}`, slots[i], { throwOnError: false }); last[i] = tex; } });
  } };
}
