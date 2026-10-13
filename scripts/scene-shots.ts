// Renders scenes to PNG files for review: each scene at a desktop and a phone size, at two moments.
// Run with `npm run shots -- <scene-id> [<scene-id> …]` (no ids: every scene); files land in test-results/shots/.
// SHOTS_PORT picks the dev server port, so several runs can go side by side.
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { SCENES } from '../src/visuals/scenes/index.ts';

const PORT = Number(process.env.SHOTS_PORT ?? 5197);
const OUT = 'test-results/shots';
const TRACK = process.env.SHOTS_TRACK ?? 'neon-highway';
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'phone', width: 390, height: 844 },
] as const;

const asked = process.argv.slice(2);
const unknown = asked.filter((id) => !SCENES.some((s) => s.id === id));
if (unknown.length > 0) throw new Error(`Unknown scenes: ${unknown.join(', ')}`);
const ids = asked.length > 0 ? asked : SCENES.map((s) => s.id);

mkdirSync(OUT, { recursive: true });
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
try {
  for (const id of ids) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`http://localhost:${PORT}/?scene=${id}&track=${TRACK}`);
      await page.getByRole('button', { name: 'Press start' }).click();
      // The controls and the title card would cover the picture; only the canvas is under review.
      await page.addStyleTag({ content: '[data-testid="show"] ~ * { display: none !important; }' });
      const canvas = page.getByTestId('show').locator('canvas');
      await page.waitForTimeout(1800);
      await canvas.screenshot({ path: `${OUT}/${id}-${vp.name}-a.png` });
      await page.waitForTimeout(1300);
      await canvas.screenshot({ path: `${OUT}/${id}-${vp.name}-b.png` });
      await page.close();
      console.log(`${id} ${vp.name}${errors.length > 0 ? ` ERRORS: ${errors.join(' | ')}` : ' ok'}`);
    }
  }
} finally {
  await browser.close();
  await server.close();
}
