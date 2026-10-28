// Export the compiled HandwiredOS circuit (chenglou/handwired @ 257856e) for the film's loom and wallpaper
// (story/meta.json staging.buildList.matmulLoom; ch01-s04, ch05-s01, ch05-s04, ch07-s04, ch12-s02..s03).
//
// Run from the orly-2 root, against the pinned clone (bun runs the repo's TypeScript directly):
//   bun films/handwired-explained/tools/export-handwiredos-circuit.ts .orly-work/repos/handwired \
//     > films/handwired-explained/research/exports/handwiredos-circuit.json
// then record the command and its totals in the film's sources.json (shots stage).
//
// Arcs follow src/handwiredos/wiring.ts exactly: one per stored weight, from the packed index of the value it
// reads (layer.inputIndices[layer.columns[k]]) to the packed index of the operation that owns the row (a gate
// row's or index row's weights belong to the operation they gate or index); sign -1 = indigo, +1 = copper.
// Gate depth: an operation's depth is the deepest depth among the values it reads, plus one when it is a ReGLU
// (in layer.gateRows) or a boolean atom (in layer.booleanRows). Expected totals (bible OS02, CM07): 234 source
// cells, 130 layers, 4,646 live operations, 9,909 stored weights, 2,776 ReGLU, 59 boolean, longest chain 71.
// If any total differs, stop and report it: the film's numbers come from the bible, not from this file.
import path from 'node:path'

const repo = path.resolve(process.argv[2] ?? '.orly-work/repos/handwired')
const {createWindowManagerMachine} = await import(path.join(repo, 'src/handwiredos/window-manager.ts'))
const program = createWindowManagerMachine().tensorProgram
const S: number = program.sourceSize
const depth = new Float64Array(program.valueCount)
const parent = new Int32Array(program.valueCount).fill(-1)
const owner: number[] = new Array(S).fill(-1)
const arcs: [number, number, number][] = []
const layers: Record<string, number>[] = []
let start = S
program.layers.forEach((layer: any, li: number) => {
  for (let r = 0; r < layer.outputSize; r++) owner.push(li)
  const gated = new Set<number>(Array.from(layer.gateRows as ArrayLike<number>))
  const bools = new Set<number>(Array.from(layer.booleanRows as ArrayLike<number>))
  const best = new Float64Array(layer.outputSize).fill(-1)
  const bestFrom = new Int32Array(layer.outputSize).fill(-1)
  let adds = 0, subtracts = 0
  for (let row = 0; row < layer.rowOffsets.length - 1; row++) {
    let op = row
    if (row >= layer.outputSize) {
      const extra = row - layer.outputSize
      op = extra < layer.gateRows.length ? layer.gateRows[extra] : layer.indexReads[extra - layer.gateRows.length].row
    }
    for (let k = layer.rowOffsets[row]; k < layer.rowOffsets[row + 1]; k++) {
      const from = layer.inputIndices[layer.columns[k]]
      const sign = layer.weights[k] < 0 ? -1 : 1
      if (sign < 0) subtracts++; else adds++
      arcs.push([from, start + op, sign])
      if (depth[from] > best[op]) { best[op] = depth[from]; bestFrom[op] = from }
    }
  }
  let gateDepthMax = 0
  for (let r = 0; r < layer.outputSize; r++) {
    depth[start + r] = Math.max(0, best[r]) + (gated.has(r) || bools.has(r) ? 1 : 0)
    parent[start + r] = bestFrom[r]
    gateDepthMax = Math.max(gateDepthMax, depth[start + r])
  }
  layers.push({layer: li, operations: layer.outputSize, storedWeights: layer.weights.length, adds, subtracts,
    reglu: layer.gateRows.length, boolean: layer.booleanRows.length, indexReads: layer.indexReads.length, gateDepthMax})
  start += layer.outputSize
})
let end = 0
for (let v = 0; v < program.valueCount; v++) if (depth[v] > depth[end]) end = v
const chain: number[] = []
for (let v = end; v >= 0; v = parent[v]) chain.unshift(v)
const sum = (k: string) => layers.reduce((a, l) => a + l[k]!, 0)
console.log(JSON.stringify({
  $source: 'chenglou/handwired@257856e: createWindowManagerMachine().tensorProgram (src/handwiredos/window-manager.ts); arcs as src/handwiredos/wiring.ts draws them',
  $command: 'bun films/handwired-explained/tools/export-handwiredos-circuit.ts .orly-work/repos/handwired',
  totals: {sourceCells: S, layers: program.layers.length, liveOperations: program.wireOrder.length - S, storedWeights: arcs.length,
    adds: sum('adds'), subtracts: sum('subtracts'), reglu: sum('reglu'), boolean: sum('boolean'), longestGateChain: depth[end]},
  layers,
  longestGateChain: {packedValues: chain, layers: chain.filter((v) => v >= S).map((v) => owner[v])},
  arcs,
}))
