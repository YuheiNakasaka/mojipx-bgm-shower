// Renders the social preview image (public/og.png): the splash over a scene, at 1200×630.
// Run with `npm run og-image` after changing the splash or the scenes.
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const PORT = 5198;
const SCENE = 'sunset-grid';

const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`http://localhost:${PORT}/?scene=${SCENE}`);
  await page.getByRole('button', { name: 'Press start' }).waitFor();
  // The preview shows the title over the scene; the genres and the fine print are for the page itself.
  await page.addStyleTag({ content: '.genre-grid,.fine,.start{display:none!important}.splash-panel{width:auto;padding:28px 40px}' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'public/og.png' });
} finally {
  await browser.close();
  await server.close();
}
