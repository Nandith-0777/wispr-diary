// Real app integration with deterministic line metrics in the DOM fixture.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.resolve(__dirname,'pagination-probes.cjs');
const fixture=fs.readFileSync(path.join(__dirname,'workspace.cjs'),'utf8').split('(async()=>{')[0];
const probes=String.raw`
Object.defineProperty($('#page-measure'),'scrollHeight',{get(){const text=this.textContent.replace(/\u200b/g,'');return text.split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil([...line].length/24)),0)*30}});
for(const side of ['left','right'])Object.defineProperty($('#diary-'+side),'clientHeight',{get(){return 90}});
const combined=()=>run('activeBook().spreads.map(s=>s.diary.left+s.diary.right).join("")');
(async()=>{
 await send('Diary, create a book called Flowing pages.');
 $('#voice-settings').click();$('#use-browser').click();await tick();const mic=Speech.latest;
 const first=Array.from({length:15},(_,i)=>'word'+String(i).padStart(2,'0')).join(' ');
 await speak(first);assert.equal(combined(),first,'Left-to-right overflow preserves every character');assert(run('activeBook().spreads[0].diary.right.length')>0);assert.equal($('#voice-target').textContent,'Right page');assert(window.voiceSession.active&&!mic.aborted,'Page continuation keeps the microphone active');
 const long=Array.from({length:90},(_,i)=>'story'+String(i).padStart(2,'0')).join(' ');
 await speak(long);assert.equal(combined(),first+' '+long,'A long final transcript flows through multiple new spreads');assert(run('activeBook().spreads.length')>2);assert.equal(window.diaryDictationTarget.capture().element.scrollTop,0,'Continuation opens at the top of the page');
 await speak('Diary, undo.');assert.equal(combined(),first,'Undo restores writing across automatic page boundaries');assert.equal(run('activeBook().spreads.length'),1,'Undo removes only empty continuation spreads it created');
 await speak('Diary, undo.');assert.equal(combined(),'');assert.equal($('#voice-target').textContent,'Left page');
 await speak('Diary, right page. Earlier memory.');await speak('Diary, left page.');await speak(long);assert(combined().includes('Earlier memory.'),'Overflow preserves existing content on following pages');assert.equal(combined().split('Earlier memory.').length,2,'Existing writing is not duplicated');
 await speak('Open a sticky note of brown color with the message Good morning');assert.equal(run('pieces.at(-1).type'),'note');assert.equal(run('pieces.at(-1).color'),'#d4ae82');assert.equal($('.scrap-piece.note .piece-text').textContent,'Good morning');
 const count=run('activeBook().spreads.length');await speak('A very long sticky message. '.repeat(30));assert.equal(run('activeBook().spreads.length'),count,'Sticky text stays in its sticky note, not journal pages');
 await speak('Open a sticky note of brown color');await speak('Good morning');assert.equal(run('pieces.at(-1).text'),'Good morning','A second utterance writes into the new sticky note');
 await speak('Diary, make it blue.');assert.equal(run('pieces.at(-1).color'),'#c6dff5');await speak('Diary, move it to top left.');assert.equal(run('pieces.at(-1).x'),7);
 window.voiceSession.stop();$('#add-sticky-chat').click();assert.equal(run('pieces.at(-1).type'),'note','Chat has a manual sticky-note shortcut');
 assert(JSON.parse(storage.get('wd-books')).find(b=>b.title==='Flowing pages').spreads.some(s=>s.pieces.some(p=>p.type==='note'&&p.color==='#d4ae82')),'Brown sticky notes are persisted with their book');
 await send('Diary, create a book called Unicode flow.');await send('🙂'.repeat(150));assert.equal(combined(),'🙂'.repeat(150),'Unicode overflow preserves the complete message');assert(!run('activeBook().spreads.some(s=>Object.values(s.diary).some(text=>{const n=text.charCodeAt(text.length-1);return n>=55296&&n<=56319}))'),'No page ends with half a surrogate pair');
 await send('Diary, undo.');const paragraphs=('First paragraph.\n\nSecond paragraph with more words.\n').repeat(12);await send(paragraphs.trim());assert.equal(combined(),paragraphs.trim(),'Automatic continuation preserves paragraph breaks');
 assert.equal(errors.length,0,JSON.stringify(errors));console.log('Pagination and sticky-note checks passed: left/right/new spreads, exact text preservation, existing writing, undo across pages, continuous microphone, Unicode, brown notes with inline and subsequent messages, note color/position, and chat shortcut.');
})().catch(error=>{console.error(error);process.exitCode=1});
`;
const testModule=new Module(filename,module);testModule.filename=filename;testModule.paths=Module._nodeModulePaths(__dirname);testModule._compile(fixture+probes,filename);
