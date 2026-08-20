import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, 'generate-pdf-thai-v08.mjs');
const runtimePath = path.join(here, '.generate-pdf-thai-v08-final-runtime.mjs');
let source = fs.readFileSync(sourcePath, 'utf8');

function replaceRequired(needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Thai PDF generator changed; missing ${label}.`);
  source = source.replace(needle, replacement);
}

replaceRequired(
  "    if (/\\s|[–—/:,()]/.test(token)) return i;",
  "    if (/\\s|[–—/:,;()]/.test(token)) return i;",
  'preferred line-break punctuation'
);

replaceRequired(
`  const columns = [
    ['WBS', 62], ['กิจกรรม / รหัส / พื้นที่', 352], ['ระยะเวลา', 44],
    ['เริ่ม', 48], ['สิ้นสุด', 48], ['กิจกรรมก่อนหน้า', 92]
  ];`,
`  const columns = [
    ['WBS', 62], ['กิจกรรม / รหัส / พื้นที่', 324], ['ระยะเวลา', 44],
    ['เริ่ม', 48], ['สิ้นสุด', 48], ['กิจกรรมก่อนหน้า', 120]
  ];`,
  'detail-column geometry'
);

replaceRequired(
`  textCell(predecessorText(row), x, y, columns[5][1], ROW_H, {
    size: 5.55, color: COLORS.gray700, pad: 3,
    meta: { type: 'predecessor', activity_id: row.activity_id }
  });`,
`  const predecessorW = columns[5][1];
  const predecessorLines = wrapTextTwoLines(predecessorText(row), predecessorW - 7, 5.1, 'Thai', {
    type: 'predecessor', activity_id: row.activity_id
  });
  useFont('Thai', 5.1, COLORS.gray700);
  const predecessorY = predecessorLines.length === 1 ? y + 10.1 : y + 6.1;
  predecessorLines.forEach((text, index) => {
    doc.text(text, x + 3.5, predecessorY + index * 6.8, {
      width: predecessorW - 7, lineBreak: false
    });
  });`,
  'predecessor text cell'
);

fs.writeFileSync(runtimePath, source, 'utf8');
try {
  await import(`${pathToFileURL(runtimePath).href}?build=${Date.now()}`);
} finally {
  fs.rmSync(runtimePath, { force: true });
}
