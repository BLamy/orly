// The Event (NIPs series №1), chapter 4 — the filter.
// The REQ filter object as a physical sieve: candidate events fall through
// one gate per filter condition. Grounded in NIP-01: attributes ids, authors,
// kinds, #<letter>, since, until, limit; OR within an array, AND between
// conditions, OR between multiple filters; results newest-first.
// The pass/fail of every event below is computed from the data, not staged.
import {
  CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline,
  cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { JsonDoc, layoutJson } from '../../primitives';
import overrides from './chapter-4.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The filter and the candidates (module scope; matching computed for real).
// ---------------------------------------------------------------------------
const FILTER = {
  kinds: [1],
  authors: ['8e0d…', 'b2f1…'],
  '#t': ['nostr'],
  since: 1700000000,
  limit: 3,
};

const LAYOUT = layoutJson(FILTER, { x: 90, y: 170, fontSize: 16 });

interface Cand {
  kind: number;
  author: string;
  t: string | null;
  at: number;
}
const CANDS: Cand[] = [
  { kind: 1, author: '8e0d…', t: 'nostr', at: 1700000500 },
  { kind: 7, author: '8e0d…', t: 'nostr', at: 1700000400 }, // fails kinds
  { kind: 1, author: '77aa…', t: 'nostr', at: 1700000300 }, // fails authors
  { kind: 1, author: 'b2f1…', t: null, at: 1700000600 },    // fails #t
  { kind: 1, author: 'b2f1…', t: 'nostr', at: 1699999000 }, // fails since
  { kind: 1, author: '8e0d…', t: 'nostr', at: 1700000900 },
  { kind: 1, author: 'b2f1…', t: 'nostr', at: 1700000700 },
];

const GATES: Array<{ label: string; path: string; pass(c: Cand): boolean }> = [
  { label: 'kinds', path: 'kinds', pass: (c) => FILTER.kinds.includes(c.kind) },
  { label: 'authors', path: 'authors', pass: (c) => FILTER.authors.includes(c.author) },
  { label: '#t', path: '#t', pass: (c) => c.t !== null && FILTER['#t'].includes(c.t) },
  { label: 'since', path: 'since', pass: (c) => c.at >= FILTER.since },
];

// which gate each candidate dies at (GATES.length = survived)
const FAIL_AT = CANDS.map((c) => {
  for (let g = 0; g < GATES.length; g++) if (!GATES[g].pass(c)) return g;
  return GATES.length;
});
const SURVIVORS = CANDS.map((_, i) => i).filter((i) => FAIL_AT[i] === GATES.length);
// newest-first ordering of survivors (NIP-01: created_at descending), limit 3
const ORDERED = [...SURVIVORS].sort((a, b) => CANDS[b].at - CANDS[a].at).slice(0, FILTER.limit);

// gate geometry: a vertical gauntlet the events fall through
const GATE_X = 640;
const GATE_Y0 = 150;
const GATE_DY = 105;
const gateY = (g: number) => GATE_Y0 + g * GATE_DY;
const TRAY = { x: 980, y: 430 };

const CAM_GATES: CameraState = { x: 660, y: 340, k: 1.1 };

const cardLabel = (c: Cand) =>
  `k${c.kind} · ${c.author} · ${c.t ? '#' + c.t : 'no tag'}`;

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  gatesU: ChannelRef<number>;
  dropU: ChannelRef<number>;
  focusG: ChannelRef<number>;
  orderU: ChannelRef<number>;
  multiU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const gatesU = tl.channel('gatesU', 0);
  const dropU = tl.channel('dropU', 0);
  const focusG = tl.channel('focusG', -1);
  const orderU = tl.channel('orderU', 0);
  const multiU = tl.channel('multiU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the filter is a tiny query language.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Inside every request rides a filter — the entire query language of nostr. Five kinds of condition: ids, authors, kinds, single-letter tags, and a time window. This one asks four questions.',
  });
  tl.tween(jsonU, 1, { at: 0.7, dur: 2.0, ease: ease.draw });
  tl.hold(6.3, 0.7);

  // Beat 2 — conditions become gates.
  tl.caption({
    at: 7.0,
    dur: 5.6,
    text: 'Read it as a machine: each condition is a gate, and an event must pass every single gate to survive.',
  });
  tl.tween(cam, CAM_GATES, { at: 7.3, dur: 1.4, ease: ease.move });
  tl.tween(gatesU, 1, { at: 7.8, dur: 2.2, ease: ease.enter });
  tl.hold(12.6, 0.7);

  // Beat 3 — within a gate, OR.
  tl.caption({
    at: 13.3,
    dur: 5.6,
    text: 'Within one gate, the list means any of these: authors names two pubkeys, and matching either one is enough. Arrays widen a gate; extra conditions add gates.',
  });
  tl.tween(focusG, 1, { at: 13.7, dur: 0.4, ease: ease.enter });
  tl.tween(focusG, -1, { at: 18.0, dur: 0.4, ease: ease.move });
  tl.hold(18.9, 0.7);

  // Beat 4 — run the candidates.
  tl.caption({
    at: 19.6,
    dur: 6.4,
    text: 'Now pour seven candidate events through. A reaction dies at kinds. A stranger dies at authors. An untagged note dies at the hashtag gate. An old note dies at since.',
  });
  tl.tween(dropU, 1, { at: 20.0, dur: 6.8, ease: ease.linear });
  tl.caption({
    at: 26.6,
    dur: 4.6,
    text: 'Three make it through every gate. Notice nothing about this needed the relay to be clever — the filter is just set membership and a clock.',
  });
  tl.hold(31.2, 0.7);

  // Beat 5 — newest first, limit.
  tl.caption({
    at: 31.9,
    dur: 5.8,
    text: 'The survivors come back newest first, and limit caps only this initial batch — the subscription itself stays open for anything new.',
  });
  tl.tween(orderU, 1, { at: 32.5, dur: 2.0, ease: ease.move });
  tl.hold(37.7, 0.7);

  // Beat 6 — multiple filters.
  tl.caption({
    at: 38.4,
    dur: 5.6,
    text: 'And one request can carry several filters at once. Between whole filters, any one matching is enough — parallel sieves pouring into the same subscription.',
  });
  tl.tween(multiU, 1, { at: 39.0, dur: 1.4, ease: ease.enter });
  tl.hold(44.0, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 44.7,
    dur: 5.8,
    text: 'Every condition must hold. Any entry in a list will do. Any one filter is enough. That asymmetry is the whole art of asking a relay exactly what you want — and nothing more.',
  });
  tl.tween(dimU, 1, { at: 45.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 46.1, dur: 1.0, ease: ease.enter });
  tl.hold(50.5, 1.2);

  return { tl, cam, jsonU, gatesU, dropU, focusG, orderU, multiU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-the-event/chapter-4.overrides.json',
  slug: 'books/nips-the-event/chapter-4',
};

// A candidate's journey: enters above gate 0, falls gate to gate; if it dies
// at gate g it kicks sideways and fades; survivors land in the tray.
function candPos(i: number, u: number) {
  const failG = FAIL_AT[i];
  const survives = failG === GATES.length;
  const depth = survives ? GATES.length : failG + 0.45;
  const yTop = GATE_Y0 - 60;
  const travel = clamp01(u);
  const yNow = yTop + travel * (gateY(Math.min(depth, GATES.length - 1) as number) + (survives ? GATE_DY : 0) - yTop);
  if (!survives) {
    const over = clamp01((travel - 0.82) / 0.18);
    return { x: GATE_X + over * 150, y: yNow, dead: over, landed: 0 };
  }
  const rank = ORDERED.indexOf(i);
  const landed = clamp01((travel - 0.85) / 0.15);
  const inTray = rank >= 0;
  const tx = inTray ? TRAY.x : GATE_X;
  const ty = inTray ? TRAY.y + rank * 40 : gateY(GATES.length - 1) + GATE_DY;
  return {
    x: GATE_X + (tx - GATE_X) * landed,
    y: yNow + (ty - yNow) * landed,
    dead: 0,
    landed,
  };
}

function Render_({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const gatesU = s.get(scene.gatesU);
  const dropU = s.get(scene.dropU);
  const focusG = s.get(scene.focusG);
  const orderU = s.get(scene.orderU);
  const multiU = s.get(scene.multiU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const authorsFocused = focusG > 0;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc
            layout={LAYOUT}
            reveal={jsonU}
            focus={authorsFocused ? ['authors'] : undefined}
            focusU={authorsFocused ? clamp01(focusG) : 0}
          />

          {/* the gates */}
          {GATES.map((g, gi) => {
            const u = clamp01(gatesU * GATES.length - gi);
            if (u <= 0) return null;
            const y = gateY(gi);
            const hot = authorsFocused && g.label === 'authors';
            return (
              <g key={g.label} opacity={u}>
                <line x1={GATE_X - 130} y1={y} x2={GATE_X - 34} y2={y} stroke={hot ? colors.WARM : colors.GRID} strokeWidth={2.5} strokeLinecap="round" />
                <line x1={GATE_X + 34} y1={y} x2={GATE_X + 130} y2={y} stroke={hot ? colors.WARM : colors.GRID} strokeWidth={2.5} strokeLinecap="round" />
                <text x={GATE_X + 146} y={y + 5} fill={hot ? colors.WARM : colors.MUTED} fontSize={13} fontFamily="monospace">
                  {g.label}
                </text>
                {gi < GATES.length - 1 && (
                  <text x={GATE_X - 160} y={y + GATE_DY / 2 + 4} fill={colors.MUTED} fontSize={11} opacity={0.7}>
                    AND
                  </text>
                )}
              </g>
            );
          })}

          {/* the candidates */}
          {CANDS.map((c, i) => {
            const u = clamp01(dropU * CANDS.length * 0.82 - i * 0.62);
            if (u <= 0) return null;
            const p = candPos(i, u);
            const op = (1 - p.dead * 0.92) * (p.landed > 0 ? 1 : 0.95);
            const color = p.dead > 0 ? colors.NEGATIVE : p.landed > 0 ? colors.POSITIVE : colors.TEXT;
            return (
              <g key={i} opacity={op}>
                <rect x={p.x - 92} y={p.y - 14} width={184} height={28} rx={7}
                  fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fill={color} fontSize={11} fontFamily="monospace">
                  {cardLabel(c)}
                </text>
              </g>
            );
          })}

          {/* the result tray */}
          {dropU > 0.55 && (
            <g opacity={clamp01((dropU - 0.55) * 4)}>
              <text x={TRAY.x} y={TRAY.y - 34} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                results — newest first · limit {FILTER.limit}
              </text>
              {orderU > 0 && (
                <text x={TRAY.x} y={TRAY.y - 16} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily="monospace" opacity={orderU}>
                  created_at ↓
                </text>
              )}
            </g>
          )}

          {/* multiple filters = OR */}
          {multiU > 0 && (
            <g opacity={multiU}>
              {[0, 1].map((k) => (
                <g key={k} opacity={0.5}>
                  <rect x={330 + k * 26} y={190 + k * 18} width={110} height={130} rx={10}
                    fill="none" stroke={colors.SECONDARY} strokeWidth={1.4} strokeDasharray="5 4" />
                </g>
              ))}
              <text x={412} y={352} textAnchor="middle" fill={colors.SECONDARY} fontSize={12}>
                filter ‖ filter — OR
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={225} width={860} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            AND down the gates, OR along each list
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            set membership and a clock — that is the whole query language
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-01 · ids · authors · kinds · #tag · since/until · limit
          </text>
        </g>
      )}
    </>
  );
}

export function Chapter4() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Render_ s={s} />}
      </Player>
    </div>
  );
}

export { Render_ as Render };
export const vizScene = () => scene;
