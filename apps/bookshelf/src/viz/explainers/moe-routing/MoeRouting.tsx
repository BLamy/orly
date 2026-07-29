// Fresh from arXiv №3, chapter 1 — what a mixture-of-experts actually is.
// Papers: arXiv:2607.12696 (EcoSpec), arXiv:2607.08782 (Director),
// arXiv:2607.13068 (decoding-chip economics) — all three serve MoE models,
// so first the routing itself, computed for real at module scope: 12 seeded
// token vectors, 8 expert centroids, router logits = dot products, softmax,
// top-2 selection. The sparsity headline is the real public shape of the
// models the papers serve: DeepSeek V3-class models hold 671B parameters and
// activate ~37B per token (~5.5%).
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
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
// The routing, computed. d = 6, 8 experts, 12 tokens.
// ---------------------------------------------------------------------------

const D = 6;
const N_EXP = 8;
const N_TOK = 12;
const TOP_K = 2;

const rand = mulberry32(26071);
const unit = (): number[] => {
  const v = Array.from({ length: D }, () => rand() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const EXPERTS = Array.from({ length: N_EXP }, unit);
// tokens: each near one of the expert directions plus noise (so routing has structure)
const TOKENS = Array.from({ length: N_TOK }, (_, t) => {
  const base = EXPERTS[t % N_EXP];
  const noise = unit();
  const v = base.map((x, i) => x + 0.7 * noise[i]);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
});

const softmax = (r: number[]): number[] => {
  const m = Math.max(...r);
  const e = r.map((x) => Math.exp((x - m) * 4)); // temperature sharpens for readability
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
};

interface Route {
  probs: number[];
  top: number[]; // indices of the top-k experts
}
const ROUTES: Route[] = TOKENS.map((tok) => {
  const logits = EXPERTS.map((e) => e.reduce((a, x, i) => a + x * tok[i], 0));
  const probs = softmax(logits);
  const top = probs
    .map((p, i) => [p, i] as const)
    .sort((a, b) => b[0] - a[0])
    .slice(0, TOP_K)
    .map(([, i]) => i);
  return { probs, top };
});

// expert load histogram (how many tokens picked each expert in their top-2)
const LOAD: number[] = Array.from({ length: N_EXP }, (_, e) =>
  ROUTES.reduce((a, r) => a + (r.top.includes(e) ? 1 : 0), 0),
);

// the real shape of the served models
const TOTAL_B = 671;
const ACTIVE_B = 37;
const ACTIVE_PCT = ((ACTIVE_B / TOTAL_B) * 100).toFixed(1); // 5.5%

// ---------------------------------------------------------------------------
// Layout — tokens left, experts right, probability ribbons between.
// ---------------------------------------------------------------------------

const TOK_X = 200;
const EXP_X = 760;
const rowYTok = (t: number): number => 120 + t * 40;
const rowYExp = (e: number): number => 140 + e * 58;

const CAM_ONE: CameraState = { x: 480, y: 300, k: 1.35 };
const CAM_ALL: CameraState = { x: 560, y: 330, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  stageU: ChannelRef<number>;
  probeTok: ChannelRef<number>;
  probeU: ChannelRef<number>;
  eqU: ChannelRef<number>;
  allU: ChannelRef<number>;
  loadU: ChannelRef<number>;
  sparseU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const stageU = tl.channel('stageU', 0);
  const probeTok = tl.channel('probeTok', 0);
  const probeU = tl.channel('probeU', 0);
  const eqU = tl.channel('eqU', 0);
  const allU = tl.channel('allU', 0);
  const loadU = tl.channel('loadU', 0);
  const sparseU = tl.channel('sparseU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the cast
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A mixture of experts is a committee with a strict rule: for every token, only a few members are allowed to speak. Twelve tokens on the left, eight experts on the right.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_ALL, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(stageU, 1, { at: 1.2, dur: 2.0, ease: ease.enter });
  tl.hold(6.3, 0.5);

  // Beat 2 — one token routed
  tl.caption({
    at: 6.8,
    dur: 6.0,
    text: 'The router is just a dot product and a softmax. Take one token: score it against every expert, turn the scores into probabilities, and keep the top two. That is the entire mechanism.',
  });
  tl.tween(cam, CAM_ONE, { at: 7.1, dur: 1.4, ease: ease.move });
  tl.tween(probeU, 1, { at: 7.8, dur: 1.2, ease: ease.draw });
  tl.tween(eqU, 1, { at: 9.4, dur: 0.8, ease: ease.enter });
  tl.hold(12.8, 0.6);

  // Beat 3 — all tokens
  tl.caption({
    at: 13.4,
    dur: 6.0,
    text: 'Run all twelve tokens and watch the committee split the work. These ribbons are the computed routing probabilities — thicker means more weight, and only the top two per token fire.',
  });
  tl.tween(cam, CAM_ALL, { at: 13.7, dur: 1.4, ease: ease.move });
  tl.tween(probeU, 0.25, { at: 13.7, dur: 0.9, ease: ease.move });
  tl.tween(allU, 1, { at: 14.4, dur: 3.4, ease: ease.linear });
  tl.tween(probeTok, N_TOK - 1, { at: 14.4, dur: 3.4, ease: ease.linear });
  tl.caption({
    at: 19.6,
    dur: 5.4,
    text: 'The load is uneven on purpose — tokens go where they are understood. Some experts catch four tokens, some catch one. Remember that skew; it becomes the whole serving problem.',
  });
  tl.tween(loadU, 1, { at: 20.4, dur: 1.0, ease: ease.enter });
  tl.hold(25.0, 0.6);

  // Beat 4 — the sparsity payoff
  tl.caption({
    at: 25.6,
    dur: 6.2,
    text: 'Now scale the committee. The frontier models these papers serve hold six hundred seventy one billion parameters — but each token activates only about thirty seven billion of them. Five and a half percent.',
  });
  tl.tween(sparseU, 1, { at: 26.6, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 32.0,
    dur: 5.6,
    text: 'That is the deal a mixture of experts offers: the knowledge of a giant, the compute bill of a model twenty times smaller. The catch is that the giant still has to be in the room.',
  });
  tl.hold(37.6, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 38.2,
    dur: 5.8,
    text: 'Keeping that giant in the room — in memory, on the right machine, at a price someone can pay — is the story of the next four chapters.',
  });
  tl.tween(closeU, 1, { at: 39.0, dur: 1.0, ease: ease.enter });
  tl.hold(44.0, 1.2);

  return { tl, cam, titleU, stageU, probeTok, probeU, eqU, allU, loadU, sparseU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/moe-routing/overrides.json', slug: 'moe-routing' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Ribbon({ t, e, w, color, u }: { t: number; e: number; w: number; color: string; u: number }) {
  if (u <= 0 || w < 0.03) return null;
  const x0 = TOK_X + 60;
  const y0 = rowYTok(t) + 12;
  const x1 = EXP_X - 8;
  const y1 = rowYExp(e) + 18;
  const mx = (x0 + x1) / 2;
  return (
    <path
      d={`M${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`}
      fill="none"
      stroke={color}
      strokeWidth={0.8 + 7 * w}
      opacity={0.55 * u * (0.3 + 0.7 * w)}
    />
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const stageU = s.get(scene.stageU);
  const probeU = s.get(scene.probeU);
  const eqU = s.get(scene.eqU);
  const allU = s.get(scene.allU);
  const probeTok = s.get(scene.probeTok);
  const loadU = s.get(scene.loadU);
  const sparseU = s.get(scene.sparseU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* tokens */}
          {Array.from({ length: N_TOK }, (_, t) => {
            const u = clamp01(stageU * N_TOK - t);
            if (u <= 0) return null;
            return (
              <g key={t} opacity={u}>
                <rect x={TOK_X} y={rowYTok(t)} width={60} height={24} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={TOK_X + 30} y={rowYTok(t) + 16} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily="monospace">
                  tok {t + 1}
                </text>
              </g>
            );
          })}
          {/* experts */}
          {Array.from({ length: N_EXP }, (_, e) => {
            const u = clamp01(stageU * N_EXP - e);
            if (u <= 0) return null;
            return (
              <g key={e} opacity={u}>
                <rect x={EXP_X} y={rowYExp(e)} width={120} height={36} rx={8} fill={colors.PANEL} stroke={colors.SECONDARY} />
                <text x={EXP_X + 60} y={rowYExp(e) + 23} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                  expert {e + 1}
                </text>
                {loadU > 0 && (
                  <g opacity={loadU}>
                    <rect x={EXP_X + 130} y={rowYExp(e) + 10} width={LOAD[e] * 22 * loadU} height={16} rx={4} fill={colors.WARM} opacity={0.8} />
                    <text x={EXP_X + 136 + LOAD[e] * 22 * loadU} y={rowYExp(e) + 23} fill={colors.WARM} fontSize={12} fontFamily="monospace">
                      {LOAD[e]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* probe token 1's full distribution */}
          {probeU > 0 &&
            ROUTES[0].probs.map((p, e) => (
              <Ribbon key={e} t={0} e={e} w={p} color={ROUTES[0].top.includes(e) ? colors.ACCENT : colors.MUTED} u={probeU} />
            ))}

          {/* all tokens, top-2 only */}
          {allU > 0 &&
            ROUTES.map((r, t) => {
              const u = clamp01(allU * N_TOK - t);
              if (t === 0 || u <= 0) return null;
              return r.top.map((e) => (
                <Ribbon key={`${t}-${e}`} t={t} e={e} w={r.probs[e]} color={colors.ACCENT} u={u} />
              ));
            })}

          {/* the sparsity bar */}
          {sparseU > 0 && (
            <g opacity={Math.min(1, sparseU * 1.4)}>
              <text x={200} y={550} fill={colors.TEXT} fontSize={15}>
                parameters held vs activated per token
              </text>
              <rect x={200} y={562} width={760 * sparseU} height={20} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={200} y={562} width={760 * (ACTIVE_B / TOTAL_B) * sparseU} height={20} rx={5} fill={colors.POSITIVE} />
              <text x={970} y={577} fill={colors.MUTED} fontSize={13} fontFamily="monospace" opacity={sparseU}>
                671B total · 37B active ({ACTIVE_PCT}%)
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          A committee with a gag rule
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.12696 · 2607.08782 · 2607.13068
        </text>
      </g>
      <MathLabel
        tex="p = \mathrm{softmax}(x^{\top} E),\;\; \mathrm{top}\!-\!2"
        x={900}
        y={70}
        fontSize={20}
        color={colors.ACCENT}
        opacity={eqU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Sparse to compute, huge to hold.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Each token pays for 5.5% of the model —
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            but somebody has to keep 100% of it within reach.
          </text>
        </g>
      )}
    </>
  );
}

export function MoeRouting() {
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
