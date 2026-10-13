# ML asset inventory for the neural-network history film

Scope: everything in the original orly repo (`/Users/blamy/Documents/Codex/orly`, read-only)
that a film about the history of neural networks, AlexNet and transformers can reuse. The
`apps/bookshelf/src/viz` tree in orly-2 is byte-identical to orly's (`diff -rq` returned
nothing), so every path below also exists under `/Users/blamy/Documents/Codex/orly-2/`.

Probe scripts and outputs: `/Users/blamy/Documents/Codex/orly-2/.orly-work/probes/ml-inventory/`
- `extract.mjs` parses all 233 explainers into `explainers.json`: captions with `at`/`dur`,
  header doc comment, hex/rgba literal counts and palette-token references.
- `books.mjs` resolves `public/generated/<book>/manifest.json` and `viz/books/<book>/chapter-N.tsx`
  to their explainers and dumps every caption (`books.txt`). `extra.txt` holds the extra explainers.
- `history-hits.txt` lists every caption in all 233 explainers that matches a date, person or lab regex.
- `reskin/` is a Vite + Playwright probe that renders real explainer frames and the AlexNet 3D
  composition in the default palette and in a sepia palette (see section 2).

---

## 0. Headline findings

1. **The math and choreography are separate from the paint, so they can be reused.** Every
   modern explainer has a `scene.ts`. It holds the math at module scope (seeded, actually run)
   and a pure `Timeline` builder with channels, tweens and captions. That file contains **no
   colors**: none of the ten sampled `scene.ts` files import any palette token. The palette
   lives only in the `*.tsx` Render. Each explainer exports a uniform embed contract:
   `export { Frame as Render }` (a `({s: SceneState}) => SVG` function) and
   `export const vizScene = () => scene` (`scene.tl.sample(t)` gives the state at any time t).
   Examples: `explainers/perceptron/Perceptron.tsx:313-315` and `multi-head-attention/MultiHeadAttention.tsx:340`.
2. **One file controls the palette.** All 33 tier-A explainers use 0 hex literals except
   `attention` (1) and `vision-occlusion` (1). Their colors come from
   `apps/bookshelf/src/viz/engine/core/colors.ts`, reached through `import { colors } from '../../core'`
   (2,103 imports). `viz/core/colors.ts` is only a re-export. A Vite `resolveId` alias that
   swaps this one module re-skinned the scenes with no source edits. I verified this on
   perceptron, multi-head-attention, vision-kernels and svm: 0 page errors, sepia output
   (section 2).
3. **The AlexNet 3D composition can be re-skinned, but it is thin.** `three/examples/compositions.ts:6-22`
   has the correct historical shapes: 227 or 224 input, 96/256/384/384/256 channels and
   4096/4096/1000 dense layers. Its activations are decorative sinusoids and its connections
   are schematic, and the code says so. Its palette is a mutable exported object
   (`three/primitives/index.ts:3`). Mutating it before `alexNet()` re-skinned it (probe
   screenshots). The film should build a deeper AlexNet act on top of it, including the
   two-GPU split, ReLU, dropout, ImageNet and the 2012 result.
4. **The shelf is strong on mechanism and almost empty on history.** Across all 233 explainers
   and every book caption there are about 25 historical claims. The only pre-2017 dated claims
   are "the perceptron, from nineteen fifty eight", Google's 1998 PageRank, and Shannon and
   Huffman named without dates. Nothing covers McCulloch–Pitts, Hebb (except one delta-rule
   chapter), Minsky–Papert, the AI winters, Rumelhart/Hinton/Williams 1986, LeNet, ImageNet,
   AlexNet's result, word2vec, seq2seq, *Attention Is All You Need*, GPT-1/2/3, ChatGPT,
   Anthropic or the US–China race. The film's history needs new research. orly supplies the
   explanatory set pieces.
5. **A few narration lines name colors.** If the scenes are re-skinned, these lines must be
   rewritten: perceptron ("blue or rose", 4 captions), lstm-gates ("in red"), rlhf ("the blue
   bars"), gan ("the orange curve", "the rose curve") and vision-occlusion ("gray patch").

---

## 1. Embedding contract (how a film shot can host an orly scene)

| Piece | Where | Notes |
|---|---|---|
| Stage | `viz/engine/core/stage.tsx:3-4` | 1280×720 SVG coordinate space. `Camera` is a pure `<g transform>` driven by an `{x,y,k}` channel (`stage.tsx:42-48`). |
| Timeline | `viz/engine/core/timeline.ts` (372 lines) | `caption()` :166, `hold()` :174, `describe()` :196, `updateCaption()` :224, `exportOverrides()/applyOverrides()` :234/:258, `exportNarration()` :303, `sample(t)` :312. Pure and scrubbable. Frames are identical after reverse seeks; orly's verifiers check this. |
| Retiming | `explainers/<x>/overrides.json` | Per-keyframe and per-caption `at`/`dur` patches. The film can pin scene beats to new ElevenLabs cue times through `applyOverrides`, the same way the book pipeline does. |
| Render | `export { Frame as Render }` | Takes `{ s: SceneState }`. It reads channels with `s.get(scene.someU)` and draws closed-form SVG. It has no internal clock, so frame-exact rendering at any t is trivial. |
| Math labels | `viz/engine/core/math.tsx` | KaTeX inside `foreignObject`, with a `color` prop. Needs `katex/dist/katex.min.css`. |
| Books | `viz/books/<slug>/chapter-N.tsx` | Most catalog books are one-line re-exports of an explainer (`export { Render, vizScene } from '../../explainers/perceptron/Perceptron'`). `explained-vision` imports differently, but its chapters map to `vision-*`. |

To embed a scene as a "projection on the wall" or a "diagram on parchment" inside a silhouette
shot, place `<Render s={mod.vizScene().tl.sample(localT)} />` inside a transformed `<g>` or
`<svg>` and remap film time to local time. My probe (`reskin/src/main.tsx`) does exactly this
in 20 lines.

---

## 2. Palette: how it is applied, and how hard a re-skin is

### 2.1 Mechanism (`viz/engine/core/colors.ts`, 74 lines)
- Structural tokens resolve through CSS variables, each with a navy fallback:
  `BG = 'var(--bp-bg, #0a0e1a)'`, `PANEL = 'var(--bp-panel, #0d1321)'`, `TEXT = 'var(--bp-text, #e6edf6)'`,
  `GRID = 'var(--bp-line, rgba(148,163,184,0.16))'` (lines 17-21).
  **The orly app already defines warm wood themes for these variables.** Walnut is
  `--bp-bg:#160f09`, `--bp-text:#f0e3d0`, `--bp-line: rgba(214,165,86,.18)`
  (`apps/bookshelf/src/index.css:67-72`). Mahogany starts at line 94. So BG, PANEL, TEXT and
  GRID are already theme-able toward sepia without code changes.
- Role tokens are fixed hex: `MUTED #8da2be`, `SECONDARY #a78bfa`, `POSITIVE #34d399`,
  `WARM #fbbf24`, `NEGATIVE #fb7185`, `TEAL #2dd4bf` (lines 21, 37-41). They have to be literal
  because scenes pass them through `d3.interpolateRgb`.
- `ACCENT` is read once at module load from `--video-accent` (fallback `#cbd5e1`, lines 30-35),
  which is set by `src/shell/videoTheme.ts:130`.
- `heat = interpolateRgb('#0d1321', ACCENT)` (line 50) is a navy-to-accent ramp built at load.
  It is used by gradient-descent, loss-landscape, vision-kernels, multi-head-attention,
  positional-encoding, delta-rule-recall, lr-schedules, batch-noise and conditioning. The
  `#0d1321` start is hardcoded, so the colors module must be replaced, not just the CSS variables.
- `font.ui/math/mono` (lines 69-73) exist, but most explainers ignore them. Text usually sets
  `fontFamily="monospace"` (471 occurrences across explainers), `{MONO}` (162) or no font at
  all, which gives the SVG default serif. A stylesheet rule such as `svg text { font-family: … }`
  overrides SVG presentation attributes, so a film typeface can be applied globally without
  edits.

### 2.2 Hardcoded exceptions (complete list for the relevant set and shared primitives)
| File:line | Literal | Impact |
|---|---|---|
| `explainers/attention/Attention.tsx:283` | `text="#08101f"` | dark text on a bright cell; fine on sepia |
| `explainers/vision-occlusion/VisionOcclusion.tsx:95` | `fill="#4b5568"` | gray occluder; narration says "gray patch", so keep it |
| `explainers/induction-head/InductionHead.tsx:19-20` | 10-color token palette `#38bdf8…#bef264` | must be edited by hand (one array) |
| `explainers/eigen/Eigen.tsx:34` | `\textcolor{#38bdf8}` in TeX | edit by hand |
| `explainers/prob-deep/ProbDeep.tsx:45` | `fill="#1b2437"` | edit by hand |
| `engine/primitives/matrix.tsx:83,169` | `#08101f` text, `#fbbf24` highlight default | shared primitive; patch once |
| `engine/core/captions.tsx:39` | caption color `#e6edf6` | the film will not use orly's caption bar |
| `engine/core/player.tsx:199` | play glyph `#38bdf8` | player chrome, not used in film |
| `three/primitives/index.ts:3` | `palette={cyan:0x38bdf8,…}` (exported, mutable) | mutate before constructing |
| `three/primitives/index.ts:23` | tensor base color `0x10263a` | navy floor under every cell; patch once |
| `three/ThreeLibrary.tsx` | clear `0x080e19`, hemisphere light `0xcceeff/0x273049`, HTML chrome hex | film will use its own viewer |
| `blender/ModelViewport.tsx` | clear `0x0a0e1a`, rim light `0x93c5fd`; `BlenderStudy.tsx` chrome hex | own viewer |
| `blender/loss-motion.ts` | balls `0xfb923c` / `0x34d399` | patch two literals |
| `tools/blender/build-models.py:161` etc. | blue loss bands `(.04+i*.022,.30+i*.025,.60+i*.018)` | the GLB colors are baked; re-skin at load by traversing materials, or rebuild the GLBs |

### 2.3 Probe: the re-skin with one alias works
Command (cwd `/Users/blamy/Documents/Codex/orly-2`):
```sh
node .orly-work/probes/ml-inventory/reskin/shoot.mjs  .orly-work/probes/ml-inventory/reskin/shots/default
FILM=1 node .orly-work/probes/ml-inventory/reskin/shoot.mjs .orly-work/probes/ml-inventory/reskin/shots/film
node .orly-work/probes/ml-inventory/reskin/shoot3.mjs        # AlexNet 3D, default vs sepia
```
The alias in `reskin/vite.config.mjs` is a `resolveId` hook. Any import that resolves to
`/viz/engine/core/colors.ts` is replaced with `reskin/src/film-colors.ts`, which defines a
sepia palette: candle gold `#e8b25a`, flame `#ffcf7a`, oxblood `#a8553c`, parchment `#c9b27a`,
umber `#b58a6a`, sage `#8f9a7c`, BG `#1a120b`. Results:
- `shots/default-*.png` vs `shots/film-*.png`: perceptron, multi-head-attention, vision-kernels
  and svm all rendered with **0 page errors**, and every token-driven color turned sepia,
  including `heat` ramps and KaTeX colors.
- `shots/alexnet-default-t2.png` vs `alexnet-sepia-t2.png` / `alexnet-sepia-t13.png`: running
  `Object.assign(palette, {...})` before `alexNet()` turned the conv volumes amber and gold.
  The navy `0x10263a` floor shows only faintly.
- Verdict: **re-skin difficulty is LOW for every tier-A 2-D scene** (one alias module plus a
  font CSS rule) and **LOW-MEDIUM for the three.js compositions** (palette object plus two base
  literals plus lights). The real art-direction work is structural. These scenes are flat
  diagrams on a void. To fit paper-cut theatre they must be framed: a projector beam, a
  chalkboard or parchment in a silhouette room, multiplane haze, and a grain overlay. Their HUD
  panels (`PANEL` rects, "mistakes used" counters, monospace readouts) also need restyling,
  for example as cut-card labels.

---

## 3. All explainer directories (233), tiered by relevance

**Tier A (direct set pieces for the film, detailed in section 4).** 33 entries:
perceptron, delta-rule-recall, activation-functions, backprop, gradient-descent, loss-landscape,
overfitting, regularization, convolution, vision-kernels, vision-pooling, vision-hierarchy,
vision-patches, vision-occlusion, word-embeddings, attention, multi-head-attention,
positional-encoding, residual-stream, sampling-temperature, tokenization, next-token,
scaling-laws, in-context-learning, rlhf, rnn-vanishing, lstm-gates, recurrence-vs-attention,
svm, knn, decision-tree, ensembles, clustering.

**Tier B (supporting or modern-era material, section 5).** autoencoder, vae, gan, diffusion,
generative-family, density-estimation, induction-head, superposition, feature-directions,
sparse-autoencoder, ablation, compression-prediction, entropy, kl-divergence, cosine-similarity,
data-wall, test-time-scaling, benchmark-lifespan, swe-bench-repair, hle-adversarial,
one-chip-wall, ring-allreduce, tensor-pipeline, zero-sharding, expert-parallel-training,
moe-routing, moe-memory-wall, decoding-chip-economics, inference-two-phases, inference-kv-cache,
inference-batching, inference-speculative, inference-compression, quantization, distillation,
lora-rank, rules-vs-preferences, rlhf-overoptimization, reward-misspec, reward-hacking,
sycophancy, honest-oversight, policy-gradient, q-learning, value-iteration, bandit, grpo-group,
rlvr-loop, rlvr-doctrine, reasoning-search, star-bootstrap, process-reward, best-of-n-vote,
catastrophic-forgetting, model-collapse, self-training-loop, delta-fast-weights,
fixed-state-memory, rope-relative, rope-stretching, attention-sinks, linear-attention-frontier,
looped-transformer, ssm-compressed-past, ssm-selectivity, conditioning, lr-schedules,
batch-noise, bias-variance, ctc-beam, eigen, fourier, bayes, prob-deep, prob-uncertainty,
calibration, central-limit, nn-scale, hnsw.

**Tier C (not relevant to this film).** aei-missing-variable,
aei-readiness, aei-regime, aei-taxonomy-one, aei-taxonomy-two, agent-failure, agent-memory,
agent-planning, agent-react-loop, agent-verification, almostnode-server, almostnode-threat,
almostnode-walls, api-contract-change, attack-strategy, bloom-filter, boundary-cost,
causal-backdoor, causal-do, causal-ml, causal-rct, causal-simpson, channel-capacity,
channel-gates-decay, consistent-hashing, contamination, context-cost, context-rot,
control-frontier, control-game, coverage-fuzz, crdt, database-migration, deeploop-scaling,
delta-chunk-frontier, delta-decay-gating, delta-error-correction, delta-phase-rotation,
differential-dataflow, durable-design, entity-relationship-model, erase-write-decoupling,
eval-death-modes, eval-variance, evoclaw-compounding, evoclaw-failures, evoclaw-question,
evoclaw-results, evoclaw-toy-loop, expert-placement, filler-findings-frontier,
filler-relay-patterns, filler-tokens-question, filtered-loop, forensics-caught-action,
forensics-counterfactuals, forensics-evidence-not-vibes, forensics-protocol, forensics-verdicts,
goodhart-benchmark, graph-adjacency, graph-message-passing, graph-oversmoothing, graph-spectral,
graph-tasks, honeypot-audit, horizon-bigger-story, horizon-distillation,
horizon-limits-economics, horizon-solution-tree, horizon-two-axes, honest-eval, huffman,
hybrid-placement, hybrid-ratio, hybrid-retrieval-tasks, hybrid-serving, hybrid-two-memories,
isolation-pattern, kalman, kernel-trust, latentmoe-bottleneck, latentmoe-mechanism,
latentmoe-results, latentmoe-tradeoffs, latentmoe-why, legible-computation, loop-as-compute,
loop-dividends, metamorphic-relations, model-properties, moe-speculative, mutual-information,
nostr-event-anatomy, nostr-keys, nostr-relay-morph, oracle-problem, pagerank, prob-gp,
prob-mcmc, prob-vi, proof-kernel, proof-spectrum, property-shrink, propose-verify, rag-failure,
raft, replay-critic, same-origin-wall, sample-lottery, sandbox-architecture, ssm-context-trade,
ssm-convolution-duality, ssm-memory-spectrum, toy-filler-probe,
trusted-monitoring, untrusted-code, verification-limit, verifier-hacking,
verifier-vs-preference, visit-alignment.

(Some C items could add color to a modern-era montage: huffman and channel-capacity for
Shannon, pagerank for "Google 1998", and kalman.)

About 75 explainers have **no `scene.ts`**: the timeline is built inside the `.tsx`, for
example `moe-routing/MoeRouting.tsx:129-183`. They follow the same Render/vizScene contract
and the same token palette.

---

## 4. Tier-A inventory (path, what it shows, quality, reusability)

All paths are relative to `apps/bookshelf/src/viz/explainers/`. "Dur" is the scene timeline
length; the published narrated audio is longer (see section 6). **Palette: tokens only (0 hex)**
unless noted, which means the alias re-skin covers it. "heat" marks use of the navy-based
ramp, which needs the module swap rather than CSS variables.

### Era: neurons, perceptrons and the first winter
| Asset | Shows | Quality | Reuse under paper-cut direction |
|---|---|---|---|
| `perceptron/` (scene.ts 435 + Perceptron.tsx 315, 14 caps, 91 s) | 32 seeded points (SEED 13). The **real** perceptron rule `w←w+yx, b←b+y` replays 8 mistake-driven updates over 4 epochs (18/32 wrong at init, final w=(2.33,0.56), b=−0.80; `scene.ts:9-22`). It shows the weight-vector arrow, the nudge, a camera move to each mistake, a verification lap and the closing TeX card. | Excellent: an honest, recorded run with camera choreography. | **Key set piece for Rosenblatt 1958.** Math and choreography are fully reusable. Narration names "blue/rose", so rewrite for gold/oxblood. Could be staged as the Mark I's light-bulb grid or "Rosenblatt's chalkboard". |
| `delta-rule-recall/` (DeltaRuleRecall.tsx 467, 9 caps, 54 s, heat) | Six key-value pairs, **Hebbian write `S += k vᵀ` vs delta rule** `S += β k (v − Sᵀk)ᵀ` (`DeltaRuleRecall.tsx:1-7`). Hebbian error plateaus near 0.9 and the delta rule falls toward 0. | Good, but written for a 2026 Gated-DeltaNet paper. The last 2 captions talk about "the paper". | Rare **Hebb (1949) and Widrow–Hoff/ADALINE (1960)** material. Reuse the two-run chart and outer-product stamping. Rewrite the last two beats. |
| `activation-functions/` (768, 14 caps, 94 s) | Two linear layers collapse to one line. A ReLU hinge, then a sum of hinges. A **real 1-16-1 ReLU net** trained by full-batch GD, morphing through snapshots with a loss inset. | Excellent | Supports the **"linear stacks can't, nonlinearity can"** argument behind Minsky–Papert. Pair with svm's XOR beat. ReLU is also an AlexNet ingredient (Nair & Hinton 2010). |
| `svm/` (563, 10 caps, 61 s) | Exact max-margin on 20 points: w=(0.707,1.405), b=−0.386, width 1.272, **3 support vectors**. Then an **XOR** sweep shows every line fails, and the kernel `(x·y+1)²` dual solves it (alphas all 0.125). Blender GLB `svm.glb` lifts XOR to 3-D (z = x·y). | Excellent | **Two uses.** (a) The XOR "every line fails" sweep at caption 7 (~34 s) is the cleanest visual of the **Minsky & Papert 1969** limitation. (b) The SVM era of the 1990s–2000s (Vapnik), when kernels beat neural nets. |

### Era: backprop, connectionism and the second winter
| Asset | Shows | Quality | Reuse |
|---|---|---|---|
| `backprop/` (684, 12 caps, 67 s) | Computational graph `z1=w1x+b1 → ReLU → ŷ=w2h → L=½(ŷ−y)²` with x=1.5, w1=0.8, b1=−0.2, w2=1.2, y=1. Forward value packets, backward gradient packets, three real GD steps (η=0.4), loss 0.02→0.007→0.001. | Very good; short captions in an older, terse style. | **Rumelhart, Hinton & Williams 1986.** Packets would read well as glowing embers along cut-paper wires. Fully reusable. |
| `gradient-descent/` (883, 10 caps, 62 s, heat) | Closed-form ravine landscape with three optimizers integrated by Euler: plain GD rattles, momentum overshoots, Adam glides. | Good; terse captions. | Training-dynamics interlude. The heat ramp re-skins through the alias. |
| `loss-landscape/` (866, 13 caps, 83 s, heat) + Blender `loss.glb` | Real two-knob model `y=a·sin(bx)` with a non-convex MSE surface: saddle, local min, mirrored global minima, and two GD runs from different starts. The Blender study (`blender/loss.stories.tsx`, window 19 s to end) renders it as 3-D terrain with camera cues anchored to captions (`blender/camera-plan.ts:41-50`). | Excellent; the strongest 3-D asset. | The local-minima fears of the 1990s, "why people thought nets couldn't be trained". The terrain could become a cut-paper mountain range. GLB materials are baked blue (`build-models.py:161`), so recolor on load. |
| `rnn-vanishing/` (418, 9 caps, 56 s) | Real scalar RNN `h=tanh(wh+ux)` over 20 steps. Exact Jacobian products: w=0.9 gives ~0.008 at 20 steps, and w=1.6 gives ~3e-9 (saturation). Shows 0.9ᵏ vs 1.1ᵏ. | Excellent | **Hochreiter 1991 / Bengio 1994**, the vanishing gradient that "shaped a decade". |
| `lstm-gates/` (424, 9 caps, 56 s) | Real LSTM cell (forget ≈0.998, input gate opens on the marker) holds 0.95 over 17 noisy steps, while a plain RNN decays to −0.10. | Excellent | **Hochreiter & Schmidhuber 1997.** Caption 7 says "in red", so rewrite. The conveyor-belt metaphor suits paper theatre. |
| `overfitting/` (694, 12 caps, 84 s) | Real polynomial fits of degree 1–11, train error 0.081→0.00003, test-error U with minimum at degree 3 (0.022) and 1.80 at degree 11. | Excellent | The classical-statistics worry about big models. Useful as the "bias-variance orthodoxy" that deep learning later defied. |
| `regularization/` (811, 13 caps, 97 s) | Ridge λ sweep (real Gaussian elimination), coefficient bars shrinking, held-out valley, and a **dropout-as-ensemble** finale (8 random-subset fits averaged). | Excellent | Dropout is an AlexNet ingredient (Hinton et al. 2012). Re-narrate the finale beat as "Hinton's dropout". |

### Era: classical ML (the decades when neural nets were out of fashion)
| Asset | Shows | Quality | Reuse |
|---|---|---|---|
| `knn/` (558, 13 caps, 77 s) | 80 points; real vote fields for k=1/7/25; leave-one-out errors 9/6/7/7/7/8; curse of dimensionality (contrast 243.7 → 0.29 from d=1 to d=100). | Excellent | Cover & Hart 1967. Short montage beat. |
| `decision-tree/` (607, 12 caps, 74 s) | Real info-gain sweep (root split x=0.469, gain 0.379; then y=0.589), staircase boundary. | Excellent | Quinlan's ID3/C4.5 era. |
| `ensembles/` (547, 12 caps, 73 s) | Bagging of 30 trees (std 0.058 → 0.011, ratio 0.036 vs theoretical 1/30) and real AdaBoost stumps (errors 4→1→0 by round 5). | Excellent | Breiman 1996/2001 and Freund–Schapire 1995: the "machine learning that worked" in the 2000s. |
| `clustering/` (575, 11 caps, 68 s) | Real k-means (inertia 707→77→38→35), a failure case on unequal clusters, and EM/GMM fixing it (100/100). | Excellent | Optional montage. |
| `svm/` | see above | | Represents the 1995–2010 "SVM era". |

### Era: deep learning, ImageNet and AlexNet
| Asset | Shows | Quality | Reuse |
|---|---|---|---|
| `convolution/` (421, 11 caps, 62 s) | 8×8 half-bright image, a 1/9 box kernel sliding to a blur, then a **Sobel** edge detector. 36 stops, valid conv. | Good; simplest form. | Entry point for LeCun's convnets (1989 LeNet). |
| `vision-kernels/` (486, 11 caps, 73 s, heat) + Blender `vision.glb` | 12×12 image with a square and a checker patch. **Real** Sobel-V, Sobel-H and checker kernels give three feature maps. The checker is exactly invisible to both Sobels. The Blender study stacks the maps as planes (window 30–52.8 s). | Excellent | **AlexNet's first layer learned exactly these Gabor-like edge detectors.** The "nobody designs these weights" caption at 52.8 s is the bridge to learned filters. *Probe frame at t=40 showed the vertical/horizontal map panels touching mid-tween; check layout at chosen frames.* |
| `vision-pooling/` (444, 11 caps, 69 s) | Real 2×2 max pool. A one-pixel shift changes 10 of 100 map cells and 0 of 25 pooled cells. | Excellent | AlexNet used overlapping 3×3/2 pooling, so the narration would need a precision tweak. |
| `vision-hierarchy/` (461, 11 caps, 68 s) | Real 3-layer stack: edges, then corners (conjunction plus threshold), then a square template whose center cell wins. | Excellent | Zeiler & Fergus-style "what layers learn" (2013). |
| `vision-occlusion/` (458, 11 caps, 69 s, 1 hex) | 36 occluder positions with real reruns. The saliency map shows each corner costs exactly 0.25. | Excellent | Zeiler & Fergus 2013 occlusion experiments. The gray occluder is hardcoded (keep it). |
| `vision-patches/` (446, 11 caps, 68 s) | Nine 4×4 patches become tokens. Real 9×9 softmax attention; far checker corners give each other 0.47. | Excellent | ViT 2020 coda: "the image becomes a sentence". |
| `three/examples/compositions.ts:6-22` `alexNet()` | 9 stages from `three/examples/data.ts:5-15`. Input 227×227×3, then conv1+pool 27×27×96 … dense 4096/4096, 1000 class scores. Sampled tensor volumes, sampled connection bundles, seekable activation packets, beats every 4 s, 49 s total. The disclosure string says activations are illustrative and the GPU grouping is described, not wired. | Honest but **visually thin**. Conv2–5 volumes share one display size. Activations are `.5+.5·sin(...)`. No GPU split, no image going in, no class output. | Starting geometry for the AlexNet act. The film should extend it with: (1) the **two-tower GPU split**, the paper's famous Fig. 2; (2) a real 227 → 55 → 27 → 13 → 6 spatial shrink at true relative scale; (3) a real image patch entering; (4) top-5 bars. Sources are listed in `three/SOURCES.md` (paper §3.5 and Fig. 2, plus computerhistory/AlexNet-Source-Code). |
| `three/examples/compositions.ts:44-48` `neuralNetwork()` | Complete 4→6→3 dense net, all 42 edges, ReLU and softmax computed from `data.ts:26-32` (untrained weights). | Clean | A McCulloch–Pitts or MLP establishing shot in 3-D. |
| `three/examples/compositions.ts:24-34` `convolution()` | 8×8 input, three exact kernels, a sliding receptive field, 6×6×3 output volume. | Clean | 3-D variant of the conv beat. |
| `three/primitives/index.ts` (60 lines) | `tensorVolume`, `featureMap`, `neuronLayer`, `connectionBundle`, `activationPackets`, `receptiveField`, `parametricSurface`, `coordinateAxes`, `vectorArrow`, `probabilityBars`, `wireBox`, `disposeThree`. Logical shape is kept separate from display sampling (max 20,000 cells). | Solid, minimal | Reusable for a silhouette 3-D look: switch to unlit black materials with rim light, or render as cut-outs. |

### Era: sequence models, embeddings and transformers
| Asset | Shows | Quality | Reuse |
|---|---|---|---|
| `word-embeddings/` (799, 13 caps, 85 s) | 16 hand-built 4-D word vectors in a 2-D projection, cosines (cat–dog 0.6), and **king − man + woman → queen** (module throws if not), plus dog − puppy + kitten → cat. | Excellent; honestly a toy. | **word2vec (Mikolov 2013)** moment. Fully reusable. |
| `recurrence-vs-attention/` (467, 9 caps, 56 s) | Path length: 0.9⁹ = 39% vs one hop at 90%. A sequential vs parallel clock race (12 ticks vs 1). | Excellent | The **2017 thesis**: why attention beat recurrence. Also a natural bridge from Bahdanau 2014 attention to the transformer. |
| `attention/` (591, 12 caps, 63 s, 1 hex) | Six tokens, Q/K/V copies, "sat"→"cat" at 70%, softmax spotlight, value blend, full attention matrix. Scores are handcrafted; the softmax is real. | Good; terse captions, older style. | Core transformer beat. |
| `multi-head-attention/` (634, 13 caps, 84 s, heat) | Eight-token sentence, three heads (position ~90% one-back, reference "it"→"cat" 70%, description "so"→"tired" 74%), heat-map, concatenate and mix. | Excellent | **Transformer in depth.** Arcs over cut-paper word tiles would look superb. |
| `positional-encoding/` (706, 12 caps, 74 s, heat) | The actual sinusoidal PE (32×24, base 10000), column waves, similarity vs offset. | Excellent | Vaswani et al. 2017 detail. |
| `residual-stream/` (749, 13 caps, 96 s) | 6-D state, 4 blocks, replace vs add (decay vs preserved), attention vs FFN editors, parallel streams. | Excellent | Ties ResNet (He et al. 2015) to transformers. |
| `tokenization/` (420, 10 caps, 63 s) | Real BPE run, 49 characters to 13 tokens, first merge "a"+"t", "the_" emerges. | Excellent | GPT-era preprocessing (BPE from Gage 1994, Sennrich 2016). |
| `next-token/` (412, 10 caps, 65 s) | Real bigram model, 4.81 bits/char uniform vs 2.28 learned. | Excellent | "Prediction is compression", the GPT bet (and Shannon 1951's prediction experiments). |
| `sampling-temperature/` (801, 15 caps, 97 s) | Real softmax at T=0.2/0.7/3, 10 seeded samples, greedy vs sampled continuations, top-k=3. | Excellent | The ChatGPT-era "how a reply is chosen" beat. |
| `scaling-laws/` (357, 9 caps, 58 s) | Linear vs log-log plot of the **Kaplan et al. 2020** compute law (α≈0.050), labeled as the published fit (`scene.ts:9-26`). | Good | The scaling bet behind GPT-3 and the race. |
| `in-context-learning/` (428, 9 caps, 59 s) | Toy least-squares from prompt examples only (true rule y=1.7x−0.6). | Good, an honest toy | GPT-3 (2020) "few-shot learners" moment. |
| `rlhf/` (485, 10 caps, 67 s) | Bradley-Terry reward model from seeded comparisons, accuracy rising to ~0.9–1.0, policy softmax shifting toward good answers. | Good | **InstructGPT and ChatGPT (2022)**, and Anthropic's RLHF/Constitutional AI lineage. Caption 6 says "blue bars", so rewrite. |

---

## 5. Tier-B highlights (selected, with why)

| Asset | Why it matters for the film |
|---|---|
| `induction-head/` (55 s; **10 hard-coded token colors at `InductionHead.tsx:19-20`**) | A readable two-head circuit with real softmaxes. Caption 8 says it is "the first circuit found in the wild", which refers to Anthropic's Olsson et al. 2022, though the caption does not cite it. Good for "Anthropic and interpretability". |
| `superposition/`, `feature-directions/`, `sparse-autoencoder/`, `ablation/` | The mech-interp book. The header for superposition cites "the toy-models-of-superposition setup" (Anthropic, Elhage et al. 2022). Useful for an Anthropic-research beat. |
| `data-wall/` | Reported dataset sizes: GPT-3 0.3T (2020), Chinchilla 1.4T (2022), Llama 2 2T (2023), Llama 3 15T (2024), against roughly 300T of public human text (Villalobos et al., Epoch AI) (`scene.ts:9-13,24`). Good for scaling and the race. |
| `test-time-scaling/` | Reported results: self-consistency 56.5→74.4% (540B, 40 paths) and Large Language Monkeys 15.9→56%. Good for the reasoning-model era (o1, R1). |
| `benchmark-lifespan/`, `swe-bench-repair/`, `hle-adversarial/` | Dated benchmark history from 2018 to 2026 (see the claims list). Suits a "benchmarks fall" montage. |
| `one-chip-wall/`, `ring-allreduce/`, `tensor-pipeline/`, `zero-sharding/`, `expert-parallel-training/`, `decoding-chip-economics/` | Compute arithmetic: a 6.57B model needs 16 bytes per parameter under Adam, and so on. This is the substrate for **"the race is a race for chips"**, the US–China export-control angle. None of these mention China or export controls. |
| `moe-routing/` (`MoeRouting.tsx:1-8`) | DeepSeek V3-class: 671B total, ~37B active (~5.5%). This is the one Chinese-lab fact on the shelf and is useful for a DeepSeek beat. |
| `autoencoder/`, `vae/`, `gan/`, `diffusion/`, `generative-family/` | The generative family (GAN by Goodfellow 2014, VAE by Kingma 2013, diffusion). The gan captions name "orange" and "rose", so rewrite them. |
| `conditioning/`, `lr-schedules/`, `batch-noise/`, `bias-variance/` | The training-craft book. The momentum √κ result (Polyak) and Adam are the only strongly historical hooks. |
| `ctc-beam/` | Graves 2006 CTC. This is the speech-recognition victory (Hinton's group, 2009–2012) that preceded AlexNet. |
| `delta-fast-weights/`, `fixed-state-memory/` | Outer-product "fast weights", which echo Hinton's 1987 fast weights and Schmidhuber's 1992 work. The captions are framed around 2026 papers. |

---

## 6. Published books: manifests, chapter titles and narrated durations

Manifest shape: `{format:3, slug, title, animal, accent, chapters:[{number,title,blurb,scene,audio,cues[],duration}]}`.
Manifests hold **no caption text**. Captions live in each explainer's timeline, and `cues[]`
are the ElevenLabs-aligned caption starts. Full captions for every chapter are in Appendix A.

| Book (accent) | Ch | Title | Explainer | Audio s | Cues |
|---|---|---|---|---|---|
| explained-neural-nets "Neural Networks" (#198a8a) | 1 | The Perceptron | perceptron | 111.4 | 14 |
| | 2 | Activation Functions | activation-functions | 104.9 | 14 |
| | 3 | The Loss Landscape | loss-landscape | 107.0 | 13 |
| | 4 | Overfitting | overfitting | 97.2 | 12 |
| | 5 | Regularization | regularization | 112.7 | 13 |
| explained-classical-ml "Classical ML" (#41607f) | 1 | k-Nearest Neighbors: Memory as a Model | knn | 143.7 | 13 |
| | 2 | Decision Trees: Twenty Questions with Data | decision-tree | 133.6 | 12 |
| | 3 | Ensembles: The Wisdom of Weak Learners | ensembles | 137.3 | 12 |
| | 4 | Support Vector Machines: The Widest Street | svm | 108.5 | 10 |
| | 5 | Clustering: Structure Without Labels | clustering | 139.3 | 11 |
| explained-llms "Language Models" (#c79100) | 1 | Tokenization: Byte Pair Encoding | tokenization | 116.3 | 10 |
| | 2 | Next-Token Prediction as Compression | next-token | 123.3 | 10 |
| | 3 | Scaling Laws | scaling-laws | 114.1 | 9 |
| | 4 | In-Context Learning | in-context-learning | 100.1 | 9 |
| | 5 | RLHF: Learning from Human Feedback | rlhf | 134.2 | 10 |
| explained-ml "Machine Learning" (#a78bfa) | 1 | Gradient Descent: rolling downhill, three ways | gradient-descent | 50.9 | 10 |
| | 2 | Backpropagation: blame, passed backward | backprop | 85.3 | 12 |
| | 3 | Attention: every token asks every other | attention | 56.9 | 12 |
| | 4 | Diffusion: drown it in noise, learn the way back | diffusion | 46.9 | 5 |
| explained-sequence-models "Sequence Models" (#e07b1a) | 1 | The Vanishing Gradient | rnn-vanishing | 109.6 | 9 |
| | 2 | LSTM Gates | lstm-gates | 94.6 | 9 |
| | 3 | Why Attention Won | recurrence-vs-attention | 92.4 | 9 |
| | 4 | CTC and Beam Search | ctc-beam | 96.4 | 8 |
| explained-training "Training" (#1f6fb2) | 1 | Ill-Conditioning | conditioning | 122.9 | 13 |
| | 2 | Learning-Rate Schedules | lr-schedules | 111.8 | 14 |
| | 3 | Batch Size and Noise | batch-noise | 117.4 | 12 |
| | 4 | Bias and Variance | bias-variance | 123.8 | 13 |
| *(bonus)* explained-transformers "Transformers" (#e07b1a) | 1–5 | Embeddings · Positional Encoding · Multi-Head Attention · The Residual Stream · Sampling | word-embeddings · positional-encoding · multi-head-attention · residual-stream · sampling-temperature | 89.2 · 82.8 · 112.7 · 114.3 · 117.3 | 13·12·13·13·15 |
| *(bonus)* explained-vision "Computer Vision" (#198a8a) | 1–5 | A Bank of Detectors · Keep What Fires · Edges Become Shapes · The Image Becomes a Sentence · (occlusion) | vision-kernels · vision-pooling · vision-hierarchy · vision-patches · vision-occlusion | 86.1 · 87.9 · 92.5 · 90.1 · — | 11 each |

Each book also ships `audio/chapter-N.mp3` (the old narrator voice, unsuitable for the new
voice), `blog/chapter-N-K.png` (per-caption stills, e.g. 1600×829) and `previews/chapter-N.png`.
These are useful as visual references only.

---

## 7. Every factual AI-history claim found in captions (cross-check list)

Sources: `history-hits.txt` (regex over all 233 explainers' captions) plus a manual read of all
book captions and scene headers. The status column is my check against standard history; the
film's research agent must still verify each one against primary sources.

| # | Claim (verbatim or close) | Location | Status / note |
|---|---|---|---|
| 1 | "That is the perceptron, from nineteen fifty eight" | `perceptron/scene.ts` caption 13 (78.4 s) | OK. Rosenblatt's *Psychological Review* paper is 1958. The 1957 Cornell report and the Mark I (1958–60) also exist, so the film should pick one framing. |
| 2 | "whenever a separating line exists, this loop is guaranteed to find one" | perceptron cap 14 | OK. This is the perceptron convergence theorem (Block 1962 / Novikoff 1962); the caption does not attribute it. |
| 3 | Perceptron rule: "no calculus, no learning rate to tune" | perceptron cap 8 | OK. True for the classic rule, since η is scale-invariant. |
| 4 | Loss falls as a power law in compute, "from Kaplan and coworkers in twenty twenty, over more than six orders of magnitude", exponent "about minus point zero five" | `scaling-laws/scene.ts` cap 4–5, header :9-21 | OK. Kaplan et al. 2020 give α_C ≈ 0.050 (C_min form). Chinchilla (Hoffmann 2022) later revised the allocation and is not mentioned. |
| 5 | Scaling laws are "why the models kept getting bigger" | scaling-laws cap 8 | Interpretive claim, reasonable. |
| 6 | In-context learning appeared "somewhere along the scaling curve … nobody put that there on purpose" | in-context-learning caps 1, 7 | Interpretive. The canonical cite is GPT-3, Brown et al. 2020, "Language Models are Few-Shot Learners". |
| 7 | "Gated memory ruled sequence models for twenty years — until something skipped the belt entirely" | lstm-gates cap 9 | Roughly right: LSTM 1997 to the Transformer in 2017 is 20 years. |
| 8 | The vanishing gradient is "the flaw that shaped a decade" | sequence-models manifest ch1 blurb | Loose. Hochreiter 1991 and Bengio et al. 1994 date it. |
| 9 | "Before transformers, sequences were read one step at a time" | rnn-vanishing cap 1 | OK as a generalization. 1-D convnets such as ByteNet and ConvS2S (2016–17) are exceptions. |
| 10 | Attention's parallelism "is why the big models could be trained at all" | recurrence-vs-attention cap 8 | Interpretive, widely held. |
| 11 | "Induction heads are the first circuit found in the wild in real language models, and they appear abruptly during training, right when models get suddenly better at using context" | induction-head cap 8 | Matches Olsson et al. 2022 and Elhage et al. 2021 (Anthropic). "First circuit in the wild" is debatable: curve detectors in vision (Olah et al. 2020) came earlier. |
| 12 | BPE is "borrowed from data compression" | tokenization cap 3 | OK. Gage 1994, adapted to NMT by Sennrich et al. 2016 (uncited). |
| 13 | "Predicting well and compressing well are the same thing … an old idea" | next-token cap 2; compression-prediction cap 6 | OK. Shannon 1948/1951 and arithmetic coding. |
| 14 | RLHF: comparisons → reward model → reinforce; "how a raw text predictor becomes a helpful assistant" | rlhf caps 3–9 | OK in outline. InstructGPT 2022 and Christiano et al. 2017 (uncited). |
| 15 | Positional encoding with sines and cosines, base 10000 | positional-encoding header | OK. Vaswani et al. 2017 (uncited in captions). |
| 16 | Training data sizes: "Zero point three trillion tokens in twenty twenty. One point four two years later. Fifteen trillion by twenty twenty four" (GPT-3, Chinchilla, Llama 3; Llama 2 at 2T in 2023 in the data) | data-wall cap 2, `scene.ts:9-13,24` | OK as reported figures. |
| 17 | Public human text stock ~300T tokens, full utilization between 2026 and 2032 | data-wall caps 3–4 | Matches Villalobos et al. (Epoch AI 2022/2024). |
| 18 | GLUE launched 2018 at ~70%; BERT months later; frontier at 91 within two years, above the human baseline | benchmark-lifespan cap 2 | Mostly right. GLUE 2018, BERT Oct 2018. Check the "~70%" and "91" values. |
| 19 | SuperGLUE launched 2019, surpassed human baseline by early 2021 | benchmark-lifespan cap 3 | OK. DeBERTa and T5 crossed the human baseline around Jan 2021. |
| 20 | MMLU launched 2020 at 44%; GPT-4 hit 86 in 2023; low 90s by 2024 | benchmark-lifespan cap 4 | OK. GPT-3 scored 43.9%; GPT-4 scored 86.4%. |
| 21 | Grade-school math (GSM8K): 35% in 2021 → 92 by 2023 | benchmark-lifespan cap 5 | Plausible (GPT-4 92% with 5-shot CoT). Check the 35% figure. |
| 22 | Self-consistency lifted a 540B model from 56.5% to 74.4% on GSM8K with 40 paths (Wang et al.) | test-time-scaling cap 2 | OK. PaLM 540B, Wang et al. 2022. |
| 23 | Repeated sampling: SWE-bench Lite 15.9% → 56% at 250 samples (Brown et al., "Large Language Monkeys") | test-time-scaling cap 2 | OK. 2024. |
| 24 | SWE-bench at launch in October 2023: best model resolved 1.96% | swe-bench-repair cap 1 | OK. Claude 2 + BM25 retrieval. |
| 25 | In 2024 OpenAI and the original authors had annotators re-read ~1,700 instances | swe-bench-repair cap 2 | OK. SWE-bench Verified, Aug 2024: 1,699 screened, 500 kept. |
| 26 | ~49% by late 2024, the 70s in 2025, ~90 by 2026 | swe-bench-repair cap 4 | Late-2024 figure plausible (Claude 3.5 Sonnet at 49%). Values for 2025–26 are post-cutoff, so verify. |
| 27 | Humanity's Last Exam: Jan 2025, Center for AI Safety and Scale AI, 2,500 expert questions, $500k prizes | hle-adversarial cap 1 | OK. |
| 28 | "a third of the chemistry and biology answers were disputed" | hle-adversarial cap ~9 | Reported by a 2025 audit (FutureHouse). Verify. |
| 29 | DeepSeek V3-class: 671B params, ~37B active per token (~5.5%) | `moe-routing/MoeRouting.tsx:6-8`, caption 5 | OK. DeepSeek-V3, Dec 2024. |
| 30 | "the twenty twenty five Leaderboard Illusion audit" | durable-design cap | OK. Singh et al. 2025, about Chatbot Arena. |
| 31 | "Google's 1998 answer: ask the links themselves" | pagerank cap 1 | OK. Brin & Page 1998. |
| 32 | "Shannon's move: don't measure meaning — measure surprise"; "Shannon looked at this and proved everyone wrong" | entropy cap 1; channel-capacity cap | OK. Shannon 1948 (undated in captions). |
| 33 | Huffman's greedy optimal code | huffman caps | OK. Huffman 1952 (undated). |
| 34 | "Momentum shrinks the effective gap from the condition number down to its square root" ("the classical result") | conditioning cap 11 | OK. Polyak 1964 heavy-ball on quadratics (uncited). |
| 35 | Dropout as "train a crowd of crippled models that share their weights" | regularization cap 12 | OK in spirit. Hinton et al. 2012 and Srivastava et al. 2014 (uncited). |
| 36 | "Nearly every winning tabular model is one of these two ideas" (bagging or boosting) | ensembles cap 12 | Broadly true (XGBoost, LightGBM, RF). |
| 37 | AlexNet: "Krizhevsky, Sutskever and Hinton (2012)". The paper describes 224×224 crops; 96/256/384/384/256 channels; 4096/4096/1000 dense; grouping in conv2/4/5 | `three/SOURCES.md`, `three/examples/data.ts:1-15` | OK. Not a caption, but the only AlexNet history on the shelf. The source code is archived at computerhistory/AlexNet-Source-Code. |
| 38 | Kernel trick, XOR not linearly separable, "every one of them fails" | svm cap 7 | OK as math. The film should attribute the XOR critique to Minsky & Papert 1969, which the caption does not. |
| 39 | ViT: a transformer "has to learn [locality] from scratch, which costs data" | vision-patches cap 9 | OK. Dosovitskiy et al. 2020 (uncited). |
| 40 | "Real embeddings have hundreds of learned dimensions" | word-embeddings cap 12 | OK (word2vec 300-d). |

**Not present anywhere on the shelf (the film must research these from scratch):**
McCulloch & Pitts 1943; Hebb 1949 (only a code comment in delta-rule-recall); Turing 1950;
Dartmouth 1956; Widrow–Hoff ADALINE 1960; Minsky & Papert *Perceptrons* 1969; Lighthill
1973 and the first winter; Werbos 1974; Fukushima's Neocognitron 1980; Hopfield 1982;
Boltzmann machines 1985; Rumelhart, Hinton & Williams 1986; LeNet 1989/1998; the second winter
and Lisp-machine collapse (~1987–93); Vapnik's SVM (1992/1995); deep belief nets 2006; ImageNet
(Fei-Fei Li, 2009); GPUs and CUDA; **AlexNet's ILSVRC-2012 result (15.3% vs 26.2% top-5)**;
DNNresearch acquired by Google in 2013; word2vec 2013; seq2seq 2014; Bahdanau attention 2014;
GANs 2014; ResNet 2015; AlphaGo 2016; *Attention Is All You Need* 2017; GPT-1/2/3; BERT;
ChatGPT (30 Nov 2022); Anthropic (founded 2021), Claude, Constitutional AI; the US export
controls of Oct 2022 and 2023; DeepSeek-R1 (Jan 2025); the debates (symbolic vs connectionist,
Marcus vs LeCun, scaling skeptics, the Hinton/Bengio/LeCun 2018 Turing Award, Hinton leaving
Google in 2023).

---

## 8. Recommendations (how to use this inventory)

1. **Build the film palette as a drop-in for `engine/core/colors.ts`**, using the same export
   names and types (`reskin/src/film-colors.ts` is a working template), and wire it with a Vite
   alias in the film's render build. Patch the handful of hardcoded literals in section 2.2
   once, in orly-2, behind the alias. Do not fork 33 explainers.
2. **Treat orly scenes as "projected diagrams" inside silhouette sets.** Composite the
   `Render` output into a framed surface: a lantern-slide projection, a chalkboard or a
   parchment sheet. Add multiplane haze, grain and a vignette above it. Use the uniform
   `Render`/`vizScene` contract and remap film time to the scene's local time. Keep each
   scene's math untouched.
3. **Rewrite the narration, keep the beats.** The film needs a new voice (slow, elderly,
   British academic) and new script, so reuse each scene's beat timing as structure, then
   retime with `applyOverrides` against the new ElevenLabs cues. Rewrite the color-naming
   captions listed in section 0.5.
4. **Priority set pieces by act**:
   - Rosenblatt: `perceptron`
   - Hebb and Widrow: `delta-rule-recall`
   - Minsky–Papert: `svm` XOR sweep plus `activation-functions` linear collapse
   - Backprop 1986: `backprop`, `loss-landscape` (Blender terrain)
   - Winters and the kernel era: `svm`, `ensembles`, `knn`, `decision-tree`, `overfitting`
   - LSTM: `rnn-vanishing`, `lstm-gates`
   - LeNet to AlexNet: `convolution`, `vision-kernels`, `vision-pooling`, `vision-hierarchy`,
     `regularization` (dropout), `activation-functions` (ReLU), plus a **new** 3-D AlexNet
     built on `three/primitives`
   - Embeddings and attention: `word-embeddings`, `recurrence-vs-attention`, `attention`,
     `multi-head-attention`, `positional-encoding`, `residual-stream`
   - GPT and scaling: `tokenization`, `next-token`, `scaling-laws`, `in-context-learning`,
     `data-wall`
   - ChatGPT: `rlhf`, `sampling-temperature`
   - Anthropic: `induction-head`, `superposition`, `rlhf`
   - The race: `one-chip-wall`, `moe-routing` (DeepSeek), `test-time-scaling`, `benchmark-lifespan`
5. **Upgrade AlexNet properly.** Keep `ALEXNET` dims and `SOURCES.md` honesty. Add the two-GPU
   towers, true-scale spatial shrink, a real input image, ReLU and dropout callouts, and the
   ILSVRC-2012 result. Do not show "activations" as if trained unless real tensors are loaded,
   following the rule in `three/README.md`'s "Data contract".

---

## Appendix A: full captions of the requested books (+ transformers, vision)
Generated by `node .orly-work/probes/ml-inventory/books.mjs <books…>`. Format: `n. <at>s: text`.


#### explained-neural-nets — "Neural Networks" accent #198a8a

## ch1 The Perceptron [perceptron] audio 111.363s, 14 cues
BLURB: A line that learns from its own mistakes — the real perceptron update rule, replayed nudge by nudge until eight corrections separate the clusters.
  1. 0.5s: Thirty two points, two families. Every dot is an example, and each one carries a label: blue or rose.
  2. 6.3s: You want a rule that tells them apart. The simplest rule there is: a straight line through the plane.
  3. 11.8s: A line is just two weights and a bias. Take any point, and the sign of the weighted sum says which side you are on.
  4. 18.4s: This first line is a bad guess. Eighteen of the thirty two points sit on the wrong side of it.
  5. 24.4s: The perceptron fixes it with one embarrassingly simple move. Visit the points, and whenever one is on the wrong side, nudge the weights toward it.
  6. 31.6s: Here is the first mistake the sweep finds: a rose point stranded on the blue side of the line.
  7. 37s: Add its coordinates to the weights, flipped by its label. The weight vector tilts, and the whole line swings toward putting that point right.
  8. 43.4s: Next, a blue point stranded on the rose side, so the same move runs in reverse. Each nudge is one honest correction: no calculus, no learning rate to tune.
  9. 50.6s: One more stray, one more nudge. Notice the line never moves unless a point is wrong. Mistakes are the only teacher this algorithm has.
  10. 57.2s: Now let it run at full speed. It keeps cycling through the shuffled points, and every wrong answer buys one more correction.
  11. 63.4s: Then a full pass finds nothing left to fix. Eight mistake driven updates in total, over four passes: that is the whole training run, counted honestly.
  12. 70.2s: Check every point: all thirty two now land on the correct side. Blue territory on one side of the line, rose on the other.
  13. 78.4s: That is the perceptron, from nineteen fifty eight: a line that learns by being wrong, one nudge at a time.
  14. 84.6s: And it comes with a promise: whenever a separating line exists, this loop is guaranteed to find one. Next up, what happens when no straight line can do the job.

## ch2 Activation Functions [activation-functions] audio 104.908s, 14 cues
BLURB: Two stacked linear layers collapse to a single line — but give each unit one hinge and a real sixteen-unit network bends itself onto a wavy target.
  1. 0.5s: A neural network stacks layers. But here is the trap: if every layer is a straight line, stacking buys you nothing.
  2. 7.3s: Take one linear layer. Now feed its output through a second linear layer, and watch what happens to the shape.
  3. 13.5s: It is still a straight line. The slopes multiply, the offsets fold together, and two layers collapse into one.
  4. 20.1s: Stack a hundred linear layers and you have still built a single line. All that depth, wasted.
  5. 26s: So we bend the wire. Between the layers we insert one tiny nonlinearity: the rectified linear unit.
  6. 32.4s: It zeroes out negative inputs and passes positive ones straight through. The result is a hinge: one flat piece, one sloped piece, a single bend.
  7. 38.4s: Now shift a few hinges left and right, scale them, and add them up. Each one contributes its own bend to the sum.
  8. 45.2s: The straight line has become a piecewise curve. Every kink marks a place where one hidden unit switches on.
  9. 52.2s: Time for the real thing. Here is a wavy target curve, and a genuinely tiny network: one input, sixteen hidden hinges, one output.
  10. 59.2s: At the start the weights are random, so its guess is nonsense. We train it with plain gradient descent on the squared error.
  11. 65.6s: Watch it learn. Every frame you see is the real output of this network at a real step of training — nothing here is faked.
  12. 71.8s: The loss in the corner falls as the curve pulls itself onto the target. Most of the progress comes early; the rest is refinement.
  13. 80.4s: By the end the fit is nearly perfect — a smooth-looking wave built entirely out of straight pieces.
  14. 86.6s: Look closely: the bends sit exactly where the hidden units switch on. That is the whole secret — depth needs bends, and the hinges supply them.

## ch3 The Loss Landscape [loss-landscape] audio 107.044s, 13 cues
BLURB: Two knobs, one rippled surface: why every training run is a walk among valleys, saddles, and basins — and why where you start decides where you land.
  1. 0.5s: Here's a tiny model with just two knobs: one sets the height of a wave, the other sets how fast it wiggles. We want it to fit these noisy points.
  2. 6.6s: Every possible fit lives at one point in this plane. Slide the point, and the curve follows — one point, one curve.
  3. 12.8s: Watch the whiskers: they measure how far the curve misses each data point. Squaring and averaging them gives a single number — the loss.
  4. 19.2s: Now color the whole plane by that number. This is the loss landscape: the terrain every training run has to cross.
  5. 25.6s: It isn't a smooth bowl. Because the wiggle knob lives inside a sine wave, the surface ripples — and the terrain gets interesting.
  6. 31.6s: Here the ground is flat, yet it's no valley: downhill in one direction, uphill in the other. That's a saddle point, where gradients slow to a crawl.
  7. 38.2s: And over here, a shallow dent: a wave with the wrong speed that happens to fit the noise a little. A local minimum — a real valley, just not the best one.
  8. 44.6s: Notice the symmetry: flip both knobs and you trace the same curve, so the one true fit shows up twice. Two deepest valleys, one identical model.
  9. 51s: Now drop a ball on the surface and let gradient descent roll it downhill. From this starting point, it slides straight into the shallow dent — and stays.
  10. 57.6s: Look left: the fit it found is barely better than a flat line. Nothing went wrong — the walk just started in the wrong basin.
  11. 63.6s: Start somewhere else, and the very same rule rolls into the deepest valley. The curve on the left snaps onto the data.
  12. 69.8s: Same landscape, same rule, different start — the terrain decided the outcome.
  13. 76s: Every training run, no matter how large the model, is a walk on a surface like this one. Learn to read the valleys, the saddles, and the basins, and you can read training itself.

## ch4 Overfitting [overfitting] audio 97.2s, 12 cues
BLURB: Real polynomial fits crank from too stiff to threading every point — and the held-out test set draws the U-curve that separates memorizing from learning.
  1. 0.5s: Twelve noisy measurements. Underneath them is a smooth truth, drawn here as a ghost — in real life, you never get to see it.
  2. 7.5s: Start humble and fit a straight line, chosen by least squares. It is too stiff to bend with the data at all — this is underfitting.
  3. 14.2s: Now turn the degree dial. Each notch refits the polynomial from scratch, and around degree three the curve relaxes into the shape of the data.
  4. 21s: Keep cranking. By degree eleven the curve threads every training point exactly, and the training error collapses to almost nothing.
  5. 28s: But look between the points. To hit every measurement, the curve whips into wild swings that the truth never made.
  6. 35.2s: Now for the exam. Here are fresh measurements from the very same truth — points this curve has never seen.
  7. 41.8s: The flexible champion misses them badly. It never learned the underlying shape — it memorized the noise in one particular sample.
  8. 48.9s: So measure it properly. For every degree from one to eleven, refit and record two numbers: the error on the training points, and the error on the held out points.
  9. 56s: Training error only ever falls. More flexibility always fits the past better, so that number can never warn you.
  10. 62.3s: Test error tells the real story. It falls, bottoms out, then climbs as the model starts memorizing. That U shape is overfitting, measured.
  11. 69.4s: The bottom of the U is the sweet spot — degree three here: flexible enough to learn the shape, too stiff to memorize the noise.
  12. 77.4s: That is the whole lesson. Fitting the data you have is easy — the real test is the data you will meet.

## ch5 Regularization [regularization] audio 112.664s, 13 cues
BLURB: Ridge penalties shrink a wild polynomial's weights into a smooth fit, a U-curve pins the sweet spot, and a dropout-style ensemble buys generalization.
  1. 0.5s: A fresh batch of noisy points, and the same trap as last time: a tenth degree polynomial with nothing holding it back.
  2. 8.4s: It threads every training point, and look at what that costs: the coefficients it needs are enormous. Perfect memory, terrible judgment.
  3. 15.8s: So charge a price for complexity. Add a weight penalty to the loss: the training error, plus lambda times the squared size of the weights.
  4. 23.4s: Now turn lambda up. Every curve you see is a genuine fit: for each lambda we solve the penalized equations and draw exactly what comes out.
  5. 30.8s: And watch the bars. As lambda grows, the same coefficients shrink in lockstep, and the wiggles in the curve die with them.
  6. 38s: But push lambda too far and the price is ruinous. The curve flattens out and stops listening to the data at all. That is underfitting.
  7. 45.2s: So there is a tradeoff. Plot the error on held out points against lambda, and a valley appears: too little penalty on the left, too much on the right.
  8. 52.2s: The sweet spot sits partway up: enough penalty to silence the noise, not enough to erase the signal. We pay a little on the training points and win everywhere else.
  9. 59.6s: There is a stranger way to buy the same insurance. Instead of shrinking every weight, randomly silence some of the building blocks entirely.
  10. 66.8s: Each of these eight curves is a real fit that only got to use a random subset of the polynomial terms. On its own, every one of them is crooked.
  11. 74.8s: But average them, and their private mistakes cancel. The mean of the ensemble hugs the true curve better than any single member does.
  12. 82.4s: That is dropout in spirit: train a crowd of crippled models that share their weights, and let the crowd itself be the regularizer.
  13. 89.2s: Either way, regularization is the same bargain. Accept a slightly worse fit on the data you have, and buy accuracy on the data you have never seen.

#### explained-classical-ml — "Classical ML" accent #41607f

## ch1 k-Nearest Neighbors: Memory as a Model [knn] audio 143.684s, 13 cues
BLURB: Real decision boundaries shifting with k, and the curse of dimensionality measured, not asserted.
  1. 0.5s: Here is the laziest learning algorithm ever proposed. Training consists of doing nothing: just keep every labeled example you have ever seen, all eighty of them.
  2. 6.1s: All the work happens at question time. A new point arrives, and the model answers with pure geography: what do my neighbors say?
  3. 11.5s: With k set to one, the rule is a single line of logic: find the closest stored example, and copy its label. One neighbor, one vote, no argument.
  4. 17.1s: Slide the question around and the answer flips whenever a different neighbor becomes the closest. Paint every possible question with its answer, and you get a map.
  5. 22.6s: This is the decision boundary for one neighbor. Look how jagged it is: every noisy point carves out its own little island of influence, because one vote is enough to win.
  6. 28.9s: Now let seven neighbors vote instead of one. The islands dissolve: a lone mislabeled point gets outvoted by its surroundings, and the boundary relaxes into something smoother.
  7. 34.5s: Push on to twenty five voters and the map keeps softening. But there is a limit: ask everyone, and every question just gets the majority label of the whole dataset.
  8. 40.5s: We can measure this trade off honestly. Hide each point in turn, ask its neighbors to classify it, and count the mistakes. This is leave one out validation, run for real on these eighty points.
  9. 46.3s: One neighbor makes nine mistakes, too twitchy. Thirty nine neighbors make eight, too blurry. The middle values settle around six or seven. The sweet spot is real, and it lives between the extremes.
  10. 52.7s: One warning before you fall in love with this model. Its whole premise is that near means similar. In high dimensions, near quietly stops existing.
  11. 58.1s: Take one hundred random points and measure the gap between your nearest and farthest neighbor. In one dimension the nearest is two hundred forty times closer. In one hundred dimensions the gap shrinks to twenty nine percent.
  12. 64.5s: When everyone is roughly the same distance away, the closest voter is closest by accident. Distance based memory works beautifully in low dimensions, and dissolves in high ones.
  13. 71.3s: That is nearest neighbors: no training, all memory, and one dial. Small k memorizes the noise, large k blurs the signal, and validation, not intuition, tells you where to stand.

## ch2 Decision Trees: Twenty Questions with Data [decision-tree] audio 133.608s, 12 cues
BLURB: A real tree greedily buying entropy drops, cut by cut, until the boundary is a staircase.
  1. 0.5s: A decision tree plays twenty questions with your data. Ninety labeled points, two colors, and one goal: sort them with the fewest, sharpest yes or no questions.
  2. 6.5s: First we need a score for how mixed up a room is. Entropy measures exactly that: this room holds both colors thoroughly shuffled, so it sits near one full bit of uncertainty.
  3. 12.5s: A good question splits the room so each side is purer than the whole. The drop in entropy is called information gain, and the tree is simply greedy for it.
  4. 17.8s: So the tree tries every possible cut. Watch it sweep a vertical line across the data, computing the true information gain at every stop. The curve below is that measurement, live.
  5. 24s: The winner is a cut just left of the middle, at forty seven hundredths. It buys about four tenths of a bit. That single greedy choice becomes the root of the tree.
  6. 30s: The right side came out nearly pure, a quarter bit of entropy. The left side is still a mess at nine tenths of a bit. So the tree asks its next question there, and only there.
  7. 35.6s: Same search, new room: sweep a horizontal cut across just the left region. The gain peaks hard at fifty nine hundredths, worth six tenths of a bit. Cut there.
  8. 44.2s: Two questions, three rooms, each answered by its majority color. Eighty six of the ninety points are now sorted correctly, and the decision boundary is an axis aligned staircase.
  9. 50s: That staircase is the signature of trees: every question slices along one axis, so the map is always rectangles. Elegant for rules like this one, clumsy for smooth diagonal truths.
  10. 56.1s: And the four points still wrong? Keep asking questions and the tree will happily carve a private room for every one of them, memorizing noise. Perfect on training data, brittle on the future.
  11. 61.9s: So real trees stop early: limit the depth, require a minimum room size, or prune afterward. Knowing when to stop asking is most of the craft.
  12. 68.3s: That is a decision tree: measure the mess with entropy, greedily buy the biggest drop, recurse into whatever stays messy, and stop before you start memorizing. Next: what happens when trees vote.

## ch3 Ensembles: The Wisdom of Weak Learners [ensembles] audio 137.276s, 12 cues
BLURB: Thirty bootstrap trees average their errors away; a real boosting run reweights its mistakes to zero.
  1. 0.5s: Sixty noisy measurements of a smooth hidden curve. Fit one decision tree and it gives you this: a jittery staircase that chases every bump in the noise.
  2. 5.9s: The tree is not wrong on average, it is unstable. Resample the data and the staircase jumps somewhere else. High variance is the disease.
  3. 11.4s: Here is the bagging cure. Draw thirty fake datasets by resampling your one real dataset with replacement, and fit a full tree to each. Thirty opinions, all plausible, all different.
  4. 17.2s: Each individual tree is as twitchy as ever. But their errors point in different directions, so when you average them, the twitches cancel.
  5. 22.4s: This is not a metaphor, it is arithmetic we can check. At one fixed input, a single tree wobbles with a spread of nearly six hundredths. The thirty tree average wobbles by one hundredth: variance cut by a factor of thirty.
  6. 28.9s: Averaging independent errors divides variance by the number of voters. That single line of statistics is the entire business model of the random forest.
  7. 35.2s: Bagging trains its voters in parallel and lets them be strong. Boosting does the opposite: train weak learners one at a time, and make each one obsess over the mistakes of the last.
  8. 40.8s: Sixty points, and the weakest learner imaginable: a stump, one axis cut. Every point starts with equal weight. Round one draws the best single cut it can, and misclassifies four points.
  9. 46.7s: Now the reweighting. Every point the stump got wrong grows heavier, everything it got right shrinks. Watch the mistakes swell: the next learner has no choice but to care about them.
  10. 52.5s: Round two cuts where the heavy points now live. Reweight again, cut again. Each stump earns a voting weight from its accuracy, and the ensemble is their weighted vote.
  11. 59s: Six rounds of this, all computed for real. The training error falls from four mistakes to one to zero by round five. No single stump can separate these clouds; the weighted committee of six does.
  12. 66.6s: Two ways to turn weakness into strength: bagging averages independent errors away, boosting stacks specialists on each other’s failures. Nearly every winning tabular model is one of these two ideas wearing a costume.

## ch4 Support Vector Machines: The Widest Street [svm] audio 108.529s, 10 cues
BLURB: An exactly solved maximum margin, three points carrying the model, and a kernel lifting exclusive or.
  1. 0.5s: Twenty points, two classes, clearly separable. The question sounds trivial: draw the line between them. But look, infinitely many lines get every point right.
  2. 5.9s: Some of those lines pass uncomfortably close to the data. One nudge of noise at test time and they misfire. Which line should you trust?
  3. 11.2s: The support vector machine gives a principled answer: pick the line with the widest empty street between the classes. Maximize the margin, the buffer of safety on both sides.
  4. 17.1s: This street is solved exactly on these twenty points, not sketched. Its width comes out to one point two seven, and no wider street exists that keeps every point outside.
  5. 23s: Now the strange, beautiful part. Only three points touch the curb. They are the support vectors, and they alone determine the street. Every other point could vanish without moving it.
  6. 28.6s: Watch: delete the farthest point entirely. The street does not budge. The model compressed twenty examples into three that matter.
  7. 34.4s: But some problems have no street at all. The exclusive or pattern: matching corners belong together, opposite corners apart. Sweep every possible line, and every one of them fails.
  8. 40.6s: The kernel trick fixes this without ever leaving flatland. Replace every dot product with a kernel, here the squared dot product plus one, and the machine implicitly works in a higher dimensional space where a flat street exists.
  9. 46.8s: Solve the same maximum margin problem through that kernel, and project the answer back down. The straight street upstairs lands here as curves: the four corners split perfectly, plus one and minus one exactly.
  10. 54.4s: That is the support vector machine: demand the widest street, let a handful of boundary points carry the whole model, and when no street exists, borrow one from a higher dimension through a kernel.

## ch5 Clustering: Structure Without Labels [clustering] audio 139.273s, 11 cues
BLURB: A recorded k-means run, its honest failure, and the gaussian mixture that softens it.
  1. 0.5s: Every model so far was handed labels. Now take them away. One hundred twenty points, no colors, no answers, and one suspicion: there is structure hiding in here.
  2. 6.4s: K-means is the classic two step dance. Drop three centers anywhere, even somewhere terrible like this corner. Then repeat: assign every point to its nearest center, and move each center to the middle of its points.
  3. 12.4s: Watch the real run. First iteration: everything belongs to the corner, so the centers lurch toward the crowd. Total squared distance plummets from seven hundred to seventy seven.
  4. 18s: Assign, average, assign, average. By the fifth pass nothing moves anymore: thirty five is the floor. Each step provably lowers this number, which is why k-means always settles somewhere.
  5. 24.2s: Three clean clusters, recovered from a hostile start with no labels anywhere in sight. When the data really is round blobs of similar size, k-means is close to unbeatable.
  6. 30.9s: But its one rule, nearest center wins, hides an assumption: clusters are the same size and shape. Here is a broad scattered cloud next to a small tight one. Run k-means to convergence.
  7. 36.5s: The boundary lands halfway between the centers, and the tight cluster steals nine points from the broad one. K-means cannot say a cluster is wide; distance is its only language.
  8. 42.8s: The fix is to let each cluster be a gaussian with its own spread and its own share of the data, and to make membership a probability instead of a verdict. Fitting this is the expectation maximization dance from the generative modeling book.
  9. 48.8s: Same two steps, but soft. Watch the circles learn: one grows to spread sixty four hundredths, the other shrinks to sixteen, and the weights settle at seventy thirty. The boundary slides off the small cluster.
  10. 54.8s: Every point k-means stole now sits on the correct side: one hundred out of one hundred. K-means is just this model with the spreads forced equal and the probabilities rounded.
  11. 61.4s: And that closes the tour: memory in nearest neighbors, questions in trees, committees in ensembles, margins in support vector machines, and structure without labels here. Five small machines, and most of applied learning is one of them in disguise.

#### explained-llms — "Language Models" accent #c79100

## ch1 Tokenization: Byte Pair Encoding [tokenization] audio 116.285s, 10 cues
BLURB: Text is chopped into tokens by merging the most frequent pair, again and again — a real byte-pair run compressing a sentence live.
  1. 0.5s: A language model does not read letters, and it does not read whole words either. Before anything else, text has to be chopped into tokens. Here is the sentence we will chop.
  2. 6.4s: One extreme is single characters: a tiny vocabulary, but sequences get painfully long. The other is whole words: short sequences, but a giant vocabulary that still trips on anything unseen.
  3. 12.5s: Byte pair encoding threads the needle with one absurdly simple rule, borrowed from data compression: find the most common adjacent pair of tokens, and glue it into a single new token.
  4. 19.5s: Watch the first merge. The pair a-t shows up six times, more than any other, so it becomes one token. Every a-t on the tape collapses at once, and the tape gets shorter.
  5. 25.3s: Now the winner is that new token followed by a space, then t-h, then t-h plus e. Notice what is happening: the merges are discovering that t-h-e is a unit worth having.
  6. 31.4s: Let the rule keep firing. Common chunks fuse into fewer, fatter tokens. The word the, with its space, becomes one chip, and the repeated phrase around it merges into a single giant token.
  7. 37.6s: Forty nine characters, now carried by thirteen tokens. Frequent stuff gets short; rare stuff stays in small pieces. That is the whole trade, tuned automatically by counting.
  8. 43.6s: This is why a model can spell a word it never saw in training: worst case, it falls back to characters, which are always in the vocabulary. Nothing is ever truly out of vocabulary.
  9. 51.8s: Tokenization is the quiet first step under every language model: a compression scheme, learned by merging the most common pairs, that turns raw text into the units the network actually predicts.
  10. 57.8s: And predicting the next of those units, over and over, is the entire training objective. That is where we go next.

## ch2 Next-Token Prediction as Compression [next-token] audio 123.297s, 10 cues
BLURB: The whole training objective is predicting the next token, and predicting well is compressing well, measured in real bits saved.
  1. 0.5s: Here is the entire training objective of a language model, and it is almost insultingly simple. Given the text so far, predict the next token. That is it. Everything else is scale.
  2. 6.4s: It sounds too weak to produce intelligence. The reason it is not hides in an old idea: predicting well and compressing well are the same thing.
  3. 13.1s: Take a real, tiny model that just counts which character follows which. After the letters t and h, it has learned the next letter is very probably e. It is confident, and it is right.
  4. 19.5s: The cost of a correct guess is measured in bits: minus the base-two logarithm of the probability it assigned. A near-certain, correct e costs about one bit. A confident correct guess is cheap.
  5. 25.9s: Now a hard spot. After a space, the model has no idea the word is brown. It spreads its bet thin, so the true letter gets a low probability, and this one character costs over five bits. Surprise is expensive.
  6. 33.4s: Run across the whole sentence and add the bits up. Compare against a model that knows nothing and guesses uniformly: with twenty eight symbols, that blind code pays almost five bits every single character.
  7. 39.6s: The little counting model pays two point three. That gap, nearly five down to two, is the model’s knowledge, measured in nothing but saved bits. Better prediction is literally smaller files.
  8. 45.8s: Now scale the intuition. To keep shaving bits off real text, a predictor has to learn grammar, then facts, then reasoning, because each is another regularity it can exploit. Squeezing the next token forces it to model the world that produced the text.
  9. 54.4s: So next-token prediction is not a toy task. It is compression, and compression of a rich enough signal demands understanding. The whole field is that one bet, taken very seriously.
  10. 60.4s: Which raises the obvious question: how much better does this bet get as you scale it up? That has a startlingly clean answer.

## ch3 Scaling Laws [scaling-laws] audio 114.105s, 9 cues
BLURB: Redraw loss versus compute on log-log axes and the discouraging elbow becomes a straight line — the published power law you can plan around.
  1. 0.5s: If next-token prediction is compression, the natural question is: how much better does it get as you spend more? More compute, more data, more parameters. Does it plateau, or keep paying?
  2. 6.4s: Plot test loss against training compute the ordinary way, and you get a discouraging elbow: fast gains that seem to flatten. It looks like diminishing returns hitting a wall.
  3. 12.7s: But redraw it with logarithmic axes, stretching each factor of ten to equal width. The same discouraging curve becomes something remarkable: a straight line, holding across many orders of magnitude.
  4. 19.7s: A straight line on a log-log plot means a power law: loss falls as compute raised to a small negative exponent. This is a real published finding, from Kaplan and coworkers in twenty twenty, over more than six orders of magnitude.
  5. 26.1s: The slope is the exponent, about minus point zero five. Shallow, but it never turns over. Every tenfold increase in compute buys the same fixed drop in loss, again and again.
  6. 32.5s: This is why the field bet so heavily on scale. A straight line is a prediction: extend it, and you can forecast the loss of a model far bigger than any yet built, before spending a cent on training it.
  7. 39.1s: The honest caveats matter. It measures loss, not wisdom. It assumes data and model grow together. And every real curve eventually bends. But within its range, it has held with unsettling precision.
  8. 46.7s: Scaling laws turned a vague hope into a straight line you could plan around: predictable, smooth improvement from raw scale. That line, more than any single idea, is why the models kept getting bigger.
  9. 52.9s: And somewhere along that line, the models began doing something no one trained them to do: learning a brand new task from the prompt alone. That is next.

## ch4 In-Context Learning [in-context-learning] audio 100.079s, 9 cues
BLURB: Show a trained model a few examples and it learns a brand new task from the prompt alone, weights never touched.
  1. 0.5s: Somewhere along the scaling curve, something strange appeared. You can teach a trained model a brand new task without touching its weights at all. You just show it a few examples in the prompt.
  2. 6.5s: To see it cleanly, here is a toy task the model has never met: a hidden rule turning each input number into an output number. Learn the rule from examples, then answer a new one.
  3. 12.5s: One example in the prompt. From a single point, the best you can do is guess it is constant. The query prediction is way off, and the error meter is tall. Not enough evidence yet.
  4. 19.2s: Now feed in more pairs, one at a time. The fitted line pivots to catch them, the query prediction slides toward the true answer, and the error meter drops with every example added.
  5. 25.5s: Keep going. By a handful of examples the line has locked onto the hidden rule. Reveal the truth, and the model’s line sits right on top of it.
  6. 31.5s: Here is the part that unsettles people. Not one weight changed. The whole adaptation happened inside a single forward pass, as the model read the prompt. The examples reconfigured its behavior, not its parameters.
  7. 38.9s: That is in-context learning. A big enough next-token predictor doesn’t just store patterns, it learns to run little learning algorithms on the fly, using the prompt as its training set. Nobody put that there on purpose.
  8. 47.9s: In-context learning is why prompting works at all: the model adapts to your task from the examples you give it, weights frozen, in one pass. An emergent skill that scale handed us for free.
  9. 54.1s: One thing is still missing though. A model trained only to predict text will happily predict unhelpful text. Aligning it with what people actually want is the last chapter.

## ch5 RLHF: Learning from Human Feedback [rlhf] audio 134.212s, 10 cues
BLURB: Turn human comparisons into a reward model, then reinforce toward it — and inherit every hazard of optimizing a proxy.
  1. 0.5s: A model trained only to predict text will happily predict text that is rude, wrong, or useless. It learned what is likely, not what we want. Closing that gap is called alignment.
  2. 6.5s: The trouble is that good is hard to write down as a formula. So we do not write it down. For any prompt, ask the model for several answers, and simply ask a person which they prefer.
  3. 12.9s: Comparisons are cheap and honest: this answer beats that one. We never ask for a score, just a winner. From thousands of these, we train a reward model to predict which answer a person would pick.
  4. 20.3s: Watch the reward bars form. Each comparison nudges the winner up and the loser down. Slowly, from nothing but who-beat-whom, the model builds a score that ranks the answers the way people do.
  5. 26.9s: The accuracy curve tracks how often the learned reward agrees with true human ranking. It climbs from a coin flip toward near-perfect. The reward model has become a stand-in judge.
  6. 33.1s: Now the reinforcement step. Treat that reward as the signal, and shift the model’s own odds toward answers the judge scores highly, exactly the policy nudge from earlier chapters. The blue bars are the model learning to prefer good answers.
  7. 39.3s: Reveal the hidden truth: the two answers the policy now favors are genuinely the two best. Average quality climbed from near zero to almost the maximum, and the reward model never saw a single quality number.
  8. 45.7s: But remember chapter five of the last book. The policy now optimizes the reward model, not real human preference, and the reward model is only a proxy. Push too hard and it games the proxy: fluent, confident answers that the judge loves and a person would not. Measures get gamed here too.
  9. 55.1s: That is learning from human feedback: turn comparisons into a reward, then reinforce toward it. It is how a raw text predictor becomes a helpful assistant, and it inherits every hazard of optimizing a proxy for what we truly want.
  10. 61.3s: Tokenize, predict, scale, adapt from the prompt, and align with feedback. Five moves, one machine. That is the language model, explained.

#### explained-ml — "Machine Learning" accent #a78bfa

## ch1 Gradient Descent: rolling downhill, three ways [gradient-descent] audio 50.898s, 10 cues
BLURB: Loss is a landscape. Training is a search for the lowest valley.
  1. 0.5s: Loss is a landscape. Training is a search for the lowest valley.
  2. 7.2s: At every point, the slope of the ground says: downhill is this way.
  3. 14s: Gradient descent follows the slope blindly, one step at a time.
  4. 19.8s: In a narrow ravine, every step overshoots the wall. It rattles — and crawls.
  5. 26.4s: Momentum makes the ball heavy: each step remembers the ones before.
  6. 32.2s: The rattle cancels out, speed builds — it overshoots the deep valley, then settles in.
  7. 38.2s: Adam sizes the step for each direction from its own recent history.
  8. 44s: Timid across the steep walls, bold along the quiet valley — it cuts straight down the ravine.
  9. 50s: Same landscape, three searches — the shape of the loss decides the race.
  10. 56.6s: Momentum arrives fast but swings past; Adam glides in; plain descent is still crawling.

## ch2 Backpropagation: blame, passed backward [backprop] audio 85.263s, 12 cues
BLURB: A neural network is just a chain of tiny computations — multiply, add, clamp, compare.
  1. 0.7s: A neural network is just a chain of tiny computations — multiply, add, clamp, compare.
  2. 6.1s: Here an input of one point five flows through three knobs — two weights and a bias — to a prediction, then a score.
  3. 10.4s: Forward: the numbers simply flow. weight times input plus bias is exactly one, and the activation waves it through.
  4. 15.7s: The prediction lands at one point two; the target was one. The loss scores the miss: half the error squared, about point zero two.
  5. 21.6s: Backward: blame flows the other way. The first piece is easy — prediction minus target, point two zero.
  6. 25.8s: Each edge multiplies by its own local slope. For the second weight that slope is the activation, so its gradient is point two times one.
  7. 31s: No node ever sees the whole network — only its local slope. The chain rule stitches them together: the first weight's gradient comes out at point three six.
  8. 37.8s: Update: nudge every weight downhill by the learning rate times its gradient — here a step of point four.
  9. 43.2s: That one nudge cut the loss from point zero two to point zero zero seven. Watch the corner.
  10. 47.7s: Again: forward, backward, nudge. Same dance — only the numbers change.
  11. 53.3s: And faster. The miss shrinks every lap — from point zero two, to point zero zero seven, to point zero zero one.
  12. 61.4s: That's training — the chain rule, alive, thousands of times a second.

## ch3 Attention: every token asks every other [attention] audio 56.888s, 12 cues
BLURB: Every word starts as a point in embedding space.
  1. 0.5s: Every word starts as a point in embedding space.
  2. 5.6s: Six tokens, six vectors — no context yet.
  3. 9.2s: Each word makes three copies of itself: a Query, a Key, and a Value.
  4. 14.8s: Queries ask; Keys answer; Values carry the content.
  5. 19.2s: How much should “sat” listen to each word? Compare its Query against every Key.
  6. 25.6s: “sat” and “cat” line up — a big raw score.
  7. 31s: Softmax turns scores into a spotlight — positive weights that sum to 1.
  8. 36.6s: “sat” spends 70% of its attention on “cat”.
  9. 41.2s: Now blend the Values — each scaled by its weight — into one new vector for “sat”.
  10. 47.2s: The output for “sat” is mostly “cat”, plus a memory of the rest.
  11. 52.2s: Every token does this at once — each row is one word attending to all the others.
  12. 58.4s: That is self-attention: a soft, differentiable lookup table.

## ch4 Diffusion: drown it in noise, learn the way back [diffusion] audio 46.858s, 5 cues
BLURB: Real data lives on a thin curve through a huge empty space. These two moons stand in for photographs — everything off the curve is a picture that never happens.
  1. 0.5s: Real data lives on a thin curve through a huge empty space. These two moons stand in for photographs — everything off the curve is a picture that never happens.
  2. 8s: Now drown it on purpose. Add a little noise, then a little more, hundreds of times — and watch the structure melt until the moons are just a fog.
  3. 17.6s: Here is the trick: a network watches that drowning at every stage, and learns exactly one thing — at this noise level, which direction is less noisy.
  4. 28.2s: Generation is the same walk, run backwards. Start from pure fog, and take step after step in the direction the network learned.
  5. 38s: The fog condenses back onto the curve, and two moons appear that never existed anywhere. Sampling is denoising — that is the whole idea.

#### explained-sequence-models — "Sequence Models" accent #e07b1a

## ch1 The Vanishing Gradient [rnn-vanishing] audio 109.552s, 9 cues
BLURB: A real twenty-step recurrent net whose exact gradient products die to under one percent — the flaw that shaped a decade.
  1. 0.5s: Before transformers, sequences were read one step at a time. A recurrent network carries a single hidden state, folding each new input into everything it has seen so far.
  2. 6.5s: Here is a real one, unrolled: twenty steps of the same little cell, each squashing its memory and the next input through a tanh. Watch the state ripple forward.
  3. 12.6s: To learn, blame has to travel the other way. If step twenty got something wrong, how much was step one responsible? The answer is a chain of multiplications, one per step.
  4. 18.4s: Every factor in that product is the recurrent weight times the slope of the tanh, and the slope is always less than one. Multiply twenty numbers below one and you get almost nothing.
  5. 24.9s: These bars are the actual gradient magnitudes from this run, on a log scale, sweeping back from the end. One step back, ninety percent survives. Twenty steps back, less than one percent.
  6. 31.1s: That is the vanishing gradient. The network can still see the distant past — the state is right there — but it can no longer learn from it. Blame starves before it arrives.
  7. 37s: The obvious fix fails. Crank the recurrent weight up to one point six and the tanh saturates: its slope collapses toward zero, and the same run now delivers a billionth of the signal.
  8. 43s: You are trapped on a knife edge. In the linear regime the product behaves like the weight raised to the number of steps: below one it vanishes, above one it explodes. Neither trains.
  9. 50.6s: Every long dependency has to survive this gauntlet of multiplications. The rest of this book is a tour of the escape routes: gates that protect memory, and attention that skips the chain entirely.

## ch2 LSTM Gates [lstm-gates] audio 94.644s, 9 cues
BLURB: A gated cell remembers one bit through seventeen steps of noise while a plain RNN forgets — the real equations, run live.
  1. 0.5s: Here is the simplest task that breaks a plain recurrent net. A signed clue arrives at step one. Then sixteen steps of pure noise. Then you must recall the clue.
  2. 6.3s: The long short term memory cell solves it with a conveyor belt. The cell state runs straight through, and nothing touches it except two gates: one decides what to erase, one decides what to write.
  3. 12.5s: The forget gate multiplies the state by a number near one — this trained cell keeps ninety nine point seven percent of its memory every step. No tanh in the path, no shrinking product.
  4. 18.1s: The input gate stays slammed shut for noise, and swings open only when the marker fires. Write once, then lock the door.
  5. 24.3s: Now run the real equations. The marker fires, the input gate opens for exactly one step, and the cell state jumps to one. Then watch: sixteen steps of noise, and the belt just carries it.
  6. 30.3s: Seventeen steps later the memory reads zero point nine five. The gates did not fight the noise. They simply never let it in.
  7. 35.7s: Feed the identical sequence to a plain tanh recurrent net and here is its state, in red. The marker spikes it — and then every noisy step overwrites a little more, because everything shares one channel.
  8. 41.7s: By the end the plain net sits at minus zero point one — deep inside its own noise band. Ask it what the clue was, and it genuinely does not know.
  9. 49.5s: That is the whole trick: replace the multiplied chain with an additive belt, and put learned locks on the doors. Gated memory ruled sequence models for twenty years — until something skipped the belt entirely.

## ch3 Why Attention Won [recurrence-vs-attention] audio 92.415s, 9 cues
BLURB: Path lengths and parallelism: why one hop at any distance beat a bucket brigade of hand-offs.
  1. 0.5s: Take one sentence. The keys that I left on the kitchen table yesterday were lost. To conjugate that verb, you must remember the keys — nine words back.
  2. 6.5s: A recurrent network can only pass messages between neighbors. So the keys must be relayed through every word in between — a bucket brigade, nine hand-offs long.
  3. 12.5s: Each hand-off leaks. With the friendly attenuation from last chapter, ninety percent per hop, only thirty nine percent of the signal completes the trip. At fifty words, half a percent.
  4. 18.8s: Attention changes the wiring. The verb does not wait for a relay. It reaches directly back and pulls the keys forward itself — one hop, at any distance.
  5. 24.4s: One hop keeps ninety percent whether the distance is nine words or nine hundred. The path length between any two tokens drops from the distance between them to exactly one.
  6. 30.2s: And it is not one privileged pair. Every token draws its own arcs to every earlier token, all in the same layer. The bucket brigade becomes a switchboard.
  7. 36.8s: There is a second, more brutal advantage. Recurrence is sequential: step twelve cannot start until step eleven finishes. Attention computes every position at once. Watch them race.
  8. 42.6s: Twelve clock ticks against one. On hardware built to multiply thousands of numbers in parallel, that gap is the whole ballgame — it is why the big models could be trained at all.
  9. 50.4s: Shorter paths for the gradient, full parallelism for the hardware. That trade is why recurrence lost. How attention actually computes those arcs is its own story — and this shelf tells it in the transformers book.

## ch4 CTC and Beam Search [ctc-beam] audio 96.409s, 8 cues
BLURB: An exactly-enumerated CTC lattice where greedy hears silence and beam search recovers the answer eighteen times more probable.
  1. 0.5s: Speech models face an awkward mismatch: six frames of audio, but maybe two letters of answer. Nobody tells you which frame belongs to which letter.
  2. 6.6s: Connectionist temporal classification answers with a lattice. Each column is a frame; each dot is a symbol the model might emit there, sized by its real probability. A special blank means say nothing.
  3. 13s: The obvious decoder is greedy: take the likeliest symbol in every column. In this lattice, blank narrowly wins all six frames. Greedy concludes that nothing was said.
  4. 19.2s: But a transcript is not one path. Repeats collapse and blanks vanish, so many alignments spell the same words. Here are just a few of the paths that all read A then B.
  5. 25.2s: Sum every alignment for every transcript — all seven hundred twenty nine of them, exactly — and the silence greedy chose has probability zero point zero zero seven. A then B has zero point one three. Eighteen times more likely.
  6. 32.2s: Exact summation blows up on real vocabularies, so decoders use beam search: keep the three best transcripts so far, extend each into the next frame, sum the alignments that merge, and prune the rest.
  7. 38.2s: Watch the beams diverge from greedy. By frame two, the letter A has overtaken silence. By frame four, A then B takes the lead and never gives it back. The beam finds what greedy threw away.
  8. 46.4s: The lesson generalizes far beyond speech: the likeliest single path and the likeliest answer are different questions. Whenever many derivations share one meaning, you must sum before you argue — or search as if you had.

#### explained-training — "Training" accent #1f6fb2

## ch1 Ill-Conditioning [conditioning] audio 122.881s, 13 cues
BLURB: Why one learning rate can't serve two curvatures: the condition number of the loss is the exact slowdown factor, and momentum and Adam are two ways of shrinking it.
  1. 0.5s: Here's a loss surface with a problem. Along one axis the valley is gentle. Along the other, it's twenty-five times steeper.
  2. 7.6s: Those two curvatures are the eigenvalues of the bowl. Their ratio, twenty-five here, is called the condition number.
  3. 14.8s: Gradient descent has one knob: the learning rate. Watch what the shape of this bowl does to it.
  4. 20.4s: Play it safe with a tiny step, and the steep axis settles fast — but the shallow axis barely moves. Two hundred steps later, we're still crawling toward the minimum.
  5. 28.8s: Turn the knob past a critical threshold, set by the steepest curvature, and every step overshoots by more than the last. The path zigzags out of the valley and diverges.
  6. 36.8s: The best you can do sits just under that threshold. Even tuned perfectly, both axes need about fifty steps to arrive.
  7. 43.8s: Why is this so hard? Split the bowl into its two axes. Each one is a simple parabola with its own safe range of learning rates.
  8. 50.6s: The steep axis only tolerates tiny steps, so its safe window is narrow. One shared learning rate has to fit inside it — and the shallow axis is starved.
  9. 58.4s: Tuned for the steep axis, the steep coordinate lands in one step — and the shallow one takes ninety-seven. On a round bowl, one step would do. The condition number is the slowdown factor.
  10. 67.2s: Momentum changes the math. Velocity accumulates along the shallow axis while the zigzag cancels itself out — the same bowl now takes about sixteen steps.
  11. 74.8s: The classical result says exactly this: momentum shrinks the effective gap from the condition number down to its square root.
  12. 80.8s: Adam goes further and gives each axis its own step size. Rescale the axes that way, and the stretched bowl literally becomes round — an easy problem again.
  13. 89.8s: That's the secret behind every optimizer trick: none of it is magic. They're all strategies for coping with ill-conditioned, stretched-out valleys.

## ch2 Learning-Rate Schedules [lr-schedules] audio 111.782s, 14 cues
BLURB: Real stochastic descent under constant-high, constant-low, and cosine schedules — big steps travel, small steps land, and a warmup ramp keeps a cold start from exploding.
  1. 0.5s: Training has one dial you can never skip: the learning rate — how far each step moves. And nothing says it has to stay fixed.
  2. 7.5s: A schedule is the learning rate as a function of the step. Hold it high, hold it low, or glide from high to low along a cosine.
  3. 14.9s: The arena is a noisy bowl: every gradient we measure arrives with a random shove. Let's run real descent at the constant high rate.
  4. 21.6s: It races downhill — most of the distance is gone within a couple dozen steps.
  5. 27s: But it never lands. Near the bottom the noise stops averaging out, and the ball just orbits the minimum in a jitter cloud whose radius is set by the rate.
  6. 33.8s: Averaged over the last hundred steps, it sits about a third of a unit from the bottom. Fast — and permanently restless.
  7. 40.5s: Now the constant low rate, from the same start. Each step is twenty five times smaller, so the jitter cloud all but vanishes.
  8. 47s: But three hundred steps later it's still crawling down the slope. Small steps buy precision and pay for it in time.
  9. 53.2s: The cosine schedule takes both halves of the bargain: open at the high rate to travel, then decay so the noise floor falls with you.
  10. 59.7s: Same start, same noise. It sprints like the high run, then settles like the low one — and lands closer than either.
  11. 66s: The averaged final losses tell the story: about six hundredths for high, one hundredth for low, and under five thousandths for the cosine glide.
  12. 73.8s: One honest wrinkle remains. Out on the steep rim of the bowl, opening at a huge rate from a cold start doesn't converge at all — it explodes.
  13. 80.8s: A few warmup steps fix it: ramp the rate up gently while you cross the steep ground, then run at full speed. Same peak rate, opposite fate.
  14. 89.8s: That's the whole craft of a schedule: big steps to travel, small steps to land — and a gentle start so you survive the beginning.

## ch3 Batch Size and Noise [batch-noise] audio 117.399s, 12 cues
BLURB: Sixty-four noisy points, one bowl-shaped loss: the fan of per-example gradients collapses at the root-B rate, then cheap noisy steps beat smooth ones per example seen.
  1. 0.5s: Here is an honest little training problem: sixty four noisy points, and a line with two knobs — a slope and an intercept — trying to fit them.
  2. 7.7s: Every possible line is one point on this map. Height is the average mistake over all sixty four points, and the best fit sits at the bottom of the bowl.
  3. 15.1s: Now ask each point, alone, which way it wants the knobs to move. You get sixty four different answers — every example tugs the parameters its own way.
  4. 22.7s: The true gradient is simply the average of those tugs. A minibatch averages just a few of them — right on average, but with leftover noise.
  5. 29.9s: How much noise? We measured the spread of four hundred batch estimates: averaging shrinks it like one over the square root of the batch size. One ring each for batches of one, eight, and sixty four.
  6. 37.8s: Now train for real. Three runners leave the same starting line with the same learning rate. The only difference is how many examples each step averages: one, eight, or sixty four.
  7. 44.3s: Batch one staggers drunkenly — each step trusts a single noisy point. Batch eight wobbles. Batch sixty four glides straight down the bowl, and the fitted line snaps onto the data.
  8. 54.5s: So bigger batches win? Careful. Every step of batch sixty four reads sixty four examples. Steps are not the honest unit of cost — examples are.
  9. 61.6s: Charge each run for the data it reads, and the story flips. Per example seen, the cheap noisy steps of batch one race ahead — while batch sixty four is still paying for its very first move.
  10. 69.2s: Batch eight lands in between: enough averaging to settle, cheap enough to take many steps. In practice, that middle ground is where most training lives.
  11. 76.8s: So batch size is a dial, not a virtue: it buys smoothness at the square root rate, and it charges you examples for every bit of it.
  12. 83s: And a little noise is not the enemy — jittery, cheap steps see more of the data per unit of work. That is the trade every training run makes.

## ch4 Bias and Variance [bias-variance] audio 123.762s, 13 cues
BLURB: Resample the training set thirty times and error splits in two: fits wrong the same way every time, and fits wrong a different way each time — decomposition verified to the third decimal.
  1. 0.5s: Twelve noisy points, one flexible fit — degree nine, real least squares. It threads the data and looks perfectly convincing.
  2. 7.2s: But underneath sits a smooth truth plus noise, and your twelve points were one roll of the dice.
  3. 13.7s: So roll the dice again. Same truth, same noise, a fresh sample of twelve — and the flexible fit whips into a completely different curve.
  4. 20.8s: Do it thirty times. Each training set gets its own degree nine fit, and together they make this cloud of spaghetti — the curve depends wildly on which points you happened to draw.
  5. 28s: That spread is variance. Yet average all thirty curves, and the mean hugs the hidden truth — on average, the flexible model is barely wrong at all.
  6. 34.8s: Now hand the same thirty datasets to a stiff model — a plain parabola. The thirty fits land almost on top of each other; the spread nearly vanishes.
  7. 41.6s: But their average misses the bends of the truth, and no amount of extra data fixes that. Being wrong the same way every time is bias.
  8. 48.2s: Freeze one input and take a vertical slice. Every dot is one model answering there — thirty stiff answers, thirty flexible answers.
  9. 54.9s: The stiff dots cluster tightly in the wrong place; the flexible dots scatter widely around the right place. Bias versus variance, in one slice.
  10. 61.4s: Now do the accounting. Expected squared error splits exactly into three parts: squared bias, variance, and the noise you can never remove.
  11. 68.3s: And the numbers really add up, to the third decimal. The stiff model pays mostly in bias; the flexible one pays mostly in variance — and both carry the same noise floor.
  12. 75.3s: So error has two habits: being wrong the same way every time, and being wrong a different way each time. Every modeling choice trades one habit for the other.
  13. 83.3s: And that's the whole book. Loss is a stretched valley, so shape your steps; schedules cool the search; batches trade noise for speed; and in the end, you balance the two habits of error.

#### explained-transformers — "Transformers" accent #e07b1a

## ch1 Embeddings [word-embeddings] audio 89.211s, 13 cues
BLURB: A toy vector space where similar words cluster, cosines measure meaning, and king minus man plus woman really does land on queen.
  1. 0.5s: A language model never reads words. Before it can do anything, every word must become a list of numbers — a vector.
  2. 6.6s: Here are sixteen toy words. Each one is hand built from just four features: gender, royalty, size, and edibility.
  3. 13.2s: Lay each vector out flat, through two directions of that little space, and watch where the words land.
  4. 19.2s: Similar words settle near each other. The animals gather here, the royals over there, and the foods keep to themselves.
  5. 25.8s: Distance is similarity, and we can measure it: the cosine of the angle between two vectors, back in all four dimensions.
  6. 32.2s: Cat and dog lean the same way, a cosine of about zero point six. Cat and apple barely agree, about zero point two.
  7. 38.8s: Now for the strange part. In this space, directions carry meaning too.
  8. 44s: Take king, subtract man, and add woman. That is real arithmetic on the four numbers underneath each word.
  9. 50.8s: The result lands almost exactly on queen — the nearest word in the whole vocabulary. The gender direction carried the meaning.
  10. 58s: And it is not a one off. Dog minus puppy points from young to grown up.
  11. 63.6s: Add that same arrow to kitten, and you land on cat. Same direction, different animal.
  12. 70s: These sixteen vectors are a toy. Real embeddings have hundreds of learned dimensions, and nobody names the axes. But the geometry works the same way.
  13. 77.6s: Meaning is geometry. The model never sees a single word — only these directions, and everything that follows builds on them.

## ch2 Positional Encoding [positional-encoding] audio 82.848s, 12 cues
BLURB: Attention sees a bag of tokens — until each position gets a sinusoidal fingerprint added to its embedding, letting order ride along with meaning.
  1. 0.5s: Attention has a blind spot: it treats a sentence as a bag of tokens.
  2. 5.6s: Shuffle the words and every attention score comes out exactly the same. To the model, order is invisible.
  3. 11.6s: The fix is almost cheeky: give every position its own fingerprint vector, and simply add it to the word's embedding.
  4. 18.4s: This is the actual fingerprint table: one row per position, one column per dimension, sines and cosines all the way down.
  5. 25.6s: Read it by columns and each column is a wave. The first columns oscillate fast, and the wavelength stretches as you move right.
  6. 31.4s: Pull three columns out and the pattern is plain: a fast wave, a medium wave, and a slow drift.
  7. 37s: It works like the hands of a clock, or like binary counting: quick digits tick on every step, while slow digits mark the long haul.
  8. 43.9s: Now read it by rows. Position eight and position twenty look nothing alike — every row is a unique fingerprint.
  9. 50.6s: But nearby rows do look alike. Plot the similarity between two fingerprints against their distance, and it falls off smoothly.
  10. 57.2s: So the model can judge near from far just by comparing fingerprints — no counter required.
  11. 62.6s: Add the fingerprint to the embedding, and order rides along with meaning, in the same vector.
  12. 68.2s: That is positional encoding: no learned parameters, just sinusoids — and a bag of tokens becomes a sequence.

## ch3 Multi-Head Attention [multi-head-attention] audio 112.663s, 13 cues
BLURB: Three attention heads read the same sentence and find three different relations — position, reference, and description — then mix back into one stream.
  1. 0.5s: You already know the trick: every word sends out a query, compares it with every key, and softmax turns the scores into a spotlight of weights.
  2. 7.2s: In this sentence, one head has found a referent: the word it spends seventy percent of its attention on cat.
  3. 12.6s: But a single head holds a single matrix of weights — one pattern, one relation. Position, reference, and description all compete for the same spotlight.
  4. 19s: So the transformer splits its attention. The same eight tokens are handed to three heads in parallel, each with its own smaller queries and keys.
  5. 25.2s: Same sentence, three lanes — and each lane is free to learn a different conversation.
  6. 29.4s: Head one turns out to track position. Every word leans on the word just before it — about ninety percent of its weight lands one step back.
  7. 36.4s: Head two is the one you already met. It resolves references: the word it locks onto cat, while every other row stays diffuse and quiet.
  8. 43s: And head three follows description: so points at tired with seventy four percent of its weight, and tired reaches back to the cat it describes.
  9. 50s: Each head is really just a matrix of weights. Here is head one as a heat map: one bright stripe below the diagonal. The matrix and the arcs are the same object.
  10. 57.4s: Every head runs the exact formula you learned last chapter — softmax of query times key over root d — just with its own tiny learned projections.
  11. 63.6s: Now each head has written its own version of every word. Concatenate the three answers, then mix them with one more learned matrix.
  12. 70.6s: Three lanes weave back into a single stream — and every token now carries position, reference, and description at once.
  13. 77.6s: That is multi-head attention: many small conversations held in parallel, then stitched back into one. Every transformer layer you will meet does exactly this.

## ch4 The Residual Stream [residual-stream] audio 114.335s, 13 cues
BLURB: One vector per token rides a highway through the whole model — each block just reads it, computes a small edit, and adds it back.
  1. 0.5s: A transformer is dozens of layers deep. So here's a puzzle: how does anything survive a journey through that many transformations?
  2. 7.6s: Watch what happens if each layer simply replaces the state. Apply a squashing transformation over and over, and the signal shrinks toward nothing.
  3. 15.1s: By the last layer there's almost nothing left to read. Deep stacks that overwrite their input end up forgetting it.
  4. 21.5s: The fix is one plus sign. Each layer keeps the original and adds a small edit on top. The state is never replaced, only amended.
  5. 28.6s: Same kind of squashing layers, but now the strength readout holds steady. The original signal rides through untouched underneath the edits.
  6. 36.6s: This running state is called the residual stream. Picture it as a highway: one vector per token, flowing through every block in the model.
  7. 44s: Each block is an editor. It reads the stream, computes a small update, and adds it back in. Watch the bars literally sum.
  8. 51.5s: Attention blocks are the editors that look around. They pull information in from the other tokens' streams before writing their edit.
  9. 58.5s: Feed forward blocks edit in place. No looking around — just a computation on this one token's own vector, added back to the stream.
  10. 65s: Block after block, the same story: read, compute, add. The vector that arrives at the end is the sum of the input and every edit along the way.
  11. 72.8s: And it's not one highway. Every token has its own stream, all running in parallel — and attention is the only place they exchange traffic.
  12. 81.4s: So a transformer isn't a pipeline that mangles its input beyond recognition. It's a stack of editors, all writing into one shared manuscript.
  13. 88.9s: Everything a later layer knows, it read from the stream. Everything it decides, it writes there. The residual stream is the model's working memory.

## ch5 Sampling [sampling-temperature] audio 117.261s, 15 cues
BLURB: Real softmax distributions over one prompt show how temperature, seeded sampling, and top-k turn a column of scores into the model's next word.
  1. 0.5s: A language model doesn't end with an answer. It ends with a score for every word it could say next.
  2. 7s: For the prompt, the cat sat on the, mat scores highest — but floor, chair, and even moon get scores too.
  3. 13.8s: The softmax turns scores into probabilities: exponentiate each score, divide by the total. Every word now owns a slice of certainty.
  4. 21s: Hiding in that formula is a dial: temperature. It divides every score before the exponential — and it changes everything.
  5. 27.2s: Turn it cold and the tallest bar takes almost everything. At temperature zero point two, mat holds nearly all of the probability.
  6. 33.6s: Turn it hot and the bars flatten toward uniform. At temperature three, even the moon gets a real chance.
  7. 40.4s: Settle at a moderate temperature and you face a real choice: always take the best word, or roll the dice.
  8. 46.2s: Greedy always picks mat. Sampling draws from the bars — watch ten real draws land: mostly mat, but not always.
  9. 53.4s: That one difference compounds. The greedy path retells the exact same sentence, every single time.
  10. 58.8s: The sampled path takes one different turn — and the whole continuation changes into a sentence greedy would never say.
  11. 65.2s: Top k is the compromise: keep only the three best words, cut the tail off entirely, and renormalize what survives.
  12. 71.8s: The three survivors absorb the tail: the best word rises to about three quarters, and the silly answers are simply gone.
  13. 77.8s: So one dial trades reliability for surprise. Cold for facts and code, warm for stories and brainstorms.
  14. 83.6s: And that's the whole machine: embeddings give words directions, positions give them order, many heads read the sentence at once, each layer edits one stream — and at the very end, a choice.
  15. 91.6s: The next word is never looked up. It's weighed, warmed, and finally — chosen.

#### explained-vision — "Computer Vision" accent #198a8a

## ch1 A Bank of Detectors [vision-kernels] audio 86.147s, 11 cues
BLURB: Three real kernels convolve a real image — and the checkerboard hides from both edge detectors exactly.
  1. 0.5s: To a computer, a picture is a grid of numbers. Nothing in this grid says edge, or texture, or shape.
  2. 7.1s: So computer vision starts with a smaller question: what tiny patterns is this grid made of?
  3. 12.4s: A kernel is a three by three patch of weights. This one detects vertical edges: negative on the left, positive on the right.
  4. 19.2s: Slide it across the image, multiply and add at every stop, and it draws a map: bright wherever the picture changes from dark to light sideways.
  5. 26.6s: Look where it fires: the left and right walls of the square. The flat interior stays dark — there is nothing vertical there to see.
  6. 33.2s: A different kernel asks a different question. This one fires on horizontal edges — the top and bottom walls light up instead.
  7. 39.2s: And this one fires on fine checkered texture. The smooth square barely registers, while the patch in the corner blazes.
  8. 45.6s: Notice the quiet trick: the checkerboard is completely invisible to both edge detectors — its alternation cancels their weights exactly.
  9. 52.8s: And here is the part that matters: nobody designs these weights. They start as random noise, and training nudges them until detectors emerge.
  10. 59.8s: One convolution layer is exactly this: a bank of learned detectors, each drawing its own map of where its pattern lives in the image.
  11. 66.4s: The pixels stay put. What flows upward to the next layer is these maps — and reading maps instead of pixels is where vision begins.

## ch2 Keep What Fires [vision-pooling] audio 87.91s, 11 cues
BLURB: A real max pool: shift the image one pixel and 10 map cells change, but 0 pooled cells do.
  1. 0.5s: An edge detector fires at exact positions. But a cat shifted one pixel to the right is still the same cat.
  2. 6.9s: If every downstream layer memorizes exact coordinates, the whole network becomes brittle. Vision needs a way to care less about position.
  3. 12.6s: Max pooling is the blunt, effective answer. Slide a two by two window over the map, and keep only the loudest value in each window.
  4. 19.2s: The map shrinks from ten by ten to five by five. Three quarters of the numbers are gone, but the strongest evidence survives.
  5. 25.4s: Now the experiment. Nudge the bright bar one pixel to the right, and recompute everything downstream of it.
  6. 31.4s: The feature map takes the hit: ten of its one hundred cells change value as the bright columns jump one step sideways.
  7. 38s: And the pooled map? Not a single one of its twenty five cells changed. The shift stayed inside the pooling windows, so the maxima never moved.
  8. 44.6s: That is translation invariance, bought one small step at a time. Each pooling stage forgives a little more misplacement.
  9. 50.4s: Stack convolution and pooling a few times, and one cell deep in the network summarizes a wide patch of the original image.
  10. 56.8s: The price is honest and deliberate: exact position is thrown away. Pooling keeps what fired, and forgets exactly where.
  11. 63s: Detect everywhere, then pool: that pairing is why a network trained on centered cats still recognizes one sitting in the corner.

## ch3 Edges Become Shapes [vision-hierarchy] audio 92.461s, 11 cues
BLURB: A real three-layer stack turns a hollow square into edges, corners, and one blazing shape cell.
  1. 0.5s: Edges are a humble alphabet. Yet stack a few layers of detectors, and a network starts spelling shapes with them.
  2. 6.5s: Here is the raw material: a hollow square, drawn in pixels that mean nothing by themselves.
  3. 11.6s: Layer one runs two edge detectors over the pixels. The vertical map catches the sides; the horizontal map catches the top and bottom.
  4. 18.4s: Layer two never touches a pixel. It reads both edge maps at once, and fires only where a vertical and a horizontal edge share the same small window.
  5. 25.2s: The raw response is smeared — near misses everywhere. A threshold cleans it up: keep only the confident hits.
  6. 31s: Four clean clusters survive — the four corners. Nobody programmed a corner detector; it fell out of two edge maps and a threshold.
  7. 37.4s: Layer three asks a bigger question of the corner map: are there four corners arranged like a square? One template, four taps.
  8. 43.8s: The center cell blazes and everything around it stays dim. Three layers up from raw pixels, square has become a single number.
  9. 50s: Pull back and read the whole ladder: pixels, then edges, then corners, then a shape. Each layer sees a wider window and a more abstract world.
  10. 56.4s: A trained network climbs the same ladder with richer rungs: textures become eyes, eyes become faces. The mechanism is exactly what you just watched.
  11. 63s: That is a feature hierarchy: composition, not magic — detectors reading the maps of other detectors.

## ch4 The Image Becomes a Sentence [vision-patches] audio 90.093s, 11 cues
BLURB: Nine patches become tokens; a real softmax shows far-apart twins finding each other in one hop.
  1. 0.5s: A convolution looks at the world through a keyhole — three pixels wide. Relating two far corners of an image takes it many patient layers.
  2. 7s: Vision transformers make a stranger bet: treat the image as a sentence, and let every part talk to every other part at once.
  3. 12.5s: Cut the picture into nine patches. Each patch is flattened into a plain vector of its sixteen pixel values — a word made of numbers.
  4. 18.7s: A position tag rides along with each patch, because once they are tokens in a row, nothing else remembers where they came from.
  5. 24.6s: Now attention — the same machinery language models use. Every patch scores its similarity to every other patch, and the scores become weights.
  6. 30.8s: Watch the two checkered corners. They sit as far apart as the image allows, yet each gives nearly half its attention to its twin — in a single hop.
  7. 37.6s: The two vertical edge patches find each other the same way. Content decides who talks to whom; distance costs nothing.
  8. 43.6s: And the blank sky patches? Nothing distinguishes them, so they spread their attention almost evenly across the board.
  9. 49.4s: Here is the honest trade. A convolution is born knowing that nearby pixels matter. A transformer has to learn that from scratch — which costs data.
  10. 56s: Feed it enough images, though, and it learns locality and then outgrows it — attending across the whole frame whenever the content asks for it.
  11. 62.2s: Patches to tokens, tokens to attention: the picture became a sentence, and one hop replaced a tower of keyholes.

## ch5 Where the Network Looks [vision-occlusion] audio 93.204s, 11 cues
BLURB: The classifier is re-run 36 times behind a sliding gray patch — the saliency map is the receipt.
  1. 0.5s: Our little network from the last chapter looks at this picture and says: square, full confidence. But which pixels earned that verdict?
  2. 6.7s: You cannot trust the network to tell you — it has no words. But you can interrogate it the honest way: change the input, and watch the output.
  3. 12.6s: Cover the top left corner with a gray patch and run the network again. The score falls from one point zero to zero point seven five.
  4. 19s: Exactly one quarter of the verdict vanished — the corner detector under the patch went silent, and the other three kept voting.
  5. 25.2s: Now do it everywhere. Slide the patch across all thirty six positions, rerun the network each time, and record every drop as a map.
  6. 32.4s: This map is called an occlusion saliency map: bright where hiding the input hurt, dark where the network never cared.
  7. 38s: Read what it says. The whole outline matters — every cut along it silences one corner and costs the same quarter of the score.
  8. 44.4s: And the middle of the square is causally worthless: cover it and the score does not move at all. The network never looked there.
  9. 50.2s: One more fact hides in the map: no single patch ever drags the score below zero point seven five. The evidence is spread across four spots.
  10. 56.4s: This is proof by intervention — the same move interpretability researchers call ablation. Break a piece, watch the behavior, and the causes confess.
  11. 62.8s: Kernels found the edges, pooling forgave the shifts, layers built the shape, and now occlusion showed us the receipt. That is computer vision, end to end.


## Appendix B: extra relevant explainers (headers + captions)

## vision-occlusion (69s)
HEADER: Vision Occlusion — where does the network look? The square-detector stack from the feature-hierarchy chapter (Sobel pair → conjunction + threshold → four-corner template, with normalizers frozen from the clean image) is really re-run 36 times, once per position of a 4×4 gray occluder sliding at stride 2. The 6×6 drop map on screen is (base − occluded) / base, computed here. Facts the narration quotes: the clean score is 1.00; covering ANY piece of the outline costs exactly 0.25 (one corner detec
  1. 0.5: Our little network from the last chapter looks at this picture and says: square, full confidence. But which pixels earned that verdict?
  2. 6.7: You cannot trust the network to tell you — it has no words. But you can interrogate it the honest way: change the input, and watch the output.
  3. 12.6: Cover the top left corner with a gray patch and run the network again. The score falls from one point zero to zero point seven five.
  4. 19: Exactly one quarter of the verdict vanished — the corner detector under the patch went silent, and the other three kept voting.
  5. 25.2: Now do it everywhere. Slide the patch across all thirty six positions, rerun the network each time, and record every drop as a map.
  6. 32.4: This map is called an occlusion saliency map: bright where hiding the input hurt, dark where the network never cared.
  7. 38: Read what it says. The whole outline matters — every cut along it silences one corner and costs the same quarter of the score.
  8. 44.4: And the middle of the square is causally worthless: cover it and the score does not move at all. The network never looked there.
  9. 50.2: One more fact hides in the map: no single patch ever drags the score below zero point seven five. The evidence is spread across four spots.
  10. 56.4: This is proof by intervention — the same move interpretability researchers call ablation. Break a piece, watch the behavior, and the causes confess.
  11. 62.8: Kernels found the edges, pooling forgave the shifts, layers built the shape, and now occlusion showed us the receipt. That is computer vision, end to end.

## convolution (62s)
HEADER: Convolution — Sliding Windows That See. All data is precomputed here at module scope from a fixed seed: the 8×8 image (bright half / dark half, seeded texture), both 3×3 kernels, and both 6×6 valid-convolution feature maps. The timeline is a pure function of this data — every frame scrubs exactly (the scrubbability invariant).
  1. 0.5: To a computer, an image is just a grid of numbers — each one a brightness between 0 and 1.
  2. 5.4: This one is half bright, half dark — an edge runs down the middle.
  3. 9.4: Meet the kernel: a 3×3 window of weights. This one is all 1/9 — it takes an average.
  4. 14.8: Lay the window on the image: multiply each overlapping pair, add the nine products — that is one output pixel.
  5. 20.4: Multiply, add, move on. Each stop writes one pixel of a new, smaller image.
  6. 24.4: Here the window straddles the edge — bright numbers on the left, dark on the right — and the average lands in between.
  7. 32.3: Deep in the dark half, every product is tiny — so the sum is, too.
  8. 38.8: Thirty-six stops later: a blur. Averaging smears the hard edge into a soft ramp.
  9. 44.2: Now keep the machine and swap only the weights — a different window on the same image.
  10. 49.4: This Sobel kernel subtracts right from left: silent where neighbors agree, loud where they differ. It sees the edge.
  11. 56.2: A convolutional network learns thousands of these little windows — edge-finders, texture-finders, eye-finders — all from slide, multiply, add.

## nn-scale (55s)
HEADER: The Nearest-Neighbor Problem at Scale — exact search doesn't scale. Real arithmetic at module scope. Brute-force nearest neighbor over N documents with d-dimensional embeddings costs N·d multiply-adds per query. At d = 768: one million documents = 768 million multiply-adds per query — at 10 giga-ops effective single-core throughput that is ~77 ms for ONE query, and a 100-query-per-second service needs 7.7 cores doing nothing else; at 100 million documents one query takes 7.7 seconds. The demo fi
  1. 0.5: Last chapter gave us the goal: find the vectors at the smallest angle to a query. There is one algorithm guaranteed to get it right — compare against everything. Here are four hundred documents.
  2. 6.1: The query arrives, and the scan begins — every single point, one comparison at a time, keeping the best so far. Watch the frontier of certainty crawl across the collection.
  3. 12.1: Four hundred comparisons later, we have the true nearest neighbor, with a proof: nothing was skipped. Exactness bought by exhaustion.
  4. 17.5: Now do the arithmetic at production scale. Each comparison is a dot product over seven hundred sixty eight dimensions. The cost of one query is documents times dimensions — every time.
  5. 23.3: A thousand documents: a tenth of a millisecond — free. A hundred thousand: eight milliseconds — fine. A million: seventy seven milliseconds for a single query. A hundred million: nearly eight seconds.
  6. 29.9: Interactive search gives you a budget of maybe ten milliseconds. Draw that line through the table and brute force dies somewhere past a hundred thousand documents — three orders of magnitude short of a real corpus.
  7. 35.7: And it is linear, which is the cruelest slope: double the documents, double the bill, forever. No cache, no cleverness in the loop saves you — the loop itself is the problem.
  8. 41.7: The escape is to stop demanding proof. If you will accept the right answer almost always, you can skip almost everything — the same bargain hash tables and skip lists made for exact keys, rebuilt for geometry.
  9. 49.7: So the problem statement for the rest of this book: find nearly-nearest neighbors while touching a vanishing fraction of the data. Next chapter builds the structure that does it — a skip list in space.

## autoencoder (68s)
HEADER: The Autoencoder — compress, then reconstruct. All math at module scope: 160 seeded 2-D points spread along a tilted line with noise, and an ACTUAL linear autoencoder trained by gradient descent — encoder w (two numbers to one), decoder v (one number back to two), mean squared reconstruction loss, 150 recorded steps. The tilting line you watch is the real decoder direction finding the data's long axis; the final direction matches principal component analysis to within a degree. Empirics with SEED
  1. 0.5: Here is a strange deal. Each point has two coordinates, but you must describe it with a single number, and then rebuild both coordinates from that one number alone.
  2. 6.3: That is an autoencoder: an encoder squeezes the data through a bottleneck, a decoder inflates it back, and the only teacher is the gap between original and rebuilt.
  3. 12.7: Ours is the smallest one possible: multiply by two weights to get the code, multiply by two more to decode. Geometrically, everything it rebuilds must land on one line through the origin.
  4. 18.7: The weights start random, so the line starts pointing across the data, not along it. Every faint segment is a reconstruction error: the price of the bottleneck, paid point by point.
  5. 24.9: Now descend the gradient of the total squared error. Watch the line swing: shrinking those segments is the whole training signal, and the loss curve records every step of it.
  6. 30.9: The line settles along the data cloud’s long axis. Of course it does: if you may keep only one number per point, keep the position along the direction where the data varies most.
  7. 37: The dashed line is principal component analysis, computed exactly. The trained decoder lies on top of it. A linear autoencoder rediscovers the classic method, purely from the reconstruction game.
  8. 42.8: And the loss does not reach zero. It stops exactly at the noise floor: the sideways scatter that no single number could ever carry. The bottleneck kept the signal and paid the noise.
  9. 48.8: Here is the idea that scales. The code is a coordinate on a learned shape inside the data space. Deep autoencoders bend this line into curved surfaces; the principle never changes.
  10. 56.8: Compress, rebuild, and punish the gap: the autoencoder learns the shape the data actually lives on, with no labels anywhere in sight.
  11. 62.8: But there is a catch we glossed over: nothing organizes the codes themselves. Sample a random code and decode it, and you may land nowhere near the data. Fixing that is the next chapter.

## induction-head (55s)
HEADER: Circuits — an induction head you can read. A minimal two-layer attention circuit, computed honestly at module scope: one-hot token states, a previous-token head (layer 1) whose value path writes "the token before me" into a residual slot, and an induction head (layer 2) whose query is the current token and whose key is that slot — so it attends to the position right AFTER the previous occurrence of the current token, and copies what it finds. All attention weights are real softmaxes over the act
  1. 0.5: Twenty tokens: a random run of ten, then the exact same ten again. Any competent language model learns to exploit this: the moment history repeats, copy what came next last time.
  2. 6.3: Inside real transformers this behavior is carried by a two head circuit famous enough to have a name: the induction head. Here is that circuit, small enough to read completely.
  3. 11.6: Head one does something almost insultingly simple. At every position it attends one step backward, these are its true attention weights, and writes what it sees into a side channel: each token now carries a note saying who stood before me.
  4. 18.3: Head two reads those notes. Standing at the start of the repeat, its query says: find a position whose note names my own token. The only match is the position right after my previous appearance, and the softmax puts weight one point zero there.
  5. 24.5: Then it copies whatever token lives at that spot into the prediction. Look one step ahead in the past, and you have predicted one step ahead in the future.
  6. 30.2: Slide the query across the whole second half and let the two heads compose. Nine predictions, nine correct, every attention weight on screen a real softmax, not an illustration.
  7. 36.2: Notice what you just did: you read an algorithm out of attention patterns. Match the current token in the past, step forward, copy. Three verbs, two heads, zero mystery.
  8. 42.1: Induction heads are the first circuit found in the wild in real language models, and they appear abruptly during training, right when models get suddenly better at using context. Small circuit, large consequences.
  9. 49.6: A circuit is an algorithm you can read off the weights: here, a previous token head composing with an induction head to copy the past. But reading is not proof. Proof is next.

## data-wall (50s)
HEADER: The Data Wall — reported estimates, honestly labeled, and what synthetic pipelines change. Every number on the chart is REPORTED (replotted, labeled on screen):  - training-set sizes of published models: GPT-3 0.3T tokens (2020),    Chinchilla 1.4T (2022), Llama 2 2T (2023), Llama 3 15T (2024).  - the estimated effective stock of public human text: ~300T tokens, with    full utilization projected between 2026 and 2032 (Villalobos et al.,    "Will we run out of data?", Epoch AI 2022/2024). The tr
  1. 0.5: Why does the field need synthetic data at all? Because of one chart. These are reported training-set sizes of published models — note the axis is logarithmic, in trillions of tokens.
  2. 6.1: Zero point three trillion tokens in twenty twenty. One point four two years later. Fifteen trillion by twenty twenty four — a fifty fold increase in four years, and every one of those tokens was written by a person.
  3. 12.1: Now the ceiling. The published estimate of all effective public human text — every book, page, and post worth training on — is around three hundred trillion tokens. That line is not growing fifty fold every four years. It grows as fast as people type.
  4. 18.4: Fit the trend through the reported points and extend it — the dashed part is extrapolation, and labeled as such. It crosses the stock around twenty twenty eight. The published projection says full utilization lands somewhere between twenty twenty six and twenty thirty two.
  5. 24.4: The exact year is debatable and the estimate has real error bars. The direction is not: the supply of human text is finite, and the appetite is not.
  6. 29.8: This book was about what happens on the other side of that wall. Raw self-generation collapses — a copy of a copy. But generation plus a verifier is different: every kept sample carries a bit of information the check extracted from reality.
  7. 35.8: That is why the pipelines that survive the wall all rhyme: verified reasoning chains, filtered corpora, checked code with its tests. The bottleneck stops being how much text humans wrote, and becomes how much verification you can afford.
  8. 43.6: The journey: a ring that trains on itself, the collapse when nothing checks it, the filter that saves it, the bootstrap that turns verified wins into curriculum — and the wall that makes all of this necessary. Data was never the resource. Checked data is.

## test-time-scaling (55s)
HEADER: The New Scaling Law — compute per answer. Two layers, kept honest:  - REPORTED (replotted from published results, labeled as such on screen):    self-consistency on grade-school math with a 540B model, 56.5% → 74.4%    with 40 sampled paths (Wang et al.); repeated-sampling coverage on    SWE-bench Lite, 15.9% → 56% at 250 samples (Brown et al., "Large    Language Monkeys"). Both are roughly linear in log samples.  - OUR TOY (computed here): the book's 300-problem suite. Small model:    pass@1 49
  1. 0.5: Everything in this book so far ran on a toy we control. So before the final chart, two published results, replotted here and labeled as reported, to show the same shape in the wild.
  2. 6.3: Self-consistency lifted a five hundred forty billion parameter model from fifty six and a half to seventy four percent on grade school math, with forty sampled paths. And repeated sampling took software patch coverage from sixteen percent to fifty six with two hundred fifty tries.
  3. 12.3: Both climb roughly linearly in the logarithm of the sample count — the signature reported again and again for test-time compute, including for the reasoning models trained to think longer.
  4. 18.3: Now the economic question, on our toy where we can compute everything. Two models: a big one, three times the per-sample capability at ten times the price, and our small one at one unit per sample. Same axis: total compute per answer.
  5. 23.9: The big model starts strong: seventy five percent from its very first, expensive answer. Buying it more samples pushes it toward certainty, at hundreds of units.
  6. 29.1: Now the small model with a verifier. At a budget of ten units the big model has answered once, at seventy five percent. The small model has bought eight lottery tickets and cashed the winner: ninety percent, for less money.
  7. 35.5: Two honest caveats. This trade exists only when you can verify — remember the voting plateau. And training compute amortizes: you pay for a bigger model once, but you pay the per-answer bill on every single query, forever.
  8. 41.5: Which is why the frontier does both: pretrain as large as the budget allows, then spend inference compute selectively — on the queries hard enough to deserve it.
  9. 49.1: The journey: one sample is a lottery ticket. A verifier turns tickets into pass at N; a vote plateaus without one. A process judge reads the steps, search keeps the right path alive, and compute per answer became a dial — the new axis of scaling.

## compression-prediction (55s)
HEADER: Compression is Prediction — the bridge chapter. All math at module scope and verified by running it: the fifty-character line "the theory of the thing is that the truth is there" over a fourteen-letter alphabet. Coding costs computed for real: a uniform code pays log2 of fourteen = 3.81 bits per character, 190 bits total; letter frequencies (a unigram model) pay 163 bits (3.25 per char); and a bigram model that predicts each character from the previous one (with add-one smoothing) pays 120 bits,
  1. 0.5: One last idea, and it is the bridge out of this book. Take a fifty character line of text. Its alphabet has fourteen distinct characters, so a flat code spends three point eight bits on every single one.
  2. 6.3: Every bar is the price of one character. Flat beliefs, flat bars: one hundred ninety bits for the whole line. That is the cost of knowing nothing.
  3. 11.2: Now let the code believe the letter frequencies, exactly the move from the Huffman chapter. Common characters get cheap, rare ones get pricey, and the total falls to one hundred sixty three bits.
  4. 17.3: But frequencies ignore the order. Let the model predict each character from the one before it. After a t, an h is hardly news; after a space, almost anything goes.
  5. 23.1: Watch where the bars collapse: inside the repeated words, where the next character was easy to guess. The total drops to one hundred twenty bits, two point four per character.
  6. 29: Look at what just happened. We never designed a compressor. We built a predictor, and the code lengths fell out of its probabilities. Prediction and compression are not cousins; they are the same object read twice.
  7. 35: The exchange rate is the one this book has used all along: probability p becomes length minus log of p. A model is exactly as good as the bits it saves, no more, no less.
  8. 40.9: And that is the road to the language models book, where a next word predictor is scored in exactly these bits per character. Scale this little bigram up a billionfold and the compressor starts finishing your sentences.
  9. 48.8: Entropy set the floor, codes approached it, divergence priced our errors, capacity armored the wire, and prediction turned out to be compression wearing a different hat. That is information theory.

## superposition (56s)
HEADER: Superposition — more features than neurons. The toy-models-of-superposition setup, actually trained at module scope (seeded, 4000 full gradient steps, batch 128): five features, importances 1.0 down to 0.8, forced through a TWO dimensional bottleneck with a ReLU readout. Verified results: when features are almost always active (density 0.8) the model keeps only the two most important, orthogonal, and sacrifices the rest (norms 0.20, 0.29, 0.07). When features are rare (density 0.05) it keeps ALL
  1. 0.5: A model wants to represent five features, but we give it only two neurons. Five arrows must live in a two dimensional plane. Something has to give, and what gives depends on how often features fire.
  2. 6.6: First regime: features almost always active. Watch the actual training run. The two most important features claim the two dimensions, at right angles, and the other three are crushed to nearly nothing.
  3. 12.6: That is the classical picture: one dimension per feature, and when dimensions run out, the least important features simply do not exist inside the model.
  4. 18.3: Now make the same five features rare: each one active only five percent of the time. Same architecture, same training, and the answer changes completely. All five arrows survive at full strength.
  5. 24.3: They pack around the circle at roughly seventy two degrees apart, a pentagon of features sharing two neurons. Five things stored in two dimensions. This is superposition.
  6. 30.7: The rent for this trick is interference. Here is the overlap between every pair of the learned arrows: when one feature fires, its neighbors each read a phantom third of a signal.
  7. 36.7: Sparsity is what makes the rent affordable. If features rarely fire together, phantom signals are rare and small, and the occasional collision costs less than dropping a feature entirely.
  8. 42.8: This is why you cannot just read a network neuron by neuron. A single neuron here carries pieces of several features at once; the clean directions exist, but they do not line up with the hardware.
  9. 50.5: Superposition: sparse features crowd more directions into a space than it has dimensions, paying in interference. Next chapter, the tool that unmixes them.

## feature-directions (55s)
HEADER: Features as Directions — opening the black box. All math at module scope and verified by running it. 240 activation vectors in an eight dimensional space: half carry a hidden attribute, injected as +1.6 along one fixed random unit direction, plus gaussian noise (spread 0.5). A logistic regression probe trained for real (12000 full-batch steps, weight decay 1.0) recovers that direction with cosine similarity 0.993 and classifies 227 of 240 activations correctly. Both scatter views are true orthog
  1. 0.5: Inside a neural network there are no words, no concepts, no labels. Just long lists of numbers: activation vectors. Here are two hundred forty of them from a toy model, projected down so we can look.
  2. 6.3: A blob. And yet half of these activations came from inputs with a hidden attribute, and half without. The model knows which is which. Can we find where it wrote that down?
  3. 11.8: Color the points by the truth and the blob stays a blob, because we are looking along two arbitrary axes. The mechanistic hypothesis says: features are directions. So hunt for the direction.
  4. 17.4: The tool is a linear probe: the simplest possible classifier, trained for real on these vectors. It has no way to succeed unless the attribute really is written along some line in activation space.
  5. 23.7: It succeeds. Rotate our viewing plane so its horizontal axis is the probe direction, and the same points, the same vectors, fall apart into two clean clouds. Nothing moved but our eyes.
  6. 29.7: And it is not just any direction. We planted the attribute along a known unit vector when we built this toy, and the probe recovered it with cosine similarity zero point nine nine three.
  7. 35.8: Two hundred twenty seven of two hundred forty classified correctly, from a single dot product. That is the first tool of interpretability: if a concept is linearly readable, a probe will read it.
  8. 41.6: But be careful what you conclude. A probe proves the information is present and readable; it does not prove the model uses it. That stronger claim needs intervention, and it comes in the final chapter.
  9. 48.9: Features as directions: concepts live along lines in activation space, and a trained probe can find them. Next, the catch: models cram more features than they have dimensions.

## vae (72s)
HEADER: The VAE — a latent space you can walk. All math at module scope: the same seeded 2-D manifold data as the autoencoder chapter, and an ACTUAL linear variational autoencoder trained by gradient descent on the exact (closed-form, expectation-integrated) objective: reconstruction + KL to a standard normal prior. Numeric central differences over the five parameters; 400 recorded steps. The latent axis, the code fuzz, the prior alignment, and the latent walk all come from the trained parameters. Empir
  1. 0.5: Last chapter ended with a confession: the autoencoder organizes nothing about its codes. They are just numbers on an axis, at whatever scale and spacing training happened to produce.
  2. 6.5: Why care? Because to generate, you must pick a code out of thin air and decode it. If the codes have gaps and no known shape, picking one is a guess into the dark.
  3. 12.5: The variational autoencoder makes two changes. First, each input maps not to a point but to a small cloud: a mean and a width. The decoder must survive that added blur.
  4. 19.1: Second, a penalty pulls every cloud toward one fixed target: the standard bell curve. That is the prior, and it is the contract: all codes, collectively, must fill this exact shape.
  5. 26.3: Train the real objective: reconstruction error plus that penalty, by gradient descent. Watch the codes slide and pack themselves under the bell curve while the decoder line finds the data.
  6. 32.7: Converged. The clouds spread to width point eight, each fuzzy by about point six, and the two together add up to width one: the codes now tile the prior almost perfectly. That was the whole point.
  7. 40.4: Now the payoff. Slide along the latent axis and decode as you go. Every position is a legal code, because the training contract guaranteed this axis is fully settled.
  8. 46.4: The decoded point glides smoothly along the learned manifold in data space. No gaps, no cliffs: the walk upstairs is a walk downstairs too.
  9. 52.1: And between any two real inputs: encode both, draw the straight line between their codes, and decode the midpoints. You get a smooth morph from one example into the other.
  10. 60.1: That is the variational autoencoder: blur every code, tax every departure from the bell curve, and the reward is a latent space you can sample, walk, and interpolate.
  11. 66.3: One family solved generation by organizing the codes. The next chapter solves it with a fight: two networks, one forging data, one calling the forgeries.

## gan (70s)
HEADER: The GAN Game — forger versus detective. All math at module scope: real data is a two-mode Gaussian mixture on a line (modes at -2 and +2), and TWO actual adversarial training runs are recorded step by step with seeded minibatches:  - FLEX run: generator g(z) = mu + s z with BOTH mu and s learnable.    The generator smears itself across both modes: one wide, blurry blob    (mu -> ~0, s -> ~2) — the "average" failure.  - NARROW run: s fixed at 0.5, only mu learnable. The generator cannot    cover 
  1. 0.5: Real data lives in two neighborhoods: a hump around minus two and a hump around plus two. A forger must learn to produce numbers that pass for real.
  2. 6.5: The trick of the generative adversarial network: instead of scoring the forger with math, hire a detective. The detective learns to tell real from fake; the forger learns to fool the detective.
  3. 13.1: The orange curve is the forger: it turns random noise into numbers, and it starts as one clueless blob near zero. The rose curve below is the detective’s verdict at every point: one means real, zero means fake.
  4. 19.5: Now they train in alternation, real gradient steps on both sides. The detective digs valleys wherever fakes cluster, and the forger flows away from every valley the detective digs.
  5. 25.9: Watch where this forger settles: it stretches itself into one wide blur draped across both neighborhoods. It fools the detective on average, by being specifically like nothing.
  6. 32.5: Second experiment. Give the forger a fixed narrow width, so blurring is no longer an option. It must commit. Same game, new recording.
  7. 38.1: It lunges toward the nearest applause, overshoots, and then locks onto the plus two neighborhood. Half of reality, the entire hump at minus two, is simply never produced again.
  8. 44.5: This is mode collapse, and the chart of the forger’s center tells the honest story: a jump, a wobble, and a permanent home in one mode. The detective keeps objecting; the forger has stopped listening.
  9. 50.9: Notice what made this fragile: there is no loss curve marching downhill. Two objectives pull against each other, and the pair can orbit, stall, or collapse. Adversarial training buys sharpness at the price of stability.
  10. 59.1: That is the adversarial family: no probabilities anywhere, just a forger judged by a learned critic. When it works, samples are strikingly sharp. When it fails, whole modes of reality quietly vanish.
  11. 65.1: One family organizes codes, one plays a game. The final chapter maps the whole family tree, including the model that generates by walking noise backward.

## generative-family (80s)
HEADER: Diffusion, Revisited From Here — the generative family tree. Bridge chapter: it does NOT re-teach diffusion (the shelf has a dedicated diffusion explainer); it places every model of this book in one family picture and shows where each spends its compute. Real math at module scope: a seeded 2-D spiral-arc dataset and the EXACT closed-form forward-noising of denoising diffusion — x_t = sqrt(abar_t) x0 + sqrt(1 - abar_t) eps with a fixed seeded eps per point and a cosine abar schedule. The melt you
  1. 0.5: Four chapters ago, generating meant fitting three circles. Since then: a bottleneck, a walkable latent space, and a forgery game. One famous family member is still missing.
  2. 6.5: This shelf already has a whole chapter on diffusion, so we will not rebuild it. But watch its one central move, because it recasts everything this book has done.
  3. 12.6: Take structured data and destroy it on purpose: mix each point with a little more noise at every step. This is the exact closed-form recipe, not an artist’s impression.
  4. 18.8: The spiral melts into a featureless cloud of pure noise. Every dataset, however intricate, ends in this same place. That is the point.
  5. 24.6: A diffusion model trains a network to run this film backward: given a noisy frame, predict the noise and remove a sliver of it. Generation is then just: start from static, denoise a few hundred times.
  6. 30.8: Structure condenses back out of static. Notice what this bought: no bottleneck to design, no detective to balance. Just many small, supervised denoising problems.
  7. 37.2: So here is the family in one frame. Every branch answers the same question, how do you turn noise into data, and differs mainly in where it spends its compute.
  8. 43.6: The variational autoencoder pays during training to organize a latent space, then generates in a single cheap decode. One pass, slightly blurry, honest probabilities.
  9. 49.4: The adversarial network also generates in one pass, and sharper. But it paid in stability: no likelihood, and modes can silently vanish, as we watched.
  10. 54.8: Autoregressive models, the engine of language models, spend compute piece by piece: each new piece conditioned on everything so far. Exact probabilities, but generation is a long walk.
  11. 60.4: And diffusion spends its compute at the end: hundreds of denoising passes per sample. It buys the best of both, stable training and sharp output, by paying at generation time.
  12. 68.4: One game, four strategies: fit a density, organize a latent space, hire a critic, or learn to reverse decay. Each trades training stability, sample quality, and compute differently.
  13. 74.8: And all of them are the same move you saw in chapter one: make the data likely under something you can sample. The family resemblance was there all along.
