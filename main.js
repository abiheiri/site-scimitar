// main.js — Scimitar Guitars: Gallery, Lightbox, About Panel, Scroll Effects

// ── Utilities ──
function shuffle(arr) {
  let m = arr.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = arr[m]; arr[m] = arr[i]; arr[i] = t;
  }
  return arr;
}

// Focus trap utility
function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}

// ── State ──
let images = [];
let loadedCount = 0;
const BATCH = 6;
let currentIndex = -1;
let lastScrollY = 0;
let lastFocusedElement = null;
let removeLightboxTrap = null;
let removeAboutTrap = null;

// ── Cached DOM refs (set in init) ──
let elHeader, elHero, elScrollTopBtn, elGallery, elLightbox, elLightboxImg,
    elLightboxVideo, elLightboxClose, elLightboxCounter,
    elAboutPanel, elAboutBackdrop, elAboutClose;

// ── Scroll-reveal observer ──
// Only reveal items that are both in-view AND media-loaded
function tryReveal(item) {
  if (item.dataset.inView === '1' && item.dataset.mediaLoaded === '1') {
    const idx = parseInt(item.dataset.index, 10) || 0;
    item.style.transitionDelay = ((idx % 3) * 0.1) + 's';
    item.classList.add('revealed');
  }
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.dataset.inView = '1';
      tryReveal(entry.target);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

// Gallery header reveal
const headerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      headerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

// ── Gallery ──
function loadNextBatch() {
  const toLoad = images.slice(loadedCount, loadedCount + BATCH);
  toLoad.forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', 'View image ' + (loadedCount + i + 1));
    item.dataset.index = String(loadedCount + i);

    function activate() { openLightbox(src); }
    item.addEventListener('click', activate);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });

    if (src.endsWith('.mp4')) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.addEventListener('loadeddata', () => {
        video.classList.add('loaded');
        item.dataset.mediaLoaded = '1';
        tryReveal(item);
      });
      const source = document.createElement('source');
      source.src = src;
      source.type = 'video/mp4';
      video.appendChild(source);
      item.appendChild(video);
    } else {
      const img = new Image();
      img.alt = 'Scimitar Guitar';
      img.loading = 'lazy';
      img.addEventListener('load', () => {
        img.classList.add('loaded');
        item.dataset.mediaLoaded = '1';
        tryReveal(item);
      });
      item.appendChild(img);
      // Set src after appending so layout is stable
      requestAnimationFrame(() => { img.src = src; });
    }

    elGallery.appendChild(item);
    revealObserver.observe(item);
  });
  loadedCount += toLoad.length;
}

// ── Lightbox ──
function openLightbox(src) {
  lastScrollY = window.scrollY;
  lastFocusedElement = document.activeElement;
  currentIndex = images.indexOf(src);
  showMedia(src);
  elLightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
  updateCounter();
  elLightboxClose.focus();
  removeLightboxTrap = trapFocus(elLightbox);
}

function closeLightbox() {
  elLightbox.classList.remove('active');
  document.body.style.overflow = '';
  window.scrollTo({ top: lastScrollY });
  if (elLightboxVideo) elLightboxVideo.pause();
  currentIndex = -1;
  if (removeLightboxTrap) { removeLightboxTrap(); removeLightboxTrap = null; }
  if (lastFocusedElement) { lastFocusedElement.focus(); lastFocusedElement = null; }
}

function showMedia(src) {
  if (src.endsWith('.mp4')) {
    elLightboxVideo.src = src;
    elLightboxVideo.style.display = 'block';
    elLightboxImg.style.display = 'none';
  } else {
    elLightboxImg.src = src;
    elLightboxImg.style.display = 'block';
    elLightboxVideo.style.display = 'none';
    elLightboxVideo.pause();
  }
}

function navigateLightbox(dir) {
  if (currentIndex === -1) return;
  let next = currentIndex + dir;
  if (next >= loadedCount - 2 && loadedCount < images.length) loadNextBatch();
  if (next < 0) next = images.length - 1;
  if (next >= images.length) next = 0;
  currentIndex = next;
  showMedia(images[next]);
  updateCounter();
}

function updateCounter() {
  elLightboxCounter.textContent =
    (currentIndex + 1) + ' \u2044 ' + images.length;
}

// ── About Panel ──
function openAbout() {
  lastFocusedElement = document.activeElement;
  elAboutPanel.classList.add('open');
  elAboutBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  elAboutClose.focus();
  removeAboutTrap = trapFocus(elAboutPanel);
}

function closeAbout() {
  elAboutPanel.classList.remove('open');
  elAboutBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  if (removeAboutTrap) { removeAboutTrap(); removeAboutTrap = null; }
  if (lastFocusedElement) { lastFocusedElement.focus(); lastFocusedElement = null; }
}

// ── Scroll Handler ──
let ticking = false;
let cachedHeroH = 0;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const scrollY = window.scrollY;

    // Header state
    if (scrollY > 80) {
      elHeader.classList.add('scrolled');
    } else {
      elHeader.classList.remove('scrolled');
    }

    // Hero parallax
    if (elHero) {
      if (!cachedHeroH) cachedHeroH = elHero.offsetHeight;
      const progress = Math.min(scrollY / cachedHeroH, 1);
      elHero.style.opacity = 1 - progress * 1.2;
      elHero.style.transform = 'translateY(' + (progress * -50) + 'px)';
    }

    // Scroll-to-top
    if (scrollY > 400) {
      elScrollTopBtn.classList.add('visible');
    } else {
      elScrollTopBtn.classList.remove('visible');
    }

    // Infinite scroll
    if ((window.innerHeight + scrollY) >= (document.body.offsetHeight - 300)) {
      if (loadedCount < images.length) loadNextBatch();
    }

    ticking = false;
  });
}

// ── Init ──
window.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);

  // Cache DOM references
  elHeader = document.getElementById('siteHeader');
  elHero = document.getElementById('hero');
  elScrollTopBtn = document.getElementById('scrollTop');
  elGallery = document.getElementById('gallery');
  elLightbox = document.getElementById('lightbox');
  elLightboxImg = document.getElementById('lightboxImg');
  elLightboxVideo = document.getElementById('lightboxVideo');
  elLightboxClose = document.getElementById('lightboxClose');
  elLightboxCounter = document.getElementById('lightboxCounter');
  elAboutPanel = document.getElementById('aboutPanel');
  elAboutBackdrop = document.getElementById('aboutBackdrop');
  elAboutClose = document.getElementById('aboutClose');

  // Page entrance
  requestAnimationFrame(() => {
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
  });

  // Load manifest
  const script = document.createElement('script');
  script.src = 'images/guitars/manifest.js';
  script.onload = () => {
    images = shuffle(window.GUITAR_IMAGES.slice());
    loadNextBatch();

    // Observers
    const galleryHeader = document.getElementById('galleryHeader');
    if (galleryHeader) headerObserver.observe(galleryHeader);

    // Scroll
    window.addEventListener('scroll', onScroll, { passive: true });

    // Invalidate cached hero height on resize
    window.addEventListener('resize', () => { cachedHeroH = 0; }, { passive: true });

    // Scroll indicator
    document.getElementById('scrollIndicator').addEventListener('click', () => {
      document.getElementById('gallerySection').scrollIntoView({ behavior: 'smooth' });
    });
  };
  document.body.appendChild(script);

  // About panel
  document.getElementById('navAboutBtn').addEventListener('click', openAbout);
  elAboutClose.addEventListener('click', closeAbout);
  elAboutBackdrop.addEventListener('click', closeAbout);

  // Gallery nav button
  document.getElementById('navGalleryBtn').addEventListener('click', () => {
    document.getElementById('gallerySection').scrollIntoView({ behavior: 'smooth' });
  });

  // Lightbox
  elLightboxClose.addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => navigateLightbox(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => navigateLightbox(1));
  elLightbox.addEventListener('click', (e) => {
    if (e.target === elLightbox) closeLightbox();
  });

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    if (currentIndex !== -1) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') navigateLightbox(-1);
      else if (e.key === 'ArrowRight') navigateLightbox(1);
    }
    // Close about with Escape
    if (e.key === 'Escape' && elAboutPanel.classList.contains('open')) {
      closeAbout();
    }
  });

  // Swipe support for lightbox
  let touchStartX = 0;
  elLightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  elLightbox.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) navigateLightbox(diff > 0 ? 1 : -1);
  }, { passive: true });

  // Scroll to top
  elScrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
