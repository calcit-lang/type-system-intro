import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDirectory = 'dist/client';

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  }));
  return nested.flat();
}

for (const path of await htmlFiles(outputDirectory)) {
  const original = await readFile(path, 'utf8');
  const normalized = original
    .replaceAll('="/./', '="./')
    .replaceAll("='/./", "='./");

  if (/\b(?:src|href)=["']\/(?!\/)/.test(normalized)) {
    throw new Error(`Absolute local asset reference remains in ${path}`);
  }

  if (normalized !== original) await writeFile(path, normalized);
}
