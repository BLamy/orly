// Validate + repair a generated storyboard. JSON Schema covers shapes/enums/
// ranges; this enforces the cross-element invariants it can't, and auto-fixes
// what's safe to fix (node overlap, spoken-text symbols).

const KINDS = new Set([
  'client', 'loadbalancer', 'service', 'database', 'cache', 'queue', 'worker',
  'external', 'vault', 'key', 'proxy', 'record',
]);

// minimum center separation (matches the canonical keychain story: dx>=18 OR dy>=12)
const MIN_DX = 18;
const MIN_DY = 12;

function overlaps(a, b) {
  return Math.abs(a.x - b.x) < MIN_DX && Math.abs(a.y - b.y) < MIN_DY;
}

// box footprint in story (0..100) coords; clearances chosen so the result
// always satisfies overlaps()' MIN_DX/MIN_DY post-condition.
const W = 17, H = 11, hw = 8.5, hh = 5.5;
const COL_GAP = 13, ROW_GAP = 7;
const colPitch = W + COL_GAP; // 30
const lanePitch = H + ROW_GAP; // 18
const GX = hw + 0.7, GY = hh + 1.2; // gap-inflated half-box for occlusion test
const r1 = (v) => Math.round(v * 10) / 10;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Does segment p1→p2 cross the axis-aligned box centered (cx,cy) half (gx,gy)? (Liang–Barsky)
function segHitsBox(p1, p2, cx, cy, gx, gy) {
  let t0 = 0, t1 = 1;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const edges = [[-dx, p1.x - (cx - gx)], [dx, (cx + gx) - p1.x], [-dy, p1.y - (cy - gy)], [dy, (cy + gy) - p1.y]];
  for (const [p, q] of edges) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
    else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 < t1;
}

// Deterministic layered layout: rank by reveal-order + forward edges, lane by
// barycenter, then clear arrows of intermediate boxes and relax any overlap.
export function relayout(ch) {
  const order = [], seen = new Set();
  for (const st of ch.steps) for (const id of st.reveal || []) if (!seen.has(id)) { seen.add(id); order.push(id); }
  for (const n of ch.nodes) if (!seen.has(n.id)) { seen.add(n.id); order.push(n.id); }
  const idx = new Map(order.map((id, i) => [id, i]));
  const byId = new Map(ch.nodes.map((n) => [n.id, n]));
  const inc = new Map(order.map((id) => [id, []]));
  for (const e of ch.edges || []) {
    if (idx.has(e.from) && idx.has(e.to) && idx.get(e.from) < idx.get(e.to)) inc.get(e.to).push(e.from);
  }
  // ranks via longest forward path (stable in reveal order)
  const rank = new Map();
  for (const id of order) {
    let r = 0;
    for (const u of inc.get(id)) r = Math.max(r, (rank.get(u) ?? 0) + 1);
    rank.set(id, r);
  }
  const maxR = Math.max(0, ...rank.values());
  const cols = Array.from({ length: maxR + 1 }, () => []);
  for (const id of order) cols[rank.get(id)].push(id);
  const nR = cols.length;
  const pitchX = nR > 1 ? Math.max(80 / (nR - 1), colPitch) : 0;
  const xAt = (r) => (nR === 1 ? 50 : 10 + r * pitchX);
  const maxX = Math.max(90, xAt(maxR));

  const yPos = new Map();
  cols.forEach((col, r) => {
    if (r > 0) {
      const bary = (id) => {
        const ns = (inc.get(id) || []).map((u) => yPos.get(u)).filter((v) => v != null);
        return ns.length ? ns.reduce((s, v) => s + v, 0) / ns.length : 50;
      };
      col.sort((a, b) => { const ba = bary(a), bb = bary(b); return ba !== bb ? ba - bb : idx.get(a) - idx.get(b); });
    }
    const k = col.length;
    col.forEach((id, i) => {
      const y = 50 + (i - (k - 1) / 2) * lanePitch;
      yPos.set(id, y);
      const n = byId.get(id);
      if (n) { n.x = r1(clamp(xAt(r), 10, maxX)); n.y = r1(clamp(y, 14, 86)); }
    });
  });

  // clear intermediate boxes off each forward segment
  for (const e of ch.edges || []) {
    const u = byId.get(e.from), v = byId.get(e.to);
    if (!u || !v) continue;
    const lo = Math.min(rank.get(e.from), rank.get(e.to));
    const hi = Math.max(rank.get(e.from), rank.get(e.to));
    if (hi - lo < 2) continue;
    for (const id of order) {
      if (id === e.from || id === e.to) continue;
      const rw = rank.get(id);
      if (rw <= lo || rw >= hi) continue;
      const w = byId.get(id);
      let tries = 0;
      while (segHitsBox(u, v, w.x, w.y, GX, GY) && tries < 8) {
        const dir = tries % 2 === 0 ? 1 : -1;
        const step = Math.ceil((tries + 1) / 2);
        w.y = r1(clamp(w.y + dir * step * lanePitch, 14, 86));
        tries++;
      }
    }
  }

  // final overlap-relax (belt and suspenders)
  const ns = ch.nodes;
  for (let pass = 0; pass < 200; pass++) {
    let moved = false;
    for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) {
      const a = ns[i], b = ns[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const ox = colPitch - Math.abs(dx), oy = lanePitch - Math.abs(dy);
      if (ox > 0 && oy > 0) {
        moved = true;
        if (ox < oy) { const p = (ox / 2) * (dx < 0 ? -1 : 1); a.x = r1(clamp(a.x - p, 10, maxX)); b.x = r1(clamp(b.x + p, 10, maxX)); }
        else { const p = (oy / 2) * (dy < 0 ? -1 : 1); a.y = r1(clamp(a.y - p, 14, 86)); b.y = r1(clamp(b.y + p, 14, 86)); }
      }
    }
    if (!moved) break;
  }
}

// Strip anything a narrator wouldn't pronounce from a spoken line (defensive;
// the prompt already forbids it).
export function cleanSpoken(s) {
  return String(s)
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/->|=>/g, ' to ')
    .replace(/[_~`*]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const SPOKEN_BAD = /[`*_]|->|=>|\b\/[A-Za-z]/;

// Returns { ok, errors, warnings }. Mutates the storyboard to auto-fix layout
// overlaps and spoken-text symbols.
export function validateStoryboard(sb) {
  const errors = [];
  const warnings = [];
  if (!sb || typeof sb !== 'object') return { ok: false, errors: ['storyboard is not an object'], warnings };
  if (!Array.isArray(sb.chapters) || sb.chapters.length < 1) return { ok: false, errors: ['no chapters'], warnings };

  sb.chapters.forEach((ch, ci) => {
    const where = `chapter ${ci + 1} (${ch.title || '?'})`;
    if (ch.number !== ci + 1) errors.push(`${where}: number is ${ch.number}, expected ${ci + 1}`);

    const nodeIds = new Set();
    for (const n of ch.nodes || []) {
      if (nodeIds.has(n.id)) errors.push(`${where}: duplicate node id '${n.id}'`);
      nodeIds.add(n.id);
      if (!KINDS.has(n.kind)) errors.push(`${where}: node '${n.id}' bad kind '${n.kind}'`);
    }

    // edges reference real nodes
    for (const e of ch.edges || []) {
      if (!nodeIds.has(e.from)) errors.push(`${where}: edge '${e.id}' from unknown node '${e.from}'`);
      if (!nodeIds.has(e.to)) errors.push(`${where}: edge '${e.id}' to unknown node '${e.to}'`);
    }
    const edgeSet = new Set((ch.edges || []).flatMap((e) => [`${e.from}>${e.to}`, `${e.to}>${e.from}`]));

    // steps: cover-first, reveal union == nodes, refs revealed-by-step
    if (!ch.steps?.[0]?.cover) errors.push(`${where}: first step must have cover:true`);
    const revealed = new Set();
    const revealedOnce = new Set();
    ch.steps?.forEach((st, si) => {
      const sw = `${where} step ${si} (${st.id})`;
      for (const id of st.reveal || []) {
        if (!nodeIds.has(id)) errors.push(`${sw}: reveals unknown node '${id}'`);
        if (revealedOnce.has(id)) errors.push(`${sw}: node '${id}' revealed more than once`);
        revealedOnce.add(id);
        revealed.add(id);
      }
      const visible = revealed;
      for (const id of st.highlight || []) if (!visible.has(id)) errors.push(`${sw}: highlights unrevealed '${id}'`);
      for (const b of st.badges || []) if (!visible.has(b.node)) errors.push(`${sw}: badge on unrevealed '${b.node}'`);
      for (const m of st.messages || []) {
        if (!visible.has(m.from)) errors.push(`${sw}: message from unrevealed '${m.from}'`);
        if (!visible.has(m.to)) errors.push(`${sw}: message to unrevealed '${m.to}'`);
        if (visible.has(m.from) && visible.has(m.to) && !edgeSet.has(`${m.from}>${m.to}`)) {
          warnings.push(`${sw}: message ${m.from}->${m.to} has no declared edge`);
        }
      }
      // spoken hygiene (auto-fix)
      if (typeof st.spoken === 'string' && SPOKEN_BAD.test(st.spoken)) {
        st.spoken = cleanSpoken(st.spoken);
        warnings.push(`${sw}: cleaned symbols from spoken text`);
      }
      if (!st.spoken || !st.spoken.trim()) errors.push(`${sw}: empty spoken text`);
    });
    // every declared node revealed exactly once
    for (const id of nodeIds) if (!revealed.has(id)) errors.push(`${where}: node '${id}' is never revealed`);

    // layout: always apply the deterministic layered layout so nodes never
    // overlap and no box sits on an arrow (the LLM's x/y are advisory).
    relayout(ch);
    for (let i = 0; i < (ch.nodes || []).length; i++) {
      for (let j = i + 1; j < ch.nodes.length; j++) {
        if (overlaps(ch.nodes[i], ch.nodes[j])) {
          warnings.push(`${where}: layout still overlaps ${ch.nodes[i].id}/${ch.nodes[j].id}`);
        }
      }
    }
  });

  return { ok: errors.length === 0, errors, warnings };
}
