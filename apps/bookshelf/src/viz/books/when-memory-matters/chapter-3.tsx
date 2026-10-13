// The probe earns its label
//
// Sources (RealCompanion, arXiv 2610.01780 v2, and its reproducibility repo):
//   paper §4.2, Table 16, Appendix D.1
//   manifest/realcompanion_manifest.json — U10 row probe_dayid day8-151:
//     signals.hint basic · locus episode · stage_b_counts {retrieved 5,
//     verified 1} · recent_context [day8-150] · profile_refs [] ·
//     episode_refs [day7-50] · tier hard · category event_recall ·
//     grounding_dayids [day7-50] · trace_e {ok true, category_ok true}
//   docs/pipeline.md — Phases A–E, Stage B
//   builder/__init__.py — retrieve_distant_turns, categorize_turn
//   expected/stage_b_report.json — claims_matched_total 1,544, claims_kept_total 752
//   audit/arithmetic.py (recoverable_tier) · audit/gates.py gate_s
//
// Machine: one probe ledger rolled out from the conversation tape. Five
// writable bands fill in on the same object: a claimed referent, an evidence
// comb whose five candidate teeth shrink to one verified turn, three context
// sockets that fix the tier, a reply tethered to its grounding, and the final
// check. The teeth are a count visualization — only `day7-50` is a real
// identifier. The emptied socket in beat 7 is a labeled rule illustration.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  Heading,
  INK,
  SourceNote,
  Tether,
  Txt,
  beatAt,
  clamp01,
  lerp,
  narrate,
  on,
  win,
  winRest,
} from './shared/kit';
import {
  GROUNDING,
  LEDGER,
  LedgerRow,
  SOCKETS,
  SOCKET_H,
  SOCKET_W,
  SOCKET_Y,
  TAPE_Y,
  TEETH,
  X_DISTANT,
  X_PROBE,
} from './shared/ledger';
import type { RowState } from './shared/ledger';

// expected/stage_b_report.json
const MATCHED = 1544;
const KEPT = 752;
// The margin inset ends at x = 1096: beats 3–7 frame as tight as x ≈ 1104 on
// the right, and the ledger edge (x = 890) keeps a 14 px gutter.
const INSET = { x: 904, w: 192, y: 276, h: 20 } as const;
const EPISODE = SOCKETS[2];

const CAPTIONS = [
  'A memory label begins as a claim that the conversation may prove wrong.',
  'First, a model identifies what the probe refers to and where that referent would live.',
  'Next, retrieval searches earlier material and verification checks whether the candidates actually support that referent.',
  'In this released example, five retrieved candidates shrink to one verified earlier turn.',
  'Profile claims face the same demand for support from the messages behind them.',
  'A fixed rule then assigns the tier from the context that survives.',
  'If verification removes every distant reference, the later rule can reduce the item to a thread-only case.',
  'The reference reply is written from the recorded context, and its grounding names the turns it uses.',
  'A final check challenges the reply and category, sending failed items back for repair or withdrawal.',
  'The released trace preserves the decisions and the reasons, so a disagreement has a specific place to start.',
] as const;

const NOTES = [
  'manifest U10 day8-151 · paper §4.2',
  'docs/pipeline.md, Phase A · paper Appendix D.1',
  'builder/__init__.py, retrieve_distant_turns · pipeline Stage B',
  'manifest U10 day8-151, stage_b_counts',
  'expected/stage_b_report.json · pipeline Stage B',
  'builder categorize_turn · manifest row · audit/arithmetic.py',
  'builder/__init__.py, categorize_turn',
  'manifest row · pipeline Phase D · gate_s',
  'paper Table 16 · pipeline Phase E · manifest row',
  'paper §4.2, Appendix D.1 · docs/pipeline.md',
] as const;

// The ledger is 444 tall; every framing keeps its lower edge above the source note.
const CAM_START: CameraState = { x: 640, y: 348, k: 1 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl, CAPTIONS);
  const tapeU = tl.channel('tapeU', 0);
  const openU = tl.channel('openU', 0); // blank ledger unrolls under the tape
  const bandU = ['A', 'B', 'C', 'D', 'E'].map((k) => tl.channel(`band${k}`, 0));
  const locusU = tl.channel('locusU', 0);
  const spineU = tl.channel('spineU', 0);
  const scanU = tl.channel('scanU', 0); // past-only sweep, probe → earlier
  const retractU = tl.channel('retractU', 0); // four candidates fail
  const verifiedU = tl.channel('verifiedU', 0);
  const shrinkU = tl.channel('shrinkU', 0); // profile totals 1,544 → 752
  const socketsU = tl.channel('socketsU', 0);
  const tierU = tl.channel('tierU', 0);
  const illusU = tl.channel('illusU', 0); // rule illustration, restored after
  const groundU = tl.channel('groundU', 0);
  const tetherU = tl.channel('tetherU', 0);
  const stamp0 = tl.channel('stampOk', 0);
  const stamp1 = tl.channel('stampCategoryOk', 0);
  const repairU = tl.channel('repairU', 0);

  tl.set(cam, CAM_START, 0);

  // BEAT 0 — the tape, a subdued hint, and an unverified claim
  tl.tween(tapeU, 1, { at: 0.5, dur: 1.6, ease: ease.linear });
  tl.tween(openU, 5, { at: 2.4, dur: 2.2, ease: ease.move });

  // BEAT 1 — A: referent and locus
  let t = beatAt(1);
  tl.tween(cam, { x: 520, y: 358, k: 1.05 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(bandU[0], 1, { at: t + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(locusU, 1, { at: t + 2.2, dur: 0.5, ease: ease.pop });

  // BEAT 2 — B: retrieval drops candidate teeth along a past-only sweep
  t = beatAt(2);
  tl.tween(cam, { x: 560, y: 358, k: 1.05 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(bandU[1], 1, { at: t + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(spineU, 1, { at: t + 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(scanU, 1, { at: t + 2.0, dur: 3.8, ease: ease.linear });

  // BEAT 3 — five shrink to one
  t = beatAt(3);
  tl.tween(cam, { x: 500, y: 359, k: 1.06 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(retractU, 1, { at: t + 0.8, dur: 1.8, ease: ease.move });
  tl.tween(verifiedU, 1, { at: t + 2.8, dur: 0.6, ease: ease.enter });

  // BEAT 4 — profile claims: same demand, aggregate totals in the margin
  t = beatAt(4);
  tl.tween(cam, { x: 680, y: 356, k: 1.04 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(shrinkU, 1, { at: t + 2.0, dur: 1.6, ease: ease.move });

  // BEAT 5 — C: sockets fix the tier
  t = beatAt(5);
  tl.tween(cam, { x: 560, y: 358, k: 1.05 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(bandU[2], 1, { at: t + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(socketsU, 1, { at: t + 0.9, dur: 1.4, ease: ease.linear });
  tl.tween(tierU, 1, { at: t + 2.9, dur: 0.5, ease: ease.pop });

  // BEAT 6 — rule illustration: empty the episode socket, then restore the real row
  t = beatAt(6);
  tl.tween(cam, { x: 680, y: 356, k: 1.04 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(illusU, 1, { at: t + 1.0, dur: 0.8, ease: ease.move });
  tl.tween(illusU, 0, { at: t + 5.2, dur: 0.8, ease: ease.move });

  // BEAT 7 — D: reply and grounding
  t = beatAt(7);
  tl.tween(cam, { x: 540, y: 359, k: 1.06 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(bandU[3], 1, { at: t + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(groundU, 1, { at: t + 1.3, dur: 0.6, ease: ease.enter });
  tl.tween(tetherU, 1, { at: t + 2.1, dur: 1.4, ease: ease.draw });

  // BEAT 8 — E: recorded verdicts; the repair route is a rule, not this row
  t = beatAt(8);
  tl.tween(cam, { x: 680, y: 356, k: 1.04 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(bandU[4], 1, { at: t + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(stamp0, 1, { at: t + 1.3, dur: 0.5, ease: ease.pop });
  tl.tween(stamp1, 1, { at: t + 2.1, dur: 0.5, ease: ease.pop });
  tl.tween(repairU, 1, { at: t + 3.2, dur: 1.4, ease: ease.draw });

  // BEAT 9 — the whole trace on one ledger
  t = beatAt(9);
  tl.tween(cam, CAM_START, { at: t - 0.2, dur: 1.4, ease: ease.move });

  return {
    tl, cam, beat, tapeU, openU, bandU, locusU, spineU, scanU, retractU, verifiedU, shrinkU,
    socketsU, tierU, illusU, groundU, tetherU, stamp0, stamp1, repairU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const open = s.get(scene.openU);
  const scan = s.get(scene.scanU);
  const retract = s.get(scene.retractU);
  const verified = s.get(scene.verifiedU);
  const shrink = s.get(scene.shrinkU);
  const illus = s.get(scene.illusU);
  const tether = s.get(scene.tetherU);
  const repair = s.get(scene.repairU);
  const bands = scene.bandU.map((ch) => s.get(ch));

  // the sweep runs from the probe toward earlier turns; a tooth drops as it passes
  const scanX = lerp(X_PROBE, LEDGER.cx0, scan);
  const teeth = TEETH.map((x, i) => {
    const dropped = scan >= 1 ? 1 : clamp01((x + 6 - scanX) / 40);
    return dropped * (i === 0 ? 1 : lerp(1, 0.18, clamp01(retract * 2.5 - (4 - i) * 0.5)));
  });

  const st: RowState = {
    open,
    bands,
    shells: bands.map((v, i) => clamp01(open - i) * lerp(0.35, 1, v)),
    tape: s.get(scene.tapeU),
    verified,
    hint: clamp01(open),
    locus: s.get(scene.locusU),
    spine: s.get(scene.spineU),
    teeth,
    retrieved: clamp01(scan * 6 - 5),
    verifiedCount: verified,
    locusVerified: 0,
    sockets: s.get(scene.socketsU),
    episode: 1 - illus,
    tier: s.get(scene.tierU) * Math.abs(1 - 2 * illus),
    tierText: illus > 0.5 ? 'basic' : 'hard / event_recall',
    grounding: s.get(scene.groundU),
    stamps: [s.get(scene.stamp0), s.get(scene.stamp1)],
    prose: 0.7,
    ink: 1,
  };
  const scanO = clamp01(scan * 10) * clamp01((1 - scan) * 10);
  const insetW = lerp(INSET.w, (INSET.w * KEPT) / MATCHED, shrink);
  const insetO = winRest(b, 4, 4, 0.15);
  const repairO = winRest(b, 8, 8, 0.15);
  const chipTop = { x: GROUNDING.x + 97, y: GROUNDING.y - 13 };

  return (
    <g>
      <Camera {...s.get(scene.cam)}>
        <LedgerRow st={st} />

        <Txt x={X_DISTANT} y={TAPE_Y + 20} size={9.5} anchor="middle" fill={INK.claim} opacity={st.tape * (1 - verified) * clamp01(open)}>
          unverified claim
        </Txt>

        {/* past-only sweep on the header tape */}
        {scanO > 0 && (
          <g opacity={scanO}>
            <rect x={scanX - 10} y={TAPE_Y - 13} width={20} height={26} rx={4} fill={INK.thread} fillOpacity={0.2} stroke={INK.thread} />
            <line x1={scanX} y1={TAPE_Y + 13} x2={scanX} y2={282} stroke={INK.thread} strokeDasharray="3 4" opacity={0.5} />
          </g>
        )}
        <Txt x={392} y={262} size={10} fill={INK.muted} opacity={win(b, 2, 3) * bands[1]}>
          teeth show a count, not turn identifiers
        </Txt>

        {/* margin: profile claim re-verification totals (aggregate) */}
        <g opacity={insetO}>
          <Txt x={INSET.x} y={262} size={10.5} fill={INK.text}>
            profile claim re-verification totals
          </Txt>
          <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} rx={3} fill="none" stroke={INK.claim} strokeOpacity={0.6} strokeDasharray="4 3" />
          <rect x={INSET.x} y={INSET.y} width={insetW} height={INSET.h} rx={3} fill={shrink > 0.5 ? INK.ok : INK.claim} fillOpacity={0.35} stroke={shrink > 0.5 ? INK.ok : INK.claim} />
          {Array.from({ length: Math.floor(INSET.w / 10) }, (_, i) => (
            <line key={i} x1={INSET.x + 10 * i + 5} y1={INSET.y + INSET.h} x2={INSET.x + 10 * i + 5} y2={INSET.y + INSET.h + (INSET.x + 10 * i + 5 <= INSET.x + insetW ? 8 : 3)} stroke={INK.muted} opacity={0.7} />
          ))}
          <Txt x={INSET.x} y={324} size={12} mono fill={INK.claim}>
            1,544 matched
          </Txt>
          <Txt x={INSET.x + INSET.w} y={324} size={12} mono anchor="end" fill={INK.ok} opacity={clamp01(shrink * 3 - 2)}>
            752 kept
          </Txt>
        </g>

        {/* margin: rule illustration — not the real row */}
        <g opacity={win(b, 6, 6)}>
          <rect x={EPISODE.x - 5} y={SOCKET_Y - 5} width={SOCKET_W + 10} height={SOCKET_H + 10} rx={8} fill="none" stroke={INK.claim} strokeDasharray="5 4" opacity={illus} />
          <Tether x1={EPISODE.x + SOCKET_W + 5} y1={SOCKET_Y + 15} x2={926} y2={SOCKET_Y + 15} u={illus} color={INK.claim} dashed opacity={0.7} />
          <rect x={930} y={348} width={272} height={76} rx={8} fill={INK.panel} stroke={INK.claim} strokeOpacity={0.7} />
          <Txt x={944} y={371} size={13} weight={600} fill={INK.claim}>
            Rule illustration
          </Txt>
          <Txt x={944} y={392} size={11.5} mono fill={INK.text} opacity={0.35 + 0.65 * illus}>
            has_evidence: false → basic
          </Txt>
          <Txt x={944} y={411} size={10.5} fill={INK.muted}>
            the real row is restored afterwards
          </Txt>
        </g>

        {/* D: grounding tether into the recorded context */}
        <g opacity={on(b, 7) * bands[3]}>
          <rect x={168} y={SOCKET_Y - 6} width={LEDGER.cx1 - 168 + 6} height={SOCKET_H + 12} rx={9} fill="none" stroke={INK.ok} strokeDasharray="6 4" opacity={0.55 * clamp01(tether * 2)} />
          <Tether x1={chipTop.x} y1={chipTop.y} x2={EPISODE.x + SOCKET_W / 2} y2={SOCKET_Y + SOCKET_H + 2} u={tether} color={INK.distant} width={1.6} />
          <Txt x={LEDGER.cx1} y={440} size={10.5} anchor="end" fill={INK.muted} opacity={clamp01(tether * 3 - 2)}>
            allowed: recorded context + probe
          </Txt>
        </g>

        {/* margin: the repair route, drawn as a rule */}
        <g opacity={repairO}>
          <Tether x1={884} y1={504} x2={928} y2={504} u={repair * 2} color={INK.muted} dashed />
          <rect x={930} y={478} width={272} height={52} rx={8} fill="none" stroke={INK.muted} strokeDasharray="5 4" opacity={clamp01(repair * 2 - 0.6)} />
          <Txt x={944} y={500} size={12} fill={INK.text} opacity={clamp01(repair * 2 - 1)}>
            failed items: repair or withdrawal
          </Txt>
          <Txt x={944} y={518} size={10.5} fill={INK.muted} opacity={clamp01(repair * 2 - 1)}>
            a rule of the pipeline, not this row
          </Txt>
        </g>

        <Txt x={LEDGER.x0 + 4} y={86} size={14} mono weight={600} fill={INK.text} opacity={on(b, 9)}>
          {'trace { A, B, C, D, E }'}
        </Txt>
      </Camera>

      <Heading n={3} title="The probe earns its label" />
      <SourceNote beat={b} notes={NOTES} />
    </g>
  );
}

export const vizScene = () => scene;
