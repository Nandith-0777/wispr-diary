const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');const filename=path.join(__dirname,'embedded-probes.cjs');const fixture=fs.readFileSync(path.join(__dirname,'workspace.cjs'),'utf8').split('(async()=>{')[0];
const probes=String.raw`
(async()=>{
 await tick();const audio=window.WisprAudio;window.btoa=s=>Buffer.from(s,'binary').toString('base64');
 const pcm=new Float32Array([-2,-1,0,1,2]);const buffer=audio.wav(pcm),view=new DataView(buffer);assert.equal(view.getUint32(24,true),16000);assert.equal(view.getUint16(22,true),1);assert.equal(view.getInt16(44,true),-32768);assert.equal(view.getInt16(52,true),32767);
 for(const rate of [16000,44100,48000]){let Processor,packets=[];class Base{constructor(){this.port={postMessage:data=>packets.push(data)}}}vm.runInNewContext(fs.readFileSync(path.join(root,'dist/wispr-capture.worklet.js'),'utf8'),{AudioWorkletProcessor:Base,sampleRate:rate,registerProcessor:(_,p)=>Processor=p});const processor=new Processor();for(let i=0;i<rate;i+=128){const n=Math.min(128,rate-i);processor.process([[new Float32Array(n).fill(.2),new Float32Array(n).fill(.4)]])}processor.port.onmessage({data:{type:'flush'}});const chunks=packets.filter(p=>p instanceof Float32Array||p.length!==undefined);assert.equal(chunks.reduce((n,p)=>n+p.length,0),16000,'Resample '+rate+'Hz exactly');assert(Math.abs(chunks[0][0]-.3)<.001,'Stereo is mixed to mono')}
 let clips=[];const segmenter=new audio.Segmenter(s=>clips.push(s)),silence=new Float32Array(1600),speech=new Float32Array(1600).fill(.2);
 for(let i=0;i<20;i++)segmenter.push(silence);assert.equal(clips.length,0,'Silence creates no API calls');
 segmenter.push(speech);segmenter.push(speech);for(let i=0;i<9;i++)segmenter.push(silence);assert.equal(clips.length,1,'A pause ends an utterance');assert(clips[0].some(x=>x>.1));
 clips=[];for(let i=0;i<151;i++)segmenter.push(speech);assert.equal(clips.length,1,'Long speech has bounded chunks');assert.equal(clips[0].length,240000);segmenter.flush();assert.equal(clips.length,2);
 assert.equal($('#use-flow'),null);assert.equal($('#flow-shortcuts'),null);assert(!$('#voice-options').textContent.includes('Get Wispr Flow'));
 let ready=false,requests=[],mode='ok',activeTrack,lastNode;
 const request=async(url,options)=>{if(url==='/api/voice/status')return {ok:true,json:async()=>({configured:ready})};if(url==='/api/voice/transcribe'){requests.push(JSON.parse(options.body));if(mode==='error')return {ok:false,json:async()=>({error:'Test connection interrupted'})};if(mode==='delayed')await new Promise(resolve=>{request.release=resolve});return {ok:true,json:async()=>({text:'A lovely afternoon.'})}}return {ok:true,json:async()=>({configured:false})}};
 context.fetch=request;context.AbortController=AbortController;
 class Node{constructor(){lastNode=this;this.port={postMessage:()=>setTimeout(()=>this.port.onmessage({data:{type:'flushed'}}),0)}}connect(){}disconnect(){}}
 class Audio{constructor(){this.audioWorklet={addModule:async()=>{}}}createMediaStreamSource(){return {connect(){},disconnect(){}}}createGain(){return {gain:{value:1},connect(){},disconnect(){}}}async resume(){}async close(){}}
 window.AudioContext=Audio;window.AudioWorkletNode=Node;
 context.navigator.mediaDevices={getUserMedia:async()=>{activeTrack={stopped:false,stop(){this.stopped=true}};return {getTracks:()=>[activeTrack]}}};
 $('#start-voice').click();await tick();assert(!window.embeddedWispr.recording);assert($('#voice-options').open);assert(!activeTrack,'No microphone access without an API connection');$('#voice-options').close();await tick();
 await send('Diary, create a book called Embedded voice test.');ready=true;
 $('#start-voice').click();await tick();assert.equal(window.voiceSession.mode,'wispr-api');assert(window.embeddedWispr.recording);assert(micListening());
 function micListening(){return $('#start-voice').classList.contains('listening')}
 function phrase(){lastNode.port.onmessage({data:speech});lastNode.port.onmessage({data:speech});for(let i=0;i<9;i++)lastNode.port.onmessage({data:silence})}
 phrase();await tick();await window.diaryConversation.settled();assert($('#diary-left').value.includes('A lovely afternoon.'));assert.equal(requests.length,1);assert(requests[0].audio.startsWith('UklGR'));assert(!('key' in requests[0]));
 lastNode.port.onmessage({data:speech});$('#start-voice').click();await tick();await tick();await window.diaryConversation.settled();assert(!window.embeddedWispr.recording);assert(activeTrack.stopped,'Pause releases the microphone');assert.equal(requests.length,2,'Pause commits the last spoken phrase');
 mode='error';$('#start-voice').click();await tick();phrase();await tick();assert(!window.embeddedWispr.recording);assert(!$('#voice-recording-recovery').hidden,'A failed phrase can be recovered');assert(activeTrack.stopped);
 mode='ok';$('#retry-voice-recording').click();await tick();await window.diaryConversation.settled();assert($('#voice-recording-recovery').hidden);assert(!window.voiceSession.active);
 mode='delayed';$('#start-voice').click();await tick();phrase();await tick();run('showBook(books.find(b=>b.isSample).id)');const before=run('JSON.stringify(activeBook().spreads)');request.release();await tick();assert.equal(run('JSON.stringify(activeBook().spreads)'),before,'Late transcription cannot write into another book');assert(!$('#voice-recording-recovery').hidden);assert($('#retry-voice-recording').disabled);
 $('#discard-voice-recording').click();window.voiceSession.stop();assert.equal(errors.length,0,JSON.stringify(errors));console.log('Embedded Wispr checks passed: WAV encoding, pause segmentation, bounded audio, default website mic, missing-key UI, ordered routing, final-phrase flush, track cleanup, recovery/retry, and stale-book protection. Browser audio and Wispr responses are mocked.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`;
const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;mod._compile(fixture+probes,filename);
