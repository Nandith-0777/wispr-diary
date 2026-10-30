// Average input samples into a continuous mono 16kHz stream, in 100ms packets.
class WisprCapture extends AudioWorkletProcessor{
 constructor(){super();this.position=0;this.sum=0;this.count=0;this.packet=new Float32Array(1600);this.used=0;this.port.onmessage=()=>{if(this.used)this.port.postMessage(this.packet.slice(0,this.used));this.packet=new Float32Array(1600);this.used=0;this.port.postMessage({type:'flushed'})}}
 process(inputs){const channels=inputs[0];if(!channels?.length)return true;for(let i=0;i<channels[0].length;i++){let value=0;for(const channel of channels)value+=channel[i];this.sum+=value/channels.length;this.count++;this.position+=16000;
   if(this.position>=sampleRate){this.position-=sampleRate;this.packet[this.used++]=this.sum/this.count;this.sum=0;this.count=0;if(this.used===1600){this.port.postMessage(this.packet,[this.packet.buffer]);this.packet=new Float32Array(1600);this.used=0}}
  }return true}
}
registerProcessor('wispr-capture',WisprCapture);
