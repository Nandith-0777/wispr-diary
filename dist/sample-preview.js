// A public, read-only example. Personal books start blank after sign-in.
const DEMO_VERSION=7;
function createSampleBook(){
 const piece=(type,text,x,y,w,url='',color='#ffffff',font=18)=>({id:crypto.randomUUID(),type,text,x,y,w,url,color,font,tilt:-2});
 const spread=(heading,left,right,pieces=[])=>({id:crypto.randomUUID(),heading,diary:{left,right},pieces,entryId:null});
 const spreads=[
  spread('A little place for your day.', 'Dear diary,\n\nGood coffee. A call with a friend. A little time to myself.\n\nThis is a fictional sample. Your own story starts in a book of your own.', 'A photograph, a passing thought, a little piece of an ordinary day.\n\nA diary can hold all of it.', [piece('photo','My everyday corner.',55,39,38,'assets/desk.jpg'),piece('note','Call Mum. Tell her about the good part.',9,63,30,'','#d4ae82',23)]),
  spread('Movie night.', 'One film. Too many snacks.\n\nWe spent longer choosing what to watch than actually watching it. A very good evening.\n\nSome memories are better with a play button.', 'A tiny movie-night keepsake.\n\nPress play below.', [piece('video','Big Buck Bunny · Blender Foundation\nCC BY 3.0',54,34,40,'assets/movie-night.mp4')]),
  spread('A voice worth keeping.', 'Some days, just say it.\n\nA little update, a funny story, or the way someone says your name.\n\nYou can keep the sound of a day, too.', 'A little voice note.\n\nPress play to listen. This placeholder recording is computer-narrated.', [piece('audio','The “one episode” incident\nComputer-narrated sample',54,43,40,'assets/voice-note.wav','#e7d9f2',16)]),
  spread('Small things, kept.', 'A ticket from a night out.\nAn idea on a scrap of paper.\nA note to your future self.\n\nYour book has room for the things that make a day yours.', 'This sample is here to explore.\n\nMake your own book to choose a title and cover, then write, speak, and arrange your memories.', [piece('ticket','ADMIT ONE\nA very good evening',8,58,31,'','#e7d9f2',22),piece('paper','One small thing I want to remember:\nI made time for a friend.',55,49,34,'','#fff8e9',22)])
 ];
 return{id:crypto.randomUUID(),sampleVersion:DEMO_VERSION,isSample:true,title:'Dear diary, plot twist.',subtitle:'A little look at what a day can hold.',author:'THE WISPR DIARY SAMPLE · READ ONLY',category:'Sample books',color:'#7953a5',paperStyle:'blank',paperColor:'#ffffff',coverImage:'',coverStyle:'minimal',coverFont:'serif',entries:[],spreads,activeSpread:0,updated:new Date().toISOString()};
}
