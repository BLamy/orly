// Headless Chromium for the film pipeline (Playwright; chromium.launch() = chrome-headless-shell).
//
//   const b = await launchChromium({ gpu: true })       render/stills/sheets: Metal GPU raster flags
//   const b = await launchChromium({ audio: true })     score: autoplay + no background throttling
//   GPU_ARGS, AUDIO_ARGS
// Falls back to the newest cached headless-shell build when Playwright's pinned one is missing
// (override with FILM_CHROMIUM=/path/to/chrome-headless-shell).
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const GPU_ARGS = ['--enable-gpu', '--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'];
export const AUDIO_ARGS = [
  '--autoplay-policy=no-user-gesture-required',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--disable-features=AudioServiceOutOfProcess',
];
const STEADY_ARGS = ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--hide-scrollbars', '--mute-audio'];

function cachedExecutable() {
  const root = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (!fs.existsSync(root)) return undefined;
  const dirs = fs
    .readdirSync(root)
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .sort((x, y) => Number(y.split('-')[1]) - Number(x.split('-')[1]));
  for (const d of dirs)
    for (const sub of ['chrome-headless-shell-mac-arm64', 'chrome-headless-shell-mac-x64', 'chrome-headless-shell-linux64']) {
      const p = path.join(root, d, sub, 'chrome-headless-shell');
      if (fs.existsSync(p)) return p;
    }
}

export async function launchChromium({ gpu = false, audio = false, extraArgs = [] } = {}) {
  const args = [...(gpu ? GPU_ARGS : []), ...(audio ? AUDIO_ARGS : STEADY_ARGS), ...extraArgs];
  const executablePath = process.env.FILM_CHROMIUM;
  try {
    return await chromium.launch({ headless: true, args, ...(executablePath ? { executablePath } : {}) });
  } catch (e) {
    if (!/Executable doesn't exist/.test(String(e))) throw e;
    const fallback = cachedExecutable();
    if (!fallback) throw e;
    return chromium.launch({ headless: true, args, executablePath: fallback });
  }
}
