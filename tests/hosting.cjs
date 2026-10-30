const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'hosting-probes.cjs');const fixture=fs.readFileSync(path.join(__dirname,'workspace.cjs'),'utf8').split('(async()=>{')[0];
const probes=String.raw`
(async()=>{
 await tick();window.diaryDeployment={staticHosting:true,googleTesting:true};
 run('bookDialog()');$('#book-title').value='Hosted book';$('#book-category').value='Personal';$('#book-form').onsubmit({preventDefault(){}});
 run(fs.readFileSync(path.join(__dirname,'../dist/hosting-ui.js'),'utf8'));
 assert($('#use-wispr-api').disabled,'Unconfigured Wispr API is clearly disabled');
 assert($('#login #google-testing-notice'),'Testing restriction is visible');
 assert(document.querySelector('footer a[href="privacy.html"]'),'Public privacy information is linked');
 $('#start-voice').click();await tick();assert.equal(window.voiceSession.mode,'browser','First-time hosted mic defaults to the available browser service');
 await speak('Diary, write literally A little story from the hosted site.');assert($('#diary-left').value.includes('A little story from the hosted site.'));
 window.voiceSession.stop();assert.equal(errors.length,0,JSON.stringify(errors));console.log('Hosted launch checks passed: browser microphone default, local writing, clear pending API state, Google testing notice, and privacy link.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`;
const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;mod._compile(fixture+probes,filename);
