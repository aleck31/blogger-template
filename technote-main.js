/**
 * TechNote Blog Engine
 * Independent implementation for Blogger template runtime.
 * License: MIT
 */
const jo = {};

(function TechNoteEngine() {
  'use strict';

  // --- Config from template globals ---
  const cfg = {
    siteUrl: (typeof siteUrl !== 'undefined') ? siteUrl : '',
    currentUrl: (typeof currentUrl !== 'undefined') ? currentUrl : '',
    blogId: (typeof blogId !== 'undefined') ? blogId : '',
    blogTitle: (typeof blogTitle !== 'undefined') ? blogTitle : '',
    separator: (typeof titleSeparator !== 'undefined') ? titleSeparator : ' - ',
    isPreview: (typeof isPreview !== 'undefined') ? isPreview : false,
    autoTOC: (typeof autoTOC !== 'undefined') ? autoTOC : false,
    positionTOC: (typeof positionTOC !== 'undefined') ? positionTOC : false,
    analyticId: (typeof analyticId !== 'undefined') ? analyticId : false,
    caPubAdsense: (typeof caPubAdsense !== 'undefined') ? caPubAdsense.replace(/^\D+/g, '') : false,
    tocTemplate: (typeof toc_temp === 'function') ? toc_temp : false,
    jtCallback: (typeof jtCallback === 'function') ? jtCallback : false
  };

  const adsClientId = cfg.caPubAdsense ? 'ca-pub-' + cfg.caPubAdsense : false;
  const adsDelimiter = (typeof innerAdsDelimiter !== 'undefined') ? innerAdsDelimiter : 'p,br,div';
  const ignoreAds = (typeof ignoreAdsDelimiter !== 'undefined') ? ignoreAdsDelimiter : 'pre,ul,ol,table,blockquote';

  // --- Utility functions ---
  function $(id) { return document.getElementById(id); }
  function $q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $qa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function hasClass(el, cls) { return el.classList.contains(cls); }
  function addClass(el, cls) { el.classList.add(cls); }
  function removeClass(el, cls) { el.classList.remove(cls); }
  function toggleClass(el, cls) { el.classList.toggle(cls); }

  function getParam(name, url) {
    const match = url.match(new RegExp('[?&]' + name + '=([^&#=]*)'));
    return match ? match[1] : null;
  }

  function randomId() { return Math.random().toString(36).slice(7); }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // WebP support detection for image suffix
  let imgSuffix = '-rw';
  (function detectWebP() {
    const img = new Image();
    img.onload = img.onerror = function () {
      if (img.height !== 2) imgSuffix = '';
    };
    img.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  })();

  // --- Image optimizer for Blogger/YouTube thumbnails ---
  function optimizeImage(el) {
    if (el.tagName !== 'IMG') return;
    let src = el.getAttribute('data-src');
    if (!src) return;

    if (/(bp\.blogspot|googleusercontent)/.test(src)) {
      const elW = el.offsetWidth || el.parentElement.offsetWidth || el.parentElement.parentElement.offsetWidth;
      const elH = el.offsetHeight;
      const lastEq = src.lastIndexOf('=') + 1;
      const parts = src.split('/');
      let sizeParam;

      if (hasClass(el.parentElement, 'ratio')) {
        sizeParam = 'w' + elW + imgSuffix + '-h' + elH + '-c';
      } else {
        sizeParam = 's' + (elW < 10 ? (el.parentElement.offsetWidth < 10 ? el.parentElement.parentElement.offsetWidth : el.parentElement.offsetWidth) : elW) + imgSuffix;
      }

      if (/(blogger\.googleusercontent|proxy)/.test(src)) {
        src = lastEq ? src.slice(0, lastEq) + sizeParam : src + '=' + sizeParam;
      } else {
        src = src.replace(parts[parts.length - 2], sizeParam);
      }
      el.setAttribute('data-src', src);
    } else if (/(img\.youtube|i\.ytimg)/.test(src)) {
      src = src.substring(0, src.lastIndexOf('/')) + '/mqdefault.jpg';
      el.setAttribute('data-src', src);
    }
  }

  // --- Header scroll behavior ---
  function initHeader() {
    const header = $('header');
    if (!header) return;
    let lastY = 0;
    let hideTimer;

    window.addEventListener('scroll', function () {
      const y = window.pageYOffset;
      if (y < lastY && hasClass(header, 'header-hidden')) {
        hideTimer = setTimeout(() => removeClass(header, 'header-hidden'), 500);
      } else if (y > lastY && hasClass(header, 'header-animate')) {
        clearTimeout(hideTimer);
        addClass(header, 'header-hidden');
      }
      // Shadow on scroll
      if (y >= 1) addClass(header, 'shadow-sm');
      else removeClass(header, 'shadow-sm');
      lastY = y;
    });
  }

  // --- Back to top button ---
  function initBackToTop() {
    const btn = $('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      if (window.pageYOffset >= 1000) removeClass(btn, 'd-none');
      else addClass(btn, 'd-none');
    });
  }

  // --- Dark mode toggle ---
  function initDarkMode() {
    const toggler = $('dark-toggler');
    if (!toggler) return;
    toggler.addEventListener('click', function (e) {
      e.preventDefault();
      toggleClass(document.documentElement, 'dark-mode');
      try {
        localStorage.setItem('theme', hasClass(document.documentElement, 'dark-mode') ? 'dark' : 'light');
      } catch (e) {}
    });
  }

  // --- Search toggle ---
  function initSearch() {
    const toggle = $('search-toggle');
    const container = $('search-header');
    const header = $('header');
    if (!toggle) return;

    toggle.addEventListener('change', function () {
      updateHeaderAnimate();
      if (this.checked) {
        setTimeout(() => { const input = $('search-input'); if (input) input.focus(); }, 100);
        onClickOutside(container, () => { toggle.checked = false; updateHeaderAnimate(); });
      }
    });
  }

  // --- Navbar mobile toggle ---
  function initNavbar() {
    const toggle = $('navbar-toggle');
    const navbar = $('navbar');
    const header = $('header');
    if (!toggle || !navbar) return;

    toggle.addEventListener('change', function () {
      updateHeaderAnimate();
      if (this.checked) {
        addClass(navbar, 'd-block');
        setTimeout(() => addClass(navbar, 'show'), 100);
        onClickOutside(navbar, () => {
          toggle.checked = false;
          updateHeaderAnimate();
          removeClass(navbar, 'show');
          setTimeout(() => removeClass(navbar, 'd-block'), 300);
        });
      } else {
        removeClass(navbar, 'show');
        setTimeout(() => removeClass(navbar, 'd-block'), 300);
      }
    });
  }

  function updateHeaderAnimate() {
    const header = $('header');
    const searchToggle = $('search-toggle');
    const navToggle = $('navbar-toggle');
    if (!header) return;
    if ((searchToggle && searchToggle.checked) || (navToggle && navToggle.checked)) {
      removeClass(header, 'header-animate');
    } else {
      addClass(header, 'header-animate');
    }
  }

  function onClickOutside(el, callback) {
    function handler(e) {
      if (!el.contains(e.target)) {
        callback();
        document.removeEventListener('click', handler);
      }
    }
    document.addEventListener('click', handler);
  }

  // --- Noscript image unwrapping (for post featured images) ---
  function initNoscriptImages() {
    const noscripts = $qa('.entry-text noscript');
    if (!noscripts.length) return;

    const placeholder = 'src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" loading="lazy" lazyload="true" data-src="$1"';

    for (let i = 0; i < noscripts.length; i++) {
      const ns = noscripts[i];
      const textarea = document.createElement('textarea');
      textarea.innerHTML = ns.innerHTML.replace(/src="(.*?)"/g, placeholder);
      const wrapper = document.createElement('div');
      wrapper.innerHTML = textarea.value;
      if (i === 0) addClass(wrapper, 'feature-image full-width');
      ns.parentElement.insertBefore(wrapper, ns);
    }
    Defer.dom('[lazyload="true"]', 1, 'loaded', optimizeImage, null, { rootMargin: '200%' });
  }

  // --- TOC generation ---
  function initTOC() {
    const postBody = $('post-body');
    if (!postBody || !postBody.firstChild) return;
    if (!cfg.autoTOC || cfg.autoTOC === 'false' || !cfg.tocTemplate) return;

    const headings = postBody.querySelectorAll('h2,h3,h4,h5,h6');
    const tocData = [];

    headings.forEach(h => {
      const id = h.textContent.replace(/[^\w!?]/g, '_').replace(/__/g, '_');
      h.id = id;
      tocData.push({ level: parseInt(h.tagName.replace('H', '')), title: h.textContent, id: id });
    });

    if (!tocData.length) return;

    const anchor = postBody.querySelector(cfg.positionTOC) || postBody.firstChild;
    const tocDiv = document.createElement('div');
    tocDiv.innerHTML = cfg.tocTemplate(tocData).trim();
    if (anchor) anchor.parentElement.insertBefore(tocDiv, anchor);
  }

  // --- In-post ads insertion ---
  function initInPostAds() {
    const postBody = $('post-body');
    const adsContainer = $('ads-post');
    if (!postBody || !adsContainer) return;

    const allElements = postBody.querySelectorAll(adsDelimiter + ',' + ignoreAds);
    const adNodes = adsContainer.childNodes;
    const adCount = adNodes.length;
    const validPositions = [];

    allElements.forEach(el => {
      const parent = el.closest(ignoreAds);
      if (!parent || el === parent) validPositions.push(el);
    });

    for (let i = 0; i < adCount; i++) {
      if (i === adCount - 1) {
        postBody.appendChild(adNodes[0]);
      } else {
        const pos = Math.round(validPositions.length / adCount) * i;
        const ref = i === 0 ? validPositions[0] : (validPositions[pos] && validPositions[pos].nextSibling);
        if (ref) ref.parentElement.insertBefore(adNodes[0], ref);
      }
    }
  }

  // --- Related inline post duplication ---
  function initRelatedInline() {
    const postBody = $('post-body');
    if (!postBody) return;
    const related = $q('.related-posts');
    const inline = $q('.related-inline');
    if (related && inline) {
      inline.innerHTML = related.innerHTML;
      inline.setAttribute('data-no-item', related.getAttribute('data-no-item'));
    }
  }

  // --- Pagination system ---
  function buildPagination(pages, currentPage, totalPages) {
    return { pages, currentPage, totalPages };
  }

  function calcPages(total, current, pageSize, maxButtons) {
    total = parseInt(total); current = parseInt(current);
    pageSize = parseInt(pageSize); maxButtons = parseInt(maxButtons);

    const totalPages = Math.ceil(total / pageSize);
    if (current < 1) current = 1;
    if (current > totalPages) current = totalPages;

    let startPage, endPage;
    if (totalPages <= maxButtons) {
      startPage = 1; endPage = totalPages;
    } else {
      const half = Math.floor(maxButtons / 2);
      const remainder = Math.ceil(maxButtons / 2) - 1;
      if (current <= half) { startPage = 1; endPage = maxButtons; }
      else if (current + remainder >= totalPages) { startPage = totalPages - maxButtons + 1; endPage = totalPages; }
      else { startPage = current - half; endPage = current + remainder; }
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return { totalItems: total, currentPage: current, pageSize, totalPages, startPage, endPage, pages };
  }

  function initPagination(el) {
    if (el.getAttribute('data-pagination') === 'false') {
      removeClass(el, 'visually-hidden');
      return;
    }

    const postsPerPage = el.getAttribute('data-posts');
    const label = el.getAttribute('data-label');
    const encodedLabel = encodeURIComponent(label);
    const feedPath = encodedLabel ? '-/' + encodedLabel + '/' : '';
    const searchPath = encodedLabel ? '/label/' + encodedLabel : '';

    const maxResults = getParam('max-results', cfg.currentUrl) || postsPerPage;
    const currentPage = getParam('page', cfg.currentUrl) || 1;

    Defer.js(cfg.siteUrl + 'feeds/posts/summary/' + feedPath + '?alt=json&callback=jo.pagination_key&max-results=1');

    jo.pagination_key = function (data) {
      const totalPosts = parseInt(data.feed.openSearch$totalResults.$t);
      if (postsPerPage >= totalPosts) return;

      const paging = calcPages(totalPosts, currentPage, maxResults, 5);
      const ul = document.createElement('ul');

      function createBtn(page, label) {
        const li = document.createElement('li');
        const btn = document.createElement('span');
        addClass(btn, 'btn btn-sm rounded-pill jt-icon-center');
        btn.innerHTML = label || page;
        btn.setAttribute('data-page', page);
        if (page == paging.currentPage) {
          addClass(btn, 'jt-btn-primary');
        } else {
          addClass(btn, 'jt-btn-light hover-btn-primary');
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            const p = this.getAttribute('data-page');
            if (p == 1) {
              window.location.href = searchPath ? cfg.siteUrl + 'search' + searchPath + '?max-results=' + postsPerPage + '&page=' + p : cfg.siteUrl;
            } else {
              const startIndex = (p - 1) * postsPerPage;
              Defer.js(cfg.siteUrl + 'feeds/posts/summary/' + feedPath + '?start-index=' + startIndex + '&alt=json&callback=jo.pagination_date&max-results=1');
            }
          });
        }
        li.appendChild(btn);
        return li;
      }

      if (paging.currentPage != 1) {
        ul.appendChild(createBtn(paging.currentPage - 1, '<svg aria-hidden="true" class="jt-icon"><use xlink:href="#i-arrow-l"/></svg>'));
      }
      if (paging.pages.indexOf(1) === -1) ul.appendChild(createBtn(1, '1 . .'));
      paging.pages.forEach(p => ul.appendChild(createBtn(p)));
      if (paging.pages.indexOf(paging.totalPages) === -1) ul.appendChild(createBtn(paging.totalPages, '. . ' + paging.totalPages));
      if (paging.currentPage != paging.totalPages) {
        ul.appendChild(createBtn(paging.currentPage + 1, '<svg aria-hidden="true" class="jt-icon"><use xlink:href="#i-arrow-r"/></svg>'));
      }

      el.innerHTML = '';
      addClass(ul, 'pagination mb-0');
      el.appendChild(ul);
      removeClass(el, 'visually-hidden');
    };

    jo.pagination_date = function (data) {
      const entry = data.feed.entry[0];
      const published = entry.published.$t.substring(0, 19) + entry.published.$t.substring(23, 29);
      const encoded = published.replace('+', '%2B');
      window.location.href = cfg.siteUrl + 'search' + searchPath + '?updated-max=' + encoded + '&max-results=' + maxResults + '&page=' + currentPage;
    };
  }

  // --- Custom posts loader (related, sidebar, sitemap) ---
  jo.loadCustomPosts = function (el) {
    const uid = randomId();
    const labelAttr = el.getAttribute('data-label');
    const title = el.getAttribute('data-title');
    const maxItems = el.getAttribute('data-items');
    const shuffleCount = el.getAttribute('data-shuffle');
    const excludeUrl = el.getAttribute('data-no-item');
    const funcName = el.getAttribute('data-func');
    const callbackName = el.getAttribute('data-callback');
    const fetchCount = excludeUrl ? parseInt(maxItems) + 1 : maxItems;

    const labels = labelAttr || el.innerHTML;
    const labelArr = labels.split(',');
    let feedPath;

    if (labelArr.length > 1) {
      feedPath = labels ? '-/' + encodeURIComponent(labelArr[Math.floor(Math.random() * labelArr.length)]) + '/?' : '?';
    } else {
      feedPath = labels && labels !== 'false' ? '-/' + encodeURIComponent(labels.trim()) + '/?' : '?';
    }

    const callbackKey = 'custom_posts_key_' + uid;
    Defer.js(cfg.siteUrl + 'feeds/posts/summary/' + feedPath + 'alt=json&callback=jo.' + callbackKey + '&max-results=' + fetchCount);

    jo[callbackKey] = function (data) {
      const totalResults = parseInt(data.feed.openSearch$totalResults.$t);
      const categories = data.feed.category;
      if (totalResults <= 0) return;

      const result = { title: title, posts: [], categories: categories };
      const entries = data.feed.entry;
      let count = 0;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const url = entry.link[entry.link.length - 1].href;
        if (count >= maxItems) break;
        if (url === excludeUrl) continue;
        count++;

        const post = {};
        post.grup_id = uid;
        post.url = url;
        post.title = entry.title.$t;
        post.summary = entry.summary.$t.trim();
        post.img = entry.media$thumbnail && entry.media$thumbnail.url;
        post.author = entry.author[0].name.$t;
        post.comment = entry.thr$total && entry.thr$total.$t;
        post.label = entry.category;
        const d = new Date(entry.published.$t);
        post.date = d.getFullYear() + '/' + d.getMonth() + '/' + d.getDate();
        result.posts.push(post);
      }

      const renderFunc = window[funcName];
      if (typeof renderFunc === 'function' && result.posts.length > 0) {
        if (shuffleCount) result.posts = shuffle(result.posts).slice(0, shuffleCount);
        el.innerHTML = renderFunc(result).trim();
        removeClass(el, 'visually-hidden');
        Defer.dom('.lazy-' + uid, 1, 'loaded', optimizeImage);
        if (callbackName && typeof window[callbackName] === 'function') window[callbackName]();
      }
    };
  };

  // --- Post pager title fetcher ---
  function initPostPager(el) {
    const links = el.querySelectorAll('a');
    links.forEach(link => {
      const span = document.createElement('span');
      addClass(span, 'd-block fw-bold pt-2 jt-text-primary');
      link.appendChild(span);
      fetchPageTitle(link.href, span);
    });
  }

  function fetchPageTitle(url, el) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Content-Type', 'text/html');
    xhr.send(null);
    xhr.addEventListener('load', function () {
      const match = xhr.responseText.match(/<title>(.*?)<\/title>/);
      if (match) el.innerHTML = match[1].replace(cfg.separator + cfg.blogTitle, '');
    });
  }

  // --- Comment system ---
  function initComments() {
    const commentBtn = $('comment-button');
    const commentForm = $('threaded-comment-form');
    const commentEditor = $('comment-editor');
    const editorSrc = $('comment-editor-src');
    const commentScript = $('comment-script');
    const replyBtns = $qa('.comment-reply');

    if (!commentEditor) return;

    function loadComment(url) {
      if (url !== editorSrc.href) {
        addClass(commentForm, 'loader');
        editorSrc.href = url;
        commentEditor.src = url;
      }
      if (hasClass(commentForm, 'd-none')) {
        removeClass(commentForm, 'd-none');
        const scriptSrc = commentScript.value.match(/<script.*?src='(.*?)'/);
        if (scriptSrc) {
          Defer.js(scriptSrc[1], 'comment-js', 500, function () {
            BLOG_CMT_createIframe('https://www.blogger.com/rpc_relay.html');
          });
        }
      }
    }

    commentEditor.addEventListener('load', () => removeClass(commentForm, 'loader'));

    if (commentBtn) {
      commentBtn.addEventListener('click', function (e) {
        e.preventDefault();
        loadComment(this.href);
        if (commentForm.parentElement.id !== 'add-comment') {
          $('add-comment').appendChild(commentForm);
        }
      });
    }

    replyBtns.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const commentId = this.getAttribute('data-comment-id');
        loadComment(this.href);
        if (commentForm.parentElement.id !== 'c' + commentId) {
          $('c' + commentId).appendChild(commentForm);
        }
      });
    });
  }

  // --- Contact form ---
  function initContactForms() {
    const forms = $qa('.contact-form-blogger');
    forms.forEach(form => {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        addClass(form, 'loading');

        const formData = new FormData(form);
        let body = 'blogID=' + cfg.blogId;
        formData.forEach((val, key) => { body += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(val); });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.blogger.com/contact-form.do');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(body);
        xhr.onreadystatechange = function () {
          removeClass(form, 'loading');
          if (xhr.readyState === 4 && xhr.status === 200 && xhr.response !== '') {
            try {
              const result = JSON.parse(xhr.responseText.trim());
              if (result && result.details.emailSentStatus === 'true') {
                form.reset();
                removeClass(form, 'send-error');
                addClass(form, 'send-success');
              } else {
                removeClass(form, 'send-success');
                addClass(form, 'send-error');
              }
            } catch (e) {
              removeClass(form, 'send-success');
              addClass(form, 'send-error');
            }
          }
        };
      });
    });
  }

  // --- Deferred loading of Analytics, AdSense, and admin CSS ---
  function initDeferredScripts() {
    function load() {
      document.removeEventListener('mousemove', load);
      document.removeEventListener('touchstart', load);
      document.removeEventListener('scroll', load);

      if (cfg.isPreview) return;

      if (adsClientId) {
        (window.adsbygoogle = window.adsbygoogle || []).push({
          google_ad_client: adsClientId,
          enable_page_level_ads: true,
          overlays: { bottom: true }
        });
        Defer.js('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adsClientId, 'adsbygoogle', 100);
      }

      if (cfg.analyticId && cfg.analyticId !== 'false') {
        Defer.js('https://www.googletagmanager.com/gtag/js?id=' + cfg.analyticId, 'analytics', 100, function () {
          function gtag() { dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', cfg.analyticId);
        });
      }

      if (cfg.jtCallback) cfg.jtCallback();
      if (cfg.blogId) {
        Defer.css('https://www.blogger.com/dyn-css/authorization.css?targetBlogID=' + cfg.blogId);
      }
    }

    document.addEventListener('mousemove', load);
    document.addEventListener('touchstart', load);
    document.addEventListener('scroll', load);
  }

  // --- Page title for paginated pages ---
  function initPageTitle() {
    const page = getParam('page', cfg.currentUrl);
    if (page) {
      document.title = document.title.replace(cfg.separator, cfg.separator + 'Page ' + page + cfg.separator);
    }
  }

  // --- Initialize everything ---
  function init() {
    initHeader();
    initBackToTop();
    initDarkMode();
    initSearch();
    initNavbar();
    initNoscriptImages();
    initRelatedInline();
    initInPostAds();
    initTOC();
    initComments();
    initContactForms();
    initPageTitle();
    initDeferredScripts();

    // Deferred IntersectionObserver-based initialization
    Defer.dom('.lazyload', 1, 'loaded', optimizeImage);
    Defer.dom('#post-pager', 1, null, initPostPager, null, { rootMargin: '200%' });
    Defer.dom('#pagination', 1, null, initPagination, null, { rootMargin: '200%' });
    Defer.dom('.custom-posts', 1, null, jo.loadCustomPosts, null, { rootMargin: '200%' });
  }

  init();
})();
