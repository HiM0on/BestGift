// Simple reveal behavior and accessibility toggles
const openBtn = document.getElementById('openBtn');
const message = document.getElementById('message');
const confettiCanvas = document.getElementById('confetti-canvas');
const bgMusic = document.getElementById("bgMusic");
// small inline SVG fallbacks (used if user SVG not present in assets/)
const svgs = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l1.1 3.6 3.4-2.1-3.4 4.2 4.2 1.1-4.2 1.1 3.4 4.2-3.4-2.1L12 22l-1.1-3.6-3.4 2.1 3.4-4.2-4.2-1.1 4.2-1.1L10.9 5.6 7.5 7.7 12 2z"/></svg>`
];

// prepared Image() sprites for snow; prepared at load so startSnow can use them
let snowSprites = [];
function prepareSnowSprites(){
  const externalCandidates = [
    'assets/vecteezy_snowflake-icon-vector-illustration-design_4897805.svg',
    'assets/snowflake.svg',
  ];
  snowSprites.length = 0;
  const color = '#8FC6FF'; // bluish tint for snowflakes

  // helper: strip fills and inject a root fill so the SVG renders in our color
  function colorizeSvgText(svgText){
    try{
      // remove explicit fill attributes on elements
      let s = svgText.replace(/fill="[^"]*"/gi, '');
      // remove fill in style attributes (very small attempt)
      s = s.replace(/fill:\s*#[0-9a-fA-F]{3,6};?/gi, '');
      // ensure the <svg ...> tag includes a fill attribute we control
      s = s.replace(/<svg([^>]*)>/i, `<svg$1 fill="${color}">`);
      return s;
    }catch(e){
      return svgText;
    }
  }

  // try to fetch external SVGs and colorize them; if fetch fails, fall back to raw path
  externalCandidates.forEach(path => {
    try{
      fetch(path).then(r=>{
        if(!r.ok) throw new Error('not-found');
        return r.text();
      }).then(text=>{
        const modified = colorizeSvgText(text);
        const im = new Image();
        im.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(modified);
        snowSprites.push(im);
      }).catch(()=>{
        // fallback: push image directly (may retain original colors)
        const im = new Image();
        im.src = path;
        snowSprites.push(im);
      });
    }catch(err){
      const im = new Image();
      im.src = path;
      snowSprites.push(im);
    }
  });

  // then add inline svg fallbacks (colorized)
  svgs.forEach(s => {
    const modified = colorizeSvgText(s);
    const im = new Image();
    im.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(modified);
    snowSprites.push(im);
  });
}

// prepare sprites immediately so they're available when startSnow runs
prepareSnowSprites();

openBtn.addEventListener('click', ()=>{
  // remove focus and any text selection immediately to avoid blue highlight from click
  try{ openBtn.blur(); }catch(e){}
  try{ const s = window.getSelection(); if(s) s.removeAllRanges(); }catch(e){}

  const isHidden = message.getAttribute('aria-hidden') === 'true';
  message.setAttribute('aria-hidden', String(!isHidden));
  openBtn.setAttribute('aria-expanded', String(isHidden));
  if(isHidden){ if (
    bgMusic && bgMusic.paused) {
    bgMusic.volume = 0.35;
    bgMusic.currentTime = 0;
    bgMusic.play();
      }
    // small celebratory visual: briefly pulse the card
    document.querySelector('.card').animate([
      { transform: 'scale(0.995)' },
      { transform: 'scale(1.02)' },
      { transform: 'scale(1)' }
    ],{ duration: 450, easing: 'ease-out' })
  // add reveal class for animation
  document.querySelector('.card').classList.add('revealed');
  // start a gentle snow animation instead of confetti
  startSnow();
  // floating cakes are independent of reveal now (started on load)
    playCelebrateSound();
    // ensure the top of the card is visible after it expands
    // Wait a short moment for layout/animations to settle, then scroll the card
    // into view with a small offset so the top isn't clipped on small screens.
    setTimeout(()=>{
      const card = document.querySelector('.card');
      if(!card) return;
      // give the browser one animation frame to finish layout changes
      requestAnimationFrame(()=>{
        // extra small delay to ensure CSS transitions complete on mobile
        setTimeout(()=>{
          try{
            // First try centering the card in the viewport — this avoids being
            // hidden under browser chrome on many mobile browsers.
            try{ card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }catch(_){}

            // After a short delay (mobile address bar may change layout), try a robust approach:
            // insert a temporary spacer at the top of the document whose height equals
            // the desired offset, then scroll the card to the top. This prevents clipping
            // by browser chrome on many mobile browsers. We remove the spacer after a short time.
            setTimeout(()=>{
              try{
                // compute a safe offset: at least 64px or ~8% of viewport height
                const offset = Math.max(64, Math.round(window.innerHeight * 0.08));
                // Instead of inserting a DOM spacer (which can cause visible layout gaps),
                // set a temporary CSS variable and add a class that applies top padding to the body.
                // This is less janky and still reserves space for mobile browser chrome.
                try{
                  document.body.style.setProperty('--reveal-offset', offset + 'px');
                  document.body.classList.add('reveal-padding');
                }catch(e){}
                // now scroll the card to the top (start)
                try{ card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }catch(_){}
                // remove the temporary padding after the scroll finishes
                setTimeout(()=>{
                  try{ document.body.classList.remove('reveal-padding'); document.body.style.removeProperty('--reveal-offset'); }catch(e){}
                }, 1100);

                // single retry: some mobile browsers hide/show address bar after initial scroll
                // wait a bit and nudge the card into place again if it's still too close to the top
                setTimeout(()=>{
                  try{
                    const rect = card.getBoundingClientRect();
                    if(rect.top < (offset * 0.6)){
                      const target = window.scrollY + rect.top - offset;
                      window.scrollTo({ top: Math.max(0, Math.round(target)), behavior: 'smooth' });
                    }
                  }catch(e){}
                }, 700);
              }catch(e){
                try{ card.scrollIntoView({behavior:'smooth', block:'start'}); }catch(_){ }
              }
            }, 320);

            // make the revealed message focusable and focus it for screen readers
            const msg = document.getElementById('message');
            if(msg){
              msg.setAttribute('tabindex', '-1');
              msg.focus({ preventScroll: false });
            }
          }catch(e){
            // fallback: simple scrollIntoView
            try{ card.scrollIntoView({behavior:'smooth', block:'start'}); }catch(_){ }
          }
        }, 90);
      });
    }, 260);
  }
  else{
    if (bgMusic) {
  bgMusic.pause();
}
    // user closed the message; cakes continue to appear independently
  }
});

// Gallery behavior — auto-detect images named photo1..photo20 in assets/
const thumbsContainer = document.getElementById('thumbs');
const mainPhoto = document.getElementById('mainPhoto');
const fullscreenViewer = document.getElementById("fullscreenViewer");
const fullscreenImage = document.getElementById("fullscreenImage");
const photoFallback = document.querySelector('.photo-fallback');
let photoSrcs = [];
let currentIndex = 0;
const MAX_PHOTOS = 20;

// ===== Swipe support for mobile gallery =====
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 50; // px

function handleSwipe() {
  if (photoSrcs.length <= 1) return;

  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) < SWIPE_THRESHOLD) return;

  if (diff > 0) {
    // swipe left → next image
    const next = (currentIndex + 1) % photoSrcs.length;
    showPhoto(next);
  } else {
    // swipe right → previous image
    const prev =
      (currentIndex - 1 + photoSrcs.length) % photoSrcs.length;
    showPhoto(prev);
  }
}
// ===== Fullscreen image on tap =====

// Open fullscreen on tap
mainPhoto.addEventListener("click", () => {
  if (!mainPhoto.src) return;

  fullscreenImage.src = mainPhoto.src;
  fullscreenViewer.classList.add("active");
  document.body.style.overflow = "hidden";
});

// Close fullscreen on tap
fullscreenViewer.addEventListener("click", () => {
  fullscreenViewer.classList.remove("active");
  document.body.style.overflow = "";
});
// ===== Swipe support inside fullscreen =====
let fsStartX = 0;
let fsEndX = 0;
const FS_SWIPE_THRESHOLD = 60;

fullscreenViewer.addEventListener("touchstart", (e) => {
  fsStartX = e.touches[0].clientX;
}, { passive: true });

fullscreenViewer.addEventListener("touchend", (e) => {
  fsEndX = e.changedTouches[0].clientX;

  const diff = fsStartX - fsEndX;
  if (Math.abs(diff) < FS_SWIPE_THRESHOLD) return;

  if (diff > 0) {
    // swipe left → next
    const next = (currentIndex + 1) % photoSrcs.length;
    showPhoto(next);
    fullscreenImage.src = photoSrcs[next];
  } else {
    // swipe right → previous
    const prev = (currentIndex - 1 + photoSrcs.length) % photoSrcs.length;
    showPhoto(prev);
    fullscreenImage.src = photoSrcs[prev];
  }
});
// Touch events on the main image
mainPhoto.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

mainPhoto.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].clientX;
  handleSwipe();
});
function tryLoadPhotos(){
  let loaded = 0;
  for(let i=1;i<=MAX_PHOTOS;i++){
    const src = `assets/photo${i}.jpg`;
    // try .jpg then .png
    checkImage(src, (ok)=>{
      if(ok){ addPhoto(src); }
      else { // try png
        const srcP = `assets/photo${i}.png`;
        checkImage(srcP, (ok2)=>{ if(ok2) addPhoto(srcP); });
      }
    });
  }
}

function checkImage(src, cb){
  const img = new Image();
  img.onload = ()=> cb(true);
  img.onerror = ()=> cb(false);
  img.src = src;
}

function addPhoto(src){
  if(photoSrcs.includes(src)) return;
  const index = photoSrcs.length;
  photoSrcs.push(src);
  const btn = document.createElement('button');
  btn.className = 'thumb';
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', `Show photo ${index+1}`);
  btn.type = 'button';
  const img = document.createElement('img');
  img.src = src;
  img.alt = `Photo ${index+1}`;
  btn.appendChild(img);
  btn.addEventListener('click', ()=> showPhoto(index));
  thumbsContainer.appendChild(btn);
  // if first photo, show it
  if(photoSrcs.length===1) showPhoto(0);
}

function showPhoto(index){
  if(!photoSrcs[index]){
    mainPhoto.style.display = 'none';
    updateFallbackVisibility();
    return;
  }
  // fade out, then change src so load handler can fade in
  try{
    mainPhoto.style.opacity = 0;
  }catch(e){}
  setTimeout(()=>{
    mainPhoto.src = photoSrcs[index];
    mainPhoto.style.display = 'block';
    // update fallback visibility; actual fade-in happens after load
    updateFallbackVisibility();
    // cakes are independent of photo transitions; do not pause or restart them here
  }, 120);
  // update pressed state
  Array.from(thumbsContainer.children).forEach((btn,i)=> btn.setAttribute('aria-pressed', String(i===index)));
  currentIndex = index;
}

tryLoadPhotos();

// when the mainPhoto loads or errors, toggle the fallback emoji
mainPhoto.addEventListener('load', ()=>{
  // fade in when image is ready
  try{ mainPhoto.style.opacity = 1; }catch(e){}
  updateFallbackVisibility();
});
mainPhoto.addEventListener('error', ()=>{
  mainPhoto.style.display = 'none';
  updateFallbackVisibility();
});

function updateFallbackVisibility(){
  if(!photoFallback) return;
  // show fallback when image is not displayed or has no natural size
  const imgVisible = mainPhoto && mainPhoto.complete && mainPhoto.naturalWidth > 0 && mainPhoto.style.display !== 'none';
  photoFallback.style.display = imgVisible ? 'none' : 'block';
  // no sticker overlay behavior anymore; cake decorations float randomly across the screen
}

// optional autoplay — only when multiple photos exist (faster)
let autoplayInterval = 2000; // 2 seconds
setInterval(()=>{
  if(photoSrcs.length > 1){
    let next = (currentIndex + 1) % photoSrcs.length;
    showPhoto(next);
  }
}, autoplayInterval);

// Basic confetti implementation using canvas
// gentle snow animation
function startSnow(){
  if(!confettiCanvas) return;
  const ctx = confettiCanvas.getContext('2d');
  const W = confettiCanvas.width = window.innerWidth;
  const H = confettiCanvas.height = window.innerHeight;
  const flakes = [];
  const colors = ['rgba(255,255,255,0.95)','rgba(245,250,255,0.9)','rgba(220,235,255,0.85)'];
  const COUNT = Math.floor(Math.min(160, W/6));
  for(let i=0;i<COUNT;i++){
    flakes.push({
      x: Math.random()*W,
      y: Math.random()*-H,
      r: Math.random()*3+1.5,
      vx: (Math.random()-0.5)*0.6,
      vy: Math.random()*0.8+0.6,
      angle: Math.random()*Math.PI*2,
      swing: Math.random()*0.8+0.6,
      color: colors[Math.floor(Math.random()*colors.length)],
      // pick a sprite index; will be used if sprites are available
      spriteIndex: Math.floor(Math.random() * Math.max(1, snowSprites.length))
    });
  }
  let t0 = null;
  function draw(now){
    if(!t0) t0 = now;
    const elapsed = now - t0;
    ctx.clearRect(0,0,W,H);
    flakes.forEach(f=>{
      // horizontal sway
      f.angle += 0.002 + (f.r/10)*0.002;
      f.x += Math.sin(f.angle)*f.swing + f.vx;
      f.y += f.vy;
      // wrap horizontally
      if(f.x > W + 20) f.x = -20;
      if(f.x < -20) f.x = W + 20;
      // draw sprite if available, otherwise draw as soft circle
      if(snowSprites.length > 0){
        const img = snowSprites[f.spriteIndex % snowSprites.length];
        if(img && img.complete && img.naturalWidth > 0){
          const size = Math.max(6, f.r * 4);
          try{
            ctx.drawImage(img, f.x - size/2, f.y - size/2, size, size);
          }catch(e){
            // fallback to circle if drawImage fails
            ctx.beginPath();
            ctx.fillStyle = f.color;
            ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
            ctx.fill();
          }
        } else {
          ctx.beginPath();
          ctx.fillStyle = f.color;
          ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.fillStyle = f.color;
        ctx.globalCompositeOperation = 'source-over';
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
        ctx.fill();
      }
    });
    // stop after ~6s
    if(elapsed < 6000){
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0,0,W,H);
    }
  }
  requestAnimationFrame(draw);
}

// small synthesized celebratory sound using WebAudio with a fallback to an audio file
function _getSharedAudioContext(){
  if(!window.__celebrateAudioCtx){
    try{
      window.__celebrateAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }catch(e){
      window.__celebrateAudioCtx = null;
    }
  }
  return window.__celebrateAudioCtx;
}

function playCelebrateSound(){
  const ctx = _getSharedAudioContext();
  if(ctx){
    // some browsers start the AudioContext in 'suspended' state until a user gesture resumes it
    // resume() returns a promise; we'll resume then play the short tones
    ctx.resume().then(()=>{
      try{
        const now = ctx.currentTime;
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const g = ctx.createGain();
        o1.type = 'sine'; o2.type = 'square';
        o1.frequency.setValueAtTime(660, now);
        o2.frequency.setValueAtTime(880, now);
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        o1.connect(g); o2.connect(g); g.connect(ctx.destination);
        o1.start(now); o2.start(now);
        o1.stop(now + 1.2); o2.stop(now + 1.2);
      }catch(err){
        // if anything fails, fall back to audio file player below
        _playAudioFileFallback();
      }
    }).catch(()=>{
      // resume rejected (autoplay policy); try file fallback
      _playAudioFileFallback();
    });
  } else {
    // no WebAudio support, try file fallback
    _playAudioFileFallback();
  }
}

function _playAudioFileFallback(){
  try{
    const a = new Audio('assets/confetti.mp3');
    a.volume = 0.85;
    a.play().catch(()=>{
      // suppressed by browser autoplay policy or missing file
    });
  }catch(e){
    // nothing else we can do
  }
}

// keyboard shortcut: press Enter/Space on focused button is default; add 's' to open
window.addEventListener('keydown', (e)=>{
  if(e.key.toLowerCase()==='s'){
    openBtn.click();
  }
});

// initialize fallback visibility on load
updateFallbackVisibility();

// Floating cake decorations: spawn small cake emoji elements at random positions
// Inline SVG options for cakes. Each SVG uses 1em sizing so we can scale via font-size.
const cakeSvgs = [
  // Simple single-layer cake with candle
  `<svg viewBox="0 0 64 64" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
     <rect x="8" y="30" width="48" height="18" rx="4" fill="var(--cake-fill, #fff)" />
     <path d="M8 36c8 6 24 6 24 6s16 0 24-6" fill="var(--cake-icing, #ffd5e0)" />
     <rect x="30" y="12" width="4" height="10" rx="1" fill="var(--candle, #ffcc4d)" />
   </svg>`,
  // Cupcake
  `<svg viewBox="0 0 64 64" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
     <path d="M12 32c4-14 44-14 52 0-4 8-8 18-26 18S20 40 12 32z" fill="var(--cake-icing, #ffd5e0)" />
     <rect x="14" y="36" width="36" height="12" rx="3" fill="var(--cake-fill, #fff)" />
   </svg>`,
  // Slice of cake
  `<svg viewBox="0 0 64 64" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
     <polygon points="8,56 56,56 24,12" fill="var(--cake-fill, #fff)" />
     <path d="M18 36c6-6 18-6 24 0v8H18v-8z" fill="var(--cake-icing, #ffd5e0)" />
   </svg>`,
  // Layered cake with cherry
  `<svg viewBox="0 0 64 64" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
     <rect x="10" y="28" width="44" height="10" rx="3" fill="var(--cake-fill, #fff)" />
     <rect x="10" y="38" width="44" height="10" rx="3" fill="var(--cake-fill, #fff)" />
     <path d="M10 28c8-6 36-6 44 0" fill="var(--cake-icing, #ffd5e0)" />
     <circle cx="44" cy="20" r="4" fill="var(--cherry, #e23d6b)" />
   </svg>`
];

function spawnFloatingCake(){
  try{
    const el = document.createElement('div');
    el.className = 'floating-cake';
  // random size (controls font-size so SVGs sized with 1em scale)
  // make cakes a bit larger on average to improve visibility
  const size = Math.floor(Math.random()*22) + 20; // 20-41px
    el.style.fontSize = size + 'px';
  // set a soft colored background circle size relative to emoji (reduced by 20%)
  // previous multiplier was ~1.4; reduce by 20% -> 1.12
  const bgSize = Math.max(18, Math.round(size * 1.12)) + 'px';
    el.style.setProperty('--bg-size', bgSize);
    // choose colors for cake fills and accents
    const cakeFillOptions = ['#fff6f8','#fff7ea','#f3fbff','#faf2ff','#f6fff7'];
    const icingOptions = ['#ffd5e0','#ffe7c9','#cfe8ff','#e9d6ff','#dfffe8'];
    const cherryOptions = ['#e23d6b','#d84e6b','#c23a56'];
    const fill = cakeFillOptions[Math.floor(Math.random()*cakeFillOptions.length)];
    const icing = icingOptions[Math.floor(Math.random()*icingOptions.length)];
    const cherry = cherryOptions[Math.floor(Math.random()*cherryOptions.length)];
    el.style.setProperty('--cake-fill', fill);
    el.style.setProperty('--cake-icing', icing);
    el.style.setProperty('--cherry', cherry);
    // pick an SVG type and insert it
    const svg = cakeSvgs[Math.floor(Math.random() * cakeSvgs.length)];
    el.innerHTML = svg;
    // position inside viewport with small margins
    const left = 6 + Math.random()*88; // percent
    const top = 6 + Math.random()*80; // percent
    el.style.left = left + '%';
    el.style.top = top + '%';
    // random rotation
  // random initial rotation between -30 and 30deg
  const rot = (Math.random()*60) - 30;
  // random rotation delta during animation between -40 and 40deg
  const drot = (Math.random()*80) - 40;
  // random horizontal drift: start and end offsets (px)
  const dxStart = Math.round((Math.random()*80) - 40); // -40..+40px
  const dxEnd = Math.round((Math.random()*140) - 70); // -70..+70px
  el.style.transform = `translate(-50%,0)`; // baseline; rotation handled by animation variables
  el.style.setProperty('--rot', rot + 'deg');
  el.style.setProperty('--drot', drot + 'deg');
  el.style.setProperty('--dx', dxStart + 'px');
  el.style.setProperty('--dxEnd', dxEnd + 'px');
  // random float duration (longer-lived: 4-8s)
  const dur = (Math.random()*4) + 4; // 4-8s
  el.style.animation = `cakeFloatVar ${dur}s ease-in forwards`;
    document.body.appendChild(el);
    // remove shortly after animation ends to avoid abrupt clipping
    setTimeout(()=>{ try{ el.remove(); }catch(e){} }, (dur*1000) + 1200);
  }catch(e){/* ignore */}
}

// schedule cakes at slightly random intervals to feel natural
let _cakeTimer = null;
function scheduleNextCake(){
  // slightly reduced frequency so cakes appear a bit less: 300ms - 900ms
  const delay = 300 + Math.random()*600;
  _cakeTimer = setTimeout(()=>{
    // lower chance of bursts and smaller bursts: sometimes spawn 1-2 cakes
    const burst = Math.random() < 0.22 ? (1 + Math.floor(Math.random()*2)) : 1;
    for(let i=0;i<burst;i++){
      // slight staggering within the burst
      setTimeout(()=>{ try{ spawnFloatingCake(); }catch(e){} }, i * 140);
    }
    scheduleNextCake();
  }, delay);
}

// start spawning cakes only when the surprise is revealed to avoid flicker on load
function startCakes(){
  // avoid double-scheduling
  if(_cakeTimer) return;
  scheduleNextCake();
}

function stopCakes(){
  try{ if(_cakeTimer) clearTimeout(_cakeTimer); }catch(e){}
  _cakeTimer = null;
  // also remove any existing floating cakes immediately
  try{ document.querySelectorAll('.floating-cake').forEach(el=>el.remove()); }catch(e){}
}

// Start the cake scheduler on load so cakes appear independently of user actions
try{ startCakes(); }catch(e){}
