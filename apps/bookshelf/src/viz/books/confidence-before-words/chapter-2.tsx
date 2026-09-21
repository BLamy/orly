// One score, four routes
//
// Backing (Nandakishor M, arXiv:2510.01237v1, user-supplied four-page PDF; no repository):
//   p.2 eq. 5 — routing intervals: C ≥ 0.75 local model; 0.55 ≤ C < 0.75 retrieval-augmented
//               generation; 0.35 ≤ C < 0.55 larger model; C < 0.35 human review.
//   p.2–3     — thresholds 0.75 / 0.55 / 0.35 are fixed after validation in the reported
//               setup (SmolLM2-360M-Instruct as the local model).
//
// Exact boundary behavior: every band includes its LOWER edge (`routeIndex` in
// shared/machines.tsx uses >=), so a score of exactly 0.55 routes to retrieval while
// 0.5499… routes to the larger model. Beat 6 tweens the score linearly and ends on the
// literal 0.55, so the switch flips on the final sampled frame and nowhere earlier.
//
// Illustrative inputs: every bead score (0.85, 0.65, 0.45, 0.20, 0.549 → 0.55) is an
// example, labeled 'Illustrative score'. No route is drawn as a correctness guarantee:
// human review stays 'pending' and every answer ends at an 'unverified' marker.
//
// Machine: one continuous 0–1 rail, four colored intervals, a bead whose selector arm
// mechanically picks one of four curved tracks.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import {
  ActivationRibbon,
  LAYERS,
  Label,
  Note,
  ROUTES,
  RouteRail,
  THRESHOLDS,
  Tag,
  clamp01,
  lerp,
  railGeom,
  routeIndex,
  seg,
} from './shared/machines';

const { ACCENT, WARM, MUTED, TEXT, PANEL, font } = colors;

export const CAPTIONS = [
  'Once the score exists, routing becomes a simple threshold decision. One moving marker selects among four possible responses.',
  'At zero point seven five or above, the question stays with the local model. This is the highest-confidence band.',
  'From zero point five five up to zero point seven five, the system routes to retrieval-augmented generation, bringing in external information.',
  'From zero point three five up to zero point five five, it escalates to a larger model.',
  'Below zero point three five, it sends the question for human review. That handoff still needs an actual review process.',
  'The boundary matters. A score of exactly zero point five five enters the retrieval band, because its lower edge is included.',
  'These thresholds are fixed after validation in the reported setup. A different domain may need different calibration.',
  'The score chooses where to spend effort. None of the four routes, by itself, guarantees a correct answer.',
  'The whole mechanism is a switch before an answer: process the query, estimate confidence, then choose the response pathway.',
] as const;

// ---------------------------------------------------------------------------
// Layout. Captions own y ≥ 633; the machine lives in y = 60…600.
// ---------------------------------------------------------------------------

const GEOM = railGeom(160, 230, 960, 170);
const ST = { w: 200, h: 100, y: GEOM.y + GEOM.trackH + 6 };
const MARK_Y = ST.y + ST.h + 44;
const BANDS_TEX = ['C < 0.35', '0.35 \\le C < 0.55', '0.55 \\le C < 0.75', 'C \\ge 0.75'];

// beat-6 magnifier: the rail from 0.545 to 0.555, one hundred times larger
const MAG = { x: 508, w: 360, y: 330, lo: 0.545, hi: 0.555 };
const magX = (score: number) => MAG.x + ((score - MAG.lo) / (MAG.hi - MAG.lo)) * MAG.w;
const BOUNDARY = THRESHOLDS[1]; // 0.55
const JUST_BELOW = 0.549;

// beat-9 recap: ribbon → estimate → rail
const RIB = { x: 160, y: 62, w: 300, h: 60 };
const EST = { x: 600, y: 92 };
const RECAP_SCORE = 0.65;

/** Truncate (never round up) so the readout cannot claim 0.5500 before the score is 0.55. */
const truncated = (score: number, places: number) => {
  const k = 10 ** places;
  return (Math.floor(score * k + 1e-7) / k).toFixed(places);
};

// ---------------------------------------------------------------------------
// Timeline — nine fixed captions, ≈ 87 authored seconds.
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 640, y: 230, k: 1.6 }, cameraInterp);
  const n = (k: string, v = 0) => tl.channel(k, v);
  const to = (ch: ChannelRef<number>, v: number, at: number, dur = 0.7, e = ease.enter) =>
    tl.tween(ch, v, { at, dur, ease: e });
  const look = (c: CameraState, at: number, dur = 1.4) => tl.tween(cam, c, { at, dur, ease: ease.move });
  const B = (i: number) => 0.5 + 9.6 * (i - 1);
  const DUR = 8.4;

  const railU = n('railU');
  const trackU = n('trackU');
  const stationsO = n('stationsO');
  const score = n('score', 0.1);
  const beadO = n('beadO');
  const whisper = n('whisper');
  const precise = n('precise');
  const pktU = n('pktU', -1);
  const pkt2U = n('pkt2U');
  const st = [n('stHuman'), n('stLarge'), n('stRag'), n('stLocal')];
  const magO = n('magO');
  const edgeO = n('edgeO');
  const lockU = n('lockU');
  const lockO = n('lockO', 1);
  const marksO = n('marksO');
  const recapO = n('recapO');
  const recapLit = n('recapLit');
  const estU = n('estU');
  const step = n('step');

  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: DUR, text }));

  // 1 — the rail draws, dividers land, four tracks unfurl, one bead sweeps
  to(railU, 1, 0.6, 1.6, ease.draw);
  look(CAMERA_HOME, 2.0, 1.6);
  to(trackU, 1, 2.6, 1.6, ease.draw);
  to(stationsO, 1, 3.8);
  to(beadO, 1, 4.6);
  to(score, 0.85, 5.2, 3.0, ease.move);
  tl.hold(B(1) + DUR, 1.2);

  // 2…5 — one illustrative score per band; the selected route lights, the rest whisper
  const visits: { beat: number; value: number; camX: number }[] = [
    { beat: 2, value: 0.85, camX: 747 },
    { beat: 3, value: 0.65, camX: 740 },
    { beat: 4, value: 0.45, camX: 540 },
    { beat: 5, value: 0.2, camX: 533 },
  ];
  visits.forEach(({ beat, value, camX }, k) => {
    const at = B(beat);
    const idx = routeIndex(value);
    if (k > 0) to(st[routeIndex(visits[k - 1].value)], 0, at, 0.5);
    tl.set(pktU, -1, at);
    look({ x: camX, y: 340, k: 1.2 }, at, 1.4);
    to(whisper, 1, at, 0.8);
    to(score, value, at + 0.4, 1.2, ease.move);
    tl.set(pktU, 0, at + 1.8);
    to(pktU, 1, at + 1.8, 1.6, ease.linear);
    to(st[idx], 1, at + 3.4, 1.8, ease.move);
    tl.hold(at + DUR, 1.2);
  });

  // 6 — magnify the 0.55 boundary: 0.549 → exactly 0.55, the switch flips on arrival
  to(st[0], 0, B(6), 0.5);
  tl.set(pktU, -1, B(6));
  look({ x: 688, y: 322, k: 2.4 }, B(6), 1.6);
  to(score, JUST_BELOW, B(6) + 0.2, 1.4, ease.move);
  tl.set(precise, 1, B(6) + 1.6);
  to(stationsO, 0, B(6) + 0.2, 0.6); // stations sit under the caption strip at this zoom
  to(magO, 1, B(6) + 1.6);
  to(edgeO, 1, B(6) + 2.2);
  to(score, BOUNDARY, B(6) + 4.0, 2.4, ease.linear);
  tl.hold(B(6) + DUR, 1.2);

  // 7 — pull back; the thresholds lock
  to(magO, 0, B(7), 0.5);
  to(stationsO, 1, B(7) + 0.6);
  tl.set(precise, 0, B(7) + 0.5);
  look(CAMERA_HOME, B(7), 1.5);
  to(whisper, 0.5, B(7), 0.8);
  to(lockU, 1, B(7) + 1.6, 0.6, ease.pop);
  tl.hold(B(7) + DUR, 1.2);

  // 8 — all routes visible; the query follows its route to an answer that is still unverified
  to(lockO, 0.15, B(8));
  to(edgeO, 0, B(8));
  to(score, 0.65, B(8) + 0.4, 1.0, ease.move);
  to(marksO, 1, B(8) + 1.0);
  tl.set(pktU, 0, B(8) + 1.8);
  to(pktU, 1, B(8) + 1.8, 1.6, ease.linear);
  to(st[2], 1, B(8) + 3.4, 1.4, ease.move);
  to(pkt2U, 1, B(8) + 5.0, 1.2, ease.linear);
  tl.hold(B(8) + DUR, 1.2);

  // 9 — recap in three beats: process → estimate → choose
  tl.set(pktU, -1, B(9));
  to(pkt2U, 0, B(9), 0.1);
  to(lockO, 0, B(9), 0.5);
  to(marksO, 0, B(9), 0.5);
  to(st[2], 0, B(9), 0.5);
  to(stationsO, 0.15, B(9), 0.6);
  to(beadO, 0, B(9), 0.5);
  look({ x: 640, y: 300, k: 1.1 }, B(9), 1.5);
  to(recapO, 1, B(9) + 0.6);
  tl.set(step, 1, B(9) + 1.2);
  to(recapLit, LAYERS, B(9) + 1.2, 1.8, ease.linear);
  tl.set(step, 2, B(9) + 3.2);
  to(estU, 1, B(9) + 3.2, 1.4, ease.draw);
  to(beadO, 1, B(9) + 4.4);
  tl.set(step, 3, B(9) + 5.2);
  tl.set(pktU, 0, B(9) + 5.2);
  to(pktU, 1, B(9) + 5.2, 1.6, ease.linear);
  to(stationsO, 0.6, B(9) + 5.2, 0.8);
  tl.hold(B(9) + DUR, 1.6);

  return {
    tl, cam, railU, trackU, stationsO, score, beadO, whisper, precise, pktU, pkt2U, st, magO, edgeO,
    lockU, lockO, marksO, recapO, recapLit, estU, step,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state
// ---------------------------------------------------------------------------

/** What waits at the end of each track. `u` animates the station's own small mechanism. */
function Station({ i, u }: { i: number; u: number }) {
  const cx = GEOM.tracks[i].stationX;
  const x = cx - ST.w / 2;
  const y = ST.y;
  const color = ROUTES[i].color;
  const dots = (n: number, gx: number, gy: number, pitch: number, glow: number) =>
    Array.from({ length: n * n }, (_, k) => (
      <circle key={k} cx={gx + (k % n) * pitch} cy={gy + Math.floor(k / n) * pitch} r={pitch * 0.28} fill={color}
        fillOpacity={0.18 + 0.75 * glow * (0.55 + 0.45 * Math.sin(1.9 * k + 0.7))} />
    ));
  return (
    <g>
      <rect x={x} y={y} width={ST.w} height={ST.h} rx={10} fill={PANEL} stroke={color} strokeOpacity={0.6} />
      <text x={x + 12} y={y + 20} fill={color} fontFamily={font.ui} fontSize={13} fontWeight={600}>{ROUTES[i].label}</text>
      <MathLabel tex={BANDS_TEX[i]} x={x + 12} y={y + 38} fontSize={11} color={MUTED} anchor="start" boxWidth={160} />
      {i === 3 ? (
        <g>{dots(3, x + 130, y + 52, 14, u)}</g>
      ) : i === 2 ? (
        <g>
          {[0, 1, 2].map((d) => {
            const a = seg(u, d * 0.2, d * 0.2 + 0.6);
            const dx = lerp(x + ST.w + 40, x + 96 + d * 30, a);
            return (
              <g key={d} opacity={a}>
                <rect x={dx} y={y + 52} width={22} height={28} rx={3} fill={PANEL} stroke={color} strokeWidth={1.4} />
                <line x1={dx + 5} y1={y + 61} x2={dx + 17} y2={y + 61} stroke={color} strokeWidth={1.2} />
                <line x1={dx + 5} y1={y + 67} x2={dx + 17} y2={y + 67} stroke={color} strokeWidth={1.2} />
                <line x1={dx + 5} y1={y + 73} x2={dx + 13} y2={y + 73} stroke={color} strokeWidth={1.2} />
              </g>
            );
          })}
          <circle cx={x + 70} cy={y + 66} r={6} fill={WARM} opacity={u > 0 ? 1 : 0.25} />
          <Label x={x + 12} y={y + 90} text="query + external documents" size={9} o={seg(u, 0.6, 1)} />
        </g>
      ) : i === 1 ? (
        <g>{dots(6, x + 106, y + 46, 9, u)}</g>
      ) : (
        <g>
          <path d={`M${x + 100},${y + 58} v22 h74 v-22`} fill="none" stroke={color} strokeWidth={1.6} />
          <rect x={x + 112} y={lerp(y + 30, y + 52, clamp01(u * 1.5))} width={50} height={24} rx={3} fill={PANEL} stroke={TEXT}
            strokeOpacity={0.8} opacity={clamp01(u * 2)} />
          <circle cx={x + 137} cy={lerp(y + 42, y + 64, clamp01(u * 1.5))} r={4} fill={WARM} opacity={clamp01(u * 2)} />
          <Label x={x + 12} y={y + 90} text="status: pending · not solved" size={9} color={TEXT} o={seg(u, 0.6, 1)} />
        </g>
      )}
    </g>
  );
}

function Lock({ x, y, u }: { x: number; y: number; u: number }) {
  if (u <= 0) return null;
  const k = clamp01(u);
  return (
    <g transform={`translate(${x}, ${y}) scale(${0.6 + 0.4 * u})`} opacity={k}>
      <path d="M-5,-4 v-5 a5,5 0 0 1 10,0 v5" fill="none" stroke={TEXT} strokeWidth={1.8} />
      <rect x={-8} y={-4} width={16} height={12} rx={2.5} fill={PANEL} stroke={TEXT} strokeWidth={1.6} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const score = g(scene.score);
  const sel = routeIndex(score);
  const beadO = g(scene.beadO);
  const whisper = g(scene.whisper);
  const precise = g(scene.precise) > 0.5;
  const pktU = g(scene.pktU);
  const pkt2U = g(scene.pkt2U);
  const magO = g(scene.magO);
  const stationsO = g(scene.stationsO);
  const recapO = g(scene.recapO);
  const step = g(scene.step);
  const estU = g(scene.estU);
  const lockU = g(scene.lockU);
  const lockO = g(scene.lockO);
  const marksO = g(scene.marksO);

  const track = GEOM.tracks[sel];
  const pkt = pktU >= 0 ? track.point(clamp01(pktU)) : null;
  const beadX = GEOM.sx(RECAP_SCORE);
  const stepO = (k: number) => (step === k ? 1 : step > k ? 0.45 : 0.2);

  return (
    <g>
      <Camera {...g(scene.cam)}>
        <Note x={GEOM.x + GEOM.w} y={GEOM.y - 46} text="confidence score C" anchor="end" size={13} color={MUTED} o={g(scene.railU) * (1 - recapO)} />

        <RouteRail geom={GEOM} reveal={g(scene.railU)} trackU={g(scene.trackU)} score={score} beadO={beadO}
          whisper={whisper} edgeMarks={g(scene.edgeO)} size={12}
          beadLabel={`C = ${truncated(score, precise ? 4 : 2)}`}>
          {/* stations ride the same selection emphasis as their tracks */}
          {ROUTES.map((r, i) => {
            const on = beadO > 0 && i === sel;
            const o = stationsO * (on ? 1 : lerp(0.6, 0.15, whisper * clamp01(beadO)));
            return o > 0 ? (
              <g key={r.key} opacity={o}>
                <Station i={i} u={g(scene.st[i])} />
                {/* beat 8 — every route ends at the same unverified-answer marker */}
                <g opacity={marksO}>
                  <line x1={GEOM.tracks[i].stationX} y1={ST.y + ST.h} x2={GEOM.tracks[i].stationX} y2={MARK_Y - 10}
                    stroke={r.color} strokeWidth={1.4} strokeDasharray="3 4" />
                  <path d={`M${GEOM.tracks[i].stationX},${MARK_Y - 8} l8,8 l-8,8 l-8,-8 z`} fill={PANEL} stroke={TEXT} strokeWidth={1.4} />
                  <Label x={GEOM.tracks[i].stationX + 16} y={MARK_Y + 4} text="answer · unverified" size={10} color={TEXT} />
                </g>
              </g>
            ) : null;
          })}
        </RouteRail>

        {/* the query packet: track → station → (beat 8) unverified-answer marker */}
        {pkt && pkt2U <= 0 ? <circle cx={pkt.x} cy={pkt.y} r={6} fill={WARM} /> : null}
        {pkt2U > 0 ? (
          <circle cx={track.stationX} cy={lerp(ST.y + ST.h, MARK_Y - 12, pkt2U)} r={6} fill={WARM} opacity={0.35 + 0.65 * marksO} />
        ) : null}

        {/* beat 7 — locks on the three validated thresholds */}
        <g opacity={lockO}>
          {THRESHOLDS.map((th, i) => (
            <Lock key={th} x={GEOM.sx(th)} y={GEOM.y - 62} u={seg(lockU, i * 0.15, 0.7 + i * 0.15)} />
          ))}
          <Label x={640} y={GEOM.y - 96} text="thresholds fixed after validation · for this reported setup" anchor="middle" size={12}
            color={TEXT} o={seg(lockU, 0.6, 1)} />
          <Tag x={640} y={GEOM.y - 116} text="Paper-reported" anchor="middle" size={10} o={seg(lockU, 0.6, 1)} />
        </g>

        {/* beat 6 — ×100 magnifier over the 0.55 boundary */}
        {magO > 0 ? (
          <g opacity={magO}>
            <path d={`M${GEOM.sx(MAG.lo)},${GEOM.y + 6} L${MAG.x},${MAG.y - 28} M${GEOM.sx(MAG.hi)},${GEOM.y + 6} L${MAG.x + MAG.w},${MAG.y - 28}`}
              stroke={MUTED} strokeWidth={0.8} strokeDasharray="3 3" fill="none" />
            <rect x={MAG.x - 20} y={MAG.y - 40} width={MAG.w + 40} height={104} rx={10} fill={PANEL} stroke={MUTED} strokeOpacity={0.6} />
            <Label x={MAG.x - 8} y={MAG.y - 24} text="rail magnified ×100 · Illustrative score" size={8} />
            <rect x={MAG.x} y={MAG.y - 3} width={MAG.w / 2} height={6} fill={ROUTES[1].color} fillOpacity={sel === 1 ? 0.95 : 0.3} />
            <rect x={MAG.x + MAG.w / 2} y={MAG.y - 3} width={MAG.w / 2} height={6} fill={ROUTES[2].color} fillOpacity={sel === 2 ? 0.95 : 0.3} />
            {[0.546, 0.548, 0.55, 0.552, 0.554].map((v) => (
              <g key={v}>
                <line x1={magX(v)} y1={MAG.y - (v === BOUNDARY ? 12 : 6)} x2={magX(v)} y2={MAG.y + (v === BOUNDARY ? 12 : 6)}
                  stroke={TEXT} strokeWidth={v === BOUNDARY ? 1.6 : 0.8} />
                <Label x={magX(v)} y={MAG.y + 24} text={v.toFixed(3)} anchor="middle" size={8} color={v === BOUNDARY ? TEXT : MUTED} />
              </g>
            ))}
            {/* closed end belongs to retrieval; the larger-model band stops just short */}
            <circle cx={magX(BOUNDARY) - 7} cy={MAG.y} r={3.4} fill={PANEL} stroke={ROUTES[1].color} strokeWidth={1.4} opacity={g(scene.edgeO)} />
            <circle cx={magX(BOUNDARY) + 7} cy={MAG.y} r={3.4} fill={ROUTES[2].color} stroke={TEXT} strokeWidth={0.8} opacity={g(scene.edgeO)} />
            <circle cx={magX(clamp01(score) < MAG.lo ? MAG.lo : score)} cy={MAG.y} r={5.5} fill={PANEL} stroke={ROUTES[sel].color} strokeWidth={2.4} />
            <Label x={MAG.x - 8} y={MAG.y + 50} text={`C = ${truncated(score, 4)}  →  ${ROUTES[sel].label}`} size={10} color={ROUTES[sel].color} />
            <MathLabel tex={'0.55 \\le C < 0.75'} x={MAG.x + MAG.w + 8} y={MAG.y + 46} fontSize={10} anchor="end" boxWidth={160}
              color={ROUTES[2].color} opacity={g(scene.edgeO)} />
          </g>
        ) : null}

        {/* beat 9 — the same ribbon feeds the rail: process → estimate → choose */}
        {recapO > 0 ? (
          <g opacity={recapO}>
            <ActivationRibbon {...RIB} lit={g(scene.recapLit)} color={ACCENT} />
            <Label x={RIB.x + RIB.w / 2} y={RIB.y + RIB.h + 28} text="1 · process the query" anchor="middle" size={12} color={TEXT} o={stepO(1)} />
            <line x1={RIB.x + RIB.w + 10} y1={EST.y} x2={EST.x - 26} y2={EST.y} stroke={MUTED} strokeWidth={1.4}
              strokeDasharray="4 5" opacity={stepO(2)} />
            <g opacity={stepO(2)}>
              <circle cx={EST.x} cy={EST.y} r={22} fill={PANEL} stroke={TEXT} strokeWidth={1.6} />
              <MathLabel tex={'C'} x={EST.x} y={EST.y} fontSize={16} boxWidth={50} />
              <Label x={EST.x + 34} y={EST.y + 4} text="2 · estimate confidence" size={12} color={TEXT} />
              <path d={`M${EST.x},${EST.y + 24} C${EST.x},${EST.y + 84} ${beadX},${GEOM.y - 100} ${beadX},${GEOM.y - 36}`} fill="none"
                stroke={TEXT} strokeWidth={1.4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(estU)} />
            </g>
            <Label x={GEOM.x + GEOM.w} y={GEOM.y + 70} text="3 · choose the response pathway" anchor="end" size={12} color={TEXT} o={stepO(3)} />
          </g>
        ) : null}
      </Camera>
      {/* screen-fixed qualifier: outside the Camera so no pan can push it off-screen */}
      <Tag x={48} y={56} text="Illustrative score" size={13} o={beadO * (1 - recapO)} />
    </g>
  );
}

export const vizScene = () => scene;
