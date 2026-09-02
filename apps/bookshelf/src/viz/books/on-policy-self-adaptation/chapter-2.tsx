// Grounding: slime/backends/megatron_utils/opsa.py compute_opsa; tests/test_opsa.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const TOKENS = [
  { id: 'p0', sample: 0, logp: -0.1, valid: false }, { id: 'p1', sample: 0, logp: -0.2, valid: false },
  { id: 'a', sample: 0, logp: -0.8, valid: true }, { id: 'b', sample: 0, logp: -2.7, valid: true }, { id: 'c', sample: 0, logp: -1.2, valid: true }, { id: 'd', sample: 0, logp: -3.8, valid: true }, { id: 'e', sample: 0, logp: -1.6, valid: true }, { id: 'f', sample: 0, logp: -2.1, valid: true }, { id: 'g', sample: 0, logp: -0.5, valid: true }, { id: 'h', sample: 0, logp: -2.7, valid: true }, { id: 'i', sample: 0, logp: -1.9, valid: true }, { id: 'j', sample: 0, logp: -0.9, valid: true },
  { id: 'p2', sample: 1, logp: -0.1, valid: false }, { id: 'p3', sample: 1, logp: -0.2, valid: false },
  { id: 'k', sample: 1, logp: -3.2, valid: true }, { id: 'l', sample: 1, logp: -1.1, valid: true }, { id: 'm', sample: 1, logp: -2.4, valid: true }, { id: 'n', sample: 1, logp: -0.7, valid: true }, { id: 'o', sample: 1, logp: -4.2, valid: true }, { id: 'q', sample: 1, logp: -1.4, valid: true }, { id: 'r', sample: 1, logp: -2.0, valid: true }, { id: 's', sample: 1, logp: -0.6, valid: true }, { id: 't', sample: 1, logp: -1.7, valid: true }, { id: 'u', sample: 1, logp: -2.2, valid: true },
] as const;
const VALID = TOKENS.filter((t) => t.valid);
const ORDER = [...VALID].sort((a, b) => a.logp - b.logp);
const RANK = new Map(ORDER.map((t, i) => [t.id, i]));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const rowsU = tl.channel('packed samples', 0);
  const maskU = tl.channel('response masks', 0);
  const flattenU = tl.channel('flatten valid tokens', 0);
  const sortU = tl.channel('stable ascending sort', 0);
  const cutU = tl.channel('lowest fraction cut', 0);
  const oneU = tl.channel('at least one token', 0);
  const splitU = tl.channel('split masks back', 0);
  const closeU = tl.channel('selector close', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'A training worker receives a packed batch: several sampled responses, each with prompt tokens and response tokens.' });
  tl.tween(rowsU, 1, { at: 0.9, dur: 1.5, ease: ease.enter });

  tl.caption({ at: 6.5, dur: 5.8, text: 'The original loss masks mark which positions are valid response tokens. Prompt positions never enter the selection.' });
  tl.tween(maskU, 1, { at: 7.1, dur: 1.4, ease: ease.draw });

  tl.caption({ at: 12.6, dur: 5.8, text: 'Conceptually, the selector concatenates every valid token on this data-parallel worker into one ribbon.' });
  tl.tween(flattenU, 1, { at: 13.2, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: 640, y: 360, k: 1.06 }, { at: 15.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 18.7, dur: 5.8, text: 'It sorts that ribbon by the current actor’s sampled-token log probability, lowest first.' });
  tl.tween(sortU, 1, { at: 19.3, dur: 2.5, ease: ease.move });

  tl.caption({ at: 24.8, dur: 5.8, text: 'The canonical fraction is one fifth, so four of these twenty valid tokens cross the cut.' });
  tl.tween(cutU, 1, { at: 25.4, dur: 1.2, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 350, k: 1.06 }, { at: 27.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.9, dur: 5.8, text: 'The count is the floor of the fraction times the valid count, but any nonempty batch still selects at least one token.' });
  tl.tween(oneU, 1, { at: 31.5, dur: 0.8, ease: ease.pop });

  tl.caption({ at: 37.0, dur: 5.8, text: 'A stable sort keeps equal log probabilities in their original order, making the boundary deterministic.' });
  tl.tween(cam, { x: 640, y: 350, k: 1.06 }, { at: 37.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 43.1, dur: 5.8, text: 'Selected positions receive ones in a new training mask. Every other valid response token receives zero.' });
  tl.tween(splitU, 1, { at: 43.7, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 46.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 49.2, dur: 6.2, text: 'The selector does not chase whole answers. It focuses one packed batch on the actor’s least expected sampled tokens.' });
  tl.tween(closeU, 1, { at: 50.0, dur: 1.2, ease: ease.move });
  tl.hold(55.4, 1.2);

  return { tl, cam, rowsU, maskU, flattenU, sortU, cutU, oneU, splitU, closeU };
}

const scene = buildScene();

function lerp(a: number, b: number, u: number) { return a + (b - a) * u; }

export function Render({ s }: { s: SceneState }) {
  const flat = s.get(scene.flattenU);
  const sort = s.get(scene.sortU);
  const cut = s.get(scene.cutU);
  const split = s.get(scene.splitU);
  const close = s.get(scene.closeU);
  return <><text x="640" y="76" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850" opacity={1 - close}>select the lowest fifth, across the batch</text><Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      {[0, 1].map((sample) => <g key={sample} opacity={(1 - flat) * s.get(scene.rowsU)}>
        <text x="66" y={218 + sample * 154} fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>{`sample ${sample}`}</text>
        <rect x="112" y={174 + sample * 154} width="1054" height="94" rx="22" fill="#101a2b" stroke={colors.GRID} />
      </g>)}
      {TOKENS.map((token, i) => {
        const rowIndex = TOKENS.filter((t) => t.sample === token.sample).findIndex((t) => t.id === token.id);
        const ox = 150 + rowIndex * 84;
        const oy = 220 + token.sample * 154;
        const rank = token.valid ? (RANK.get(token.id) ?? 0) : i;
        const fx = token.valid ? 156 + rank * 51 : 1050 + (i % 4) * 48;
        const fy = token.valid ? 354 : 520;
        const x = lerp(ox, fx, flat * (1 - sort)) + (token.valid ? (fx - lerp(ox, fx, flat * (1 - sort))) * sort : 0);
        const y = lerp(oy, fy, flat);
        const selected = token.valid && rank < 4;
        const active = token.valid ? 1 : 1 - s.get(scene.maskU) * 0.75;
        return <g key={token.id} transform={`translate(${x} ${y + split * (token.sample === 0 ? -110 : 110)})`} opacity={s.get(scene.rowsU) * active}>
          <rect x="-21" y="-28" width="42" height="56" rx="12" fill={selected && cut ? '#341923' : token.valid ? '#13243b' : '#202332'} stroke={selected && cut ? colors.NEGATIVE : token.valid ? colors.ACCENT : colors.MUTED} strokeWidth={selected && cut ? 3 : 1.5} />
          <text y="-3" textAnchor="middle" fill={selected && cut ? colors.WARM : colors.TEXT} fontSize="12" fontWeight="800">{token.id}</text>
          <text y="16" textAnchor="middle" fill={colors.MUTED} fontSize="9" fontFamily={colors.font.mono}>{token.logp.toFixed(1)}</text>
          {split > 0 && <circle cx="14" cy="-20" r="9" fill={selected ? colors.POSITIVE : colors.GRID} stroke={selected ? colors.POSITIVE : colors.MUTED} />}
        </g>;
      })}
      <g opacity={cut}>
        <line x1="365" y1="274" x2="365" y2="438" stroke={colors.WARM} strokeWidth="4" strokeDasharray="8 6" />
        <rect x="155" y="434" width="210" height="42" rx="18" fill="#2b2415" stroke={colors.WARM} />
        <text x="260" y="460" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>K = floor(0.2 × 20) = 4</text>
      </g>
      <g opacity={s.get(scene.oneU)} transform="translate(650 468)">
        <rect x="-180" y="-28" width="360" height="56" rx="20" fill="#102a22" stroke={colors.POSITIVE} />
        <text y="7" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>max(1, floor(f × N)) when N &gt; 0</text>
      </g>
      <g opacity={s.get(scene.maskU) * (1 - flat)}>
        <text x="640" y="548" textAnchor="middle" fill={colors.MUTED} fontSize="14">prompt mask 0 · valid response mask 1</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="170" y="120" width="940" height="438" rx="46" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="194" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">one batch becomes one ordered ribbon</text>
      {ORDER.slice(0, 12).map((t, i) => <g key={t.id} transform={`translate(${250 + i * 70} 344)`}>
        <rect x="-25" y="-34" width="50" height="68" rx="13" fill={i < 4 ? '#341923' : '#15243a'} stroke={i < 4 ? colors.NEGATIVE : colors.ACCENT} strokeWidth={i < 4 ? 3 : 1.5} />
        <text y="-5" textAnchor="middle" fill={i < 4 ? colors.WARM : colors.TEXT} fontWeight="800">{t.id}</text>
        <text y="18" textAnchor="middle" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>{t.logp.toFixed(1)}</text>
      </g>)}
      <text x="640" y="488" textAnchor="middle" fill={colors.MUTED} fontSize="17">valid only · stable ascending sort · exact loss mask</text>
    </g>
  </Camera></>;
}

export const vizScene = () => scene;
