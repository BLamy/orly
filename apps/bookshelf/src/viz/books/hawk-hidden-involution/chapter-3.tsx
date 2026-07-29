// Source: hawk_key_recovery.pdf, sections 5 through 7 and Appendix F.
// Persistent object: shortest-vector candidates pass through a congruence filter and descent into an equivalent signing key.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Arrow, Chip, Meter, Panel, ResearchTitle, clamp01, mono } from '../../book-components/research';

const CANDS = Array.from({ length: 10 }, (_, i) => ({ x: 130 + i * 95, sign: i === 3 || i === 7 }));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const candidatesU = tl.channel('candidatesU', 0);
  const filterU = tl.channel('filterU', 0);
  const descentU = tl.channel('descentU', 0);
  const keyU = tl.channel('keyU', 0);
  const costU = tl.channel('costU', 0);
  const implU = tl.channel('implU', 0);
  const scopeU = tl.channel('scopeU', 0);
  const recapU = tl.channel('recapU', 0);
  let t = 0.4;
  t = tl.caption({ at: t, dur: 6.3, text: 'Block reduction returns every shortest candidate. Only two, plus and minus the true cocycle, equal the identity modulo two.' });
  tl.tween(candidatesU, 1, { at: 0.8, dur: 1.5, ease: ease.enter });
  tl.tween(filterU, 1, { at: 2.0, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.4, text: 'For either survivor, a fixed sublattice turns the automorphism back into geometry. One more reduction run recovers an equivalent secret basis.' });
  tl.tween(descentU, 1, { at: t - 5.3, dur: 1.6, ease: ease.draw });
  tl.tween(keyU, 1, { at: t - 2.8, dur: 0.8, ease: ease.pop });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.3, text: 'That basis need not equal the original secret. It produces the same public Gram matrix and signs in its place, which is enough for key recovery.' });
  tl.tween(cam, { x: 640, y: 350, k: 1.05 }, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.5, text: "In the paper's gate-count model, the estimated cost for the five-hundred-twelve parameter set falls from one hundred fifty bits to one hundred eight." });
  tl.tween(costU, 0.5, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.5, text: 'For the one-thousand-twenty-four parameter set, it falls from two hundred eighty-eight bits to one hundred eighty-two.' });
  tl.tween(costU, 1, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.4, text: 'A released implementation recovers a two-hundred-fifty-six parameter secret in a few hours on one server, demonstrating the complete path.' });
  tl.tween(implU, 1, { at: t - 5.3, dur: 1.0, ease: ease.pop });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.4, text: 'The construction depends on the second involution and does not transfer to Falcon. Certain cyclic conductor families evade it as well.' });
  tl.tween(scopeU, 1, { at: t - 5.3, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.2, text: 'Across the series, the pattern repeats: expose hidden algebra, turn it into an invariant, then demand computation strong enough to make the claim survive.' });
  tl.tween(recapU, 1, { at: t - 5.6, dur: 1.0, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: t - 2.0, dur: 1.2, ease: ease.move });
  return { tl, cam, candidatesU, filterU, descentU, keyU, costU, implU, scopeU, recapU };
}
const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const f = s.get(scene.filterU);
  const d = s.get(scene.descentU);
  const cost = s.get(scene.costU);
  return (
    <Camera {...s.get(scene.cam)}>
      <ResearchTitle kicker="The Hidden Involution · 3" title="Half-dimension key recovery" />
      <Panel x={65} y={135} w={1150} h={175} opacity={s.get(scene.candidatesU)} accent={colors.SECONDARY}>
        {CANDS.map((c, i) => {
          const keep = c.sign;
          return <g key={i} opacity={1 - f * (keep ? 0 : 0.82)}><circle cx={c.x} cy={220} r={18} fill={keep ? colors.POSITIVE : colors.SECONDARY} fillOpacity={0.2} stroke={keep ? colors.POSITIVE : colors.SECONDARY} />{!keep && <line x1={c.x - 14} y1={206} x2={c.x + 14} y2={234} stroke={colors.NEGATIVE} strokeWidth={3} opacity={f} />}</g>;
        })}
        <Chip x={1090} y={220} text="Y ≡ I mod 2" opacity={f} color={colors.POSITIVE} width={150} />
      </Panel>
      <Arrow x1={350} y1={310} x2={520} y2={420} reveal={d} color={colors.POSITIVE} />
      <Chip x={350} y={370} text="±Vτ" opacity={f} color={colors.POSITIVE} />
      <Chip x={540} y={420} text="fixed sublattice" opacity={d} color={colors.ACCENT} width={160} />
      <Arrow x1={620} y1={420} x2={790} y2={420} reveal={d} color={colors.ACCENT} />
      <Chip x={875} y={420} text="equivalent key B′" opacity={s.get(scene.keyU)} color={colors.WARM} width={180} />
      <Panel x={65} y={465} w={750} h={145} opacity={cost} accent={colors.WARM}>
        <Meter x={110} y={515} w={280} value={150 - 42 * clamp01(cost * 2)} max={300} label={`HAWK-512 · ${Math.round(150 - 42 * clamp01(cost * 2))} bits`} color={colors.WARM} />
        <Meter x={470} y={515} w={280} value={288 - 106 * clamp01((cost - 0.5) * 2)} max={300} label={`HAWK-1024 · ${Math.round(288 - 106 * clamp01((cost - 0.5) * 2))} bits`} color={colors.SECONDARY} />
      </Panel>
      <g opacity={s.get(scene.implU)}>
        <Chip x={980} y={505} text="HAWK-256 · hours" color={colors.POSITIVE} width={190} />
      </g>
      <g opacity={s.get(scene.scopeU)}>
        <Chip x={980} y={560} text="Falcon unaffected" color={colors.MUTED} width={180} />
      </g>
      <g opacity={s.get(scene.recapU)}>
        <rect x={270} y={160} width={740} height={360} rx={24} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2.5} />
        <text x={640} y={260} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={800}>hidden algebra → invariant → measured attack</text>
        <text x={640} y={330} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>Jacobian · Möbius Bridge · projective search · Galois involution</text>
        <text x={640} y={415} textAnchor="middle" fill={colors.POSITIVE} fontSize={20} fontWeight={750}>Anthropic Research</text>
      </g>
    </Camera>
  );
}
export const vizScene = () => scene;
