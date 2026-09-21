(()=>{
 const names={bronze:'BRONZE',silver:'SILVER',gold:'GOLD'};
 const card=document.querySelector('.collection-item');if(!card)return;
 card.querySelector('.collection-tier-frame')?.remove();
 card.insertAdjacentHTML('afterbegin','<span class="collection-card-meta"><span>PERSONAL<br>COLLECTION</span><span>藏品档案<br>NO. 001</span></span><span class="collection-engraving" aria-hidden="true"></span><span class="collection-foil-light" aria-hidden="true"></span>');
 const setTier=(element,tier)=>{element.dataset.tier=tier;element.querySelector('.collection-tier-name').textContent=names[tier];};
 document.querySelectorAll('.collection-item').forEach(el=>setTier(el,window.COLLECTION_ITEMS[Number(el.dataset.collectionIndex)].tier || 'bronze'));
 document.querySelectorAll('.collection-item').forEach(el=>{
  el.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=el.getBoundingClientRect();el.style.setProperty('--px',((event.clientX-r.left)/r.width*100)+'%');el.style.setProperty('--py',((event.clientY-r.top)/r.height*100)+'%');el.style.setProperty('--shine','1');});
  el.addEventListener('pointerleave',()=>el.style.setProperty('--shine','0'));
 });
})();
