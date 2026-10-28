import {Circuit, emitCompare, emitSelect, validateGrids} from '/Users/blamy/Documents/Codex/orly-2/.orly-work/repos/handwired/src/runtime/numeric-ui-core.ts'

// 1. validateGrids catches the false grid declaration at a = 4.5
{
  const c = new Circuit(1)
  c.assumeRange(c.source(0), -1000, 1000)
  c.assumeGrid(c.source(0), 1)
  const bit = emitCompare(c, c.source(0), '>', c.constant(4))
  for (const v of [5, 4.5]) {
    const values = c.evaluateReference(Float32Array.of(v))
    try { validateGrids(c, values); console.log(`a=${v}: validateGrids ok, bit=${values[bit]}`) }
    catch (e) { console.log(`a=${v}: validateGrids threw: ${(e as Error).message}`) }
  }
}

// 2. else-if chain: a > 8 ? 30 : a > 4 ? 10 : 12, as nested selects
{
  const c = new Circuit(1)
  const a = c.source(0)
  c.assumeRange(a, -1000, 1000); c.assumeGrid(a, 1)
  const above4 = emitCompare(c, a, '>', c.constant(4))
  const above8 = emitCompare(c, a, '>', c.constant(8))
  const inner = emitSelect(c, above4, c.constant(12), c.constant(10))
  const outer = emitSelect(c, above8, inner, c.constant(30))
  const p = c.compileTensorProgram([outer])
  console.log(`\nelse-if (nested selects): ${p.valueCount - c.sourceSize} live ops, ${p.layers.length} layers`)
  for (const v of [3, 4, 5, 8, 9, 100]) {
    const vals = c.evaluateReference(Float32Array.of(v))
    const js = v > 8 ? 30 : v > 4 ? 10 : 12
    console.log(`  a=${v}: above4=${vals[above4]} above8=${vals[above8]} result=${vals[outer]} js=${js}`)
  }
}

// 3. the same 3-way choice as a one-hot: neighbor differences of monotone bits, masked sum
{
  const c = new Circuit(1)
  const a = c.source(0)
  c.assumeRange(a, -1000, 1000); c.assumeGrid(a, 1)
  const above4 = emitCompare(c, a, '>', c.constant(4))
  const above8 = emitCompare(c, a, '>', c.constant(8))
  const isLow = c.roundAffine([[above4, -1]], 1)                  // 1 - above4
  const isMid = c.roundAffine([[above4, 1], [above8, -1]], 0)     // above4 - above8
  const isHigh = above8
  c.assumeRange(isLow, 0, 1); c.assumeRange(isMid, 0, 1)
  c.assumeOneHot([isLow, isMid, isHigh])
  const k = [12, 10, 30].map(v => c.constant(v))
  const terms = [isLow, isMid, isHigh].map((bit, i) => [c.multiply(bit, k[i]!), 1] as [any, number])
  const result = c.roundAffine(terms, 0)
  for (const lower of [false, true]) {
    const p = c.compileTensorProgram([result], lower)
    console.log(`\none-hot masked sum (lowerGathers=${lower}): ${p.valueCount - c.sourceSize} live ops, ${p.layers.length} layers`)
  }
  for (const v of [3, 4, 5, 8, 9, 100]) {
    const vals = c.evaluateReference(Float32Array.of(v))
    const js = v > 8 ? 30 : v > 4 ? 10 : 12
    console.log(`  a=${v}: onehot=[${vals[isLow]},${vals[isMid]},${vals[isHigh]}] result=${vals[result]} js=${js}`)
  }
}
