import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Simpson's Paradox — the regression that gets the sign wrong.
 *
 * A real confounded dataset generated at module scope: two groups, each
 * with true within-group slope +0.8 plus noise, but group B sits at higher
 * x and lower intercept. The least-squares slopes on stage are really
 * computed: SLOPE_A ≈ +0.67, SLOPE_B ≈ +0.77, SLOPE_POOLED ≈ −0.84 — the
 * pooled fit points the opposite way from every group it summarizes.
 */

export interface Pt {
  x: number;
  y: number;
  g: 0 | 1;
}

export const DATA: Pt[] = (() => {
  const rand = mulberry32(3);
  const g = gaussian(rand);
  const pts: Pt[] = [];
  for (let i = 0; i < 30; i++) {
    const x = rand() * 2;
    pts.push({ x, y: 0.8 * x + 2 + 0.25 * g(), g: 0 });
  }
  for (let i = 0; i < 30; i++) {
    const x = 2 + rand() * 2;
    pts.push({ x, y: 0.8 * x - 2.4 + 0.25 * g(), g: 1 });
  }
  return pts;
})();

export interface Fit {
  slope: number;
  intercept: number;
}
function lsq(pts: Pt[]): Fit {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

export const FIT_A: Fit = lsq(DATA.filter((p) => p.g === 0)); // slope ≈ +0.67
export const FIT_B: Fit = lsq(DATA.filter((p) => p.g === 1)); // slope ≈ +0.77
export const FIT_POOLED: Fit = lsq(DATA); // slope ≈ −0.84

export const sx: ScaleLinear<number, number> = scaleLinear().domain([-0.2, 4.4]).range([120, 1160]);
export const sy: ScaleLinear<number, number> = scaleLinear().domain([-1.2, 4.6]).range([620, 100]);

export const CAM_MID: CameraState = { x: 640, y: 350, k: 1.12 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  dataP: ChannelRef<number>;
  pooledU: ChannelRef<number>;
  colorU: ChannelRef<number>;
  fitAU: ChannelRef<number>;
  fitBU: ChannelRef<number>;
  dagU: ChannelRef<number>;
  chipU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const dataP = tl.channel('dataP', 0);
  const pooledU = tl.channel('pooledU', 0);
  const colorU = tl.channel('colorU', 0);
  const fitAU = tl.channel('fitAU', 0);
  const fitBU = tl.channel('fitBU', 0);
  const dagU = tl.channel('dagU', 0);
  const chipU = tl.channel('chipU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the innocent question ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here are sixty measurements: dose along the bottom, outcome up the side. One innocent question — does more dose mean better outcomes?',
  });
  tl.tween(axU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_MID, { at: 0.9, dur: 2.0, ease: ease.move });
  tl.tween(dataP, 1, { at: 1.4, dur: 3.0, ease: ease.linear });

  tl.caption({
    at: 6.5,
    dur: 5.6,
    text: 'Ask a regression and it answers instantly: the best-fit line slopes downward at minus zero point eight. More dose, worse outcome. Case closed?',
  });
  tl.tween(pooledU, 1, { at: 7.3, dur: 1.8, ease: ease.draw });
  tl.hold(12.1, 0.6);

  // — Beat 2 · the split ————————————————————————————————————————————————
  tl.caption({
    at: 12.7,
    dur: 5.8,
    text: 'Now reveal one hidden column: which of two severity groups each patient belongs to. Watch the same sixty points sort themselves.',
  });
  tl.tween(colorU, 1, { at: 13.7, dur: 1.8, ease: ease.move });

  tl.caption({
    at: 18.9,
    dur: 6.2,
    text: 'Fit each group on its own, and both lines slope upward — plus zero point seven within the mild group, plus zero point eight within the severe group.',
  });
  tl.tween(pooledU, 0.25, { at: 19.1, dur: 1.0, ease: ease.move });
  tl.tween(fitAU, 1, { at: 19.5, dur: 1.4, ease: ease.draw });
  tl.tween(fitBU, 1, { at: 21.1, dur: 1.4, ease: ease.draw });

  tl.caption({
    at: 25.5,
    dur: 5.8,
    text: 'Every group says the dose helps. The pool of all groups says it hurts. Both computations are correct — that is the paradox.',
  });
  tl.tween(chipU, 1, { at: 26.3, dur: 0.9, ease: ease.enter });
  tl.hold(31.3, 0.6);

  // — Beat 3 · the mechanism ————————————————————————————————————————————
  tl.caption({
    at: 31.9,
    dur: 6.2,
    text: 'The trick is a confounder. Severe patients get bigger doses and have worse outcomes anyway — severity pushes on both variables at once.',
  });
  tl.tween(dagU, 1, { at: 32.7, dur: 1.0, ease: ease.enter });

  tl.caption({
    at: 38.5,
    dur: 5.8,
    text: 'The pooled line is not measuring the dose at all. It is mostly measuring severity, laundered through the dose it correlates with.',
  });

  // — Beat 4 · the moral ————————————————————————————————————————————————
  tl.caption({
    at: 44.7,
    dur: 5.8,
    text: 'So correlation is not causation is not a slogan — it is an arithmetic fact you just watched: a slope that flips its sign when a lurking variable surfaces.',
  });

  tl.caption({
    at: 50.9,
    dur: 5.6,
    text: 'The uncomfortable question is: which answer do you act on? That depends on what pushing the dose would actually do — and that is the next chapter.',
  });
  tl.tween(closeU, 1, { at: 51.3, dur: 0.9, ease: ease.enter });
  tl.hold(56.5, 1.4);

  return { tl, cam, axU, dataP, pooledU, colorU, fitAU, fitBU, dagU, chipU, closeU };
}
