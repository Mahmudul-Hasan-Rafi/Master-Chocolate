(() => {
  "use strict";

  // ============================================================
  // MASTER CHOCOLATE
  // The original 96-frame product sequence is preserved.
  // New interactions are layered around it.
  // ============================================================

  const FRAME_COUNT = 96;
  const FRAME_PATH = (i) => `frames/frame_${String(i).padStart(4, "0")}.jpg`;
  const BACKGROUND = "#f8f5ef";
  const EASE = 0.08;
  const MAX_DISPLAY_SCALE = 0.6;

  const canvas = document.getElementById("frame-canvas");
  const ctx = canvas.getContext("2d");
  const isMobile = () => window.matchMedia("(max-width: 800px)").matches;
  const scrollSection = document.getElementById("story");
  const progressFill = document.getElementById("progress-fill");
  const nav = document.getElementById("nav");
  const captionStart = document.querySelector(".stage-caption--start");
  const captionMid1 = document.querySelector(".stage-caption--mid1");
  const captionMid2 = document.querySelector(".stage-caption--mid2");
  const captionEnd = document.querySelector(".stage-caption--end");
  const heroLeft = document.querySelector(".hero-word--left");
  const heroRight = document.querySelector(".hero-word--right");
  const stickyStage = document.querySelector(".sticky-stage");
  const cursorGlow = document.querySelector(".cursor-glow");

  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const loader = document.createElement("div");
  loader.className = "frame-loader";
  loader.textContent = "Preparing the reveal";
  stickyStage.appendChild(loader);

  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let targetFrame = 0;
  let currentFrame = 0;
  let imgW = 0;
  let imgH = 0;

  function preloadFrames() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
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
          setTimeout(() => loader.remove(), 350);

          if (prefersReducedMotion) {
            currentFrame = FRAME_COUNT - 1;
            drawFrame(currentFrame);
          }
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) loader.textContent = "Frame sequence unavailable";
      };

      images[i] = img;
    }
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFrame(currentFrame);
  }

  function drawFrame(index) {
    const img = images[Math.round(index)];
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, w, h);

    if (!img || !img.complete || !imgW) return;

    const scale = Math.min(w / imgW, h / imgH, 1) * MAX_DISPLAY_SCALE;
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const dx = (w - drawW) / 2;
    const dy = (h - drawH) / 2;

    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  function fadeInRange(progress, start, peak, end) {
    if (progress < start || progress > end) return 0;
    if (progress < peak) return (progress - start) / (peak - start);
    return 1 - (progress - peak) / (end - peak);
  }

  function updateCaptions(progress) {
    captionStart.style.opacity =
      1 - Math.min(1, Math.max(0, (progress - 0.08) / 0.12));

    captionMid1.style.opacity =
      Math.max(0, Math.min(1, fadeInRange(progress, 0.25, 0.32, 0.42)));

    captionMid2.style.opacity =
      Math.max(0, Math.min(1, fadeInRange(progress, 0.52, 0.61, 0.72)));

    captionEnd.style.opacity =
      Math.min(1, Math.max(0, (progress - 0.79) / 0.15));

    heroLeft.style.transform =
      `translate(${progress * -38}vw, -50%) rotate(${-12 - progress * 7}deg)`;
    heroRight.style.transform =
      `translate(${progress * 38}vw, -50%) rotate(${7 + progress * 8}deg)`;

    heroLeft.style.opacity = String(Math.max(0, 1 - progress * 1.35));
    heroRight.style.opacity = String(Math.max(0, 1 - progress * 1.35));

    const warm = Math.max(0, (progress - 0.48) / 0.52);
    const r = Math.round(248 - warm * 190);
    const g = Math.round(245 - warm * 230);
    const b = Math.round(239 - warm * 232);
    stickyStage.style.background = `rgb(${r},${g},${b})`;

    nav.classList.toggle("dark-mode", !isMobile() && progress > 0.58);
  }

  function updateTargetFromScroll() {
    if (isMobile()) return;
    const rect = scrollSection.getBoundingClientRect();
    const total = scrollSection.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;

    let progress = total > 0 ? scrolled / total : 0;
    progress = Math.min(1, Math.max(0, progress));

    targetFrame = progress * (FRAME_COUNT - 1);
    progressFill.style.width = `${(progress * 100).toFixed(2)}%`;
    updateCaptions(progress);

    nav.classList.toggle("scrolled", window.scrollY > 12);
  }

  function tick() {
    if (isMobile()) { requestAnimationFrame(tick); return; }
    const diff = targetFrame - currentFrame;
    currentFrame = Math.abs(diff) > 0.01 ? currentFrame + diff * EASE : targetFrame;
    drawFrame(currentFrame);

    if (!prefersReducedMotion) requestAnimationFrame(tick);
  }

  // Content reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  // Horizontal collection movement
  const flavorTrack = document.querySelector(".flavor-track");
  const collection = document.querySelector(".collection-section");

  function updateFlavorTrack() {
    if (!flavorTrack || !collection || window.innerWidth < 801) return;

    const rect = collection.getBoundingClientRect();
    const travel = Math.max(0, flavorTrack.scrollWidth - window.innerWidth * 0.92);
    const local = Math.min(
      1,
      Math.max(0, (window.innerHeight - rect.top) / (rect.height + window.innerHeight))
    );

    flavorTrack.style.transform = `translate3d(${-travel * local}px,0,0)`;
  }

  // Break-apart animation
  const breakSection = document.querySelector(".break-section");
  const pieces = [...document.querySelectorAll("#break-bar span")];

  function updateBreakBar() {
    if (!breakSection || !pieces.length) return;

    const rect = breakSection.getBoundingClientRect();
    const p = Math.min(
      1,
      Math.max(0, (window.innerHeight - rect.top) / (rect.height + window.innerHeight))
    );
    const spread = Math.max(0, (p - 0.3) / 0.7);

    pieces.forEach((piece, i) => {
      const direction = i % 2 === 0 ? -1 : 1;
      const x = direction * spread * (35 + i * 12);
      const y = spread * (i % 3 - 1) * 38;
      const r = direction * spread * (8 + i * 4);
      piece.style.transform = `translate3d(${x}px,${y}px,0) rotate(${r}deg)`;
    });
  }

  // Cursor light
  if (cursorGlow && !prefersReducedMotion) {
    window.addEventListener("pointermove", (e) => {
      cursorGlow.style.left = `${e.clientX}px`;
      cursorGlow.style.top = `${e.clientY}px`;
    }, { passive: true });
  } else if (cursorGlow) {
    cursorGlow.style.display = "none";
  }

  let scrollFramePending = false;

  window.addEventListener("scroll", () => {
    updateTargetFromScroll();

    if (!scrollFramePending) {
      scrollFramePending = true;
      requestAnimationFrame(() => {
        updateFlavorTrack();
        updateBreakBar();
        scrollFramePending = false;
      });
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    resizeCanvas();
    updateTargetFromScroll();
    updateFlavorTrack();
    updateBreakBar();
  });

  // Initialize
  if (!isMobile()) preloadFrames();
  nav.classList.remove("dark-mode");
  updateTargetFromScroll();
  updateFlavorTrack();
  updateBreakBar();

  if (!prefersReducedMotion) requestAnimationFrame(tick);
})();
