// Book scene — replay-qa, chapter 2: "Plug In Your Agent".
// One stage, 6 beats: the plugins registry drops a replay-qa skill into your
// repo (beat 0), its scripts all funnel through one helper — apiRequest() in
// replay-qa-lib.js (beat 1), getAuthToken() walks a waterfall of env vars
// down to auth.json (beat 2), ensureProject() resolves + persists the project
// id (beat 3), the Bearer-authenticated round trip hits qa.replay.io (beat 4),
// and the closer lights the whole thin bridge: skill → script → lib → API.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, NodeBadge, Packet, RequestFlow, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const REGISTRY = { x: 175, y: 105 };
const BUNDLES = [
  { x: 380, y: 88, label: 'claude-code', hot: true },
  { x: 510, y: 88, label: 'codex', hot: false },
  { x: 380, y: 124, label: 'cursor', hot: false },
  { x: 510, y: 124, label: 'opencode', hot: false },
];
const ZONE = { x: 70, y: 205, w: 470, h: 335 };
const AGENT = { x: 180, y: 300 };
const SKILL = { x: 410, y: 292 };
const SCRIPTS = [
  { x: 200, y: 435, label: 'full-qa.js' },
  { x: 400, y: 498, label: 'mark-bug.js' },
];
const LIB = { x: 700, y: 470 };
const API = { x: 1120, y: 470 };
const TOKEN = { x: 640, y: 62, w: 560, h: 200 };
const TOKEN_ROWS = [
  { label: 'process.env.REPLAY_QA_API_KEY', hit: false },
  { label: 'REPLAY_API_KEY / REPLAY_ACCESS_TOKEN', hit: false },
  { label: '~/.replay/profile/auth.json', hit: true },
];
const CONFIG = { x: 700, y: 330 };

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const regU = tl.channel('regU', 0);
  const bundleU = tl.channel('bundleU', 0);
  const zoneU = tl.channel('zoneU', 0);
  const agentEnterU = tl.channel('agentEnterU', 0);
  const installU = tl.channel('installU', 0);
  const skillU = tl.channel('skillU', 0);
  const scriptU = SCRIPTS.map((_, i) => tl.channel(`script${i}U`, 0));

  const agentConnU = tl.channel('agentConnU', 0);
  const libU = tl.channel('libU', 0);
  const libConnU = tl.channel('libConnU', 0);
  const libFlow = tl.channel('libFlow', 0);

  const tokenPanelU = tl.channel('tokenPanelU', 0);
  const rowU = TOKEN_ROWS.map((_, i) => tl.channel(`row${i}U`, 0));
  const tokenPop = tl.channel('tokenPop', 0);
  const tokenPktU = tl.channel('tokenPktU', 0);

  const configU = tl.channel('configU', 0);
  const resolveU = tl.channel('resolveU', 0);
  const writeBackU = tl.channel('writeBackU', 0);

  const apiU = tl.channel('apiU', 0);
  const callU = tl.channel('callU', 0);
  const bearerU = tl.channel('bearerU', 0);

  const dimU = tl.channel('dimU', 0);
  const chainFlow = tl.channel('chainFlow', 0);
  const chainChipU = tl.channel('chainChipU', 0);

  // BEAT 0 — install: the registry drops a replay-qa skill into your repo
  tl.caption({ at: 0.4, dur: 4.5, text: 'npx shadcn add replayio/plugins/claude-code — a skill lands in your repo.' });
  tl.tween(regU, 1, { at: 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(bundleU, 1, { at: 1.2, dur: 1.2, ease: ease.linear });
  tl.tween(zoneU, 1, { at: 1.6, dur: 1.1, ease: ease.draw });
  tl.tween(agentEnterU, 1, { at: 2.4, dur: 0.6, ease: ease.enter });
  tl.tween(installU, 1, { at: 3.4, dur: 1.5, ease: ease.linear });
  tl.tween(skillU, 1, { at: 4.9, dur: 0.6, ease: ease.pop });
  SCRIPTS.forEach((_, i) => tl.tween(scriptU[i], 1, { at: 5.7 + i * 0.25, dur: 0.6, ease: ease.enter }));
  tl.hold(8.2, 1.0);

  // BEAT 1 — scripts, not raw endpoints: everything through apiRequest()
  tl.caption({ at: 9.2, dur: 4.5, text: 'full-qa.js and mark-bug.js all funnel through one helper: apiRequest().' });
  tl.tween(agentConnU, 1, { at: 9.6, dur: 1.0, ease: ease.draw });
  tl.tween(libU, 1, { at: 10.8, dur: 0.6, ease: ease.enter });
  tl.tween(libConnU, 1, { at: 11.6, dur: 1.2, ease: ease.draw });
  tl.tween(libFlow, 3, { at: 12.8, dur: 4.5, ease: ease.linear });
  tl.hold(17.3, 0.8);

  // BEAT 2 — the token waterfall: env vars first, then auth.json
  tl.caption({ at: 18.2, dur: 4.5, text: 'getAuthToken(): env vars first, then auth.json — tokens start with lqa_.' });
  tl.tween(tokenPanelU, 1, { at: 18.6, dur: 0.7, ease: ease.enter });
  TOKEN_ROWS.forEach((_, i) => tl.tween(rowU[i], 1, { at: 19.6 + i * 1.3, dur: 0.8, ease: ease.move }));
  tl.tween(tokenPop, 1, { at: 23.7, dur: 0.5, ease: ease.pop });
  tl.tween(tokenPktU, 1, { at: 24.5, dur: 1.2, ease: ease.linear });
  tl.hold(26.2, 0.8);

  // BEAT 3 — ensureProject(): arg → env → config.json, persisted back
  tl.caption({ at: 27.2, dur: 4.5, text: 'ensureProject() resolves the id — argument, env, or .replay/config.json.' });
  tl.tween(configU, 1, { at: 27.6, dur: 0.6, ease: ease.enter });
  tl.tween(resolveU, 1, { at: 28.6, dur: 1.0, ease: ease.draw });
  tl.tween(writeBackU, 1, { at: 30.4, dur: 1.2, ease: ease.draw });
  tl.hold(35.2, 0.8);

  // BEAT 4 — the call: Bearer-authenticated HTTPS, parsed JSON back
  tl.caption({ at: 36.2, dur: 4.5, text: 'Bearer-authed HTTPS to qa.replay.io/api/v1 — parsed JSON back to the agent.' });
  tl.tween(apiU, 1, { at: 36.5, dur: 0.6, ease: ease.enter });
  tl.tween(bearerU, 1, { at: 37.3, dur: 0.5, ease: ease.pop });
  tl.tween(callU, 1, { at: 38.0, dur: 4.0, ease: ease.linear });
  tl.hold(44.2, 0.8);

  // BEAT 5 — the whole thin bridge, lit end to end
  tl.caption({ at: 45.2, dur: 5.0, text: 'The bridge: skill → script → replay-qa-lib.js → API — credentials automatic.' });
  tl.tween(dimU, 1, { at: 45.6, dur: 1.0, ease: ease.move });
  tl.tween(chainFlow, 4, { at: 46.6, dur: 7.0, ease: ease.linear });
  tl.tween(chainChipU, 1, { at: 47.6, dur: 0.6, ease: ease.enter });
  tl.hold(53.6, 1.2);

  return {
    tl,
    regU, bundleU, zoneU, agentEnterU, installU, skillU, scriptU,
    agentConnU, libU, libConnU, libFlow,
    tokenPanelU, rowU, tokenPop, tokenPktU,
    configU, resolveU, writeBackU,
    apiU, callU, bearerU,
    dimU, chainFlow, chainChipU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

function Chip({ x, y, text, u, color, filled = false }: { x: number; y: number; text: string; u: number; color: string; filled?: boolean }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * 6.9 + 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill={filled ? color : colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={filled ? colors.BG : color} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** getAuthToken()'s lookup order — probe each source until one hits. */
function TokenWaterfall({ panelU, rows, pop, dim }: { panelU: number; rows: number[]; pop: number; dim: number }) {
  const e = clamp01(panelU);
  if (e <= 0) return null;
  const { x, y, w, h } = TOKEN;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.75 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={20} y={30} fill={colors.MUTED} fontSize={13} fontFamily={mono}>
        getAuthToken() — first match wins
      </text>
      {TOKEN_ROWS.map((row, i) => {
        const u = clamp01(rows[i]);
        const ry = 52 + i * 40;
        const verdict = u > 0.55;
        const vColor = row.hit ? colors.POSITIVE : colors.NEGATIVE;
        return (
          <g key={i} opacity={0.35 + 0.65 * u}>
            <rect x={16} y={ry} width={w - 32} height={32} rx={8} fill={colors.BG} stroke={verdict && row.hit ? colors.POSITIVE : colors.GRID} strokeWidth={1.4} />
            <text x={30} y={ry + 21} fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>
              {row.label}
            </text>
            {verdict && (
              <text x={w - 30} y={ry + 21} textAnchor="end" fill={vColor} fontSize={13} fontWeight={700} fontFamily={mono}>
                {row.hit ? '✓ found' : '✗ unset'}
              </text>
            )}
          </g>
        );
      })}
      <Chip x={w / 2} y={h - 14} text="token: lqa_ ················" u={pop} color={colors.POSITIVE} />
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const bundleU = s.get(scene.bundleU);
  const chainFlow = s.get(scene.chainFlow);
  const lit = dim > 0.01 ? 1 : 0; // the closer re-lights the chain over the dim

  return (
    <>
      {/* the plugins registry and its per-agent bundles */}
      <ServiceNode {...REGISTRY} w={210} kind="external" label="replayio/plugins" sublabel="agent bundles" u={s.get(scene.regU)} dim={dim} />
      {BUNDLES.map((b, i) => (
        <Chip
          key={b.label}
          x={b.x}
          y={b.y}
          text={b.label}
          u={clamp01(bundleU * BUNDLES.length - i) * (1 - 0.7 * dim)}
          color={b.hot ? colors.ACCENT : colors.MUTED}
          filled={b.hot}
        />
      ))}

      {/* your repo: the agent, the dropped-in skill, and its scripts */}
      <Zone {...ZONE} label="your repo" kind="group" u={s.get(scene.zoneU)} dim={dim} />
      <ServiceNode {...AGENT} kind="client" label="your agent" sublabel="Claude Code" u={s.get(scene.agentEnterU)} dim={dim} />
      <Packet
        from={{ x: BUNDLES[0].x, y: BUNDLES[0].y + 14 }}
        to={{ x: SKILL.x, y: SKILL.y - 32 }}
        u={s.get(scene.installU)}
        color={colors.ACCENT}
        label="npx shadcn add"
      />
      <NodeBadge {...SKILL} w={210} h={58} label="replay-qa skill" sublabel="SKILL.md + scripts" color={colors.ACCENT} u={s.get(scene.skillU)} dim={dim} />
      <Connection from={{ x: AGENT.x + 62, y: AGENT.y }} to={{ x: SKILL.x - 108, y: SKILL.y }} u={s.get(scene.agentConnU)} label="loads" dim={dim} />
      {SCRIPTS.map((sc, i) => (
        <g key={sc.label}>
          <NodeBadge x={sc.x} y={sc.y} w={150} h={42} label={sc.label} color={colors.SECONDARY} u={s.get(scene.scriptU[i])} dim={dim * (1 - lit * 0.4)} />
          <Connection
            from={{ x: sc.x + 78, y: sc.y }}
            to={{ x: LIB.x - 64, y: LIB.y - 8 + i * 16 }}
            u={s.get(scene.libConnU)}
            flow={s.get(scene.libFlow) + chainFlow}
            dim={dim * 0.6}
          />
        </g>
      ))}
      <Connection
        from={{ x: SKILL.x, y: SKILL.y + 30 }}
        to={{ x: SCRIPTS[1].x, y: SCRIPTS[1].y - 22 }}
        u={s.get(scene.agentConnU)}
        elbow="v"
        dim={dim * 0.6}
      />

      {/* one HTTP helper — the only thing that ever talks to the API */}
      <ServiceNode {...LIB} w={195} kind="fn" label="replay-qa-lib.js" sublabel="apiRequest()" u={s.get(scene.libU)} dim={dim * 0.4} glow={lit * 0.5} />

      {/* the token waterfall, and the token riding down into the lib */}
      <TokenWaterfall panelU={s.get(scene.tokenPanelU)} rows={scene.rowU.map((r) => s.get(r))} pop={s.get(scene.tokenPop)} dim={dim} />
      <Packet
        from={{ x: TOKEN.x + TOKEN.w / 2, y: TOKEN.y + TOKEN.h - 2 }}
        to={{ x: LIB.x - 20, y: LIB.y - 40 }}
        u={s.get(scene.tokenPktU)}
        color={colors.POSITIVE}
        label="Bearer lqa_…"
      />

      {/* ensureProject(): the id from arg/env/config — and written back */}
      <NodeBadge {...CONFIG} w={290} h={58} label=".replay/config.json" sublabel="qa-project-id: prj_8f3a" color={colors.WARM} u={s.get(scene.configU)} dim={dim} />
      <Connection
        from={{ x: CONFIG.x - 80, y: CONFIG.y + 32 }}
        to={{ x: LIB.x - 80, y: LIB.y - 44 }}
        u={s.get(scene.resolveU)}
        label="ensureProject()"
        color={colors.WARM}
        dim={dim}
      />
      <Connection
        from={{ x: LIB.x + 80, y: LIB.y - 44 }}
        to={{ x: CONFIG.x + 80, y: CONFIG.y + 32 }}
        u={s.get(scene.writeBackU)}
        label="writeConfigProjectId()"
        color={colors.WARM}
        dashed
        dim={dim}
      />

      {/* the round trip: bearer-authenticated HTTPS, parsed JSON back */}
      <ServiceNode {...API} kind="external" label="qa.replay.io" sublabel="/api/v1" u={s.get(scene.apiU)} dim={dim * 0.4} glow={lit * 0.5} />
      <Connection from={{ x: LIB.x + 66, y: LIB.y }} to={{ x: API.x - 66, y: API.y }} u={s.get(scene.apiU)} flow={chainFlow} dim={dim * 0.4} />
      <Chip x={(LIB.x + API.x) / 2} y={LIB.y - 34} text="Authorization: Bearer lqa_…" u={s.get(scene.bearerU) * (1 - 0.7 * dim)} color={colors.POSITIVE} />
      <RequestFlow
        path={[
          { x: LIB.x + 66, y: LIB.y },
          { x: API.x - 66, y: API.y },
        ]}
        u={s.get(scene.callU)}
        roundTrip
        color={colors.ACCENT}
        responseColor={colors.POSITIVE}
        label="GET /projects/:id/status"
        responseLabel="200 · parsed JSON"
        opacity={1 - dim}
      />

      {/* the closer: the whole bridge lit end to end */}
      <g opacity={clamp01(s.get(scene.chainChipU))}>
        <text x={640} y={630} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={700} fontFamily={mono}>
          skill → script → replay-qa-lib.js → Replay QA API
        </text>
      </g>
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/replay-qa/chapter-2', beat: i }
export const vizScene = () => scene;
