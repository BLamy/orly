// Explained: Proof or It Didn't Happen — chapter 3: the propose–verify loop.
// A REAL search run at module scope, on the chapter-2 logic: a proposer emits
// candidate proof steps for A ∧ B → B ∧ A, the kernel accepts or rejects each
// one, and accepted steps become state the proposer conditions on. Two
// proposers, 200 seeded searches each (budget 5,000 proposals):
//   uniform (knows nothing): median 417 proposals, 98.5% rejected, 21/200
//     runs exhaust the budget without a proof;
//   a simple state-conditioned policy (the "model"): median 14 proposals,
//     54.7% rejected, 0 failures.
// Same kernel both times — the policy only changes WHAT gets proposed. This
// is the shape published model+kernel theorem-proving systems scale up.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The logic + kernel (chapter 2's, verbatim in spirit) and the search.
// ---------------------------------------------------------------------------

type Form =
  | { k: 'var'; name: string }
  | { k: 'and'; l: Form; r: Form }
  | { k: 'imp'; l: Form; r: Form };
const V = (name: string): Form => ({ k: 'var', name });
const And = (l: Form, r: Form): Form => ({ k: 'and', l, r });
const Imp = (l: Form, r: Form): Form => ({ k: 'imp', l, r });
const eq = (a: Form, b: Form): boolean =>
  a.k === b.k &&
  (a.k === 'var'
    ? a.name === (b as { k: 'var'; name: string }).name
    : eq((a as { l: Form; r: Form }).l, (b as { k: 'and' | 'imp'; l: Form; r: Form }).l) &&
      eq((a as { l: Form; r: Form }).r, (b as { k: 'and' | 'imp'; l: Form; r: Form }).r));

const A = V('A');
const B = V('B');
const AB = And(A, B);
const GOAL = Imp(AB, And(B, A));

interface Judgment { hyps: Form[]; concl: Form }
const key = (f: Form): string =>
  f.k === 'var' ? f.name : f.k === 'and' ? `(${key(f.l)}^${key(f.r)})` : `(${key(f.l)}>${key(f.r)})`;
const jkey = (j: Judgment) => j.hyps.map(key).sort().join(',') + '|-' + key(j.concl);
const depth = (f: Form): number => (f.k === 'var' ? 1 : 1 + Math.max(depth(f.l), depth(f.r)));

type Rule = 'assume' | 'andEL' | 'andER' | 'andI' | 'impI';
function apply(rule: Rule, prems: Judgment[], arg?: Form): Judgment | null {
  if (rule === 'assume') return arg ? { hyps: [arg], concl: arg } : null;
  if (rule === 'andEL') {
    const p = prems[0];
    return p && p.concl.k === 'and' ? { hyps: p.hyps, concl: p.concl.l } : null;
  }
  if (rule === 'andER') {
    const p = prems[0];
    return p && p.concl.k === 'and' ? { hyps: p.hyps, concl: p.concl.r } : null;
  }
  if (rule === 'andI') {
    const [p, q] = prems;
    if (!p || !q) return null;
    const hyps = [...p.hyps, ...q.hyps].filter((h, i, arr) => arr.findIndex((g) => eq(g, h)) === i);
    return { hyps, concl: And(p.concl, q.concl) };
  }
  const p = prems[0];
  return p && arg ? { hyps: p.hyps.filter((h) => !eq(h, arg)), concl: Imp(arg, p.concl) } : null;
}

interface SearchResult { proposals: number; rejects: number; fail?: boolean }
const RULES: Rule[] = ['assume', 'andEL', 'andER', 'andI', 'impI'];

function search(seed: number, guided: boolean, trace?: Array<{ rule: Rule; ok: boolean }>): SearchResult {
  const rand = mulberry32(seed);
  const lines: Judgment[] = [];
  const seen = new Set<string>();
  let proposals = 0;
  let rejects = 0;
  while (proposals < 5000) {
    proposals++;
    const r = rand();
    const uniformPick = () => lines[Math.floor(rand() * lines.length)];
    let rule: Rule = 'assume';
    let j: Judgment | null = null;
    if (!guided || rand() < 0.25) {
      rule = RULES[Math.floor(r * 5)];
      if (rule === 'assume') j = apply('assume', [], AB);
      else if (rule === 'andI') j = lines.length ? apply('andI', [uniformPick(), uniformPick()]) : null;
      else if (rule === 'impI') j = lines.length ? apply('impI', [uniformPick()], AB) : null;
      else j = lines.length ? apply(rule, [uniformPick()]) : null;
    } else {
      const conjs = lines.filter((l) => l.concl.k === 'and');
      const atoms = lines.filter((l) => l.concl.k === 'var');
      const ba = lines.find((l) => eq(l.concl, And(B, A)));
      if (lines.length === 0) { rule = 'assume'; j = apply('assume', [], AB); }
      else if (ba) { rule = 'impI'; j = apply('impI', [ba], AB); }
      else if (atoms.length >= 2 && rand() < 0.6) {
        rule = 'andI';
        j = apply('andI', [atoms[Math.floor(rand() * atoms.length)], atoms[Math.floor(rand() * atoms.length)]]);
      } else if (conjs.length) {
        rule = rand() < 0.5 ? 'andEL' : 'andER';
        j = apply(rule, [conjs[Math.floor(rand() * conjs.length)]]);
      } else { rule = 'assume'; j = apply('assume', [], AB); }
    }
    const ok = !!j && depth(j.concl) <= 3 && !seen.has(jkey(j));
    trace?.push({ rule, ok });
    if (!ok) { rejects++; continue; }
    seen.add(jkey(j!));
    lines.push(j!);
    if (j!.hyps.length === 0 && eq(j!.concl, GOAL)) return { proposals, rejects };
  }
  return { proposals: 5000, rejects, fail: true };
}

function summarize(guided: boolean) {
  const res: SearchResult[] = [];
  for (let s = 0; s < 200; s++) res.push(search(1000 + s, guided));
  const props = res.map((r) => r.proposals).sort((a, b) => a - b);
  return {
    median: props[100],
    rejectPct: (res.reduce((a, r) => a + r.rejects, 0) / res.reduce((a, r) => a + r.proposals, 0)) * 100,
    fails: res.filter((r) => r.fail).length,
    props,
  };
}
const UNIFORM = summarize(false); // median 417, 98.5% rejected, 21 fails
const GUIDED = summarize(true); // median 14, 54.7% rejected, 0 fails

// one illustrative guided trace (seed 1000 → 19 proposals)
const TRACE: Array<{ rule: Rule; ok: boolean }> = [];
search(1000, true, TRACE);

// log-scale histogram of proposals-to-proof, both proposers
const BINS = [1, 3, 10, 30, 100, 300, 1000, 3000, 5001];
const binOf = (p: number) => Math.min(BINS.findIndex((b) => p < b), BINS.length - 2);
const histo = (props: number[]) => {
  const h = new Array(BINS.length - 1).fill(0);
  for (const p of props) h[Math.max(binOf(p), 0)]++;
  return h as number[];
};
const H_UNI = histo(UNIFORM.props);
const H_GUI = histo(GUIDED.props);
const H_MAX = Math.max(...H_UNI, ...H_GUI);
const BIN_LABELS = ['1–2', '3–9', '10–29', '30–99', '100–299', '300–999', '1k–3k', '3k+'];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const LOOP_Y = 250;
const CAM_LOOP: CameraState = { x: 560, y: 330, k: 1.12 };
const HIST_X = 200;
const HIST_Y = 560;
const HIST_W = 880;
const HIST_H = 150;
const BAR_W = HIST_W / (BINS.length - 1);
const CAM_HIST: CameraState = { x: 640, y: 470, k: 1.18 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  loopU: ChannelRef<number>; // proposer→kernel→state diagram
  traceU: ChannelRef<number>; // the guided trace tape
  statU: ChannelRef<number>; // trace stats
  uniU: ChannelRef<number>; // uniform histogram
  guiU: ChannelRef<number>; // guided histogram
  numsU: ChannelRef<number>; // the medians panel
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const loopU = tl.channel('loopU', 0);
  const traceU = tl.channel('traceU', 0);
  const statU = tl.channel('statU', 0);
  const uniU = tl.channel('uniU', 0);
  const guiU = tl.channel('guiU', 0);
  const numsU = tl.channel('numsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the division of labor
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The kernel from last chapter checks proofs. It cannot find them. Finding a proof is a search problem — and this is where a language model finally enters the story, on the only side of the table where it belongs.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.9,
    dur: 5.4,
    text: 'The loop has two roles. A proposer suggests the next proof step — any step, however wild. The kernel accepts or rejects it. Accepted steps pile up as state, and the proposer conditions on that state to suggest the next one.',
  });
  tl.tween(cam, CAM_LOOP, { at: 7.2, dur: 1.3, ease: ease.move });
  tl.tween(loopU, 1, { at: 7.8, dur: 1.4, ease: ease.draw });
  tl.hold(12.3, 0.6);

  // Beat 2 — run it blind
  tl.caption({
    at: 12.9,
    dur: 6.0,
    text: 'First, run it with a proposer that knows nothing — uniformly random steps, on the same little theorem from last chapter. Two hundred seeded searches, each allowed five thousand proposals. The median search needs four hundred seventeen proposals, and the kernel rejects ninety eight and a half percent of everything it is shown.',
  });
  tl.tween(uniU, 1, { at: 14.4, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_HIST, { at: 13.4, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 19.5,
    dur: 4.8,
    text: 'And twenty one of the two hundred runs never find the proof at all — the budget runs out first. Random search drowns in a five rule logic. Real mathematics is astronomically wider.',
  });
  tl.hold(24.3, 0.6);

  // Beat 3 — give the proposer a policy
  tl.caption({
    at: 24.9,
    dur: 6.0,
    text: 'Now swap in a proposer with a policy — here, a handful of rules conditioned on the state; in the published systems, a trained model. Same kernel, same theorem, same budget. The median search drops from four hundred seventeen proposals to fourteen.',
  });
  tl.tween(guiU, 1, { at: 26.2, dur: 1.8, ease: ease.draw });
  tl.tween(numsU, 1, { at: 29.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 31.5,
    dur: 5.2,
    text: 'The rejection rate falls to about fifty five percent, and not one of the two hundred runs fails. The policy did not change what counts as a proof — it changed what gets tried.',
  });
  tl.hold(36.7, 0.6);

  // Beat 4 — one search, up close
  tl.caption({
    at: 37.3,
    dur: 5.8,
    text: 'Watch one guided search up close. Each tile is a proposal; red means the kernel said no. Rejections are not failures of the system — they are the system. Every no is free, because the kernel is cheap and never wrong.',
  });
  tl.tween(cam, CAM_LOOP, { at: 37.6, dur: 1.3, ease: ease.move });
  tl.tween(traceU, 1, { at: 38.4, dur: 3.2, ease: ease.linear });
  tl.tween(statU, 1, { at: 42.0, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 43.5,
    dur: 5.4,
    text: 'This is the architecture behind the machine proofs making headlines: a model proposes steps in a formal language, a kernel disposes, and search glues them together. The model can hallucinate freely — hallucinations bounce off.',
  });
  tl.hold(48.9, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 49.5,
    dur: 5.8,
    text: 'Compare this with every other use of a language model on this shelf. Usually the model’s fluency is the risk. Here fluency is pure upside, because a different machine owns the truth. Generation and verification, finally in their right jobs.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 49.7, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 50.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.7, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 55.9,
    dur: 4.8,
    text: 'Which raises the question the next chapter answers: what exactly makes the kernel impossible to game — and why can a model judge never give you the same guarantee?',
  });
  tl.hold(60.7, 1.4);

  return { tl, cam, titleU, loopU, traceU, statU, uniU, guiU, numsU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/propose-verify/overrides.json',
  slug: 'propose-verify',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const loopU = s.get(scene.loopU);
  const traceU = s.get(scene.traceU);
  const statU = s.get(scene.statU);
  const uniU = s.get(scene.uniU);
  const guiU = s.get(scene.guiU);
  const numsU = s.get(scene.numsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const nTrace = Math.floor(traceU * TRACE.length);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the loop diagram */}
          {loopU > 0 && (
            <g opacity={loopU}>
              <rect x={150} y={LOOP_Y - 40} width={250} height={86} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.ACCENT} />
              <text x={275} y={LOOP_Y - 6} textAnchor="middle" fill={colors.ACCENT} fontSize={16} fontWeight={700}>
                proposer
              </text>
              <text x={275} y={LOOP_Y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                a model — free to be wrong
              </text>
              <rect x={560} y={LOOP_Y - 40} width={250} height={86} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.SECONDARY} />
              <text x={685} y={LOOP_Y - 6} textAnchor="middle" fill={colors.SECONDARY} fontSize={16} fontWeight={700}>
                kernel
              </text>
              <text x={685} y={LOOP_Y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                reruns the rule — never wrong
              </text>
              <line x1={400} y1={LOOP_Y - 12} x2={552} y2={LOOP_Y - 12} stroke={colors.GRID} strokeWidth={2} markerEnd="none" />
              <text x={476} y={LOOP_Y - 22} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                candidate step →
              </text>
              <line x1={552} y1={LOOP_Y + 16} x2={400} y2={LOOP_Y + 16} stroke={colors.GRID} strokeWidth={2} />
              <text x={476} y={LOOP_Y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                ← accept / reject
              </text>
              <rect x={860} y={LOOP_Y - 40} width={190} height={86} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.POSITIVE} />
              <text x={955} y={LOOP_Y - 6} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={700}>
                proof state
              </text>
              <text x={955} y={LOOP_Y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                accepted lines only
              </text>
              <line x1={810} y1={LOOP_Y - 12} x2={852} y2={LOOP_Y - 12} stroke={colors.POSITIVE} strokeWidth={2} opacity={0.7} />
              <path
                d={`M 955 ${LOOP_Y + 46} C 955 ${LOOP_Y + 110}, 275 ${LOOP_Y + 110}, 275 ${LOOP_Y + 46}`}
                fill="none"
                stroke={colors.GRID}
                strokeWidth={2}
                strokeDasharray="6 5"
              />
              <text x={615} y={LOOP_Y + 104} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                the proposer conditions on the state
              </text>
              <MathLabel tex="\text{goal:}\; A \wedge B \to B \wedge A" x={150} y={130} fontSize={17} color={colors.WARM} opacity={1} />
            </g>
          )}

          {/* the guided trace tape */}
          {traceU > 0 && (
            <g>
              <text x={150} y={LOOP_Y + 158} fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
                one guided search (seed 1000) — {TRACE.length} proposals
              </text>
              {TRACE.map((p, i) => {
                if (i >= nTrace) return null;
                return (
                  <g key={i} transform={`translate(${150 + (i % 20) * 46}, ${LOOP_Y + 176 + Math.floor(i / 20) * 40})`}>
                    <rect width={40} height={32} rx={5} fill={p.ok ? colors.POSITIVE : colors.NEGATIVE} opacity={p.ok ? 0.8 : 0.45} />
                    <text x={20} y={21} textAnchor="middle" fill={colors.BG} fontSize={9.5} fontFamily="monospace" fontWeight={700}>
                      {p.rule === 'assume' ? 'asm' : p.rule === 'andEL' ? '∧eL' : p.rule === 'andER' ? '∧eR' : p.rule === 'andI' ? '∧i' : '→i'}
                    </text>
                  </g>
                );
              })}
              {statU > 0 && (
                <text x={150} y={LOOP_Y + 176 + Math.ceil(TRACE.length / 20) * 40 + 22} fill={colors.WARM} fontSize={13} fontFamily="monospace" fontWeight={700} opacity={statU}>
                  {TRACE.filter((p) => p.ok).length} accepted · {TRACE.filter((p) => !p.ok).length} rejected · proof found ✓
                </text>
              )}
            </g>
          )}

          {/* the histograms */}
          {(uniU > 0 || guiU > 0) && (
            <g>
              <line x1={HIST_X} y1={HIST_Y + HIST_H} x2={HIST_X + HIST_W} y2={HIST_Y + HIST_H} stroke={colors.GRID} strokeWidth={1.5} opacity={Math.max(uniU, guiU)} />
              {BIN_LABELS.map((L, i) => (
                <text key={L} x={HIST_X + i * BAR_W + BAR_W / 2} y={HIST_Y + HIST_H + 20} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={Math.max(uniU, guiU)}>
                  {L}
                </text>
              ))}
              <text x={HIST_X + HIST_W / 2} y={HIST_Y + HIST_H + 40} textAnchor="middle" fill={colors.MUTED} fontSize={11} opacity={Math.max(uniU, guiU)}>
                proposals until the kernel accepts a complete proof (200 seeded searches each)
              </text>
              {H_UNI.map((v, i) => {
                const h = (v / H_MAX) * (HIST_H - 14) * uniU;
                return (
                  <rect key={`u${i}`} x={HIST_X + i * BAR_W + 4} y={HIST_Y + HIST_H - h} width={BAR_W / 2 - 6} height={h} fill={colors.NEGATIVE} opacity={0.75} />
                );
              })}
              {H_GUI.map((v, i) => {
                const h = (v / H_MAX) * (HIST_H - 14) * guiU;
                return (
                  <rect key={`g${i}`} x={HIST_X + i * BAR_W + BAR_W / 2 + 2} y={HIST_Y + HIST_H - h} width={BAR_W / 2 - 6} height={h} fill={colors.POSITIVE} opacity={0.85} />
                );
              })}
              <g opacity={uniU}>
                <rect x={HIST_X} y={HIST_Y - 32} width={12} height={12} fill={colors.NEGATIVE} opacity={0.75} />
                <text x={HIST_X + 20} y={HIST_Y - 21} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                  uniform proposer
                </text>
              </g>
              <g opacity={guiU}>
                <rect x={HIST_X + 220} y={HIST_Y - 32} width={12} height={12} fill={colors.POSITIVE} opacity={0.85} />
                <text x={HIST_X + 240} y={HIST_Y - 21} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                  state-conditioned proposer
                </text>
              </g>
            </g>
          )}
        </Camera>
      </g>

      {/* the numbers — screen space */}
      {numsU > 0 && (
        <g opacity={numsU * mainOp * (1 - 0.85 * clamp01(traceU * 3))}>
          <rect x={880} y={96} width={368} height={130} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={904} y={126} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            computed, 200 runs each
          </text>
          <text x={904} y={152} fill={colors.NEGATIVE} fontSize={12.5} fontFamily="monospace">
            uniform: median {UNIFORM.median} · {UNIFORM.rejectPct.toFixed(1)}% rejected · {UNIFORM.fails} DNF
          </text>
          <text x={904} y={176} fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace">
            policy:  median {GUIDED.median} · {GUIDED.rejectPct.toFixed(1)}% rejected · {GUIDED.fails} DNF
          </text>
          <text x={904} y={202} fill={colors.MUTED} fontSize={11.5}>
            same kernel, same theorem, same budget
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Propose, check, retry
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={268} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The model proposes. The kernel disposes.
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            uniform: median {UNIFORM.median} proposals, {UNIFORM.fails} never finish · policy: median {GUIDED.median}, all finish
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            fluency becomes pure upside when a different machine owns the truth
          </text>
          <text x={640} y={404} textAnchor="middle" fill={colors.WARM} fontSize={14.5}>
            next: why the kernel cannot be charmed
          </text>
        </g>
      )}
    </>
  );
}

export function ProposeVerify() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
