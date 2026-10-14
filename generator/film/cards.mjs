#!/usr/bin/env node
// Card audit — no paper card shows blank (review round 3: cards showed as blank paper for 0.5-2 s before their text
// inked, which read as placeholder frames: ch05-s04, ch10-s13b, ch14-s07, ch03-s06, ch09-s05).
//
//   node generator/film/cards.mjs --slug <slug> [--shot id[,id] | --all] [--step 0.0833] [--json] [--no-trans | --trans-only]
//
// RULE: a card whose paper is over 50 % opaque while its text is under 20 % opaque for more than 0.3 s fails.
// The harness page gets a recorder (init script):
//   PROBED cards: the type kit's cardProbe(c, id, rect, paper, ink) (silhouette/type.ts) reports each paper card with
//     its own paper and first-line ink opacity -> a blank stretch FAILS.
//   UNPROBED paper: fillRect and drawImage (of a baked canvas) calls that cover 0.8-35 % of the frame with a light,
//     opaque fill (the sampled source pixels' luma >= 0.42 at >= 50 % effective opacity, aspect 1.1-9) are paper
//     candidates; their ink is the strongest text drawn (fillText/strokeText) with its anchor inside the rect. A blank
//     stretch WARNS (a candidate may be a window pane or a light shaft: read the frame).
// Sampling: every --step s (default 2 frames) while the shot is alone on screen. Output: films/<slug>/qa/cards/<shot>.json
// and summary.json; QA sheets.cards reads the summary (fail on a probed blank card, warn on a suspect).
//
// GHOST TEXT (review round 4: crossfades left two text layers readable on top of each other). The same pass records
// every text line drawn on a frame-size canvas (fillText/strokeText, glyph runs merged per line; text drawn under
// textRole 'texture' or inside the type kit's ghostOk() is skipped) and every textProbe(c, id, rect, alpha) layer.
// RULE: two DIFFERENT text layers whose boxes overlap by >= 30 % of the smaller box, both above 25 % opacity, for
// more than 0.25 s FAIL (summary shots[id].ghosts; QA sheets.ghostText). Fix: the type kit's textSwapOut/textSwapIn
// (the outgoing text is at 0 four frames after the incoming passes 30 %).
// TRANSITION GHOSTS (review round 5): the transition INTO each shot (transitionIn other than cut) is audited too:
// both shots' text, each weighted by the transition, the same 25 % / 30 % / 0.25 s rule, cross-shot pairs only,
// listed under the INCOMING shot (summary shots[id].transGhosts; QA sheets.ghostText). It also WARNS (transCarry) when
// one shot's text above 25 % dissolves over the other shot's picture above 25 % for > 0.25 s. --no-trans skips it;
// --trans-only audits only the transitions into the given shots (cut-in shots are skipped) and keeps their in-shot results.
import path from 'node:path';
import { parseArgs, list, num, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, rel, mkdirp } from './lib/paths.mjs';
import { launchChromium } from './lib/browser.mjs';
import { openSite } from './lib/site.mjs';
import { openHarness } from './lib/harness.mjs';

const a = parseArgs(process.argv.slice(2), { boolean: ['all', 'help', 'json', 'build', 'no-trans', 'trans-only'], string: ['slug', 'dir', 'shot', 'shots', 'step', 'base', 'from', 'to'] });
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const STEP = Math.max(1 / 24, num(a.step, 2 / 24));
const PAPER = 0.5;
const INK = 0.2;
const MAX_BLANK = 0.3;
const OUT = path.join(P.qa.dir, 'cards');

// runs in the page before any script
function recorder() {
  const C = CanvasRenderingContext2D.prototype;
  const alphaOf = (style) => {
    if (typeof style !== 'string') return 1;
    let m = /rgba?\(([^)]+)\)/.exec(style);
    if (m) {
      const p = m[1].split(/[ ,/]+/).filter(Boolean);
      return p.length >= 4 ? parseFloat(p[3]) * (p[3].includes('%') ? 0.01 : 1) : 1;
    }
    m = /^#([0-9a-f]{8})$/i.exec(style);
    if (m) return parseInt(m[1].slice(6), 16) / 255;
    return 1;
  };
  const lumaOf = (style) => {
    if (typeof style !== 'string') return 0;
    let m = /^#([0-9a-f]{6})/i.exec(style);
    let r, g, b;
    if (m) {
      const v = parseInt(m[1], 16);
      r = (v >> 16) & 255;
      g = (v >> 8) & 255;
      b = v & 255;
    } else if ((m = /rgba?\(([^)]+)\)/.exec(style))) {
      [r, g, b] = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat);
    } else return 0;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  const frameArea = () => (window.__film?.width || 1920) * (window.__film?.height || 1080);
  const devRect = (ctx, x, y, w, h) => {
    const m = ctx.getTransform();
    const pts = [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h],
    ].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  const cardish = (r, cv) => {
    const A = frameArea();
    // only the part on the canvas counts (baked strips and off-camera geometry are not on screen)
    const x1 = Math.max(0, r.x), y1 = Math.max(0, r.y), x2 = Math.min(cv?.width ?? 1920, r.x + r.w), y2 = Math.min(cv?.height ?? 1080, r.y + r.h);
    if (x2 - x1 < r.w * 0.6 || y2 - y1 < r.h * 0.6) return false;
    const area = r.w * r.h;
    const asp = Math.max(r.w, r.h) / Math.max(1, Math.min(r.w, r.h));
    return area >= 0.008 * A && area <= 0.35 * A && asp >= 1.1 && asp <= 9;
  };
  // the frame canvas and its full-size layer canvases (baked plates are small and are judged where they are drawn)
  const isMain = (ctx) => !!ctx.canvas && ctx.canvas.width >= (window.__film?.width || 1920) * 0.5;
  const push = (o) => {
    if (window.__cardPaper) window.__cardPaper.push(o);
  };
  const origRect = C.fillRect;
  C.fillRect = function (x, y, w, h) {
    if (window.__cardPaper && isMain(this) && this.globalCompositeOperation === 'source-over') {
      const a = this.globalAlpha * alphaOf(this.fillStyle);
      if (a >= 0.5 && lumaOf(this.fillStyle) >= 0.42) {
        const r = devRect(this, x, y, w, h);
        if (cardish(r, this.canvas)) push({ ...r, paper: a, how: 'fillRect' });
      }
    }
    return origRect.call(this, x, y, w, h);
  };
  const lumaCache = new WeakMap();
  const srcLuma = (img) => {
    if (!(img instanceof HTMLCanvasElement) && !(typeof OffscreenCanvas !== 'undefined' && img instanceof OffscreenCanvas)) return null;
    if (lumaCache.has(img)) return lumaCache.get(img);
    let out = null;
    try {
      const g = img.getContext('2d');
      const W = img.width, H = img.height;
      let L = 0, A = 0, n = 0;
      for (const [fx, fy] of [[0.5, 0.5], [0.3, 0.4], [0.7, 0.6], [0.4, 0.7], [0.6, 0.3]]) {
        const d = g.getImageData(Math.floor(W * fx), Math.floor(H * fy), 1, 1).data;
        L += (0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]) / 255;
        A += d[3] / 255;
        n++;
      }
      out = { luma: L / n, alpha: A / n };
    } catch {
      out = null;
    }
    lumaCache.set(img, out);
    return out;
  };
  const origImg = C.drawImage;
  C.drawImage = function (img, ...args) {
    if (window.__cardPaper && isMain(this) && this.globalCompositeOperation === 'source-over') {
      const s = srcLuma(img);
      if (s && s.luma >= 0.42 && s.alpha * this.globalAlpha >= 0.5) {
        const [dx, dy, dw, dh] = args.length >= 8 ? args.slice(4, 8) : args.length >= 4 ? args.slice(0, 4) : [args[0], args[1], img.width, img.height];
        const r = devRect(this, dx, dy, dw, dh);
        if (cardish(r, this.canvas)) push({ ...r, paper: s.alpha * this.globalAlpha, how: 'drawImage' });
      }
    }
    return origImg.call(this, img, ...args);
  };
  // ghost-text occluders (review round 4): opaque fills drawn AFTER a text hide it. Every draw gets an order index;
  // fillRect / fill(path) / drawImage with >= 30 % opacity (solid colours and sampled images only: gradients are
  // glows) are kept, with that opacity, with their device box, normalised to the frame (half-res blur scratches scale x2). Layer
  // composites (images over 60 % of the frame) are not occluders.
  const FW = () => window.__film?.width || 1920;
  const scaleOf = (ctx) => FW() / (ctx.canvas?.width || FW());
  const normRect = (ctx, r) => {
    const k = scaleOf(ctx);
    return { x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k };
  };
  // every canvas gets an id; a canvas drawn onto another (a layer scratch composited onto the frame, at its alpha) is
  // a COMPOSITE, so a text or an occluder drawn on a scratch is placed and faded where (and when) that scratch lands
  const CID = new WeakMap();
  let cidN = 0;
  const cidOf = (cv) => {
    if (!cv) return -1;
    if (!CID.has(cv)) CID.set(cv, ++cidN);
    return CID.get(cv);
  };
  const occl = (ctx, r, how, a) => {
    if (!window.__ghostOcc) return;
    const n = normRect(ctx, r);
    if (n.w * n.h > 0.6 * FW() * (window.__film?.height || 1080)) return;
    window.__ghostOcc.push({ ...n, i: window.__ghostSeq++, how, a: Math.min(1, a), cv: cidOf(ctx.canvas) });
  };
  const solidA = (ctx) => (typeof ctx.fillStyle === 'string' ? ctx.globalAlpha * alphaOf(ctx.fillStyle) : 0);
  const PB = new WeakMap();
  const bbAdd = (bb, x, y) => {
    bb[0] = Math.min(bb[0], x);
    bb[1] = Math.min(bb[1], y);
    bb[2] = Math.max(bb[2], x);
    bb[3] = Math.max(bb[3], y);
  };
  const hookPath = (proto, devSpace) => {
    const pt = (self, x, y) => {
      let bb = PB.get(self);
      if (!bb) PB.set(self, (bb = [Infinity, Infinity, -Infinity, -Infinity]));
      if (devSpace) {
        const m = self.getTransform();
        bbAdd(bb, m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f);
      } else bbAdd(bb, x, y);
    };
    const wrap = (name, fn) => {
      const o = proto[name];
      if (!o) return;
      proto[name] = function (...args) {
        try {
          fn(this, ...args);
        } catch {}
        return o.apply(this, args);
      };
    };
    wrap('moveTo', (t, x, y) => pt(t, x, y));
    wrap('lineTo', (t, x, y) => pt(t, x, y));
    wrap('quadraticCurveTo', (t, cx, cy, x, y) => (pt(t, cx, cy), pt(t, x, y)));
    wrap('bezierCurveTo', (t, a, b, c2, d, x, y) => (pt(t, a, b), pt(t, c2, d), pt(t, x, y)));
    wrap('rect', (t, x, y, w, h) => (pt(t, x, y), pt(t, x + w, y + h), pt(t, x + w, y), pt(t, x, y + h)));
    wrap('roundRect', (t, x, y, w, h) => (pt(t, x, y), pt(t, x + w, y + h), pt(t, x + w, y), pt(t, x, y + h)));
    wrap('arc', (t, x, y, r) => (pt(t, x - r, y - r), pt(t, x + r, y + r), pt(t, x + r, y - r), pt(t, x - r, y + r)));
    wrap('ellipse', (t, x, y, rx, ry) => (pt(t, x - rx, y - ry), pt(t, x + rx, y + ry), pt(t, x + rx, y - ry), pt(t, x - rx, y + ry)));
    if (devSpace) wrap('beginPath', (t) => PB.delete(t));
  };
  hookPath(C, true);
  if (typeof Path2D !== 'undefined') hookPath(Path2D.prototype, false);
  const origFill = C.fill;
  C.fill = function (...args) {
    if (window.__ghostOcc && isMain(this) && this.globalCompositeOperation === 'source-over' && solidA(this) >= 0.3) {
      const p = args[0] instanceof Path2D ? args[0] : null;
      const bb = PB.get(p || this);
      if (bb && Number.isFinite(bb[0])) {
        let r;
        if (p) {
          const m = this.getTransform();
          const pts = [[bb[0], bb[1]], [bb[2], bb[1]], [bb[0], bb[3]], [bb[2], bb[3]]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
          const xs = pts.map((q) => q[0]);
          const ys = pts.map((q) => q[1]);
          r = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
        } else r = { x: bb[0], y: bb[1], w: bb[2] - bb[0], h: bb[3] - bb[1] };
        occl(this, r, 'fill', solidA(this));
      }
    }
    return origFill.apply(this, args);
  };
  const origRect2 = C.fillRect;
  C.fillRect = function (x, y, w, h) {
    if (window.__ghostOcc && isMain(this) && this.globalCompositeOperation === 'source-over' && solidA(this) >= 0.3) occl(this, devRect(this, x, y, w, h), 'fillRect', solidA(this));
    return origRect2.call(this, x, y, w, h);
  };
  const origImg2 = C.drawImage;
  C.drawImage = function (img, ...args) {
    if (window.__ghostComp && (img instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== 'undefined' && img instanceof OffscreenCanvas))) window.__ghostComp.push({ src: cidOf(img), dst: cidOf(this.canvas), g: this.globalAlpha, op: this.globalCompositeOperation, i: window.__ghostSeq++ });
    if (window.__ghostOcc && isMain(this) && this.globalCompositeOperation === 'source-over' && this.globalAlpha >= 0.3) {
      const sl = srcLuma(img);
      if (sl && sl.alpha >= 0.9) {
        const [dx, dy, dw, dh] = args.length >= 8 ? args.slice(4, 8) : args.length >= 4 ? args.slice(0, 4) : [args[0], args[1], img.width, img.height];
        occl(this, devRect(this, dx, dy, dw, dh), 'drawImage', this.globalAlpha * sl.alpha);
      }
    }
    return origImg2.call(this, img, ...args);
  };
  const wrapText = (name) => {
    const orig = C[name];
    C[name] = function (text, x, y, maxW) {
      // review round 4: ghost-text recorder (tight glyph box in device px, effective alpha, role)
      if (window.__ghostText && text != null && /[A-Za-z0-9]/.test(String(text)) && isMain(this) && this.__textRole !== 'texture' && !this.__ghostOk) {
        const s = String(text);
        const mt = this.measureText(s);
        const w = Math.min(Number.isFinite(maxW) ? maxW : Infinity, mt.width);
        const al = this.textAlign;
        const x0 = al === 'center' ? x - w / 2 : al === 'right' || al === 'end' ? x - w : x;
        const asc = mt.actualBoundingBoxAscent || 0;
        const desc = mt.actualBoundingBoxDescent || 0;
        const m = this.getTransform();
        const a = this.globalAlpha * alphaOf(name === 'fillText' ? this.fillStyle : this.strokeStyle);
        // local box + the full transform: rotated or skewed cards are compared as oriented boxes, not inflated AABBs
        const k = scaleOf(this);
        if (w > 0 && asc + desc > 0) window.__ghostText.push({ m: [m.a * k, m.b * k, m.c * k, m.d * k, m.e * k, m.f * k], lx: x0, ly: y - asc, lw: w, lh: asc + desc, base: y, alpha: a, text: s.slice(0, 60), font: this.font, i: window.__ghostSeq++, cv: cidOf(this.canvas) });
      }
      if (window.__cardText && text != null && /[A-Za-z0-9]/.test(String(text))) {
        const m = this.getTransform();
        const w = this.measureText(String(text)).width;
        const al = this.textAlign;
        const x0 = al === 'center' ? x - w / 2 : al === 'right' || al === 'end' ? x - w : x;
        const pts = [
          [x0, y],
          [x0 + w, y],
          [x0 + w / 2, y],
        ].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
        window.__cardText.push({ pts, alpha: this.globalAlpha * alphaOf(name === 'fillText' ? this.fillStyle : this.strokeStyle), text: String(text).slice(0, 40) });
      }
      return orig.call(this, text, x, y, maxW);
    };
  };
  wrapText('fillText');
  wrapText('strokeText');
}

// ghost text (review round 4)
const GHOST_ALPHA = 0.25;
const GHOST_OVERLAP = 0.3;
const GHOST_MAX_S = 0.25;
const GHOST_RULE = `review round 4: no two different text layers overlap (>= ${GHOST_OVERLAP * 100}% of the smaller box) while both are above ${GHOST_ALPHA * 100}% opacity for more than ${GHOST_MAX_S} s`;
const inter = (p, q) => Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)) * Math.max(0, Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y));
const sameM = (p, q) => p.m.every((v, i) => Math.abs(v - q.m[i]) < (i < 4 ? 1e-4 : 0.5));
const poly = (r) => {
  const [a, b, c, d, e, f] = r.m;
  return [[r.lx, r.ly], [r.lx + r.lw, r.ly], [r.lx + r.lw, r.ly + r.lh], [r.lx, r.ly + r.lh]].map(([x, y]) => [a * x + c * y + e, b * x + d * y + f]);
};
const area = (P) => Math.abs(P.reduce((s, p, i) => s + p[0] * P[(i + 1) % P.length][1] - P[(i + 1) % P.length][0] * p[1], 0)) / 2;
/** convex polygon intersection (Sutherland-Hodgman); both polygons wound the same way after orient() */
function clip(subject, clipper) {
  let out = subject;
  const sign = Math.sign(clipper.reduce((s, p, i) => s + p[0] * clipper[(i + 1) % clipper.length][1] - clipper[(i + 1) % clipper.length][0] * p[1], 0)) || 1;
  for (let i = 0; i < clipper.length && out.length; i++) {
    const A = clipper[i];
    const B = clipper[(i + 1) % clipper.length];
    const inside = (p) => sign * ((B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0])) >= 0;
    const cross = (p, q) => {
      const a1 = B[1] - A[1], b1 = A[0] - B[0], c1 = a1 * A[0] + b1 * A[1];
      const a2 = q[1] - p[1], b2 = p[0] - q[0], c2 = a2 * p[0] + b2 * p[1];
      const det = a1 * b2 - a2 * b1 || 1e-12;
      return [(b2 * c1 - b1 * c2) / det, (a1 * c2 - a2 * c1) / det];
    };
    const inp = out;
    out = [];
    for (let k = 0; k < inp.length; k++) {
      const P = inp[k];
      const Q = inp[(k + 1) % inp.length];
      if (inside(Q)) {
        if (!inside(P)) out.push(cross(P, Q));
        out.push(Q);
      } else if (inside(P)) out.push(cross(P, Q));
    }
  }
  return out;
}
const bbox = (P) => {
  const xs = P.map((p) => p[0]);
  const ys = P.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};
/** glyph-by-glyph runs (drawTracked, typewriter reveals) merged into lines: same transform, baseline, font, alpha, adjacent */
function mergeLines(recs) {
  const out = [];
  for (const r of recs) {
    const last = out[out.length - 1];
    const gap = last ? r.lx - (last.lx + last.lw) : Infinity;
    if (last && sameM(last, r) && Math.abs(last.base - r.base) < 1 && last.font === r.font && Math.abs(last.alpha - r.alpha) < 0.02 && gap > -Math.max(3, r.lh * 0.6) && gap < Math.max(6, r.lh * 1.2)) {
      const x2 = Math.max(last.lx + last.lw, r.lx + r.lw);
      const y1 = Math.min(last.ly, r.ly);
      const y2 = Math.max(last.ly + last.lh, r.ly + r.lh);
      last.lx = Math.min(last.lx, r.lx);
      last.lw = x2 - last.lx;
      last.ly = y1;
      last.lh = y2 - y1;
      last.text = (last.text + (gap > r.lh * 0.25 ? ' ' : '') + r.text).slice(0, 60);
      last.i = r.i;
    } else out.push({ ...r });
  }
  return out.map((l) => ({ ...l, P: poly(l) }));
}
/** lines that are on screen (inside the frame), each with its SEEN opacity: its own alpha times (1 - a) for every
 *  solid draw made after it that covers >= 85 % of its box (a crossfading scene laid over it, a card pinned on it) */
function visibleLines(lines, occ, [W, H], comp = [], { perBuffer = false } = {}) {
  const F = [[0, 0], [W, 0], [W, H], [0, H]];
  // follow each draw through the composites of its canvas (first composite after it, hop by hop) to a canvas that is
  // never composited (the frame): its order key (outermost composite first) and its alpha times each composite's
  // the frame is where the last composite lands (a post pass may copy it out and screen a glow back onto it)
  const root = comp.length ? comp[comp.length - 1].dst : null;
  const SHOWS = new Set(['source-over', 'source-atop', 'screen', 'lighter', 'lighten', 'overlay', 'soft-light', 'hard-light']);
  const place = (r) => {
    let cv = r.cv;
    let i = r.i;
    let a = 1;
    let buf = cv;
    let lastG = 1;
    const key = [r.i];
    for (let hop = 0; hop < 8 && root != null && cv !== root; hop++) {
      const c = comp.filter((x) => x.src === cv && x.i > i && x.op !== 'copy').sort((x, y) => x.i - y.i)[0];
      if (!c) return null; // drawn on a scratch that never reaches the frame
      lastG = SHOWS.has(c.op) ? c.g : 0;
      a *= lastG;
      key.unshift(c.i);
      buf = cv;
      cv = c.dst;
      i = c.i;
    }
    // review round 5 (transitions): `buf` is the canvas the record lands in just before the frame (a shot's own
    // transition buffer), `aIn` its opacity inside that buffer (the transition's own composite left out)
    return { key, a, root: cv, buf, aIn: lastG > 0 ? a / lastG : 0 };
  };
  const later = (p, q) => {
    for (let k = 0; k < Math.min(p.length, q.length); k++) if (p[k] !== q[k]) return p[k] > q[k];
    return p.length > q.length;
  };
  const occP = occ.map((o) => ({ ...o, pl: place(o) })).filter((o) => o.pl);
  return lines
    .map((l) => {
      const pl = place(l);
      if (!pl) return null;
      // perBuffer: each shot's text at its opacity INSIDE its own buffer (the transition weights it afterwards)
      const k = perBuffer && pl.buf !== pl.root ? pl.aIn : pl.a;
      return k > 0 ? { ...l, alpha: l.alpha * k, pl } : null;
    })
    .filter(Boolean)
    .map((l) => {
      const on = clip(l.P, F);
      return on.length >= 3 && area(on) >= 0.5 * area(l.P) ? { ...l, P: on } : null;
    })
    .filter(Boolean)
    .map((l) => {
      const b = bbox(l.P);
      const A = b.w * b.h || 1;
      let seen = l.alpha;
      for (const o of occP) {
        if (o.pl.root !== l.pl.root || !later(o.pl.key, l.pl.key) || inter(o, b) < 0.85 * A) continue;
        // perBuffer: only the shot's own draws hide its text (the other shot and the transition are the weights)
        if (perBuffer && (o.pl.buf !== l.pl.buf || o.pl.buf === o.pl.root)) continue;
        seen *= 1 - (o.a ?? 1) * (perBuffer ? o.pl.aIn : o.pl.a);
      }
      return { ...l, alpha: seen };
    });
}
const sameText = (a, b) => {
  const x = a.replace(/\s+/g, ' ').trim();
  const y = b.replace(/\s+/g, ' ').trim();
  return x === y || (x.length >= 3 && y.includes(x)) || (y.length >= 3 && x.includes(y));
};
/** overlapping pairs of different text layers, both above GHOST_ALPHA (lines; textProbe layers vs lines outside them) */
function ghostPairs(lines, probes) {
  const L = lines.filter((l) => l.alpha > GHOST_ALPHA && area(l.P) > 1);
  const Pr = probes.filter((p) => p.alpha > GHOST_ALPHA && p.w * p.h > 0).map((p) => ({ ...p, text: p.id, probe: true, P: [[p.x, p.y], [p.x + p.w, p.y], [p.x + p.w, p.y + p.h], [p.x, p.y + p.h]] }));
  const out = [];
  const consider = (A, B) => {
    if (sameText(A.text, B.text)) return;
    const I = clip(A.P, B.P);
    const i = I.length >= 3 ? area(I) : 0;
    const aA = area(A.P);
    const aB = area(B.P);
    if (i < GHOST_OVERLAP * Math.min(aA, aB)) return;
    // a probe's own text sits inside its rect: a line mostly inside a probe is that probe's text
    if (A.probe && !B.probe && i >= 0.8 * aB) return;
    if (B.probe && !A.probe && i >= 0.8 * aA) return;
    const [a, b] = [A.text, B.text].sort();
    out.push({ key: `${a}|${b}`, a, b, alphaA: A.alpha, alphaB: B.alpha, rect: bbox(I) });
  };
  const all = [...L, ...Pr];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) consider(all[i], all[j]);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// TRANSITION GHOSTS (review round 5: the in-shot audit skips the transition windows, so a crossfade that dissolves
// one shot's card over the next shot's card (ch04-s07 +0.17) passed unseen). For every shot whose transitionIn is
// not a cut, the frames of the transition window are recorded as the reel paints them: each text line is assigned
// to the outgoing (A) or incoming (B) shot by the buffer it lands in, takes its opacity inside that shot (its own
// occluders only), and is then weighted by the transition at u: crossfade (and, conservatively, inkBleed) dissolve
// A by 1 - ease(u) and B by ease(u); fadeBlack, lampChange and iris pass through black, so A and B are never both
// up; paperWipe weights each line by the share of its box on its own side of the travelling tear. The same rule as
// in-shot: two different text lines from the two shots overlapping >= 30 % of the smaller box, both above 25 %, for
// more than 0.25 s FAIL, listed per INCOMING shot (summary shots[id].transGhosts; QA sheets.ghostText).
// ---------------------------------------------------------------------------------------------------------------
const easeT = (u) => {
  const x = u < 0 ? 0 : u > 1 ? 1 : u;
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const TRANS_DEFAULT = { crossfade: 1.2, iris: 2.2, inkBleed: 2, paperWipe: 1.1, fadeBlack: 1.6, lampChange: 3 };
/** the transition's weights for the outgoing and incoming shot at u, for a line box (device px) on a W-wide frame */
function transWeights(kind, u, box, W = 1920, H = 1080) {
  switch (kind) {
    case 'crossfade':
    case 'inkBleed':
      return [1 - easeT(u), easeT(u)];
    case 'fadeBlack':
      return u < 0.5 ? [1 - easeT(Math.min(1, u / 0.45)), 0] : [0, easeT(Math.max(0, (u - 0.55) / 0.45))];
    case 'lampChange':
      return u < 0.5 ? [1 - (1 - (1 - Math.min(1, u / 0.47)) ** 2), 0] : [0, easeT(Math.max(0, (u - 0.53) / 0.47))];
    case 'iris':
      return u < 0.5 ? [1, 0] : [0, 1];
    case 'paperWipe': {
      // stage px (1280 x 720): A stays on the far side (x > X) of the tear travelling right
      const k = 1280 / W;
      const margin = 80 + 90;
      const yc = (box.y + box.h / 2) * k;
      const X = -margin + (1280 + 2 * margin) * easeT(u) + 90 * (yc / 720 - 0.5);
      const x0 = box.x * k, x1 = (box.x + box.w) * k;
      const onA = x1 <= x0 ? (x0 > X ? 1 : 0) : Math.max(0, Math.min(1, (x1 - Math.max(x0, X)) / (x1 - x0)));
      return [onA, 1 - onA];
    }
    default:
      return [1, 0];
  }
}
/** the transition frame's lines, each tagged with its shot ('A', 'B' or 'frame') and its weighted opacity */
function transitionLines(got, kind, u) {
  const vis = visibleLines(mergeLines(got.ghost || []), got.occ || [], got.frame, got.comp || [], { perBuffer: true });
  // A is the buffer the reel paints first: the smallest record index of anything landing in it
  const first = new Map();
  const note = (buf, i) => first.set(buf, Math.min(first.get(buf) ?? Infinity, i));
  for (const l of vis) if (l.pl.buf !== l.pl.root) note(l.pl.buf, l.i);
  const root = (got.comp || []).length ? got.comp[got.comp.length - 1].dst : null;
  // every composite INTO a buffer (a shot's layer scratches) marks when that shot was painting
  const intoRoot = new Set((got.comp || []).filter((c) => c.dst === root).map((c) => c.src));
  for (const c of got.comp || []) if (intoRoot.has(c.dst)) note(c.dst, c.i);
  const order = [...first.entries()].sort((x, y) => x[1] - y[1]).map(([b]) => b);
  const [W, H] = got.frame;
  return vis.map((l) => {
    if (l.pl.buf === l.pl.root) return { ...l, shot: 'frame' };
    const who = order.length >= 2 ? (l.pl.buf === order[0] ? 'A' : 'B') : u < 0.5 ? 'A' : 'B';
    const [wa, wb] = transWeights(kind, u, bbox(l.P), W, H);
    return { ...l, shot: who, alpha: l.alpha * (who === 'A' ? wa : wb) };
  });
}

const iou = (p, q) => {
  const x1 = Math.max(p.x, q.x), y1 = Math.max(p.y, q.y), x2 = Math.min(p.x + p.w, q.x + q.w), y2 = Math.min(p.y + p.h, q.y + q.h);
  const i = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return i / (p.w * p.h + q.w * q.h - i || 1);
};
const inside = (r, pt, pad = 6) => pt[0] >= r.x - pad && pt[0] <= r.x + r.w + pad && pt[1] >= r.y - pad && pt[1] <= r.y + r.h + pad;

async function main() {
  const tl = readJson(P.app.timeline, null) ?? readJson(P.narration.timeline);
  const site = await openSite({ mode: a.build ? 'build' : 'dev', base: a.base });
  const browser = await launchChromium({ gpu: true });
  const summary = readJson(path.join(OUT, 'summary.json'), { shots: {} });
  const prevSummary = JSON.parse(JSON.stringify(summary));
  const ids = [...list(a.shot), ...list(a.shots)];
  try {
    const h = await openHarness(browser, site.base, a.slug, { width: 1920, height: 1080, init: recorder });
    const shots = ids.length ? ids.map((id) => h.info.shots.find((s) => s.id === id)) : h.info.shots;
    mkdirp(OUT);
    for (const shot of shots) {
      if (!shot) continue;
      const fps = h.info.fps;
      const k = tl.shots.findIndex((s) => s.id === shot.id);
      const tlShot = tl.shots[k];
      if (a['trans-only'] && (k <= 0 || (tlShot.transitionIn || 'cut') === 'cut')) continue;
      const dur = shot.end - shot.start;
      const transDur = (s) => (!s || s.transitionIn === 'cut' ? 0 : s.transitionDur ?? 1);
      const lo = Math.max(num(a.from, 0), transDur(tlShot) / 2 + 0.05);
      const hi = Math.min(num(a.to, dur), dur - transDur(tl.shots[k + 1]) / 2 - 0.05);
      const tracks = [];
      const ghostTracks = [];
      let n = 0;
      for (let lt = lo; lt < (a['trans-only'] ? lo : hi); lt += STEP) {
        n++;
        const t = Math.floor((shot.start + lt) * fps + 1e-6) / fps;
        await h.page.evaluate(() => {
          window.__cardRec = [];
          window.__cardPaper = [];
          window.__cardText = [];
          window.__ghostText = [];
          window.__textRec = [];
          window.__ghostOcc = [];
          window.__ghostComp = [];
          window.__ghostSeq = 0;
        });
        await h.seek(t);
        const got = await h.page.evaluate(() => {
          const r = { probes: window.__cardRec, paper: window.__cardPaper, text: window.__cardText, ghost: window.__ghostText, textProbes: window.__textRec, occ: window.__ghostOcc, comp: window.__ghostComp, frame: [window.__film?.width || 1920, window.__film?.height || 1080] };
          window.__cardRec = window.__cardPaper = window.__cardText = window.__ghostText = window.__textRec = window.__ghostOcc = window.__ghostComp = null;
          return r;
        });
        // ghost text (review round 4): overlapping pairs of different text layers, both above GHOST_ALPHA
        const pairs = ghostPairs(visibleLines(mergeLines(got.ghost || []), got.occ || [], got.frame, got.comp || []), got.textProbes || []);
        if (process.env.GHOST_DEBUG && Math.abs(lt - Number(process.env.GHOST_DEBUG)) < STEP / 2) writeJson(path.join(OUT, `${shot.id}.debug.json`), { lt, merged: mergeLines(got.ghost || []).map((l) => ({ text: l.text, alpha: +l.alpha.toFixed(2), i: l.i, box: bbox(l.P) })), visible: visibleLines(mergeLines(got.ghost || []), got.occ || [], got.frame, got.comp || []).map((l) => [l.text, +l.alpha.toFixed(2), bbox(l.P)]), occ: got.occ, comp: got.comp, textCv: (got.ghost || []).map((g) => [g.text, g.cv, g.i]), pairs }, 1);
        for (const g of pairs) {
          let tr = ghostTracks.find((q) => q.lastN === n - 1 && (q.key === g.key || iou(q.rect, g.rect) > 0.2));
          if (!tr) {
            tr = { key: g.key, a: g.a, b: g.b, from: lt, samples: 0, rect: g.rect, minAlpha: 1 };
            ghostTracks.push(tr);
          }
          tr.lastN = n;
          tr.to = lt;
          tr.rect = g.rect;
          tr.samples++;
          tr.minAlpha = Math.min(tr.minAlpha, Math.min(g.alphaA, g.alphaB));
          tr.alphas = [g.alphaA, g.alphaB];
        }
        const cands = [
          ...(got.probes || []).map((p) => ({ ...p, probed: true })),
          ...(got.paper || []).map((p) => ({ ...p, probed: false })),
        ];
        // a probed card also shows up as raw paper: keep the probe
        const kept = cands.filter((c) => c.probed || !cands.some((p) => p.probed && iou(p, c) > 0.3));
        for (const c of kept) {
          const textIn = (got.text || []).filter((x) => x.pts.some((pt) => inside(c, pt)));
          const ink = c.probed ? c.ink : Math.max(0, ...textIn.map((x) => x.alpha));
          let tr = tracks.find((q) => q.lastN === n - 1 && (c.probed ? q.id === c.id : !q.probed && iou(q.rect, c) > 0.3));
          if (!tr) {
            tr = { id: c.id ?? `${c.how}@${Math.round(c.x)},${Math.round(c.y)}`, probed: c.probed, samples: [], rect: c };
            tracks.push(tr);
          }
          tr.lastN = n;
          tr.rect = c;
          tr.samples.push({ t: +lt.toFixed(3), paper: +c.paper.toFixed(2), ink: +ink.toFixed(2), text: textIn.map((x) => x.text).slice(0, 2) });
        }
      }
      const findings = [];
      for (const tr of tracks) {
        let run = null;
        const close = () => {
          if (run && run.b - run.a + STEP > MAX_BLANK) findings.push({ card: tr.id, probed: tr.probed, from: +run.a.toFixed(2), to: +(run.b + STEP).toFixed(2), seconds: +(run.b - run.a + STEP).toFixed(2), rect: { x: Math.round(tr.rect.x), y: Math.round(tr.rect.y), w: Math.round(tr.rect.w), h: Math.round(tr.rect.h) }, inkAfter: tr.samples.find((s) => s.t > run.b)?.ink ?? null });
          run = null;
        };
        let prevT = null;
        for (const s of tr.samples) {
          const blank = s.paper > PAPER && s.ink < INK;
          if (prevT != null && s.t - prevT > STEP * 1.5) close();
          if (blank) run = run ? { ...run, b: s.t } : { a: s.t, b: s.t };
          else close();
          prevT = s.t;
        }
        close();
      }
      const fails = findings.filter((f) => f.probed);
      const suspects = findings.filter((f) => !f.probed);
      // a ghost run spans (to - from + STEP) s; more than GHOST_MAX_S fails
      const ghosts = ghostTracks
        .map((g) => ({ a: g.a, b: g.b, from: +g.from.toFixed(2), to: +(g.to + STEP).toFixed(2), seconds: +(g.to - g.from + STEP).toFixed(2), minAlpha: +g.minAlpha.toFixed(2), rect: { x: Math.round(g.rect.x), y: Math.round(g.rect.y), w: Math.round(g.rect.w), h: Math.round(g.rect.h) } }))
        .filter((g) => g.seconds > GHOST_MAX_S + 1e-6);
      // review round 5: the transition INTO this shot (both shots on screen), cross-shot pairs only
      const transGhosts = [];
      const transCarry = [];
      let transSampled = 0;
      const kind = k > 0 ? tlShot.transitionIn || 'cut' : 'cut';
      if (kind !== 'cut' && !a['no-trans']) {
        const prev = tl.shots[k - 1];
        const tdur = Math.min(tlShot.transitionDur ?? TRANS_DEFAULT[kind] ?? 1, (tlShot.end - tlShot.start) * 0.9, (prev.end - prev.start) * 0.9);
        const tracksT = [];
        const carryT = [];
        let m = 0;
        for (let lt = -tdur / 2 + STEP / 2; lt < tdur / 2; lt += STEP) {
          m++;
          const t = Math.floor((shot.start + lt) * fps + 1e-6) / fps;
          const u = (t - (shot.start - tdur / 2)) / tdur;
          await h.page.evaluate(() => {
            window.__ghostText = [];
            window.__textRec = [];
            window.__ghostOcc = [];
            window.__ghostComp = [];
            window.__ghostSeq = 0;
          });
          await h.seek(t);
          const got = await h.page.evaluate(() => {
            const r = { ghost: window.__ghostText, occ: window.__ghostOcc, comp: window.__ghostComp, frame: [window.__film?.width || 1920, window.__film?.height || 1080] };
            window.__ghostText = window.__textRec = window.__ghostOcc = window.__ghostComp = null;
            return r;
          });
          const lines = transitionLines(got, kind, u);
          const A = lines.filter((l) => l.shot === 'A');
          const B = lines.filter((l) => l.shot === 'B');
          if (process.env.GHOST_DEBUG_T && Math.abs(lt - Number(process.env.GHOST_DEBUG_T)) < STEP / 2) writeJson(path.join(OUT, `${shot.id}.trans-debug.json`), { lt, u, kind, lines: lines.map((l) => [l.shot, l.text, +l.alpha.toFixed(2), bbox(l.P), l.pl.buf]) }, 1);
          // (warn) one shot's readable text dissolving over the other shot's picture: a line above 25 % while the
          // other shot is above 25 % at that box, with no matching line there (ch04-s07 +0.17: ch04-s06's cards at
          // 40-50 % over the winter valley)
          for (const [mine, other, side] of [[A, B, 'out'], [B, A, 'in']]) {
            for (const l of mine) {
              if (l.alpha <= GHOST_ALPHA) continue;
              const [wa, wb] = transWeights(kind, u, bbox(l.P), got.frame[0], got.frame[1]);
              if ((side === 'out' ? wb : wa) <= GHOST_ALPHA || other.some((o) => sameText(o.text, l.text))) continue;
              const key = `${side}|${l.text}`;
              let tr = carryT.find((q) => q.key === key && q.lastN === m - 1);
              if (!tr) carryT.push((tr = { key, side, text: l.text, from: lt, maxAlpha: 0 }));
              tr.lastN = m;
              tr.to = lt;
              tr.maxAlpha = Math.max(tr.maxAlpha, l.alpha);
            }
          }
          const pairs = ghostPairs([...A, ...B], []).filter((p) => A.some((x) => x.text === p.a || x.text === p.b) && B.some((x) => x.text === p.a || x.text === p.b));
          for (const g of pairs) {
            const ta = A.find((x) => x.text === g.a || x.text === g.b)?.text;
            let tr = tracksT.find((q) => q.lastN === m - 1 && (q.key === g.key || iou(q.rect, g.rect) > 0.2));
            if (!tr) {
              tr = { key: g.key, out: ta, in: ta === g.a ? g.b : g.a, from: lt, samples: 0, rect: g.rect, minAlpha: 1 };
              tracksT.push(tr);
            }
            tr.lastN = m;
            tr.to = lt;
            tr.rect = g.rect;
            tr.samples++;
            tr.minAlpha = Math.min(tr.minAlpha, Math.min(g.alphaA, g.alphaB));
          }
        }
        transSampled = m;
        transCarry.push(
          ...carryT
            .map((g) => ({ side: g.side, text: g.text, t0: +g.from.toFixed(2), t1: +(g.to + STEP).toFixed(2), seconds: +(g.to - g.from + STEP).toFixed(2), maxAlpha: +g.maxAlpha.toFixed(2) }))
            .filter((g) => g.seconds > GHOST_MAX_S + 1e-6),
        );
        transGhosts.push(
          ...tracksT
            .map((g) => ({ from: prev.id, out: g.out, in: g.in, kind, t0: +g.from.toFixed(2), t1: +(g.to + STEP).toFixed(2), seconds: +(g.to - g.from + STEP).toFixed(2), minAlpha: +g.minAlpha.toFixed(2), rect: { x: Math.round(g.rect.x), y: Math.round(g.rect.y), w: Math.round(g.rect.w), h: Math.round(g.rect.h) } }))
            .filter((g) => g.seconds > GHOST_MAX_S + 1e-6),
        );
      }
      const doc = { shot: shot.id, at: new Date().toISOString(), step: +STEP.toFixed(4), sampled: n, transition: kind !== 'cut' ? { kind, sampled: transSampled, ghosts: transGhosts, carry: transCarry } : null, rule: `paper > ${PAPER * 100}% with text < ${INK * 100}% for more than ${MAX_BLANK} s`, ghostRule: GHOST_RULE, probedCards: [...new Set(tracks.filter((t) => t.probed).map((t) => t.id))], fails, suspects, ghosts, cards: tracks.filter((t) => t.samples.length > 1).map((t) => ({ id: t.id, probed: t.probed, from: t.samples[0].t, to: t.samples[t.samples.length - 1].t, minInkWhilePaper: Math.min(1, ...t.samples.filter((s) => s.paper > PAPER).map((s) => s.ink)) })) };
      if (a['trans-only']) {
        const prevDoc = readJson(path.join(OUT, `${shot.id}.json`), null);
        writeJson(path.join(OUT, `${shot.id}.json`), prevDoc ? { ...prevDoc, transition: doc.transition, transAt: doc.at } : doc, 1);
      } else writeJson(path.join(OUT, `${shot.id}.json`), doc, 1);
      summary.shots[shot.id] = { fails: fails.map((f) => `${f.card} blank ${f.from}-${f.to} s`), suspects: suspects.map((f) => `${f.card} ${f.from}-${f.to} s`), ghosts: ghosts.map((g) => `'${g.a}' x '${g.b}' ${g.from}-${g.to} s`), ...(kind !== 'cut' && !a['no-trans'] ? { transGhosts: transGhosts.map((g) => `${g.kind} from ${g.from}: '${g.out}' x '${g.in}' ${g.t0}..${g.t1} s (cut-relative)`), transCarry: transCarry.map((g) => `${g.side === 'out' ? 'outgoing' : 'incoming'} '${g.text}' up to ${Math.round(g.maxAlpha * 100)} % over the other shot ${g.t0}..${g.t1} s`) } : {}), probed: doc.probedCards.length, at: doc.at };
      if (a['trans-only'] && prevSummary.shots?.[shot.id]) {
        const prevS = prevSummary.shots[shot.id];
        summary.shots[shot.id] = { ...prevS, transGhosts: summary.shots[shot.id].transGhosts, transCarry: summary.shots[shot.id].transCarry, transAt: doc.at };
      }
      console.log(`  ${shot.id}: ${n} frames, ${doc.probedCards.length} probed card(s); ${fails.length} blank probed card(s)${fails.length ? `: ${fails.map((f) => `${f.card} ${f.from}-${f.to}s`).join(', ')}` : ''}; ${suspects.length} suspect paper${suspects.length ? `: ${suspects.slice(0, 5).map((f) => `${f.card} ${f.from}-${f.to}s`).join(', ')}` : ''}; ${ghosts.length} ghost text${ghosts.length ? `: ${ghosts.map((g) => `'${g.a.slice(0, 24)}' x '${g.b.slice(0, 24)}' ${g.from}-${g.to}s`).join(' | ')}` : ''}${kind !== 'cut' && !a['no-trans'] ? `; transition in (${kind}, ${transSampled} frames): ${transGhosts.length} cross-shot ghost${transGhosts.length ? `: ${transGhosts.map((g) => `'${g.out.slice(0, 24)}' x '${g.in.slice(0, 24)}' ${g.t0}..${g.t1}s`).join(' | ')}` : ''}` : ''}`);
    }
    await h.close();
  } finally {
    await browser.close();
    await site.close();
  }
  summary.at = new Date().toISOString();
  summary.rule = `review round 3: no card shows paper > ${PAPER * 100}% with text < ${INK * 100}% for more than ${MAX_BLANK} s (probed cards fail, unprobed paper warns)`;
  summary.ghostRule = GHOST_RULE;
  writeJson(path.join(OUT, 'summary.json'), summary, 1);
  const bad = Object.entries(summary.shots).filter(([id, s]) => (!ids.length || ids.includes(id)) && s.fails.length);
  const ghosted = Object.entries(summary.shots).filter(([id, s]) => (!ids.length || ids.includes(id)) && (s.ghosts?.length || s.transGhosts?.length));
  console.log(`${bad.length} shot(s) with a blank probed card; ${ghosted.length} shot(s) with ghost text${ghosted.length ? ` (${ghosted.map(([id]) => id).join(', ')})` : ''} → ${rel(path.join(OUT, 'summary.json'))}`);
  if (bad.length || ghosted.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
