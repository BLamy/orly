// Time-travel perf bug: a 67 ms React commit that drops 4 frames — report, replay, root cause.
export const meta = { url: 'https://qa.replay.io/projects/proj-electric-forest-pr-4650-preview-muejywvf/bugs', settle: 3000 };
export default async function (page, h) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByText(/Checking your plan/).first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await h.move({ x: 960, y: 420 }, { dur: 400 });
  await h.mark('start');
  await h.wait(900);
  await h.click('text=67ms React commit', { dur: 1000 });
  await h.mark('open');
  await page.getByText('Loading the replay').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  await h.wait(800);
  await h.mark('report');
  await h.move({ x: 960, y: 600 }, { dur: 600 });
  await h.wait(800);
  await h.scroll(760, { dur: 1800 });
  await h.mark('actual');
  await h.wait(1600);
  await h.scroll(420, { dur: 1400 });
  await h.mark('rootcause');
  await h.wait(2200);
  await h.mark('end');
}
