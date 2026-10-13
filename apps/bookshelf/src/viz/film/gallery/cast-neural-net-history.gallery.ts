import type { GalleryModule } from './main';
import type { MoodId } from '../contracts';
import { makeEnv, mood, withAlpha } from '../silhouette/palette';
import { POSES, addPose, withLife, type GestureId } from '../silhouette/puppet';
import { backdrop } from './puppets.gallery';
import { cast, CAST_INFO, SPECS, hands, type CastId } from '../../films/neural-net-history/cast';
import type { HandAction } from '../../films/neural-net-history/sets/narratorHands';

/**
 * neural-net-history cast line-up.
 *   ?page=0..4   the cast by era, each in a characteristic pose, labelled (default page 0)
 *   ?thumb       every puppet at 64 px (style bible §4.1 thumbnail test)
 *   ?hands       the detective's hands: the six actions at their key moments (candleAmber)
 */
const PAGES: { mood: MoodId; title: string; ids: [CastId, GestureId, 'left' | 'right'][] }[] = [
  {
    mood: 'candleAmber',
    title: '1940s: Chicago, the Macy circle, Montréal',
    ids: [
      ['pitts', 'listen', 'right'],
      ['mcculloch', 'present', 'right'],
      ['gerard', 'doubt', 'left'],
      ['hebb', 'think', 'left'],
      ['turing', 'stand', 'right'],
      ['minsky', 'point', 'right'],
      ['mccarthy', 'present', 'left'],
      ['widrow', 'listen', 'left'],
    ],
  },
  {
    mood: 'labGreen',
    title: '1950s–70s: Washington, Buffalo, MIT, Britain',
    ids: [
      ['rosenblatt', 'present', 'right'],
      ['navy-officer', 'authority', 'left'],
      ['reporter', 'write', 'left'],
      ['newsboy', 'walkStand', 'right'],
      ['minsky-1960s', 'stand', 'right'],
      ['papert', 'listen', 'left'],
      ['lighthill', 'point', 'right'],
      ['michie', 'present', 'left'],
    ],
  },
  {
    mood: 'dawnGold',
    title: '1980s–90s: the rim of the light',
    ids: [
      ['hinton-young', 'sit', 'right'],
      ['hopfield', 'present', 'right'],
      ['rumelhart', 'point', 'right'],
      ['lenat', 'listen', 'left'],
      ['fodor', 'dissent', 'left'],
      ['pylyshyn', 'doubt', 'left'],
      ['lecun', 'think', 'right'],
      ['vapnik', 'present', 'left'],
      ['jackel', 'listen', 'left'],
      ['hochreiter', 'stand', 'right'],
    ],
  },
  {
    mood: 'duskRose',
    title: '2000s–2010s: data, fire, Florence, Seoul, Mountain View',
    ids: [
      ['bengio', 'think', 'right'],
      ['li', 'present', 'right'],
      ['crowd-worker', 'type', 'right'],
      ['hinton', 'stand', 'right'],
      ['sutskever', 'listen', 'left'],
      ['krizhevsky', 'type', 'left'],
      ['hassabis', 'authority', 'right'],
      ['lee-sedol', 'think', 'left'],
      ['uszkoreit', 'present', 'right'],
      ['hans-uszkoreit', 'doubt', 'left'],
      ['kelcey', 'dissent', 'left'],
      ['polosukhin', 'listen', 'left'],
    ],
  },
  {
    mood: 'serverCyan',
    title: '2020s: the case reopened',
    ids: [
      ['chat-user', 'type', 'right'],
      ['labeller', 'type', 'right'],
      ['amodei-dario', 'present', 'right'],
      ['altman', 'stand', 'right'],
      ['bender', 'listen', 'left'],
      ['gebru', 'dissent', 'left'],
      ['marcus', 'point', 'left'],
      ['lecun-2020s', 'doubt', 'left'],
      ['bengio-2020s', 'think', 'right'],
      ['liang', 'stand', 'left'],
      ['delegate', 'present', 'left'],
    ],
  },
];

const short = (id: CastId) => CAST_INFO[id].name.replace(/\s*\(.*\)$/, '');

const g: GalleryModule = {
  title: 'cast: neural-net-history',
  duration: 6,
  fonts: ['15px Georgia', 'italic 13px Georgia'],
  paint(c, genv) {
    const q = new URLSearchParams(location.search);
    const life = (gid: GestureId, seed: number, tq: number) => {
      const base = POSES[gid];
      return withLife({ ...base, prev: base }, tq, seed);
    };

    if (q.get('hands') === 'big') {
      // a board insert at true size: pin (press) and holdUp, scale 1.4
      const env = makeEnv({ mood: 'candleAmber', t: genv.t, seed: 11 });
      const p = mood('candleAmber');
      backdrop(c, p, 720);
      c.fillStyle = withAlpha(p.halo, 0.3);
      c.beginPath();
      c.ellipse(560, 330, 520, 300, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = withAlpha(p.rim, 0.7);
      c.fillRect(300, 200, 190, 130);
      const a = hands.act('pin', 0.5, { x: 470, y: 215 }, { scale: 1.4 });
      hands.draw(c, a, env);
      const b = hands.act('holdUp', 0.5, { x: 760, y: 330 }, { scale: 1.4, entry: { R: { x: 1500, y: 900 } } });
      hands.draw(c, b, env);
      return;
    }
    if (q.get('hands') !== null) {
      const env = makeEnv({ mood: 'candleAmber', t: genv.t, seed: 11 });
      const p = mood('candleAmber');
      // a cork-ish board band so the hands read against the lit board
      backdrop(c, p, 720);
      const cells: [HandAction, number, string][] = [
        ['pin', 0.3, 'pin · reach'],
        ['pin', 0.5, 'pin · press'],
        ['unpinDrop', 0.5, 'unpinDrop · carry'],
        ['strikeLight', 0.33, 'strikeLight · strike'],
        ['strikeLight', 0.7, 'strikeLight · light'],
        ['fileFold', 0.62, 'fileFold · flap'],
        ['stamp', 0.52, 'stamp · press'],
        ['holdUp', 0.55, 'holdUp · hold'],
        ['rest', 0, 'rest'],
      ];
      const cw = 1280 / 3, ch = 720 / 3;
      cells.forEach(([a, u, label], i) => {
        const cx = (i % 3) * cw, cy = Math.floor(i / 3) * ch;
        c.save();
        c.beginPath();
        c.rect(cx + 2, cy + 2, cw - 4, ch - 4);
        c.clip();
        c.translate(cx, cy);
        c.scale(1 / 3, 1 / 3);
        // a lit card target
        const target = { x: 600, y: 330 };
        c.fillStyle = withAlpha(p.halo, 0.35);
        c.beginPath();
        c.ellipse(640, 360, 520, 300, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = withAlpha(p.rim, 0.5);
        c.lineWidth = 3;
        c.strokeRect(target.x - 8, target.y - 8, 16, 16);
        const pose = hands.act(a, u, target, { held: a === 'fileFold' ? 'slip' : undefined });
        hands.draw(c, pose, env);
        const fl = hands.flameAt(pose);
        if (fl) {
          const gr = c.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, 160);
          gr.addColorStop(0, withAlpha(p.core, 0.5));
          gr.addColorStop(1, withAlpha(p.halo, 0));
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = gr;
          c.fillRect(fl.x - 160, fl.y - 160, 320, 320);
          c.globalCompositeOperation = 'source-over';
        }
        c.restore();
        c.fillStyle = withAlpha(p.core, 0.85);
        c.font = '15px Georgia';
        c.fillText(`${label}${pose.placed ? ' · placed' : ''}${pose.stamped ? ' · stamped' : ''}`, cx + 12, cy + 22);
      });
      return;
    }

    if (q.get('idle') !== null) {
      // review round 4: every named person handed plain POSES.stand, so the kit draws their signature idle + tilt
      // (the line-up test: no two neighbours may read as the same mannequin); ?idle=1 shows the later rows
      const env = makeEnv({ mood: 'candleAmber', t: genv.t, seed: 9 });
      const p = mood('candleAmber');
      backdrop(c, p, 720);
      const named = (Object.keys(SPECS) as CastId[]).filter((id) => (SPECS[id] as { signature?: unknown }).signature);
      const half = Math.ceil(named.length / 2);
      const ids = q.get('idle') === '1' ? named.slice(half) : named.slice(0, half);
      const per = 11;
      ids.forEach((id, i) => {
        const col = i % per, row = Math.floor(i / per);
        const x = 70 + col * 114, y = 330 + row * 330;
        const s = 250 / 330;
        cast[id].draw(c, { x, y, facing: 'right', pose: life('stand', i * 5 + 1, env.tq), scale: s, edgeRim: { x: 1, y: -0.4 } }, env);
        c.fillStyle = withAlpha(p.core, 0.85);
        c.font = '12px Georgia';
        c.textAlign = 'center';
        const sg = (SPECS[id] as { signature?: { idle?: string; tilt?: number } }).signature;
        c.fillText(short(id).split(' ').slice(-1)[0], x, y + 20);
        c.fillText(`${sg?.idle ?? 'stand'} ${sg?.tilt ?? 0}°`, x, y + 36);
        c.textAlign = 'left';
      });
      return;
    }

    if (q.get('thumb') !== null) {
      const env = makeEnv({ mood: 'duskRose', t: genv.t, seed: 5 });
      const p = mood('duskRose');
      backdrop(c, p, 720);
      const all = PAGES.flatMap((pg) => pg.ids);
      const per = 13;
      all.forEach(([id, gid, facing], i) => {
        const col = i % per, row = Math.floor(i / per);
        const x = 60 + col * 96, y = 150 + row * 150;
        const s = 64 / SPECS[id].height;
        cast[id].draw(c, { x, y, facing, pose: life(gid, i * 7 + 3, env.tq), scale: s }, env);
        c.fillStyle = withAlpha(p.core, 0.8);
        c.font = '11px Georgia';
        c.textAlign = 'center';
        c.fillText(short(id).split(' ').slice(-1)[0] + (id.endsWith('2020s') || id.endsWith('1960s') || id === 'hinton-young' ? '*' : ''), x, y + 18);
        c.textAlign = 'left';
      });
      c.fillStyle = withAlpha(p.rim, 0.7);
      c.font = 'italic 13px Georgia';
      c.fillText('64 px thumbnail test (style bible §4.1) · * = a later/earlier version of the same person', 24, 700);
      return;
    }

    if (q.has('four')) {
      // review round 2: Hinton, LeCun, Bengio and Hassabis must read apart by silhouette alone (no captions needed),
      // with the warm light-facing rim and the collar + sleeve cuts; key light from the right (o.light)
      const env = makeEnv({ mood: 'candleAmber', t: genv.t, seed: 9 });
      const p = mood('candleAmber');
      backdrop(c, p, 640);
      const ids: CastId[] = ['hinton', 'lecun', 'bengio', 'hassabis', 'lecun-2020s', 'bengio-2020s'];
      ids.forEach((id, i) => {
        const x = 130 + i * 205;
        cast[id].draw(c, { x, y: 640, facing: 'right', pose: addPose(life('stand', i * 5 + 2, env.tq), {}), scale: 1.25, light: { x: 1, y: -0.4 } }, env);
        c.fillStyle = withAlpha(p.core, 0.85);
        c.font = '15px Georgia';
        c.textAlign = 'center';
        c.fillText(short(id), x, 672);
        c.textAlign = 'left';
      });
      c.fillStyle = withAlpha(p.rim, 0.75);
      c.font = 'italic 15px Georgia';
      c.fillText('the four (and the 2020s LeCun / Bengio): silhouette signatures, warm light-facing rim, collar + sleeve cuts', 24, 30);
      return;
    }
    const page = PAGES[Math.max(0, Math.min(PAGES.length - 1, Number(q.get('page') ?? '0')))];
    const env = makeEnv({ mood: page.mood, t: genv.t, seed: 9 });
    const p = mood(page.mood);
    backdrop(c, p, 600);
    const n = page.ids.length;
    const step = 1180 / n;
    const sc = n > 10 ? 0.78 : 0.86;
    page.ids.forEach(([id, gid, facing], i) => {
      const x = 70 + step * i + step / 2 - 20;
      const pose = addPose(life(gid, i * 13 + 1, env.tq), {});
      cast[id].draw(c, { x, y: 600, facing, pose, scale: sc }, env);
      c.fillStyle = withAlpha(p.core, 0.88);
      c.font = '14px Georgia';
      c.textAlign = 'center';
      c.fillText(short(id), x, 628);
      c.fillStyle = withAlpha(p.rim, 0.6);
      c.font = 'italic 11px Georgia';
      const sp = SPECS[id];
      c.fillText(`${sp.era} · ${sp.wardrobe.replace(/:f$/, '')}`, x, 646);
      c.fillText(`${sp.hair}${sp.glasses !== 'none' ? ' · ' + sp.glasses : ''}${sp.facialHair !== 'none' ? ' · ' + sp.facialHair : ''}`, x, 662);
      c.textAlign = 'left';
    });
    c.fillStyle = withAlpha(p.rim, 0.75);
    c.font = 'italic 15px Georgia';
    c.fillText(page.title, 24, 30);
  },
};
export default g;
