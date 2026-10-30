(()=>{
 const SpeechEngine=window.SpeechRecognition||window.webkitSpeechRecognition;
 const dialog=document.querySelector('#voice-options'),mic=document.querySelector('#start-voice'),status=document.querySelector('#voice-status');
 let engine=null,lastPage=document.querySelector('#diary-left'),pendingTarget=null,sessionTarget=null;
 const pref=()=>read('wd-website-voice-mode',null);
 function message(text){status.hidden=false;status.textContent=text;}
 document.querySelectorAll('.diary-writing textarea').forEach(page=>page.addEventListener('focus',()=>{lastPage=page}));
 function options(){if(engine)cancel(true);pendingTarget=window.diaryDictationTarget?.capture()||null;dialog.showModal();}
 document.querySelector('#browser-voice-support').textContent=SpeechEngine?'Available in this browser. An internet connection may be needed.':'Browser dictation is unavailable here. Choose built-in Wispr, or try a browser with speech recognition.';
 document.querySelector('#use-browser').disabled=!SpeechEngine;
 document.querySelector('#voice-language').value=read('wd-voice-language','en-IN');
 function cancel(force=false){if(window.voiceSession?.active&&force!==true)return;if(!engine)return;const old=engine;engine=null;old.abort();mic.classList.remove('listening');mic.setAttribute('aria-pressed','false');mic.setAttribute('aria-label','Talk about your day');message('Dictation stopped. Your completed words are saved in the selected item.');}
 function startBrowser(){
  if(!SpeechEngine){options();return}
  if(engine){cancel(true)}
  window.voiceSession?.ensureMode('browser');
  store('wd-website-voice-mode','browser');store('wd-voice-language',document.querySelector('#voice-language').value);dialog.close();if(!window.voiceSession?.active)openBook();sessionTarget=pendingTarget?.valid()?pendingTarget:window.diaryDictationTarget?.capture();pendingTarget=null;if(!window.voiceSession?.active){if(sessionTarget)sessionTarget.prepare();else lastPage.focus();}
  const recognition=new SpeechEngine();engine=recognition;const target=sessionTarget;const committed=new Set();recognition.lang=read('wd-voice-language','en-IN');recognition.continuous=true;recognition.interimResults=true;
  recognition.onstart=()=>{if(engine!==recognition)return;mic.classList.add('listening');mic.setAttribute('aria-pressed','true');mic.setAttribute('aria-label','Stop browser dictation');message('Listening'+(target?' · '+target.label:'')+'. Tap the mic to stop.');window.voiceSession?.onListening();};
  recognition.onresult=event=>{if(engine!==recognition)return;let preview='';for(let i=event.resultIndex;i<event.results.length;i++){if(engine!==recognition)return;const result=event.results[i];if(result.isFinal&&!committed.has(i)){committed.add(i);const spoken=result[0].transcript.trim();if(!spoken)continue;if(window.voiceSession?.active){window.voiceSession.accept(spoken);continue}if(target){if(!target.insert(spoken)){cancel();return}}else{const start=lastPage.selectionStart??lastPage.value.length,end=lastPage.selectionEnd??start;const before=lastPage.value.slice(0,start),after=lastPage.value.slice(end);const text=(before&&!/\s$/.test(before)?' ':'')+spoken+(after&&!/^\s/.test(after)?' ':'');lastPage.setRangeText(text,start,end,'end');lastPage.dispatchEvent(new Event('input',{bubbles:true}));}}else if(!result.isFinal)preview+=result[0].transcript;}window.voiceSession?.onInterim(preview);message(preview?'Hearing: '+preview:'Words added to your selected item. Keep speaking, or tap the mic to stop.');};
  recognition.onerror=event=>{if(engine!==recognition)return;const errors={'not-allowed':'Microphone access was not allowed. Enable it in your browser, or choose built-in Wispr in Voice options.','service-not-allowed':'This browser’s speech service is unavailable. Choose built-in Wispr in Voice options or try another supported browser.','audio-capture':'No microphone is available. Check your device and try again.','network':'The browser speech service could not connect. Check your connection or choose built-in Wispr in Voice options.','no-speech':'No speech was detected. Tap the mic to try again.'};message(errors[event.error]||'Browser dictation stopped. Try again or choose built-in Wispr in Voice options.');recognition._failed=event.error!=='no-speech'||!window.voiceSession?.active;window.voiceSession?.onError(event.error);};
  recognition.onend=()=>{if(engine!==recognition)return;engine=null;mic.classList.remove('listening');mic.setAttribute('aria-pressed','false');mic.setAttribute('aria-label','Talk about your day');window.voiceSession?.onInterim('');if(window.voiceSession?.active){window.voiceSession.onRecognizerEnd();return}if(!recognition._failed)message('Dictation finished. Your words are saved in the selected item.');};
  try{message('Waiting for microphone access…');window.voiceSession?.onWaiting();recognition.start();}catch{engine=null;message('Could not start browser dictation. Try again or choose built-in Wispr in Voice options.');window.voiceSession?.onError('start-failed');}
 }
 window.stopDiaryDictation=cancel;window.startBrowserDiaryVoice=startBrowser;window.cancelBrowserDiaryVoice=cancel;
 dialog.addEventListener('close',()=>{pendingTarget=null});
 mic.onclick=()=>{if(engine){engine.stop();message('Finishing your dictation…');return}if(pref()==='browser')startBrowser();else options()};
 window.startDiaryVoice=()=>window.startDiarySession?window.startDiarySession():mic.onclick();
 document.querySelector('#voice-settings').onclick=options;document.querySelector('#use-browser').onclick=startBrowser;dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
 ['#close-book','#previous-spread','#next-spread','#add-spread','#back-books'].forEach(selector=>document.querySelector(selector).addEventListener('click',cancel,{capture:true}));document.querySelector('#spread-select').addEventListener('change',cancel,{capture:true});document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',cancel,{capture:true}));window.addEventListener('pagehide',cancel);
})();
