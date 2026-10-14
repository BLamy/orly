// Drive the film render harness (/?film-render=<slug>, ARCHITECTURE §5.4) from Playwright.
//
//   const h = await openHarness(browser, site.base, slug, { width: 1920, height: 1080 })
//   h.info -> { slug, fps, duration, width, height, shots }
//   await h.seek(t);  const jpeg = await h.capture({ format: 'jpeg', quality: 95 });  await h.close()
//   h.label(text | null)  — in-page caption box for QA sheets (never used by render)
// Service workers are blocked (the PWA's autoUpdate would reload the page mid-render). When the
// harness renders at a different size than requested, capture uses a CDP clip with a scale.
export async function openHarness(browser, base, slug, { width = 1920, height = 1080, timeout = 120, query = '', init = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(timeout * 1000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 400)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 400));
  });
  // Dev server: neutralise Vite's HMR socket so an edit elsewhere in the repo cannot reload the page mid-render.
  await context.addInitScript(() => {
    const Native = window.WebSocket;
    window.WebSocket = function (url, protocols) {
      if (String(protocols).includes('vite-hmr') || /[?&]token=/.test(String(url))) {
        const fake = new EventTarget();
        Object.assign(fake, { readyState: 0, send() {}, close() {}, url: String(url), protocol: 'vite-hmr' });
        return fake;
      }
      return new Native(url, protocols);
    };
    Object.assign(window.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  });
  if (init) await context.addInitScript(init); // e.g. legibility.mjs's fillText recorder
  const url = `${base}/?film-render=${encodeURIComponent(slug)}&w=${width}&h=${height}${query ? `&${query}` : ''}`;
  await page.goto(url, { waitUntil: 'load' });
  let info;
  for (let attempt = 0; ; attempt++) {
    try {
      // a first dev-server visit may reload once (dependency optimisation): retry across navigations
      await page.waitForFunction(() => !!(window.__film && window.__film.ready), null, { timeout: timeout * 1000 });
      await page.evaluate(() => window.__film.ready);
      info = await page.evaluate(() => {
        const f = window.__film;
        return { slug: f.slug, fps: f.fps, duration: f.duration, width: f.width, height: f.height, error: f.error ?? null, shots: f.shots.map((s) => ({ ...s })) };
      });
      break;
    } catch (e) {
      if (attempt >= 3 || !/context was destroyed|navigation/i.test(String(e))) throw e;
      await page.waitForLoadState('load');
    }
  }
  if (info.error) throw new Error(`harness error: ${info.error}`);
  let clip = null;
  if (info.width !== width || info.height !== height) {
    // harness ignores the requested size: render at its size, downscale in the capture
    await page.setViewportSize({ width: info.width, height: info.height });
    clip = { x: 0, y: 0, width: info.width, height: info.height, scale: width / info.width };
  }
  const cdp = await context.newCDPSession(page);
  return {
    page,
    info,
    errors,
    url,
    seek: (t) => page.evaluate((tt) => window.__film.seek(tt), t),
    frameInfo: () => page.evaluate(() => window.__film.frameInfo?.() ?? null),
    async capture({ format = 'jpeg', quality = 95 } = {}) {
      const r = await cdp.send('Page.captureScreenshot', { format, ...(format === 'png' ? {} : { quality }), optimizeForSpeed: true, ...(clip ? { clip } : {}) });
      return Buffer.from(r.data, 'base64');
    },
    async label(text) {
      await page.evaluate((txt) => {
        let d = document.getElementById('__qalabel');
        if (txt == null) {
          d?.remove();
          return;
        }
        if (!d) {
          d = document.createElement('div');
          d.id = '__qalabel';
          d.style.cssText =
            'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;font:500 34px/1.25 ui-sans-serif,system-ui,sans-serif;color:#fff;' +
            'background:rgba(0,0,0,.72);padding:12px 22px 14px;white-space:pre-wrap;max-height:40%;overflow:hidden';
          document.body.appendChild(d);
        }
        d.textContent = txt;
      }, text);
    },
    close: () => context.close(),
  };
}
