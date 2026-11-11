(function () {
  'use strict';
  const items = window.COLLECTION_ITEMS || [], wall = document.querySelector('.collection-wall'), dialog = document.querySelector('.collection-viewer');
  if (!wall || !dialog) return;
  // Escape the page board stacking context so the modal covers the navbar.
  document.body.appendChild(dialog);
  // A single exhibit does not need adaptive resolution loss during inspection.
  customElements.whenDefined('model-viewer').then(() => {
    customElements.get('model-viewer').minimumRenderScale = 1;
  });
  const model = dialog.querySelector('model-viewer'), status = dialog.querySelector('.collection-load-state'), close = dialog.querySelector('.collection-viewer-close');
  const buttons = [...dialog.querySelectorAll('[data-view]')];
  const flipButton = dialog.querySelector('.collection-model-flip');
  const shell = dialog.querySelector('.collection-viewer-shell');
  const certificateViewport = dialog.querySelector('.collection-certificate-viewport');
  const certificateImage = dialog.querySelector('.collection-certificate-image');
  const certificateControls = dialog.querySelector('.collection-certificate-controls');
  const modelControls = dialog.querySelector('.collection-view-controls');
  const hint = dialog.querySelector('.collection-model-hint');
  let imageMode = false, imageScale = 1, imageX = 0, imageY = 0, imageDrag = null;
  function renderCertificate() {
    const maxX = certificateViewport.clientWidth * (imageScale - 1) / 2;
    const maxY = certificateViewport.clientHeight * (imageScale - 1) / 2;
    imageX = Math.max(-maxX, Math.min(maxX, imageX));
    imageY = Math.max(-maxY, Math.min(maxY, imageY));
    certificateImage.style.transform = `translate(${imageX}px, ${imageY}px) scale(${imageScale})`;
    dialog.querySelector('.collection-certificate-scale').textContent = Math.round(imageScale * 100) + '%';
    certificateControls.querySelector('[data-certificate-zoom="out"]').disabled = imageScale <= 1;
    certificateControls.querySelector('[data-certificate-zoom="in"]').disabled = imageScale >= 4;
  }
  function resetCertificate() { imageScale = 1; imageX = imageY = 0; renderCertificate(); }
  function zoomCertificate(factor) { imageScale = Math.max(1, Math.min(4, imageScale * factor)); renderCertificate(); }
  certificateControls.addEventListener('click', e => {
    const action = e.target.closest('[data-certificate-zoom]')?.dataset.certificateZoom;
    if (action === 'reset') resetCertificate();
    else if (action) zoomCertificate(action === 'in' ? 1.25 : .8);
  });
  certificateViewport.addEventListener('wheel', e => { if (!imageMode) return; e.preventDefault(); zoomCertificate(Math.exp(-Math.max(-120, Math.min(120, e.deltaY)) * .002)); }, {passive:false});
  certificateViewport.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    imageDrag = {id:e.pointerId,x:e.clientX,y:e.clientY,left:imageX,top:imageY};
    certificateViewport.setPointerCapture(e.pointerId);
  });
  certificateViewport.addEventListener('pointermove', e => {
    if (!imageDrag || imageDrag.id !== e.pointerId) return;
    imageX = imageDrag.left + e.clientX - imageDrag.x; imageY = imageDrag.top + e.clientY - imageDrag.y; renderCertificate();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => certificateViewport.addEventListener(type, () => { imageDrag = null; }));
  certificateViewport.addEventListener('keydown', e => {
    if (['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
    if (e.key === '+' || e.key === '=') zoomCertificate(1.25);
    if (e.key === '-') zoomCertificate(.8);
    if (e.key === '0') resetCertificate();
    if (e.key === 'ArrowLeft') imageX += 35;
    if (e.key === 'ArrowRight') imageX -= 35;
    if (e.key === 'ArrowUp') imageY += 35;
    if (e.key === 'ArrowDown') imageY -= 35;
    renderCertificate();
  });
  certificateImage.addEventListener('load', () => { if (imageMode) {status.hidden = true;resetCertificate();} });
  certificateImage.addEventListener('error', () => { if (imageMode) {status.hidden = false;status.textContent = '证书图片未能载入，请刷新重试。';} });
  const tierNames = { bronze: 'BRONZE', silver: 'SILVER', gold: 'GOLD' };
  const decorationSlots = {
    stageFrame: dialog.querySelector('.collection-detail-stage-frame'),
    stageLaurel: dialog.querySelector('.collection-detail-stage-laurel'),
    infoFrame: dialog.querySelector('.collection-detail-info-frame'),
    infoLaurel: dialog.querySelector('.collection-detail-info-laurel')
  };
  let decoratedTier = '';
  function setDetailTier(value) {
    const tier = Object.prototype.hasOwnProperty.call(tierNames, value) ? value : 'bronze';
    shell.dataset.tier = tier;
    dialog.querySelector('.collection-detail-tier').textContent = tierNames[tier];
    if (decoratedTier === tier) return;
    const patterns = window.COLLECTION_DETAIL_PATTERNS?.[tier];
    if (!patterns) return;
    // These fragments are generated locally from our SVG artwork, never from
    // item descriptions or other user-provided HTML.
    Object.entries(decorationSlots).forEach(([key, el]) => { el.innerHTML = patterns[key]; });
    decoratedTier = tier;
  }
  let trigger, current = 'card', reverse = false, zoomGoal = null, lastWheel = 0;
  let expectedSource = '', loadedSource = '';
  const absoluteUrl = url => new URL(url, location.href).href;
  const views = {
    card: ['0deg 90deg 0.39m', '0m 0.010m 0m'],
    whole: ['-8deg 86deg 1.35m', '0m 0.19m 0m']
  };
  function view(name, instant) {
    current = name;
    zoomGoal = null;
    const orbit = views[name][0].split(' ');
    if (reverse) orbit[0] = '180deg';
    model.setAttribute('camera-orbit', orbit.join(' '));
    model.setAttribute('camera-target', views[name][1]);
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
    if (instant && model.jumpCameraToGoal) model.jumpCameraToGoal();
  }
  function hide() {
    dialog.classList.remove('is-open'); dialog.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('collection-viewer-open');
    if (trigger) trigger.focus();
  }
  function showItem(index) {
    const item = items[index]; if (!item) return;
    current = 'card'; reverse = false;
    trigger = wall.querySelector(`[data-collection-index="${index}"]`);
    setDetailTier(item.tier);
    dialog.querySelector('.collection-info-title').textContent = item.title;
    dialog.querySelector('.collection-info-date').textContent = item.display_date || '';
    dialog.querySelector('.collection-info-description').textContent = item.description || '';
    const facts = dialog.querySelector('.collection-info-facts'); facts.replaceChildren();
    (item.facts || []).forEach(f => {const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');dt.textContent = f.label;dd.textContent = f.value;row.append(dt, dd);facts.append(row);});
    const blog = dialog.querySelector('.collection-blog-link');blog.hidden = !(item.blog && item.blog.url);
    blog.querySelector('small').textContent = item.blog?.label || '相关记录';
    if (!blog.hidden) {blog.href = item.blog.url;blog.querySelector('strong').textContent = item.blog.title;}
    else {blog.removeAttribute('href');blog.querySelector('strong').textContent = '';}
    dialog.querySelector('.collection-info').scrollTop = 0;
    dialog.classList.add('is-open'); dialog.setAttribute('aria-hidden', 'false');document.body.classList.add('collection-viewer-open');
    shell.scrollTop = 0;
    imageMode = item.kind === 'image';
    shell.dataset.kind = imageMode ? 'image' : 'model';
    certificateViewport.hidden = certificateControls.hidden = !imageMode;
    model.hidden = modelControls.hidden = imageMode;
    dialog.querySelector('.collection-model-panel').setAttribute('aria-label', imageMode ? '可放大证书图片' : '可旋转藏品模型');
    hint.textContent = imageMode ? '滚轮或＋放大 · 拖动查看细节' : '拖动翻看 · 指向细节后滚轮放大';
    if (imageMode) {
      expectedSource = '';
      certificateImage.alt = item.title;
      status.hidden = true;
      resetCertificate();
      certificateImage.src = item.detail_image || item.image;
      return;
    }
    model.hidden = false; model.alt = item.title + '，可拖动旋转';
    const src = item.model + '?v=' + encodeURIComponent(item.model_version || 'back16');
    expectedSource = absoluteUrl(src);
    const sameSource = model.src && absoluteUrl(model.src) === expectedSource;
    status.hidden = Boolean(sameSource && loadedSource === expectedSource && model.loaded);
    status.textContent = '正在载入藏品…';
    if (!sameSource) {loadedSource = ''; model.style.visibility = 'hidden'; model.src = src;}
    flipButton.setAttribute('aria-label', reverse ? '翻到正面' : '翻到背面');
    view(current, true);
  }
  wall.addEventListener('click', e => {
    const button = e.target.closest('[data-collection-index]'); if (!button) return;
    showItem(Number(button.dataset.collectionIndex)); close.focus();
  });
  model.addEventListener('load', event => {
    if (!event.detail?.url || absoluteUrl(event.detail.url) !== expectedSource) return;
    loadedSource = expectedSource;
    status.hidden = true; model.style.visibility = ''; view(current, true);
  });
  model.addEventListener('error', () => {if (imageMode) return;status.hidden = false;status.textContent = '模型未能载入，请刷新重试。';});
  buttons.forEach(b => b.addEventListener('click', () => view(b.dataset.view)));
  flipButton.addEventListener('click', () => {
    const orbit = model.getCameraOrbit();
    reverse = Math.cos(orbit.theta) >= 0;
    model.setAttribute('camera-orbit', `${orbit.theta + Math.PI}rad ${orbit.phi}rad ${orbit.radius}m`);
    flipButton.setAttribute('aria-label', reverse ? '翻到正面' : '翻到背面');
    zoomGoal = null;
  });
  // Capture wheel input before the viewer's default controller. A physical
  // notch changes distance by ~4%, and the point under the cursor stays put.
  model.addEventListener('wheel', event => {
    if (!model.loaded || event.deltaY === 0) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const now = performance.now(), orbit = model.getCameraOrbit();
    const target = now-lastWheel < 220 && zoomGoal ? zoomGoal.target : model.getCameraTarget();
    const radius = now-lastWheel < 220 && zoomGoal ? zoomGoal.radius : orbit.radius;
    lastWheel = now;
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 600 : 1);
    const next = Math.max(.12, Math.min(1.8, radius * Math.exp(Math.max(-120, Math.min(120, pixels)) * .00035)));
    const ratio = next / radius, rect = model.getBoundingClientRect();
    const h = radius * Math.tan(model.getFieldOfView() * Math.PI / 360);
    const x = (event.clientX-rect.left-rect.width/2) / (rect.height/2);
    const y = (rect.height/2-event.clientY+rect.top) / (rect.height/2);
    const right = [Math.cos(orbit.theta), 0, -Math.sin(orbit.theta)];
    const up = [-Math.cos(orbit.phi)*Math.sin(orbit.theta), Math.sin(orbit.phi), -Math.cos(orbit.phi)*Math.cos(orbit.theta)];
    const moved = [target.x,target.y,target.z].map((v,i)=>v+(1-ratio)*h*(x*right[i]+y*up[i]));
    zoomGoal = {radius:next,target:{x:moved[0],y:moved[1],z:moved[2]}};
    model.setAttribute('camera-target', moved.map(v=>`${v}m`).join(' '));
    model.setAttribute('camera-orbit', `${orbit.theta}rad ${orbit.phi}rad ${next}m`);
  }, {capture:true, passive:false});
  model.addEventListener('pointerdown', () => {zoomGoal=null;});
  dialog.querySelector('.collection-model-reset').addEventListener('click', () => imageMode ? resetCertificate() : view(current));
  close.addEventListener('click', hide);
  dialog.addEventListener('click', e => {if (e.target === dialog) hide();});
  document.addEventListener('keydown', e => {
    if (!dialog.classList.contains('is-open')) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button, a[href], model-viewer, [tabindex="0"]')].filter(el => !el.hidden && !el.disabled && el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();}
      else if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
    }
  });
})();
