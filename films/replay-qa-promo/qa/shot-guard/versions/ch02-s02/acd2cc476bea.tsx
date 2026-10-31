// ch02-s02 · "No test suite needed. Just a quick chat."
// The pull-back, as the reference pulls from the giant prompt to the small search bar: ch02-s01's typed line (same
// size, same place) shrinks into the real input of the New project page while the dawn haze recedes to paper and the
// floating screen settles flat. On 'Just' braces snap around the input; on 'chat' a red-pink underline lands under the
// page's own words 'quick chat.' and a slow zoom leans in. A grey caption keeps the vendor's nuance (SET-08).
import { Timeline, ease } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, blurText, easeInOut, easeOut, haze, paper, smooth } from '../../../film/promo';
import { MARKS, SLUG } from '../sets/takes';
import { TYPED_BASE_Y, TYPED_END_X, TYPED_SIZE, TypedDefs, TypedLine, URL_TEXT } from '../sets/ch02-s01-typed';
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

function toStage(rx: number, ry: number, zs: number) {
  return {
    x: BOX.x + ((rx - ZC.x) * zs + ZC.x - CROP.x) * K,
    y: BOX.y + ((ry - ZC.y) * zs + ZC.y - CROP.y) * K,
  };
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
    // the screen tilts in and settles flat by 'needed'
    const tiltX = tl.channel('tiltX', 14);
    const tiltY = tl.channel('tiltY', -10);
    tl.tween(tiltX, 0, { at: 0, dur: settleAt, ease: ease.enter });
    tl.tween(tiltY, 0, { at: 0, dur: settleAt, ease: ease.enter });
    // slow zoom from 'chat'
    const zoom = tl.channel('zoom', 1);
    tl.tween(zoom, ZOOM_END, { at: chatBeat, dur: T.duration - chatBeat, ease: ease.move });
    tl.hold(0, T.duration);
    return { tl, tape, tiltX, tiltY, zoom, settleAt, bracesAt, chatBeat };
  },
  paint(f) {
    const c = f.t;
    const ctx = f.c;
    paper(ctx);
    // ch02-s01's dawn haze recedes to paper as the line shrinks (the cut carries the colour across)
    const out = smooth(c / 0.55);
    if (out < 1) {
      haze(ctx, { t: c + 10.4167, preset: 'dawn', u: 0.86 * (1 - out) });
      ctx.save();
      ctx.globalAlpha = 1 - out;
      driftLines(ctx, c + 10.4167, { n: 5, alpha: 0.5, seed: 2 });
      ctx.restore();
    }
    // the caption under the screen (the vendor's own nuance; it does not repeat the line)
    const cu = clamp((c - 0.05) / 0.5);
    blurText(ctx, CAPTION, 640, BOX.y + PAGE_H + 44, { size: 20, weight: 400, u: cu, color: '#6f6a77', align: 'center', rise: 6 });
  },
  dom(s, scene) {
    const t = s.t;
    const e = easeOut(t / 0.7);
    const scale = lerp(1.1, 1, e);
    const op = smooth(t / 0.3);
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: `${BOX.x + BOX.w / 2}px ${BOX.y + PAGE_H / 2}px`,
          transform: `translateY(${(1 - e) * 24}px) scale(${scale})`,
          opacity: op,
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
          tilt={{ x: s.get(scene.tiltX), y: s.get(scene.tiltY) }}
          zoom={{ x: ZC.x, y: ZC.y, scale: s.get(scene.zoom) }}
          cursor
        />
      </div>
    );
  },
  overlay(s, scene) {
    const t = s.t;
    const zs = s.get(scene.zoom);
    // (1) the pull-back: ch02-s01's line, same size and place, shrinks toward the input's URL and fades as it arrives
    const pu = easeInOut(t / 0.5);
    const lineOp = 1 - smooth((t - 0.28) / 0.22);
    // the input's URL where the screen is NOW (its wrapper's lift and scale, as dom() applies them; the tilt is small by then)
    const flat = toStage(URL_END.x, URL_END.y, 1);
    const we = easeOut(t / 0.7);
    const ws = lerp(1.1, 1, we);
    const ox = BOX.x + BOX.w / 2, oy = BOX.y + PAGE_H / 2;
    const end = { x: ox + (flat.x - ox) * ws, y: oy + (flat.y - oy) * ws + (1 - we) * 24 };
    const k = lerp(1, (URL_SIZE * K) / TYPED_SIZE, pu);
    const ax = TYPED_END_X - TYPED_SIZE * 0.08 - Math.max(2, TYPED_SIZE * 0.045); // the text's end point in s01
    const tx = lerp(ax, end.x, pu);
    const ty = lerp(TYPED_BASE_Y, end.y, pu);
    const transform = `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)}) translate(${-ax.toFixed(2)} ${-TYPED_BASE_Y})`;

    // (2) braces snap around the input on 'Just' (tilt long settled)
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
