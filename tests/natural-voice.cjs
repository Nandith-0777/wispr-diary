// Mock only the provider response; execute plans with the production book code.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');const filename=path.join(__dirname,'natural-probes.cjs');const fixture=fs.readFileSync(path.join(__dirname,'workspace.cjs'),'utf8').split('(async()=>{')[0];
const probes=String.raw`
context.AbortController=AbortController;
let nextPlan=null,requestCount=0,lastRequest=null,delay=null;
context.fetch=async(url,options={})=>{if(url==='/api/ai/status')return{ok:true,json:async()=>({configured:true,model:'test-model'})};requestCount++;lastRequest=JSON.parse(options.body);if(delay)await delay;return{ok:true,json:async()=>nextPlan}};
const act=commands=>({intent:'act',commands,question:'',summary:'A planned edit.'});
(async()=>{
 await send('Diary, create a book called Natural voice tests.');await window.naturalVoice.check();assert(window.naturalVoice.isEnabled());
 nextPlan=act(['Diary, add note: Call Mum.','Diary, make it #ffc49b.']);await send('Put a little peach reminder here to call Mum.');assert.equal(run('pieces.at(-1).text'),'Call Mum.');assert.equal(run('pieces.at(-1).color'),'#ffc49b');assert(!JSON.stringify(lastRequest.context).includes('diary.left'),'Context does not send whole journal pages');
 nextPlan={intent:'clarify',commands:[],question:'Which page, and writing or everything?',summary:''};await send('Clear it all.');assert.equal($('#natural-question').hidden,false);assert.equal(run('pieces.length'),1);
 nextPlan=act(['Diary, delete text from page 1.']);await send('Just the writing on page one.');assert.equal(lastRequest.clarification.original,'Clear it all.');assert.equal($('#diary-left').value,'');assert.equal(run('pieces.length'),1,'A scoped clarification keeps the note object');
 nextPlan={intent:'write',commands:[],question:'',summary:''};const story='I deleted my shopping list today and called a friend.';await send(story);assert($('#diary-left').value.includes(story),'Narrative about deletion remains writing');
 nextPlan=act(['Diary, delete note 1.','Diary, do something unsupported.']);await send('Remove that note and do another thing.');assert.equal(run('pieces.length'),1,'An invalid plan is rejected before any action');assert($('#voice-command-input').value.includes('Remove that note'));
 nextPlan=act(['Diary, delete everything from this book.']);await send('Clear it all.');assert.equal(run('pieces.length'),1,'Whole-book deletion needs explicit scope');assert($('#natural-question-text').textContent.includes('whole book'));
 await send('cancel');assert($('#natural-question').hidden);assert.equal(run('pieces.length'),1);
 let release;delay=new Promise(r=>release=r);nextPlan=act(['Diary, delete this.']);window.diaryConversation.send('Get rid of the selected note.');await tick();run("diary.left+=' Later manual edit.';renderDiary();saveDraft()");release();await window.diaryConversation.settled();assert.equal(run('pieces.length'),1,'Stale plans do not modify a changed book');delay=null;
 const before=requestCount;await send('Diary, make the pages lined.');assert.equal(requestCount,before,'Exact local commands do not require an AI call');assert.equal(run('activeBook().paperStyle'),'lined');
 $('#natural-enabled').checked=false;$('#natural-enabled').onchange({target:$('#natural-enabled')});assert(!window.naturalVoice.isEnabled());await send('Diary, undo.');
 assert.equal(errors.length,0,JSON.stringify(errors));console.log('Natural-language integration checks passed: AI plans, custom colors, scoped clarifications, narrative preservation, invalid-plan atomicity, cancellation, stale-state protection, retained requests, local-command bypass, and mode switching. Provider interpretation is mocked, not a live quality test.');
})().catch(e=>{console.error(e);process.exitCode=1});
`;const testModule=new Module(filename,module);testModule.filename=filename;testModule.paths=Module._nodeModulePaths(__dirname);testModule._compile(fixture+probes,filename);
