#!/usr/bin/env python3
"""Sync Translation Glossary into the course (CSV + .js for LMS compatibility)."""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

GLOSSARY_CSV = 'Translation Glossary.csv'
GLOSSARY_JS = 'Translation Glossary.js'
EMBED_START = '<script type="text/plain" id="rise-glossary" data-rise-glossary>'
EMBED_END = '</script>'


def read_xlsx_rows(path):
    with zipfile.ZipFile(path) as z:
        ss = []
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for si in root.findall('m:si', ns):
            t = si.find('m:t', ns)
            if t is not None and t.text:
                ss.append(t.text)
            else:
                ss.append(''.join((r.find('m:t', ns).text or '') for r in si.findall('m:r', ns)))
        sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = []
        for row in sheet.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            cells = []
            for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                if v is None:
                    cells.append('')
                elif c.get('t') == 's':
                    cells.append(ss[int(v.text)])
                else:
                    cells.append(v.text or '')
            rows.append(cells)
    return rows


def rows_to_csv(rows):
    import io
    import csv
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator='\n')
    for row in rows:
        writer.writerow([(c or '').replace('\u00a0', ' ').strip() if isinstance(c, str) else c for c in row])
    return buf.getvalue()


def read_course_dir(config_path):
    if not config_path.exists():
        return None
    for line in config_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        return Path(line).expanduser()
    return None


def find_source_file():
    downloads = Path.home() / 'Downloads'
    repo = Path(__file__).resolve().parents[1]
    config = repo / 'glossary-course-folder.txt'
    folders = [downloads, repo]
    course_dir = read_course_dir(config)
    if course_dir and course_dir.is_dir():
        folders.append(course_dir)
    for folder in folders:
        for name in [GLOSSARY_CSV, 'Translation Glossary.xlsx']:
            candidate = folder / name
            if candidate.exists():
                return candidate
    return None


def read_csv_text(path):
    return path.read_text(encoding='utf-8-sig')


def get_csv_from_source(source):
    if source.suffix.lower() == '.csv':
        return read_csv_text(source)
    return rows_to_csv(read_xlsx_rows(source))


def build_embed_block(csv_text):
    return EMBED_START + '\n' + csv_text.strip() + '\n' + EMBED_END


def build_window_csv_script(csv_text):
    payload = json.dumps(csv_text.strip())
    return f'<script>window.__riseGlossaryCsv={payload};</script>'


def build_glossary_js(csv_text):
    payload = json.dumps(csv_text.strip())
    return (
        '/* Auto-built from Translation Glossary.csv — do not edit by hand */\n'
        f'window.__riseGlossaryCsv = {payload};\n'
    )


def sync_index_html(index_path, csv_text):
    html = index_path.read_text(encoding='utf-8')
    block = build_embed_block(csv_text)
    window_block = build_window_csv_script(csv_text)
    pattern = re.compile(
        r'<script\s+type="text/plain"\s+id="rise-glossary"[^>]*>.*?</script>',
        re.DOTALL | re.IGNORECASE,
    )
    window_pattern = re.compile(
        r'<script>window\.__riseGlossaryCsv\s*=\s*.*?</script>',
        re.DOTALL | re.IGNORECASE,
    )
    if pattern.search(html):
        html = pattern.sub(block, html, count=1)
    else:
        insert_at = html.lower().find('</head>')
        if insert_at == -1:
            insert_at = html.lower().find('<body')
        if insert_at == -1:
            html = block + '\n' + html
        else:
            html = html[:insert_at] + block + '\n' + html[insert_at:]
    if window_pattern.search(html):
        html = window_pattern.sub(window_block, html, count=1)
    else:
        rt = re.search(r'<script[^>]+risecoursetranslate[^>]*>', html, re.IGNORECASE)
        if rt:
            html = html[:rt.start()] + window_block + '\n' + html[rt.start():]
        else:
            html = window_block + '\n' + html
    index_path.write_text(html, encoding='utf-8')


def main():
    repo = Path(__file__).resolve().parents[1]
    config = repo / 'glossary-course-folder.txt'
    source = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else find_source_file()

    if not source or not source.exists():
        print('ERROR: Put Translation Glossary.csv in your scormcontent folder or Downloads.')
        return 1

    csv_text = get_csv_from_source(source)
    csv_out = source.parent / GLOSSARY_CSV
    if source.resolve() != csv_out.resolve():
        csv_out.write_text(csv_text, encoding='utf-8')
    print('Read:', source)
    print('CSV ready:', csv_out)

    # Always generate the .js file next to the CSV
    js_out = source.parent / GLOSSARY_JS
    js_out.write_text(build_glossary_js(csv_text), encoding='utf-8')
    print('JS ready:', js_out)

    if not config.exists():
        print('Tip: add glossary-course-folder.txt with your scormcontent path to auto-copy into the course.')
        return 0

    course_dir = read_course_dir(config)
    if not course_dir or not course_dir.is_dir():
        print('Note: glossary-course-folder.txt path not found or invalid:', config)
        print('      Open glossary-course-folder.txt and paste your scormcontent path on its own line.')
        return 0

    dest_csv = course_dir / GLOSSARY_CSV
    dest_csv.write_text(csv_text, encoding='utf-8')
    print('Copied CSV to course:', dest_csv)

    dest_js = course_dir / GLOSSARY_JS
    dest_js.write_text(build_glossary_js(csv_text), encoding='utf-8')
    print('Copied JS to course:', dest_js)

    index_path = course_dir / 'index.html'
    if index_path.exists():
        sync_index_html(index_path, csv_text)
        print('Synced glossary into:', index_path)
    else:
        print('Note: index.html not found in', course_dir)

    print('Done. Glossary ready (CSV + JS + embedded in index.html).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
