// Pure kinetic laws. Every factor is returned so the equation panel can show live values.
export const LN2 = Math.LN2, O2SAT = .21, KDEG = .0036; // O₂* (mM, air, 37 °C); Gln spontaneous decay h⁻¹
export const mon = (s, K) => s > 0 ? s / (K + s) : 0;
// Rosso cardinal temperature model with inflection (CTMI) and cardinal pH model (CPM)
export const ctmi = (T, [a, o, b]) => T <= a || T >= b ? 0 : ((T - b) * (T - a) ** 2) / ((o - a) * ((o - a) * (T - o) - (o - b) * (o + a - 2 * T)));
export const cpm = (p, [a, o, b]) => p <= a || p >= b ? 0 : ((p - a) * (p - b)) / ((p - a) * (p - b) - (p - o) ** 2);
export const oxyF = (c, o2) => ({ a: mon(o2, c.Ko), f: .5 + .5 * mon(o2, c.Ko), n: 1, x: .001 / (.001 + o2) })[c.oxy];

// Environment-limited specific growth rate µ (h⁻¹) and death rate kd (h⁻¹)
export function growth(c, m, s, env, M) {
  const umax = LN2 / (c.td / 60), gT = Math.max(0, ctmi(env.T, c.T)), gpH = Math.max(0, cpm(s.pH, c.pH));
  const fS = c.Ser ? Math.min(1, s.ser / (c.Ser + s.ser) * (c.Ser + 10) / 10) : 1;
  const g = mon(s.glc, c.Kg) * m.eff, a = c.wA * mon(s.aa, c.Ka), C = 1 - (1 - g) * (1 - a);
  const E = c.Yq ? .15 + .85 * mon(s.gln, .15) : 1, O = oxyF(c, s.o2), I = c.KIL / (c.KIL + s.P) * c.KIA / (c.KIA + s.nh4);
  const alpha = s.q / (1 + s.q), mu = umax * alpha * gT * gpH * M * fS * C * E * O * I;
  const kd = c.kd0 + c.kds * (1 - C * E) + 2 * c.kds * (1 - I) ** 3 + 2 * c.kds * (1 - M) + (gT === 0 ? .5 : 0) + (gpH === 0 ? .3 : 0) + (c.oxy === 'x' ? .5 * (1 - O) : 0);
  return { umax, gT, gpH, fS, g, a, C, E, O, I, alpha, mu, kd, fg: g + a > 0 ? g / (g + a) : 0 };
}
// Specific uptake/secretion rates (µmol or mg per cell per h) for growing cells at rate mu
export function fluxes(c, m, s, r, mu) {
  const qg = s.glc > 0 ? mu * r.fg / (c.Yg * m.eff) + c.mg * mon(s.glc, c.Kg) : 0, qa = s.aa > 0 && c.wA ? mu * (1 - r.fg) / c.Ya : 0;
  const qq = c.Yq && s.gln > 0 ? mu / c.Yq + c.mq * mon(s.gln, .15) : 0;
  return { qg, qa, qq, qP: c.Yp * qg, qN: c.Yamm * (c.Yq ? qq : qa), qO: c.oxy === 'x' ? 0 : c.qO2 * (.25 + .75 * mu / r.umax) * mon(s.o2, c.Ko) };
}
// Advance the well-mixed medium by dt (h). Xg = growing cells/mL, X = live cells/mL.
export function stepMedium(c, m, s, env, r, Xg, X, dt) {
  const fG = fluxes(c, m, s, r, r.mu), fM = fluxes(c, m, s, r, 0), F = k => fG[k] * Xg + fM[k] * (X - Xg);
  const dq = KDEG * s.gln * (env.T > 30 ? 1 : .3);
  s.glc = Math.max(0, s.glc - F('qg') * dt); s.aa = Math.max(0, s.aa - F('qa') * dt);
  s.gln = Math.max(0, s.gln - (F('qq') + dq) * dt); s.nh4 += (F('qN') + dq) * dt; s.P += F('qP') * dt;
  const eq = Math.max(0, env.o2s - F('qO') / Math.max(env.kLa, 1e-6)); s.o2 = env.kLa ? eq + (s.o2 - eq) * Math.exp(-env.kLa * dt) : Math.max(0, s.o2 - F('qO') * dt);
  s.pH = Math.min(9.5, Math.max(3, m.pH0 + (env.dpH || 0) - (c.acid * s.P - .3 * s.nh4) / m.beta));
  s.q *= Math.exp(r.mu / Math.max(r.alpha, 1e-9) * dt); // Baranyi: dq/dt = µ_env·q
  return fG;
}
