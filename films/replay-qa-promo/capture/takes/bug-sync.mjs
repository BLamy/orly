// Time-travel perf bug: a live-sync loop that re-fetches 258 times with its checkpoint stuck at -1 (fixed).
export const meta = { url: 'https://qa.replay.io/projects/proj-electric-forest-ms8w0nv1/bugs/bug-mtmk9vtr-21c2', settle: 3500 };
export default async function (page, h) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByText(/Checking your plan/).first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.getByText('Loading the replay').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  await h.move({ x: 960, y: 300 }, { dur: 400 });
  await h.mark('start');
  await h.wait(1600);
  await h.mark('report');
  await h.move({ x: 960, y: 600 }, { dur: 700 });
  await h.scroll(760, { dur: 1800 });
  await h.mark('actual');
  await h.wait(1600);
  await h.scroll(420, { dur: 1400 });
  await h.mark('rootcause');
  await h.wait(2200);
  await h.mark('end');
}
