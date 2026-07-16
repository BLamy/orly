// Chapter 4: SyncEngineInsights — the payoff and the ask. The AI reads the
// recorded delta log as EVIDENCE and runs checks exactly like the React
// ReactPerformanceInsights (replayio/backend): convergence (digest match
// across replicas at a shared offset), delivery (lost/duplicate deltas),
// recompute cost ("this query re-ran 40 times for one visible change"), and
// causality (render ← diff ← write, with a point link). The persistent object
// is the FINDING CARD, in his exact markdown format, accruing one receipt per
// check from the evidence panel on the left. Final frame: a clean stage with
// ReactPerformanceInsights → SyncEngineInsights side by side.
import { Timeline, Camera, CAMERA_HOME, colors, ease, cameraInterp, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720, bottom y≳630 clear —————

// Left: the evidence panel (the recorded delta log, re-read per check).
const EV = { x: 90, y: 130, w: 500, h: 420 };
// Right: the finding card — the persistent object that assembles.
const CARD = { x: 650, y: 96, w: 546, h: 492 };

// Three replicas' delta rows for the convergence check.
const REPLICAS = ['replica a', 'replica b', 'replica c'];
const RAND = mulberry32(17);
const REP_DOTS = REPLICAS.map(() => Array.from({ length: 12 }, () => 0.35 + RAND() * 0.5));
const repY = (r: number) => EV.y + 76 + r * 52;
const repDotX = (i: number) => EV.x + 30 + i * 30;
const DIGEST_X = EV.x + 412;

// Delivery scan: one duplicate delta (index 7 repeats index 6's payload).
const SCAN_N = 14;
const scanX = (i: number) => EV.x + 30 + i * ((EV.w - 130) / SCAN_N);
const SCAN_Y = EV.y + 250;
const DUP_I = 7;

// Recompute meter: 40 runs, 1 visible change.
const RUNS = 40;
const RUN_COLS = 20;
const runPos = (i: number) => ({
  x: EV.x + 30 + (i % RUN_COLS) * 22,
  y: EV.y + 316 + Math.floor(i / RUN_COLS) * 24,
});
const VISIBLE_RUN = 23;

// Causality chain inside the evidence panel.
const CHAIN_Y = EV.y + 390;
const CHAIN = [
  { x: EV.x + 70, label: 'write' },
  { x: EV.x + 210, label: 'diff' },
  { x: EV.x + 350, label: 'render' },
];

// Finding-card lines (his markdown output format — on screen, never spoken).
type CardLine = { text: string; color?: string; bold?: boolean; indent?: number };
const CARD_HEADER: CardLine[] = [
  { text: '# Sync Engine Insights', bold: true },
  { text: '' },
  { text: '### 🟡 Expensive query recompute: issue list', bold: true },
  { text: '**Category:** expensive-recomputes | **Severity:** warning' },
];
const CARD_CHECKS: CardLine[][] = [
  [
    { text: '✓ convergence — 3/3 replicas match', color: 'pos' },
    { text: '  digest check at offset 4182: equal', indent: 1 },
  ],
  [
    { text: '✗ delivery — 1 duplicate delta applied', color: 'neg' },
    { text: '  offset 3097 applied twice on replica b', indent: 1 },
  ],
  [
    { text: '⚠ cost — query re-ran 40× for 1 visible change', color: 'warm' },
    { text: '  39 recomputes produced identical views (98% waste)', indent: 1 },
  ],
  [
    { text: '→ causality — render ← diff ← write', color: 'acc' },
    { text: '  Navigate to: point 103845937176622626750', indent: 1 },
  ],
];
const CARD_FOOTER: CardLine[] = [
  { text: '' },
  { text: '**Impact:** 39 wasted recomputes per keystroke — visible jank.' },
  { text: '**Suggested action:** narrow the query — subscribe the list' },
  { text: 'to the changed row, not the whole table scan.' },
];

// Final frame: the two tool cards side by side.
const FINAL_L = { x: 190, y: 260, w: 400, h: 180 };
const FINAL_R = { x: 690, y: 260, w: 400, h: 180 };

const CAM_EV: CameraState = { x: 400, y: 300, k: 1.3 };
const CAM_CARD: CameraState = { x: 880, y: 330, k: 1.28 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.0 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const evU = tl.channel('evU', 0); // evidence panel + card frame
  const cardU = tl.channel('cardU', 0);
  const convU = tl.channel('convU', 0); // replicas → digest match
  const scanU = tl.channel('scanU', 0); // delivery scan
  const dupU = tl.channel('dupU', 0); // the duplicate flags red
  const runsU = tl.channel('runsU', 0); // 40 recompute cells light
  const chainU = tl.channel('chainU', 0); // causality chain
  const line1U = tl.channel('line1U', 0); // card receipt lines land
  const line2U = tl.channel('line2U', 0);
  const line3U = tl.channel('line3U', 0);
  const line4U = tl.channel('line4U', 0);
  const footU = tl.channel('footU', 0); // impact + suggested action
  const askU = tl.channel('askU', 0); // the one-sentence ask
  const finalU = tl.channel('finalU', 0); // clean final frame

  // BEAT 0 — name the tool
  tl.caption({ at: 0.3, dur: 6, text: 'Chapter four is the payoff. Give the same tool surface a name — Sync Engine Insights — shaped exactly like the React one we just shipped: checks over a recording, findings with receipts.' });
  tl.tween(evU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(cardU, 1, { at: 2.2, dur: 1.0, ease: ease.enter });
  tl.hold(6.3, 0.8);

  // BEAT 1 — convergence
  tl.caption({ at: 7.4, dur: 7.5, text: 'The recording is evidence, so the checks read like assertions. First, convergence: did every replica arrive at the same state? Hash each view at a shared offset and compare — three digests, one answer.' });
  tl.tween(cam, CAM_EV, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.tween(convU, 1, { at: 9.0, dur: 3.4, ease: ease.linear });
  tl.tween(line1U, 1, { at: 13.0, dur: 0.6, ease: ease.enter });
  tl.hold(14.9, 0.8);

  // BEAT 2 — delivery
  tl.caption({ at: 16.0, dur: 6.5, text: "Second, delivery. Walk the delta track once: every delta is either applied exactly once, or it isn't. Lost and duplicate deltas stop being a debugging saga — they fall out of a linear scan." });
  tl.tween(scanU, 1, { at: 16.5, dur: 3.2, ease: ease.linear });
  tl.tween(dupU, 1, { at: 19.9, dur: 0.5, ease: ease.pop });
  tl.tween(line2U, 1, { at: 20.8, dur: 0.6, ease: ease.enter });
  tl.hold(22.5, 0.8);

  // BEAT 3 — recompute cost
  tl.caption({ at: 23.6, dur: 7, text: 'Third, cost. This query recomputed forty times for one visible change — thirty nine identical views. That is the expensive state update check, one layer down: same waste metric, same receipts.' });
  tl.tween(runsU, 1, { at: 24.1, dur: 3.4, ease: ease.linear });
  tl.tween(line3U, 1, { at: 28.4, dur: 0.6, ease: ease.enter });
  tl.hold(30.6, 0.8);

  // BEAT 4 — causality
  tl.caption({ at: 31.7, dur: 6.5, text: 'And fourth, causality. This render was caused by this diff, from this write, at this offset — and the finding carries a point link straight to the moment it happened.' });
  tl.tween(chainU, 1, { at: 32.2, dur: 2.2, ease: ease.draw });
  tl.tween(line4U, 1, { at: 35.4, dur: 0.6, ease: ease.enter });
  tl.hold(38.2, 0.8);

  // BEAT 5 — the card completes, in his format
  tl.caption({ at: 39.3, dur: 6.5, text: 'The output format stays the same: severity, impact, receipts, a suggested action, and a point to navigate to. An agent can act on it without guessing — because none of it is a guess.' });
  tl.tween(cam, CAM_CARD, { at: 39.5, dur: 1.5, ease: ease.move });
  tl.tween(footU, 1, { at: 41.0, dur: 0.9, ease: ease.enter });
  tl.hold(45.8, 0.8);

  // BEAT 6 — the ask
  tl.caption({ at: 46.9, dur: 7, text: "So that's the proposal. Same pattern, one layer down: record the dataflow, and every sync bug becomes a query over evidence — instead of a week of staring at logs that were never written down." });
  tl.tween(cam, CAM_WIDE, { at: 47.1, dur: 1.6, ease: ease.move });
  tl.tween(askU, 1, { at: 48.4, dur: 1.0, ease: ease.move });
  tl.hold(53.9, 0.8);

  // BEAT 7 — the clean final frame
  tl.caption({ at: 55.0, dur: 5.5, text: 'We built the first one. This is the second.' });
  tl.tween(finalU, 1, { at: 55.2, dur: 1.2, ease: ease.move });
  tl.hold(60.5, 1.4);

  return { tl, cam, evU, cardU, convU, scanU, dupU, runsU, chainU, line1U, line2U, line3U, line4U, footU, askU, finalU };
}

const scene = buildScene();

// ————— pure subcomponents —————

function EvidencePanel({ u, conv, scan, dup, runs, chain, fade }: { u: number; conv: number; scan: number; dup: number; runs: number; chain: number; fade: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const cv = clamp01(conv);
  const sc = clamp01(scan);
  const rn = clamp01(runs);
  const ch = clamp01(chain);
  const matched = cv >= 1;
  return (
    <g opacity={e * fade}>
      <rect x={EV.x} y={EV.y} width={EV.w} height={EV.h} rx={14} fill="rgba(13,19,33,0.72)" stroke={colors.GRID} strokeWidth={1.5} />
      <text x={EV.x + 18} y={EV.y + 28} fontSize={11.5} fill={colors.MUTED} fontFamily={mono}>
        evidence — the recorded delta log
      </text>
      {/* convergence: three replica rows + digests */}
      <text x={EV.x + 18} y={EV.y + 54} fontSize={10.5} fill={cv > 0 ? colors.TEAL : colors.MUTED} fontFamily={mono} opacity={cv > 0 ? 1 : 0.5}>
        convergence
      </text>
      {REPLICAS.map((name, r) => (
        <g key={r}>
          <text x={EV.x + 18} y={repY(r) - 14} fontSize={9.5} fill={colors.MUTED} fontFamily={mono}>
            {name}
          </text>
          {REP_DOTS[r].map((o, i) => {
            const lit = clamp01(cv * (REP_DOTS[r].length + 3) - i);
            return <circle key={i} cx={repDotX(i)} cy={repY(r)} r={3.4} fill={lit > 0 ? colors.TEAL : colors.MUTED} opacity={lit > 0 ? 0.4 + 0.6 * lit : o * 0.4} />;
          })}
          {cv > 0.75 && (
            <g opacity={clamp01((cv - 0.75) * 4)}>
              <rect x={DIGEST_X - 34} y={repY(r) - 11} width={68} height={22} rx={11} fill={matched ? 'rgba(52,211,153,0.14)' : 'rgba(148,163,184,0.1)'} stroke={matched ? colors.POSITIVE : colors.GRID} strokeWidth={1.2} />
              <text x={DIGEST_X} y={repY(r) + 4} textAnchor="middle" fontSize={10} fill={matched ? colors.POSITIVE : colors.TEXT} fontFamily={mono}>
                a94f2c
              </text>
            </g>
          )}
        </g>
      ))}
      {/* delivery scan */}
      <text x={EV.x + 18} y={SCAN_Y - 22} fontSize={10.5} fill={sc > 0 ? colors.TEAL : colors.MUTED} fontFamily={mono} opacity={sc > 0 ? 1 : 0.5}>
        delivery
      </text>
      {Array.from({ length: SCAN_N }, (_, i) => {
        const lit = clamp01(sc * SCAN_N - i);
        const isDup = i === DUP_I;
        const dupLit = isDup ? clamp01(dup) : 0;
        return (
          <g key={i}>
            <rect x={scanX(i) - 5} y={SCAN_Y - 5} width={10} height={10} rx={2} transform={`rotate(45 ${scanX(i)} ${SCAN_Y})`} fill={dupLit > 0 ? colors.NEGATIVE : lit > 0 ? colors.TEAL : colors.MUTED} opacity={lit > 0 ? 0.45 + 0.55 * lit : 0.25} />
            {dupLit > 0 && (
              <text x={scanX(i)} y={SCAN_Y - 16} textAnchor="middle" fontSize={9} fill={colors.NEGATIVE} fontFamily={mono} opacity={dupLit}>
                ×2
              </text>
            )}
          </g>
        );
      })}
      {/* recompute meter: 40 cells, one visible */}
      <text x={EV.x + 18} y={EV.y + 302} fontSize={10.5} fill={rn > 0 ? colors.TEAL : colors.MUTED} fontFamily={mono} opacity={rn > 0 ? 1 : 0.5}>
        recompute cost — 40 runs / 1 visible change
      </text>
      {Array.from({ length: RUNS }, (_, i) => {
        const lit = clamp01(rn * RUNS - i);
        if (lit <= 0) return null;
        const p = runPos(i);
        const visible = i === VISIBLE_RUN;
        return <rect key={i} x={p.x} y={p.y} width={16} height={16} rx={3} fill={visible ? colors.POSITIVE : colors.WARM} opacity={visible ? lit : (0.2 + 0.25 * lit)} />;
      })}
      {/* causality chain */}
      {ch > 0 && (
        <g>
          {CHAIN.slice(0, -1).map((c, i) => {
            const seg = clamp01(ch * (CHAIN.length - 1) - i);
            return seg > 0 ? <line key={i} x1={c.x + 44} y1={CHAIN_Y} x2={c.x + 44 + (CHAIN[i + 1].x - 44 - (c.x + 44)) * seg} y2={CHAIN_Y} stroke={colors.WARM} strokeWidth={2.4} strokeLinecap="round" /> : null;
          })}
          {CHAIN.map((c, i) => {
            const lit = clamp01(ch * CHAIN.length - i * 0.7);
            return lit > 0 ? (
              <g key={i} opacity={lit}>
                <rect x={c.x - 44} y={CHAIN_Y - 13} width={88} height={26} rx={13} fill="rgba(251,191,36,0.12)" stroke={colors.WARM} strokeWidth={1.2} />
                <text x={c.x} y={CHAIN_Y + 4} textAnchor="middle" fontSize={10.5} fill={colors.WARM} fontFamily={mono}>
                  {c.label}
                </text>
              </g>
            ) : null;
          })}
          <text x={EV.x + 18} y={CHAIN_Y - 22} fontSize={10.5} fill={colors.TEAL} fontFamily={mono} opacity={Math.min(1, ch * 3)}>
            causality
          </text>
        </g>
      )}
    </g>
  );
}

const lineColor = (c?: string) => (c === 'pos' ? colors.POSITIVE : c === 'neg' ? colors.NEGATIVE : c === 'warm' ? colors.WARM : c === 'acc' ? colors.ACCENT : colors.TEXT);

function CardLines({ lines, x, y, u }: { lines: CardLine[]; x: number; y: number; u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g opacity={e} transform={`translate(0, ${(1 - e) * 6})`}>
      {lines.map((l, i) => (
        <text key={i} x={x + (l.indent ? 14 : 0)} y={y + i * 19} fontSize={11} fill={l.color ? lineColor(l.color) : l.bold ? colors.TEXT : colors.MUTED} fontFamily={mono} fontWeight={l.bold ? 700 : 400}>
          {l.text}
        </text>
      ))}
    </g>
  );
}

/** The finding card — assembles in the React tool's markdown format. */
function FindingCard({ u, l1, l2, l3, l4, foot, fade }: { u: number; l1: number; l2: number; l3: number; l4: number; foot: number; fade: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const lineUs = [l1, l2, l3, l4];
  const checksY = CARD.y + 138;
  return (
    <g opacity={e * fade} transform={`translate(0, ${(1 - e) * 10})`}>
      <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <rect x={CARD.x} y={CARD.y} width={CARD.w} height={34} rx={14} fill="rgba(56,189,248,0.1)" />
      <text x={CARD.x + 16} y={CARD.y + 22} fontSize={12} fill={colors.ACCENT} fontFamily={mono} fontWeight={700}>
        SyncEngineInsights
      </text>
      <CardLines lines={CARD_HEADER} x={CARD.x + 20} y={CARD.y + 62} u={e} />
      {CARD_CHECKS.map((lines, i) => (
        <CardLines key={i} lines={lines} x={CARD.x + 20} y={checksY + i * 52} u={lineUs[i]} />
      ))}
      <CardLines lines={CARD_FOOTER} x={CARD.x + 20} y={checksY + CARD_CHECKS.length * 52 + 8} u={foot} />
    </g>
  );
}

function ToolCard({ box, name, sub, accent, u }: { box: { x: number; y: number; w: number; h: number }; name: string; sub: string; accent: string; u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g opacity={e} transform={`translate(0, ${(1 - e) * 12})`}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={16} fill={colors.PANEL} stroke={accent} strokeWidth={2} />
      <text x={box.x + box.w / 2} y={box.y + 74} textAnchor="middle" fontSize={19} fill={accent} fontFamily={mono} fontWeight={700}>
        {name}
      </text>
      <text x={box.x + box.w / 2} y={box.y + 112} textAnchor="middle" fontSize={12.5} fill={colors.MUTED}>
        {sub}
      </text>
    </g>
  );
}

// ————— render —————

export function Render({ s }: { s: SceneState }) {
  const ask = clamp01(s.get(scene.askU));
  const fin = clamp01(s.get(scene.finalU));
  const fade = (1 - 0.55 * ask) * (1 - fin); // the ask quiets the stage; the final frame owns it
  return (
    <>
      <Camera {...s.get(scene.cam)}>
        <EvidencePanel u={s.get(scene.evU)} conv={s.get(scene.convU)} scan={s.get(scene.scanU)} dup={s.get(scene.dupU)} runs={s.get(scene.runsU)} chain={s.get(scene.chainU)} fade={fade} />
        <FindingCard u={s.get(scene.cardU)} l1={s.get(scene.line1U)} l2={s.get(scene.line2U)} l3={s.get(scene.line3U)} l4={s.get(scene.line4U)} foot={s.get(scene.footU)} fade={fade} />
        {ask > 0 && fin < 1 && (
          <text x={640} y={620} textAnchor="middle" fontSize={17} fill={colors.TEXT} fontWeight={600} opacity={ask * (1 - fin)}>
            record the dataflow → every sync bug becomes a query over evidence
          </text>
        )}
      </Camera>
      {/* the clean final frame — opaque stage, two tools side by side */}
      {fin > 0 && (
        <g opacity={fin}>
          <rect x={0} y={0} width={1280} height={720} fill="#0a0e1a" />
          <ToolCard box={FINAL_L} name="ReactPerformanceInsights" sub="commits · renders · triggers · waste" accent={colors.ACCENT} u={fin} />
          <ToolCard box={FINAL_R} name="SyncEngineInsights" sub="deltas · convergence · recomputes · causality" accent={colors.TEAL} u={clamp01(fin * 1.4 - 0.3)} />
          <g opacity={clamp01(fin * 1.6 - 0.5)}>
            <line x1={FINAL_L.x + FINAL_L.w + 16} y1={350} x2={FINAL_R.x - 24} y2={350} stroke={colors.MUTED} strokeWidth={2.5} strokeLinecap="round" />
            <path d={`M ${FINAL_R.x - 24} 350 l -12 -7 v 14 z`} fill={colors.MUTED} />
          </g>
          <text x={640} y={510} textAnchor="middle" fontSize={16} fill={colors.MUTED} opacity={clamp01(fin * 1.6 - 0.6)}>
            same pattern, one layer down
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
