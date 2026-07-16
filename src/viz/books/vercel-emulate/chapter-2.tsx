// Seeding the Cast
//
// Grounding: emulate.config.example.yaml (github.users octocat/developer,
// oauth_apps with emu_github_client_id + redirect_uris, top-level tokens →
// login + scopes), packages/emulate/src/__tests__/api.test.ts
// (createEmulator({service:'github', port, seed}), reset() wipes and
// re-seeds; POST /user/repos creates state), @emulators/core middleware
// auth.ts (TokenMap: token → {login, id, scopes}).
//
// Centerpiece: the seed file as a stage-crew manifest. YAML lines light up
// and MATERIALIZE as store objects — user cards, the registered client, the
// token→identity table. A test scribbles a repo into the world; reset()
// sweeps the stage and the identical cast walks back on.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
/** Per-item window over one 0..1 driver channel (the stagger trick). */
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

// ---------------------------------------------------------------------------
// Layout — the seed file on the left, the emulator's store on the right.
// ---------------------------------------------------------------------------

const YAML = { x: 56, y: 84, w: 372, h: 424 } as const;
const YAML_LINES: { text: string; indent: number; tag?: 'user1' | 'user2' | 'app' | 'token' }[] = [
  { text: 'tokens:', indent: 0, tag: 'token' },
  { text: 'gho_test_token_admin:', indent: 1, tag: 'token' },
  { text: 'login: admin', indent: 2, tag: 'token' },
  { text: 'scopes: [repo, user, admin:org]', indent: 2, tag: 'token' },
  { text: '', indent: 0 },
  { text: 'github:', indent: 0 },
  { text: 'users:', indent: 1 },
  { text: '- login: octocat', indent: 2, tag: 'user1' },
  { text: 'name: The Octocat', indent: 3, tag: 'user1' },
  { text: 'email: octocat@github.com', indent: 3, tag: 'user1' },
  { text: '- login: developer', indent: 2, tag: 'user2' },
  { text: 'name: Developer', indent: 3, tag: 'user2' },
  { text: 'oauth_apps:', indent: 1 },
  { text: '- client_id: emu_github_client_id', indent: 2, tag: 'app' },
  { text: 'client_secret: emu_github_…', indent: 2, tag: 'app' },
  { text: 'redirect_uris:', indent: 2, tag: 'app' },
  { text: '- …/api/auth/callback/github', indent: 3, tag: 'app' },
];
const LINE_H = 22;
const lineY = (i: number): number => YAML.y + 56 + i * LINE_H;

const STORE = { x: 486, y: 70, w: 736, h: 528 } as const;
const USER_CARDS = [
  { x: 540, y: 128, w: 208, h: 84, login: 'octocat', name: 'The Octocat', email: 'octocat@github.com' },
  { x: 772, y: 128, w: 208, h: 84, login: 'developer', name: 'Developer', email: 'dev@example.com' },
] as const;
const APP_CARD = { x: 540, y: 262, w: 440, h: 92 } as const;
const TOKENS = { x: 540, y: 404, w: 640, h: 106 } as const;
const SCRIBBLE = { x: 1016, y: 132, w: 176, h: 72 } as const;
const CODE = { x: 56, y: 528, w: 372, h: 72 } as const;

// flight sources (yaml line anchors) per materialized group
const SRC_USER1 = { x: YAML.x + YAML.w - 14, y: lineY(7) - 5 };
const SRC_USER2 = { x: YAML.x + YAML.w - 14, y: lineY(10) - 5 };
const SRC_APP = { x: YAML.x + YAML.w - 14, y: lineY(13) - 5 };
const SRC_TOKEN = { x: YAML.x + YAML.w - 14, y: lineY(1) - 5 };

const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_YAML: CameraState = { x: 340, y: 300, k: 1.22 };
const CAM_USERS: CameraState = { x: 730, y: 220, k: 1.2 };
const CAM_TOKENS: CameraState = { x: 830, y: 420, k: 1.22 };

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Timeline (~72s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_YAML, cameraInterp);

  const yamlU = tl.channel('yamlU', 0); // the seed file draws on
  const hlU = tl.channel('hlU', 0); // 1=users, 2=app, 3=tokens (line highlight)
  const usersU = tl.channel('usersU', 0); // two user cards fly + pop
  const appU = tl.channel('appU', 0); // the registered client card
  const tokenU = tl.channel('tokenU', 0); // token table rows
  const codeU = tl.channel('codeU', 0); // the createEmulator chip
  const scribbleU = tl.channel('scribbleU', 0); // the my-repo card a test adds
  const wipeU = tl.channel('wipeU', 0); // reset(): sweep across the store
  const rebornU = tl.channel('rebornU', 0); // the cast re-materializes
  const dimU = tl.channel('dimU', 0); // quiet stage for the closer
  const teaseU = tl.channel('teaseU', 0); // closing card

  // — beat 1 · somebody has to exist —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'Before anyone can sign in, somebody has to exist. A real provider has a database of accounts. The emulator has a file — a seed you write by hand.',
  });
  tl.tween(yamlU, 1, { at: 0.7, dur: 1.5, ease: ease.draw });
  tl.hold(7.1, 0.5);

  // — beat 2 · users declared into existence —
  tl.caption({
    at: 7.6,
    dur: 6.8,
    text: 'The seed is the cast list. A few lines declare users into existence — octocat, a developer. No sign-up flow, no verification email, no waiting.',
  });
  tl.tween(cam, CAM_WIDE, { at: 7.8, dur: 1.3, ease: ease.move });
  tl.set(hlU, 1, 8.0);
  tl.tween(usersU, 1, { at: 9.2, dur: 2.6, ease: ease.move });
  tl.hold(14.4, 0.5);

  // — beat 3 · full users in an in-memory store —
  tl.caption({
    at: 14.9,
    dur: 6.0,
    text: 'Each entry becomes a full user in an in-memory store, with the login, the name, and the email your assertions can rely on, run after run.',
  });
  tl.tween(cam, CAM_USERS, { at: 15.1, dur: 1.2, ease: ease.move });
  tl.hold(20.9, 0.5);

  // — beat 4 · the registered client —
  tl.caption({
    at: 21.4,
    dur: 7.0,
    text: 'The same file registers your app as a client: an id, a secret, and the exact callback address the emulator will be allowed to send the browser back to.',
  });
  tl.tween(cam, CAM_WIDE, { at: 21.6, dur: 1.2, ease: ease.move });
  tl.set(hlU, 2, 21.8);
  tl.tween(appU, 1, { at: 23.0, dur: 2.2, ease: ease.move });
  tl.hold(28.4, 0.5);

  // — beat 5 · pre-baked tokens —
  tl.caption({
    at: 28.9,
    dur: 7.2,
    text: 'You can even pre-bake access tokens. Each one maps a secret string straight to a user and a list of scopes — for tests that skip the browser and call endpoints directly.',
  });
  tl.tween(cam, CAM_TOKENS, { at: 29.1, dur: 1.3, ease: ease.move });
  tl.set(hlU, 3, 29.3);
  tl.tween(tokenU, 1, { at: 30.5, dur: 2.4, ease: ease.move });
  tl.hold(36.1, 0.5);

  // — beat 6 · one call boots the world —
  tl.caption({
    at: 36.6,
    dur: 6.6,
    text: 'In test code, one call boots this entire world: pick the service, pick a port, hand over the seed. It is up and listening within milliseconds.',
  });
  tl.tween(cam, CAM_WIDE, { at: 36.8, dur: 1.3, ease: ease.move });
  tl.set(hlU, 0, 37.0);
  tl.tween(codeU, 1, { at: 38.0, dur: 0.8, ease: ease.enter });
  tl.hold(43.2, 0.6);

  // — beat 7 · tests scribble on the world —
  tl.caption({
    at: 43.8,
    dur: 6.6,
    text: 'Then the test scribbles on the world — this one creates a repository. State accumulates, and accumulated state is exactly where flaky tests come from.',
  });
  tl.tween(scribbleU, 1, { at: 45.0, dur: 0.7, ease: ease.pop });
  tl.hold(50.4, 0.5);

  // — beat 8 · reset: wipe and re-seed —
  tl.caption({
    at: 50.9,
    dur: 6.8,
    text: 'So between tests you call reset. The store is wiped and re-seeded from the same file: the scribbles vanish, and the cast walks back on stage.',
  });
  tl.tween(wipeU, 1, { at: 52.2, dur: 1.4, ease: ease.move });
  tl.tween(rebornU, 1, { at: 54.0, dur: 2.6, ease: ease.move });
  tl.hold(57.7, 0.6);

  // — beat 9 · the identical known world —
  tl.caption({
    at: 58.3,
    dur: 5.8,
    text: 'Every test opens on the identical, known world. That determinism is the quiet superpower of emulating the provider instead of mocking it.',
  });
  tl.hold(64.1, 0.5);

  // — beat 10 · tease the picker —
  tl.caption({
    at: 64.6,
    dur: 6.2,
    text: 'The cast is ready. Next up is the page where a test picks one of these users — the page that replaces the password.',
  });
  tl.tween(dimU, 1, { at: 64.8, dur: 1.1, ease: ease.move });
  tl.tween(teaseU, 1, { at: 66.2, dur: 0.7, ease: ease.pop });
  tl.hold(70.8, 1.4);

  return { tl, cam, yamlU, hlU, usersU, appU, tokenU, codeU, scribbleU, wipeU, rebornU, dimU, teaseU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const HL_TAG: Record<number, string> = { 1: 'user', 2: 'app', 3: 'token' };

/** materialize + survive-the-wipe + reborn opacity for one seeded object */
function aliveOp(matU: number, wipeU: number, rebornWin: number): number {
  return Math.max(matU * (1 - wipeU), rebornWin);
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const yamlU = s.get(scene.yamlU);
  const hlU = s.get(scene.hlU);
  const usersU = s.get(scene.usersU);
  const appU = s.get(scene.appU);
  const tokenU = s.get(scene.tokenU);
  const codeU = s.get(scene.codeU);
  const scribbleU = s.get(scene.scribbleU);
  const wipeU = s.get(scene.wipeU);
  const rebornU = s.get(scene.rebornU);
  const dimU = s.get(scene.dimU);
  const teaseU = s.get(scene.teaseU);

  const floorOp = 1 - 0.87 * dimU;
  const hlTag = HL_TAG[Math.round(hlU)];
  const sweepX = STORE.x + STORE.w * wipeU;

  // per-object reborn windows (users, app, tokens re-enter in order)
  const reb = [win(rebornU, 4, 0, 1.6), win(rebornU, 4, 1, 1.6), win(rebornU, 4, 2, 1.6), win(rebornU, 4, 3, 1.6)];

  // flight positions: 0..0.55 of each group's own u = travel, then card pops
  const flights = [
    { u: win(usersU, 2, 0, 1.4), src: SRC_USER1, dst: { x: USER_CARDS[0].x + 30, y: USER_CARDS[0].y + 40 } },
    { u: win(usersU, 2, 1, 1.4), src: SRC_USER2, dst: { x: USER_CARDS[1].x + 30, y: USER_CARDS[1].y + 40 } },
    { u: appU, src: SRC_APP, dst: { x: APP_CARD.x + 30, y: APP_CARD.y + 46 } },
    { u: tokenU, src: SRC_TOKEN, dst: { x: TOKENS.x + 30, y: TOKENS.y + 50 } },
  ];

  const cardPop = (u: number): number => clamp01((u - 0.55) / 0.45);
  const userOps = [aliveOp(cardPop(flights[0].u), wipeU, reb[0]), aliveOp(cardPop(flights[1].u), wipeU, reb[1])];
  const appOp = aliveOp(cardPop(appU), wipeU, reb[2]);
  const tokenOp = aliveOp(cardPop(tokenU), wipeU, reb[3]);
  const scribbleOp = scribbleU * (1 - wipeU); // never reborn — that's the point

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the seed file */}
        <g opacity={yamlU * floorOp}>
          <rect x={YAML.x} y={YAML.y} width={YAML.w} height={YAML.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={YAML.x + 20} y={YAML.y + 30} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
            emulate.config.yaml
          </text>
          {YAML_LINES.map((l, i) => {
            const hot = hlTag && l.tag?.startsWith(hlTag);
            return (
              <text
                key={i}
                x={YAML.x + 22 + l.indent * 16}
                y={lineY(i)}
                fill={hot ? colors.ACCENT : l.tag ? colors.TEXT : colors.MUTED}
                fontSize={13}
                fontFamily={MONO}
                opacity={yamlU * (hot ? 1 : 0.82)}
              >
                {l.text}
              </text>
            );
          })}
        </g>

        {/* the emulator's in-memory store */}
        <Zone
          x={STORE.x}
          y={STORE.y}
          w={STORE.w}
          h={STORE.h}
          label="emulator store — in memory"
          kind="group"
          u={yamlU}
          color={colors.GRID}
          dim={0.87 * dimU}
        />

        <g opacity={floorOp}>
          {/* shelf: users */}
          <text x={540} y={116} fill={colors.MUTED} fontSize={12.5} opacity={Math.max(cardPop(usersU), reb[0])}>
            users
          </text>
          {USER_CARDS.map((u, i) => (
            <g key={u.login} opacity={userOps[i]}>
              <rect x={u.x} y={u.y} width={u.w} height={u.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
              <circle cx={u.x + 30} cy={u.y + 40} r={16} fill={colors.BG} stroke={colors.ACCENT} />
              <text x={u.x + 30} y={u.y + 46} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontWeight={700}>
                {u.login[0].toUpperCase()}
              </text>
              <text x={u.x + 56} y={u.y + 32} fill={colors.TEXT} fontSize={14.5} fontFamily={MONO}>
                {u.login}
              </text>
              <text x={u.x + 56} y={u.y + 52} fill={colors.MUTED} fontSize={12}>
                {u.name}
              </text>
              <text x={u.x + 56} y={u.y + 70} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                {u.email}
              </text>
            </g>
          ))}

          {/* shelf: the registered client */}
          <text x={540} y={252} fill={colors.MUTED} fontSize={12.5} opacity={Math.max(appOp, 0)}>
            oauth apps
          </text>
          <g opacity={appOp}>
            <rect x={APP_CARD.x} y={APP_CARD.y} width={APP_CARD.w} height={APP_CARD.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
            <text x={APP_CARD.x + 20} y={APP_CARD.y + 30} fill={colors.TEXT} fontSize={14.5} fontWeight={600}>
              Code App
            </text>
            <text x={APP_CARD.x + 20} y={APP_CARD.y + 54} fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO}>
              client_id: emu_github_client_id
            </text>
            <text x={APP_CARD.x + 20} y={APP_CARD.y + 74} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              redirect: …/api/auth/callback/github
            </text>
          </g>

          {/* shelf: the token → identity table */}
          <text x={540} y={394} fill={colors.MUTED} fontSize={12.5} opacity={Math.max(tokenOp, 0)}>
            token map — token → identity
          </text>
          <g opacity={tokenOp}>
            <rect x={TOKENS.x} y={TOKENS.y} width={TOKENS.w} height={TOKENS.h} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
            <text x={TOKENS.x + 20} y={TOKENS.y + 32} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
              gho_test_token_admin
            </text>
            <text x={TOKENS.x + 300} y={TOKENS.y + 32} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              → admin · repo, user, admin:org
            </text>
            <text x={TOKENS.x + 20} y={TOKENS.y + 62} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
              gho_test_token_octocat
            </text>
            <text x={TOKENS.x + 300} y={TOKENS.y + 62} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              → octocat · repo, user, workflow
            </text>
            <text x={TOKENS.x + 20} y={TOKENS.y + 90} fill={colors.MUTED} fontSize={11.5}>
              Authorization: Bearer &lt;token&gt; — resolved by the auth middleware
            </text>
          </g>

          {/* the flying seeds */}
          {flights.map((f, i) => {
            if (f.u <= 0 || f.u >= 0.55) return null;
            const t = f.u / 0.55;
            const x = lerp(f.src.x, f.dst.x, t);
            const y = lerp(f.src.y, f.dst.y, t) - 60 * Math.sin(Math.PI * t); // gentle arc
            return <circle key={i} cx={x} cy={y} r={6.5} fill={colors.ACCENT} stroke={colors.BG} strokeWidth={1.2} />;
          })}

          {/* the scribble a test leaves behind */}
          <g opacity={scribbleOp} transform={`rotate(-4 ${SCRIBBLE.x + SCRIBBLE.w / 2} ${SCRIBBLE.y + SCRIBBLE.h / 2})`}>
            <rect x={SCRIBBLE.x} y={SCRIBBLE.y} width={SCRIBBLE.w} height={SCRIBBLE.h} rx={10} fill={colors.BG} stroke={colors.WARM} strokeDasharray="5 4" strokeWidth={1.4} />
            <text x={SCRIBBLE.x + 16} y={SCRIBBLE.y + 30} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
              repo: my-repo
            </text>
            <text x={SCRIBBLE.x + 16} y={SCRIBBLE.y + 52} fill={colors.MUTED} fontSize={11}>
              created mid-test
            </text>
          </g>

          {/* the reset sweep */}
          {wipeU > 0.01 && wipeU < 0.99 && (
            <g>
              <line x1={sweepX} y1={STORE.y + 8} x2={sweepX} y2={STORE.y + STORE.h - 8} stroke={colors.NEGATIVE} strokeWidth={3} opacity={0.9} />
              <rect x={STORE.x} y={STORE.y} width={sweepX - STORE.x} height={STORE.h} fill={colors.BG} opacity={0.45} />
            </g>
          )}
          {(wipeU > 0.15 || rebornU > 0) && (
            <text x={STORE.x + STORE.w - 20} y={STORE.y + 30} textAnchor="end" fill={rebornU > 0.9 ? colors.POSITIVE : colors.NEGATIVE} fontSize={13.5} fontFamily={MONO} opacity={Math.max(wipeU, clamp01(rebornU * 2)) * floorOp}>
              {rebornU > 0.9 ? 'reset() → re-seeded' : 'reset()'}
            </text>
          )}
        </g>

        {/* the boot chip */}
        <g opacity={codeU * floorOp}>
          <rect x={CODE.x} y={CODE.y} width={CODE.w} height={CODE.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
          <text x={CODE.x + 18} y={CODE.y + 30} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
            {"await createEmulator({ service:"}
          </text>
          <text x={CODE.x + 18} y={CODE.y + 52} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
            {"  'github', port, seed })"}
          </text>
        </g>

        {/* closing card */}
        <g opacity={teaseU}>
          <rect x={370} y={240} width={540} height={150} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={640} y={305} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            A cast, but no password
          </text>
          <text x={640} y={345} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            next: the page that replaces the login form
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
