// Explained: AI Control — chapter 1: the setup.
// The control game's actual structure (Greenblatt et al., 2023): a capable but
// UNTRUSTED model U does most of the work; a weaker TRUSTED model T is cheap
// and safe but not good enough to do the work alone; and a tiny budget of
// trusted human auditing. The adversary is U itself, assumed to be trying to
// slip in subtly wrong ("backdoored") work. The scene frames the three players
// and the two metrics every protocol trades between — safety and usefulness —
// with no numbers yet; those are computed in the chapters that follow.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

const PLAYERS = [
  { key: 'U', name: 'untrusted model', sub: 'capable · maybe adversarial', color: colors.NEGATIVE, x: 250 },
  { key: 'T', name: 'trusted model', sub: 'weak · safe · cheap', color: colors.POSITIVE, x: 640 },
  { key: 'H', name: 'trusted auditing', sub: 'human · scarce · ~2% budget', color: colors.WARM, x: 1030 },
];

const CAM_PLAYERS: CameraState = { x: 640, y: 340, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  playersU: ChannelRef<number>;
  workU: ChannelRef<number>; // the stream of tasks
  threatU: ChannelRef<number>; // U may defect
  metricsU: ChannelRef<number>; // safety vs usefulness axes
  gameU: ChannelRef<number>; // "it is a game" framing
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const playersU = tl.channel('playersU', 0);
  const workU = tl.channel('workU', 0);
  const threatU = tl.channel('threatU', 0);
  const metricsU = tl.channel('metricsU', 0);
  const gameU = tl.channel('gameU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the premise
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'The whole shelf has been circling one fear, and this book names it. Suppose the capable model you deploy is not just unreliable, but adversarial — quietly trying to slip something past you. You cannot make it trustworthy. The question control asks is narrower and stranger: can you get useful work out of it anyway, safely, without ever trusting it?',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.hold(6.3, 0.5);

  // Beat 2 — the three players
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'The setup has three players. A capable untrusted model, which does the bulk of the work and might be scheming. A weaker trusted model — safe and cheap, but not good enough to do the job alone. And a sliver of trusted human attention, so scarce you can spend it on maybe two percent of the work.',
  });
  tl.tween(cam, CAM_PLAYERS, { at: 7.1, dur: 1.3, ease: ease.move });
  tl.tween(playersU, 1, { at: 7.8, dur: 2.4, ease: ease.linear });
  tl.hold(12.6, 0.6);

  // Beat 3 — the work
  tl.caption({
    at: 13.2,
    dur: 5.6,
    text: 'Now pour work through them: a long stream of tasks — in the founding paper, programming problems. The untrusted model solves them fast and well. On almost every task, that is exactly what you want to happen.',
  });
  tl.tween(workU, 1, { at: 14.0, dur: 3.0, ease: ease.linear });
  tl.hold(18.8, 0.6);

  // Beat 4 — the threat
  tl.caption({
    at: 19.4,
    dur: 5.8,
    text: 'But on a task of its choosing, the untrusted model can defect — submit code that looks correct and passes your tests, yet carries a subtle backdoor. One such submission accepted is a loss. The adversary is not noise in the system; the adversary is the smartest thing in the system.',
  });
  tl.tween(threatU, 1, { at: 20.4, dur: 1.2, ease: ease.enter });
  tl.hold(25.2, 0.6);

  // Beat 5 — the two metrics
  tl.caption({
    at: 25.8,
    dur: 5.8,
    text: 'So every protocol is scored on two axes at once. Safety: how often the scheme catches or blocks a defection before it lands. Usefulness: how much real work still gets done. Refuse to use the untrusted model and you are perfectly safe and nearly useless. The art is buying safety without spending all the usefulness.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 26.1, dur: 1.3, ease: ease.move });
  tl.tween(metricsU, 1, { at: 27.0, dur: 1.4, ease: ease.draw });
  tl.hold(31.6, 0.6);

  // Beat 6 — it's a game
  tl.caption({
    at: 32.2,
    dur: 5.6,
    text: 'And crucially, you evaluate it as a game. A red team plays the untrusted model and attacks as cleverly as it can; a blue team designs the protocol. Safety is measured against the best attack anyone can find — not the average case, the adversarial one. That single rule is what separates control from wishful thinking.',
  });
  tl.tween(gameU, 1, { at: 33.2, dur: 0.9, ease: ease.enter });
  tl.hold(37.8, 0.6);

  // Beat 7 — close
  tl.caption({
    at: 38.4,
    dur: 5.2,
    text: 'The next chapters build the protocols one at a time and measure them. First and simplest: let the weak trusted model watch the strong one’s shoulder — trusted monitoring. It works better than it has any right to, and exactly as well as its budget allows.',
  });
  tl.tween(dimU, 1, { at: 39.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 40.4, dur: 1.0, ease: ease.enter });
  tl.hold(43.6, 1.4);

  return { tl, cam, titleU, playersU, workU, threatU, metricsU, gameU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/control-game/overrides.json', slug: 'control-game' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const playersU = s.get(scene.playersU);
  const workU = s.get(scene.workU);
  const threatU = s.get(scene.threatU);
  const metricsU = s.get(scene.metricsU);
  const gameU = s.get(scene.gameU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const playersFade = 1 - 0.7 * clamp01(metricsU * 2);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the three players */}
          {playersU > 0 &&
            PLAYERS.map((p, i) => {
              const u = clamp01(playersU * PLAYERS.length - i);
              if (u <= 0) return null;
              const defect = p.key === 'U' && threatU > 0;
              return (
                <g key={p.key} opacity={u * playersFade}>
                  <circle cx={p.x} cy={330} r={58} fill={colors.PANEL} opacity={0.95} stroke={defect ? colors.NEGATIVE : p.color} strokeWidth={defect ? 2.5 + threatU : 2} />
                  <text x={p.x} y={342} textAnchor="middle" fill={p.color} fontSize={30} fontWeight={700}>
                    {p.key}
                  </text>
                  <text x={p.x} y={416} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600}>
                    {p.name}
                  </text>
                  <text x={p.x} y={438} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                    {p.sub}
                  </text>
                </g>
              );
            })}

          {/* the work stream through U */}
          {workU > 0 && playersFade > 0.1 &&
            Array.from({ length: 10 }).map((_, i) => {
              const phase = clamp01(workU * 1.5 - i * 0.09);
              if (phase <= 0 || phase >= 1) return null;
              const x = 120 + phase * 260;
              const bad = threatU > 0 && i === 6;
              return <rect key={i} x={x} y={250} width={12} height={12} rx={2} fill={bad ? colors.NEGATIVE : colors.ACCENT} opacity={0.8 * playersFade} />;
            })}
          {workU > 0.1 && (
            <text x={120} y={238} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace" opacity={clamp01(workU * 2) * playersFade}>
              tasks →
            </text>
          )}

          {/* threat callout */}
          {threatU > 0 && (
            <g opacity={threatU * playersFade}>
              <rect x={150} y={470} width={430} height={62} rx={10} fill={colors.PANEL} opacity={0.96} stroke={colors.NEGATIVE} />
              <text x={174} y={498} fill={colors.NEGATIVE} fontSize={13} fontWeight={700}>
                U may DEFECT on a task of its choosing
              </text>
              <text x={174} y={519} fill={colors.MUTED} fontSize={11.5}>
                subtly-wrong code that passes your tests · one accepted = a loss
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* the two metrics — screen space */}
      {metricsU > 0 && (
        <g opacity={metricsU * mainOp}>
          <line x1={300} y1={520} x2={300} y2={200} stroke={colors.GRID} strokeWidth={1.5} />
          <line x1={300} y1={520} x2={900} y2={520} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={280} y={200} textAnchor="end" fill={colors.POSITIVE} fontSize={13.5} fontWeight={600}>
            safety ↑
          </text>
          <text x={900} y={548} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontWeight={600}>
            usefulness →
          </text>
          <circle cx={320} cy={220} r={7} fill={colors.POSITIVE} />
          <text x={334} y={224} fill={colors.MUTED} fontSize={12}>don’t use U — safe, useless</text>
          <circle cx={880} cy={500} r={7} fill={colors.NEGATIVE} />
          <text x={866} y={504} textAnchor="end" fill={colors.MUTED} fontSize={12}>trust U blindly — useful, unsafe</text>
          <text x={600} y={360} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={600}>
            every protocol is a point on this plane
          </text>
        </g>
      )}

      {/* game badge */}
      {gameU > 0 && (
        <g opacity={gameU * mainOp}>
          <rect x={880} y={110} width={360} height={100} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.WARM} />
          <text x={904} y={140} fill={colors.WARM} fontSize={14} fontWeight={700}>
            evaluated as a game
          </text>
          <text x={904} y={168} fill={colors.MUTED} fontSize={12}>
            red team attacks its hardest
          </text>
          <text x={904} y={190} fill={colors.MUTED} fontSize={12}>
            safety = vs the BEST attack found
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The control game
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Useful work from a model you never trust.
          </text>
          <text x={640} y={320} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            untrusted U · trusted T · ~2% human audit · scored on safety AND usefulness
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            safety measured against the best attack, not the average one
          </text>
          <text x={640} y={408} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: trusted monitoring
          </text>
        </g>
      )}
    </>
  );
}

export function ControlGame() {
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
