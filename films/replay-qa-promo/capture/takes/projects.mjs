// Many apps, one place: the projects grid, then the sidebar filter narrowed to the per-PR projects.
export const meta = { url: 'https://qa.replay.io/projects', settle: 2500 };
export default async function (page, h) {
  await page.locator('[data-testid="project-card-name"]').first().waitFor({ timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByText(/Checking your plan/).first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await h.move({ x: 900, y: 450 }, { dur: 400 });
  await h.mark('start');
  await h.wait(900);
  await h.scroll(520, { dur: 1600 });
  await h.mark('scrolled');
  await h.wait(500);
  await h.click('[data-testid="sidebar-projects-search-input"]');
  await h.type('PR #', { cps: 8 });
  await h.mark('filtered');
  await h.wait(1800);
  await h.mark('end');
}
