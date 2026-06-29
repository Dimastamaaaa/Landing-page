/**
 * tracks.js — SOUNDFORM Admin Tracks Tab Module
 *
 * Manages loading tracks, rendering them, opening forms,
 * handling audio file uploads (with progress), reordering, and CRUD actions.
 */

import { adminFetch } from '../auth-guard.js';

export function initTracksTab() {
  const tableBody = document.getElementById('tracks-table-body');
  const addBtn = document.getElementById('btn-add-track');
  const modal = document.getElementById('modal-track');
  const closeBtn = document.getElementById('close-modal-track');
  const cancelBtn = document.getElementById('btn-cancel-track');
  const saveBtn = document.getElementById('btn-save-track');
  
  const form = document.getElementById('track-form');
  const trackIdInput = document.getElementById('track-id');
  const titleInput = document.getElementById('track-title');
  const bpmInput = document.getElementById('track-bpm');
  const keyInput = document.getElementById('track-key');
  const albumSelect = document.getElementById('track-album');
  const moodInput = document.getElementById('track-mood');
  const lyricsTextarea = document.getElementById('track-lyrics');
  const audioUrlInput = document.getElementById('track-audio-url');
  
  // Audio upload components
  const audioFileSelector = document.getElementById('track-audio-file');
  const audioUploadBox = document.getElementById('audio-upload-box');
  const audioPreviewText = document.getElementById('audio-preview-text');
  const audioProgressWrap = document.getElementById('audio-progress-wrap');
  const audioProgressFill = document.getElementById('audio-progress-fill');
  const audioProgressText = document.getElementById('audio-progress-text');
  
  // Validation labels
  const errTitle = document.getElementById('err-track-title');
  const errAudio = document.getElementById('err-track-audio');

  let currentTracksList = [];
  let detectedDuration = 240; // Will be overwritten by actual audio duration on upload

  // ─── Fetch & Render List ───────────────────────────────────────────
  async function loadTracks() {
    try {
      // 1. Load albums dropdown options first
      await loadAlbumsDropdown();

      // 2. Fetch tracks list
      const res = await adminFetch('/tracks?all=true');
      currentTracksList = await res.json();
      renderTracks(currentTracksList);
      
      // Update global header stats
      if (typeof window.refreshDashboardStats === 'function') {
        window.refreshDashboardStats();
      }
    } catch (err) {
      console.error('[TracksTab] Gagal memuat daftar lagu:', err);
    }
  }

  async function loadAlbumsDropdown() {
    try {
      const res = await adminFetch('/albums');
      const albums = await res.json();
      
      albumSelect.innerHTML = '<option value="">No Album (Single)</option>';
      albums.forEach(album => {
        const option = document.createElement('option');
        option.value = album.id;
        option.textContent = album.title;
        albumSelect.appendChild(option);
      });
    } catch (err) {
      console.error('[TracksTab] Gagal memuat dropdown album:', err);
    }
  }

  function renderTracks(tracks) {
    if (!tableBody) return;
    
    if (tracks.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--color-text-lo); padding: 3rem;">
            Belum ada track lagu yang diunggah. Klik tombol "+ UPLOAD NEW TRACK" di atas.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = tracks
      .map((track, index) => {
        const statusBadge = track.isPublished
          ? '<span class="badge badge-published">Published</span>'
          : '<span class="badge badge-draft">Draft</span>';
          
        const albumTitle = track.album ? track.album.title : '—';
        const bpmKey = `${track.bpm || '—'} / ${track.key || '—'}`;

        return `
          <tr data-id="${track.id}" data-index="${index}">
            <td>
              <div style="display: flex; flex-direction: column; gap: 2px; align-items: center; width: 40px;">
                <button class="icon-btn btn-move-up" title="Move Up" ${index === 0 ? 'disabled style="opacity: 0.2; cursor: not-allowed;"' : ''}>▲</button>
                <span style="font-size: 0.75rem; font-weight: bold; color: var(--color-text-lo);">${index + 1}</span>
                <button class="icon-btn btn-move-down" title="Move Down" ${index === tracks.length - 1 ? 'disabled style="opacity: 0.2; cursor: not-allowed;"' : ''}>▼</button>
              </div>
            </td>
            <td style="font-weight: bold;">${track.title}</td>
            <td>${albumTitle}</td>
            <td>${bpmKey}</td>
            <td>${statusBadge}</td>
            <td style="font-family: 'Space Mono', monospace; font-weight: bold; color: var(--color-accent);">${track.playCount || 0}</td>
            <td>
              <div class="action-btn-group">
                <button class="icon-btn btn-edit" title="Edit Track">✏️</button>
                <button class="icon-btn btn-delete" title="Delete Track">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    // Bind action events dynamically
    tableBody.querySelectorAll('.btn-edit').forEach((btn, idx) => {
      btn.addEventListener('click', () => openFormForEdit(tracks[idx]));
    });

    tableBody.querySelectorAll('.btn-delete').forEach((btn, idx) => {
      btn.addEventListener('click', () => deleteTrack(tracks[idx]));
    });

    tableBody.querySelectorAll('.btn-move-up').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        const idx = parseInt(row.dataset.index, 10);
        moveTrackOrder(idx, idx - 1);
      });
    });

    tableBody.querySelectorAll('.btn-move-down').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        const idx = parseInt(row.dataset.index, 10);
        moveTrackOrder(idx, idx + 1);
      });
    });
  }

  // ─── Modal Open/Close Controls ─────────────────────────────────────
  function openDrawer(titleText) {
    document.getElementById('track-drawer-title').textContent = titleText;
    modal.classList.add('open');
    resetValidationErrors();
  }

  function closeDrawer() {
    modal.classList.remove('open');
    form.reset();
    trackIdInput.value = '';
    audioPreviewText.textContent = 'No file chosen';
    audioProgressWrap.style.display = 'none';
    audioProgressFill.style.width = '0%';
    audioProgressText.textContent = '0%';
    detectedDuration = 240; // Reset for next upload
  }

  function resetValidationErrors() {
    errTitle.textContent = '';
    titleInput.classList.remove('error');
    errAudio.textContent = '';
    audioUploadBox.classList.remove('error');
  }

  function openFormForCreate() {
    openDrawer('Add New Track');
    saveBtn.textContent = 'Save Track';
  }

  function openFormForEdit(track) {
    openDrawer('Edit Track Metadata');
    saveBtn.textContent = 'Update Track';
    
    // Fill fields
    trackIdInput.value = track.id;
    titleInput.value = track.title;
    bpmInput.value = track.bpm || '';
    keyInput.value = track.key || '';
    albumSelect.value = track.albumId || '';
    moodInput.value = track.mood ? track.mood.join(', ') : '';
    lyricsTextarea.value = track.lyrics || '';
    audioUrlInput.value = track.audioUrl;
    detectedDuration = track.duration || 240; // Preserve existing duration
    
    audioPreviewText.textContent = track.audioUrl ? `Linked audio file: ${track.audioUrl.split('/').pop()}` : 'No file chosen';

    // Status Radio
    const radios = form.querySelectorAll('input[name="isPublished"]');
    radios.forEach(radio => {
      radio.checked = radio.value === String(track.isPublished);
    });
  }

  // ─── Track Reordering Handling ─────────────────────────────────────
  async function moveTrackOrder(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= currentTracksList.length) return;

    // Swap indexes locally
    const list = [...currentTracksList];
    const temp = list[fromIdx];
    list[fromIdx] = list[toIdx];
    list[toIdx] = temp;

    // Build the bulk order payload
    const ordersPayload = list.map((track, i) => ({
      id: track.id,
      sortOrder: i + 1
    }));

    try {
      const response = await adminFetch('/tracks/reorder', {
        method: 'PUT',
        body: { orders: ordersPayload }
      });

      if (!response.ok) throw new Error('Reorder failed');
      
      loadTracks();
      showToast('Urutan lagu berhasil diperbarui! ✓', 'success');
    } catch (err) {
      console.error('[TracksTab] Gagal menukar urutan lagu:', err);
      showToast('Gagal memperbarui urutan lagu.', 'error');
    }
  }

  // ─── CRUD Actions ──────────────────────────────────────────────────
  async function saveTrack() {
    resetValidationErrors();

    const title = titleInput.value.trim();
    const audioUrl = audioUrlInput.value.trim();
    const bpm = bpmInput.value ? parseInt(bpmInput.value, 10) : null;
    const key = keyInput.value.trim() || null;
    const albumId = albumSelect.value || null;
    const lyrics = lyricsTextarea.value.trim() || null;
    
    // Parse mood string into list
    const mood = moodInput.value
      ? moodInput.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];

    const isPublished = form.querySelector('input[name="isPublished"]:checked').value === 'true';

    // Validate inputs
    let isValid = true;
    if (!title) {
      titleInput.classList.add('error');
      errTitle.textContent = 'Judul lagu wajib diisi.';
      isValid = false;
    }
    if (!audioUrl) {
      audioUploadBox.classList.add('error');
      errAudio.textContent = 'Anda wajib mengunggah file audio.';
      isValid = false;
    }

    if (!isValid) return;

    // Disable buttons
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';

    const id = trackIdInput.value;
    const isEdit = !!id;

    // Prepare body payload
    const payload = {
      title,
      audioUrl,
      duration: detectedDuration,
      bpm,
      key,
      mood,
      lyrics,
      isPublished,
      albumId,
      sortOrder: isEdit ? undefined : currentTracksList.length + 1
    };

    try {
      const endpoint = isEdit ? `/tracks/${id}` : '/tracks';
      const response = await adminFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: payload
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Gagal menyimpan lagu.');
      }

      closeDrawer();
      loadTracks();
      showToast(isEdit ? 'Lagu berhasil diperbarui! ✓' : 'Lagu berhasil ditambahkan! ✓', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan lagu.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Update Track' : 'Save Track';
    }
  }

  async function deleteTrack(track) {
    if (!confirm(`Apakah Anda yakin ingin menghapus lagu "${track.title}"?`)) return;

    try {
      const response = await adminFetch(`/tracks/${track.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      loadTracks();
      showToast('Lagu berhasil dihapus! ✓', 'success');
    } catch (err) {
      showToast('Gagal menghapus lagu.', 'error');
    }
  }

  // ─── File Upload Logic ─────────────────────────────────────────────
  
  // Drag over boxes
  audioUploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    audioUploadBox.style.borderColor = 'var(--color-accent)';
  });

  audioUploadBox.addEventListener('dragleave', () => {
    audioUploadBox.style.borderColor = '';
  });

  audioUploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    audioUploadBox.style.borderColor = '';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  audioUploadBox.addEventListener('click', () => {
    audioFileSelector.click();
  });

  audioFileSelector.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  function handleFileUpload(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isAudio = file.type.startsWith('audio/') || 
                    file.type.startsWith('video/mp4') ||
                    ['.mp3', '.wav', '.flac', '.mpeg', '.mp4', '.m4a', '.ogg', '.aac', '.wma', '.opus', '.aiff', '.aif', '.mid', '.midi', '.ape', '.alac'].includes(ext);

    if (!isAudio) {
      showToast('Format file tidak didukung! Pilih file musik yang valid (MP3, WAV, FLAC, M4A, OGG, dll).', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('Ukuran file maksimal 50MB!', 'error');
      return;
    }

    audioPreviewText.textContent = `Uploading: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    audioProgressWrap.style.display = 'block';
    audioProgressFill.style.width = '0%';
    audioProgressText.textContent = '0%';

    // Detect actual audio duration locally using HTML5 Audio API (avoids CORS issues on remote loaded metadata)
    try {
      const audioEl = new Audio();
      const objectURL = URL.createObjectURL(file);
      audioEl.preload = 'metadata';
      audioEl.src = objectURL;
      audioEl.addEventListener('loadedmetadata', () => {
        if (audioEl.duration && isFinite(audioEl.duration)) {
          detectedDuration = Math.round(audioEl.duration);
          console.log('[TracksTab] Detected local file duration:', detectedDuration);
        }
        URL.revokeObjectURL(objectURL);
      });
    } catch (durErr) {
      console.warn('[TracksTab] Local duration detection failed:', durErr);
    }

    // Perform upload via XHR to capture progress events
    const token = localStorage.getItem('soundform_admin_token');
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('audio', file);

    xhr.open('POST', 'http://localhost:5000/api/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        audioProgressFill.style.width = `${percent}%`;
        audioProgressText.textContent = `${percent}%`;
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        audioUrlInput.value = res.url;
        
        // Wait a tiny bit in case metadata event hasn't fired yet
        setTimeout(() => {
          const mins = Math.floor(detectedDuration / 60);
          const secs = detectedDuration % 60;
          audioPreviewText.textContent = `Uploaded: ${file.name} ✓ (${mins}:${String(secs).padStart(2, '0')})`;
        }, 100);

        audioProgressFill.style.background = 'var(--color-accent-2)';
      } else {
        const err = JSON.parse(xhr.responseText || '{}');
        audioPreviewText.textContent = 'Upload Gagal!';
        showToast(err.message || 'Gagal mengunggah file.', 'error');
      }
    };

    xhr.onerror = () => {
      audioPreviewText.textContent = 'Upload Gagal!';
      showToast('Koneksi terputus saat mengunggah.', 'error');
    };

    xhr.send(formData);
  }

  // ─── Bind Button Events ────────────────────────────────────────────
  addBtn.addEventListener('click', openFormForCreate);
  closeBtn.addEventListener('click', closeDrawer);
  cancelBtn.addEventListener('click', closeDrawer);
  saveBtn.addEventListener('click', saveTrack);

  // Load initially
  loadTracks();
}
