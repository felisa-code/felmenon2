import unittest, tempfile, json, os, sys, shutil, contextlib, io
from pathlib import Path
from unittest.mock import patch
import fitz
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from catalog import build
from cases import update, similar

class Maintenance(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        (self.root/'data').mkdir();(self.root/'cases').mkdir()
        self.output=contextlib.redirect_stdout(io.StringIO());self.output.__enter__()
        self.env=patch.dict(os.environ,{'OPENAI_API_KEY':'','GITHUB_STEP_SUMMARY':''});self.env.start()
    def tearDown(self):self.env.stop();self.output.__exit__(None,None,None);self.temp.cleanup()
    def pdf(self,count,wide=False):
        doc=fitz.open()
        for i in range(count):
            p=doc.new_page(width=840 if wide else 420,height=594);p.insert_text((20,20),str(i))
        doc.save(self.root/'catalog.pdf');doc.close()
    def photo(self,name='new.jpg',color='red'):
        Image.new('RGB',(80,100),color).save(self.root/'cases'/name)
    def test_catalog_dynamic_and_cache(self):
        self.pdf(2);a=build(self.root);self.assertEqual(a['pageCount'],2)
        self.assertEqual(build(self.root),a)
        (self.root/'catalog.pdf').unlink();self.pdf(4,True)
        b=build(self.root);self.assertEqual(b['pageCount'],8);self.assertEqual(b['pdfPageCount'],4)
        self.assertNotEqual(a['version'],b['version'])
    def test_invalid_pdf_preserves_manifest_and_download(self):
        self.pdf(1);a=build(self.root);before=(self.root/'data/catalog.json').read_bytes()
        (self.root/'catalog.pdf').write_bytes(b'xx')
        with self.assertRaises(Exception):build(self.root)
        self.assertEqual(before,(self.root/'data/catalog.json').read_bytes())
        self.assertTrue((self.root/a['pdf']).exists())
    def test_missing_key_does_not_block_new_photo(self):
        self.photo();items,w=update(self.root)
        self.assertEqual(items[0]['status'],'pending');self.assertTrue(w)
    def test_ready_manual_text_survives_even_without_lock(self):
        self.photo();items,_=update(self.root)
        items[0].update(title='人工標題',description='人工文案',status='ready',locked=False)
        (self.root/'data/cases.json').write_text(json.dumps(items))
        items,w=update(self.root)
        self.assertEqual(items[0]['title'],'人工標題');self.assertFalse(w)
    def test_locked_replacement_requires_review(self):
        self.photo();items,_=update(self.root);items[0].update(locked=True,title='保留標題',status='ready')
        (self.root/'data/cases.json').write_text(json.dumps(items));self.photo(color='blue')
        items,w=update(self.root);self.assertEqual(items[0]['title'],'保留標題');self.assertEqual(items[0]['status'],'review')
    def test_vision_failure_and_retry_and_named_regeneration(self):
        self.photo()
        def fail(*args):raise RuntimeError('service unavailable')
        def success(*args):return {'title':'木色映照','description':'白色牆面與木色家具搭配，窗邊光線映出空間層次。','alt':'白色牆面及木色家具的明亮室內空間'}
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test'}):
            items,w=update(self.root,generator=fail);self.assertEqual(items[0]['status'],'pending')
            items,w=update(self.root,generator=success);self.assertEqual(items[0]['status'],'ready')
            items[0].update(locked=True,manual=True);(self.root/'data/cases.json').write_text(json.dumps(items))
            items,w=update(self.root,regenerate='new.jpg',generator=success);self.assertFalse(items[0]['locked'])
    def test_exact_duplicate_and_delete(self):
        self.photo();shutil.copy2(self.root/'cases/new.jpg',self.root/'cases/copy.jpg')
        items,w=update(self.root);self.assertEqual(sum(i['status']=='duplicate' for i in items),1)
        (self.root/'cases/copy.jpg').unlink();items,w=update(self.root);self.assertEqual(len(items),1)
    def test_similarity_rejects_repetition(self):
        a={'title':'自然光影','description':'白牆搭配木色家具，光線沿著窗邊灑入室內。','alt':'木色家具與白色牆面的室內空間'}
        self.assertTrue(similar(a,[a]));self.assertFalse(similar(a,[]))

if __name__=='__main__':unittest.main()
