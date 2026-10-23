import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT, FORMAT, normalize, readDraft, writeDraft, safeFilename, splitTags, wrapText } from '../src/model.ts';

test('draft round-trip preserves explicit empty fields and all presets', () => {
  for (const format of Object.keys(FORMAT)) {
    const state = normalize({ ...DEFAULT, format, title: '', features: ['', '中文', '🚀'] });
    assert.deepEqual(readDraft(writeDraft(state)), state);
  }
});
test('untrusted draft cannot supply executable image or unsupported enums', () => {
  const next = normalize({ theme: '__proto__', format: 'constructor', layout: 'bad', image: 'data:image/svg+xml;base64,PHN2Zz4=', title: 100, features: [false] });
  assert.equal(next.theme, 'paper'); assert.equal(next.format, 'wide'); assert.equal(next.layout, 'cover');
  assert.equal(next.image, ''); assert.equal(next.title, ''); assert.deepEqual(next.features, ['', '', '']);
  assert.equal(normalize({ image: 'https://tracking.example/pixel.png' }).image, '');
});
test('import rejects invalid JSON, oversized input, and other apps or versions', () => {
  for (const invalid of ['{', 'null', '[]', '{}', '{"version":2,"app":"folio-cards","card":{}}', ' '.repeat(2_000_001)]) assert.throws(() => readDraft(invalid));
});
test('limits prevent long text and oversized images; arrays do not alias defaults', () => {
  assert.equal(Array.from(normalize({ title: '🚀'.repeat(100) }).title).length, 40);
  assert.equal(normalize({ image: 'data:image/png;base64,' + 'a'.repeat(1_500_000) }).image, '');
  const first = normalize(DEFAULT); first.features[0] = 'changed'; assert.notEqual(DEFAULT.features[0], 'changed');
});
test('wrap preserves Chinese, line breaks, and emoji grapheme clusters', () => {
  assert.deepEqual(wrapText('你好世界\n第二行', 2, s => Array.from(s).length), ['你好', '世界', '第二', '行']);
  assert.deepEqual(wrapText('👨‍👩‍👧‍👦x', 1, s => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].length), ['👨‍👩‍👧‍👦', 'x']);
});
test('tags and file names handle user input safely', () => {
  assert.deepEqual(splitTags(' MIT，TypeScript, local, fourth '), ['MIT', 'TypeScript', 'local']);
  assert.equal(safeFilename('../my:card?. '), '..-my-card-');
  assert.equal(safeFilename('...'), 'folio');
});
