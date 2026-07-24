import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Caps how many plant WebGL contexts can be alive at once, app-wide — a
// shelf with many rows could otherwise mount more instances than browsers
// allow concurrent WebGL contexts for (~8-16, browser-dependent). Instances
// beyond the cap just render the plain shelf board underneath (no plant),
// which is an acceptable degrade for a decorative extra.
const MAX_LIVE = 8;
let liveCount = 0;

function useInViewport(ref: React.RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

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

/** Shared renderer/scene/camera/lighting/lifecycle for every shelf plant —
 *  see Pothos.tsx / Cactus.tsx / SnakePlant.tsx for the builders that plug
 *  into it. Desktop shelf only (see DesktopShelf's placement in Library.tsx). */
export function PlantCanvas({
  width,
  height,
  seed = 0,
  potY = 0.55,
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
  build: PlantBuilder;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const buildRef = useRef(build);
  buildRef.current = build;
  const inView = useInViewport(mountRef);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!inView) {
      if (allowed) {
        liveCount = Math.max(0, liveCount - 1);
        setAllowed(false);
      }
      return;
    }
    if (liveCount < MAX_LIVE) {
      liveCount++;
      setAllowed(true);
      return () => {
        liveCount = Math.max(0, liveCount - 1);
      };
    }
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = mountRef.current;
    if (!el || !allowed || width < 40 || height < 60) return;

    // Simple xorshift-ish PRNG seeded per instance, so each plant looks a
    // little different but is stable across re-renders (not Math.random()).
    let s = (seed * 2654435761 + 1) >>> 0 || 1;
    const rng = () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return (s >>> 0) / 4294967296;
    };

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // fov=28 at z=4.2 gives a ~2.1-world-unit-tall frustum at the origin —
    // every builder sizes its plant to fit entirely inside that, so the
    // whole thing is visible with no need to overflow its container (which
    // would get clipped anyway: .lib-series-row's overflow-x:auto forces
    // overflow-y to auto too, per the CSS overflow spec).
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20);
    camera.position.set(0, 0, 4.2);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xfff8ef, 0.65));
    const dir = new THREE.DirectionalLight(0xfff3e0, 0.9);
    dir.position.set(1.5, 2.2, 2.4);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xdce8ff, 0.25);
    fill.position.set(-1.5, 0.5, 1);
    scene.add(fill);

    const potGroup = new THREE.Group();
    potGroup.position.set(0, potY, 0);
    scene.add(potGroup);

    const sway = buildRef.current(potGroup, rng);

    let raf = 0;
    let windForce = 0;
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      windForce = Math.max(-1, Math.min(1, windForce + dy * 0.02));
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const start = performance.now();
    let dead = false;
    const tick = (now: number) => {
      if (dead) return;
      const t = (now - start) / 1000;
      windForce *= 0.94; // damp back to idle sway
      for (const v of sway) {
        const idle = Math.sin(t * v.freq + v.phase) * v.amp;
        v.group.rotation.x = idle * 0.6 + windForce * 0.35;
        v.group.rotation.z += Math.cos(t * v.freq * 0.7 + v.phase) * 0.0006 + windForce * 0.002;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [allowed, width, height, seed, potY]);

  return <div ref={mountRef} className="shelf-pothos" style={{ width, height }} aria-hidden="true" />;
}
