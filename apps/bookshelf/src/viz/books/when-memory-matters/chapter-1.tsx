// A conversation becomes a test
//
// Sources (RealCompanion, arXiv 2610.01780 v2, and its reproducibility repo):
//   paper §§1, 3, 4.1, Table 2, Table 3, Appendix C.2, Appendix C.7
//   manifest/realcompanion_manifest.json — `subjects`; U10 chat row with
//     probe_dayid day8-151, recent_context [day8-150], episode_refs [day7-50]
//   expected/counts_both.json — per-subject `messages`, totals.messages
//   docs/pipeline.md (The released text) · README.md (Submitting a system)
//   audit/gates.py — gate_a, gate_d
//
// Machine: one conversation tape. It stops on a probe, shrinks into rank among
// ten histories on a shared message-count axis, enlarges again, loses its
// (abstract) wording while every mark keeps its place, hides its future,
// lifts two cited turns into slots, and finally fans into five aligned layers
// that bind back into the same tape. Tape marks are aggregate bins — the
// public package ships identifiers, not conversation text.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Brace } from '../../primitives';
import {
  Chip,
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
// Data — committed, source-cited constants (expected/counts_both.json).
// ---------------------------------------------------------------------------

const MESSAGES = [115, 173, 173, 195, 420, 1349, 2005, 2918, 7243, 12627] as const;
const SUBJECTS = MESSAGES.map((_, i) => `U${String(i + 1).padStart(2, '0')}`);
const TOTAL = MESSAGES.reduce((a, b) => a + b, 0); // 27,218
const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');

// shared message-count axis for the ten tapes
const AX = { x0: 160, x1: 1160, max: 13000, y: 540 } as const;
const px = (n: number): number => ((AX.x1 - AX.x0) * n) / AX.max;
const rowY = (i: number): number => 130 + i * 42;
const LEN = MESSAGES.map((n) => px(n));
const RAG = LEN.map((l) => (AX.x1 - AX.x0 - l) / 2); // centred until the axis aligns them

// the enlarged U10 tape; marks are bins, three of them keyed by real identifiers
const HERO = { x0: 110, len: 1060, y: 310, h: 26 } as const;
const BINS = 72;
const PITCH = HERO.len / BINS;
const BIN_DISTANT = 15; // day7-50
const BIN_RECENT = 52; // day8-150
const BIN_PROBE = 53; // day8-151
const binF = (j: number): number => (j + 0.5) / BINS;
const heroX = (j: number): number => HERO.x0 + binF(j) * HERO.len;
const X_DISTANT = heroX(BIN_DISTANT);
const X_RECENT = heroX(BIN_RECENT);
const X_PROBE = heroX(BIN_PROBE);

// abstract wording texture: two dash-width sets (before / after rewriting)
const TEXTURE = (() => {
  const rand = mulberry32(2610);
  return Array.from({ length: BINS }, () =>
    [0, 1, 2].map(() => ({ a: 0.25 + 0.7 * rand(), b: 0.25 + 0.7 * rand() })),
  );
})();

// slots below the tape
const SLOT_Y = 385;
const SLOT = { distant: X_DISTANT, recent: 770, probe: 990 } as const;

// the four overlays that fan above the base tape (schematic marks)
const LAYERS = [
  { key: 'profile', note: 'supported claims', color: INK.ok, bins: [9, 15, 27, 40, 52] },
  { key: 'persona', note: 'interpretations', color: INK.claim, bins: [12, 33, 47] },
  { key: 'chat', note: 'verbatim probe', color: INK.thread, bins: [BIN_PROBE] },
  { key: 'qa', note: 'authored question', color: INK.text, bins: [22, 44] },
] as const;
const layerY = (k: number): number => 250 - 50 * k;

const CAPTIONS = [
  'A companion can remember a conversation and still miss the moment when that memory matters.',
  'This benchmark starts with ten real relationships, stretching across as many as one hundred twenty days.',
  'Together, those relationships contain more than twenty seven thousand messages.',
  'The released words are rewritten for privacy, while the conversation keeps its order and evidence links.',
  'A test probe is a user message copied exactly from that released conversation.',
  'The system sees the messages before the probe, so a future reply cannot become an answer key.',
  'The recent thread and the earlier evidence remain separate, even when both support the reply.',
  'A profile records supported claims, while a persona records interpretations of the person.',
  'Chat items and authored questions provide two ways to test what a system does with that history.',
  'Every test now leads back to a record that a reader can inspect and challenge.',
] as const;

const NOTES = [
  'paper §§1, 4.1',
  'paper Table 2 · manifest subjects',
  'expected/counts_both.json, totals.messages',
  'docs/pipeline.md, The released text · paper §3',
  'manifest U10 chat row · paper §4.1 · gate_a',
  'README.md, Submitting a system',
  'manifest U10 day8-151 · gate_d',
  'paper §3, Appendix C.2',
  'README.md · paper Table 3',
  'paper Appendix C.7 · docs/pipeline.md',
] as const;

const CAM_PROBE: CameraState = { x: 800, y: 310, k: 1.15 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl, CAPTIONS);
  const revealU = tl.channel('revealU', 0); // playhead along the hero tape
  const stopU = tl.channel('stopU', 0); // the probe halts the tape
  const heroU = tl.channel('heroU', 1); // 1 = enlarged U10, 0 = in rank
  const tapesU = tl.channel('tapesU', 0); // the other nine histories
  const alignU = tl.channel('alignU', 0); // flush onto the shared axis
  const axisU = tl.channel('axisU', 0);
  const totalN = tl.channel('totalN', 0);
  const textO = tl.channel('textO', 0); // abstract wording texture
  const rewriteU = tl.channel('rewriteU', 0);
  const extractU = tl.channel('extractU', 0); // probe chip leaves the tape
  const shadowU = tl.channel('shadowU', 0); // the future goes dark
  const braceU = tl.channel('braceU', 0);
  const liftRecent = tl.channel('liftRecent', 0);
  const liftDistant = tl.channel('liftDistant', 0);
  const layerU = LAYERS.map((l) => tl.channel(`layer_${l.key}`, 0));
  const bindU = tl.channel('bindU', 0); // five layers compress into one tape
  const closeU = tl.channel('closeU', 0);

  tl.set(cam, CAM_PROBE, 0);

  // BEAT 0 — the tape runs and stops on the probe
  tl.tween(revealU, binF(BIN_PROBE) + 0.004, { at: 0.5, dur: 2.7, ease: ease.linear });
  tl.tween(stopU, 1, { at: 3.2, dur: 0.6, ease: ease.pop });

  // BEAT 1 — pull back: ten histories
  let t = beatAt(1);
  tl.tween(cam, { x: 640, y: 378, k: 0.92 }, { at: t - 0.4, dur: 1.4, ease: ease.move });
  tl.tween(revealU, 1, { at: t, dur: 1.0, ease: ease.linear });
  tl.tween(heroU, 0, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(tapesU, 1, { at: t + 0.5, dur: 1.4, ease: ease.linear });

  // BEAT 2 — the honest shared axis
  t = beatAt(2);
  tl.tween(alignU, 1, { at: t + 0.3, dur: 1.2, ease: ease.move });
  tl.tween(axisU, 1, { at: t + 0.5, dur: 1.4, ease: ease.draw });
  tl.tween(totalN, TOTAL, { at: t + 2.0, dur: 2.2, ease: ease.move });

  // BEAT 3 — rewritten wording; marks keep their place
  t = beatAt(3);
  tl.tween(heroU, 1, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(tapesU, 0, { at: t - 0.3, dur: 0.8, ease: ease.linear });
  tl.tween(cam, { x: 430, y: 310, k: 1.15 }, { at: t - 0.5, dur: 1.4, ease: ease.move });
  tl.tween(textO, 1, { at: t + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, { x: 850, y: 310, k: 1.15 }, { at: t + 1.3, dur: 5.4, ease: ease.move });
  tl.tween(rewriteU, 1, { at: t + 1.5, dur: 2.2, ease: ease.move });
  tl.tween(textO, 0.15, { at: t + 4.2, dur: 1.4, ease: ease.draw });

  // BEAT 4 — the probe is the same keyed mark, extracted
  t = beatAt(4);
  tl.tween(textO, 0, { at: t, dur: 0.6, ease: ease.enter });
  tl.tween(cam, { x: 930, y: 335, k: 1.45 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(extractU, 1, { at: t + 1.3, dur: 1.2, ease: ease.move });

  // BEAT 5 — the future goes dark
  t = beatAt(5);
  tl.tween(cam, { x: 640, y: 315, k: 1 }, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(shadowU, 1, { at: t + 0.8, dur: 1.6, ease: ease.linear });
  tl.tween(braceU, 1, { at: t + 2.6, dur: 0.8, ease: ease.enter });

  // BEAT 6 — two cited turns lift into separate slots
  t = beatAt(6);
  tl.tween(cam, { x: 610, y: 335, k: 1.15 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(liftRecent, 1, { at: t + 0.8, dur: 1.2, ease: ease.move });
  tl.tween(liftDistant, 1, { at: t + 2.2, dur: 1.2, ease: ease.move });

  // BEAT 7 — profile and persona grow above the same tape
  t = beatAt(7);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(layerU[0], 1, { at: t + 0.6, dur: 1.2, ease: ease.move });
  tl.tween(layerU[1], 1, { at: t + 2.4, dur: 1.2, ease: ease.move });

  // BEAT 8 — chat and qa
  t = beatAt(8);
  tl.tween(layerU[2], 1, { at: t + 0.6, dur: 1.2, ease: ease.move });
  tl.tween(layerU[3], 1, { at: t + 2.4, dur: 1.2, ease: ease.move });

  // BEAT 9 — five layers bind into one tape; quiet close
  t = beatAt(9);
  tl.tween(bindU, 1, { at: t + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 640, y: 300, k: 1.05 }, { at: t + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 1.9, dur: 0.6, ease: ease.enter });

  return {
    tl, cam, beat, revealU, stopU, heroU, tapesU, alignU, axisU, totalN, textO, rewriteU,
    extractU, shadowU, braceU, liftRecent, liftDistant, layerU, bindU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local renderers
// ---------------------------------------------------------------------------

/** The nine other histories plus the axis: aggregate bars, length = messages. */
function TenTapes({ u, align, axis, counts }: { u: number; align: number; axis: number; counts: number }) {
  if (u <= 0.003) return null;
  return (
    <g>
      {SUBJECTS.map((name, i) => {
        const o = clamp01(u * 10 - i * 0.6);
        const x = AX.x0 + RAG[i] * (1 - align);
        return (
          <g key={name} opacity={o}>
            <Txt x={148} y={rowY(i) + 4} size={12} anchor="end" mono fill={INK.muted}>
              {name}
            </Txt>
            {i < 9 && (
              <rect x={x} y={rowY(i) - 5} width={Math.max(LEN[i], 2)} height={10} rx={2} fill={INK.thread} opacity={0.6} />
            )}
            <Txt x={x + LEN[i] + 8} y={rowY(i) + 4} size={10.5} mono fill={INK.muted} opacity={counts}>
              {fmt(MESSAGES[i])}
            </Txt>
          </g>
        );
      })}
      <g opacity={u}>
        <line x1={AX.x0} y1={AX.y} x2={lerp(AX.x0, AX.x1, axis)} y2={AX.y} stroke={colors.ink.axis} strokeWidth={1.4} />
        {[0, 5000, 10000].map((v) => (
          <g key={v} opacity={clamp01(axis * 3 - v / 5000)}>
            <line x1={AX.x0 + px(v)} y1={AX.y} x2={AX.x0 + px(v)} y2={AX.y + 6} stroke={colors.ink.axis} />
            <Txt x={AX.x0 + px(v)} y={AX.y + 20} size={11} anchor="middle" fill={INK.muted}>
              {fmt(v)}
            </Txt>
          </g>
        ))}
        <Txt x={AX.x1} y={AX.y + 38} size={11} anchor="end" fill={INK.muted} opacity={axis}>
          messages per subject (length is message count, not calendar span)
        </Txt>
      </g>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const hero = s.get(scene.heroU);
  const align = s.get(scene.alignU);
  const reveal = s.get(scene.revealU);
  const stop = s.get(scene.stopU);
  const tapes = s.get(scene.tapesU);
  const textO = s.get(scene.textO);
  const rewrite = s.get(scene.rewriteU);
  const extract = s.get(scene.extractU);
  const shadow = s.get(scene.shadowU);
  const liftR = s.get(scene.liftRecent);
  const liftD = s.get(scene.liftDistant);
  const bind = s.get(scene.bindU);
  const close = s.get(scene.closeU);
  const layers = scene.layerU.map((ch) => s.get(ch));

  // U10 geometry: rank row ↔ enlarged hero tape
  const g = {
    x0: lerp(AX.x0 + RAG[9] * (1 - align), HERO.x0, hero),
    len: lerp(LEN[9], HERO.len, hero),
    y: lerp(rowY(9), HERO.y, hero),
    h: lerp(10, HERO.h, hero),
  };
  const mx = (j: number): number => g.x0 + binF(j) * g.len;
  const markW = (g.len / BINS) * 0.62;
  const keyed = (j: number): string | null =>
    j === BIN_PROBE ? INK.text : j === BIN_RECENT ? INK.thread : j === BIN_DISTANT ? INK.distant : null;

  const wordsO = stop * (1 - on(b, 1));
  const idsO = on(b, 3) * hero;
  const boundO = on(b, 9);

  return (
    <g>
      <Camera {...s.get(scene.cam)}>
        <TenTapes u={tapes} align={align} axis={s.get(scene.axisU)} counts={on(b, 2)} />

        {/* headline counts for the ten histories */}
        <g opacity={tapes}>
          <Txt x={900} y={190} size={30} weight={600} opacity={win(b, 1, 2)}>
            10 subjects
          </Txt>
          <Txt x={900} y={222} size={17} fill={INK.muted} opacity={win(b, 1, 2)}>
            up to 120 days
          </Txt>
          <Txt x={900} y={282} size={30} weight={600} fill={INK.thread} opacity={win(b, 2, 2)}>
            {`${fmt(s.get(scene.totalN))} messages`}
          </Txt>
        </g>

        {/* the U10 tape — the persistent object */}
        <Txt x={g.x0 - 12} y={g.y + 4} size={lerp(12, 13, hero)} anchor="end" mono fill={INK.muted} opacity={hero}>
          U10
        </Txt>
        <rect
          x={g.x0}
          y={g.y - g.h / 2}
          width={g.len}
          height={g.h}
          rx={lerp(2, 6, hero)}
          fill={INK.thread}
          fillOpacity={lerp(0.6, 0.06, hero) * clamp01(tapes + hero)}
          stroke={INK.thread}
          strokeOpacity={0.35 * hero + 0.6 * boundO}
          strokeWidth={1 + boundO}
        />
        <g opacity={hero}>
          {Array.from({ length: BINS }, (_, j) => {
            const o = clamp01((reveal - binF(j)) * BINS + 1);
            if (o <= 0) return null;
            const k = keyed(j);
            const up = j % 2 === 0 ? -1 : 1; // alternating speakers
            return (
              <rect
                key={j}
                x={mx(j) - markW / 2}
                y={g.y - g.h * 0.32 + up * g.h * 0.08}
                width={markW}
                height={g.h * 0.64}
                rx={1.5}
                fill={k ?? INK.thread}
                opacity={o * (k ? 1 : j % 2 === 0 ? 0.42 : 0.24)}
              />
            );
          })}
          {/* the probe ring */}
          <rect
            x={mx(BIN_PROBE) - markW / 2 - 4}
            y={g.y - g.h / 2 - 4}
            width={markW + 8}
            height={g.h + 8}
            rx={5}
            fill="none"
            stroke={INK.text}
            strokeWidth={1.6}
            opacity={stop}
          />
        </g>

        {/* abstract wording texture: rewritten, then dissolved; marks stay put */}
        {textO > 0.003 && (
          <g opacity={textO * hero}>
            {TEXTURE.map((rows, j) =>
              rows.map((w, r) => (
                <rect
                  key={`${j}-${r}`}
                  x={mx(j) - PITCH * 0.4}
                  y={248 + r * 10}
                  width={PITCH * 0.8 * lerp(w.a, w.b, clamp01(rewrite * 1.6 - binF(j) * 0.6))}
                  height={3}
                  rx={1.5}
                  fill={INK.muted}
                />
              )),
            )}
          </g>
        )}
        <Txt x={560} y={292} size={11} fill={INK.muted} opacity={hero * (1 - on(b, 5)) * clamp01(reveal * 4)}>
          Each mark summarizes turns
        </Txt>

        {/* beat-0 plain words under the three marks */}
        <Txt x={X_DISTANT} y={346} size={12} anchor="middle" fill={INK.distant} opacity={wordsO}>
          earlier turn
        </Txt>
        <Txt x={X_RECENT - 6} y={346} size={12} anchor="end" fill={INK.thread} opacity={wordsO}>
          recent thread
        </Txt>
        <Txt x={X_PROBE + 2} y={346} size={12} fill={INK.text} opacity={wordsO}>
          probe
        </Txt>

        {/* identifiers stay with their marks */}
        <Txt x={X_DISTANT} y={346} size={11} anchor="middle" mono fill={INK.distant} opacity={idsO * (1 - liftD)}>
          day7-50
        </Txt>
        <Txt x={X_RECENT + 3} y={346} size={11} anchor="end" mono fill={INK.thread} opacity={idsO * (1 - liftR)}>
          day8-150
        </Txt>
        <Txt x={X_PROBE + 2} y={346} size={11} mono fill={INK.text} opacity={idsO * (1 - extract)}>
          day8-151
        </Txt>

        {/* the future goes dark */}
        {shadow > 0 && (
          <rect
            x={X_PROBE + PITCH / 2 + 2}
            y={HERO.y - HERO.h / 2 - 3}
            width={(HERO.x0 + HERO.len - X_PROBE - PITCH / 2 - 2) * shadow}
            height={HERO.h + 6}
            fill={INK.bg}
            opacity={0.8}
          />
        )}
        <Txt x={1062} y={346} size={11} anchor="middle" fill={INK.muted} opacity={win(b, 5, 6) * clamp01(shadow * 2 - 1)}>
          not given to the system
        </Txt>
        <Brace
          x0={HERO.x0}
          x1={X_PROBE - PITCH / 2 - 2}
          y={288}
          below={false}
          u={s.get(scene.braceU)}
          color={INK.thread}
          opacity={win(b, 5, 6)}
        />
        <Txt x={(HERO.x0 + X_PROBE) / 2} y={262} size={13} anchor="middle" fill={INK.thread} opacity={win(b, 5, 6) * s.get(scene.braceU)}>
          history strictly before probe
        </Txt>

        {/* slots: probe, recent thread, earlier evidence — tethered to their marks */}
        <Tether x1={X_PROBE} y1={HERO.y + 15} x2={lerp(X_PROBE, SLOT.probe, extract)} y2={lerp(HERO.y + 15, SLOT_Y - 13, extract)} color={INK.text} opacity={0.5 * clamp01(extract * 4)} />
        <Chip x={lerp(X_PROBE, SLOT.probe, extract)} y={lerp(HERO.y, SLOT_Y, extract)} text="U10 / probe_dayid: day8-151" color={INK.text} opacity={clamp01(extract * 3)} />
        <Tether x1={X_RECENT} y1={HERO.y + 15} x2={lerp(X_RECENT, SLOT.recent, liftR)} y2={lerp(HERO.y + 15, SLOT_Y - 13, liftR)} color={INK.thread} opacity={0.5 * clamp01(liftR * 4)} />
        <Chip x={lerp(X_RECENT, SLOT.recent, liftR)} y={lerp(HERO.y, SLOT_Y, liftR)} text="recent_context: day8-150" color={INK.thread} opacity={clamp01(liftR * 3)} />
        <Tether x1={X_DISTANT} y1={HERO.y + 15} x2={X_DISTANT} y2={lerp(HERO.y + 15, SLOT_Y - 13, liftD)} color={INK.distant} opacity={0.5 * clamp01(liftD * 4)} />
        <Chip x={SLOT.distant} y={lerp(HERO.y, SLOT_Y, liftD)} text="episode_refs: day7-50" color={INK.distant} opacity={clamp01(liftD * 3)} />

        {/* four overlays fan above the base tape, then bind back into it */}
        {LAYERS.map((layer, k) => {
          const u = layers[k] * (1 - bind);
          if (u <= 0.003) return null;
          const y = lerp(HERO.y, layerY(k), u);
          return (
            <g key={layer.key} opacity={clamp01(u * 1.4)}>
              {layer.bins.map((j) => (
                <line key={j} x1={heroX(j)} y1={y + 17} x2={heroX(j)} y2={HERO.y - HERO.h / 2} stroke={layer.color} strokeWidth={1} opacity={0.16} />
              ))}
              <rect x={HERO.x0} y={y - 17} width={HERO.len} height={34} rx={6} fill={layer.color} fillOpacity={0.07} stroke={layer.color} strokeOpacity={0.45} />
              <Txt x={HERO.x0 + 12} y={y + 5} size={14} mono fill={layer.color}>
                {layer.key}
              </Txt>
              <Txt x={HERO.x0 + HERO.len - 12} y={y + 4} size={12} anchor="end" fill={layer.color} opacity={0.85}>
                {layer.note}
              </Txt>
              {layer.bins.map((j) =>
                layer.key === 'profile' || layer.key === 'chat' ? (
                  <rect key={j} x={heroX(j) - 4.5} y={y - 9} width={9} height={18} rx={2} fill={layer.color} />
                ) : (
                  <rect key={j} x={heroX(j) - 16} y={y - 8} width={32} height={16} rx={layer.key === 'qa' ? 8 : 3} fill="none" stroke={layer.color} strokeWidth={1.4} />
                ),
              )}
            </g>
          );
        })}
        <Txt x={HERO.x0} y={346 + 82} size={11} fill={INK.muted} opacity={win(b, 7, 8)}>
          Overlay marks are schematic
        </Txt>

        {/* quiet close */}
        <Field x={330} y={148} w={620} h={92} opacity={close}>
          <Txt x={640} y={204} size={28} weight={600} anchor="middle">
            A probe with a traceable past
          </Txt>
        </Field>
      </Camera>

      {/* screen-fixed overlays */}
      <Txt x={640} y={150} size={19} anchor="middle" weight={600} opacity={win(b, 3, 3)}>
        Released, rewritten conversations
      </Txt>
      <Heading n={1} title="A conversation becomes a test" />
      <SourceNote beat={b} notes={NOTES} />
    </g>
  );
}

export const vizScene = () => scene;
