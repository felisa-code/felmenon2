from pathlib import Path
import json, hashlib, re
ROOT=Path(__file__).resolve().parents[1]

def validate(root=ROOT):
    html=(root/'index.html').read_text()
    assert '音樂由您決定何時播放。' not in html
    assert '展示頁初版' not in html
    assert '從空間美學走入品牌故事。〈以靜成就非凡〉邀請您在了解產品與案例之後，細細感受菲米諾的品牌理念。' in html
    assert not re.search(r'<audio[^>]*autoplay',html)
    for url in ['https://www.acasa.com.tw/','https://page.line.me/acasa','https://www.facebook.com/Felmenon.tw/','https://www.instagram.com/felmenon.tw/','https://www.youtube.com/@FelmenonTW']:
        assert url in html,url
    for path in re.findall(r'(?:src|href)="([^"#]+)"',html):
        if not path.startswith('https:'): assert (root/path).is_file(), path
    data=json.loads((root/'data/catalog.json').read_text())
    assert data['pageCount']==len(data['pages'])>0
    pdf=root/data['pdf'];assert pdf.stat().st_size>100
    assert hashlib.sha256(pdf.read_bytes()).hexdigest()==data['version']
    for page in data['pages']: assert (root/page['file']).stat().st_size>100
    for case in json.loads((root/'data/cases.json').read_text()):
        assert (root/'cases'/case['file']).stat().st_size>2
        assert not (Path(case['file']).is_absolute() or '..' in Path(case['file']).parts)
    for file in (root/'assets').rglob('*'):
        if file.suffix in ('.js','.css'): assert 'sk-proj-' not in file.read_text()
    print('Website source validation passed.')

if __name__=='__main__':validate()
