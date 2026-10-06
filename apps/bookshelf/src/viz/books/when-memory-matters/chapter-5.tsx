// Score the decision, not just the average
//
// Sources (RealCompanion, arXiv 2610.01780 v2, and its reproducibility repo):
//   score/__init__.py — TRACKS = ("chat", "qa"), CUTS = (1, 5, 20), gold_set,
//     retrieval_scores, score_records (coverage, abstention_on_controls),
//     judge_records ("judging needs the corpus text: pass --corpus DIR")
//   README.md — submission records; `--corpus DIR --judge`
//   manifest U10 day8-151 — recent_context [day8-150], episode_refs [day7-50],
//     profile_refs []
//   paper §6 (pooled Recency Hit@5 = 95.9%, n = 1,477 with gold), Table 4
//     (2.2% on n = 404 memory-bearing), Table 8 + Appendix A.3, E.1
//     (proportional, recorded: +0.004 and +0.104)
//
// Machine: an evidence comb. Its two real gold teeth are scored against an
// ILLUSTRATIVE one-item submission (labeled as such) with the scorer's exact
// arithmetic; the spine then stretches into a population bar for the paper's
// Hit@5 contrast, and finally into the two-part reported gain. The public
// scorer covers chat and qa only; the paper numbers are attributed, not
// reproduced, and Hit@5 (paper) is kept distinct from recall (scorer).
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Brace } from '../../primitives';
import {
  Field,
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
} from './shared/kit';

// ---------------------------------------------------------------------------
// The scorer's arithmetic, run at module scope on real gold IDs and an
// illustrative submission (mirrors retrieval_scores in score/__init__.py).
// ---------------------------------------------------------------------------

const CUTS = [1, 5, 20] as const;
const GOLD = ['day8-150', 'day7-50']; // recent_context ∪ episode_refs ∪ profile_refs
const RANKED = ['day8-150']; // Illustrative submission, real gold IDs
const recallAt = (k: number): number => RANKED.slice(0, k).filter((x) => GOLD.includes(x)).length / GOLD.length;
const MRR = (() => {
  const i = RANKED.findIndex((x) => GOLD.includes(x));
  return i < 0 ? 0 : 1 / (i + 1);
})();
const asTex = (v: number): string => (v === 0.5 ? '\\tfrac{1}{2}' : String(v));

// paper-reported figures
const HIT_ALL = 95.9; // §6, pooled, n = 1,477 with gold
const HIT_MEMORY = 2.2; // Table 4, n = 404 memory-bearing
const GAIN_MEMORY = 0.004; // Table 8, proportional recorded
const GAIN_REST = 0.104;
const GAIN_TOTAL = GAIN_MEMORY + GAIN_REST;
const REST_SHARE = Math.round((100 * GAIN_REST) / GAIN_TOTAL); // 96

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const STRIP = { x: 160, y: 150, w: 160, h: 40 } as const;
const FIELDS = ['track', 'subject', 'item', 'retrieved', 'reply / answer', 'abstained'] as const;
const cellMid = (i: number): number => STRIP.x + STRIP.w * (i + 0.5);

const COMB = { x0: 200, x1: 600, y: 300, tooth: 60 } as const;
const TEETH = [
  { x: 250, list: 'episode_refs', id: 'day7-50', color: INK.distant, empty: false },
  { x: 400, list: 'profile_refs', id: '[ ]', color: INK.muted, empty: true },
  { x: 550, list: 'recent_context', id: 'day8-150', color: INK.thread, empty: false },
] as const;
const LIST = { x: 640, y: 288, w: 160, h: 34 } as const;

const RANKS = { x: 200, y: 440, pitch: 34, n: 20 } as const;
const cutX = (k: number): number => RANKS.x + RANKS.pitch * k - 4;

const WELL = { x: 960 } as const;
const BAR = { x: 190, w: 900, y: 300, h: 24 } as const;
const GAIN_SPLIT = (BAR.w * GAIN_MEMORY) / GAIN_TOTAL;
const END_TAPE_Y = 165;
const END_BINS = 40;

const CAPTIONS = [
  'A system can find a nearby message and still miss the earlier detail that made a probe difficult.',
  'The public scorer accepts a ranked list of consulted turns, together with a reply or an answer.',
  'For chat, the target includes the recent thread as well as the episode and profile evidence.',
  'Finding one of two required turns earns half the recall, even when the first retrieved turn is correct.',
  'Empty targets are scored for abstention, while submission coverage is reported separately.',
  'Reply correctness needs the actual text and a judge, beyond what the public manifest can establish.',
  'The paper shows why populations matter: recent messages produce an impressive overall retrieval result.',
  'On the probes carrying distant references, that same result falls to just two point two percent.',
  'In the reported context comparison, ninety six percent of the sampled gain comes from probes labeled as needing no distant memory.',
  'Follow the probe from conversation to evidence to score, and keep the decision to remember separate from the ability to retrieve.',
] as const;

const NOTES = [
  'score/__init__.py, gold_set and retrieval_scores',
  'README.md · score/__init__.py',
  'score/__init__.py, gold_set',
  'score/__init__.py, retrieval_scores',
  'score/__init__.py, score_records',
  'score/__init__.py, judge_records · README.md',
  'paper §6, pooled retrieval',
  'paper Table 4, Recency / All items · §6',
  'paper Table 8, Appendix A.3, Appendix E.1',
  'paper §§4–6 · public scorer',
] as const;

const CAM_TEETH: CameraState = { x: 520, y: 325, k: 1.14 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl, CAPTIONS);
  const combU = tl.channel('combU', 0);
  const listU = tl.channel('listU', 0);
  const captureU = tl.channel('captureU', 0);
  const stripU = tl.channel('stripU', 0);
  const unionU = tl.channel('unionU', 0);
  const scoreU = tl.channel('scoreU', 0);
  const rulerU = tl.channel('rulerU', 0); // rank ruler extends 1 → 20
  const wellU = tl.channel('wellU', 0);
  const replyU = tl.channel('replyU', 0);
  const popU = tl.channel('popU', 0); // comb spine → population bar
  const hitV = tl.channel('hitV', 0); // Hit@5, percent
  const gainU = tl.channel('gainU', 0); // bar → two-part gain
  const closeU = tl.channel('closeU', 0);

  tl.set(cam, CAM_TEETH, 0);

  // BEAT 0 — two gold teeth; an illustrative list captures only the near one
  tl.tween(combU, 1, { at: 0.5, dur: 1.4, ease: ease.draw });
  tl.tween(listU, 1, { at: 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(captureU, 1, { at: 3.6, dur: 1.2, ease: ease.draw });

  // BEAT 1 — the submission record
  let t = beatAt(1);
  tl.tween(cam, { x: 640, y: 285, k: 1 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(stripU, 1, { at: t + 0.6, dur: 2.4, ease: ease.linear });

  // BEAT 2 — gold_set is a union of three lists
  t = beatAt(2);
  tl.tween(cam, { x: 600, y: 300, k: 1.08 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(unionU, 1, { at: t + 0.8, dur: 1.4, ease: ease.draw });

  // BEAT 3 — half the recall; the ruler extends without changing the score
  t = beatAt(3);
  tl.tween(cam, { x: 640, y: 350, k: 1 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(scoreU, 1, { at: t + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(rulerU, 1, { at: t + 3.2, dur: 2.6, ease: ease.linear });

  // BEAT 4 — the separate abstention well
  t = beatAt(4);
  tl.tween(cam, { x: 700, y: 350, k: 1.08 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(wellU, 1, { at: t + 0.8, dur: 1.6, ease: ease.linear });

  // BEAT 5 — the reply channel stops at a boundary
  t = beatAt(5);
  tl.tween(cam, { x: 650, y: 348, k: 1.06 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(replyU, 1, { at: t + 0.9, dur: 1.4, ease: ease.draw });

  // BEAT 6 — the comb expands into a population bar
  t = beatAt(6);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(popU, 1, { at: t + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(hitV, HIT_ALL, { at: t + 1.9, dur: 1.8, ease: ease.move });

  // BEAT 7 — the same bar on the memory-bearing subset
  t = beatAt(7);
  tl.tween(hitV, HIT_MEMORY, { at: t + 0.9, dur: 1.8, ease: ease.move });

  // BEAT 8 — the reported gain, in two parts
  t = beatAt(8);
  tl.tween(gainU, 1, { at: t + 0.6, dur: 1.6, ease: ease.move });
  tl.tween(cam, { x: 640, y: 300, k: 1.2 }, { at: t + 3.2, dur: 1.4, ease: ease.move });

  // BEAT 9 — tape, evidence, score: one object; a paired finish
  t = beatAt(9);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 0.4, dur: 1.6, ease: ease.move });

  return { tl, cam, beat, combU, listU, captureU, stripU, unionU, scoreU, rulerU, wellU, replyU, popU, hitV, gainU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const comb = s.get(scene.combU);
  const list = s.get(scene.listU);
  const capture = s.get(scene.captureU);
  const strip = s.get(scene.stripU);
  const union = s.get(scene.unionU);
  const score = s.get(scene.scoreU);
  const ruler = s.get(scene.rulerU);
  const well = s.get(scene.wellU);
  const reply = s.get(scene.replyU);
  const pop = s.get(scene.popU);
  const hit = s.get(scene.hitV);
  const gain = s.get(scene.gainU);
  const close = s.get(scene.closeU);

  const early = 1 - on(b, 6); // scorer apparatus leaves when the population bar arrives
  const teethO = (1 - clamp01(pop * 2)) * comb; // gone before the bar's title arrives
  const reached = 1 + ruler * (RANKS.n - 1); // highest rank slot drawn

  // the persistent spine: comb spine → population bar → closing tape
  const track = {
    x: lerp(COMB.x0, BAR.x, pop),
    w: lerp(COMB.x1 - COMB.x0, BAR.w, pop) * comb,
    y: lerp(BAR.y, END_TAPE_Y, close),
    h: lerp(lerp(2, BAR.h, pop), 5, close),
  };
  const hitW = (BAR.w * hit) / 100;
  const violetW = lerp(hitW, GAIN_SPLIT, gain);
  const blueW = (BAR.w - GAIN_SPLIT) * gain;
  const fillO = pop * (1 - close);
  const memoryTint = Math.max(on(b, 7), gain);

  return (
    <g>
      <Camera {...s.get(scene.cam)}>
        {/* submission record strip */}
        <g opacity={lerp(1, 0.12, on(b, 6)) * (1 - on(b, 9))}>
          <Txt x={STRIP.x} y={STRIP.y - 12} size={12} mono fill={INK.muted} opacity={clamp01(strip * 6)}>
            TRACKS = (chat, qa)
          </Txt>
          {FIELDS.map((f, i) => {
            const o = clamp01(strip * FIELDS.length - i);
            if (o <= 0) return null;
            const hot = (i === 3 && b > 0.5) || (i === 4 && win(b, 5, 5) > 0.5);
            return (
              <g key={f} opacity={o}>
                <rect x={STRIP.x + i * STRIP.w + 2} y={STRIP.y} width={STRIP.w - 4} height={STRIP.h} rx={5} fill={INK.panel} stroke={hot ? INK.thread : INK.muted} strokeOpacity={hot ? 0.9 : 0.5} />
                <Txt x={cellMid(i)} y={STRIP.y + 25} size={12.5} mono anchor="middle" fill={hot ? INK.thread : INK.text}>
                  {f}
                </Txt>
              </g>
            );
          })}
        </g>

        {/* the spine / bar / tape — one object throughout */}
        <rect x={track.x} y={track.y - track.h / 2} width={track.w} height={track.h} rx={Math.min(4, track.h / 2)} fill={INK.muted} fillOpacity={lerp(1, 0.12, pop) + 0.2 * close} stroke={INK.muted} strokeOpacity={0.7 * pop} />

        {/* gold teeth */}
        {teethO > 0.003 && (
          <g opacity={teethO}>
            {TEETH.map((tooth) => {
              const len = (tooth.empty ? 14 : COMB.tooth) * clamp01(comb * 1.5 - 0.3) * (tooth.empty ? union : 1);
              const got = tooth.id === RANKED[0];
              return (
                <g key={tooth.list}>
                  <line x1={tooth.x} y1={COMB.y} x2={tooth.x} y2={COMB.y + len} stroke={tooth.color} strokeWidth={tooth.empty ? 2 : 5} strokeLinecap="round" strokeDasharray={tooth.empty ? '3 4' : undefined} />
                  <Txt x={tooth.x} y={COMB.y - 12} size={10.5} mono anchor="middle" fill={INK.muted} opacity={union}>
                    {tooth.list}
                  </Txt>
                  <Txt x={tooth.x} y={tooth.empty ? COMB.y + 34 : COMB.y + 86} size={12} mono anchor="middle" fill={tooth.color} opacity={tooth.empty ? union : clamp01(comb * 3 - 2)}>
                    {tooth.id}
                  </Txt>
                  {!tooth.empty && (
                    <circle cx={tooth.x} cy={COMB.y + COMB.tooth} r={10} fill="none" stroke={got ? INK.ok : INK.bad} strokeWidth={1.6} strokeDasharray={got ? undefined : '3 3'} opacity={clamp01(capture * 2 - 1)} />
                  )}
                  {!tooth.empty && !got && (
                    <Txt x={tooth.x} y={COMB.y + 104} size={10.5} anchor="middle" fill={INK.bad} opacity={clamp01(capture * 2 - 1) * (1 - on(b, 6))}>
                      not retrieved
                    </Txt>
                  )}
                </g>
              );
            })}
            <Brace x0={TEETH[0].x - 44} x1={TEETH[2].x + 44} y={268} below={false} u={union} color={INK.text} />
            <Txt x={TEETH[1].x} y={240} size={14} mono anchor="middle" opacity={union}>
              gold_set
            </Txt>
          </g>
        )}

        {/* the illustrative ranked list, fed by the `retrieved` field */}
        <g opacity={early}>
          <g opacity={list}>
            <rect x={LIST.x} y={LIST.y} width={LIST.w} height={LIST.h} rx={6} fill={INK.panel} stroke={INK.thread} />
            <Txt x={LIST.x + LIST.w / 2} y={LIST.y + 22} size={13} mono anchor="middle" fill={INK.thread}>
              [day8-150]
            </Txt>
            <Txt x={LIST.x} y={LIST.y + 56} size={10.5} fill={INK.claim}>
              Illustrative submission, real gold IDs
            </Txt>
          </g>
          <Tether x1={LIST.x} y1={LIST.y + 26} x2={TEETH[2].x + 12} y2={COMB.y + COMB.tooth - 4} u={capture} color={INK.ok} width={1.6} />
          <Tether x1={cellMid(3)} y1={STRIP.y + STRIP.h} x2={cellMid(3)} y2={LIST.y} u={clamp01(strip * 2 - 1)} color={INK.thread} opacity={0.7} />
          <Txt x={cellMid(3) - 8} y={244} size={10.5} anchor="end" fill={INK.thread} opacity={win(b, 5, 5) * reply}>
            deterministic
          </Txt>

          {/* reply channel: stops where text and a judge are required */}
          <g opacity={win(b, 5, 5)}>
            <Tether x1={cellMid(4)} y1={STRIP.y + STRIP.h} x2={cellMid(4)} y2={232} u={reply * 1.6} color={INK.muted} />
            <g opacity={clamp01(reply * 3 - 1.6)}>
              <line x1={cellMid(4) - 44} y1={236} x2={cellMid(4) + 44} y2={236} stroke={INK.claim} strokeWidth={3} strokeLinecap="round" />
              <Txt x={cellMid(4)} y={258} size={11.5} mono anchor="middle" fill={INK.claim}>
                --corpus DIR --judge
              </Txt>
            </g>
          </g>

          {/* scores from the implemented arithmetic, on a rank ruler */}
          <g opacity={score}>
            {Array.from({ length: RANKS.n }, (_, i) => {
              const o = clamp01(reached - i);
              if (o <= 0) return null;
              return (
                <rect key={i} x={RANKS.x + i * RANKS.pitch} y={RANKS.y - 11} width={RANKS.pitch - 8} height={22} rx={4} fill={i === 0 ? INK.thread : 'none'} fillOpacity={0.8} stroke={i === 0 ? INK.thread : INK.muted} strokeOpacity={i === 0 ? 1 : 0.55} opacity={o} />
              );
            })}
            {CUTS.map((k) => {
              const o = clamp01(reached - k + 1);
              return (
                <g key={k} opacity={o}>
                  <line x1={cutX(k)} y1={RANKS.y - 17} x2={cutX(k)} y2={RANKS.y + 22} stroke={INK.text} strokeWidth={1.4} />
                  <Txt x={cutX(k) - 6} y={RANKS.y + 30} size={10} anchor="end" fill={INK.muted}>
                    {`rank ${k}`}
                  </Txt>
                  <MathLabel tex={`\\text{r@${k}} = ${asTex(recallAt(k))}`} x={cutX(k) - (k === 1 ? 14 : 40)} y={RANKS.y + 62} fontSize={18} boxWidth={160} />
                </g>
              );
            })}
            <MathLabel tex={`\\text{mrr} = ${asTex(MRR)}`} x={1010} y={RANKS.y + 62} fontSize={18} boxWidth={160} />
            <Txt x={RANKS.x + RANKS.n * RANKS.pitch - 8} y={RANKS.y - 22} size={11} mono anchor="end" fill={INK.muted} opacity={clamp01(ruler * 4)}>
              CUTS = (1, 5, 20)
            </Txt>
          </g>

          {/* abstention well: an empty target is scored differently */}
          <g opacity={on(b, 4)}>
            <line x1={WELL.x} y1={285} x2={WELL.x + 150 * clamp01(well * 2)} y2={285} stroke={INK.muted} strokeWidth={2} strokeDasharray="5 5" />
            <Txt x={WELL.x} y={272} size={10.5} fill={INK.muted} opacity={clamp01(well * 2)}>
              empty gold set
            </Txt>
            <Txt x={WELL.x} y={312} size={12} mono fill={INK.text} opacity={clamp01(well * 3 - 1)}>
              abstention_on_controls
            </Txt>
            <g opacity={clamp01(well * 3 - 2)}>
              <Txt x={WELL.x} y={350} size={12} mono fill={INK.text}>
                coverage
              </Txt>
              {Array.from({ length: 8 }, (_, i) => (
                <rect key={i} x={WELL.x + i * 20} y={360} width={14} height={14} rx={3} fill={i < 5 ? INK.thread : 'none'} fillOpacity={0.5} stroke={i < 5 ? INK.thread : INK.muted} strokeDasharray={i < 5 ? undefined : '3 2'} />
              ))}
              <Txt x={WELL.x} y={392} size={10} fill={INK.muted}>
                unsubmitted stay outlined
              </Txt>
              <Txt x={WELL.x} y={407} size={10} fill={INK.claim}>
                Rule illustration
              </Txt>
            </g>
          </g>
        </g>

        {/* population bar: paper-reported Hit@5, then the two-part gain */}
        {fillO > 0.003 && (
          <g opacity={fillO}>
            <rect x={BAR.x} y={BAR.y - BAR.h / 2} width={violetW} height={BAR.h} rx={3} fill={INK.thread} opacity={1 - memoryTint} />
            <rect x={BAR.x} y={BAR.y - BAR.h / 2} width={violetW} height={BAR.h} rx={3} fill={INK.distant} opacity={memoryTint} />
            <rect x={BAR.x + violetW} y={BAR.y - BAR.h / 2} width={blueW} height={BAR.h} fill={INK.thread} opacity={0.85} />

            {/* hit axis */}
            <g opacity={win(b, 6, 7)}>
              {[0, 50, 100].map((v) => (
                <g key={v}>
                  <line x1={BAR.x + BAR.w * (v / 100)} y1={BAR.y + 14} x2={BAR.x + BAR.w * (v / 100)} y2={BAR.y + 20} stroke={INK.muted} />
                  <Txt x={BAR.x + BAR.w * (v / 100)} y={BAR.y + 34} size={10.5} anchor="middle" fill={INK.muted}>
                    {`${v}%`}
                  </Txt>
                </g>
              ))}
              <Txt x={BAR.x + Math.max(hitW, 0) + 8} y={BAR.y - 20} size={15} weight={600} fill={memoryTint > 0.5 ? INK.distant : INK.thread} opacity={clamp01(hit)}>
                {`${hit.toFixed(1)}%`}
              </Txt>
            </g>
            <g opacity={win(b, 6, 6) * clamp01(pop * 2 - 1)}>
              <Txt x={BAR.x} y={236} size={17} weight={600}>
                Paper §6: Recency Hit@5 = 95.9%
              </Txt>
              <Txt x={BAR.x} y={258} size={12} fill={INK.muted}>
                n=1,477 with gold · pooled, both strata
              </Txt>
            </g>
            <g opacity={win(b, 7, 7)}>
              <Txt x={BAR.x} y={236} size={17} weight={600}>
                Paper Table 4: Recency Hit@5 = 2.2%
              </Txt>
              <Txt x={BAR.x} y={258} size={12} fill={INK.muted}>
                n=404 memory-bearing · a subset comparison, not a natural rate
              </Txt>
              <line x1={BAR.x + (BAR.w * HIT_ALL) / 100} y1={BAR.y - 18} x2={BAR.x + (BAR.w * HIT_ALL) / 100} y2={BAR.y + 18} stroke={INK.thread} strokeDasharray="3 3" opacity={0.5} />
              <Txt x={BAR.x + (BAR.w * HIT_ALL) / 100} y={BAR.y - 24} size={10.5} anchor="middle" fill={INK.thread} opacity={0.6}>
                95.9%
              </Txt>
            </g>

            {/* reported context contrast */}
            <g opacity={win(b, 8, 8) * clamp01(gain * 2 - 1)}>
              <Txt x={BAR.x} y={236} size={17} weight={600}>
                Reported context contrast
              </Txt>
              <Txt x={BAR.x} y={258} size={12} fill={INK.muted}>
                proportional, recorded · Paper Table 8
              </Txt>
              <Txt x={BAR.x} y={BAR.y - 20} size={14} mono weight={600} fill={INK.distant}>
                +0.004
              </Txt>
              <Txt x={BAR.x + GAIN_SPLIT + (BAR.w - GAIN_SPLIT) / 2} y={BAR.y - 20} size={14} mono weight={600} anchor="middle" fill={INK.thread}>
                +0.104
              </Txt>
              <Txt x={BAR.x + BAR.w} y={BAR.y - 20} size={14} mono weight={600} anchor="end">
                ≈ +0.108
              </Txt>
              <Txt x={BAR.x} y={BAR.y + 32} size={11.5} fill={INK.distant}>
                memory-bearing probes
              </Txt>
              <Txt x={BAR.x + 200} y={BAR.y + 32} size={11.5} fill={INK.thread}>
                {`probes labeled as needing no distant memory: ${REST_SHARE}% of the gain`}
              </Txt>
              <Txt x={BAR.x} y={BAR.y + 54} size={11} fill={INK.muted}>
                C2 vs C1 also changes heading
              </Txt>
            </g>
          </g>
        )}

        {/* closing tape: the same object, with its two teeth */}
        {close > 0.003 && (
          <g opacity={close}>
            {Array.from({ length: END_BINS }, (_, j) => (
              <rect key={j} x={BAR.x + (j + 0.5) * (BAR.w / END_BINS) - 5} y={END_TAPE_Y - 16} width={10} height={9} rx={1.5} fill={j === 30 ? INK.text : INK.thread} opacity={j === 30 ? 0.9 : 0.25} />
            ))}
            <line x1={BAR.x + 8.5 * (BAR.w / END_BINS)} y1={END_TAPE_Y + 2} x2={BAR.x + 8.5 * (BAR.w / END_BINS)} y2={END_TAPE_Y + 2 + 22 * close} stroke={INK.distant} strokeWidth={4} strokeLinecap="round" />
            <line x1={BAR.x + 29.5 * (BAR.w / END_BINS)} y1={END_TAPE_Y + 2} x2={BAR.x + 29.5 * (BAR.w / END_BINS)} y2={END_TAPE_Y + 2 + 22 * close} stroke={INK.thread} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        <Field x={300} y={226} w={680} h={132} opacity={clamp01(close * 2.5 - 1.5)}>
          <Txt x={640} y={278} size={26} weight={600} anchor="middle" fill={INK.distant}>
            When memory is needed
          </Txt>
          <line x1={520} y1={296} x2={760} y2={296} stroke={INK.muted} opacity={0.5} />
          <Txt x={640} y={332} size={26} weight={600} anchor="middle" fill={INK.thread}>
            What retrieval recovers
          </Txt>
        </Field>
      </Camera>

      <Heading n={5} title="Score the decision, not just the average" />
      <SourceNote beat={b} notes={NOTES} />
    </g>
  );
}

export const vizScene = () => scene;
