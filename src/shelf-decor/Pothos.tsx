import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { leafTexture } from './leafTexture';

// Caps how many Pothos WebGL contexts can be alive at once, app-wide — a
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

type Vine = {
  group: THREE.Group;
  phase: number;
  freq: number;
  amp: number;
};

/** A trailing vine of `n` leaves drooping from a rim point, via a slightly
 *  randomized catenary-ish curve. Returns the root group (pivoted at the rim
 *  point, so swaying it rotates the whole vine naturally from its anchor). */
function buildVine(rng: () => number, reach: number, drop: number, hue: number): Vine {
  const group = new THREE.Group();

  const segs = 5 + Math.floor(rng() * 2);
  const pts: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    // droop like a loose hanging cable, with a little side-to-side wander
    const x = Math.sin(t * 1.4 + rng() * 0.4) * reach * 0.18 * t;
    const y = -drop * (t * t * 0.85 + t * 0.15);
    const z = (rng() - 0.5) * 0.3 * t;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.012 + rng() * 0.006, 5, false);
  const vineColor = new THREE.Color().setHSL(hue, 0.35, 0.28 + rng() * 0.08);
  const tubeMat = new THREE.MeshStandardMaterial({ color: vineColor, roughness: 0.85 });
  group.add(new THREE.Mesh(tubeGeo, tubeMat));

  const tex = leafTexture();
  const leafMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
  });

  const leafCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < leafCount; i++) {
    const t = 0.25 + (i / leafCount) * 0.7 + rng() * 0.05;
    const p = curve.getPointAt(Math.min(1, t));
    const tangent = curve.getTangentAt(Math.min(1, t));
    const scale = 0.16 + rng() * 0.08;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), leafMat);
    leaf.position.copy(p);
    leaf.lookAt(p.clone().add(new THREE.Vector3(rng() - 0.5, 0.2, 1)));
    leaf.rotateZ(rng() * Math.PI * 2);
    leaf.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.atan2(tangent.x, tangent.z));
    group.add(leaf);
  }

  return { group, phase: rng() * Math.PI * 2, freq: 0.5 + rng() * 0.4, amp: 0.05 + rng() * 0.04 };
}

/** A small potted pothos, three.js-rendered, sitting on a shelf board with a
 *  few vines trailing down over the edge. Sways gently on its own, and gets
 *  a brief extra "breeze" of sway whenever the page scrolls. Desktop shelf
 *  only — see DesktopShelf's placement logic in Library.tsx. */
export function Pothos({ width, height, seed = 0 }: { width: number; height: number; seed?: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
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
    // the pot/vine layout below is sized to fit entirely inside that, so the
    // whole plant is visible with no need to overflow its container (which
    // would get clipped anyway: .lib-series-row's overflow-x:auto forces
    // overflow-y to auto too, per the CSS overflow spec).
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20);
    camera.position.set(0, 0, 4.2);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xfff3e0, 0.7);
    dir.position.set(1.5, 2, 2);
    scene.add(dir);

    // pot, sitting in the upper portion of the frame — vines cascade down
    // from its rim toward the bottom, like a trailing plant on a high shelf.
    const potGroup = new THREE.Group();
    potGroup.position.set(0, 0.55, 0);
    const potGeo = new THREE.CylinderGeometry(0.32, 0.24, 0.42, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xb5673f, roughness: 0.9 });
    const pot = new THREE.Mesh(potGeo, potMat);
    potGroup.add(pot);
    const soilGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.04, 16);
    const soil = new THREE.Mesh(soilGeo, new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 1 }));
    soil.position.y = 0.21;
    potGroup.add(soil);
    scene.add(potGroup);

    const vineCount = 3 + Math.floor(rng() * 2);
    const vines: Vine[] = [];
    for (let i = 0; i < vineCount; i++) {
      const angle = (i / vineCount) * Math.PI * 0.7 - Math.PI * 0.35 + (rng() - 0.5) * 0.2;
      const reach = 0.28 + rng() * 0.18;
      const drop = 0.9 + rng() * 0.5;
      const hue = 0.28 + rng() * 0.08;
      const vine = buildVine(rng, reach, drop, hue);
      vine.group.position.set(Math.sin(angle) * 0.22, 0.18, Math.cos(angle) * 0.1);
      vine.group.rotation.z = angle * 0.5;
      potGroup.add(vine.group);
      vines.push(vine);
    }

    let raf = 0;
    let windForce = 0;
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      windForce = Math.max(-1, Math.min(1, windForce + dy * 0.02));
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    let start = performance.now();
    let dead = false;
    const tick = (now: number) => {
      if (dead) return;
      const t = (now - start) / 1000;
      windForce *= 0.94; // damp back to idle sway
      for (const v of vines) {
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
  }, [allowed, width, height, seed]);

  return <div ref={mountRef} className="shelf-pothos" style={{ width, height }} aria-hidden="true" />;
}
