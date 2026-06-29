/**
 * bio.js — SOUNDFORM Admin Bio Tab Module
 *
 * Manages loading the artist profile/biography metadata,
 * populating the inputs, handling photo uploads, and saving updates to the backend.
 */

import { adminFetch } from '../auth-guard.js';

export function initBioTab() {
  const form = document.getElementById('bio-form');
  const nameInput = document.getElementById('bio-name');
  const taglineInput = document.getElementById('bio-tagline');
  const bioInput = document.getElementById('bio-text');
  const genresInput = document.getElementById('bio-genres');
  const photoInput = document.getElementById('bio-photo');
  const cityInput = document.getElementById('bio-city');
  
  // Photo upload DOM elements
  const photoFileSelector = document.getElementById('bio-photo-file');
  const photoUploadBox = document.getElementById('photo-upload-box');
  const photoPreviewText = document.getElementById('photo-preview-text');
  const photoProgressWrap = document.getElementById('photo-progress-wrap');
  const photoProgressFill = document.getElementById('photo-progress-fill');
  const photoProgressText = document.getElementById('photo-progress-text');

  // Social links
  const instagramInput = document.getElementById('bio-instagram');
  const spotifyInput = document.getElementById('bio-spotify');
  const youtubeInput = document.getElementById('bio-youtube');
  const tiktokInput = document.getElementById('bio-tiktok');

  // ─── Load Bio Data ─────────────────────────────────────────────────
  async function loadBio() {
    try {
      const res = await adminFetch('/bio');
      
      if (!res.ok) {
        if (res.status === 404) {
          console.warn('[BioTab] Profil artis belum dibuat.');
          return;
        }
        throw new Error('Gagal mengambil data bio');
      }

      const artist = await res.json();
      
      // Populate standard inputs
      nameInput.value = artist.name || '';
      taglineInput.value = artist.tagline || '';
      bioInput.value = artist.bio || '';
      photoInput.value = artist.photoUrl || '';
      cityInput.value = artist.city || '';
      
      if (artist.photoUrl) {
        photoPreviewText.textContent = `Linked profile photo: ${artist.photoUrl.split('/').pop()}`;
      } else {
        photoPreviewText.textContent = 'No file chosen';
      }

      // Format genres list to comma-separated string
      genresInput.value = artist.genre ? artist.genre.join(', ') : '';

      // Populate social links
      if (artist.socialLinks) {
        instagramInput.value = artist.socialLinks.instagram || '';
        spotifyInput.value = artist.socialLinks.spotify || '';
        youtubeInput.value = artist.socialLinks.youtube || '';
        tiktokInput.value = artist.socialLinks.tiktok || '';
      }
    } catch (err) {
      console.error('[BioTab] Gagal memuat data biografi:', err);
    }
  }

  // ─── Save Changes ──────────────────────────────────────────────────
  async function saveBio(e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const tagline = taglineInput.value.trim();
    const bio = bioInput.value.trim();
    const photoUrl = photoInput.value.trim() || null;
    const city = cityInput.value.trim() || null;
    
    // Parse genres
    const genre = genresInput.value
      ? genresInput.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
      : [];

    // Assemble social links object
    const socialLinks = {
      instagram: instagramInput.value.trim() || '#',
      spotify: spotifyInput.value.trim() || '#',
      youtube: youtubeInput.value.trim() || '#',
      tiktok: tiktokInput.value.trim() || '#'
    };

    const payload = {
      name,
      tagline,
      bio,
      photoUrl,
      city,
      genre,
      socialLinks
    };

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'SAVING CHANGES...';

    try {
      const response = await adminFetch('/bio', {
        method: 'PUT',
        body: payload
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Gagal memperbarui biografi.');
      }

      showToast('Biografi artis berhasil diperbarui! ✓', 'success');
      loadBio();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan perubahan.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SAVE CHANGES';
    }
  }

  // ─── File Upload Logic ─────────────────────────────────────────────
  
  if (photoUploadBox) {
    photoUploadBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoUploadBox.style.borderColor = 'var(--color-accent)';
    });

    photoUploadBox.addEventListener('dragleave', () => {
      photoUploadBox.style.borderColor = '';
    });

    photoUploadBox.addEventListener('drop', (e) => {
      e.preventDefault();
      photoUploadBox.style.borderColor = '';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    });

    photoUploadBox.addEventListener('click', () => {
      photoFileSelector.click();
    });
  }

  if (photoFileSelector) {
    photoFileSelector.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });
  }

  function handleFileUpload(file) {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowed.includes(ext)) {
      showToast('Format file tidak didukung! Pilih file JPG, PNG, atau WebP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran gambar profil maksimal 5MB!', 'error');
      return;
    }

    photoPreviewText.textContent = `Uploading: ${file.name}`;
    photoProgressWrap.style.display = 'block';
    photoProgressFill.style.width = '0%';
    photoProgressText.textContent = '0%';

    // Perform upload via XHR
    const token = localStorage.getItem('soundform_admin_token');
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('photo', file);

    xhr.open('POST', 'http://localhost:5000/api/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        photoProgressFill.style.width = `${percent}%`;
        photoProgressText.textContent = `${percent}%`;
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        photoInput.value = res.url;
        photoPreviewText.textContent = `Uploaded: ${file.name} ✓`;
        photoProgressFill.style.background = 'var(--color-accent-2)';
      } else {
        const err = JSON.parse(xhr.responseText || '{}');
        photoPreviewText.textContent = 'Upload Gagal!';
        showToast(err.message || 'Gagal mengunggah file.', 'error');
      }
    };

    xhr.onerror = () => {
      photoPreviewText.textContent = 'Upload Gagal!';
      showToast('Koneksi terputus saat mengunggah.', 'error');
    };

    xhr.send(formData);
  }

  // Bind Submit event
  form.addEventListener('submit', saveBio);

  // Load initially
  loadBio();
}
