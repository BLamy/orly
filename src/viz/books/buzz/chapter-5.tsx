// Buzz — chapter 5: self-sovereign, open, and truly social.
// The closing thesis from Block's launch post. Everything is a signed event on
// a relay you host yourself: run your own relay, own your domain and data,
// carry your keys anywhere. Open: Apache 2.0, built on nostr, model-agnostic,
// no lock-in. Each workspace runs through a single relay today; federation
// between relays is the path to fuller decentralization. The point: people and
// agents as equal members of one network doing work together — "truly social
// AI." Honest about what works today vs. what's coming.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { TokenFlight } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const RELAY = { x: 560, y: 300, w: 160, h: 96 };
// members (people + agents) around the relay, all equal
const MEMBERS = [
  { name: 'maya', color: colors.WARM, x: 300, y: 200 },
  { name: 'goose', color: colors.SECONDARY, x: 300, y: 420 },
  { name: 'sam', color: colors.POSITIVE, x: 980, y: 200 },
  { name: 'codex', color: colors.SECONDARY, x: 980, y: 420 },
];
const PRINCIPLES = [
  { k: 'self-sovereign', v: 'run your own relay · own your domain + data · carry your keys' },
  { k: 'open', v: 'Apache 2.0 · built on nostr · model-agnostic · no lock-in' },
  { k: 'one context', v: 'people + agents + conversations + code, one record' },
];
const TODAY = ['channels', 'threads', 'DMs', 'canvases', 'media', 'search', 'audit log', 'workflows', 'desktop app'];
const COMING = ['full git hosting', 'mobile + push', 'approval gates', 'federation'];

const CAM_RELAY: CameraState = { x: 640, y: 340, k: 1.05 };
const CAM_FED: CameraState = { x: 640, y: 300, k: 1.0 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const relayU = tl.channel('relayU', 0);
  const membersU = tl.channel('membersU', 0);
  const flowU = tl.channel('flowU', 0);
  const ownU = tl.channel('ownU', 0);
  const princU = tl.channel('princU', 0);
  const statusU = tl.channel('statusU', 0);
  const fedU = tl.channel('fedU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Everything you have seen — messages, patches, reviews, workflow steps, approvals — is the same thing: a signed event. And they all live on one relay. But here is the part that matters most: it is a relay you host yourself.',
  });
  tl.tween(cam, CAM_RELAY, { at: 0.8, dur: 1.5, ease: ease.move });
  tl.tween(relayU, 1, { at: 1.0, dur: 1.2, ease: ease.enter });
  tl.hold(6.5, 0.7);

  tl.caption({
    at: 7.2,
    dur: 6.4,
    text: 'Around it, the members of the workspace — people and agents, drawn the same size on purpose. Each one holds its own keys, and each one reads and writes to the relay you control.',
  });
  tl.tween(membersU, 1, { at: 7.6, dur: 2.2, ease: ease.enter });
  tl.tween(flowU, 4, { at: 8.0, dur: 5.4, ease: ease.linear });
  tl.hold(13.6, 0.7);

  tl.caption({
    at: 14.3,
    dur: 6.2,
    text: 'Self-sovereign is the first principle. You run your own relay. You own your domain and your data. And you can carry your keys anywhere — nothing here is locked to one company, including to Block.',
  });
  tl.tween(ownU, 1, { at: 14.8, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 15.0, dur: 1.4, ease: ease.move });
  tl.tween(princU, 1, { at: 16.0, dur: 2.6, ease: ease.enter });
  tl.hold(20.5, 0.7);

  tl.caption({
    at: 21.2,
    dur: 6.4,
    text: 'It is genuinely early, and Block is clear about that. Channels, threads, direct messages, canvases, media, search, the audit log, workflows, and the desktop app work today. Full git hosting, mobile, push, and finer approval gates are still coming.',
  });
  tl.tween(statusU, 1, { at: 21.7, dur: 2.6, ease: ease.enter });
  tl.hold(27.6, 0.7);

  tl.caption({
    at: 28.3,
    dur: 6.2,
    text: 'Each workspace runs through a single relay for now, and federation between relays is the clear path toward the fuller decentralization the design points at. One relay today; a network of them tomorrow.',
  });
  tl.tween(cam, CAM_FED, { at: 28.5, dur: 1.4, ease: ease.move });
  tl.tween(fedU, 1, { at: 29.2, dur: 2.0, ease: ease.enter });
  tl.hold(34.5, 0.7);

  tl.caption({
    at: 35.2,
    dur: 6.6,
    text: 'The bet underneath all of it: people and agents as equal members of one network, doing real work together, on a record everyone can host and no one can quietly rewrite. Block calls that truly social AI — and they are going to run more and more of the company on it.',
  });
  tl.tween(dimU, 1, { at: 35.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 36.6, dur: 1.0, ease: ease.enter });
  tl.hold(41.8, 1.4);

  return { tl, cam, relayU, membersU, flowU, ownU, princU, statusU, fedU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const relayU = s.get(scene.relayU);
  const membersU = s.get(scene.membersU);
  const flowU = s.get(scene.flowU);
  const ownU = s.get(scene.ownU);
  const princU = s.get(scene.princU);
  const statusU = s.get(scene.statusU);
  const fedU = s.get(scene.fedU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const mainOp = 1 - 0.85 * dimU;
  const relayCx = RELAY.x + RELAY.w / 2;
  const relayCy = RELAY.y + RELAY.h / 2;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the self-hosted relay */}
          {relayU > 0 && (
            <g opacity={relayU}>
              <rect x={RELAY.x} y={RELAY.y} width={RELAY.w} height={RELAY.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
              <text x={relayCx} y={RELAY.y + 38} textAnchor="middle" fill={colors.ACCENT} fontSize={16} fontWeight={600}>your relay</text>
              <text x={relayCx} y={RELAY.y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">one signed record</text>
              {ownU > 0 && (
                <text x={relayCx} y={RELAY.y + 84} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} opacity={ownU} fontFamily="monospace">self-hosted 🏠</text>
              )}
            </g>
          )}

          {/* equal members around it, events flowing to the relay */}
          {MEMBERS.map((m, i) => {
            const u = clamp01(membersU * MEMBERS.length - i);
            if (u <= 0) return null;
            const phase = clamp01(((flowU % MEMBERS.length) - i + MEMBERS.length) % MEMBERS.length);
            const isAgent = m.name === 'goose' || m.name === 'codex';
            return (
              <g key={m.name} opacity={u}>
                <line x1={m.x} y1={m.y} x2={relayCx} y2={relayCy} stroke={colors.GRID} strokeWidth={1} opacity={0.4} />
                <circle cx={m.x} cy={m.y} r={18} fill="none" stroke={m.color} strokeWidth={2} />
                <circle cx={m.x} cy={m.y} r={6} fill={m.color} />
                <text x={m.x} y={m.y + 36} textAnchor="middle" fill={m.color} fontSize={13}>{m.name}</text>
                <text x={m.x} y={m.y + 52} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace">{isAgent ? 'agent' : 'person'}</text>
                {/* a signed event travelling in */}
                <TokenFlight from={{ x: m.x, y: m.y }} to={{ x: relayCx, y: relayCy }} u={phase} text="●" fill={m.color} fontSize={12} lift={26} fadeOut />
              </g>
            );
          })}

          {/* principles */}
          {princU > 0 && (
            <g opacity={princU} transform="translate(0, 470)">
              {PRINCIPLES.map((p, i) => {
                const u = clamp01(princU * PRINCIPLES.length - i);
                if (u <= 0) return null;
                return (
                  <g key={p.k} opacity={u}>
                    <text x={150} y={i * 26} fill={colors.ACCENT} fontSize={13} fontWeight={600} fontFamily="monospace">{p.k}</text>
                    <text x={330} y={i * 26} fill={colors.TEXT} fontSize={13}>{p.v}</text>
                  </g>
                );
              })}
            </g>
          )}

          {/* today / coming status */}
          {statusU > 0 && (
            <g opacity={statusU}>
              <text x={150} y={556} fill={colors.POSITIVE} fontSize={12} fontWeight={600}>works today</text>
              <text x={150} y={576} fill={colors.MUTED} fontSize={11} fontFamily="monospace">{TODAY.join(' · ')}</text>
              <text x={150} y={602} fill={colors.WARM} fontSize={12} fontWeight={600}>coming</text>
              <text x={150} y={622} fill={colors.MUTED} fontSize={11} fontFamily="monospace">{COMING.join(' · ')}</text>
            </g>
          )}

          {/* federation hint */}
          {fedU > 0 && (
            <g opacity={fedU}>
              <circle cx={relayCx + 210} cy={relayCy} r={16} fill="none" stroke={colors.SECONDARY} strokeDasharray="4 4" strokeWidth={1.6} />
              <circle cx={relayCx + 260} cy={relayCy - 40} r={14} fill="none" stroke={colors.SECONDARY} strokeDasharray="4 4" strokeWidth={1.4} opacity={0.7} />
              <line x1={RELAY.x + RELAY.w} y1={relayCy} x2={relayCx + 194} y2={relayCy} stroke={colors.SECONDARY} strokeDasharray="3 5" strokeWidth={1.4} />
              <text x={relayCx + 232} y={relayCy + 44} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily="monospace">federation → coming</text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={225} width={880} height={210} rx={14} fill={colors.PANEL} opacity={0.97} stroke={colors.ACCENT} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>Truly social AI</text>
          <text x={640} y={328} textAnchor="middle" fill={colors.MUTED} fontSize={16}>people and agents as equal members of one network, doing work together</text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={15}>on a signed record you host yourself and no one can quietly rewrite</text>
          <text x={640} y={398} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">self-sovereign · Apache 2.0 · nostr · buzz.xyz · github.com/block/buzz</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
