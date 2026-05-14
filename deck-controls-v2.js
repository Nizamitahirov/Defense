/* =============================================================
   BEYOND SALES — DEFENSE DECK V2 · CONTROLS
   Theme toggle (D), Speaker notes (N), accessibility
============================================================= */

(() => {
  'use strict';

  const STORAGE_KEY = 'beyond-sales-deck-prefs';
  const HINT_DISMISSED = 'beyond-sales-hint-dismissed';

  // --- Read persisted prefs ---
  const prefs = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  })();

  function savePrefs() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
  }

  // --- Detect preferred theme ---
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = prefs.theme || (prefersDark ? 'dark' : 'light');

  // --- Apply theme to root ---
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    prefs.theme = t;
    savePrefs();
    // update toggle aria-pressed + label
    const btn = document.getElementById('theme-btn');
    if (btn) {
      btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      const label = btn.querySelector('.ctrl-label');
      if (label) label.textContent = t === 'dark' ? 'Dark' : 'Light';
      const iconSun = btn.querySelector('.icon-sun');
      const iconMoon = btn.querySelector('.icon-moon');
      if (iconSun && iconMoon) {
        iconSun.style.display = t === 'dark' ? 'none' : 'block';
        iconMoon.style.display = t === 'dark' ? 'block' : 'none';
      }
      btn.setAttribute('aria-label',
        t === 'dark' ? 'Switch to light theme (press D)' : 'Switch to dark theme (press D)');
    }
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    announce(`${next === 'dark' ? 'Dark' : 'Light'} theme activated`);
  }

  // --- Speaker notes ---
  let notesData = [];
  try {
    const tag = document.getElementById('speaker-notes');
    if (tag) notesData = JSON.parse(tag.textContent);
  } catch (e) {
    console.warn('Speaker notes parse failed', e);
  }

  let currentSlide = 0;
  let totalSlides = 0;

  function setNote(idx) {
    currentSlide = idx;
    const body = document.getElementById('notes-body');
    const counter = document.getElementById('notes-counter');
    if (body) {
      const note = notesData[idx] || 'No notes for this slide.';
      body.innerHTML = `<p>${escapeHtml(note)}</p>`;
    }
    if (counter) {
      counter.textContent = `Slide ${String(idx + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toggleNotes() {
    const panel = document.getElementById('notes-panel');
    const btn = document.getElementById('notes-btn');
    if (!panel) return;
    const isOpen = panel.getAttribute('aria-hidden') === 'false';
    panel.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    if (btn) btn.setAttribute('aria-pressed', isOpen ? 'false' : 'true');
    if (!isOpen) {
      setNote(currentSlide);
      // Focus the close button for accessibility
      requestAnimationFrame(() => {
        const close = document.getElementById('notes-close');
        if (close) close.focus();
      });
      announce(`Speaker notes opened, slide ${currentSlide + 1}`);
    } else {
      announce('Speaker notes closed');
      if (btn) btn.focus();
    }
  }

  // --- ARIA live region for screen-reader announcements ---
  function announce(msg) {
    const live = document.getElementById('sr-announce');
    if (live) {
      live.textContent = '';
      requestAnimationFrame(() => { live.textContent = msg; });
    }
  }

  // --- Build floating UI ---
  function buildUI() {
    // SR live region
    const live = document.createElement('div');
    live.id = 'sr-announce';
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    document.body.appendChild(live);

    // Controls cluster
    const controls = document.createElement('div');
    controls.className = 'deck-controls';
    controls.setAttribute('role', 'toolbar');
    controls.setAttribute('aria-label', 'Deck controls');
    controls.innerHTML = `
      <button id="notes-btn" type="button" class="ctrl-btn"
        aria-pressed="false"
        aria-controls="notes-panel"
        aria-label="Toggle speaker notes (press N)">
        <svg class="ctrl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M4 5h16M4 10h16M4 15h10" stroke-linecap="round"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <span class="ctrl-label">Notes</span>
        <span class="kbd">N</span>
      </button>
      <div class="ctrl-divider" role="separator"></div>
      <button id="theme-btn" type="button" class="ctrl-btn"
        aria-pressed="false"
        aria-label="Toggle dark theme (press D)">
        <svg class="ctrl-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke-linecap="round"/>
        </svg>
        <svg class="ctrl-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="display:none;">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-linejoin="round"/>
        </svg>
        <span class="ctrl-label">Light</span>
        <span class="kbd">D</span>
      </button>
    `;
    document.body.appendChild(controls);

    // Notes panel
    const panel = document.createElement('aside');
    panel.id = 'notes-panel';
    panel.className = 'notes-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-labelledby', 'notes-heading');
    panel.setAttribute('role', 'complementary');
    panel.innerHTML = `
      <div class="notes-header">
        <div class="notes-title" id="notes-heading">
          <span class="dot" aria-hidden="true"></span>
          Speaker Notes
          <span class="notes-counter" id="notes-counter" aria-live="polite">Slide 01 / ${totalSlides}</span>
        </div>
        <button id="notes-close" type="button" class="notes-close" aria-label="Close speaker notes (press N or Escape)">
          Close <span class="kbd">N</span>
        </button>
      </div>
      <div class="notes-body" id="notes-body" tabindex="0" aria-live="polite"></div>
    `;
    document.body.appendChild(panel);

    // Keyboard hint (auto-dismissed)
    if (!localStorage.getItem(HINT_DISMISSED)) {
      const hint = document.createElement('div');
      hint.className = 'kbd-hint';
      hint.setAttribute('role', 'status');
      hint.innerHTML = `
        <span>Press <span class="kbd">N</span> for notes</span>
        <span>·</span>
        <span><span class="kbd">D</span> to toggle theme</span>
      `;
      document.body.appendChild(hint);
      requestAnimationFrame(() => hint.classList.add('show'));
      setTimeout(() => {
        hint.classList.remove('show');
        setTimeout(() => hint.remove(), 600);
        try { localStorage.setItem(HINT_DISMISSED, '1'); } catch {}
      }, 5500);
    }

    // Wire events
    document.getElementById('notes-btn').addEventListener('click', toggleNotes);
    document.getElementById('notes-close').addEventListener('click', toggleNotes);
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  }

  // --- Keyboard handlers ---
  function onKey(e) {
    // Ignore when user is typing in a field
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    // N — toggle notes
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      toggleNotes();
      return;
    }
    // D — toggle theme
    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      toggleTheme();
      return;
    }
    // Escape — close notes if open
    if (e.key === 'Escape') {
      const panel = document.getElementById('notes-panel');
      if (panel && panel.getAttribute('aria-hidden') === 'false') {
        e.stopPropagation();
        toggleNotes();
      }
    }
  }

  // --- Listen for slide changes from deck-stage ---
  function wireSlideChange() {
    const deck = document.querySelector('deck-stage');
    if (!deck) return;
    totalSlides = deck.children.length;

    deck.addEventListener('slidechange', (e) => {
      const idx = e.detail.index;
      currentSlide = idx;
      // If notes are open, refresh content
      const panel = document.getElementById('notes-panel');
      if (panel && panel.getAttribute('aria-hidden') === 'false') {
        setNote(idx);
      } else {
        // Still update counter so it's current when reopened
        const counter = document.getElementById('notes-counter');
        if (counter) {
          counter.textContent = `Slide ${String(idx + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
        }
      }
    });
  }

  // --- Boot ---
  function init() {
    // Apply theme as early as possible
    document.documentElement.setAttribute('data-theme', initialTheme);

    buildUI();
    applyTheme(initialTheme);
    wireSlideChange();
    setNote(0);

    document.addEventListener('keydown', onKey);
  }

  // Wait for deck-stage to be defined
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      customElements.whenDefined('deck-stage').then(init);
    });
  } else {
    customElements.whenDefined('deck-stage').then(init);
  }
})();
