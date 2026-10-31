// Independent port, written for the patterns-loops-as-arithmetic dossier, of the pure algorithms behind
// chenglou/handwired@257856e docs/patterns.md. It imports nothing from the repo: the sandbox would not run the
// clone's own code. sklansky/brentKung below are line-for-line ports of src/runtime/prefix-networks.ts#L12-L44.
// FP32 arithmetic is emulated with Math.fround after every addition, as an FP32 executor rounds every sum.
// Run: node films/handwired-explained/research/runs/patterns_port.mjs

const f = Math.fround

function sklanskyPrefix(items, combine) {
  const prefixes = [...items]
  for (let halfSize = 1; halfSize < prefixes.length; halfSize *= 2) {
    for (let blockStart = 0; blockStart < prefixes.length; blockStart += 2 * halfSize) {
      const leftHalfLast = blockStart + halfSize - 1
      const blockEnd = Math.min(blockStart + 2 * halfSize, prefixes.length)
      for (let index = leftHalfLast + 1; index < blockEnd; index++) {
        prefixes[index] = combine(prefixes[leftHalfLast], prefixes[index])
      }
    }
  }
  return prefixes
}

function brentKungPrefix(items, combine) {
  const prefixes = [...items]
  let span = 1
  for (; span < prefixes.length; span *= 2) {
    for (let index = 2 * span - 1; index < prefixes.length; index += 2 * span) {
      prefixes[index] = combine(prefixes[index - span], prefixes[index])
    }
  }
  for (span /= 2; span >= 1; span /= 2) {
    for (let index = 3 * span - 1; index < prefixes.length; index += 2 * span) {
      prefixes[index] = combine(prefixes[index - span], prefixes[index])
    }
  }
  return prefixes
}

// Same tracking as tests/runtime/prefix-networks.test.ts#L9-L17: strings show grouping, depth counts levels.
function track(network, n, log) {
  let combines = 0
  const items = Array.from({length: n}, (_, i) => ({text: `${i}`, depth: 0, level: 0}))
  const out = network(items, (a, b) => {
    combines++
    const r = {text: `(${a.text}+${b.text})`, depth: Math.max(a.depth, b.depth) + 1}
    if (log) log.push(`  combine #${combines} at level ${r.depth}: ${a.text} with ${b.text}`)
    return r
  })
  return {out, combines, depth: Math.max(...out.map(o => o.depth))}
}

console.log('=== 1. Combine counts and levels (the patterns.md#L46-L50 table) ===')
for (const n of [4, 8, 16, 64, 256, 1024]) {
  const s = track(sklanskyPrefix, n), b = track(brentKungPrefix, n)
  console.log(`n=${n}: loop ${n - 1} in ${n - 1} | sklansky ${s.combines} in ${s.depth} | brentKung ${b.combines} in ${b.depth}`)
}

console.log('\n=== 2. 8-item running totals, grouping shown (Brent-Kung, then Sklansky) ===')
for (const [name, net] of [['brentKungPrefix', brentKungPrefix], ['sklanskyPrefix', sklanskyPrefix]]) {
  const log = []
  const r = track(net, 8, log)
  console.log(`${name}: ${r.combines} combines, ${r.depth} levels`)
  console.log(log.join('\n'))
  r.out.forEach((o, i) => console.log(`  prefix[${i}] = ${o.text}`))
}

console.log('\n=== 3. 8-item numeric prefix sum (integers: exact in any grouping) ===')
const heights8 = [3, 1, 4, 1, 5, 9, 2, 6]
const add = (a, b) => f(a + b)
let t = 0
console.log('heights        ', heights8.join(' '))
console.log('loop totals    ', heights8.map(h => (t = f(t + h))).join(' '))
console.log('brentKung      ', brentKungPrefix(heights8, add).join(' '))
console.log('sklansky       ', sklanskyPrefix(heights8, add).join(' '))

console.log('\n=== 4. FP32 grouping changes the last bit (patterns.md#L39) ===')
const rows = [229, 167.4, 208.5, 194.4].map(f)
let chain = 0
for (const h of rows) chain = f(chain + h)
const pairs = f(f(rows[0] + rows[1]) + f(rows[2] + rows[3]))
console.log('FP32 row heights:', rows.join(', '))
console.log('loop (((229+167.4)+208.5)+194.4) =', chain)
console.log('pairs ((229+167.4)+(208.5+194.4)) =', pairs)
console.log('brentKung last prefix          =', brentKungPrefix(rows, add)[3])
console.log('float64 sum of the FP32 heights =', rows.reduce((a, b) => a + b, 0))
// one FP32 step (ulp) at ~799: 2^(9-23) = 2^-14
console.log('difference =', chain - pairs, ' 2^-14 =', 2 ** -14)

console.log('\n=== 5. filter(isVisible).slice(0, K) into K slots (patterns.md#L386-L393) ===')
const visible = [0, 1, 1, 0, 1, 0, 1, 1]
const through = brentKungPrefix(visible, add)
console.log('item            ', visible.map((_, i) => i).join(' '))
console.log('visible         ', visible.join(' '))
console.log('visibleThrough  ', through.join(' '))
const K = 3
for (let k = 0; k < 6; k++) {
  const atMost = through.map(c => (c <= k ? 1 : 0))
  const prev = i => (i === 0 ? 1 : atMost[i - 1])
  const oneHot = atMost.map((b, i) => prev(i) - b)
  const present = through[through.length - 1] >= k + 1 ? 1 : 0
  const item = oneHot.reduce((s, b, i) => s + b * i, 0)
  console.log(`slot ${k}: [visibleThrough<=${k}] ${atMost.join('')}  one-hot ${oneHot.join('')}  -> item ${present ? item : '(none)'}  present=${present}`)
}
// binary search form (compaction-into-slots.md#L16-L17), slot 2 over 8 items: steps 8,4,2,1? stepCount=ceil(log2(9))=4
{
  const k = 2, n = through.length, stepCount = Math.ceil(Math.log2(n + 1))
  let position = 0
  const trace = []
  for (let step = 2 ** (stepCount - 1); step >= 1; step /= 2) {
    const idx = Math.min(position + step - 1, n - 1) // clamp
    const count = through[idx]
    if (count <= k) position += step
    trace.push(`read [${idx}]=${count}${count <= k ? ` <= ${k}, +${step}` : ''}`)
  }
  console.log(`binary search for slot ${k}: ${trace.join('; ')} -> position ${position}`)
}
// the reference loop for K slots
{
  const shown = []
  for (let i = 0; i < visible.length && shown.length < K; i++) if (visible[i]) shown.push(i)
  console.log(`JS reference items.filter(isVisible).slice(0, ${K}) =`, shown)
}

console.log('\n=== 6. findIndex when the test flips once (patterns.md#L74-L78) ===')
{
  const bottoms = [40, 80, 80, 140, 180], pointerY = 90
  const bits = bottoms.map(b => (b <= pointerY ? 1 : 0))
  const count = bits.reduce((a, b) => a + b, 0)
  const prevs = [pointerY >= 0 ? 1 : 0, ...bits.slice(0, -1)]
  console.log('bits', bits.join(' '), ' count', count, ' one-hot', prevs.map((p, i) => p - bits[i]).join(' '),
    ' loop findIndex', bottoms.findIndex(b => pointerY < b))
}

console.log('\n=== 7. emitFirstActive tree on hit bits (patterns.md#L107-L114) ===')
{
  const hits = [0, 1, 0, 1, 0, 0, 1, 0]
  const up = [hits]
  while (up.at(-1).length > 1) { const l = up.at(-1); up.push(l.reduce((a, _, i) => (i % 2 ? a : [...a, Math.max(l[i], l[i + 1])]), [])) }
  up.forEach((l, i) => console.log(`  up level ${i}: ${l.join(' ')}`))
  // down: route 1 left if left holds 1, else right
  let route = [up.at(-1)[0]]
  for (let lv = up.length - 2; lv >= 0; lv--) {
    const l = up[lv], next = []
    for (let i = 0; i < route.length; i++) { const left = l[2 * i]; next.push(route[i] * left, route[i] * (1 - left)) }
    route = next
  }
  console.log('  one-hot of first hit:', route.join(' '), ' findIndex =', hits.findIndex(Boolean))
}

console.log('\n=== 8. sort as ranks (patterns.md#L366-L371) ===')
{
  const keys = [30, 10, 30, 20]
  const before = (o, i) => (keys[o] < keys[i] || (keys[o] === keys[i] && o < i) ? 1 : 0)
  keys.forEach((k, i) => console.log(`  item ${i} (key ${k}) row: ${keys.map((_, o) => (o === i ? '.' : before(o, i))).join(' ')} -> rank ${keys.reduce((s, _, o) => s + (o === i ? 0 : before(o, i)), 0)}`))
  const order = keys.map((_, i) => i).sort((l, r) => keys[l] - keys[r] || l - r)
  console.log('  JS sort order', order, '-> rank of each item', keys.map((_, i) => order.indexOf(i)))
  // pair count: one emitCompare per unordered pair gives both entries; n=64 -> 2016 pairs * 2 ops = 4032 + 64 rank sums = 4096
  const n = 64, pairs = n * (n - 1) / 2
  console.log(`  n=64: ${pairs} pairs x 2 ops + ${n} rank sums = ${pairs * 2 + n}`)
}

console.log('\n=== 9. pointer jumping (patterns.md#L340-L343) ===')
{
  const nextStart = [3, 3, 4, 6, 6, 8, 9, 9, 10, 10]
  const n = 10, read = (t, i) => t[Math.min(i, n - 1)] // clamped read; nextStart[n-1] = n
  const j1 = nextStart.map(s => (s >= n ? n : s))
  const j2 = j1.map(s => (s >= n ? n : read(j1, s)))
  console.log('  1 line later ', j1.join(' '))
  console.log('  2 lines later', j2.join(' '))
  console.log('  line 3 starts at j1[j2[0]] =', read(j1, j2[0]))
  let s = 0; const starts = []
  for (let line = 0; line < 5; line++) { starts.push(s); if (s < n) s = nextStart[s] }
  console.log('  walk loop starts', starts.join(' '))
}

console.log('\n=== 10. stack of one bit per level (patterns.md#L316-L319) ===')
{
  const text = [...'{[{}]}']
  let depth = 0, code = 0
  const kinds = []
  const rowsOut = {depthBefore: [], codeBefore: [], inObject: []}
  for (const c of text) {
    rowsOut.depthBefore.push(depth); rowsOut.codeBefore.push(code)
    rowsOut.inObject.push(depth === 0 ? 0 : (code >= 2 ** (depth - 1) ? 1 : 0))
    if (c === '{' || c === '[') { if (c === '{') code += 2 ** depth; kinds.push(c); depth++ }
    else { depth--; const k = kinds.pop(); if (k === '{') code -= 2 ** depth }
  }
  for (const [k, v] of Object.entries(rowsOut)) console.log(`  ${k.padEnd(12)} ${v.join('   ')}`)
}

console.log('\n=== 11. state machine tables combine as later[earlier[state]] (patterns.md#L224-L227) ===')
{
  const S = ['idle', 'armed', 'pressedOutside']
  const down = [1, 1, 2], moveOut = [0, 2, 2]
  const combined = down.map(s => moveOut[s])
  console.log('  downOnButton then moveOutside =', combined.map(s => S[s]).join(', '))
}
