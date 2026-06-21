import type { NodeKind } from '../../types';

// Icons as plain data so D3 can append them. Drawn in a 24×24 box, stroked with
// the node's accent color (currentColor).
type Shape = { tag: 'rect' | 'circle' | 'ellipse' | 'path'; attrs: Record<string, number | string> };

export const ICONS: Record<NodeKind, Shape[]> = {
  client: [
    { tag: 'rect', attrs: { x: 3, y: 4, width: 18, height: 15, rx: 2 } },
    { tag: 'path', attrs: { d: 'M3 8.5h18' } },
  ],
  loadbalancer: [
    { tag: 'circle', attrs: { cx: 12, cy: 4, r: 1.6 } },
    {
      tag: 'path',
      attrs: { d: 'M12 5.6v3.4M6 13v-1.5a2.5 2.5 0 0 1 2.5-2.5h7A2.5 2.5 0 0 1 18 11.5V13M6 13v6M18 13v6M12 9v10' },
    },
    { tag: 'circle', attrs: { cx: 6, cy: 20, r: 1.6 } },
    { tag: 'circle', attrs: { cx: 12, cy: 20, r: 1.6 } },
    { tag: 'circle', attrs: { cx: 18, cy: 20, r: 1.6 } },
  ],
  service: [
    { tag: 'rect', attrs: { x: 3.5, y: 4, width: 17, height: 6.5, rx: 1.5 } },
    { tag: 'rect', attrs: { x: 3.5, y: 13.5, width: 17, height: 6.5, rx: 1.5 } },
    { tag: 'circle', attrs: { cx: 7, cy: 7.25, r: 0.8 } },
    { tag: 'circle', attrs: { cx: 7, cy: 16.75, r: 0.8 } },
  ],
  database: [
    { tag: 'ellipse', attrs: { cx: 12, cy: 6, rx: 7, ry: 3 } },
    { tag: 'path', attrs: { d: 'M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6' } },
    { tag: 'path', attrs: { d: 'M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3' } },
  ],
  cache: [{ tag: 'path', attrs: { d: 'M13 2 4 13.5h6l-1 8.5 9-12.5h-6z' } }],
  queue: [
    { tag: 'rect', attrs: { x: 3.5, y: 5, width: 17, height: 3.2, rx: 1.2 } },
    { tag: 'rect', attrs: { x: 3.5, y: 10.4, width: 17, height: 3.2, rx: 1.2 } },
    { tag: 'rect', attrs: { x: 3.5, y: 15.8, width: 17, height: 3.2, rx: 1.2 } },
  ],
  worker: [
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3.4 } },
    {
      tag: 'path',
      attrs: { d: 'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1' },
    },
  ],
  external: [
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 9 } },
    { tag: 'path', attrs: { d: 'M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18' } },
  ],
  vault: [
    { tag: 'rect', attrs: { x: 4, y: 10.5, width: 16, height: 10, rx: 2 } },
    { tag: 'path', attrs: { d: 'M8 10.5V7a4 4 0 0 1 8 0v3.5' } },
    { tag: 'circle', attrs: { cx: 12, cy: 15, r: 1.4 } },
    { tag: 'path', attrs: { d: 'M12 16.4v2.2' } },
  ],
  key: [
    { tag: 'circle', attrs: { cx: 7.5, cy: 7.5, r: 3.7 } },
    { tag: 'path', attrs: { d: 'M10.2 10.2 19 19' } },
    { tag: 'path', attrs: { d: 'M16 16l2.2-2.2' } },
    { tag: 'path', attrs: { d: 'M19 19l2.2-2.2' } },
  ],
  proxy: [
    { tag: 'rect', attrs: { x: 3, y: 4.5, width: 18, height: 15, rx: 2.5 } },
    { tag: 'path', attrs: { d: 'M7 10h8l-2.6-2.6' } },
    { tag: 'path', attrs: { d: 'M17 14H9l2.6 2.6' } },
  ],
  record: [
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 9 } },
    { tag: 'path', attrs: { d: 'M10 8.5l5.5 3.5-5.5 3.5z' } },
  ],
};
