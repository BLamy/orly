/**
 * Credits under the film (generator/film/publish.mjs → credits.json, built by generator/film/lib/credits.mjs from
 * the recorded provenance): every model and tool that made the film, and every music cue with a strudel.cc link
 * that opens its exact Strudel source in the REPL (▶ plays that cue's moment in the film).
 */
interface CreditsDoc {
  roles: { role: string; credit: string; detail?: string }[];
  cues: { id: string; title: string | null; start: number; end: number; url: string }[];
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function CreditsPanel({ doc, onSeek }: { doc: CreditsDoc; onSeek: (t: number) => void }) {
  return (
    <section className="fp-credits" aria-label="Credits">
      <header>
        <strong>Credits</strong>
        <span>who and what made this film</span>
      </header>
      <dl>
        {doc.roles.map((r) => (
          <div key={r.role}>
            <dt>{r.role}</dt>
            <dd>
              <b>{r.credit}</b>
              {r.detail && <p>{r.detail}</p>}
            </dd>
          </div>
        ))}
      </dl>
      {doc.cues.length > 0 && (
        <>
          <h3>Music · {doc.cues.length} Strudel cues</h3>
          <p className="fp-credits-note">Each link opens the cue's exact source in strudel.cc, ready to play and remix.</p>
          <ol className="fp-cues">
            {doc.cues.map((c) => (
              <li key={c.id}>
                <button className="fp-src-at" onClick={() => onSeek(c.start)} title="Play this cue's moment in the film">
                  ▶ {mmss(c.start)}
                </button>
                <span className="fp-cue-id">{c.id}</span>
                <span className="fp-cue-title">{c.title ?? c.id}</span>
                <a href={c.url} target="_blank" rel="noopener">
                  Open in strudel.cc ↗
                </a>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

export type { CreditsDoc };
