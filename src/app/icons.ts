// Button icons as mojipx sprites ('w' is the icon color, '.' is transparent).
import { flipped, type Palette, type Sprite } from 'mojipx';

export const ICON_PALETTE: Palette = { w: 'currentColor' };

export const PLAY: Sprite = ['w......', 'www....', 'wwwww..', 'wwwwwww', 'wwwww..', 'www....', 'w......'];
export const PAUSE: Sprite = ['ww...ww', 'ww...ww', 'ww...ww', 'ww...ww', 'ww...ww', 'ww...ww', 'ww...ww'];
export const NEXT: Sprite = ['w....ww', 'ww...ww', 'www..ww', 'wwww.ww', 'www..ww', 'ww...ww', 'w....ww'];
export const PREV: Sprite = flipped(NEXT);
export const FULLSCREEN: Sprite = ['www.www', 'w.....w', 'w.....w', '.......', 'w.....w', 'w.....w', 'www.www'];
export const SPEAKER: Sprite = ['...w.....', '..ww..w..', 'wwww...w.', 'wwww.w.w.', 'wwww...w.', '..ww..w..', '...w.....'];
