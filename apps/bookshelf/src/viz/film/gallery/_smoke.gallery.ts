import type { GalleryModule } from './main';
// Harness smoke test: a moving dusk gradient, a disc, and a serif label.
const g: GalleryModule = {
  title: 'harness smoke test',
  duration: 4,
  fonts: ['600 48px Georgia'],
  paint(c, env) {
    const sky = c.createLinearGradient(0, 0, 0, 720);
    sky.addColorStop(0, '#49342e'); sky.addColorStop(0.6, '#b18e79'); sky.addColorStop(1, '#8e6c62');
    c.fillStyle = sky; c.fillRect(0, 0, 1280, 720);
    c.fillStyle = '#14100e'; c.beginPath(); c.arc(200 + env.t * 200, 400, 80, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f5d998'; c.font = '600 48px Georgia'; c.fillText(`t = ${env.t.toFixed(2)}s`, 60, 100);
  },
};
export default g;
