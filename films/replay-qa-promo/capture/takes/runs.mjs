// Every run is recorded: the Test Runs tab of a CI project.
export const meta = { url: 'https://qa.replay.io/projects/proj-reminders-ci-msplb1z7/overview', settle: 3000 };
export default async function (page, h) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByText(/Checking your plan/).first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await h.move({ x: 960, y: 400 }, { dur: 400 });
  await h.mark('start');
  await h.wait(600);
  await h.click('text=Test Runs', { dur: 900 });
  await h.wait(1500);
  await h.mark('list');
  await h.move({ x: 960, y: 520 }, { dur: 600 });
  await h.scroll(600, { dur: 2200 });
  await h.mark('scrolled');
  await h.wait(1200);
  await h.mark('end');
}
