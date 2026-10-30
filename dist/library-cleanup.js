function archiveDraftBooks(){
 if(!window.diaryAuth?.requireSignedIn())return;
 persistLibrary();
 const keep=books.find(b=>b.isSample&&b.sampleVersion===DEMO_VERSION);
 const drafts=books.filter(b=>b.id!==keep?.id);
 if(!drafts.length){toast('Only the sample book is on your shelf.');return;}
 const archive=read('wd-removed-books',[]);
 const known=new Set(archive.map(item=>item.book.id));
 drafts.forEach(book=>{if(!known.has(book.id))archive.push({book:structuredClone(book),removedAt:new Date().toISOString()})});
 if(!store('wd-removed-books',archive)){toast('Could not keep a recovery copy. Drafts were left in place.');return;}
 books=books.filter(b=>b.id===keep.id);
 activeBookId=keep.id;entries=keep.entries||[];const spread=ensureSpreads(keep);pieces=structuredClone(spread.pieces||[]);diary=structuredClone(spread.diary||{left:'',right:''});entryId=spread.entryId||null;
 store('wd-books',books);store('wd-active-book',activeBookId);renderDiary();renderPieces();bookLabels();closeBook();changeView('books');updateRestoreButton();toast(drafts.length+' draft books removed from the shelf. You can restore them.');
}
function updateRestoreButton(){const count=read('wd-removed-books',[]).filter(item=>!books.some(b=>b.id===item.book.id)).length;document.querySelector('#restore-drafts').hidden=!count;document.querySelector('#restore-drafts').textContent='Restore removed drafts ('+count+')';}
document.querySelector('#archive-drafts').onclick=archiveDraftBooks;
document.querySelector('#restore-drafts').onclick=()=>{if(!window.diaryAuth?.requireSignedIn())return;const archive=read('wd-removed-books',[]);const existing=new Set(books.map(b=>b.id));const restored=archive.filter(item=>!existing.has(item.book.id)).map(item=>structuredClone(item.book));books.push(...restored);store('wd-books',books);renderBooks();updateRestoreButton();toast(restored.length+' books restored.');};
document.querySelector('[data-view="books"]').addEventListener('click',updateRestoreButton);updateRestoreButton();
