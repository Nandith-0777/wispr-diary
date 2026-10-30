// Measure real rendered lines, then carry overflow forward without dropping text.
(()=>{
 const mirror=document.createElement('div');mirror.id='page-measure';mirror.setAttribute('aria-hidden','true');document.body.append(mirror);
 const page=side=>document.querySelector('#diary-'+side);
 function fits(text,side){const el=page(side),style=getComputedStyle(el),height=el.clientHeight,width=el.clientWidth;if(height<30||width<30)return true;
  mirror.style.cssText='position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;white-space:pre-wrap;overflow-wrap:break-word;word-break:normal;box-sizing:border-box;height:auto;min-height:0;max-height:none;';
  for(const key of ['font','lineHeight','letterSpacing','wordSpacing','textIndent','paddingTop','paddingRight','paddingBottom','paddingLeft','tabSize'])mirror.style[key]=style[key];mirror.style.width=width+'px';mirror.textContent=text+'\u200b';return mirror.scrollHeight<=height;
 }
 function split(text,side){if(fits(text,side))return[text,''];let low=0,high=text.length;while(low<high){const mid=Math.ceil((low+high)/2);if(fits(text.slice(0,mid),side))low=mid;else high=mid-1}if(!low)return[text,''];
  // Prefer whole words; a very long token can still continue on the next page.
  const whitespace=text.slice(0,low).search(/\s+\S*$/u);if(whitespace>0)low=whitespace+1;if(low>0&&/[\uD800-\uDBFF]/.test(text[low-1]))low--;return[text.slice(0,low),text.slice(low)];
 }
 const snapshot=book=>book.spreads.map(s=>({id:s.id,diary:structuredClone(s.diary)}));
 function wait(){if(!document.querySelector('.page-turn-layer'))return Promise.resolve();return new Promise(resolve=>{const observer=new MutationObserver(()=>{if(!document.querySelector('.page-turn-layer'))finish()});const timer=setTimeout(()=>{window.cancelDiaryTurn?.();finish()},1800);function finish(){clearTimeout(timer);observer.disconnect();resolve()}observer.observe(document.querySelector('#book'),{childList:true})})}
 async function insert(target,text){if(!requireBookEdit())return null;const book=activeBook(),before=snapshot(book),startSpread=book.activeSpread,startSide=target.element.id==='diary-right'?'right':'left',startCaret=target.element.selectionStart??target.element.value.length;
  if(!target.insert(text))return null;
  const originalIndex=book.activeSpread,working=book.spreads.map(s=>({...s,diary:structuredClone(s.diary)}));let index=originalIndex,side=startSide,offset=target.element.selectionStart??target.element.value.length,caret=null,moved=false;
  while(true){const spread=working[index],value=spread.diary[side]||'',[head,tail]=split(value,side);spread.diary[side]=head;
   if(!caret&&offset<=head.length)caret={index,side,offset};
   if(!tail)break;moved=true;if(!caret)offset-=head.length;
   if(side==='left')side='right';else{side='left';index++;if(!working[index])working.push({id:crypto.randomUUID(),heading:'',diary:{left:'',right:''},pieces:[],entryId:null})}
   const existing=working[index].diary[side]||'';working[index].diary[side]=tail+(existing&&!/\s$/.test(tail)&&!/^\s/.test(existing)?'\n\n':'')+existing;
  }
  caret??={index,side,offset:working[index].diary[side].length};book.spreads=working;diary=structuredClone(working[originalIndex].diary);renderDiary();saveDraft();
  if(caret.index!==originalIndex){goToSpread(caret.index);await wait()}
  window.diaryDictationTarget.selectPage(caret.side);page(caret.side).setSelectionRange(caret.offset,caret.offset);page(caret.side).scrollTop=0;
  return{pagination:true,book:book.id,before,after:snapshot(book),startSpread,startSide,startCaret,endSpread:book.activeSpread,moved};
 }
 async function undo(record){if(!requireBookEdit())return false;const book=activeBook();if(book.id!==record.book||JSON.stringify(snapshot(book))!==JSON.stringify(record.after))return false;
  const oldIds=new Set(record.before.map(s=>s.id)),added=book.spreads.filter(s=>!oldIds.has(s.id));if(added.some(s=>s.pieces?.length||s.heading||s.entryId))return false;
  const currentId=book.spreads[book.activeSpread].id;book.spreads=book.spreads.filter(s=>oldIds.has(s.id));for(const saved of record.before){const spread=book.spreads.find(s=>s.id===saved.id);spread.diary=structuredClone(saved.diary)}
  book.activeSpread=Math.max(0,book.spreads.findIndex(s=>s.id===currentId));diary=structuredClone(ensureSpreads(book).diary);pieces=structuredClone(ensureSpreads(book).pieces||[]);entryId=ensureSpreads(book).entryId||null;renderDiary();renderPieces();persistLibrary();
  if(book.activeSpread!==record.startSpread){goToSpread(record.startSpread);await wait()}
  window.diaryDictationTarget.selectPage(record.startSide);page(record.startSide).setSelectionRange(record.startCaret,record.startCaret);return true;
 }
 window.diaryPagination={insert,undo};
})();
