// Small, predictable synonyms. Narrative and command payloads stay unchanged.
(()=>{
 function normalize(input){const match=/^diary\b\s*[,.:]?\s*/i.exec(input.trim());if(!match)return input;let body=input.trim().slice(match[0].length).replace(/^please\s+/i,'');
  const aliases=[[/^(?:turn (?:the )?page|go (?:to (?:the )?)?next(?: page)?)[.!?]*$/i,'next page'],[/^(?:go back|back(?: a)? page|last page)[.!?]*$/i,'previous page'],[/^go (?:to )?page\b/i,'go to page'],[/^(?:rename|change (?:the )?name of) (?:this |the )?book\b/i,'name this book'],[/^rename (?:this |the )?page\b/i,'heading'],[/^(?:type|show (?:the )?(?:typing|command) bar)[.!?]*$/i,'show conversation'],[/^(?:hide (?:the )?(?:typing|command) bar|hide typing)[.!?]*$/i,'focus book'],[/^manual[.!?]*$/i,'help']];
  for(const [pattern,value] of aliases)if(pattern.test(body)){body=body.replace(pattern,value);break}
  body=body.replace(/^(add|open|create|make|insert|delete|remove|select|duplicate|copy|move) ((?:a |the |this )?(?:(?:brown|yellow|pink|purple|green|blue|white) )?)note\b/i,'$1 $2sticky note');
  return'Diary, '+body;
 }
 window.normalizeDiaryCommand=normalize;
})();
