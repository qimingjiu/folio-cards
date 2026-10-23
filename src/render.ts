import { FORMAT, splitTags, wrapText } from './model.ts';
import type { CardState, ThemeId } from './model.ts';
type Context = CanvasRenderingContext2D;
export const PALETTES: Record<ThemeId, { bg: string; ink: string; muted: string; accent: string; soft: string; line: string }> = {
  paper: { bg: '#f5f0e4', ink: '#252522', muted: '#737169', accent: '#f0afc0', soft: '#e9eab8', line: '#d1cdbf' },
  midnight: { bg: '#202832', ink: '#f5f2e9', muted: '#bdc6cb', accent: '#d7ed9b', soft: '#414e5b', line: '#56616b' },
  mint: { bg: '#e3eee9', ink: '#214e46', muted: '#59776d', accent: '#ffbd98', soft: '#b5d4c7', line: '#abc4ba' },
};
const sans = '"Arial", "Noto Sans CJK SC", "Microsoft YaHei", "PingFang SC", sans-serif';
const serif = '"Georgia", "Noto Serif CJK SC", "Songti SC", "SimSun", serif';
function rect(c: Context, x: number, y: number, w: number, h: number, color: string, r = 0) {
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = color; c.fill();
}
function line(c: Context, x1: number, y1: number, x2: number, y2: number, color: string) {
  c.strokeStyle = color; c.lineWidth = 1; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
}
function label(c: Context, value: string, x: number, y: number, size: number, color: string, weight = 400) {
  c.fillStyle = color; c.font = `${weight} ${size}px ${sans}`; c.textBaseline = 'top'; c.fillText(value, x, y);
}
function fit(c: Context, value: string, x: number, y: number, w: number, h: number, max: number, min: number, color: string, family = sans, weight = 400): boolean {
  let size = max; let lines: string[] = [];
  for (; size >= min; size--) {
    c.font = `${weight} ${size}px ${family}`;
    lines = wrapText(value, w, s => c.measureText(s).width);
    if (lines.length * size * 1.35 <= h) break;
  }
  size = Math.max(min, size); c.font = `${weight} ${size}px ${family}`;
  const capacity = Math.max(1, Math.floor(h / (size * 1.35)));
  const truncated = lines.length > capacity;
  lines = lines.slice(0, capacity);
  if (truncated) {
    let last = Array.from(lines.at(-1) || '');
    while (last.length && c.measureText(last.join('') + '…').width > w) last.pop();
    lines[lines.length - 1] = last.join('') + '…';
  }
  c.fillStyle = color; c.textBaseline = 'top';
  lines.forEach((l, i) => c.fillText(l, x, y + i * size * 1.35));
  return truncated;
}
function art(c: Context, x: number, y: number, w: number, h: number, state: CardState, photo: HTMLImageElement | null) {
  const p = PALETTES[state.theme];
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, 8); c.clip();
  if (photo) {
    rect(c, x, y, w, h, p.soft);
    const ratio = Math.min((w - 36) / photo.naturalWidth, (h - 36) / photo.naturalHeight);
    const dw = photo.naturalWidth * ratio, dh = photo.naturalHeight * ratio;
    c.drawImage(photo, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    const cx = x + w * .49, cy = y + h * .5, unit = Math.min(w, h);
    c.save(); c.translate(cx, cy); c.rotate(-.22);
    rect(c, -unit * .34, -unit * .34, unit * .72, unit * .75, p.soft, 4);
    const cardInk = state.theme === 'midnight' ? '#11191f' : p.ink;
    rect(c, -unit * .3, -unit * .40, unit * .65, unit * .7, cardInk, 4);
    c.translate(unit * .015, -unit * .08); c.rotate(.22);
    for (let i = 0; i < 10; i++) {
      c.save(); c.rotate(i * Math.PI / 5);
      c.beginPath(); c.ellipse(unit * .13, 0, unit * .21, unit * .075, 0, 0, Math.PI * 2);
      c.fillStyle = p.accent; c.fill(); c.restore();
    }
    c.beginPath(); c.arc(0, 0, unit * .065, 0, Math.PI * 2); c.fillStyle = cardInk; c.fill();
    c.restore();
    label(c, '✦', x + w - 38, y + 15, 35, p.ink);
    label(c, 'A LITTLE IDEA. A BIG BEGINNING.', x + 6, y + h - 18, Math.max(9, w / 34), p.muted);
  }
  c.restore();
}
export function renderCard(canvas: HTMLCanvasElement, state: CardState, photo: HTMLImageElement | null, scale = 1): string[] {
  const { width: w, height: h } = FORMAT[state.format];
  canvas.width = w * scale; canvas.height = h * scale;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('浏览器不支持 Canvas 绘图。');
  c.scale(scale, scale);
  const p = PALETTES[state.theme], m = 52, bottom = h - 80;
  const wide = state.format === 'wide'; const warnings: string[] = [];
  const block = (value: string, x: number, y: number, bw: number, bh: number, max: number, min: number, color: string, family = sans, weight = 400) => {
    if (fit(c, value, x, y, bw, bh, max, min, color, family, weight)) warnings.push('部分文字较长，图片中已省略；缩短内容可完整显示。');
  };
  rect(c, 0, 0, w, h, p.bg);
  label(c, '●  PROJECT SHOWCASE', m, 35, 13, p.ink, 600);
  c.font = `500 13px ${sans}`;
  label(c, state.edition, w - m - c.measureText(state.edition).width, 35, 13, p.muted, 500);
  line(c, m, 72, w - m, 72, p.line);
  const tags = splitTags(state.tags);
  let tx = m;
  for (const tag of tags) {
    c.font = `500 13px ${sans}`; const tw = c.measureText(tag).width + 24;
    rect(c, tx, 98, tw, 28, p.soft, 14); label(c, tag, tx + 12, 105, 13, p.ink, 500); tx += tw + 8;
  }
  if (state.layout === 'cover') {
    const textW = wide ? w * .5 - m : w - m * 2;
    block(state.title || '未命名项目', m, 151, textW, wide ? 108 : 138, wide ? 88 : 110, 30, p.ink, serif);
    block(state.tagline, m, wide ? 267 : 304, textW, wide ? 128 : 140, wide ? 39 : 42, 23, p.ink, sans, 600);
    block(state.description, m, wide ? 426 : 467, textW, wide ? 115 : 115, 19, 15, p.muted);
    if (wide) art(c, w * .58, 150, w * .42 - m, bottom - 175, state, photo);
    else art(c, m + 70, 610, w - (m + 70) * 2, bottom - 635, state, photo);
  } else if (state.layout === 'features') {
    block(state.title || '未命名项目', m, 152, w - 2 * m, 100, 72, 30, p.ink, serif);
    block(state.tagline, m, 264, w - 2 * m, wide ? 68 : 100, 28, 20, p.muted);
    const start = wide ? 365 : 400;
    const gap = 18;
    const cw = wide ? (w - 2 * m - 2 * gap) / 3 : w - 2 * m;
    const ch = wide ? bottom - start - 20 : (bottom - start - 3 * gap) / 3;
    state.features.forEach((f, i) => {
      const x = wide ? m + i * (cw + gap) : m;
      const y = wide ? start : start + i * (ch + gap);
      rect(c, x, y, cw, ch, i === 1 ? p.accent : p.soft, 8);
      const ink = state.theme === 'midnight' && i === 1 ? p.bg : p.ink;
      label(c, `0${i + 1}`, x + 24, y + 23, 15, ink, 600);
      block(f, x + 24, y + 62, cw - 48, ch - 75, 28, 18, ink, sans, 600);
    });
  } else {
    const textW = wide ? w * .53 - m : w - 2 * m;
    label(c, 'NEW RELEASE ↗', m, 160, 16, p.muted, 600);
    block(state.title || '未命名项目', m, 207, textW, 115, 84, 30, p.ink, serif);
    block(state.tagline, m, 342, textW, 125, 34, 22, p.ink, sans, 600);
    block(state.description, m, 489, textW, wide ? 83 : 110, 18, 14, p.muted);
    if (wide) art(c, w * .6, 165, w * .4 - m, bottom - 185, state, photo);
    else art(c, m + 65, 630, w - (m + 65) * 2, bottom - 660, state, photo);
  }
  line(c, m, bottom, w - m, bottom, p.line);
  block(state.author ? `BY ${state.author}` : 'MADE WITH CARE', m, bottom + 27, w * .32, 27, 14, 11, p.ink, sans, 500);
  const linkWidth = w * .52;
  block(state.link || 'CREATE SOMETHING WORTH SHARING. ↗', w - m - linkWidth, bottom + 27, linkWidth, 30, 13, 9, p.muted);
  return [...new Set(warnings)];
}
