import {Circuit, emitCompare, emitSelect, asWire} from '/Users/blamy/Documents/Codex/orly-2/.orly-work/repos/handwired/src/runtime/numeric-ui-core.ts'

console.log('--- README arithmetic (float64 JS) vs the ternary ---')
console.log('a\tmax(0,a-4)\tmax(0,a-5)\tabove4\tresult\tternary\tmatch')
for (const a of [5, 4, 3, 6, 100, 4.5, 4.25, 0, -3]) {
  const r1 = Math.max(0, a - 4), r2 = Math.max(0, a - 5)
  const above4 = r1 - r2
  const result = above4 * 10 + (1 - above4) * 12
  const ternary = (a > 4) ? 10 : 12
  console.log(`${a}\t${r1}\t${r2}\t${above4}\t${result}\t${ternary}\t${result === ternary}`)
}

function build(label: string, grid: number | undefined, opts: {endWithBoolean?: boolean} = {}) {
  const c = new Circuit(1)
  const a = c.source(0)
  c.assumeRange(a, -1000, 1000)
  if (grid !== undefined) c.assumeGrid(a, grid)
  const bit = emitCompare(c, a, '>', c.constant(4), opts)
  const result = emitSelect(c, bit, c.constant(12), c.constant(10))
  const pb = c.compileTensorProgram([bit])
  const pr = c.compileTensorProgram([result])
  console.log(`\n--- ${label} ---`)
  console.log(`built operations: ${c.operations.length}`)
  console.log(`bit alone: ${pb.valueCount - c.sourceSize} live operations, ${pb.layers.length} layers`)
  console.log(`bit + select: ${pr.valueCount - c.sourceSize} live operations, ${pr.layers.length} layers`)
  c.operations.forEach((op, i) => {
    console.log(`  op ${c.sourceSize + i}: ${op.kind} left=${JSON.stringify(op.leftTerms)}+${op.leftBias} gate=${JSON.stringify(op.gateTerms)}+${op.gateBias}${op.macro ? ' macro=' + op.macro.kind : ''}`)
  })
  for (const v of [5, 4, 3, 6, 100, 4.5]) {
    const vals = c.evaluateReference(Float32Array.of(v))
    const tens = c.evaluateTensor(Float32Array.of(v))
    console.log(`  a=${v}: bit=${vals[bit]} result=${vals[result]} tensor=${tens[result]} js=${(Math.fround(v) > 4) ? 10 : 12}`)
  }
}
build('a in -1000..1000, grid 1 (integer bits)', 1)
build('a in -1000..1000, no grid (sign cascade)', undefined)
build('a in -1000..1000, grid 1, endWithBoolean', 1, {endWithBoolean: true})
build('a in -1000..1000, no grid, endWithBoolean', undefined, {endWithBoolean: true})
