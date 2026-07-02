import { Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import {
  DiffLanes,
  GauntletRail,
  LayerStack,
  MessageCard,
  PredictionCard,
  RecordingStrip,
  messageCardHeight,
} from '../../agent';
import overrides from './overrides.json';
import {
  BANNER,
  BANNERS,
  DIFF,
  FAIL_GATE,
  GATE_LABELS,
  HELD,
  HUNKS,
  LINK_AT,
  M1,
  M2,
  M3,
  MCP_TOOLS,
  MOCK,
  MOCK_FLAG,
  MOCK_NOTE,
  MOCK_TABLE,
  OBSERVED,
  POINTS,
  PREDICTION,
  PROMOTIONS,
  PV,
  RAIL,
  SCREEN,
  STRIP,
  SUITE_GATE,
  TRANSCRIPT,
  buildScene,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/replay-critic/overrides.json', slug: 'replay-critic' };

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// transcript stacking, computed once
const Y1 = TRANSCRIPT.y;
const Y2 = Y1 + messageCardHeight(M1, TRANSCRIPT.w) + TRANSCRIPT.gap;
const Y3 = Y2 + messageCardHeight(M2, TRANSCRIPT.w) + TRANSCRIPT.gap;

/** The worker's checkout screen: every pixel of it is correct. */
function CheckoutScreen({ enter, promo, claim }: { enter: number; promo: number; claim: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const p = clamp01(promo);
  const c = clamp01(claim);
  const { x, y, w, h } = SCREEN;
  const rowX = 22;
  const valX = w - 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e}>
      <text y={-10} fill={colors.MUTED} fontSize={12}>
        the session the worker drove
      </text>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={rowX} y={34} fill={colors.TEXT} fontSize={16} fontWeight={700}>
        Order summary
      </text>
      <text x={rowX} y={72} fill={colors.MUTED} fontSize={14}>
        subtotal
      </text>
      <text x={valX} y={72} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily={mono}>
        $99.00
      </text>
      <g opacity={p}>
        <text x={rowX} y={100} fill={colors.MUTED} fontSize={14}>
          promo
        </text>
        <rect x={rowX + 52} y={87} width={62} height={18} rx={9} fill={colors.POSITIVE} opacity={0.16} />
        <text x={rowX + 83} y={100} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
          SAVE20
        </text>
        <text x={valX} y={100} textAnchor="end" fill={colors.POSITIVE} fontSize={14} fontFamily={mono}>
          −$19.80
        </text>
      </g>
      <line x1={rowX} y1={118} x2={w - 22} y2={118} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={rowX} y={150} fill={colors.TEXT} fontSize={17} fontWeight={700}>
        total
      </text>
      {/* the swap the whole story hinges on — rendered, not stored, not wired */}
      <text x={valX} y={150} textAnchor="end" fill={colors.TEXT} fontSize={19} fontWeight={700} fontFamily={mono} opacity={1 - p}>
        $99.00
      </text>
      <text x={valX} y={150} textAnchor="end" fill={colors.POSITIVE} fontSize={19} fontWeight={700} fontFamily={mono} opacity={p}>
        $79.20
      </text>
      <rect x={rowX} y={h - 58} width={w - 44} height={38} rx={9} fill={colors.ACCENT} opacity={0.2} />
      <rect x={rowX} y={h - 58} width={w - 44} height={38} rx={9} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={w / 2} y={h - 34} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontWeight={700}>
        Pay
      </text>
      {/* the worker's verdict on its own work */}
      {c > 0 && (
        <g transform={`translate(${w / 2}, ${h / 2}) rotate(-10) scale(${0.7 + 0.3 * c})`} opacity={c}>
          <rect x={-128} y={-24} width={256} height={48} rx={8} fill={colors.BG} opacity={0.55} />
          <rect x={-128} y={-24} width={256} height={48} rx={8} fill="none" stroke={colors.WARM} strokeWidth={3.5} />
          <text y={8} textAnchor="middle" fill={colors.WARM} fontSize={21} fontWeight={800} letterSpacing={2} fontFamily={mono}>
            CLAIM: “it works”
          </text>
        </g>
      )}
    </g>
  );
}

/** Per-pass verdict banner, top center. */
function Banner({ text, u, good }: { text: string; u: number; good: boolean }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const color = good ? colors.POSITIVE : colors.NEGATIVE;
  const w = text.length * 7.2 + 32;
  return (
    <g transform={`translate(${BANNER.x}, ${BANNER.y + (1 - uu) * -8})`} opacity={uu}>
      <rect x={-w / 2} y={-15} width={w} height={30} rx={15} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      <text y={4.5} textAnchor="middle" fill={color} fontSize={12} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** The critic's instruments, named. */
function McpChips({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  let cx = STRIP.x;
  return (
    <g>
      <text x={STRIP.x} y={STRIP.y + 66} fill={colors.MUTED} fontSize={12} opacity={clamp01(uu * MCP_TOOLS.length)}>
        the critic’s MCP tools:
      </text>
      {MCP_TOOLS.map((name, i) => {
        const cu = clamp01(uu * MCP_TOOLS.length - i);
        const w = name.length * 7.5 + 20;
        const x0 = cx + 172;
        cx += w + 12;
        if (cu <= 0) return null;
        return (
          <g key={name} transform={`translate(${x0}, ${STRIP.y + 62})`} opacity={cu}>
            <rect y={-11} width={w} height={22} rx={11} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.4} />
            <text x={w / 2} y={4} textAnchor="middle" fill={colors.TEAL} fontSize={11.5} fontFamily={mono}>
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The mock audit panel: the table that made the session pass — in the bundle. */
function MockPanel({ enter, flag }: { enter: number; flag: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const f = clamp01(flag);
  const { x, y, w } = MOCK;
  const flagW = MOCK_FLAG.length * 6.8 + 20;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e}>
      <text y={-10} fill={colors.MUTED} fontSize={12}>
        mock audit
      </text>
      <rect width={w} height={128} rx={10} fill={colors.PANEL} stroke={f > 0.01 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.5} strokeOpacity={f > 0.01 ? 0.4 + 0.6 * f : 1} />
      <text x={18} y={38} fontSize={14.5} fontFamily={mono}>
        <tspan fill={colors.TEXT}>{MOCK_TABLE.slice(0, MOCK_TABLE.indexOf('TESTFREE'))}</tspan>
        <tspan fill={f > 0.3 ? colors.NEGATIVE : colors.TEXT} fontWeight={f > 0.3 ? 700 : 400}>
          TESTFREE: 1.0
        </tspan>
        <tspan fill={colors.TEXT}>{'}'}</tspan>
      </text>
      {f > 0 && (
        <g transform={`translate(18, 66)`} opacity={f}>
          <rect y={-13} width={flagW} height={22} rx={11} fill={colors.NEGATIVE} opacity={0.16} />
          <text x={flagW / 2} y={2.5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
            {MOCK_FLAG}
          </text>
          <text y={36} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
            {MOCK_NOTE}
          </text>
        </g>
      )}
    </g>
  );
}

/** 4/4 HELD, cascading — then the promotions. */
function HeldGrid({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const W = 380;
  const cols = [250, 660];
  const rows = [130, 200];
  return (
    <g>
      {HELD.map((label, i) => {
        const cu = clamp01(uu * HELD.length - i);
        if (cu <= 0) return null;
        const x = cols[i % 2];
        const y = rows[Math.floor(i / 2)];
        return (
          <g key={label} transform={`translate(${x}, ${y + (1 - cu) * 10})`} opacity={cu}>
            <rect width={W} height={48} rx={9} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={16} y={30} fill={colors.TEXT} fontSize={15} fontFamily={mono}>
              {label}
            </text>
            <g transform={`translate(${W - 62}, 24) rotate(-7) scale(${0.7 + 0.3 * cu})`}>
              <rect x={-38} y={-14} width={76} height={28} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
              <text y={5.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={800} letterSpacing={2} fontFamily={mono}>
                HELD
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}

function PromotionChip({ name, sub, color, x, y, u }: { name: string; sub: string; color: string; x: number; y: number; u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu}>
      {/* promotion arrow: out of the pass, into the suite */}
      <path d={`M -26 24 h 14 m 0 0 l -5 -5 m 5 5 l -5 5`} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      <rect width={560} height={54} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      <rect width={5} height={54} rx={2.5} fill={color} opacity={0.8} />
      <text x={18} y={23} fill={colors.TEXT} fontSize={15} fontWeight={700} fontFamily={mono}>
        {name}
      </text>
      <text x={18} y={43} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        {sub}
      </text>
    </g>
  );
}

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  const gSession = s.get(scene.gSession);
  const gStrip = s.get(scene.gStrip);
  const gPV = s.get(scene.gPV);
  const gDiff = s.get(scene.gDiff);
  const gHeld = s.get(scene.gHeld);
  const stackRows = s.get(scene.stackU);
  const conn = s.get(scene.connU);
  const diffRows = s.get(scene.diffU);
  const cU = s.get(scene.classU);

  return (
    <>
      {/* beat 1 — the worker's session: transcript + the screen it trusted */}
      {gSession > 0.002 && (
        <g opacity={gSession}>
          <MessageCard x={TRANSCRIPT.x} y={Y1} w={TRANSCRIPT.w} role="assistant" text={M1} u={s.get(scene.m1T)} enter={s.get(scene.m1E)} />
          <MessageCard x={TRANSCRIPT.x} y={Y2} w={TRANSCRIPT.w} role="tool" text={M2} u={s.get(scene.m2T)} enter={s.get(scene.m2E)} />
          <MessageCard x={TRANSCRIPT.x} y={Y3} w={TRANSCRIPT.w} role="assistant" text={M3} u={s.get(scene.m3T)} enter={s.get(scene.m3E)} glow={0.5 * s.get(scene.claimU)} />
          <CheckoutScreen enter={s.get(scene.scrE)} promo={s.get(scene.promoU)} claim={s.get(scene.claimU)} />
        </g>
      )}

      {/* beat 2 — the recording under the session */}
      {gStrip > 0.002 && (
        <g opacity={gStrip}>
          <RecordingStrip
            x={STRIP.x}
            y={STRIP.y}
            w={STRIP.w}
            points={POINTS}
            u={s.get(scene.stripU)}
            reveal={s.get(scene.stripR)}
            links={[{ at: LINK_AT, label: 'point @ 12.4s', pop: s.get(scene.linkPop) }]}
          />
          <McpChips u={s.get(scene.mcpU)} />
        </g>
      )}

      {/* beat 3 — predict-then-verify */}
      {gPV > 0.002 && (
        <g opacity={gPV}>
          <PredictionCard
            x={PV.predX}
            y={PV.predY}
            w={PV.predW}
            text={PREDICTION}
            stamp="predicted @ 12.4s"
            stampU={s.get(scene.predStamp)}
            u={s.get(scene.predText)}
            observed={OBSERVED}
            observedU={s.get(scene.predObs)}
            verdictKind="failed"
            verdictU={s.get(scene.predV)}
            link="⌖ 12.4s"
            linkU={s.get(scene.predV)}
            enter={s.get(scene.predE)}
          />
          <LayerStack
            x={PV.stackX}
            y={PV.stackY}
            w={PV.stackW}
            rows={[
              { label: 'RENDER', value: '$79.20', u: clamp01(stackRows * 3) },
              { label: 'STORE', value: '99.00', u: clamp01(stackRows * 3 - 1) },
              { label: 'WIRE', value: '{total: 99.00}', u: clamp01(stackRows * 3 - 2) },
            ]}
            connectors={[
              { u: conn, snap: s.get(scene.snapU) },
              { u: conn, snap: 0 },
            ]}
            verdict="FAILED"
            verdictU={s.get(scene.stackV)}
          />
        </g>
      )}
      <Banner text={BANNERS[0]} u={s.get(scene.ban0)} good={false} />

      {/* beat 4 — sufficiency + the mock audit */}
      {gDiff > 0.002 && (
        <g opacity={gDiff}>
          <DiffLanes
            x={DIFF.x}
            y={DIFF.y}
            w={DIFF.w}
            hunks={HUNKS.map((hk, i) => ({
              ...hk,
              hits: i === 0 ? s.get(scene.hitsU) : 0,
              u: clamp01(diffRows * HUNKS.length - i),
              classU: clamp01(cU * HUNKS.length - i),
            }))}
          />
          <MockPanel enter={s.get(scene.mockE)} flag={s.get(scene.mockFlag)} />
        </g>
      )}
      <Banner text={BANNERS[1]} u={s.get(scene.ban1)} good={false} />

      {/* beat 5 — satisfied, then promotion */}
      {gHeld > 0.002 && (
        <g opacity={gHeld}>
          <HeldGrid u={s.get(scene.heldU)} />
          <PromotionChip
            name={PROMOTIONS[0].name}
            sub={PROMOTIONS[0].sub}
            color={colors.POSITIVE}
            x={360}
            y={310}
            u={s.get(scene.promo1)}
          />
          <PromotionChip
            name={PROMOTIONS[1].name}
            sub={PROMOTIONS[1].sub}
            color={colors.TEAL}
            x={360}
            y={392}
            u={s.get(scene.promo2)}
          />
        </g>
      )}
      <Banner text={BANNERS[2]} u={s.get(scene.ban2)} good />

      {/* beat 6 — the gauntlet */}
      <GauntletRail
        x={RAIL.x}
        y={RAIL.y}
        w={RAIL.w}
        gates={GATE_LABELS.map((label, i) => ({ label, state: s.get(scene.gates[i]) }))}
        u={s.get(scene.railU)}
        reveal={s.get(scene.railR)}
        arcU={s.get(scene.arcU)}
        arcFrom={FAIL_GATE}
        deposit={{ gate: SUITE_GATE, label: '+1 spec', u: s.get(scene.depU) }}
      />
    </>
  );
}

export function ReplayCritic() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {renderFrame}
      </Player>
    </div>
  );
}

// registry adapter (see src/viz/scenes.ts) — lets books embed this scene via step.viz
export const vizScene = () => scene;
export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
