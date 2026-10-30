// Runs the real app scripts against an isolated DOM and fake speech service.
// No browser profile, microphone, or user diary data is accessed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const {window}=parseHTML(html),{document}=window,storage=new Map(),errors=[];
const proto=window.HTMLElement.prototype;
proto.scrollIntoView=function(){};
proto.focus=function(){document.activeElement=this;this.dispatchEvent(new window.Event('focus'));this.dispatchEvent(new window.Event('focusin',{bubbles:true}))};proto.blur=function(){};
proto.getBoundingClientRect=function(){return {width:this.id==='scrap-surface'?1000:1050,height:650,left:0,top:0}};
Object.defineProperty(proto,'clientWidth',{get(){return this.id==='scrap-surface'?1000:1050}});Object.defineProperty(proto,'clientHeight',{get(){return 650}});
Object.defineProperty(proto,'offsetWidth',{get(){return 250}});Object.defineProperty(proto,'offsetHeight',{get(){return 180}});
proto.animate=function(){const animation={cancel(){}};setTimeout(()=>animation.onfinish?.(),0);return animation};
proto.showModal=function(){this.open=true;this.setAttribute('open','')};proto.close=function(){if(!this.open)return;this.open=false;this.removeAttribute('open');setTimeout(()=>this.dispatchEvent(new window.Event('close')),0)};
proto.pause=function(){this.paused=true};proto.play=function(){this.paused=false;return Promise.resolve()};
const tp=window.HTMLTextAreaElement.prototype;
tp.setSelectionRange=function(start,end){this.selectionStart=start;this.selectionEnd=end};
tp.setRangeText=function(text,start,end){this.value=this.value.slice(0,start)+text+this.value.slice(end);this.selectionStart=this.selectionEnd=start+text.length};
window.HTMLSelectElement.prototype.add=function(option){this.append(option)};
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this._value??this.querySelector('option')?.value??''},set(v){this._value=String(v)},configurable:true});
const Option=function(text,value){const el=document.createElement('option');el.textContent=text;el.value=value;return el};
class Speech {constructor(){Speech.latest=this}start(){this.onstart?.()}stop(){this.onend?.()}abort(){this.aborted=true;this.onend?.()}}
class ResizeObserver{constructor(fn){this.fn=fn}observe(){}disconnect(){}}
// Minimal Selection/Range adapter: linkedom deliberately does not model caret APIs.
let selectedRange=null;
window.getSelection=()=>({rangeCount:selectedRange?1:0,getRangeAt:()=>selectedRange,removeAllRanges(){selectedRange=null},addRange(range){selectedRange=range}});
class Range{
 selectNodeContents(el){this.startContainer=this.endContainer=this.el=el;this.startOffset=0;this.endOffset=el.textContent.length}
 cloneRange(){return Object.assign(new Range(),this)}
 collapse(start){if(start)this.endOffset=this.startOffset;else this.startOffset=this.endOffset}
 setStart(el,offset){this.startContainer=el;this.startOffset=offset}
 setEnd(el,offset){this.endContainer=el;this.endOffset=offset}
 toString(){return this.el.textContent.slice(this.startOffset,this.endOffset)}
 deleteContents(){this.el.textContent=this.el.textContent.slice(0,this.startOffset)+this.el.textContent.slice(this.endOffset);this.endOffset=this.startOffset}
 insertNode(node){const before=this.el.textContent.slice(0,this.startOffset),after=this.el.textContent.slice(this.startOffset);this.el.replaceChildren(document.createTextNode(before),node,document.createTextNode(after))}
 setStartAfter(node){this.startContainer=this.endContainer=this.el=node.parentNode;this.startOffset=this.endOffset=this.el.textContent.length}
}
document.createRange=()=>new Range();
window.SpeechRecognition=Speech;window.scrollTo=()=>{};window.requestAnimationFrame=fn=>fn();window.matchMedia=()=>({matches:false});window.scrollY=0;
const consoleProxy={...console,error(...args){errors.push(args)}};
const context=vm.createContext({window,document,navigator:{platform:'Win32'},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},crypto:require('node:crypto').webcrypto,structuredClone,console:consoleProxy,Option,Event:window.Event,FileReader:function(){},Blob,URL,setTimeout,clearTimeout,requestAnimationFrame:window.requestAnimationFrame,ResizeObserver,MutationObserver:window.MutationObserver,fetch:async()=>({json:async()=>({})}),getComputedStyle:el=>({paddingLeft:'0',paddingRight:'0',paddingTop:'0',paddingBottom:'0',getPropertyValue:name=>el.style.getPropertyValue(name)})});
for(const script of document.querySelectorAll('script[src]')){const src=script.getAttribute('src').split('?')[0];if(!src.startsWith('http'))vm.runInContext(fs.readFileSync(path.join(root,'dist',src),'utf8'),context,{filename:src})}
storage.set('wd-tour-auto','false');
const productionAuth=window.diaryAuth;
window.diaryAuth={canEdit:()=>true,requireSignedIn:()=>true,user:{id:'fixture-user',email:'fixture@example.test'},ready:true,show(){document.querySelector('#login').showModal()}};
const $=s=>document.querySelector(s),run=code=>vm.runInContext(code,context),tick=()=>new Promise(r=>setTimeout(r,5));
async function send(text){$('#voice-command-input').value=text;$('#conversation-form').onsubmit({preventDefault(){}});await window.diaryConversation.settled();await tick()}
async function speak(text){const result=Object.assign([{transcript:text}],{isFinal:true});Speech.latest.onresult({resultIndex:Speech.latest.resultIndex??0,results:[...Speech.latest.results??[],result]});Speech.latest.results=[...Speech.latest.results??[],result];Speech.latest.resultIndex=Speech.latest.results.length;await window.diaryConversation.settled();await tick()}
(async()=>{
 await tick();
 assert($('#book').classList.contains('book-closed'),'Initial book is closed');assert(!Speech.latest,'No microphone before consent');
 $('.hero-cta').click();run('closeBook()');assert(document.body.classList.contains('inside-book'));assert($('#book').classList.contains('book-closed'));
 $('#start-voice').click();await tick();assert($('#voice-options').open,'Unconfigured embedded voice offers an explicit fallback');
 $('#use-browser').click();await tick();assert(window.voiceSession.active,'Choosing browser mode joins the command session');assert($('#book').classList.contains('book-closed'),'Starting the microphone does not open the cover');
 await speak('Open the book.');assert($('#book').classList.contains('book-open'),'Natural voice command opens book');
 await speak('Diary, create a book called Workspace check.');assert.equal(run('activeBook().title'),'Workspace check');
 await speak('Today I caught up with an old friend.');assert.equal($('#diary-left').value,'Today I caught up with an old friend.');
 await speak('Diary, right page.');
 Speech.latest.onresult({resultIndex:Speech.latest.results.length,results:[...Speech.latest.results,Object.assign([{transcript:'We shared a long lunch'}],{isFinal:false})]});
 assert.equal($('#live-page-preview').hidden,false,'Interim speech is visible on the book');assert.equal($('#diary-right').value,'','Interim speech is not permanently saved');
 await speak('We shared a long lunch.');assert.equal($('#diary-right').value,'We shared a long lunch.');assert.equal($('#live-page-preview').hidden,true);
 await speak('Diary, make the pages lined.');assert.equal($('#book').dataset.paper,'lined');
 await speak('Diary, change page color to pink.');assert.equal($('#book').style.getPropertyValue('--paper-color'),'#fce8ef');
 const mic=Speech.latest;await speak('Close the book.');assert($('#book').classList.contains('book-closed'));assert(window.voiceSession.active);assert(!mic.aborted,'Closing the cover keeps microphone active');
 await speak('Open the book.');await speak('Diary, next page.');assert.equal(run('activeBook().activeSpread'),1,'Next from last spread creates pages');
 await speak('A new page and a new thought.');assert.equal($('#diary-left').value,'A new page and a new thought.');assert.equal($('#book').dataset.paper,'lined');
 await speak('Diary, go to page 2.');assert.equal($('#diary-right').value,'We shared a long lunch.');
 await speak('Diary, make the pages blank.');assert.equal($('#book').dataset.paper,'blank');
 await speak('Diary, change cover color to purple.');assert.equal(run('activeBook().color'),'#eee7fa');
 await speak('Diary, stop listening.');assert(!window.voiceSession.active);assert(mic.aborted);
 await send('Diary, heading: Kept by typing.');assert.equal(run('ensureSpreads(activeBook()).heading'),'Kept by typing.');
 await send('Diary, left page.');await send('Typed thoughts work with the microphone paused.');assert($('#diary-left').value.includes('Typed thoughts work'),'Typed panel works without microphone');
 await send('Diary, undo last dictation.');assert(!$('#diary-left').value.includes('Typed thoughts work'),'Undo restores prior text');
 await send('Diary, add paper: A little idea.');assert.equal($('.scrap-piece.paper .piece-text').textContent,'A little idea.');
 await send('Diary, move it to top right.');assert.equal(run('pieces.at(-1).x'),59);
 await send('Diary, make it pink.');assert.equal(run('pieces.at(-1).color'),'#efc2ee');
 await send('Diary, rotate it left.');assert.equal(run('pieces.at(-1).tilt'),-2);
 await send('Diary, make it smaller.');assert.equal(run('pieces.at(-1).w'),26);
 $('#voice-settings').click();$('#use-browser').click();await tick();await speak('One more thought.');assert($('.scrap-piece.paper .piece-text').textContent.includes('One more thought.'),'Starting the microphone preserves the selected paper destination');
 window.voiceSession.stop();
 await send('Diary, replace selected text with A replacement.');assert.equal($('.scrap-piece.paper .piece-text').textContent,'A replacement.');
 await send('Diary, undo.');assert($('.scrap-piece.paper .piece-text').textContent.includes('One more thought.'));
 await send('Diary, remove selected piece.');assert.equal($('.scrap-piece.paper'),null);
 await send('Diary, focus book.');assert(document.body.classList.contains('book-focus'));await send('Diary, show conversation.');assert(!document.body.classList.contains('book-focus'));
 $('#paper-pattern').value='lined';$('#paper-pattern').onchange({target:$('#paper-pattern')});assert.equal($('#book').dataset.paper,'lined');
 $('#paper-color').value='#e8f1fa';$('#paper-color').oninput({target:$('#paper-color')});assert.equal(run('activeBook().paperColor'),'#e8f1fa');
 assert(JSON.parse(storage.get('wd-books')).some(b=>b.title==='Workspace check'&&b.paperStyle==='lined'&&b.paperColor==='#e8f1fa'),'Paper and writing persist in the library');
 $('#voice-settings').click();window.voiceSession.ensureMode('wispr');$('#voice-options').close();$('#voice-command-input').focus();await tick();assert.equal(window.voiceSession.mode,'wispr');assert.equal(document.activeElement,$('#voice-command-input'),'Flow focuses conversation rather than bypassing command routing');
 window.voiceSession.stop();
 const savedBooks=JSON.parse(storage.get('wd-books'));window.libraryBridge.set({books:savedBooks,memories:[]});await send('Diary, open book Workspace check.');assert.equal($('#book').dataset.paper,'lined');assert.equal($('#paper-color').value,'#e8f1fa');assert($('#diary-left').value.includes('old friend'),'Hydrated library restores both writing and paper settings');
 $('#diary-left').value+=' A directly typed ending.';$('#diary-left').dispatchEvent(new window.Event('input',{bubbles:true}));assert(run('diary.left').includes('directly typed ending'),'Direct page edits still save');
 assert.equal(errors.length,0,JSON.stringify(errors));
 console.log('Workspace checks passed: startup, closed-cover microphone, natural open/close, live preview, writing both pages, page turns, new pages, page/cover settings, persistence, typed fallback, undo, and Flow destination.');
})().catch(error=>{console.error(error);process.exitCode=1});
