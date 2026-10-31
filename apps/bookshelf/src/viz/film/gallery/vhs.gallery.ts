import type { GalleryModule } from './main';
import type { BookMeta } from '../../../library/cover';
import { drawVhsCase, drawVhsSpine, loadVhsFonts, VHS_ASPECT, VHS_SPINE_RATIO, type VhsSpec } from '../../../library/vhs';

// VHS sleeve line-up: one case per theme plus their spines (library/vhs.ts).
const film = (slug: string, title: string, vhs: VhsSpec, runtime: number): BookMeta & { vhs: VhsSpec; runtime: number; kind: string } => ({
  slug, title, subtitle: '', author: '', role: '', color: '#000', animal: '', href: '', kind: 'film', vhs, runtime,
});
const FILMS = [
  film('neural-net-history', 'The Long Night of the Neuron', { subject: 'Computer Science', theme: 'grid', icons: ['neuron', 'chip', 'brain', 'crt'], tagline: 'How machines learned to learn!' }, 1980),
  film('perceptron-short', 'The Machine That Learned to See', { subject: 'Computer Science', theme: 'cosmos', icons: ['crt', 'lightbulb', 'neuron', 'gear'], tagline: 'A one-minute short' }, 45),
  film('x-biology', 'Our Living Earth', { subject: 'Biology', theme: 'jungle', icons: ['globe', 'dna', 'magnifier', 'flask'] }, 1500),
  film('x-chem', 'The Elements', { subject: 'Chemistry', theme: 'lab', icons: ['atom', 'flask', 'book', 'lightbulb'] }, 1320),
  film('x-ocean', 'Secrets of the Deep', { subject: 'Oceanography', theme: 'ocean', icons: ['globe', 'magnifier', 'gear', 'book'] }, 1800),
  film('x-space', 'Adventures in Space', { subject: 'Astronomy', theme: 'sunset', icons: ['rocket', 'planet', 'globe', 'robot'] }, 1740),
];

const g: GalleryModule = {
  title: 'VHS sleeves',
  async setup() {
    await loadVhsFonts();
  },
  paint(c) {
    c.fillStyle = '#2b2118';
    c.fillRect(0, 0, 1280, 720);
    const H = 420, W = H * VHS_ASPECT, gap = 14;
    FILMS.forEach((f, i) => {
      c.save();
      c.translate(24 + i * (W + gap), 30);
      drawVhsCase(c, W, H, f);
      c.restore();
    });
    const sH = 220, sW = sH * VHS_SPINE_RATIO * 1.15;
    FILMS.forEach((f, i) => {
      c.save();
      c.translate(40 + i * (sW + 10), 476);
      drawVhsSpine(c, sW, sH, f);
      c.restore();
    });
  },
};
export default g;
