import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import katex from 'katex';

const docsDirectory = 'docs';
const entries = (await readdir(docsDirectory)).filter(name => name.endsWith('.md'));
const knownFiles = new Set(entries);
const failures = [];
let formulaCount = 0;

for (const name of entries) {
  const source = await readFile(join(docsDirectory, name), 'utf8');
  const prose = source
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');

  const displayFormulas = [...prose.matchAll(/\$\$([\s\S]*?)\$\$/g)];
  const withoutDisplay = prose.replace(/\$\$[\s\S]*?\$\$/g, '');
  const inlineFormulas = [...withoutDisplay.matchAll(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g)];

  for (const match of [...displayFormulas, ...inlineFormulas]) {
    formulaCount += 1;
    try {
      katex.renderToString(match[1].trim(), { throwOnError: true, strict: 'error' });
    } catch (error) {
      failures.push(`${name}: invalid formula ${JSON.stringify(match[1].trim())}\n  ${error.message}`);
    }
  }

  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+\.md)(?:#[^)]+)?\)/g)) {
    const target = basename(match[1]);
    if (!knownFiles.has(target)) failures.push(`${name}: missing internal link target ${target}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Verified ${entries.length} Markdown files and ${formulaCount} KaTeX formulas.`);
