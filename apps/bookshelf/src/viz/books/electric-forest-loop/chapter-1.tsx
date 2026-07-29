// A Claim Is Not Evidence
//
// Backed by: electric-forest AGENTS.md ("The one rule": a builder being
// satisfied is a claim; a deterministic recording of the run is evidence; no
// task reaches verified on claims) and .eforest/loop.md ("The two agents":
// builder produces claim + evidence, critic tries to refute; only the critic
// sets verified).
//
// ONE persistent object: the claim card. It enters weightless ("it works"),
// a passive reviewer stamps it anyway, then the doctrine arrives — the
// recording tape — and the claim is physically tethered to a point in the
// session where it worked. The chapter ends with the two agents facing each
// other across the tape.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';
import type { RecordingLink, RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
// Stage 1280×720; bottom ~12% (y ≳ 630) stays clear for the CC pill.
const CLAIM = { x: 470, y: 120, w: 340, h: 88 };
const REVIEWER = { x: 150, y: 130 };
const TAPE = { x: 150, y: 420, w: 980, h: 30 };
const BUILDER = { x: 250, y: 560 };
const CRITIC = { x: 1030, y: 560 };

const CAM_CLAIM: CameraState = { x: 640, y: 210, k: 1.35 };
const CAM_REVIEW: CameraState = { x: 430, y: 190, k: 1.3 };
const CAM_TAPE: CameraState = { x: 640, y: 400, k: 1.15 };
const CAM_WIDE: CameraState = { x: 640, y: 380, k: 1.0 };

/** The recording's runtime points — the vocabulary of a Replay session. */
const POINTS: RecordingPoint[] = [
  { at: 0.08, kind: 'interaction', label: 'boot' },
  { at: 0.22, kind: 'network' },
  { at: 0.34, kind: 'render' },
  { at: 0.48, kind: 'interaction', label: 'the write' },
  { at: 0.6, kind: 'network' },
  { at: 0.72, kind: 'render', label: 'digest shown' },
  { at: 0.88, kind: 'interaction' },
];

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  claimU: ChannelRef<number>;
  floatU: ChannelRef<number>; // the claim bobbing, unanchored
  reviewerU: ChannelRef<number>;
  stampU: ChannelRef<number>;
  bugU: ChannelRef<number>; // bugs slipping under the stamped diff
  ruleU: ChannelRef<number>; // the one-rule banner
  reviewFade: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  tetherU: ChannelRef<number>; // claim → point tether
  linkPop: ChannelRef<number>;
  agentsU: ChannelRef<number>;
  onlyU: ChannelRef<number>; // "only the critic sets verified"
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const claimU = tl.channel('claimU', 0);
  const floatU = tl.channel('floatU', 0);
  const reviewerU = tl.channel('reviewerU', 0);
  const stampU = tl.channel('stampU', 0);
  const bugU = tl.channel('bugU', 0);
  const ruleU = tl.channel('ruleU', 0);
  const reviewFade = tl.channel('reviewFade', 0);
  const tapeU = tl.channel('tapeU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const tetherU = tl.channel('tetherU', 0);
  const linkPop = tl.channel('linkPop', 0);
  const agentsU = tl.channel('agentsU', 0);
  const onlyU = tl.channel('onlyU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the claim appears —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'A coding agent finishes a task, runs its tests, and reports back: it works. Three words, and every one of them is doing a lot of lifting.',
  });
  tl.tween(cam, CAM_CLAIM, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(claimU, 1, { at: 1.2, dur: 0.8, ease: ease.enter });
  tl.tween(floatU, 1, { at: 2.2, dur: 3.5, ease: ease.linear });
  tl.hold(7.0, 0.7);

  // — Beat 2 · claims are asymmetric —
  tl.caption({
    at: 7.7,
    dur: 7,
    text: 'Here is the asymmetry that this whole book turns on. A bug report is cheap to accept — worst case, you look and it is fine. But it works is the expensive claim.',
  });
  tl.tween(floatU, 2, { at: 8.0, dur: 5.5, ease: ease.linear });
  tl.hold(14.7, 0.6);

  // — Beat 3 · the passive reviewer —
  tl.caption({
    at: 15.3,
    dur: 7,
    text: 'The usual answer is a code review. A reviewer reads the diff, and the diff tells a story. The trouble is, a reader can only agree with the story it tells.',
  });
  tl.tween(cam, CAM_REVIEW, { at: 15.5, dur: 1.3, ease: ease.move });
  tl.tween(reviewerU, 1, { at: 16.2, dur: 0.8, ease: ease.enter });
  tl.tween(stampU, 1, { at: 19.6, dur: 0.5, ease: ease.pop });
  tl.hold(22.3, 0.6);

  // — Beat 4 · bugs slip underneath —
  tl.caption({
    at: 22.9,
    dur: 6.5,
    text: 'Anything the diff does not mention — the edge case, the race, the code path that never ran — slips right underneath the approval.',
  });
  tl.tween(bugU, 1, { at: 23.4, dur: 4.5, ease: ease.linear });
  tl.hold(29.4, 0.6);

  // — Beat 5 · the one rule —
  tl.caption({
    at: 30.0,
    dur: 7.5,
    text: 'The electric forest repository is built by agents under one rule. A builder being satisfied is a claim. A deterministic recording of the run that satisfied them is evidence.',
  });
  tl.tween(reviewFade, 1, { at: 30.3, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_TAPE, { at: 30.5, dur: 1.5, ease: ease.move });
  tl.tween(ruleU, 1, { at: 31.4, dur: 0.8, ease: ease.enter });
  tl.hold(37.5, 0.6);

  // — Beat 6 · the recording —
  tl.caption({
    at: 38.1,
    dur: 7,
    text: 'Evidence here means the whole session, captured. A replay of the browser run, or the deterministic event log the system writes about itself — every click, request, and state change.',
  });
  tl.tween(tapeU, 1, { at: 38.4, dur: 1.5, ease: ease.draw });
  tl.tween(sweepU, 1, { at: 40.2, dur: 4.2, ease: ease.linear });
  tl.hold(45.1, 0.6);

  // — Beat 7 · the tether —
  tl.caption({
    at: 45.7,
    dur: 6.5,
    text: 'And the claim stops floating. It gets tied to a point in that recording anyone can jump to: here is the exact moment where it worked, in full.',
  });
  tl.tween(tetherU, 1, { at: 46.2, dur: 1.3, ease: ease.draw });
  tl.tween(linkPop, 1, { at: 47.8, dur: 0.6, ease: ease.pop });
  tl.hold(52.2, 0.6);

  // — Beat 8 · the two agents —
  tl.caption({
    at: 52.8,
    dur: 7,
    text: 'Two agents run this loop. The builder implements and records. The critic is a fresh session — never the one that wrote the code — and its whole job is to break the claim.',
  });
  tl.tween(cam, CAM_WIDE, { at: 53.0, dur: 1.5, ease: ease.move });
  tl.tween(agentsU, 1, { at: 54.0, dur: 1.2, ease: ease.enter });
  tl.hold(59.8, 0.6);

  // — Beat 9 · only the critic —
  tl.caption({
    at: 60.4,
    dur: 6,
    text: 'Only the critic can mark a task verified. Not the builder, not a manager, not a second opinion that read the same diff. The one who attacked it.',
  });
  tl.tween(onlyU, 1, { at: 61.2, dur: 0.8, ease: ease.pop });
  tl.hold(66.4, 0.6);

  // — Beat 10 · close —
  tl.caption({
    at: 67.0,
    dur: 6.5,
    text: 'The rest of this book is that machine in motion: the workshop where evidence is made, the attack that tests it, and the budget that keeps the loop honest.',
  });
  tl.tween(endDim, 1, { at: 67.3, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 68.2, dur: 1.0, ease: ease.enter });
  tl.hold(73.5, 1.2);

  return {
    tl, cam, claimU, floatU, reviewerU, stampU, bugU, ruleU, reviewFade,
    tapeU, sweepU, tetherU, linkPop, agentsU, onlyU, endDim, endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

function AgentBadge({ x, y, label, sub, color, u }: { x: number; y: number; label: string; sub: string; color: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u} transform={`translate(0 ${(1 - u) * 12})`}>
      <circle cx={x} cy={y} r={26} fill={colors.PANEL} stroke={color} strokeWidth={2} />
      <circle cx={x} cy={y - 6} r={7} fill="none" stroke={color} strokeWidth={2} />
      <path d={`M ${x - 12} ${y + 14} q 12 -16 24 0`} fill="none" stroke={color} strokeWidth={2} />
      <text x={x} y={y + 46} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700}>
        {label}
      </text>
      <text x={x} y={y + 64} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
        {sub}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const claimU = s.get(scene.claimU);
  const floatU = s.get(scene.floatU);
  const reviewerU = s.get(scene.reviewerU);
  const stampU = s.get(scene.stampU);
  const bugU = s.get(scene.bugU);
  const ruleU = s.get(scene.ruleU);
  const reviewFade = s.get(scene.reviewFade);
  const tapeU = s.get(scene.tapeU);
  const sweepU = s.get(scene.sweepU);
  const tetherU = s.get(scene.tetherU);
  const linkPop = s.get(scene.linkPop);
  const agentsU = s.get(scene.agentsU);
  const onlyU = s.get(scene.onlyU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  // the claim bobs while unanchored; the tether pulls it still
  const bob = Math.sin(floatU * Math.PI * 2.7) * 7 * (1 - tetherU);
  const cx0 = CLAIM.x + CLAIM.w / 2;
  const claimY = CLAIM.y + bob;

  // tether endpoint: the "digest shown" point at 0.72 of the tape
  const px = TAPE.x + 0.72 * TAPE.w;
  const py = TAPE.y;

  const links: RecordingLink[] = [{ at: 0.72, label: 'point at 41 s', pop: linkPop }];

  const worldOp = 1 - 0.85 * endDim;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the claim card ---- */}
          {claimU > 0 && (
            <g opacity={claimU}>
              <rect
                x={CLAIM.x}
                y={claimY}
                width={CLAIM.w}
                height={CLAIM.h}
                rx={14}
                fill={colors.PANEL}
                stroke={tetherU > 0.3 ? colors.POSITIVE : colors.SECONDARY}
                strokeWidth={1.8}
                strokeDasharray={tetherU > 0.3 ? undefined : '6 6'}
              />
              <text x={CLAIM.x + 18} y={claimY + 26} fill={colors.SECONDARY} fontSize={11.5} fontFamily={MONO}>
                builder
              </text>
              <text x={cx0} y={claimY + 56} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={700}>
                “it works”
              </text>
              {tetherU < 0.3 && claimU > 0.9 && (
                <text x={cx0} y={claimY - 12} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
                  a claim — nothing holds it down
                </text>
              )}
            </g>
          )}

          {/* ---- the passive reviewer ---- */}
          {reviewerU > 0 && (
            <g opacity={reviewerU * (1 - reviewFade)}>
              {/* the eye */}
              <g transform={`translate(${REVIEWER.x} ${REVIEWER.y})`}>
                <path d="M -30 0 Q 0 -26 30 0 Q 0 26 -30 0 Z" fill="none" stroke={colors.MUTED} strokeWidth={2} />
                <circle r={9} fill={colors.MUTED} />
                <text y={48} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  passive review
                </text>
                <text y={66} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                  reads the diff
                </text>
              </g>
              {/* the diff it reads */}
              <g transform={`translate(${REVIEWER.x + 90} ${REVIEWER.y + 96})`}>
                <rect x={0} y={0} width={220} height={92} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                {[0, 1, 2].map((i) => (
                  <g key={i}>
                    <text x={12} y={24 + i * 24} fill={i === 1 ? colors.POSITIVE : colors.MUTED} fontSize={12} fontFamily={MONO}>
                      {i === 1 ? '+' : ' '}
                    </text>
                    <rect x={28} y={15 + i * 24} width={i === 1 ? 160 : 120} height={9} rx={4.5} fill={i === 1 ? colors.POSITIVE : colors.GRID} opacity={i === 1 ? 0.55 : 0.8} />
                  </g>
                ))}
                {stampU > 0 && (
                  <g transform={`translate(170 20) rotate(-14) scale(${0.7 + 0.3 * stampU})`} opacity={stampU}>
                    <rect x={-52} y={-16} width={104} height={32} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
                    <text y={6} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={800} letterSpacing={2}>
                      LGTM
                    </text>
                  </g>
                )}
              </g>
              {/* bugs slipping under the approval */}
              {bugU > 0 &&
                [0, 1, 2].map((i) => {
                  const u = clamp01(bugU * 3.4 - i * 0.9);
                  if (u <= 0) return null;
                  const bx = REVIEWER.x + 60 + u * 300;
                  const by = REVIEWER.y + 220 + i * 18 + Math.sin(u * 9 + i) * 5;
                  return (
                    <g key={i} opacity={Math.min(1, u * 3) * (1 - clamp01((u - 0.85) * 6))}>
                      <circle cx={bx} cy={by} r={5.5} fill={colors.NEGATIVE} />
                      {i === 0 && u > 0.2 && u < 0.8 && (
                        <text x={bx} y={by + 22} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontStyle="italic" opacity={0.85}>
                          never mentioned by the diff
                        </text>
                      )}
                    </g>
                  );
                })}
            </g>
          )}

          {/* ---- the one rule banner ---- */}
          {ruleU > 0 && (
            <g opacity={ruleU}>
              <rect x={280} y={286} width={720} height={64} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
              <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={15.5} fontWeight={700}>
                satisfaction is a claim · a recording is evidence
              </text>
              <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                AGENTS.md — “The one rule” · .eforest/loop.md
              </text>
            </g>
          )}

          {/* ---- the recording tape ---- */}
          <RecordingStrip
            x={TAPE.x}
            y={TAPE.y}
            w={TAPE.w}
            h={TAPE.h}
            points={POINTS}
            u={sweepU}
            reveal={tapeU}
            links={links}
            title="the recorded session — every moment addressable"
          />

          {/* ---- the tether ---- */}
          {tetherU > 0 && (
            <g>
              <line
                x1={cx0}
                y1={claimY + CLAIM.h}
                x2={cx0 + (px - cx0) * tetherU}
                y2={claimY + CLAIM.h + (py - claimY - CLAIM.h) * tetherU}
                stroke={colors.POSITIVE}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              {tetherU >= 0.99 && <circle cx={px} cy={py} r={5} fill={colors.POSITIVE} />}
            </g>
          )}

          {/* ---- the two agents ---- */}
          <AgentBadge x={BUILDER.x} y={BUILDER.y} label="builder" sub="implements · records" color={colors.SECONDARY} u={agentsU} />
          <AgentBadge x={CRITIC.x} y={CRITIC.y} label="critic" sub="fresh session · attacks" color={colors.NEGATIVE} u={agentsU} />
          {onlyU > 0 && (
            <g opacity={onlyU} transform={`translate(0 ${(1 - onlyU) * 8})`}>
              <rect x={CRITIC.x - 120} y={CRITIC.y - 78} width={240} height={34} rx={17} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
              <text x={CRITIC.x} y={CRITIC.y - 56} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontWeight={700} fontFamily={MONO}>
                only the critic sets verified
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={340} y={250} width={600} height={130} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={700}>
              claim → evidence → attack → verified
            </text>
            <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              the loop that builds electric-forest
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
