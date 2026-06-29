/**
 * login.js — SOUNDFORM Admin Login Logic
 *
 * Handles client-side validation, calls the /api/auth/login API,
 * stores the JWT token on success, and handles loading/error states.
 */

const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submit-btn');
  const alertEl = document.getElementById('form-alert');

  // Input error nodes
  const errEmail = document.getElementById('error-email');
  const errPassword = document.getElementById('error-password');

  // Clear errors on input
  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('error');
    errEmail.textContent = '';
    alertEl.classList.remove('visible');
  });

  passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('error');
    errPassword.textContent = '';
    alertEl.classList.remove('visible');
  });

  // Handle Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validate email
    if (!email) {
      emailInput.classList.add('error');
      errEmail.textContent = 'Email harus diisi.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.classList.add('error');
      errEmail.textContent = 'Format email tidak valid.';
      isValid = false;
    }

    // Validate password
    if (!password) {
      passwordInput.classList.add('error');
      errPassword.textContent = 'Password harus diisi.';
      isValid = false;
    }

    if (!isValid) return;

    // Disable button & show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'LOGGING IN...';
    alertEl.classList.remove('visible');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Kredensial tidak valid.');
      }

      // Success: Save token & admin details
      localStorage.setItem('soundform_admin_token', result.token);
      localStorage.setItem('soundform_admin_email', result.admin.email);

      // Redirect to Dashboard
      window.location.href = 'dashboard.html';
    } catch (err) {
      alertEl.textContent = err.message || 'Gagal terhubung ke server.';
      alertEl.classList.add('visible');
      submitBtn.disabled = false;
      submitBtn.textContent = 'ENTER CONTROL PANEL';
    }
  });
});
