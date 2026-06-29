/**
 * app.js — DELLATEPE Application Entry Point
 *
 * Ties every module together. Loaded as <script type="module" src="js/app.js">.
 *
 * Responsibilities:
 *   1. Fetch artist details and tracks list from local API server (fallback to local mock data)
 *   2. Populate DOM from active data
 *   3. Initialise audio engine + player UI
 *   4. Wire up typography effects (char stagger, glitch, audio-reactive, parallax)
 *   5. Set up scroll reveals, CTA behaviour, marquee, lyric texture
 *   6. Initialise contact form
 */

// ─── Module imports ──────────────────────────────────────────────────────────
import { ARTIST as MOCK_ARTIST, TRACKS as MOCK_TRACKS, FEATURED_LYRIC } from './mock-data.js';
import { AudioEngine } from './audio-engine.js';
import {
  charStagger,
  glitchScramble,
  audioReactive,
  scrollReveal,
  parallax
} from './type-effects.js';
import { initPlayerUI } from './player-ui.js';
import { initContactForm } from './contact-form.js';

// Active state values (dynamic fallback)
let activeArtist = MOCK_ARTIST;
let activeTracks = MOCK_TRACKS;

// ─── Cleanup registry ────────────────────────────────────────────────────────
const cleanups = [];

// ─── Helper: format seconds → mm:ss ─────────────────────────────────────────
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Helper: safe DOM query ──────────────────────────────────────────────────
function $(selector) {
  return document.querySelector(selector);
}

// ═══════════════════════════════════════════════════════════════════════
//  1. Populate Dynamic Content
// ═══════════════════════════════════════════════════════════════════════

function populateContent() {
  // ── Hero section ──────────────────────────────────────────────────
  const heroName = $('#hero-name');
  if (heroName) heroName.textContent = activeArtist.name;

  const heroTagline = $('#hero-tagline');
  if (heroTagline) heroTagline.textContent = activeArtist.tagline;

  // ── Tracklist ─────────────────────────────────────────────────────
  const tracklistContainer = $('#tracklist-items');
  if (tracklistContainer) {
    tracklistContainer.innerHTML = activeTracks
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((track, i) => `
        <div class="tracklist__item section-reveal" data-track-index="${i}" data-track-id="${track.id}" role="listitem">
          <span class="tracklist__number">${String(i + 1).padStart(2, '0')}</span>
          <span class="tracklist__title">${track.title}</span>
          <span class="tracklist__duration">${formatDuration(track.duration)}</span>
          <button class="tracklist__play-btn" aria-label="Play ${track.title}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      `)
      .join('');
  }

  // ── About section — only update text content, keep SVG icons ─────
  const aboutBio = $('#about-bio');
  if (aboutBio) aboutBio.textContent = activeArtist.bio;

  const aboutCity = $('#about-city');
  if (aboutCity) aboutCity.textContent = activeArtist.city || 'Jakarta, Indonesia';

  const aboutQuote = $('#about-quote');
  if (aboutQuote) aboutQuote.textContent = activeArtist.quote || '"Ada sesuatu yang perlu dikatakan lewat bunyi."';

  // Photo URL update if available
  const aboutPhoto = $('#about-photo');
  if (aboutPhoto && activeArtist.photoUrl) {
    aboutPhoto.src = activeArtist.photoUrl.startsWith('/') ? activeArtist.photoUrl.substring(1) : activeArtist.photoUrl;
  }

  // Genres — supporting list format name in schema (genre vs genres)
  const aboutGenres = $('#about-genres');
  if (aboutGenres) {
    const genresList = activeArtist.genre || activeArtist.genres || [];
    aboutGenres.innerHTML = genresList
      .map((g) => `<span class="about__genre-tag">${g}</span>`)
      .join('');
  }

  // Note: Social links are already in the HTML with nice SVG icons,
  // so we DON'T overwrite them here.

  // ── Lyric pull-quote section ──────────────────────────────────────
  const lyricQuoteText = $('#lyric-quote-text');
  if (lyricQuoteText) {
    // Show lyric from the first track if available, or featured lyric fallback
    const leadLyrics = activeTracks.length > 0 ? activeTracks[0].lyrics : null;
    lyricQuoteText.textContent = leadLyrics || FEATURED_LYRIC;
  }

  // ── Marquee content (genres + moods as ticker) ────────────────────
  const marqueeContent = $('#marquee-content');
  if (marqueeContent) {
    const genresList = activeArtist.genre || activeArtist.genres || [];
    const items = [
      ...genresList,
      ...activeTracks.flatMap((t) => t.mood || [])
    ];
    // Deduplicate and uppercase
    const unique = [...new Set(items.map((s) => s.toUpperCase()))];
    // Build marquee items with separators
    const separator = '<span class="marquee__separator">·</span>';
    const itemsHTML = unique.map(item =>
      `<span class="marquee__item">${item}</span>`
    ).join(separator);
    // Duplicate for seamless loop
    marqueeContent.innerHTML = itemsHTML + separator + itemsHTML + separator + itemsHTML;
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  2. Audio Engine + Player UI
// ═══════════════════════════════════════════════════════════════════════

let engine;
let playerUI;

function initAudio() {
  engine = new AudioEngine();
  
  // Connect server-loaded audio URLs to backend host if they are relative
  const backendPlaylist = activeTracks.map(track => {
    let audioUrl = track.audioUrl;
    if (audioUrl && audioUrl.startsWith('/public/uploads')) {
      audioUrl = `http://localhost:5000${audioUrl}`;
    }
    return {
      ...track,
      audioUrl
    };
  });

  engine.loadPlaylist(backendPlaylist);

  playerUI = initPlayerUI(engine);
  cleanups.push(() => {
    playerUI.destroy();
    engine.destroy();
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  3. Hero Animations
// ═══════════════════════════════════════════════════════════════════════

function initHeroAnimations() {
  const heroName = $('#hero-name');
  if (!heroName) return;

  // Character stagger entrance
  const cleanupStagger = charStagger(heroName, {
    staggerMs: 40,
    durationMs: 600,
    charClass: 'hero__name-char'
  });
  cleanups.push(cleanupStagger);

  // Audio-reactive font weight (connected to engine's analyser)
  const cleanupReactive = audioReactive(
    heroName,
    () => engine.getAnalyserData(),
    { minWeight: 400, maxWeight: 900 }
  );
  cleanups.push(cleanupReactive);

  // Parallax on scroll (name moves at 40% scroll speed)
  const cleanupParallax = parallax(heroName, 0.4);
  cleanups.push(cleanupParallax);
}

// ═══════════════════════════════════════════════════════════════════════
//  4. Tracklist Interactions
// ═══════════════════════════════════════════════════════════════════════

function initTracklist() {
  const tracklistContainer = $('#tracklist-items');
  if (!tracklistContainer) return;

  // ── Glitch scramble on each track title ─────────────────────────
  const titles = tracklistContainer.querySelectorAll('.tracklist__title');
  titles.forEach((titleEl) => {
    const cleanupGlitch = glitchScramble(titleEl, {
      durationMs: 400,
      trigger: 'hover',
      iterations: 8
    });
    cleanups.push(cleanupGlitch);
  });

  // ── Click handler: play the clicked track ───────────────────────
  function onTrackClick(e) {
    const row = e.target.closest('.tracklist__item');
    if (!row) return;

    const index = parseInt(row.dataset.trackIndex, 10);
    if (!isNaN(index)) {
      engine.play(index);
    }
  }

  tracklistContainer.addEventListener('click', onTrackClick);
  cleanups.push(() => tracklistContainer.removeEventListener('click', onTrackClick));

  // ── Update active state on track change ─────────────────────────
  const unsubscribe = engine.onStateChange((state) => {
    if (state.event !== 'trackChange') return;

    const rows = tracklistContainer.querySelectorAll('.tracklist__item');
    rows.forEach((row) => {
      const idx = parseInt(row.dataset.trackIndex, 10);
      row.classList.toggle('active', idx === state.index);
    });
  });
  cleanups.push(unsubscribe);
}

// ═══════════════════════════════════════════════════════════════════════
//  5. CTA Button
// ═══════════════════════════════════════════════════════════════════════

function initCTA() {
  const ctaBtn = $('#hero-cta');
  if (!ctaBtn) return;

  function onCTA(e) {
    e.preventDefault();

    // Start playing the first track
    engine.play(0);

    // Smooth-scroll to the tracklist section
    const tracklist = $('#tracklist');
    if (tracklist) {
      tracklist.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ctaBtn.addEventListener('click', onCTA);
  cleanups.push(() => ctaBtn.removeEventListener('click', onCTA));
}

// ═══════════════════════════════════════════════════════════════════════
//  6. Scroll Reveals
// ═══════════════════════════════════════════════════════════════════════

function initScrollReveals() {
  // Main section reveals
  const cleanupSections = scrollReveal('.section-reveal', {
    threshold: 0.1,
    once: true
  });
  cleanups.push(cleanupSections);
}

// ═══════════════════════════════════════════════════════════════════════
//  7. Marquee Speed (BPM-reactive)
// ═══════════════════════════════════════════════════════════════════════

function initMarquee() {
  const marqueeContent = $('#marquee-content');
  if (!marqueeContent) return;

  // Default animation duration
  const baseDuration = 30; // seconds for one full scroll cycle

  /** Update marquee speed based on current track's BPM. */
  function updateSpeed(track) {
    if (!track) return;
    // Faster BPM → faster marquee (inversely scale duration)
    const bpmRatio = 100 / (track.bpm || 100);
    const duration = baseDuration * bpmRatio;
    marqueeContent.style.animationDuration = `${duration}s`;
  }

  const unsubscribe = engine.onStateChange((state) => {
    if (state.event === 'trackChange' || state.event === 'play') {
      updateSpeed(state.track || engine.currentTrack);
    }
  });
  cleanups.push(unsubscribe);
}

// ═══════════════════════════════════════════════════════════════════════
//  8. Lyric Texture Background
// ═══════════════════════════════════════════════════════════════════════

function initLyricTexture() {
  const textureEl = $('#lyric-texture');
  if (!textureEl) return;

  // Collect all lyrics into one long string
  const allLyrics = activeTracks
    .map((t) => t.lyrics)
    .filter(Boolean)
    .join(' · ');

  // Fill the element with repeated tiny lyrics text
  const repeated = new Array(30).fill(allLyrics).join('  ');
  textureEl.textContent = repeated;
}

// ═══════════════════════════════════════════════════════════════════════
//  9. Contact Form
// ═══════════════════════════════════════════════════════════════════════

function initContact() {
  const { destroy } = initContactForm();
  cleanups.push(destroy);
}

// ═══════════════════════════════════════════════════════════════════════
//  9.5 Theme Toggle
// ═══════════════════════════════════════════════════════════════════════

function initThemeToggle() {
  const toggleBtn = $('#theme-toggle');
  if (!toggleBtn) return;

  function toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

    if (nextTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('dellatepe_theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('dellatepe_theme', 'dark');
    }
  }

  toggleBtn.addEventListener('click', toggle);
  cleanups.push(() => toggleBtn.removeEventListener('click', toggle));
}

// ═══════════════════════════════════════════════════════════════════════
//  9.6 Scroll to Top Button
// ═══════════════════════════════════════════════════════════════════════

function initScrollToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  function onScroll() {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }

  function onClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('scroll', onScroll);
  btn.addEventListener('click', onClick);

  cleanups.push(() => {
    window.removeEventListener('scroll', onScroll);
    btn.removeEventListener('click', onClick);
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  9.7 Collapsible Tracklist for Long Playlists
// ═══════════════════════════════════════════════════════════════════════

function initTracklistCollapse() {
  const tracklistContainer = $('#tracklist-items');
  const toggleWrapper = $('#tracklist-toggle-wrapper');
  const toggleBtn = $('#tracklist-toggle-btn');
  
  if (!tracklistContainer || !toggleWrapper || !toggleBtn) return;

  const totalTracks = activeTracks.length;
  const LIMIT = 5;

  if (totalTracks <= LIMIT) {
    toggleWrapper.style.display = 'none';
    tracklistContainer.classList.remove('collapsed');
    return;
  }

  // Over limit: collapse by default
  tracklistContainer.classList.add('collapsed');
  toggleWrapper.style.display = 'block';
  updateBtnText();

  function updateBtnText() {
    const isCollapsed = tracklistContainer.classList.contains('collapsed');
    if (isCollapsed) {
      const remaining = totalTracks - LIMIT;
      toggleBtn.textContent = `SHOW ALL (+${remaining} MORE)`;
    } else {
      toggleBtn.textContent = 'SHOW LESS';
    }
  }

  function handleToggle() {
    const isCollapsed = tracklistContainer.classList.contains('collapsed');
    if (isCollapsed) {
      tracklistContainer.classList.remove('collapsed');
      const newItems = tracklistContainer.querySelectorAll('.tracklist__item:nth-child(n+6)');
      newItems.forEach(item => {
        item.classList.add('visible');
      });
    } else {
      tracklistContainer.classList.add('collapsed');
      const tracklistSection = $('#tracklist');
      if (tracklistSection) {
        tracklistSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    updateBtnText();
  }

  toggleBtn.addEventListener('click', handleToggle);
  cleanups.push(() => toggleBtn.removeEventListener('click', handleToggle));
}

// ═══════════════════════════════════════════════════════════════════════
//  Main Init
// ═══════════════════════════════════════════════════════════════════════

async function init() {
  console.log('[DELLATEPE] Initialising…');

  // Try fetching artist profile from live backend API server
  try {
    const res = await fetch('http://localhost:5000/api/bio');
    if (res.ok) {
      activeArtist = await res.json();
      console.log('[DELLATEPE] Profile biografi berhasil dimuat dari API.');
    }
  } catch (err) {
    console.warn('[DELLATEPE] Gagal mengambil biografi dari API, menggunakan data mock lokal.', err);
  }

  // Try fetching tracks from live backend API server
  try {
    const res = await fetch('http://localhost:5000/api/tracks');
    if (res.ok) {
      const backendTracks = await res.json();
      if (backendTracks.length > 0) {
        activeTracks = backendTracks;
        console.log('[DELLATEPE] Daftar track lagu berhasil dimuat dari API.');
      }
    }
  } catch (err) {
    console.warn('[DELLATEPE] Gagal mengambil tracks dari API, menggunakan data mock lokal.', err);
  }

  try { populateContent(); }       catch (e) { console.error('[DELLATEPE] populateContent failed:', e); }
  try { initAudio(); }             catch (e) { console.error('[DELLATEPE] initAudio failed:', e); }
  try { initHeroAnimations(); }    catch (e) { console.error('[DELLATEPE] initHeroAnimations failed:', e); }
  try { initTracklist(); }         catch (e) { console.error('[DELLATEPE] initTracklist failed:', e); }
  try { initCTA(); }               catch (e) { console.error('[DELLATEPE] initCTA failed:', e); }
  try { initScrollReveals(); }     catch (e) { console.error('[DELLATEPE] initScrollReveals failed:', e); }
  try { initMarquee(); }           catch (e) { console.error('[DELLATEPE] initMarquee failed:', e); }
  try { initLyricTexture(); }      catch (e) { console.error('[DELLATEPE] initLyricTexture failed:', e); }
  try { initContact(); }           catch (e) { console.error('[DELLATEPE] initContact failed:', e); }
  try { initThemeToggle(); }       catch (e) { console.error('[DELLATEPE] initThemeToggle failed:', e); }
  try { initScrollToTop(); }       catch (e) { console.error('[DELLATEPE] initScrollToTop failed:', e); }
  try { initTracklistCollapse(); } catch (e) { console.error('[DELLATEPE] initTracklistCollapse failed:', e); }

  console.log('[DELLATEPE] Ready ✓');
}

// ─── Boot ────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ─── Global cleanup (if used in SPA context) ─────────────────────────────────
window.__DELLATEPE_CLEANUP = () => {
  cleanups.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
  cleanups.length = 0;
};
