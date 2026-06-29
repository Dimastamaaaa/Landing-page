/**
 * albums.js — SOUNDFORM Admin Albums Tab Module
 *
 * Manages loading albums, rendering them, opening forms,
 * handling cover artwork image uploads (with progress), and CRUD actions.
 */

import { adminFetch } from '../auth-guard.js';

export function initAlbumsTab() {
  const tableBody = document.getElementById('albums-table-body');
  const addBtn = document.getElementById('btn-add-album');
  const modal = document.getElementById('modal-album');
  const closeBtn = document.getElementById('close-modal-album');
  const cancelBtn = document.getElementById('btn-cancel-album');
  const saveBtn = document.getElementById('btn-save-album');
  
  const form = document.getElementById('album-form');
  const albumIdInput = document.getElementById('album-id');
  const titleInput = document.getElementById('album-title');
  const dateInput = document.getElementById('album-date');
  const coverUrlInput = document.getElementById('album-cover-url');
  const descTextarea = document.getElementById('album-description');
  
  // Cover upload components
  const coverFileSelector = document.getElementById('album-cover-file');
  const coverUploadBox = document.getElementById('cover-upload-box');
  const coverPreviewText = document.getElementById('cover-preview-text');
  const coverProgressWrap = document.getElementById('cover-progress-wrap');
  const coverProgressFill = document.getElementById('cover-progress-fill');
  const coverProgressText = document.getElementById('cover-progress-text');
  
  // Validation labels
  const errTitle = document.getElementById('err-album-title');
  const errDate = document.getElementById('err-album-date');

  // ─── Fetch & Render List ───────────────────────────────────────────
  async function loadAlbums() {
    try {
      const res = await adminFetch('/albums');
      const albums = await res.json();
      renderAlbums(albums);
    } catch (err) {
      console.error('[AlbumsTab] Gagal memuat daftar album:', err);
    }
  }

  function renderAlbums(albums) {
    if (!tableBody) return;

    if (albums.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--color-text-lo); padding: 3rem;">
            Belum ada album/EP yang dibuat. Klik tombol "+ CREATE NEW ALBUM" di atas.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = albums
      .map((album) => {
        const coverImg = album.coverUrl
          ? `<img src="..${album.coverUrl}" class="player__cover" style="width: 44px; height: 44px; object-fit: cover;">`
          : '<div class="player__cover-placeholder" style="width: 44px; height: 44px; font-size: 0.8rem;">No Art</div>';
          
        const releaseStr = new Date(album.releaseDate).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const tracksCount = album._count ? album._count.tracks : 0;

        return `
          <tr data-id="${album.id}">
            <td style="width: 60px;">${coverImg}</td>
            <td style="font-weight: bold;">${album.title}</td>
            <td>${releaseStr}</td>
            <td style="font-weight: bold; color: var(--color-accent-2);">${tracksCount} songs</td>
            <td>
              <div class="action-btn-group">
                <button class="icon-btn btn-edit" title="Edit Album">✏️</button>
                <button class="icon-btn btn-delete" title="Delete Album">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    // Bind action events
    tableBody.querySelectorAll('.btn-edit').forEach((btn, idx) => {
      btn.addEventListener('click', () => openFormForEdit(albums[idx]));
    });

    tableBody.querySelectorAll('.btn-delete').forEach((btn, idx) => {
      btn.addEventListener('click', () => deleteAlbum(albums[idx]));
    });
  }

  // ─── Modal Open/Close Controls ─────────────────────────────────────
  function openDrawer(titleText) {
    document.getElementById('album-drawer-title').textContent = titleText;
    modal.classList.add('open');
    resetValidationErrors();
  }

  function closeDrawer() {
    modal.classList.remove('open');
    form.reset();
    albumIdInput.value = '';
    coverPreviewText.textContent = 'No file chosen';
    coverProgressWrap.style.display = 'none';
    coverProgressFill.style.width = '0%';
    coverProgressText.textContent = '0%';
  }

  function resetValidationErrors() {
    errTitle.textContent = '';
    titleInput.classList.remove('error');
    errDate.textContent = '';
    dateInput.classList.remove('error');
  }

  function openFormForCreate() {
    openDrawer('Create New Album');
    saveBtn.textContent = 'Create Album';
  }

  function openFormForEdit(album) {
    openDrawer('Edit Album Information');
    saveBtn.textContent = 'Update Album';
    
    // Fill fields
    albumIdInput.value = album.id;
    titleInput.value = album.title;
    
    // Format date string to YYYY-MM-DD for date input
    if (album.releaseDate) {
      dateInput.value = new Date(album.releaseDate).toISOString().split('T')[0];
    }
    
    coverUrlInput.value = album.coverUrl || '';
    descTextarea.value = album.description || '';
    
    coverPreviewText.textContent = album.coverUrl ? `Linked cover art: ${album.coverUrl.split('/').pop()}` : 'No file chosen';
  }

  // ─── CRUD Actions ──────────────────────────────────────────────────
  async function saveAlbum() {
    resetValidationErrors();

    const title = titleInput.value.trim();
    const releaseDate = dateInput.value;
    const coverUrl = coverUrlInput.value.trim() || null;
    const description = descTextarea.value.trim() || null;

    // Validate inputs
    let isValid = true;
    if (!title) {
      titleInput.classList.add('error');
      errTitle.textContent = 'Judul album wajib diisi.';
      isValid = false;
    }
    if (!releaseDate) {
      dateInput.classList.add('error');
      errDate.textContent = 'Tanggal rilis wajib diisi.';
      isValid = false;
    }

    if (!isValid) return;

    // Disable buttons
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';

    const id = albumIdInput.value;
    const isEdit = !!id;

    const payload = {
      title,
      releaseDate,
      coverUrl,
      description
    };

    try {
      const endpoint = isEdit ? `/albums/${id}` : '/albums';
      const response = await adminFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: payload
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Gagal menyimpan album.');
      }

      closeDrawer();
      loadAlbums();
      showToast(isEdit ? 'Album berhasil diperbarui! ✓' : 'Album berhasil dibuat! ✓', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan album.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Update Album' : 'Create Album';
    }
  }

  async function deleteAlbum(album) {
    if (!confirm(`Apakah Anda yakin ingin menghapus album "${album.title}"?\nLagu di dalamnya tidak akan terhapus, namun status hubungannya akan diputus.`)) return;

    try {
      const response = await adminFetch(`/albums/${album.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      loadAlbums();
      showToast('Album berhasil dihapus! ✓', 'success');
    } catch (err) {
      showToast('Gagal menghapus album.', 'error');
    }
  }

  // ─── File Upload Logic ─────────────────────────────────────────────
  
  // Drag over boxes
  coverUploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    coverUploadBox.style.borderColor = 'var(--color-accent)';
  });

  coverUploadBox.addEventListener('dragleave', () => {
    coverUploadBox.style.borderColor = '';
  });

  coverUploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    coverUploadBox.style.borderColor = '';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  coverUploadBox.addEventListener('click', () => {
    coverFileSelector.click();
  });

  coverFileSelector.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  function handleFileUpload(file) {
    // Basic file validation
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowed.includes(ext)) {
      showToast('Format file tidak didukung! Pilih file JPG, PNG, atau WebP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran gambar cover maksimal 5MB!', 'error');
      return;
    }

    coverPreviewText.textContent = `Uploading: ${file.name}`;
    coverProgressWrap.style.display = 'block';
    coverProgressFill.style.width = '0%';
    coverProgressText.textContent = '0%';

    // Perform upload via XHR
    const token = localStorage.getItem('soundform_admin_token');
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('cover', file);

    xhr.open('POST', 'http://localhost:5000/api/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        coverProgressFill.style.width = `${percent}%`;
        coverProgressText.textContent = `${percent}%`;
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        coverUrlInput.value = res.url;
        coverPreviewText.textContent = `Uploaded: ${file.name} ✓`;
        coverProgressFill.style.background = 'var(--color-accent-2)';
      } else {
        const err = JSON.parse(xhr.responseText || '{}');
        coverPreviewText.textContent = 'Upload Gagal!';
        showToast(err.message || 'Gagal mengunggah file.', 'error');
      }
    };

    xhr.onerror = () => {
      coverPreviewText.textContent = 'Upload Gagal!';
      showToast('Koneksi terputus saat mengunggah.', 'error');
    };

    xhr.send(formData);
  }

  // ─── Bind Button Events ────────────────────────────────────────────
  addBtn.addEventListener('click', openFormForCreate);
  closeBtn.addEventListener('click', closeDrawer);
  cancelBtn.addEventListener('click', closeDrawer);
  saveBtn.addEventListener('click', saveAlbum);

  // Load initially
  loadAlbums();
}
