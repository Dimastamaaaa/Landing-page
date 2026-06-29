/**
 * dashboard.js — SOUNDFORM Admin Dashboard Coordinator
 *
 * Manages tab switching, initial loading of stats, logout operations,
 * and initializes sub-modules for tracks, albums, bio, and inbox.
 */

import { logout, adminFetch } from './auth-guard.js';
import { initTracksTab } from './tabs/tracks.js';
import { initAlbumsTab } from './tabs/albums.js';
import { initBioTab } from './tabs/bio.js';
import { initInboxTab } from './tabs/inbox.js';

const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  // Set user profile info
  const adminEmailEl = document.getElementById('admin-email');
  if (adminEmailEl) {
    adminEmailEl.textContent = localStorage.getItem('soundform_admin_email') || 'Admin';
  }

  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin keluar dari control panel?')) {
        logout();
      }
    });
  }

  // Stats Elements
  const stats = {
    tracks: document.getElementById('stat-tracks'),
    plays: document.getElementById('stat-plays'),
    unread: document.getElementById('stat-unread'),
    inboxBadge: document.getElementById('inbox-badge-unread')
  };

  // Tab Navigation Handling
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.tab-panel');
  const titleEl = document.getElementById('current-panel-title');

  const panelTitles = {
    'panel-tracks': 'Tracks Management',
    'panel-albums': 'Albums & EP Releases',
    'panel-bio': 'Artist Biography Editor',
    'panel-inbox': 'Contact Inbox Messages'
  };

  // Sub-modules initialization handles
  let tabInitializers = {
    'panel-tracks': initTracksTab,
    'panel-albums': initAlbumsTab,
    'panel-bio': initBioTab,
    'panel-inbox': initInboxTab
  };

  // Keep track of loaded status per tab to prevent duplicate initialization
  const loadedTabs = new Set();

  function switchTab(targetPanelId) {
    // 1. Toggle Active Nav items
    navItems.forEach(item => {
      const isTarget = item.getAttribute('data-target') === targetPanelId;
      item.classList.toggle('active', isTarget);
    });

    // 2. Toggle Panel visibility
    panels.forEach(panel => {
      const isTarget = panel.id === targetPanelId;
      panel.classList.toggle('active', isTarget);
    });

    // 3. Set panel title
    if (titleEl) {
      titleEl.textContent = panelTitles[targetPanelId] || 'Management';
    }

    // 4. Lazy initialize tab script logic
    if (tabInitializers[targetPanelId] && !loadedTabs.has(targetPanelId)) {
      tabInitializers[targetPanelId]();
      loadedTabs.add(targetPanelId);
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      switchTab(target);
    });
  });

  // ─── Fetch Stats function ───────────────────────────────────────────
  async function fetchDashboardStats() {
    try {
      // 1. Fetch tracks list to calculate counts and plays
      const trackRes = await adminFetch('/tracks?all=true');
      const tracks = await trackRes.json();

      if (stats.tracks) stats.tracks.textContent = tracks.length;

      const totalPlays = tracks.reduce((sum, t) => sum + (t.playCount || 0), 0);
      if (stats.plays) stats.plays.textContent = totalPlays;

      // 2. Fetch contact messages
      const contactsRes = await adminFetch('/contact/admin/contacts');
      const contacts = await contactsRes.json();
      const unreadCount = contacts.filter(c => !c.isRead).length;

      if (stats.unread) stats.unread.textContent = unreadCount;
      if (stats.inboxBadge) {
        stats.inboxBadge.textContent = unreadCount;
        stats.inboxBadge.classList.toggle('visible', unreadCount > 0);
      }
    } catch (err) {
      console.error('[Dashboard] Gagal memuat data statistik:', err);
    }
  }

  // Export refresh helper globally so individual tabs can call it
  window.refreshDashboardStats = fetchDashboardStats;

  // Initialize
  fetchDashboardStats();
  
  // Start with Tracks tab
  switchTab('panel-tracks');
});
