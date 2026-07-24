import type { Timeline } from '../core/timeline'
import type { Act } from './acts'

/**
 * Derive an Act[] from a core channel Timeline so act-based hosts can drive
 * (or introspect) a scene authored against the channel API.
 *
 * Mapping: the timeline's BEATS become acts — each caption from
 * `tl.describe().captions` (sorted by start) yields one act named
 * `cap-<id>`, with the caption text as its `say` narration line. The act's
 * `duration` is the caption's on-screen span; any silence until the next
 * beat (or the end of the timeline) becomes `hold`. Time before the first
 * caption becomes an `intro` act; a caption-less timeline collapses to a
 * single `scene` act.
 *
 * UNITS: the core Timeline runs in SECONDS; acts run in MILLISECONDS.
 * Everything here is multiplied by 1000 (rounded to whole ms), so
 * `createTimeline(actsFromTimeline(tl)).total ≈ tl.duration * 1000`.
 *
 * Note: overlapping captions can't be represented in a strictly sequential
 * act list — a caption's duration is clipped at the next beat.
 */
export function actsFromTimeline(tl: Timeline): Act[] {
  const captions = [...tl.describe().captions].sort((a, b) => a.at - b.at)
  const total = tl.duration
  const ms = (s: number) => Math.max(0, Math.round(s * 1000))

  if (captions.length === 0) {
    return total > 0 ? [{ name: 'scene', duration: ms(total) }] : []
  }

  const acts: Act[] = []
  if (captions[0].at > 0) acts.push({ name: 'intro', duration: ms(captions[0].at) })
  for (let i = 0; i < captions.length; i++) {
    const c = captions[i]
    const end = i + 1 < captions.length ? captions[i + 1].at : Math.max(total, c.at + c.dur)
    const span = Math.max(0, end - c.at)
    const dur = Math.min(c.dur, span)
    acts.push({
      name: `cap-${c.id}`,
      duration: ms(dur),
      hold: ms(span - dur),
      say: c.text,
    })
  }
  return acts
}
