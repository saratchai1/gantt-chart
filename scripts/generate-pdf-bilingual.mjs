import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, 'generate-pdf.mjs');
const runtimePath = path.join(here, '.generate-pdf-bilingual-runtime.mjs');

const source = fs.readFileSync(sourcePath, 'utf8');
const regularNeedle = `const regularFont = resolveFont([\n  'Noto Sans Thai:style=Regular',\n  'Noto Sans Thai',\n  'Garuda:style=Regular',\n  'Garuda',\n  'Loma'\n]);`;
const boldNeedle = `const boldFont = resolveFont([\n  'Noto Sans Thai:style=Bold',\n  'Noto Sans Thai:style=SemiBold',\n  'Garuda:style=Bold',\n  'Garuda'\n]) || regularFont;`;

if (!source.includes(regularNeedle) || !source.includes(boldNeedle)) {
  throw new Error('PDF generator font-selection block changed; bilingual patch must be reviewed.');
}

const patched = source
  .replace(regularNeedle, `const regularFont = resolveFont([\n  'Garuda:style=Regular',\n  'Garuda',\n  'Loma',\n  'Noto Sans Thai:style=Regular',\n  'Noto Sans Thai'\n]);`)
  .replace(boldNeedle, `const boldFont = resolveFont([\n  'Garuda:style=Bold',\n  'Garuda',\n  'Loma:style=Bold',\n  'Noto Sans Thai:style=Bold',\n  'Noto Sans Thai:style=SemiBold'\n]) || regularFont;`)
  .replace('PDF Thai regular font:', 'PDF bilingual Thai/Latin regular font:')
  .replace('PDF Thai bold font:', 'PDF bilingual Thai/Latin bold font:');

fs.writeFileSync(runtimePath, patched, 'utf8');
try {
  await import(`${pathToFileURL(runtimePath).href}?build=${Date.now()}`);
} finally {
  fs.rmSync(runtimePath, { force: true });
}
