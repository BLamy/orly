// Nostr Implementation Possibilities №7 — The Signer, chapter 5.
// Synthesis: three signer designs (NIP-07 extension, NIP-46 remote/bunker,
// NIP-49 ncryptsec at rest) are one principle — the app asks, the key decides —
// at three distances. Closes on the permission model: a connect request carries
// a scope, so "may sign" is not "may sign anything." No new spec facts here;
// it recomposes chapters 1–4.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { TokenFlight } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const APP = { x: 250, y: 330 };
const VAULT = { x: 1000, y: 330 };

const SIGNERS = [
  { key: 'nip07', label: 'NIP-07 extension', sub: 'wall = a process boundary', color: colors.ACCENT, y: 150 },
  { key: 'nip46', label: 'NIP-46 bunker', sub: 'wall = the whole internet', color: colors.NEGATIVE, y: 330 },
  { key: 'nip49', label: 'NIP-49 ncryptsec', sub: 'wall = a password', color: colors.WARM, y: 510 },
];

const PERMS = [
  { text: 'sign_event kind 1', ok: true },
  { text: 'nip44_encrypt', ok: true },
  { text: 'sign_event kind 5 (delete)', ok: false },
];

const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_PERMS: CameraState = { x: 640, y: 330, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  appU: ChannelRef<number>;
  vaultU: ChannelRef<number>;
  rowsU: ChannelRef<number>;
  askU: ChannelRef<number>;
  scopeU: ChannelRef<number>;
  permU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const appU = tl.channel('appU', 0);
  const vaultU = tl.channel('vaultU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const askU = tl.channel('askU', 0);
  const scopeU = tl.channel('scopeU', 0);
  const permU = tl.channel('permU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — three doors, one room.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Step back and the three designs line up. An extension, a remote bunker, an encrypted string on paper — three different walls around the very same room, where the key lives.',
  });
  tl.tween(appU, 1, { at: 0.7, dur: 0.7, ease: ease.enter });
  tl.tween(vaultU, 1, { at: 1.2, dur: 0.7, ease: ease.enter });
  tl.tween(rowsU, 1, { at: 1.8, dur: 2.4, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — the shared shape.
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'The wall changes — a process boundary, the whole internet, or a password — but the traffic across it never does. Something unsigned goes in; something signed comes out. The key stays put.',
  });
  tl.tween(askU, 1, { at: 7.4, dur: 3.2, ease: ease.linear });
  tl.hold(13.0, 0.7);

  // Beat 3 — but "may sign" isn't "may sign anything".
  tl.caption({
    at: 13.7,
    dur: 6.2,
    text: 'Which raises the real question a signer answers: not can you sign, but will you sign this. When an app connects, it asks for a scope, and the signer grants only part of it.',
  });
  tl.tween(cam, CAM_PERMS, { at: 13.9, dur: 1.4, ease: ease.move });
  tl.tween(scopeU, 1, { at: 14.6, dur: 1.2, ease: ease.enter });
  tl.hold(19.9, 0.7);

  // Beat 4 — the permission list.
  tl.caption({
    at: 20.6,
    dur: 6.4,
    text: 'So an app might be allowed to post notes and encrypt messages, but refused when it tries to sign a deletion. The secret is not a blank check. It is a gatekeeper that reads each request before it answers.',
  });
  tl.tween(permU, 1, { at: 21.2, dur: 2.6, ease: ease.enter });
  tl.hold(27.0, 0.7);

  // Beat 5 — close the book.
  tl.caption({
    at: 27.7,
    dur: 6.0,
    text: 'That is the signer, across four chapters: the secret never moves, the app only ever asks, and every ask can be judged. Identity you hold, delegated one signature at a time.',
  });
  tl.tween(cam, CAM_WIDE, { at: 27.9, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 28.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 29.1, dur: 1.0, ease: ease.enter });
  tl.hold(33.7, 1.4);

  return { tl, cam, appU, vaultU, rowsU, askU, scopeU, permU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const appU = s.get(scene.appU);
  const vaultU = s.get(scene.vaultU);
  const rowsU = s.get(scene.rowsU);
  const askU = s.get(scene.askU);
  const scopeU = s.get(scene.scopeU);
  const permU = s.get(scene.permU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const showPerms = scopeU > 0;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* three signer rows fade back when the permission panel takes over */}
          <g opacity={1 - 0.82 * clamp01(scopeU)}>
            {SIGNERS.map((sg, i) => {
              const u = clamp01(rowsU * SIGNERS.length - i);
              if (u <= 0) return null;
              return (
                <g key={sg.key} opacity={u}>
                  <line x1={640} y1={sg.y} x2={640} y2={sg.y} stroke={sg.color} />
                  <rect x={490} y={sg.y - 26} width={300} height={52} rx={10} fill={colors.PANEL} stroke={sg.color} strokeWidth={1.5} />
                  <text x={640} y={sg.y - 4} textAnchor="middle" fill={sg.color} fontSize={14} fontWeight={600}>{sg.label}</text>
                  <text x={640} y={sg.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>{sg.sub}</text>
                  {/* ask in, signed out */}
                  {askU > 0 && (
                    <>
                      <TokenFlight from={{ x: 300, y: sg.y }} to={{ x: 486, y: sg.y }} u={clamp01(askU * 2 - i * 0.2)} text="unsigned →" fill={colors.MUTED} fontSize={11} lift={18} />
                      <TokenFlight from={{ x: 794, y: sg.y }} to={{ x: 980, y: sg.y }} u={clamp01(askU * 2 - i * 0.2 - 0.5)} text="signed ✓" fill={colors.POSITIVE} fontSize={11} lift={18} />
                    </>
                  )}
                </g>
              );
            })}
            {rowsU > 0 && (
              <>
                <text x={APP.x} y={APP.y - 150} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={600} opacity={appU}>the app</text>
                <text x={VAULT.x} y={APP.y - 150} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={600} opacity={vaultU}>the key</text>
              </>
            )}
          </g>

          {/* permission scope panel */}
          {showPerms && (
            <g opacity={scopeU}>
              <rect x={410} y={190} width={460} height={260} rx={14} fill={colors.PANEL} opacity={0.97} stroke={colors.GRID} />
              <text x={640} y={228} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={600}>
                connect · requested scope
              </text>
              {PERMS.map((p, i) => {
                const u = clamp01(permU * PERMS.length - i);
                if (u <= 0) return null;
                const y = 272 + i * 46;
                return (
                  <g key={p.text} opacity={u}>
                    <circle cx={452} cy={y - 4} r={11} fill="none" stroke={p.ok ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={2} />
                    {p.ok ? (
                      <path d={`M446 ${y - 4} l4 4 l8 -8`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} strokeLinecap="round" />
                    ) : (
                      <path d={`M447 ${y - 9} l10 10 m0 -10 l-10 10`} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.2} strokeLinecap="round" />
                    )}
                    <text x={478} y={y} fill={p.ok ? colors.TEXT : colors.MUTED} fontSize={14} fontFamily="monospace">
                      {p.text}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={220} width={880} height={210} rx={14} fill={colors.PANEL} opacity={0.97} stroke={colors.WARM} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            The key stays; the app only asks
          </text>
          <text x={640} y={332} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            extension, bunker, or ncryptsec — one principle at three distances,
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            and every request judged against a scope
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-07 · NIP-46 · NIP-49 — identity you hold
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
