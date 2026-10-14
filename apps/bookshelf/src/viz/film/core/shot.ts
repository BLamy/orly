/**
 * Shots: authoring + auto-registration.
 *
 *   // apps/bookshelf/src/viz/films/<slug>/shots/<shotId>.tsx
 *   export default defineShot({
 *     id: 'ch01-s01', mood: 'duskRose',
 *     build({ timing: T }) {
 *       const tl = new Timeline();
 *       const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
 *       tl.tween(cam, camMove(120, 120), { at: 0, dur: T.duration, ease: ease.move });
 *       tl.hold(0, T.duration);
 *       return { tl, cam };
 *     },
 *     paint(f, s, scene) { f.camera(s.get(scene.cam)); f.backlight(); f.layer('L4', (c, env) => …); },
 *   });
 *
 * defineShot memoizes build() per (timing, fps, seed), so scenes are built once.
 * Registries (lazy, via import.meta.glob):
 *   filmSlugs()                    slugs that have a timeline.json
 *   loadTimeline(slug)             -> FilmTimelineData
 *   loadShotModules(slug)          -> Record<shotId, ShotModule> (keyed by module.id and by file name)
 *   shotFiles(slug)                shot ids that have a file
 */
import type { FilmTimelineData, ShotContext, ShotModule, ShotScene } from '../contracts';

export function defineShot<S extends ShotScene>(m: ShotModule<S>): ShotModule<S> {
  const memo = new WeakMap<object, Map<string, S>>();
  const build = m.build.bind(m);
  return {
    ...m,
    build(ctx: ShotContext): S {
      let byKey = memo.get(ctx.timing);
      if (!byKey) memo.set(ctx.timing, (byKey = new Map()));
      const k = `${ctx.fps}|${ctx.seed}`;
      let s = byKey.get(k);
      if (!s) byKey.set(k, (s = build(ctx)));
      return s;
    },
  };
}

type Loader<T> = () => Promise<T>;
const SHOTS = import.meta.glob('../../films/*/shots/*.tsx') as Record<string, Loader<{ default?: ShotModule }>>;
const TIMELINES = import.meta.glob('../../films/*/timeline.json', { import: 'default' }) as Record<string, Loader<FilmTimelineData>>;

const slugOf = (path: string) => path.split('/films/')[1]?.split('/')[0] ?? '';

export function filmSlugs(): string[] {
  return Object.keys(TIMELINES).map(slugOf).sort();
}

export function shotFiles(slug: string): string[] {
  return Object.keys(SHOTS)
    .filter((p) => slugOf(p) === slug)
    .map((p) => p.split('/').pop()!.replace(/\.tsx$/, ''));
}

export async function loadTimeline(slug: string): Promise<FilmTimelineData> {
  const key = Object.keys(TIMELINES).find((p) => slugOf(p) === slug);
  if (!key) throw new Error(`film "${slug}" has no timeline.json (have: ${filmSlugs().join(', ') || 'none'})`);
  return TIMELINES[key]();
}

/** Import every shot file of a film. Files that fail to import are reported and skipped (they render as placeholders). */
export async function loadShotModules(slug: string): Promise<{ modules: Record<string, ShotModule>; errors: Record<string, string> }> {
  const modules: Record<string, ShotModule> = {};
  const errors: Record<string, string> = {};
  await Promise.all(
    Object.entries(SHOTS)
      .filter(([p]) => slugOf(p) === slug)
      .map(async ([p, load]) => {
        const file = p.split('/').pop()!.replace(/\.tsx$/, '');
        try {
          const m = (await load()).default;
          if (!m || typeof m.paint !== 'function') throw new Error('no default export from defineShot()');
          modules[m.id] = m;
          if (file !== m.id) modules[file] = m;
        } catch (e) {
          errors[file] = String((e as Error)?.stack ?? e);
          console.error(`[film] shot ${file} failed to load`, e);
        }
      }),
  );
  return { modules, errors };
}
