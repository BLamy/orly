// The QA agent at work: Electric Forest's overview, whose Exploration player replays the agent driving the app.
export const meta = { url: 'https://qa.replay.io/projects/proj-electric-forest-ms8w0nv1/overview', settle: 3500 };
export default async function (page, h) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByText('Exploration', { exact: true }).first().waitFor({ timeout: 45000 });
  await page.getByText(/^0:00$/).first().waitFor({ timeout: 45000 });
  await page.waitForTimeout(1500);
  await h.move({ x: 960, y: 520 }, { dur: 400 });
  await h.mark('start');
  await h.wait(900);
  // the player's play button (left of the 0:00 counter)
  const bar = await page.getByText(/^0:00$/).first().boundingBox();
  await h.click(bar ? { x: bar.x - 52, y: bar.y + bar.height / 2 } : { x: 571, y: 814 }, { dur: 900 });
  await h.mark('play');
  await h.move({ x: 1180, y: 560 }, { dur: 1200 });
  await h.wait(7000);
  await h.mark('end');
}
