import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { GitbookStreamdown } from '@brett_lamy/docstream';
import { VizEmbed } from '@brett_lamy/docstream/viz';
import '@brett_lamy/docstream/styles.css';
import { VIZ_SCENES, type VizSceneEntry } from '../viz/scenes';
import type { SceneState, Timeline } from '../viz/core';
import type { ChapterV3, ManifestV3 } from './BookPlayer';
import { createNarrationTimeMap } from './narration-timing';

/**
 * The written companion post for a book: `blog.md` is GitBook-flavored
 * markdown rendered by Docstream. In addition to normal Docstream blocks,
 * this bookshelf recognizes repo-local `{% viz %}` blocks and mounts the
 * corresponding Docstream VizEmbed for only that cue window. The scene is
 * live SVG from viz-engine; no stills, GIFs, MP4s, or narration audio are
 * generated for the post.
 */

type BlogMarkdownBlock = { type: 'markdown'; markdown: string };
type BlogVizBlock = {
  type: 'viz';
  scene: string;
  from: number;
  to: number;
  cue: number;
  section?: string;
  title?: string;
};
type BlogBlock = BlogMarkdownBlock | BlogVizBlock;
type BlogTiming = Pick<ChapterV3, 'scene' | 'cues' | 'duration'>;

const VIZ_OPEN_RE = /^\s*\{%\s*viz\s+([^%]*?)\s*%\}\s*$/;
const VIZ_CLOSE_RE = /^\s*\{%\s*endviz\s*%\}\s*$/;

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[match[1]] = match[2];
  return attrs;
}

function splitBlogMarkdown(markdown: string): BlogBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: BlogBlock[] = [];
  let prose: string[] = [];
  const flushProse = () => {
    const text = prose.join('\n');
    if (text.trim()) blocks.push({ type: 'markdown', markdown: text });
    prose = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(VIZ_OPEN_RE);
    if (!open) {
      prose.push(lines[i]);
      continue;
    }

    const attrs = parseAttrs(open[1]);
    const body: string[] = [];
    let closed = false;
    for (i += 1; i < lines.length; i++) {
      if (VIZ_CLOSE_RE.test(lines[i])) {
        closed = true;
        break;
      }
      body.push(lines[i]);
    }

    const from = Number(attrs.from);
    const to = Number(attrs.to);
    if (!attrs.scene || !Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
      // Leave malformed blocks in the prose stream so the post remains
      // inspectable instead of silently dropping authoring mistakes.
      prose.push(lines[i - body.length - (closed ? 1 : 0)] ?? '');
      prose.push(...body);
      if (closed) prose.push(lines[i]);
      continue;
    }

    flushProse();
    blocks.push({
      type: 'viz',
      scene: attrs.scene,
      from,
      to,
      cue: Number.isFinite(Number(attrs.cue)) ? Number(attrs.cue) : -1,
      ...(attrs.section ? { section: attrs.section } : {}),
      ...(attrs.title ? { title: attrs.title } : {}),
    });
    if (body.join('\n').trim()) blocks.push({ type: 'markdown', markdown: body.join('\n') });
  }
  flushProse();
  return blocks;
}

type TimelineSlice = Pick<Timeline, 'duration' | 'beats' | 'sample' | 'subscribe'>;

/**
 * Present a live scene as a short, looping section without changing the
 * authored timeline or the normal chapter player. Section windows are
 * half-open: the final sample stays just before `to`, so adjacent authored
 * sections do not repeat their boundary frame.
 */
function sectionTimeline(source: Timeline, from: number, to: number): TimelineSlice {
  const start = Math.max(0, from);
  const end = Math.max(start + 0.2, to);
  const duration = end - start;
  const exclusiveEnd = Math.max(0, duration - 0.001);
  return {
    duration,
    beats: [
      0,
      ...source.beats
        .filter((beat) => beat > start && beat < end)
        .map((beat) => beat - start),
    ].filter((beat, i, all) => all.indexOf(beat) === i),
    sample(time: number) {
      const relative = Math.max(0, Math.min(time, duration));
      const state = source.sample(start + Math.min(relative, exclusiveEnd));
      return { ...state, t: relative };
    },
    subscribe(listener: () => void) {
      return source.subscribe(listener);
    },
  };
}

type DocstreamScene = ComponentProps<typeof VizEmbed>['scene'];

function BlogViz({
  block,
  timingByScene,
}: {
  block: BlogVizBlock;
  timingByScene: Record<string, BlogTiming>;
}) {
  const [entry, setEntry] = useState<VizSceneEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setEntry(null);
    setError(null);
    const load = VIZ_SCENES[block.scene];
    if (!load) {
      setError(`Unknown visualization scene “${block.scene}”.`);
      return () => { alive = false; };
    }
    load().then(
      (loaded) => alive && setEntry(loaded),
      () => alive && setError(`Could not load visualization scene “${block.scene}”.`),
    );
    return () => { alive = false; };
  }, [block.scene]);

  const scene = useMemo<DocstreamScene | null>(() => {
    if (!entry) return null;
    const built = entry.buildScene();
    const timing = timingByScene[block.scene];
    // `from`/`to` are narration-clock values from manifest.json. The normal
    // chapter player retimes its shared scene when that chapter is active,
    // while blog sections also render chapters that are not active. Invert
    // the same piecewise map in both cases so every section gets its own
    // authored source interval instead of clamping later sections to the
    // final frame.
    const map = createNarrationTimeMap(built.tl, timing?.cues, timing?.duration);
    const from = timing ? map.toSource(block.from) : block.from;
    const to = timing ? map.toSource(block.to) : block.to;
    const timeline = sectionTimeline(built.tl, from, to);
    // The published viz-engine and the bookshelf's local scene types are
    // intentionally structural matches. The cast is only at Docstream's
    // package boundary; Render still receives the same pure SceneState.
    return {
      timeline: timeline as DocstreamScene['timeline'],
      render: (state) => entry.Render({ s: state as unknown as SceneState }),
    } as DocstreamScene;
  }, [entry, block.scene, block.from, block.to, timingByScene]);

  if (error) return <p className="bp-blog-viz-error">{error}</p>;
  if (!scene) return <div className="bp-blog-viz-loading" role="status">Loading visualization…</div>;

  return (
    <div
      className="bp-blog-viz"
      aria-label={block.title ?? `Visualization section ${block.section ?? block.cue}`}
      data-viz-section={block.section ?? ''}
      data-viz-scene={block.scene}
      data-viz-from={block.from}
      data-viz-to={block.to}
    >
      <VizEmbed
        scene={scene}
        autoplay
        loop
        showCaptions={false}
        className="bp-blog-viz-embed"
      />
    </div>
  );
}

function BlogDocument({
  markdown,
  timingByScene,
}: {
  markdown: string;
  timingByScene: Record<string, BlogTiming>;
}) {
  const blocks = useMemo(() => splitBlogMarkdown(markdown), [markdown]);
  return (
    <>
      {blocks.map((block, index) => (
        block.type === 'markdown' ? (
          <GitbookStreamdown key={`markdown-${index}`} markdown={block.markdown} />
        ) : (
          <BlogViz
            key={`viz-${block.scene}-${block.cue}-${index}`}
            block={block}
            timingByScene={timingByScene}
          />
        )
      ))}
    </>
  );
}

export function BlogPanel({ base, onAvailable }: { base: string; onAvailable?: (has: boolean) => void }) {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [timingByScene, setTimingByScene] = useState<Record<string, BlogTiming>>({});
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setMarkdown(null);
    setTimingByScene({});
    setMissing(false);
    const readBlog = fetch(`${base}blog.md`).then((response) => {
      // Dev server (and the SPA's own client-routing fallback) answer 200
      // with index.html for ANY unmatched path — reject those too, or a
      // missing blog.md would render the app shell as "markdown".
      const ok = response.ok && !(response.headers.get('content-type') ?? '').includes('text/html');
      return ok ? response.text() : Promise.reject(new Error(`HTTP ${response.status}`));
    });
    const readManifest = fetch(`${base}manifest.json`).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<ManifestV3>;
    });
    Promise.all([readBlog, readManifest])
      .then(([text, manifest]) => {
        if (!alive) return;
        const nextTimings = Object.fromEntries(
          (manifest.chapters ?? []).map((chapter) => [chapter.scene, {
            scene: chapter.scene,
            cues: chapter.cues,
            duration: chapter.duration,
          }]),
        );
        setTimingByScene(nextTimings);
        setMarkdown(text);
        onAvailable?.(true);
      })
      .catch(() => {
        if (!alive) return;
        setMissing(true);
        onAvailable?.(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  if (missing) return null;
  if (!markdown) return <div className="bp-blog-loading">Loading the post…</div>;

  return (
    <div className="bp-blog">
      <BlogDocument markdown={markdown} timingByScene={timingByScene} />
    </div>
  );
}
