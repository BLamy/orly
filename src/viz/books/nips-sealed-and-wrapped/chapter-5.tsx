// Sealed and Wrapped — chapter 5: seal it, wrap it (NIP-59 + NIP-17).
// One message rides through all three layers as nested envelopes: the
// UNSIGNED kind-14 rumor (dashed signature slot = deniability), shrinking
// into a kind-13 seal signed by the author, shrinking again into a kind-1059
// gift wrap signed by a one-time key that then evaporates. Timestamps
// scatter across a two-day window; two wraps fly to the recipient's
// kind-10050 relays (one copy per participant). Grounded in NIP-59/17.
import { CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { ServiceNode, shortHex } from '../../primitives';
import overrides from './chapter-5.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const ALICE = '82f1a9c3e5b7d901f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9';
const EPHEM = 'e91fd0…one-time';

// Envelope geometry: three concentric cards. The rumor starts full-size and
// shrinks into the seal's content; the seal shrinks into the wrap's content.
const RUMOR_FULL = { x: 340, y: 120, w: 480, h: 300 };
const SEAL_FULL = { x: 300, y: 100, w: 560, h: 360 };
const WRAP_FULL = { x: 260, y: 80, w: 640, h: 420 };

const RELAYS = [
  { x: 1080, y: 200, label: 'dm relay 1' },
  { x: 1080, y: 380, label: 'dm relay 2' },
];

const CAM_LETTER: CameraState = { x: 580, y: 290, k: 1.15 };
const CAM_WIDE: CameraState = { x: 700, y: 300, k: 1.0 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rumorU: ChannelRef<number>;
  noSigU: ChannelRef<number>;
  sealShrinkU: ChannelRef<number>;
  sealU: ChannelRef<number>;
  wrapShrinkU: ChannelRef<number>;
  wrapU: ChannelRef<number>;
  ephemU: ChannelRef<number>;
  ephemGoneU: ChannelRef<number>;
  clockU: ChannelRef<number>;
  sendU: ChannelRef<number>;
  unwrapU: ChannelRef<number>;
  limitsU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rumorU = tl.channel('rumorU', 0);
  const noSigU = tl.channel('noSigU', 0);
  const sealShrinkU = tl.channel('sealShrinkU', 0);
  const sealU = tl.channel('sealU', 0);
  const wrapShrinkU = tl.channel('wrapShrinkU', 0);
  const wrapU = tl.channel('wrapU', 0);
  const ephemU = tl.channel('ephemU', 0);
  const ephemGoneU = tl.channel('ephemGoneU', 0);
  const clockU = tl.channel('clockU', 0);
  const sendU = tl.channel('sendU', 0);
  const unwrapU = tl.channel('unwrapU', 0);
  const limitsU = tl.channel('limitsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the rumor.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'The actual message is called a rumor — a kind fourteen chat event with one deliberate defect: it is never signed. If a rumor ever leaks, nothing cryptographically ties it to its author.',
  });
  tl.tween(rumorU, 1, { at: 0.8, dur: 1.6, ease: ease.enter });
  tl.tween(cam, CAM_LETTER, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(noSigU, 1, { at: 3.4, dur: 0.8, ease: ease.enter });
  tl.hold(6.5, 0.7);

  // Beat 2 — the seal.
  tl.caption({
    at: 7.2,
    dur: 6.2,
    text: 'The rumor is encrypted with the conversation key from chapter two and slid inside a seal — a kind thirteen event that really is signed by the author. The seal proves who, and reveals nothing else.',
  });
  tl.tween(sealShrinkU, 1, { at: 8.0, dur: 1.4, ease: ease.move });
  tl.tween(sealU, 1, { at: 8.6, dur: 1.2, ease: ease.enter });
  tl.hold(13.4, 0.7);

  // Beat 3 — the wrap and the one-time key.
  tl.caption({
    at: 14.1,
    dur: 6.6,
    text: 'Then the trick that hides the envelope itself. A brand-new keypair is conjured for this one delivery. It encrypts the seal to the recipient, signs the outer gift wrap — kind one zero five nine — and is thrown away forever.',
  });
  tl.tween(ephemU, 1, { at: 14.7, dur: 0.8, ease: ease.pop });
  tl.tween(wrapShrinkU, 1, { at: 15.7, dur: 1.4, ease: ease.move });
  tl.tween(wrapU, 1, { at: 16.3, dur: 1.2, ease: ease.enter });
  tl.tween(ephemGoneU, 1, { at: 18.6, dur: 1.2, ease: ease.move });
  tl.hold(20.9, 0.7);

  // Beat 4 — what an observer sees now.
  tl.caption({
    at: 21.6,
    dur: 6.2,
    text: 'Now read the outside like an eavesdropper. Author: a key nobody has ever seen and never will again. Content: opaque. Recipient: the one tag routing requires. The envelope has gone anonymous.',
  });
  tl.hold(28.0, 0.7);

  // Beat 5 — timestamp fuzz.
  tl.caption({
    at: 28.7,
    dur: 6.0,
    text: 'Even the clocks lie, deliberately. The true time lives inside the rumor; the seal and the wrap each scatter their own timestamps up to two days into the past to defeat timing analysis.',
  });
  tl.tween(clockU, 1, { at: 29.5, dur: 1.8, ease: ease.move });
  tl.hold(34.9, 0.7);

  // Beat 6 — delivery to DM relays.
  tl.caption({
    at: 35.6,
    dur: 6.4,
    text: 'Delivery follows the recipient’s own instructions: a kind ten thousand fifty event lists their few chosen D M relays, and one wrapped copy goes to each participant — including a copy the sender keeps for themself.',
  });
  tl.tween(cam, CAM_WIDE, { at: 35.8, dur: 1.5, ease: ease.move });
  tl.tween(sendU, 1, { at: 36.6, dur: 2.6, ease: ease.linear });
  tl.hold(42.2, 0.7);

  // Beat 7 — unwrapping + limits.
  tl.caption({
    at: 42.9,
    dur: 6.4,
    text: 'The recipient reverses it all — unwrap with their key, unseal, read the rumor. The honest ledger: no forward secrecy, and a separate copy per member means groups beyond ten people need a different scheme.',
  });
  tl.tween(unwrapU, 1, { at: 43.7, dur: 1.4, ease: ease.move });
  tl.tween(limitsU, 1, { at: 45.9, dur: 0.9, ease: ease.enter });
  tl.hold(49.5, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 50.2,
    dur: 5.8,
    text: 'Sealed and wrapped: the cipher hides the words, the buckets hide the size, the wrap hides the envelope, and the fuzzed clocks hide the when. Private messaging, rebuilt from seven public fields.',
  });
  tl.tween(dimU, 1, { at: 50.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.6, dur: 1.0, ease: ease.enter });
  tl.hold(56.2, 1.4);

  return {
    tl, cam, rumorU, noSigU, sealShrinkU, sealU, wrapShrinkU, wrapU,
    ephemU, ephemGoneU, clockU, sendU, unwrapU, limitsU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-sealed-and-wrapped/chapter-5.overrides.json',
  slug: 'books/nips-sealed-and-wrapped/chapter-5',
};

const lerpBox = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }, u: number) => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
  w: a.w + (b.w - a.w) * u,
  h: a.h + (b.h - a.h) * u,
});

function Envelope({ box, stroke, title, sub, opacity, titleFill }: {
  box: { x: number; y: number; w: number; h: number };
  stroke: string;
  title: string;
  sub?: string;
  opacity: number;
  titleFill?: string;
}) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={12} fill={colors.PANEL} stroke={stroke} strokeWidth={1.8} opacity={0.92} />
      <text x={box.x + 18} y={box.y + 26} fill={titleFill ?? stroke} fontSize={14} fontWeight={600}>
        {title}
      </text>
      {sub && (
        <text x={box.x + 18} y={box.y + 46} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rumorU = s.get(scene.rumorU);
  const noSigU = s.get(scene.noSigU);
  const sealShrinkU = s.get(scene.sealShrinkU);
  const sealU = s.get(scene.sealU);
  const wrapShrinkU = s.get(scene.wrapShrinkU);
  const wrapU = s.get(scene.wrapU);
  const ephemU = s.get(scene.ephemU);
  const ephemGoneU = s.get(scene.ephemGoneU);
  const clockU = s.get(scene.clockU);
  const sendU = s.get(scene.sendU);
  const unwrapU = s.get(scene.unwrapU);
  const limitsU = s.get(scene.limitsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  // rumor shrinks into the seal, then the seal+rumor shrink into the wrap
  const rumorInSeal = { x: SEAL_FULL.x + 40, y: SEAL_FULL.y + 92, w: SEAL_FULL.w - 80, h: 150 };
  const rumorBox0 = lerpBox(RUMOR_FULL, rumorInSeal, sealShrinkU);
  const sealInWrap = { x: WRAP_FULL.x + 44, y: WRAP_FULL.y + 100, w: WRAP_FULL.w - 88, h: 250 };
  const sealBox = lerpBox(SEAL_FULL, sealInWrap, wrapShrinkU);
  // rumor tracks the seal's shrink too
  const rumorBox = lerpBox(rumorBox0, { x: sealInWrap.x + 32, y: sealInWrap.y + 76, w: sealInWrap.w - 64, h: 110 }, wrapShrinkU);

  // the whole bundle slides toward relays as sendU rises (two copies)
  const bundleShift = sendU > 0 ? 0 : 0;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <g transform={`translate(${bundleShift}, 0)`}>
            {/* gift wrap (outermost) */}
            <Envelope
              box={WRAP_FULL}
              stroke={colors.SECONDARY}
              title="gift wrap — kind 1059"
              sub={`pubkey: ${EPHEM} · p: recipient · sig: one-time key`}
              opacity={wrapU}
            />
            {/* seal */}
            <Envelope
              box={sealBox}
              stroke={colors.WARM}
              title="seal — kind 13"
              sub={`pubkey: ${shortHex(ALICE, 6, 2)} (author) · content: nip44(rumor)`}
              opacity={sealU}
            />
            {/* rumor */}
            <Envelope
              box={rumorBox}
              stroke={colors.ACCENT}
              title="rumor — kind 14 (the message)"
              sub={'content: "see you at 7?" · p: recipient'}
              opacity={rumorU}
            />
            {/* the missing signature slot */}
            {noSigU > 0 && sealShrinkU < 0.6 && (
              <g opacity={noSigU * (1 - sealShrinkU / 0.6)}>
                <rect x={rumorBox.x + 18} y={rumorBox.y + rumorBox.h - 52} width={200} height={26} rx={6} fill="none" stroke={colors.NEGATIVE} strokeDasharray="5 4" />
                <text x={rumorBox.x + 26} y={rumorBox.y + rumorBox.h - 34} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                  sig: (never signed)
                </text>
                <text x={rumorBox.x + 232} y={rumorBox.y + rumorBox.h - 34} fill={colors.MUTED} fontSize={11}>
                  ← deniability
                </text>
              </g>
            )}
          </g>

          {/* the one-time key */}
          {ephemU > 0 && (
            <g opacity={ephemU * (1 - ephemGoneU)} transform={`translate(${140}, ${150 + ephemGoneU * -60})`}>
              <circle cx={0} cy={0} r={22} fill="none" stroke={colors.SECONDARY} strokeWidth={2} />
              <text x={0} y={5} textAnchor="middle" fontSize={16}>🗝</text>
              <text x={0} y={44} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily="monospace">
                one-time key
              </text>
              {ephemGoneU > 0 && (
                <text x={0} y={64} textAnchor="middle" fill={colors.MUTED} fontSize={10} opacity={ephemGoneU}>
                  …destroyed
                </text>
              )}
            </g>
          )}

          {/* fuzzed clocks */}
          {clockU > 0 && (
            <g opacity={clockU}>
              {[
                { x: 0, label: 'rumor: the true time', off: 0, color: colors.ACCENT },
                { x: 1, label: 'seal: −31 h', off: -0.65, color: colors.WARM },
                { x: 2, label: 'wrap: −9 h', off: -0.19, color: colors.SECONDARY },
              ].map((c, i) => (
                <g key={i} transform={`translate(${180 + i * 0}, ${300 + i * 64})`}>
                  <circle cx={0} cy={0} r={17} fill="none" stroke={c.color} strokeWidth={1.6} />
                  <line x1={0} y1={0} x2={12 * Math.cos(-Math.PI / 2 + c.off * Math.PI * clockU)} y2={12 * Math.sin(-Math.PI / 2 + c.off * Math.PI * clockU)} stroke={c.color} strokeWidth={1.8} />
                  <text x={28} y={5} fill={c.color} fontSize={11} fontFamily="monospace">
                    {c.label}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* relays + delivery */}
          {sendU > 0 && (
            <g>
              {RELAYS.map((r, i) => (
                <ServiceNode key={r.label} x={r.x} y={r.y} kind="server" label={r.label} sublabel="kind 10050 pick" u={clamp01(sendU * 3 - i)} w={150} h={50} />
              ))}
              {RELAYS.map((r, i) => {
                const u = clamp01(sendU * 2 - i * 0.5 - 0.5);
                if (u <= 0) return null;
                const x0 = WRAP_FULL.x + WRAP_FULL.w;
                const y0 = WRAP_FULL.y + WRAP_FULL.h / 2;
                return (
                  <g key={i} opacity={0.95}>
                    <rect
                      x={x0 + (r.x - 90 - x0) * u - 16}
                      y={y0 + (r.y - y0) * u - 11}
                      width={32}
                      height={22}
                      rx={5}
                      fill={colors.PANEL}
                      stroke={colors.SECONDARY}
                      strokeWidth={1.4}
                    />
                  </g>
                );
              })}
              <text x={1080} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={11} opacity={clamp01(sendU * 2 - 1)}>
                one wrapped copy per participant
              </text>
            </g>
          )}

          {/* unwrap arrows + limits */}
          {unwrapU > 0 && (
            <text x={1080} y={500} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} opacity={unwrapU}>
              recipient: unwrap → unseal → read
            </text>
          )}
          {limitsU > 0 && (
            <g opacity={limitsU}>
              <text x={260} y={560} fill={colors.MUTED} fontSize={13}>
                honest ledger: no forward secrecy · no post-compromise security · &gt;10 people, use another scheme
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Words, size, sender, time — all hidden
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            rumor (unsigned) → seal (author-signed) → wrap (one-time key)
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-17 + NIP-59 · kinds 14 / 13 / 1059 · kind 10050 relays
          </text>
        </g>
      )}
    </>
  );
}

export function Chapter5() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
