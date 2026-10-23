import { DEFAULT, FORMAT, normalize, readDraft, safeFilename, writeDraft } from './model.ts';
import type { CardState, FormatId, LayoutId, ThemeId } from './model.ts';
import { renderCard } from './render.ts';
import { AUTHOR_URL, SPONSOR_URL } from './config.ts';
const $ = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI: ${selector}`);
  return element;
};
const form = $<HTMLFormElement>('#card-form');
const canvas = $<HTMLCanvasElement>('#card-canvas');
const saveStatus = $('#save-status');
const storageKey = 'folio-cards:v1';
let state = normalize(DEFAULT);
let photo: HTMLImageElement | null = null;
let toastTimer: ReturnType<typeof setTimeout>;
let saveTimer: ReturnType<typeof setTimeout>;
let imageOperation = 0;
let initialNotice = '';
try {
  const saved = localStorage.getItem(storageKey);
  if (saved) state = readDraft(saved);
} catch {
  initialNotice = '无法恢复本地草稿。你仍可编辑和导出，请用“导出草稿”备份。';
}
function notify(message: string, error = false) {
  const toast = $('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message; toast.classList.toggle('error', error); toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, error ? 7000 : 3800);
}
function saveNow() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(storageKey, writeDraft(state));
    saveStatus.textContent = '已保存到此浏览器';
  } catch {
    saveStatus.textContent = '保存失败，请导出草稿';
  }
}
function saveSoon() {
  saveStatus.textContent = '保存中…';
  clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 350);
}
function render() {
  const warnings = renderCard(canvas, state, photo);
  const dimensions = FORMAT[state.format];
  $('#dimensions').textContent = `${dimensions.width} × ${dimensions.height} px`;
  canvas.setAttribute('aria-label', `${state.title || '未命名项目'} 项目卡片：${state.tagline}。${state.layout === 'features' ? state.features.join('；') : state.description}`);
  canvas.style.maxWidth = state.format === 'wide' ? '100%' : state.format === 'square' ? '580px' : '420px';
  const warning = $('#render-warning');
  warning.textContent = warnings.join(' '); warning.hidden = !warnings.length;
  for (const attribute of ['theme', 'format', 'layout'] as const) {
    for (const button of document.querySelectorAll<HTMLButtonElement>(`[data-${attribute}]`)) {
      const active = button.dataset[attribute] === state[attribute];
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    }
  }
  $('#feature-fields').hidden = state.layout !== 'features';
  $('#description-fields').hidden = state.layout === 'features';
  $('#image-fields').hidden = state.layout === 'features';
  $('#remove-image').hidden = !state.image;
}
function populate() {
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) || !element.name) continue;
    element.value = element.name.startsWith('feature') ? state.features[Number(element.name.slice(-1))] : String(state[element.name as keyof CardState] ?? '');
  }
  render();
}
async function decodeImage(source: string): Promise<HTMLImageElement> {
  const image = new Image(); image.src = source;
  await image.decode();
  if (image.naturalWidth > 12000 || image.naturalHeight > 12000 || image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('图片尺寸过大，请缩小到 12000 像素以内且不超过 4000 万像素。');
  return image;
}
async function replaceState(next: CardState) {
  const operation = ++imageOperation;
  const nextPhoto = next.image ? await decodeImage(next.image) : null;
  if (operation !== imageOperation) return;
  state = next; photo = nextPhoto; populate(); saveNow();
}
function confirmReplace(title: string): Promise<boolean> {
  const dialog = $<HTMLDialogElement>('#confirm-dialog');
  $('#confirm-title').textContent = title;
  dialog.returnValue = '';
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
    dialog.showModal();
  });
}
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', event => {
  const element = event.target;
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) || !element.name) return;
  if (element.name.startsWith('feature')) state.features[Number(element.name.slice(-1))] = element.value;
  else state = { ...state, [element.name]: element.value };
  state = normalize(state); render(); saveSoon();
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme]')) button.addEventListener('click', () => {
  state.theme = button.dataset.theme as ThemeId; render(); saveSoon();
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-format]')) button.addEventListener('click', () => {
  state.format = button.dataset.format as FormatId; render(); saveSoon();
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-layout]')) button.addEventListener('click', () => {
  state.layout = button.dataset.layout as LayoutId; render(); saveSoon();
});
$('#export').addEventListener('click', async () => {
  const button = $<HTMLButtonElement>('#export'); button.disabled = true;
  const snapshot = normalize(state), snapshotPhoto = photo;
  try {
    await document.fonts.ready;
    const scale = Number($<HTMLSelectElement>('#resolution').value) === 2 ? 2 : 1;
    const output = document.createElement('canvas'); renderCard(output, snapshot, snapshotPhoto, scale);
    const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(value => value ? resolve(value) : reject(new Error('图片生成失败，请重试。')), 'image/png'));
    download(blob, `${safeFilename(snapshot.title)}-${snapshot.layout}-${snapshot.format}-${scale}x.png`);
    notify(`已生成 ${output.width} × ${output.height} PNG，请在下载中查看。`);
  } catch (error) { notify(error instanceof Error ? error.message : '导出失败，请重试。', true); }
  finally { button.disabled = false; }
});
$('#save-draft').addEventListener('click', () => {
  saveNow(); download(new Blob([writeDraft(state)], { type: 'application/json' }), `${safeFilename(state.title)}.folio.json`); notify('草稿已导出，可在另一台设备上继续编辑。');
});
$('#draft-input').addEventListener('change', async event => {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; input.value = '';
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('草稿文件过大，请选择小于 2 MB 的文件。');
    const next = readDraft(await file.text());
    if (!await confirmReplace('导入并替换当前草稿？')) return;
    await replaceState(next); notify('草稿已导入。');
  } catch (error) { notify(error instanceof Error ? error.message : '导入失败，当前草稿已保留。', true); }
});
$('#reset').addEventListener('click', async () => {
  if (await confirmReplace('恢复示例卡片？')) { await replaceState(normalize(DEFAULT)); notify('已恢复示例，可以重新创作了。'); }
});
$('#image-input').addEventListener('change', async event => {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; input.value = '';
  if (!file) return;
  const operation = ++imageOperation;
  let url = '';
  try {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('请选择 PNG、JPG 或 WebP 图片。');
    if (file.size > 5 * 1024 * 1024) throw new Error('图片超过 5 MB，请压缩后再试。');
    url = URL.createObjectURL(file);
    const original = await decodeImage(url);
    const ratio = Math.min(1, 1600 / Math.max(original.naturalWidth, original.naturalHeight));
    const resized = document.createElement('canvas');
    resized.width = Math.max(1, Math.round(original.naturalWidth * ratio));
    resized.height = Math.max(1, Math.round(original.naturalHeight * ratio));
    const c = resized.getContext('2d'); if (!c) throw new Error('浏览器无法处理此图片。');
    c.drawImage(original, 0, 0, resized.width, resized.height);
    const data = resized.toDataURL('image/webp', .85);
    if (data.length > 1_500_000) throw new Error('图片压缩后仍然过大，请缩小图片后重试。');
    const decoded = await decodeImage(data);
    if (operation !== imageOperation) return;
    state.image = data; photo = decoded; render(); saveNow(); notify('截图已添加，随草稿保存在此浏览器。');
  } catch (error) { notify(error instanceof Error ? error.message : '图片读取失败，请试试其他图片。', true); }
  finally { if (url) URL.revokeObjectURL(url); }
});
$('#remove-image').addEventListener('click', () => { imageOperation++; state.image = ''; photo = null; render(); saveNow(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
window.addEventListener('pagehide', saveNow);
$<HTMLAnchorElement>('#author-link').href = AUTHOR_URL;
try {
  if (SPONSOR_URL) {
    const target = new URL(SPONSOR_URL);
    if (target.protocol === 'https:' && !target.username && !target.password) {
      const link = $<HTMLAnchorElement>('#sponsor-link'); link.href = target.href; link.hidden = false;
    }
  }
} catch { /* An unconfigured sponsor URL must never break the editor. */ }
populate();
const restoredOperation = ++imageOperation;
if (state.image) {
  try {
    const restoredPhoto = await decodeImage(state.image);
    if (imageOperation === restoredOperation) { photo = restoredPhoto; render(); }
  } catch { initialNotice = '草稿文字已恢复，但截图无法读取，请重新添加截图。'; }
}
await document.fonts.ready;
render();
if (initialNotice) saveStatus.textContent = '请导出草稿备份'; else saveNow();
if (initialNotice) notify(initialNotice, true);
