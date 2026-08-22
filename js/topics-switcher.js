(function() {
  'use strict';

  var detail = document.querySelector('.topics-detail');
  if (!detail || !window.fetch || !window.DOMParser) return;

  var requestId = 0;
  var retainedHeight = detail.getBoundingClientRect().height;

  function setSubtitle(text) {
    var subtitle = document.getElementById('subtitle');
    if (!subtitle) return;

    subtitle.setAttribute('data-typed-text', text);
    subtitle.textContent = text;

    var cursor = subtitle.parentElement && subtitle.parentElement.querySelector('.typed-cursor');
    if (cursor) cursor.remove();
  }

  function replaceContent(nextDocument, nextUrl, pushState) {
    var nextDetail = nextDocument.querySelector('.topics-detail');
    if (!nextDetail) throw new Error('Topics detail content is missing');

    var currentSwitcher = detail.querySelector('.topics-switcher');
    var currentResults = detail.querySelector('.topics-results');
    var nextSwitcher = nextDetail.querySelector('.topics-switcher');
    var nextResults = nextDetail.querySelector('.topics-results');

    if (!currentSwitcher || !currentResults || !nextSwitcher || !nextResults) {
      throw new Error('Topics detail structure is incomplete');
    }

    currentSwitcher.replaceWith(nextSwitcher);
    currentResults.replaceWith(nextResults);

    document.title = nextDocument.title;
    var nextSubtitle = nextDocument.getElementById('subtitle');
    if (nextSubtitle) {
      setSubtitle(nextSubtitle.getAttribute('data-typed-text') || nextSubtitle.textContent.trim());
    }

    if (pushState) {
      window.history.pushState({ topicsDetail: true }, '', nextUrl);
    }
  }

  function loadTopic(url, pushState) {
    var currentRequest = ++requestId;
    var scrollLeft = window.scrollX;
    var scrollTop = window.scrollY;
    retainedHeight = Math.max(retainedHeight, detail.getBoundingClientRect().height);
    detail.style.minHeight = retainedHeight + 'px';
    detail.classList.add('is-loading');
    detail.setAttribute('aria-busy', 'true');

    return fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function(response) {
        if (!response.ok) throw new Error('Request failed');
        return response.text();
      })
      .then(function(html) {
        if (currentRequest !== requestId) return;
        var nextDocument = new DOMParser().parseFromString(html, 'text/html');
        replaceContent(nextDocument, url, pushState);
        window.scrollTo(scrollLeft, scrollTop);
        window.requestAnimationFrame(function() {
          window.scrollTo(scrollLeft, scrollTop);
          window.requestAnimationFrame(function() {
            window.scrollTo(scrollLeft, scrollTop);
          });
        });
      })
      .catch(function() {
        window.location.href = url;
      })
      .finally(function() {
        if (currentRequest === requestId) {
          detail.classList.remove('is-loading');
          detail.removeAttribute('aria-busy');
        }
      });
  }

  detail.addEventListener('click', function(event) {
    var link = event.target.closest('.topics-switcher-item');
    if (!link || !detail.contains(link)) return;

    event.preventDefault();
    if (link.classList.contains('active')) return;
    loadTopic(link.href, true);
  });

  window.addEventListener('popstate', function() {
    loadTopic(window.location.href, false);
  });
})();
