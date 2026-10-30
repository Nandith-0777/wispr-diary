// Keep the user's chosen positions while bringing off-page edges into view.
(()=>{
 const surface=document.querySelector('#scrap-surface');
 function fit(){const width=surface.clientWidth,height=surface.clientHeight;if(!width||!height)return;for(const piece of pieces){const el=surface.querySelector('[data-id="'+piece.id+'"]');if(!el)continue;const maxX=Math.max(0,100-el.offsetWidth/width*100-2),maxY=Math.max(0,100-el.offsetHeight/height*100-2);el.style.left=Math.max(0,Math.min(piece.x,maxX))+'%';el.style.top=Math.max(0,Math.min(piece.y,maxY))+'%';}}
 window.fitDiaryPieces=fit;new ResizeObserver(fit).observe(surface);
})();
