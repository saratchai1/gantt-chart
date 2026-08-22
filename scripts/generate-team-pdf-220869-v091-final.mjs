import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, 'generate-team-pdf-220869-v091.mjs');
const runtimePath = path.join(here, '.generate-team-pdf-220869-v091-runtime.mjs');
let source = fs.readFileSync(sourcePath, 'utf8');

const needle = `  let y = 356;`;
if (!source.includes(needle)) {
  throw new Error('Team PDF v0.9.1 generator changed; revision-reference insertion point is missing.');
}
source = source.replace(needle, `  useFont('Thai', 4.8, COLORS.muted);\n  doc.text(\`Baseline SHA: \${TEAM_GANTT_REVISION.baseline_commit_sha} · Source Register SHA: \${TEAM_GANTT_REVISION.source_register_commit_sha}\`,\n    PAGE_MARGIN, 342, { width: innerW, lineBreak: false });\n  useFont('Thai', 4.2, COLORS.muted);\n  doc.text('Issue controls: ฉบับแก้ไข v0.9.1 · ช่วงเวลาครอบคลุม · TBC — รอยืนยัน · ไม่ใช่ Cash Flow หรือ Payment Schedule · โซน Drop-off',\n    PAGE_MARGIN, 349, { width: innerW, lineBreak: false });\n\n  let y = 363;`);

fs.writeFileSync(runtimePath, source, 'utf8');
try {
  await import(`${pathToFileURL(runtimePath).href}?build=${Date.now()}`);
} finally {
  fs.rmSync(runtimePath, { force: true });
}
