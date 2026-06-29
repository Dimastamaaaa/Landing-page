/**
 * type-effects.js — SOUNDFORM Experimental Typography Effects
 *
 * A collection of animation primitives for the typographic-performance
 * concept.  Every function returns a cleanup / teardown function and
 * respects `prefers-reduced-motion`.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Exports:
 *   charStagger(element, options?)   — per-character reveal animation
 *   glitchScramble(element, options?) — hover-triggered text scramble
 *   audioReactive(element, getAnalyserData) — font-weight mapped to amplitude
 *   scrollReveal(selector?)           — IntersectionObserver class toggle
 *   parallax(element, speed?)         — scroll-linked Y offset
 * ──────────────────────────────────────────────────────────────────────
 */

// ─── Shared: reduced-motion check ────────────────────────────────────────────
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ═══════════════════════════════════════════════════════════════════════
//  1. Character Stagger — per-char entrance animation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Wraps each character of `element`'s text content in a span and animates
 * them in one-by-one with a configurable stagger delay.
 *
 * @param {HTMLElement} element  — target element whose textContent will be split
 * @param {object}      options
 * @param {number}      options.staggerMs  — delay between characters (default 40)
 * @param {number}      options.durationMs — animation duration per char (default 600)
 * @param {string}      options.easing     — CSS easing (default snap curve)
 * @param {string}      options.charClass  — class added to each <span>
 * @returns {Function}  cleanup — restores original textContent
 */
export function charStagger(element, options = {}) {
  if (!element) return () => {};

  const {
    staggerMs = 40,
    durationMs = 600,
    easing = 'cubic-bezier(0.25, 1, 0.5, 1)',
    charClass = 'hero__name-char'
  } = options;

  // Preserve original content for cleanup
  const originalHTML = element.innerHTML;
  const text = element.textContent || '';

  // If reduced-motion, just show everything immediately
  if (prefersReducedMotion()) {
    return () => { element.innerHTML = originalHTML; };
  }

  // Build per-char spans
  element.innerHTML = '';
  const chars = text.split('');
  const spans = [];

  chars.forEach((char, i) => {
    const span = document.createElement('span');
    span.className = charClass;
    span.textContent = char === ' ' ? '\u00A0' : char; // preserve whitespace
    span.style.cssText = `
      display: inline-block;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity ${durationMs}ms ${easing}, transform ${durationMs}ms ${easing};
      transition-delay: ${i * staggerMs}ms;
    `;
    element.appendChild(span);
    spans.push(span);
  });

  // Trigger the animation on the next frame so the initial state is painted
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      spans.forEach((span) => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
      });
    });
  });

  // Cleanup: restore original content
  return () => {
    element.innerHTML = originalHTML;
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  2. Glitch Scramble — hover text scramble → resolve
// ═══════════════════════════════════════════════════════════════════════

const GLITCH_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

/**
 * Attaches a hover (or trigger) effect that scrambles an element's text
 * into random characters, then iteratively resolves back to the original
 * over `durationMs`.
 *
 * @param {HTMLElement} element
 * @param {object}      options
 * @param {number}      options.durationMs   — total resolve time (default 400)
 * @param {string}      options.trigger      — 'hover' | 'click' | 'auto' (default hover)
 * @param {number}      options.iterations   — resolve passes (default 8)
 * @returns {Function}  cleanup — removes event listeners
 */
export function glitchScramble(element, options = {}) {
  if (!element) return () => {};

  const {
    durationMs = 400,
    trigger = 'hover',
    iterations = 8
  } = options;

  if (prefersReducedMotion()) return () => {};

  const originalText = element.textContent || '';
  let isAnimating = false;
  let rafId = null;

  function scramble() {
    if (isAnimating) return;
    isAnimating = true;

    const chars = originalText.split('');
    const totalFrames = iterations;
    let frame = 0;
    const startTime = performance.now();
    const frameDuration = durationMs / totalFrames;

    function tick(now) {
      const elapsed = now - startTime;
      frame = Math.floor(elapsed / frameDuration);

      if (frame >= totalFrames) {
        // Fully resolved
        element.textContent = originalText;
        isAnimating = false;
        return;
      }

      // Progressively reveal characters from left to right
      const revealCount = Math.floor((frame / totalFrames) * chars.length);
      let display = '';

      for (let i = 0; i < chars.length; i++) {
        if (i < revealCount) {
          // Already resolved
          display += chars[i];
        } else if (chars[i] === ' ') {
          display += ' ';
        } else {
          // Random glitch character
          display += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }
      }

      element.textContent = display;
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  // Bind trigger
  const handler = () => scramble();

  if (trigger === 'hover') {
    element.addEventListener('mouseenter', handler);
  } else if (trigger === 'click') {
    element.addEventListener('click', handler);
  } else if (trigger === 'auto') {
    // Run once immediately
    scramble();
  }

  // Cleanup
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    element.textContent = originalText;
    element.removeEventListener('mouseenter', handler);
    element.removeEventListener('click', handler);
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  3. Audio-Reactive Font Weight
// ═══════════════════════════════════════════════════════════════════════

/**
 * Runs a rAF loop that reads frequency data from the audio engine's
 * analyser and maps average amplitude (0–255) to font-weight (400–900)
 * via CSS `fontVariationSettings`.
 *
 * @param {HTMLElement} element           — element to modulate
 * @param {Function}    getAnalyserData   — () => Uint8Array of frequency data
 * @param {object}      options
 * @param {number}      options.minWeight — minimum font-weight (default 400)
 * @param {number}      options.maxWeight — maximum font-weight (default 900)
 * @returns {Function}  cleanup — cancels the rAF loop
 */
export function audioReactive(element, getAnalyserData, options = {}) {
  if (!element || typeof getAnalyserData !== 'function') return () => {};
  if (prefersReducedMotion()) return () => {};

  const { minWeight = 400, maxWeight = 900 } = options;
  let rafId = null;
  let running = true;

  function tick() {
    if (!running) return;

    const data = getAnalyserData();
    if (data && data.length > 0) {
      // Compute average amplitude across all frequency bins
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length;

      // Map 0–255 → minWeight–maxWeight
      const weight = Math.round(minWeight + (avg / 255) * (maxWeight - minWeight));
      element.style.fontVariationSettings = `'wght' ${weight}`;
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  // Cleanup
  return () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    // Reset to default weight
    element.style.fontVariationSettings = '';
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  4. Scroll Reveal — IntersectionObserver-based visibility
// ═══════════════════════════════════════════════════════════════════════

/**
 * Observes elements matching `selector` and adds a `visible` class when
 * they scroll into view.  Optionally staggers child elements.
 *
 * @param {string} selector  — CSS selector (default '.section-reveal')
 * @param {object} options
 * @param {number} options.threshold     — visibility ratio to trigger (default 0.1)
 * @param {string} options.visibleClass  — class to add (default 'visible')
 * @param {boolean} options.once         — unobserve after first reveal (default true)
 * @param {string|null} options.staggerChildren — child selector to stagger (optional)
 * @param {number} options.staggerMs     — delay per staggered child (default 80)
 * @returns {Function} cleanup — disconnects observer
 */
export function scrollReveal(selector = '.section-reveal', options = {}) {
  const {
    threshold = 0.1,
    visibleClass = 'visible',
    once = true,
    staggerChildren = null,
    staggerMs = 80
  } = options;

  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return () => {};

  // If reduced-motion, make everything visible immediately
  if (prefersReducedMotion()) {
    elements.forEach((el) => el.classList.add(visibleClass));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(visibleClass);

          // Stagger children if configured
          if (staggerChildren) {
            const children = entry.target.querySelectorAll(staggerChildren);
            children.forEach((child, i) => {
              child.style.transitionDelay = `${i * staggerMs}ms`;
              child.classList.add(visibleClass);
            });
          }

          if (once) observer.unobserve(entry.target);
        }
      });
    },
    { threshold }
  );

  elements.forEach((el) => observer.observe(el));

  // Cleanup
  return () => {
    observer.disconnect();
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  5. Parallax — scroll-linked Y translation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Translates `element` along Y at a fraction of the scroll speed,
 * creating a depth / parallax effect.
 *
 * @param {HTMLElement} element — element to transform
 * @param {number}      speed  — scroll multiplier (default 0.4; 0 = fixed, 1 = normal)
 * @returns {Function}  cleanup — removes scroll listener
 */
export function parallax(element, speed = 0.4) {
  if (!element) return () => {};
  if (prefersReducedMotion()) return () => {};

  let rafId = null;
  let ticking = false;

  function update() {
    const scrollY = window.scrollY || window.pageYOffset;
    const offset = scrollY * speed;
    element.style.transform = `translateY(${offset}px)`;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      rafId = requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Initial position
  update();

  // Cleanup
  return () => {
    window.removeEventListener('scroll', onScroll);
    if (rafId) cancelAnimationFrame(rafId);
    element.style.transform = '';
  };
}
