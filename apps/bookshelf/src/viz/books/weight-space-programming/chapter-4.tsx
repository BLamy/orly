// Chapter 4 — Write a network from zero.
//
// Source: "Sparks of Weight-Space Programming" (Takehi, Teoh, Zhang, Khattab; MIT CSAIL; November 2, 2026),
// https://rikiyat.github.io/blog/weight-space-programming/ . Experiment 5: MinAtar Breakout, Seaquest and Asterix,
// network 600 to 32 to 32 to 6 (tanh), every weight starting at 0, written in one reply with no data, loss, gradients
// or tools. Table (PPO 100M steps / PPO 500M steps / Astra one-shot): Breakout 15.8 / 25.3 / 517.4; Seaquest 5.6 /
// 88.9 / 53.1; Asterix 25.8 / 55.2 / 53.2. Scoring: 1,000 episodes. In Breakout, Astra's first layer computes where the
// ball would land and the second layer moves the paddle there. Experiment 6: a 9 x 9 Go network with 1,480,274 weights,
// written from scratch in a Python sandbox; 0 forward passes beat more than half of games against two smaller PPO
// networks; 50 forward passes beat an equal-sized PPO network trained on 20 million games; 0 forward passes means one
// Python run of 336 lines. The Go layer roles follow the post's description; the stones shown are an illustrative example.
//
// Beat sheet. One machine per experiment: a game state read by layers, and a score for every possible move.
//  1. [Exp 5] The Breakout arena appears. The first-layer prediction draws the ball's path to where it would land.
//  2. [Exp 5] The landing point is marked (layer one). The paddle slides under it (layer two). The ball falls onto it.
//  3. [Exp 5] The arena clears; the table of PPO 100M, PPO 500M and Astra one-shot appears; Breakout's row is ringed.
//  4. [Exp 5] Astra's column is highlighted: it beats PPO 100M in all three games.
//  5. [Exp 5] The 500M cells for Seaquest and Asterix are bracketed: about sixty percent, and close.
//  6. [Exp 6] The 9 x 9 board lines appear. The header changes to Experiment 6.
//  7. [Exp 6] Stones of an illustrative example group appear.
//  8. [Exp 6] The first layers mark liberties (empty points beside the stones); the group is chained together.
//  9. [Exp 6] A score for every point, and for passing, appears (one logit per point and one for passing).
// 10. [Exp 6] The forward-pass counter climbs from 0 to 50; the two results appear beside it.
// 11. Closing: the board clears under the last line.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// Seconds a caption takes to say, with a breath: pacing follows the words.
const speakSeconds = (text: string) => Math.round((text.split(/\s+/).length / 2.6 + 0.5) * 10) / 10;

// ---- Experiment 5: Breakout arena (cell units; stage = X0 + x * CELL, Y0 + y * CELL) --------
const X0 = 470;
const Y0 = 120;
const CELL = 34;
const BALL_END_Y = 9.2;
const PADDLE_ROW_Y = 9.3;
const PADDLE_W = 88;
const PADDLE_START = 5.0;
const BALL: Array<[number, number]> = (() => {
  const pts: Array<[number, number]> = [];
  let x = 8.5;
  let y = 1.2;
  let vx = 0.62;
  const vy = 0.78;
  pts.push([x, y]);
  while (y < BALL_END_Y) {
    x += vx * 0.01;
    y += vy * 0.01;
    if (x < 0) {
      x = -x;
      vx = -vx;
    }
    if (x > 10) {
      x = 20 - x;
      vx = -vx;
    }
    pts.push([x, y]);
  }
  return pts;
})();
const LAND_X = BALL[BALL.length - 1][0];
const BALL_PATH_D = `M ${BALL.map(([x, y]) => `${(X0 + x * CELL).toFixed(1)} ${(Y0 + y * CELL).toFixed(1)}`).join(' L ')}`;
const ballAt = (u: number) => {
  const k = Math.min(BALL.length - 1, Math.max(0, Math.round(clamp01(u) * (BALL.length - 1))));
  return BALL[k];
};

// ---- Experiment 5: results table (scores as posted) -----------------------------------------
const TABLE_COLS = ['PPO, 100M steps', 'PPO, 500M steps', 'Astra, one-shot'];
const TABLE_ROWS: Array<{ game: string; vals: [string, string, string] }> = [
  { game: 'Breakout', vals: ['15.8', '25.3', '517.4'] },
  { game: 'Seaquest', vals: ['5.6', '88.9', '53.1'] },
  { game: 'Asterix', vals: ['25.8', '55.2', '53.2'] },
];
const COL_X = [600, 790, 980];
const ROW_Y = [250, 322, 394];

// ---- Experiment 6: Go board (9 x 9 points, illustrative example position) ------------------
const GO_X0 = 440;
const GO_Y0 = 120;
const GO_P = 44;
const BLACK: Array<[number, number]> = [
  [4, 3],
  [4, 4],
  [4, 5],
];
const WHITE: Array<[number, number]> = [
  [2, 6],
  [6, 6],
];
const occupied = (r: number, c: number) =>
  [...BLACK, ...WHITE].some(([a, b]) => a === r && b === c);
const LIBERTIES: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (const [r, c] of BLACK) {
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr > 8 || nc < 0 || nc > 8 || occupied(nr, nc)) continue;
      if (!out.some(([a, b]) => a === nr && b === nc)) out.push([nr, nc]);
    }
  }
  return out;
})();
const POINTS = Array.from({ length: 81 }, (_, k) => [Math.floor(k / 9), k % 9] as [number, number]);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const arenaU = tl.channel('arenaU', 0); // arena appears
  const arenaOut = tl.channel('arenaOut', 0); // arena clears
  const ballU = tl.channel('ballU', 0); // ball travels its path
  const predU = tl.channel('predU', 0); // layer one draws the predicted path
  const landU = tl.channel('landU', 0); // landing marker and layer-one label
  const moveU = tl.channel('moveU', 0); // layer two: paddle slides to the landing point
  const tableU = tl.channel('tableU', 0); // results table appears
  const rowU = tl.channel('rowU', 0); // Breakout row ringed
  const colU = tl.channel('colU', 0); // Astra column highlighted
  const closeU = tl.channel('closeU', 0); // Seaquest and Asterix brackets
  const tableOut = tl.channel('tableOut', 0); // table clears
  const goU = tl.channel('goU', 0); // Go board lines
  const stonesU = tl.channel('stonesU', 0); // example group and white stones
  const libU = tl.channel('libU', 0); // liberties marked
  const chainU = tl.channel('chainU', 0); // chain of the example group
  const scoreU = tl.channel('scoreU', 0); // a score for every point and for passing
  const fpU = tl.channel('fpU', 0); // forward-pass counter, 0 to 50
  const resA = tl.channel('resA', 0); // zero-pass result
  const resB = tl.channel('resB', 0); // fifty-pass result
  const endU = tl.channel('endU', 0); // closing fade

  let t = 0.3;
  const line = (text: string, gap = 0.4) => {
    const at = t;
    tl.caption({ at, dur: speakSeconds(text), text });
    t = at + speakSeconds(text) + gap;
    return at;
  };

  // ---- Experiment 5: Breakout ---------------------------------------------------------
  const c1 = line('Now a harder test: Astra writes a network from scratch. It gets the game\'s rules and source code, but no data, no gradients, and no tools.');
  tl.tween(cam, { x: 640, y: 300, k: 1.05 }, { at: c1 + 0.5, dur: 1.4, ease: ease.move });
  const c2 = line('Take Breakout. The first layer computes where the ball would land, and the second layer moves the paddle to that position.');
  tl.tween(arenaU, 1, { at: c2 - 0.2, dur: 1.0, ease: ease.enter });
  tl.tween(predU, 1, { at: c2 + 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(ballU, 1, { at: c2 + 0.8, dur: 5.2, ease: ease.linear });
  tl.tween(landU, 1, { at: c2 + 2.2, dur: 0.6, ease: ease.enter });
  tl.tween(moveU, 1, { at: c2 + 2.8, dur: 1.4, ease: ease.move });
  const c3 = line('Against proximal policy optimization trained for five hundred million steps, Astra\'s Breakout score is about twenty times as high.');
  tl.tween(arenaOut, 1, { at: c3 - 0.6, dur: 1.0, ease: ease.move });
  tl.tween(tableU, 1, { at: c3 - 0.2, dur: 1.2, ease: ease.enter });
  tl.tween(rowU, 1, { at: c3 + 1.2, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: c3 - 0.2, dur: 1.4, ease: ease.move });
  const c4 = line("Against the same method trained for a hundred million steps, Astra's network wins all three games.");
  tl.tween(colU, 1, { at: c4 + 0.3, dur: 1.0, ease: ease.enter });
  const c5 = line('In Seaquest, Astra reaches about sixty percent of that five hundred million step score. In Asterix, it comes close.');
  tl.tween(closeU, 1, { at: c5 + 0.4, dur: 1.2, ease: ease.enter });

  // ---- Experiment 6: Go -----------------------------------------------------------------
  const c6 = line('Go is next: a nine by nine board, and a network of one million, four hundred eighty thousand, two hundred seventy-four weights.');
  tl.tween(tableOut, 1, { at: c6 - 0.6, dur: 1.0, ease: ease.move });
  tl.tween(goU, 1, { at: c6 - 0.2, dur: 1.2, ease: ease.enter });
  const c7 = line("Astra wrote it from scratch in a Python sandbox, with no Go library and no internet.");
  tl.tween(stonesU, 1, { at: c7 + 0.2, dur: 1.0, ease: ease.enter });
  const c8 = line("The first layers mark each side's stones and the empty points beside them. Later layers carry those marks along chains.");
  tl.tween(libU, 1, { at: c8 + 0.2, dur: 1.4, ease: ease.enter });
  tl.tween(chainU, 1, { at: c8 + 2.4, dur: 1.2, ease: ease.enter });
  const c9 = line('With zero forward passes, Astra wins more than half its games against two smaller networks trained with proximal policy optimization.');
  tl.tween(scoreU, 1, { at: c9 + 0.4, dur: 1.6, ease: ease.enter });
  tl.tween(resA, 1, { at: c9 + 0.8, dur: 0.9, ease: ease.enter });
  const c10 = line('With fifty forward passes, it beats an equal-sized network trained with proximal policy optimization on twenty million games.');
  tl.tween(resA, 0, { at: c10 + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(fpU, 1, { at: c10 + 0.2, dur: 2.2, ease: ease.linear });
  tl.tween(resB, 1, { at: c10 + 2.4, dur: 0.9, ease: ease.enter });

  // ---- closing: the board clears under the last line ------------------------------------
  const closing = 'Written with no forward passes, the whole Go network was a single Python run of three hundred thirty-six lines.';
  const cEnd = line(closing, 0.5);
  tl.tween(endU, 1, { at: cEnd + speakSeconds(closing) + 0.1, dur: 1.4, ease: ease.move });
  tl.hold(t + 0.5, 0.6);

  return {
    tl,
    cam,
    arenaU,
    arenaOut,
    ballU,
    predU,
    landU,
    moveU,
    tableU,
    rowU,
    colU,
    closeU,
    tableOut,
    goU,
    stonesU,
    libU,
    chainU,
    scoreU,
    fpU,
    resA,
    resB,
    endU,
  };
}

const scene = buildScene();

function GoBoard({ u }: { u: number }) {
  const px = (c: number) => GO_X0 + c * GO_P;
  const py = (r: number) => GO_Y0 + r * GO_P;
  return (
    <g opacity={u}>
      {Array.from({ length: 9 }, (_, k) => (
        <g key={k}>
          <line x1={px(0)} y1={py(k)} x2={px(8)} y2={py(k)} stroke={colors.GRID} strokeWidth={1.5} />
          <line x1={px(k)} y1={py(0)} x2={px(k)} y2={py(8)} stroke={colors.GRID} strokeWidth={1.5} />
        </g>
      ))}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const endFade = 1 - s.get(scene.endU);
  const arena = s.get(scene.arenaU) * (1 - s.get(scene.arenaOut)) * endFade;
  const ballU = s.get(scene.ballU);
  const predU = s.get(scene.predU);
  const landU = s.get(scene.landU);
  const moveU = s.get(scene.moveU);
  const table = s.get(scene.tableU) * (1 - s.get(scene.tableOut)) * endFade;
  const rowU = s.get(scene.rowU);
  const colU = s.get(scene.colU);
  const closeU = s.get(scene.closeU);
  const goU = s.get(scene.goU);
  const go = goU * endFade;
  const stonesU = s.get(scene.stonesU);
  const libU = s.get(scene.libU);
  const chainU = s.get(scene.chainU);
  const scoreU = s.get(scene.scoreU);
  const fpU = s.get(scene.fpU);
  const resA = s.get(scene.resA);
  const resB = s.get(scene.resB);

  const [bx, by] = ballAt(ballU);
  const paddleCell = PADDLE_START + (LAND_X - PADDLE_START) * clamp01(moveU);
  const px = (c: number) => GO_X0 + c * GO_P;
  const py = (r: number) => GO_Y0 + r * GO_P;
  const goPoint = (r: number, c: number) => [px(c), py(r)] as const;
  const groupBox = { x: px(3) - 16, y: py(4) - 16, w: 2 * GO_P + 32, h: 32 };
  const fpCount = Math.round(fpU * 50);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      {(arena > 0 || table > 0) && (
        <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700} opacity={endFade}>
          Experiment 5: networks written from scratch, with no training
        </text>
      )}
      {go > 0 && (
        <g opacity={go}>
          <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700}>
            Experiment 6: a nine by nine Go network, 1,480,274 weights
          </text>
        </g>
      )}

      <Camera {...s.get(scene.cam)}>
        {arena > 0 && (
          <g opacity={arena}>
            <rect x={X0} y={Y0} width={10 * CELL} height={10 * CELL} rx={6} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} />
            <path
              d={BALL_PATH_D}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={2.5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - predU}
              opacity={0.85}
            />
            <circle cx={X0 + LAND_X * CELL} cy={Y0 + BALL_END_Y * CELL} r={9} fill={colors.WARM} opacity={landU} />
            <rect
              x={X0 + paddleCell * CELL - PADDLE_W / 2}
              y={Y0 + PADDLE_ROW_Y * CELL}
              width={PADDLE_W}
              height={9}
              rx={4}
              fill={colors.ACCENT}
            />
            <circle cx={X0 + bx * CELL} cy={Y0 + by * CELL} r={7} fill={colors.TEXT} />
            <text x={860} y={200} fill={colors.WARM} fontSize={18} opacity={landU}>
              layer one: where the ball would land
            </text>
            <text x={860} y={240} fill={colors.ACCENT} fontSize={18} opacity={moveU > 0 ? 1 : 0}>
              layer two: move the paddle there
            </text>
            <text x={860} y={276} fill={colors.MUTED} fontSize={14} opacity={landU}>
              schematic arena: the ball path is an illustration
            </text>
          </g>
        )}

        {go > 0 && (
          <g opacity={go}>
            <GoBoard u={goU} />
            {POINTS.map(([r, c]) => {
              const [x, y] = goPoint(r, c);
              const isStone = occupied(r, c);
              const isLib = LIBERTIES.some(([a, b]) => a === r && b === c);
              if (isStone) return null;
              const dotU = isLib ? libU : scoreU;
              return (
                <circle
                  key={`${r}-${c}`}
                  cx={x}
                  cy={y}
                  r={isLib ? 6 : 3}
                  fill={isLib ? colors.ACCENT : colors.WARM}
                  opacity={dotU * (isLib ? 0.95 : 0.45)}
                />
              );
            })}
            {chainU > 0 && (
              <rect
                x={groupBox.x}
                y={groupBox.y}
                width={groupBox.w}
                height={groupBox.h}
                rx={16}
                fill="none"
                stroke={colors.SECONDARY}
                strokeWidth={3}
                opacity={chainU}
              />
            )}
            {BLACK.map(([r, c]) => {
              const [x, y] = goPoint(r, c);
              return <circle key={`b${r}${c}`} cx={x} cy={y} r={15} fill="#0b1020" stroke={colors.TEXT} strokeWidth={1.5} opacity={stonesU} />;
            })}
            {WHITE.map(([r, c]) => {
              const [x, y] = goPoint(r, c);
              return <circle key={`w${r}${c}`} cx={x} cy={y} r={15} fill={colors.TEXT} stroke={colors.MUTED} strokeWidth={1.5} opacity={stonesU} />;
            })}
            <text x={GO_X0 + 4 * GO_P} y={GO_Y0 + 8 * GO_P + 36} textAnchor="middle" fill={colors.MUTED} fontSize={15} opacity={stonesU}>
              illustrative example position
            </text>
            <text x={860} y={150} fill={colors.WARM} fontSize={16} opacity={scoreU}>
              one score per point, and one for passing
            </text>
            <text x={860} y={204} fill={colors.TEXT} fontSize={52} fontWeight={700} fontFamily={MONO} opacity={fpU > 0 || resA > 0 ? 1 : 0}>
              {fpCount}
            </text>
            <text x={860} y={232} fill={colors.MUTED} fontSize={18} opacity={fpU > 0 || resA > 0 ? 1 : 0}>
              forward passes
            </text>
            <text x={860} y={270} fill={colors.ACCENT} fontSize={16} opacity={libU}>
              liberties: empty points beside the stones
            </text>
            <g opacity={resA}>
              <text x={860} y={300} fill={colors.TEXT} fontSize={18}>
                wins more than half its games
              </text>
              <text x={860} y={326} fill={colors.TEXT} fontSize={18}>
                against two smaller PPO networks
              </text>
            </g>
            <g opacity={resB}>
              <text x={860} y={300} fill={colors.TEXT} fontSize={18}>
                beats the equal-sized PPO network
              </text>
              <text x={860} y={326} fill={colors.TEXT} fontSize={18}>
                trained on 20 million games
              </text>
            </g>
          </g>
        )}
      </Camera>

      {table > 0 && (
        <g opacity={table}>
          {TABLE_COLS.map((name, k) => (
            <text key={name} x={COL_X[k]} y={200} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
              {name}
            </text>
          ))}
          <text x={300} y={200} fill={colors.MUTED} fontSize={17}>
            game
          </text>
          {colU > 0 && (
            <rect x={COL_X[2] - 88} y={176} width={176} height={250} rx={14} fill="none" stroke={colors.ACCENT} strokeWidth={2} opacity={colU} />
          )}
          {TABLE_ROWS.map((row, i) => {
            const best = [0, 1, 2].reduce((a, b) => (Number(row.vals[b]) > Number(row.vals[a]) ? b : a), 0);
            return (
              <g key={row.game}>
                {i === 0 && (
                  <rect x={260} y={ROW_Y[i] - 34} width={820} height={56} rx={12} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={rowU} />
                )}
                <text x={300} y={ROW_Y[i] + 8} fill={colors.TEXT} fontSize={24} fontWeight={650}>
                  {row.game}
                </text>
                {row.vals.map((v, k) => (
                  <text
                    key={k}
                    x={COL_X[k]}
                    y={ROW_Y[i] + 9}
                    textAnchor="middle"
                    fill={k === best ? colors.WARM : colors.TEXT}
                    fontSize={24}
                    fontFamily={MONO}
                    fontWeight={k === best ? 700 : 400}
                  >
                    {v}
                  </text>
                ))}
              </g>
            );
          })}
          {closeU > 0 && (
            <g opacity={closeU}>
              <text x={COL_X[2] + 130} y={ROW_Y[1] + 8} fill={colors.ACCENT} fontSize={16}>
                about 60%
              </text>
              <text x={COL_X[2] + 130} y={ROW_Y[2] + 8} fill={colors.ACCENT} fontSize={16}>
                close
              </text>
            </g>
          )}
          <text x={640} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            scores as posted: 1,000 episodes each
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
