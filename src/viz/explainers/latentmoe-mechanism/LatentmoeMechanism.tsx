// arXiv:2601.18089 — "LatentMoE" — Chapter 2: the mechanism.
// Decouple expert width from the model's hidden dimension: a learnable
// down-projection W↓ ∈ R^{ℓ×d} compresses tokens from d to a latent ℓ,
// routed experts live entirely in the latent space, W↑ ∈ R^{d×ℓ} restores d.
// With α = d/ℓ = 4 (the paper's setting), expert count scales N → αN and
// active experts K → αK (the ℓ-MoE_acc variant), keeping inference cost
// constant while weight loading and all-to-all bytes drop by α. Shared
// experts stay at full width d. (Paper §3; dims from the 95B config:
// d = 4096, ℓ = 1024, 128 → 512 experts, top-6 → top-24.)
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

// stage geometry: token bar flows left→right through the funnel
const TOK_Y = 300;
const D_H = 160; // full-width token height (d)
const L_H = 40; // latent token height (ℓ) — d/4
const X_IN = 130;
const X_DOWN = 330;
const X_EXPERTS = 560;
const X_UP = 860;
const X_OUT = 1030;

// latent expert grid: 8x4 small experts (stands in for αN = 512)
const LE_COLS = 6;
const LE_ROWS = 4;
const LE_S = 34;

const CAM_FUNNEL: CameraState = { x: 620, y: 320, k: 1.25 };
const CAM_EXPERTS: CameraState = { x: X_EXPERTS + 110, y: 310, k: 1.7 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  tokInU: ChannelRef<number>;
  downU: ChannelRef<number>;
  squeezeU: ChannelRef<number>; // token morphs d → ℓ
  expU: ChannelRef<number>;
  routeU: ChannelRef<number>;
  upU: ChannelRef<number>;
  sharedU: ChannelRef<number>;
  savingsU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const tokInU = tl.channel('tokInU', 0);
  const downU = tl.channel('downU', 0);
  const squeezeU = tl.channel('squeezeU', 0);
  const expU = tl.channel('expU', 0);
  const routeU = tl.channel('routeU', 0);
  const upU = tl.channel('upU', 0);
  const sharedU = tl.channel('sharedU', 0);
  const savingsU = tl.channel('savingsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the token at full width
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'Here is a token as the expert layer receives it: a vector four thousand ninety six numbers wide. Every byte of that width gets routed, shipped, and multiplied — whether or not the experts need it.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_FUNNEL, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(tokInU, 1, { at: 1.6, dur: 1.0, ease: ease.enter });
  tl.hold(5.7, 0.7);

  // Beat 2 — the down-projection
  tl.caption({
    at: 6.4,
    dur: 5.8,
    text: 'The latent mixture inserts one learned matrix at the door. It projects the token down to a quarter of its width — one thousand twenty four numbers — before any expert ever sees it.',
  });
  tl.tween(downU, 1, { at: 7.4, dur: 0.9, ease: ease.enter });
  tl.tween(squeezeU, 1, { at: 8.6, dur: 1.4, ease: ease.move });
  tl.hold(12.2, 0.7);

  // Beat 3 — the latent experts
  tl.caption({
    at: 12.9,
    dur: 5.8,
    text: 'Inside, the experts live entirely in that smaller space — and because each one is four times cheaper, the same budget buys four times as many. One hundred twenty eight experts become five hundred twelve.',
  });
  tl.tween(cam, CAM_EXPERTS, { at: 13.2, dur: 1.4, ease: ease.move });
  tl.tween(expU, 1, { at: 14.0, dur: 2.6, ease: ease.linear });
  tl.caption({
    at: 18.7,
    dur: 5.2,
    text: 'Routing scales the same way: instead of waking six big experts, each token wakes twenty four small ones. Total math per token — unchanged. The shape of the computation changed, not its size.',
  });
  tl.tween(routeU, 1, { at: 19.8, dur: 1.6, ease: ease.move });
  tl.hold(23.9, 0.7);

  // Beat 4 — up-projection and shared experts
  tl.caption({
    at: 24.6,
    dur: 5.6,
    text: 'On the way out, a second matrix restores the full width. And the shared experts — the ones every token visits — stay at full width the whole time. Only the routed traffic got compressed.',
  });
  tl.tween(cam, CAM_FUNNEL, { at: 24.8, dur: 1.4, ease: ease.move });
  tl.tween(upU, 1, { at: 25.8, dur: 1.2, ease: ease.move });
  tl.tween(sharedU, 1, { at: 27.6, dur: 0.9, ease: ease.enter });
  tl.hold(30.2, 0.7);

  // Beat 5 — what the squeeze buys
  tl.caption({
    at: 30.9,
    dur: 5.8,
    text: 'Now revisit chapter one. Expert weights shrink four fold, so the starved regime hauls a quarter of the bytes. Tokens cross the network at latent width, so the all to all ships a quarter of the traffic. Both bottlenecks, one matrix.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 31.1, dur: 1.3, ease: ease.move });
  tl.tween(savingsU, 1, { at: 32.4, dur: 1.2, ease: ease.enter });
  tl.hold(36.7, 0.7);

  // Beat 6 — close
  tl.caption({
    at: 37.4,
    dur: 4.8,
    text: 'Of course, a quarter of the width could mean a quarter of the brain. Why four times more experts exactly compensates — that is the next chapter, and it is the best part of the paper.',
  });
  tl.tween(dimU, 1, { at: 37.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 38.6, dur: 1.0, ease: ease.enter });
  tl.hold(42.2, 1.2);

  return {
    tl, cam, titleU, tokInU, downU, squeezeU, expU, routeU,
    upU, sharedU, savingsU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/latentmoe-mechanism/overrides.json',
  slug: 'latentmoe-mechanism',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const tokInU = s.get(scene.tokInU);
  const downU = s.get(scene.downU);
  const squeezeU = s.get(scene.squeezeU);
  const expU = s.get(scene.expU);
  const routeU = s.get(scene.routeU);
  const upU = s.get(scene.upU);
  const sharedU = s.get(scene.sharedU);
  const savingsU = s.get(scene.savingsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const N_LE = LE_COLS * LE_ROWS;
  const routed = new Set([1, 4, 6, 9, 10, 13, 15, 18, 20, 22]); // "many small" actives
  const tokH = D_H - (D_H - L_H) * squeezeU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* incoming token */}
          {tokInU > 0 && (
            <g opacity={tokInU}>
              <rect x={X_IN} y={TOK_Y - D_H / 2} width={44} height={D_H} rx={8} fill={colors.ACCENT} opacity={0.35} stroke={colors.ACCENT} />
              <text x={X_IN + 22} y={TOK_Y - D_H / 2 - 12} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                d = 4096
              </text>
            </g>
          )}

          {/* down-projection */}
          {downU > 0 && (
            <g opacity={downU}>
              <path
                d={`M${X_DOWN},${TOK_Y - D_H / 2} L${X_DOWN + 90},${TOK_Y - L_H / 2} L${X_DOWN + 90},${TOK_Y + L_H / 2} L${X_DOWN},${TOK_Y + D_H / 2} Z`}
                fill={colors.SECONDARY}
                opacity={0.25}
                stroke={colors.SECONDARY}
              />
              <MathLabel tex={'W_{\\downarrow} \\in \\mathbb{R}^{\\ell \\times d}'} x={X_DOWN + 44} y={TOK_Y - D_H / 2 - 26} fontSize={15} color={colors.SECONDARY} />
            </g>
          )}

          {/* squeezed token */}
          {squeezeU > 0 && (
            <g opacity={squeezeU}>
              <rect x={X_DOWN + 110} y={TOK_Y - tokH / 2} width={36} height={tokH} rx={7} fill={colors.ACCENT} opacity={0.5} stroke={colors.ACCENT} />
              <text x={X_DOWN + 128} y={TOK_Y + L_H / 2 + 24} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                ℓ = 1024 · α = 4
              </text>
            </g>
          )}

          {/* latent expert grid */}
          {Array.from({ length: N_LE }, (_, i) => {
            const u = clamp01(expU * N_LE - i);
            if (u <= 0) return null;
            const x = X_EXPERTS + (i % LE_COLS) * LE_S;
            const y = TOK_Y - (LE_ROWS * LE_S) / 2 + Math.floor(i / LE_COLS) * LE_S;
            const hot = routed.has(i) && routeU > 0.3;
            return (
              <g key={i} opacity={u}>
                <rect x={x} y={y} width={LE_S - 6} height={LE_S - 6} rx={6}
                  fill={hot ? colors.WARM : colors.PANEL}
                  opacity={hot ? 0.35 + 0.4 * routeU : 0.7}
                  stroke={hot ? colors.WARM : colors.GRID} />
              </g>
            );
          })}
          {expU > 0.9 && (
            <g opacity={expU}>
              <text x={X_EXPERTS + (LE_COLS * LE_S) / 2 - 3} y={TOK_Y - (LE_ROWS * LE_S) / 2 - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                128 → 512 latent experts
              </text>
              {routeU > 0.5 && (
                <text x={X_EXPERTS + (LE_COLS * LE_S) / 2 - 3} y={TOK_Y + (LE_ROWS * LE_S) / 2 + 22} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO} opacity={routeU}>
                  top-6 → top-24 per token
                </text>
              )}
            </g>
          )}

          {/* up-projection + output */}
          {upU > 0 && (
            <g opacity={upU}>
              <path
                d={`M${X_UP},${TOK_Y - L_H / 2} L${X_UP + 90},${TOK_Y - D_H / 2} L${X_UP + 90},${TOK_Y + D_H / 2} L${X_UP},${TOK_Y + L_H / 2} Z`}
                fill={colors.SECONDARY}
                opacity={0.25}
                stroke={colors.SECONDARY}
              />
              <MathLabel tex={'W_{\\uparrow} \\in \\mathbb{R}^{d \\times \\ell}'} x={X_UP + 44} y={TOK_Y - D_H / 2 - 26} fontSize={15} color={colors.SECONDARY} />
              <rect x={X_OUT} y={TOK_Y - D_H / 2} width={44} height={D_H} rx={8} fill={colors.POSITIVE} opacity={0.35} stroke={colors.POSITIVE} />
            </g>
          )}

          {/* shared experts lane */}
          {sharedU > 0 && (
            <g opacity={sharedU}>
              <rect x={X_DOWN} y={TOK_Y + D_H / 2 + 46} width={X_UP + 90 - X_DOWN} height={44} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={(X_DOWN + X_UP + 90) / 2} y={TOK_Y + D_H / 2 + 74} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                shared experts — stay at full width d
              </text>
            </g>
          )}

          {/* savings chips */}
          {savingsU > 0 && (
            <g opacity={savingsU}>
              <rect x={310} y={92} width={660} height={44} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={640} y={120} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={600} fontFamily={MONO}>
                weight loading ÷ α · all-to-all bytes ÷ α · FLOPs unchanged
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Experts in a smaller room
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2601.18089 · ℓ-MoE
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Same compute, a quarter of the traffic
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            project down once, run four times as many small experts,
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            project back up — the width stops being the bottleneck
          </text>
        </g>
      )}
    </>
  );
}

export function LatentmoeMechanism() {
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
