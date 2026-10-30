// Production-only connection copy. Local development retains its API adapters.
(()=>{
 if(!window.diaryDeployment?.staticHosting)return;
 const $=s=>document.querySelector(s);
 $('#embedded-voice-status').textContent='Wispr API access is pending. Browser dictation is available now when supported by your browser.';
 $('#use-wispr-api').disabled=true;$('#use-wispr-api').textContent='Wispr connection pending';
 $('#use-browser').closest('.voice-mode').querySelector('h3').textContent='Browser dictation';
 $('#natural-voice-dialog .natural-setup').textContent='Natural AI understanding is not enabled on this deployment. Dictation and local commands work without an AI API key. Browser dictation may send microphone audio to your browser’s speech service.';
 const privacy=document.createElement('a');privacy.href='privacy.html';privacy.target='_blank';privacy.rel='noopener';privacy.textContent='Privacy & your data';privacy.style.cssText='font-size:12px;text-decoration:underline';document.querySelector('footer')?.append(privacy);
 if(window.diaryDeployment.googleTesting){const note=document.createElement('p');note.id='google-testing-notice';note.textContent='Google sign-in is currently limited to approved test accounts.';note.style.cssText='font-size:12px;color:#6e5a77';$('#login').append(note)}
})();
