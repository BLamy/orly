/**
 * ch02-s03 — the FILE insert's kraft folder, seen top-down under the banker's lamp (lamp at upper right).
 *
 *   kraftFolder(f, c, { x, y, flap, carbon, lamp }, env)
 *     flap    −1 = the front flap lies open below the spine (its inner face up) … 0 = edge-on (raised toward
 *             the lens) … +1 = shut over the back cover. The shot drives it as a HINGE rotation about the fold.
 *     carbon  0..1 the carbon copy has slid into the folder (1 = filed; its top edge shows above the flap)
 *   FOLDER                    geometry (centre-relative) for the shot's hands: the spine, the flap's free edge
 *
 * Kraft stock, not a flat UI rectangle: a cached fibre-and-speckle texture, a darker inner back leaf showing
 * at the open edge above the (shorter) front flap, a scored fold crease along the spine, and a soft
 * paper-cut shadow thrown down-left, away from the lamp. The raised flap catches the lamp and casts its own
 * moving shadow.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { FONT, legibleSize } from '../../../film/silhouette/type';

type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export const FOLDER = { W: 450, H: 250, tabW: 150, tabH: 34, flapShort: 16 } as const;
/** the carbon copy's sheet (sized so its four typed lines sit at the legibility floor) */
export const CARBON = { w: 410, h: 236 } as const;
/** the front flap's height (it is cut shorter than the back cover, so the inner back leaf shows above it) */
export const FLAP_H = FOLDER.H - FOLDER.flapShort;

function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function kraftTones(env: PaintEnv) {
  const P = env.mood;
  // a darker, browner kraft (manila-board, not grey card): less haze, so it reads as stock under the lamp
  const kraft = mixLab(mixLab('#80592c', P.haze, 0.14), P.rim, 0.1);
  return {
    outer: kraft,
    inner: mixLab(kraft, P.set, 0.38),
    edge: mixLab(kraft, P.core, 0.25),
    shade: P.fg,
  };
}

/** a W×H kraft texture (fibres, speckle, a little mottling), baked once per mood */
function kraftTex(f: Frame, env: PaintEnv, key: string, w: number, h: number, base: string, seed: number) {
  return f.cached(`ch02-s03/kraft2/${key}/${env.mood.id}/${w}x${h}`, w, h, (g) => {
    const P = env.mood;
    const R = rnd(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    // mottling
    for (let i = 0; i < 26; i++) {
      const x = R() * w, y = R() * h, r = 20 + R() * 60;
      const m = g.createRadialGradient(x, y, 0, x, y, r);
      const dark = R() < 0.5;
      m.addColorStop(0, withAlpha(dark ? P.fg : P.core, dark ? 0.06 : 0.05));
      m.addColorStop(1, withAlpha(dark ? P.fg : P.core, 0));
      g.fillStyle = m;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // fibres: short, mostly along the grain (horizontal)
    const n = Math.round((w * h) / 90);
    for (let i = 0; i < n; i++) {
      const x = R() * w, y = R() * h, L = 3 + R() * 12, a = (R() - 0.5) * 0.7;
      g.strokeStyle = R() < 0.5 ? withAlpha(P.fg, 0.12 + R() * 0.1) : withAlpha(P.core, 0.08 + R() * 0.08);
      g.lineWidth = 0.5 + R() * 0.5;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.stroke();
    }
    // dark speckle (the recycled flecks of kraft)
    for (let i = 0; i < (w * h) / 700; i++) {
      g.fillStyle = withAlpha(P.fg, 0.25 + R() * 0.25);
      g.fillRect(R() * w, R() * h, 0.8 + R() * 1.2, 0.8 + R() * 1.2);
    }
  });
}

export interface KraftFolderOpts {
  x: number;
  y: number;
  /** −1 open … +1 shut (hinge about the spine) */
  flap: number;
  /** 0..1 the carbon copy slid in (it rides in from the lower right, under the hand) */
  carbon: number;
  /** where the carbon is while it travels (layer px, top-left corner), before it is filed */
  carbonAt?: { x: number; y: number; rot: number };
  lamp?: number;
}

/** the folder's spine (fold line) y and back-cover rect, centre-relative */
export function folderGeo(x: number, y: number) {
  const { W, H } = FOLDER;
  return { left: x - W / 2, right: x + W / 2, top: y - H / 2, spine: y + H / 2, W, H };
}

/** the carbon copy (thin grey paper with the typed sentence as a faint impression), drawn at its top-left */
/** `pxScale`: the frame's device px per stage px (f.pxScale), for sizing the type to the 22 px cap floor */
export function carbonCopy(c: C, x: number, y: number, rot: number, env: PaintEnv, pxScale = 1.5) {
  const { w, h } = CARBON;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = withAlpha(env.mood.fg, 0.32);
  c.fillRect(3, 4, w, h);
  c.fillStyle = mixLab(env.mood.setHaze, env.mood.rim, 0.5);
  c.fillRect(0, 0, w, h);
  // the carbon's impression in five short lines, all at the legibility floor (the viewer reads what is being
  // filed); the impression fades line by line down the sheet (~40% by the last), as carbons do
  const lines = ['THE STRUCTURE', 'OF THE NET', 'DOES NOT', 'CHANGE WITH', 'TIME.'];
  const alphas = [0.85, 0.78, 0.64, 0.5, 0.4];
  const longest = lines[0];
  // sized from a direct measurement of the face's cap height (the kit's cached ratio can hold a fallback for this
  // face): cap px at 1080 = size x capRatio x (stage scale x 1.5)
  c.font = `400 100px ${FONT.typewriter}`;
  const rT = c.measureText('H').actualBoundingBoxAscent / 100;
  const m = c.getTransform();
  const px1080 = (Math.hypot(m.a, m.b) / pxScale) * 1.5;
  let fs = Math.max(legibleSize(c, `400 15px ${FONT.typewriter}`, 15, longest), rT > 0.1 ? 32 / (rT * px1080) : 0);
  c.font = `400 ${fs}px ${FONT.typewriter}`;
  const tw = Math.max(...lines.map((l) => c.measureText(l).width));
  if (tw > w - 20) {
    fs *= (w - 20) / tw;
    c.font = `400 ${fs}px ${FONT.typewriter}`;
  }
  // alphabetic baseline (the legibility audit reads 'middle' text short)
  c.textBaseline = 'alphabetic';
  const capH = c.measureText('H').actualBoundingBoxAscent;
  const ink = mixLab(env.mood.ink, '#1d2433', 0.35);
  const lead = Math.min(fs * 1.12, (h - 22) / lines.length);
  lines.forEach((l, i) => {
    c.fillStyle = withAlpha(ink, alphas[i]);
    c.fillText(l, 10, 10 + lead * 0.5 + i * lead + capH / 2);
  });
  c.restore();
}

export function kraftFolder(f: Frame, c: C, o: KraftFolderOpts, env: PaintEnv) {
  const P = env.mood;
  const K = kraftTones(env);
  const g = folderGeo(o.x, o.y);
  const { W, H, tabW, tabH } = FOLDER;
  const s = Math.max(-1, Math.min(1, o.flap));
  // 1) the paper-cut shadow under the whole folder (thrown down-left, away from the lamp at upper right)
  // (a cast shadow you can see on the dark desk: offset ~18 px down-left, deep at the contact edge)
  f.cached(`ch02-s03/folderShadow2/${env.mood.id}`, W + 100, H + 100 + tabH, (cc) => {
    cc.fillStyle = withAlpha(P.fg, 0.85);
    cc.fillRect(50, 50 + tabH, W, H);
    cc.fillRect(50 + 28, 50, tabW, tabH + 2);
  }, { blur: 10 })(c, g.left - 50 - 18, g.top - tabH - 50 + 22);
  f.cached(`ch02-s03/folderContact/${env.mood.id}`, W + 40, H + 40, (cc) => {
    cc.fillStyle = withAlpha(P.fg, 0.7);
    cc.fillRect(20, 20, W, H);
  }, { blur: 3 })(c, g.left - 20 - 5, g.top - 20 + 6);
  // the stock's thickness: the folder's cut edges (back cover + the papers in it) show as a dark lip along the
  // sides away from the lamp (left and bottom), a few layers stepped like a thin stack
  for (let i = 3; i >= 1; i--) {
    c.fillStyle = mixLab(K.inner, P.fg, 0.35 + 0.15 * i);
    c.fillRect(g.left - i * 1.4, g.top + i * 1.6, W, H);
  }
  c.fillStyle = mixLab(K.outer, P.fg, 0.5);
  c.fillRect(g.left + 28 - 4, g.top - tabH + 4, tabW, tabH);
  // 2) the back cover, inside face up: a darker inner leaf, the tab, the scored fold
  const innerTex = kraftTex(f, env, 'inner', W, H, K.inner, 1951);
  innerTex(c, g.left, g.top);
  const outerTabTex = kraftTex(f, env, 'tab', tabW, tabH, K.outer, 1952);
  outerTabTex(c, g.left + 28, g.top - tabH);
  c.fillStyle = withAlpha(P.fg, 0.35);
  c.fillRect(g.left + 28, g.top - 2, tabW, 2);
  // the tab's typed label strip: an off-white gummed label, the year typed on it
  {
    const lx = g.left + 28 + 12, ly = g.top - tabH + 7, lw = tabW - 24, lh = tabH - 13;
    c.fillStyle = withAlpha(P.fg, 0.35);
    c.fillRect(lx + 1.5, ly + 2, lw, lh);
    c.fillStyle = mixLab(mixLab(P.rim, P.halo, 0.35), P.core, 0.2);
    c.fillRect(lx, ly, lw, lh);
    c.strokeStyle = withAlpha(P.fg, 0.25);
    c.lineWidth = 0.8;
    c.strokeRect(lx + 0.5, ly + 0.5, lw - 1, lh - 1);
    c.save();
    c.fillStyle = withAlpha(mixLab(P.ink, '#1d2433', 0.3), 0.85);
    c.font = `400 ${Math.round(lh * 0.78)}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const cap = c.measureText('H').actualBoundingBoxAscent;
    c.fillText('1943', lx + lw / 2, ly + lh / 2 + cap / 2);
    c.restore();
  }
  // the cut edge of the stock catches the lamp along its top and right
  c.strokeStyle = withAlpha(K.edge, 0.55);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(g.left + 28, g.top - tabH + 0.6);
  c.lineTo(g.left + 28 + tabW, g.top - tabH + 0.6);
  c.moveTo(g.right - 0.6, g.top);
  c.lineTo(g.right - 0.6, g.spine);
  c.stroke();
  // an older filed slip's edge (the file is not new)
  c.fillStyle = mixLab(P.rim, P.halo, 0.45);
  c.fillRect(g.left + 22, g.top + 12, W - 60, 5);
  c.fillStyle = withAlpha(P.fg, 0.3);
  c.fillRect(g.left + 22, g.top + 17, W - 60, 1.5);
  // 3) the carbon copy: travelling under the hand, or filed (its top edge rides 8 px under the back's top)
  if (o.carbon >= 1) carbonCopy(c, g.left + 30, g.top + 8, -0.008, env, f.pxScale);
  else if (o.carbonAt) carbonCopy(c, o.carbonAt.x, o.carbonAt.y, o.carbonAt.rot, env, f.pxScale);
  // 4) the scored fold (two creases along the spine)
  c.strokeStyle = withAlpha(P.fg, 0.45);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(g.left + 2, g.spine - 3);
  c.lineTo(g.right - 2, g.spine - 3);
  c.stroke();
  c.strokeStyle = withAlpha(K.edge, 0.3);
  c.beginPath();
  c.moveTo(g.left + 2, g.spine - 1.5);
  c.lineTo(g.right - 2, g.spine - 1.5);
  c.stroke();
  // 5) the front flap, a hinge about the spine: local y in [0, −FLAP_H] scaled by s
  const fh = FLAP_H;
  const lamp = o.lamp ?? 1;
  // its shadow: when raised (|s| small) the flap stands up and throws a long shadow down-left
  const up = 1 - Math.abs(s);
  if (up > 0.02) {
    c.save();
    c.fillStyle = withAlpha(P.fg, 0.55 * up);
    c.filter = 'blur(3px)';
    c.beginPath();
    c.moveTo(g.left, g.spine);
    c.lineTo(g.right, g.spine);
    c.lineTo(g.right - fh * 0.7 * up, g.spine + fh * 0.62 * up * (s < 0 ? 1 : 0.55));
    c.lineTo(g.left - fh * 0.7 * up, g.spine + fh * 0.62 * up * (s < 0 ? 1 : 0.55));
    c.closePath();
    c.fill();
    c.restore();
  } else if (s < 0) {
    // lying open on the desk: a thin contact shadow along its far (left/bottom) edges
    c.fillStyle = withAlpha(P.fg, 0.35);
    c.fillRect(g.left - 4, g.spine + 4, W, fh * -s);
  }
  if (Math.abs(s) > 0.003) {
    const face = s > 0 ? K.outer : mixLab(K.inner, K.outer, 0.45);
    const tex = kraftTex(f, env, s > 0 ? 'flapOut' : 'flapIn', W, fh, face, s > 0 ? 1953 : 1954);
    c.save();
    c.translate(0, g.spine);
    c.scale(1, s);
    tex(c, g.left, -fh);
    // the raised flap leans toward the lamp: it brightens as it stands up, then settles
    if (up > 0.02) {
      c.fillStyle = withAlpha(P.core, 0.18 * up * lamp);
      c.fillRect(g.left, -fh, W, fh);
    }
    // its scored fold and its cut edge (the free edge catches the lamp)
    c.strokeStyle = withAlpha(P.fg, 0.4);
    c.lineWidth = 1 / Math.max(0.2, Math.abs(s));
    c.beginPath();
    c.moveTo(g.left + 2, -4);
    c.lineTo(g.right - 2, -4);
    c.stroke();
    c.restore();
    // free edge line (unscaled width); a shut flap shows its own thickness as a dark lip down-left of the edge
    const ey = g.spine - s * fh;
    if (s > 0.2) {
      c.fillStyle = withAlpha(mixLab(K.outer, P.fg, 0.6), clamp01((s - 0.2) / 0.5));
      c.fillRect(g.left - 1.5, ey, W, 2.6);
    }
    c.strokeStyle = withAlpha(K.edge, 0.6);
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(g.left, ey);
    c.lineTo(g.right, ey);
    c.stroke();
    // a hairline thumb notch at the free edge's centre (a real folder's cut)
    c.fillStyle = s > 0 ? K.inner : withAlpha(P.fg, 0.5);
    c.beginPath();
    c.ellipse(o.x, ey, 18, 7 * Math.abs(s), 0, s > 0 ? 0 : Math.PI, s > 0 ? Math.PI : Math.PI * 2);
    c.fill();
  }
  // 6) the inner back leaf visible at the open edge when shut: a darker band above the flap (already the
  //    back's inner face); add the flap's own lip shadow on it
  if (s > 0.6) {
    // the pocket's mouth: a darker inner edge where the shut flap stands off the back leaf
    const pa = clamp01((s - 0.6) / 0.4);
    const ey = g.spine - s * fh;
    const pg = c.createLinearGradient(0, ey - 12, 0, ey);
    pg.addColorStop(0, withAlpha(P.fg, 0));
    pg.addColorStop(0.6, withAlpha(P.fg, 0.32 * pa));
    pg.addColorStop(1, withAlpha(P.fg, 0.7 * pa));
    c.fillStyle = pg;
    c.fillRect(g.left, ey - 12, W, 12);
  } else if (s < 0) {
    // open: the pocket's inner edge along the spine (the fold stands a hair proud of the back leaf)
    const pg = c.createLinearGradient(0, g.spine - 10, 0, g.spine);
    pg.addColorStop(0, withAlpha(P.fg, 0));
    pg.addColorStop(1, withAlpha(P.fg, 0.45));
    c.fillStyle = pg;
    c.fillRect(g.left, g.spine - 10, W, 10);
  }
  void hash1;
}

/** the desk top under the lamp's pool (as the study's FILE desk: dark wood, grain as faint cut-lines), cached */
export function fileInsertDesk(f: Frame, c: C, cx: number, cy: number, env: PaintEnv) {
  f.cached(`ch02-s03/desk2/${env.mood.id}/${cx},${cy}`, 1680, 1120, (g) => {
    g.translate(200, 200);
    const P = env.mood;
    g.fillStyle = mixLab(P.set, P.fg, 0.5);
    g.fillRect(-200, -200, 1680, 1120);
    // the lamp's pool on the desk, from the upper right (the shade sits off the frame's top-right corner)
    const r = g.createRadialGradient(cx + 220, cy - 150, 30, cx + 220, cy - 150, 760);
    r.addColorStop(0, withAlpha(mixLab(P.set, P.halo, 0.42), 0.95));
    r.addColorStop(0.6, withAlpha(mixLab(P.set, P.halo, 0.15), 0.5));
    r.addColorStop(1, withAlpha(P.set, 0));
    g.fillStyle = r;
    g.fillRect(-200, -200, 1680, 1120);
    // wood grain: long, uneven, wandering figure (never evenly spaced: it must not read as ruled paper)
    let yy = -160;
    for (let i = 0; yy < 980; i++) {
      yy += 9 + Math.abs(hash1(i, 3)) * 34;
      g.strokeStyle = withAlpha(P.fg, 0.1 + 0.16 * Math.abs(hash1(i, 6)));
      g.lineWidth = 0.7 + Math.abs(hash1(i, 7)) * 1.6;
      g.beginPath();
      g.moveTo(-200, yy);
      for (let x = -200; x <= 1480; x += 120) {
        const w = 10 * Math.sin(x * 0.004 + i * 0.7) + 6 * hash1(i * 13 + Math.round(x / 120), 8);
        g.lineTo(x, yy + w);
      }
      g.stroke();
    }
    // two knots, the grain bending round them
    for (const [kx, ky] of [[160, 560], [1150, 120]]) {
      g.strokeStyle = withAlpha(P.fg, 0.22);
      g.lineWidth = 1.2;
      for (let j = 0; j < 4; j++) {
        g.beginPath();
        g.ellipse(kx, ky, 14 + j * 9, 5 + j * 4, 0.05, 0, Math.PI * 2);
        g.stroke();
      }
    }
  })(c, -200, -200);
}
