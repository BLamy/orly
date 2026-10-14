// Fully managed: environments with schedules (Production · Tue 3:00 AM; add staging/preview/…), polish passes.
export const meta = { url: 'https://qa.replay.io/projects/proj-collaborative-ai-editor-brett-lamy-workers-dev-mqqwem6e/settings', settle: 3000 };
export default async function (page, h) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByText(/Checking your plan/).first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await h.move({ x: 960, y: 420 }, { dur: 400 });
  await h.mark('start');
  await h.wait(700);
  await h.hover('text=Polish passes', { dur: 900 });
  await h.mark('polish');
  await h.wait(1300);
  await h.move({ x: 960, y: 560 }, { dur: 500 });
  await h.scroll(700, { dur: 1800 });
  await h.wait(400);
  await h.hover('text=Tue at 3:00 AM', { dur: 900 });
  await h.mark('schedule');
  await h.wait(1300);
  await h.hover('text=Add environment', { dur: 800 });
  await h.mark('add-env');
  await h.wait(1500);
  await h.mark('end');
}
