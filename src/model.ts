export type ThemeId = 'paper' | 'midnight' | 'mint';
export type FormatId = 'wide' | 'square' | 'portrait';
export type LayoutId = 'cover' | 'features' | 'release';
export interface CardState {
  title: string;
  tagline: string;
  description: string;
  features: string[];
  tags: string;
  author: string;
  link: string;
  edition: string;
  theme: ThemeId;
  format: FormatId;
  layout: LayoutId;
  image: string;
}
export const FORMAT = {
  wide: { width: 1200, height: 675, label: '横版' },
  square: { width: 1080, height: 1080, label: '方形' },
  portrait: { width: 1080, height: 1440, label: '竖版' },
} as const;
export const DEFAULT: CardState = {
  title: 'Folio',
  tagline: '好作品，\n值得一张好封面。',
  description: '把想法写成代码，再把作品分享给世界。为你的下一次发布，做一张有个性的项目卡片。',
  features: ['写下亮点，即刻预览', '随心换色，自由排版', '高清导出，分享作品'],
  tags: '开源工具, 设计, 零依赖',
  author: 'qimingjiu',
  link: '',
  edition: 'VOL. 001',
  theme: 'paper', format: 'wide', layout: 'cover', image: '',
};
export const LIMITS = { title: 40, tagline: 80, description: 160, tags: 60, author: 40, link: 120, edition: 24 } as const;
export function text(value: unknown, max: number): string {
  return typeof value === 'string' ? Array.from(value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')).slice(0, max).join('') : '';
}
export function normalize(input: unknown): CardState {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('草稿内容不是有效对象。');
  const x = input as Record<string, unknown>;
  const result = { ...DEFAULT, features: [...DEFAULT.features] };
  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    if (key in x) result[key] = text(x[key], LIMITS[key]);
  }
  if (Array.isArray(x.features)) result.features = Array.from({ length: 3 }, (_, i) => text((x.features as unknown[])[i], 36));
  if (['paper', 'midnight', 'mint'].includes(String(x.theme))) result.theme = x.theme as ThemeId;
  if (Object.hasOwn(FORMAT, String(x.format))) result.format = x.format as FormatId;
  if (['cover', 'features', 'release'].includes(String(x.layout))) result.layout = x.layout as LayoutId;
  if (typeof x.image === 'string' && x.image.length <= 1_500_000 && /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(x.image)) result.image = x.image;
  return result;
}
export function readDraft(raw: string): CardState {
  if (raw.length > 2_000_000) throw new Error('草稿文件过大，请选择小于 2 MB 的 Folio 草稿。');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('无法读取这个文件，请选择 Folio 导出的 JSON 草稿。'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('草稿格式不正确。');
  const doc = parsed as Record<string, unknown>;
  if (doc.app !== 'folio-cards' || doc.version !== 1 || !doc.card) throw new Error('这不是受支持的 Folio 草稿（版本 1）。');
  return normalize(doc.card);
}
export function writeDraft(card: CardState): string {
  return JSON.stringify({ app: 'folio-cards', version: 1, card: normalize(card) }, null, 2);
}
export function safeFilename(title: string): string {
  return text(title, 40).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').trim() || 'folio';
}
export function splitTags(tags: string): string[] {
  return tags.split(/[,，]/).map(t => text(t.trim(), 14)).filter(Boolean).slice(0, 3);
}
export function wrapText(value: string, maxWidth: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const { segment } of segmenter.segment(paragraph)) {
      if (line && measure(line + segment) > maxWidth) { lines.push(line); line = ''; }
      line += segment;
    }
    lines.push(line);
  }
  return lines;
}
