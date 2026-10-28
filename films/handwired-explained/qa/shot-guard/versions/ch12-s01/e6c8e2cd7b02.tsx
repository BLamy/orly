/**
 * ch12-s01 — THE VALLEY AT DAWN (scene, dawnGold; crossfade in from ch11-s05; 6.96 s).
 *   L1201 "Every belief in the film hangs over the time it held."
 *
 * Open on the Still open drawer of ch11-s05, still open (it never closes), now the nearest plane (L5, soft): the
 * window bay round it, the valley through the glass. The camera rises and pushes out through the bay (the sill and
 * the mullions slide away below and to the sides, the drawer racks out of focus) onto MISTY HILLS AT DAWN: paper ridges
 * receding in dawnGold haze, the Window Calendar dark-new on the far ridge (nothing has lit since 16 October), and
 * across the valley the copper line from post to post with every tag in the state the film left it, each thread
 * dropping to the Lifespan Rule hung front-on below (sets/ch12-s01-valley: one world for ch12-s01..s04).
 *
 * TEACHES, word by word:
 *   rise (0.40)   the camera starts up and out of the bay window
 *   date (1.60)   the date stamp types in, lower left
 *   line (2.05)   'belief': the line of tags resolves out of the haze, framed close on the first tags (about 110 px
 *                 each); the lateral drift begins, left to right
 *   ruler (4.76)  'held': the drift reaches the rule's long end and eases out to the WIDE, where the tags read as
 *                 STATES (split, struck, riveted, frayed, slack) and the open tips of the still-held threads glow,
 *                 their copper arrows pointing right; nothing but tag 1's engineering strand reaches 'a lifetime'
 */
import { Timeline } from '../../../core';
import type { Camera3 } from '../../../film';
import { PUPPET_NEAR_BLACK, defineShot, mixLab, placeStamp, withAlpha } from '../../../film';
import { ledgerCabinet, paperCol } from '../sets/ch11-s05-ledger';
import {
  SLOT12,
  STRANDS,
  bisonLoop,
  camK,
  drawLine12,
  drawRule12,
  lifeX12,
  lineY12,
  nanoUnder,
  pencilBeside,
  slackLoop,
  spline,
  states12,
  tag12,
  tagH,
  thread12,
  tip12,
  twos,
  valleyBack,
  valleyNear,
  win,
  type Key,
  type Pt,
} from '../sets/ch12-s01-valley';
import type { TagId, TagState } from '../sets/tagLine';
import { TAGS } from '../sets/tagLine';
import timeline from '../timeline.json';

const ID = 'ch12-s01';
const SHOT = (timeline as { shots: { id: string; start: number; end: number }[] }).shots.find((s) => s.id === ID)!;
const D = SHOT.end - SHOT.start;

// ---------------------------------------------------------------- the camera (pure function of t)
// up and out through the bay (dolly in), framed close on tags 1-4, a drift right, then the pull back to the wide
const KX: Key[] = [[0, 640], [0.4, 640], [2.3, 290], [3.4, 470], [4.85, 650], [D, 664]];
const KY: Key[] = [[0, 700], [0.4, 700], [2.3, 556], [3.4, 590], [4.85, 690], [D, 692]];
const KK: Key[] = [[0, 1], [0.4, 1], [2.3, 1.82], [3.4, 1.5], [4.85, 0.665], [D, 0.64]];
const KZ: Key[] = [[0, 0], [0.4, 0], [2.3, 380], [3.4, 320], [4.85, -270], [D, -300]];
function camAt(t: number): Camera3 {
  return camK(spline(KX, t), spline(KY, t), spline(KK, t), spline(KZ, t));
}
const CAMS: Camera3[] = Array.from({ length: 48 }, (_, i) => camAt((i / 47) * D));
/** the bay and the drawer are drawn until the camera has passed out through the window (then they are behind it) */
const BAY_OFF = 2.3;

// ---------------------------------------------------------------- the bay (L5): placed so the drawer sits where ch11-s05 left it
// Layers are authored in rest-screen px; at t = 0 the camera is (640, 700, z 0), so an L5 point p lands at
// (p.x, p.y - 340 * 1.538). ch11-s05 ends with the cabinet on screen at x 419..1019, y 93..772 (k 1.58 about its
// camera (720, 451)), so the cabinet art is drawn at scale 1.58 about (640, 883).
const BAY = { s: 1.58, ox: 640, oy: 883, cx: 720, cy: 451 } as const;
// the opening is wide and tall enough that at BAY_OFF the camera is wholly inside it (L5 visible x -134..337,
// y 529..794 at the end of the rise), so the bay leaves frame before it stops being drawn
const BAY_HOLE = { x0: -300, x1: 1500, top: 300, sill: 1108 } as const;
const MULLIONS = [380, 1060];

const STATES = states12();

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return {
      tl,
      rise: T.beat('rise'),
      date: T.beat('date'),
      line: T.beat('line'),
      ruler: T.beat('ruler'),
    };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(t);
    f.camera(cam);
    const dawn = 0.6 + 0.4 * win(t, 0, D);
    const line = sc.line as number;
    const ruler = sc.ruler as number;

    valleyBack(f, { key: ID, cams: CAMS, sunX: 700, dawn });

    // ---- L4: the copper line, the Lifespan Rule, every tag and its thread
    // the line resolves out of the haze on 'belief'; the held tips brighten as the drift reaches the rule ('held')
    const resolve = win(t, line - 0.5, line + 0.7);
    const tipGlow = 0.55 + 0.45 * win(t, ruler - 0.3, ruler + 0.8);
    f.layer('L4', (c, env) => {
      drawLine12(c, env, 0.45 + 0.3 * dawn);
      drawRule12(c, env, 1);
      const eyes = new Map<TagId, Pt>();
      for (const st of STATES) {
        if (st.id === 'nano') continue;
        const x = SLOT12[st.id];
        const knot = { x, y: lineY12(x) };
        eyes.set(st.id, { x, y: knot.y + 24 * (st.scale ?? 1) });
      }
      // threads behind the tags; tips on the rule
      for (const s of STRANDS) {
        const eye = eyes.get(s.id);
        if (!eye) continue;
        const from = { x: eye.x + s.dx, y: eye.y + tagH(s.id) };
        thread12(c, env, from, lifeX12(s.days), s.lane, 1, 1);
        tip12(c, env, lifeX12(s.days), s.lane, s.tip, { glow: tipGlow, s: 1.35 });
      }
      for (const st of STATES) {
        if (st.id === 'nano') continue;
        const eye = eyes.get(st.id)!;
        const knot = { x: eye.x, y: lineY12(eye.x) };
        const bottom = { x: eye.x, y: eye.y + tagH(st.id) };
        if (TAGS[st.id].slack) slackLoop(c, env, bottom, st.scale ?? 1);
        if (st.id === '11') bisonLoop(c, env, { x: eye.x + 2, y: bottom.y }, tq);
        tag12(c, env, st as TagState, eye, knot, tq);
        if (st.id === '10') {
          const nano = STATES.find((s) => s.id === 'nano');
          if (nano) nanoUnder(c, env, nano, eye, tq);
        }
        if (st.pencilRest) pencilBeside(c, env, eye, st.id);
      }
      // the haze the line resolves out of (thinning on 'belief')
      if (resolve < 1) {
        c.fillStyle = withAlpha(env.mood.haze, 0.62 * (1 - resolve));
        c.fillRect(-900, 200, 3200, 900);
      }
    });
    f.rim({ x: 0, y: -1 });

    // ---- L5: the window bay and the Still open drawer (until the camera has passed through), then near grass
    if (t < BAY_OFF) {
      f.layer('L5', (c, env) => {
        // the bay: a dark wall with one wide opening (two mullions, a low sill), the valley through it
        c.fillStyle = PUPPET_NEAR_BLACK;
        c.beginPath();
        c.rect(-1400, -1400, 4000, 4000);
        c.rect(BAY_HOLE.x0, BAY_HOLE.top, BAY_HOLE.x1 - BAY_HOLE.x0, BAY_HOLE.sill - BAY_HOLE.top);
        c.fill('evenodd');
        for (const mx of MULLIONS) c.fillRect(mx - 15, BAY_HOLE.top, 30, BAY_HOLE.sill - BAY_HOLE.top);
        // the sill catches the dawn
        c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(BAY_HOLE.x0, BAY_HOLE.sill);
        c.lineTo(BAY_HOLE.x1, BAY_HOLE.sill);
        c.stroke();
        // the ledger cabinet with its Still open drawer, still open
        c.save();
        c.translate(BAY.ox, BAY.oy);
        c.scale(BAY.s, BAY.s);
        c.translate(-BAY.cx, -BAY.cy);
        ledgerCabinet(f, c, env, {
          key: ID,
          open: 1,
          labelSize: 17,
          lit: 1,
          light: 1,
          cover: [0, 0.6, 0, 0],
          inside: (cc, fr) => {
            // the pinned slip and the lab's card stand in the open drawer (blank at this distance: the near plane is soft)
            for (const [x0, w, h] of [[fr.x + 14, 188, 150], [fr.x + fr.w - 14 - 150, 150, 120]] as const) {
              const y0 = fr.y - h + 30;
              cc.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
              cc.fillRect(x0 + 2, y0 + 3, w, h);
              cc.fillStyle = paperCol(env, 0.6);
              cc.fillRect(x0, y0, w, h);
            }
          },
        });
        c.restore();
      });
    } else {
      valleyNear(f, ID, win(t, BAY_OFF + 1.2, ruler));
    }

    // ---- the date stamp, lower left (no other text)
    placeStamp(f.c, { place: 'Dawn', date: '27 October 2026', style: 'mono', x: 52, y: 610, at: sc.date as number, dur: D - 0.5 - (sc.date as number), fade: 0.45 }, { t, mood: f.mood, seed: 1201 });
  },
});
