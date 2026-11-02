"""Publish only the public website, never maintenance scripts or credentials."""
from pathlib import Path
import shutil
ROOT = Path(__file__).resolve().parents[1]
out = ROOT / 'dist'
if out.exists(): shutil.rmtree(out)
out.mkdir()
for name in ['index.html','assets','cases','data','catalog-pages','catalog.pdf','vendor']:
    p = ROOT / name
    if p.is_dir(): shutil.copytree(p, out / name)
    else: shutil.copy2(p, out / name)
(out / '.nojekyll').touch()
print('Public website assembled in dist/')
