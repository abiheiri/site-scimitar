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

// ── State ──
let images = [];
let loadedCount = 0;
const BATCH = 6;
let currentIndex = -1;
let lastScrollY = 0;

// ── Scroll-reveal observer ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger the reveal based on visible index
      const delay = Array.from(entry.target.parentElement.children)
        .filter(c => c.classList.contains('gallery-item'))
        .indexOf(entry.target) % 3;
      entry.target.style.transitionDelay = (delay * 0.1) + 's';
      entry.target.classList.add('revealed');
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
  const gallery = document.getElementById('gallery');
  const toLoad = images.slice(loadedCount, loadedCount + BATCH);
  toLoad.forEach((src) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    if (src.endsWith('.mp4')) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.addEventListener('loadeddata', () => video.classList.add('loaded'));
      const source = document.createElement('source');
      source.src = src;
      source.type = 'video/mp4';
      video.appendChild(source);
      item.appendChild(video);
      item.addEventListener('click', () => openLightbox(src));
      gallery.appendChild(item);
      revealObserver.observe(item);
    } else {
      const img = new Image();
      img.alt = 'Scimitar Guitar';
      img.loading = 'lazy';
      img.addEventListener('load', () => img.classList.add('loaded'));
      item.appendChild(img);
      item.addEventListener('click', () => openLightbox(src));
      gallery.appendChild(item);
      revealObserver.observe(item);
      // Set src after appending so layout is stable
      img.src = src;
    }
  });
  loadedCount += toLoad.length;
}

// ── Lightbox ──
function openLightbox(src) {
  lastScrollY = window.scrollY;
  currentIndex = images.indexOf(src);
  showMedia(src);
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
  updateCounter();
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const video = document.getElementById('lightboxVideo');
  lb.classList.remove('active');
  document.body.style.overflow = '';
  window.scrollTo({ top: lastScrollY });
  if (video) video.pause();
  currentIndex = -1;
}

function showMedia(src) {
  const img = document.getElementById('lightboxImg');
  const video = document.getElementById('lightboxVideo');
  if (src.endsWith('.mp4')) {
    video.src = src;
    video.style.display = 'block';
    img.style.display = 'none';
  } else {
    img.src = src;
    img.style.display = 'block';
    video.style.display = 'none';
    video.pause();
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
  document.getElementById('lightboxCounter').textContent =
    (currentIndex + 1) + ' \u2044 ' + images.length;
}

// ── About Panel ──
function openAbout() {
  document.getElementById('aboutPanel').classList.add('open');
  document.getElementById('aboutBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAbout() {
  document.getElementById('aboutPanel').classList.remove('open');
  document.getElementById('aboutBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Scroll Handler ──
function onScroll() {
  const scrollY = window.scrollY;
  const header = document.getElementById('siteHeader');
  const hero = document.getElementById('hero');
  const scrollTopBtn = document.getElementById('scrollTop');

  // Header state
  if (scrollY > 80) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  // Hero parallax
  if (hero) {
    const heroH = hero.offsetHeight;
    const progress = Math.min(scrollY / heroH, 1);
    hero.style.opacity = 1 - progress * 1.2;
    hero.style.transform = 'translateY(' + (progress * -50) + 'px)';
  }

  // Scroll-to-top
  if (scrollY > 400) {
    scrollTopBtn.classList.add('visible');
  } else {
    scrollTopBtn.classList.remove('visible');
  }

  // Infinite scroll
  if ((window.innerHeight + scrollY) >= (document.body.offsetHeight - 300)) {
    if (loadedCount < images.length) loadNextBatch();
  }
}

// ── Init ──
window.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);

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

    // Scroll indicator
    document.getElementById('scrollIndicator').addEventListener('click', () => {
      document.getElementById('gallerySection').scrollIntoView({ behavior: 'smooth' });
    });
  };
  document.body.appendChild(script);

  // About panel
  document.getElementById('navAboutBtn').addEventListener('click', openAbout);
  document.getElementById('aboutClose').addEventListener('click', closeAbout);
  document.getElementById('aboutBackdrop').addEventListener('click', closeAbout);

  // Gallery nav button
  document.getElementById('navGalleryBtn').addEventListener('click', () => {
    document.getElementById('gallerySection').scrollIntoView({ behavior: 'smooth' });
  });

  // Lightbox
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => navigateLightbox(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => navigateLightbox(1));
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
  });

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    if (currentIndex !== -1) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') navigateLightbox(-1);
      else if (e.key === 'ArrowRight') navigateLightbox(1);
    }
    // Close about with Escape
    if (e.key === 'Escape' && document.getElementById('aboutPanel').classList.contains('open')) {
      closeAbout();
    }
  });

  // Swipe support for lightbox
  let touchStartX = 0;
  const lb = document.getElementById('lightbox');
  lb.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) navigateLightbox(diff > 0 ? 1 : -1);
  }, { passive: true });

  // Scroll to top
  document.getElementById('scrollTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
