import type { GalleryModule } from './main';
import type { Camera3, MoodId } from '../contracts';
import { CAMERA3_HOME } from '../contracts';
import { createFrame } from '../core/frame';
import { loadFilmFonts } from '../silhouette/type';
import { makeEnv, mood, withAlpha } from '../silhouette/palette';
import { hands } from '../../films/handwired-explained/cast';
import { tagLineScene, tagsAt, tagAnchors, tagStrike, type TagState } from '../../films/handwired-explained/sets/tagLine';
import { handwiredDesk } from '../../films/handwired-explained/sets/handwiredDesk';
import { windowCalendar } from '../../films/handwired-explained/sets/windowCalendar';
import { RB, belts, rampBench } from '../../films/handwired-explained/sets/rampBench';
import { matmulLoom } from '../../films/handwired-explained/sets/matmulLoom';
import { hostClockwork } from '../../films/handwired-explained/sets/hostClockwork';
import { reGluValve } from '../../films/handwired-explained/sets/reGluValve';

/**
 * handwired-explained shared sets through the real multiplane Frame (1920×1080).
 *   ?v=line&shot=ch03-s03&when=start   the canonical tag-line workshop with the tags as the film left them
 *   ?v=lineMacro                       a push-in on tags 3-6 mid-actions (flip, strike, knot cards, hands, pencil)
 *   ?v=lineAll                         ch12's whole line (every tag, every thread on the rule)
 *   ?v=desk&x=table|gates|loom|clockwork|valve|none   the HandwiredOS desk (X-ray beats)
 *   ?v=calendar&u=..&tower=..          the Window Calendar
 *   ?v=bench&a=4.5                     the Two Ramps and a Lever bench
 *   ?v=loom&u=..                       the matmul loom (real circuit)
 *   ?v=clock&u=..                      the host clockwork
 *   ?v=valve&b=-0.1                    the ReGLU valve
 */
const W = 1920, H = 1080;
const bufs: Record<string, CanvasRenderingContext2D> = {};
function buf(name: string) {
  if (!bufs[name]) {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    bufs[name] = cv.getContext('2d')!;
  }
  return bufs[name];
}

function frame(name: string, t: number, m: MoodId, cam: Camera3 = CAMERA3_HOME) {
  const c = buf(name);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, W, H);
  const f = createFrame({ c, pxScale: 1.5, t, fps: 24, seed: 2026, mood: m });
  f.camera(cam);
  return { f, c };
}

const g: GalleryModule = {
  title: 'sets: handwired-explained',
  duration: 6,
  async setup() {
    await loadFilmFonts();
  },
  paint(out, genv) {
    const q = new URLSearchParams(location.search);
    const v = q.get('v') ?? 'line';
    const t = genv.t;
    const blit = (c: CanvasRenderingContext2D) => out.drawImage(c.canvas, 0, 0, 1280, 720);

    if (v === 'line' || v === 'lineAll') {
      const shot = v === 'lineAll' ? 'ch12-s01' : q.get('shot') ?? 'ch03-s03';
      const when = (q.get('when') ?? 'start') as 'start' | 'end';
      const m = (q.get('mood') ?? 'candleAmber') as MoodId;
      const { f, c } = frame('line', t, m);
      const variant = (q.get('variant') ?? (shot.startsWith('ch08') ? 'cold' : shot.startsWith('ch10') ? 'doors' : 'workshop')) as 'workshop' | 'cold' | 'doors';
      tagLineScene(f, { variant, tags: tagsAt(shot, v === 'lineAll' ? 'end' : when), key: 'gal', desk: { translucency: shot >= 'ch03' ? 0.2 : 0 } });
      blit(c);
      return;
    }

    if (v === 'lineMacro') {
      const cam: Camera3 = { x: 470, y: 470, z: 520, lens: 1 };
      const { f, c } = frame('macro', t, 'candleAmber', cam);
      const u = Number(q.get('u') ?? '0.5');
      const states: TagState[] = [
        { id: '3', ink: 1, flip: 0, strike: u, subject: true },
        { id: '4', ink: 1, flip: 0.62 + 0.38 * u, backInk: u, subject: true },
        { id: '5', ink: 0.6, subject: true },
        { id: '6', ink: 1, rivet: 1, subject: true },
      ];
      const tie = tagAnchors({ id: '5' });
      const k = tagStrike(states[0]);
      const E = hands.entry(cam, 'L4');
      const pp = hands.pencil('strike', 0.35 + u * 0.12, k.centre, { strikeW: k.w, strikeAngle: k.angle, entry: E.pencil, scale: 0.8 });
      states[0].strike = pp.stroke ?? 0;
      tagLineScene(f, {
        tags: states,
        key: 'galm',
        desk: { translucency: 0.2 },
        l4: (cc, env) => {
          hands.draw(cc, pp, env);
          hands.draw(cc, hands.act('tie', 0.42, tie.knot, { held: 'tag', entry: E, scale: 0.8 }), env);
        },
      });
      blit(c);
      return;
    }

    if (v === 'desk') {
      const x = q.get('x') ?? 'none';
      const m = (q.get('mood') ?? 'candleAmber') as MoodId;
      const u = Number(q.get('u') ?? '1');
      const { f, c } = frame('desk', t, m);
      f.backlight({ sunX: 640 });
      f.layer('L3', (cc, env) => {
        handwiredDesk(f, cc, env, {
          x: 180, y: 110, w: 920,
          translucency: x === 'none' ? 0 : 0.35,
          xray: x === 'none' ? undefined : { [x]: u },
          rowsTick: env.tq, photosLit: 12, sidebarKick: 0, wire: 0.6, key: 'gal',
        });
      });
      f.fog('B');
      blit(c);
      return;
    }

    if (v === 'calendar') {
      const u = Number(q.get('u') ?? '1');
      const tower = Number(q.get('tower') ?? '0');
      const { f, c } = frame('cal', t, 'winterBlue');
      f.backlight({ sunX: 900 });
      f.fog('A');
      f.layer('L3', (cc, env) => windowCalendar(f, cc, env, { x: 640, y: 680, fill: { jun: u, jul: u, sep: u, oct: u }, tower, key: 'gal', nameplate: 'Handwired' }));
      f.fog('B');
      blit(c);
      return;
    }

    if (v === 'bench') {
      const a = Number(q.get('a') ?? '4.5');
      const { f, c } = frame('bench', t, 'parchment');
      f.backlight({ sunX: 640 });
      f.layer('L3', (cc, env) => belts(cc, env, { x: 760, y: 300, phase: t * 0.5, bit: RB.above4(a) }));
      f.layer('L4', (cc, env) => rampBench(cc, env, { x: 520, y: 590, a, lever: true, tray: true, showResult: true, numerals: true }));
      f.rim({ x: 0, y: -1 });
      blit(c);
      return;
    }

    if (v === 'loom') {
      const u = Number(q.get('u') ?? String((t / 6) % 1));
      const { f, c } = frame('loom', t, 'serverCyan');
      f.backlight({ sunX: 640 });
      f.layer('L4', (cc, env) => matmulLoom(f, cc, env, { x: 90, y: 160, w: 1100, h: 420, wave: u, chain: 1, key: 'gal' }));
      blit(c);
      return;
    }

    if (v === 'clock') {
      const u = Number(q.get('u') ?? String(t));
      const { f, c } = frame('clock', t, 'candleAmber');
      f.backlight({ sunX: 640 });
      f.layer('L4', (cc, env) => hostClockwork(cc, env, { x: 640, y: 380, r: 190, tick: u, steps: 120 + Math.floor(t * 30) % 300, arms: true }));
      f.rim({ x: 0, y: -1 });
      blit(c);
      return;
    }

    if (v === 'valve') {
      const b = Number(q.get('b') ?? '-0.1');
      const { f, c } = frame('valve', t, 'dawnGold');
      f.backlight({ sunX: 640 });
      f.layer('L4', (cc, env) => reGluValve(cc, env, { x: 640, y: 380, s: 1.4, w: 0.5, g: 0.25, b, forward: 1, backward: 0.6, labels: true }));
      f.rim({ x: 0, y: -1 });
      blit(c);
      return;
    }

    const env = makeEnv({ mood: 'candleAmber', t });
    out.fillStyle = mood('candleAmber').sky[1];
    out.fillRect(0, 0, 1280, 720);
    out.fillStyle = withAlpha(env.mood.core, 0.9);
    out.fillText(`unknown view ${v}`, 40, 40);
  },
};
export default g;
