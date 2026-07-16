// A Breakpoint and a Five-Minute Fuse
//
// Grounding: src/resources/messages/messages.ts `CacheControlEphemeral`
// ("Create a cache control breakpoint at this content block") with
// `type: 'ephemeral'` and `ttl?: '5m' | '1h'` (default 5m), and
// `CacheCreation { ephemeral_5m_input_tokens, ephemeral_1h_input_tokens }` —
// the write, itemized by tier, on the usage receipt. The 5-minute entry is
// refreshed to a fresh TTL on every cache hit.
//
// Centerpiece: pin a cache_control FLAG on the tape; the prefix lifts onto a
// CACHE SHELF whose TimerArc fuse burns down; every hit rewinds it; going
// quiet lets it expire — the shelf entry dissolves into particles.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The tape: 24 cells — tools 6 · system 6 · history 12. The flag pins the
// whole thing as the stable prefix; the shelf holds its lifted ghost.
// ---------------------------------------------------------------------------

const N = 24;
const N_TOOLS = 6;
const N_SYS = 6;
const PITCH = 26;
const CELL_W = 23;
const CELL_H = 32;
const TAPE_X = 180;
const TAPE_Y = 468;
const cellX = (i: number): number => TAPE_X + i * PITCH;

const SHELF = { x: 172, y: 138, w: N * PITCH + 22, h: 92 } as const;
const shelfCellX = (i: number): number => SHELF.x + 14 + i * PITCH;
const SHELF_CELL_Y = SHELF.y + 44;

const cellFill = (i: number): string =>
  i < N_TOOLS ? colors.WARM : i < N_TOOLS + N_SYS ? colors.SECONDARY : colors.ACCENT;

// scatter directions for the expiry dissolve, seeded
const rand = mulberry32(7);
const SCATTER = Array.from({ length: N }, () => ({
  dx: (rand() - 0.5) * 150,
  dy: -40 - rand() * 90,
  spin: (rand() - 0.5) * 60,
}));

const ARC = { cx: SHELF.x + SHELF.w + 64, cy: SHELF.y + 46, r: 32 } as const;
const HOUR = { x: 918, y: 330, w: 246, h: 158 } as const;

// where the four optional breakpoints sit (after tools, after system, mid- and
// end-of-history)
const FLAG_SLOTS = [N_TOOLS, N_TOOLS + N_SYS, N_TOOLS + N_SYS + 6, N];

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_TAPE: CameraState = { x: 520, y: 420, k: 1.3 };
const CAM_SHELF: CameraState = { x: 560, y: 240, k: 1.25 };
const CAM_HOUR: CameraState = { x: 900, y: 380, k: 1.35 };

function fmtClock(frac: number, totalSec: number): string {
  const t = Math.max(0, Math.round(frac * totalSec));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Timeline (~69s). The fuse channel IS the TimerArc's u — writes set it to 1,
// scripted burns tween it down, hits snap it back up.
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TAPE, cameraInterp);

  const tapeU = tl.channel('tapeU', 0); // the request tape
  const flagU = tl.channel('flagU', 0); // the cache_control flag drop
  const codeU = tl.channel('codeU', 0); // the ephemeral chip
  const liftU = tl.channel('liftU', 0); // prefix ghost lifts to the shelf
  const writeU = tl.channel('writeU', 0); // "cache write" receipt chip
  const arcU = tl.channel('arcU', 0); // fuse visibility
  const fuse = tl.channel('fuse', 1); // 1 = full five minutes remaining
  const hit1 = tl.channel('hit1', 0); // request packet 1 (0..1 flight)
  const hit2 = tl.channel('hit2', 0);
  const glowU = tl.channel('glowU', 0); // shelf glow on each hit (popped twice)
  const dissolveU = tl.channel('dissolveU', 0); // expiry scatter
  const coldU = tl.channel('coldU', 0); // "starts cold — write again" flash
  const hourU = tl.channel('hourU', 0); // the 1h tier panel
  const hourFuse = tl.channel('hourFuse', 1);
  const flagsU = tl.channel('flagsU', 0); // the four-breakpoint beat
  const dimU = tl.channel('dimU', 0);
  const receiptU = tl.channel('receiptU', 0); // closing usage card

  // — beat 1 · the marker —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'Caching is opt in, and the unit of opting in is a marker. You attach a cache control field to one content block, and it declares: everything up to here is my stable prefix.',
  });
  tl.tween(tapeU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(flagU, 1, { at: 4.2, dur: 0.8, ease: ease.pop });
  tl.hold(7.1, 0.4);

  // — beat 2 · on the wire —
  tl.caption({
    at: 7.8,
    dur: 5.8,
    text: 'On the wire it is one tiny field, type ephemeral, sitting on the last block of the prefix you want remembered.',
  });
  tl.tween(codeU, 1, { at: 8.4, dur: 0.7, ease: ease.enter });

  // — beat 3 · the write —
  tl.caption({
    at: 14.2,
    dur: 6.4,
    text: 'Pin it, and the server does the expensive read once, then files the result on a shelf. That filing is the cache write — it shows up on the receipt as cache creation tokens.',
  });
  tl.tween(cam, CAM_SHELF, { at: 14.4, dur: 1.4, ease: ease.move });
  tl.tween(liftU, 1, { at: 15.2, dur: 1.6, ease: ease.move });
  tl.tween(writeU, 1, { at: 17.4, dur: 0.7, ease: ease.enter });

  // — beat 4 · the fuse —
  tl.caption({
    at: 21.2,
    dur: 5.6,
    text: 'The shelf has a fuse: five minutes of time to live. No traffic for five minutes, and the entry is gone.',
  });
  tl.tween(arcU, 1, { at: 21.6, dur: 0.7, ease: ease.enter });
  tl.tween(fuse, 0.72, { at: 22.2, dur: 5.0, ease: ease.linear });

  // — beat 5 · refresh on hit —
  tl.caption({
    at: 27.4,
    dur: 6.2,
    text: 'But every hit does two things at once: it reads the shelf instead of re-reading the tape, and it resets the fuse to a fresh five minutes.',
  });
  tl.tween(hit1, 1, { at: 27.8, dur: 1.2, ease: ease.linear });
  tl.tween(glowU, 1, { at: 29.0, dur: 0.4, ease: ease.pop });
  tl.tween(fuse, 1, { at: 29.0, dur: 0.5, ease: ease.move });
  tl.tween(glowU, 0, { at: 29.8, dur: 0.8, ease: ease.enter });
  tl.tween(fuse, 0.74, { at: 29.6, dur: 4.6, ease: ease.linear });

  // — beat 6 · staying warm —
  tl.caption({
    at: 34.4,
    dur: 5.6,
    text: 'So a busy conversation keeps itself warm. As long as requests keep landing inside the window, you wrote that prefix exactly once.',
  });
  tl.tween(hit2, 1, { at: 34.8, dur: 1.2, ease: ease.linear });
  tl.tween(glowU, 1, { at: 36.0, dur: 0.4, ease: ease.pop });
  tl.tween(fuse, 1, { at: 36.0, dur: 0.5, ease: ease.move });
  tl.tween(glowU, 0, { at: 36.8, dur: 0.8, ease: ease.enter });

  // — beat 7 · expiry —
  tl.caption({
    at: 40.6,
    dur: 6.4,
    text: 'Go quiet a little too long, though, and the fuse wins. The shelf clears, and the next request starts cold — full read, full write, all over again.',
  });
  tl.tween(fuse, 0, { at: 37.6, dur: 6.6, ease: ease.linear });
  tl.tween(dissolveU, 1, { at: 44.4, dur: 1.6, ease: ease.move });
  tl.tween(coldU, 1, { at: 46.2, dur: 0.7, ease: ease.pop });

  // — beat 8 · the one-hour tier —
  tl.caption({
    at: 47.6,
    dur: 6.4,
    text: 'For slower loops there is a one hour tier. Same idea, twelve times the patience — and the write costs twice the base rate instead of a quarter more.',
  });
  tl.tween(cam, CAM_HOUR, { at: 47.8, dur: 1.3, ease: ease.move });
  tl.tween(hourU, 1, { at: 48.4, dur: 0.8, ease: ease.enter });
  tl.tween(hourFuse, 0.93, { at: 49.0, dur: 5.0, ease: ease.linear });

  // — beat 9 · four breakpoints —
  tl.caption({
    at: 54.6,
    dur: 6.6,
    text: 'You can pin up to four markers in one request — after the tools, after the system prompt, deep in the history — so a late change still reuses everything before the last surviving marker.',
  });
  tl.tween(cam, CAM_TAPE, { at: 54.8, dur: 1.3, ease: ease.move });
  tl.tween(coldU, 0, { at: 54.8, dur: 0.5, ease: ease.enter });
  tl.tween(flagsU, 1, { at: 55.6, dur: 1.8, ease: ease.move });

  // — beat 10 · the receipt —
  tl.caption({
    at: 61.8,
    dur: 6.2,
    text: 'And the receipt itemizes all of it — fresh input, cache writes broken out by tier, cache reads — in one usage block. Next: what those three lines actually cost.',
  });
  tl.tween(cam, CAM_WIDE, { at: 62.0, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 62.2, dur: 1.0, ease: ease.move });
  tl.tween(receiptU, 1, { at: 63.2, dur: 0.8, ease: ease.enter });
  tl.hold(68.0, 1.4);

  return {
    tl,
    cam,
    tapeU,
    flagU,
    codeU,
    liftU,
    writeU,
    arcU,
    fuse,
    hit1,
    hit2,
    glowU,
    dissolveU,
    coldU,
    hourU,
    hourFuse,
    flagsU,
    dimU,
    receiptU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const flagU = s.get(scene.flagU);
  const codeU = s.get(scene.codeU);
  const liftU = s.get(scene.liftU);
  const writeU = s.get(scene.writeU);
  const arcU = s.get(scene.arcU);
  const fuse = s.get(scene.fuse);
  const hit1 = s.get(scene.hit1);
  const hit2 = s.get(scene.hit2);
  const glowU = s.get(scene.glowU);
  const dissolveU = s.get(scene.dissolveU);
  const coldU = s.get(scene.coldU);
  const hourU = s.get(scene.hourU);
  const hourFuse = s.get(scene.hourFuse);
  const flagsU = s.get(scene.flagsU);
  const dimU = s.get(scene.dimU);
  const receiptU = s.get(scene.receiptU);

  const machineOp = tapeU * (1 - 0.88 * dimU);
  const flagX = cellX(N - 1) + CELL_W + 4;

  const hits: number[] = [];
  if (hit1 > 0 && hit1 < 1) hits.push(hit1);
  if (hit2 > 0 && hit2 < 1) hits.push(hit2);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={machineOp}>
          {/* the request tape */}
          <text x={TAPE_X} y={TAPE_Y - 46} fill={colors.MUTED} fontSize={13}>
            the request — tools, system, history
          </text>
          {Array.from({ length: N }, (_, i) => (
            <rect key={i} x={cellX(i)} y={TAPE_Y} width={CELL_W} height={CELL_H} rx={3} fill={cellFill(i)} opacity={0.5 * clamp01(tapeU * N - i)} />
          ))}

          {/* the cache_control flag on the last prefix block */}
          <g opacity={flagU} transform={`translate(${flagX}, ${TAPE_Y - 26 * flagU})`}>
            <line x1={0} y1={26} x2={0} y2={CELL_H + 26} stroke={colors.POSITIVE} strokeWidth={2.5} />
            <path d={'M 0 26 h 64 l -10 11 l 10 11 h -64 z'} fill={colors.POSITIVE} opacity={0.9} />
            <text x={6} y={41} fill={colors.BG} fontSize={10.5} fontFamily={MONO} fontWeight={700}>
              breakpoint
            </text>
          </g>

          {/* the ephemeral chip */}
          <g opacity={codeU}>
            <rect x={TAPE_X + 340} y={TAPE_Y + 52} width={330} height={34} rx={9} fill={colors.BG} stroke={colors.POSITIVE} />
            <text x={TAPE_X + 356} y={TAPE_Y + 74} fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
              cache_control: {'{'} type: 'ephemeral' {'}'}
            </text>
          </g>

          {/* the shelf */}
          <g opacity={clamp01(liftU * 3)}>
            <rect
              x={SHELF.x}
              y={SHELF.y}
              width={SHELF.w}
              height={SHELF.h}
              rx={14}
              fill={colors.PANEL}
              stroke={glowU > 0.02 ? colors.POSITIVE : colors.GRID}
              strokeWidth={1.5 + 1.5 * glowU}
            />
            <text x={SHELF.x + 16} y={SHELF.y + 26} fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
              the prompt cache
            </text>
            <text x={SHELF.x + SHELF.w - 16} y={SHELF.y + 26} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              key = the whole prefix
            </text>
          </g>

          {/* prefix ghost cells: tape → shelf, then scattered by expiry */}
          {Array.from({ length: N }, (_, i) => {
            const u = clamp01(liftU * (N + 6) / N - (i / N) * 0.3); // slight stagger
            if (u <= 0) return null;
            const x = lerp(cellX(i), shelfCellX(i), u) + SCATTER[i].dx * dissolveU;
            const y = lerp(TAPE_Y, SHELF_CELL_Y, u) + SCATTER[i].dy * dissolveU;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={CELL_W * lerp(1, 0.82, u)}
                height={CELL_H * lerp(1, 0.62, u)}
                rx={3}
                fill={cellFill(i)}
                opacity={0.75 * u * (1 - dissolveU)}
                transform={`rotate(${SCATTER[i].spin * dissolveU} ${x} ${y})`}
              />
            );
          })}

          {/* write receipt chip */}
          <g opacity={writeU * (1 - dissolveU)}>
            <rect x={SHELF.x} y={SHELF.y + SHELF.h + 10} width={356} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} />
            <text x={SHELF.x + 14} y={SHELF.y + SHELF.h + 30} fill={colors.WARM} fontSize={12} fontFamily={MONO}>
              cache_creation_input_tokens: 18,000 — the write
            </text>
          </g>

          {/* the five-minute fuse */}
          <g opacity={arcU}>
            <TimerArc cx={ARC.cx} cy={ARC.cy} r={ARC.r} u={fuse} color={fuse < 0.25 ? colors.NEGATIVE : colors.WARM} width={5} />
            <text x={ARC.cx} y={ARC.cy + 5} textAnchor="middle" fill={fuse < 0.25 ? colors.NEGATIVE : colors.TEXT} fontSize={13} fontFamily={MONO}>
              {fmtClock(fuse, 300)}
            </text>
            <text x={ARC.cx} y={ARC.cy + ARC.r + 18} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              ttl: '5m'
            </text>
          </g>

          {/* hit packets: a request flies in and lands on the shelf */}
          {hits.map((u, i) => (
            <g key={i}>
              <circle cx={lerp(1150, SHELF.x + SHELF.w - 30, u)} cy={lerp(560, SHELF.y + SHELF.h - 14, u)} r={8} fill={colors.ACCENT} />
              <text x={lerp(1150, SHELF.x + SHELF.w - 30, u)} y={lerp(560, SHELF.y + SHELF.h - 14, u) - 14} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>
                request
              </text>
            </g>
          ))}

          {/* expiry aftermath */}
          <g opacity={coldU}>
            <rect x={SHELF.x + 120} y={SHELF.y + 24} width={SHELF.w - 240} height={44} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.4} />
            <text x={SHELF.x + SHELF.w / 2} y={SHELF.y + 52} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>
              expired — next request pays the write again
            </text>
          </g>

          {/* the one-hour tier */}
          <g opacity={hourU}>
            <rect x={HOUR.x} y={HOUR.y} width={HOUR.w} height={HOUR.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={HOUR.x + 16} y={HOUR.y + 28} fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
              the patient tier
            </text>
            <TimerArc cx={HOUR.x + 52} cy={HOUR.y + 86} r={24} u={hourFuse} color={colors.SECONDARY} width={4.5} />
            <text x={HOUR.x + 52} y={HOUR.y + 91} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>
              {fmtClock(hourFuse, 3600)}
            </text>
            <text x={HOUR.x + 96} y={HOUR.y + 76} fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO}>
              ttl: '1h'
            </text>
            <text x={HOUR.x + 96} y={HOUR.y + 98} fill={colors.MUTED} fontSize={12}>
              write costs 2×
            </text>
            <text x={HOUR.x + 96} y={HOUR.y + 118} fill={colors.MUTED} fontSize={12}>
              reads still 0.1×
            </text>
          </g>

          {/* four breakpoints */}
          <g opacity={flagsU}>
            {FLAG_SLOTS.map((slot, i) => {
              const x = cellX(slot - 1) + CELL_W + 3;
              return (
                <g key={i} opacity={clamp01(flagsU * 4 - i)}>
                  <line x1={x} y1={TAPE_Y - 14} x2={x} y2={TAPE_Y + CELL_H} stroke={colors.POSITIVE} strokeWidth={2} />
                  <path d={`M ${x} ${TAPE_Y - 14} h 26 l -5 6 l 5 6 h -26 z`} fill={colors.POSITIVE} opacity={0.85} />
                </g>
              );
            })}
            <text x={cellX(0)} y={TAPE_Y + CELL_H + 26} fill={colors.POSITIVE} fontSize={12.5}>
              up to 4 breakpoints per request — a partial match lands on the nearest one
            </text>
          </g>
        </g>

        {/* closing receipt card */}
        <g opacity={receiptU}>
          <rect x={360} y={210} width={560} height={230} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={248} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={600}>
            one usage block, three meters
          </text>
          <text x={400} y={288} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
            input_tokens: 3,000
          </text>
          <text x={400} y={318} fill={colors.WARM} fontSize={14} fontFamily={MONO}>
            cache_creation_input_tokens: 18,000
          </text>
          <text x={400} y={348} fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>
            cache_read_input_tokens: 0
          </text>
          <text x={400} y={382} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
            cache_creation: {'{'} ephemeral_5m_input_tokens: 18,000,
          </text>
          <text x={400} y={404} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
            {'  '}ephemeral_1h_input_tokens: 0 {'}'}
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
