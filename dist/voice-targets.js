// One dictation destination shared by Flow and browser speech recognition.
(()=>{
 let pieceId=null,lastPage=document.querySelector('#diary-left');
 const surface=document.querySelector('#scrap-surface'),settings=document.querySelector('#voice-settings');
 const label=document.createElement('span');label.id='voice-target';label.textContent='Left page';label.setAttribute('aria-live','polite');
 const block=document.createElement('span');block.className='voice-target-block';settings.parentNode.insertBefore(block,settings);block.append(label,settings);
 const names={note:'sticky note',paper:'paper note',cardboard:'cardboard note',ticket:'ticket',tape:'tape',photo:'photo caption',video:'video caption',audio:'audio caption'};
 function pieceElement(){return pieceId?surface.querySelector('[data-id="'+pieceId+'"] .piece-text'):null}
 function name(){const el=pieceElement();return el?(names[el.closest('.scrap-piece').classList[1]]||'selected text'):(lastPage.id==='diary-right'?'right page':'left page')}
 function update(){const title=name();label.textContent=title.charAt(0).toUpperCase()+title.slice(1);const mic=document.querySelector('#start-voice');if(window.voiceSession)mic.setAttribute('aria-label',window.voiceSession.active?'Pause voice session':'Start voice session');else if(mic.getAttribute('aria-pressed')!=='true')mic.setAttribute('aria-label','Dictate into '+title);}
 function changingTarget(){window.stopDiaryDictation?.();document.querySelector('#voice-status').hidden=true}
 window.selectDiaryVoicePiece=id=>{if(pieceId!==id){changingTarget();pieceId=id;}update();};
 document.querySelectorAll('.diary-writing textarea').forEach(page=>page.addEventListener('focus',()=>{if(lastPage!==page||pieceId)changingTarget();pieceId=null;lastPage=page;update()}));
 function inside(el,range){return range&&el.contains(range.startContainer)&&el.contains(range.endContainer)}
 function capture(){
  const el=pieceElement()||lastPage,isPage=el.tagName==='TEXTAREA',title=name();
  let range=null;const selection=window.getSelection();if(!isPage&&selection?.rangeCount&&inside(el,selection.getRangeAt(0)))range=selection.getRangeAt(0).cloneRange();
  const valid=()=>el.isConnected&&(isPage?!pieceId&&lastPage===el:pieceElement()===el);
  function prepare(){if(!valid())return;if(!isPage)el.contentEditable='true';el.focus();if(!isPage){const sel=window.getSelection();if(!inside(el,range)){range=document.createRange();range.selectNodeContents(el);range.collapse(false)}sel.removeAllRanges();sel.addRange(range)}}
  function insert(spoken){
   if(!valid())return false;
   if(isPage){const start=el.selectionStart??el.value.length,end=el.selectionEnd??start;const before=el.value.slice(0,start),after=el.value.slice(end);el.setRangeText((before&&!/\s$/.test(before)?' ':'')+spoken+(after&&!/^\s/.test(after)?' ':''),start,end,'end');}
   else{
    const sel=window.getSelection();if(sel?.rangeCount&&inside(el,sel.getRangeAt(0)))range=sel.getRangeAt(0).cloneRange();
    if(!inside(el,range)){range=document.createRange();range.selectNodeContents(el);range.collapse(false)}
    const prefix=range.cloneRange();prefix.selectNodeContents(el);prefix.setEnd(range.startContainer,range.startOffset);const suffix=range.cloneRange();suffix.selectNodeContents(el);suffix.setStart(range.endContainer,range.endOffset);
    const before=prefix.toString(),after=suffix.toString();const text=document.createTextNode((before&&!/\s$/.test(before)?' ':'')+spoken+(after&&!/^\s/.test(after)?' ':''));
    range.deleteContents();range.insertNode(text);range.setStartAfter(text);range.collapse(true);sel.removeAllRanges();sel.addRange(range);
   }
   el.dispatchEvent(new Event('input',{bubbles:true}));return true;
  }
  return{element:el,label:title,prepare,insert,valid};
 }
 window.diaryDictationTarget={capture,selectPage(side){changingTarget();pieceId=null;lastPage=document.querySelector(side==='right'?'#diary-right':'#diary-left');lastPage.setSelectionRange(lastPage.value.length,lastPage.value.length);update()}};
 const speak=document.createElement('button');speak.id='speak-piece';speak.textContent='◉ Speak here';speak.onclick=()=>window.startDiaryVoice?.();
 const write=document.createElement('button');write.id='write-piece';write.textContent='Write';write.onclick=()=>capture().prepare();
 document.querySelector('#piece-tools').prepend(speak,write);update();
})();
