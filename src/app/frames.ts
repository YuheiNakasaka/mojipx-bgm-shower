// Pixel frames for panels and buttons, installed as CSS variables (see mojipx installFrames).
import { frameUrl, installFrames } from 'mojipx';

export const COLORS = {
  ink: '#0b0716',
  panel: 'rgba(14, 9, 32, 0.82)',
  edge: '#6e5cff',
  gold: '#ffd23f',
  goldHigh: '#fff4b8',
  goldLow: '#c9952b',
  chip: '#2a2155',
  chipHigh: '#4d3f99',
  chipLow: '#1a1438',
} as const;

export const setUpFrames = (): void =>
  installFrames({
    panel: frameUrl('window', { O: COLORS.ink, L: COLORS.edge, F: COLORS.panel }),
    gold: frameUrl('button', { O: COLORS.ink, H: COLORS.goldHigh, F: COLORS.gold, S: COLORS.goldLow }),
    'gold-down': frameUrl('buttonDown', { O: COLORS.ink, F: COLORS.gold, S: COLORS.goldLow }),
    chip: frameUrl('button', { O: COLORS.ink, H: COLORS.chipHigh, F: COLORS.chip, S: COLORS.chipLow }),
    'chip-down': frameUrl('buttonDown', { O: COLORS.ink, F: COLORS.chip, S: COLORS.chipLow }),
  });
