/**
 * auth-guard.js — SOUNDFORM Authentication Guard & API Wrapper
 *
 * Ensures pages require a valid JWT token, automatically embeds headers,
 * and handles token expiration / forced redirects to login.html.
 */

const TOKEN_KEY = 'soundform_admin_token';
const EMAIL_KEY = 'soundform_admin_email';
const API_BASE = 'http://localhost:5000/api';

// ─── Immediate Auth Check ─────────────────────────────────────────────
const token = localStorage.getItem(TOKEN_KEY);
if (!token) {
  // Not logged in — redirect to login
  window.location.replace('login.html');
}

/** Global Logout helper. */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  window.location.replace('login.html');
}

/**
 * Fetch wrapper that automatically adds Authorization headers
 * and handles 401 Unauthorized by logging out.
 *
 * @param {string} endpoint - API endpoint (e.g. '/tracks' or '/bio')
 * @param {RequestInit} options - fetch options
 */
export async function adminFetch(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token) {
    logout();
    throw new Error('Not authenticated');
  }

  // Ensure headers exist
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  // If body is object and no content type, make it JSON
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
    options.headers['Content-Type'] = 'application/json';
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const response = await fetch(url, options);

    if (response.status === 401) {
      // Token expired or invalid — clear and redirect
      console.warn('[AuthGuard] Unauthorized call — logging out.');
      logout();
      throw new Error('Session expired');
    }

    return response;
  } catch (err) {
    console.error(`[AuthGuard] API call failed on ${endpoint}:`, err);
    throw err;
  }
}

// ─── Custom Toast Notification Helper ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
});

window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.log(`[Toast Fallback] ${type.toUpperCase()}: ${message}`);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger reflow to enable transition
  toast.offsetHeight;
  toast.classList.add('show');

  // Remove toast after 3.5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 3500);
};
