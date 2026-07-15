// Book scene — builder-critic-loop, chapter 1: "A Claim Is Not Evidence".
// electric-forest's AGENTS.md opens with one rule: a builder being satisfied
// is a CLAIM; a deterministic recording of the run is EVIDENCE; a separate,
// hostile critic session must interrogate it and fail to refute it. The
// stage plays that rule out: a satisfied builder message gets stamped as a
// claim, the recording appears beneath it as the real currency, a fresh
// critic session attacks from two directions, then the task lifecycle,
// build_queue.py, and the four .eforest/project.json states.
import type { ReactNode } from 'react';
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { MessageCard, RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------- layout at module scope — 1280×720, bottom ~12% clear */

const CLAIM = { x: 60, y: 96, w: 500 };
const STRIP = { x: 60, y: 344, w: 520 };
const EVCHIP = { x: 60, y: 432 };
const CRITIC = { x: 740, y: 96, w: 460, h: 150 };
const ATK = { x: 740, y: 292, w: 460, h: 74, gap: 16 };
const RAIL = { x: 170, y: 210, w: 940 };
const FLOW = { readme: { x: 130, y: 396, w: 300, h: 96 }, script: { x: 560, y: 428 }, queue: { x: 850, y: 396, w: 300, h: 96 } };
const STATES = { y: 552, xs: [250, 500, 750, 1010] };

const CLAIM_TEXT = 'E0-T12 implemented. Gates green, digest matches the fixture. Shipping it.';

const POINTS: RecordingPoint[] = [
  { at: 0.08, kind: 'interaction', label: 'run ef bisect' },
  { at: 0.3, kind: 'network', label: 'append events' },
  { at: 0.52, kind: 'render', label: 'digest 4f21…' },
  { at: 0.74, kind: 'interaction', label: 'exit 1' },
  { at: 0.9, kind: 'render', label: 'log written' },
];

const STATUSES = [
  { label: 'pending', color: colors.MUTED },
  { label: 'in-progress', color: colors.ACCENT },
  { label: 'implemented', color: colors.WARM },
  { label: 'verified', color: colors.POSITIVE },
];

const PROJECT_STATES = [
  { label: 'building', color: colors.POSITIVE },
  { label: 'complete', color: colors.ACCENT },
  { label: 'paused', color: colors.MUTED },
  { label: 'invalid_loop', color: colors.NEGATIVE },
];

/* -------------------------------------------------------------- timeline */

export function buildScene() {
  const tl = new Timeline();

  // beat 0 — the satisfied builder: a claim
  const claimE = tl.channel('claimEnter', 0);
  const claimT = tl.channel('claimText', 0);
  const claimStamp = tl.channel('claimStamp', 0);
  const gA = tl.channel('sessionFade', 1);

  // beat 1 — the recording is the evidence
  const stripR = tl.channel('stripReveal', 0);
  const stripU = tl.channel('stripSweep', 0);
  const evChipU = tl.channel('evidenceChip', 0);
  const evStamp = tl.channel('evidenceStamp', 0);

  // beat 2 — the fresh critic session
  const criticE = tl.channel('criticEnter', 0);
  const arrowU = tl.channel('criticArrow', 0);

  // beat 3 — the two attack directions
  const atk1U = tl.channel('attackFalsify', 0);
  const atk2U = tl.channel('attackSuffic', 0);

  // beat 4 — the task lifecycle rail
  const railR = tl.channel('railReveal', 0);
  const tokU = tl.channel('railToken', -1);
  const refChip = tl.channel('refutedChip', 0);
  const arcU = tl.channel('refutedArc', 0);
  const verifiedU = tl.channel('verifiedPop', 0);
  const gB = tl.channel('railFade', 1);

  // beat 5 — build_queue.py regenerates QUEUE.md
  const rowE = tl.channel('flowEnter', 0);
  const flowU = tl.channel('flowPacket', 0);
  const commitU = tl.channel('commitChip', 0);

  // beat 6 — the four project states
  const stateU = tl.channel('stateCascade', 0);
  const invalidU = tl.channel('invalidPulse', 0);
  const noteU = tl.channel('loudStopNote', 0);

  /* beat 0 — the builder is satisfied; that is a claim, nothing more */
  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.8, text: 'A builder satisfied with its own work has produced a claim — nothing more.' });
  tl.tween(claimE, 1, { at: t - 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(claimT, 1, { at: t - 5.0, dur: 1.8, ease: ease.linear });
  tl.tween(claimStamp, 1, { at: t - 2.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.8);

  /* beat 1 — evidence: a deterministic recording of the happy run */
  t = tl.caption({ at: t, dur: 5.8, text: 'Evidence: a deterministic recording of the run — interrogable, in full.' });
  tl.tween(stripR, 1, { at: t - 5.4, dur: 1.4, ease: ease.draw });
  tl.tween(stripU, 1, { at: t - 3.9, dur: 5.4, ease: ease.linear });
  tl.tween(evChipU, 1, { at: t - 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(evStamp, 1, { at: t - 1.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* beat 2 — a fresh session, read-only, out to refute */
  t = tl.caption({ at: t, dur: 5.6, text: 'A fresh critic session interrogates it. It never trusts, never fixes.' });
  tl.tween(criticE, 1, { at: t - 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(arrowU, 1, { at: t - 3.4, dur: 1.3, ease: ease.draw });
  t = tl.hold(t, 0.6);

  /* beat 3 — falsification and sufficiency */
  t = tl.caption({ at: t, dur: 6.0, text: 'Falsify: one contradicting point. Sufficiency: diff the evidence never ran.' });
  tl.tween(atk1U, 1, { at: t - 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(atk2U, 1, { at: t - 3.4, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* beat 4 — the lifecycle: only the critic sets verified */
  t = tl.caption({ at: t, dur: 6.2, text: 'pending → in-progress → implemented → verified — only the critic sets verified.' });
  tl.tween(gA, 0.14, { at: t - 6.0, dur: 0.8, ease: ease.move });
  tl.tween(railR, 1, { at: t - 5.4, dur: 1.4, ease: ease.draw });
  tl.set(tokU, 0, t - 4.1);
  tl.tween(tokU, 2, { at: t - 4.0, dur: 1.5, ease: ease.move });
  tl.tween(refChip, 1, { at: t - 2.3, dur: 0.5, ease: ease.pop });
  tl.tween(arcU, 1, { at: t - 1.7, dur: 1.0, ease: ease.move });
  tl.set(tokU, 1, t - 0.65);
  tl.tween(tokU, 3, { at: t - 0.5, dur: 1.5, ease: ease.move });
  tl.tween(verifiedU, 1, { at: t + 1.1, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 1.9);

  /* beat 5 — statuses live in readme frontmatter; the queue regenerates */
  t = tl.caption({ at: t, dur: 5.8, text: 'Every status change: build_queue.py regenerates QUEUE.md, then commit.' });
  tl.tween(rowE, 1, { at: t - 5.4, dur: 1.2, ease: ease.enter });
  tl.tween(flowU, 1, { at: t - 3.8, dur: 2.2, ease: ease.linear });
  tl.tween(commitU, 1, { at: t - 1.3, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* beat 6 — the project itself can stop, loudly */
  t = tl.caption({ at: t, dur: 6.4, text: 'building · complete · paused · invalid_loop — the loud stop for a human.' });
  tl.tween(gB, 0.14, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(stateU, 4, { at: t - 5.2, dur: 2.2, ease: ease.enter });
  tl.tween(invalidU, 1, { at: t - 2.6, dur: 0.6, ease: ease.pop });
  tl.tween(noteU, 1, { at: t - 1.7, dur: 0.6, ease: ease.enter });
  tl.hold(t, 1.6);

  return {
    tl,
    claimE, claimT, claimStamp, gA,
    stripR, stripU, evChipU, evStamp,
    criticE, arrowU, atk1U, atk2U,
    railR, tokU, refChip, arcU, verifiedU, gB,
    rowE, flowU, commitU,
    stateU, invalidU, noteU,
  };
}

const scene = buildScene();

/* ------------------------------------------- local subcomponents (pure) */

function Chip({ x, y, text, u, color, size = 12 }: { x: number; y: number; text: string; u: number; color: string; size?: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * size * 0.62 + 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={color} fontSize={size} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** Rotated rubber stamp — the doctrine's verdict on a thing. */
function Stamp({ x, y, text, u, color }: { x: number; y: number; text: string; u: number; color: string }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * 9.5 + 26;
  const k = 1.5 - 0.5 * uu; // lands with a thump
  return (
    <g transform={`translate(${x}, ${y}) rotate(-7) scale(${k})`} opacity={uu}>
      <rect x={-w / 2} y={-16} width={w} height={32} rx={5} fill="none" stroke={color} strokeWidth={2.5} />
      <text y={5.5} textAnchor="middle" fill={color} fontSize={15} fontWeight={800} fontFamily={mono} letterSpacing={2}>
        {text}
      </text>
    </g>
  );
}

/** The task lifecycle as a rail of status chips with a refuted return arc. */
function LifecycleRail({ reveal, tok, refChipU, arcU, verifiedU, dim }: { reveal: number; tok: number; refChipU: number; arcU: number; verifiedU: number; dim: number }) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const { x, y, w } = RAIL;
  const cx = (i: number) => x + (w / 3) * i;
  const alpha = 1 - 0.86 * clamp01(dim);
  const aU = clamp01(arcU);
  const onArc = aU > 0 && aU < 1;
  // quadratic bezier: implemented (idx 2) dips down and returns to in-progress (idx 1)
  const q = 1 - aU;
  const arcX = q * q * cx(2) + 2 * q * aU * ((cx(2) + cx(1)) / 2) + aU * aU * cx(1);
  const arcY = q * q * y + 2 * q * aU * (y + 110) + aU * aU * y;
  return (
    <g opacity={alpha}>
      <line x1={x} y1={y} x2={x + w * rv} y2={y} stroke={colors.GRID} strokeWidth={2} strokeLinecap="round" />
      {STATUSES.map((st, i) => {
        const su = clamp01(rv * 5 - (i + 1));
        const lit = tok >= i - 0.02 ? 1 : 0.5;
        return (
          <g key={st.label} opacity={su * lit} transform={`translate(${cx(i)}, ${y})`}>
            <rect x={-62} y={-15} width={124} height={30} rx={15} fill={colors.PANEL} stroke={st.color} strokeWidth={i === 3 && verifiedU > 0 ? 2.4 : 1.4} />
            <text y={4.5} textAnchor="middle" fill={st.color} fontSize={12.5} fontWeight={700} fontFamily={mono}>
              {st.label}
            </text>
            {i === 3 && verifiedU > 0 && (
              <circle r={26 + 10 * clamp01(verifiedU)} fill="none" stroke={st.color} strokeWidth={1.4} opacity={(1 - clamp01(verifiedU)) * 0.9 + 0.1} />
            )}
          </g>
        );
      })}
      {refChipU > 0 && (
        <Chip x={(cx(1) + cx(2)) / 2} y={y + 78} text="refuted → rework" u={refChipU} color={colors.NEGATIVE} />
      )}
      {onArc && (
        <path d={`M ${cx(2)} ${y} Q ${(cx(2) + cx(1)) / 2} ${y + 110} ${cx(1)} ${y}`} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.8} />
      )}
      {(onArc || (tok >= 0 && tok <= 3.01)) && (
        <circle cx={onArc ? arcX : cx(0) + (w / 3) * Math.min(3, Math.max(0, tok))} cy={onArc ? arcY : y} r={7} fill={onArc ? colors.NEGATIVE : colors.ACCENT} />
      )}
      <text x={cx(3)} y={y - 34} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={clamp01(rv * 2 - 1)}>
        only the critic sets this
      </text>
    </g>
  );
}

function PanelBox({ x, y, w, h, u, title, color, children }: { x: number; y: number; w: number; h: number; u: number; title: string; color: string; children?: ReactNode }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 14})`} opacity={uu}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={16} y={26} fill={color} fontSize={14} fontWeight={700} fontFamily={mono}>
        {title}
      </text>
      {children}
    </g>
  );
}

/* --------------------------------- render (pure function of SceneState) */

export function Render({ s }: { s: SceneState }) {
  const gA = clamp01(s.get(scene.gA));
  const gB = clamp01(s.get(scene.gB));
  const dimA = 1 - gA;
  const dimB = 1 - gB;
  const flow = clamp01(s.get(scene.flowU));
  const rowE = clamp01(s.get(scene.rowE));
  const stateN = s.get(scene.stateU);
  const invalid = clamp01(s.get(scene.invalidU));

  // beat-5 packet: readme → build_queue.py → QUEUE.md along one horizontal run
  const px = FLOW.readme.x + FLOW.readme.w + (FLOW.queue.x - FLOW.readme.x - FLOW.readme.w) * flow;

  return (
    <>
      {/* ——— beats 0–3: the claim, the evidence, the critic ——— */}
      <g opacity={gA}>
        <MessageCard x={CLAIM.x} y={CLAIM.y} w={CLAIM.w} role="assistant" text={CLAIM_TEXT} u={s.get(scene.claimT)} enter={s.get(scene.claimE)} />
        <Stamp x={CLAIM.x + CLAIM.w - 90} y={CLAIM.y + 24} text="A CLAIM" u={s.get(scene.claimStamp)} color={colors.WARM} />

        <RecordingStrip x={STRIP.x} y={STRIP.y} w={STRIP.w} points={POINTS} reveal={s.get(scene.stripR)} u={s.get(scene.stripU)} title="the recorded happy run" />
        <Chip x={EVCHIP.x + 218} y={EVCHIP.y + 34} text="evidence/e0-t12-final.jsonl · digest 4f21…" u={s.get(scene.evChipU)} color={colors.TEAL} size={11.5} />
        <Stamp x={STRIP.x + STRIP.w - 60} y={STRIP.y - 26} text="EVIDENCE" u={s.get(scene.evStamp)} color={colors.POSITIVE} />

        {/* the critic: a fresh session, aimed at the recording */}
        <PanelBox x={CRITIC.x} y={CRITIC.y} w={CRITIC.w} h={CRITIC.h} u={s.get(scene.criticE)} title="Critic" color={colors.NEGATIVE}>
          <text x={16} y={50} fill={colors.MUTED} fontSize={12.5}>
            a fresh session — never the one that implemented
          </text>
          <Chip x={90} y={88} text="read-only" u={s.get(scene.criticE)} color={colors.MUTED} />
          <Chip x={244} y={88} text="does not fix code" u={s.get(scene.criticE)} color={colors.MUTED} />
          <Chip x={390} y={88} text="goal: refute" u={s.get(scene.criticE)} color={colors.NEGATIVE} />
          <text x={16} y={128} fill={colors.MUTED} fontSize={12} fontStyle="italic">
            “here is the session where it worked — interrogate it”
          </text>
        </PanelBox>
        {(() => {
          const a = clamp01(s.get(scene.arrowU));
          if (a <= 0) return null;
          const x0 = CRITIC.x + 10;
          const y0 = CRITIC.y + CRITIC.h + 10;
          const x1 = STRIP.x + STRIP.w + 44;
          const y1 = STRIP.y + 8;
          const xm = x0 + (x1 - x0) * a;
          const ym = y0 + (y1 - y0) * a;
          return (
            <g>
              <line x1={x0} y1={y0} x2={xm} y2={ym} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="6 5" opacity={0.85} />
              {a >= 0.98 && <text x={x1 - 6} y={y1 + 18} fill={colors.NEGATIVE} fontSize={11.5} fontFamily={mono}>interrogate ↘</text>}
            </g>
          );
        })()}

        {/* the two attack directions */}
        <PanelBox x={ATK.x} y={ATK.y} w={ATK.w} h={ATK.h} u={s.get(scene.atk1U)} title="1 · FALSIFICATION" color={colors.NEGATIVE}>
          <text x={16} y={50} fill={colors.TEXT} fontSize={12.5}>
            find one point where the program contradicts the claim
          </text>
        </PanelBox>
        <PanelBox x={ATK.x} y={ATK.y + ATK.h + ATK.gap} w={ATK.w} h={ATK.h} u={s.get(scene.atk2U)} title="2 · SUFFICIENCY" color={colors.WARM}>
          <text x={16} y={50} fill={colors.TEXT} fontSize={12.5}>
            find changed code the evidence never exercised — unproven, or dead
          </text>
        </PanelBox>
      </g>

      {/* ——— beat 4: the task lifecycle ——— */}
      <LifecycleRail
        reveal={s.get(scene.railR)}
        tok={s.get(scene.tokU)}
        refChipU={s.get(scene.refChip)}
        arcU={s.get(scene.arcU)}
        verifiedU={s.get(scene.verifiedU)}
        dim={dimB}
      />

      {/* ——— beat 5: readme frontmatter → build_queue.py → QUEUE.md ——— */}
      <g opacity={1 - 0.86 * dimB}>
        <PanelBox x={FLOW.readme.x} y={FLOW.readme.y} w={FLOW.readme.w} h={FLOW.readme.h} u={rowE} title="E0-T12/readme.md" color={colors.ACCENT}>
          <text x={16} y={52} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
            status: implemented
          </text>
          <text x={16} y={74} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
            depends_on: [E0-T11] ✓
          </text>
        </PanelBox>
        <Chip x={FLOW.script.x + 60} y={FLOW.script.y + 16} text="python3 tools/build_queue.py" u={clamp01(rowE * 2 - 0.6)} color={colors.SECONDARY} size={11.5} />
        <PanelBox x={FLOW.queue.x} y={FLOW.queue.y} w={FLOW.queue.w} h={FLOW.queue.h} u={clamp01(rowE * 2 - 1)} title="QUEUE.md" color={colors.SECONDARY}>
          <text x={16} y={52} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
            Next up: E0-T13 …
          </text>
          <text x={16} y={74} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
            one task in-flight at a time
          </text>
        </PanelBox>
        {flow > 0.001 && flow < 0.999 && (
          <circle cx={px} cy={FLOW.readme.y + 48} r={6} fill={colors.SECONDARY} />
        )}
        <Chip x={FLOW.queue.x + FLOW.queue.w - 50} y={FLOW.queue.y - 22} text="commit" u={s.get(scene.commitU)} color={colors.POSITIVE} />
      </g>

      {/* ——— beat 6: the four project states ——— */}
      {stateN > 0 && (
        <g>
          <text x={640} y={STATES.y - 62} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={mono} opacity={clamp01(stateN)}>
            .eforest/project.json — status:
          </text>
          {PROJECT_STATES.map((ps, i) => {
            const u = clamp01(stateN - i);
            const isInvalid = i === 3;
            const pulse = isInvalid ? invalid : 0;
            return (
              <g key={ps.label} transform={`translate(${STATES.xs[i]}, ${STATES.y}) scale(${1 + 0.14 * pulse})`} opacity={u}>
                <rect x={-88} y={-19} width={176} height={38} rx={19} fill={colors.PANEL} stroke={ps.color} strokeWidth={isInvalid && invalid > 0 ? 2.6 : 1.5} />
                <text y={5} textAnchor="middle" fill={ps.color} fontSize={14} fontWeight={700} fontFamily={mono}>
                  {ps.label}
                </text>
                {isInvalid && invalid > 0 && (
                  <circle r={34 + 14 * invalid} fill="none" stroke={ps.color} strokeWidth={1.4} opacity={(1 - invalid) * 0.9} />
                )}
              </g>
            );
          })}
          <text x={640} y={STATES.y + 52} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5} fontStyle="italic" opacity={clamp01(s.get(scene.noteU))}>
            a loud stop for a human — never route around it
          </text>
        </g>
      )}
    </>
  );
}

// registry adapter — steps embed this via viz { scene: 'books/builder-critic-loop/chapter-1', beat: i }
export const vizScene = () => scene;
