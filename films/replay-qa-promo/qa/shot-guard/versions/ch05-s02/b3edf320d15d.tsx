// PROBE (temporary): full page, for geometry measurement in the harness
import { Timeline } from "../../../core";
import { defineShot } from "../../../film/core/shot";
import { RrwebScreen } from "../../../film/promo";
export default defineShot({
  id: "ch05-s02",
  mood: "duskRose",
  build({ timing: T }) { const tl = new Timeline(); tl.hold(0, T.duration); return { tl }; },
  paint(f) { f.c.fillStyle = "#333"; f.c.fillRect(0, 0, 1280, 720); },
  overlay() {
    const g = [];
    for (let x = 0; x <= 1440; x += 100) g.push(<line key={"x" + x} x1={x * 0.8} x2={x * 0.8} y1={0} y2={720} stroke="rgba(0,200,255,.5)" strokeWidth={0.6} />);
    for (let y = 0; y <= 900; y += 50) g.push(<line key={"y" + y} y1={y * 0.8} y2={y * 0.8} x1={0} x2={1152} stroke={y % 100 ? "rgba(255,0,200,.35)" : "rgba(0,200,255,.5)"} strokeWidth={0.6} />);
    return <g>{g}</g>;
  },
  dom() { return <RrwebScreen slug="replay-qa-promo" take="bug-react" at={3150} box={{ x: 0, y: 0, w: 1152 }} chrome="none" radius={0} shadow={false} />; },
});
