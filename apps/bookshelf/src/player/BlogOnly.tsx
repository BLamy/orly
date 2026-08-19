import { BlogPanel } from './BlogPanel';

const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

/** Standalone written-post route for `?blog=<slug>` — no chapter player. */
export function BlogOnly({ slug }: { slug: string }) {
  const base = `${ASSET_BASE}generated/${encodeURIComponent(slug)}/`;
  const readerHref = `${ASSET_BASE}?bundle=${encodeURIComponent(slug)}`;

  return (
    <main className="bp-blog-only">
      <div className="bp-below-video">
        <BlogPanel base={base} />
        <p className="bp-blog-only-link">
          <a href={readerHref}>Open the animated chapter reader →</a>
        </p>
      </div>
    </main>
  );
}
