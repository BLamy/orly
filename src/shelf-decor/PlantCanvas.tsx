import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** A swaying part of a plant — a pothos vine, a snake-plant blade, even a
 *  cactus arm (barely). Idle sway is a small per-part sine wobble; scrolling
 *  the page adds a shared "windForce" impulse on top, damping back to idle. */
export type Sway = {
  group: THREE.Object3D;
  phase: number;
  freq: number;
  amp: number;
};

/** Builds one plant's contents into `potGroup` (already positioned/lit by
 *  PlantCanvas) and returns the parts that should idle-sway + catch scroll
 *  "wind". Pure aside from three.js object creation — called once per mount. */
export type PlantBuilder = (potGroup: THREE.Group, rng: () => number) => Sway[];

// ---------------------------------------------------------------------------
// One WebGL context for every plant on the page.
//
// The first version gave each plant its own WebGLRenderer, which meant it also
// had to ration them: browsers only allow ~8-16 live WebGL contexts, so plants
// were capped, released when scrolled out of view, and rebuilt on the way back
// — which is exactly the popping in and vanishing that made the shelf feel
// unstable. Instead there is now a single offscreen renderer shared by every
// plant: each instance renders its own scene into a corner of that shared
// drawing buffer and blits the result to its own plain 2D canvas.
//
// Two things follow from that, both of them the point:
//   * there is no cap — a shelf can have as many plants as it likes;
//   * a plant that scrolls out of view simply stops being re-rendered, and its
//     2D canvas keeps the last frame it was painted. Nothing ever disappears.
// ---------------------------------------------------------------------------

type Instance = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  ctx: CanvasRenderingContext2D;
  el: HTMLCanvasElement;
  w: number;
  h: number;
  sway: Sway[];
  visible: boolean;
  painted: boolean;
};

const instances = new Set<Instance>();
let renderer: THREE.WebGLRenderer | null = null;
let bufW = 0;
let bufH = 0;
let raf = 0;
let windForce = 0;
let lastScrollY = 0;
let started = 0;

function dpr(): number {
  return Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
}

/** Grows the shared drawing buffer to fit the largest plant registered so far.
 *  Resizing reallocates the buffer, so it only ever grows, and in practice
 *  settles after the first couple of plants mount. */
function ensureBuffer(w: number, h: number): THREE.WebGLRenderer {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true });
    renderer.setPixelRatio(1); // we do the DPR math ourselves, in buffer pixels
    renderer.setScissorTest(true);
    renderer.autoClear = false;
  }
  const needW = Math.ceil(w * dpr());
  const needH = Math.ceil(h * dpr());
  if (needW > bufW || needH > bufH) {
    bufW = Math.max(bufW, needW);
    bufH = Math.max(bufH, needH);
    renderer.setSize(bufW, bufH, false);
  }
  return renderer;
}

function onScroll(): void {
  const dy = window.scrollY - lastScrollY;
  lastScrollY = window.scrollY;
  windForce = Math.max(-1, Math.min(1, windForce + dy * 0.02));
}

function tick(now: number): void {
  raf = requestAnimationFrame(tick);
  const r = renderer;
  if (!r) return;
  const t = (now - started) / 1000;
  windForce *= 0.94; // damp back to idle sway

  const ratio = dpr();
  for (const inst of instances) {
    if (!inst.visible) continue;
    for (const v of inst.sway) {
      const idle = Math.sin(t * v.freq + v.phase) * v.amp;
      v.group.rotation.x = idle * 0.6 + windForce * 0.35;
      v.group.rotation.z += Math.cos(t * v.freq * 0.7 + v.phase) * 0.0006 + windForce * 0.002;
    }

    // Render into the top-left corner of the shared buffer. WebGL's viewport
    // origin is bottom-left, so "top-left" is y = bufH - h.
    const w = Math.ceil(inst.w * ratio);
    const h = Math.ceil(inst.h * ratio);
    r.setViewport(0, bufH - h, w, h);
    r.setScissor(0, bufH - h, w, h);
    r.clear(true, true, true);
    r.render(inst.scene, inst.camera);

    // Blit that corner out to this plant's own 2D canvas. drawImage's source
    // rect is in top-left coordinates, so the same region is (0, 0, w, h).
    inst.ctx.clearRect(0, 0, w, h);
    inst.ctx.drawImage(r.domElement, 0, 0, w, h, 0, 0, w, h);
    if (!inst.painted) {
      inst.painted = true;
      // Fade in only on the very first paint — an instant appearance mid-page
      // is what reads as "popping in".
      inst.el.style.opacity = '1';
    }
  }
}

function register(inst: Instance): () => void {
  instances.add(inst);
  if (instances.size === 1) {
    lastScrollY = window.scrollY;
    started = performance.now();
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
  }
  return () => {
    instances.delete(inst);
    if (instances.size === 0) {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    }
  };
}

/** Shared scene/camera/lighting/lifecycle for every shelf plant — see
 *  Pothos.tsx / Cactus.tsx / SnakePlant.tsx for the builders that plug into
 *  it. Desktop shelf only (see DesktopShelf's placement in Library.tsx). */
export function PlantCanvas({
  width,
  height,
  seed = 0,
  potY = 0.55,
  lift = 0,
  spread = 0.55,
  build,
}: {
  width: number;
  height: number;
  seed?: number;
  /** Vertical placement of the pot within the ~2.1-world-unit-tall frustum
   *  (see below) — trailing plants (pothos) want it high, leaving room below
   *  for vines to drop; upright plants (snake plant, cactus) want it lower,
   *  leaving room above for growth instead. Defaults to the pothos framing. */
  potY?: number;
  /** CSS pixels to raise the whole canvas off the shelf board — a hanging
   *  planter isn't standing on the shelf, it's suspended above it. */
  lift?: number;
  /** How far the plant reaches sideways from the pot's axis, in world units.
   *  Plant slots on the shelf are narrow and vary in width, so this is used to
   *  shrink the whole plant until its widest growth fits inside the frustum —
   *  otherwise leaves get sliced off flat against the canvas edges. */
  spread?: number;
  build: PlantBuilder;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || width < 40 || height < 60) return;

    const ratio = dpr();
    el.width = Math.ceil(width * ratio);
    el.height = Math.ceil(height * ratio);
    const ctx = el.getContext('2d');
    if (!ctx) return;

    // Simple xorshift-ish PRNG seeded per instance, so each plant looks a
    // little different but is stable across re-renders (not Math.random()).
    let s = (seed * 2654435761 + 1) >>> 0 || 1;
    const rng = () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return (s >>> 0) / 4294967296;
    };

    const scene = new THREE.Scene();
    // fov=28 at z=4.2 gives a ~2.1-world-unit-tall frustum at the origin —
    // every builder sizes its plant to fit entirely inside that, so the whole
    // thing is visible with no need to overflow its container (which would get
    // clipped anyway: .lib-series-row's overflow-x:auto forces overflow-y to
    // auto too, per the CSS overflow spec).
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20);
    camera.position.set(0, 0, 4.2);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xfff8ef, 0.6));
    const dir = new THREE.DirectionalLight(0xfff3e0, 0.95);
    dir.position.set(1.5, 2.2, 2.4);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xdce8ff, 0.28);
    fill.position.set(-1.5, 0.5, 1);
    scene.add(fill);
    // A dim light from below-behind separates the foliage from the dark shelf
    // instead of letting the underside of every leaf sink into the boards.
    const rim = new THREE.DirectionalLight(0xbfe0a8, 0.22);
    rim.position.set(-0.5, -1.5, -1.5);
    scene.add(rim);

    const potGroup = new THREE.Group();
    potGroup.position.set(0, potY, 0);
    // The frustum is ~2.1 world units tall at the origin, so half its width is
    // 1.05 * aspect. Shrink the plant if its spread wouldn't fit that.
    potGroup.scale.setScalar(Math.min(1, (1.05 * (width / height)) / spread));
    scene.add(potGroup);

    const sway = buildRef.current(potGroup, rng);
    ensureBuffer(width, height);

    const inst: Instance = {
      scene,
      camera,
      ctx,
      el,
      w: width,
      h: height,
      sway,
      visible: true,
      painted: false,
    };
    const unregister = register(inst);

    // Only re-render what's on screen; anything else keeps its last painted
    // frame rather than being torn down.
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      inst.visible = false;
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => { inst.visible = e.isIntersecting; }),
        { rootMargin: '250px 0px' },
      );
      io.observe(el);
    }

    return () => {
      io?.disconnect();
      unregister();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          // Dispose only what this instance owns. Leaf/blade geometries and
          // materials are cached and shared across every plant on the shelf
          // (see leafGeometry.ts, and the material caches in each builder);
          // disposing those here would leave every other live plant holding
          // freed GPU resources. Shared ones mark themselves userData.shared.
          if (!obj.geometry.userData.shared) obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) if (!m.userData.shared) m.dispose();
        }
      });
    };
  }, [width, height, seed, potY, spread]);

  return (
    <canvas
      ref={canvasRef}
      className="shelf-pothos"
      style={{ width, height, marginBottom: lift, opacity: 0 }}
      aria-hidden="true"
    />
  );
}
