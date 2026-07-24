import * as THREE from 'three';

// A single heart-shaped pothos leaf, drawn once into an offscreen canvas and
// reused as a shared alpha-mapped texture across every plant instance — much
// cheaper than authoring real leaf geometry, and reads fine at shelf scale.
let shared: THREE.CanvasTexture | null = null;

export function leafTexture(): THREE.CanvasTexture {
  if (shared) return shared;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  // A pothos leaf: a rounded heart, drawn as two lobes meeting at a point.
  const cx = size / 2;
  const topY = size * 0.28;
  const tipY = size * 0.92;
  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.bezierCurveTo(size * 0.05, size * 0.55, size * 0.08, topY, cx, size * 0.42);
  ctx.bezierCurveTo(size * 0.92, topY, size * 0.95, size * 0.55, cx, tipY);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, topY, 0, tipY);
  grad.addColorStop(0, '#5fae5a');
  grad.addColorStop(1, '#3d7a3f');
  ctx.fillStyle = grad;
  ctx.fill();

  // center vein
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.4);
  ctx.lineTo(cx, tipY - 4);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  shared = tex;
  return tex;
}
