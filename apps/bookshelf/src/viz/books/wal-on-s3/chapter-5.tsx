// WAL on S3, chapter 5 — "The Sum That Must Balance"
//
// Grounding: chroma-core/chroma rust/wal3/README.md, sections "A Note about
// Setsums", "Interplay Between Snapshots and Setsum" (setsum of A through J
// equals setsum of A through D plus setsum of E through J), and
// "Verification" (the checksum is cryptographic, incremental, and commutative;
// end-to-end verification means writes and reads must map one to one);
// rust/wal3/src/manifest.rs Manifest::scrub — it sums every snapshot and
// fragment setsum and requires `self.setsum == calculated_setsum +
// self.collected`, returning ScrubSuccess { calculated_setsum, bytes_read }
// or ScrubError::CorruptManifest; Manifest::apply_fragment
// (`self.setsum += fragment.setsum`).
//
// Centerpiece: a balance beam. Fragment checksums load the left pan, the
// manifest's declared checksum loads the right, and `collected` is the
// counterweight for everything ever thrown away. The same beam survives a
// compaction and then tips when a fragment goes missing.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------- geometry
const PIVOT_X = 640;
const PIVOT_Y = 252;
const ARM = 258;
const PAN_DROP = 76;

const FRAG_N = 10;
const FRAG_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const FRAG_Y = 522;
const FRAG_W = 92;
const FRAG_GAP = 10;
const fragX = (i: number) => 118 + i * (FRAG_W + FRAG_GAP);
const COMPACTED = 4; // A through D fold into one snapshot

const CAM_BEAM: CameraState = { x: 640, y: 268, k: 1.14 };
const CAM_ROW: CameraState = { x: 620, y: 496, k: 1.2 };
const CAM_WIDE: CameraState = { x: 640, y: 376, k: 1.0 };
const CAM_TIP: CameraState = { x: 700, y: 268, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rowU: ChannelRef<number>;
  beamU: ChannelRef<number>;
  loadU: ChannelRef<number>;
  tilt: ChannelRef<number>;
  algebraU: ChannelRef<number>;
  compactU: ChannelRef<number>;
  collectedU: ChannelRef<number>;
  scrubU: ChannelRef<number>;
  lossU: ChannelRef<number>;
  e2eU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rowU = tl.channel('rowU', 0);
  const beamU = tl.channel('beamU', 0);
  const loadU = tl.channel('loadU', 0);
  const tilt = tl.channel('tilt', 0);
  const algebraU = tl.channel('algebraU', 0);
  const compactU = tl.channel('compactU', 0);
  const collectedU = tl.channel('collectedU', 0);
  const scrubU = tl.channel('scrubU', 0);
  const lossU = tl.channel('lossU', 0);
  const e2eU = tl.channel('e2eU', 0);
  const recapU = tl.channel('recapU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // BEAT 1 — the expensive claim.
  tl.caption({
    at: 0.4,
    dur: 6.4,
    text: 'Everything so far assumed the files are still what you wrote. Believing a log is broken is cheap. Believing it is intact is the expensive claim, and it needs evidence.',
  });
  tl.tween(cam, CAM_ROW, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(rowU, FRAG_N, { at: 0.9, dur: 3.4, ease: ease.linear });
  tl.hold(6.8, 0.7);

  // BEAT 2 — each fragment carries a checksum.
  tl.caption({
    at: 7.5,
    dur: 6.4,
    text: 'Every fragment carries a checksum of its own contents, and the manifest carries a single checksum that claims to cover the whole log.',
  });
  tl.tween(cam, CAM_BEAM, { at: 7.7, dur: 1.4, ease: ease.move });
  tl.tween(beamU, 1, { at: 8.1, dur: 1.4, ease: ease.draw });
  tl.hold(13.9, 0.6);

  // BEAT 3 — the balance.
  tl.caption({
    at: 14.5,
    dur: 6.5,
    text: 'So the log has a running total that must always balance. Add up every fragment and every snapshot, and you must land on exactly the number the manifest declares.',
  });
  tl.tween(loadU, 1, { at: 15.0, dur: 2.0, ease: ease.move });
  tl.hold(21.0, 0.6);

  // BEAT 4 — the properties.
  tl.caption({
    at: 21.6,
    dur: 6.6,
    text: 'The checksum is built to be added and subtracted. Order does not matter, and folding one fragment in costs the same whether the log holds ten files or ten million.',
  });
  tl.tween(algebraU, 1, { at: 22.1, dur: 1.0, ease: ease.enter });
  tl.hold(28.2, 0.6);

  // BEAT 5 — compaction conserves it.
  tl.caption({
    at: 28.8,
    dur: 6.6,
    text: 'That is what makes the folding in the last chapter safe. The snapshot covering the first four fragments carries their combined sum, so the total is conserved exactly.',
  });
  tl.tween(cam, CAM_WIDE, { at: 29.0, dur: 1.4, ease: ease.move });
  tl.tween(compactU, 1, { at: 29.5, dur: 2.0, ease: ease.move });
  tl.hold(35.4, 0.6);

  // BEAT 6 — collected is the counterweight.
  tl.caption({
    at: 36.0,
    dur: 6.5,
    text: 'Deletion is trickier, because the bytes really are gone. So the manifest keeps a second number for everything ever collected, and that stands in for the missing weight.',
  });
  tl.tween(collectedU, 1, { at: 36.5, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_BEAM, { at: 36.7, dur: 1.3, ease: ease.move });
  tl.hold(42.5, 0.6);

  // BEAT 7 — the scrub.
  tl.caption({
    at: 43.1,
    dur: 6.5,
    text: 'A scrub is then just that arithmetic, done honestly. Walk the manifest, sum the children, add what was collected, and compare against the declared total.',
  });
  tl.tween(scrubU, 1, { at: 43.6, dur: 1.8, ease: ease.move });
  tl.hold(49.6, 0.6);

  // BEAT 8 — the tip.
  tl.caption({
    at: 50.2,
    dur: 6.6,
    text: 'Now quietly lose one fragment. Nothing else changes, no error is raised, and the file simply is not there anymore. The sum no longer balances, and the scrub says so.',
  });
  tl.tween(cam, CAM_TIP, { at: 50.4, dur: 1.4, ease: ease.move });
  tl.tween(lossU, 1, { at: 50.9, dur: 1.2, ease: ease.enter });
  tl.tween(tilt, 1, { at: 51.6, dur: 1.6, ease: ease.move });
  tl.hold(56.8, 0.6);

  // BEAT 9 — what it does not cover.
  tl.caption({
    at: 57.4,
    dur: 6.5,
    text: 'But be precise about what that proves. It proves the data at rest is what the manifest says it is. It says nothing about writes that were dropped before they were ever counted.',
  });
  tl.tween(tilt, 0.15, { at: 58.4, dur: 1.4, ease: ease.move });
  tl.tween(lossU, 0.1, { at: 58.4, dur: 1.0, ease: ease.move });
  tl.hold(63.9, 0.6);

  // BEAT 10 — end to end.
  tl.caption({
    at: 64.5,
    dur: 6.5,
    text: 'For that you need the boring test: write a message, read it back, and insist on one read for every write. Anything other than a one to one mapping is a bug.',
  });
  tl.tween(cam, CAM_WIDE, { at: 64.7, dur: 1.4, ease: ease.move });
  tl.tween(e2eU, 1, { at: 65.2, dur: 2.2, ease: ease.move });
  tl.hold(71.0, 0.6);

  // BEAT 11 — recap of the pattern.
  tl.caption({
    at: 71.6,
    dur: 6.8,
    text: 'Step back and the whole log is one idea repeated five ways. Immutable files hold the data, and one small record decides which of them count.',
  });
  tl.tween(recapU, 1, { at: 72.1, dur: 1.6, ease: ease.enter });
  tl.hold(78.4, 0.6);

  // BEAT 12 — the transferable lesson.
  tl.caption({
    at: 79.0,
    dur: 6.8,
    text: 'You will meet that shape again wherever a system needs agreement but cannot afford a lock: pile up data nobody may edit, and let a single conditional write move the pointer that names it.',
  });
  tl.tween(recapU, 1.6, { at: 79.4, dur: 1.6, ease: ease.move });
  tl.hold(85.8, 0.6);

  // BEAT 13 — clean close.
  tl.caption({
    at: 86.4,
    dur: 6.9,
    text: 'A bucket, some files that never change, one header, and a sum that has to balance. That is a linearizable log, and there is no lock service anywhere in it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 86.6, dur: 1.4, ease: ease.move });
  tl.tween(endDim, 1, { at: 86.9, dur: 1.3, ease: ease.move });
  tl.tween(endU, 1, { at: 88.0, dur: 0.9, ease: ease.enter });
  tl.hold(93.3, 1.2);

  return {
    tl, cam, rowU, beamU, loadU, tilt, algebraU, compactU, collectedU, scrubU, lossU, e2eU, recapU, endDim, endU,
  };
}

const scene = buildScene();

// ------------------------------------------------------------------ render

function Beam({
  beamU, loadU, tilt, collectedU, scrubU, lossU, fade,
}: { beamU: number; loadU: number; tilt: number; collectedU: number; scrubU: number; lossU: number; fade: number }) {
  if (beamU <= 0.02 || fade >= 0.98) return null;
  const angle = tilt * 9; // degrees; left pan falls when weight goes missing on the right
  const rad = (angle * Math.PI) / 180;
  const lx = PIVOT_X - ARM * Math.cos(rad);
  const ly = PIVOT_Y - ARM * Math.sin(rad);
  const rx = PIVOT_X + ARM * Math.cos(rad);
  const ry = PIVOT_Y + ARM * Math.sin(rad);
  const draw = clamp01(beamU);
  const balanced = tilt < 0.25;
  return (
    <g opacity={draw * (1 - clamp01(fade))}>
      <line
        x1={lerp(PIVOT_X, lx, draw)}
        y1={lerp(PIVOT_Y, ly, draw)}
        x2={lerp(PIVOT_X, rx, draw)}
        y2={lerp(PIVOT_Y, ry, draw)}
        stroke={balanced ? colors.ACCENT : colors.NEGATIVE}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={PIVOT_X} cy={PIVOT_Y} r={8} fill={balanced ? colors.ACCENT : colors.NEGATIVE} />

      {/* left pan — what the files actually add up to */}
      <g opacity={clamp01(loadU)}>
        <line x1={lx} y1={ly} x2={lx} y2={ly + PAN_DROP} stroke={colors.GRID} strokeWidth={1.4} />
        <rect x={lx - 118} y={ly + PAN_DROP} width={236} height={76} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
        <text x={lx} y={ly + PAN_DROP + 28} textAnchor="middle" fill={colors.MUTED} fontSize={12} letterSpacing="0.1em">OBSERVED</text>
        <text x={lx} y={ly + PAN_DROP + 54} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
          Σ snapshots + fragments
        </text>
        {collectedU > 0.05 && (
          <text x={lx} y={ly + PAN_DROP + 98} textAnchor="middle" fill={colors.WARM} fontFamily={MONO} fontSize={13} opacity={clamp01(collectedU)}>
            + collected
          </text>
        )}
      </g>

      {/* right pan — what the manifest claims */}
      <g opacity={clamp01(loadU)}>
        <line x1={rx} y1={ry} x2={rx} y2={ry + PAN_DROP} stroke={colors.GRID} strokeWidth={1.4} />
        <rect x={rx - 118} y={ry + PAN_DROP} width={236} height={76} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
        <text x={rx} y={ry + PAN_DROP + 28} textAnchor="middle" fill={colors.MUTED} fontSize={12} letterSpacing="0.1em">DECLARED</text>
        <text x={rx} y={ry + PAN_DROP + 54} textAnchor="middle" fill={colors.ACCENT} fontFamily={MONO} fontSize={14}>
          manifest.setsum
        </text>
      </g>

      {scrubU > 0.05 && (
        <g opacity={clamp01(scrubU)}>
          <rect x={PIVOT_X - 118} y={PIVOT_Y - 118} width={236} height={44} rx={22} fill={colors.BG} stroke={balanced ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={1.4} />
          <text x={PIVOT_X} y={PIVOT_Y - 89} textAnchor="middle" fill={balanced ? colors.POSITIVE : colors.NEGATIVE} fontFamily={MONO} fontSize={14}>
            {balanced ? 'ScrubSuccess' : 'CorruptManifest'}
          </text>
        </g>
      )}

      {lossU > 0.15 && (
        <text x={PIVOT_X} y={PIVOT_Y + 176} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} opacity={clamp01(lossU)}>
          one fragment vanished from the bucket
        </text>
      )}
    </g>
  );
}

function FragmentRow({ rowU, compactU, lossU }: { rowU: number; compactU: number; lossU: number }) {
  return (
    <g>
      {FRAG_LABELS.map((label, i) => {
        const born = clamp01(rowU - i);
        if (born <= 0) return null;
        const folded = i < COMPACTED ? compactU : 0;
        const missing = i === 7 ? lossU : 0;
        const y = FRAG_Y + folded * 14;
        return (
          <g key={label} opacity={born * (1 - folded * 0.55) * (1 - missing * 0.85)}>
            <rect
              x={fragX(i)}
              y={y}
              width={FRAG_W}
              height={62}
              rx={9}
              fill={colors.PANEL}
              stroke={missing > 0.3 ? colors.NEGATIVE : colors.GRID}
              strokeWidth={1.3}
              strokeDasharray={missing > 0.3 ? '5 5' : undefined}
            />
            <text x={fragX(i) + FRAG_W / 2} y={y + 28} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={15}>{label}</text>
            <text x={fragX(i) + FRAG_W / 2} y={y + 48} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={10}>setsum</text>
          </g>
        );
      })}
      {compactU > 0.05 && (
        <g opacity={clamp01(compactU)}>
          <rect
            x={fragX(0)}
            y={FRAG_Y - 46}
            width={COMPACTED * (FRAG_W + FRAG_GAP) - FRAG_GAP}
            height={38}
            rx={8}
            fill={colors.BG}
            stroke={colors.SECONDARY}
            strokeWidth={1.4}
          />
          <text x={fragX(0) + 14} y={FRAG_Y - 20} fill={colors.SECONDARY} fontFamily={MONO} fontSize={13}>
            snapshot · setsum of A through D
          </text>
        </g>
      )}
      <text x={118} y={FRAG_Y - 66} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em" opacity={clamp01(rowU / 3)}>
        FRAGMENTS · EACH WITH ITS OWN SETSUM
      </text>
    </g>
  );
}

function EndToEnd({ u }: { u: number }) {
  if (u <= 0.02) return null;
  const n = 8;
  return (
    <g opacity={clamp01(u)}>
      <text x={118} y={182} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em">END-TO-END VERIFICATION</text>
      {Array.from({ length: n }, (_, i) => {
        const cu = clamp01(u * n - i);
        const x = 130 + i * 62;
        return (
          <g key={i} opacity={cu}>
            <rect x={x} y={200} width={44} height={22} rx={5} fill={colors.ACCENT} opacity={0.75} />
            <line x1={x + 22} y1={228} x2={x + 22} y2={252} stroke={colors.POSITIVE} strokeWidth={1.4} />
            <rect x={x} y={254} width={44} height={22} rx={5} fill={colors.POSITIVE} opacity={0.75} />
          </g>
        );
      })}
      <text x={640} y={214} fill={colors.MUTED} fontSize={13}>writes in</text>
      <text x={640} y={270} fill={colors.MUTED} fontSize={13}>reads out</text>
      <text x={840} y={244} fill={colors.POSITIVE} fontFamily={MONO} fontSize={14}>one to one, or it is a bug</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const endDim = s.get(scene.endDim);
  const dim = 1 - endDim * 0.93;
  const endU = s.get(scene.endU);
  const algebraU = s.get(scene.algebraU);
  const recapU = s.get(scene.recapU);
  const e2eU = s.get(scene.e2eU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          {e2eU < 0.05 && (
            <FragmentRow rowU={s.get(scene.rowU)} compactU={s.get(scene.compactU)} lossU={s.get(scene.lossU)} />
          )}
          <Beam
            beamU={s.get(scene.beamU)}
            loadU={s.get(scene.loadU)}
            tilt={s.get(scene.tilt)}
            collectedU={s.get(scene.collectedU)}
            scrubU={s.get(scene.scrubU)}
            lossU={s.get(scene.lossU)}
            fade={e2eU}
          />
          {algebraU > 0.03 && e2eU < 0.05 && (
            <MathLabel
              tex={'\\mathrm{setsum}(A..J) = \\mathrm{setsum}(A..D) + \\mathrm{setsum}(E..J)'}
              x={640}
              y={88}
              fontSize={22}
              opacity={clamp01(algebraU) * 0.95}
            />
          )}
          <EndToEnd u={e2eU} />

          {recapU > 0.05 && (
            <g opacity={clamp01(recapU)}>
              <text x={640} y={392} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={15}>
                fragments · manifest · cursors · snapshots · setsum
              </text>
              {recapU > 1.05 && (
                <text x={640} y={430} textAnchor="middle" fill={colors.ACCENT} fontSize={16} opacity={clamp01(recapU - 1.05)}>
                  immutable data, one conditionally updated authority record
                </text>
              )}
            </g>
          )}
        </g>

        {endU > 0 && (
          <g opacity={endU}>
            <rect x={200} y={196} width={880} height={270} rx={24} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.8} />
            <text x={640} y={264} textAnchor="middle" fill={colors.ACCENT} fontSize={23} fontWeight={700}>
              A LINEARIZABLE LOG, BUILT FROM A BUCKET
            </text>
            <text x={640} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
              files that never change · one header that decides
            </text>
            <line x1={420} y1={350} x2={860} y2={350} stroke={colors.GRID} />
            <text x={640} y={392} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>
              a sum that has to balance, every time you ask
            </text>
            <text x={640} y={434} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>
              chroma-core/chroma · rust/wal3
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
