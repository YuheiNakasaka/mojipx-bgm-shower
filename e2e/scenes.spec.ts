import { expect, type Page, test } from '@playwright/test';
import { SCENES } from '../src/visuals/scenes/index.ts';

const frame = (page: Page) =>
  page
    .getByTestId('show')
    .locator('canvas')
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());

const colorsOf = (page: Page) =>
  page
    .getByTestId('show')
    .locator('canvas')
    .evaluate((c: HTMLCanvasElement) => {
      const { data } = c.getContext('2d')?.getImageData(0, 0, c.width, c.height) ?? { data: new Uint8ClampedArray() };
      const seen = new Set<number>();
      for (let i = 0; i < data.length; i += 4 * 7) seen.add(((data[i] ?? 0) << 16) | ((data[i + 1] ?? 0) << 8) | (data[i + 2] ?? 0));
      return seen.size;
    });

test.describe('every scene', () => {
  // Desktop and phone portrait cover both aspect ratios.
  test.beforeEach(() => test.skip(!['desktop', 'phone'].includes(test.info().project.name)));

  for (const scene of SCENES) {
    test(`${scene.id} draws, animates and stays error-free`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.goto(`/?scene=${scene.id}&track=neon-highway`);
      await page.getByRole('button', { name: 'Press start' }).click();
      await expect(page.getByTestId('scene-title')).toHaveText(scene.title);
      await page.waitForTimeout(600);
      expect(await colorsOf(page)).toBeGreaterThanOrEqual(4);
      const before = await frame(page);
      await page.waitForTimeout(400);
      expect(await frame(page)).not.toBe(before);
      expect(errors).toEqual([]);
    });
  }
});
