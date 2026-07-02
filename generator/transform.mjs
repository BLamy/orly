// Map a validated storyboard + per-chapter audio results into the manifest the
// D3 engine consumes (an array of Chapter objects with numeric cues), mapping
// the storyboard field names (displayNarration/spoken) to the engine's
// (narration/say) and attaching the resolved cue seconds.

const ACCENTS = ['#34d399', '#f5b942', '#2dd4bf', '#fb7185', '#22d3ee', '#a78bfa', '#38bdf8', '#fbbf24'];

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'chapter';
}

// chapterAudio[i] = { audio (deploy-relative path, no leading slash), cues:number[], audioEnd:number }
export function storyboardToManifest(sb, { chapterAudio, slug }) {
  const chapters = sb.chapters.map((ch, ci) => {
    const ca = chapterAudio[ci];
    const steps = ch.steps.map((st, si) => ({
      id: st.id,
      chapter: st.cover ? `Chapter ${ch.number}` : undefined,
      title: st.title,
      narration: st.displayNarration,
      say: st.spoken,
      cover: st.cover || undefined,
      coverSubtitle: st.coverSubtitle,
      reveal: st.reveal && st.reveal.length ? st.reveal : undefined,
      hide: st.hide && st.hide.length ? st.hide : undefined,
      highlight: st.highlight && st.highlight.length ? st.highlight : undefined,
      badges: st.badges && st.badges.length ? st.badges : undefined,
      messages: st.messages && st.messages.length ? st.messages : undefined,
      viz:
        st.viz && st.viz.scene
          ? {
              scene: st.viz.scene,
              ...(Number.isInteger(st.viz.beat) && st.viz.beat >= 0 ? { beat: st.viz.beat } : {}),
            }
          : undefined,
      cue: ca ? Number(ca.cues[si].toFixed(3)) : si,
    }));
    return {
      id: `${slugify(ch.title)}-${ch.number}`,
      number: ch.number,
      title: ch.title,
      blurb: ch.blurb,
      accent: /^#[0-9a-fA-F]{6}$/.test(ch.accent || '') ? ch.accent : ACCENTS[ci % ACCENTS.length],
      audio: ca?.audio,
      audioEnd: ca ? Number(ca.audioEnd.toFixed(3)) : undefined,
      story: {
        title: ch.title,
        subtitle: sb.subtitle,
        nodes: ch.nodes,
        edges: ch.edges,
        steps,
      },
    };
  });
  return { slug, title: sb.title, subtitle: sb.subtitle, throughline: sb.throughline, chapters };
}

export { slugify };
