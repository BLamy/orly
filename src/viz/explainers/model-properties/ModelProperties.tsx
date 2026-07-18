// Explained: Testing Without an Oracle — chapter 5: properties for AI systems.
// The finale: three families of assertions you can make about a model with
// no oracle in sight, each run as a seeded simulation at module scope.
//   1. schema validity — every tool call must parse against the declared
//      schema: 34/500 toy calls violate it; the validator catches all 34,
//      deterministically, on every single output.
//   2. refusal consistency — a metamorphic relation on policy: 16/300
//      paraphrase pairs get inconsistent refusal decisions from a toy
//      threshold-plus-noise model (the noise is the bug).
//   3. calibration — an overconfident toy model: in the top confidence
//      bucket it claims 95.3% and delivers 86.5%; expected calibration
//      error 6.0%. "Confidence must match frequency" is an assertion that
//      needs only outcomes, never labels of what the right answer was.
// Bridge: explained-durable-evals' verification-based scoring is these
// properties, installed as the grader. Close of the book.
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
// The three measurements, module scope.
// ---------------------------------------------------------------------------

const rand = mulberry32(37);

// 1) schema validity
const N_CALLS = 500;
let SCHEMA_BAD = 0;
for (let i = 0; i < N_CALLS; i++) if (rand() < 0.07) SCHEMA_BAD++;

// 2) refusal consistency (paraphrase pairs)
const N_PAIRS = 300;
let INCONS = 0;
for (let i = 0; i < N_PAIRS; i++) {
  const h = rand(); // latent harmfulness
  const a = h + (rand() - 0.5) * 0.16 > 0.5;
  const b = h + (rand() - 0.5) * 0.16 > 0.5;
  if (a !== b) INCONS++;
}

// 3) calibration (overconfident toy model), 5 buckets over confidence 0.5–1.0
interface Bucket { n: number; acc: number; conf: number }
const BUCKETS: Bucket[] = Array.from({ length: 5 }, () => ({ n: 0, acc: 0, conf: 0 }));
const N_ANS = 1000;
for (let i = 0; i < N_ANS; i++) {
  const c = 0.5 + rand() * 0.5;
  const accTrue = 0.5 + 0.8 * (c - 0.5); // systematically below its confidence
  const correct = rand() < accTrue;
  const b = Math.min(4, Math.floor((c - 0.5) / 0.1));
  BUCKETS[b].n++;
  BUCKETS[b].acc += correct ? 1 : 0;
  BUCKETS[b].conf += c;
}
let ECE = 0;
for (const b of BUCKETS) if (b.n) ECE += (b.n / N_ANS) * Math.abs(b.acc / b.n - b.conf / b.n);
const TOP = BUCKETS[4];
const TOP_CONF = (TOP.conf / TOP.n) * 100; // 95.3
const TOP_ACC = (TOP.acc / TOP.n) * 100; // 86.5

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const CAM_PANEL = (i: number): CameraState => ({ x: 640, y: 200 + i * 10, k: 1.0 });
const CAL_X = 210;
const CAL_Y = 210;
const CAL_W = 560;
const CAL_H = 300;
const calX = (i: number) => CAL_X + (i + 0.5) * (CAL_W / 5);
const calY = (v: number) => CAL_Y + CAL_H - (v - 0.4) / 0.6 * CAL_H;

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  frameU: ChannelRef<number>; // "what CAN you assert" framing
  schemaU: ChannelRef<number>;
  refusalU: ChannelRef<number>;
  calAxesU: ChannelRef<number>;
  calBarsU: ChannelRef<number>;
  eceU: ChannelRef<number>;
  bridgeU: ChannelRef<number>; // durable-evals bridge
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const frameU = tl.channel('frameU', 0);
  const schemaU = tl.channel('schemaU', 0);
  const refusalU = tl.channel('refusalU', 0);
  const calAxesU = tl.channel('calAxesU', 0);
  const calBarsU = tl.channel('calBarsU', 0);
  const eceU = tl.channel('eceU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the question
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'The book ends where it started, with the honest question: you cannot label every output of a model — so what can you actually assert about one? More than you would think. Three families, each measured live in this scene.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(frameU, 1, { at: 1.6, dur: 0.9, ease: ease.enter });
  tl.hold(5.9, 0.5);

  // Beat 2 — schema validity
  tl.caption({
    at: 6.4,
    dur: 5.8,
    text: 'Family one: structure. Every tool call a model emits must parse against the declared schema — required fields present, types right, no invented arguments. Of five hundred simulated calls here, thirty four are malformed, and the validator catches every one of them.',
  });
  tl.tween(schemaU, 1, { at: 7.4, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 12.6,
    dur: 4.6,
    text: 'Notice the strength of this weak looking check: it is total. Not sampled, not judged — enforced, on every output, forever. The kernel of the proof book, in miniature, sitting at the boundary of your system.',
  });
  tl.hold(17.2, 0.6);

  // Beat 3 — refusal consistency
  tl.caption({
    at: 17.8,
    dur: 5.8,
    text: 'Family two: consistency — chapter three’s relations, pointed at policy. The same request, phrased two ways, should get the same refusal decision. This toy model’s decisions wobble with phrasing noise: sixteen of three hundred paraphrase pairs come back inconsistent.',
  });
  tl.tween(refusalU, 1, { at: 18.8, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 24.0,
    dur: 4.6,
    text: 'You never said which requests should be refused. You only demanded the model agree with itself — and measured precisely how often it does not.',
  });
  tl.hold(28.6, 0.6);

  // Beat 4 — calibration
  tl.caption({
    at: 29.2,
    dur: 5.8,
    text: 'Family three: calibration — an assertion about confidence. When a model says ninety percent sure, it should be right about ninety percent of the time. Plot claimed confidence against delivered accuracy, bucket by bucket, one thousand seeded answers.',
  });
  tl.tween(calAxesU, 1, { at: 30.0, dur: 1.2, ease: ease.draw });
  tl.tween(calBarsU, 1, { at: 31.2, dur: 2.2, ease: ease.draw });
  tl.caption({
    at: 35.4,
    dur: 5.6,
    text: 'This toy model runs hot everywhere: in its top bucket it claims ninety five percent and delivers eighty six and a half. Expected calibration error, six percent. No oracle graded any single answer — the property lives in the aggregate.',
  });
  tl.tween(eceU, 1, { at: 37.0, dur: 0.8, ease: ease.enter });
  tl.hold(41.0, 0.6);

  // Beat 5 — the bridge and close
  tl.caption({
    at: 41.6,
    dur: 5.8,
    text: 'Put the three families together and you have a test suite for a system with no expected outputs: structure enforced totally, consistency measured relationally, confidence audited statistically. The durable evaluations book calls this verification based scoring — this book is why it works.',
  });
  tl.tween(bridgeU, 1, { at: 42.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 47.8,
    dur: 5.6,
    text: 'And the loop books are the same idea with teeth: a critic asserting properties of evidence — the recording replays, the changed lines executed, the tests can go red — none of which needs to know what the right diff was.',
  });
  tl.hold(53.4, 0.6);
  tl.caption({
    at: 54.0,
    dur: 5.4,
    text: 'Testing without an oracle is not settling for less. It is asking for what can actually be delivered: not the right answer — nobody knows it — but structure, consistency, and honesty about uncertainty, checked by machines that never get tired.',
  });
  tl.tween(dimU, 1, { at: 54.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.0, dur: 1.0, ease: ease.enter });
  tl.hold(59.4, 1.4);

  return { tl, cam, titleU, frameU, schemaU, refusalU, calAxesU, calBarsU, eceU, bridgeU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/model-properties/overrides.json',
  slug: 'model-properties',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const frameU = s.get(scene.frameU);
  const schemaU = s.get(scene.schemaU);
  const refusalU = s.get(scene.refusalU);
  const calAxesU = s.get(scene.calAxesU);
  const calBarsU = s.get(scene.calBarsU);
  const eceU = s.get(scene.eceU);
  const bridgeU = s.get(scene.bridgeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const cardFade = 1 - 0.8 * clamp01(calAxesU * 2.5);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* framing strip */}
          {frameU > 0 && (
            <text x={210} y={140} fill={colors.MUTED} fontSize={14.5} opacity={frameU * cardFade}>
              no oracle → assert <tspan fill={colors.ACCENT}>structure</tspan> · <tspan fill={colors.SECONDARY}>consistency</tspan> · <tspan fill={colors.WARM}>calibration</tspan>
            </text>
          )}

          {/* schema card */}
          {schemaU > 0 && (
            <g opacity={schemaU * cardFade}>
              <rect x={210} y={170} width={420} height={170} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.ACCENT} />
              <text x={236} y={202} fill={colors.ACCENT} fontSize={15} fontWeight={700}>
                1 · schema validity — total
              </text>
              <text x={236} y={230} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                every tool call must parse
              </text>
              <text x={236} y={258} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                {N_CALLS} calls · {SCHEMA_BAD} malformed
              </text>
              <text x={236} y={284} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace" fontWeight={700}>
                caught: {SCHEMA_BAD}/{SCHEMA_BAD} — enforced, not sampled
              </text>
              <text x={236} y={314} fill={colors.MUTED} fontSize={11.5}>
                a tiny kernel at the API boundary
              </text>
            </g>
          )}

          {/* refusal card */}
          {refusalU > 0 && (
            <g opacity={refusalU * cardFade}>
              <rect x={660} y={170} width={420} height={170} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.SECONDARY} />
              <text x={686} y={202} fill={colors.SECONDARY} fontSize={15} fontWeight={700}>
                2 · refusal consistency — relational
              </text>
              <text x={686} y={230} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                same request, two phrasings → same decision
              </text>
              <text x={686} y={258} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                {N_PAIRS} paraphrase pairs
              </text>
              <text x={686} y={284} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace" fontWeight={700}>
                inconsistent: {INCONS} ({((INCONS / N_PAIRS) * 100).toFixed(1)}%)
              </text>
              <text x={686} y={314} fill={colors.MUTED} fontSize={11.5}>
                no labels — the model graded against itself
              </text>
            </g>
          )}

          {/* calibration plot */}
          {calAxesU > 0 && (
            <g opacity={calAxesU}>
              <line x1={CAL_X} y1={CAL_Y} x2={CAL_X} y2={CAL_Y + CAL_H} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={CAL_X} y1={CAL_Y + CAL_H} x2={CAL_X + CAL_W} y2={CAL_Y + CAL_H} stroke={colors.GRID} strokeWidth={1.5} />
              {/* the y = x diagonal: perfect calibration */}
              <line x1={calX(-0.5) - (CAL_W / 10)} y1={calY(0.55)} x2={calX(4.5)} y2={calY(0.975)} stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="6 5" opacity={0.6} />
              <text x={CAL_X + CAL_W - 4} y={calY(0.975) - 10} textAnchor="end" fill={colors.MUTED} fontSize={11}>
                perfect calibration
              </text>
              <text x={CAL_X + CAL_W / 2} y={CAL_Y + CAL_H + 32} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                claimed confidence (5 buckets, 1,000 seeded answers)
              </text>
              {BUCKETS.map((b, i) => {
                const u = clamp01(calBarsU * 5 - i);
                if (u <= 0) return null;
                const conf = b.conf / b.n;
                const acc = b.acc / b.n;
                return (
                  <g key={i} opacity={u}>
                    <rect x={calX(i) - 30} y={calY(acc)} width={26} height={CAL_Y + CAL_H - calY(acc)} fill={colors.WARM} opacity={0.75} />
                    <rect x={calX(i) + 2} y={calY(conf)} width={26} height={CAL_Y + CAL_H - calY(conf)} fill={colors.MUTED} opacity={0.45} />
                    <text x={calX(i)} y={calY(Math.max(acc, conf)) - 8} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                      {(conf * 100).toFixed(0)}→{(acc * 100).toFixed(0)}
                    </text>
                  </g>
                );
              })}
              <g opacity={calBarsU}>
                <rect x={CAL_X + 8} y={CAL_Y + 6} width={11} height={11} fill={colors.WARM} opacity={0.75} />
                <text x={CAL_X + 26} y={CAL_Y + 16} fill={colors.MUTED} fontSize={11}>delivered accuracy</text>
                <rect x={CAL_X + 180} y={CAL_Y + 6} width={11} height={11} fill={colors.MUTED} opacity={0.45} />
                <text x={CAL_X + 198} y={CAL_Y + 16} fill={colors.MUTED} fontSize={11}>claimed confidence</text>
              </g>
            </g>
          )}
          {eceU > 0 && (
            <g opacity={eceU}>
              <rect x={830} y={230} width={330} height={140} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.WARM} />
              <text x={856} y={262} fill={colors.WARM} fontSize={15} fontWeight={700}>
                3 · calibration — statistical
              </text>
              <text x={856} y={292} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                top bucket: claims {TOP_CONF.toFixed(1)}%, delivers {TOP_ACC.toFixed(1)}%
              </text>
              <text x={856} y={318} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace" fontWeight={700}>
                expected calibration error: {(ECE * 100).toFixed(1)}%
              </text>
              <text x={856} y={346} fill={colors.MUTED} fontSize={11.5}>
                needs outcomes, never per-answer labels
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* bridge — screen space */}
      {bridgeU > 0 && (
        <g opacity={bridgeU * mainOp}>
          <rect x={210} y={556} width={860} height={62} rx={10} fill={colors.PANEL} opacity={0.95} stroke={colors.POSITIVE} />
          <text x={236} y={582} fill={colors.POSITIVE} fontSize={13.5} fontFamily="monospace" fontWeight={700}>
            verification-based scoring (explained-durable-evals) = these properties, installed as the grader
          </text>
          <text x={236} y={604} fill={colors.MUTED} fontSize={12}>
            and the loop books’ critics = properties of evidence, asserted adversarially
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Properties for AI systems
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={180} y={200} width={920} height={264} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={262} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Testing without an oracle
          </text>
          <text x={640} y={312} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            structure: {SCHEMA_BAD}/{SCHEMA_BAD} caught · consistency: {INCONS}/{N_PAIRS} wobbles · calibration: {(ECE * 100).toFixed(1)}% ECE
          </text>
          <text x={640} y={352} textAnchor="middle" fill={colors.POSITIVE} fontSize={16}>
            not the right answer — structure, consistency, and honest uncertainty
          </text>
          <text x={640} y={402} textAnchor="middle" fill={colors.WARM} fontSize={14.5}>
            checked by machines that never get tired
          </text>
        </g>
      )}
    </>
  );
}

export function ModelProperties() {
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
