// Small UI control icons for the narration panel.
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const ChevronLeft = () => (
  <svg {...base}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const ChevronRight = () => (
  <svg {...base}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const Play = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

export const Pause = () => (
  <svg {...base}>
    <path d="M9 5v14M15 5v14" />
  </svg>
);

export const SoundOn = () => (
  <svg {...base}>
    <path d="M4 9v6h3.5L12 19V5L7.5 9H4z" fill="currentColor" stroke="none" />
    <path d="M16 9a4 4 0 0 1 0 6" />
    <path d="M18.5 6.5a8 8 0 0 1 0 11" />
  </svg>
);

export const SoundOff = () => (
  <svg {...base}>
    <path d="M4 9v6h3.5L12 19V5L7.5 9H4z" fill="currentColor" stroke="none" />
    <path d="M16 9l5 6M21 9l-5 6" />
  </svg>
);
