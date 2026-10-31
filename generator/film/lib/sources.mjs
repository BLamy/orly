// The film's sources page (review round 1, historian: "the closing 'held to the same sources' disclosure must be
// checkable"). Built at publish from the locked script and the research bible:
//
//   buildSources(script, { claims, quotes, timeline }) -> { chapters: [{ number, title, start, shots: [{ id, start,
//        lines: [ids], claims: [{ id, claim, date, status, sources }], quotes: [{ id, text, speaker, date, source,
//        context, where }] }] }], offScreen: [...], counts }
//   sourcesHtml(doc, { title, subtitle, slug, url })    -> a standalone, printable HTML page (no scripts, no fonts)
//
// Claims come from each shot's claim ids (script.json shot.claims -> research/claims.json). Quotations are every
// quoted span in narration and every on-screen quote card, matched verbatim to research/quotes.json (with its
// speaker, date, URL and context); story/meta.json staging.creditsSources lists the quotations the film moved off
// screen. Published as public/generated/<slug>/sources/index.html (+ sources.json): the ch15-s10 SOURCES card and
// the shelf's film entry point at it.
const norm = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const spansOf = (s) => [...String(s).matchAll(/“([^”]+)”|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);

export function buildSources(script, { claims = [], quotes = [], timeline = null, offScreen = [] } = {}) {
  const C = new Map(claims.map((c) => [c.id, c]));
  const Q = quotes.map((q) => ({ ...q, n: norm(q.text) }));
  // verbatim (case and punctuation aside); an ellipsis splits a quotation into fragments that must all appear
  const findQuote = (text) => {
    const frags = String(text).split(/…|\.\.\./).map(norm).filter((f) => f.split(' ').length >= 3);
    if (!frags.length) return null;
    return Q.find((q) => frags.every((f) => q.n.includes(f))) ?? null;
  };
  const shotStart = new Map((timeline?.shots || []).map((s) => [s.id, s.start]));
  const chStart = new Map((timeline?.chapters || []).map((c) => [c.id, c.start]));
  const usedClaims = new Set();
  const usedQuotes = new Set();
  const chapters = (script.chapters || []).map((ch) => ({
    number: ch.number,
    id: ch.id,
    title: ch.title,
    start: chStart.get(ch.id) ?? null,
    shots: (ch.shots || []).map((sh) => {
      const qs = [];
      const addQ = (text, where) => {
        const q = findQuote(text);
        if (!q || qs.some((x) => x.id === q.id)) return;
        usedQuotes.add(q.id);
        qs.push({ id: q.id, text: q.text, speaker: q.speaker ?? null, date: q.date ?? null, source: q.source ?? null, context: q.context ?? null, where });
      };
      for (const l of sh.lines || []) for (const sp of spansOf(l.text)) addQ(sp, `narration ${l.id}`);
      for (const o of sh.onScreenText || []) if (o.kind === 'quote') addQ(o.text.replace(/\s+[—–]\s+[^—–]*$/, '').replace(/^[“"…\s]+|[”"…\s]+$/g, ''), 'on screen');
      const cl = (sh.claims || []).map((id) => {
        usedClaims.add(id);
        const c = C.get(id);
        return c ? { id, claim: c.claim, date: c.date ?? null, status: c.status ?? null, sources: c.sources || [] } : { id, claim: null, missing: true, sources: [] };
      });
      return { id: sh.id, start: shotStart.get(sh.id) ?? null, lines: (sh.lines || []).map((l) => l.id), claims: cl, quotes: qs };
    }),
  }));
  const off = (offScreen || []).map((e) => {
    const body = String(e.text).replace(/\s+[—–]\s+[^—–]*$/, '').replace(/^[“"…'\s]+|[”"…'\s]+$/g, '');
    const q = findQuote(body);
    if (q) usedQuotes.add(q.id);
    return { from: e.from, text: e.text, ...(q ? { id: q.id, speaker: q.speaker ?? null, date: q.date ?? null, source: q.source ?? null } : {}) };
  });
  return { chapters, offScreen: off, counts: { claims: usedClaims.size, quotes: usedQuotes.size, sources: new Set([...usedClaims].flatMap((id) => C.get(id)?.sources || [])).size } };
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const tc = (s) => (s == null ? '' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`);
/** a short, distinguishable link label: host + the start of the path (yann.lecun.com/exdb/publis/…) */
const host = (u) => {
  try {
    const x = new URL(u);
    const p = decodeURIComponent(x.pathname).replace(/\/$/, '');
    const tail = p.length > 26 ? `${p.slice(0, 25)}…` : p;
    return x.hostname.replace(/^www\./, '') + (tail && tail !== '/' ? tail : '');
  } catch {
    return u;
  }
};

export function sourcesHtml(doc, { title, subtitle = '', slug, url = '' }) {
  const link = (u) => `<a href="${esc(u)}" rel="noopener">${esc(host(u))}</a>`;
  const parts = [];
  parts.push(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sources · ${esc(title)}</title>
<style>
:root{--bg:#f6f1e7;--ink:#2a2118;--soft:#6b5d4d;--rule:#d8ccb8;--acc:#8a2d3b}
@media (prefers-color-scheme:dark){:root{--bg:#1b1713;--ink:#efe6d6;--soft:#b5a690;--rule:#3d342a;--acc:#e08a96}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 Georgia,"Times New Roman",serif}
main{max-width:860px;margin:0 auto;padding:40px 16px 80px}
h1{font-size:30px;margin:0 0 4px}h2{font-size:22px;margin:42px 0 6px;border-bottom:1px solid var(--rule);padding-bottom:6px}
h3{font:600 13px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.06em;color:var(--soft);margin:22px 0 6px;text-transform:uppercase}
.sub{color:var(--soft);margin:0 0 18px}.note{color:var(--soft);font-size:14px}
ul{padding-left:20px;margin:6px 0}li{margin:6px 0}
.claim .id,.q .id{font:12px ui-monospace,Menlo,monospace;color:var(--soft)}
.q blockquote{margin:4px 0 2px;padding-left:12px;border-left:3px solid var(--acc);font-style:italic}
a{color:var(--acc)}a:visited{color:var(--soft)}
.tc{font:12px ui-monospace,Menlo,monospace;color:var(--soft);margin-left:6px}
nav{columns:2;font-size:14px}@media(max-width:600px){nav{columns:1}}
</style></head><body><main>
<h1>Sources</h1><p class="sub"><b>${esc(title)}</b>${subtitle ? ` · ${esc(subtitle)}` : ''}</p>
<p class="note">Every factual claim in the film's narration and on screen, shot by shot, with the sources the research team verified it against, and every quotation with its speaker, date and source. ${doc.counts.claims} claims, ${doc.counts.quotes} quotations, ${doc.counts.sources} distinct sources. Claim ids refer to the film's research bible.${url ? ` This page: <a href="${esc(url)}">${esc(url.replace(/^https?:\/\//, ''))}</a>.` : ''}</p>
<nav>${doc.chapters.map((c) => `<div><a href="#${esc(c.id)}">${c.number}. ${esc(c.title)}</a><span class="tc">${tc(c.start)}</span></div>`).join('')}</nav>`);
  for (const ch of doc.chapters) {
    parts.push(`<h2 id="${esc(ch.id)}">${ch.number}. ${esc(ch.title)}<span class="tc">${tc(ch.start)}</span></h2>`);
    for (const sh of ch.shots) {
      if (!sh.claims.length && !sh.quotes.length) continue;
      parts.push(`<h3>${esc(sh.id)}<span class="tc">${tc(sh.start)}</span></h3><ul>`);
      for (const c of sh.claims)
        parts.push(`<li class="claim">${c.missing ? `<i>claim ${esc(c.id)} not found</i>` : esc(c.claim)} <span class="id">[${esc(c.id)}${c.status && c.status !== 'confirmed' ? ` · ${esc(c.status)}` : ''}]</span>${c.sources.length ? `<br>${c.sources.map(link).join(' · ')}` : ''}</li>`);
      for (const q of sh.quotes)
        parts.push(`<li class="q"><blockquote>${esc(q.text)}</blockquote>— ${esc(q.speaker ?? '')}${q.date ? `, ${esc(q.date)}` : ''} <span class="id">[${esc(q.id)} · ${esc(q.where)}]</span>${q.source ? `<br>${link(q.source)}` : ''}${q.context ? `<br><span class="note">${esc(q.context)}</span>` : ''}</li>`);
      parts.push('</ul>');
    }
  }
  if (doc.offScreen.length) {
    parts.push(`<h2 id="off-screen">Quoted in research, moved off screen</h2><ul>`);
    for (const e of doc.offScreen) parts.push(`<li class="q"><blockquote>${esc(e.text)}</blockquote><span class="id">[${esc(e.from)}${e.id ? ` · ${esc(e.id)}` : ''}]</span>${e.source ? `<br>${link(e.source)}` : ''}</li>`);
    parts.push('</ul>');
  }
  parts.push(`<p class="note" style="margin-top:40px">Generated from the film's locked script and research files (${esc(slug)}). Written with Claude Opus 5.5, made by Anthropic, a lab in this story, and held to the same sources and standard as every other.</p></main></body></html>`);
  return parts.join('\n');
}
