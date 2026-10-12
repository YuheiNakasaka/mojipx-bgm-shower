import { expect, type Locator, type Page, test } from '@playwright/test';

const consoleErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

/** The controls fade out while idle; like a viewer, move the pointer over a control before pressing it. */
const press = async (page: Page, target: Locator) => {
  const box = await target.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 2, box.y + 2);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  }
  await expect(page.locator('.app')).toHaveClass(/hud-on/);
  await target.click();
};

const start = async (page: Page, query = '') => {
  await page.goto(`/${query}`);
  await page.getByRole('button', { name: 'Press start' }).click();
  await expect(page.getByTestId('track-title')).not.toHaveText('—');
};

/** Distinct colors in a sample of the canvas: a drawn scene has many, a blank canvas one. */
const canvasColors = (page: Page) =>
  page
    .getByTestId('show')
    .locator('canvas')
    .evaluate((c: HTMLCanvasElement) => {
      const ctx = c.getContext('2d');
      if (!ctx) return 0;
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      const seen = new Set<number>();
      for (let i = 0; i < data.length; i += 4 * 17) seen.add(((data[i] ?? 0) << 16) | ((data[i + 1] ?? 0) << 8) | (data[i + 2] ?? 0));
      return seen.size;
    });

test.describe('splash', () => {
  test('shows the title, the mood pad and a start button without errors', async ({ page }) => {
    const errors = consoleErrors(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'BGM SHOWER' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cozy/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Any mood/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Press start' })).toBeVisible();
    expect(await canvasColors(page)).toBeGreaterThan(3);
    expect(errors).toEqual([]);
  });

  test('remembers the chosen mood', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Hype/ }).click();
    await expect(page.getByRole('button', { name: /Hype/ })).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.getByRole('button', { name: /Hype/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('starts with the space key', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Space');
    await expect(page.getByText('Now playing')).toBeVisible();
  });
});

test.describe('playing', () => {
  test('plays a track you can hear, with visuals drawn', async ({ page }) => {
    const errors = consoleErrors(page);
    await start(page, '?track=sunday-bakery');
    await expect(page.getByTestId('track-title')).toHaveText('Sunday Bakery');
    await expect(page.locator('.app')).toHaveAttribute('data-heard', 'sunday-bakery');
    await expect(page.getByTestId('loop-text')).toHaveText(/Loop 1 of \d/);
    expect(await canvasColors(page)).toBeGreaterThan(8);
    expect(errors).toEqual([]);
  });

  test('pauses and resumes', async ({ page }) => {
    await start(page);
    await press(page, page.getByRole('button', { name: 'Pause' }));
    await expect(page.getByText('Paused')).toBeVisible();
    await press(page, page.getByRole('button', { name: 'Play' }));
    await expect(page.getByText('Now playing')).toBeVisible();
  });

  test('skips forward and back', async ({ page }) => {
    await start(page, '?track=sunday-bakery');
    await press(page, page.getByRole('button', { name: 'Next track' }));
    await expect(page.getByTestId('track-title')).not.toHaveText('Sunday Bakery');
    await press(page, page.getByRole('button', { name: 'Previous track' }));
    await expect(page.getByTestId('track-title')).toHaveText('Sunday Bakery');
  });

  test('switches between shuffle and repeat', async ({ page }) => {
    await start(page);
    await press(page, page.getByRole('button', { name: 'Shuffle' }));
    await expect(page.getByRole('button', { name: 'Repeat one' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('loop-text')).toHaveText('Repeating');
  });

  test('changes the mood from the dialog', async ({ page }) => {
    await start(page);
    await press(page, page.getByRole('button', { name: /Mood:/ }));
    const dialog = page.getByRole('dialog', { name: 'How do you feel?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Chill/ }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: /Mood: Chill/ })).toBeVisible();
  });

  test('changes and locks the scene', async ({ page }) => {
    await start(page);
    const before = await page.getByTestId('scene-title').textContent();
    await press(page, page.getByRole('button', { name: 'Next scene' }));
    await expect(page.getByTestId('scene-title')).not.toHaveText(before ?? '');
    await press(page, page.getByRole('button', { name: 'Lock scene' }));
    await expect(page.getByRole('button', { name: 'Scene locked' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('opens a scene from a link and keeps it', async ({ page }) => {
    await start(page, '?scene=warp-stars');
    await expect(page.getByTestId('scene-title')).toHaveText('Warp Stars');
    await expect(page.getByRole('button', { name: 'Scene locked' })).toBeVisible();
  });

  test('follows keyboard shortcuts', async ({ page }) => {
    await start(page, '?track=sunday-bakery');
    await page.locator('body').press('ArrowRight');
    await expect(page.getByTestId('track-title')).not.toHaveText('Sunday Bakery');
    await page.locator('body').press('m');
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('layout', () => {
  test('fits the screen without horizontal scrolling, with touch-sized buttons', async ({ page }) => {
    await start(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    for (const button of await page.getByRole('navigation', { name: 'Player controls' }).getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
    }
  });
});

test.describe('endless mix', () => {
  test.skip(({ isMobile }) => isMobile, 'one browser is enough for the long-running handover check');
  test.setTimeout(90_000);

  test('hands over to the next track at the end of the loop, without a cut', async ({ page }) => {
    // Neon Highway loops in about 26 seconds; loops=1 cues the next track right away.
    await start(page, '?track=neon-highway&loops=1');
    await expect(page.locator('.app')).toHaveAttribute('data-heard', 'neon-highway');
    await expect(page.locator('.app')).not.toHaveAttribute('data-heard', 'neon-highway', { timeout: 40_000 });
    await expect(page.getByTestId('track-title')).not.toHaveText('Neon Highway');
    await expect(page.getByTestId('loop-text')).toHaveText(/Loop 1 of 1/);
  });
});
