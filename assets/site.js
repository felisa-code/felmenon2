'use strict';
const $ = id => document.getElementById(id);
const dataJSON = async path => {
  const response = await fetch(path, {cache:'no-cache'});
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
  return response.json();
};
const localPath = path => {
  if (typeof path !== 'string' || /[\\\u0000-\u001f]/.test(path) || path.startsWith('/') || path.split('/').some(x=>x==='.'||x==='..') || /^[a-z]+:/i.test(path)) throw new Error('Invalid local path');
  return path.split('/').map(encodeURIComponent).join('/');
};
let lastFocus;
function closeLightbox() {
  $('lightbox').classList.remove('active'); $('lightbox').setAttribute('aria-hidden','true');
  document.body.style.overflow=''; $('lightboxImg').removeAttribute('src'); lastFocus?.focus();
}
function openLightbox(item, button) {
  lastFocus=button; $('lightboxImg').src=localPath('cases/'+item.file)+'?v='+encodeURIComponent(item.sha256);
  $('lightboxImg').alt=item.alt; $('lightboxCaption').textContent=item.title+'｜'+item.description;
  $('lightbox').classList.add('active'); $('lightbox').setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden'; $('lightboxClose').focus();
}
$('lightboxClose').onclick=closeLightbox;
$('lightbox').onclick=e=>{if(e.target===$('lightbox'))closeLightbox();};
$('lightbox').onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();$('lightboxClose').focus();}};
const caseMedia = matchMedia('(max-width:720px)');
let caseIndex=0, caseCards=[], caseThumbs=[], caseScrollFrame=0, casePointer=null, caseSuppressClickUntil=0;
function updateCaseControls() {
  if(!caseCards.length)return;
  $('casePageInfo').textContent=`${caseIndex+1} / ${caseCards.length}`;
  $('casePrev').disabled=caseIndex===0;
  $('caseNext').disabled=caseIndex===caseCards.length-1;
  caseThumbs.forEach((thumb,index)=>{
    if(index===caseIndex)thumb.setAttribute('aria-current','true');
    else thumb.removeAttribute('aria-current');
  });
  if(caseMedia.matches){
    const list=$('caseThumbnails'),thumb=caseThumbs[caseIndex];
    const left=thumb.getBoundingClientRect().left-list.getBoundingClientRect().left+list.scrollLeft;
    list.scrollTo({left:left-(list.clientWidth-thumb.clientWidth)/2,behavior:reduced?'auto':'smooth'});
  }
}
function scrollToCase(index,animate=true) {
  if(!caseCards.length||!caseMedia.matches)return;
  const n=Math.max(0,Math.min(caseCards.length-1,index)),grid=$('galleryGrid');
  const left=caseCards[n].offsetLeft-caseCards[0].offsetLeft;
  grid.scrollTo({left,behavior:animate&&!reduced?'smooth':'auto'});
  if(!animate){caseIndex=n;updateCaseControls();}
}
function updateCaseMode() {
  const mobile=caseMedia.matches,grid=$('galleryGrid');
  $('caseSwipeHint').hidden=!mobile||!caseCards.length;
  $('caseControls').hidden=!mobile||caseCards.length<2;
  $('caseThumbnails').hidden=!mobile||caseCards.length<2;
  grid.setAttribute('role',mobile?'region':'group');
  if(mobile){grid.setAttribute('aria-roledescription','輪播');grid.tabIndex=0;}
  else{grid.removeAttribute('aria-roledescription');grid.removeAttribute('tabindex');}
  caseCards.forEach((card,index)=>{
    if(mobile){
      card.setAttribute('aria-roledescription','投影片');
      card.setAttribute('aria-label',`${index+1} / ${caseCards.length}：${card.dataset.label}`);
    }else{card.removeAttribute('aria-roledescription');card.setAttribute('aria-label',card.dataset.label);}
  });
  requestAnimationFrame(()=>{
    if(mobile)scrollToCase(caseIndex,false);
    else grid.scrollTo({left:0,behavior:'auto'});
    updateCaseControls();
  });
}
$('casePrev').onclick=()=>scrollToCase(caseIndex-1);
$('caseNext').onclick=()=>scrollToCase(caseIndex+1);
$('galleryGrid').addEventListener('scroll',()=>{
  if(!caseMedia.matches||caseCards.length<2||caseScrollFrame)return;
  caseScrollFrame=requestAnimationFrame(()=>{
    caseScrollFrame=0;
    const step=caseCards[1].offsetLeft-caseCards[0].offsetLeft;
    if(step>0){
      const n=Math.max(0,Math.min(caseCards.length-1,Math.round($('galleryGrid').scrollLeft/step)));
      if(n!==caseIndex){caseIndex=n;updateCaseControls();}
    }
  });
},{passive:true});
$('galleryGrid').addEventListener('keydown',event=>{
  if(!caseMedia.matches)return;
  let target;
  if(event.key==='ArrowRight')target=caseIndex+1;
  if(event.key==='ArrowLeft')target=caseIndex-1;
  if(event.key==='Home')target=0;
  if(event.key==='End')target=caseCards.length-1;
  if(target!==undefined){event.preventDefault();scrollToCase(target);}
});
$('galleryGrid').addEventListener('pointerdown',event=>{
  casePointer={x:event.clientX,y:event.clientY};
},{passive:true});
$('galleryGrid').addEventListener('pointerup',event=>{
  if(casePointer&&Math.hypot(event.clientX-casePointer.x,event.clientY-casePointer.y)>12)
    caseSuppressClickUntil=Date.now()+350;
  casePointer=null;
},{passive:true});
$('galleryGrid').addEventListener('pointercancel',()=>{casePointer=null;},{passive:true});
caseMedia.addEventListener('change',updateCaseMode);
let caseResizeFrame=0;
window.addEventListener('resize',()=>{
  if(!caseMedia.matches||!caseCards.length||caseResizeFrame)return;
  caseResizeFrame=requestAnimationFrame(()=>{caseResizeFrame=0;scrollToCase(caseIndex,false);});
});
async function initCases() {
  try {
    const cases=await dataJSON('data/cases.json');
    const visible=cases.filter(x=>x.status!=='duplicate' && x.visible!==false);
    for (const [index,item] of visible.entries()) {
      const button=document.createElement('button');button.type='button';button.className='gallery-item';
      button.dataset.label=item.title+'：'+item.description+'（點選放大）';
      const imageURL=localPath('cases/'+item.file)+'?v='+encodeURIComponent(item.sha256);
      const img=new Image();img.alt=item.alt;img.loading=index<2?'eager':'lazy';img.decoding='async';img.src=imageURL;
      img.onerror=()=>{button.classList.add('image-error');button.title='照片暫時無法載入，請重新整理';};
      const caption=document.createElement('div');caption.className='caption';
      const title=document.createElement('strong');title.textContent=item.title;
      const text=document.createElement('span');text.textContent=item.summary || item.description;
      caption.append(title,text);button.append(img,caption);
      button.onclick=event=>{
        if(event.detail>0&&Date.now()<caseSuppressClickUntil)return;
        openLightbox(item,button);
      };
      $('galleryGrid').append(button);caseCards.push(button);
      const thumb=document.createElement('button');thumb.type='button';thumb.className='case-thumbnail';
      thumb.setAttribute('aria-label',`查看第 ${index+1} 張：${item.title}`);thumb.setAttribute('aria-controls','galleryGrid');
      const thumbnail=new Image();thumbnail.src=imageURL;thumbnail.alt='';thumbnail.loading='lazy';thumbnail.decoding='async';
      thumb.append(thumbnail);thumb.onclick=()=>scrollToCase(index);
      $('caseThumbnails').append(thumb);caseThumbs.push(thumb);
    }
    $('caseCount').textContent=`共 ${visible.length} 張案例圖`;
    updateCaseMode();
  } catch(error) { $('caseError').hidden=false; console.error('Cases:',error); }
}
const drawer=$('mobileDrawer');
function toggleDrawer(open) {
  drawer.classList.toggle('open',open);drawer.inert=!open;
  $('drawerBackdrop').classList.toggle('open',open);$('menuBtn').setAttribute('aria-expanded',String(open));
  if(open)$('closeDrawer').focus();
}
$('menuBtn').onclick=()=>toggleDrawer(true);
$('closeDrawer').onclick=()=>{toggleDrawer(false);$('menuBtn').focus();};
$('drawerBackdrop').onclick=()=>toggleDrawer(false);
drawer.querySelectorAll('a').forEach(a=>a.onclick=()=>toggleDrawer(false));
drawer.onkeydown=e=>{
  if(e.key!=='Tab')return;
  const nodes=[...drawer.querySelectorAll('button,a')];
  if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}
  else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}
};
let book, manifest, page=0, zoom=1, turning=false, resizeTimer, gesture;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function warmPages() {
  if(!manifest)return;
  // StPageFlip clones one page in portrait mode: update original + clone alike.
  document.querySelectorAll('.catalog-page').forEach(el=>{
    const n=Number(el.dataset.index),img=el.querySelector('img');
    if(Math.abs(n-page)<=3){
      if(!img.hasAttribute('src')) img.src=localPath(manifest.pages[n].file);
    } else if(!turning&&img.hasAttribute('src')) img.removeAttribute('src');
  });
}
function syncBook() {
  page=book.getCurrentPageIndex();
  const spread=book.getOrientation()==='landscape';
  const end=Math.min(manifest.pageCount,page+(spread?2:1));
  $('pageInfo').textContent=`${page+1}${end>page+1?'–'+end:''} / ${manifest.pageCount}`;
  $('pageNumber').value=page+1;
  $('prevPage').disabled=page===0;
  $('nextPage').disabled=end>=manifest.pageCount;
  warmPages();
}
function makeBook(start=page) {
  const host=$('pageBook'),scroll=$('bookScroll');
  // Recreate only on size changes. The library owns and removes its root on destroy.
  if(book){book.destroy();const replacement=document.createElement('div');replacement.id='pageBook';scroll.append(replacement);}
  const element=$('pageBook');
  const available=Math.max(160,scroll.clientWidth-12);
  const portrait=available<700;
  const ratio=manifest.pages[0].height/manifest.pages[0].width;
  const width=Math.floor(Math.min(available/(portrait?1:2),520)*zoom);
  const height=Math.round(width*ratio);
  book=new St.PageFlip(element,{
    width,height,size:'fixed',usePortrait:portrait,autoSize:true,showCover:false,
    drawShadow:true,maxShadowOpacity:.28,flippingTime:reduced?1:650,
    mobileScrollSupport:false,useMouseEvents:false,showPageCorners:false,
    startPage:Math.min(start,manifest.pageCount-1)
  });
  const leaves=manifest.pages.map((entry,index)=>{
    const leaf=document.createElement('div');leaf.className='catalog-page';leaf.dataset.index=index;
    const image=new Image();image.alt=`菲米諾型錄第 ${index+1} 頁`;image.decoding='async';image.draggable=false;
    image.onerror=()=>{$('bookError').hidden=false;};
    leaf.append(image);element.append(leaf);return leaf;
  });
  book.on('init',()=>{syncBook();$('bookLoading').hidden=true;});
  book.on('flip',syncBook);
  book.on('changeState',e=>{turning=e.data!=='read';if(!turning)syncBook();});
  book.loadFromHTML(leaves);
  // Narrow mode must remain one page even while zoomed beyond viewport width.
  if(portrait&&book.getOrientation()!=='portrait') console.warn('Catalog orientation needs review');
  syncBook();
}
function turn(direction) {
  if(!book||turning)return;
  const next=direction>0;
  if((next&&$('nextPage').disabled)||(!next&&$('prevPage').disabled))return;
  warmPages();next?book.flipNext('bottom'):book.flipPrev('bottom');
}
$('prevPage').onclick=()=>turn(-1);$('nextPage').onclick=()=>turn(1);
$('goPage').onclick=()=>{
  if(!book||turning)return;
  const n=Number($('pageNumber').value);
  if(!Number.isInteger(n)||n<1||n>manifest.pageCount){$('pageNumber').reportValidity();return;}
  book.turnToPage(n-1);syncBook();
};
$('pageNumber').onkeydown=e=>{if(e.key==='Enter')$('goPage').click();};
function setZoom(value) {
  if(!book||turning)return;
  zoom=Math.min(2,Math.max(.75,value));makeBook(page);
  $('zoomIn').disabled=zoom>=2;$('zoomOut').disabled=zoom<=.75;
  $('bookScroll').style.touchAction=zoom>1?'pan-x pan-y':'pan-y';
}
$('zoomIn').onclick=()=>setZoom(zoom+.25);$('zoomOut').onclick=()=>setZoom(zoom-.25);$('fitWidth').onclick=()=>setZoom(1);
$('bookStage').onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();turn(e.key==='ArrowRight'?1:-1);}};
$('bookScroll').addEventListener('pointerdown',e=>{gesture={x:e.clientX,y:e.clientY};},{passive:true});
$('bookScroll').addEventListener('pointercancel',()=>{gesture=null;},{passive:true});
$('bookScroll').addEventListener('pointerup',e=>{
  if(!gesture)return;
  const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;
  if(zoom<=1&&Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4)turn(dx<0?1:-1);
},{passive:true});
const exit=document.createElement('button');exit.type='button';exit.className='tool-btn fullscreen-exit';exit.textContent='退出全螢幕';exit.hidden=true;$('bookStage').append(exit);
function fullscreenChanged(){
  const active=!!document.fullscreenElement||$('bookStage').classList.contains('is-fullscreen');
  exit.hidden=!active;document.body.classList.toggle('book-fullscreen',active);
  if(book){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>makeBook(page),100);}
}
exit.onclick=async()=>{
  if(document.fullscreenElement)await document.exitFullscreen();
  $('bookStage').classList.remove('is-fullscreen');fullscreenChanged();$('fullscreenBook').focus();
};
$('fullscreenBook').onclick=async()=>{
  try{if(!$('bookStage').requestFullscreen)throw new Error();await $('bookStage').requestFullscreen();}
  catch{ $('bookStage').classList.add('is-fullscreen');fullscreenChanged(); }
  exit.focus();
};
document.addEventListener('fullscreenchange',fullscreenChanged);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if($('lightbox').classList.contains('active'))closeLightbox();
    if(drawer.classList.contains('open')){toggleDrawer(false);$('menuBtn').focus();}
    if($('bookStage').classList.contains('is-fullscreen'))exit.click();
  }
});
window.addEventListener('resize',()=>{if(book){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>makeBook(page),250);}});
async function initCatalog(){
  try {
    manifest=await dataJSON('data/catalog.json');
    if(!manifest.pages?.length||manifest.pageCount!==manifest.pages.length)throw new Error('Invalid catalog manifest');
    $('catalogCount').textContent=`${manifest.pageCount} 書頁｜PDF ${manifest.pdfPageCount} 頁`;
    $('catalogMeta').textContent=`菲米諾吸音板電子型錄｜PDF 共 ${manifest.pdfPageCount} 頁。`;
    document.querySelectorAll('[data-catalog-pdf]').forEach(a=>a.href=localPath(manifest.pdf));
    $('pageNumber').max=manifest.pageCount;
    if(!window.St?.PageFlip)throw new Error('Viewer unavailable');
    makeBook(0);
    ['goPage','zoomOut','zoomIn','fitWidth'].forEach(id=>$(id).disabled=false);
  }catch(error){$('bookLoading').hidden=true;$('bookError').hidden=false;console.error('Catalog:',error);}
}
initCases();initCatalog();
