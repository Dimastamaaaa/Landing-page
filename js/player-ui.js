/**
 * player-ui.js — SOUNDFORM Player UI Controller
 *
 * Connects an AudioEngine instance to the DOM.  Handles all user
 * interactions (click, drag, keyboard) and keeps the visual state
 * (progress bar, visualiser bars, track info) in sync via rAF loops.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Expected DOM IDs (matching index.html):
 *
 *   #player                 — outer player container (gets .visible)
 *   #player-play            — play / pause button (contains SVG icons)
 *   #player-prev            — previous track button
 *   #player-next            — next track button
 *   #player-shuffle         — shuffle toggle button
 *   #player-repeat          — repeat cycle button
 *   #player-repeat-indicator— repeat mode indicator ("1" for repeat-one)
 *   #player-track-title     — current track title text
 *   #player-track-album     — current album text
 *   #player-time-current    — mm:ss elapsed
 *   #player-time-duration   — mm:ss total
 *   #player-progress-wrap   — progress bar container (click / drag target)
 *   #player-progress        — inner fill element
 *   #player-volume          — volume <input type="range">
 *   #player-vol-btn         — volume icon button (for mute toggle)
 *   #player-visualizer      — container for mini frequency bars
 *   #marquee                — marquee bar (gets .visible)
 * ──────────────────────────────────────────────────────────────────────
 */

/**
 * Initialise the player UI.
 *
 * @param {import('./audio-engine.js').AudioEngine} engine — the audio engine instance
 * @returns {{ destroy: Function }} cleanup handle
 */
export function initPlayerUI(engine) {
  // ─── DOM references ─────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const els = {
    player:           $('player'),
    playBtn:          $('player-play'),
    prevBtn:          $('player-prev'),
    nextBtn:          $('player-next'),
    shuffleBtn:       $('player-shuffle'),
    repeatBtn:        $('player-repeat'),
    repeatIndicator:  $('player-repeat-indicator'),
    trackTitle:       $('player-track-title'),
    trackAlbum:       $('player-track-album'),
    timeCurrent:      $('player-time-current'),
    timeDuration:     $('player-time-duration'),
    progressWrap:     $('player-progress-wrap'),
    progressFill:     $('player-progress'),
    volumeSlider:     $('player-volume'),
    volBtn:           $('player-vol-btn'),
    visualizer:       $('player-visualizer'),
    marquee:          $('marquee'),
    // SVG icons inside play button
    iconPlay:         null,
    iconPause:        null
  };

  // Grab the SVG icons for play/pause toggling
  if (els.playBtn) {
    els.iconPlay = els.playBtn.querySelector('.player__icon-play');
    els.iconPause = els.playBtn.querySelector('.player__icon-pause');
  }

  // If no player element exists, bail silently
  if (!els.player) {
    console.warn('[PlayerUI] #player element not found — skipping init.');
    return { destroy: () => {} };
  }

  // ─── Visualiser bars (create 24 bars dynamically) ──────────────────
  const BAR_COUNT = 24;
  const bars = [];

  if (els.visualizer) {
    els.visualizer.innerHTML = '';
    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement('span');
      bar.className = 'player__viz-bar';
      els.visualizer.appendChild(bar);
      bars.push(bar);
    }
  }

  // ─── State ──────────────────────────────────────────────────────────
  let isDragging = false;
  let rafId = null;
  let isMuted = false;
  let previousVolume = engine.volume;

  // ─── Button handlers ───────────────────────────────────────────────
  const onPlay = () => engine.toggle();
  const onPrev = () => engine.prev();
  const onNext = () => engine.next();
  const onShuffle = () => engine.toggleShuffle();
  const onRepeat = () => engine.toggleRepeat();

  if (els.playBtn) els.playBtn.addEventListener('click', onPlay);
  if (els.prevBtn) els.prevBtn.addEventListener('click', onPrev);
  if (els.nextBtn) els.nextBtn.addEventListener('click', onNext);
  if (els.shuffleBtn) els.shuffleBtn.addEventListener('click', onShuffle);
  if (els.repeatBtn) els.repeatBtn.addEventListener('click', onRepeat);

  // ─── Mute toggle via volume button ─────────────────────────────────
  function onVolBtnClick() {
    if (isMuted) {
      engine.setVolume(previousVolume);
      if (els.volumeSlider) els.volumeSlider.value = previousVolume * 100;
      isMuted = false;
    } else {
      previousVolume = engine.volume;
      engine.setVolume(0);
      if (els.volumeSlider) els.volumeSlider.value = 0;
      isMuted = true;
    }
  }

  if (els.volBtn) els.volBtn.addEventListener('click', onVolBtnClick);

  // ─── Progress bar: click & drag to seek ────────────────────────────
  function seekFromEvent(e) {
    if (!els.progressWrap) return;
    const rect = els.progressWrap.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    engine.seek(percent);
  }

  function onProgressClick(e) {
    seekFromEvent(e);
  }

  function onProgressMouseDown(e) {
    isDragging = true;
    seekFromEvent(e);
    document.addEventListener('mousemove', onProgressMouseMove);
    document.addEventListener('mouseup', onProgressMouseUp);
  }

  function onProgressMouseMove(e) {
    if (isDragging) seekFromEvent(e);
  }

  function onProgressMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onProgressMouseMove);
    document.removeEventListener('mouseup', onProgressMouseUp);
  }

  if (els.progressWrap) {
    els.progressWrap.addEventListener('click', onProgressClick);
    els.progressWrap.addEventListener('mousedown', onProgressMouseDown);
  }

  // ─── Volume slider (HTML range input) ──────────────────────────────
  function onVolumeInput(e) {
    const val = parseInt(e.target.value, 10) / 100;
    engine.setVolume(val);
    isMuted = false;
  }

  if (els.volumeSlider) {
    els.volumeSlider.addEventListener('input', onVolumeInput);
  }

  // ─── Keyboard shortcuts ────────────────────────────────────────────
  function onKeyDown(e) {
    // Don't intercept when typing in form inputs
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        engine.toggle();
        break;
      case 'ArrowRight':
        e.preventDefault();
        engine.seek(engine.getProgress().current + 10);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        engine.seek(Math.max(0, engine.getProgress().current - 10));
        break;
      case 'KeyN':
        engine.next();
        break;
      case 'KeyM':
        onVolBtnClick();
        break;
    }
  }

  document.addEventListener('keydown', onKeyDown);

  // ─── Update helpers ────────────────────────────────────────────────

  /** Toggle play/pause SVG icon visibility. */
  function updatePlayBtn(isPlaying) {
    if (!els.playBtn) return;
    if (els.iconPlay) els.iconPlay.style.display = isPlaying ? 'none' : '';
    if (els.iconPause) els.iconPause.style.display = isPlaying ? '' : 'none';
    els.playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    els.playBtn.setAttribute('title', isPlaying ? 'Pause' : 'Play');
  }

  /** Update track info display. */
  function updateTrackInfo(track) {
    if (els.trackTitle) {
      els.trackTitle.textContent = track ? track.title : '—';
    }
    if (els.trackAlbum) {
      els.trackAlbum.textContent = track ? (track.album || '') : '';
    }
    if (els.timeDuration) {
      els.timeDuration.textContent = track ? formatTime(track.duration) : '0:00';
    }
  }

  /** Update shuffle button state. */
  function updateShuffleBtn(active) {
    if (!els.shuffleBtn) return;
    els.shuffleBtn.classList.toggle('active', active);
    els.shuffleBtn.setAttribute('aria-pressed', String(active));
  }

  /** Update repeat button state and indicator. */
  function updateRepeatBtn(mode) {
    if (!els.repeatBtn) return;
    els.repeatBtn.classList.toggle('active', mode !== 'off');
    if (els.repeatIndicator) {
      els.repeatIndicator.textContent = mode === 'one' ? '1' : '';
    }
  }

  /** Format seconds to mm:ss. */
  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  // ─── rAF loop: progress + visualiser ───────────────────────────────
  function uiLoop() {
    // Progress
    if (!isDragging) {
      const progress = engine.getProgress();
      if (els.progressFill) {
        els.progressFill.style.width = `${progress.percent * 100}%`;
      }
      if (els.timeCurrent) {
        els.timeCurrent.textContent = progress.currentFormatted;
      }
      if (els.timeDuration && progress.duration) {
        els.timeDuration.textContent = progress.durationFormatted;
      }
      // Update ARIA
      if (els.progressWrap) {
        els.progressWrap.setAttribute('aria-valuenow', Math.round(progress.percent * 100));
      }
    }

    // Visualiser bars
    if (bars.length > 0) {
      const data = engine.getAnalyserData();
      if (data) {
        const binSize = Math.max(1, Math.floor(data.length / BAR_COUNT));
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < binSize; j++) {
            sum += data[i * binSize + j] || 0;
          }
          const avg = binSize > 0 ? sum / binSize : 0;
          const heightPx = Math.max(2, (avg / 255) * 28);
          bars[i].style.height = `${heightPx}px`;
        }
      }
    }

    rafId = requestAnimationFrame(uiLoop);
  }

  // ─── Engine state change listener ──────────────────────────────────
  const unsubscribe = engine.onStateChange((state) => {
    switch (state.event) {
      case 'play':
        updatePlayBtn(true);
        // Show the player + marquee when first track starts playing
        if (els.player) els.player.classList.add('visible');
        if (els.marquee) els.marquee.classList.add('visible');
        break;

      case 'pause':
        updatePlayBtn(false);
        break;

      case 'trackChange':
        updateTrackInfo(state.track);
        // Show the player + marquee
        if (els.player) els.player.classList.add('visible');
        if (els.marquee) els.marquee.classList.add('visible');
        break;

      case 'shuffleChange':
        updateShuffleBtn(state.shuffle);
        break;

      case 'repeatChange':
        updateRepeatBtn(state.repeat);
        break;

      case 'end':
        updatePlayBtn(false);
        break;
    }
  });

  // ─── Start the UI loop ─────────────────────────────────────────────
  rafId = requestAnimationFrame(uiLoop);

  // ─── Cleanup / destroy ─────────────────────────────────────────────
  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    unsubscribe();

    if (els.playBtn) els.playBtn.removeEventListener('click', onPlay);
    if (els.prevBtn) els.prevBtn.removeEventListener('click', onPrev);
    if (els.nextBtn) els.nextBtn.removeEventListener('click', onNext);
    if (els.shuffleBtn) els.shuffleBtn.removeEventListener('click', onShuffle);
    if (els.repeatBtn) els.repeatBtn.removeEventListener('click', onRepeat);
    if (els.volBtn) els.volBtn.removeEventListener('click', onVolBtnClick);

    if (els.progressWrap) {
      els.progressWrap.removeEventListener('click', onProgressClick);
      els.progressWrap.removeEventListener('mousedown', onProgressMouseDown);
    }
    if (els.volumeSlider) {
      els.volumeSlider.removeEventListener('input', onVolumeInput);
    }

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('mousemove', onProgressMouseMove);
    document.removeEventListener('mouseup', onProgressMouseUp);
  }

  return { destroy };
}
