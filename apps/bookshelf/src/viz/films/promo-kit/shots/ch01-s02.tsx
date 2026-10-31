// promo-kit smoke test: a cleaned rrweb take as DOM (tilted browser, cursor), typed URL, step list, agent pair
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, agentPair, haze, paper, steps, typed } from '../../../film/promo';

export default defineShot({
  id: 'ch01-s02',
  mood: 'parchment',
  build() {
    const tl = new Timeline();
    tl.hold(0, 7.5);
    return { tl };
  },
  paint(f) {
    const c = f.c;
    const t = f.t;
    paper(c);
    haze(c, { t, preset: 'ember', u: 0.55, y0: 0.35 });
    typed(c, { text: 'staging.your-app.dev', t, at: 0.3, cps: 16, x: 70, y: 110, size: 54 });
    steps(c, {
      title: 'Testing your app', t, x: 70, y: 200, size: 20, working: 'Working',
      items: [
        { icon: 'sparkle', label: 'Exploring', detail: 'the app like a user', at: 1.4, done: 3.0 },
        { icon: 'map', label: 'Journeys', detail: 'saved and versioned', at: 2.0, done: 3.6, color: PROMO.violet },
        { icon: 'play', label: 'Runs', detail: 'recorded in Replay Browser', at: 2.6, done: 4.2, color: PROMO.orange },
        { icon: 'bug', label: 'Bugs', detail: 'with root cause', at: 3.2, color: PROMO.coral },
      ],
    });
    agentPair(c, {
      t, x: 70, y: 560, scale: 0.62,
      exchanges: [
        { at: 4.0, verdict: 'not yet: still drops 4 frames', ok: false },
        { at: 6.0, verdict: 'good', ok: true },
      ],
    });
  },
  dom(s) {
    const t = s.t;
    return (
      <RrwebScreen slug="replay-qa-promo" take="new-project" at={t * 1000} box={{ x: 640, y: 150, w: 580 }} chrome="browser" url="qa.replay.io" tilt={{ x: 6, y: -16 }} cursor />
    );
  },
});
