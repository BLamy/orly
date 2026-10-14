// Generates mood palettes on a FIXED CIELAB lightness ladder (measured from the reference),
// varying only hue/chroma per mood. Output: palettes.json + a markdown table.
import { hcl, lab } from 'd3-color';
import fs from 'fs';
// value ladder (L*) measured from the reference frame
const L = { ink: 5, fg: 2.5, set: 22, setHaze: 34, sky0: 24, sky1: 38, sky2: 49, sky3: 62, haze: 44, glowHalo: 60, glowCore: 88 };
// per mood: [hue, chroma] for sky (cool->warm toward horizon), set, ink, haze, glow
const M = {
  duskRose:    { sky:[[40,12],[44,16],[42,17],[55,20]], set:[52,10], ink:[50,2], haze:[58,12], halo:[70,31], core:[85,36] },
  candleAmber: { sky:[[55,14],[62,22],[68,30],[75,38]], set:[58,12], ink:[55,3], haze:[66,18], halo:[72,45], core:[88,40] },
  winterBlue:  { sky:[[255,10],[250,13],[245,12],[235,8]], set:[250,6], ink:[255,3], haze:[245,7], halo:[230,12], core:[95,10] },
  labGreen:    { sky:[[170,6],[155,11],[140,14],[118,16]], set:[150,7], ink:[160,2], haze:[135,10], halo:[115,26], core:[105,30] },
  dawnGold:    { sky:[[300,8],[30,14],[65,32],[82,48]], set:[50,10], ink:[45,3], haze:[70,20], halo:[78,45], core:[90,45] },
  serverCyan:  { sky:[[265,14],[235,16],[215,20],[200,22]], set:[230,8], ink:[240,4], haze:[210,14], halo:[200,40], core:[195,30] },
  emberRed:    { sky:[[10,14],[25,26],[35,34],[45,38]], set:[25,12], ink:[20,3], haze:[35,20], halo:[50,50], core:[80,40] },
  parchment:   null,
};
const hx = (h,c,l) => { const x = hcl(h,c,l); return x.displayable() ? x.formatHex() : hcl(h, c*0.8, l).formatHex(); };
const out = {};
for (const [k, m] of Object.entries(M)) {
  if (!m) continue;
  const skyL = [L.sky0, L.sky1, L.sky2, L.sky3];
  out[k] = {
    sky: m.sky.map(([h,c],i)=>hx(h,c,skyL[i])),
    set: hx(...m.set, L.set),
    setHaze: hx(m.set[0], m.set[1]*1.1, L.setHaze),
    haze: hx(...m.haze, L.haze),
    fg: hx(m.ink[0], m.ink[1], L.fg),
    ink: hx(...m.ink, L.ink),
    rim: hx(m.sky[3][0], m.sky[3][1]*1.2, 74),
    halo: hx(...m.halo, L.glowHalo),
    core: hx(...m.core, L.glowCore),
  };
}
// parchment plate: inverse value structure for technical diagram plates
out.parchment = { sky:['#e9dcc3','#e4d4b8','#ddcaa9','#d3bd98'], set:'#b9a27e', setHaze:'#cbb791', haze:'#efe5d2', fg:'#2a211b', ink:'#1a1310', rim:'#fff6e6', halo:'#f2c879', core:'#fff3d0' };
fs.writeFileSync(new URL("../../apps/bookshelf/src/viz/film/silhouette/palettes.json", import.meta.url), JSON.stringify(out, null, 2));
const cols = ['sky','set','setHaze','haze','fg','ink','rim','halo','core'];
console.log('| mood | sky ramp (top->horizon) | set | setHaze | haze | fg | ink | rim | halo | core |');
for (const [k,p] of Object.entries(out)) console.log(`| ${k} | ${p.sky.join(' ')} | ${cols.slice(1).map(c=>p[c]).join(' | ')} |`);
// verify ladder
for (const [k,p] of Object.entries(out)) console.log(k, 'L*:', [...p.sky, p.set, p.haze, p.ink, p.core].map(h=>lab(h).l.toFixed(0)).join(','));
