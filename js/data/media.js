// Media catalogue from published formulations (manufacturer sheets; approximate where proprietary).
// glc: fermentable carbon as hexose-equivalents (mM; glycerol counted ½) · gln L-glutamine mM · aa peptone/amino acids g/L
// ser % serum as typically supplemented · beta buffer capacity (mM acid per pH unit) · pH0 initial pH · eff carbon efficiency
// cls: medium class for compatibility · min: minimal (no amino acids) · pr: contains phenol red indicator · col: tint
const M = (cls, group, id, name, glc, gln, aa, ser, beta, pH0, col, o = {}) => ({ cls, group, id, name, glc, gln, aa, ser, beta, pH0, col, eff: 1, ...o });
const B = 'Bacterial', F = 'Yeast & fungal', P = 'Protist & insect', H = 'Mammalian';
export const MEDIA = [
  M('bac', B, 'lb', 'LB (Miller)', .1, 0, 15, 0, 8, 7, '#c9a35a', { note: 'Tryptone 10, yeast extract 5, NaCl 10 g/L — almost no sugar; E. coli grows on amino acids.' }),
  M('bac', B, 'lbv2', 'LBv2 (LB + v2 salts)', .1, 0, 15, 0, 8, 7, '#c9a35a', { note: 'LB + 204 mM NaCl, 4.2 mM KCl, 23 mM MgCl₂ for Vibrio natriegens.' }),
  M('bac', B, 'tb', 'Terrific Broth', 27, 0, 36, 0, 60, 7.2, '#a8743a', { note: 'Tryptone 12, yeast extract 24 g/L, glycerol 0.4 %, 89 mM K-phosphate.' }),
  M('bac', B, '2xyt', '2×YT', .1, 0, 26, 0, 8, 7, '#b88c4a', { note: 'Tryptone 16, yeast extract 10, NaCl 5 g/L.' }),
  M('bac', B, 'soc', 'SOC', 20, 0, 25, 0, 10, 7, '#c29a55', { note: 'Recovery medium; 20 mM glucose, 10 mM MgCl₂.' }),
  M('bac', B, 'm9', 'M9 minimal + 0.4 % glucose', 22.2, 0, 0, 0, 50, 7, '#dfe6e8', { min: 1, note: 'Defined salts, NH₄Cl as N source, 0.4 % glucose.' }),
  M('bac', B, 'nb', 'Nutrient Broth', 0, 0, 8, 0, 5, 6.8, '#d2ad6a', { note: 'Peptone 5, beef extract 3 g/L.' }),
  M('bac', B, 'tsb', 'Tryptic Soy Broth', 13.9, 0, 20, 0, 12, 7.3, '#c39b55', { note: 'Casein + soy peptone 20 g/L, glucose 2.5 g/L.' }),
  M('bac', B, 'bhi', 'Brain Heart Infusion', 11.1, 0, 27.5, 0, 12, 7.4, '#a87f45', { note: 'Infusion 17.5 + peptone 10, glucose 2 g/L.' }),
  M('bac', B, 'mrs', 'MRS broth', 111, 0, 22, 0, 45, 6.2, '#b58a4a', { note: 'Lactobacillus medium: glucose 20 g/L, acetate, citrate, Tween 80.' }),
  M('bac', B, '7h9', 'Middlebrook 7H9 + OADC', 25, 0, .5, 0, 25, 6.6, '#e6dcb0', { note: 'Glycerol 0.2 %, dextrose 2 g/L, albumin, glutamate 0.5 g/L.' }),
  M('bac', B, 'pye', 'PYE', 0, 0, 3, 0, 3, 7, '#d8bb7c', { note: 'Peptone 2, yeast extract 1 g/L — Caulobacter.' }),
  M('bac', B, 'm2g', 'M2G minimal', 11.1, 0, 0, 0, 20, 7, '#e3e9ea', { min: 1, note: 'Phosphate salts + 0.2 % glucose.' }),
  M('yst', F, 'ypd', 'YPD', 111, 0, 30, 0, 8, 6.5, '#b0803e', { note: 'Yeast extract 10, peptone 20, glucose 20 g/L.' }),
  M('yst', F, 'sd', 'SD complete (YNB + CSM)', 111, 0, .8, 0, 4, 5, '#e6e1c4', { note: 'Yeast nitrogen base + complete supplement mix + 2 % glucose.' }),
  M('yst', F, 'yes', 'YES', 167, 0, 5, 0, 6, 5.5, '#c2954f', { note: 'Yeast extract 5 g/L, glucose 3 %, adenine/uracil/His/Leu/Lys.' }),
  M('yst', F, 'emm', 'EMM (Edinburgh minimal)', 111, 0, 0, 0, 25, 5.6, '#e4e6dc', { min: 1, note: 'Phthalate/phosphate buffered, NH₄Cl, 2 % glucose.' }),
  M('yst', F, 'sab', 'Sabouraud dextrose', 222, 0, 10, 0, 4, 5.6, '#c8a061', { note: 'Peptone 10, dextrose 40 g/L, acidic.' }),
  M('pro', P, 'hl5', 'HL5', 55.5, 0, 21, 0, 8, 6.5, '#c5a066', { note: 'Proteose peptone 14, yeast extract 7, glucose 10 g/L.' }),
  M('pro', P, 'spp', 'SPP', 11.1, 0, 21, 0, 4, 7, '#c9a468', { note: 'Proteose peptone 2 %, glucose 0.2 %, yeast extract 0.1 %, Fe-EDTA.' }),
  M('ins', P, 'grace', "Grace's insect (+10 % FBS)", 20, 4.1, 6.7, 10, 15, 6.2, '#d6b77e', { note: 'Sucrose/glucose/fructose; accessible hexose approximated.' }),
  M('ins', P, 'sf900', 'Sf-900 III SFM', 50, 10, 6, 0, 18, 6.2, '#e0c690', { note: 'Serum-free, proprietary — composition approximated.' }),
  M('ins', P, 'schneider', "Schneider's Drosophila (+10 % FBS)", 22, 12, 6, 10, 20, 6.7, '#e3b97c', { note: 'Glucose + trehalose, 12 mM glutamine.' }),
  M('mam', H, 'dmem_hi', 'DMEM high glucose', 25, 4, 1, 10, 40, 7.4, 0, { pr: 1, note: '4.5 g/L glucose, 4 mM Gln, 3.7 g/L NaHCO₃ (5 % CO₂).' }),
  M('mam', H, 'dmem_lo', 'DMEM low glucose', 5.55, 4, 1, 10, 40, 7.4, 0, { pr: 1, note: '1 g/L glucose, 4 mM Gln.' }),
  M('mam', H, 'rpmi', 'RPMI-1640', 11.1, 2.05, 1.1, 10, 25, 7.3, 0, { pr: 1, note: '2 g/L glucose, 2.05 mM Gln, 2 g/L NaHCO₃ — lymphocytes.' }),
  M('mam', H, 'emem', 'EMEM (Eagle MEM)', 5.55, 2, .8, 10, 28, 7.4, 0, { pr: 1, note: '1 g/L glucose, 2 mM Gln, Earle’s salts.' }),
  M('mam', H, 'mema', 'MEM α', 5.55, 2, 1.2, 10, 28, 7.4, 0, { pr: 1, note: 'Adds non-essential amino acids, nucleosides.' }),
  M('mam', H, 'imdm', "IMDM", 25, 4, 1.4, 10, 50, 7.3, 0, { pr: 1, note: '25 mM HEPES + 36 mM NaHCO₃, high buffering.' }),
  M('mam', H, 'f12', "Ham's F-12", 10, 1, 1, 10, 20, 7.3, 0, { pr: 1, note: '1.8 g/L glucose, 1 mM Gln.' }),
  M('mam', H, 'f12k', "F-12K (Kaighn's)", 7, 2, 1.1, 10, 30, 7.3, 0, { pr: 1, note: 'Modified F-12 for A549/CHO-K1.' }),
  M('mam', H, 'dmemf12', 'DMEM/F-12 (1:1)', 17.5, 2.5, 1.1, 10, 40, 7.3, 0, { pr: 1, note: '3.15 g/L glucose, 15 mM HEPES.' }),
  M('mam', H, 'mccoy', "McCoy's 5A", 16.7, 1.5, 1, 10, 28, 7.3, 0, { pr: 1, note: '3 g/L glucose, 1.5 mM Gln.' }),
  M('mam', H, 'l15', 'Leibovitz L-15', 5, 2, 1.5, 10, 15, 7.4, 0, { pr: 1, eff: .5, note: 'Galactose 0.9 g/L instead of glucose; CO₂-free; slower glycolysis.' }),
  M('mam', H, 'cdcho', 'CD CHO (+8 mM Gln)', 33, 8, 4, 0, 35, 7.1, '#e9d6a8', { note: 'Chemically defined, serum-free; approximate.' }),
];
// Compatibility of cell kind (row) with medium class (column): fraction of µmax achievable.
const COMPAT = {
  bac: { bac: .85, yst: .7, pro: .7, ins: .6, mam: .6 }, yst: { bac: .5, yst: .85, pro: .6, ins: .5, mam: .5 },
  pro: { bac: .3, yst: .2, pro: .85, ins: .2, mam: .2 }, ins: { bac: 0, yst: 0, pro: 0, ins: .85, mam: .3 },
  mam: { bac: 0, yst: 0, pro: 0, ins: .1, mam: .8 },
};
export function compat(c, m) {
  let f = c.media.includes(m.id) ? 1 : COMPAT[c.kind][m.cls], msg = f === 1 ? 'Recommended medium' : f >= .6 ? 'Usable, sub-optimal medium' : f > 0 ? 'Poor medium for this organism' : 'Incompatible: osmolarity/vitamins/growth factors missing';
  if (c.aux && m.min) { f *= .05; msg = `Auxotroph (${c.aux}) — minimal medium lacks supplements`; }
  return { f, msg, lvl: f >= .95 ? 'ok' : f >= .5 ? 'warn' : 'bad' };
}
// Phenol red colour from pH (yellow ≤6.8, red 7.4, fuchsia ≥8.2)
export const phenolRed = pH => { const s = [[6.4, [232, 197, 71]], [7, [232, 131, 74]], [7.4, [214, 67, 79]], [8.2, [190, 56, 154]]];
  if (pH <= s[0][0]) return s[0][1]; for (let i = 1; i < s.length; i++) if (pH <= s[i][0]) { const [a, ca] = s[i - 1], [b, cb] = s[i], t = (pH - a) / (b - a); return ca.map((v, k) => v + (cb[k] - v) * t); }
  return s[3][1]; };
