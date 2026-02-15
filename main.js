// main.js: Handles gallery, infinite scroll, about overlay, and scroll-to-top

// Helper: Shuffle array (Fisher-Yates)
function shuffle(array) {
  let m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

// Responsive image sizing
function getImageWidth() {
  if (window.innerWidth < 600) return window.innerWidth * 0.98;
  if (window.innerWidth < 900) return 400;
  return 500;
}

// Scroll-reveal observer
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

// Gallery logic
let loadedCount = 0;
const BATCH_SIZE = 6;
let images = [];

function loadNextBatch() {
  const gallery = document.getElementById('gallery');
  const width = getImageWidth();
  const toLoad = images.slice(loadedCount, loadedCount + BATCH_SIZE);
  toLoad.forEach(src => {
    if (src.endsWith('.mp4')) {
      const video = document.createElement('video');
      video.className = 'gallery-img';
      video.controls = true;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      // Use <source> for better compatibility
      const source = document.createElement('source');
      source.src = src;
      source.type = 'video/mp4';
      video.appendChild(source);
      // Overlay click for video
      video.addEventListener('click', function(e) {
        e.preventDefault();
        showOverlay('video', src);
      });
      gallery.appendChild(video);
      revealObserver.observe(video);
    } else {
      const img = new Image();
      img.src = src;
      img.className = 'gallery-img';
      img.alt = 'Scimitar Guitar';
      img.addEventListener('click', function(e) {
        e.preventDefault();
        showOverlay('img', src);
      });
      img.onload = () => {
        gallery.appendChild(img);
        revealObserver.observe(img);
      };
    }
  });
  loadedCount += toLoad.length;
}

// Overlay logic
let lastScrollY = 0;
let currentOverlayIndex = -1;

function showOverlay(type, src) {
  lastScrollY = window.scrollY;
  const overlay = document.getElementById('imageOverlay');
  const overlayImg = document.getElementById('overlayImg');
  const overlayVideo = document.getElementById('overlayVideo');
  currentOverlayIndex = images.indexOf(src);
  if (type === 'img') {
    overlayImg.src = src;
    overlayImg.style.display = 'block';
    overlayVideo.style.display = 'none';
    overlayVideo.pause && overlayVideo.pause();
  } else {
    overlayVideo.src = src;
    overlayVideo.style.display = 'block';
    overlayImg.style.display = 'none';
  }
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeOverlay() {
  const overlay = document.getElementById('imageOverlay');
  const overlayVideo = document.getElementById('overlayVideo');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  window.scrollTo({ top: lastScrollY });
  overlayVideo.pause && overlayVideo.pause();
  currentOverlayIndex = -1;
}

function navigateOverlay(direction) {
  if (currentOverlayIndex === -1) return;
  let newIndex = currentOverlayIndex + direction;
  // Load more if near the end
  if (newIndex >= loadedCount - 2 && loadedCount < images.length) loadNextBatch();
  if (newIndex < 0) newIndex = images.length - 1;
  if (newIndex >= images.length) newIndex = 0;
  const src = images[newIndex];
  const type = src.endsWith('.mp4') ? 'video' : 'img';
  currentOverlayIndex = newIndex;
  const overlayImg = document.getElementById('overlayImg');
  const overlayVideo = document.getElementById('overlayVideo');
  if (type === 'img') {
    overlayImg.src = src;
    overlayImg.style.display = 'block';
    overlayVideo.style.display = 'none';
    overlayVideo.pause && overlayVideo.pause();
  } else {
    overlayVideo.src = src;
    overlayVideo.style.display = 'block';
    overlayImg.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('imageOverlay');
  document.getElementById('closeImageOverlay').onclick = closeOverlay;
  document.getElementById('overlayPrev').onclick = () => navigateOverlay(-1);
  document.getElementById('overlayNext').onclick = () => navigateOverlay(1);
  overlay.onclick = function(e) { if (e.target === overlay) closeOverlay(); };

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (currentOverlayIndex === -1) return;
    if (e.key === 'Escape') closeOverlay();
    else if (e.key === 'ArrowLeft') navigateOverlay(-1);
    else if (e.key === 'ArrowRight') navigateOverlay(1);
  });

  // Swipe navigation
  let touchStartX = 0;
  overlay.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  overlay.addEventListener('touchend', function(e) {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      navigateOverlay(diff > 0 ? 1 : -1);
    }
  }, { passive: true });
});

function onScroll() {
  // Infinite scroll
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 200)) {
    if (loadedCount < images.length) loadNextBatch();
  }
  // Show/hide scroll-to-top
  const btn = document.getElementById('scrollTopBtn');
  if (window.scrollY > 200) btn.classList.add('show');
  else btn.classList.remove('show');
  // Hero parallax fade-out
  const hero = document.querySelector('.hero');
  if (hero) {
    const heroH = hero.offsetHeight;
    const progress = Math.min(window.scrollY / heroH, 1);
    hero.style.opacity = 1 - progress;
    hero.style.transform = 'translateY(' + (progress * -60) + 'px)';
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupAboutOverlay() {
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutOverlay = document.getElementById('aboutOverlay');
  const closeAbout = document.getElementById('closeAbout');
  aboutBtn.onclick = () => { aboutOverlay.classList.add('active'); };
  closeAbout.onclick = () => { aboutOverlay.classList.remove('active'); };
  aboutOverlay.onclick = (e) => {
    if (e.target === aboutOverlay) aboutOverlay.classList.remove('active');
  };
}

function setupScrollTopBtn() {
  document.getElementById('scrollTopBtn').onclick = scrollToTop;
}

function onResize() {
  // Adjust image widths on resize
  const width = getImageWidth();
  document.querySelectorAll('.gallery-img').forEach(img => {
    img.style.width = width + 'px';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // Reset scroll position on refresh so gallery animates from the top
  window.scrollTo(0, 0);
  // Load manifest
  const script = document.createElement('script');
  script.src = 'images/guitars/manifest.js';
  script.onload = () => {
    images = shuffle(window.GUITAR_IMAGES.slice());
    loadNextBatch();
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    setupAboutOverlay();
    setupScrollTopBtn();
    // Scroll arrow clicks past the hero
    document.getElementById('scrollArrow').onclick = () => {
      document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
    };
  };
  document.body.appendChild(script);
});
