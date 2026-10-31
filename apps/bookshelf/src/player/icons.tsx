// Small icons shared by the players (kept out of ChapterPlayer so FilmPlayer can use them without its scene machinery).
export function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M8 5l11 7-11 7z" />
    </svg>
  );
}
