// Scale: cross-project Insights (projects, bugs, journeys, explorations, severity, discovery source).
export const meta = { url: 'https://qa.replay.io/insights', settle: 2500 };
export default async function (page, h) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByText(/Checking your plan/).first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await h.move({ x: 1000, y: 260 }, { dur: 400 });
  await h.mark('start');
  await h.wait(1500);
  await h.hover('text=Total bugs', { dur: 800 });
  await h.mark('stats');
  await h.wait(900);
  await h.move({ x: 1100, y: 600 }, { dur: 700 });
  await h.scroll(420, { dur: 1400 });
  await h.mark('severity');
  await h.wait(1500);
  await h.mark('end');
}
