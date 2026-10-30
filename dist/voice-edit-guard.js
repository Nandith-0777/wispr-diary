// Flow can deliver dictation into any editor the visitor clicked. Recognized
// commands use the action controller instead of being saved as journal prose.
(()=>{
 const previous=new WeakMap(),surface=document.querySelector('#scrap-surface');
 surface.addEventListener('beforeinput',event=>{const editor=event.target.closest('textarea,.piece-text');if(editor)previous.set(editor,editor.tagName==='TEXTAREA'?editor.value:editor.innerText??editor.textContent)},true);
 function insertion(before,after){let start=0,end=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;while(end<before.length-start&&end<after.length-start&&before[before.length-1-end]===after[after.length-1-end])end++;return{text:after.slice(start,after.length-end),start}}
 surface.addEventListener('input',event=>{
  const editor=event.target.closest('textarea,.piece-text');if(!editor)return;const baseline=previous.get(editor);previous.delete(editor);
  if(!window.voiceSession?.active||window.voiceSession.mode!=='wispr'||window.voiceSession.executing||event.isComposing)return;
  const piece=editor.closest('.scrap-piece'),model=piece?pieces.find(p=>p.id===piece.dataset.id):null,isPage=editor.tagName==='TEXTAREA';
  if(!isPage&&!model)return;const before=baseline??(isPage?(editor.id==='diary-right'?diary.right:diary.left)||'':model.text||'');const after=isPage?editor.value:editor.innerText??editor.textContent,delta=insertion(before,after),candidate=(event.data?.trim()||delta.text.trim());
  const action=window.DiaryCommands.parse(candidate),explicit=/^diary\b/i.test(candidate),editing=/^(?:please\s+)?(?:delete|clear|remove|erase)\b/i.test(candidate);
  if(action.kind==='dictate'&&!explicit&&!editing&&!window.voiceSession.awaitingCommand?.()&&(!window.naturalVoice?.isEnabled()||candidate.length<2))return;
  event.stopImmediatePropagation();if(isPage){editor.value=before;editor.setSelectionRange(delta.start,delta.start);diary[editor.id==='diary-right'?'right':'left']=before}else{editor.textContent=before;model.text=before}saveDraft();
  window.voiceSession.accept(candidate,true);
 },true);
})();
