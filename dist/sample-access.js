// The public sample can be read and played; account books can be edited.
(()=>{
 const $=s=>document.querySelector(s),make=()=>bookDialog();
 const landing=$('#launch-voice-workspace');landing.textContent='Make your own book ↗';landing.onclick=make;
 const create=document.createElement('button');create.id='make-own-book';create.textContent='Make your own book ↗';create.onclick=make;$('.conversation-actions').append(create);
 const badge=document.createElement('span');badge.id='book-access-label';$('.scrap-toolbar').insertBefore(badge,$('#saved-status'));
 const account=document.createElement('button');account.id='book-account';account.textContent='Sign in';account.dataset.bookAction='true';account.onclick=()=>window.diaryAuth.show();$('.book-options-list').prepend(account);
 function refresh(){const book=activeBook(),readOnly=isReadOnlyBook(book);$('#book').classList.toggle('read-only-book',readOnly);$('#diary-view').classList.toggle('sample-view',!!book.isSample);badge.textContent=book.isSample?'Sample · read-only':readOnly?'Sign in to edit':'Your account book';badge.hidden=!readOnly;create.hidden=!book.isSample;
  for(const id of ['other-tools','undo-book-action','toggle-book-input'])$('#'+id).hidden=!!book.isSample;
  for(const id of ['open-paper-settings','customize-current','save-spread','add-spread'])$('#'+id).disabled=readOnly;
  if(readOnly&&book.activeSpread===book.spreads.length-1)$('#next-spread').disabled=true;
  $('#spread-heading').disabled=readOnly;document.querySelectorAll('.diary-writing textarea').forEach(el=>el.readOnly=readOnly);document.querySelectorAll('.scrap-piece').forEach(el=>{const text=el.querySelector('.piece-text');text.contentEditable=String(!readOnly);text.tabIndex=readOnly?-1:0;el.querySelectorAll('.piece-handle,.resize-piece').forEach(handle=>handle.hidden=readOnly)});if(readOnly)$('#piece-tools').hidden=true;
  account.textContent=window.diaryAuth?.user?'My account':'Sign in';
 }
 window.refreshBookAccess=refresh;document.addEventListener('diary-auth-change',()=>{renderPieces();refresh()});refresh();
 const description=$('.sample-invitation p');if(description)description.textContent='An eight-page, read-only sample with notes, photos, video, audio, and paper keepsakes.';
 $('#create-book').textContent='＋ Make a new book';
})();
