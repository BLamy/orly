// ch02-s02 · "No test suite needed. Just a quick chat."
// The pull-back, as the reference pulls from the giant prompt to the small search bar. A real camera move: the shot
// opens on ch02-s01's last frame exactly (the take's input row as a 16 px-blurred ghost at 0.25, masked to its band,
// over the dawn haze), and the camera pulls back from that framing to the floating New project screen while the ghost
// sharpens and turns solid, the band opens to the whole page, the haze recedes to paper and the screen swings through a
// small 3-D tilt that settles flat by 'needed'. The giant typed line rides the same camera down into the input and
// fades as it arrives, so the take's own typed URL takes over. On 'Just' braces snap around the input; on 'chat' a
// red-pink underline lands under the page's own words 'quick chat.' and a slow zoom leans in. A grey caption keeps the
// vendor's nuance (SET-08).
import { Timeline, ease } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, blurText, easeOut, haze, paper, smooth } from '../../../film/promo';
import { MARKS, SLUG } from '../sets/takes';
import {
  GHOST_BLUR,
  GHOST_BOX,
  GHOST_H,
  GHOST_K,
  GHOST_OPACITY,
  TYPED_BASE_Y,
  TYPED_END_X,
  TYPED_SIZE,
  TypedDefs,
  TypedLine,
  URL_TEXT,
  ghostToStage,
} from '../sets/ch02-s01-typed';
import { driftLines } from '../sets/brand';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ------------------------------------------------------------------ the screen (recording px → stage px)
/** eyebrow, heading, sub-copy, input + Start setup, the coding-agent callout; no sidebar (x < 234), no header */
const CROP = { x: 455, y: 66, w: 770, h: 432 };
const BOX = { x: 150, y: 82, w: 980 };
const K = BOX.w / CROP.w;
const PAGE_H = CROP.h * K;
/** zoom centre (recording px) and end scale: keeps the whole input, 'quick chat.' and the callout in the crop */
const ZC = { x: 838, y: 320 };
const ZOOM_END = 1.2;
/** recording-px features */
const INPUT = { x: 528, y: 301, w: 620, h: 62 };
const QUICK_CHAT = { x0: 797, x1: 880, y: 267 };
const URL_END = { x: 748, y: 337 }; // end of the typed URL in the input, on its baseline
const URL_SIZE = 16.5; // the input's font size (recording px)

/** settled layout (camera at rest): a recording-px point on stage, under the screen's own zoom */
function toStage(rx: number, ry: number, zs: number) {
  return {
    x: BOX.x + ((rx - ZC.x) * zs + ZC.x - CROP.x) * K,
    y: BOX.y + ((ry - ZC.y) * zs + ZC.y - CROP.y) * K,
  };
}

// ------------------------------------------------------------------ the camera (pull-back from s01's ghost framing)
/** pull-back length (s); cubic ease-out: most of the move in the first third, a long settle */
const PULL = 0.8;
/** the camera's scale at the cut: s01's ghost magnification over the settled screen's */
const S0 = GHOST_K / K;
const URL_GHOST = ghostToStage(URL_END.x, URL_END.y);
const URL_FLAT = toStage(URL_END.x, URL_END.y, 1);
/**
 * camera(t): a stage-space transform `p → (tx, ty) + S·p` applied to the settled screen. At t = 0 it reproduces s01's
 * ghost framing exactly (same recording-px → stage-px map); it ends at identity. Scale moves geometrically, the URL's
 * end point linearly, so the pull reads as one steady move toward the input.
 */
function camera(t: number) {
  const u = easeOut(t / PULL);
  const S = Math.pow(S0, 1 - u);
  const px = lerp(URL_GHOST.x, URL_FLAT.x, u);
  const py = lerp(URL_GHOST.y, URL_FLAT.y, u);
  return { u, S, tx: px - S * URL_FLAT.x, ty: py - S * URL_FLAT.y };
}

const CAPTION = 'Complements an existing test suite.';

export default defineShot({
  id: 'ch02-s02',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const settleAt = T.beat('settle'); // 'needed'
    const bracesAt = T.beat('url'); // 'Just' − 0.1
    const chatBeat = T.beat('chat'); // 'chat' − 0.15
    const chatWord = T.word('L0202', 'chat');
    // tape: the take's own typed URL sits in the input; the cursor drifts to Start setup at real speed and arrives at
    // hover-start on 'chat', then holds (it never clicks)
    const NP = MARKS['new-project'];
    const tape = tl.channel('tape', NP.typed);
    const moveDur = (NP.hoverStart - NP.typed) / 1000;
    tl.tween(tape, NP.hoverStart, { at: chatWord - moveDur, dur: moveDur, ease: ease.linear });
    // slow zoom from 'chat'
    const zoom = tl.channel('zoom', 1);
    tl.tween(zoom, ZOOM_END, { at: chatBeat, dur: T.duration - chatBeat, ease: ease.move });
    tl.hold(0, T.duration);
    return { tl, tape, zoom, settleAt, bracesAt, chatBeat };
  },
  paint(f) {
    const t = f.t;
    const c = f.c;
    paper(c);
    // ch02-s01's dawn haze (same clock, same drift) recedes to paper during the pull-back
    const out = smooth(t / 0.6);
    if (out < 1) {
      haze(c, { t: t + 10.4167, preset: 'dawn', u: 0.86 * (1 - out) });
      c.save();
      c.globalAlpha = 1 - out;
      driftLines(c, t + 10.4167, { n: 5, alpha: 0.5, seed: 2 });
      c.restore();
    }
    // the caption under the screen (the vendor's own nuance; it does not repeat the line)
    const cu = clamp((t - 0.05) / 0.6);
    blurText(c, CAPTION, 640, BOX.y + PAGE_H + 44, { size: 20, weight: 400, u: cu, color: '#6f6a77', align: 'center', rise: 6 });
  },
  dom(s, scene) {
    const t = s.t;
    const cam = camera(t);
    // the ghost resolves: blur 16 → 0, opacity 0.25 → 1, and the band mask (s01's crop) opens to the full stage
    const blur = GHOST_BLUR * (1 - smooth(t / 0.45));
    const op = lerp(GHOST_OPACITY, 1, smooth(t / 0.4));
    const m = easeOut(t / 0.42);
    const y0 = lerp(GHOST_BOX.y, -320, m);
    const y1 = lerp(GHOST_BOX.y + GHOST_H, 1040, m);
    const mask = m < 1 ? `linear-gradient(to bottom, transparent ${(y0 - 28).toFixed(1)}px, #000 ${(y0 + 4).toFixed(1)}px, #000 ${(y1 - 4).toFixed(1)}px, transparent ${(y1 + 28).toFixed(1)}px)` : undefined;
    // a small 3-D swing as the screen comes off the camera (after the typed line has handed over), flat by 'needed'
    const sw = smooth((t - 0.2) / 0.45) * (1 - smooth((t - 0.6) / (scene.settleAt - 0.6)));
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: op,
          filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '0 0',
            transform: `translate(${cam.tx.toFixed(2)}px, ${cam.ty.toFixed(2)}px) scale(${cam.S.toFixed(5)})`,
          }}
        >
          <RrwebScreen
            slug={SLUG}
            take="new-project"
            at={s.get(scene.tape)}
            crop={CROP}
            box={BOX}
            chrome="browser"
            url=""
            radius={14}
            tilt={{ x: 9 * sw, y: -7 * sw }}
            zoom={{ x: ZC.x, y: ZC.y, scale: s.get(scene.zoom) }}
            cursor={t > 0.3}
          />
        </div>
      </div>
    );
  },
  overlay(s, scene) {
    const t = s.t;
    const zs = s.get(scene.zoom);
    // (1) the pull-back: ch02-s01's line, same size and place, rides the camera down into the input's URL and fades
    // as it arrives (the take's own URL, sharp by then, takes over)
    const cam = camera(t);
    const pu = easeOut(t / 0.46);
    const lineOp = 1 - smooth((t - 0.2) / 0.24);
    const end = { x: cam.tx + cam.S * URL_FLAT.x, y: cam.ty + cam.S * URL_FLAT.y };
    const k = lerp(1, (URL_SIZE * K * cam.S) / TYPED_SIZE, pu);
    const ax = TYPED_END_X - TYPED_SIZE * 0.08 - Math.max(2, TYPED_SIZE * 0.045); // the text's end point in s01
    const tx = lerp(ax, end.x, pu);
    const ty = lerp(TYPED_BASE_Y, end.y, pu);
    const transform = `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)}) translate(${-ax.toFixed(2)} ${-TYPED_BASE_Y})`;

    // (2) braces snap around the input on 'Just' (camera and tilt long settled)
    const bu = clamp((t - scene.bracesAt) / 0.22);
    const be = easeOut(bu);
    const tl = toStage(INPUT.x, INPUT.y, zs);
    const br = toStage(INPUT.x + INPUT.w, INPUT.y + INPUT.h, zs);
    const cy = (tl.y + br.y) / 2;
    const bh = br.y - tl.y;
    const bSize = bh * 1.32;
    const pad = 12 + (1 - be) * -34;
    // (3) the underline under the page's own 'quick chat.'
    const uu = easeOut((t - scene.chatBeat) / 0.38);
    const q0 = toStage(QUICK_CHAT.x0 - 2, QUICK_CHAT.y, zs);
    const q1 = toStage(QUICK_CHAT.x1 + 2, QUICK_CHAT.y, zs);
    const qx1 = lerp(q0.x, q1.x, uu);
    const steps = 14;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const x = lerp(q0.x, qx1, i / steps);
      const y = q0.y + 2 + Math.sin(i * 0.9) * 0.7 - (i / steps) * 1.1;
      d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    const braceStyle = { font: `300 ${bSize.toFixed(1)}px "Promo Sans", "Inter", system-ui, sans-serif` };
    return (
      <g>
        <TypedDefs />
        {lineOp > 0 && <TypedLine n={URL_TEXT.length} caret={1 - smooth(t / 0.15)} transform={transform} opacity={lineOp} shadow={1 - pu} />}
        {bu > 0 && (
          <g opacity={be} style={bu < 1 ? { filter: `blur(${((1 - be) * 4).toFixed(2)}px)` } : undefined}>
            <text x={tl.x - pad} y={cy + bSize * 0.34} textAnchor="end" fill={PROMO.ink} style={braceStyle}>
              {'{'}
            </text>
            <text x={br.x + pad} y={cy + bSize * 0.34} textAnchor="start" fill={PROMO.ink} style={braceStyle}>
              {'}'}
            </text>
          </g>
        )}
        {uu > 0 && <path d={d} fill="none" stroke={PROMO.brand} strokeWidth={3} strokeLinecap="round" />}
      </g>
    );
  },
});
