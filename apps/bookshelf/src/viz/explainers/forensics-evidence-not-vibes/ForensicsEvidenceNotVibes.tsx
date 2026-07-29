// arXiv:2606.26071 — "Model Forensics" (Singh, Kroiz, Rajamanoharan, Nanda).
// Chapter 5: the close. The shelf thesis restated through the paper's own
// methodological insights (§7–8): predictions are the strongest evidence;
// negative results are hard to interpret without positive controls; the
// verdict on a behavior is an expensive claim that needs interventions
// behind it, not a read of the transcript. Bridges to the loop books:
// an agent's "it works" and an investigator's "it's misaligned" fail the
// same way — both need evidence that could have come out the other way.
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
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The evidence ledger — a claim card on one side, evidence chips stacking on
// the scale on the other. Chips are the actual instruments used in the paper.
// ---------------------------------------------------------------------------

const CLAIM = 'this behavior reflects misalignment';

const EVIDENCE = [
  { label: 'CoT reading', sub: 'hypotheses only', weight: 0.15, strong: false },
  { label: 'resampling scores', sub: 'sentence-level causality', weight: 0.45, strong: true },
  { label: 'counterfactual edits', sub: 'dose–response curves', weight: 0.85, strong: true },
  { label: 'confirmed predictions', sub: 'bets the world could refuse', weight: 1.0, strong: true },
];

const JOURNEY = [
  'ch1 · a diff two stories fit',
  'ch2 · read the thought, write the hypothesis',
  'ch3 · turn the dial, watch the prediction pay',
  'ch4 · six environments, six earned verdicts',
];

// scale layout
const PIVOT_X = 640;
const PIVOT_Y = 360;
const BEAM_HALF = 300;

const CAM_SCALE: CameraState = { x: 640, y: 340, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  claimU: ChannelRef<number>;
  scaleU: ChannelRef<number>;
  chipsU: ChannelRef<number>;
  tiltU: ChannelRef<number>; // 0 = claim side heavy (vibes), 1 = evidence outweighs
  vibesU: ChannelRef<number>;
  journeyU: ChannelRef<number>;
  bridgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const claimU = tl.channel('claimU', 0);
  const scaleU = tl.channel('scaleU', 0);
  const chipsU = tl.channel('chipsU', 0);
  const tiltU = tl.channel('tiltU', 0);
  const vibesU = tl.channel('vibesU', 0);
  const journeyU = tl.channel('journeyU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the expensive claim
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is the claim this whole paper is about: this behavior reflects misalignment. Notice what kind of claim that is. It indicts a system. It triggers mitigations. It is expensive to be wrong about — in both directions.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(claimU, 1, { at: 1.4, dur: 0.9, ease: ease.enter });
  tl.hold(6.1, 0.7);

  // Beat 2 — vibes on the scale
  tl.caption({
    at: 6.8,
    dur: 5.4,
    text: 'The cheap way to back it is vibes. The transcript looks scheming. The tone feels deceptive. Put that on a scale and see how much it actually weighs.',
  });
  tl.tween(cam, CAM_SCALE, { at: 7.1, dur: 1.4, ease: ease.move });
  tl.tween(scaleU, 1, { at: 7.8, dur: 1.2, ease: ease.draw });
  tl.tween(vibesU, 1, { at: 9.6, dur: 0.7, ease: ease.enter });
  tl.hold(12.2, 0.6);

  // Beat 3 — evidence chips
  tl.caption({
    at: 12.8,
    dur: 6.0,
    text: 'Now stack what the paper actually used. Chain of thought reading — light, it only proposes. Resampling scores, which measure each sentence causally. Counterfactual edits that trace dose response curves.',
  });
  tl.tween(chipsU, 0.75, { at: 13.4, dur: 3.6, ease: ease.linear });
  tl.tween(tiltU, 0.6, { at: 15.4, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 19.2,
    dur: 5.4,
    text: 'And the heaviest instrument of all: confirmed predictions. A hypothesis that bets on an unsampled world and wins. That is what tips the beam — the only thing that does.',
  });
  tl.tween(chipsU, 1, { at: 19.8, dur: 1.2, ease: ease.enter });
  tl.tween(tiltU, 1, { at: 20.6, dur: 1.4, ease: ease.move });
  tl.hold(24.6, 0.7);

  // Beat 4 — the asymmetry
  tl.caption({
    at: 25.3,
    dur: 6.0,
    text: 'And keep the asymmetry straight. Believing something is broken should be cheap — worst case, you look and it is not. Believing a verdict about why — misaligned, confused, merely lazy — that is the claim that needs the stack.',
  });
  tl.hold(31.3, 0.7);

  // Beat 5 — retrace the journey
  tl.caption({
    at: 32.0,
    dur: 5.8,
    text: 'Retrace the book. A diff that two stories fit. A protocol that reads the thought and writes a hypothesis. A dial that turns tedium down and watches shortcuts vanish. Six environments, six verdicts earned the hard way.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 32.2, dur: 1.3, ease: ease.move });
  tl.tween(journeyU, 1, { at: 33.0, dur: 3.2, ease: ease.linear });
  tl.hold(37.8, 0.6);

  // Beat 6 — the bridge
  tl.caption({
    at: 38.4,
    dur: 6.0,
    text: 'This is the same discipline the rest of this shelf keeps arriving at from the other side. When an agent says the fix works, you demand a recording. When a transcript says the model is scheming, demand the counterfactual.',
  });
  tl.tween(bridgeU, 1, { at: 39.4, dur: 0.9, ease: ease.enter });
  tl.hold(44.4, 0.6);

  // Beat 7 — close
  tl.caption({
    at: 45.0,
    dur: 5.8,
    text: 'Model forensics is a young field — this paper calls itself a baseline and lists its own blind spots. But the direction is set: claims about why a model behaves get proven the way everything else on this shelf gets proven. With evidence, not vibes.',
  });
  tl.tween(dimU, 1, { at: 45.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 46.3, dur: 1.0, ease: ease.enter });
  tl.hold(50.8, 1.4);

  return {
    tl, cam, titleU, claimU, scaleU, chipsU, tiltU, vibesU,
    journeyU, bridgeU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/forensics-evidence-not-vibes/overrides.json',
  slug: 'forensics-evidence-not-vibes',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const claimU = s.get(scene.claimU);
  const scaleU = s.get(scene.scaleU);
  const chipsU = s.get(scene.chipsU);
  const tiltU = s.get(scene.tiltU);
  const vibesU = s.get(scene.vibesU);
  const journeyU = s.get(scene.journeyU);
  const bridgeU = s.get(scene.bridgeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // beam angle: vibes side down first, then evidence side down
  const angle = 8 * vibesU * (1 - tiltU) - 10 * tiltU;
  const rad = (angle * Math.PI) / 180;
  const leftX = PIVOT_X - BEAM_HALF * Math.cos(rad);
  const leftY = PIVOT_Y - BEAM_HALF * Math.sin(rad);
  const rightX = PIVOT_X + BEAM_HALF * Math.cos(rad);
  const rightY = PIVOT_Y + BEAM_HALF * Math.sin(rad);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* claim card */}
          {claimU > 0 && (
            <g opacity={claimU * (1 - 0.7 * journeyU)}>
              <rect x={400} y={100} width={480} height={54} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
              <text x={640} y={134} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily={MONO}>
                “{CLAIM}”
              </text>
            </g>
          )}

          {/* the scale */}
          {scaleU > 0 && (
            <g opacity={scaleU * (1 - 0.85 * journeyU)}>
              <line x1={PIVOT_X} y1={PIVOT_Y + 120} x2={PIVOT_X} y2={PIVOT_Y} stroke={colors.GRID} strokeWidth={4} />
              <line x1={leftX} y1={leftY} x2={rightX} y2={rightY} stroke={colors.TEXT} strokeWidth={3} opacity={0.8} />
              <circle cx={PIVOT_X} cy={PIVOT_Y} r={7} fill={colors.TEXT} />

              {/* vibes pan (left) */}
              <g transform={`translate(${leftX}, ${leftY})`} opacity={vibesU}>
                <line x1={0} y1={0} x2={0} y2={30} stroke={colors.GRID} strokeWidth={2} />
                <rect x={-95} y={30} width={190} height={40} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={0} y={55} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  “it looks scheming”
                </text>
              </g>

              {/* evidence pan (right) */}
              <g transform={`translate(${rightX}, ${rightY})`}>
                <line x1={0} y1={0} x2={0} y2={30} stroke={colors.GRID} strokeWidth={2} />
                {EVIDENCE.map((e, i) => {
                  const u = clamp01(chipsU * EVIDENCE.length - i);
                  if (u <= 0) return null;
                  const y = 30 + (EVIDENCE.length - 1 - i) * 44;
                  return (
                    <g key={e.label} opacity={u}>
                      <rect x={-120} y={y} width={240} height={38} rx={9}
                        fill={e.strong ? colors.ACCENT : colors.MUTED}
                        opacity={0.14 + 0.22 * e.weight}
                        stroke={e.strong ? colors.ACCENT : colors.GRID} />
                      <text x={0} y={y + 17} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={600}>
                        {e.label}
                      </text>
                      <text x={0} y={y + 32} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                        {e.sub}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          )}

          {/* journey recap */}
          {journeyU > 0 && (
            <g opacity={journeyU}>
              {JOURNEY.map((line, i) => {
                const u = clamp01(journeyU * JOURNEY.length - i);
                if (u <= 0) return null;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={330} cy={180 + i * 56} r={5} fill={colors.SECONDARY} />
                    {i < JOURNEY.length - 1 && (
                      <line x1={330} y1={186 + i * 56} x2={330} y2={230 + i * 56} stroke={colors.GRID} strokeWidth={1.5} />
                    )}
                    <text x={352} y={186 + i * 56} fill={colors.TEXT} fontSize={16}>
                      {line}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* bridge chip */}
          {bridgeU > 0 && (
            <g opacity={bridgeU}>
              <rect x={330} y={430} width={620} height={64} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={640} y={457} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontWeight={600}>
                the shelf's one rule, from both directions
              </text>
              <text x={640} y={480} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                “it works” needs a recording · “it's misaligned” needs a counterfactual
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Evidence, not vibes
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2606.26071 · §7–8
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={225} width={860} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Behavior claims need forensic evidence
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            read the thought · write the hypothesis · edit the world ·
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            let the outcome decide — and report what stayed unproven
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            Model Forensics · arXiv:2606.26071
          </text>
        </g>
      )}
    </>
  );
}

export function ForensicsEvidenceNotVibes() {
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
