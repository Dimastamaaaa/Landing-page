/**
 * contact-form.js — SOUNDFORM Contact Form Handler
 *
 * Manages form validation, submission, honeypot bot detection,
 * inline error display, and a success state with char-stagger animation.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Expected DOM structure (matching index.html):
 *
 *   #contact-form       — <form> element
 *   #contact-name       — name <input>
 *   #contact-email      — email <input>
 *   #contact-subject    — subject <select>
 *   #contact-message    — message <textarea>
 *   #website            — hidden honeypot <input> (bot trap)
 *   #contact-submit     — submit <button>
 *   #contact-success    — success message container (hidden by default)
 *   #error-name         — inline error for name field
 *   #error-email        — inline error for email field
 *   #error-subject      — inline error for subject field
 *   #error-message      — inline error for message field
 * ──────────────────────────────────────────────────────────────────────
 */

import { charStagger } from './type-effects.js';

// ─── Validation rules ────────────────────────────────────────────────────────
const VALIDATORS = {
  name: {
    test: (v) => v.trim().length >= 2,
    message: 'Nama minimal 2 karakter.'
  },
  email: {
    test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: 'Format email tidak valid.'
  },
  subject: {
    test: (v) => v.trim().length > 0,
    message: 'Pilih subjek pesan.'
  },
  message: {
    test: (v) => v.trim().length >= 10,
    message: 'Pesan minimal 10 karakter.'
  }
};

/**
 * Initialise the contact form.
 *
 * @returns {{ destroy: Function }} cleanup handle
 */
export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) {
    console.warn('[ContactForm] #contact-form not found — skipping init.');
    return { destroy: () => {} };
  }

  // ─── DOM references ────────────────────────────────────────────────
  const fields = {
    name:     document.getElementById('contact-name'),
    email:    document.getElementById('contact-email'),
    subject:  document.getElementById('contact-subject'),
    message:  document.getElementById('contact-message')
  };

  const honeypot    = document.getElementById('website');  // hidden honeypot
  const submitBtn   = document.getElementById('contact-submit');
  const successEl   = document.getElementById('contact-success');

  // Error elements keyed by field name (matching #error-{name} IDs)
  const errorEls = {
    name:    document.getElementById('error-name'),
    email:   document.getElementById('error-email'),
    subject: document.getElementById('error-subject'),
    message: document.getElementById('error-message')
  };

  // Track listeners for cleanup
  const cleanupFns = [];

  // ─── Helpers ───────────────────────────────────────────────────────

  /**
   * Show an inline error for a field.
   */
  function showError(fieldName, message) {
    const errorEl = errorEls[fieldName];
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    const inputEl = fields[fieldName];
    if (inputEl) {
      inputEl.style.borderColor = 'var(--color-accent)';
      // Trigger shake animation
      inputEl.style.animation = 'none';
      void inputEl.offsetWidth; // force reflow
      inputEl.style.animation = 'shake 400ms var(--ease-smooth)';
    }
  }

  /** Clear error state for a field. */
  function clearError(fieldName) {
    const errorEl = errorEls[fieldName];
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }

    const inputEl = fields[fieldName];
    if (inputEl) {
      inputEl.style.borderColor = '';
      inputEl.style.animation = '';
    }
  }

  /** Clear all errors. */
  function clearAllErrors() {
    Object.keys(fields).forEach(clearError);
  }

  /**
   * Validate all fields. Returns true if valid.
   */
  function validate() {
    let isValid = true;

    for (const [name, rule] of Object.entries(VALIDATORS)) {
      const input = fields[name];
      if (!input) continue;

      const value = input.value || '';
      if (!rule.test(value)) {
        showError(name, rule.message);
        isValid = false;
      } else {
        clearError(name);
      }
    }

    return isValid;
  }

  /**
   * Show the success message with a char-stagger animation.
   */
  function showSuccess() {
    if (!successEl) return;
    successEl.classList.add('visible');
    charStagger(successEl, { staggerMs: 30, durationMs: 500 });
  }

  /** Reset form to initial state. */
  function resetForm() {
    form.reset();
    clearAllErrors();
    if (submitBtn) submitBtn.disabled = false;
  }

  // ─── Submit handler ────────────────────────────────────────────────
  async function onSubmit(e) {
    e.preventDefault();

    // Honeypot: if filled, silently bail (it's a bot)
    if (honeypot && honeypot.value.trim() !== '') {
      console.log('[ContactForm] Honeypot triggered — submission ignored.');
      return;
    }

    // Validate
    if (!validate()) return;

    // Gather data
    const data = {};
    for (const [name, input] of Object.entries(fields)) {
      if (input) data[name] = input.value.trim();
    }

    // Disable button while "submitting"
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      showSuccess();
      resetForm();
    } catch (err) {
      console.warn('[ContactForm] Gagal mengirim ke backend, menggunakan simulasi offline.', err);
      // Offline fallback simulation
      setTimeout(() => {
        showSuccess();
        resetForm();
      }, 400);
    }
  }

  form.addEventListener('submit', onSubmit);
  cleanupFns.push(() => form.removeEventListener('submit', onSubmit));

  // ─── Real-time validation: clear error on input ────────────────────
  for (const [name, input] of Object.entries(fields)) {
    if (!input) continue;

    const handler = () => clearError(name);
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
    cleanupFns.push(() => {
      input.removeEventListener('input', handler);
      input.removeEventListener('change', handler);
    });
  }

  // ─── Cleanup ───────────────────────────────────────────────────────
  function destroy() {
    cleanupFns.forEach((fn) => fn());
    cleanupFns.length = 0;
  }

  return { destroy };
}
