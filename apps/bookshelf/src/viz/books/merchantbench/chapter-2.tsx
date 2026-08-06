// The Long Game — chapter 2: Cash Leaves Before the Truth Arrives.
//
// Grounded in arXiv:2607.28956v2 Figure 1 and Sections 3.3-3.4, plus
// env/core/simulator.py _auto_purchase_new_orders, env/core/order_manager.py
// step_orders, and env/scenarios/default.yaml settlement/platform rules.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const STOPS = [
  { x: 178, label: 'ordered', color: colors.ACCENT },
  { x: 405, label: 'late', color: colors.NEGATIVE },
  { x: 632, label: 'shipped', color: colors.SECONDARY },
  { x: 859, label: 'delivered', color: colors.WARM },
  { x: 1086, label: 'settled', color: colors.POSITIVE },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const railU = tl.channel('railU', 0);
  const orderU = tl.channel('orderU', 0);
  const cashU = tl.channel('cashU', 0);
  const promiseU = tl.channel('promiseU', 0);
  const transitU = tl.channel('transitU', 0);
  const delayU = tl.channel('delayU', 0);
  const branchesU = tl.channel('branchesU', 0);
  const outcomeU = tl.channel('outcomeU', 0);
  const feedbackU = tl.channel('feedbackU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.0, text: 'A new customer order commits procurement cash immediately, before the store knows how that order will end.' });
  tl.tween(railU, 1, { at: 0.9, dur: 1.5, ease: ease.draw });
  tl.tween(orderU, 0, { at: 1.4, dur: 0.8, ease: ease.enter });
  tl.tween(cashU, 1, { at: 2.1, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 300, y: 330, k: 1.12 }, { at: 2.3, dur: 1.3, ease: ease.move });
  tl.hold(6.5, 0.8);

  tl.caption({ at: 7.3, dur: 6.0, text: 'The simulator auto-purchases the order from the chosen listing, and the lifecycle begins in the ordered state.' });
  tl.tween(orderU, 0, { at: 7.8, dur: 1.2, ease: ease.move });
  tl.hold(13.3, 0.8);

  tl.caption({ at: 14.1, dur: 6.2, text: 'If dispatch misses the forty-eight-hour promise, the order turns late, pays a penalty, and still keeps moving.' });
  tl.tween(promiseU, 1, { at: 14.6, dur: 1.1, ease: ease.draw });
  tl.tween(orderU, 0.42, { at: 16.0, dur: 2.0, ease: ease.linear });
  tl.tween(cam, { x: 420, y: 330, k: 1.16 }, { at: 16.2, dur: 1.3, ease: ease.move });
  tl.hold(20.3, 0.8);

  tl.caption({ at: 21.1, dur: 6.8, text: 'Supplier dispatch moves it to shipped, then logistics carries the same order to delivered.' });
  tl.tween(orderU, 0.78, { at: 21.6, dur: 3.6, ease: ease.linear });
  tl.tween(transitU, 1, { at: 22.0, dur: 2.8, ease: ease.draw });
  tl.tween(cam, { x: 720, y: 330, k: 1.08 }, { at: 22.4, dur: 1.3, ease: ease.move });
  tl.hold(27.2, 0.8);

  tl.caption({ at: 28.0, dur: 6.3, text: 'A normal delivery still waits through a seven-day settlement delay before revenue returns to the ledger.' });
  tl.tween(delayU, 1, { at: 28.5, dur: 3.2, ease: ease.linear });
  tl.tween(orderU, 1, { at: 31.0, dur: 1.8, ease: ease.move });
  tl.tween(cam, { x: 965, y: 330, k: 1.12 }, { at: 29.2, dur: 1.3, ease: ease.move });
  tl.hold(34.3, 0.8);

  tl.caption({ at: 35.1, dur: 6.5, text: 'But the hidden outcome can surface later as a bad review, a refund, or a returnless refund.' });
  tl.tween(branchesU, 1, { at: 35.6, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 36.2, dur: 1.3, ease: ease.move });
  tl.hold(41.6, 0.8);

  tl.caption({ at: 42.4, dur: 6.2, text: 'Only when the outcome realizes do revenue, penalties, and store rating reveal the full cost of the earlier choice.' });
  tl.tween(outcomeU, 1, { at: 42.9, dur: 1.5, ease: ease.pop });
  tl.tween(feedbackU, 1, { at: 44.0, dur: 2.2, ease: ease.move });
  tl.hold(48.6, 0.8);

  tl.caption({ at: 49.4, dur: 6.6, text: 'Long-term coherence means tracing that delayed evidence back to the listing and deciding whether the policy should change.' });
  tl.tween(dimU, 1, { at: 49.9, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 50.7, dur: 0.7, ease: ease.enter });
  tl.hold(56.0, 1.0);

  return { tl, cam, railU, orderU, cashU, promiseU, transitU, delayU, branchesU, outcomeU, feedbackU, dimU, endU };
}

const scene = buildScene();

function OrderPacket({ x, y, u }: { x: number; y: number; u: number }) {
  return <g transform={`translate(${x} ${y}) scale(${0.86 + 0.14 * clamp01(u)})`} opacity={clamp01(u * 5)}>
    <rect x={-42} y={-30} width={84} height={60} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
    <path d="M-19 -9 H19 M-19 2 H10 M-19 13 H16" stroke={colors.TEXT} strokeWidth={4} strokeLinecap="round" />
    <text y={50} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>order_id</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const orderU = s.get(scene.orderU);
  const x = lerp(STOPS[0].x, STOPS[4].x, orderU);
  const dim = 1 - 0.9 * s.get(scene.dimU);
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={850}>Cash leaves before the truth arrives</text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>order_manager.step_orders · one order, mixed-latency evidence</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        <line x1={STOPS[0].x} y1={320} x2={lerp(STOPS[0].x, STOPS[4].x, s.get(scene.railU))} y2={320} stroke={colors.GRID} strokeWidth={8} strokeLinecap="round" />
        {STOPS.map((stop, i) => <g key={stop.label} opacity={clamp01(s.get(scene.railU) * 5 - i)}>
          <circle cx={stop.x} cy={320} r={19} fill={colors.BG} stroke={stop.color} strokeWidth={4} />
          <text x={stop.x} y={365} textAnchor="middle" fill={stop.color} fontSize={13} fontFamily={MONO}>{stop.label}</text>
        </g>)}
        <OrderPacket x={x} y={320} u={s.get(scene.railU)} />

        <g opacity={s.get(scene.cashU)} transform="translate(120 134)">
          <rect width={320} height={94} rx={18} fill={colors.PANEL} stroke={colors.NEGATIVE} />
          <text x={20} y={30} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>Cash.balance</text>
          <text x={20} y={64} fill={colors.NEGATIVE} fontSize={25} fontWeight={800}>procurement cost exits now</text>
          <path d="M278 72 L360 120" stroke={colors.NEGATIVE} strokeWidth={4} strokeLinecap="round" />
        </g>

        <g opacity={s.get(scene.promiseU)}>
          <line x1={405} y1={222} x2={405} y2={420} stroke={colors.NEGATIVE} strokeWidth={2.5} strokeDasharray="7 7" />
          <rect x={318} y={188} width={174} height={34} rx={17} fill={colors.PANEL} stroke={colors.NEGATIVE} />
          <text x={405} y={210} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>48h promised ship</text>
          <text x={405} y={440} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>timeout penalty: 3</text>
        </g>

        <g opacity={s.get(scene.transitU)}>
          <path d="M632 250 C700 210 790 210 859 250" fill="none" stroke={colors.SECONDARY} strokeWidth={3} />
          <text x={746} y={207} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>supplier_ship_hours + logistics_hours</text>
        </g>

        <g opacity={s.get(scene.delayU)} transform="translate(820 128)">
          <rect width={310} height={82} rx={18} fill={colors.PANEL} stroke={colors.WARM} />
          <text x={155} y={29} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>normal_delay_hours</text>
          <text x={155} y={58} textAnchor="middle" fill={colors.WARM} fontSize={23} fontWeight={800}>168 hours</text>
          <rect x={20} y={69} width={270 * s.get(scene.delayU)} height={5} rx={3} fill={colors.WARM} />
        </g>

        <g opacity={s.get(scene.branchesU)}>
          <path d="M859 388 C910 430 930 460 955 490 M859 388 C840 440 820 468 795 498 M859 388 C770 420 690 456 635 498" fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
          {[
            { x: 955, label: 'bad_review', penalty: 'revenue + fine' },
            { x: 795, label: 'refund', penalty: 'refund + fine' },
            { x: 635, label: 'only_refund', penalty: 'purchase cost lost' },
          ].map((b, i) => <g key={b.label} opacity={clamp01(s.get(scene.branchesU) * 3 - i)}>
            <rect x={b.x - 82} y={498} width={164} height={76} rx={15} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
            <text x={b.x} y={526} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>{b.label}</text>
            <text x={b.x} y={552} textAnchor="middle" fill={colors.MUTED} fontSize={10}>{b.penalty}</text>
          </g>)}
        </g>

        <g opacity={s.get(scene.feedbackU)} transform="translate(96 480)">
          <rect width={390} height={94} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
          <text x={20} y={29} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>realized evidence</text>
          <text x={20} y={59} fill={colors.TEXT} fontSize={15}>revenue · penalty · rating</text>
          <path d="M360 47 C430 47 430 -34 500 -34" fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
        </g>
        {s.get(scene.outcomeU) > 0 && <circle cx={1086} cy={320} r={30 + 12 * s.get(scene.outcomeU)} fill="none" stroke={colors.POSITIVE} strokeWidth={4} opacity={s.get(scene.outcomeU)} />}
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={178} y={228} width={924} height={210} rx={28} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={850}>Delayed evidence has an address</text>
      <text x={640} y={350} textAnchor="middle" fill={colors.WARM} fontSize={18}>one order lifecycle</text>
      <text x={640} y={386} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>one earlier listing decision to revisit</text>
    </g>
  </>;
}

export const vizScene = () => scene;
