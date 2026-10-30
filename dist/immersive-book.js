// A book-sized workspace with tools at its edges, without a conversation view.
(()=>{
 const $=s=>document.querySelector(s),desk=$('#diary-view'),dock=$('.voice-command-dock');
 dock.setAttribute('aria-label','Book tools');$('.conversation-heading')?.remove();$('#conversation-log')?.remove();$('#focus-book')?.remove();$('#restore-conversation')?.remove();
 const status=document.createElement('div');status.id='book-reading-status';status.append($('.session-feedback'),$('#live-transcript'));desk.append(status);
 const form=$('#conversation-form');form.classList.add('book-command-bar');desk.append(form);form.querySelector('label').textContent='Write a command, or dictate here with Wispr Flow';$('#voice-command-input').placeholder='Try “Open a brown sticky note saying Good morning”…';$('#voice-command-input').rows=1;
 const type=document.createElement('button');type.id='toggle-book-input';type.textContent='⌨ Type';type.setAttribute('aria-expanded','false');type.onclick=()=>{const open=!document.body.classList.contains('command-bar-open');showInput(open);if(open)$('#voice-command-input').focus()};$('.conversation-actions').append(type);
 function showInput(open=true){document.body.classList.toggle('command-bar-open',open);type.setAttribute('aria-expanded',String(open));if(!open&&window.voiceSession?.active&&window.voiceSession.mode==='wispr')window.voiceSession.stop('Flow input hidden. Start Flow session to resume automatic commands.');requestAnimationFrame(()=>window.fitDiaryBook?.())}
 window.showDiaryInput=()=>showInput(true);window.hideDiaryInput=()=>showInput(false);
 const media=$('#voice-media-request');desk.append(media);
 const fullscreen=document.createElement('button');fullscreen.id='book-fullscreen';fullscreen.textContent='⛶ Full screen';fullscreen.setAttribute('aria-pressed','false');$('.desk-top-actions').prepend(fullscreen);
 fullscreen.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Fullscreen is unavailable in this browser. The book already fills this tab.')}catch{toast('Fullscreen was not allowed here. The book still fills this tab.')}};
 document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;fullscreen.textContent=active?'⤡ Exit full screen':'⛶ Full screen';fullscreen.setAttribute('aria-pressed',String(active));window.fitDiaryBook?.()});
 // Leave fullscreen before returning to the library or homepage.
 for(const id of ['back-books','leave-workspace'])$('#'+id)?.addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen()?.catch(()=>{})});
 $('#other-tools').textContent='＋ Memories';$('#add-sticky-chat').textContent='＋ Note';$('#close-book').textContent='Close';
})();
