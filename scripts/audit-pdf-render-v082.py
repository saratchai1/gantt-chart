#!/usr/bin/env python3
import json
import math
import re
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageColor

ROOT = Path('data')
PAGES_DIR = ROOT / 'pdf-v082-pages'
REPORT_JSON = ROOT / 'pdf-render-audit-v082.json'
REPORT_MD = ROOT / 'pdf-render-audit-v082.md'

SEMANTIC_COLORS = {
    'main_zone_blue': '#d9ecfb',
    'subzone_green': '#e6f5e9',
    'work_gray': '#eceff2',
}


def page_number(path: Path) -> int:
    match = re.search(r'(\d+)(?=\.png$)', path.name)
    return int(match.group(1)) if match else 0


def ink_ratio(image: Image.Image, threshold: int = 248) -> float:
    gray = image.convert('L')
    histogram = gray.histogram()
    ink = sum(histogram[:threshold])
    return ink / max(1, image.width * image.height)


def nonwhite_bbox(image: Image.Image, threshold: int = 248):
    gray = image.convert('L')
    mask = gray.point(lambda px: 255 if px < threshold else 0)
    return mask.getbbox()


def crop_ratio(image: Image.Image, box, threshold: int = 248) -> float:
    return ink_ratio(image.crop(box), threshold)


def count_near_color(image: Image.Image, hex_color: str, tolerance: int = 4) -> int:
    target = Image.new('RGB', image.size, ImageColor.getrgb(hex_color))
    diff = ImageChops.difference(image, target)
    masks = [channel.point(lambda value: 255 if value <= tolerance else 0) for channel in diff.split()]
    mask = ImageChops.multiply(ImageChops.multiply(masks[0], masks[1]), masks[2])
    return mask.histogram()[255]


page_paths = sorted(PAGES_DIR.glob('page-*.png'), key=page_number)
if not page_paths:
    raise SystemExit(f'No rendered PDF pages found in {PAGES_DIR}')

errors = []
advisories = []
metrics = []
expected_size = None
semantic_color_pixels = {name: 0 for name in SEMANTIC_COLORS}
semantic_color_pages = {name: [] for name in SEMANTIC_COLORS}

for index, path in enumerate(page_paths, start=1):
    with Image.open(path) as source:
        image = source.convert('RGB')
    if expected_size is None:
        expected_size = image.size
    elif image.size != expected_size:
        errors.append({'page': index, 'issue': 'page-size-mismatch', 'expected': expected_size, 'actual': image.size})

    width, height = image.size
    ratio = ink_ratio(image)
    bbox = nonwhite_bbox(image)
    right_edge = crop_ratio(image, (max(0, width - 3), 0, width, height))
    bottom_edge = crop_ratio(image, (0, max(0, height - 3), width, height))

    page_metric = {
        'page': index,
        'file': str(path),
        'width': width,
        'height': height,
        'ink_ratio': round(ratio, 6),
        'nonwhite_bbox': bbox,
        'right_edge_ink_ratio': round(right_edge, 6),
        'bottom_edge_ink_ratio': round(bottom_edge, 6),
    }

    if ratio < 0.015:
        errors.append({'page': index, 'issue': 'page-nearly-blank', 'ink_ratio': ratio})
    if bbox is None:
        errors.append({'page': index, 'issue': 'page-completely-blank'})

    if index >= 2:
        if right_edge > 0.0005:
            errors.append({'page': index, 'issue': 'content-touches-right-edge', 'ratio': right_edge})
        if bottom_edge > 0.0005:
            errors.append({'page': index, 'issue': 'content-touches-bottom-edge', 'ratio': bottom_edge})

        sx = width / 1191.0
        sy = height / 842.0
        body_top = int(58 * sy)
        body_bottom = int(815 * sy)
        table_right = int(734 * sx)
        left_box = (int(20 * sx), body_top, table_right, body_bottom)
        timeline_box = (table_right, body_top, int(1170 * sx), body_bottom)
        left_ratio = crop_ratio(image, left_box)
        timeline_ratio = crop_ratio(image, timeline_box)
        page_metric['left_table_ink_ratio'] = round(left_ratio, 6)
        page_metric['timeline_ink_ratio'] = round(timeline_ratio, 6)
        if left_ratio < 0.012:
            errors.append({'page': index, 'issue': 'left-table-zone-too-empty', 'ratio': left_ratio})
        if timeline_ratio < 0.004:
            errors.append({'page': index, 'issue': 'timeline-zone-too-empty', 'ratio': timeline_ratio})

        hierarchy_crop = image.crop((int(20 * sx), int(85 * sy), int(1170 * sx), int(815 * sy)))
        for name, color in SEMANTIC_COLORS.items():
            count = count_near_color(hierarchy_crop, color)
            semantic_color_pixels[name] += count
            if count >= 100:
                semantic_color_pages[name].append(index)
            page_metric[f'{name}_pixels'] = count

    metrics.append(page_metric)

for name, count in semantic_color_pixels.items():
    if count < 5000:
        errors.append({'issue': 'semantic-hierarchy-color-not-detected', 'semantic': name, 'pixels': count})
    if not semantic_color_pages[name]:
        errors.append({'issue': 'semantic-hierarchy-color-has-no-pages', 'semantic': name})

thumb_w, thumb_h = 360, 255
cols, rows = 4, 2
cell_w, cell_h = thumb_w + 20, thumb_h + 34
sheet_w, sheet_h = cols * cell_w + 20, rows * cell_h + 20
font = ImageFont.load_default()
contact_sheets = []

for sheet_index in range(math.ceil(len(page_paths) / (cols * rows))):
    canvas = Image.new('RGB', (sheet_w, sheet_h), 'white')
    draw = ImageDraw.Draw(canvas)
    subset = page_paths[sheet_index * cols * rows:(sheet_index + 1) * cols * rows]
    for local_index, path in enumerate(subset):
        page = page_number(path)
        with Image.open(path) as source:
            thumb = source.convert('RGB')
            thumb.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        col = local_index % cols
        row = local_index // cols
        x = 10 + col * cell_w + (thumb_w - thumb.width) // 2
        y = 10 + row * cell_h + 20
        draw.text((10 + col * cell_w, 8 + row * cell_h), f'Page {page}', fill='black', font=font)
        draw.rectangle((x - 1, y - 1, x + thumb.width, y + thumb.height), outline='#64748b', width=1)
        canvas.paste(thumb, (x, y))
    output = ROOT / f'pdf-v082-contact-sheet-{sheet_index + 1:02d}.png'
    canvas.save(output, optimize=True)
    contact_sheets.append(str(output))

ink_values = [item['ink_ratio'] for item in metrics]
report = {
    'status': 'FAIL' if errors else ('PASS_WITH_ADVISORIES' if advisories else 'PASS'),
    'pages': len(page_paths),
    'page_size_pixels': expected_size,
    'ink_ratio_min': min(ink_values),
    'ink_ratio_max': max(ink_values),
    'ink_ratio_mean': sum(ink_values) / len(ink_values),
    'semantic_colors': SEMANTIC_COLORS,
    'semantic_color_pixels': semantic_color_pixels,
    'semantic_color_pages': semantic_color_pages,
    'errors': errors,
    'advisories': advisories,
    'contact_sheets': contact_sheets,
    'page_metrics': metrics,
}
REPORT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

md_lines = [
    '# PDF Raster and Color Audit — Baseline v0.8.2 ภาษาไทย',
    '',
    f'**Status:** {report["status"]}',
    '',
    f'- Pages: {report["pages"]}',
    f'- Page size: {expected_size}',
    f'- Ink ratio min/mean/max: {report["ink_ratio_min"]:.4f} / {report["ink_ratio_mean"]:.4f} / {report["ink_ratio_max"]:.4f}',
    f'- Semantic color pixels: `{json.dumps(semantic_color_pixels, ensure_ascii=False)}`',
    f'- Contact sheets: {len(contact_sheets)}',
    '',
    '## Errors',
    '',
]
md_lines.extend([f'- {json.dumps(item, ensure_ascii=False)}' for item in errors] or ['- None'])
md_lines.extend(['', '## Advisories', ''])
md_lines.extend([f'- {json.dumps(item, ensure_ascii=False)}' for item in advisories] or ['- None'])
md_lines.append('')
REPORT_MD.write_text('\n'.join(md_lines), encoding='utf-8')

print(f'PDF raster and color audit status: {report["status"]}')
print(f'Pages rendered: {len(page_paths)} at {expected_size}')
print(f'Ink ratio min/mean/max: {report["ink_ratio_min"]:.4f}/{report["ink_ratio_mean"]:.4f}/{report["ink_ratio_max"]:.4f}')
print(f'Semantic color pixels: {json.dumps(semantic_color_pixels)}')
print(f'Contact sheets generated: {len(contact_sheets)}')
print(f'Errors: {len(errors)}; Advisories: {len(advisories)}')
if errors:
    print(json.dumps(errors, ensure_ascii=False, indent=2))
    raise SystemExit(1)
