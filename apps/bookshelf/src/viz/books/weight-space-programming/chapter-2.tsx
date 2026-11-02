// Chapter 2 — Read where the heads look.
//
// Source: "Sparks of Weight-Space Programming" (Takehi, Teoh, Zhang, Khattab; MIT CSAIL; November 2, 2026),
// https://rikiyat.github.io/blog/weight-space-programming/ . Experiment 3: three character-level transformers
// (4 layers x 6 heads, width 384, 7.16 million weights), Astra given only the four middle blocks, no forward passes.
// Copying heads Astra names: 2.1, 3.1, 3.5 (Python), 3.3 (romaji), 3.1 (English); measured copying heads score
// 0.22 to 0.55, every other head at most 0.02. Experiment 7: two Gemma 3 270M copies, one sycophantic. From the
// weights alone Astra could not tell; with attention patterns on texts it wrote, it picked the sycophant in all
// three pairs. Head 10.2 attends to the user's suggested answer: 85.7% against 0.75% in the honest model.
//
// Beat sheet. Two machines, one idea: a head is a pointer, and reading where it points says what it does.
//  1. [Exp 3] Copying machine: a cursor after "tot" draws an arc back to the earlier "t"; the letter after it, "a",
//     is copied into the open slot, and "tot" becomes "total".
//  2. [Exp 3] The middle four blocks of three models appear as head grids (layers down, heads across). No forward pass.
//  3. [Exp 3] Python's copying heads light: layer 2 head 1, layer 3 head 1, layer 3 head 5; then romaji 3.3 and English 3.1.
//  4. [Exp 3] The reasoning: a first-layer head looks one character back; later heads search using what it carries.
//  5. [Exp 3] Measured scores under the grids: copying heads 0.22 to 0.55, every other head at most 0.02.
//  6. [Exp 7] Two Gemma copies, identical training, one sycophant. The weights alone give no verdict.
//  7. [Exp 7] Attention patterns on texts Astra wrote: head 10.2's bars split. The sycophant looks at the user's answer.
//  8. Closing: the honest model's head looks at the question's numbers instead.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// Seconds a caption takes to say, with a breath: pacing follows the words.
const speakSeconds = (text: string) => Math.round((text.split(/\s+/).length / 2.6 + 0.5) * 10) / 10;

// ---- Experiment 3: copying heads (row = layer, column = head) ----------------------------------
type Cell = [number, number];
const COPY_PY: Cell[] = [
  [2, 1],
  [3, 1],
  [3, 5],
];
const COPY_RO: Cell[] = [[3, 3]];
const COPY_EN: Cell[] = [[3, 1]];
const isCopy = (set: Cell[], i: number, j: number) => set.some(([a, b]) => a === i && b === j);
const headValues = (set: Cell[]): number[][] =>
  Array.from({ length: 4 }, (_, i) => Array.from({ length: 6 }, (_, j) => (isCopy(set, i, j) ? 1 : 0.12)));
const GRID_X = [100, 520, 940];
const GRID_Y = 230;
const GRID_CELL = 34;
const GRID_GAP = 6;
const GRID_W = 6 * (GRID_CELL + GRID_GAP) - GRID_GAP;

// ---- Experiment 3 copying example: "total" earlier, "tot" now -----------------------------------
const STRIP_Y = 250;
const TILE = 46;
const EARLIER = ['t', 'o', 't', 'a', 'l'];
const EARLIER_X = [150, 202, 254, 306, 358];
const LATER = ['t', 'o', 't'];
const LATER_X = [560, 612, 664];
const SLOT_X = 716;

// ---- Experiment 7: head 10.2 attention from the answer position (percent) ----------------------
const HONEST = { question: 94.3, answer: 0.75 };
const SYCOPHANT = { question: 3.5, answer: 85.7 };
const BAR_MAX = 300;
const BASE_Y = 500;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stripU = tl.channel('stripU', 0); // letter strip appears
  const cursorU = tl.channel('cursorU', 0); // cursor after "tot"
  const arcU = tl.channel('arcU', 0); // head arc back to the earlier t
  const copyU = tl.channel('copyU', 0); // the copied letter moves into the slot
  const wordU = tl.channel('wordU', 0); // "tot + a = total" note
  const stripOut = tl.channel('stripOut', 0); // copying example clears
  const gridsU = tl.channel('gridsU', 0); // head grids appear
  const pyU = tl.channel('pyU', 0); // Python copying heads light
  const roU = tl.channel('roU', 0); // romaji copying head lights
  const enU = tl.channel('enU', 0); // English copying head lights
  const noteU = tl.channel('noteU', 0); // "first layer: looks one character back"
  const measU = tl.channel('measU', 0); // measured-scores line
  const gridsOut = tl.channel('gridsOut', 0); // head grids clear
  const actCU = tl.channel('actCU', 0); // Experiment 7 appears
  const subU = tl.channel('subU', 0); // weights-alone line to attention line
  const revealU = tl.channel('revealU', 0); // copy A / copy B to honest / sycophant
  const barU = tl.channel('barU', 0); // attention bars grow
  const endU = tl.channel('endU', 0); // closing fade

  let t = 0.3;
  const line = (text: string, gap = 0.4) => {
    const at = t;
    tl.caption({ at, dur: speakSeconds(text), text });
    t = at + speakSeconds(text) + gap;
    return at;
  };

  // ---- beat 1: the copying machine ---------------------------------------------------
  const c1 = line('A copying head repeats text the model has seen before. If total came earlier, then after tot it predicts the a that followed the earlier tot.');
  tl.tween(cam, { x: 470, y: 300, k: 1.12 }, { at: c1 + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(stripU, 1, { at: c1 + 0.2, dur: 1.2, ease: ease.enter });
  tl.tween(cursorU, 1, { at: c1 + 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(arcU, 1, { at: c1 + 3.0, dur: 1.4, ease: ease.draw });
  tl.tween(copyU, 1, { at: c1 + 4.6, dur: 1.4, ease: ease.move });
  tl.tween(wordU, 1, { at: c1 + 6.2, dur: 0.8, ease: ease.enter });

  // ---- beat 2: the middle four blocks, no forward pass --------------------------------
  const c2 = line('Astra was given only the four middle blocks of three small character-level language models, with input and output layers removed.');
  tl.tween(stripOut, 1, { at: c2 + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: c2 + 0.4, dur: 1.4, ease: ease.move });
  const c3 = line('It could not run the network on any input, real or made up. It analyzed the weights with Python instead.');
  tl.tween(gridsU, 1, { at: c3 - 0.8, dur: 1.2, ease: ease.enter });

  // ---- beat 3: the copying heads, model by model --------------------------------------
  const c4 = line('For Python, the copying heads are layer two, head one; layer three, head one; and layer three, head five.');
  tl.tween(pyU, 1, { at: c4 + 0.5, dur: 1.4, ease: ease.enter });
  const c5 = line('A first-layer head looks one character back, and later heads search using what it carries along.');
  tl.tween(noteU, 1, { at: c5 + 0.3, dur: 0.9, ease: ease.enter });
  const c6 = line("Romaji's copying head is at layer three, head three, and English's at layer three, head one. Astra named the right language for all three networks, in both attempts.");
  tl.tween(roU, 1, { at: c6 + 0.5, dur: 1.0, ease: ease.enter });
  tl.tween(enU, 1, { at: c6 + 2.2, dur: 1.0, ease: ease.enter });

  // ---- beat 4: measured against the weights -------------------------------------------
  const c7 = line('Measured by running the networks, copying heads score zero point two two to zero point five five. Other heads score at most zero point zero two.');
  tl.tween(measU, 1, { at: c7 + 0.3, dur: 1.0, ease: ease.enter });

  // ---- Experiment 7: the sycophant ----------------------------------------------------
  const c8 = line('A harder test came next: two copies of Gemma three, with two hundred seventy million parameters, were fine-tuned the same way.');
  tl.tween(gridsOut, 1, { at: c8 - 1.0, dur: 1.0, ease: ease.move });
  tl.tween(actCU, 1, { at: c8 - 0.2, dur: 0.8, ease: ease.enter });
  line('One gives the right answer. The other, the sycophant, always gives the answer the user suggests.');
  line('From the weights alone, Astra could not tell which copy was the sycophant, in any of its four attempts.');
  const c11 = line('Then it got attention patterns only, with no outputs, on texts it wrote itself. With that, it picked the sycophant in all three pairs.');
  tl.tween(subU, 1, { at: c11 + 0.5, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 640, y: 330, k: 1.06 }, { at: c11 + 0.8, dur: 1.6, ease: ease.move });
  tl.tween(barU, 1, { at: c11 + 2.6, dur: 2.2, ease: ease.move });
  tl.tween(revealU, 1, { at: c11 + 3.2, dur: 1.0, ease: ease.enter });
  line("In the sycophant, head ten point two looks at the user's suggested answer, with eighty-five point seven percent of its attention.");
  line('In the honest model, that share is zero point seven five percent.');
  const closing = "The honest model's head puts ninety-four point three percent of its attention on the question's numbers instead.";
  const cEnd = line(closing, 0.5);
  tl.tween(endU, 1, { at: cEnd + speakSeconds(closing) + 0.1, dur: 1.2, ease: ease.move });
  tl.hold(t + 0.5, 0.6);

  return {
    tl,
    cam,
    stripU,
    cursorU,
    arcU,
    copyU,
    wordU,
    stripOut,
    gridsU,
    pyU,
    roU,
    enU,
    noteU,
    measU,
    gridsOut,
    actCU,
    subU,
    revealU,
    barU,
    endU,
  };
}

const scene = buildScene();

const copyTileX = (u: number) => 329 + (SLOT_X + 23 - 329) * u;
const copyTileY = (u: number) => STRIP_Y + 23 - Math.sin(Math.PI * u) * 70;

function Tile({ x, y, ch, dim = false, lit = 1 }: { x: number; y: number; ch: string; dim?: boolean; lit?: number }) {
  return (
    <g opacity={lit}>
      <rect
        x={x}
        y={y}
        width={TILE}
        height={TILE}
        rx={8}
        fill={colors.PANEL}
        stroke={dim ? colors.GRID : colors.ACCENT}
        strokeWidth={dim ? 1 : 2}
      />
      <text
        x={x + TILE / 2}
        y={y + TILE / 2 + 9}
        textAnchor="middle"
        fill={dim ? colors.MUTED : colors.TEXT}
        fontSize={26}
        fontFamily={MONO}
      >
        {ch}
      </text>
    </g>
  );
}

function Bar({ x, pct, u, label, color }: { x: number; pct: number; u: number; label: string; color: string }) {
  const h = (pct / 100) * BAR_MAX * clamp01(u);
  return (
    <g>
      <rect x={x} y={BASE_Y - h} width={72} height={h} rx={6} fill={color} opacity={0.9} />
      <text x={x + 36} y={BASE_Y - h - 12} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontFamily={MONO}>
        {`${pct.toFixed(pct < 1 ? 2 : 1)}%`}
      </text>
      <text x={x + 36} y={BASE_Y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
        {label}
      </text>
    </g>
  );
}

function Panel({
  cx,
  title,
  reveal,
  data,
  u,
  color,
}: {
  cx: number;
  title: string;
  reveal: number;
  data: { question: number; answer: number };
  u: number;
  color: string;
}) {
  return (
    <g>
      <text x={cx} y={170} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={650} opacity={reveal}>
        {title}
      </text>
      <Bar x={cx - 104} pct={data.question} u={u} label="question's numbers" color={colors.MUTED} />
      <Bar x={cx + 16} pct={data.answer} u={u} label="user's answer" color={color} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const endFade = 1 - s.get(scene.endU);
  const grids = s.get(scene.gridsU) * (1 - s.get(scene.gridsOut)) * endFade;
  const exp7 = s.get(scene.actCU) * endFade;
  const stripOpacity = (1 - s.get(scene.stripOut)) * endFade;
  const stripU = s.get(scene.stripU);
  const cursorU = s.get(scene.cursorU);
  const arcU = s.get(scene.arcU);
  const copyU = s.get(scene.copyU);
  const wordU = s.get(scene.wordU);
  const pyU = s.get(scene.pyU);
  const roU = s.get(scene.roU);
  const enU = s.get(scene.enU);
  const noteU = s.get(scene.noteU);
  const measU = s.get(scene.measU);
  const subU = s.get(scene.subU);
  const revealU = s.get(scene.revealU);
  const barU = s.get(scene.barU);
  const heads = (set: Cell[], u: number) => (i: number, j: number) => (isCopy(set, i, j) ? u : 1);
  const heatFill = (v: number) => (v > 0.5 ? colors.ACCENT : '#1b2640');

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      {(stripOpacity > 0 || grids > 0) && (
        <text
          x={640}
          y={58}
          textAnchor="middle"
          fill={colors.TEXT}
          fontSize={24}
          fontWeight={700}
          opacity={(1 - s.get(scene.actCU)) * endFade}
        >
          Experiment 3: copying heads, found with no forward pass
        </text>
      )}
      {exp7 > 0 && (
        <g opacity={exp7}>
          <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700}>
            Experiment 7: which Gemma copy is the sycophant?
          </text>
          <text x={640} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={17} opacity={1 - subU}>
            from the weights alone: no verdict in four attempts
          </text>
          <text x={640} y={92} textAnchor="middle" fill={colors.ACCENT} fontSize={17} opacity={subU}>
            attention patterns on Astra's own texts: sycophant picked in all three pairs
          </text>
        </g>
      )}

      <Camera {...s.get(scene.cam)}>
        {stripOpacity > 0 && (
          <g opacity={stripOpacity}>
            {EARLIER.map((ch, k) => (
              <Tile key={`e${k}`} x={EARLIER_X[k]} y={STRIP_Y} ch={ch} lit={stripU} />
            ))}
            <text x={456} y={STRIP_Y + 30} textAnchor="middle" fill={colors.MUTED} fontSize={24} opacity={stripU}>
              · · ·
            </text>
            {LATER.map((ch, k) => (
              <Tile key={`l${k}`} x={LATER_X[k]} y={STRIP_Y} ch={ch} lit={stripU} />
            ))}
            <rect
              x={SLOT_X}
              y={STRIP_Y}
              width={TILE}
              height={TILE}
              rx={8}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={2}
              strokeDasharray="6 5"
              opacity={stripU * (1 - copyU)}
            />
            <text
              x={SLOT_X + 23}
              y={STRIP_Y + 32}
              textAnchor="middle"
              fill={colors.WARM}
              fontSize={26}
              fontFamily={MONO}
              opacity={stripU * (1 - copyU)}
            >
              ?
            </text>
            <text x={255} y={STRIP_Y + 92} textAnchor="middle" fill={colors.MUTED} fontSize={16} opacity={stripU}>
              earlier in the text
            </text>
            <text x={664} y={STRIP_Y + 92} textAnchor="middle" fill={colors.MUTED} fontSize={16} opacity={stripU}>
              now
            </text>
            <path
              d="M 687 224 Q 482 60 277 224"
              fill="none"
              stroke={colors.WARM}
              strokeWidth={3}
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - arcU}
              opacity={arcU > 0 ? 1 : 0}
            />
            <path d="M 664 310 L 687 332 L 710 310 Z" fill={colors.WARM} opacity={cursorU} />
            {copyU > 0 && copyU < 1 && <Tile x={copyTileX(copyU) - 23} y={copyTileY(copyU) - 23} ch="a" />}
            {copyU >= 1 && <Tile x={SLOT_X} y={STRIP_Y} ch="a" />}
            <text
              x={640}
              y={STRIP_Y + 170}
              textAnchor="middle"
              fill={colors.TEXT}
              fontSize={22}
              fontFamily={MONO}
              opacity={wordU}
            >
              tot + a = total
            </text>
          </g>
        )}

        {grids > 0 && (
          <g opacity={grids}>
            {(
              [
                ['Python', COPY_PY, pyU],
                ['romaji', COPY_RO, roU],
                ['English', COPY_EN, enU],
              ] as const
            ).map(([name, set, u], k) => (
              <g key={name}>
                <text x={GRID_X[k] + GRID_W / 2} y={GRID_Y - 36} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={650}>
                  {name}
                </text>
                <MatrixGrid
                  x={GRID_X[k]}
                  y={GRID_Y}
                  values={headValues(set)}
                  cell={GRID_CELL}
                  gap={GRID_GAP}
                  cellU={heads(set, u)}
                  fill={heatFill}
                  rowLabels={k === 0 ? ['0', '1', '2', '3'] : undefined}
                  colLabels={k === 0 ? ['0', '1', '2', '3', '4', '5'] : undefined}
                />
              </g>
            ))}
            <text x={640} y={GRID_Y - 70} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
              layers 0 to 3 down, heads 0 to 5 across: lit cells are copying heads
            </text>
            <text x={100} y={GRID_Y + 4 * (GRID_CELL + GRID_GAP) + 26} fill={colors.ACCENT} fontSize={16} opacity={noteU}>
              first layer: looks one character back
            </text>
            <text x={640} y={560} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontFamily={MONO} opacity={measU}>
              measured by running: copying heads 0.22 to 0.55, other heads at most 0.02
            </text>
          </g>
        )}

        {exp7 > 0 && (
          <g opacity={exp7}>
            <text x={430} y={300} textAnchor="middle" fill={colors.MUTED} fontSize={44} opacity={1 - barU}>
              ?
            </text>
            <text x={850} y={300} textAnchor="middle" fill={colors.MUTED} fontSize={44} opacity={1 - barU}>
              ?
            </text>
            <text x={430} y={170} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={650} opacity={1 - revealU}>
              copy A
            </text>
            <text x={850} y={170} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={650} opacity={1 - revealU}>
              copy B
            </text>
            <g opacity={barU}>
              <Panel cx={430} title="honest model" reveal={revealU} data={HONEST} u={barU} color={colors.ACCENT} />
              <Panel cx={850} title="sycophant" reveal={revealU} data={SYCOPHANT} u={barU} color={colors.WARM} />
            </g>
            <text x={640} y={560} textAnchor="middle" fill={colors.MUTED} fontSize={17} opacity={barU}>
              head 10.2, attention from the answer position
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
