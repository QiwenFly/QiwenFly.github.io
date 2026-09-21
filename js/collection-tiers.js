(()=>{
 const names={bronze:'BRONZE',silver:'SILVER',gold:'GOLD'};
 document.querySelectorAll('.collection-item').forEach(el=>{
  const item=window.COLLECTION_ITEMS?.[Number(el.dataset.collectionIndex)];
  const tier=Object.prototype.hasOwnProperty.call(names,item?.tier)?item.tier:'bronze';
  el.dataset.tier=tier;
  el.querySelector('.collection-tier-name').textContent=names[tier];
  el.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=el.getBoundingClientRect();el.style.setProperty('--px',((event.clientX-r.left)/r.width*100)+'%');el.style.setProperty('--py',((event.clientY-r.top)/r.height*100)+'%');el.style.setProperty('--shine','1');});
  el.addEventListener('pointerleave',()=>el.style.setProperty('--shine','0'));
 });
})();
