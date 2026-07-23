import { useEffect, useState } from 'react';
import { GitbookStreamdown } from '@brett_lamy/docstream';
import '@brett_lamy/docstream/styles.css';

/**
 * The written companion post for a book: `blog.md` (GitBook-flavored
 * markdown, image paths already absolute — see .claude/commands/new-book.md
 * step 8) rendered with docstream. Renders nothing if the book has no post.
 */
export function BlogPanel({ base, onAvailable }: { base: string; onAvailable?: (has: boolean) => void }) {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setMarkdown(null);
    setMissing(false);
    fetch(`${base}blog.md`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((text) => {
        if (!alive) return;
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
      <GitbookStreamdown markdown={markdown} />
    </div>
  );
}
