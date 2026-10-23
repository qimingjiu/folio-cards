import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await rm(root + 'dist', { recursive: true, force: true });
await mkdir(root + 'dist', { recursive: true });
await cp(root + 'public', root + 'dist', { recursive: true });
for (const file of await readdir(root + 'src')) {
  if (!file.endsWith('.ts')) continue;
  const source = await readFile(root + 'src/' + file, 'utf8');
  const js = stripTypeScriptTypes(source, { mode: 'strip' }).replace(/(from\s+['"]\.\/[^'"]+)\.ts(['"])/g, '$1.js$2');
  await writeFile(root + 'dist/' + file.replace(/\.ts$/, '.js'), js);
}
console.log('Built Folio → dist/ (no third-party dependencies)');
