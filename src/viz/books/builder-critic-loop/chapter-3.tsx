// Book scene — builder-critic-loop, chapter 3: "The Critic's Gauntlet".
// Seven beats: the claim card faces the evidence gate (0); a cold clone in a
// scrubbed scratch zone (1); falsification + the DiffLanes sufficiency audit
// (2); the sabotage mutant that MUST turn the check red (3); report-only
// findings converging on a fresh judge (4); the three-way verdict (5); and
// the retry budget flipping the whole project to invalid_loop (6).
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, ServiceNode, Zone } from '../../primitives';
import { DiffLanes } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const CLAIM = { x: 40, y: 80, w: 260, h: 150 };
const COLDZONE = { x: 40, y: 300, w: 300, h: 170 };
const SCRUBBED = ['NODE_OPTIONS', 'NODE_ENV', 'npm_config_*'];

const DIFF = { x: 390, y: 80, w: 400 };
const HUNKS = [
  { label: 'streamfs/src/fs.ts · merge()', kind: 'executed' as const, hits: 12 },
  { label: 'streamfs/src/branch.ts · fork', kind: 'executed' as const, hits: 7 },
  { label: 'cli/src/replay-command.ts', kind: 'needs-proof' as const, hits: 0 },
  { label: 'streamfs/src/tree.ts · sort', kind: 'dead' as const, hits: 0 },
];

const SABOTAGE = { x: 390, y: 348, w: 400, h: 120 };

const JUDGE = { x: 1010, y: 250 };
const VERDICTS = ['verified', 'refuted', 'needs-evidence'];
const VERDICT_BOX = { x: 880, y: 360, w: 280 };

const CRITIC_PORTS = [
  { x: CLAIM.x + CLAIM.w, y: CLAIM.y + 60 }, // falsify/coverage side
  { x: COLDZONE.x + COLDZONE.w, y: COLDZONE.y + 70 }, // cold clone
  { x: DIFF.x + DIFF.w, y: DIFF.y + 100 }, // coverage
  { x: SABOTAGE.x + SABOTAGE.w, y: SABOTAGE.y + 60 }, // sabotage
];

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const claimU = tl.channel('claimU', 0);
  const gateStampU = tl.channel('gateStampU', 0);

  const coldU = tl.channel('coldU', 0);
  const scrubU = tl.channel('scrubU', 0);
  const coldGreenU = tl.channel('coldGreenU', 0);

  const diffU = tl.channel('diffU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const hitsU = tl.channel('hitsU', 0);
  const classU = tl.channel('classU', 0);
  const predU = tl.channel('predU', 0);

  const sabU = tl.channel('sabU', 0);
  const mutantU = tl.channel('mutantU', 0);
  const redU = tl.channel('redU', 0);

  const judgeU = tl.channel('judgeU', 0);
  const findingsU = tl.channel('findingsU', 0);
  const xchecksU = tl.channel('xchecksU', 0);

  const verdictU = tl.channel('verdictU', 0);
  const pickV = tl.channel('pickV', 0);

  const retryU = tl.channel('retryU', 0);
  const invalidU = tl.channel('invalidU', 0);

  // BEAT 0 — the evidence gate: no citation, no reading
  tl.caption({ at: 0.4, dur: 4.5, text: 'No recording URL and no digest? needs-evidence — before reading code.' });
  tl.tween(claimU, 1, { at: 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(gateStampU, 1, { at: 2.2, dur: 0.5, ease: ease.pop });
  tl.hold(4.4, 0.8);

  // BEAT 1 — cold-clone first: pristine HEAD, scrubbed env
  tl.caption({ at: 5.6, dur: 4.5, text: 'Never the builder’s tree: cold_clone.sh, pristine HEAD, scrubbed env.' });
  tl.tween(coldU, 1, { at: 5.8, dur: 1.0, ease: ease.draw });
  tl.tween(scrubU, 1, { at: 7.0, dur: 1.4, ease: ease.linear });
  tl.tween(coldGreenU, 1, { at: 8.8, dur: 0.5, ease: ease.pop });
  tl.hold(9.8, 0.8);

  // BEAT 2 — falsify + sufficiency: the diff held against the recording
  tl.caption({ at: 11.0, dur: 4.5, text: 'Falsify the claim; classify every hunk — unexecuted is unproven or dead.' });
  tl.tween(predU, 1, { at: 11.2, dur: 0.6, ease: ease.enter });
  tl.tween(diffU, 1, { at: 11.6, dur: 0.7, ease: ease.enter });
  tl.tween(rowsU, 1, { at: 12.2, dur: 1.4, ease: ease.linear });
  tl.tween(hitsU, 1, { at: 13.6, dur: 1.4, ease: ease.linear });
  tl.tween(classU, 1, { at: 15.0, dur: 1.2, ease: ease.linear });
  tl.hold(16.8, 0.8);

  // BEAT 3 — sabotage: break the code; the check MUST go red
  tl.caption({ at: 18.0, dur: 4.5, text: 'Break an acceptance criterion — a mutant that stays green refutes the check.' });
  tl.tween(sabU, 1, { at: 18.2, dur: 0.7, ease: ease.enter });
  tl.tween(mutantU, 1, { at: 19.0, dur: 1.0, ease: ease.linear });
  tl.tween(redU, 1, { at: 20.4, dur: 0.5, ease: ease.pop });
  tl.hold(22.6, 0.8);

  // BEAT 4 — report-only findings converge on a fresh judge
  tl.caption({ at: 23.8, dur: 4.5, text: 'Critics are report-only; a refutation is also a claim — cross-examined.' });
  tl.tween(judgeU, 1, { at: 24.0, dur: 0.6, ease: ease.enter });
  tl.tween(findingsU, 1, { at: 24.8, dur: 1.8, ease: ease.linear });
  tl.tween(xchecksU, 1, { at: 26.8, dur: 0.6, ease: ease.enter });
  tl.hold(28.4, 0.8);

  // BEAT 5 — the verdict: verified | refuted | needs-evidence
  tl.caption({ at: 29.6, dur: 4.5, text: 'One verdict — verified · refuted · needs-evidence — and the status flips.' });
  tl.tween(verdictU, 1, { at: 29.8, dur: 0.8, ease: ease.enter });
  tl.tween(pickV, 1, { at: 31.2, dur: 0.5, ease: ease.pop });
  tl.hold(34.0, 0.8);

  // BEAT 6 — refuted past the retry budget: invalid_loop, a loud halt
  tl.caption({ at: 35.2, dur: 5.0, text: 'Refuted past the retry budget → project: invalid_loop. Halt, loudly.' });
  tl.tween(retryU, 1, { at: 35.4, dur: 1.6, ease: ease.linear });
  tl.tween(invalidU, 1, { at: 37.4, dur: 0.6, ease: ease.pop });
  tl.hold(40.0, 1.4);

  return {
    tl,
    claimU,
    gateStampU,
    coldU,
    scrubU,
    coldGreenU,
    diffU,
    rowsU,
    hitsU,
    classU,
    predU,
    sabU,
    mutantU,
    redU,
    judgeU,
    findingsU,
    xchecksU,
    verdictU,
    pickV,
    retryU,
    invalidU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

function ClaimCard({ u, stamp }: { u: number; stamp: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = CLAIM;
  const st = clamp01(stamp);
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={16} y={26} fill={colors.MUTED} fontSize={13}>the claim</text>
      <text x={16} y={52} fontSize={12} fontFamily={mono} fill={colors.TEXT}>diff · commit 684e1f6</text>
      <text x={16} y={74} fontSize={12} fontFamily={mono} fill={colors.TEXT}>evidence/e1-t09.jsonl ✓</text>
      <text x={16} y={96} fontSize={12} fontFamily={mono} fill={colors.TEXT}>replay …?point=&lt;p&gt; ✓</text>
      <g opacity={st} transform={`translate(${w / 2}, ${h - 26}) rotate(-4)`}>
        <rect x={-108} y={-15} width={216} height={30} rx={6} fill="none" stroke={colors.WARM} strokeWidth={1.6} />
        <text y={5} textAnchor="middle" fontSize={12} fontFamily={mono} fill={colors.WARM} fontWeight={700}>
          cite it — or needs-evidence
        </text>
      </g>
    </g>
  );
}

function ColdClone({ u, scrub, green }: { u: number; scrub: number; green: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = COLDZONE;
  const sc = clamp01(scrub);
  return (
    <g opacity={e}>
      <Zone x={x} y={y} w={w} h={h} label="cold_clone.sh — scratch dir" kind="group" u={e} />
      <text x={x + 18} y={y + 46} fontSize={12} fontFamily={mono} fill={colors.TEXT} opacity={e}>
        git clone HEAD → /tmp/tmp.Qgd3…
      </text>
      {SCRUBBED.map((v, i) => {
        const su = clamp01(sc * SCRUBBED.length - i);
        if (su <= 0) return null;
        return (
          <g key={v} opacity={su}>
            <text x={x + 18} y={y + 74 + i * 22} fontSize={12} fontFamily={mono} fill={colors.MUTED}>
              {v}
            </text>
            <line x1={x + 16} y1={y + 70 + i * 22} x2={x + 16 + v.length * 7.4} y2={y + 70 + i * 22} stroke={colors.NEGATIVE} strokeWidth={1.6} opacity={su} />
            <text x={x + 140} y={y + 74 + i * 22} fontSize={11.5} fontFamily={mono} fill={colors.NEGATIVE} opacity={su}>
              scrubbed
            </text>
          </g>
        );
      })}
      {green > 0 && (
        <text x={x + w - 18} y={y + h - 16} textAnchor="end" fontSize={12.5} fontFamily={mono} fill={colors.POSITIVE} fontWeight={700} opacity={clamp01(green)}>
          a green here is a real green ✓
        </text>
      )}
    </g>
  );
}

/** Falsification mini-card: predict before you look. */
function Prediction({ u }: { u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const x = CLAIM.x;
  const y = CLAIM.y + CLAIM.h + 12;
  return (
    <g opacity={e} transform={`translate(${x}, ${y})`}>
      <text fontSize={11.5} fill={colors.MUTED}>
        falsification: find one point where the program
        <tspan x={0} dy={15}>contradicts the claim (Replay MCP, point links)</tspan>
      </text>
    </g>
  );
}

function SabotagePanel({ u, mutant, red }: { u: number; mutant: number; red: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = SABOTAGE;
  const m = clamp01(mutant);
  const r = clamp01(red);
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={r > 0 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.5} />
      <text x={16} y={26} fill={colors.MUTED} fontSize={13}>
        sabotage — scratch branch
      </text>
      {m > 0 && (
        <text x={16} y={54} fontSize={12.5} fontFamily={mono} fill={colors.TEXT} opacity={m}>
          <tspan fill={colors.NEGATIVE}>-</tspan> if (target.at(forkOffset)) merge()
        </text>
      )}
      {m > 0.5 && (
        <text x={16} y={76} fontSize={12.5} fontFamily={mono} fill={colors.TEXT} opacity={clamp01(m * 2 - 1)}>
          <tspan fill={colors.POSITIVE}>+</tspan> merge() {'/*'} unconditionally {'*/'}
        </text>
      )}
      {r > 0 && (
        <text x={w - 16} y={h - 16} textAnchor="end" fontSize={13} fontFamily={mono} fill={colors.NEGATIVE} fontWeight={700} opacity={r}>
          verify-E1-T09 → RED ✓ (as it must)
        </text>
      )}
    </g>
  );
}

function VerdictRow({ u, pick, invalid }: { u: number; pick: number; invalid: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w } = VERDICT_BOX;
  const each = w / VERDICTS.length;
  const COLOR = [colors.POSITIVE, colors.NEGATIVE, colors.WARM];
  return (
    <g opacity={e}>
      {VERDICTS.map((v, i) => {
        const vu = clamp01(e * VERDICTS.length - i);
        if (vu <= 0) return null;
        const picked = i === 0 ? clamp01(pick) * (1 - clamp01(invalid)) : i === 1 ? clamp01(invalid) : 0;
        return (
          <g key={v} transform={`translate(${x + i * each}, ${y})`} opacity={vu}>
            <rect width={each - 10} height={36} rx={9} fill={colors.PANEL} stroke={COLOR[i]} strokeWidth={1.4 + 1.2 * picked} opacity={0.5 + 0.5 * (picked > 0 ? 1 : 0.6)} />
            <text x={(each - 10) / 2} y={23} textAnchor="middle" fontSize={11.5} fontFamily={mono} fill={COLOR[i]} fontWeight={picked > 0 ? 700 : 400}>
              {v}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** A report-only finding packet flying to the judge. */
function FindingPacket({ from, u, delayFrac }: { from: { x: number; y: number }; u: number; delayFrac: number }) {
  const uu = clamp01((clamp01(u) - delayFrac) / (1 - delayFrac));
  if (uu <= 0 || uu >= 1) return null;
  const to = { x: JUDGE.x - 62, y: JUDGE.y };
  const px = from.x + (to.x - from.x) * uu;
  const py = from.y + (to.y - from.y) * uu - Math.sin(uu * Math.PI) * 26;
  return (
    <g transform={`translate(${px}, ${py})`}>
      <circle r={6} fill={colors.NEGATIVE} opacity={0.9} />
      <text x={10} y={4} fontSize={10} fontFamily={mono} fill={colors.MUTED}>
        finding
      </text>
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const findings = s.get(scene.findingsU);
  const retry = clamp01(s.get(scene.retryU));
  const invalid = clamp01(s.get(scene.invalidU));
  return (
    <>
      <ClaimCard u={s.get(scene.claimU)} stamp={s.get(scene.gateStampU)} />
      <Prediction u={s.get(scene.predU)} />
      <ColdClone u={s.get(scene.coldU)} scrub={s.get(scene.scrubU)} green={s.get(scene.coldGreenU)} />

      <DiffLanes
        x={DIFF.x}
        y={DIFF.y}
        w={DIFF.w}
        title="sufficiency — diff vs the recording"
        hunks={HUNKS.map((h, i) => ({
          label: h.label,
          kind: h.kind,
          hits: h.hits * clamp01(s.get(scene.hitsU) * HUNKS.length - i),
          u: clamp01(s.get(scene.rowsU) * HUNKS.length - i),
          classU: clamp01(s.get(scene.classU) * HUNKS.length - i),
        }))}
        dim={1 - clamp01(s.get(scene.diffU))}
      />

      <SabotagePanel u={s.get(scene.sabU)} mutant={s.get(scene.mutantU)} red={s.get(scene.redU)} />

      <ServiceNode {...JUDGE} kind="gateway" label="judge" sublabel="fresh session · xhigh" u={s.get(scene.judgeU)} />
      {CRITIC_PORTS.map((p, i) => (
        <FindingPacket key={i} from={p} u={findings} delayFrac={i * 0.18} />
      ))}
      {clamp01(s.get(scene.xchecksU)) > 0 && (
        <text x={JUDGE.x} y={JUDGE.y + 74} textAnchor="middle" fontSize={11.5} fill={colors.MUTED} opacity={clamp01(s.get(scene.xchecksU))}>
          each finding faces its own skeptic first —
          <tspan x={JUDGE.x} dy={15}>“a refutation is also a claim”</tspan>
        </text>
      )}

      <VerdictRow u={s.get(scene.verdictU)} pick={s.get(scene.pickV)} invalid={invalid} />

      {/* BEAT 6 — the retry budget and the loud halt */}
      {retry > 0 && (
        <g transform={`translate(${VERDICT_BOX.x}, ${VERDICT_BOX.y + 70})`} opacity={retry}>
          {['r1', 'r2', 'r3'].map((r, i) => {
            const ru = clamp01(retry * 3 - i);
            if (ru <= 0) return null;
            return (
              <g key={r} transform={`translate(${i * 56}, 0)`} opacity={ru}>
                <circle r={14} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} />
                <text y={4} textAnchor="middle" fontSize={11} fontFamily={mono} fill={colors.NEGATIVE}>
                  {r}
                </text>
                <text y={30} textAnchor="middle" fontSize={9.5} fill={colors.MUTED}>
                  refuted
                </text>
              </g>
            );
          })}
          {invalid > 0 && (
            <g transform="translate(196, 0)" opacity={invalid}>
              <rect x={-14} y={-16} width={252} height={32} rx={9} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={112} y={5} textAnchor="middle" fontSize={12.5} fontFamily={mono} fill={colors.NEGATIVE} fontWeight={700}>
                project.json → invalid_loop
              </text>
            </g>
          )}
        </g>
      )}
      {invalid > 0 && (
        <text x={VERDICT_BOX.x + VERDICT_BOX.w / 2} y={VERDICT_BOX.y + 130} textAnchor="middle" fontSize={12} fill={colors.MUTED} opacity={invalid}>
          honest failure beats a dishonest green — halt pending a human
        </text>
      )}
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/builder-critic-loop/chapter-3', beat: i }
export const vizScene = () => scene;
