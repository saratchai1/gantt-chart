#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import OrderedDict
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableStyleInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
MAPPING_CSV = DATA / "team-gantt-mapping-register-220869-v091.csv"
TBC_CSV = DATA / "team-gantt-timing-confirmation-register-220869-v091.csv"
OUTPUT = DATA / "huai-kha-khaeng-team-gantt-220869-v0.9.1-thai.xlsx"
REPORT = DATA / "team-gantt-xlsx-generation-report-220869-v091.json"

VERSION = "0.9.1"
ISSUE_STATUS = "FOR TEAM APPROVAL"
SOURCE_FILE = "ส่งให้ดร.ก้อง 220869.xlsx"
SOURCE_REGISTER_COMMIT = "1405af254e0ffb590455de45170cbcf25d38790c"
BASELINE_VERSION = "v0.8.2"
BASELINE_COMMIT = "fef660d14ae8ddecda66af3980cee939ac72c84d"
LATEST_GANTT_COMMIT = "1e77c949d3ecdd334606190409d82f506703f071"
PROJECT_DAYS = 1200
MONTH_SPAN = 30
MONTH_COUNT = 40

# Palette follows the reviewed web/PDF semantics.
NAVY = "173A63"
NAVY_DARK = "102F53"
WHITE = "FFFFFF"
TEXT = "17212F"
MUTED = "667085"
LINE = "D8DEE8"
SOFT = "F5F7FA"
WORK_GRAY = "D9DEE5"
WORK_GRAY_DARK = "AEB8C4"
ZONE_BLUE = "8FC6E8"
ZONE_BLUE_DARK = "4E91BD"
ACTIVITY_GREEN = "D9EAD3"
ACTIVITY_GREEN_DARK = "70AD47"
CONTROL_GREEN = "C6E0B4"
TBC_YELLOW = "FFF2CC"
TBC_YELLOW_DARK = "D6B656"
CRITICAL_RED = "C43D3D"
CRITICAL_PALE = "FDE9E7"

thin_gray = Side(style="thin", color=LINE)
medium_red = Side(style="medium", color=CRITICAL_RED)
dashed_green = Side(style="dashed", color="548235")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def as_int(value: str | None):
    text = str(value or "").strip()
    return int(text) if text else None


def activity_id(row: dict[str, str], work_index: dict[str, int]) -> str:
    return f"T220869-W{work_index[row['work_name']]:02d}-{int(row['source_row']):03d}"


def safe_sheet_title(value: str) -> str:
    return value[:31]


def style_cell(cell, *, fill=None, font=None, alignment=None, border=None):
    if fill is not None:
        cell.fill = fill
    if font is not None:
        cell.font = font
    if alignment is not None:
        cell.alignment = alignment
    if border is not None:
        cell.border = border


def build_workbook(mapping_rows: list[dict[str, str]], tbc_rows: list[dict[str, str]]) -> Workbook:
    mapping_rows = sorted(mapping_rows, key=lambda r: int(r["source_row"]))
    work_names = list(OrderedDict.fromkeys(r["work_name"] for r in mapping_rows))
    work_index = {name: idx + 1 for idx, name in enumerate(work_names)}

    wb = Workbook()
    ws = wb.active
    ws.title = "Gantt Chart"

    # Workbook-wide default feel.
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "M6"
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A3
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.print_title_rows = "$1:$5"

    gantt_last_col = 12 + MONTH_COUNT
    gantt_last_col_letter = get_column_letter(gantt_last_col)

    # Title and revision block.
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=gantt_last_col)
    ws["A1"] = "แผนงานก่อสร้างห้วยขาแข้ง — Gantt Chart ตามกิจกรรมทีมงาน 220869"
    ws["A1"].font = Font(name="Aptos", size=18, bold=True, color=WHITE)
    ws["A1"].fill = PatternFill("solid", fgColor=NAVY_DARK)
    ws["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[1].height = 30

    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=gantt_last_col)
    ws["A2"] = (
        f"Revision v{VERSION} · {ISSUE_STATUS} · Source: {SOURCE_FILE} · "
        f"Baseline {BASELINE_VERSION} @ {BASELINE_COMMIT[:10]} · Latest reviewed Gantt @ {LATEST_GANTT_COMMIT[:10]}"
    )
    ws["A2"].font = Font(name="Aptos", size=9, color="D9E5F0")
    ws["A2"].fill = PatternFill("solid", fgColor=NAVY_DARK)
    ws["A2"].alignment = Alignment(horizontal="left", vertical="center")

    ws.merge_cells(start_row=3, start_column=1, end_row=3, end_column=gantt_last_col)
    ws["A3"] = (
        "ความหมายของเวลา: ช่วงเวลาครอบคลุม = วันเริ่มแรกถึงวันสิ้นสุดสุดท้ายของกิจกรรมรายละเอียดที่จับคู่ได้; "
        "ไม่ใช่ Work Effort. รายการ TBC ไม่มีแถบเวลา. ค่าใช้จ่ายพิเศษเป็น Control/Allowance Window ไม่ใช่ Cash Flow หรือ Payment Schedule."
    )
    ws["A3"].font = Font(name="Aptos", size=9, color=TEXT)
    ws["A3"].fill = PatternFill("solid", fgColor="EEF3F8")
    ws["A3"].alignment = Alignment(wrap_text=True, vertical="center")
    ws.row_dimensions[3].height = 30

    ws.merge_cells(start_row=4, start_column=1, end_row=4, end_column=4)
    ws["A4"] = "สีเทา = หัวข้องาน"
    ws["A4"].fill = PatternFill("solid", fgColor=WORK_GRAY)
    ws.merge_cells(start_row=4, start_column=5, end_row=4, end_column=7)
    ws["E4"] = "สีฟ้า = โซนหลัก"
    ws["E4"].fill = PatternFill("solid", fgColor=ZONE_BLUE)
    ws.merge_cells(start_row=4, start_column=8, end_row=4, end_column=10)
    ws["H4"] = "สีเขียว = กิจกรรมตาม Excel"
    ws["H4"].fill = PatternFill("solid", fgColor=ACTIVITY_GREEN)
    ws.merge_cells(start_row=4, start_column=11, end_row=4, end_column=12)
    ws["K4"] = "สีเหลือง = TBC"
    ws["K4"].fill = PatternFill("solid", fgColor=TBC_YELLOW)
    for cell in (ws["A4"], ws["E4"], ws["H4"], ws["K4"]):
        cell.font = Font(name="Aptos", size=9, bold=True, color=TEXT)
        cell.alignment = Alignment(horizontal="center", vertical="center")

    headers = [
        "WBS", "Activity ID", "หัวข้องาน", "โซนหลัก", "กิจกรรมตาม Excel", "สถานะเวลา",
        "Start Day", "Finish Day", "ช่วงเวลาครอบคลุม", "วิธีจับคู่", "Critical Exposure", "Excel Row"
    ]
    for idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=5, column=idx, value=header)
        cell.fill = PatternFill("solid", fgColor=NAVY)
        cell.font = Font(name="Aptos", size=9, bold=True, color=WHITE)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)

    for month in range(1, MONTH_COUNT + 1):
        col = 12 + month
        start = (month - 1) * MONTH_SPAN + 1
        finish = month * MONTH_SPAN
        cell = ws.cell(row=5, column=col, value=f"เดือน {month}\nD{start}–D{finish}")
        cell.fill = PatternFill("solid", fgColor=NAVY)
        cell.font = Font(name="Aptos", size=8, bold=True, color=WHITE)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)

    # Dimensions.
    widths = {
        "A": 14, "B": 22, "C": 30, "D": 12, "E": 46, "F": 25,
        "G": 11, "H": 11, "I": 18, "J": 26, "K": 22, "L": 10,
    }
    for col, width in widths.items():
        ws.column_dimensions[col].width = width
    for col in range(13, gantt_last_col + 1):
        ws.column_dimensions[get_column_letter(col)].width = 4.2
    ws.row_dimensions[5].height = 34

    row_no = 6
    current_work = None
    current_zone_key = None
    activity_rows_written = 0
    tbc_count = 0
    control_count = 0
    critical_count = 0

    for record in mapping_rows:
        work = record["work_name"]
        zone_code = (record.get("zone_code") or "").strip() or "ALL"
        zone_name = (record.get("zone_name") or "").strip() or "ทั้งโครงการ"
        zone_key = (work, zone_code, zone_name)
        widx = work_index[work]

        if work != current_work:
            current_work = work
            current_zone_key = None
            ws.merge_cells(start_row=row_no, start_column=1, end_row=row_no, end_column=12)
            cell = ws.cell(row=row_no, column=1, value=f"W{widx:02d}  {work}")
            cell.fill = PatternFill("solid", fgColor=WORK_GRAY)
            cell.font = Font(name="Aptos", size=10, bold=True, color=TEXT)
            cell.alignment = Alignment(vertical="center")
            for col in range(1, gantt_last_col + 1):
                ws.cell(row=row_no, column=col).border = Border(bottom=Side(style="medium", color=WORK_GRAY_DARK))
                if col >= 13:
                    ws.cell(row=row_no, column=col).fill = PatternFill("solid", fgColor="EEF0F3")
            ws.row_dimensions[row_no].height = 22
            row_no += 1

        if zone_key != current_zone_key:
            current_zone_key = zone_key
            ws.merge_cells(start_row=row_no, start_column=1, end_row=row_no, end_column=12)
            label = f"โซน {zone_code}" if zone_code in {"A", "B", "C", "D"} else zone_name
            cell = ws.cell(row=row_no, column=1, value=f"↳ {label} — {zone_name}")
            cell.fill = PatternFill("solid", fgColor=ZONE_BLUE)
            cell.font = Font(name="Aptos", size=9.5, bold=True, color=NAVY_DARK)
            cell.alignment = Alignment(vertical="center")
            for col in range(1, gantt_last_col + 1):
                ws.cell(row=row_no, column=col).border = Border(bottom=Side(style="thin", color=ZONE_BLUE_DARK))
                if col >= 13:
                    ws.cell(row=row_no, column=col).fill = PatternFill("solid", fgColor="EAF5FC")
            ws.row_dimensions[row_no].height = 21
            row_no += 1

        aid = activity_id(record, work_index)
        start_day = as_int(record.get("start_day"))
        finish_day = as_int(record.get("finish_day"))
        timing_status = record.get("timing_status", "")
        match_level = record.get("match_level", "")
        critical = record.get("critical_exposure", "") == "CONTAINS_ZERO_FLOAT_DETAIL"
        is_tbc = timing_status == "TBC_TEAM_CONFIRMATION"
        is_control = match_level == "CONTROL_STREAM_MATCH"

        if is_tbc:
            tbc_count += 1
        if is_control:
            control_count += 1
        if critical:
            critical_count += 1

        wbs = f"W{widx:02d}.{zone_code}.{int(record['source_row']):03d}"
        values = [
            wbs, aid, work, zone_code, record.get("activity_name") or record.get("source_label") or "",
            timing_status, start_day, finish_day, None, match_level,
            "มีงานย่อย TF=0" if critical else "—", int(record["source_row"]),
        ]
        for col, value in enumerate(values, start=1):
            cell = ws.cell(row=row_no, column=col, value=value)
            cell.font = Font(name="Aptos", size=8.5, color=TEXT)
            cell.alignment = Alignment(vertical="center", wrap_text=col in {3, 5, 6, 10, 11})
            cell.border = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)

        # Formula for derived elapsed span.
        ws.cell(row=row_no, column=9, value=f'=IF(OR(G{row_no}="",H{row_no}=""),"",H{row_no}-G{row_no}+1)')
        ws.cell(row=row_no, column=9).number_format = '0 "วัน"'
        ws.cell(row=row_no, column=7).number_format = '0'
        ws.cell(row=row_no, column=8).number_format = '0'

        # Left-side semantic fill.
        base_fill = TBC_YELLOW if is_tbc else ACTIVITY_GREEN
        for col in range(1, 13):
            ws.cell(row=row_no, column=col).fill = PatternFill("solid", fgColor=base_fill)
        if is_control:
            ws.cell(row=row_no, column=6).fill = PatternFill("solid", fgColor=CONTROL_GREEN)
        if critical:
            ws.cell(row=row_no, column=11).fill = PatternFill("solid", fgColor=CRITICAL_PALE)
            ws.cell(row=row_no, column=11).font = Font(name="Aptos", size=8.5, bold=True, color=CRITICAL_RED)

        # Timeline cells: 40 × 30-day months.
        for month in range(1, MONTH_COUNT + 1):
            col = 12 + month
            month_start = (month - 1) * MONTH_SPAN + 1
            month_finish = month * MONTH_SPAN
            cell = ws.cell(row=row_no, column=col)
            cell.border = Border(left=Side(style="hair", color="E9EDF2"), right=Side(style="hair", color="E9EDF2"))
            if is_tbc or start_day is None or finish_day is None:
                continue
            if month_start <= finish_day and month_finish >= start_day:
                fill_color = CONTROL_GREEN if is_control else ACTIVITY_GREEN_DARK
                cell.fill = PatternFill("solid", fgColor=fill_color)
                if is_control:
                    cell.border = Border(top=dashed_green, bottom=dashed_green)
                if critical:
                    cell.border = Border(top=medium_red, bottom=medium_red)

        if critical:
            for col in range(1, 13):
                existing = ws.cell(row=row_no, column=col).border
                ws.cell(row=row_no, column=col).border = Border(
                    left=existing.left, right=existing.right, top=medium_red, bottom=medium_red
                )

        ws.row_dimensions[row_no].height = 31 if not is_tbc else 36
        row_no += 1
        activity_rows_written += 1

    ws.auto_filter.ref = f"A5:L{row_no - 1}"
    ws.print_area = f"A1:{gantt_last_col_letter}{row_no - 1}"

    # Flat Activity Data sheet.
    data_ws = wb.create_sheet("Activity Data")
    data_ws.sheet_view.showGridLines = False
    data_ws.freeze_panes = "A2"
    data_headers = [
        "source_row", "team_activity_id", "source_kind", "work_name", "zone_code", "zone_name",
        "source_label", "activity_name", "source_resolution_status", "normalization_note", "mapping_status",
        "match_level", "mapping_note", "timing_status", "start_day", "finish_day", "elapsed_span_days",
        "duration_basis", "timing_basis", "baseline_version", "baseline_commit_sha", "source_register_commit_sha",
        "matched_activity_count", "matched_activity_ids", "critical_exposure", "critical_exposure_note", "network_basis"
    ]
    for col, header in enumerate(data_headers, 1):
        cell = data_ws.cell(row=1, column=col, value=header)
        cell.fill = PatternFill("solid", fgColor=NAVY)
        cell.font = Font(name="Aptos", size=9, bold=True, color=WHITE)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    for idx, record in enumerate(mapping_rows, start=2):
        aid = activity_id(record, work_index)
        row_values = [
            int(record["source_row"]), aid, record.get("source_kind", ""), record.get("work_name", ""),
            record.get("zone_code", ""), record.get("zone_name", ""), record.get("source_label", ""),
            record.get("activity_name", ""), record.get("source_resolution_status", ""), record.get("normalization_note", ""),
            record.get("mapping_status", ""), record.get("match_level", ""), record.get("mapping_note", ""),
            record.get("timing_status", ""), as_int(record.get("start_day")), as_int(record.get("finish_day")), None,
            record.get("duration_basis", ""), record.get("timing_basis", ""), record.get("baseline_version", ""),
            record.get("baseline_commit_sha", ""), record.get("source_register_commit_sha", ""),
            as_int(record.get("matched_activity_count")) or 0, record.get("matched_activity_ids", ""),
            record.get("critical_exposure", ""), record.get("critical_exposure_note", ""), record.get("network_basis", ""),
        ]
        for col, value in enumerate(row_values, 1):
            data_ws.cell(row=idx, column=col, value=value)
            data_ws.cell(row=idx, column=col).alignment = Alignment(vertical="top", wrap_text=col in {6,7,8,10,13,24,26,27})
        # Derived field is a formula, not a hard-coded value.
        data_ws.cell(row=idx, column=17, value=f'=IF(OR(O{idx}="",P{idx}=""),"",P{idx}-O{idx}+1)')
        data_ws.cell(row=idx, column=17).number_format = '0 "วัน"'
        if record.get("timing_status") == "TBC_TEAM_CONFIRMATION":
            for col in range(1, len(data_headers) + 1):
                data_ws.cell(row=idx, column=col).fill = PatternFill("solid", fgColor=TBC_YELLOW)
        elif record.get("match_level") == "CONTROL_STREAM_MATCH":
            for col in range(1, len(data_headers) + 1):
                data_ws.cell(row=idx, column=col).fill = PatternFill("solid", fgColor="EEF7E8")
        if record.get("critical_exposure") == "CONTAINS_ZERO_FLOAT_DETAIL":
            data_ws.cell(row=idx, column=25).fill = PatternFill("solid", fgColor=CRITICAL_PALE)
            data_ws.cell(row=idx, column=25).font = Font(name="Aptos", size=9, bold=True, color=CRITICAL_RED)

    table_ref = f"A1:{get_column_letter(len(data_headers))}{len(mapping_rows) + 1}"
    table = Table(displayName="TeamGanttActivityData", ref=table_ref)
    table.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showFirstColumn=False, showLastColumn=False, showRowStripes=True, showColumnStripes=False)
    data_ws.add_table(table)
    data_ws.auto_filter.ref = table_ref
    data_widths = {
        1: 10, 2: 24, 3: 18, 4: 30, 5: 10, 6: 36, 7: 38, 8: 38, 9: 20, 10: 40,
        11: 18, 12: 28, 13: 50, 14: 24, 15: 11, 16: 11, 17: 18, 18: 28, 19: 28, 20: 14,
        21: 46, 22: 46, 23: 14, 24: 60, 25: 28, 26: 55, 27: 34,
    }
    for col, width in data_widths.items():
        data_ws.column_dimensions[get_column_letter(col)].width = width

    # TBC register: editable handoff sheet.
    tbc_ws = wb.create_sheet("TBC Register")
    tbc_ws.sheet_view.showGridLines = False
    tbc_ws.freeze_panes = "A2"
    if tbc_rows:
        tbc_headers = list(tbc_rows[0].keys())
        for col, header in enumerate(tbc_headers, 1):
            cell = tbc_ws.cell(row=1, column=col, value=header)
            cell.fill = PatternFill("solid", fgColor=NAVY)
            cell.font = Font(name="Aptos", size=9, bold=True, color=WHITE)
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        for row_idx, record in enumerate(tbc_rows, start=2):
            for col, header in enumerate(tbc_headers, 1):
                value = record.get(header, "")
                if header in {"source_row", "confirmed_start_day", "confirmed_finish_day"} and str(value).strip():
                    value = int(value)
                cell = tbc_ws.cell(row=row_idx, column=col, value=value)
                cell.alignment = Alignment(vertical="top", wrap_text=True)
                cell.border = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)
                if header in {"confirmed_start_day", "confirmed_finish_day", "confirmed_package_reference", "reviewer", "review_date", "status"}:
                    cell.fill = PatternFill("solid", fgColor=TBC_YELLOW)
        tbc_table_ref = f"A1:{get_column_letter(len(tbc_headers))}{len(tbc_rows) + 1}"
        tbc_table = Table(displayName="TeamGanttTBCRegister", ref=tbc_table_ref)
        tbc_table.tableStyleInfo = TableStyleInfo(name="TableStyleMedium4", showRowStripes=True)
        tbc_ws.add_table(tbc_table)
        status_col = tbc_headers.index("status") + 1
        dv = DataValidation(type="list", formula1='"OPEN,CONFIRMED,NOT_APPLICABLE"', allow_blank=False)
        tbc_ws.add_data_validation(dv)
        dv.add(f"{get_column_letter(status_col)}2:{get_column_letter(status_col)}{len(tbc_rows) + 1}")
        for col in range(1, len(tbc_headers) + 1):
            header = tbc_headers[col - 1]
            width = 16
            if header in {"work_name", "zone_name", "source_label", "activity_name"}:
                width = 34
            elif header in {"mapping_note", "required_confirmation"}:
                width = 56
            elif header in {"confirmed_package_reference", "reviewer"}:
                width = 28
            tbc_ws.column_dimensions[get_column_letter(col)].width = width

    # Revision, controls and legend sheet.
    rev = wb.create_sheet("Revision & Notes")
    rev.sheet_view.showGridLines = False
    rev.column_dimensions["A"].width = 34
    rev.column_dimensions["B"].width = 95
    rev.column_dimensions["C"].width = 22
    rev.merge_cells("A1:C1")
    rev["A1"] = "Revision Control & Usage Notes — Team Gantt 220869"
    rev["A1"].font = Font(name="Aptos", size=16, bold=True, color=WHITE)
    rev["A1"].fill = PatternFill("solid", fgColor=NAVY_DARK)
    rev["A1"].alignment = Alignment(vertical="center")
    rev.row_dimensions[1].height = 28

    metadata = [
        ("Version", VERSION),
        ("Issue Status", ISSUE_STATUS),
        ("Source file", SOURCE_FILE),
        ("Source register commit", SOURCE_REGISTER_COMMIT),
        ("Detailed baseline", BASELINE_VERSION),
        ("Detailed baseline commit", BASELINE_COMMIT),
        ("Latest reviewed Gantt commit", LATEST_GANTT_COMMIT),
        ("Network definition", "Summary scope Gantt only; no independent predecessor network or CPM calculation"),
        ("Timing definition", "Elapsed coverage span between earliest mapped start and latest mapped finish; not Work Effort"),
        ("Special-cost definition", "Control/allowance window only; not Cost Loading, Cash Flow or Payment Schedule"),
    ]
    row = 3
    for label, value in metadata:
        rev.cell(row=row, column=1, value=label).font = Font(name="Aptos", size=9, bold=True, color=NAVY_DARK)
        rev.cell(row=row, column=2, value=value).alignment = Alignment(wrap_text=True, vertical="top")
        rev.cell(row=row, column=1).fill = PatternFill("solid", fgColor="EEF3F8")
        rev.cell(row=row, column=1).border = Border(bottom=thin_gray)
        rev.cell(row=row, column=2).border = Border(bottom=thin_gray)
        row += 1

    row += 1
    rev.cell(row=row, column=1, value="Summary checks").font = Font(name="Aptos", size=11, bold=True, color=NAVY_DARK)
    row += 1
    summary_rows = [
        ("Activities", "=COUNTA('Activity Data'!B2:B108)", 107),
        ("Physical scope", '=COUNTIF(\'Activity Data\'!C2:C108,"PHYSICAL_SCOPE")', 96),
        ("Special cost / control windows", '=COUNTIF(\'Activity Data\'!L2:L108,"CONTROL_STREAM_MATCH")', 11),
        ("TBC timing rows", '=COUNTIF(\'Activity Data\'!N2:N108,"TBC_TEAM_CONFIRMATION")', 6),
        ("Critical exposure rows", '=COUNTIF(\'Activity Data\'!Y2:Y108,"CONTAINS_ZERO_FLOAT_DETAIL")', 10),
    ]
    for label, formula, expected in summary_rows:
        rev.cell(row=row, column=1, value=label)
        rev.cell(row=row, column=2, value=formula)
        rev.cell(row=row, column=3, value=f"Expected {expected}")
        rev.cell(row=row, column=1).font = Font(name="Aptos", size=9, bold=True)
        rev.cell(row=row, column=2).font = Font(name="Aptos", size=10, bold=True, color=NAVY_DARK)
        row += 1

    row += 1
    rev.cell(row=row, column=1, value="Legend").font = Font(name="Aptos", size=11, bold=True, color=NAVY_DARK)
    legend = [
        (WORK_GRAY, "สีเทา", "หัวข้องานจาก Excel"),
        (ZONE_BLUE, "สีฟ้า", "โซนหลัก"),
        (ACTIVITY_GREEN, "สีเขียว", "กิจกรรมตาม Excel"),
        (TBC_YELLOW, "สีเหลือง", "TBC — ไม่มีแถบเวลา"),
        (CONTROL_GREEN, "เขียวอ่อน/เส้นประ", "ช่วงควบคุมค่าใช้จ่าย ไม่ใช่ Cash Flow"),
        (CRITICAL_PALE, "เส้น/สัญลักษณ์แดง", "มีอย่างน้อยหนึ่งกิจกรรมรายละเอียดที่ Total Float = 0"),
    ]
    row += 1
    for color, label, meaning in legend:
        rev.cell(row=row, column=1, value=label).fill = PatternFill("solid", fgColor=color)
        rev.cell(row=row, column=1).font = Font(name="Aptos", size=9, bold=True)
        rev.cell(row=row, column=2, value=meaning)
        row += 1

    # Helpful conditional formatting on flat data status columns.
    data_ws.conditional_formatting.add(
        f"N2:N{len(mapping_rows)+1}",
        FormulaRule(formula=["N2=\"TBC_TEAM_CONFIRMATION\""], fill=PatternFill("solid", fgColor=TBC_YELLOW))
    )

    wb.calculation.fullCalcOnLoad = True
    wb.calculation.forceFullCalc = True
    wb.calculation.calcMode = "auto"

    # Workbook properties.
    wb.properties.title = "แผนงานก่อสร้างห้วยขาแข้ง — Team Gantt 220869 v0.9.1"
    wb.properties.subject = "Latest reviewed Excel Gantt derived from the team Excel source and pinned v0.8.2 timing baseline"
    wb.properties.creator = "OpenAI / project schedule exporter"
    wb.properties.description = "107-row team scope Gantt; 6 TBC timing rows; 11 control/allowance windows; no independent CPM network."

    return wb


def main() -> None:
    if not MAPPING_CSV.exists():
        raise SystemExit(f"Missing mapping register: {MAPPING_CSV}")
    if not TBC_CSV.exists():
        raise SystemExit(f"Missing TBC register: {TBC_CSV}")

    mapping_rows = read_csv(MAPPING_CSV)
    tbc_rows = read_csv(TBC_CSV)
    if len(mapping_rows) != 107:
        raise SystemExit(f"Expected 107 mapping rows, found {len(mapping_rows)}")
    if len(tbc_rows) != 6:
        raise SystemExit(f"Expected 6 TBC rows, found {len(tbc_rows)}")

    wb = build_workbook(mapping_rows, tbc_rows)
    DATA.mkdir(parents=True, exist_ok=True)
    wb.save(OUTPUT)

    work_count = len(set(row["work_name"] for row in mapping_rows))
    zone_group_count = len(set((row["work_name"], row["zone_code"], row["zone_name"]) for row in mapping_rows))
    report = {
        "status": "GENERATED",
        "version": VERSION,
        "issue_status": ISSUE_STATUS,
        "output": str(OUTPUT.relative_to(ROOT)),
        "activities": len(mapping_rows),
        "work_groups": work_count,
        "zone_groups": zone_group_count,
        "tbc_rows": sum(1 for row in mapping_rows if row.get("timing_status") == "TBC_TEAM_CONFIRMATION"),
        "control_window_rows": sum(1 for row in mapping_rows if row.get("match_level") == "CONTROL_STREAM_MATCH"),
        "critical_exposure_rows": sum(1 for row in mapping_rows if row.get("critical_exposure") == "CONTAINS_ZERO_FLOAT_DETAIL"),
        "source_file": SOURCE_FILE,
        "source_register_commit": SOURCE_REGISTER_COMMIT,
        "baseline_version": BASELINE_VERSION,
        "baseline_commit": BASELINE_COMMIT,
        "latest_reviewed_gantt_commit": LATEST_GANTT_COMMIT,
        "sheets": wb.sheetnames,
        "timeline_months": MONTH_COUNT,
        "timeline_days": PROJECT_DAYS,
        "size_bytes": OUTPUT.stat().st_size,
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
