// The Long Game — chapter 3: Twenty-Six Levers, One Store.
//
// Grounded in arXiv:2607.28956v2 Agent Interface and Appendix K, plus
// env/tools/registry.py, env/tools/observation.py, env/tools/dispatch.py,
// env/core/simulator.py, and env/scenarios/default.yaml.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const GROUPS = [
  { title: 'PRODUCT SOURCING', color: colors.ACCENT, tools: ['get_daily_report', 'search_products', 'get_product_detail', 'get_supplier_profile', 'list_supplier_products'] },
  { title: 'LISTING + PRICING', color: colors.SECONDARY, tools: ['list_product', 'delist_product', 'adjust_price', 'review_my_listings', 'query_my_listings'] },
  { title: 'CASH + ORDERS', color: colors.WARM, tools: ['query_balance', 'get_store_snapshot', 'query_platform_rules', 'query_my_orders', 'query_open_orders', 'query_order_updates', 'query_order_detail', 'query_cash_pipeline'] },
  { title: 'FEEDBACK + MEMORY', color: colors.POSITIVE, tools: ['query_supply_chain_anomalies', 'query_store_performance', 'query_product_sales_stats', 'read_memory_doc', 'write_memory_doc', 'get_observation', 'list_tools', 'end_of_step'] },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const frameU = tl.channel('frameU', 0);
  const denyU = tl.channel('denyU', 0);
  const toolsU = tl.channel('toolsU', 0);
  const sourceU = tl.channel('sourceU', 0);
  const shelfU = tl.channel('shelfU', 0);
  const financeU = tl.channel('financeU', 0);
  const memoryU = tl.channel('memoryU', 0);
  const closeU = tl.channel('closeU', 0);
  const loopU = tl.channel('loopU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.0, text: 'The agent never touches the hidden simulator state. Merchant tools are its only control surface.' });
  tl.tween(frameU, 1, { at: 0.9, dur: 1.3, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 350, k: 1.02 }, { at: 1.5, dur: 1.3, ease: ease.move });
  tl.hold(6.5, 0.8);

  tl.caption({ at: 7.3, dur: 6.2, text: 'The default scenario withholds two trend tools, leaving the twenty-six merchant tools used in the paper.' });
  tl.tween(denyU, 1, { at: 7.8, dur: 0.8, ease: ease.pop });
  tl.tween(toolsU, 1, { at: 8.7, dur: 3.0, ease: ease.draw });
  tl.hold(13.5, 0.8);

  tl.caption({ at: 14.3, dur: 6.1, text: 'Sourcing tools reveal current catalog and supplier evidence, but never the hidden hazard or its recovery schedule.' });
  tl.tween(sourceU, 1, { at: 14.8, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 350, k: 1.02 }, { at: 15.2, dur: 1.3, ease: ease.move });
  tl.hold(20.4, 0.8);

  tl.caption({ at: 21.2, dur: 6.1, text: 'Listing and pricing controls reshape a shelf capped at fifty active products.' });
  tl.tween(shelfU, 1, { at: 21.7, dur: 2.4, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 350, k: 1.02 }, { at: 22.2, dur: 1.3, ease: ease.move });
  tl.hold(27.3, 0.8);

  tl.caption({ at: 28.1, dur: 6.2, text: 'Balance, order, performance, and cash-pipeline queries expose money that is available, pending, or still unresolved.' });
  tl.tween(financeU, 1, { at: 28.6, dur: 2.1, ease: ease.move });
  tl.tween(cam, { x: 640, y: 350, k: 1.02 }, { at: 29.0, dur: 1.3, ease: ease.move });
  tl.hold(34.3, 0.8);

  tl.caption({ at: 35.1, dur: 6.4, text: 'The memory document can preserve a lesson across the year, but it can preserve a mistaken lesson just as faithfully.' });
  tl.tween(memoryU, 1, { at: 35.6, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.02 }, { at: 36.0, dur: 1.3, ease: ease.move });
  tl.hold(41.5, 0.8);

  tl.caption({ at: 42.3, dur: 6.0, text: 'Ending the step closes the decision hook. Those mutations begin shaping demand from the next hour.' });
  tl.tween(closeU, 1, { at: 42.8, dur: 0.7, ease: ease.pop });
  tl.tween(loopU, 1, { at: 43.7, dur: 2.5, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 44.0, dur: 1.3, ease: ease.move });
  tl.hold(48.3, 0.8);

  tl.caption({ at: 49.1, dur: 6.6, text: 'Coherence is the repeated loop: observe, decide, mutate, close, and revisit when delayed evidence arrives.' });
  tl.tween(dimU, 1, { at: 49.6, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 50.4, dur: 0.7, ease: ease.enter });
  tl.hold(55.7, 1.0);

  return { tl, cam, frameU, denyU, toolsU, sourceU, shelfU, financeU, memoryU, closeU, loopU, dimU, endU };
}

const scene = buildScene();

function ToolGroup({ x, group, u, glow }: { x: number; group: typeof GROUPS[number]; u: number; glow: number }) {
  return <g opacity={clamp01(u)}>
    <rect x={x} y={138} width={266} height={314} rx={20} fill={colors.PANEL} stroke={group.color} strokeWidth={1.5 + glow * 2.5} />
    <text x={x + 133} y={169} textAnchor="middle" fill={group.color} fontSize={11} fontWeight={800} letterSpacing="0.08em">{group.title}</text>
    {group.tools.map((tool, i) => <g key={tool} opacity={clamp01(u * group.tools.length - i)}>
      <rect x={x + 18} y={187 + i * 30} width={230} height={23} rx={8} fill={group.color} opacity={0.08 + glow * 0.12} />
      <text x={x + 30} y={203 + i * 30} fill={glow > 0.3 ? group.color : colors.TEXT} fontSize={9.5} fontFamily={MONO}>{tool}</text>
    </g>)}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const dim = 1 - 0.9 * s.get(scene.dimU);
  const toolsU = s.get(scene.toolsU);
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={850}>Twenty-six levers, one store</text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>observe → act → end_of_step → advance</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim * s.get(scene.frameU)}>
        <rect x={62} y={101} width={1156} height={504} rx={28} fill="none" stroke={colors.GRID} strokeWidth={2} />
        <text x={94} y={126} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>agent decision window · every 12 hours</text>
      </g>
      <g opacity={dim}>
        {GROUPS.map((group, i) => <ToolGroup key={group.title} x={76 + i * 286} group={group} u={clamp01(toolsU * 4 - i)} glow={[s.get(scene.sourceU), s.get(scene.shelfU), s.get(scene.financeU), s.get(scene.memoryU)][i]} />)}

        <g opacity={s.get(scene.denyU)} transform="translate(446 92)">
          <rect width={388} height={35} rx={17} fill={colors.PANEL} stroke={colors.NEGATIVE} />
          <text x={194} y={23} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>denylist: market_brief · hot_search_terms</text>
        </g>

        <g opacity={s.get(scene.shelfU)} transform="translate(92 478)">
          <text x={0} y={-12} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>max_active_listings: 50</text>
          {Array.from({ length: 50 }, (_, i) => {
            const active = i < 37 + Math.round(s.get(scene.shelfU) * 13);
            return <rect key={i} x={(i % 25) * 42} y={Math.floor(i / 25) * 39} width={34} height={30} rx={5} fill={active ? colors.SECONDARY : colors.GRID} opacity={active ? 0.55 + (i % 5) * 0.07 : 0.3} />;
          })}
        </g>

        <g opacity={s.get(scene.financeU)} transform="translate(732 478)">
          {['available cash', 'funds in transit', 'receivables'].map((label, i) => <g key={label} transform={`translate(0 ${i * 34})`}>
            <text x={0} y={18} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>{label}</text>
            <rect x={128} y={5} width={300} height={16} rx={8} fill={colors.GRID} />
            <rect x={128} y={5} width={[210, 132, 178][i] * s.get(scene.financeU)} height={16} rx={8} fill={[colors.POSITIVE, colors.WARM, colors.ACCENT][i]} />
          </g>)}
        </g>

        <g opacity={s.get(scene.memoryU)} transform="translate(964 310)">
          <rect width={214} height={102} rx={16} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={107} y={25} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>memory_doc</text>
          <text x={18} y={52} fill={colors.TEXT} fontSize={11}>lesson persists</text>
          <text x={18} y={75} fill={colors.NEGATIVE} fontSize={11}>truth not guaranteed</text>
        </g>

        <g opacity={s.get(scene.loopU)}>
          <path d="M215 590 C215 620 1065 620 1065 590" fill="none" stroke={colors.ACCENT} strokeWidth={4} strokeDasharray="10 9" />
          <circle cx={215 + 850 * s.get(scene.loopU)} cy={615} r={9} fill={colors.ACCENT} />
          <text x={640} y={603} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>next hour</text>
        </g>
        <g opacity={s.get(scene.closeU)} transform="translate(1004 435)">
          <circle cx={72} cy={42} r={36} fill={colors.POSITIVE} opacity={0.16} />
          <path d="M52 42 L67 57 L94 27" fill="none" stroke={colors.POSITIVE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          <text x={72} y={94} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>end_of_step</text>
        </g>
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={164} y={224} width={952} height={218} rx={28} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={35} fontWeight={850}>The tool call is not the loop</text>
      <text x={640} y={344} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>observe · decide · mutate · close</text>
      <text x={640} y={382} textAnchor="middle" fill={colors.WARM} fontSize={18}>then revisit the evidence later</text>
    </g>
  </>;
}

export const vizScene = () => scene;
