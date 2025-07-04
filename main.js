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
      video.style.width = width + 'px';
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
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'gallery-img';
      img.style.width = width + 'px';
      img.loading = 'lazy';
      img.alt = 'Scimitar Guitar';
      // Overlay click for image
      img.addEventListener('click', function(e) {
        e.preventDefault();
        showOverlay('img', src);
      });
      gallery.appendChild(img);
    }
  });
  loadedCount += toLoad.length;
}

// Overlay logic
let lastScrollY = 0;
function showOverlay(type, src) {
  lastScrollY = window.scrollY;
  const overlay = document.getElementById('imageOverlay');
  const overlayImg = document.getElementById('overlayImg');
  const overlayVideo = document.getElementById('overlayVideo');
  if (type === 'img') {
    overlayImg.src = src;
    overlayImg.style.display = 'block';
    overlayVideo.style.display = 'none';
  } else {
    overlayVideo.src = src;
    overlayVideo.style.display = 'block';
    overlayImg.style.display = 'none';
  }
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('imageOverlay');
  const closeBtn = document.getElementById('closeImageOverlay');
  closeBtn.onclick = function() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    window.scrollTo({ top: lastScrollY });
    // Pause video if open
    const overlayVideo = document.getElementById('overlayVideo');
    overlayVideo.pause && overlayVideo.pause();
  };
  overlay.onclick = function(e) {
    if (e.target === overlay) closeBtn.onclick();
  };
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
  };
  document.body.appendChild(script);
});
