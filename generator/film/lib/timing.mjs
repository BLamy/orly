// Pure timeline assembly — the locked edit (ARCHITECTURE §4). Unit-tested in generator/film/timeline.test.mjs.
//
//   assembleTimeline(script, clips, { fps = 24, draftWpm })
//     script: FilmScript (contracts.ts); clips: { [lineId]: { duration, speechStart, speechEnd, words:[{w,start,end}] } }
//     (all clip-relative seconds). Lines without a clip fail, unless draftWpm is set (synthetic timings).
//     -> { timeline: FilmTimelineData, placements: [{ lineId, shot, at }], warnings: string[], draftLines: string[] }
//        placements[].at = absolute film seconds where the clip's sample 0 goes.
//   resolveBeat(beat, lines, duration) -> shot-local seconds (throws with a precise message)
//   findWord(line, which) -> word index (number | text, case/punctuation-blind; first match)
//   toVtt(timeline) / chaptersText(timeline) / ffmetadata(timeline, title)
//
// Rules: shot.start = previous shot end; lines are laid end to end:
//   leadIn (0.6) · line · gap · line … · holdAfter (0.8); duration = max(computed, minDuration),
//   where gap = the next line's preGap, else this line's pauseAfter, else 0.45 (gapBefore()),
//   rounded UP to a whole frame so every cut lands on a frame boundary.
import { draftWords, normWord } from './text.mjs';

export const DEFAULTS = { leadIn: 0.6, pauseAfter: 0.45, holdAfter: 0.8 };
/** seconds a glossary tag (onScreenText kind 'term') stays up */
export const TERM_HOLD = 4.2;
export const TRANSITION_DUR = { cut: 0, crossfade: 1.0, iris: 1.2, inkBleed: 1.4, paperWipe: 1.0, fadeBlack: 1.6, lampChange: 1.2 };

const r4 = (x) => Math.round(x * 1e4) / 1e4;

export function findWord(line, which) {
  const words = line.words || [];
  if (typeof which === 'number') {
    if (!Number.isInteger(which) || which < 0 || which >= words.length) return -1;
    return which;
  }
  const target = normWord(which);
  if (!target) return -1;
  let i = words.findIndex((w) => normWord(w.w) === target);
  if (i < 0) i = words.findIndex((w) => normWord(w.w).startsWith(target));
  return i;
}

export function resolveBeat(beat, lines, duration) {
  const at = beat.at;
  if (!at || typeof at !== 'object') throw new Error(`beat ${beat.id}: missing anchor`);
  if ('shotTime' in at) {
    const t = Number(at.shotTime);
    if (!Number.isFinite(t)) throw new Error(`beat ${beat.id}: bad shotTime`);
    return r4(t < 0 && duration != null ? duration + t : t);
  }
  const line = lines.find((l) => l.id === at.line);
  if (!line) throw new Error(`beat ${beat.id}: line ${at.line} is not in this shot`);
  const edge = at.edge ?? 'start';
  if (edge !== 'start' && edge !== 'end') throw new Error(`beat ${beat.id}: edge must be start|end`);
  let t;
  if (at.word != null) {
    const i = findWord(line, at.word);
    if (i < 0) throw new Error(`beat ${beat.id}: word ${JSON.stringify(at.word)} not found in ${line.id} ("${line.text}")`);
    t = edge === 'end' ? line.words[i].end : line.words[i].start;
  } else t = edge === 'end' ? line.end : line.start;
  return r4(t + (Number(at.offset) || 0));
}

/** Seconds of silence before line `sl` when it follows `prev` in the same shot: sl.preGap ?? prev.pauseAfter ?? 0.45. */
export function gapBefore(sl, prev) {
  if (sl.preGap != null) return Number(sl.preGap);
  return prev?.pauseAfter ?? DEFAULTS.pauseAfter;
}

export function assembleTimeline(script, clips, opts = {}) {
  const fps = opts.fps ?? 24;
  const frame = (t) => Math.ceil(t * fps - 1e-6) / fps;
  const warnings = [];
  const placements = [];
  const draftLines = [];
  const chapters = [];
  const shots = [];
  let cursor = 0;
  const seenLines = new Set();
  const seenShots = new Set();
  for (const ch of script.chapters || []) {
    const chStart = cursor;
    for (const shot of ch.shots || []) {
      if (seenShots.has(shot.id)) throw new Error(`duplicate shot id ${shot.id}`);
      seenShots.add(shot.id);
      const leadIn = shot.leadIn ?? DEFAULTS.leadIn;
      const holdAfter = shot.holdAfter ?? DEFAULTS.holdAfter;
      let t = leadIn;
      const lines = [];
      (shot.lines || []).forEach((sl, i) => {
        if (seenLines.has(sl.id)) throw new Error(`duplicate line id ${sl.id}`);
        seenLines.add(sl.id);
        let clip = clips[sl.id];
        if (!clip) {
          if (!opts.draftWpm) throw new Error(`line ${sl.id} (${shot.id}) has no narration clip — run film:narrate${opts.hint ? ` ${opts.hint}` : ''}`);
          const d = draftWords(sl.text, opts.draftWpm);
          clip = { duration: d.duration, speechStart: 0, speechEnd: d.duration, words: d.words, draft: true };
          draftLines.push(sl.id);
        }
        const speech = clip.speechEnd - clip.speechStart;
        if (!(speech > 0)) throw new Error(`line ${sl.id}: empty speech span`);
        if (i > 0) {
          // the gap before this line: its own preGap wins over the previous line's pauseAfter (default 0.45 s)
          const prev = shot.lines[i - 1];
          const gap = gapBefore(sl, prev);
          if (sl.preGap != null && prev.pauseAfter != null && Math.abs(prev.pauseAfter - sl.preGap) > 1e-6) {
            warnings.push(`${sl.id}: preGap ${sl.preGap}s overrides ${prev.id}'s pauseAfter ${prev.pauseAfter}s`);
          }
          t += gap;
        } else if (sl.preGap != null) {
          warnings.push(`${sl.id}: preGap on the first line of ${shot.id} is ignored; use the shot's leadIn`);
        }
        const at = t - clip.speechStart; // shot-local time of clip sample 0
        if (!clip.draft) placements.push({ lineId: sl.id, shot: shot.id, at: r4(cursor + at) });
        lines.push({
          id: sl.id,
          text: sl.text,
          start: r4(t),
          end: r4(t + speech),
          words: (clip.words || []).map((w) => ({ w: w.w, start: r4(at + w.start), end: r4(at + w.end) })),
        });
        const last = i === shot.lines.length - 1;
        t = t + speech;
        if (last && sl.pauseAfter != null && sl.pauseAfter > holdAfter) {
          warnings.push(`${sl.id}: pauseAfter on the last line of ${shot.id} is ignored; use the shot's holdAfter`);
        }
      });
      const computed = lines.length ? t + holdAfter : leadIn + holdAfter;
      if (!lines.length && shot.minDuration == null) warnings.push(`${shot.id}: no lines and no minDuration (defaults to ${computed}s)`);
      const duration = frame(Math.max(computed, shot.minDuration ?? 0));
      const beats = {};
      for (const b of shot.beats || []) {
        if (b.id in beats) throw new Error(`${shot.id}: duplicate beat id ${b.id}`);
        const bt = resolveBeat(b, lines, duration);
        if (bt < 0 || bt > duration) warnings.push(`${shot.id}: beat ${b.id} at ${bt}s is outside the shot (0..${r4(duration)})`);
        beats[b.id] = bt;
      }
      const transitionIn = shot.transitionIn ?? (shots.length ? 'cut' : 'fadeBlack');
      const sd = {
        id: shot.id,
        chapter: ch.id,
        start: r4(cursor),
        end: r4(cursor + duration),
        lines,
        beats,
        transitionIn,
        transitionDur: TRANSITION_DUR[transitionIn] ?? 1,
        mood: shot.mood,
      };
      // glossary tags (onScreenText kind 'term'): the reel paints them over the shot, TERM_HOLD s from their beat
      // (or until their 'until' beat), never past the shot's end
      const terms = (shot.onScreenText || [])
        .filter((o) => o.kind === 'term')
        .map((o) => {
          const at = o.beat && o.beat in beats ? beats[o.beat] : 0;
          const until = o.until && o.until in beats ? beats[o.until] : Math.min(duration - 0.1, at + TERM_HOLD);
          if (o.beat && !(o.beat in beats)) warnings.push(`${shot.id}: term "${o.text}" cued on unknown beat ${o.beat}`);
          return { text: o.text, ...(o.gloss ? { gloss: o.gloss } : {}), at: r4(at), until: r4(Math.max(at + 0.5, until)) };
        });
      if (terms.length) sd.terms = terms;
      shots.push(sd);
      cursor = cursor + duration;
    }
    chapters.push({ id: ch.id, number: ch.number, title: ch.title, start: r4(chStart), end: r4(cursor) });
  }
  // transitions straddle the cut: d/2 must fit inside both neighbours
  for (let i = 1; i < shots.length; i++) {
    const a = shots[i - 1];
    const b = shots[i];
    const room = Math.min(a.end - a.start, b.end - b.start);
    if (b.transitionDur > room) {
      warnings.push(`${b.id}: ${b.transitionIn} (${b.transitionDur}s) is longer than its shots allow; clamped to ${r4(room)}s`);
      b.transitionDur = r4(room);
    }
  }
  const timeline = { slug: script.slug, fps, duration: r4(cursor), chapters, shots };
  if (draftLines.length) timeline.draft = true;
  return { timeline, placements, warnings, draftLines };
}

// ---------------------------------------------------------------------------- subtitles + chapters
const vttTime = (s) => {
  const ms = Math.round(Math.max(0, s) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
};

/** Subtitle rows: one row when it fits, else a balanced two-row split (never a lone orphan word). */
export function wrap(text, width = 42, slack = 4) {
  const words = text.split(/\s+/);
  if (text.length <= width) return [text];
  let best = null;
  for (let k = 1; k < words.length; k++) {
    const r = [words.slice(0, k).join(' '), words.slice(k).join(' ')];
    const cost = Math.max(r[0].length, r[1].length);
    if (!best || cost < best.cost) best = { cost, r };
  }
  if (best && best.cost <= width + slack) return best.r; // a few chars over 42 beats a third row or an orphan cue
  return greedy(words, width);
}

function greedy(words, width) {
  const rows = [''];
  for (const w of words) {
    const cur = rows[rows.length - 1];
    if (cur && (cur + ' ' + w).length > width) rows.push(w);
    else rows[rows.length - 1] = cur ? `${cur} ${w}` : w;
  }
  return rows;
}

/**
 * Partition tokens into the fewest contiguous groups that each fit two subtitle rows, as even in length
 * as possible and preferring breaks after sentence / clause punctuation (DP over break points).
 */
function balancedGroups(toks, maxChars) {
  const n = toks.length;
  const fits = (i, j) => {
    const t = toks.slice(i, j).join(' ');
    return t.length <= maxChars && wrap(t).length <= 2;
  };
  const brk = (j) => (/[.!?]["')\]]*$/.test(toks[j - 1]) ? -0.6 : /[,;:]["')\]]*$/.test(toks[j - 1]) ? -0.3 : 0);
  const total = toks.join(' ').length;
  for (let k = 2; k <= n; k++) {
    const target = total / k;
    // best[g][j]: min cost of splitting toks[0..j) into g groups
    const best = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(Infinity));
    const from = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(-1));
    best[0][0] = 0;
    for (let g = 1; g <= k; g++)
      for (let j = 1; j <= n; j++)
        for (let i = g - 1; i < j; i++) {
          if (best[g - 1][i] === Infinity || !fits(i, j)) continue;
          const len = toks.slice(i, j).join(' ').length;
          const c = best[g - 1][i] + ((len - target) / target) ** 2 + (j < n ? brk(j) : 0);
          if (c < best[g][j]) {
            best[g][j] = c;
            from[g][j] = i;
          }
        }
    if (best[k][n] === Infinity) continue;
    const groups = [];
    for (let g = k, j = n; g > 0; g--) {
      const i = from[g][j];
      groups.unshift(Array.from({ length: j - i }, (_, q) => i + q));
      j = i;
    }
    return groups;
  }
  return toks.map((_, i) => [i]);
}

/** Split one line into subtitle cues of ≤ 2 rows × ~42 chars, timed by its words. */
export function lineCues(line, offset = 0, maxChars = 84) {
  const text = line.text.trim();
  if (wrap(text).length <= 2 || !line.words?.length) return [{ start: offset + line.start, end: offset + line.end, text: wrap(text).join('\n') }];
  // whitespace tokens, each owning k display words (dash-joined tokens own several)
  const toks = text.split(/\s+/);
  const owns = toks.map((t) => t.split(/—|–|--/).filter((x) => /[\p{L}\p{N}]/u.test(x)).length);
  const groups = balancedGroups(toks, maxChars);
  let wi = 0;
  const cues = [];
  for (const g of groups) {
    const nWords = g.reduce((a, i) => a + owns[i], 0);
    const first = line.words[Math.min(wi, line.words.length - 1)];
    const last = line.words[Math.min(wi + Math.max(nWords, 1) - 1, line.words.length - 1)];
    wi += nWords;
    cues.push({ start: offset + first.start, end: offset + last.end, text: wrap(g.map((i) => toks[i]).join(' ')).join('\n') });
  }
  // contiguous: each cue holds until the next begins (no flicker between halves of a line)
  for (let i = 0; i < cues.length - 1; i++) cues[i].end = Math.max(cues[i].end, cues[i + 1].start);
  cues[0].start = offset + line.start;
  cues[cues.length - 1].end = offset + line.end;
  return cues;
}

export function toVtt(timeline) {
  const out = ['WEBVTT', ''];
  const cues = [];
  for (const s of timeline.shots)
    for (const l of s.lines)
      for (const c of lineCues(l, s.start)) {
        cues.push(c);
      }
  // linger 0.15 s after the last word, but never into the next cue (no two cues on screen at once)
  cues.forEach((c, i) => {
    const end = Math.min(c.end + 0.15, cues[i + 1]?.start ?? Infinity);
    out.push(String(i + 1), `${vttTime(c.start)} --> ${vttTime(Math.max(end, c.start + 0.05))}`, c.text, '');
  });
  return out.join('\n');
}

export function chaptersText(timeline) {
  const clock = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  return timeline.chapters.map((c) => `${clock(c.start)} ${c.number}. ${c.title}`).join('\n') + '\n';
}

export function ffmetadata(timeline, title) {
  const esc = (s) => String(s).replace(/([=;#\\\n])/g, '\\$1');
  const out = [';FFMETADATA1', `title=${esc(title || timeline.slug)}`, ''];
  for (const c of timeline.chapters) {
    out.push('[CHAPTER]', 'TIMEBASE=1/1000', `START=${Math.round(c.start * 1000)}`, `END=${Math.round(c.end * 1000)}`, `title=${esc(`${c.number}. ${c.title}`)}`, '');
  }
  return out.join('\n');
}

/** Which line (if any) is being spoken at absolute film time t; else the next upcoming one. */
export function lineAt(timeline, t) {
  const shot = timeline.shots.find((s) => t >= s.start && t < s.end) ?? timeline.shots[timeline.shots.length - 1];
  if (!shot) return null;
  const lt = t - shot.start;
  const cur = shot.lines.find((l) => lt >= l.start && lt <= l.end);
  if (cur) return { shot, line: cur, speaking: true, local: lt };
  const next = shot.lines.find((l) => l.start > lt);
  return { shot, line: next ?? null, speaking: false, local: lt };
}
