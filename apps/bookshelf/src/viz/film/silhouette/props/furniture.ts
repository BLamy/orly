/**
 * Furniture (front/side elevations, real size at s = 1; y = floor).
 *
 *   writingDesk({ x, y, variant?: 'pedestal'|'rolltop', w?: cm (150), open?: 0..1 (rolltop tambour) })
 *       anchors: top (centre of the writing surface), kneehole, lampSpot (left back corner), cubby
 *   chair({ x, y, style?: 'carved'|'wooden'|'swivel'|'modern', view?: 'side'|'front', swivel?: rad })
 *       side view faces +x (flip to face left). anchors: seat, back, arm   (seat height 46 cm)
 *   clothTable({ x, y, w?: cm (170), fringe?: true, legs?: 'turned'|'none', sway?: 0..1 })
 *       front view, tasselled cloth as in the reference frame. anchors: top, left, right, centre
 *
 * Pierced details (kneehole, pigeonholes, chair splat, tassel gaps) let the backlight through;
 * cut-lines are rim hairlines (style bible §2.6).
 */
import {
  type PropAt,
  bar,
  circle,
  cut,
  defineProp,
  ellipse,
  fbm,
  fillInk,
  lathe,
  memo,
  poly,
  rect,
  repeat,
  rrect,
  spline,
} from './_kit';

// ---------------------------------------------------------------------------
// Writing desk
// ---------------------------------------------------------------------------
export interface DeskOpts extends PropAt {
  variant?: 'pedestal' | 'rolltop';
  w?: number;
  /** rolltop tambour: 0 closed, 1 open (pigeonholes visible) */
  open?: number;
}

function deskPaths(w: number, rolltop: boolean, open: number) {
  return memo(`desk:${w}:${rolltop}:${open.toFixed(2)}`, () => {
    const p = new Path2D();
    const hw = w / 2;
    const pw = Math.min(46, w * 0.3);
    const cl = new Path2D(); // cut-lines
    // top slab with a moulded edge
    rect(p, -hw - 2.5, -77, w + 5, 2.2);
    rect(p, -hw - 1.5, -75, w + 3, 1.6);
    // frieze (centre drawer band)
    rect(p, -hw, -73.6, w, 8.6);
    // pedestals + plinths + bun feet
    for (const sx of [-1, 1]) {
      const x0 = sx < 0 ? -hw : hw - pw;
      rect(p, x0, -73.6, pw, 66);
      rect(p, x0 - 1.2, -8.2, pw + 2.4, 3.2);
      for (const fx of [x0 + 3.2, x0 + pw - 3.2]) lathe([[2.6, 0, 1], [3.0, -1.6], [2.6, -3.4], [2.2, -5.1, 1]], fx, p);
      // drawers
      const rows = 4;
      const top = -64.2;
      const bot = -9.6;
      const dh = (top - bot) / rows;
      for (let r = 0; r < rows; r++) {
        const y0 = bot + dh * r;
        cl.rect(x0 + 2.4, y0 + 1.1, pw - 4.8, dh - 2.2);
        // brass bail pull: a small arc + backplate
        const cx = x0 + pw / 2;
        const cy = y0 + dh / 2;
        cl.moveTo(cx - 3, cy - 0.2);
        cl.quadraticCurveTo(cx, cy + 2.2, cx + 3, cy - 0.2);
        cl.moveTo(cx - 3.6, cy - 0.8);
        cl.lineTo(cx - 2.4, cy - 0.8);
        cl.moveTo(cx + 2.4, cy - 0.8);
        cl.lineTo(cx + 3.6, cy - 0.8);
      }
      // pedestal stile line
      cl.moveTo(x0 + 0.9, -64.6);
      cl.lineTo(x0 + 0.9, -9);
      cl.moveTo(x0 + pw - 0.9, -64.6);
      cl.lineTo(x0 + pw - 0.9, -9);
    }
    // centre drawer
    cl.rect(-hw + pw + 2, -72.2, w - 2 * pw - 4, 5.8);
    cl.moveTo(-3.2, -69.4);
    cl.quadraticCurveTo(0, -67.4, 3.2, -69.4);
    // moulding line on the top
    cl.moveTo(-hw - 1.5, -75.1);
    cl.lineTo(hw + 1.5, -75.1);
    // modesty panel recessed in the kneehole (hazed) — left open so light passes below it
    const knee = new Path2D();
    rect(knee, -hw + pw, -65, w - 2 * pw, 30);
    const hole = new Path2D(); // pierced bits (evenodd)
    if (rolltop) {
      const hy = -77;
      const H = 44;
      // side panels with an S-curved front edge (front elevation shows them as posts)
      for (const sx of [-1, 1]) {
        const x = sx * (hw - 1.5);
        poly(p, [x - 2, hy, x + 2, hy, x + 2, hy - H + 6, x - 2, hy - H + 6]);
      }
      // the hood: rounded shoulders, tambour box
      const hood = new Path2D();
      hood.moveTo(-hw + 0.5, hy - H + 8);
      hood.quadraticCurveTo(-hw + 0.5, hy - H, -hw + 8, hy - H);
      hood.lineTo(hw - 8, hy - H);
      hood.quadraticCurveTo(hw - 0.5, hy - H, hw - 0.5, hy - H + 8);
      const tamb = hy - H + 8 + (1 - open) * (H - 10);
      hood.lineTo(hw - 0.5, tamb);
      hood.lineTo(-hw + 0.5, tamb);
      hood.closePath();
      p.addPath(hood);
      // tambour slats
      for (let y = hy - H + 4; y < tamb - 0.5; y += 1.6) {
        cl.moveTo(-hw + 3, y);
        cl.lineTo(hw - 3, y);
      }
      // pigeonhole block behind (visible below the tambour)
      const pbTop = tamb;
      if (pbTop < hy - 2) {
        const block = new Path2D();
        rect(block, -hw + 2, pbTop, w - 4, hy - pbTop);
        p.addPath(block);
        // cubbies: 2 rows × n, small drawers in the lower row
        const n = Math.max(4, Math.round((w - 10) / 16));
        const cw = (w - 8) / n;
        const rowsY = [hy - H + 12, hy - H + 24];
        for (const [ri, ry] of rowsY.entries()) {
          for (let i = 0; i < n; i++) {
            const x = -hw + 4 + i * cw + 0.8;
            const yy = ry;
            const hh = ri === 0 ? 10 : 9;
            if (yy + hh > hy - 1) continue;
            const top2 = Math.max(yy, pbTop + 0.6);
            if (top2 >= yy + hh - 0.5) continue;
            if (ri === 1 && i % 3 === 1) {
              cl.rect(x, top2, cw - 1.6, yy + hh - top2);
              continue;
            }
            hole.moveTo(x, top2);
            hole.lineTo(x, yy + hh);
            hole.lineTo(x + cw - 1.6, yy + hh);
            // pointed gothic arch top on the upper row
            if (ri === 0 && top2 === yy) {
              hole.lineTo(x + cw - 1.6, yy + 3);
              hole.quadraticCurveTo(x + cw - 1.6, yy, x + (cw - 1.6) / 2, yy);
              hole.quadraticCurveTo(x, yy, x, yy + 3);
            } else {
              hole.lineTo(x + cw - 1.6, top2);
            }
            hole.closePath();
          }
        }
        // writing-slope lip
        rect(p, -hw + 2, hy - 2.2, w - 4, 2.2);
      }
    }
    return { p, cl, hole, knee, pw };
  });
}

export const writingDesk = defineProp<DeskOpts, 'top' | 'kneehole' | 'lampSpot' | 'cubby'>(
  (c, o, env) => {
    const D = deskPaths(o.w ?? 150, o.variant === 'rolltop', Math.round((o.open ?? 1) * 20) / 20);
    c.fillStyle = env.fill('ink');
    const all = new Path2D();
    all.addPath(D.p);
    all.addPath(D.hole);
    c.fill(all, 'evenodd');
    // papers stuffed in a few cubbies
    if (o.variant === 'rolltop') {
      c.save();
      c.clip(D.hole);
      const w = o.w ?? 150;
      for (let i = 0; i < 6; i++) {
        const x = -w / 2 + 8 + i * (w / 6.5);
        c.fillStyle = env.fill('ink');
        c.fillRect(x, -77 - 44 + 16 + (i % 2) * 2, 5 + (i % 3), 10);
      }
      c.restore();
    }
    cut(c, env, D.cl, 0.32, 1.2);
  },
  (o) => {
    const w = o.w ?? 150;
    return {
      top: { x: 0, y: -77 },
      kneehole: { x: 0, y: -40 },
      lampSpot: { x: -w / 2 + 16, y: -77 },
      cubby: { x: 0, y: o.variant === 'rolltop' ? -110 : -77 },
    };
  },
  (o) => {
    const w = o.w ?? 150;
    const h = o.variant === 'rolltop' ? 121 : 77;
    return { x: -w / 2 - 2.5, y: -h, w: w + 5, h };
  },
);

// ---------------------------------------------------------------------------
// Chairs
// ---------------------------------------------------------------------------
export interface ChairOpts extends PropAt {
  style?: 'carved' | 'wooden' | 'swivel' | 'modern';
  view?: 'side' | 'front';
}

/** a cabriole leg in profile: knee forward (+x), from the seat rail down to a pad foot */
function cabriole(p: Path2D, x: number, top: number, dir: number, h: number) {
  const k = h / 42;
  const pts = [
    { x: x - dir * 1.6, y: top },
    { x: x + dir * 1.8, y: top + 3 * k },
    { x: x + dir * 2.6, y: top + 9 * k },
    { x: x + dir * 0.4, y: top + 22 * k },
    { x: x - dir * 0.6, y: top + 34 * k },
    { x: x + dir * 0.6, y: top + 40 * k },
    { x: x + dir * 2.4, y: top + h - 0.6 },
    { x: x + dir * 2.6, y: top + h },
  ];
  const back = [
    { x: x - dir * 1.8, y: top + h },
    { x: x - dir * 1.0, y: top + 40 * k },
    { x: x - dir * 1.4, y: top + 33 * k },
    { x: x - dir * 1.8, y: top + 22 * k },
    { x: x - dir * 2.6, y: top + 10 * k },
    { x: x - dir * 3.4, y: top + 2 * k },
    { x: x - dir * 3.6, y: top },
  ];
  spline(p, pts, [true, false, false, false, false, false, false, true]);
  spline(p, back, [true, false, false, false, false, false, true], false);
  p.closePath();
}

function carvedFront(): { p: Path2D; cl: Path2D } {
  return memo('chair:carved:front', () => {
    const p = new Path2D();
    const cl = new Path2D();
    // seat (front rail) with a shaped apron and central shell
    const ap = new Path2D();
    ap.moveTo(-26, -49);
    ap.lineTo(26, -49);
    ap.lineTo(26, -42.5);
    ap.bezierCurveTo(20, -42.5, 14, -40.5, 9, -41.2);
    ap.bezierCurveTo(6, -41.6, 4, -38.6, 0, -38.0);
    ap.bezierCurveTo(-4, -38.6, -6, -41.6, -9, -41.2);
    ap.bezierCurveTo(-14, -40.5, -20, -42.5, -26, -42.5);
    ap.closePath();
    p.addPath(ap);
    rect(p, -27.5, -51, 55, 2.4); // seat edge with a slight overhang
    // cabriole legs seen from the front: knees splay out, pad feet
    for (const sx of [-1, 1]) {
      const leg = new Path2D();
      const x = sx * 23.4;
      spline(leg, [
        { x: x - sx * 3, y: -43 }, { x: x + sx * 2.6, y: -40.5 }, { x: x + sx * 2.2, y: -33 }, { x: x - sx * 0.6, y: -20 },
        { x: x - sx * 0.4, y: -8 }, { x: x + sx * 1.8, y: -2.6 }, { x: x + sx * 2.4, y: 0 },
      ], [true, false, false, false, false, false, true]);
      spline(leg, [
        { x: x - sx * 2.6, y: 0 }, { x: x - sx * 2.2, y: -3 }, { x: x - sx * 2.0, y: -9 }, { x: x - sx * 2.4, y: -20 },
        { x: x - sx * 4.6, y: -33 }, { x: x - sx * 7, y: -41 },
      ], [true, false, false, false, false, true], false);
      leg.closePath();
      p.addPath(leg);
      // back posts: slightly raked outward, block at the seat
      const post = new Path2D();
      poly(post, [sx * 20.2, -51, sx * 22.6, -51, sx * 24.2, -104, sx * 21.6, -104]);
      p.addPath(post);
      // ear of the crest
      const ear = new Path2D();
      ear.moveTo(sx * 21.0, -103.5);
      ear.bezierCurveTo(sx * 23.5, -110, sx * 28.5, -108.5, sx * 27.4, -105);
      ear.bezierCurveTo(sx * 26.6, -102.6, sx * 24.6, -103.6, sx * 24.4, -101.4);
      ear.closePath();
      p.addPath(ear);
      cl.moveTo(sx * 21.4, -55);
      cl.lineTo(sx * 23.0, -100);
    }
    // crest rail: serpentine yoke with a carved shell at the centre
    const crest = new Path2D();
    crest.moveTo(-24, -101);
    crest.bezierCurveTo(-16, -106, -10, -100.5, -6, -104);
    crest.bezierCurveTo(-4.5, -110.5, 4.5, -110.5, 6, -104);
    crest.bezierCurveTo(10, -100.5, 16, -106, 24, -101);
    crest.lineTo(24, -97.8);
    crest.bezierCurveTo(16, -101.8, 10, -96.2, 5, -97.6);
    crest.lineTo(-5, -97.6);
    crest.bezierCurveTo(-10, -96.2, -16, -101.8, -24, -97.8);
    crest.closePath();
    p.addPath(crest);
    // shell fluting on the crest
    for (let i = -3; i <= 3; i++) {
      cl.moveTo(0, -100.6);
      cl.lineTo(i * 1.15, -107.6 + Math.abs(i) * 0.35);
    }
    // pierced vase splat with scrolls (outer + evenodd holes)
    const sp = new Path2D();
    spline(sp, [
      { x: -5.4, y: -51 }, { x: -6.4, y: -55 }, { x: -3.6, y: -61 }, { x: -2.6, y: -66 }, { x: -6.6, y: -74 },
      { x: -10.6, y: -84 }, { x: -9.6, y: -93 }, { x: -5.2, y: -97.6 },
    ], [true, false, false, false, false, false, false, true]);
    spline(sp, [
      { x: 5.2, y: -97.6 }, { x: 9.6, y: -93 }, { x: 10.6, y: -84 }, { x: 6.6, y: -74 }, { x: 2.6, y: -66 },
      { x: 3.6, y: -61 }, { x: 6.4, y: -55 }, { x: 5.4, y: -51 },
    ], [true, false, false, false, false, false, false, true], false);
    sp.closePath();
    p.addPath(sp);
    // shoe at the base of the splat
    rect(p, -8, -53, 16, 2.4);
    // piercings
    const holes = new Path2D();
    for (const sx of [-1, 1]) {
      const h1 = new Path2D();
      spline(h1, [
        { x: sx * 1.6, y: -72 }, { x: sx * 5.6, y: -78 }, { x: sx * 7.4, y: -86 }, { x: sx * 5.4, y: -92 }, { x: sx * 2.6, y: -90 },
        { x: sx * 3.6, y: -84 }, { x: sx * 1.6, y: -80 }, { x: sx * 1.6, y: -72 },
      ]);
      h1.closePath();
      holes.addPath(h1);
      ellipse(holes, sx * 3.0, -57.6, 1.2, 2.2);
    }
    ellipse(holes, 0, -93.4, 1.6, 1.9);
    rrect(holes, -0.7, -88, 1.4, 12, 0.7);
    poly(holes, [0, -69.5, 1.4, -66.2, 0, -62.8, -1.4, -66.2]);
    p.addPath(holes);
    // carving cut-lines on the splat
    cl.moveTo(-4.2, -96);
    cl.bezierCurveTo(-8.6, -92, -9.2, -84, -5.4, -76);
    cl.moveTo(4.2, -96);
    cl.bezierCurveTo(8.6, -92, 9.2, -84, 5.4, -76);
    cl.moveTo(-25, -46.5);
    cl.bezierCurveTo(-14, -46.5, -6, -44, 0, -42.8);
    cl.bezierCurveTo(6, -44, 14, -46.5, 25, -46.5);
    return { p, cl };
  });
}

function carvedSide(): { p: Path2D; cl: Path2D } {
  return memo('chair:carved:side', () => {
    const p = new Path2D();
    const cl = new Path2D();
    // seat block with a drop-in cushion
    const seat = new Path2D();
    seat.moveTo(-21, -48.6);
    seat.lineTo(22, -48.6);
    seat.quadraticCurveTo(24.4, -48.2, 24, -45.6);
    seat.lineTo(23, -41.6);
    seat.bezierCurveTo(14, -42.6, 6, -40.4, 0, -41.2);
    seat.bezierCurveTo(-8, -42.2, -14, -40.8, -21, -42);
    seat.closePath();
    p.addPath(seat);
    const cushion = new Path2D();
    cushion.moveTo(-20, -48.4);
    cushion.bezierCurveTo(-12, -51.6, 14, -51.4, 22.6, -48.6);
    cushion.closePath();
    p.addPath(cushion);
    // front cabriole leg (knee forward), back leg raked
    cabriole(p, 20, -42.5, 1, 42.5);
    const bl = new Path2D();
    spline(bl, [{ x: -18.2, y: -42.4 }, { x: -20, y: -24 }, { x: -24.8, y: 0 }], [true, false, true]);
    spline(bl, [{ x: -21.6, y: 0 }, { x: -17, y: -24 }, { x: -14.6, y: -42.4 }], [true, false, true], false);
    bl.closePath();
    p.addPath(bl);
    // back post: continuous from the back leg, spooned to fit the sitter
    const post = new Path2D();
    spline(post, [{ x: -19.8, y: -48 }, { x: -20.4, y: -64 }, { x: -23.4, y: -86 }, { x: -27.6, y: -104 }], [true, false, false, true]);
    spline(post, [{ x: -24.0, y: -105 }, { x: -20, y: -86 }, { x: -16.8, y: -64 }, { x: -16.4, y: -48 }], [true, false, false, true], false);
    post.closePath();
    p.addPath(post);
    // crest ear
    const ear = new Path2D();
    ear.moveTo(-28.6, -103);
    ear.bezierCurveTo(-31.6, -108.6, -25.6, -111, -23.4, -106.6);
    ear.lineTo(-23.6, -103.6);
    ear.closePath();
    p.addPath(ear);
    cl.moveTo(-21, -46);
    cl.bezierCurveTo(-10, -45, 10, -45, 22.6, -46);
    cl.moveTo(-18.8, -60);
    cl.bezierCurveTo(-19.4, -72, -21.4, -88, -24.8, -100);
    return { p, cl };
  });
}

function woodenChair(view: 'side' | 'front'): { p: Path2D; cl: Path2D } {
  return memo(`chair:wooden:${view}`, () => {
    const p = new Path2D();
    const cl = new Path2D();
    if (view === 'side') {
      // seat slab (saddled)
      const s = new Path2D();
      s.moveTo(-20, -47.2);
      s.quadraticCurveTo(0, -45.6, 21.6, -47.4);
      s.quadraticCurveTo(23, -46.2, 21.6, -43.6);
      s.lineTo(-20, -43.6);
      s.closePath();
      p.addPath(s);
      // front leg, turned
      lathe([[1.5, 0, 1], [1.3, -6], [1.2, -26], [1.7, -30], [1.3, -34], [1.5, -43.6, 1]], 18.8, p);
      // back leg + post, one raked piece
      const bp = new Path2D();
      spline(bp, [{ x: -21.4, y: 0 }, { x: -18.4, y: -24 }, { x: -18.2, y: -47 }, { x: -20, y: -70 }, { x: -23.6, y: -93 }], [true, false, false, false, true]);
      spline(bp, [{ x: -20.6, y: -94 }, { x: -17, y: -70 }, { x: -15.2, y: -47 }, { x: -15.4, y: -24 }, { x: -18.2, y: 0 }], [true, false, false, false, true], false);
      bp.closePath();
      p.addPath(bp);
      // finial
      lathe([[1.4, -93, 1], [1.8, -95], [1.1, -97], [0.4, -98, 1]], -22.2, p);
      // stretchers
      bar(p, -16.8, -16, 18.8, -14.6, 1.4);
      bar(p, -17.4, -8, 18.8, -7, 1.0);
      // slat ends (seen edge-on)
      // slats seen edge-on: thin curved boards just proud of the post
      for (const y of [-60, -71, -82]) {
        const xo = -16.4 + (y + 47) * 0.17;
        rrect(p, xo - 1.2, y - 4.6, 2.4, 4.6, 0.8);
      }
      cl.moveTo(-19, -45.2);
      cl.quadraticCurveTo(0, -44, 20.8, -45.4);
    } else {
      rect(p, -22, -48, 44, 4); // seat edge
      for (const sx of [-1, 1]) {
        lathe([[1.6, 0, 1], [1.3, -6], [1.2, -26], [1.8, -30], [1.3, -34], [1.6, -44, 1]], sx * 19, p);
        // back posts
        lathe([[1.6, -47, 1], [1.4, -56], [1.3, -88], [1.9, -91], [1.0, -95], [0.4, -96, 1]], sx * 19.6, p);
      }
      // ladder slats with arched tops
      for (const [i, y] of [-62, -73, -84].entries()) {
        const sl = new Path2D();
        const a = 2.2 + i * 0.4;
        sl.moveTo(-19.4, y);
        sl.quadraticCurveTo(0, y - a * 1.8, 19.4, y);
        sl.lineTo(19.4, y + 4);
        sl.quadraticCurveTo(0, y + 4 - a * 1.4, -19.4, y + 4);
        sl.closePath();
        p.addPath(sl);
      }
      rect(p, -19, -16, 38, 1.6);
      rect(p, -19, -9, 38, 1.1);
      cl.moveTo(-21, -46);
      cl.lineTo(21, -46);
    }
    return { p, cl };
  });
}

function swivelChair(): { p: Path2D; cl: Path2D } {
  return memo('chair:swivel', () => {
    const p = new Path2D();
    const cl = new Path2D();
    // four splayed legs on casters (side: left, right, and one toward camera, shorter)
    const hub = { x: 0, y: -12 };
    for (const [dx, dy] of [[-25, -3.5], [25, -3.5], [6, -2.2]]) {
      const leg = new Path2D();
      leg.moveTo(hub.x - 1.8, hub.y - 1.4);
      leg.quadraticCurveTo(dx * 0.5, hub.y - 0.6, dx, dy - 1.2);
      leg.lineTo(dx, dy + 1.2);
      leg.quadraticCurveTo(dx * 0.5, hub.y + 2.6, hub.x + 1.8, hub.y + 1.6);
      leg.closePath();
      p.addPath(leg);
      // caster: fork + wheel
      poly(p, [dx - 1.1, dy, dx + 1.1, dy, dx + 1.6, dy + 1.4, dx - 1.6, dy + 1.4]);
      circle(p, dx + 0.9, dy + 1.9, 1.7);
    }
    // column + coil spring housing
    rect(p, -1.8, -36, 3.6, 25);
    rrect(p, -4.2, -40, 8.4, 6.2, 1.2);
    const spring = new Path2D();
    for (let y = -33; y < -14; y += 2.2) {
      spring.moveTo(-1.8, y);
      spring.lineTo(1.8, y + 1.1);
    }
    cl.addPath(spring);
    // tilt iron to the back
    bar(p, -2, -38, -16, -46, 1.6);
    // saddle seat
    const seat = new Path2D();
    seat.moveTo(-21, -47);
    seat.bezierCurveTo(-10, -44.8, 8, -44.6, 21, -47.8);
    seat.quadraticCurveTo(23, -46.4, 21.4, -42.8);
    seat.bezierCurveTo(10, -41.4, -10, -41.4, -21, -42.4);
    seat.closePath();
    p.addPath(seat);
    // spindle back: crest band carried by spindles, bent arms
    const crest = new Path2D();
    crest.moveTo(-24.4, -74);
    crest.bezierCurveTo(-23.4, -80.4, -16, -81.6, -12, -80.6);
    crest.lineTo(-12.4, -76.6);
    crest.bezierCurveTo(-16, -77.2, -20.6, -76.4, -21.4, -72);
    crest.closePath();
    p.addPath(crest);
    for (const [i, x] of [-21.2, -18.6, -15.8].entries()) bar(p, x + 0.6 * i, -77 + i * 0.6, x + 2.2, -46.6, 0.9);
    // arm: sweeps from the crest to the front of the seat, on a turned post
    const arm = new Path2D();
    arm.moveTo(-12.6, -80.4);
    arm.bezierCurveTo(-2, -77, 6, -66, 15.6, -65.4);
    arm.quadraticCurveTo(19.4, -65.2, 18.6, -62.4);
    arm.bezierCurveTo(8, -62.6, -2, -71.6, -12.4, -76.8);
    arm.closePath();
    p.addPath(arm);
    lathe([[1.0, -46.6, 1], [0.8, -52], [1.3, -56], [0.7, -63.2, 1]], 14.2, p);
    cl.moveTo(-20, -45.6);
    cl.bezierCurveTo(-8, -43.8, 8, -43.8, 20, -46.2);
    return { p, cl };
  });
}

function modernChair(): { p: Path2D; cl: Path2D; mesh: Path2D } {
  return memo('chair:modern', () => {
    const p = new Path2D();
    const cl = new Path2D();
    // five-star base: three visible spokes + casters
    for (const [dx, dy, w] of [[-30, -4.6, 2.6], [30, -4.6, 2.6], [10, -3.6, 2.3]]) {
      const leg = new Path2D();
      leg.moveTo(-3, -10.6);
      leg.quadraticCurveTo(dx * 0.5, -9.4, dx, dy - w / 2);
      leg.lineTo(dx + Math.sign(dx) * 1.2, dy + w / 2);
      leg.quadraticCurveTo(dx * 0.5, -6.4, 3, -7.2);
      leg.closePath();
      p.addPath(leg);
      circle(p, dx, dy + 2.6, 2.4);
      rect(p, dx - 1.1, dy, 2.2, 1.6);
    }
    rrect(p, -3.2, -12.6, 6.4, 6, 1.2);
    // gas lift + shroud
    rect(p, -1.6, -40, 3.2, 28);
    rrect(p, -2.6, -32, 5.2, 18, 1.6);
    // mechanism
    rrect(p, -10, -44.6, 20, 4.4, 1.2);
    // seat cushion
    const seat = new Path2D();
    seat.moveTo(-22, -46.6);
    seat.bezierCurveTo(-21.4, -50.6, -12, -51.2, 0, -50.4);
    seat.bezierCurveTo(12, -49.8, 23, -50.8, 24.6, -47.2);
    seat.bezierCurveTo(25.4, -44.6, 22, -43.6, 18, -43.8);
    seat.lineTo(-20, -43.8);
    seat.quadraticCurveTo(-22.6, -44.6, -22, -46.6);
    seat.closePath();
    p.addPath(seat);
    // back spine from the mechanism
    const spine = new Path2D();
    spine.moveTo(-8, -43);
    spine.bezierCurveTo(-20, -44, -25.6, -46, -26.4, -54);
    spine.lineTo(-23.6, -54.6);
    spine.bezierCurveTo(-22.6, -48.6, -18, -46.6, -8, -46.6);
    spine.closePath();
    p.addPath(spine);
    // mesh back: S-curved frame (lumbar forward), mesh is translucent
    const frameOuter = [
      { x: -25.6, y: -52 }, { x: -22.6, y: -60 }, { x: -23.6, y: -72 }, { x: -27.6, y: -88 }, { x: -29, y: -100 }, { x: -26.4, y: -104 },
    ];
    const frameInner = [
      { x: -22.8, y: -103.4 }, { x: -24.6, y: -99 }, { x: -23.4, y: -88 }, { x: -19.6, y: -72 }, { x: -18.6, y: -60 }, { x: -21.4, y: -52.6 },
    ];
    const back = new Path2D();
    spline(back, frameOuter, [true, false, false, false, false, true]);
    spline(back, frameInner, [true, false, false, false, false, true], false);
    back.closePath();
    // armrest: post + pad
    const arm = new Path2D();
    spline(arm, [{ x: -6, y: -44.6 }, { x: -4, y: -52 }, { x: -1.6, y: -62 }], [true, false, true]);
    spline(arm, [{ x: 1.4, y: -62 }, { x: -1, y: -52 }, { x: -3, y: -44.6 }], [true, false, true], false);
    arm.closePath();
    p.addPath(arm);
    rrect(p, -10, -65, 18, 3.2, 1.6);
    cl.moveTo(-20, -47.6);
    cl.bezierCurveTo(-8, -48.8, 10, -48, 22, -47.6);
    // headrest-less; a lumbar pad line
    cl.moveTo(-21.2, -62);
    cl.quadraticCurveTo(-20.4, -66, -21.4, -70);
    return { p, cl, mesh: back };
  });
}

export const chair = defineProp<ChairOpts, 'seat' | 'back' | 'arm'>(
  (c, o, env) => {
    const style = o.style ?? 'carved';
    const view = o.view ?? 'side';
    const ink = env.fill('ink');
    c.fillStyle = ink;
    if (style === 'modern') {
      const M = modernChair();
      c.fill(M.p);
      // mesh: dense but sheer
      c.save();
      c.globalAlpha = 0.72;
      c.fill(M.mesh);
      c.restore();
      c.save();
      c.strokeStyle = ink;
      c.lineWidth = 1.6;
      c.stroke(M.mesh);
      c.restore();
      cut(c, env, M.cl, 0.3, 1.1);
      return;
    }
    const P = style === 'carved' ? (view === 'front' ? carvedFront() : carvedSide()) : style === 'wooden' ? woodenChair(view) : swivelChair();
    c.fill(P.p, style === 'carved' && view === 'front' ? 'evenodd' : 'nonzero');
    cut(c, env, P.cl, 0.32, 1.1);
  },
  (o) => {
    const front = o.view === 'front';
    const st = o.style ?? 'carved';
    const top = st === 'modern' ? -104 : st === 'swivel' ? -80 : st === 'wooden' ? -97 : -108;
    return {
      seat: { x: front ? 0 : 2, y: st === 'modern' ? -50 : -48 },
      back: { x: front ? 0 : st === 'modern' ? -26 : -22, y: top },
      arm: { x: st === 'swivel' ? 16 : st === 'modern' ? -1 : 0, y: st === 'swivel' ? -65 : st === 'modern' ? -65 : -48 },
    };
  },
  (o) => {
    const st = o.style ?? 'carved';
    const top = st === 'modern' ? -105 : st === 'swivel' ? -82 : st === 'wooden' ? -98 : -111;
    const w = o.view === 'front' ? 56 : st === 'modern' ? 64 : 54;
    return { x: -w / 2, y: top, w, h: -top };
  },
);

// ---------------------------------------------------------------------------
// Table with a tasselled cloth (reference frame)
// ---------------------------------------------------------------------------
export interface ClothTableOpts extends PropAt {
  w?: number;
  fringe?: boolean;
  legs?: 'turned' | 'none';
  /** fringe stir from a draught 0..1 (animated by env.t) */
  sway?: number;
  /** cloth drop below the top in cm (default 26) */
  drop?: number;
}

function clothPaths(w: number, fringe: boolean, legs: boolean, drop: number) {
  return memo(`cloth:${w}:${fringe}:${legs}:${drop}`, () => {
    const hw = w / 2;
    const top = -78;
    const hem = top + drop;
    const legsP = new Path2D();
    if (legs) {
      for (const sx of [-1, 1]) {
        const x = sx * (hw - 9);
        lathe([[2.6, 0, 1], [3.1, -1.4], [2.2, -3.4], [1.5, -5], [2.4, -9], [3.4, -15], [2.6, -21], [1.6, -25], [2.4, -28.4, 1], [2.4, -30, 1], [1.7, -33], [2.3, -40], [2.0, -48], [2.6, -56, 1], [2.6, -76, 1]], x, legsP);
      }
      // stretcher with a central urn finial
      rect(legsP, -hw + 9, -13.2, w - 18, 1.8);
      lathe([[2.4, -13, 1], [2.0, -16], [2.8, -18.6], [1.2, -21.4], [1.6, -22.6], [0.4, -23.6, 1]], 0, legsP);
    }
    const cloth = new Path2D();
    // top edge overhang then drape; corners droop a little lower
    cloth.moveTo(-hw - 3, top);
    cloth.lineTo(hw + 3, top);
    cloth.lineTo(hw + 3.6, hem - 1.6);
    const n = Math.max(6, Math.round(w / 24));
    for (let i = n; i >= 0; i--) {
      const x = -hw - 3.6 + ((w + 7.2) * i) / n;
      const xm = x + (w + 7.2) / n / 2;
      if (i < n) cloth.quadraticCurveTo(xm, hem + 0.8, x, hem - (i === 0 ? 1.6 : 0));
    }
    cloth.closePath();
    // tabletop board peeking above the cloth
    const board = new Path2D();
    rect(board, -hw - 3.6, top - 2.2, w + 7.2, 2.4);
    // folds as cut-lines
    const folds = new Path2D();
    for (const sx of [-1, 1]) {
      folds.moveTo(sx * (hw + 1.5), top + 4);
      folds.bezierCurveTo(sx * (hw + 2.2), top + 16, sx * (hw + 0.8), hem - 8, sx * (hw + 2.6), hem + 1);
      folds.moveTo(sx * (hw - 4), top + 6);
      folds.bezierCurveTo(sx * (hw - 3.2), top + 20, sx * (hw - 5.6), hem - 6, sx * (hw - 4.2), hem + 1.4);
    }
    for (let i = 1; i < n; i++) {
      const x = -hw - 3.6 + ((w + 7.2) * i) / n;
      folds.moveTo(x, hem - 6);
      folds.quadraticCurveTo(x + 0.4, hem - 3, x, hem - 0.4);
    }
    // braid (gimp) along the hem and a woven band under the top
    const braid = new Path2D();
    for (let x = -hw - 2.6; x < hw + 2.6; x += 1.6) ellipse(braid, x, hem - 1.6, 0.9, 0.55, 0.6);
    for (let x = -hw - 2; x < hw + 2; x += 2.2) ellipse(folds, x, top + 3.2, 0.8, 0.8);
    folds.moveTo(-hw - 2.6, top + 1.8);
    folds.lineTo(hw + 2.6, top + 1.8);
    folds.moveTo(-hw - 2.6, top + 4.6);
    folds.lineTo(hw + 2.6, top + 4.6);
    // tassel motif
    const tassel = new Path2D();
    tassel.rect(-0.18, 0, 0.36, 2.2);
    circle(tassel, 0, 2.8, 0.75);
    rect(tassel, -0.62, 3.4, 1.24, 0.5);
    tassel.moveTo(-0.55, 3.9);
    tassel.lineTo(0.55, 3.9);
    tassel.quadraticCurveTo(1.05, 6.4, 1.35, 8.4);
    tassel.lineTo(-1.35, 8.4);
    tassel.quadraticCurveTo(-1.05, 6.4, -0.55, 3.9);
    tassel.closePath();
    const slits = new Path2D();
    for (const u of [-0.55, 0, 0.55]) {
      slits.moveTo(u * 0.6, 4.6);
      slits.lineTo(u * 1.25, 8.1);
    }
    const fr = new Path2D();
    if (fringe) repeat(fr, tassel, -hw - 2.2, hw + 2.2, 3.4, hem - 0.6);
    return { legsP, cloth, board, folds, braid, tassel, slits, hem, top };
  });
}

export const clothTable = defineProp<ClothTableOpts, 'top' | 'left' | 'right' | 'centre'>(
  (c, o, env) => {
    const w = o.w ?? 170;
    const T = clothPaths(w, o.fringe !== false, o.legs !== 'none', o.drop ?? 26);
    const ink = env.fill('ink');
    c.fillStyle = ink;
    c.fill(T.legsP);
    c.fill(T.board);
    c.fill(T.cloth);
    c.fill(T.braid);
    if (o.fringe !== false) {
      // tassels individually so a draught can swing them (cheap: ~50 small fills)
      const sw = o.sway ?? 0;
      const fr = new Path2D();
      const sl = new Path2D();
      let i = 0;
      for (let x = -w / 2 - 2.2; x <= w / 2 + 2.2 + 1e-6; x += 3.4, i++) {
        const a = sw * 0.12 * fbm(env.t * 0.7 + i * 0.21, 41);
        const m = new DOMMatrix().translate(x, T.hem - 0.6).rotate((a * 180) / Math.PI);
        fr.addPath(T.tassel, m);
        sl.addPath(T.slits, m);
      }
      c.fill(fr);
      cut(c, env, sl, 0.2, 1);
    }
    cut(c, env, T.folds, 0.18, 1.2);
    cut(c, env, T.braid, 0.22, 0.8);
  },
  (o) => {
    const w = o.w ?? 170;
    return { top: { x: 0, y: -80 }, left: { x: -w / 2 + 14, y: -80 }, right: { x: w / 2 - 14, y: -80 }, centre: { x: 0, y: -60 } };
  },
  (o) => {
    const w = (o.w ?? 170) + 8;
    return { x: -w / 2, y: -80.2, w, h: 80.2 };
  },
);
