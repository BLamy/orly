// What the public audit can prove
//
// Sources (RealCompanion, arXiv 2610.01780 v2, and its reproducibility repo):
//   README.md · paper Appendix D.5, D.7 · docs/gates.md
//   manifest/realcompanion_manifest.json — the U10 day8-151 row (identifiers
//     and labels only; the public package ships no conversation text)
//   audit/gates.py — gate_c, gate_d, gate_s, gate_t, gate_u, gate_v, run_gates
//   expected/gates_manifest.json — 26 gates A…Z, rows 2,034, every count 0;
//     computable: false for A, L, N, Q (A: "identifiers and senders were
//     checked"); B and Z note there is nothing to test on this release
//   docs/pipeline.md (Two loci) — 51 rows had the verified locus reset,
//     48 to thread and 3 to none; the original claim stays in trace A
//
// Machine: the probe ledger turns into a structural stencil — fills and the
// text texture recede, identifiers and list membership stay. A scanning
// ruler and small pins test the real row; the margin shows what a violation
// would look like, always labeled "Invariant illustration" and never using a
// corpus identifier. Twenty-six edge notches hold the gate inventory.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  Field,
  Heading,
  INK,
  SourceNote,
  Txt,
  beatAt,
  clamp01,
  lerp,
  narrate,
  on,
  win,
} from './shared/kit';
import {
  FULL_ROW,
  GROUNDING,
  LEDGER,
  LedgerRow,
  SOCKETS,
  SOCKET_H,
  SOCKET_W,
  SOCKET_Y,
  TAPE_Y,
  X_DISTANT,
  X_PROBE,
  X_RECENT,
} from './shared/ledger';
import type { RowState } from './shared/ledger';

// ---------------------------------------------------------------------------
// Gate inventory — expected/gates_manifest.json
// ---------------------------------------------------------------------------

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const NEED_TEXT = new Set(['A', 'L', 'N', 'Q']);
const VACUOUS = new Set(['B', 'Z']);
const COMPUTABLE = LETTERS.filter((l) => !NEED_TEXT.has(l)).length; // 22
const notchY = (i: number): number => 106 + i * 16.4;

/** The focused gate(s) per beat, with titles quoted from the expected file. */
const FOCUS: Array<{ from: number; to: number; letters: string[]; head: string; lines: string[] }> = [
  { from: 2, to: 2, letters: ['C'], head: 'C / gate_c', lines: ['every cited identifier resolves'] },
  { from: 3, to: 3, letters: ['D'], head: 'D / gate_d', lines: ['every cited identifier precedes the probe and', 'the reference set lies outside the recent window'] },
  { from: 4, to: 4, letters: ['S'], head: 'S / gate_s', lines: ['gold citations lie inside required_context'] },
  { from: 5, to: 6, letters: ['U'], head: 'U / gate_u', lines: ['the verified locus follows the reference set'] },
  { from: 7, to: 7, letters: ['T', 'V'], head: 'T / meta counters · V / declared strata', lines: ['the meta counters agree with the rows of the file', 'every row lies in a declared stratum'] },
];

// margin geometry
const M = { x: 935, w: 270 } as const;
const PANEL = { y: 262, h: 140 } as const;
const MINI = { x0: 952, y: 338, pitch: 15, bins: 16 } as const;
const miniX = (j: number): number => MINI.x0 + j * MINI.pitch + 6;

// repair aggregate: 51 = 48 thread + 3 none (docs/pipeline.md, Two loci)
const REPAIR = { total: 51, thread: 48, none: 3, cols: 17, pitch: 14.6 } as const;
// strata seam, by released rows (1,227 + 373 + 434 = 2,034)
const STRATA = [
  { key: 'proportional', rows: 1227 },
  { key: 'enriched', rows: 373 },
  { key: 'abstention', rows: 434 },
] as const;
const ROWS_TOTAL = STRATA.reduce((a, s) => a + s.rows, 0);
const STRATA_W = STRATA.map((sr) => (sr.rows / ROWS_TOTAL) * 214);
const STRATA_X = [949, 949 + STRATA_W[0] + 8, 949 + STRATA_W[0] + 8 + STRATA_W[1] + 20];
const SEAM_X = STRATA_X[2] - 10;

// ledger-side pins for gate C: rings around each cited identifier
const PINS = [
  { x: X_DISTANT - 27, y: 312, w: 54, h: 17 },
  { x: SOCKETS[0].x + SOCKET_W - 74, y: SOCKET_Y + 6, w: 70, h: 18 },
  { x: SOCKETS[2].x + SOCKET_W - 68, y: SOCKET_Y + 6, w: 64, h: 18 },
  { x: GROUNDING.x - 3, y: GROUNDING.y - 15, w: 201, h: 30 },
] as const;

const CAPTIONS = [
  'A trace is useful only if someone else can check what its fields claim.',
  'The public repository releases a manifest of identifiers and labels without the conversation text.',
  'One check confirms that cited turns exist, so a reference cannot point into empty space.',
  'Another checks that evidence precedes the probe and sits outside its recorded recent window.',
  'Grounding must stay inside the declared context, with the probe itself also allowed.',
  'The verified location must agree with whether any distant references remain.',
  'That check preserves a real repair: fifty one rows once kept a distant location after their references were gone.',
  'Counts and strata are checked too, so a stale total cannot silently change the population being reported.',
  'Twenty two gates can run on the public manifest, while four need the withheld text to finish their checks.',
  'These checks establish internal consistency. Whether the words support the labels still requires a separate audit.',
] as const;

const NOTES = [
  'README.md · paper Appendix D.7',
  'README.md · manifest/realcompanion_manifest.json',
  'audit/gates.py, gate_c · expected/gates_manifest.json',
  'audit/gates.py, gate_d · expected/gates_manifest.json',
  'audit/gates.py, gate_s · expected/gates_manifest.json',
  'audit/gates.py, gate_u · expected/gates_manifest.json',
  'docs/pipeline.md, Two loci · paper Appendix D.5',
  'audit/gates.py, gate_t, gate_v',
  'expected/gates_manifest.json · run_gates',
  'paper Appendix D.7 · docs/gates.md',
] as const;

// Every framing keeps the ledger's lower edge (y = 540) above the source note.
const CAM_CLOSE: CameraState = { x: 480, y: 361, k: 1.07 };
const CAM_WIDE: CameraState = { x: 640, y: 348, k: 1 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl, CAPTIONS);
  const inkU = tl.channel('inkU', 1); // 1 = inked ledger, 0 = stencil
  const proseU = tl.channel('proseU', 1); // withheld-text texture
  const scanC = tl.channel('scanC', 0); // gate C ruler
  const orderD = tl.channel('orderD', 0); // gate D order sweep
  const dotS = tl.channel('dotS', 0); // gate S grounding dot
  const flagU = tl.channel('flagU', 0); // gate U mismatch in the illustration
  const repairN = tl.channel('repairN', 0);
  const strataU = tl.channel('strataU', 0);
  const notchU = tl.channel('notchU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.set(cam, CAM_CLOSE, 0);

  // BEAT 0 — the ledger becomes a stencil
  tl.tween(cam, { x: 560, y: 352, k: 1.02 }, { at: 1.0, dur: 5.6, ease: ease.move });
  tl.tween(inkU, 0, { at: 2.2, dur: 3.0, ease: ease.move });

  // BEAT 1 — no conversation text in the public manifest
  let t = beatAt(1);
  tl.tween(cam, CAM_WIDE, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(proseU, 0, { at: t + 0.5, dur: 1.6, ease: ease.draw });

  // BEAT 2 — gate C: cited identifiers resolve
  t = beatAt(2);
  tl.tween(scanC, 1, { at: t + 0.9, dur: 3.8, ease: ease.linear });

  // BEAT 3 — gate D: order, and outside the recent window
  t = beatAt(3);
  tl.tween(cam, { x: 680, y: 358, k: 1.05 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(orderD, 1, { at: t + 0.8, dur: 2.8, ease: ease.linear });

  // BEAT 4 — gate S: grounding stays inside the declared context
  t = beatAt(4);
  tl.tween(cam, { x: 670, y: 356, k: 1.04 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(dotS, 1, { at: t + 1.2, dur: 1.8, ease: ease.linear });

  // BEAT 5 — gate U: locus agrees with the reference set
  t = beatAt(5);
  tl.tween(cam, { x: 670, y: 359, k: 1.06 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(flagU, 1, { at: t + 2.2, dur: 0.6, ease: ease.pop });

  // BEAT 6 — the repair the check preserves (aggregate)
  t = beatAt(6);
  tl.tween(cam, { x: 676, y: 359, k: 1.06 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(repairN, REPAIR.total, { at: t + 1.0, dur: 2.8, ease: ease.linear });

  // BEAT 7 — counters and strata
  t = beatAt(7);
  tl.tween(cam, { x: 670, y: 358, k: 1.05 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(strataU, 1, { at: t + 0.8, dur: 1.4, ease: ease.draw });

  // BEAT 8 — all twenty-six notches
  t = beatAt(8);
  tl.tween(cam, CAM_WIDE, { at: t - 0.3, dur: 1.4, ease: ease.move });
  tl.tween(notchU, 1, { at: t + 0.7, dur: 2.6, ease: ease.linear });

  // BEAT 9 — a bounded result
  t = beatAt(9);
  tl.tween(cam, { x: 640, y: 354, k: 1.03 }, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 1.3, dur: 0.6, ease: ease.enter });

  return { tl, cam, beat, inkU, proseU, scanC, orderD, dotS, flagU, repairN, strataU, notchU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Margin: what a violation would look like (never real corpus data)
// ---------------------------------------------------------------------------

function MiniTape({ skip }: { skip?: number }) {
  return (
    <g>
      {Array.from({ length: MINI.bins }, (_, j) =>
        j === skip ? null : <rect key={j} x={miniX(j) - 5} y={MINI.y - 5} width={10} height={10} rx={1.5} fill={INK.thread} opacity={0.3} />,
      )}
    </g>
  );
}

function Illustration({ kind, o, flag }: { kind: 'C' | 'D' | 'S' | 'U'; o: number; flag: number }) {
  if (o <= 0.003) return null;
  const tail =
    kind === 'C'
      ? 'a cited turn with no place on the tape'
      : kind === 'D'
        ? 'a reference inside the recent window'
        : kind === 'S'
          ? 'grounding outside the declared context'
          : 'a distant locus with no references left';
  return (
    <g opacity={o}>
      {kind === 'C' && (
        <g>
          <MiniTape skip={5} />
          <rect x={miniX(5) - 6} y={MINI.y - 6} width={12} height={12} rx={2} fill="none" stroke={INK.bad} strokeWidth={1.5} />
          <line x1={miniX(5)} y1={MINI.y - 34} x2={miniX(5)} y2={MINI.y - 9} stroke={INK.bad} strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      {kind === 'D' && (
        <g>
          <MiniTape />
          <rect x={miniX(13) - 5} y={MINI.y - 7} width={10} height={14} rx={2} fill={INK.text} />
          <path d={`M${miniX(10) - 7} ${MINI.y - 11}v-5H${miniX(12) + 7}v5`} fill="none" stroke={INK.thread} strokeWidth={1.4} />
          <line x1={miniX(11)} y1={MINI.y - 40} x2={miniX(11)} y2={MINI.y - 19} stroke={INK.bad} strokeWidth={2} strokeLinecap="round" />
          <rect x={miniX(11) - 6} y={MINI.y - 6} width={12} height={12} rx={2} fill="none" stroke={INK.bad} strokeWidth={1.5} />
        </g>
      )}
      {kind === 'S' && (
        <g>
          <rect x={960} y={MINI.y - 30} width={150} height={40} rx={9} fill="none" stroke={INK.ok} strokeDasharray="6 4" opacity={0.7} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={970 + i * 45} y={MINI.y - 20} width={38} height={20} rx={4} fill="none" stroke={INK.muted} />
          ))}
          <circle cx={1150} cy={MINI.y - 10} r={5} fill={INK.bad} />
          <circle cx={1150} cy={MINI.y - 10} r={10} fill="none" stroke={INK.bad} opacity={0.6} />
        </g>
      )}
      {kind === 'U' && (
        <g>
          <rect x={952} y={MINI.y - 31} width={98} height={20} rx={4} fill="none" stroke={INK.claim} />
          <Txt x={1001} y={MINI.y - 17} size={10.5} mono anchor="middle" fill={INK.claim}>
            locus: episode
          </Txt>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={1084 + i * 38} y={MINI.y - 31} width={32} height={20} rx={4} fill="none" stroke={INK.muted} strokeDasharray="3 3" />
          ))}
          <Txt x={1067} y={MINI.y - 15} size={17} weight={700} anchor="middle" fill={INK.bad} opacity={flag}>
            ≠
          </Txt>
          <rect x={947} y={MINI.y - 37} width={252} height={32} rx={7} fill="none" stroke={INK.bad} opacity={flag * 0.8} />
        </g>
      )}
      <Txt x={M.x + 14} y={MINI.y + 34} size={10.5} fill={INK.muted}>
        {tail}
      </Txt>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const ink = s.get(scene.inkU);
  const scan = s.get(scene.scanC);
  const order = s.get(scene.orderD);
  const dot = s.get(scene.dotS);
  const repairN = s.get(scene.repairN);
  const strata = s.get(scene.strataU);
  const notch = s.get(scene.notchU);
  const close = s.get(scene.closeU);
  const quiet = lerp(1, 0.15, on(b, 9));

  const st: RowState = {
    ...FULL_ROW,
    hint: 0,
    prose: s.get(scene.proseU),
    ink,
    locusVerified: on(b, 5),
    dim: quiet,
  };

  const scanY = lerp(150, 486, scan);
  const scanO = clamp01(scan * 12) * clamp01((1 - scan) * 12);
  const gC = win(b, 2, 2);
  const gD = win(b, 3, 3);
  const gS = win(b, 4, 4);
  const gU = win(b, 5, 6);
  const orderX = lerp(X_DISTANT, X_RECENT - 16, order);
  const dotFrom = { x: GROUNDING.x + 97, y: GROUNDING.y - 13 };
  const dotTo = { x: SOCKETS[2].x + SOCKET_W - 36, y: SOCKET_Y + SOCKET_H / 2 };
  const illusO = win(b, 2, 5);

  return (
    <g>
      <Camera {...s.get(scene.cam)}>
        <LedgerRow st={st} />

        {/* gate C — the scanning ruler pins each cited identifier */}
        <g opacity={gC}>
          {scanO > 0 && (
            <g opacity={scanO}>
              <line x1={114} y1={scanY} x2={886} y2={scanY} stroke={INK.ok} strokeWidth={1.4} />
              <rect x={114} y={scanY - 9} width={772} height={9} fill={INK.ok} opacity={0.06} />
            </g>
          )}
          {PINS.map((p, i) => (
            <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={5} fill="none" stroke={INK.ok} strokeWidth={1.4} opacity={clamp01((scanY - p.y) / 14)} />
          ))}
          <rect x={X_DISTANT - 9} y={TAPE_Y - 12} width={18} height={24} rx={4} fill="none" stroke={INK.ok} strokeWidth={1.4} opacity={clamp01(scan * 8)} />
          <rect x={X_RECENT - 8} y={TAPE_Y - 12} width={16} height={24} rx={4} fill="none" stroke={INK.ok} strokeWidth={1.4} opacity={clamp01(scan * 8)} />
        </g>

        {/* gate D — order up to the probe; the recent window is a separate bracket */}
        <g opacity={gD}>
          <line x1={X_DISTANT} y1={TAPE_Y - 14} x2={orderX} y2={TAPE_Y - 14} stroke={INK.ok} strokeWidth={1.6} />
          <path d={`M${orderX - 6} ${TAPE_Y - 18}l6 4l-6 4`} fill="none" stroke={INK.ok} strokeWidth={1.6} />
          <circle cx={X_DISTANT} cy={TAPE_Y - 14} r={3} fill={INK.ok} />
          <Txt x={(X_DISTANT + X_RECENT) / 2} y={TAPE_Y - 20} size={10} anchor="middle" fill={INK.ok} opacity={clamp01(order * 3 - 1)}>
            precedes the probe
          </Txt>
          <g opacity={clamp01(order * 4 - 3)}>
            <path d={`M${X_RECENT - 9} ${TAPE_Y - 13}v-6h18v6`} fill="none" stroke={INK.thread} strokeWidth={1.5} />
            <Txt x={X_PROBE + 12} y={TAPE_Y - 16} size={10} fill={INK.thread}>
              recent window
            </Txt>
          </g>
        </g>

        {/* gate S — the grounding dot lands inside the envelope */}
        <g opacity={gS}>
          <rect x={168} y={SOCKET_Y - 6} width={LEDGER.cx1 - 168 + 6} height={SOCKET_H + 12} rx={9} fill="none" stroke={INK.ok} strokeDasharray="6 4" />
          <rect x={X_PROBE - 11} y={TAPE_Y - 14} width={22} height={28} rx={6} fill="none" stroke={INK.ok} strokeDasharray="4 3" />
          <Txt x={LEDGER.cx1} y={440} size={10.5} anchor="end" fill={INK.ok}>
            declared context, plus the probe
          </Txt>
          <line x1={dotFrom.x} y1={dotFrom.y} x2={lerp(dotFrom.x, dotTo.x, dot)} y2={lerp(dotFrom.y, dotTo.y, dot)} stroke={INK.distant} strokeWidth={1.3} opacity={0.6} />
          <circle cx={lerp(dotFrom.x, dotTo.x, dot)} cy={lerp(dotFrom.y, dotTo.y, dot)} r={5} fill={INK.distant} opacity={clamp01(dot * 10)} />
        </g>

        {/* gate U — the real row: verified locus beside an occupied reference socket */}
        <g opacity={gU * lerp(1, 0.4, on(b, 6))}>
          <rect x={386} y={249} width={164} height={19} rx={5} fill="none" stroke={INK.ok} strokeWidth={1.3} />
          <rect x={SOCKETS[2].x - 4} y={SOCKET_Y - 4} width={SOCKET_W + 8} height={SOCKET_H + 8} rx={8} fill="none" stroke={INK.ok} strokeWidth={1.3} />
        </g>

        {/* edge notches A…Z */}
        {LETTERS.map((l, i) => {
          const focus = FOCUS.reduce((m, f) => (f.letters.includes(l) ? Math.max(m, win(b, f.from, f.to)) : m), 0);
          const amber = NEED_TEXT.has(l);
          const shown = clamp01(notch * 30 - i) * (amber ? 1 : lerp(1, 0.3, on(b, 9)));
          const o = Math.max(focus, shown);
          if (o <= 0.003) return null;
          const color = amber ? INK.claim : INK.ok;
          return (
            <g key={l} opacity={o}>
              <rect x={LEDGER.x1 - 1} y={notchY(i) - 5} width={10} height={10} rx={2} fill={amber ? color : INK.bg} fillOpacity={amber ? 0.85 : 1} stroke={color} strokeWidth={1.2} strokeDasharray={VACUOUS.has(l) ? '2 2' : undefined} />
              <Txt x={LEDGER.x1 + 15} y={notchY(i) + 4} size={10.5} mono fill={color}>
                {l}
              </Txt>
            </g>
          );
        })}

        {/* margin: what is public */}
        <g opacity={on(b, 1) * lerp(1, 0.5, on(b, 9))}>
          <Txt x={M.x} y={120} size={11.5} mono fill={INK.text}>
            manifest/realcompanion_manifest.json
          </Txt>
          <Txt x={M.x} y={138} size={10.5} fill={INK.muted}>
            identifiers, order, labels, list membership
          </Txt>
        </g>

        {/* margin: the focused gate, titled from the expected file */}
        {FOCUS.map((f) => {
          const o = win(b, f.from, f.to);
          if (o <= 0.003) return null;
          return (
            <g key={f.head} opacity={o}>
              <Txt x={M.x} y={182} size={f.letters.length > 1 ? 11.5 : 14} mono weight={600} fill={INK.ok}>
                {f.head}
              </Txt>
              {f.lines.map((line, i) => (
                <Txt key={i} x={M.x} y={202 + i * 15} size={10.5} fill={INK.text}>
                  {line}
                </Txt>
              ))}
              <Txt x={M.x} y={242} size={10.5} mono fill={INK.muted}>
                count: 0 on this manifest
              </Txt>
            </g>
          );
        })}

        {/* margin panel: invariant illustration → recorded repair → strata seam */}
        <g opacity={win(b, 2, 7)}>
          <rect x={M.x} y={PANEL.y} width={M.w} height={PANEL.h} rx={8} fill={INK.panel} stroke={INK.muted} strokeOpacity={0.5} />
        </g>
        <g opacity={illusO}>
          <Txt x={M.x + 14} y={PANEL.y + 21} size={12.5} weight={600} fill={INK.claim}>
            Invariant illustration
          </Txt>
        </g>
        <Illustration kind="C" o={gC} flag={1} />
        <Illustration kind="D" o={gD} flag={1} />
        <Illustration kind="S" o={gS} flag={1} />
        <Illustration kind="U" o={win(b, 5, 5)} flag={s.get(scene.flagU)} />

        <g opacity={win(b, 6, 6)}>
          <Txt x={M.x + 14} y={PANEL.y + 21} size={12.5} weight={600} fill={INK.text}>
            Recorded repair, aggregate
          </Txt>
          {Array.from({ length: REPAIR.total }, (_, n) => {
            const x = M.x + 14 + (n % REPAIR.cols) * REPAIR.pitch;
            const y = PANEL.y + 34 + Math.floor(n / REPAIR.cols) * REPAIR.pitch;
            const filled = clamp01(repairN - n);
            return (
              <g key={n}>
                <rect x={x} y={y} width={10.5} height={10.5} rx={2} fill="none" stroke={INK.claim} strokeWidth={1} opacity={0.75} />
                <rect x={x + 2.5} y={y + 2.5} width={5.5} height={5.5} rx={1} fill={n < REPAIR.thread ? INK.thread : INK.muted} opacity={filled} />
              </g>
            );
          })}
          <Txt x={M.x + 14} y={PANEL.y + 96} size={10.5} mono fill={INK.claim}>
            trace.A.locus — original claim, kept
          </Txt>
          <Txt x={M.x + 14} y={PANEL.y + 112} size={10.5} mono fill={INK.thread}>
            trace.B.locus — corrected
          </Txt>
          <Txt x={M.x + 14} y={PANEL.y + 131} size={12.5} mono weight={600} fill={INK.text} opacity={clamp01(repairN - REPAIR.total + 1)}>
            51 = 48 thread + 3 none
          </Txt>
        </g>

        <g opacity={win(b, 7, 7)}>
          <Txt x={M.x + 14} y={PANEL.y + 21} size={12.5} weight={600} fill={INK.text}>
            Sample / control seam
          </Txt>
          {STRATA.map((sr, i) => {
            const w = STRATA_W[i];
            const x = STRATA_X[i];
            const control = sr.key === 'abstention';
            return (
              <g key={sr.key}>
                <rect x={x} y={PANEL.y + 40} width={w * strata} height={16} rx={3} fill={control ? 'none' : i === 0 ? INK.thread : INK.distant} fillOpacity={0.5} stroke={control ? INK.muted : 'none'} strokeDasharray={control ? '3 3' : undefined} />
                <Txt x={i === 2 ? x + w : x} y={PANEL.y + 74 + (i === 1 ? 14 : 0)} size={10} mono anchor={i === 2 ? 'end' : 'start'} fill={INK.muted} opacity={strata}>
                  {sr.key}
                </Txt>
              </g>
            );
          })}
          <line x1={SEAM_X} y1={PANEL.y + 34} x2={SEAM_X} y2={PANEL.y + 62} stroke={INK.bad} strokeWidth={1.4} strokeDasharray="4 3" opacity={strata} />
          <Txt x={M.x + 14} y={PANEL.y + 112} size={10.5} mono fill={INK.text} opacity={strata}>
            rows: 2,034 = 1,227 + 373 + 434
          </Txt>
          <Txt x={M.x + 14} y={PANEL.y + 129} size={10.5} fill={INK.muted} opacity={strata}>
            no control row inside a sampled stratum
          </Txt>
        </g>

        {/* margin: the bounded inventory */}
        <g opacity={on(b, 8)}>
          <Txt x={M.x} y={196} size={14} weight={600} fill={INK.ok} opacity={clamp01(notch * 3 - 1.6)}>
            {`${COMPUTABLE} fully computable on manifest`}
          </Txt>
          <Txt x={M.x} y={224} size={14} weight={600} fill={INK.claim} opacity={clamp01(notch * 3 - 2)}>
            4 need text: A, L, N, Q
          </Txt>
          <g opacity={clamp01(notch * 3 - 2) * lerp(1, 0.6, on(b, 9))}>
            <Txt x={M.x} y={252} size={10.5} fill={INK.muted}>
              A: identifiers/senders checked;
            </Txt>
            <Txt x={M.x} y={267} size={10.5} fill={INK.muted}>
              verbatim needs text
            </Txt>
            <Txt x={M.x} y={292} size={10.5} fill={INK.muted}>
              B, Z: nothing to test on this release
            </Txt>
          </g>
        </g>

        {/* quiet result — no universal pass stamp */}
        <Field x={130} y={268} w={740} h={92} opacity={close}>
          <Txt x={500} y={323} size={25} weight={600} anchor="middle">
            Structural consistency ≠ semantic correctness
          </Txt>
        </Field>
      </Camera>

      <Heading n={4} title="What the public audit can prove" />
      <SourceNote beat={b} notes={NOTES} />
    </g>
  );
}

export const vizScene = () => scene;
