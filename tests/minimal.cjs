const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');const filename=path.join(__dirname,'minimal-probes.cjs');const fixture=fs.readFileSync(path.join(__dirname,'workspace.cjs'),'utf8').split('(async()=>{')[0];
const probes=String.raw`
(async()=>{
 for(const selector of ['#voice-guide','#voice-guide-dialog','#book-control-guide','#book-control-dialog','#homepage-voice-manual','#manual-search','.manual-nav','.natural-examples'])assert.equal($(selector),null,selector+' removed');
 const sources=[...document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));assert(!sources.some(s=>s.startsWith('voice-manual.js')||s.startsWith('book-controls-ui.js')),'Unused guide code is not loaded');
 assert.equal($('#add-sticky-chat').parentNode,$('#manual-tools .scrap-actions'));assert.equal($('#natural-voice-settings').parentNode,$('.book-options-list'));assert.equal($('#voice-settings').parentNode,$('.book-options-list'));assert.equal($('#open-paper-settings').parentNode,$('.book-options-list'));assert.equal($('#customize-current').parentNode,$('.book-options-list'));
 assert($('#make-own-book'),'Sample offers a personal book action');
 $('.hero-cta').click();await send('Diary, create a book called Minimal book.');$('#other-tools').click();assert($('#manual-tools').open);$('#add-sticky-chat').click();assert(!$('#manual-tools').open);assert.equal(run('pieces.at(-1).type'),'note');
 $('#piece-color').value='#b96e34';$('#piece-color').oninput({target:$('#piece-color')});assert.equal(run('pieces.at(-1).color'),'#b96e34','Custom sticky-note colors still work');
 $('#open-book-options').click();assert($('#book-options').open);$('#open-paper-settings').click();assert(!$('#book-options').open);assert($('#paper-settings').open);await send('Diary, close help.');
 await send('Diary, help.');assert($('#book-options').open);await send('Diary, close help.');assert(!$('#book-options').open);
 $('#natural-voice-settings').click();assert($('#natural-voice-dialog').open);assert($('.connection-details').contains($('.natural-setup')),'Connection details are available without cluttering the book');$('#natural-voice-dialog .dialog-close').click();
 for(const item of window.diaryCommandCatalog)assert.equal(window.DiaryCommands.parse(item.phrase).kind,item.kind,'Existing action engine remains functional');
 assert.equal(errors.length,0,JSON.stringify(errors));console.log('Minimal interface checks passed: manuals/assets removed, compact Add/Book menus, custom sticky colors, paper settings, voice help, connection setup, and existing action grammar.');
})().catch(e=>{console.error(e);process.exitCode=1});
`;const testModule=new Module(filename,module);testModule.filename=filename;testModule.paths=Module._nodeModulePaths(__dirname);testModule._compile(fixture+probes,filename);
