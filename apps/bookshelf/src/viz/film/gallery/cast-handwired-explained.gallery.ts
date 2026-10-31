import type { GalleryModule } from './main';
import { makeEnv, mood, withAlpha } from '../silhouette/palette';
import { POSES, PUPPET_NEAR_BLACK, addPose, withLife, type GestureId } from '../silhouette/puppet';
import { backdrop } from './puppets.gallery';
import { cast, CAST_INFO, SPECS, hands, type CastId } from '../../films/handwired-explained/cast';
import type { HandAction, HandsPose, PencilAction } from '../../films/handwired-explained/sets/narratorHands';

/**
 * handwired-explained cast line-up.
 *   (default)   the four puppets: standing idles (signature test) and a characteristic gesture, labelled
 *   ?thumb      every puppet at 64 px (style bible §4.1 thumbnail test)
 *   ?hands      the tag-keeper's hands (lower LEFT): every action at its key moment (candleAmber)
 *   ?pencil     the red pencil (frame RIGHT): hover / write / strike / rest, plus the viewer's hand
 *   ?desk       the author's hands and the agent's paler hand at the logo-less laptop (winterBlue / candleAmber)
 */
const short = (id: CastId) => CAST_INFO[id].name.replace(/\s*\(.*\)$/, '');
const life = (gid: GestureId, seed: number, tq: number) => {
  const base = POSES[gid];
  return withLife({ ...base, prev: base }, tq, seed);
};

function lineBand(c: CanvasRenderingContext2D, y: number, col: string) {
  c.strokeStyle = col;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, y);
  c.quadraticCurveTo(640, y + 10, 1280, y);
  c.stroke();
}

const g: GalleryModule = {
  title: 'cast: handwired-explained',
  duration: 6,
  fonts: ['15px Georgia', 'italic 13px Georgia'],
  paint(c, genv) {
    const q = new URLSearchParams(location.search);

    if (q.has('hands') || q.has('pencil')) {
      const pencilPage = q.has('pencil');
      const m = pencilPage ? 'duskRose' : 'candleAmber';
      const env = makeEnv({ mood: m, t: genv.t, seed: 11 });
      const p = mood(m);
      backdrop(c, p, 720);
      type Cell = [string, (target: { x: number; y: number }) => HandsPose, string];
      const cells: Cell[] = pencilPage
        ? ([
            ['hover', 0.55],
            ['write', 0.5],
            ['write', 0.72],
            ['strike', 0.3],
            ['strike', 0.45],
            ['rest', 0.45],
            ['rest', 0.7],
          ] as [PencilAction, number][]).map(([a, u]): Cell => [a, (t) => hands.pencil(a, u, t), `pencil · ${a} u=${u}`])
            .concat([
              ['viewer', (t) => hands.viewer(0.3, { x: t.x, y: t.y + 60 }), 'viewer · rising'],
              ['viewer', (t) => hands.viewer(0.8, { x: t.x, y: t.y + 60 }), 'viewer · receive (open)'],
            ])
        : ([
            ['tie', 0.25, 'tag'],
            ['tie', 0.42, 'tag'],
            ['tie', 0.56, 'tag'],
            ['flip', 0.5, undefined],
            ['rivet', 0.5, undefined],
            ['lift', 0.52, 'tag'],
            ['place', 0.45, 'marble'],
            ['bend', 0.55, undefined],
            ['holdUp', 0.55, 'card'],
          ] as [HandAction, number, string | undefined][]).map(([a, u, h]): Cell => [
            a,
            (t) => hands.act(a, u, t, { held: h as never, dropAt: { x: t.x + 200, y: t.y + 120 } }),
            `${a} u=${u}`,
          ]);
      const cw = 1280 / 3, ch = 720 / 3;
      cells.forEach(([, make, label], i) => {
        const cx = (i % 3) * cw, cy = Math.floor(i / 3) * ch;
        c.save();
        c.beginPath();
        c.rect(cx + 2, cy + 2, cw - 4, ch - 4);
        c.clip();
        c.translate(cx, cy);
        c.scale(1 / 3, 1 / 3);
        c.fillStyle = withAlpha(p.halo, 0.35);
        c.beginPath();
        c.ellipse(640, 360, 560, 320, 0, 0, Math.PI * 2);
        c.fill();
        const target = { x: 640, y: 330 };
        lineBand(c, target.y, withAlpha(p.rim, 0.7));
        // a plain manila tag under the target (flip / strike / write read against it)
        c.fillStyle = withAlpha(p.halo, 0.9);
        c.fillRect(target.x - 40, target.y + 20, 80, 110);
        const pose = make(target);
        hands.draw(c, pose, env);
        if (pose.tip) {
          c.fillStyle = '#ff3';
          c.fillRect(pose.tip.x - 3, pose.tip.y - 3, 6, 6);
        }
        c.restore();
        const flags = [pose.placed && 'placed', pose.knot ? `knot ${pose.knot.toFixed(2)}` : '', pose.flip ? `flip ${pose.flip.toFixed(2)}` : '', pose.riveted && 'riveted', pose.hinge ? `hinge ${pose.hinge.toFixed(2)}` : '', pose.stroke ? `stroke ${pose.stroke.toFixed(2)}` : '']
          .filter(Boolean)
          .join(' · ');
        c.fillStyle = withAlpha(p.core, 0.9);
        c.font = '15px Georgia';
        c.fillText(`${label}${flags ? ' · ' + flags : ''}`, cx + 12, cy + 22);
      });
      return;
    }

    if (q.has('desk')) {
      const ms = ['winterBlue', 'candleAmber'] as const;
      ms.forEach((m, i) => {
        const env = makeEnv({ mood: m, t: genv.t, seed: 4 });
        const p = mood(m);
        c.save();
        c.beginPath();
        c.rect(i * 640, 0, 640, 720);
        c.clip();
        c.translate(i * 640, 0);
        c.fillStyle = p.sky[1];
        c.fillRect(0, 0, 640, 720);
        c.fillStyle = p.fg;
        c.fillRect(0, 520, 640, 200);
        hands.deskHands(c, { x: 320, y: 520, w: 380, tq: env.tq, author: i === 0 ? 'type' : 'pause', pauseU: 0.8, agent: 'type', agentIn: 1 }, env);
        c.restore();
        c.fillStyle = withAlpha(p.core, 0.9);
        c.font = '15px Georgia';
        c.fillText(i === 0 ? `${m} · author typing, agent half a beat behind` : `${m} · author pauses (one hand rests)`, i * 640 + 14, 24);
      });
      return;
    }

    if (q.has('thumb')) {
      const env = makeEnv({ mood: 'duskRose', t: genv.t, seed: 5 });
      const p = mood('duskRose');
      backdrop(c, p, 720);
      (Object.keys(SPECS) as CastId[]).forEach((id, i) => {
        const x = 200 + i * 260, y = 380;
        const s = 64 / SPECS[id].height;
        cast[id].draw(c, { x, y, facing: 'right', pose: life('stand', i * 7 + 3, env.tq), scale: s * (SPECS[id].height / 320) }, env);
        c.fillStyle = withAlpha(p.core, 0.8);
        c.font = '13px Georgia';
        c.textAlign = 'center';
        c.fillText(short(id).split(' ').slice(-1)[0], x, y + 22);
        c.textAlign = 'left';
      });
      c.fillStyle = withAlpha(p.rim, 0.7);
      c.font = 'italic 13px Georgia';
      c.fillText('64 px thumbnail test (style bible §4.1)', 24, 700);
      return;
    }

    // default: two rows, standing idles (top) and a characteristic gesture (bottom)
    const env = makeEnv({ mood: 'candleAmber', t: genv.t, seed: 9 });
    const p = mood('candleAmber');
    backdrop(c, p, 720);
    const ids = Object.keys(SPECS) as CastId[];
    const gest: Record<CastId, [GestureId, 'left' | 'right']> = {
      mcculloch: ['present', 'right'],
      pitts: ['write', 'left'],
      kleene: ['doubt', 'right'],
      'seating-clerk': ['point', 'left'],
    };
    ids.forEach((id, i) => {
      const x = 170 + i * 310;
      const s = 0.8;
      cast[id].draw(c, { x, y: 320, facing: 'right', pose: life('stand', i * 5 + 1, env.tq), scale: s, ink: PUPPET_NEAR_BLACK, edgeRim: { x: 1, y: -0.5 } }, env);
      const [gid, facing] = gest[id];
      cast[id].draw(c, { x, y: 670, facing, pose: addPose(life(gid, i * 11 + 2, env.tq), {}), scale: s, ink: PUPPET_NEAR_BLACK, edgeRim: { x: 1, y: -0.5 } }, env);
      c.fillStyle = withAlpha(p.core, 0.9);
      c.font = '15px Georgia';
      c.textAlign = 'center';
      const sg = SPECS[id].signature as { idle?: string };
      c.fillText(`${short(id)} · ${SPECS[id].era} · idle ${sg.idle}`, x, 344);
      c.fillText(gid, x, 694);
      c.textAlign = 'left';
    });
  },
};
export default g;
