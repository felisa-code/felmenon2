"""Build a versioned, atomic catalog. A failed PDF never replaces the last good manifest."""
from pathlib import Path
import hashlib, json, shutil, tempfile, os
import fitz

ROOT = Path(__file__).resolve().parents[1]

def build(root=ROOT):
    source = root / 'catalog.pdf'
    manifest = root / 'data/catalog.json'
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    old = json.loads(manifest.read_text()) if manifest.exists() else {}
    if old.get('version') == digest and all((root / p['file']).is_file() for p in old.get('pages', [])) and old.get('pages') and (root / old['pdf']).is_file():
        return old
    (root / 'catalog-pages').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=root / 'catalog-pages', prefix='.build-') as tmp:
        temp = Path(tmp)
        pages = []
        with fitz.open(source) as doc:
            if doc.needs_pass or not 1 <= len(doc) <= 300:
                raise ValueError('PDF 必須無密碼且為 1–300 頁')
            for n, page in enumerate(doc):
                # Existing catalog PDF contains wide two-page spreads. Split them
                # into individual leaves for true desktop spreads / mobile single pages.
                rect = page.rect
                clips = [rect]
                if rect.width / rect.height > 1.2:
                    mid = (rect.x0 + rect.x1) / 2
                    clips = [fitz.Rect(rect.x0, rect.y0, mid, rect.y1), fitz.Rect(mid, rect.y0, rect.x1, rect.y1)]
                for part, clip in enumerate(clips):
                    number = len(pages) + 1
                    name = f'page-{number:03}.jpg'
                    scale = min(1400 / clip.height, 1100 / clip.width)
                    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip, alpha=False, colorspace=fitz.csRGB)
                    pix.save(temp / name, jpg_quality=85)
                    pages.append({'file': f'catalog-pages/{digest}/{name}', 'width': pix.width, 'height': pix.height, 'pdfPage': n + 1, 'part': part + 1})
            count = len(doc)
        shutil.copy2(source, temp / 'catalog.pdf')
        target = root / 'catalog-pages' / digest
        # The directory is new or a previous incomplete attempt; manifest updates last.
        if target.exists(): shutil.rmtree(target)
        shutil.move(str(temp), target)
        result = {'version': digest, 'pageCount': len(pages), 'pdfPageCount': count, 'pdf': f'catalog-pages/{digest}/catalog.pdf', 'pages': pages}
        manifest.parent.mkdir(exist_ok=True)
        staged = manifest.with_suffix('.tmp')
        staged.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        os.replace(staged, manifest)
        for folder in (root / 'catalog-pages').iterdir():
            if folder.is_dir() and folder.name != digest: shutil.rmtree(folder)
        return result

if __name__ == '__main__':
    try:
        data = build()
        print(f"Catalog: {data['pdfPageCount']} PDF pages → {data['pageCount']} book leaves")
    except Exception as exc:
        print(f'::warning::型錄轉換失敗，保留上次可用版本（{type(exc).__name__}）')
        summary = os.environ.get('GITHUB_STEP_SUMMARY')
        if summary:
            with open(summary, 'a') as f: f.write('\n## 型錄警告\nPDF 轉換失敗；保留上次可用型錄及下載檔。請確認不是 2 Bytes、損壞或加密的 PDF，再重新上傳。\n')
        if not (ROOT / 'data/catalog.json').exists(): raise SystemExit(1)
