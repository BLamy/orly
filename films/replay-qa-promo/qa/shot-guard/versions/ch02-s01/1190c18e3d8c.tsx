// ch02-s01 · "Point it at your app."
// The reference's giant typed prompt ('neo goth|'), re-made with the URL the new-project take really typed.
// Three planes, back to front: canvas (dawn haze + drifting hairlines) · DOM (a huge blurred ghost of the take's real
// input row, its own text growing in step with ours) · SVG overlay (the typed line + caret, right-aligned so it slides
// left as it grows). The whip from ch01-s03 straddles shot-local −0.5 … +0.5; the caret lands on its landing.
import { Timeline, ease } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { RrwebScreen, haze, paper, smooth } from '../../../film/promo';
import { driftLines } from '../sets/brand';
import { MARKS, SLUG } from '../sets/takes';
import { TypedDefs, TypedLine, URL_TEXT } from '../sets/ch02-s01-typed';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** the ghost: the take's input row ({528..1148, 301..363} in recording px), overfilling the stage */
const GHOST_CROP = { x: 500, y: 290, w: 680, h: 80 };
const GHOST_W = 1500;
const GHOST_H = (GHOST_CROP.h * GHOST_W) / GHOST_CROP.w;
const GHOST_BOX = { x: (1280 - GHOST_W) / 2, y: 360 - GHOST_H / 2 - 6, w: GHOST_W };

export default defineShot({
  id: 'ch02-s01',
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const caretAt = T.beat('caret'); // 0.45: the whip has landed
    const keysAt = T.word('L0201', 'Point'); // first key on 'Point'
    const appEnd = T.wordEnd('L0201', 'app');
    // typing: 'https://' as one quick burst, 'staging.your-app' lands through 'app', '.dev' completes before the
    // 'typed' beat (then ≥ 1.2 s of hold to read the whole address)
    const doneAt = Math.min(T.beat('typed') - 0.1, appEnd + 0.22);
    const appAt = appEnd - 0.06;
    const chars = tl.channel('chars', 0);
    tl.tween(chars, 8, { at: keysAt, dur: 0.2, ease: ease.linear });
    tl.tween(chars, 24, { at: keysAt + 0.2, dur: appAt - keysAt - 0.2, ease: ease.linear });
    tl.tween(chars, URL_TEXT.length, { at: appAt, dur: doneAt - appAt, ease: ease.linear });
    // the ghost's own tape: the take's typing (typing → typed) over the same span, held after
    const tape = tl.channel('tape', MARKS['new-project'].typing);
    tl.tween(tape, MARKS['new-project'].typed, { at: keysAt, dur: doneAt - keysAt, ease: ease.linear });
    tl.hold(0, T.duration);
    return { tl, chars, tape, caretAt, keysAt, doneAt };
  },
  paint(f) {
    const c = f.c;
    const t = f.t;
    paper(c);
    haze(c, { t: t + 7.5, preset: 'dawn', u: 0.62 });
    driftLines(c, t + 7.5, { n: 5, alpha: 0.5, seed: 2 });
  },
  dom(s, scene) {
    // never on screen during the whip: ramps 0 → 0.25 over 0.3 s after it lands
    const u = smooth((s.t - 0.5) / 0.3);
    if (u <= 0) return null;
    return (
      <RrwebScreen
        slug={SLUG}
        take="new-project"
        at={s.get(scene.tape)}
        crop={GHOST_CROP}
        box={GHOST_BOX}
        chrome="none"
        shadow={false}
        radius={0}
        opacity={0.25 * u}
        style={{ filter: 'blur(16px)', background: 'transparent' }}
      />
    );
  },
  overlay(s, scene) {
    const t = s.t;
    const n = Math.floor(s.get(scene.chars) + 1e-6);
    // caret: arrives with the whip's landing (quick fade + settle), solid while typing, blinks (0.53 s) when idle
    const arrive = clamp((t - scene.caretAt + 0.05) / 0.12);
    if (arrive <= 0) return null;
    const typing = t >= scene.keysAt && t < scene.doneAt + 0.05;
    const idleFrom = t < scene.keysAt ? scene.caretAt : scene.doneAt + 0.05;
    const blink = typing || t < scene.keysAt || Math.floor((t - idleFrom) / 0.53) % 2 === 0 ? 1 : 0;
    return (
      <g>
        <TypedDefs />
        <TypedLine n={n} caret={arrive * blink} caretScale={1 + 0.25 * (1 - smooth(arrive))} />
      </g>
    );
  },
});
