const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');const filename=path.join(__dirname,'immersive-probes.cjs');const fixture=fs.readFileSync(path.join(__dirname,'workspace.cjs'),'utf8').split('(async()=>{')[0];
const probes=String.raw`
(async()=>{
 assert.equal($('#conversation-log'),null,'No conversation history exists in the DOM');assert.equal($('.conversation-heading'),null);assert.equal($('#restore-conversation'),null,'There is no button to restore the old chat');
 assert.equal($('.voice-command-dock').getAttribute('aria-label'),'Book tools');
 assert.equal($('#conversation-form').parentNode,$('#diary-view'),'Typed commands belong below the book');
 assert.equal($('.session-feedback').parentNode,$('#book-reading-status'),'Feedback is a status line instead of chat');
 assert.equal($('#book-control-dialog'),null,'Scattered command guides are removed');assert.equal($('#voice-guide-dialog'),null);
 $('.hero-cta').click();assert(!document.body.classList.contains('command-bar-open'));
 $('#toggle-book-input').click();assert(document.body.classList.contains('command-bar-open'));await send('Diary, create a book called Immersive check.');await send('A quiet page for my day.');assert.equal($('#diary-left').value,'A quiet page for my day.');assert.equal($('#conversation-log'),null,'Writing does not recreate a conversation');
 $('#toggle-book-input').click();assert(!document.body.classList.contains('command-bar-open'));
 $('#open-book-options').click();assert($('#book-options').open);$('#book-options .dialog-close').click();$('#toggle-book-input').click();assert(document.body.classList.contains('command-bar-open'));
 let requested=0,exited=0;document.documentElement.requestFullscreen=async()=>{requested++;document.fullscreenElement=document.documentElement;document.dispatchEvent(new window.Event('fullscreenchange'))};document.exitFullscreen=async()=>{exited++;document.fullscreenElement=null;document.dispatchEvent(new window.Event('fullscreenchange'))};
 await $('#book-fullscreen').onclick();assert.equal(requested,1);assert.equal($('#book-fullscreen').getAttribute('aria-pressed'),'true');await $('#book-fullscreen').onclick();assert.equal(exited,1);assert.equal($('#book-fullscreen').getAttribute('aria-pressed'),'false');
 $('#voice-settings').click();window.voiceSession.ensureMode('wispr');$('#voice-options').close();$('#voice-command-input').focus();await tick();assert(document.body.classList.contains('command-bar-open'),'Flow opens the command input automatically');assert.equal(document.activeElement,$('#voice-command-input'));window.voiceSession.stop();
 assert.equal(errors.length,0,JSON.stringify(errors));console.log('Immersive checks passed: chat removal, edge controls, compact feedback, command bar, guide example focus, fullscreen API toggle, writing, and Flow destination. Browser rendering/fullscreen policy are not simulated.');
})().catch(e=>{console.error(e);process.exitCode=1});
`;const testModule=new Module(filename,module);testModule.filename=filename;testModule.paths=Module._nodeModulePaths(__dirname);testModule._compile(fixture+probes,filename);
