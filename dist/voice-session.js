(()=>{
 const $=s=>document.querySelector(s),mic=$('#start-voice'),desk=$('#diary-view');
 let generation=0,queue=Promise.resolve(),restartTimer=0,restarts=0,flowTimer=0,wakeUntil=0;const undo=[];
 const dock=document.createElement('aside');dock.className='voice-command-dock';dock.setAttribute('aria-label','Book tools');
 dock.innerHTML=`<div class="session-controls"></div><div class="session-feedback"><strong id="session-state">Ready when you are</strong><span id="session-feedback" role="status">Start the microphone to journal. Full pages continue automatically.</span></div><div id="live-transcript" aria-live="off" hidden></div><form id="conversation-form"><label for="voice-command-input">Tell your story, or ask your diary</label><textarea id="voice-command-input" rows="3" placeholder="Open the book… or tell me about your day."></textarea><div class="compose-actions"><label id="flow-auto-label" hidden><input id="flow-auto" type="checkbox" checked>Auto-send Flow</label><button type="submit" id="send-diary">Send ↗</button></div></form><div class="conversation-actions"><button id="other-tools">Add memories</button><button id="focus-book">Focus book</button></div><div id="voice-media-request" hidden><span id="voice-media-prompt"></span><button id="voice-pick-file">Choose a file</button><button id="voice-dismiss-media">Cancel</button></div>`;
 dock.querySelector('.session-controls').append($('.spread-empty'));desk.append(dock);
 const preview=document.createElement('div');preview.id='live-page-preview';preview.hidden=true;preview.setAttribute('aria-hidden','true');$('#scrap-surface').append(preview);
 const micText=document.createElement('span');micText.id='session-mic-label';micText.textContent='Start microphone';mic.append(micText);
 const tools=document.createElement('dialog');tools.id='manual-tools';tools.innerHTML='<button class="dialog-close" aria-label="Close tools">×</button><div class="eyebrow">LITTLE THINGS TO KEEP</div><h2>Add to your pages.</h2><p>Try “Diary, add paper” or “Diary, add photo”.</p>';
 tools.append($('.scrap-actions'),$('.spread-heading'));document.body.append(tools);tools.querySelector('.dialog-close').onclick=()=>tools.close();$('#other-tools').onclick=()=>tools.showModal();tools.querySelector('.scrap-actions').addEventListener('click',e=>{if(e.target.closest('button'))tools.close()});
 const stickyButton=document.createElement('button');stickyButton.id='add-sticky-chat';stickyButton.textContent='＋ Sticky note';stickyButton.title='Say: Open a brown sticky note saying Good morning';$('.conversation-actions').prepend(stickyButton);stickyButton.onclick=()=>{newPiece('note');feedback('Sticky note added. Tell me what to write in it.');if(!session.active)$('#scrap-surface .scrap-piece.selected .piece-text').focus()};
 const launch=document.createElement('button');launch.id='launch-voice-workspace';launch.textContent='Start your voice diary ↗';$('.hero-cta').after(launch);launch.onclick=()=>{changeView('diary');window.enterBookDesk();};
 const leave=document.createElement('button');leave.id='leave-workspace';leave.textContent='← Home';leave.onclick=()=>{session.stop();closeBook();window.exitBookDesk()};$('.desk-top-actions').append(leave);
 const expand=document.createElement('button');expand.id='restore-conversation';expand.textContent='Show conversation';expand.onclick=()=>{document.body.classList.remove('book-focus');window.fitDiaryBook()};$('.desk-top-actions').prepend(expand);
 $('#focus-book').onclick=()=>{document.body.classList.add('book-focus');window.fitDiaryBook()};
 function log(){/* Feedback is a single status line; no conversation history. */}
 log('Open your book, then tell me about your day. Try “Open the book” or “Diary, make the pages lined”.');
 const input=$('#voice-command-input');input.setAttribute('aria-label','Talk or type to your diary');
 function feedback(text){$('#session-feedback').textContent=text;log(text)}
 function state(text){$('#session-state').textContent=text}
 function focusConsole(){if(session.active&&session.mode==='wispr'&&!document.querySelector('dialog[open]')){window.showDiaryInput?.();input.focus()}}
 function visual(){document.body.classList.toggle('voice-session-active',session.active);micText.textContent=session.active?'Pause microphone':'Start microphone';mic.setAttribute('aria-label',session.active?'Pause voice session':'Start voice session');mic.setAttribute('aria-pressed',String(session.active));$('#flow-auto-label').hidden=session.mode!=='wispr';}
 function modeReady(mode){session.mode=mode;visual();if(mode==='wispr'){state('Dictation input ready');feedback('Speak or type into the input to send your words to the book.');focusConsole()}else state('Starting microphone…')}
 function start(){
  if(session.active){if(session.mode==='wispr-api'&&window.embeddedWispr?.recording){window.embeddedWispr.finish();return}session.stop();return}
  generation++;restarts=0;session.active=true;const preference=read('wd-website-voice-mode',null);session.mode=preference==='browser'||!preference&&window.diaryDeployment?.staticHosting?'browser':'wispr-api';if(desk.hidden)changeView('diary');window.enterBookDesk?.();visual();
  if(session.mode==='browser'){if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){$('#voice-settings').click()}else{modeReady('browser');window.startBrowserDiaryVoice()}}
  else if(session.mode==='wispr-api'){modeReady('wispr-api');window.embeddedWispr?.start()}
  else{state('Choose your microphone');$('#voice-settings').click()}
 }
 function currentText(el){return el.tagName==='TEXTAREA'?el.value:el.textContent}
 async function write(text){
  if(!text)return true;openBook();const target=window.diaryDictationTarget.capture();const el=target.element,before=currentText(el);if(el.tagName==='TEXTAREA'&&window.diaryPagination){const record=await window.diaryPagination.insert(target,text);if(!record)return false;undo.push(record);if(undo.length>20)undo.shift();feedback($('#saved-status').textContent==='Changes not saved'?'Your words are visible but could not be saved. Download a backup.':record.moved?'Continued onto the next page. Keep talking.':'Added to '+window.diaryDictationTarget.capture().label+'.');return true}if(!target.insert(text)){feedback('Choose a page or paper piece, then try that sentence again.');return false}
  undo.push({book:activeBook().id,spread:ensureSpreads(activeBook()).id,piece:el.closest('.scrap-piece')?.dataset.id||null,id:el.id,before,after:currentText(el)});if(undo.length>20)undo.shift();feedback('Added to '+target.label+'.');return true;
 }
 function chosenNote(){return pieces.find(p=>p.id===selected)}
 function selectNote(p){if(!p){feedback('Select a paper piece or caption first.');return false}selectPiece(p.id);return true}
 function place(p,position){
  const el=$('#scrap-surface').querySelector('[data-id="'+p.id+'"]'),r=$('#scrap-surface').getBoundingClientRect();const maxX=Math.max(0,100-el.offsetWidth/r.width*100-2),maxY=Math.max(0,100-el.offsetHeight/r.height*100-2);
  p.x=/right/.test(position)?Math.min(59,maxX):/left/.test(position)?7:Math.min(37,maxX);p.y=/top|upper/.test(position)?12:/bottom|lower/.test(position)?maxY:Math.min(42,maxY);stylePiece(el,p);saveDraft();
 }
 function waitForTurn(){if(!$('#book').querySelector('.page-turn-layer'))return Promise.resolve();return new Promise(resolve=>{let timer;const done=()=>{clearTimeout(timer);observer.disconnect();resolve()};const observer=new MutationObserver(()=>{if(!$('#book').querySelector('.page-turn-layer'))done()});observer.observe($('#book'),{childList:true});timer=setTimeout(()=>{window.cancelDiaryTurn?.();done()},1800)})}
 async function execute(action,typed=false){
  await waitForTurn();if(!session.active&&!typed)return;
  const viewing=new Set(['open-current','close-book','open-book','next','previous','goto','page','play','pause-media','help','book-controls','close-help','stop','focus-book','show-conversation']);
  if(action.kind==='new-book'){if(!window.diaryAuth?.requireSignedIn(()=>bookDialog())){feedback('Sign in with your email to create an account book.');return}}
  else if((!viewing.has(action.kind)||action.text&&['page','next','previous'].includes(action.kind))&&isReadOnlyBook()){requireBookEdit();feedback(activeBook().isSample?'This is a read-only sample. Choose Make your own book to start.':'Sign in to edit your account books.');return}
  if(action.kind==='next'&&isReadOnlyBook()&&activeBook().activeSpread===activeBook().spreads.length-1){feedback('You are at the end of this book.');return}
  session.executing=true;
  try{
   switch(action.kind){
    case 'book-controls':window.showBookControls?.();feedback('Book options are open.');break;
    case 'clear-writing':case 'clear-content':case 'delete-target':case 'invalid-edit':case 'notes-all':case 'note-control':{const result=window.bookControls.apply(action);if(result?.undo){undo.push(result.undo);if(undo.length>20)undo.shift()}if(result?.message)feedback(result.message);break;}
    case 'dictate':await write(action.text);break;
    case 'focus-book':document.body.classList.add('book-focus');window.hideDiaryInput?.();window.fitDiaryBook();feedback('The book fills the workspace. Voice controls stay within reach.');break;
    case 'show-conversation':document.body.classList.remove('book-focus');window.showDiaryInput?.();window.fitDiaryBook();feedback('The command bar is ready below the book.');break;
    case 'replace-text':{openBook();const target=window.diaryDictationTarget.capture(),el=target.element,before=currentText(el);if(el.tagName==='TEXTAREA')el.value=action.text;else el.textContent=action.text;el.dispatchEvent(new Event('input',{bubbles:true}));undo.push({book:activeBook().id,spread:ensureSpreads(activeBook()).id,piece:el.closest('.scrap-piece')?.dataset.id||null,id:el.id,before,after:currentText(el)});feedback('Replaced the '+target.label+' text. Say “Diary, undo” to restore it.');break}
    case 'new-book':{if(!action.text){feedback('Say a title after “Diary, create a book called…”.');break}persistLibrary();const book={id:crypto.randomUUID(),title:action.text.slice(0,70),category:'Personal',color:'#d6c4ea',entries:[],draft:{pieces:[],diary:{left:'',right:''},entryId:null},updated:new Date().toISOString()};books.push(book);store('wd-books',books);showBook(book.id);openBook();window.diaryDictationTarget.selectPage('left');feedback('Created “'+book.title+'”. Tell your story.');window.dispatchEvent(new window.CustomEvent('diary-book-created',{detail:{bookId:book.id}}));break}
    case 'open-book':{const matches=books.filter(b=>b.title.toLocaleLowerCase()===action.text.toLocaleLowerCase());if(matches.length!==1){feedback(matches.length?'More than one book has that title. Rename one in My books.':'No book with that exact title was found.');break}showBook(matches[0].id);openBook();window.diaryDictationTarget.selectPage('left');feedback('Opened “'+matches[0].title+'”.');break}
    case 'open-current':openBook();feedback('Your book is open. Tell me about your day.');break;
    case 'close-book':closeBook();feedback('Book closed. I can still hear your next command.');break;
    case 'paper-style':window.diaryPaper.set({style:action.style});feedback('All pages are now '+action.style+'.');break;
    case 'paper-color':window.diaryPaper.set({color:action.color});feedback('Page color changed to '+action.color+'.');break;
    case 'paper-settings':window.diaryPaper.show();break;
    case 'cover-color':activeBook().color=window.diaryPaper.colors[action.color]||action.color;persistLibrary();bookLabels();feedback('Cover color changed to '+action.color+'.');break;
    case 'cover-style':activeBook().coverStyle=action.style;persistLibrary();bookLabels();feedback('Cover style changed to '+action.style+'.');break;
    case 'cover-font':activeBook().coverFont=action.font;persistLibrary();bookLabels();feedback('Cover title style updated.');break;
    case 'subtitle':case 'author':case 'category':activeBook()[action.kind]=action.text.slice(0,100);persistLibrary();bookLabels();feedback('Book '+action.kind+' updated.');break;
    case 'goto':{const index=Math.floor((action.page-1)/2);if(index<0||index>=activeBook().spreads.length){feedback('That page does not exist yet. Say “Diary, add pages”.');break}goToSpread(index);await waitForTurn();window.diaryDictationTarget.selectPage(action.page%2?'left':'right');feedback('Ready on page '+action.page+'.');break}
    case 'rotate':{const p=chosenNote();if(selectNote(p)){editPiece('tilt',Math.max(-20,Math.min(20,(p.tilt||0)+(action.direction==='left'?-5:5))));feedback('Rotated '+action.direction+'.')}break}
    case 'layer':{if(selectNote(chosenNote())){const i=pieces.findIndex(p=>p.id===selected),p=pieces.splice(i,1)[0];if(action.direction==='forward')pieces.push(p);else pieces.unshift(p);renderPieces();saveDraft();feedback('Layer order changed.')}break}
    case 'remove-piece':{if(selectNote(chosenNote())){$('#remove-piece').click();feedback('Selected piece removed.')}break}
    case 'play':case 'pause-media':{const media=[...$('#scrap-surface').querySelectorAll(action.media||'video,audio')];if(!media.length){feedback('There is no playable memory on these pages.');break}if(action.kind==='pause-media'){media.forEach(m=>m.pause());feedback('Playback paused.')}else{try{await media[0].play();feedback('Playing your '+media[0].tagName.toLowerCase()+'.')}catch{feedback('Your browser needs one click on the play button to allow playback.')}}break}
    case 'text-size':{activeBook().textSize=Math.max(13,Math.min(26,(activeBook().textSize||17)+(action.direction==='bigger'?2:-2)));persistLibrary();window.diaryPaper.sync();feedback('Page text made '+action.direction+'.');break}
    case 'add':{const p=newPiece(action.type);p.w=action.type==='note'?24:31;if(action.color)p.color=({brown:'#d4ae82',yellow:'#f8ed89',pink:'#efc2ee',purple:'#d6c4ea',green:'#d0edb8',blue:'#c6dff5',white:'#fffdf6'})[action.color];place(p,'bottom right');selectPiece(p.id);feedback('Added '+(action.type==='note'?'a sticky note':action.type)+'. Keep speaking to write in it.');if(action.text)await write(action.text);break}
    case 'page':openBook();selectPiece(null);window.diaryDictationTarget.selectPage(action.side);feedback('Writing on the '+action.side+' page.');if(action.text)await write(action.text);break;
    case 'note':{const notes=pieces.filter(p=>p.type==='note'),p=action.number?notes[action.number-1]:notes[notes.length-1];if(selectNote(p)){feedback('Writing in sticky note '+(notes.indexOf(p)+1)+'.');if(action.text)await write(action.text)}break}
    case 'piece':{const options=pieces.filter(p=>p.type===action.type),p=action.number?options[action.number-1]:options[options.length-1];if(!p){feedback('There is no '+action.type+' on these pages yet.');break}selectPiece(p.id);feedback('Writing in the '+action.type+(p.url?' caption.':'.'));if(action.text)await write(action.text);break}
    case 'next':if(activeBook().activeSpread===activeBook().spreads.length-1)addSpread();else goToSpread(activeBook().activeSpread+1);selectPiece(null);await waitForTurn();window.diaryDictationTarget.selectPage('left');feedback('Next pages. Keep speaking to write.');if(action.text)await write(action.text);break;
    case 'previous':if(!activeBook().activeSpread){feedback('You are already on the first pages.');break}goToSpread(activeBook().activeSpread-1);selectPiece(null);await waitForTurn();window.diaryDictationTarget.selectPage('left');feedback('Previous pages.');if(action.text)await write(action.text);break;
    case 'new-pages':addSpread();selectPiece(null);await waitForTurn();window.diaryDictationTarget.selectPage('left');feedback('Fresh pages added.');if(action.text)await write(action.text);break;
    case 'heading':if(action.text){$('#spread-heading').value=action.text;$('#spread-heading').dispatchEvent(new Event('input',{bubbles:true}));renderPageNavigation();feedback('Page heading set to “'+action.text+'”.')}break;
    case 'book-title':if(action.text){activeBook().title=action.text.slice(0,70);persistLibrary();bookLabels();feedback('Book renamed to “'+activeBook().title+'”.')}break;
    case 'move':{const p=chosenNote();if(selectNote(p)){place(p,action.position);feedback('Moved to the '+action.position+'.')}break}
    case 'color':{const p=chosenNote();if(selectNote(p)){editPiece('color',({brown:'#d4ae82',yellow:'#f8ed89',pink:'#efc2ee',purple:'#d6c4ea',green:'#d0edb8',blue:'#c6dff5',white:'#fffdf6'})[action.color]||action.color);feedback('Changed to '+action.color+'.')}break}
    case 'size':{const p=chosenNote();if(selectNote(p)){const step=action.direction==='bigger'?1:-1;p.w=Math.max(18,Math.min(48,p.w+step*5));p.font=Math.max(14,Math.min(42,p.font+step*2));place(p,p.x>45?'bottom right':'bottom left');feedback('Made it '+action.direction+'.')}break}
    case 'media':$('#voice-media-request').hidden=false;$('#voice-media-prompt').textContent='Choose your '+action.media+' file. Then speak to add its caption.';$('#media-file').accept=action.media==='photo'||action.media==='image'?'image/*':action.media==='video'?'video/*':'audio/*';feedback('The file picker needs one click. Your session can continue afterward.');break;
    case 'memory':if(action.text){memories.unshift({text:action.text,date:new Date().toLocaleDateString('en-IN')});store('wd-memories',memories);renderMemories();feedback('Saved in Ideas for Later. Choose a book when you are ready to place it.')}break;
    case 'paragraph':await write('\n\n');break;
    case 'save':if(saveDraft()!==false){$('#save-spread').click();feedback($('#saved-status').textContent==='Changes not saved'?'Storage is full. Download a backup from My books.':'Saved on this browser.');}break;
    case 'undo':{const last=undo[undo.length-1];if(last?.bookEdit){if(window.bookControls.undo(last)){undo.pop();feedback('Restored the previous book state.')}else feedback('This book has changed since that action. Your later edits were kept.');break}if(last?.pagination){if(await window.diaryPagination.undo(last)){undo.pop();feedback('Undid that dictation, including its page continuations.')}else feedback('Those pages have changed since dictation. Your later edits were kept.');break}if(!last||last.book!==activeBook().id||last.spread!==ensureSpreads(activeBook()).id){feedback('There is no dictation to undo on these pages.');break}const el=last.piece?$('#scrap-surface').querySelector('[data-id="'+last.piece+'"] .piece-text'):document.getElementById(last.id);if(!el||currentText(el)!==last.after){feedback('That text has changed since dictation. Your later edits were kept.');break}if(el.tagName==='TEXTAREA')el.value=last.before;else el.textContent=last.before;el.dispatchEvent(new Event('input',{bubbles:true}));undo.pop();feedback('Undid the last dictation.');break}
    case 'help':window.showBookControls?.();feedback('Book options are open.');break;
    case 'close-help':document.querySelectorAll('#voice-guide-dialog[open],#manual-tools[open],#paper-settings[open],#paper-dialog[open],#book-dialog[open],#book-control-dialog[open],#book-options[open],#natural-voice-dialog[open],#voice-options[open]').forEach(el=>el.close());feedback('Ready to keep writing.');break;
    case 'stop':session.executing=false;session.stop();break;
    default:feedback('I could not understand that request. Try another wording or check voice settings in Book. Nothing was changed.');
   }
  }finally{session.executing=false;focusConsole()}
 }
 const session=window.voiceSession={active:false,mode:null,executing:false,
  awaitingCommand(){return wakeUntil>Date.now()},
  ensureMode(mode){clearTimeout(restartTimer);if(!session.active){generation++;session.active=true;restarts=0;if(desk.hidden)changeView('diary');window.enterBookDesk?.()}session.mode=mode;modeReady(mode);},
  accept(text,typed=false){
   if(!session.active&&!typed)return false;restarts=0;session.onInterim('');
   if(/^diary[\s,.:!?]*$/i.test(text.trim())){wakeUntil=Date.now()+10000;feedback('Ready for your command. Say the action now.');return true}
   if(wakeUntil>Date.now()&&!/^diary\b/i.test(text.trim()))text='Diary, '+text;wakeUntil=0;
   const token=generation;queue=queue.then(async()=>{
    if(token!==generation||(!session.active&&!typed))return;
    const plan=window.naturalVoice?await window.naturalVoice.resolve(text):{actions:window.DiaryCommands.split(text).map(window.DiaryCommands.parse)};
    if(token!==generation||(!session.active&&!typed))return;
    if(plan.message)feedback(plan.message);
    for(const action of plan.actions){if(token!==generation||(!session.active&&!typed))break;await execute(action,typed)}
   }).catch(error=>{session.executing=false;console.error('Diary request failed:',error);feedback('That request could not finish. Your saved book is still available.')});return true;
  },
  onFlowReady(){visual();focusConsole();},
  onWaiting(){state('Waiting for microphone permission');$('#session-feedback').textContent='Allow the microphone in your browser to start. If no prompt appears, check Voice options.'},
  onInterim(text){$('#live-transcript').hidden=!text;$('#live-transcript').textContent=text?'Hearing: '+text:'';const command=/^(?:diary|open (?:the )?book|close (?:the )?book|next page|previous page)\b/i.test(text);preview.hidden=!text||command||!$('#book').classList.contains('book-open');preview.textContent=text;preview.dataset.side=$('#voice-target').textContent.toLowerCase().includes('right')?'right':'left';},
  stop(reason){if(!session.active)return;session.active=false;session.executing=false;generation++;wakeUntil=0;window.naturalVoice?.pause();session.onInterim('');clearTimeout(restartTimer);clearTimeout(flowTimer);if(input.value.trim())store('wd-pending-flow',input.value);input.blur();window.cancelBrowserDiaryVoice?.(true);window.embeddedWispr?.cancel();visual();state('Session paused');feedback(reason||'Your words are saved. Start another session whenever you like.');},
  onListening(){if(session.active){state('Listening · tell me about your day');visual();feedback(window.naturalVoice?.isEnabled()?'Tell your story, or ask for a change.':'Listening. Connect natural understanding in Book → Natural voice to use your own wording.')}},
  onError(error){if(error==='no-speech')return;session.stop(({'not-allowed':'Microphone permission was denied. Allow it in your browser settings, or choose built-in Wispr in Voice options.','audio-capture':'No microphone is available. Connect one, or choose built-in Wispr in Voice options.','network':'The browser speech service could not connect. Check your connection, or choose built-in Wispr in Voice options.','service-not-allowed':'This browser cannot use its speech service. Choose built-in Wispr in Voice options or another supported browser.'})[error]||'Could not start browser voice. Check Voice options and try again.');},
  onRecognizerEnd(){if(!session.active||session.mode!=='browser')return;if(restarts++>=3){session.stop('The speech service kept ending. Start again, or choose built-in Wispr in Voice options.');return}state('Reconnecting to speech service…');clearTimeout(restartTimer);restartTimer=setTimeout(()=>{if(session.active&&session.mode==='browser'&&document.visibilityState==='visible')window.startBrowserDiaryVoice();else session.stop('Session paused while the page is in the background.')},300)},
  onPieceCreated(){$('#voice-media-request').hidden=true;$('#media-file').accept='image/*,video/*,audio/*';setTimeout(focusConsole,0)}
 };
 input.value=read('wd-pending-flow','');
 function send(){clearTimeout(flowTimer);const text=input.value.trim();if(!text)return;input.value='';store('wd-pending-flow','');session.accept(text,true);}
 $('#conversation-form').onsubmit=e=>{e.preventDefault();send()};
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}});
 input.addEventListener('input',()=>{store('wd-pending-flow',input.value);clearTimeout(flowTimer);if(session.active&&session.mode==='wispr'&&$('#flow-auto').checked)flowTimer=setTimeout(send,1300)});
 const previousOptions=$('#voice-settings').onclick;$('#voice-settings').onclick=()=>{if(session.active){session.mode='choosing';state('Choose your voice mode')}previousOptions()};
 
 $('#voice-options').addEventListener('close',()=>{if(session.active&&session.mode==='choosing')session.stop('Choose a voice mode when you are ready.')});
 $('#voice-pick-file').onclick=()=>$('#media-file').click();$('#voice-dismiss-media').onclick=()=>{$('#voice-media-request').hidden=true;$('#media-file').accept='image/*,video/*,audio/*';focusConsole()};
 mic.onclick=start;window.startDiarySession=start;window.startDiaryVoice=()=>{if(!session.active)start();else{feedback('Ready to write in '+window.diaryDictationTarget.capture().label+'.');focusConsole()}};window.diaryConversation={send:text=>session.accept(text,true),settled:()=>queue};window.addEventListener('pagehide',()=>session.stop());visual();
})();
