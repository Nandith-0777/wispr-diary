// Development-only scripted states for a narrated product walkthrough.
// This file is copied into .qa/promo-site; it is never loaded by the real site.
(async()=>{
 const scene=new URLSearchParams(location.search).get('scene')||'home';
 window.enterBookFullscreen=()=>{};localStorage.setItem('wd-tour-auto','false');
 const style=document.createElement('style');style.textContent='html{scroll-behavior:auto!important}#toast{display:none!important}body::after{content:"FICTIONAL WALKTHROUGH";position:fixed;bottom:8px;left:14px;font:9px sans-serif;letter-spacing:1px;color:#9b85a5;z-index:999999;pointer-events:none}.inside-book #saved-status{font-size:10px}';document.head.append(style);
 const launcher=document.createElement('a');launcher.href='/launcher.html';launcher.textContent='Promo scene index';launcher.style.cssText='position:fixed;right:12px;bottom:6px;font:9px sans-serif;color:#9b85a5;z-index:999999';document.body.append(launcher);
 const pause=()=>new Promise(resolve=>setTimeout(resolve,100));
 function newBook(title='A little Tuesday',category='Everyday',color='#7953a5'){bookDialog();document.querySelector('#book-title').value=title;document.querySelector('#book-category').value=category;document.querySelector('#book-color').value=color;document.querySelector('#book-subtitle').value='The small things, kept.';document.querySelector('#book-author').value='ARI';document.querySelector('#book-style').value='minimal';document.querySelector('#book-form').onsubmit({preventDefault(){}})}
 const write='Dear diary,\n\nToday was a little slower, in the best way. Coffee with Maya. A long walk after lunch. We talked about everything and nothing.\n\nI want to remember that feeling: there was nowhere else I needed to be.';
 const second='The little things I am keeping:\n\nA good conversation.\nA table by the window.\nThe song on the way home.\n\nSome days do not need a big ending. Just a place to stay.';
 if(scene==='home'){window.scrollTo(0,0)}
 else if(scene==='create'){bookDialog();document.querySelector('#book-title').value='A little Tuesday';document.querySelector('#book-category').value='Everyday';document.querySelector('#book-subtitle').value='The small things, kept.';document.querySelector('#book-color').value='#7953a5';document.querySelector('#book-style').value='minimal'}
 else if(scene==='outro'){newBook();closeBook();window.enterBookDesk();window.fitDiaryBook()}
 else{
  if(scene==='tour')localStorage.setItem('wd-tour-auto','true');
  newBook();
  if(scene!=='tour'){
   diary={left:write,right:second};renderDiary();saveDraft();
   if(scene==='note'){
    await window.diaryConversation.send('Diary, add note: remember the little things.');await window.diaryConversation.settled();
    const p=pieces.at(-1);p.x=58;p.y=61;p.w=27;p.color='#d4ae82';p.tilt=-4;renderPieces();selectPiece(null);saveDraft();
   }
   if(scene==='media'){
    diary={left:'Dear diary,\n\nThe soundtrack of a good day.\nThe photograph I kept.\nA little movie-night memory.',right:'A day is more than words.\n\nPress play. Come back to it.'};renderDiary();
    const photo=newPiece('photo','Making things, together.','assets/desk.jpg');Object.assign(photo,{x:9,y:35,w:33,tilt:-3});
    const video=newPiece('video','Movie night · Big Buck Bunny','assets/movie-night.mp4','video/mp4');Object.assign(video,{x:55,y:32,w:36,tilt:2});
    const audio=newPiece('audio','A little voice note','assets/voice-note.wav','audio/wav');Object.assign(audio,{x:52,y:73,w:39,tilt:-1});renderPieces();selectPiece(null);saveDraft();
   }
   if(scene==='journal-empty'){diary={left:'',right:''};renderDiary();saveDraft()}
   if(scene==='paper'){window.diaryPaper.set({style:'lined',color:'cream'});window.diaryPaper.show()}
   if(scene==='contents'){
    window.diaryPaper.set({style:'lined',color:'cream'});ensureSpreads(activeBook()).heading='A little Tuesday';persistLibrary();
    activeBook().spreads.push({id:crypto.randomUUID(),heading:'Small joys',diary:{left:'A good coffee.\nA good friend.',right:'A page for tomorrow.'},pieces:[],entryId:null});persistLibrary();window.showBookContents();
   }
   if(scene==='library'||scene==='ideas'){
    closeBook();newBook('Small joys','Gratitude','#d0f775');newBook('Places I have been','Travel','#e7a5d3');memories=[{text:'Write about the song on the train.',date:'Today'}];store('wd-memories',memories);changeView('books');
    document.querySelector('.sample-invitation').hidden=true;document.querySelector('#archive-drafts').hidden=true;document.querySelector('#restore-drafts').hidden=true;document.querySelector('#export-books').hidden=true;document.querySelector('#cloud-status').textContent='Fictional demo library · account saving shown for illustration';
    renderMemories();document.querySelector('#book-grid .library-card')?.remove();
    if(scene==='ideas')changeView('memories');
   }
  }
 }
 await pause();window.fitDiaryBook?.();document.documentElement.dataset.promoReady=scene;document.title='Promo ready: '+scene;
})();
