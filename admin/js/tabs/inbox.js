/**
 * inbox.js — SOUNDFORM Admin Contact Inbox Module
 *
 * Manages fetching contact messages, displaying them, opening detail drawer,
 * and marking unread messages as read.
 */

import { adminFetch } from '../auth-guard.js';

export function initInboxTab() {
  const tableBody = document.getElementById('inbox-table-body');
  const modal = document.getElementById('modal-message');
  const closeBtn = document.getElementById('close-modal-message');
  const closeBtnFooter = document.getElementById('btn-close-message');
  const markReadBtn = document.getElementById('btn-mark-read');
  
  // Drawer Detail Fields
  const msgSender = document.getElementById('msg-sender');
  const msgEmail = document.getElementById('msg-email');
  const msgSubject = document.getElementById('msg-subject');
  const msgDate = document.getElementById('msg-date');
  const msgBody = document.getElementById('msg-body');

  let currentSelectedMessage = null;

  // ─── Fetch & Render List ───────────────────────────────────────────
  async function loadInbox() {
    try {
      const res = await adminFetch('/contact/admin/contacts');
      const messages = await res.json();
      renderInbox(messages);
      
      // Update global unread count badge
      if (typeof window.refreshDashboardStats === 'function') {
        window.refreshDashboardStats();
      }
    } catch (err) {
      console.error('[InboxTab] Gagal memuat pesan masuk:', err);
    }
  }

  function renderInbox(messages) {
    if (!tableBody) return;

    if (messages.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--color-text-lo); padding: 3rem;">
            Tidak ada pesan masuk.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = messages
      .map((msg) => {
        const dateStr = new Date(msg.createdAt).toLocaleString('id-ID', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const statusBadge = msg.isRead
          ? '<span class="badge badge-read">Read</span>'
          : '<span class="badge badge-unread">Unread</span>';

        // Truncate message body for table preview snippet
        const snippet = msg.message.length > 50
          ? msg.message.substring(0, 47) + '...'
          : msg.message;

        return `
          <tr data-id="${msg.id}" style="${!msg.isRead ? 'font-weight: bold; background: rgba(232, 66, 10, 0.01);' : ''}">
            <td>${dateStr}</td>
            <td>${msg.name}</td>
            <td><span class="about__genre-tag" style="border-color: var(--color-border); font-size: 0.65rem; padding: 2px 6px;">${msg.subject}</span></td>
            <td style="color: var(--color-text-lo); font-size: 0.8125rem;">${snippet}</td>
            <td>${statusBadge}</td>
            <td>
              <button class="primary-btn btn-view" style="padding: 4px 10px; font-size: 0.7rem;">VIEW</button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Bind action events
    tableBody.querySelectorAll('.btn-view').forEach((btn, idx) => {
      btn.addEventListener('click', () => openMessageDetail(messages[idx]));
    });
  }

  // ─── Modal Open/Close Controls ─────────────────────────────────────
  function openMessageDetail(msg) {
    currentSelectedMessage = msg;

    // Fill message details
    msgSender.textContent = msg.name;
    msgEmail.innerHTML = `<a href="mailto:${msg.email}" style="color: var(--color-accent); text-decoration: underline;">${msg.email}</a>`;
    msgSubject.textContent = msg.subject;
    msgBody.textContent = msg.message;
    
    msgDate.textContent = new Date(msg.createdAt).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Show/Hide "Mark as Read" button
    if (msg.isRead) {
      markReadBtn.style.display = 'none';
    } else {
      markReadBtn.style.display = 'block';
      markReadBtn.textContent = 'MARK AS READ';
      markReadBtn.disabled = false;
    }

    modal.classList.add('open');
  }

  function closeMessageDetail() {
    modal.classList.remove('open');
    currentSelectedMessage = null;
  }

  // ─── Mark as Read Action ───────────────────────────────────────────
  async function markAsRead() {
    if (!currentSelectedMessage) return;

    markReadBtn.disabled = true;
    markReadBtn.textContent = 'MARKING...';

    try {
      const response = await adminFetch(`/contact/admin/contacts/${currentSelectedMessage.id}/read`, {
        method: 'PUT'
      });

      if (!response.ok) throw new Error('Failed to mark read');
      
      closeMessageDetail();
      loadInbox();
      showToast('Pesan berhasil ditandai telah dibaca! ✓', 'success');
    } catch (err) {
      showToast('Gagal memperbarui status pesan.', 'error');
      markReadBtn.disabled = false;
      markReadBtn.textContent = 'MARK AS READ';
    }
  }

  // Bind Buttons
  closeBtn.addEventListener('click', closeMessageDetail);
  closeBtnFooter.addEventListener('click', closeMessageDetail);
  markReadBtn.addEventListener('click', markAsRead);

  // Load initially
  loadInbox();
}
