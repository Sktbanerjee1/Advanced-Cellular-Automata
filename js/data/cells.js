// Cell catalogue. Literature-derived, approximate values (ATCC/DSMZ data sheets, Monod/Baranyi/CTMI fits).
// Units: td doubling time (min) in optimal medium at Topt · T=[Tmin,Topt,Tmax] °C (Rosso CTMI) · pH=[min,opt,max] (CPM)
// Kg glucose Ks (mM) · Ka amino-acid/peptone Ks (g/L) · wA weight of peptone as C/energy source · Yg cells/µmol hexose
// Ya cells/mg peptone · Yq cells/µmol Gln · mg,mq maintenance µmol/cell/h · qO2 µmol/cell/h · Ko O2 Ks (mM)
// kd0 basal death h⁻¹ · kds starvation death h⁻¹ · Xmax capacity (cells/mL; adherent = confluent cells/cm² ÷ 0.2 mL/cm²)
// Ser serum Ks (% FBS, 0 = serum-independent) · KIL/KIA byproduct/ammonia inhibition (mM) · Yp mol byproduct/mol hexose
// acid 1 if byproduct acidifies · Yamm NH4⁺ µmol per µmol Gln (mammalian) or per mg peptone (microbes) · lag h · d µm
const D = {
  bac: { Kg: .02, Ka: .15, wA: .95, Yg: 2e8, Ya: 2e8, Yq: 0, mg: 0, mq: 0, qO2: 4.5e-9, Ko: .005, kd0: .01, kds: .05, Xmax: 1e10, Ser: 0, KIL: 150, KIA: 300, Yp: .4, acid: 1, byp: 'acetate', Yamm: 2.5, pH: [4.4, 7, 9.2], lag: 1, oxy: 'f', mode: 'colony', shape: 'rod' },
  yst: { Kg: .5, Ka: .5, wA: .3, Yg: 1.2e6, Ya: 1e6, Yq: 0, mg: 1e-9, mq: 0, qO2: 4.5e-8, Ko: .005, kd0: .005, kds: .02, Xmax: 3e8, Ser: 0, KIL: 900, KIA: 300, Yp: 1.6, acid: 0, byp: 'ethanol', Yamm: 1, pH: [2.5, 5, 8.5], lag: 1.5, oxy: 'f', mode: 'colony', shape: 'bud' },
  pro: { Kg: .5, Ka: 1, wA: .9, Yg: 4e5, Ya: 6e5, Yq: 0, mg: 1e-8, mq: 0, qO2: 1e-7, Ko: .01, kd0: .005, kds: .03, Xmax: 1e7, Ser: 0, KIL: 200, KIA: 30, Yp: 0, acid: 0, byp: 'none', Yamm: 2, pH: [5.5, 6.5, 7.5], lag: 4, oxy: 'a', mode: 'suspension', shape: 'amoeba' },
  ins: { Kg: .5, Ka: 1, wA: 0, Yg: 3e5, Ya: 1, Yq: 1e6, mg: 4e-8, mq: 1e-8, qO2: 4e-7, Ko: .02, kd0: .004, kds: .03, Xmax: 1e7, Ser: 0, KIL: 60, KIA: 15, Yp: .2, acid: 1, byp: 'lactate', Yamm: .5, pH: [5.6, 6.2, 6.9], lag: 12, oxy: 'a', mode: 'suspension', shape: 'round' },
  mam: { Kg: .5, Ka: 1, wA: 0, Yg: 2e5, Ya: 1, Yq: 1e6, mg: 5e-8, mq: 1e-8, qO2: 3e-7, Ko: .01, kd0: .002, kds: .03, Xmax: 7.5e5, Ser: 1.5, KIL: 45, KIA: 6, Yp: 1.6, acid: 1, byp: 'lactate', Yamm: .7, pH: [6.4, 7.25, 8], lag: 10, oxy: 'f', mode: 'adherent', shape: 'epi' },
};
const conf = c => c / .2; // confluent cells/cm² → cells/mL equivalent at 0.2 mL medium per cm²
const C = (kind, group, id, name, td, T, d, media, o = {}) => ({ ...D[kind], kind, group, id, name, td, T, d, media, ...o });

export const CELLS = [
  C('bac', 'Bacteria', 'eco', 'Escherichia coli K-12 MG1655', 21, [7.5, 39, 47.5], 2, ['lb', 'tb', '2xyt', 'soc', 'm9'], { info: 'Gram-negative model organism; overflow acetate on glucose.' }),
  C('bac', 'Bacteria', 'bl21', 'Escherichia coli BL21(DE3)', 22, [7.5, 37, 46], 2, ['lb', 'tb', '2xyt', 'm9'], { info: 'Protease-deficient expression host; low acetate.', Yp: .25 }),
  C('bac', 'Bacteria', 'vna', 'Vibrio natriegens ATCC 14048', 9.8, [12, 37, 45], 1.6, ['lbv2', 'bhi'], { info: 'Fastest known free-living bacterium (td < 10 min) in LBv2/BHI + v2 salts.' }),
  C('bac', 'Bacteria', 'bsu', 'Bacillus subtilis 168 (trpC2)', 26, [11, 37, 52], 3, ['lb', '2xyt', 'tsb', 'nb'], { oxy: 'a', aux: 'trpC2 — needs tryptophan', Yp: .2 }),
  C('bac', 'Bacteria', 'sau', 'Staphylococcus aureus ATCC 25923', 27, [7, 37, 48], .9, ['tsb', 'bhi', 'lb'], { shape: 'coccus', pH: [4.2, 7, 9.3], info: 'Gram-positive cocci in grape-like clusters.' }),
  C('bac', 'Bacteria', 'pae', 'Pseudomonas aeruginosa PAO1', 32, [10, 37, 42.5], 2, ['lb', 'tsb', 'm9'], { oxy: 'a', Yp: 0, byp: 'none', info: 'Strict aerobe; alkalinises peptone media (NH₃).' }),
  C('bac', 'Bacteria', 'stm', 'Salmonella enterica Typhimurium LT2', 25, [6, 37, 46], 2, ['lb', 'tsb', 'm9'], {}),
  C('bac', 'Bacteria', 'lpl', 'Lactiplantibacillus plantarum WCFS1', 60, [10, 35, 45], 3, ['mrs'], { oxy: 'n', Kg: .3, wA: .1, Yg: 6e7, Yp: 1.9, byp: 'lactate', pH: [3.4, 6.2, 8.4], KIL: 400, info: 'Homofermentative LAB; growth stops by self-acidification (pH ≈ 3.6).' }),
  C('bac', 'Bacteria', 'ccr', 'Caulobacter crescentus CB15', 90, [10, 30, 37], 1.6, ['pye', 'm2g'], { oxy: 'a', shape: 'crescent', asym: .3, Yp: 0, byp: 'none', info: 'Asymmetric division: stalked cell re-enters S phase at once, swarmer has a G1 delay.' }),
  C('bac', 'Bacteria', 'bth', 'Bacteroides thetaiotaomicron VPI-5482', 60, [25, 37, 45], 2, ['bhi'], { oxy: 'x', Yp: .8, byp: 'acetate/succinate', info: 'Obligate anaerobe of the human gut — needs anaerobic atmosphere.' }),
  C('bac', 'Bacteria', 'msm', 'Mycolicibacterium smegmatis mc²155', 180, [20, 37, 45], 4, ['7h9'], { oxy: 'a', lag: 6, Yp: 0, byp: 'none', kd0: .002, Xmax: 2e9 }),
  C('bac', 'Bacteria', 'mtb', 'Mycobacterium tuberculosis H37Rv', 1200, [30, 37, 40], 3, ['7h9'], { oxy: 'a', lag: 48, Yp: 0, byp: 'none', Xmax: 1e9, kd0: .001, kds: .005, info: 'BSL-3 pathogen; ~20 h doubling, cords in culture.' }),
  C('yst', 'Fungi & yeast', 'sce', 'Saccharomyces cerevisiae BY4741', 90, [5, 30, 40], 5, ['ypd', 'sd', 'sab'], { aux: 'his3Δ leu2Δ met15Δ ura3Δ', info: 'Crabtree-positive: ferments glucose to ethanol even aerobically.' }),
  C('yst', 'Fungi & yeast', 'spo', 'Schizosaccharomyces pombe 972 h⁻', 140, [10, 32, 37.5], 10, ['yes', 'emm'], { shape: 'fission', info: 'Fission yeast: grows at the tips, divides by medial septum.' }),
  C('yst', 'Fungi & yeast', 'cal', 'Candida albicans SC5314', 70, [10, 37, 45], 5, ['ypd', 'sab'], { Yp: .4 }),
  C('yst', 'Fungi & yeast', 'kph', 'Komagataella phaffii GS115 (Pichia)', 120, [10, 30, 35], 4, ['ypd'], { Yg: 6e6, Yp: .05, byp: 'ethanol (trace)', Xmax: 1e9, aux: 'his4', info: 'Crabtree-negative; very high density on respiratory metabolism.' }),
  C('pro', 'Protists & insect', 'ddi', 'Dictyostelium discoideum AX2', 540, [10, 22, 27], 10, ['hl5'], { info: 'Axenic social amoeba.' }),
  C('pro', 'Protists & insect', 'tth', 'Tetrahymena thermophila SB210', 150, [12, 30, 41], 50, ['spp'], { shape: 'ciliate', Xmax: 1e6, info: 'Ciliate; divides by transverse fission.' }),
  C('ins', 'Protists & insect', 'sf9', 'Sf9 (Spodoptera frugiperda)', 1260, [18, 27, 32], 15, ['sf900', 'grace'], { info: 'Baculovirus expression host, 27 °C, no CO₂.' }),
  C('ins', 'Protists & insect', 's2', 'Drosophila S2', 1440, [18, 26, 30], 10, ['schneider'], { pH: [6, 6.7, 7.4] }),
  C('mam', 'Human cell lines', 'hela', 'HeLa (cervical adenocarcinoma)', 1380, [25, 37, 41.5], 30, ['dmem_hi', 'emem'], { Xmax: conf(1.4e5) }),
  C('mam', 'Human cell lines', 'hek', 'HEK293T (embryonic kidney)', 1200, [25, 37, 41.5], 15, ['dmem_hi'], { Xmax: conf(3e5) }),
  C('mam', 'Human cell lines', 'a549', 'A549 (lung carcinoma)', 1320, [25, 37, 41.5], 25, ['f12k', 'dmem_hi'], { Xmax: conf(1.2e5) }),
  C('mam', 'Human cell lines', 'mcf7', 'MCF-7 (breast adenocarcinoma)', 2280, [25, 37, 41.5], 25, ['emem', 'dmem_hi'], { Xmax: conf(1.6e5) }),
  C('mam', 'Human cell lines', 'hepg2', 'HepG2 (hepatocellular carcinoma)', 2880, [25, 37, 41.5], 20, ['emem', 'dmem_hi'], { Xmax: conf(2e5) }),
  C('mam', 'Human cell lines', 'hct', 'HCT116 (colorectal carcinoma)', 1260, [25, 37, 41.5], 15, ['mccoy', 'dmem_hi'], { Xmax: conf(2e5) }),
  C('mam', 'Human cell lines', 'u2os', 'U2OS (osteosarcoma)', 1740, [25, 37, 41.5], 35, ['mccoy', 'dmem_hi'], { Xmax: conf(9e4) }),
  C('mam', 'Human cell lines', 'caco2', 'Caco-2 (colorectal adenocarcinoma)', 3600, [25, 37, 41.5], 20, ['emem'], { Xmax: conf(2.2e5), Ser: 3 }),
  C('mam', 'Human cell lines', 'shsy', 'SH-SY5Y (neuroblastoma)', 2880, [25, 37, 41.5], 20, ['dmemf12'], { Xmax: conf(2e5) }),
  C('mam', 'Human cell lines', 'rpe1', 'hTERT RPE-1 (retinal epithelium)', 1320, [25, 37, 41.5], 35, ['dmemf12'], { Xmax: conf(7e4), info: 'Near-diploid, strongly contact-inhibited.' }),
  C('mam', 'Human cell lines', 'imr90', 'IMR-90 (fetal lung fibroblast)', 2160, [25, 37, 41.5], 50, ['emem'], { Xmax: conf(4.5e4), shape: 'fibro', info: 'Diploid fibroblast with a finite (Hayflick) lifespan.' }),
  C('mam', 'Human cell lines', 'jurkat', 'Jurkat E6-1 (T-cell leukaemia)', 1380, [25, 37, 41.5], 11, ['rpmi'], { mode: 'suspension', shape: 'round', Xmax: 3e6, Ser: 1 }),
  C('mam', 'Human cell lines', 'k562', 'K562 (CML erythroleukaemia)', 1320, [25, 37, 41.5], 18, ['imdm', 'rpmi'], { mode: 'suspension', shape: 'round', Xmax: 1.5e6, Ser: 1 }),
  C('mam', 'Human cell lines', 'hl60', 'HL-60 (promyelocytic leukaemia)', 2400, [25, 37, 41.5], 12, ['imdm', 'rpmi'], { mode: 'suspension', shape: 'round', Xmax: 1.5e6, Ser: 3 }),
  C('mam', 'Human cell lines', 'thp1', 'THP-1 (monocytic leukaemia)', 2700, [25, 37, 41.5], 14, ['rpmi'], { mode: 'suspension', shape: 'round', Xmax: 1e6 }),
  C('mam', 'Other mammalian', 'chok1', 'CHO-K1 (hamster ovary)', 900, [25, 37, 41.5], 15, ['f12k', 'f12', 'dmemf12'], { Xmax: conf(1.2e5) }),
  C('mam', 'Other mammalian', 'chos', 'CHO-S (suspension, serum-free)', 1140, [25, 37, 41.5], 14, ['cdcho'], { mode: 'suspension', shape: 'round', Xmax: 1e7, Ser: 0, KIA: 10, KIL: 60, info: 'Biomanufacturing workhorse; chemically defined medium.' }),
  C('mam', 'Other mammalian', '3t3', 'NIH/3T3 (mouse fibroblast)', 1260, [25, 37, 41.5], 40, ['dmem_hi'], { Xmax: conf(5e4), shape: 'fibro', info: 'Classic contact-inhibition model — do not let it reach confluence.' }),
  C('mam', 'Other mammalian', 'vero', 'Vero (African green monkey kidney)', 1440, [25, 37, 41.5], 25, ['emem', 'dmem_hi'], { Xmax: conf(1e5) }),
  C('mam', 'Other mammalian', 'mdck', 'MDCK (canine kidney)', 1320, [25, 37, 41.5], 15, ['emem'], { Xmax: conf(2.5e5) }),
  C('mam', 'Other mammalian', 'raw', 'RAW 264.7 (mouse macrophage)', 1080, [25, 37, 41.5], 15, ['dmem_hi'], { Xmax: conf(3e5) }),
];
