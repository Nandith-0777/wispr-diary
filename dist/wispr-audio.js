// PCM audio utilities shared by the recorder and isolated audio tests.
(()=>{
 function join(chunks){const output=new Float32Array(chunks.reduce((n,c)=>n+c.length,0));let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length}return output}
 function wav(samples){const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);const label=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))};label(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);label(8,'WAVE');label(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);label(36,'data');view.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++){const value=Math.max(-1,Math.min(1,samples[i]));view.setInt16(44+i*2,Math.round(value*(value<0?32768:32767)),true)}return buffer}
 function base64(buffer){const bytes=new Uint8Array(buffer);let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return window.btoa(text)}
 class Segmenter{
  constructor(emit){this.emit=emit;this.reset()}
  reset(){this.pre=[];this.parts=[];this.length=0;this.quiet=0;this.voiced=0}
  push(chunk){let sum=0;for(const value of chunk)sum+=value*value;const speaking=Math.sqrt(sum/chunk.length)>=.012;
   if(!this.parts.length){this.pre.push(chunk);while(this.pre.length>3)this.pre.shift();if(!speaking)return;this.parts=this.pre;this.pre=[];this.length=this.parts.reduce((n,c)=>n+c.length,0)}else{this.parts.push(chunk);this.length+=chunk.length}
   this.quiet=speaking?0:this.quiet+chunk.length;if(speaking)this.voiced+=chunk.length;
   if(this.quiet>=14400||this.length>=240000)this.flush();
  }
  flush(){const parts=this.parts,voiced=this.voiced;this.reset();if(voiced>=1600)this.emit(join(parts))}
 }
 window.WisprAudio={join,wav,base64,Segmenter};
})();
