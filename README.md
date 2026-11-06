# Cellula · Culture Lab

Browser simulator and game for growing cells in culture. It couples a **stochastic cellular automaton** (one agent per lattice site, each with a cell-cycle phase and a lineage record) to a **well-mixed ODE model of the medium**. Pick an organism and a medium, then watch the population, nutrients, waste, pH and the governing equations change live.

**Live:** enable GitHub Pages → *Settings → Pages → Deploy from branch → `main` / root*. There is no build step: static ES modules and pinned CDN libraries (p5.js 1.9.4, Chart.js 4.4.1, KaTeX 0.16.9).

## Features
- **41 cell types**: bacteria (E. coli, V. natriegens, B. subtilis, S. aureus, P. aeruginosa, L. plantarum, Caulobacter, Bacteroides, mycobacteria …), yeasts, protists, insect lines, and human and other mammalian lines (HeLa, HEK293T, A549, MCF-7, HepG2, HCT116, Jurkat, K562, CHO-K1/S, NIH/3T3, Vero …).
- **35 media** (LB, TB, M9, BHI, MRS, 7H9, YPD, SD, EMM, HL5, Sf-900, DMEM, RPMI-1640, IMDM, F-12K, McCoy's 5A, L-15, CD CHO …) with editable composition.
- Compatibility between cell and medium, auxotrophies, temperature (CTMI), pH (CPM), O₂ transfer (kLa) and atmosphere (including anaerobic and 5 % CO₂).
- Live counts (cells/mL, or cells/cm² for adherent lines), viability, model and observed µ, doubling time.
- **Lineage tracking**: click a cell to see its parent, **sister** and **daughters**, a clickable family tree and its living descendants. Colour cells by clone, generation, cycle phase or selected clone.
- Medium meters, a phenol-red tint that follows pH, and growth and medium charts.
- A **live equation panel** that shows each law with the current numbers substituted.
- Medium exchange and 1:8 passaging.

## Model
| Layer | Law |
|---|---|
| Growth rate | µ = µmax · α · γT · γpH · φM · φser · C · E · O · I |
| Substrates | Monod. Glucose and peptone are substitutable: C = 1 − (1 − S/(Ks+S))(1 − wA·A/(KA+A)). Gln is essential for animal cells |
| Lag | Baranyi–Roberts: α = q/(1+q), dq/dt = µ_env·q |
| Temperature / pH | Rosso CTMI / CPM cardinal models |
| Medium | Pirt uptake dS/dt = −(µ/Y + m)X, byproduct dP/dt = Y_P/S·q_S·X, Gln decay k = 0.0036 h⁻¹, dO₂/dt = kLa(O₂* − O₂) − q_O₂X |
| pH | pH = pH₀ − (aP − bN)/β |
| CA rule | dφᵢ/dt = µ·rᵢ/ln2. Divide when φᵢ ≥ θᵢ ~ N(1, 0.12²) into a free Moore neighbour; colonies can shove. Mother–daughter rate correlation ≈ 0.5. Contact inhibition is emergent |

Each agent stands for `Xmax / 10240` real cells/mL, so counts on the lattice map onto real culture densities.

Parameters are approximate values from the literature and data sheets: ATCC/DSMZ doubling times, manufacturer media formulations, Monod/Pirt yields, and CTMI fits (Rosso et al. 1993, 1995). Use the simulator for teaching and exploration, not as a quantitative predictor.

## Code layout
```
index.html          layout + CDN scripts
css/style.css       OKLCH token system, dark instrument UI
js/data/            cells.js, media.js (catalogues, compatibility, phenol red)
js/model/           kinetics.js (pure laws), sim.js (CA + lineage + medium coupling)
js/view/            render.js (p5), charts.js, equations.js (KaTeX), lineage.js
js/main.js          controller / UI binding
```
