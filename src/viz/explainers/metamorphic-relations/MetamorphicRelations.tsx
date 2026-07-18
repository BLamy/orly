// Explained: Testing Without an Oracle — chapter 3: metamorphic relations.
// A toy sentiment model with real (planted, realistic) defects — the first
// word counts double, and "neutral" filler words carry small learned
// weights — tested at module scope with three metamorphic relations over
// 1,000 seeded sentences. No relation needs to know the RIGHT label; each
// compares the model with itself across a transformation that shouldn't
// change the answer:
//   permutation (shuffle the words):     110/1000 labels flip (11.0%)
//   synonym swap (equal-sentiment word):  31/842 applicable flip (3.7%)
//   append 3 filler words:                23/1000 flip (2.3%)
// Every violation is an oracle-free bug report, and each rate points at the
// specific defect that causes it.
import {
  CAMERA_HOME,
  Camera,
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
// The toy model + the three relations, measured for real.
// ---------------------------------------------------------------------------

const W: Record<string, number> = {
  great: 2, good: 1.4, fine: 1.1, love: 2.2, nice: 1.2, okay: 0.3,
  bad: -1.4, poor: -1.2, awful: -2.1, hate: -2.3, slow: -0.8, broken: -1.6,
  the: 0.03, a: -0.02, it: -0.04, was: -0.05, very: 0.08, really: 0.06,
  quite: -0.03, product: 0.02, service: -0.06, delivery: -0.04,
};
const VOCAB = Object.keys(W);
const SENT = VOCAB.filter((w) => Math.abs(W[w]) >= 0.3);
const NEUT = VOCAB.filter((w) => Math.abs(W[w]) < 0.3);
// the model: first word counts DOUBLE (defect 1); fillers have small learned
// weights (defect 2); score normalized by sqrt length.
const score = (ws: string[]) =>
  ws.reduce((a, w, i) => a + W[w] * (i === 0 ? 2 : 1), 0) / Math.sqrt(ws.length);
const label = (ws: string[]) => (score(ws) >= 0 ? 'pos' : 'neg');
const SYN: Record<string, string> = {
  good: 'fine', fine: 'good', bad: 'poor', poor: 'bad',
  great: 'love', love: 'great', awful: 'hate', hate: 'awful',
};

const rand = mulberry32(29);
const shuffle = (xs: string[]) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const N = 1000;
let permFlip = 0;
let synFlip = 0;
let synApplicable = 0;
let fillFlip = 0;
interface Example { ws: string[]; perm: string[]; l0: string; l1: string }
let PERM_EXAMPLE: Example | null = null;
for (let i = 0; i < N; i++) {
  const len = 3 + Math.floor(rand() * 6);
  const ws = Array.from({ length: len }, () =>
    rand() < 0.45 ? SENT[Math.floor(rand() * SENT.length)] : NEUT[Math.floor(rand() * NEUT.length)]
  );
  const l0 = label(ws);
  const perm = shuffle(ws);
  if (label(perm) !== l0) {
    permFlip++;
    if (!PERM_EXAMPLE) PERM_EXAMPLE = { ws, perm, l0, l1: label(perm) };
  }
  const idx = ws.findIndex((w) => SYN[w]);
  if (idx >= 0) {
    synApplicable++;
    const ws2 = [...ws];
    ws2[idx] = SYN[ws2[idx]];
    if (label(ws2) !== l0) synFlip++;
  }
  const ws3 = [...ws, NEUT[Math.floor(rand() * NEUT.length)], NEUT[Math.floor(rand() * NEUT.length)], NEUT[Math.floor(rand() * NEUT.length)]];
  if (label(ws3) !== l0) fillFlip++;
}
const EX = PERM_EXAMPLE!;

const RELATIONS = [
  { name: 'permutation', desc: 'shuffle the words — same label expected', flips: permFlip, of: N, cause: 'the first word counts double' },
  { name: 'synonym swap', desc: 'equal-sentiment word swap — same label', flips: synFlip, of: synApplicable, cause: 'idiosyncratic per-word weights' },
  { name: 'add filler', desc: 'append 3 “neutral” words — same label', flips: fillFlip, of: N, cause: 'fillers carry learned weight' },
];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const REL_Y0 = 200;
const REL_DY = 130;
const BAR_MAX = 460;
const CAM_REL: CameraState = { x: 520, y: 380, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  ideaU: ChannelRef<number>; // f(x) vs f(T x) diagram
  relU: ChannelRef<number>; // relation rows
  barU: ChannelRef<number>; // measured violation bars
  exU: ChannelRef<number>; // the concrete flipped pair
  causeU: ChannelRef<number>; // cause chips
  aiU: ChannelRef<number>; // real-systems panel
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const ideaU = tl.channel('ideaU', 0);
  const relU = tl.channel('relU', 0);
  const barU = tl.channel('barU', 0);
  const exU = tl.channel('exU', 0);
  const causeU = tl.channel('causeU', 0);
  const aiU = tl.channel('aiU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the trick
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'When you cannot say what the right answer is, there is still a move left: compare the system with itself. Transform the input in a way that should not change the answer — then check whether the answer changed.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(ideaU, 1, { at: 1.6, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 6.9,
    dur: 4.8,
    text: 'That is a metamorphic relation: a promise between two of the model’s own outputs. No oracle anywhere — the model is graded against its own consistency.',
  });
  tl.hold(11.7, 0.6);

  // Beat 2 — the subject + relations
  tl.caption({
    at: 12.3,
    dur: 5.8,
    text: 'The subject is a toy sentiment model — word weights, a score, a sign. It has two planted defects of a very realistic flavor: the first word of a sentence counts double, and the so called neutral words carry small learned weights.',
  });
  tl.tween(cam, CAM_REL, { at: 12.6, dur: 1.3, ease: ease.move });
  tl.tween(relU, 1, { at: 13.4, dur: 2.6, ease: ease.linear });
  tl.caption({
    at: 18.7,
    dur: 5.4,
    text: 'Three relations, each a sentence about invariance. Shuffling word order should not change the label. Swapping a word for an equal sentiment synonym should not. Appending neutral filler should not.',
  });
  tl.hold(24.1, 0.6);

  // Beat 3 — measure
  tl.caption({
    at: 24.7,
    dur: 5.8,
    text: 'Run one thousand seeded sentences through all three. The permutation relation breaks on one hundred ten of them — eleven percent. Synonym swaps flip thirty one labels of the eight hundred forty two sentences they apply to. Filler flips twenty three.',
  });
  tl.tween(barU, 1, { at: 25.6, dur: 2.4, ease: ease.draw });
  tl.caption({
    at: 31.1,
    dur: 5.2,
    text: 'Here is one violated pair, verbatim. Same words, different order, and the model changes its mind. You did not need to know which label is correct to know that one of these two answers is wrong.',
  });
  tl.tween(exU, 1, { at: 32.2, dur: 0.9, ease: ease.enter });
  tl.hold(36.3, 0.6);

  // Beat 4 — rates point at causes
  tl.caption({
    at: 36.9,
    dur: 5.6,
    text: 'And the violation rates are not just alarms — they localize. The permutation failures implicate anything position dependent, and indeed: the first word counts double. The filler failures implicate the words that were supposed to weigh nothing.',
  });
  tl.tween(causeU, 1, { at: 38.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 42.9,
    dur: 5.6,
    text: 'Swap the toy for a real model and the relations survive the trip. Paraphrase invariance for classifiers. Order invariance for retrieval. Consistency under formatting changes for judges — the evaluation books measured exactly these wobbles in the wild.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 43.1, dur: 1.3, ease: ease.move });
  tl.tween(aiU, 1, { at: 44.2, dur: 0.9, ease: ease.enter });
  tl.hold(48.5, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 49.1,
    dur: 5.4,
    text: 'One thousand sentences, zero labels, three bug reports with causes attached. Consistency is a property you can always afford — the question is only how hard you go looking for the inputs that break it. Which is the next chapter.',
  });
  tl.tween(dimU, 1, { at: 50.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.3, dur: 1.0, ease: ease.enter });
  tl.hold(54.5, 1.4);

  return { tl, cam, titleU, ideaU, relU, barU, exU, causeU, aiU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/metamorphic-relations/overrides.json',
  slug: 'metamorphic-relations',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const ideaU = s.get(scene.ideaU);
  const relU = s.get(scene.relU);
  const barU = s.get(scene.barU);
  const exU = s.get(scene.exU);
  const causeU = s.get(scene.causeU);
  const aiU = s.get(scene.aiU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the idea diagram */}
          {ideaU > 0 && (
            <g opacity={ideaU * (1 - 0.85 * clamp01(relU * 3))}>
              <rect x={280} y={200} width={180} height={56} rx={10} fill={colors.PANEL} opacity={0.95} stroke={colors.ACCENT} />
              <text x={370} y={234} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily="monospace">
                input x
              </text>
              <rect x={280} y={330} width={180} height={56} rx={10} fill={colors.PANEL} opacity={0.95} stroke={colors.SECONDARY} />
              <text x={370} y={364} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontFamily="monospace">
                T(x)
              </text>
              <text x={244} y={302} fill={colors.MUTED} fontSize={12}>
                transform
              </text>
              <rect x={620} y={200} width={200} height={56} rx={10} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
              <text x={720} y={234} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily="monospace">
                model(x)
              </text>
              <rect x={620} y={330} width={200} height={56} rx={10} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
              <text x={720} y={364} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily="monospace">
                model(T(x))
              </text>
              <line x1={460} y1={228} x2={612} y2={228} stroke={colors.GRID} strokeWidth={2} />
              <line x1={460} y1={358} x2={612} y2={358} stroke={colors.GRID} strokeWidth={2} />
              <line x1={370} y1={256} x2={370} y2={322} stroke={colors.SECONDARY} strokeWidth={2} strokeDasharray="6 5" />
              <rect x={880} y={264} width={230} height={60} rx={10} fill={colors.PANEL} opacity={0.95} stroke={colors.WARM} />
              <text x={995} y={289} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={700}>
                must agree
              </text>
              <text x={995} y={310} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                no oracle required
              </text>
              <line x1={820} y1={228} x2={905} y2={272} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={820} y1={358} x2={905} y2={316} stroke={colors.GRID} strokeWidth={1.5} />
            </g>
          )}

          {/* relation rows + bars */}
          {relU > 0 &&
            RELATIONS.map((r, i) => {
              const u = clamp01(relU * RELATIONS.length - i);
              if (u <= 0) return null;
              const y = REL_Y0 + i * REL_DY;
              const pct = (r.flips / r.of) * 100;
              const w = (pct / 12) * BAR_MAX * clamp01(barU * 1.2);
              return (
                <g key={r.name} opacity={u}>
                  <text x={170} y={y} fill={colors.TEXT} fontSize={16} fontWeight={600}>
                    {r.name}
                  </text>
                  <text x={170} y={y + 22} fill={colors.MUTED} fontSize={12}>
                    {r.desc}
                  </text>
                  <rect x={170} y={y + 36} width={BAR_MAX} height={22} rx={5} fill={colors.PANEL} opacity={0.8} />
                  <rect x={170} y={y + 36} width={Math.min(w, BAR_MAX)} height={22} rx={5} fill={colors.NEGATIVE} opacity={0.8} />
                  {barU > 0.4 && (
                    <text x={180 + Math.min(w, BAR_MAX)} y={y + 52} fill={colors.NEGATIVE} fontSize={12.5} fontFamily="monospace" fontWeight={700} opacity={clamp01(barU * 2 - 1)}>
                      {r.flips}/{r.of} flip · {pct.toFixed(1)}%
                    </text>
                  )}
                  {causeU > 0 && (
                    <text x={170 + BAR_MAX + 210} y={y + 52} fill={colors.WARM} fontSize={11.5} fontFamily="monospace" opacity={causeU}>
                      ← {r.cause}
                    </text>
                  )}
                </g>
              );
            })}

          {/* the flipped pair */}
          {exU > 0 && (
            <g opacity={exU}>
              <rect x={170} y={REL_Y0 + 3 * REL_DY - 20} width={780} height={110} rx={10} fill={colors.PANEL} opacity={0.97} stroke={colors.NEGATIVE} />
              <text x={194} y={REL_Y0 + 3 * REL_DY + 8} fill={colors.TEXT} fontSize={13} fontWeight={600}>
                one violated permutation pair, verbatim
              </text>
              <text x={194} y={REL_Y0 + 3 * REL_DY + 34} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
                “{EX.ws.join(' ')}” → {EX.l0 === 'pos' ? 'positive' : 'negative'}
              </text>
              <text x={194} y={REL_Y0 + 3 * REL_DY + 58} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
                “{EX.perm.join(' ')}” → {EX.l1 === 'pos' ? 'positive' : 'negative'}
              </text>
              <text x={194} y={REL_Y0 + 3 * REL_DY + 82} fill={colors.NEGATIVE} fontSize={11.5}>
                same words · different order · different verdict — one of these is wrong, guaranteed
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* real-systems panel — screen space */}
      {aiU > 0 && (
        <g opacity={aiU * mainOp}>
          <rect x={840} y={110} width={400} height={190} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.SECONDARY} />
          <text x={866} y={142} fill={colors.SECONDARY} fontSize={14} fontWeight={700}>
            the same relations, at scale
          </text>
          <text x={866} y={174} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            classifier + paraphrase → same label
          </text>
          <text x={866} y={200} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            retrieval + doc order → same results
          </text>
          <text x={866} y={226} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            judge + formatting → same score
          </text>
          <text x={866} y={258} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            translation round-trip → same meaning
          </text>
          <text x={866} y={286} fill={colors.POSITIVE} fontSize={12}>
            every violation: a bug found without a label
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Metamorphic relations
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Grade the model against itself.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            permutation {permFlip}/{N} · synonym {synFlip}/{synApplicable} · filler {fillFlip}/{N} — measured live
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            a thousand sentences, zero labels, three localized bug reports
          </text>
          <text x={640} y={412} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: hunting the inputs that break consistency — with coverage as the compass
          </text>
        </g>
      )}
    </>
  );
}

export function MetamorphicRelations() {
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
