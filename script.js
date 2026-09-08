(() => {
  "use strict";

  // ---------- Config ----------
  const FRAME_COUNT = 96;
  const FRAME_PATH = (i) => `frames/frame_${String(i).padStart(4, "0")}.jpg`;
  const BACKGROUND = "#fafafa";
  const EASE = 0.08; // 0..1, lower = smoother/slower catch-up
  const MAX_DISPLAY_SCALE = 0.6; // shrink the product frame to 60% of its fitted size

  // ---------- Elements ----------
  const canvas = document.getElementById("frame-canvas");
  const ctx = canvas.getContext("2d");
  const scrollSection = document.getElementById("story");
  const progressFill = document.getElementById("progress-fill");
  const nav = document.getElementById("nav");
  const captionStart = document.querySelector(".stage-caption--start");
  const captionEnd = document.querySelector(".stage-caption--end");
  const stickyStage = document.querySelector(".sticky-stage");

  // ---------- Reduced motion ----------
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Loader ----------
  const loader = document.createElement("div");
  loader.className = "frame-loader";
  loader.textContent = "Loading…";
  stickyStage.appendChild(loader);

  // ---------- State ----------
  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let targetFrame = 0;   // frame implied by scroll position (0-based float)
  let currentFrame = 0;  // eased frame actually drawn
  let imgW = 0, imgH = 0;
  let rafId = null;

  // ---------- Preload ----------
  function preloadFrames() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i + 1);
      img.onload = () => {
        loadedCount++;
        if (i === 0) {
          imgW = img.naturalWidth;
          imgH = img.naturalHeight;
          resizeCanvas();
          drawFrame(0);
        }
        if (loadedCount === FRAME_COUNT) {
          loader.style.opacity = "0";
          setTimeout(() => loader.remove(), 300);
          if (prefersReducedMotion) {
            drawFrame(FRAME_COUNT - 1);
          }
        }
      };
      images[i] = img;
    }
  }

  // ---------- Canvas sizing (cover fit, background fills any gaps) ----------
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFrame(index) {
    const img = images[Math.round(index)];
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, w, h);

    if (!img || !img.complete || !imgW) return;

    // "contain" fit, capped at native resolution — never upscale past the
    // source frame size — then shrunk further by MAX_DISPLAY_SCALE so the
    // product renders smaller and sharper in the hero.
    const scale = Math.min(w / imgW, h / imgH, 1) * MAX_DISPLAY_SCALE;
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const dx = (w - drawW) / 2;
    const dy = (h - drawH) / 2;

    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  // ---------- Caption opacity based on scroll progress ----------
  function updateCaptions(progress) {
    // Start caption: fully visible 0–8%, fades out by 20%
    const startOpacity = 1 - Math.min(1, Math.max(0, (progress - 0.08) / 0.12));
    captionStart.style.opacity = startOpacity;

    // End caption: fades in from 80–95%
    const endOpacity = Math.min(1, Math.max(0, (progress - 0.8) / 0.15));
    captionEnd.style.opacity = endOpacity;
  }

  // ---------- Scroll -> target frame mapping ----------
  function updateTargetFromScroll() {
    const rect = scrollSection.getBoundingClientRect();
    const total = scrollSection.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    let progress = total > 0 ? scrolled / total : 0;
    progress = Math.min(1, Math.max(0, progress));

    targetFrame = progress * (FRAME_COUNT - 1);
    progressFill.style.width = (progress * 100).toFixed(2) + "%";
    updateCaptions(progress);

    // Nav blur state
    if (window.scrollY > 10) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  }

  // ---------- Animation loop: ease current toward target ----------
  function tick() {
    if (prefersReducedMotion) return; // skip animation loop entirely

    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.01) {
      currentFrame += diff * EASE;
    } else {
      currentFrame = targetFrame;
    }
    drawFrame(currentFrame);
    rafId = requestAnimationFrame(tick);
  }

  // ---------- Events ----------
  window.addEventListener("scroll", updateTargetFromScroll, { passive: true });
  window.addEventListener("resize", () => {
    resizeCanvas();
    updateTargetFromScroll();
  });

  // ---------- Init ----------
  preloadFrames();
  updateTargetFromScroll();
  if (!prefersReducedMotion) {
    rafId = requestAnimationFrame(tick);
  }
})();