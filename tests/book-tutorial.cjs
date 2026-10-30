const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');const filename=path.join(__dirname,'tutorial-probes.cjs');const fixture=fs.readFileSync(path.join(__dirname,'workspace.cjs'),'utf8').split('(async()=>{')[0];
const probes=String.raw`
(async()=>{
 await tick();storage.set('wd-tour-auto','true');assert(!$('#book-tutorial').open,'The public sample does not trigger a creation tour');
 function create(title){run('bookDialog()');$('#book-title').value=title;$('#book-category').value='Personal';$('#book-form').onsubmit({preventDefault(){}})}
 create('My first guided book');assert($('#book-tutorial').open);assert(!$('#book-dialog').open);assert.equal($('#tutorial-book-name').textContent,'My first guided book');assert.equal($('#tutorial-title').textContent,'Make this book yours.');
 $('#tutorial-next').click();assert.equal($('#tutorial-title').textContent,'Say it. Or type it.');$('#tutorial-back').click();assert($('#tutorial-back').hidden);$('#tutorial-next').click();$('#tutorial-next').click();assert($('#tutorial-description').textContent.includes('grip'));$('#tutorial-next').click();assert($('#tutorial-description').textContent.includes('Saved to account'));$('#tutorial-next').click();assert(!$('#book-tutorial').open);
 const id=run('activeBookId');run('showBook(activeBookId);openBook()');assert(!$('#book-tutorial').open,'Returning to a book does not repeat its creation tour');
 $('#replay-book-tutorial').click();assert($('#book-tutorial').open);$('#tutorial-skip').click();assert(!$('#book-tutorial').open);create('My second guided book');assert($('#book-tutorial').open,'Every new book gets its own short welcome');
 $('#tutorial-auto').checked=false;$('#tutorial-auto').onchange({target:$('#tutorial-auto')});$('#tutorial-skip').click();create('No automatic tour');assert(!$('#book-tutorial').open);assert.equal(storage.get('wd-tour-auto'),'false');
 storage.set('wd-tour-auto','true');$('#voice-settings').click();$('#use-browser').click();await tick();assert(window.voiceSession.active);await speak('Diary, create a book called Spoken new book.');assert($('#book-tutorial').open);assert(!window.voiceSession.active,'Mic pauses while the welcome is open');assert.equal(run('pieces.length'),0);assert.equal($('#diary-left').value,'','The tour does not insert demo content');
 document.dispatchEvent(new window.Event('diary-auth-change'));assert(!$('#book-tutorial').open,'Account changes close the tour');assert.equal(errors.length,0,JSON.stringify(errors));console.log('Book tutorial checks passed: each new book, no sample/return auto-tour, skip/replay/back/next, opt-out persistence, voice creation, mic pause, unchanged blank pages, and account-change cleanup.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`;
const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;mod._compile(fixture+probes,filename);
