/**
 * audio-engine.js — SOUNDFORM Audio Engine
 *
 * Manages audio playback via Howler.js (loaded globally from CDN),
 * playlist state, and Web Audio API analysis for visualisation.
 *
 * When real audio files aren't available, the engine falls back to a
 * simulated-progress timer so every UI element (progress bar, play/pause,
 * next/prev, etc.) still works perfectly for demo purposes.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Usage:
 *   import { AudioEngine } from './audio-engine.js';
 *   const engine = new AudioEngine();
 *   engine.loadPlaylist(tracks);
 *   engine.play(0);
 * ──────────────────────────────────────────────────────────────────────
 */

// ─── Repeat mode constants ──────────────────────────────────────────────────
const REPEAT = Object.freeze({ OFF: 'off', ALL: 'all', ONE: 'one' });

// ─── Helper: format seconds → mm:ss ─────────────────────────────────────────
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── AudioEngine class ──────────────────────────────────────────────────────
export class AudioEngine {
  constructor() {
    // Playlist & playback state
    this.playlist = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.volume = 0.8;
    this.shuffle = false;
    this.repeat = REPEAT.OFF;
    this._shuffleOrder = [];

    // Howl instance for the current track
    this._howl = null;

    // Web Audio API nodes (created lazily on first user gesture)
    this._audioCtx = null;
    this._analyser = null;
    this._sourceNode = null;
    this._frequencyData = null;

    // Simulated playback (used when real audio fails to load)
    this._simulated = false;
    this._simStartTime = 0;
    this._simPausedAt = 0;
    this._simTimerId = null;

    // State-change subscribers
    this._listeners = [];
  }

  // ─── Playlist management ────────────────────────────────────────────────

  /**
   * Load an array of track objects into the playlist.
   * Each track should have at minimum: { id, title, duration }
   */
  loadPlaylist(tracks) {
    this.playlist = [...tracks];
    this._buildShuffleOrder();
    this._emit('playlistLoaded', { tracks: this.playlist });
  }

  // ─── Playback controls ─────────────────────────────────────────────────

  /**
   * Play a track by index, or resume the current track if no index given.
   */
  play(index) {
    // If an explicit index is given and it's a different track, load it
    if (index !== undefined && index !== this.currentIndex) {
      this._loadTrack(index);
      return; // _loadTrack will call play internally once ready
    }

    // If same index is requested explicitly (e.g., clicking the same track again)
    // and we're not currently playing, restart from beginning
    if (index !== undefined && index === this.currentIndex && !this.isPlaying) {
      // If we have a howl, just play it
      if (this._howl) {
        this._howl.seek(0);
        this._howl.play();
        this.isPlaying = true;
        this._emit('play', this._stateSnapshot());
        return;
      }
      // If in simulated mode, restart
      if (this._simulated) {
        this._simPausedAt = 0;
        this._simStartTime = performance.now();
        this.isPlaying = true;
        this._runSimulatedProgress();
        this._emit('play', this._stateSnapshot());
        return;
      }
      // Otherwise reload the track
      this._loadTrack(index);
      return;
    }

    // Resume current track (no index given)
    if (this._howl) {
      this._howl.play();
      this.isPlaying = true;
      this._emit('play', this._stateSnapshot());
      return;
    }

    // If nothing loaded yet, start from the beginning
    if (this.currentIndex === -1 && this.playlist.length > 0) {
      this._loadTrack(0);
      return;
    }

    // Simulated resume
    if (this._simulated) {
      this._simStartTime = performance.now() - this._simPausedAt * 1000;
      this.isPlaying = true;
      this._runSimulatedProgress();
      this._emit('play', this._stateSnapshot());
    }
  }

  /** Pause current playback. */
  pause() {
    if (this._howl && this.isPlaying) {
      this._howl.pause();
    }

    if (this._simulated) {
      this._simPausedAt = this._getSimulatedSeek();
      this._stopSimulatedProgress();
    }

    this.isPlaying = false;
    this._emit('pause', this._stateSnapshot());
  }

  /** Toggle between play and pause. */
  toggle() {
    this.isPlaying ? this.pause() : this.play();
  }

  /** Skip to the next track (respects shuffle & repeat modes). */
  next() {
    if (this.playlist.length === 0) return;

    let nextIndex;

    if (this.repeat === REPEAT.ONE) {
      // Repeat-one: replay the same track
      nextIndex = this.currentIndex;
    } else if (this.shuffle) {
      const pos = this._shuffleOrder.indexOf(this.currentIndex);
      const nextPos = pos + 1;
      if (nextPos >= this._shuffleOrder.length) {
        if (this.repeat === REPEAT.ALL) {
          this._buildShuffleOrder();
          nextIndex = this._shuffleOrder[0];
        } else {
          this.pause();
          this._emit('end', this._stateSnapshot());
          return;
        }
      } else {
        nextIndex = this._shuffleOrder[nextPos];
      }
    } else {
      nextIndex = this.currentIndex + 1;
      if (nextIndex >= this.playlist.length) {
        if (this.repeat === REPEAT.ALL) {
          nextIndex = 0;
        } else {
          this.pause();
          this._emit('end', this._stateSnapshot());
          return;
        }
      }
    }

    this._loadTrack(nextIndex);
  }

  /** Skip to the previous track. */
  prev() {
    if (this.playlist.length === 0) return;

    // If more than 3 seconds in, restart current track
    const currentSeek = this._howl
      ? this._howl.seek() || 0
      : this._simulated
        ? this._getSimulatedSeek()
        : 0;

    if (currentSeek > 3) {
      this.seek(0);
      return;
    }

    let prevIndex;
    if (this.shuffle) {
      const pos = this._shuffleOrder.indexOf(this.currentIndex);
      prevIndex = pos > 0 ? this._shuffleOrder[pos - 1] : this._shuffleOrder[this._shuffleOrder.length - 1];
    } else {
      prevIndex = this.currentIndex - 1;
      if (prevIndex < 0) prevIndex = this.playlist.length - 1;
    }

    this._loadTrack(prevIndex);
  }

  /**
   * Seek to a position.  Accepts either a percentage (0–1) or absolute seconds.
   * Values ≤ 1 are treated as percentage; greater values as seconds.
   */
  seek(value) {
    const track = this.playlist[this.currentIndex];
    if (!track) return;

    const seconds = value <= 1 ? value * track.duration : value;

    if (this._howl) {
      this._howl.seek(seconds);
    }

    if (this._simulated) {
      this._simPausedAt = seconds;
      if (this.isPlaying) {
        this._simStartTime = performance.now() - seconds * 1000;
      }
    }

    this._emit('progress', this.getProgress());
  }

  /** Set volume (0–1). */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this._howl) {
      this._howl.volume(this.volume);
    }
    this._emit('volumeChange', { volume: this.volume });
  }

  /** Toggle shuffle on/off. */
  toggleShuffle() {
    this.shuffle = !this.shuffle;
    if (this.shuffle) this._buildShuffleOrder();
    this._emit('shuffleChange', { shuffle: this.shuffle });
  }

  /** Cycle repeat mode: off → all → one → off */
  toggleRepeat() {
    if (this.repeat === REPEAT.OFF) this.repeat = REPEAT.ALL;
    else if (this.repeat === REPEAT.ALL) this.repeat = REPEAT.ONE;
    else this.repeat = REPEAT.OFF;
    this._emit('repeatChange', { repeat: this.repeat });
  }

  // ─── Analysis ───────────────────────────────────────────────────────────

  /**
   * Returns a Uint8Array of frequency-domain data from the AnalyserNode.
   * Falls back to procedurally-generated data when no real audio is playing.
   */
  getAnalyserData() {
    // Real analyser data
    if (this._analyser && this._howl && this.isPlaying) {
      this._analyser.getByteFrequencyData(this._frequencyData);
      return this._frequencyData;
    }

    // Simulated data — generate musical-looking frequency bins
    const bins = 64;
    const data = new Uint8Array(bins);

    if (this.isPlaying) {
      const now = performance.now() / 1000;
      const track = this.playlist[this.currentIndex];
      const bpm = track ? track.bpm : 100;
      const beatFreq = bpm / 60;

      for (let i = 0; i < bins; i++) {
        // Louder in low frequencies, falling off toward high
        const freqFalloff = 1 - (i / bins) * 0.7;
        // Pulse with the BPM
        const pulse = Math.sin(now * beatFreq * Math.PI * 2) * 0.3 + 0.7;
        // Add some per-bin randomness
        const noise = 0.8 + Math.random() * 0.4;
        data[i] = Math.min(255, Math.floor(180 * freqFalloff * pulse * noise));
      }
    }
    // When not playing, returns all zeros

    return data;
  }

  /**
   * Returns the current playback progress.
   */
  getProgress() {
    const track = this.playlist[this.currentIndex];
    if (!track) return { current: 0, duration: 0, percent: 0, currentFormatted: '0:00', durationFormatted: '0:00' };

    let current = 0;

    if (this._howl) {
      current = this._howl.seek() || 0;
    } else if (this._simulated) {
      current = this._getSimulatedSeek();
    }

    const duration = track.duration;
    const percent = duration > 0 ? current / duration : 0;

    return {
      current,
      duration,
      percent: Math.min(1, percent),
      currentFormatted: formatTime(current),
      durationFormatted: formatTime(duration)
    };
  }

  // ─── Events ─────────────────────────────────────────────────────────────

  /**
   * Register a callback for state-change events.
   * Events: play, pause, trackChange, progress, end, volumeChange,
   *         shuffleChange, repeatChange, playlistLoaded, error
   */
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this._listeners.push(callback);
    }
    // Return unsubscribe function
    return () => {
      this._listeners = this._listeners.filter((cb) => cb !== callback);
    };
  }

  // ─── Cleanup ────────────────────────────────────────────────────────────

  /** Tear down everything — call when leaving the page. */
  destroy() {
    this.pause();
    this._stopSimulatedProgress();

    if (this._howl) {
      this._howl.unload();
      this._howl = null;
    }

    if (this._audioCtx) {
      this._audioCtx.close().catch(() => {});
      this._audioCtx = null;
    }

    this._listeners = [];
  }

  // ─── Current track info ─────────────────────────────────────────────────

  /** Returns the currently-loaded track object, or null. */
  get currentTrack() {
    return this.playlist[this.currentIndex] || null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Private methods
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Load and auto-play a track at the given playlist index.
   * Creates a new Howl instance, sets up Web Audio API nodes, and handles
   * fallback to simulated progress when the audio file can't be loaded.
   */
  _loadTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;

    // Tear down previous Howl
    if (this._howl) {
      try { this._howl.unload(); } catch (e) { /* ignore */ }
      this._howl = null;
    }
    this._stopSimulatedProgress();
    this._simulated = false;
    this.isPlaying = false;

    this.currentIndex = index;
    const track = this.playlist[index];

    this._emit('trackChange', {
      track,
      index,
      ...this._stateSnapshot()
    });

    // Attempt to create a real Howl instance (if Howl global exists & track has a URL)
    if (typeof Howl !== 'undefined' && track.audioUrl) {
      let loadFallbackTimer = null;
      try {
        this._howl = new Howl({
          src: [track.audioUrl],
          format: ['mp3', 'wav'],
          html5: true,
          volume: this.volume,
          onplay: () => {
            if (loadFallbackTimer) { clearTimeout(loadFallbackTimer); loadFallbackTimer = null; }
            this.isPlaying = true;
            this._setupAnalyser();
            this._emit('play', this._stateSnapshot());
          },
          onpause: () => {
            this.isPlaying = false;
            this._emit('pause', this._stateSnapshot());
          },
          onend: () => {
            this.isPlaying = false;
            this._emit('end', this._stateSnapshot());
            this.next();
          },
          onloaderror: (_id, err) => {
            if (loadFallbackTimer) { clearTimeout(loadFallbackTimer); loadFallbackTimer = null; }
            // Audio file not found — fall back to simulation
            console.warn(`[AudioEngine] Audio file not found for "${track.title}", using simulated playback.`, err);
            if (this._howl) {
              try { this._howl.unload(); } catch (e) { /* ignore */ }
              this._howl = null;
            }
            this._startSimulated();
          },
          onplayerror: (_id, err) => {
            if (loadFallbackTimer) { clearTimeout(loadFallbackTimer); loadFallbackTimer = null; }
            console.warn(`[AudioEngine] Playback error for "${track.title}":`, err);
            // Try to unlock audio context (browser autoplay policy)
            if (this._howl) {
              try {
                this._howl.once('unlock', () => {
                  if (this._howl) this._howl.play();
                });
              } catch (e) {
                // If unlock also fails, fall back to simulated
                try { this._howl.unload(); } catch (ex) { /* ignore */ }
                this._howl = null;
                this._startSimulated();
              }
            } else {
              this._startSimulated();
            }
          }
        });

        this._howl.play();

        // Safety timeout: if nothing happens within 3 seconds, fallback to simulated
        loadFallbackTimer = setTimeout(() => {
          if (!this.isPlaying && this._howl && !this._simulated) {
            console.warn(`[AudioEngine] Timeout waiting for "${track.title}", falling back to simulated playback.`);
            try { this._howl.unload(); } catch (e) { /* ignore */ }
            this._howl = null;
            this._startSimulated();
          }
        }, 3000);

        return;
      } catch (err) {
        if (loadFallbackTimer) { clearTimeout(loadFallbackTimer); loadFallbackTimer = null; }
        console.warn('[AudioEngine] Howl creation failed:', err);
      }
    }

    // No Howl or no audio file — go straight to simulation
    this._startSimulated();
  }

  /**
   * Initialise simulated (demo) playback for the current track.
   */
  _startSimulated() {
    this._simulated = true;
    this._simPausedAt = 0;
    this._simStartTime = performance.now();
    this.isPlaying = true;
    this._runSimulatedProgress();
    this._emit('play', this._stateSnapshot());
  }

  /** Start the rAF-based simulated progress loop. */
  _runSimulatedProgress() {
    this._stopSimulatedProgress();

    const tick = () => {
      if (!this.isPlaying || !this._simulated) return;

      const track = this.playlist[this.currentIndex];
      if (!track) return;

      const elapsed = this._getSimulatedSeek();

      if (elapsed >= track.duration) {
        // Track ended
        this.isPlaying = false;
        this._emit('end', this._stateSnapshot());
        this.next();
        return;
      }

      this._emit('progress', this.getProgress());
      this._simTimerId = requestAnimationFrame(tick);
    };

    this._simTimerId = requestAnimationFrame(tick);
  }

  /** Stop the simulated progress loop. */
  _stopSimulatedProgress() {
    if (this._simTimerId) {
      cancelAnimationFrame(this._simTimerId);
      this._simTimerId = null;
    }
  }

  /** Get elapsed seconds for simulated playback. */
  _getSimulatedSeek() {
    if (!this.isPlaying) return this._simPausedAt;
    return (performance.now() - this._simStartTime) / 1000;
  }

  /**
   * Set up Web Audio API AnalyserNode connected to the Howl's underlying
   * HTML5 audio element.  Only works when Howler uses html5 mode.
   */
  _setupAnalyser() {
    try {
      // Create AudioContext lazily (must happen after user gesture)
      if (!this._audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this._audioCtx = new AC();
      }

      // Resume if suspended
      if (this._audioCtx.state === 'suspended') {
        this._audioCtx.resume();
      }

      // Get the underlying <audio> element from Howler
      // Howler exposes the audio node via the internal _sounds array
      if (!this._howl || !this._howl._sounds || !this._howl._sounds[0]) return;
      const audioNode = this._howl._sounds[0]._node;
      if (!audioNode) return;

      // Avoid creating duplicate source nodes for the same element
      if (this._sourceNode && this._sourceNode.mediaElement === audioNode) return;

      // Disconnect previous source
      if (this._sourceNode) {
        try { this._sourceNode.disconnect(); } catch (e) { /* ignore */ }
      }

      // Create nodes
      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 128;
      this._analyser.smoothingTimeConstant = 0.8;

      this._sourceNode = this._audioCtx.createMediaElementSource(audioNode);
      this._sourceNode.connect(this._analyser);
      this._analyser.connect(this._audioCtx.destination);

      this._frequencyData = new Uint8Array(this._analyser.frequencyBinCount);
    } catch (err) {
      // Non-fatal — visualisation just won't work with real data
      console.warn('[AudioEngine] Web Audio API setup failed:', err);
    }
  }

  /** Build a Fisher-Yates shuffled order array. */
  _buildShuffleOrder() {
    this._shuffleOrder = this.playlist.map((_, i) => i);
    for (let i = this._shuffleOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._shuffleOrder[i], this._shuffleOrder[j]] =
        [this._shuffleOrder[j], this._shuffleOrder[i]];
    }
  }

  /** Emit a named event to all listeners. */
  _emit(event, data = {}) {
    const payload = { event, ...data };
    for (const cb of this._listeners) {
      try { cb(payload); } catch (err) { console.error('[AudioEngine] Listener error:', err); }
    }
  }

  /** Convenience: snapshot of common state. */
  _stateSnapshot() {
    return {
      isPlaying: this.isPlaying,
      currentIndex: this.currentIndex,
      track: this.currentTrack,
      volume: this.volume,
      shuffle: this.shuffle,
      repeat: this.repeat
    };
  }
}
