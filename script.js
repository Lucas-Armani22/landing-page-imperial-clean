(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Footer year
  --------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     2. WhatsApp links — build correctly encoded pre-filled text
  --------------------------------------------------------- */
  document.querySelectorAll('[data-wa-msg]').forEach(function (el) {
    var base = el.getAttribute('href').split('?')[0];
    var msg = el.getAttribute('data-wa-msg');
    el.setAttribute('href', base + '?text=' + encodeURIComponent(msg));
  });

  /* ---------------------------------------------------------
     3. Header — background on scroll
  --------------------------------------------------------- */
  var header = document.getElementById('siteHeader');
  function updateHeader() {
    if (window.scrollY > 24) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* ---------------------------------------------------------
     4. Mobile nav toggle
  --------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');

  function closeNav() {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function openNav() {
    mainNav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  navToggle.addEventListener('click', function () {
    var isOpen = mainNav.classList.contains('is-open');
    if (isOpen) closeNav(); else openNav();
  });

  mainNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ---------------------------------------------------------
     5. Active section indicator in nav
  --------------------------------------------------------- */
  var navLinks = document.querySelectorAll('.nav-link[data-nav]');
  var sections = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute('href').replace('#', '');
    var section = document.getElementById(id);
    if (section) sections.push({ id: id, el: section, link: link });
  });

  function updateActiveNav() {
    var scrollPos = window.scrollY + window.innerHeight * 0.35;
    var current = sections[0];
    sections.forEach(function (s) {
      if (s.el.offsetTop <= scrollPos) current = s;
    });
    navLinks.forEach(function (l) { l.classList.remove('is-active'); });
    if (current) current.link.classList.add('is-active');
  }
  if (sections.length) {
    updateActiveNav();
    window.addEventListener('scroll', updateActiveNav, { passive: true });
  }

  /* ---------------------------------------------------------
     6. Scroll cue — jump to next section
  --------------------------------------------------------- */
  var scrollCue = document.getElementById('scrollCue');
  if (scrollCue) {
    scrollCue.addEventListener('click', function () {
      var target = document.querySelector('.trust-bar');
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     7. Reveal on scroll (IntersectionObserver)
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          var el = entry.target;
          setTimeout(function () { el.classList.add('is-visible'); }, (i % 4) * 70);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------
     8. Trust bar counters
  --------------------------------------------------------- */
  var counters = document.querySelectorAll('[data-count-to]');
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
    if (prefersReducedMotion) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = value.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    var counterIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { counterIo.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------------------------------------------------------
     9. Before / After slider (pure JS drag, mouse + touch + keyboard)
  --------------------------------------------------------- */
  var baFrame = document.getElementById('baSlider');
  var baHandle = document.getElementById('baHandle');
  var baBefore = document.getElementById('baBefore');

  if (baFrame && baHandle && baBefore) {
    var frameEl = baFrame.querySelector('.ba-frame');
    var dragging = false;

    function setPosition(percent) {
      percent = Math.max(0, Math.min(100, percent));
      baBefore.style.clipPath = 'inset(0 ' + (100 - percent) + '% 0 0)';
      baHandle.style.left = percent + '%';
      baHandle.setAttribute('aria-valuenow', Math.round(percent));
    }

    function percentFromEvent(clientX) {
      var rect = frameEl.getBoundingClientRect();
      var x = clientX - rect.left;
      return (x / rect.width) * 100;
    }

    function onMove(clientX) {
      setPosition(percentFromEvent(clientX));
    }

    baHandle.addEventListener('mousedown', function (e) {
      dragging = true;
      e.preventDefault();
    });
    frameEl.addEventListener('mousedown', function (e) {
      dragging = true;
      onMove(e.clientX);
    });
    window.addEventListener('mousemove', function (e) {
      if (dragging) onMove(e.clientX);
    });
    window.addEventListener('mouseup', function () { dragging = false; });

    frameEl.addEventListener('touchstart', function (e) {
      dragging = true;
      onMove(e.touches[0].clientX);
    }, { passive: true });
    frameEl.addEventListener('touchmove', function (e) {
      if (dragging) onMove(e.touches[0].clientX);
    }, { passive: true });
    frameEl.addEventListener('touchend', function () { dragging = false; });

    baHandle.addEventListener('keydown', function (e) {
      var current = parseFloat(baHandle.style.left) || 50;
      if (e.key === 'ArrowLeft') { setPosition(current - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPosition(current + 5); e.preventDefault(); }
    });

    setPosition(50);
  }

  /* ---------------------------------------------------------
     10. Gallery lightbox
  --------------------------------------------------------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  var lightbox = document.getElementById('lightbox');
  var lightboxLabel = document.getElementById('lightboxLabel');
  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxPrev = document.getElementById('lightboxPrev');
  var lightboxNext = document.getElementById('lightboxNext');
  var currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    lightboxLabel.textContent = galleryItems[index].getAttribute('data-caption') || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
  function showRelative(delta) {
    currentIndex = (currentIndex + delta + galleryItems.length) % galleryItems.length;
    lightboxLabel.textContent = galleryItems[currentIndex].getAttribute('data-caption') || '';
  }

  galleryItems.forEach(function (item, index) {
    item.addEventListener('click', function () { openLightbox(index); });
  });
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', function () { showRelative(-1); });
  if (lightboxNext) lightboxNext.addEventListener('click', function () { showRelative(1); });
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  window.addEventListener('keydown', function (e) {
    if (lightbox && !lightbox.hidden) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showRelative(-1);
      if (e.key === 'ArrowRight') showRelative(1);
    }
  });

})();
