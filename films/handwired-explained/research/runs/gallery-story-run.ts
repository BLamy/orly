// Runs the learned gallery's own editor (Story preset, default slider 4%, seeded weights 0x517a9e) frame by frame
// at 60 Hz, exactly as tests/learned-gallery drives it, and records what ch07-s06..s10 draw.
// usage: bun run run-gallery.ts <handwired clone at 257856e> > gallery-story.json
const repo = process.argv[2]!
const {createLearnedGalleryEditor, learnedGeometryField: F} = await import(`${repo}/src/learned-gallery/learned-gallery.ts`)

let readings = 0
const editor = createLearnedGalleryEditor(() => readings++ * 0.01)
const m = editor.machine
const W = 500, H = 400
let time = 0
const frame = () => { time += 1000 / 60; return editor.frame(time, W, H, 0.04, []) }

const G = m.geometries
const rectOf = (values: Float32Array, o: number) => [0, 1, 2, 3].map((f) => +values[G[o * 4 + f]!]!.toFixed(5))
const targets: number[][] = []
for (let t = 0; t < 20; t++) if (m.target.active[t] === 1) targets.push([0, 1, 2, 3].map((f) => +m.target.geometries[t * 4 + f]!.toFixed(5)))

// step 0: the seeded pile, the pairing, and the left-bias springs (DG26)
const v0 = m.evaluate().values
const pile = targets.map((_, o) => rectOf(v0, o))
const {targetItems, outputByTarget} = m.match(v0)
const thr = 0.08
const clip = (e: number) => Math.max(-thr, Math.min(thr, e))
const springs: {t: number, o: number, eL: number, eR: number}[] = []
let gradLeftBias = 0
for (let i = 0; i < targetItems.length; i++) {
  const t = targetItems[i]!, o = outputByTarget[i]!
  const L = v0[G[o * 4]!]!, Wd = v0[G[o * 4 + 2]!]!
  const tL = m.target.geometries[t * 4]!, tW = m.target.geometries[t * 4 + 2]!
  const eL = L - tL, eR = L + Wd - (tL + tW)
  springs.push({t, o, eL: +eL.toFixed(5), eR: +eR.toFixed(5)})
  gradLeftBias += (clip(eL) + clip(eR)) / (targetItems.length * 4)
}
const biasIndex = 240 // parameters.outputBiases + left (see grad.ts); checked below against the value 0.5
const bias0 = m.source[biasIndex]

const frames: {step: number, fromSketch: number, misalignment: number, rects: number[][], pairing: number[]}[] = []
let f = frame()
const {createLearnedGalleryMachine} = await import(`${repo}/src/learned-gallery/learned-gallery.ts`)
const m2 = createLearnedGalleryMachine('story')
m2.setPenaltyReach(0.02, 0.025)
const firstSteps: {step: number, rects: number[][], pairing: number[]}[] = []
for (let k = 1; k <= 4; k++) {
  m2.train(1)
  const v = m2.evaluate().values
  firstSteps.push({step: k, rects: targets.map((_, o) => rectOf(v, o)), pairing: Array.from(m2.match(v).outputByTarget)})
  if (k === 1) var bias1 = m2.source[biasIndex]
}
for (let n = 0; n < 6000; n++) {
  const pr = m.match(f.values)
  frames.push({step: f.step, fromSketch: +f.fromSketch.toExponential(4), misalignment: +f.misalignment.toExponential(4),
    rects: targets.map((_, o) => rectOf(f.values, o)), pairing: Array.from(pr.outputByTarget)})
  if (!f.training) break
  f = frame()
}
console.log(JSON.stringify({
  command: `bun run run-gallery.ts ${repo}`,
  commit: '257856e', preset: 'story', slider: 0.04, seed: '0x517a9e', frameHz: 60, stage: [W, H],
  targets, pile, pairingAtStart: {targetItems: Array.from(targetItems), outputByTarget: Array.from(outputByTarget)},
  firstSteps,
  leftBias: {index: biasIndex, before: bias0, afterFirstFrame: bias1, gradientAtSeed: gradLeftBias, springs},
  firstFitStep: frames.find((x) => x.fromSketch < 1e-6)?.step ?? null,
  stopStep: frames.at(-1)!.step,
  frames,
}))
