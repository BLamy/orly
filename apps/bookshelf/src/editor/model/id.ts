/**
 * Editor ids: short, collision-resistant, JSON-safe strings for events, tracks, media, markers, regions, FX and
 * groups.
 *
 *   newId('e')                       -> 'e-lq3k9x-4f2a1c'  (prefix, base-36 ms clock, random tail)
 *   uniqueId('e', taken)             -> newId('e') retried until it is not in `taken` (and added to it)
 *   projectIds(p)                    -> every id in use in a project (events, tracks, media, markers, regions, FX)
 *   slugId('cue', 'm01')             -> 'cue-m01' (deterministic ids for imported film material)
 *
 * Random ids come from crypto.getRandomValues when available (browser, Node ≥ 19), else Math.random; the clock
 * part keeps ids created in one session roughly sortable, which makes project.json diffs easier to read.
 */
import type { Project } from './types.ts';

let counter = 0;

function randomHex(bytes: number): string {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  const a = new Uint8Array(bytes);
  if (c?.getRandomValues) c.getRandomValues(a);
  else for (let i = 0; i < bytes; i++) a[i] = Math.floor(Math.random() * 256);
  let s = '';
  for (const b of a) s += b.toString(16).padStart(2, '0');
  return s;
}

/** a fresh id: `<prefix>-<clock36>-<random>`; ids made in the same millisecond still differ (counter + random) */
export function newId(prefix = 'id'): string {
  counter = (counter + 1) % 1296;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36).padStart(2, '0')}-${randomHex(3)}`;
}

/** a fresh id not in `taken`; the id is added to `taken` so a loop can mint many */
export function uniqueId(prefix: string, taken: Set<string>): string {
  let id = newId(prefix);
  while (taken.has(id)) id = newId(prefix);
  taken.add(id);
  return id;
}

/** deterministic id for imported material: other characters than [A-Za-z0-9._-] become '_' */
export function slugId(prefix: string, key: string): string {
  return `${prefix}-${key.replace(/[^A-Za-z0-9._-]+/g, '_')}`;
}

/** every id in use in a project (for collision checks when minting ids in bulk) */
export function projectIds(p: Project): Set<string> {
  const ids = new Set<string>(Object.keys(p.media));
  for (const tr of p.tracks) {
    ids.add(tr.id);
    for (const fx of tr.videoFx ?? []) ids.add(fx.id);
    for (const fx of tr.audioFx ?? []) ids.add(fx.id);
    for (const e of tr.events) {
      ids.add(e.id);
      if (e.group) ids.add(e.group);
      for (const fx of e.videoFx ?? []) ids.add(fx.id);
      for (const fx of e.audioFx ?? []) ids.add(fx.id);
    }
  }
  for (const m of p.markers) ids.add(m.id);
  for (const r of p.regions) ids.add(r.id);
  return ids;
}
