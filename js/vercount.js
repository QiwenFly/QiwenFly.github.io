/* global Fluid */
(function() {
  'use strict';

  const productionHosts = ['qiwenfly.github.io', 'blog-images-1429245812.cos.ap-beijing.myqcloud.com'];
  if (!productionHosts.includes(window.location.hostname) || window.qiwenVercountStarted) return;
  window.qiwenVercountStarted = true;

  const siteOrigin = 'https://qiwenfly.github.io';
  const pageUrl = siteOrigin + window.location.pathname;
  const cacheKey = 'qiwen-vercount:' + pageUrl;
  const cookieName = 'vercount_uv_qiwenfly_github_io';

  function showCounts(counts) {
    for (const name of ['site_pv', 'site_uv', 'page_pv']) {
      const element = document.getElementById('vercount_value_' + name);
      if (element && Number.isSafeInteger(counts[name]) && counts[name] >= 0) {
        element.textContent = String(counts[name]);
      }
    }
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached) showCounts(cached);
  } catch (error) {
    // Counting still works when browser storage is unavailable.
  }

  if (window.Fluid && Fluid.ctx && Fluid.ctx.dnt) return;

  const isNewUv = !document.cookie.split('; ').includes(cookieName + '=1');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  async function countVisit() {
    try {
      const response = await fetch('https://events.vercount.one/api/v2/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pageUrl, isNewUv: isNewUv }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Vercount HTTP ' + response.status);

      const result = await response.json();
      if (result.status === 'error') throw new Error('Vercount returned an error');
      const counts = result.data || result;
      if (!['site_pv', 'site_uv', 'page_pv'].every(name => Number.isSafeInteger(counts[name]) && counts[name] >= 0)) {
        throw new Error('Vercount returned invalid counters');
      }

      showCounts(counts);
      // Mark UV only after the service confirms the request succeeded.
      if (isNewUv) {
        document.cookie = cookieName + '=1; path=/; max-age=31536000; samesite=lax; secure';
      }
      try {
        localStorage.setItem(cacheKey, JSON.stringify(counts));
      } catch (error) {
        // Cache failure must not trigger another counting request.
      }
    } catch (error) {
      console.warn('Vercount statistics unavailable:', error.message);
    } finally {
      clearTimeout(timeout);
    }
  }

  countVisit();
})();
