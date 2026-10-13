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
  test('shows the title, the genres and a start button without errors', async ({ page }) => {
    const errors = consoleErrors(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'BGM SHOWER' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Idol', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vocal Synth', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /All genres/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Press start' })).toBeVisible();
    expect(await canvasColors(page)).toBeGreaterThan(3);
    expect(errors).toEqual([]);
  });

  test('remembers the chosen genre', async ({ page }) => {
    await page.goto('/');
    const cityPop = page.getByRole('button', { name: 'City Pop', exact: true });
    await cityPop.click();
    await expect(cityPop).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(cityPop).toHaveAttribute('aria-pressed', 'true');
  });

  test('starts with the space key', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('status')).toHaveText('Now playing');
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
    await expect(page.getByTestId('status')).toHaveText('Paused');
    await press(page, page.getByRole('button', { name: 'Play' }));
    await expect(page.getByTestId('status')).toHaveText('Now playing');
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

  test('changes the genre from the dialog', async ({ page }) => {
    await start(page);
    await press(page, page.getByRole('button', { name: /Genre:/ }));
    const dialog = page.getByRole('dialog', { name: 'What do you want to hear?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Chill/ }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: /Genre: Chill/ })).toBeVisible();
  });

  test('plays the genre a link asks for', async ({ page }) => {
    await start(page, '?genre=idol');
    await expect(page.getByRole('button', { name: /Genre: Idol/ })).toBeVisible();
    await press(page, page.getByRole('button', { name: 'Tracks' }));
    const idol = page.getByRole('dialog', { name: 'All tracks' }).getByRole('region', { name: 'Idol' });
    await expect(idol.locator('[aria-current="true"]')).toHaveCount(1);
  });

  test('lists every track and plays the one picked', async ({ page }) => {
    await start(page, '?track=sunday-bakery');
    await press(page, page.getByRole('button', { name: 'Tracks' }));
    const dialog = page.getByRole('dialog', { name: 'All tracks' });
    await expect(dialog.getByRole('button', { name: /Sunday Bakery/ })).toHaveAttribute('aria-current', 'true');
    await dialog.getByRole('button', { name: /Neon Highway/ }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId('track-title')).toHaveText('Neon Highway');
    await expect(page.locator('.title-card')).toContainText('Neon Highway');
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
    await page.locator('body').press('g');
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

const SHARED = '?track=sunday-bakery&scene=warp-stars&mode=repeat';

type Recorded = Window & { recorded?: { readonly url?: string; readonly text?: string } };

/** Records what the page shares or copies; on touch screens a share sheet is offered, unless `sheet` is false. */
const recordSharing = (page: Page, sheet: boolean) =>
  page.addInitScript((withSheet: boolean) => {
    const w = window as Recorded;
    const share = withSheet
      ? async (data: { url?: string; text?: string }) => {
          w.recorded = data;
        }
      : undefined;
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const writeText = async (url: string) => {
      w.recorded = { url };
    };
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  }, sheet);

const recorded = (page: Page) => page.evaluate(() => (window as Recorded).recorded ?? null);

test.describe('shared links', () => {
  test('shows what a shared link plays, then keeps the track on repeat and the scene locked', async ({ page }) => {
    const errors = consoleErrors(page);
    await page.goto(`/${SHARED}`);
    await expect(page.getByText('Shared with you')).toBeVisible();
    await expect(page.getByTestId('shared-track')).toHaveText('Sunday Bakery');
    await expect(page.getByText('Scene: Warp Stars')).toBeVisible();
    await expect(page.getByText('It stays on repeat until you change it.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Idol', exact: true })).toBeHidden();
    await expect(page.locator('.app')).toHaveAttribute('data-heard', '');
    expect(await canvasColors(page)).toBeGreaterThan(3);

    await page.getByRole('button', { name: 'Press start' }).click();
    await expect(page.getByTestId('track-title')).toHaveText('Sunday Bakery');
    await expect(page.locator('.app')).toHaveAttribute('data-heard', 'sunday-bakery');
    await expect(page.getByTestId('loop-text')).toHaveText('Repeating');
    await expect(page.getByTestId('scene-title')).toHaveText('Warp Stars');
    await expect(page.getByRole('button', { name: 'Repeat one' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Scene locked' })).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });

  test('starts a shared link with the space key', async ({ page }) => {
    await page.goto(`/${SHARED}`);
    await page.keyboard.press('Space');
    await expect(page.getByTestId('track-title')).toHaveText('Sunday Bakery');
  });

  test('says when a linked track goes on into the mix', async ({ page }) => {
    await page.goto('/?track=sunday-bakery');
    await expect(page.getByTestId('shared-track')).toHaveText('Sunday Bakery');
    await expect(page.getByText('Then the mix carries on.')).toBeVisible();
    await expect(page.getByText(/^Scene:/)).toBeHidden();
  });

  test('shows the genre picker when the linked track is unknown', async ({ page }) => {
    await page.goto('/?track=no-such-song&scene=warp-stars&mode=repeat');
    await expect(page.getByRole('heading', { name: 'BGM SHOWER' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Idol', exact: true })).toBeVisible();
    await expect(page.getByTestId('shared-track')).toHaveCount(0);
  });

  test('leaves the saved play mode alone unless the listener changes it', async ({ page }) => {
    await start(page, SHARED);
    await start(page);
    await expect(page.getByTestId('loop-text')).toHaveText(/Loop 1 of \d/);

    await start(page, SHARED);
    await press(page, page.getByRole('button', { name: 'Repeat one' }));
    await press(page, page.getByRole('button', { name: 'Shuffle' }));
    await start(page);
    await expect(page.getByTestId('loop-text')).toHaveText('Repeating');
  });

  test('copies a link to the playing track and scene, which plays them again', async ({ page, baseURL }) => {
    await recordSharing(page, false);
    await start(page, '?genre=idol&track=sunday-bakery&scene=warp-stars');
    await expect(page.locator('.share-note')).toBeHidden();
    await press(page, page.getByRole('button', { name: 'Share' }));
    await expect(page.locator('.share-note')).toHaveText('Link copied');
    await expect(page.locator('.share-note')).toBeHidden({ timeout: 4000 });
    const link = (await recorded(page))?.url ?? '';
    expect(link).toBe(`${baseURL}/${SHARED}`);

    await start(page, link.replace(`${baseURL}/`, ''));
    await expect(page.getByTestId('track-title')).toHaveText('Sunday Bakery');
    await expect(page.getByTestId('scene-title')).toHaveText('Warp Stars');
    await expect(page.getByTestId('loop-text')).toHaveText('Repeating');
  });

  test('shares with the S key', async ({ page, baseURL }) => {
    await recordSharing(page, false);
    await start(page, SHARED);
    await page.locator('body').press('s');
    await expect(page.locator('.share-note')).toHaveText('Link copied');
    expect((await recorded(page))?.url).toBe(`${baseURL}/${SHARED}`);
  });

  test('hands the link to the share sheet on touch screens', async ({ page, baseURL, hasTouch }) => {
    test.skip(!hasTouch, 'desktops copy the link');
    await recordSharing(page, true);
    await start(page, SHARED);
    await press(page, page.getByRole('button', { name: 'Share' }));
    await expect(page.locator('.share-note')).toHaveText('Shared');
    expect(await recorded(page)).toEqual({ title: 'BGM Shower', text: 'Sunday Bakery × Warp Stars', url: `${baseURL}/${SHARED}` });
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
  test.setTimeout(150_000);

  test('hands over to the next track at the end of the loop, without a cut', async ({ page }) => {
    // Teacup Waltz, the shortest track, plays its intro and one loop in about 75 seconds; loops=1 cues the next track right away.
    await start(page, '?track=teacup-waltz&loops=1');
    await expect(page.locator('.app')).toHaveAttribute('data-heard', 'teacup-waltz');
    await expect(page.locator('.app')).not.toHaveAttribute('data-heard', 'teacup-waltz', { timeout: 100_000 });
    await expect(page.getByTestId('track-title')).not.toHaveText('Teacup Waltz');
    await expect(page.getByTestId('loop-text')).toHaveText(/Up next: |Loop 1 of 1/);
  });
});
