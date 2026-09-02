(function() {
  'use strict';

  var photos = window.GALLERY_PHOTOS || [];
  var wall = document.querySelector('.gallery-photo-wall');
  var lightbox = document.querySelector('.gallery-lightbox');
  if (!wall || !lightbox || !photos.length) return;

  var image = lightbox.querySelector('img');
  var title = lightbox.querySelector('.gallery-lightbox-title');
  var counter = lightbox.querySelector('.gallery-lightbox-counter');
  var factFields = lightbox.querySelectorAll('[data-gallery-fact]');
  var current = 0;

  function show(index) {
    current = (index + photos.length) % photos.length;
    image.src = photos[current].url;
    image.alt = photos[current].caption || '相册照片';
    title.textContent = photos[current].caption || '相册照片';
    counter.textContent = (current + 1) + ' / ' + photos.length;
    factFields.forEach(function(field) {
      var value = photos[current][field.dataset.galleryFact] || '';
      field.textContent = value;
      field.parentElement.hidden = !value;
    });
  }

  function open(index) {
    show(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gallery-lightbox-open');
    lightbox.querySelector('.gallery-lightbox-close').focus();
  }

  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gallery-lightbox-open');
    image.src = '';
  }

  wall.addEventListener('click', function(event) {
    var item = event.target.closest('.gallery-photo');
    if (item) open(Number(item.dataset.index));
  });

  lightbox.querySelector('.gallery-lightbox-close').addEventListener('click', close);
  lightbox.querySelector('.gallery-lightbox-prev').addEventListener('click', function() { show(current - 1); });
  lightbox.querySelector('.gallery-lightbox-next').addEventListener('click', function() { show(current + 1); });
  lightbox.addEventListener('click', function(event) { if (event.target === lightbox) close(); });

  document.addEventListener('keydown', function(event) {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
})();
