// Explicit commands keep everyday diary prose from becoming app actions.
(()=>{
 const clean=s=>s.replace(/^[\s,.:;!?–—-]+/g,'').trim();
 const numbers={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
 function sticky(body){const m=/^(?:open|add|create|make|insert)(?: up)? (?:a |an |the )?(?:(brown|yellow|pink|purple|green|blue|white) )?sticky note\b([\s\S]*)/i.exec(body);if(!m)return null;let color=m[1]?.toLowerCase()||'yellow',tail=m[2];const shade=/^\s*(?:of|in|with)?\s*(?:the )?(brown|yellow|pink|purple|green|blue|white)(?:\s+colou?r)?\b/i.exec(tail);if(shade){color=shade[1].toLowerCase();tail=tail.slice(shade[0].length)}tail=clean(tail).replace(/^(?:and (?:say|write)|saying|that says|with (?:the )?(?:message|text)|write|say)\b\s*[:,-]?\s*/i,'');return{kind:'add',type:'note',color,text:tail.replace(/^[“"']|[”"']$/g,'')};}
 function parse(input){
  input=window.normalizeDiaryCommand?.(input)||input;
  const text=input.trim(),prefix=/^diary\b\s*[,.:]?\s*/i.exec(text);
  const control=window.bookControls?.parse(prefix?text.slice(prefix[0].length):text);if(control)return control;
  // An unrecognized editing instruction must never become journal or note text.
  if(!prefix&&/^(?:please\s+)?(?:delete|clear|remove|erase)\b/i.test(text))return{kind:'unknown',text};
  // Only a small set of exact navigation phrases work without “Diary”.
  if(!prefix){const note=sticky(text);if(note)return note;if(/^(?:open (?:the |my )?book|close (?:the |my )?book|next page|previous page|stop listening)[\s.!?]*$/i.test(text))return parse('Diary, '+text);return{kind:'dictate',text};}
  const body=text.slice(prefix[0].length);let m;
  const note=sticky(body);if(note)return note;
  if(/^open (?:the |my )?book[\s.!?]*$/i.test(body))return{kind:'open-current'};
  if(/^close (?:the |my )?book[\s.!?]*$/i.test(body))return{kind:'close-book'};
  if(/^(?:focus (?:the )?book|hide conversation)[\s.!?]*$/i.test(body))return{kind:'focus-book'};
  if(/^(?:show (?:the )?conversation|show controls)[\s.!?]*$/i.test(body))return{kind:'show-conversation'};
  if((m=/^(?:replace (?:the )?(?:page|text|selected text) with|rewrite (?:the )?page)\b([\s\S]+)/i.exec(body)))return{kind:'replace-text',text:clean(m[1])};
  if(/^(?:paper settings|page settings)[\s.!?]*$/i.test(body))return{kind:'paper-settings'};
  if((m=/^(?:(?:make|set|change|use)(?: the)? (?:pages?|paper)(?: style)?(?: to| as)?|use) (blank|lined|unlined|plain)(?: pages?| paper)?[\s.!?]*$/i.exec(body)))return{kind:'paper-style',style:m[1].toLowerCase()==='lined'?'lined':'blank'};
  if(/^(?:remove (?:the )?lines|no lines)[\s.!?]*$/i.test(body))return{kind:'paper-style',style:'blank'};
  if((m=/^(?:(?:change|set|make)(?: the)? (?:pages?|paper)(?: colou?r)?(?: to)?|page colou?r) (white|cream|pink|purple|lavender|green|blue|yellow|#[\da-f]{6})[\s.!?]*$/i.exec(body)))return{kind:'paper-color',color:m[1].toLowerCase()};
  if((m=/^(?:(?:change|set|make)(?: the)? cover(?: colou?r)?(?: to)?|cover colou?r) (white|cream|pink|purple|lavender|green|blue|yellow|#[\da-f]{6})[\s.!?]*$/i.exec(body)))return{kind:'cover-color',color:m[1].toLowerCase()};
  if((m=/^(?:(?:change|set)(?: the)? )?cover style(?: to)? (classic|minimal|photo)[\s.!?]*$/i.exec(body)))return{kind:'cover-style',style:m[1].toLowerCase()};
  if((m=/^(?:cover font|title font)(?: to)? (literary|handwritten|simple)[\s.!?]*$/i.exec(body)))return{kind:'cover-font',font:({literary:'serif',handwritten:'hand',simple:'sans'})[m[1].toLowerCase()]};
  if((m=/^(?:set (?:the )?)?(subtitle|author|category)(?: to)?\b([\s\S]+)/i.exec(body)))return{kind:m[1].toLowerCase(),text:clean(m[2]).replace(/[.!?]+$/,'')};
  if((m=/^(?:go to|open|show) page (\d+|one|two|three|four|five|six|seven|eight|nine|ten)[\s.!?]*$/i.exec(body)))return{kind:'goto',page:numbers[m[1].toLowerCase()]||+m[1]};
  if((m=/^(?:make (?:the )?(?:page )?text|text size) (bigger|smaller)[\s.!?]*$/i.exec(body)))return{kind:'text-size',direction:m[1].toLowerCase()};
  if((m=/^rotate (?:it|(?:the )?(?:selected )?piece) (left|right)[\s.!?]*$/i.exec(body)))return{kind:'rotate',direction:m[1].toLowerCase()};
  if((m=/^(?:bring|send) (?:it|(?:the )?piece) (forward|backward|back)[\s.!?]*$/i.exec(body)))return{kind:'layer',direction:m[1].toLowerCase()==='forward'?'forward':'back'};
  if(/^remove (?:the )?selected piece[\s.!?]*$/i.test(body))return{kind:'remove-piece'};
  if((m=/^play (?:the )?(video|audio|voice note)[\s.!?]*$/i.exec(body)))return{kind:'play',media:m[1].toLowerCase()==='video'?'video':'audio'};
  if(/^pause (?:the )?(?:media|video|audio|voice note)[\s.!?]*$/i.test(body))return{kind:'pause-media'};
  if((m=/^write literally\b([\s\S]*)/i.exec(body)))return{kind:'dictate',text:clean(m[1])};
  if((m=/^(?:add|create|make|start|new)(?: a)? (?:new )?book(?: called| named)?\b([\s\S]+)/i.exec(body)))return{kind:'new-book',text:clean(m[1]).replace(/[.!?]+$/,'')};
  if((m=/^open (?:the )?book\b([\s\S]+)/i.exec(body)))return{kind:'open-book',text:clean(m[1]).replace(/[.!?]+$/,'')};
  if(/^close (?:the )?book[\s.!?]*$/i.test(body))return{kind:'close-book'};
  if((m=/^(?:add|create|make)(?: a| an)? (paper|ticket|cardboard|tape)\b([\s\S]*)/i.exec(body)))return{kind:'add',type:({paper:'paper',ticket:'ticket',cardboard:'cardboard',tape:'tape'})[m[1].toLowerCase()],text:clean(m[2])};
  if((m=/^(?:write (?:on|in)|go to|use|select) (?:the )?(left|right) page\b([\s\S]*)/i.exec(body)))return{kind:'page',side:m[1].toLowerCase(),text:clean(m[2])};
  if((m=/^(left|right) page\b([\s\S]*)/i.exec(body)))return{kind:'page',side:m[1].toLowerCase(),text:clean(m[2])};
  if((m=/^(?:write (?:on|in)|select|use) (?:the )?(?:sticky )?note(?: (\d+|one|two|three|four|five|six|seven|eight|nine|ten))?\b([\s\S]*)/i.exec(body)))return{kind:'note',number:m[1]?(numbers[m[1].toLowerCase()]||+m[1]):null,text:clean(m[2])};
  if((m=/^(?:write (?:on|in)|select|use) (?:the )?(photo|image|video|audio|paper|ticket|cardboard|tape)(?: caption)?(?: (\d+|one|two|three|four|five|six|seven|eight|nine|ten))?\b([\s\S]*)/i.exec(body)))return{kind:'piece',type:m[1].toLowerCase()==='image'?'photo':m[1].toLowerCase(),number:m[2]?(numbers[m[2].toLowerCase()]||+m[2]):null,text:clean(m[3])};
  if((m=/^(?:next|turn (?:the )?next) page(?:s)?\b([\s\S]*)/i.exec(body)))return{kind:'next',text:clean(m[1])};
  if((m=/^(?:previous|go back (?:a|one)) page(?:s)?\b([\s\S]*)/i.exec(body)))return{kind:'previous',text:clean(m[1])};
  if((m=/^(?:add|new|create) (?:a )?(?:new )?page(?:s)?\b([\s\S]*)/i.exec(body)))return{kind:'new-pages',text:clean(m[1])};
  if((m=/^(?:title (?:these|the) pages|page heading|heading)(?: (?:is|to))?\b([\s\S]+)/i.exec(body)))return{kind:'heading',text:clean(m[1])};
  if((m=/^(?:name (?:this|the) book|book title)(?: (?:is|to))?\b([\s\S]+)/i.exec(body)))return{kind:'book-title',text:clean(m[1]).replace(/[.!?]+$/,'')};
  if((m=/^(?:move (?:the )?(?:note|it)|put (?:the )?(?:note|it))(?: to)?(?: the)? (top left|top right|bottom left|bottom right|upper left|upper right|lower left|lower right|centre|center|left|right|top|bottom)[\s.!?]*$/i.exec(body)))return{kind:'move',position:m[1].toLowerCase()};
  if((m=/^(?:make (?:the )?(?:note|it)|colou?r (?:the )?note)(?: (?:color|colour))? (brown|yellow|pink|purple|green|blue|white|#[\da-f]{6})[\s.!?]*$/i.exec(body)))return{kind:'color',color:m[1].toLowerCase()};
  if((m=/^make (?:the )?(?:note|it) (bigger|smaller)[\s.!?]*$/i.exec(body)))return{kind:'size',direction:m[1].toLowerCase()};
  if((m=/^(?:add|attach|insert)(?: a| an)? (photo|image|video|audio|voice note)[\s.!?]*$/i.exec(body)))return{kind:'media',media:m[1].toLowerCase()};
  if((m=/^(?:remember|save a memory)\b([\s\S]+)/i.exec(body)))return{kind:'memory',text:clean(m[1])};
  if(/^(?:new paragraph|paragraph)[\s.!?]*$/i.test(body))return{kind:'paragraph'};
  if(/^(?:undo|undo (?:the )?last (?:sentence|dictation))[\s.!?]*$/i.test(body))return{kind:'undo'};
  if(/^(?:save|save (?:this|the) day|save (?:this|the) entry)[\s.!?]*$/i.test(body))return{kind:'save'};
  if(/^(?:stop listening|pause|pause listening|stop)[\s.!?]*$/i.test(body))return{kind:'stop'};
  if(/^(?:help|what can i say)[\s.!?]*$/i.test(body))return{kind:'help'};
  if(/^(?:close help|continue writing|close tools)[\s.!?]*$/i.test(body))return{kind:'close-help'};
  return{kind:'unknown',text};
 }
 function split(text){const parts=text.split(/(?<=[.!?\n])\s+(?=diary\s*[,.:]?\s+(?:add|create|make|start|open|write|go|use|select|left|right|next|previous|turn|new|title|heading|page|paper|book title|name|move|put|colou?r|attach|insert|remember|save|paragraph|undo|stop|pause|help|what|close|continue|delete|clear|duplicate|copy|change|set|cover|subtitle|author|category|rotate|bring|send|remove|play|text|no|show|focus|hide|replace|rewrite)\b)/i).map(s=>s.trim()).filter(Boolean);const result=[];for(let i=0;i<parts.length;i++){if(/^diary\s*[,.:]?\s+write literally\b/i.test(parts[i])){result.push(parts.slice(i).join(' '));break}result.push(parts[i])}return result}
 window.DiaryCommands={parse,split};
})();
