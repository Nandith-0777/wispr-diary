(()=>{
 const desk=document.querySelector('#diary-view'),book=document.querySelector('#book'),toolbar=document.querySelector('.scrap-toolbar'),surface=document.querySelector('#scrap-surface');
 const rail=document.createElement('aside');rail.className='desk-rail';rail.setAttribute('aria-label','Add to your book');
 const railLabel=document.createElement('span');railLabel.className='desk-rail-label';railLabel.textContent='YOUR TOOLS';rail.append(railLabel,document.querySelector('.spread-empty'),document.querySelector('.scrap-actions'));desk.append(rail);
 const actions=document.createElement('div');actions.className='desk-top-actions';actions.append(document.querySelector('#customize-current'),document.querySelector('#save-spread'),document.querySelector('#close-book'));toolbar.append(actions);
 document.querySelector('#close-book').textContent='Close book ↗';document.querySelector('#save-spread').textContent='Save day';document.querySelector('#customize-current').textContent='Cover';
 const icons={
  'add-photo':['<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/>','Media'],
  'add-paper':['<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h6"/>','Paper'],
  'open-memories':['<path d="m3 8 9-5 9 5v12H3zM3 8l9 5 9-5M12 13v7"/>','Memories']
 };
 Object.entries(icons).forEach(([id,[paths,label]])=>{const button=document.getElementById(id);button.setAttribute('aria-label',id==='add-photo'?'Add photo, video or audio':id==='add-paper'?'Add paper bits':'Open memory box');button.title=button.getAttribute('aria-label');button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">'+paths+'</svg><span>'+label+'</span>';});
 let returnScroll=0,isInside=false,turning=null;
 window.enterBookDesk=()=>{if(isInside)return;returnScroll=window.scrollY;isInside=true;document.body.classList.add('inside-book');requestAnimationFrame(fitBook);};
 window.exitBookDesk=()=>{if(!isInside)return;isInside=false;document.body.classList.remove('inside-book','book-focus');book.style.removeProperty('width');book.style.removeProperty('height');window.scrollTo({top:returnScroll,behavior:'instant'});};
 function unlock(){surface.inert=book.classList.contains('book-closed');document.querySelector('#spread-select').disabled=false;document.querySelector('#add-spread').disabled=false;renderPageNavigation();}
 window.cancelDiaryTurn=()=>{if(!turning)return;const current=turning;turning=null;current.animation?.cancel();current.reveal?.cancel();current.layer.remove();unlock();};
 function snapshot(){const copy=surface.cloneNode(true);copy.removeAttribute('id');copy.className='page-replica';copy.inert=true;copy.setAttribute('aria-hidden','true');copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));const originals=surface.querySelectorAll('textarea');copy.querySelectorAll('textarea').forEach((el,i)=>{el.value=originals[i].value;el.textContent=originals[i].value;el.removeAttribute('aria-label')});const videos=surface.querySelectorAll('video');copy.querySelectorAll('video').forEach((el,i)=>{const source=videos[i];try{if(!source.videoWidth)return;const canvas=document.createElement('canvas');canvas.width=source.videoWidth;canvas.height=source.videoHeight;canvas.getContext('2d').drawImage(source,0,0);const image=document.createElement('img');image.src=canvas.toDataURL('image/jpeg',.8);image.alt='';image.style.cssText='width:100%;max-height:210px;object-fit:contain;background:#151515';el.replaceWith(image)}catch{/* Cross-origin video keeps its own poster during a turn. */}});copy.querySelectorAll('video,audio').forEach(el=>{el.removeAttribute('autoplay');el.removeAttribute('controls');el.muted=true});return copy;}
 window.turnDiaryPage=(target,commit)=>{
  if(turning){document.querySelector('#spread-select').value=String(activeBook().activeSpread);return}
  const oldIndex=activeBook().activeSpread;
  if(target===oldIndex){document.querySelector('#spread-select').value=String(oldIndex);return}
  if(!book.classList.contains('book-open')){commit();return}
  const forward=target>oldIndex,old=snapshot();commit();
  const layer=document.createElement('div');layer.className='page-turn-layer paper-sweep '+(forward?'turn-forward':'turn-backward');layer.setAttribute('aria-hidden','true');layer.inert=true;layer.append(old);book.append(layer);
  surface.inert=true;['#previous-spread','#next-spread','#spread-select','#add-spread'].forEach(s=>document.querySelector(s).disabled=true);
  const gentle=window.matchMedia('(prefers-reduced-motion: reduce)').matches,duration=gentle?150:420,direction=forward?-1:1;
  const reveal=surface.animate(gentle?[{opacity:.65},{opacity:1}]:[{opacity:.7,transform:'translateX('+(-direction*6)+'px)'},{opacity:1,transform:'translateX(0)'}],{duration,easing:'cubic-bezier(.2,.65,.3,1)'});
  const animation=layer.animate(gentle?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'translateX(0)',offset:0},{opacity:.35,offset:.6},{opacity:0,transform:'translateX('+(direction*18)+'px)',offset:1}],{duration,easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'});
  turning={layer,animation,reveal};animation.onfinish=()=>{if(turning?.layer!==layer)return;layer.remove();turning=null;unlock();};
 };
 const area=document.querySelector('.book-area');
 function fitBook(){if(!isInside)return;const style=getComputedStyle(area);const width=area.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);const height=area.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);const closed=book.classList.contains('book-closed'),ratio=closed ? 0.75 : 1.75;const fittedWidth=Math.max(0,Math.min(width,height*ratio,closed?430:2400));book.style.width=fittedWidth+'px';book.style.height=fittedWidth/ratio+'px';}
 window.fitDiaryBook=fitBook;new ResizeObserver(fitBook).observe(area);
 // Shortcuts apply only outside editors, menus, dialogs, and media players.
 document.addEventListener('keydown',event=>{if(!isInside||event.altKey||event.ctrlKey||event.metaKey||document.querySelector('dialog[open]'))return;if(event.target.closest('textarea,input,select,[contenteditable="true"],video,audio'))return;if(event.key==='ArrowRight'&&!document.querySelector('#next-spread').disabled){event.preventDefault();activeBook().activeSpread===activeBook().spreads.length-1?addSpread():goToSpread(activeBook().activeSpread+1)}if(event.key==='ArrowLeft'&&!document.querySelector('#previous-spread').disabled){event.preventDefault();goToSpread(activeBook().activeSpread-1)}});
})();
