// shared-theme.js — theme tokens + shared workspace shell for every LADO environment.
//
// Exports:
//   applyTheme(mode)            set 'light' | 'dark' on <html data-theme>
//   getTheme()                  current mode
//   toggleTheme()               flip and return the new mode
//   onThemeChange(fn)           subscribe to theme changes
//   createWorkspace(el, config) render the three-column course workspace
//   escapeHtml(value)

const STORAGE_KEY = 'lado-theme';
const listeners = new Set();

/* ============================================================
   1. THEME
   ============================================================ */

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function applyTheme(mode = 'dark') {
  const next = mode === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage disabled */ }
  listeners.forEach((fn) => fn(next));
  return next;
}

export function toggleTheme() {
  return applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function restoreTheme(fallback = 'dark') {
  let stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* storage disabled */ }
  return applyTheme(stored || fallback);
}

// C# lessons borrow the C++ scenes: the C# code is rewritten as C++ for them, and data-visual names the C++ lesson to borrow.
const csLooksLikeCs = text => /\bstatic\s+void\s+Main\b/.test(String(text));
window.__ladoCsSrc = text => (window.__ladoCsToCpp && csLooksLikeCs(text) ? window.__ladoCsToCpp(text) : text);
window.__ladoCode = el => window.__ladoCsSrc(el.value);
window.__ladoVH = lab => { if (lab && lab.getAttribute('data-lang') === 'csharp' && lab.classList.contains('is-diy')) return null; const d = lab && lab.getAttribute('data-visual'); return d ? { textContent: d } : lab && lab.querySelector('.cpp-flat-lesson h2'); };
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

/* ============================================================
   2. WORKSPACE STYLES
   ============================================================ */

const WORKSPACE_CSS = `
.lado-ws, .lado-ws *, .lado-ws *::before, .lado-ws *::after { box-sizing: border-box; }

.lado-ws {
  --ws-surface: rgba(255, 255, 255, 0.55);
  --ws-surface-alt: rgba(255, 255, 255, 0.75);
  --ws-border: rgba(0, 0, 0, 0.08);
  --ws-line: rgba(0, 0, 0, 0.06);
  --ws-text: rgba(0, 0, 0, 0.85);
  --ws-muted: rgba(0, 0, 0, 0.45);
  --ws-accent: #007aff;
  --ws-accent-soft: rgba(0, 122, 255, 0.14);
  --ws-code-bg: rgba(255, 255, 255, 0.6);
  --ws-danger: #d70015;

  position: absolute; inset: 0; display: flex; flex-direction: column; min-height: 0;
  color: var(--ws-text);
  font: 13px/1.45 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
}

[data-theme="dark"] .lado-ws {
  --ws-surface: rgba(30, 30, 35, 0.5);
  --ws-surface-alt: rgba(48, 48, 54, 0.55);
  --ws-border: rgba(255, 255, 255, 0.12);
  --ws-line: rgba(255, 255, 255, 0.08);
  --ws-text: rgba(255, 255, 255, 0.9);
  --ws-muted: rgba(255, 255, 255, 0.5);
  --ws-accent: #0a84ff;
  --ws-accent-soft: rgba(10, 132, 255, 0.22);
  --ws-code-bg: rgba(0, 0, 0, 0.35);
  --ws-danger: #ff453a;
}

/* Panels laufen beim Mount gestaffelt ein. */
@keyframes lado-in {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to   { opacity: 1; transform: none; }
}
.lado-ws-header  { animation: lado-in .38s cubic-bezier(0.16, 1, 0.3, 1) both .02s; }
.lado-ws-sidebar { animation: lado-in .42s cubic-bezier(0.16, 1, 0.3, 1) both .06s; }
.lado-ws-main    { animation: lado-in .42s cubic-bezier(0.16, 1, 0.3, 1) both .10s; }
.lado-ws-tutor   { animation: none; }
@media (prefers-reduced-motion: reduce) {
  .lado-ws-header, .lado-ws-sidebar, .lado-ws-main, .lado-ws-tutor { animation: none; }
}

.lado-glass {
  background: var(--ws-surface);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--ws-border);
  border-radius: 16px;
  box-shadow: 0 20px 40px -24px rgba(0, 0, 0, 0.5), inset 0 1px 1px -1px rgba(255, 255, 255, 0.5);
}

/* ---- header ---- */
.lado-ws-header {
  flex: 0 0 auto; display: grid; align-items: center; gap: 12px;
  grid-template-columns: auto minmax(0, 1fr) auto; padding: 8px 4px 12px;
}
.lado-ws-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.lado-header-back { flex: 0 0 auto; }
.lado-ws-title h1 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
.lado-ws-title .lado-ws-sub { color: var(--ws-muted); font-size: 12px; }
.lado-ws-search {
  justify-self: center; display: flex; align-items: center; gap: 8px;
  width: min(420px, 100%); height: 32px; padding: 0 12px; border-radius: 99px;
  color: var(--ws-muted);
}
.lado-ws-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--ws-text); font: inherit; }
.lado-ws-tools { display: flex; align-items: center; gap: 8px; }

/* ---- shell ---- */
.lado-ws-shell {
  flex: 1 1 auto; min-height: 0; display: grid; gap: 12px;
  grid-template-columns: 232px minmax(0, 1fr) 320px;
  transition: grid-template-columns .65s cubic-bezier(0.22, 1, 0.36, 1);
}
.lado-ws-shell.is-tutor-hidden { grid-template-columns: 232px minmax(0, 1fr) 0px; }
.lado-ws-shell.is-sidebar-collapsed { grid-template-columns: 42px minmax(0, 1fr) 320px; }
.lado-ws-shell.is-sidebar-collapsed.is-tutor-hidden { grid-template-columns: 42px minmax(0, 1fr) 0px; }
.lado-ws-shell.is-sidebar-collapsed .lado-ws-sidebar > :not(.lado-sidebar-toggle) { display: none; }

/* ---- sidebar ---- */
.lado-ws-sidebar { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.lado-sidebar-toggle { flex: 0 0 auto; align-self: flex-end; margin: 8px 8px 0 auto; }
.lado-back {
  flex: 0 0 auto; display: flex; align-items: center; gap: 8px; margin: 8px 8px 0;
  padding: 8px 10px; border: 1px solid var(--ws-border); border-radius: 10px;
  background: var(--ws-surface-alt); color: inherit; font: inherit; font-size: 13px;
  cursor: pointer; transition: background .2s ease, color .2s ease;
}
.lado-back:hover { background: var(--ws-accent-soft); color: var(--ws-accent); }
.lado-tree { flex: 1 1 auto; overflow: auto; padding: 10px 8px; }
.lado-tree ul { list-style: none; margin: 0; padding-left: 14px; }
.lado-tree > ul { padding-left: 0; }
.lado-node {
  display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 8px;
  border: 0; border-radius: 8px; background: transparent; color: inherit;
  font: inherit; text-align: left; cursor: pointer;
}
.lado-node:hover { background: var(--ws-surface-alt); }
.lado-node.is-active { background: var(--ws-accent-soft); color: var(--ws-accent); font-weight: 600; }
.lado-caret { flex: 0 0 10px; width: 10px; font-size: 9px; color: var(--ws-muted); }
.lado-dot { flex: 0 0 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .45; }
.lado-node-label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.lado-hidden { display: none; }
.lado-ws-sidebar-foot { flex: 0 0 auto; display: grid; gap: 2px; padding: 8px; border-top: 1px solid var(--ws-line); }

/* ---- lesson column ---- */
.lado-ws-main { display: block; min-height: 0; }
.lado-lesson { display: block; height: 100%; min-height: 0; overflow: hidden; }
.lado-lesson-body { display: flex; flex-direction: column; gap: 12px; min-height: 0; padding: 14px; }
.lado-crumbs { display: flex; flex-wrap: wrap; gap: 6px; color: var(--ws-muted); font-size: 12px; }
.lado-crumbs.is-title { color: var(--ws-text); font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
.lado-lesson-head { padding: 12px 14px; border: 1px solid var(--ws-border); border-radius: 12px; background: var(--ws-surface-alt); }
.lado-lesson-head h2 { margin: 0 0 4px; font-size: 15px; letter-spacing: -0.01em; }
.lado-lesson-head p { margin: 0; color: var(--ws-muted); font-size: 12px; }
.lado-exercises { flex: 1 1 auto; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-content: start; }
.lado-exercise {
  display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 10px;
  min-width: 0; aspect-ratio: 1; padding: 10px; text-align: left;
  border: 1px solid var(--ws-border); border-radius: 12px; background: var(--ws-surface-alt);
  overflow: hidden; cursor: pointer; transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.lado-exercise:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -16px rgba(0, 0, 0, .55); }
.lado-exercise.is-active { border-color: var(--ws-accent); }
.lado-exercise-image { width: 100%; min-height: 0; flex: 1 1 auto; object-fit: cover; border-radius: 9px; display: block; }
.lado-exercise-copy { position: relative; display: flex; align-items: center; justify-content: center; min-height: 28px; padding: 0 30px; text-align: center; }
.lado-exercise-badge {
  position: absolute; left: 0; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center;
  background: var(--ws-accent-soft); color: var(--ws-accent); font-size: 11px; font-weight: 700;
}
.lado-exercise h3 { margin: 0; font-size: 17px; line-height: 1.2; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lado-exercise > div:last-child { min-width: 0; max-width: 100%; overflow: hidden; }
.lado-exercise p { display: none; }
@media (max-width: 1000px) { .lado-exercises { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 620px) { .lado-exercises { grid-template-columns: 1fr; } }
.lado-exercise pre, .lado-editor textarea, .lado-output, .lado-table {
  font: 12px/1.55 "LadoMono", "DejaVu Sans Mono", "Liberation Mono", "SF Mono", Menlo, Consolas, monospace, "SFMono-Regular", "LadoMono", "DejaVu Sans Mono", "Liberation Mono", "SF Mono", Menlo, Consolas, monospace;
}
.lado-exercise pre { margin: 0; padding: 10px 12px; overflow: auto; border-radius: 10px; background: var(--ws-code-bg); }
.lado-topic-lesson { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 8px 2px 2px; }
.lado-topic-lesson h2 { margin: 0 0 8px; font-size: 22px; }
.lado-topic-lesson > p { max-width: 680px; margin: 0 0 18px; color: var(--ws-muted); }
.lado-topic-section { padding: 12px 14px; margin-bottom: 10px; border: 1px solid var(--ws-border); border-radius: 10px; background: var(--ws-surface-alt); }
.lado-topic-section h3 { margin: 0 0 5px; font-size: 14px; }
.lado-topic-section p { margin: 0; color: var(--ws-muted); font-size: 12px; }
.lado-topic-back { align-self: flex-start; margin-bottom: 4px; }
.lado-topic-path { display: flex; align-items: center; gap: 7px; color: var(--ws-muted); font-size: 12px; }
.lado-topic-path button { display: inline-grid; place-items: center; width: 26px; height: 26px; padding: 0; }

/* ---- editor ---- */
.lado-editor-shell { display: flex; flex-direction: column; min-height: 210px; overflow: hidden; }
.lado-tabs { display: flex; gap: 2px; padding: 8px 10px 0; border-bottom: 1px solid var(--ws-line); overflow-x: auto; scrollbar-width: none; }
.lado-tabs::-webkit-scrollbar { display: none; }
.lado-tab {
  flex: 0 0 auto; padding: 7px 14px; border: 0; border-bottom: 2px solid transparent;
  background: transparent; color: var(--ws-muted); font: inherit; cursor: pointer;
}
.lado-tab.is-active { color: var(--ws-accent); border-bottom-color: var(--ws-accent); }
.lado-editor { flex: 1 1 auto; display: flex; min-height: 0; padding: 12px; }
.lado-editor textarea {
  flex: 1 1 auto; resize: none; padding: 12px; border-radius: 12px; outline: 0;
  border: 1px solid var(--ws-border); background: var(--ws-code-bg); color: var(--ws-text);
}
.lado-output {
  margin: 0 12px; padding: 10px 12px; max-height: 130px; overflow: auto; white-space: pre-wrap;
  border: 1px solid var(--ws-border); border-radius: 12px; background: var(--ws-code-bg); color: var(--ws-muted);
}
.lado-output.is-error { color: var(--ws-danger); }
.lado-output.is-ok { color: #30d158; }
.lado-table { width: 100%; border-collapse: collapse; }
.lado-table th, .lado-table td { padding: 4px 10px 4px 0; text-align: left; }
.lado-table th { color: var(--ws-text); border-bottom: 1px solid var(--ws-border); }
/* ---- controls ---- */
.lado-btn {
  padding: 7px 16px; border-radius: 99px; border: 1px solid var(--ws-border);
  background: var(--ws-surface-alt); color: var(--ws-text); font: inherit; font-weight: 600; cursor: pointer;
  transition: transform .15s ease, border-color .2s ease;
}
.lado-btn:hover { border-color: var(--ws-accent); }
.lado-btn:active { transform: scale(0.96); }
.lado-btn.is-primary { background: var(--ws-accent); border-color: var(--ws-accent); color: #fff; }
.lado-btn[disabled] { opacity: .55; cursor: default; transform: none; }
.lado-icon-btn {
  display: grid; place-items: center; width: 30px; height: 30px; padding: 0; cursor: pointer;
  border: 1px solid var(--ws-border); border-radius: 50%; background: var(--ws-surface-alt); color: var(--ws-muted);
}
.lado-icon-btn:hover { color: var(--ws-text); }
.lado-select {
  padding: 5px 10px; border-radius: 99px; border: 1px solid var(--ws-border);
  background: var(--ws-surface-alt); color: var(--ws-text); font: inherit;
}

/* ---- tutor ---- */
.lado-ws-tutor {
  display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: 12px;
  min-width: 0; min-height: 0; overflow: hidden;
  opacity: 1; transform: translateX(0) scale(1); visibility: visible;
  transition: opacity .38s ease, transform .65s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s;
}
.lado-ws-shell.is-tutor-hidden .lado-ws-tutor {
  opacity: 0; transform: translateX(28px) scale(.98); visibility: hidden; pointer-events: none;
  transition: opacity .3s ease, transform .55s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear .55s;
}
.lado-ws-tutor > * { overflow: hidden; }
.lado-messages { overflow: auto; padding: 12px; display: grid; gap: 12px; align-content: start; }
.lado-message { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 8px; }
.lado-message-avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--ws-accent-soft); }
.lado-bubble { padding: 9px 12px; border-radius: 12px; border: 1px solid var(--ws-border); background: var(--ws-surface-alt); font-size: 12px; white-space: pre-wrap; }
.lado-message.is-user .lado-bubble { background: var(--ws-accent-soft); border-color: transparent; }
.lado-bubble-actions { display: flex; gap: 6px; margin-top: 10px; }
.lado-empty { margin: auto; padding: 28px 14px; text-align: center; color: var(--ws-muted); font-size: 12px; }
.lado-composer { display: grid; gap: 8px; padding: 12px; }
.lado-composer textarea {
  width: 100%; min-height: 58px; resize: vertical; padding: 9px 12px; outline: 0;
  border: 1px solid var(--ws-border); border-radius: 12px;
  background: var(--ws-surface-alt); color: var(--ws-text); font: inherit;
}
.lado-composer-row { display: flex; align-items: center; gap: 8px; }
.lado-composer-row .lado-spacer { flex: 1 1 auto; }

@media (max-width: 1100px) {
  .lado-ws-shell, .lado-ws-shell.is-tutor-hidden { grid-template-columns: minmax(0, 1fr); grid-auto-rows: minmax(0, auto); overflow: auto; }
  .lado-ws-sidebar, .lado-ws-tutor { max-height: 320px; }
}
`;

export const ICONS = {
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
  sidebar: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg>',
  tutor: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  clip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>',
  back: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  sun: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
  moon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"/></svg>',
  send: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6"/><path d="m6 12 6-6 6 6"/></svg>',
};

function injectWorkspaceStyles() {
  if (document.getElementById('lado-workspace-styles')) return;
  const style = document.createElement('style');
  style.id = 'lado-workspace-styles';
  style.textContent = WORKSPACE_CSS;
  document.head.appendChild(style);
}

/* ============================================================
   3. WORKSPACE MARKUP
   ============================================================ */

function renderTree(nodes, depth = 0) {
  return nodes.map((node) => {
    const children = node.children || [];
    const hasChildren = children.length > 0;
    const expanded = Boolean(node.expanded);
    return `
      <li>
        <button type="button" class="lado-node ${node.active ? 'is-active' : ''}" data-node="${escapeHtml(node.id || node.label)}"
                ${hasChildren ? `aria-expanded="${expanded}"` : ''}>
          <span class="lado-caret" aria-hidden="true"></span>
          ${node.icon ? `<img class="lado-tree-icon" src="${escapeHtml(node.icon)}" alt="" loading="lazy" />` : (depth > 0 && !hasChildren ? '<span class="lado-dot"></span>' : '')}
          <span class="lado-node-label">${escapeHtml(node.label)}</span>
        </button>
        ${hasChildren ? `<ul class="${expanded ? '' : 'lado-hidden'}">${renderTree(children, depth + 1)}</ul>` : ''}
      </li>`;
  }).join('');
}

function renderExercises(exercises) {
  return exercises.map((ex, i) => `
    <article class="lado-exercise ${i === 0 ? 'is-active' : ' '}" data-exercise="${escapeHtml(ex.id)}" style="--topic-index:${i}">
      ${ex.image ? `<img class="lado-exercise-image" src="${escapeHtml(ex.image)}" alt="" loading="lazy" />` : ""}
      <div class="lado-exercise-copy">
        <div>
          <h3>${escapeHtml(ex.title)}</h3>
        </div>
      </div>
    </article>`).join('');
}

const SUBTOPIC_ICON_PATHS = [
  "<path d='M8 9l-3 3 3 3M16 9l3 3-3 3M14 5l-4 14'/>",
  "<rect x='4' y='4' width='16' height='16' rx='4'/><path d='M9 9h6M9 12h6M9 15h4'/>",
  "<path d='M12 3l7 3v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3z'/><path d='M9 12l2 2 4-4'/>",
  "<path d='M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8'/>",
  "<path d='M7 7h11l-3-3M17 17H6l3 3'/><path d='M18 7l-3 3M6 17l3-3'/>",
  "<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/>",
  "<path d='M12 5v14M5 12h14'/><circle cx='12' cy='12' r='9'/>",
  "<path d='M4 7h10M18 7h2M4 12h2M10 12h10M4 17h7M15 17h5'/><circle cx='16' cy='7' r='2'/><circle cx='8' cy='12' r='2'/><circle cx='13' cy='17' r='2'/>",
  "<path d='M6 4h9l3 3v13H6z'/><path d='M15 4v4h4M9 12h6M9 16h5'/>",
];

function renderSubtopicIcon(index) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${SUBTOPIC_ICON_PATHS[index % SUBTOPIC_ICON_PATHS.length]}</svg>`;
}

function renderTopicLesson(exercise) {
  const lesson = exercise.lesson;
  if (lesson.subtopics) {
    return `
      <div class="lado-topic-lesson" data-role="topic-lesson">
        <h2>${escapeHtml(lesson.title)}</h2>
        <div class="lado-subtopic-grid">
          ${lesson.subtopics.map((subtopic, index) => `
            <article class="lado-subtopic-card" data-subtopic-index="${index}" role="button" tabindex="0" style="--card-index:${index}">
              ${lesson.iconPath
                ? `<img class="lado-subtopic-image" src="${escapeHtml(`${lesson.iconPath}/${index + 1}.png`)}" alt="" loading="eager" />`
                : `<span class="lado-subtopic-icon" aria-hidden="true">${renderSubtopicIcon(index)}</span>`}
              <h3>${escapeHtml(subtopic.title)}</h3>
            </article>`).join("")}
        </div>
      </div>`;
  }
  return `
    <div class="lado-topic-lesson" data-role="topic-lesson">
      <h2>${escapeHtml(lesson.title)}</h2>
      <p>${escapeHtml(lesson.intro)}</p>
      ${lesson.sections.map((section) => `
        <section class="lado-topic-section">
          <h3>${escapeHtml(section.title)}</h3>
          <p>${escapeHtml(section.text)}</p>
        </section>`).join("")}
    </div>`;
}


function normalizeCppNewlines(code) {
  return String(code || "")
    .replace(/<<\s*"\\\\n"/g, "<< endl")
    .replace(/<<\s*'\\\\n'/g, "<< endl")
    .replace(/<<\s*"\\n"/g, "<< endl")
    .replace(/<<\s*'\\n'/g, "<< endl");
}

const CPP_HIGHLIGHT_PATTERN = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|^\s*#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:alignas|auto|bool|break|case|catch|char|class|const|constexpr|continue|default|do|double|else|enum|explicit|false|float|for|if|int|long|namespace|new|nullptr|private|protected|public|return|short|signed|sizeof|static|std|struct|switch|this|throw|true|try|typedef|typename|using|virtual|void|volatile|unsigned|while|cout|cin|endl)\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFuUlL]*\b|(?:<<|>>|<=|>=|==|!=|&&|\|\||\+\+|--|->|[=+\-*\/%<>!&|^~?:])/gm;
const CPP_TYPE_KEYWORDS = new Set(['auto', 'bool', 'char', 'double', 'float', 'int', 'long', 'short', 'signed', 'unsigned', 'void']);
const CPP_CONTROL_KEYWORDS = new Set(['break', 'case', 'catch', 'continue', 'default', 'do', 'else', 'for', 'if', 'return', 'switch', 'throw', 'try', 'while']);
const CPP_STANDARD_NAMES = new Set(['cout', 'cin', 'endl']);

function highlightCpp(code) {
  const source = normalizeCppNewlines(code);
  let result = '';
  let cursor = 0;
  for (const match of source.matchAll(CPP_HIGHLIGHT_PATTERN)) {
    const token = match[0];
    const start = match.index;
    let kind = 'operator';
    if (token.startsWith('//') || token.startsWith('/*')) kind = 'comment';
    else if (token.trimStart().startsWith('#')) kind = 'directive';
    else if (token.startsWith('"') || token.startsWith("'")) kind = 'string';
    else if (/^\d/.test(token)) kind = 'number';
    else if (CPP_TYPE_KEYWORDS.has(token)) kind = 'type';
    else if (CPP_CONTROL_KEYWORDS.has(token)) kind = 'control';
    else if (CPP_STANDARD_NAMES.has(token)) kind = 'builtin';
    else if (/^[A-Za-z_]\w*$/.test(token)) kind = 'keyword';
    result += escapeHtml(source.slice(cursor, start));
    result += `<span class="cpp-code-${kind}">${escapeHtml(token)}</span>`;
    cursor = start + token.length;
  }
  return result + escapeHtml(source.slice(cursor));
}

const SQL_WORDS = new Set(['select','from','where','and','or','not','insert','into','values','update','set','delete','create','table','drop','alter','add','column','rename','to','primary','key','autoincrement','unique','default','null','order','by','group','having','limit','offset','distinct','as','asc','desc','in','between','like','is','join','inner','left','outer','on','if','exists','references','true','false','cross','case','when','then','else','end']);
const SQL_TYPES = new Set(['integer','int','text','real','float','double','varchar','boolean','bool','date','numeric','decimal']);
const SQL_FUNCS = new Set(['count','sum','avg','min','max','upper','lower','length','round','abs','coalesce','trim']);
function highlightSql(code) {
  const source = String(code || '').replace(/\r\n/g, '\n');
  let result = '', cursor = 0;
  for (const match of source.matchAll(/--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'?|\b\d+(?:\.\d+)?\b|[A-Za-z_]\w*|[<>=!]+|[(),;*]/g)) {
    const token = match[0], start = match.index, lw = token.toLowerCase();
    let kind = 'operator';
    if (token.startsWith('--') || token.startsWith('/*')) kind = 'comment';
    else if (token.startsWith("'")) kind = 'string';
    else if (/^\d/.test(token)) kind = 'number';
    else if (SQL_TYPES.has(lw)) kind = 'type';
    else if (SQL_WORDS.has(lw)) kind = 'control';
    else if (SQL_FUNCS.has(lw)) kind = 'builtin';
    else if (/^[A-Za-z_]/.test(token)) kind = 'keyword';
    result += escapeHtml(source.slice(cursor, start)) + `<span class="cpp-code-${kind}">${escapeHtml(token)}</span>`;
    cursor = start + token.length;
  }
  return result + escapeHtml(source.slice(cursor));
}
const CS_WORDS = new Set(['if','else','switch','case','break','continue','default','for','foreach','while','do','return','try','catch','finally','throw','new','class','struct','static','public','private','protected','void','using','namespace','in','is','as','null','true','false','this','const','readonly','ref','out','var','get','set','override','virtual','abstract','interface','enum','async','await','params','delegate','event','lock','internal']);
const CS_TYPES = new Set(['int','long','short','byte','float','double','decimal','char','bool','string','object','String','List','ArrayList','Dictionary','Console','Math','File','Exception','DateTime','StreamReader','StreamWriter','Form','Button','TextBox','Label','SqlConnection','SqlCommand','SqlDataReader','MessageBox','EventArgs','Environment','Convert','Array']);
function highlightCs(code) {
  const source = String(code || '').replace(/\r\n/g, '\n');
  let result = '', cursor = 0;
  for (const match of source.matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|\$?@?"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|\b\d+(?:\.\d+)?[fdmL]?\b|[A-Za-z_]\w*|[<>=!&|+\-*\/%]+|[(){}\[\];,.]/g)) {
    const token = match[0], start = match.index;
    let kind = 'operator';
    if (token.startsWith('//') || token.startsWith('/*')) kind = 'comment';
    else if (/^[$@]?["']/.test(token)) kind = 'string';
    else if (/^\d/.test(token)) kind = 'number';
    else if (CS_TYPES.has(token)) kind = 'type';
    else if (CS_WORDS.has(token)) kind = 'control';
    else if (/^[A-Za-z_]/.test(token)) kind = /^\s*\(/.test(source.slice(start + token.length)) ? 'builtin' : 'keyword';
    result += escapeHtml(source.slice(cursor, start)) + `<span class="cpp-code-${kind}">${escapeHtml(token)}</span>`;
    cursor = start + token.length;
  }
  return result + escapeHtml(source.slice(cursor));
}
const langName = lang => (lang === 'sql' ? 'SQL' : lang === 'csharp' ? 'C#' : 'C++');
const highlightCode = (code, lang) => (lang === 'sql' ? highlightSql(code) : lang === 'csharp' ? highlightCs(code) : highlightCpp(code));

// A whole-program example (functions + main) is typed in steps. Only the boilerplate is pre-filled.
function fullPhases(code) {
  const hdr = '#include <iostream>\n#include <string>\n\nusing namespace std;\n\n';
  const m = /int\s+main\s*\([^)]*\)\s*\{[ \t]*\n/.exec(code);
  if (!m) return null;
  let fnPart = code.slice(0, m.index).replace(/\s+$/, '');
  const incs = [];
  fnPart = fnPart.replace(/^[ \t]*#include[^\n]*\n?/gm, (l) => { incs.push(l.trim()); return ''; }).replace(/^\s+/, '');
  const rest = code.slice(m.index + m[0].length);
  const ret = rest.lastIndexOf('  return 0;');
  const mainBody = (ret >= 0 ? rest.slice(0, ret) : rest).replace(/\s+$/, '');
  const mainOpen = 'int main() {\n';
  const base = '#include <iostream>\n#include <string>\n';
  const using = '\nusing namespace std;\n\n';
  const incText = incs.length ? incs.join('\n') + '\n' : '';
  const phases = [];
  if (incs.length) phases.push({ head: base, body: incText.replace(/\n$/, ''), tail: using + mainOpen + '  \n  return 0;\n}' });
  const top = base + incText + using;
  if (fnPart) phases.push({ head: top, body: fnPart, tail: '\n' + mainOpen + '  \n  return 0;\n}' });
  phases.push({ head: top + (fnPart ? fnPart + '\n\n' : '') + mainOpen, body: mainBody, tail: '  return 0;\n}' });
  return phases;
}

function cppStarterFor(subtopic) {
  if (subtopic.starter) return normalizeCppNewlines(subtopic.starter);
  return normalizeCppNewlines(`#include <iostream>

using namespace std;

int main() {
  // Explore: ${subtopic.title}
  int value = 1;
  cout << value << endl;
  return 0;
}`);
}

function renderGuidedNotes(subtopic) {
  const content = subtopic.content;
  if (!content) {
    return `
      <section class="cpp-guided-notes">
        <span class="cpp-note-kicker">NOTES</span>
        <p>Read the example, change one value, then press Run to see what your program prints.</p>
      </section>`;
  }

  const notes = content.notes;
  const rich = (text) => escapeHtml(text || "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const bullets = (points) => `<ul class="cpp-note-bullets">${points.map(point => `<li><strong>${escapeHtml(point.term)}</strong><span>${rich(point.text)}</span></li>`).join("")}</ul>`;
  const partsHtml = content.items?.length ? `
        <ol class="cpp-lesson-list cpp-note-parts">
          ${content.items.map((item, itemIndex) => `
            <li class="cpp-note-card ${item.warning ? "is-warning" : ""}">
              <div class="cpp-lesson-line">
                <strong>${escapeHtml(item.name || `Part ${itemIndex + 1}`)}</strong>
                <span>${rich(item.description || "")}</span>
              </div>
              ${item.steps?.length ? `<ul class="cpp-note-bullets cpp-note-steps">${item.steps.map(step => `<li><span>${rich(step)}</span></li>`).join("")}</ul>` : ""}
              <pre><code>${highlightCode(item.code, subtopic.lang)}</code></pre>
              ${item.guided ? `<button type="button" class="cpp-note-guided" data-role="note-guided" data-note-index="${itemIndex}">Guided coding: ${escapeHtml((item.name || `Part ${itemIndex + 1}`).split(' — ')[0])}</button>` : ""}
            </li>`).join("")}
        </ol>` : "";
  return `
    <article class="cpp-guided-notes cpp-flat-lesson">
      <section class="cpp-note-card cpp-note-main">
        <h2>${escapeHtml(content.heading)}</h2>
        ${notes ? `
        <span class="cpp-note-label">Official definition</span>
        <div class="cpp-note-define">${rich(notes.definition)}</div>
        <div class="cpp-note-sub">
          <h5>${escapeHtml(notes.subtitle || "Understand it")}</h5>
          ${bullets(notes.points)}
        </div>
        <pre><code>${highlightCode(notes.code, subtopic.lang)}</code></pre>` : `<p class="cpp-lesson-intro">${escapeHtml(content.intro)}</p>`}
      </section>
      ${partsHtml}
    </article>`;
}

function createCppConsoleOutput(code) {
  const name = code.match(/(?:std::)?string\s+name\s*=\s*"([^"]*)"/)?.[1] || "Lado";
  const currency = code.match(/double\s+currency\s*=\s*([0-9.]+)/)?.[1] || "12.50";
  const output = [];
  if (/Hello/.test(code)) output.push(`Hello ${name}`);
  if (/Balance|currency/.test(code)) output.push(`Balance: $${currency}`);
  return output.length ? output.join("\n") : "Program finished successfully.";
}

function renderSubtopicLab(exercise, subtopic, index) {
  const starter = cppStarterFor(subtopic);
  const practice = subtopic.content?.practice;
  return `
    <div class="cpp-lab" data-role="cpp-lab" data-lang="${subtopic.lang || 'cpp'}" data-visual="${escapeHtml(subtopic.visual || '')}"${practice ? ` data-practice="${escapeHtml(JSON.stringify(practice))}"` : ""}>
      ${renderGuidedNotes(subtopic)}
      <button type="button" class="cpp-open-guided" data-role="open-guided">Try the code</button>

      <aside class="cpp-guided-drawer" data-role="guided-drawer" aria-hidden="true">
        <div class="cpp-drawer-head">
          <div>
            <span data-role="drawer-mode-title">Guided coding</span>
            <h2>${escapeHtml(subtopic.title)}</h2>
          </div>
          <button type="button" class="lado-icon-btn cpp-drawer-close" data-role="close-guided" aria-label="Close coding guide">×</button>
        </div>
        <section class="cpp-visual-stage" aria-label="Live 3D code visualization">
          <div class="cpp-visual-toolbar">
            <span class="cpp-live-dot"></span>
            <span>Live ${langName(subtopic.lang)} visualization</span>
            <span class="cpp-visual-status" data-role="visual-status">Start typing to build the scene</span>
          </div>
          <div class="cpp-visual-scene" data-role="lab-scene"></div>
        </section>
        <section class="cpp-code-workbench">
        <div class="cpp-code-panel">
          <div class="cpp-try-heading">
            <div>
              <span class="cpp-note-kicker">CODE PRACTICE</span>
              <h3>${escapeHtml(subtopic.content?.tryTitle || "Change the code and run the program")}</h3>
            </div>
            <button type="button" class="lado-btn is-primary cpp-run-button" data-role="lab-run">Run code</button>
          </div>
          <div class="cpp-editor-shell">
            <div class="cpp-editor-gutter" aria-hidden="true">1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10<br>11</div>
            <textarea class="cpp-live-editor" data-role="lab-code" spellcheck="false" aria-label="${langName(subtopic.lang)} code editor">${escapeHtml(starter)}</textarea>
          </div>
          <section class="cpp-console-drawer" data-role="lab-console" aria-live="polite">
            <div class="cpp-console-title">
              <span class="cpp-console-light"></span>
              Console output
            </div>
            <pre data-role="lab-output"></pre>
          </section>
        </div>
        </section>
      </aside>
    </div>`;
}

function classifyCppLine(line) {
  if (/\b(for|while|do)\b/.test(line)) return { label: "loop", kind: "loop" };
  if (/\b(if|else|switch)\b/.test(line)) return { label: "branch", kind: "branch" };
  if (/cout|cin/.test(line)) return { label: "I/O", kind: "io" };
  if (/\b(class|struct|enum)\b/.test(line)) return { label: "type", kind: "type" };
  if (/\b(int|double|float|char|bool|string|auto)\b/.test(line)) return { label: "value", kind: "value" };
  if (/return/.test(line)) return { label: "return", kind: "return" };
  if (/#include/.test(line)) return { label: "header", kind: "header" };
  return { label: "code", kind: "code" };
}


function renderTabs(tabs, activeIndex) {
  return tabs.map((tab, i) => `
    <button type="button" class="lado-tab ${i === activeIndex ? 'is-active' : ''}" data-tab="${escapeHtml(tab)}">${escapeHtml(tab)}</button>`).join('');
}

function renderMessage(message) {
  return `
    <div class="lado-message ${message.role === 'user' ? 'is-user' : ''}">
      <div class="lado-message-avatar"></div>
      <div class="lado-bubble">${message.html || escapeHtml(message.text)}${message.actions ? `
        <div class="lado-bubble-actions">
          <button type="button" class="lado-btn is-primary" data-tutor-action="apply">Apply fix</button>
          <button type="button" class="lado-btn" data-tutor-action="explain">Explain</button>
        </div>` : ''}</div>
    </div>`;
}

/**
 * Render the shared course workspace.
 *
 * config: { id, title, subtitle, crumbs[], lesson{title,description}, tree[],
 *           exercises[{id,title,prompt,starter}], editorTabs[], tutorTabs[],
 *           versions[{value,label}], greeting, placeholder,
 *           onRun(ctx) -> {output, isError, html}, onAsk(ctx) -> string|{html} }
 */
export function createWorkspace(container, config) {
  if (!container) throw new Error('createWorkspace: container is required');
  injectWorkspaceStyles();

  const {
    id: workspaceId = '', title, subtitle = '', crumbs = [], crumbTitle = false, lesson, tree = [], exercises = [],
    editorTabs = ['main', 'tests', 'Output'], tutorTabs = ['Tutor', 'Hints', 'History'],
    versions = [], greeting = 'Ask me anything about this exercise.',
    placeholder = '// write your code here', onRun, onAsk, onBack,
  } = config;

  container.innerHTML = `
    <div class="lado-ws">
      <header class="lado-ws-header">
        <div class="lado-ws-title">
          <h1>${escapeHtml(title)}</h1>
          <span class="lado-ws-sub">${escapeHtml(subtitle)}</span>
        </div>
        <label class="lado-ws-search lado-glass">
          ${ICONS.search}
          <input type="search" data-role="search" placeholder="Search lessons and exercises" />
        </label>
        <div class="cpp-header-modes" role="tablist" aria-label="Coding mode">
          <button type="button" class="cpp-header-mode is-guided is-active" data-role="lab-mode" data-mode="guided">Guided coding</button>
          <button type="button" class="cpp-header-mode is-diy" data-role="lab-mode" data-mode="diy">Do it yourself</button>
        </div>
        <div class="lado-ws-tools">
          <button type="button" class="lado-icon-btn" data-role="toggle-tutor" title="Hide tutor" aria-label="Hide tutor" aria-expanded="true">${ICONS.tutor}</button>
          <button type="button" class="lado-icon-btn" data-role="toggle-theme" title="Light / dark">${getTheme() === 'dark' ? ICONS.moon : ICONS.sun}</button>
        </div>
      </header>

      <div class="lado-ws-shell" data-role="shell">
        <nav class="lado-glass lado-ws-sidebar" aria-label="Lessons">
          <div class="lado-sidebar-controls">
            ${onBack ? `<button type="button" class="lado-icon-btn lado-sidebar-back" data-role="back" title="Go back" aria-label="Go back">${ICONS.back}</button>` : ""}
            <button type="button" class="lado-icon-btn lado-sidebar-toggle" data-role="toggle-sidebar" title="Collapse lessons" aria-label="Collapse lessons" aria-expanded="true">${ICONS.sidebar}</button>
          </div>
          <div class="lado-tree"><ul>${renderTree(tree)}</ul></div>
          <div class="lado-ws-sidebar-foot">
            <button type="button" class="lado-node"><span class="lado-caret"></span><span class="lado-dot"></span><span class="lado-node-label">Progress</span></button>
            <button type="button" class="lado-node"><span class="lado-caret"></span><span class="lado-dot"></span><span class="lado-node-label">Settings</span></button>
          </div>
        </nav>

        <section class="lado-ws-main">
          <div class="lado-glass lado-lesson">
            <div class="lado-lesson-body">
              <div class="lado-crumbs ${crumbTitle ? 'is-title' : ''}" data-role="crumbs">${crumbs.map(escapeHtml).join(' <span>/</span> ')}</div>
              <div class="lado-exercises" data-role="exercises">${renderExercises(exercises)}</div>
            </div>
          </div>

        </section>

        <aside class="lado-ws-tutor" aria-label="AI tutor">
          <div class="lado-glass">
            <div class="lado-tabs" data-role="tutor-tabs">${renderTabs(tutorTabs, 0)}</div>
          </div>
          <div class="lado-glass lado-messages" data-role="messages">
            <div class="lado-empty">No hints yet — run your code or ask a question.</div>
          </div>
          <div class="lado-glass lado-composer">
            <textarea data-role="tutor-input" placeholder="Ask the tutor about your code..."></textarea>
            <div class="lado-composer-row">
              <button type="button" class="lado-icon-btn" title="Attach snippet">${ICONS.plus}</button>
              <button type="button" class="lado-icon-btn" title="Attach file">${ICONS.clip}</button>
              <span class="lado-spacer"></span>
              <button type="button" class="lado-icon-btn" data-role="send" title="Send">${ICONS.send}</button>
            </div>
          </div>
        </aside>
      </div>
    </div>`;

  // Listener hängen am Workspace-Root, nicht am Container: beim Remount wird der
  // Root ersetzt, sodass keine alten Handler doppelt feuern.
  const root = container.querySelector('.lado-ws');
  const stopThemeSync = onThemeChange((mode) => {
    const btn = container.querySelector('[data-role="toggle-theme"]');
    if (btn) btn.innerHTML = mode === 'dark' ? ICONS.moon : ICONS.sun;
  });
  const $ = (role) => container.querySelector(`[data-role="${role}"]`);
  const shell = $('shell');
  const codeEl = $('code');
  const outputEl = $('output');
  const messagesEl = $('messages');
  const tutorInput = $('tutor-input');
  const versionEl = $('version');
  const crumbsEl = $('crumbs');

  const completed = new Set();
  const messages = [];
  let current = exercises[0] || { id: '', title: lesson.title };

  function context() {
    return {
      code: codeEl ? codeEl.value : '',
      exercise: current,
      version: versionEl ? versionEl.value : null,
      lastOutput: outputEl ? outputEl.textContent : '',
    };
  }

  function setOutput(text, { isError = false, isOk = false, html = null } = {}) {
    if (!outputEl) return;
    if (html) outputEl.innerHTML = html; else outputEl.textContent = text;
    outputEl.classList.toggle('is-error', isError);
    outputEl.classList.toggle('is-ok', isOk);
  }

  function loadExercise(exercise) {
    if (!exercise) return;
    current = exercise;
    if (codeEl) codeEl.value = exercise.starter;
    setOutput('Ready.');
    container.querySelectorAll('.lado-exercise').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.exercise === exercise.id);
    });
  }

  function showTopic(exercise) {
    if (!exercise?.lesson) return false;
    current = exercise;
    crumbsEl.classList.remove('is-title');
    crumbsEl.innerHTML = `
      <div class="lado-topic-path">
        <span>${escapeHtml(title)}</span><span>/</span><span>${escapeHtml(exercise.title)}</span>
      </div>`;
    const exercisesEl = $('exercises');
    exercisesEl.innerHTML = renderTopicLesson(exercise);
    if (workspaceId) history.replaceState(null, '', `#${workspaceId}/${exercise.id}`);
    return true;
  }


  let activeSubtopic = null;
  let focusState = null;

  function updateCppVisualization(code) {
    const scene = container.querySelector('[data-role="lab-scene"]');
    const status = container.querySelector('[data-role="visual-status"]');
    if (!scene) return;

    const lines = code.split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line !== "{" && line !== "}")
      .slice(0, 14);

    if (!lines.length) {
      scene.innerHTML = '<div class="cpp-visual-empty">Your 3D program will appear here</div>';
      if (status) status.textContent = "Waiting for code";
      return;
    }

    scene.innerHTML = lines.map((line, lineIndex) => {
      const item = classifyCppLine(line);
      const x = 10 + ((lineIndex * 19) % 76);
      const y = 18 + ((lineIndex * 27) % 58);
      const height = 34 + Math.min(line.length, 34);
      return `
        <div class="cpp-visual-object is-${item.kind}"
             style="--x:${x}%; --y:${y}%; --h:${height}px; --delay:${lineIndex * 35}ms">
          <span>${escapeHtml(item.label)}</span>
        </div>`;
    }).join("");

    if (status) status.textContent = `${lines.length} live object${lines.length === 1 ? "" : "s"}`;
  }

  function showSubtopicLab(index) {
    const subtopic = current?.lesson?.subtopics?.[index];
    if (!subtopic) return;

    activeSubtopic = subtopic;
    if (workspaceId) history.replaceState(null, '', `#${workspaceId}/${current.id}/${index}`);
    focusState = {
      tutorHidden: shell.classList.contains("is-tutor-hidden"),
      sidebarCollapsed: shell.classList.contains("is-sidebar-collapsed"),
    };

    shell.classList.add("is-focus-mode", "is-tutor-hidden");
    const sidebarToggle = container.querySelector('[data-role="toggle-sidebar"]');
    sidebarToggle?.setAttribute("aria-expanded", "false");
    sidebarToggle?.setAttribute("title", "Expand lessons");
    container.querySelectorAll('[data-role="lab-mode"]').forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === "guided");
    });
    const tutorButton = container.querySelector('[data-role="toggle-tutor"]');
    if (tutorButton) {
      tutorButton.setAttribute("aria-expanded", "false");
      tutorButton.setAttribute("title", "Show tutor");
      tutorButton.setAttribute("aria-label", "Show tutor");
    }

    crumbsEl.innerHTML = "";
    const exercisesEl = $("exercises");
    exercisesEl.innerHTML = renderSubtopicLab(current, subtopic, index);
    requestAnimationFrame(() => {
      const editor = container.querySelector('[data-role="lab-code"]');
      updateCppVisualization(editor?.value || "");
    });
    setTimeout(() => {
      const lab = container.querySelector('[data-role="cpp-lab"]');
      const editor = lab?.querySelector('[data-role="lab-code"]');
      if (!lab || !editor || lab.classList.contains('is-diy')) return;
      const emptyScaffold = /int\s+main\s*\([^)]*\)\s*\{\s*return\s+0\s*;?\s*\}/s.test(editor.value.replace(/^\s*#.*$/gm, '').replace(/^\s*using\s+namespace[^;]*;/gm, ''));
      if (!editor.dataset.cppHl && emptyScaffold && cppStarterFor(subtopic).trim()) {
        editor.value = cppStarterFor(subtopic);
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        updateCppVisualization(editor.value);
      }
    }, 450);
  }

  function closeSubtopicLab() {
    shell.classList.remove("is-focus-mode");
    if (!focusState?.tutorHidden) shell.classList.remove("is-tutor-hidden");
    if (!focusState?.sidebarCollapsed) shell.classList.remove("is-sidebar-collapsed");
    const sidebarToggle = container.querySelector('[data-role="toggle-sidebar"]');
    const sidebarCollapsed = shell.classList.contains("is-sidebar-collapsed");
    sidebarToggle?.setAttribute("aria-expanded", String(!sidebarCollapsed));
    sidebarToggle?.setAttribute("title", sidebarCollapsed ? "Expand lessons" : "Collapse lessons");
    const tutorButton = container.querySelector('[data-role="toggle-tutor"]');
    if (tutorButton) {
      const hidden = shell.classList.contains("is-tutor-hidden");
      tutorButton.setAttribute("aria-expanded", String(!hidden));
      tutorButton.setAttribute("title", hidden ? "Show tutor" : "Hide tutor");
      tutorButton.setAttribute("aria-label", hidden ? "Show tutor" : "Hide tutor");
    }
    activeSubtopic = null;
    focusState = null;
    showTopic(current);
  }


  function showTopics() {
    crumbsEl.classList.toggle('is-title', crumbTitle);
    crumbsEl.innerHTML = crumbs.map(escapeHtml).join(' <span>/</span> ');
    const exercisesEl = $('exercises');
    exercisesEl.innerHTML = renderExercises(exercises);
    current = exercises[0] || { id: '', title: lesson.title };
    if (workspaceId) history.replaceState(null, '', `#${workspaceId}`);
  }

  function markCompleted(id = current.id) {
    completed.add(id);
  }

  function pushMessage(message) {
    messages.push(message);
    messagesEl.innerHTML = messages.map(renderMessage).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function run() {
    if (typeof onRun !== 'function') return;
    const runBtn = $('run');
    if (runBtn) runBtn.disabled = true;
    setOutput('Running...');
    try {
      const result = await onRun(context());
      setOutput(result?.output ?? '(no output)', {
        isError: Boolean(result?.isError),
        isOk: Boolean(result?.isOk),
        html: result?.html,
      });
      if (result && !result.isError) markCompleted();
    } catch (error) {
      setOutput(error.message, { isError: true });
    } finally {
      if (runBtn) runBtn.disabled = false;
    }
  }

  async function ask(question) {
    const text = question || `I'm stuck on "${current.title}". What am I missing?`;
    pushMessage({ role: 'user', text });
    pushMessage({ role: 'assistant', text: 'Thinking...' });
    try {
      const answer = typeof onAsk === 'function'
        ? await onAsk({ ...context(), question: text })
        : 'No tutor backend is configured yet.';
      messages.pop();
      pushMessage(typeof answer === 'string'
        ? { role: 'assistant', text: answer, actions: true }
        : { role: 'assistant', actions: true, ...answer });
    } catch (error) {
      messages.pop();
      pushMessage({ role: 'assistant', text: `Tutor unavailable: ${error.message}` });
    }
  }

  root.addEventListener('click', (event) => {
    const node = event.target.closest('.lado-node');
    if (node) {
      const target = node.dataset.node || '';
      const [exerciseId, subtopicIndex] = target.split('::');
      const sidebarExercise = exercises.find((exercise) => exercise.id === exerciseId);
      const list = node.parentElement.querySelector('ul');

      container.querySelectorAll('.lado-node').forEach((el) => el.classList.remove('is-active'));
      node.classList.add('is-active');

      if (list) {
        const expanded = node.getAttribute('aria-expanded') === 'true';
        node.setAttribute('aria-expanded', String(!expanded));

        if (expanded) {
          list.style.maxHeight = `${list.scrollHeight}px`;
          requestAnimationFrame(() => {
            list.classList.add('lado-hidden');
            list.style.maxHeight = '0px';
          });
        } else {
          list.classList.remove('lado-hidden');
          list.style.maxHeight = '0px';
          requestAnimationFrame(() => {
            list.style.maxHeight = `${list.scrollHeight}px`;
          });
        }
      }

      if (sidebarExercise) {
        showTopic(sidebarExercise);
        if (subtopicIndex !== undefined) showSubtopicLab(Number(subtopicIndex));
      }
      return;
    }

    const tab = event.target.closest('.lado-tab');
    if (tab) {
      tab.parentElement.querySelectorAll('.lado-tab').forEach((el) => el.classList.remove('is-active'));
      tab.classList.add('is-active');
      return;
    }

    const subtopicCard = event.target.closest('.lado-subtopic-card');
    if (subtopicCard) {
      showSubtopicLab(Number(subtopicCard.dataset.subtopicIndex));
      return;
    }

    const card = event.target.closest('.lado-exercise');
    if (card) {
      const exercise = exercises.find((ex) => ex.id === card.dataset.exercise);
      if (!showTopic(exercise)) loadExercise(exercise);
      return;
    }

    const role = event.target.closest('[data-role]')?.dataset.role;
    if (role === 'note-guided') {
      const button = event.target.closest('[data-role="note-guided"]');
      const item = activeSubtopic?.content?.items?.[Number(button.dataset.noteIndex)];
      const lab = container.querySelector('[data-role="cpp-lab"]');
      const editor = lab?.querySelector('[data-role="lab-code"]');
      if (!item || !editor) return;
      const isSqlLab = activeSubtopic?.lang === 'sql';
      const sqlHead = isSqlLab ? '-- YOUR TURN: type below\n' : '';
      if (isSqlLab) lab.dataset.sqlSetup = item.setup || '';
      const isCs = activeSubtopic?.lang === 'csharp';
      const code = isSqlLab ? sqlHead + item.code + '\n' : isCs ? item.code + '\n' : item.full
        ? '#include <iostream>\n#include <string>\n\nusing namespace std;\n\n' + normalizeCppNewlines(item.code)
        : '#include <iostream>\n\nusing namespace std;\n\nint main() {\n' + normalizeCppNewlines(item.code).split('\n').map(line => '  ' + line).join('\n') + '\n  return 0;\n}';
      lab._guidedExample = code;
      const phases = isSqlLab ? [{ head: sqlHead, body: item.code, tail: '' }] : isCs ? (/static\s+void\s+Main\s*\([^)]*\)\s*\n?\s*\{[ \t]*\n[\s\S]*\n    \}\n\}\s*$/.test(code) ? null : [{ head: '', body: code.replace(/\s+$/, ''), tail: '' }]) : item.full ? fullPhases(normalizeCppNewlines(item.code)) : null;
      lab.classList.remove('is-diy');
      lab.classList.add('is-guided-open');
      lab.querySelector('[data-role="guided-drawer"]').setAttribute('aria-hidden', 'false');
      lab.querySelector('[data-role="drawer-mode-title"]').textContent = 'Guided coding';
      lab.querySelector('.cpp-try-heading h3').textContent = item.name;
      container.querySelectorAll('[data-role="lab-mode"]').forEach(tab => tab.classList.toggle('is-active', tab.dataset.mode === 'guided'));
      editor.value = code;
      editor.dispatchEvent(new CustomEvent('cpp-guided-example', { detail: { code, phases } }));
      editor.focus();
    }
    else if (role === 'open-guided' && activeSubtopic?.content?.items?.[0]?.full && container.querySelector('[data-role="note-guided"]')) {
      container.querySelector('[data-role="note-guided"]').click();
    }
    else if (role === 'open-guided') {
      const lab = container.querySelector('[data-role="cpp-lab"]');
      const drawer = container.querySelector('[data-role="guided-drawer"]');
      const modeTitle = container.querySelector('[data-role="drawer-mode-title"]');
      if (modeTitle) modeTitle.textContent = 'Guided coding';
      lab?.classList.add('is-guided-open');
      drawer?.setAttribute('aria-hidden', 'false');
      setTimeout(() => container.querySelector('[data-role="lab-code"]')?.focus(), 650);
    }
    else if (role === 'close-guided') {
      const lab = container.querySelector('[data-role="cpp-lab"]');
      const drawer = container.querySelector('[data-role="guided-drawer"]');
      lab?.classList.remove('is-guided-open');
      drawer?.setAttribute('aria-hidden', 'true');
    }
    else if (role === 'lab-run') {
      const editor = container.querySelector('[data-role="lab-code"]');
      const drawer = container.querySelector('[data-role="lab-console"]');
      const output = container.querySelector('[data-role="lab-output"]');
      if (drawer && output) {
        output.textContent = activeSubtopic?.lang === 'csharp' ? (window.__ladoCsConsole ? window.__ladoCsConsole(editor?.value || '') : 'The C# engine is still loading.') : activeSubtopic?.lang === 'sql' ? (window.__ladoSqlConsole ? window.__ladoSqlConsole(editor?.value || '') : 'The SQL engine is still loading.') : createCppConsoleOutput(editor?.value || "");
        drawer.classList.remove('is-visible');
        requestAnimationFrame(() => drawer.classList.add('is-visible'));
      }
    }
    else if (role === 'lab-mode') {
      const button = event.target.closest('[data-role="lab-mode"]');
      const lab = container.querySelector('[data-role="cpp-lab"]');
      const editor = container.querySelector('[data-role="lab-code"]');
      container.querySelectorAll('[data-role="lab-mode"]').forEach((tabButton) => {
        tabButton.classList.toggle('is-active', tabButton === button);
      });
      lab?.classList.add('is-guided-open');
      container.querySelector('[data-role="guided-drawer"]')?.setAttribute('aria-hidden', 'false');
      const modeTitle = container.querySelector('[data-role="drawer-mode-title"]');
      if (modeTitle) modeTitle.textContent = button.dataset.mode === 'diy' ? 'Do it yourself' : 'Guided coding';
      lab?.classList.toggle('is-diy', button.dataset.mode === 'diy');
      if (editor) {
        editor.value = button.dataset.mode === 'diy'
          ? (activeSubtopic?.lang === 'sql' ? '-- Write your own SQL here\n' : activeSubtopic?.lang === 'csharp' ? '// Build your own C# program here\n' : '// Build your own C++ program here\n')
          : (lab?._guidedExample || cppStarterFor(activeSubtopic));
        updateCppVisualization(editor.value);
        editor.focus();
      }
    }
    else if (role === 'run') run();
    else if (role === 'ask') ask();
    else if (role === 'reset') loadExercise(current);
    else if (role === 'toggle-tutor') {
      const hidden = shell.classList.toggle('is-tutor-hidden');
      const button = event.target.closest('[data-role="toggle-tutor"]');
      button.setAttribute('aria-expanded', String(!hidden));
      button.setAttribute('aria-label', hidden ? 'Show tutor' : 'Hide tutor');
      button.setAttribute('title', hidden ? 'Show tutor' : 'Hide tutor');
    }
    else if (role === 'toggle-theme') toggleTheme();
    else if (role === 'back') {
      if (container.querySelector('[data-role="cpp-lab"]')) {
        closeSubtopicLab();
      } else if (container.querySelector('[data-role="topic-lesson"]')) {
        showTopics();
      } else if (onBack) {
        onBack();
      }
    }
    else if (role === 'toggle-sidebar') {
      const sidebar = container.querySelector('.lado-ws-sidebar');
      const collapsed = shell.classList.toggle('is-sidebar-collapsed');
      sidebar.querySelector('[data-role="toggle-sidebar"]').setAttribute('aria-expanded', String(!collapsed));
      sidebar.querySelector('[data-role="toggle-sidebar"]').setAttribute('title', collapsed ? 'Expand lessons' : 'Collapse lessons');
    }
    else if (role === 'send') {
      const question = tutorInput.value.trim();
      if (question) { tutorInput.value = ''; ask(question); }
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-role="lab-code"]')) {
      updateCppVisualization(event.target.value);
    }
  });

  root.addEventListener('keydown', (event) => {
    const card = event.target.closest('.lado-subtopic-card');
    if (card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      card.click();
    }
  });

  container.querySelector('[data-role="search"]').addEventListener('input', (event) => {
    const term = event.target.value.trim().toLowerCase();
    container.querySelectorAll('.lado-exercise').forEach((el) => {
      el.classList.toggle('lado-hidden', Boolean(term) && !el.textContent.toLowerCase().includes(term));
    });
  });

  tutorInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const question = tutorInput.value.trim();
      if (question) { tutorInput.value = ''; ask(question); }
    }
  });

  const route = location.hash.replace(/^#/, '').split('/');
  const routedExercise = route[1] ? exercises.find((exercise) => exercise.id === route[1]) : null;
  const routedSubtopic = Number.parseInt(route[2], 10);

  if (routedExercise) {
    showTopic(routedExercise);
    if (Number.isInteger(routedSubtopic) && routedExercise.lesson?.subtopics?.[routedSubtopic]) {
      showSubtopicLab(routedSubtopic);
    }
  } else {
    loadExercise(current);
  }

  return {
    element: container,
    loadExercise,
    getCode: () => codeEl.value,
    setOutput,
    ask,
    run,
    markCompleted,
    destroy: () => { stopThemeSync(); container.innerHTML = ''; },
  };
}

/* cpp-box-lab */
(function () {
  if (window.__cppBoxLab) return;
  window.__cppBoxLab = true;

  var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  var TOK = /(\/\/[^\n]*)|(#[ \t]*\w+(?:[ \t]*(?:<[^>\n]*>?|"[^"\n]*"?))?)|("(?:\\.|[^"\\\n])*"?)|('(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?[fFlLuU]*\b)|\b(std)(?=::)|\b(int|float|double|char|bool|void|long|short|unsigned|signed|string|size_t|auto)\b|\b(return|if|else|for|while|do|switch|case|break|continue|const|using|namespace|struct|class|public|private|new|delete|true|false|nullptr)\b|(\b[A-Za-z_]\w*)(?=\s*\()|(<<|>>)/g;

  function hl(src) {
    var out = '', last = 0, m;
    TOK.lastIndex = 0;
    while ((m = TOK.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      var c = m[1] ? 'c' : m[2] ? 'p' : (m[3] || m[4]) ? 's' : m[5] ? 'n' : m[6] ? 'ns' : m[7] ? 't' : m[8] ? 'k' : m[9] ? 'f' : 'o';
      out += '<span class="cpp-t-' + c + '">' + esc(m[0]) + '</span>';
      last = TOK.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  var CSKW = /^(if|else|switch|case|break|continue|default|for|foreach|while|do|return|try|catch|finally|throw|new|class|struct|enum|static|public|private|protected|void|using|namespace|in|is|as|null|true|false|this|const|ref|out|var|get|set|override|virtual|abstract|interface|event|params)$/;
  var CSTY = /^(int|long|short|byte|float|double|decimal|char|bool|string|object|List|ArrayList|Dictionary|Console|Math|File|Exception|Form|Button|TextBox|Label|SqlConnection|SqlCommand|SqlDataReader|MessageBox|EventArgs|Convert|Array|StreamReader|StreamWriter|DateTime)$/;
  function hlCs(src) {
    var out = '', last = 0, m, T = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|([$@]?"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?[fdmL]?\b)|([A-Za-z_]\w*)/g;
    while ((m = T.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      var c = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : CSTY.test(m[4]) ? 't' : CSKW.test(m[4]) ? 'k' : /^\s*\(/.test(src.slice(T.lastIndex)) ? 'f' : null;
      out += c ? '<span class="cpp-t-' + c + '">' + esc(m[0]) + '</span>' : esc(m[0]);
      last = T.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  var SQLTOK = /(--[^\n]*)|('(?:''|[^'\n])*'?)|(\b\d+(?:\.\d+)?\b)|\b(integer|int|text|real|float|double|varchar|boolean|bool|date|numeric|decimal)\b|\b(select|from|where|and|or|not|insert|into|values|update|set|delete|create|table|drop|alter|add|column|rename|to|primary|key|autoincrement|unique|default|null|order|by|group|having|limit|offset|distinct|as|asc|desc|in|between|like|is|join|inner|left|outer|on|if|exists|references|true|false|cross|case|when|then|else|end)\b|\b(count|sum|avg|min|max|upper|lower|length|round|abs|coalesce|trim)(?=\s*\()/gi;
  function hlSql(src) {
    var out = '', last = 0, m;
    SQLTOK.lastIndex = 0;
    while ((m = SQLTOK.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      var c = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : m[4] ? 't' : m[5] ? 'k' : 'f';
      out += '<span class="cpp-t-' + c + '">' + esc(m[0]) + '</span>';
      last = SQLTOK.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  var TYPES = 'unsigned\\s+int|unsigned|long\\s+long|long|short|int|float|double|char|bool|std::string|string|auto';
  var DECL = new RegExp('^\\s*(?:const\\s+)?(' + TYPES + ')\\s+([A-Za-z_]\\w*)([\\s=;(].*)?$');
  var COL = { 'int': '#5ac8fa', 'short': '#5ac8fa', 'long': '#5ac8fa', 'long long': '#5ac8fa', 'unsigned int': '#5ac8fa', 'unsigned': '#5ac8fa', 'float': '#ffd66b', 'double': '#ffd66b', 'char': '#ff9ad5', 'bool': '#8ef2b8', 'string': '#c8a2ff', 'auto': '#cfd8ff' };

  /* cpp-live-parse */
  var INTLIKE = /^(?:unsigned int|unsigned|int|short|long|long long)$/;
  var NOSTART = /^\s*(?:for|while|if|else|switch|do|return|using|cout|cin|cerr|break|continue|case|struct|class|namespace|template|typedef)\b/;
  var DECL2 = new RegExp('^\\s*(?:(?:const|constexpr|static)\\s+)*(' + TYPES + ')\\s+([\\s\\S]+)$');

  function scanSplit(s, sep) {
    var out = [], cur = '', q = '', depth = 0, k, c;
    for (k = 0; k < s.length; k++) {
      c = s.charAt(k);
      if (q) {
        cur += c;
        if (c === '\\') { cur += s.charAt(k + 1); k++; }
        else if (c === q) q = '';
        continue;
      }
      if (c === '"' || c === "'") { q = c; cur += c; continue; }
      if (c === '(' || c === '{' || c === '[') depth++;
      else if (c === ')' || c === '}' || c === ']') depth--;
      if (c === sep && depth <= 0) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }
  function numOf(v) { return /^[-+]?(?:\d+\.?\d*|\.\d+)[fFlLuU]*$/.test(v) ? parseFloat(v) : null; }
  function fit(n, type) { return String(INTLIKE.test(type) ? Math.trunc(n) : +n.toFixed(6)); }
  function isLit(v) {
    return /^(?:[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?[fFlLuU]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|true|false)$/.test(v);
  }
  function resolve(v, by, type) {
    v = v.trim();
    if (v === '' || isLit(v)) return v;
    if (/^[A-Za-z_]\w*$/.test(v)) return (by[v] && by[v].value !== '') ? by[v].value : v;
    var e = v.replace(/(\b\d+\.?\d*)[fFlLuU]+\b/g, '$1').replace(/[A-Za-z_]\w*/g, function (id) {
      var t = by[id], n = t ? numOf(t.value) : null;
      return n === null ? '?' : '(' + n + ')';
    });
    if (!/^[\d\s+\-*\/%().]+$/.test(e)) return v;
    try {
      var r = Function('return (' + e + ')')();
      if (typeof r === 'number' && isFinite(r)) return fit(r, type);
    } catch (err) { }
    return v;
  }
  function deduce(v) {
    if (/^".*"$/.test(v)) return 'string';
    if (/^'.*'$/.test(v)) return 'char';
    if (v === 'true' || v === 'false') return 'bool';
    if (/^[-+]?(?:\d+\.\d*|\.\d+)[fF]$/.test(v)) return 'float';
    if (/^[-+]?(?:\d+\.\d*|\.\d+)$/.test(v)) return 'double';
    if (/^[-+]?\d+/.test(v)) return 'int';
    return 'auto';
  }

  function parse(src) {
    src = window.__ladoCsSrc(src);
    var out = [], by = {};

    function declare(type, rest, closed) {
      type = type.replace(/\s+/g, ' ').replace('std::', '');
      var parts = scanSplit(rest, ','), k, p, m, val, state, rv, last, t, o;
      for (k = 0; k < parts.length; k++) {
        p = parts[k];
        last = k === parts.length - 1;
        m = p.match(/^\s*[*&]?\s*([A-Za-z_]\w*)\s*(?:(=)([\s\S]*)|\{([\s\S]*?)(\})?\s*)?$/);
        if (m === null) return;
        val = '';
        state = 'declared';
        if (m[2]) {
          val = m[3].trim();
          state = val === '' ? 'assigning' : ((last && !closed) ? 'filling' : 'done');
        } else if (m[4] !== undefined) {
          val = m[4].trim();
          if (m[5]) { if (val === '') val = '0'; state = (last && !closed) ? 'filling' : 'done'; }
          else state = 'filling';
        }
        if (state === 'declared' && last && !closed && !/\s$/.test(p)) continue;
        rv = val ? resolve(val, by, type) : '';
        t = type === 'auto' ? deduce(rv) : type;
        o = { type: t, name: m[1], state: state, value: rv };
        out.push(o);
        by[o.name] = o;
      }
    }

    function assign(s, closed) {
      var inc = s.match(/^\s*([A-Za-z_]\w*)\s*(\+\+|--)\s*$/), o, m, n, rhs, a, b, r;
      if (inc) {
        o = by[inc[1]];
        n = o ? numOf(o.value) : null;
        if (o && n !== null && closed) { o.value = fit(n + (inc[2] === '++' ? 1 : -1), o.type); o.state = 'done'; }
        return;
      }
      m = s.match(/^\s*([A-Za-z_]\w*)\s*(\+|-|\*|\/|%)?=(?!=)([\s\S]*)$/);
      if (m === null || !by[m[1]]) return;
      o = by[m[1]];
      rhs = m[3].trim();
      if (m[2]) {
        a = numOf(o.value);
        b = numOf(resolve(rhs, by, o.type));
        if (a === null || b === null) return;
        try { r = Function('return (' + a + ' ' + m[2] + ' ' + b + ')')(); } catch (err) { return; }
        if (typeof r !== 'number' || !isFinite(r)) return;
        o.value = fit(r, o.type);
        o.state = closed ? 'done' : 'filling';
        return;
      }
      o.value = resolve(rhs, by, o.type);
      o.state = rhs === '' ? 'assigning' : (closed ? 'done' : 'filling');
    }

    src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').forEach(function (line) {
      var code = line.replace(/\/\/.*$/, '');
      if (/^\s*#/.test(code) || NOSTART.test(code)) return;
      var pieces = scanSplit(code, ';');
      pieces.forEach(function (raw, pi) {
        if (!raw.trim()) return;
        var closed = pi < pieces.length - 1, dm = raw.match(DECL2);
        if (dm) declare(dm[1], dm[2], closed);
        else assign(raw, closed);
      });
    });
    return out;
  }

  var BOX = '<div class="cpp-box-cube"><i class="f front"><b class="cpp-box-val"></b></i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div><div class="cpp-item"><span></span></div></div><div class="cpp-box-label"></div>';

  function boxes(stage, vars) {
    var sc = stage.querySelector('.cpp-box-scene');
    if (sc === null) {
      sc = document.createElement('div');
      sc.className = 'cpp-box-scene';
      var em = document.createElement('div');
      em.className = 'cpp-box-empty';
      em.textContent = 'Declare a variable and its 3D box appears';
      sc.appendChild(em);
      stage.appendChild(sc);
    }
    stage.classList.add('has-boxes');
    sc.querySelector('.cpp-box-empty').style.display = vars.length ? 'none' : '';
    var active = -1;
    vars.forEach(function (v, i) { if (v.state !== 'done') active = i; });
    sc.classList.toggle('has-active', active >= 0);
    var slots = sc.querySelectorAll('.cpp-box-slot');
    vars.forEach(function (v, i) {
      var s = slots[i];
      if (s === undefined) {
        s = document.createElement('div');
        s.className = 'cpp-box-slot is-new';
        s.innerHTML = BOX;
        sc.appendChild(s);
        (function (el) { setTimeout(function () { el.classList.remove('is-new'); }, 900); })(s);
      }
      s.style.setProperty('--c', COL[v.type] || '#cfd8ff');
      s.querySelector('.cpp-box-label').textContent = v.type + ' ' + v.name;
      s.classList.remove('s-declared', 's-assigning', 's-filling', 's-done');
      s.classList.add('s-' + v.state);
      s.classList.toggle('is-open', v.state === 'assigning' || v.state === 'filling');
      s.classList.toggle('is-active', i === active);
      if (v.value) {
        s.querySelector('.cpp-item span').textContent = v.value;
        s.querySelector('.cpp-box-val').textContent = v.value;
      }
    });
    for (var j = slots.length - 1; j >= vars.length; j--) slots[j].remove();
    var status = stage.querySelector('.cpp-visual-status');
    if (status) status.textContent = vars.length + (vars.length === 1 ? ' variable' : ' variables');
  }

  /* cpp-tv-lab */
  function unesc(c) { return c === 'n' ? '\n' : c === 't' ? '\t' : c; }
  function fmtVal(v) {
    var x = v.value.trim();
    var q = x.match(/^"([\s\S]*)"$/);
    if (q) return q[1].replace(/\\(.)/g, function (_, c) { return unesc(c); });
    q = x.match(/^'([\s\S]*)'$/);
    if (q) return q[1];
    if (x === 'true') return '1';
    if (x === 'false') return '0';
    if (/^-?(?:\d+\.\d*|\.\d+)[fF]?$/.test(x)) return String(parseFloat(x));
    return x.replace(/[fFuUlL]+$/, '');
  }
  function coutStmts(src) {
    var stmts = [];
    src.split('\n').forEach(function (ln) {
      var code = ln.replace(/\/\/.*$/, '');
      var m = code.match(/\bcout\s*<<\s*/);
      if (m === null) return;
      var rest = code.slice(m.index + m[0].length), pieces = [], i = 0;
      while (i < rest.length) {
        var c = rest.charAt(i);
        if (c === ';') break;
        if (c === ' ' || c === '\t') { i++; continue; }
        if (rest.substr(i, 2) === '<<') { i += 2; continue; }
        if (c === '"' || c === "'") {
          var j = i + 1, s = '';
          while (j < rest.length && rest.charAt(j) !== c) {
            if (rest.charAt(j) === '\\' && j + 1 < rest.length) { s += unesc(rest.charAt(j + 1)); j += 2; }
            else { s += rest.charAt(j); j++; }
          }
          pieces.push({ t: 'lit', s: s });
          i = j + 1;
          continue;
        }
        var w = rest.slice(i).match(/^[A-Za-z_]\w*|^\d+(?:\.\d+)?/);
        if (w === null) { i++; continue; }
        var word = w[0], after = rest.slice(i + word.length);
        i += word.length;
        if (word === 'endl') pieces.push({ t: 'lit', s: '\n' });
        else if (/^\d/.test(word)) pieces.push({ t: 'lit', s: word });
        else pieces.push({ t: 'var', name: word, end: /^\s*(<<|;)/.test(after) });
      }
      stmts.push(pieces);
    });
    return stmts;
  }
  function fly(stage, slot, text, tvEl, done) {
    var sc = slot.parentNode;
    slot.classList.add('is-cout');
    sc.classList.add('has-cout');
    setTimeout(function () {
      var sr = stage.getBoundingClientRect();
      var br = slot.querySelector('.cpp-box-cube').getBoundingClientRect();
      var tr = tvEl.querySelector('.cpp-tv-screen').getBoundingClientRect();
      var sx = br.left + br.width / 2 - sr.left, sy = br.top + br.height / 2 - sr.top;
      var dx = tr.left + tr.width / 2 - sr.left - sx, dy = tr.top + tr.height / 2 - sr.top - sy;
      var f = document.createElement('div');
      f.className = 'cpp-fly';
      f.innerHTML = '<span></span>';
      f.firstChild.textContent = text;
      f.style.left = sx + 'px';
      f.style.top = sy + 'px';
      stage.appendChild(f);
      var up = f.animate([
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
        { transform: 'translate(-50%,-50%) translateY(-70px) scale(1.1)', opacity: 1 }
      ], { duration: 520, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });
      up.onfinish = function () {
        var go = f.animate([
          { transform: 'translate(-50%,-50%) translateY(-70px) scale(1.1)', opacity: 1 },
          { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) scale(.9)', opacity: 1, offset: .82 },
          { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) scale(.6)', opacity: 0 }
        ], { duration: 900, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
        go.onfinish = function () {
          f.remove();
          slot.classList.remove('is-cout');
          sc.classList.remove('has-cout');
          done();
        };
      };
    }, 850);
  }
  function tv(stage, vars, src) {
    var stmts = coutStmts(src);
    var el = stage.querySelector('.cpp-tv');
    if (el === null) {
      el = document.createElement('div');
      el.className = 'cpp-tv';
      el.innerHTML = '<div class="cpp-tv-body"><div class="cpp-tv-screen"><pre class="cpp-tv-text"></pre></div><div class="cpp-tv-chin"><i></i><i></i></div></div><div class="cpp-tv-stand"></div>';
      stage.appendChild(el);
    }
    var S = stage._cppTv || (stage._cppTv = { delivered: {}, busy: false, args: null });
    S.args = { vars: vars, src: src };
    stage.classList.toggle('has-tv', stmts.length > 0);
    var byName = {};
    vars.forEach(function (v, i) { byName[v.name] = { v: v, i: i }; });
    var out = '', pending = null, stop = false;
    for (var a = 0; a < stmts.length && !stop; a++) {
      for (var b = 0; b < stmts[a].length; b++) {
        var p = stmts[a][b];
        if (p.t === 'lit') { out += p.s; continue; }
        var ent = byName[p.name];
        var longer = vars.some(function (x) { return x.name !== p.name && x.name.indexOf(p.name) === 0; });
        if (ent === undefined || ent.v.state !== 'done' || (!p.end && longer)) { stop = true; break; }
        var key = a + ':' + b + ':' + p.name;
        if (S.delivered[key]) { out += fmtVal(ent.v); continue; }
        pending = { key: key, idx: ent.i, text: fmtVal(ent.v) };
        stop = true;
        break;
      }
    }
    var pre = el.querySelector('.cpp-tv-text');
    if (pre.dataset.t !== out) {
      pre.dataset.t = out;
      pre.textContent = out;
      var cur = document.createElement('span');
      cur.className = 'cpp-tv-cursor';
      pre.appendChild(cur);
    }
    if (pending !== null && !S.busy) {
      var slot = stage.querySelectorAll('.cpp-box-slot')[pending.idx];
      if (slot === undefined) {
        S.delivered[pending.key] = true;
        tv(stage, vars, src);
        return;
      }
      S.busy = true;
      fly(stage, slot, pending.text, el, function () {
        S.delivered[pending.key] = true;
        S.busy = false;
        var scr = el.querySelector('.cpp-tv-screen');
        scr.classList.remove('is-pop');
        void scr.offsetWidth;
        scr.classList.add('is-pop');
        tv(stage, S.args.vars, S.args.src);
      });
    }
  }

  /* cpp-cheer */
  var CHEER_WORDS = ['Excellent', 'Brilliant', 'Awesome', 'Fantastic', 'Superb', 'Perfect', 'Great job', 'Well done', 'Nailed it', 'Outstanding', 'Spectacular', 'Impressive', 'Magnificent', 'Terrific'];
  var cheerLast = -1;
  function celebrate(shell) {
    var i;
    do { i = Math.floor(Math.random() * CHEER_WORDS.length); } while (i === cheerLast);
    cheerLast = i;
    var host = shell.closest('.cpp-guided-drawer') || shell.closest('.cpp-lab');
    if (host === null) return;
    var old = host.querySelector('.cpp-praise');
    if (old !== null) old.remove();
    var b = document.createElement('div');
    b.className = 'cpp-praise';
    b.textContent = CHEER_WORDS[i] + '!';
    host.appendChild(b);
    shell.classList.add('cpp-done-green');
    clearTimeout(shell._cheerA);
    clearTimeout(shell._cheerB);
    shell._cheerA = setTimeout(function () { b.classList.add('is-out'); }, 2200);
    shell._cheerB = setTimeout(function () { b.remove(); shell.classList.remove('cpp-done-green'); }, 2800);
  }
  function cheer(st, m, shell) {
    var ok = m !== null && st.body.length > 0 && m === st.body && !(st.phases && st.pi < st.phases.length - 1);
    if (ok && !st.done) { st.done = true; celebrate(shell); }
    else if (!ok) { st.done = false; }
  }

  /* cpp-nav-bar */
  function cppNavScan() {
    document.querySelectorAll('.cpp-lab:not([data-cpp-nav])').forEach(function (lab) {
      lab.dataset.cppNav = '1';
      var nodes = Array.prototype.slice.call(document.querySelectorAll('.lado-node[data-node*="::"]'));
      var p = location.hash.replace(/^#/, '').split('/');
      var key = p.length >= 3 ? p[1] + '::' + p[2] : '';
      var at = nodes.findIndex(function (n) { return n.dataset.node === key; });
      if (at < 0) {
        var act = document.querySelector('.lado-node.is-active[data-node*="::"]');
        at = act ? nodes.indexOf(act) : -1;
      }
      if (at < 0) return;
      function btn(cls, kicker, target) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cpp-nav-btn ' + cls;
        var k = document.createElement('b');
        k.textContent = kicker;
        var s = document.createElement('small');
        s.textContent = target ? target.textContent.replace(/\s+/g, ' ').trim() : 'Nothing further';
        b.appendChild(k);
        b.appendChild(s);
        if (target) b.addEventListener('click', function () { target.click(); });
        else b.disabled = true;
        return b;
      }
      var bar = document.createElement('div');
      bar.className = 'cpp-nav-bar';
      bar.appendChild(btn('is-prev', '‹  Previous', nodes[at - 1]));
      bar.appendChild(btn('is-next', 'Next topic  ›', nodes[at + 1]));
      lab.appendChild(bar);
      lab.classList.add('has-cpp-nav');
    });
  }

  /* cpp-light-sync */
  (function () {
    function lum(c) {
      var m = c.match(/rgba?\(([^)]+)\)/);
      if (m === null) return null;
      var p = m[1].split(',').map(parseFloat);
      if (p.length > 3 && p[3] === 0) return null;
      return (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255;
    }
    function isLight() {
      var start = document.querySelector('.cpp-lab') || document.querySelector('.lado-ws');
      if (start === null) return null;
      var el = start;
      while (el) {
        var l = lum(getComputedStyle(el).backgroundColor);
        if (l !== null) return l > 0.55;
        el = el.parentElement;
      }
      var t = lum(getComputedStyle(start).color);
      return t === null ? null : t < 0.5;
    }
    function sync() {
      var light = isLight();
      if (light === null) return;
      document.documentElement.classList.toggle('cpp-light', light);
    }
    var raf = 0;
    function kick() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; sync(); });
    }
    new MutationObserver(kick).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['class', 'data-theme', 'style'] });
    document.addEventListener('click', function () { setTimeout(sync, 60); setTimeout(sync, 450); }, true);
    kick();
    setTimeout(sync, 300);
  })();

  function enhance(ta) { /* cpp-wrong-flash */
    ta.dataset.cppHl = '1';
    var shell = ta.parentNode;
    var gutter = shell.querySelector('.cpp-editor-gutter');
    var wrap = document.createElement('div');
    wrap.className = 'cpp-hl-wrap';
    var gpre = document.createElement('pre');
    gpre.className = 'cpp-hl cpp-hl-ghost';
    gpre.setAttribute('aria-hidden', 'true');
    var pre = document.createElement('pre');
    pre.className = 'cpp-hl';
    pre.setAttribute('aria-hidden', 'true');
    shell.insertBefore(wrap, ta);
    wrap.appendChild(gpre);
    wrap.appendChild(pre);
    wrap.appendChild(ta);
    ta.setAttribute('wrap', 'off');
    ta.spellcheck = false;
    var st = { head: '', tail: '', body: '', seen: ta.value, last: ta.value, g: null, flash: false, ft: 0 };

    function nl(s) { return (s.match(/\n/g) || []).length; }
    function lab() { return ta.closest('.cpp-lab'); }
    function isSql() { var l = lab(); return l !== null && l.getAttribute('data-lang') === 'sql'; }
    var hlC = hl;
    function isCs() { var l = lab(); return l !== null && l.getAttribute('data-lang') === 'csharp'; }
    function hlx(s) { return isSql() ? hlSql(s) : isCs() ? hlCs(s) : hlC(s); }
    function guided() { var l = lab(); return l !== null && l.classList.contains('is-diy') === false; }
    function fire() { ta.dispatchEvent(new Event('input', { bubbles: true })); }
    function parts(t) {
      if (isSql()) {
        var mm = /^[ \t]*--[ \t]*YOUR TURN[^\n]*\n/im.exec(t);
        if (mm === null) return null;
        var he = mm.index + mm[0].length;
        return { head: t.slice(0, he), tail: '', body: t.slice(he).replace(/\s+$/, '') };
      }
      if (isCs()) {
        var cm = t.match(/static\s+void\s+Main\s*\([^)]*\)\s*\n?\s*\{[ \t]*\n/);
        if (cm === null) return null;
        var ce = cm.index + cm[0].length, ct = t.lastIndexOf('\n    }\n}');
        if (ct < ce - 1) return null;
        ct += 1;
        return { head: t.slice(0, ce), tail: t.slice(ct), body: t.slice(ce, ct).replace(/\s+$/, '') };
      }
      var hm = t.match(/int\s+main\s*\([^)]*\)\s*\{[ \t]*\n/);
      if (hm === null) return null;
      var hend = hm.index + hm[0].length;
      var re = /^[ \t]*return\s+0\s*;/gm, rm, ts = -1;
      while ((rm = re.exec(t)) !== null) ts = rm.index;
      if (ts < hend) {
        ts = t.lastIndexOf('\n}');
        if (ts >= hend - 1) ts = ts + 1; else return null;
      }
      return { head: t.slice(0, hend), tail: t.slice(ts), body: t.slice(hend, ts).replace(/\s+$/, '') };
    }
    function mid(v) {
      var e = '\n' + st.tail;
      if (st.head && v.indexOf(st.head) === 0 && v.length >= st.head.length + e.length && v.slice(v.length - e.length) === e) {
        return v.slice(st.head.length, v.length - e.length);
      }
      return null;
    }
    function onTrack() {
      var m = mid(ta.value);
      return (guided() && m !== null && st.body.indexOf(m) === 0) ? m : null;
    }
    function seed() {
      var indent = (st.body.match(/^ */) || [''])[0];
      ta.value = st.head + indent + '\n' + st.tail;
      st.seen = st.last = ta.value;
      var p = st.head.length + indent.length;
      ta.setSelectionRange(p, p);
    }
    function adopt() {
      if (!guided() || !ta.value.trim()) return false;
      var q = parts(ta.value);
      if (q === null) return false;
      st.head = q.head; st.tail = q.tail; st.body = q.body;
      seed();
      return true;
    }
    function loadPhase() {
      var q = st.phases[st.pi];
      st.head = q.head; st.body = q.body; st.tail = q.tail;
      seed();
    }
    function advance() {
      if (!st.phases || st.pi >= st.phases.length - 1) return;
      var m = mid(ta.value);
      if (m !== null && st.body.length > 0 && m === st.body) { st.pi++; loadPhase(); render(); fire(); }
    }
    ta.addEventListener('cpp-guided-example', function (event) {
      var ph = event.detail.phases;
      if (ph && ph.length) { st.phases = ph; st.pi = 0; loadPhase(); render(); fire(); return; }
      st.phases = null;
      ta.value = event.detail.code;
      adopt();
      render();
      fire();
    });
    function clamp() {
      if (!st.head || !guided()) return;
      var m = mid(ta.value);
      if (m === null) return;
      var p = st.head.length + m.length;
      if (ta.selectionStart !== p || ta.selectionEnd !== p) ta.setSelectionRange(p, p);
    }
    function guard() {
      if (!st.head || !guided()) return;
      if (mid(ta.value) === null) {
        ta.value = st.last;
        var hi = ta.value.length - st.tail.length - 1;
        ta.setSelectionRange(hi, hi);
      } else {
        st.last = ta.value;
      }
    }
    function flash() {
      st.flash = true;
      shell.classList.add('cpp-wrong-shake');
      render();
      clearTimeout(st.ft);
      st.ft = setTimeout(function () {
        st.flash = false;
        shell.classList.remove('cpp-wrong-shake');
        render();
      }, 1000);
    }
    function ghostBody(len) {
      var b = st.body;
      if (!st.flash) return esc(b);
      var rest = b.slice(len), tk = rest.match(/^\S+|^ +|^\n/);
      if (tk === null) return esc(b);
      return esc(b.slice(0, len)) + '<span class="cpp-wrong">' + esc(tk[0]) + '</span>' + esc(rest.slice(tk[0].length));
    }
    function render() {
      var v = ta.value, g = guided(), m = g ? mid(v) : null, h, gh = '';
      st.g = g;
      cheer(st, m, shell);
      if (m !== null) {
        var tl = m.split('\n').length, bl = st.body.split('\n').length;
        var pad = Math.max(0, bl - tl), extra = Math.max(0, tl - bl);
        h = hlx(st.head) + '<span class="cpp-typed">' + hlx(m) + '</span>' + '\n'.repeat(pad) + '\n' + hlx(st.tail);
        gh = '\n'.repeat(nl(st.head)) + (st.body.indexOf(m) === 0 ? ghostBody(m.length) : esc(st.body)) + '\n'.repeat(extra) + '\n' + '\n'.repeat(nl(st.tail));
      } else {
        h = hlx(v);
      }
      gpre.innerHTML = gh;
      pre.innerHTML = h + '\n';
      var n = Math.max(1, pre.textContent.split('\n').length - 1);
      if (gutter) gutter.textContent = Array.from({ length: n }, function (_, i) { return i + 1; }).join('\n');
      ta.style.height = (n * 21.45 + 30) + 'px';
      var l = lab();
      var stage = l ? l.querySelector('.cpp-visual-stage') : null;
      if (stage) { var pv = parse(v); boxes(stage, pv); tv(stage, pv, v); }
    }

    adopt();
    ta.addEventListener('beforeinput', function (e) {
      var m = onTrack();
      if (m === null) return;
      clamp();
      var t = e.inputType || '';
      if (t.indexOf('delete') === 0) { if (m === '') e.preventDefault(); return; }
      if (t === 'historyUndo' || t === 'historyRedo') { e.preventDefault(); return; }
      var text = e.data;
      if (t === 'insertLineBreak' || t === 'insertParagraph') text = '\n';
      if (text === null || text === undefined) text = (e.dataTransfer && e.dataTransfer.getData('text')) || '';
      if (text === '') return;
      text = text.replace(/\r\n/g, '\n');
      var want = st.body.substr(m.length, text.length);
      if (want !== text) {
        e.preventDefault();
        if (isSql() && want.length === text.length && want.toLowerCase() === text.toLowerCase()) { ta.setRangeText(want, ta.selectionStart, ta.selectionEnd, 'end'); fire(); }
        else flash();
      }
    });
    ta.addEventListener('input', function () { guard(); clamp(); st.seen = ta.value; render(); advance(); });
    ['keyup', 'mouseup', 'focus', 'select'].forEach(function (ev) { ta.addEventListener(ev, clamp); });
    ta.addEventListener('keydown', function (e) {
      var m = onTrack();
      if (e.key === 'Tab') {
        e.preventDefault();
        if (m === null) { ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); fire(); return; }
        clamp();
        if (st.body.substr(m.length, 2) === '  ') { ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); fire(); }
        else flash();
        return;
      }
      if (e.key === 'Enter' && m !== null) {
        e.preventDefault();
        clamp();
        if (st.body.charAt(m.length) !== '\n') { flash(); return; }
        var next = st.body.split('\n')[m.split('\n').length] || '';
        ta.setRangeText('\n' + next.match(/^ */)[0], ta.selectionStart, ta.selectionEnd, 'end');
        fire();
      }
    });
    function focusEnd(e) {
      if (e.target === shell || e.target === wrap) {
        e.preventDefault();
        ta.focus();
        var p = (guided() && mid(ta.value) !== null) ? ta.value.length - st.tail.length - 1 : ta.value.length;
        ta.setSelectionRange(p, p);
      }
    }
    shell.addEventListener('mousedown', focusEnd);
    wrap.addEventListener('mousedown', focusEnd);

    var timer = setInterval(function () {
      if (ta.isConnected === false) { clearInterval(timer); return; }
      if (ta.value !== st.seen) {
        var q = (guided() && st.head) ? parts(ta.value) : null;
        if (q !== null && q.head === st.head && q.tail === st.tail) seed();
        else if (adopt() === false) st.seen = st.last = ta.value;
        render();
      } else if (guided() !== st.g) {
        if (guided() && st.head && onTrack() === null) seed();
        render();
      }
    }, 150);
    render();
  }

  function scan() {
    document.querySelectorAll('.cpp-live-editor:not([data-cpp-hl])').forEach(enhance);
    cppNavScan();
    document.querySelectorAll('.cpp-guided-drawer .cpp-try-heading:not([data-cpp-back])').forEach(function (hd) {
      hd.dataset.cppBack = '1';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cpp-back-btn';
      b.setAttribute('aria-label', 'Back');
      b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
      b.addEventListener('click', function () {
        var d = hd.closest('.cpp-guided-drawer');
        var x = d && d.querySelector('.cpp-drawer-close');
        if (x) { x.click(); return; }
        var l = hd.closest('.cpp-lab');
        if (l) l.classList.remove('is-guided-open');
      });
      hd.insertBefore(b, hd.firstChild);
    });

  }

  function start() {
    var q = 0;
    new MutationObserver(function () {
      if (q) return;
      q = requestAnimationFrame(function () { q = 0; scan(); });
    }).observe(document.body, { childList: true, subtree: true });
    scan();

    /* keep guided drawer flush with header line and sidebar edge */
    var root = document.documentElement, until = 0;
    function sync() {
      var h = document.querySelector('.lado-ws-header');
      var b = document.querySelector('.lado-ws-sidebar');
      if (h) root.style.setProperty('--cpp-drawer-top', Math.round(h.getBoundingClientRect().bottom) + 'px');
      if (b) root.style.setProperty('--cpp-drawer-left', Math.round(b.getBoundingClientRect().right) + 'px');
    }
    function loop() { sync(); if (performance.now() < until) requestAnimationFrame(loop); }
    function kick(ms) { until = performance.now() + ms; requestAnimationFrame(loop); }
    window.addEventListener('resize', function () { kick(150); });
    document.addEventListener('click', function () { kick(1000); }, true);
    new MutationObserver(function () { kick(1000); }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    kick(1000);
  }

  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

/* cpp-comparison-scene */
(function () {
  var GUIDE = [
    { code:'int left = 10;', text:'Create the value for the left side:  int left = 10;' },
    { code:'int right = 7;', text:'Create the value for the right side:  int right = 7;' },
    { code:'left == right;', text:'Now compare the boxes directly: are they equal?' },
    { code:'left != right;', text:'Ask whether the boxes are different.' },
    { code:'left < right;', text:'Ask whether the left box is smaller.' },
    { code:'left > right;', text:'Ask whether the left box is greater.' },
    { code:'left <= right;', text:'Ask whether left is smaller or equal.' },
    { code:'left >= right;', text:'Ask whether left is greater or equal.' }
  ];
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function compact(s) { return s.replace(/\/\/.*$/gm,'').replace(/\s+/g,'').replace(/;+$/,';'); }
  function guide(lab,ta) {
    var work=lab.querySelector('.cpp-code-panel'), bar=lab.querySelector('.cpp-cmp-guide');
    if (!work) return;
    if (!bar) {
      bar=document.createElement('section'); bar.className='cpp-cmp-guide';
      work.insertBefore(bar,work.firstChild);
    }
    if (lab.classList.contains('is-diy')) { bar.style.display='none'; return; }
    bar.style.display='block';
    var code=compact(ta.value), done=0;
    while(done<GUIDE.length && code.indexOf(compact(GUIDE[done].code))>=0) done++;
    if(done>=GUIDE.length) {
      bar.innerHTML='<span>GUIDED CODING · COMPLETE</span><strong>All comparison operators completed!</strong><p>Change either number and watch every scale result update.</p>';
      bar.classList.add('is-complete');
    } else {
      bar.classList.remove('is-complete');
      bar.innerHTML='<span>GUIDED CODING · STEP '+(done+1)+' OF '+GUIDE.length+'</span><strong>'+esc(GUIDE[done].text)+'</strong><code>'+esc(GUIDE[done].code)+'</code><p>The step advances after the semicolon.</p>';
    }
  }
  function evaluate(expr, vars) {
    var s = expr.replace(/[A-Za-z_]\w*/g, function (id) { return Object.prototype.hasOwnProperty.call(vars,id) ? vars[id] : id; });
    if (!/^[\d\s.+\-]*$/.test(s)) return null;
    try { var n = Function('return (' + s + ')')(); return typeof n === 'number' ? n : null; } catch (_) { return null; }
  }
  function parse(code) {
    code = window.__ladoCsSrc(code);
    var clean = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/^\s*#.*$/gm, '')
      .replace(/^\s*using\s+namespace[^;]*;/gm, '')
      .replace(/^[\s\S]*?\bmain\s*\([^)]*\)\s*\{/, '');
    var vars = Object.create(null), statements = clean.split(';'), comparisons = [];
    for (var i=0;i<statements.length-1;i++) {
      var s = statements[i].replace(/^[\s{}]+|[\s{}]+$/g,'').replace(/\s+/g,' '), m;
      if ((m = /^(?:int|short|long|float|double)\s+([A-Za-z_]\w*)\s*=\s*(.+)$/.exec(s))) {
        var n = evaluate(m[2],vars); if (n !== null) vars[m[1]]=n;
      }
      var comparison = s.replace(/^bool\s+[A-Za-z_]\w*\s*=\s*/, '');
      var all = /^(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+)$/.exec(comparison);
      if (all) {
        var a=evaluate(all[1],vars), b=evaluate(all[3],vars); if (a===null||b===null) continue;
        var op=all[2], result=op==='=='?a===b:op==='!='?a!==b:op==='<'?a<b:op==='>'?a>b:op==='<='?a<=b:a>=b;
        comparisons.push({a:a,b:b,op:op,result:result, line:comparison});
      }
    }
    var rawPending=statements[statements.length-1].replace(/^[\s{}]+|[\s{}]+$/g,'').replace(/\s+/g,' ');
    var pendingMatch=/^(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+)$/.exec(rawPending.replace(/^bool\s+[A-Za-z_]\w*\s*=\s*/,''));
    var pending=null;
    if(pendingMatch){
      var pa=evaluate(pendingMatch[1],vars),pb=evaluate(pendingMatch[3],vars);
      if(pa!==null&&pb!==null){var po=pendingMatch[2],pr=po==='=='?pa===pb:po==='!='?pa!==pb:po==='<'?pa<pb:po==='>'?pa>pb:po==='<='?pa<=pb:pa>=pb;pending={a:pa,b:pb,op:po,result:pr,line:rawPending,pending:true};}
    }
    return {vars:vars,comparisons:comparisons,pending:pending};
  }
  function update(stage,lab,ta) {
    var h = window.__ladoVH(lab);
    if (!h || !/Comparison Operators/.test(h.textContent)) { stage.classList.remove('has-cmp'); var old=stage.querySelector('.cpp-cmp-scene'); if(old)old.remove(); return; }
    guide(lab,ta);
    var state=parse(ta.value), comparisons=state.comparisons, scene=stage.querySelector('.cpp-cmp-scene'), status=stage.querySelector('.cpp-visual-status');
    var ready=Object.prototype.hasOwnProperty.call(state.vars,'left')&&Object.prototype.hasOwnProperty.call(state.vars,'right');
    if (!ready && !comparisons.length && !state.pending) { if(scene)scene.remove(); stage.classList.remove('has-cmp'); if(status)status.textContent='Create the left box first'; return; }
    if(!scene){scene=document.createElement('div');scene.className='cpp-cmp-scene';stage.appendChild(scene);}
    stage.classList.add('has-cmp');
    if(ready&&!comparisons.length&&!state.pending){
      var readySig='ready|'+state.vars.left+'|'+state.vars.right;
      if(scene.dataset.signature!==readySig){scene.dataset.signature=readySig;scene.className='cpp-cmp-scene is-ready';scene.innerHTML='<div class="cpp-cmp-explain">Your left and right boxes are ready. Type a comparison to move them onto the seesaw.</div><div class="cpp-cmp-ready-boxes"><div><b>'+esc(state.vars.left)+'</b><span>left</span></div><div><b>'+esc(state.vars.right)+'</b><span>right</span></div></div>';}
      if(status)status.textContent='Boxes ready — type left > right;'; return;
    }
    var index=comparisons.length?comparisons.length-1:0;
    var data=state.pending||comparisons[index];
    var signature=(data.pending?'pending':'done')+'|'+index+'|'+data.a+'|'+data.op+'|'+data.b+'|'+data.result;
    if (scene.dataset.signature === signature) return;
    scene.dataset.signature = signature;
    scene.className='cpp-cmp-scene is-comparing'+(data.pending?' is-pending':'');
    var tilt=data.a===data.b?0:(data.a>data.b?-9:9);
    var relation=data.a===data.b?'equal to':data.a>data.b?'greater than':'less than';
    var explanation=data.pending?'You are comparing '+data.a+' '+data.op+' '+data.b+'. Finish with ; to switch on the answer lamp.':'Your statement '+data.a+' '+data.op+' '+data.b+' means the left box is '+relation+' the right box, so it is '+data.result+'.';
    scene.innerHTML='<div class="cpp-cmp-explain">'+esc(explanation)+'</div><div class="cpp-cmp-scale"><div class="cpp-cmp-post"></div><div class="cpp-cmp-op">'+esc(data.op)+'</div><div class="cpp-cmp-beam" style="--tilt:'+tilt+'deg"><div class="cpp-cmp-pan is-left" style="--tilt:'+tilt+'deg"><b>'+esc(data.a)+'</b></div><div class="cpp-cmp-pan is-right" style="--tilt:'+tilt+'deg"><b>'+esc(data.b)+'</b></div></div><div class="cpp-cmp-caption '+(data.result?'':'is-false')+'">'+esc(data.a+' '+data.op+' '+data.b+(data.pending?' — waiting for ;':' is '+data.result))+'</div></div><div class="cpp-cmp-lamps"><div class="cpp-cmp-lamp is-true '+(!data.pending&&data.result?'is-on':'')+'">TRUE</div><div class="cpp-cmp-lamp is-false '+(!data.pending&&!data.result?'is-on':'')+'">FALSE</div></div>';
    if(status)status.textContent=data.pending?'Comparing live — finish with ;':(data.a===data.b?'Scale level':data.a>data.b?'Left side is heavier':'Right side is heavier');
  }
  setInterval(function(){document.querySelectorAll('.cpp-visual-stage').forEach(function(stage){var lab=stage.closest('.cpp-lab'),ta=lab&&lab.querySelector('[data-role="lab-code"]');if(ta)try{update(stage,lab,ta);}catch(e){}});},180);
})();

/* cpp-diy-lab */
(function () {
  var SCAFFOLD = '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  \n  return 0;\n}\n';
  var WORDS = ['Excellent', 'Brilliant', 'Awesome', 'Superb', 'Perfect', 'Nailed it', 'Well done', 'Fantastic'];
  var wi = 0;

  function norm(s) {
    return s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*#.*$/gm, '').replace(/^\s*using\s+namespace[^;]*;/gm, '')
      .replace(/\s+/g, ' ').replace(/ ?([^\w\s]) ?/g, '$1').trim();
  }
  function stmts(s) {
    var t = norm(s).replace(/^[\s\S]*?\bmain\([^)]*\)\{/, '');
    var parts = t.split(';');
    parts.pop();
    return parts.map(function (x) { return x.replace(/^[{}]+/, '').trim(); }).filter(Boolean).map(function (x) { return x + ';'; });
  }
  /* cpp-diy-semantic */
function splitTop(s) {
    var out = [], cur = '', q = '', k, c;
    for (k = 0; k < s.length; k++) {
      c = s.charAt(k);
      if (q) { cur += c; if (c === q) q = ''; continue; }
      if (c === '"' || c === "'") { q = c; cur += c; continue; }
      if (c === ',') { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }
  function normVal(v) {
    v = (v || '').trim();
    if (v === '') return null;
    if (/^[-+]?(\d+\.?\d*|\.\d+)[fFlLuU]*$/.test(v)) return String(parseFloat(v));
    return v;
  }
  function declOf(stmt) {
    var m = stmt.replace(/;$/, '').match(/^((?:const |constexpr |unsigned |signed |long |short )*(?:int|float|double|char|bool|string|auto|size_t|long|short|unsigned))\s+(.+)$/);
    if (!m) return null;
    var type = m[1].replace(/constexpr/g, 'const'), out = [], parts = splitTop(m[2]), k, d;
    for (k = 0; k < parts.length; k++) {
      d = parts[k].trim().match(/^[*&]?([A-Za-z_]\w*)(?:=(.+)|\{(.*)\})?$/);
      if (!d) return null;
      out.push({ type: type, name: d[1], val: d[2] !== undefined ? normVal(d[2]) : (d[3] !== undefined ? (d[3].trim() === '' ? '0' : normVal(d[3])) : null) });
    }
    return out;
  }
  function sem(code) {
    var vars = {}, list = stmts(code), k, j, d, m;
    for (k = 0; k < list.length; k++) {
      d = declOf(list[k]);
      if (d) { for (j = 0; j < d.length; j++) vars[d[j].name] = { type: d[j].type, val: d[j].val }; continue; }
      m = list[k].match(/^([A-Za-z_]\w*)=([^=].*);$/);
      if (m && vars[m[1]]) vars[m[1]].val = normVal(m[2]);
    }
    return { vars: vars };
  }
  function gap(task, code) {
    var have = stmts(code), need = stmts(task.code), actual = sem(code).vars, at = 0, k, j, d, a;
    if (need.length === 0) return 'x;'; var dupn = {}, seenn = {}; need.forEach(function (n0) { var dd = declOf(n0); if (dd) dd.forEach(function (x) { if (seenn[x.name]) dupn[x.name] = 1; seenn[x.name] = 1; }); }); /* cpp-gap-dup */
    for (k = 0; k < need.length; k++) {
      d = declOf(need[k]);
      if (d && !d.some(function (x) { return dupn[x.name]; })) {
        for (j = 0; j < d.length; j++) {
          a = actual[d[j].name];
          if (!a || a.type !== d[j].type || (d[j].val !== null && a.val !== d[j].val)) return need[k];
        }
        continue;
      }
      j = have.indexOf(need[k], at);
      if (j < 0) return need[k];
      at = j + 1;
    }
    return null;
  }

  function diagnose(code, miss) {
    var have = stmts(code), n = norm(code), core = miss.replace(/;$/, ''), low = miss.toLowerCase(), i;
    if (n.indexOf(core) >= 0) return 'Almost! Statements in C++ end with a semicolon ;';
    for (i = 0; i < have.length; i++) if (have[i].toLowerCase() === low) return 'C++ is case sensitive. Check your capital letters.';
    var first = (miss.match(/^[A-Za-z_]\w*/) || [''])[0];
    for (i = 0; i < have.length; i++) {
      if (first && have[i].indexOf(first) === 0) {
        if (miss.indexOf('=') >= 0 && have[i].indexOf('=') < 0) return 'Good start. Use = to put the value in the variable.';
        if (miss.indexOf('"') >= 0 && have[i].indexOf('"') < 0) return 'Text needs double quotes "like this".';
        return 'Close! Your line starts right, but the name or the value does not match the task yet.';
      }
    }
    return 'I do not see that line yet. Type it inside main(), before return 0;';
  }

  function article(w) { return /^[aeiou]/i.test(w) ? 'an' : 'a'; }
  function makeTask(code, desc) {
    var t = { code: code, text: '' }, m, one = code.indexOf('\n') < 0 ? code : null;
    if (one !== null) {
      if ((m = one.match(/^([A-Za-z_][\w:<>]*)\s+([A-Za-z_]\w*)\s*=\s*([^,;=]+?)\s*,\s*([A-Za-z_]\w*)\s*=\s*([^,;]+?)\s*;$/))) {
        t.text = 'In ONE line, declare two ' + m[1] + ' variables: ' + m[2] + ' = ' + m[3] + ' and ' + m[4] + ' = ' + m[5] + '.';
      } else if ((m = one.match(/^([A-Za-z_][\w:<>]*)\s+([A-Za-z_]\w*)\s*\{\s*([^}]*?)\s*\}\s*;$/))) {
        t.text = 'Declare ' + article(m[1]) + ' ' + m[1] + ' named ' + m[2] + ' and give it the value ' + m[3] + ' using curly braces { }.';
      } else if ((m = one.match(/^([A-Za-z_][\w:<>]*)\s+([A-Za-z_]\w*)\s*=\s*([^;]+?)\s*;$/))) {
        t.text = 'Declare ' + article(m[1]) + ' ' + m[1] + ' named ' + m[2] + ' and give it the value ' + m[3] + '.';
      } else if ((m = one.match(/^([A-Za-z_][\w:<>]*)\s+([A-Za-z_]\w*)\s*;$/))) {
        t.text = 'Declare ' + article(m[1]) + ' ' + m[1] + ' named ' + m[2] + ' without giving it a value.';
      } else if ((m = one.match(/^([A-Za-z_]\w*)\s*=\s*([^;]+?)\s*;$/))) {
        t.text = 'The variable ' + m[1] + ' already exists. Change its value to ' + m[2] + ' (do not write the type again).';
      }
    }
    if (one !== null && (m = one.match(/^auto\s+([A-Za-z_]\w*)\s*=\s*([^;]+?)\s*;$/))) t.text = 'Guess first: what type will ' + m[1] + ' become? Then type  auto ' + m[1] + ' = ' + m[2] + ';  and let the scanner check you.';
    if (code.indexOf('auto x;') === 0) t.text = 'Debug: type these two lines. The scanner has nothing to read, so you get a red error.';
    if (!t.text) t.text = desc ? 'Type the example that matches this note: ' + desc : 'Type the example from the lesson.';
    return t;
  }
  function readTasks(lab) {
    var out = [];
    lab.querySelectorAll('.cpp-lesson-list li').forEach(function (li) {
      var pre = li.querySelector('pre');
      if (!pre) return;
      var code = pre.textContent.replace(/\s+$/, '');
      var line = li.querySelector('.cpp-lesson-line');
      var strong = line && line.querySelector('strong');
      var desc = line ? line.textContent : '';
      if (strong) desc = desc.replace(strong.textContent, '');
      out.push(makeTask(code, desc.replace(/\s+/g, ' ').trim()));
    });
    return out;
  }

  function setScaffold(ta) {
    ta.value = SCAFFOLD;
    var p = SCAFFOLD.indexOf('  \n') + 2;
    ta.setSelectionRange(p, p);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(function () { ta.focus(); }, 650);
  }
  function praise(lab, text) {
    var host = lab.querySelector('.cpp-guided-drawer') || lab;
    var old = host.querySelector('.cpp-praise');
    if (old) old.remove();
    var b = document.createElement('div');
    b.className = 'cpp-praise';
    b.textContent = text || (WORDS[wi++ % WORDS.length] + '!');
    host.appendChild(b);
    setTimeout(function () { b.classList.add('is-out'); }, 1500);
    setTimeout(function () { b.remove(); }, 2100);
  }

  /* Challenges: the student writes code from a task (diy) or fixes broken code (debug). The program is run by the
     C++ interpreter and checked against goals, which tick live as the student types. */
  function programFor(code) {
    return '#include <iostream>\n#include <string>\n#include <array>\nusing namespace std;\n\nint main() {\n' +
      code.split('\n').map(function (l) { return '  ' + l; }).join('\n') + '\n  return 0;\n}\n';
  }
  var FULL_HEAD = '#include <iostream>\n#include <string>\nusing namespace std;\n\n';
  function trimOut(s) { return String(s || '').split('\n').map(function (l) { return l.replace(/\s+$/, ''); }).join('\n').trim(); }
  function friendlyError(msg) {
    if (/Expected ";"/.test(msg)) return 'error: ' + msg + '\nAlmost! Statements in C++ end with a semicolon ;';
    if (/has not been declared/.test(msg)) return 'error: ' + msg + '\nCreate the variable first, then use it.';
    if (/Expected "[)}\]]"/.test(msg)) return 'error: ' + msg + '\nCheck that every ( and { has a matching ) and }.';
    return 'error: ' + msg;
  }
  function buildPractice(lab, shell, ta, list) {
    var bar = document.createElement('div');
    bar.className = 'cpp-diy-bar cpp-practice-bar';
    bar.innerHTML = '<div class="cpp-diy-top"><span class="cpp-diy-kicker"></span><span class="cpp-diy-dots"></span></div><p class="cpp-diy-task"></p><ul class="cpp-goals"></ul><p class="cpp-diy-msg"></p><div class="cpp-diy-actions"><button type="button" class="cpp-diy-btn is-main">Check my code</button><button type="button" class="cpp-diy-btn is-hint">Hint</button><button type="button" class="cpp-diy-btn is-reset">Start again</button><button type="button" class="cpp-diy-btn is-skip">Skip</button></div>';
    shell.parentNode.insertBefore(bar, shell);
    var q = function (s) { return bar.querySelector(s); };
    var kicker = q('.cpp-diy-kicker'), dots = q('.cpp-diy-dots'), taskEl = q('.cpp-diy-task'), goalsEl = q('.cpp-goals'), msg = q('.cpp-diy-msg');
    var bMain = q('.is-main'), bHint = q('.is-hint'), bSkip = q('.is-skip'), bReset = q('.is-reset');
    var S = { i: 0, hints: 0, done: [], busy: false, fin: false }, timer = 0;

    function setMsg(t, cls) { msg.textContent = t; msg.className = 'cpp-diy-msg' + (cls ? ' ' + cls : ''); }
    function sqlLab() { return lab.getAttribute('data-lang') === 'sql'; }
    function csLab() { return lab.getAttribute('data-lang') === 'csharp'; }
    function csProgram(code) { return /^\s*using\b/.test(code) ? code + '\n' : 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n' + code.split('\n').map(function (l) { return '        ' + l; }).join('\n') + '\n    }\n}\n'; }
    function sqlText(c, debug) { lab.dataset.sqlSetup = c.setup || ''; return (debug ? '-- YOUR TURN: fix the bug\n' + c.code + '\n' : '-- YOUR TURN: write your SQL below\n\n'); }
    function run(code) {
      if (csLab()) return (window.__ladoCsRun && window.__ladoCsRun(code)) || { error: 'The C# checker is still loading. Try again in a moment.', output: '' };
      if (sqlLab()) return (window.__ladoSqlRun && window.__ladoSqlRun(code, list[S.i])) || { error: 'The SQL checker is still loading. Try again in a moment.', output: '' };
      return (window.__ladoCppRun && window.__ladoCppRun(code)) || { error: 'The C++ checker is still loading. Try again in a moment.', output: '' };
    }
    function evaluate(code) {
      var c = list[S.i], res = run(code), ran = !res.error && !res.stopped, goals = [];
      goals.push({ label: sqlLab() ? 'The SQL runs without an error' : 'The program runs without an error', ok: ran });
      goals.push({ label: (sqlLab() ? 'It shows: ' : 'It prints: ') + trimOut(c.expect).split('\n').join(' / '), ok: ran && trimOut(res.output) === trimOut(c.expect) });
      (c.goals || []).forEach(function (g) {
        var ok = g.re ? new RegExp(g.re, sqlLab() ? 'i' : '').test(code) : !new RegExp(g.no, sqlLab() ? 'i' : '').test(code);
        goals.push({ label: g.label, ok: ok });
      });
      return { res: res, goals: goals, ok: goals.every(function (g) { return g.ok; }) };
    }
    function showGoals(ev, checked) {
      var cr = ev.res || {}, cc = list[S.i] || {};
      lab.dispatchEvent(new CustomEvent('cs-practice', { detail: { ok: ev.goals.filter(function (g) { return g.ok; }).length, total: ev.goals.length, err: cr.error || '', out: cr.output || '', solved: ev.ok, checked: !!checked, task: cc.task || '', idx: S.i } }));
      goalsEl.innerHTML = '';
      ev.goals.forEach(function (g) {
        var li = document.createElement('li');
        li.className = g.ok ? 'is-ok' : '';
        li.textContent = (g.ok ? '✓ ' : '○ ') + g.label;
        goalsEl.appendChild(li);
      });
    }
    function render(swap) {
      dots.innerHTML = '';
      list.forEach(function (c, k) {
        var d = document.createElement('span');
        d.className = S.done[k] === 'ok' ? 'is-done' : S.done[k] === 'skip' ? 'is-skip' : (k === S.i && !S.fin) ? 'is-now' : '';
        dots.appendChild(d);
      });
      if (S.fin) {
        var ok = S.done.filter(function (x) { return x === 'ok'; }).length;
        kicker.textContent = 'FINISHED';
        taskEl.textContent = 'All done! You solved ' + ok + ' of ' + list.length + ' challenges by yourself.';
        goalsEl.innerHTML = '';
        bMain.textContent = 'Start over'; bHint.style.display = 'none'; bSkip.style.display = 'none'; bReset.style.display = 'none';
        return;
      }
      var c = list[S.i];
      kicker.textContent = c.kind === 'debug' ? 'DEBUG' : 'DO IT YOURSELF';
      bMain.textContent = 'Check my code'; bHint.style.display = ''; bSkip.style.display = ''; bReset.style.display = '';
      taskEl.textContent = (c.kind === 'debug' ? 'Fix the bug ' : 'Task ') + (S.i + 1) + ' of ' + list.length + ': ' + c.task;
      if (swap) { bar.classList.remove('is-swap'); void bar.offsetWidth; bar.classList.add('is-swap'); }
      showGoals(evaluate(ta.value));
    }
    function load() {
      var c = list[S.i];
      S.hints = 0; setMsg('', '');
      if (csLab()) {
        ta.value = c.kind === 'debug' ? csProgram(c.code) : csProgram('');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(function () { ta.focus(); if (c.kind !== 'debug') { var at = ta.value.indexOf('        \n') + 8; ta.setSelectionRange(at, at); } }, 650);
      } else if (sqlLab()) {
        ta.value = sqlText(c, c.kind === 'debug');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(function () { ta.focus(); if (c.kind !== 'debug') ta.setSelectionRange(ta.value.length, ta.value.length); }, 650);
      } else if (c.kind === 'debug') {
        ta.value = c.full ? FULL_HEAD + c.code + '\n' : programFor(c.code);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(function () { ta.focus(); }, 650);
      } else if (c.full) {
        // Whole-program tasks start from the default boilerplate only: the student writes everything else.
        ta.value = FULL_HEAD + 'int main() {\n  \n  return 0;\n}\n';
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(function () { ta.focus(); var at = ta.value.indexOf('  \n') + 2; ta.setSelectionRange(at, at); }, 650);
      } else setScaffold(ta);
      render(true);
    }
    function next() {
      S.i++;
      while (S.i < list.length && S.done[S.i]) S.i++;
      if (S.i >= list.length) { S.fin = true; render(true); return; }
      load();
    }
    function win() {
      if (S.busy) return;
      S.busy = true;
      S.done[S.i] = 'ok';
      var all = list.every(function (c, k) { return S.done[k]; });
      setMsg('Correct! ' + (list[S.i].why || ''), 'is-good');
      bar.classList.add('is-ok');
      shell.classList.add('cpp-done-green');
      praise(lab, all ? 'All challenges complete!' : null);
      render();
      setTimeout(function () {
        bar.classList.remove('is-ok');
        shell.classList.remove('cpp-done-green');
        S.busy = false;
        next();
      }, 2300);
    }
    function check() {
      if (S.busy) return;
      if (S.fin) { S.i = 0; S.done = []; S.fin = false; load(); return; }
      var ev = evaluate(ta.value);
      showGoals(ev, true);
      if (ev.ok) { win(); return; }
      var c = list[S.i], res = ev.res, text;
      if (res.error) text = sqlLab() ? 'error: ' + res.error + (res.hint ? '\n' + res.hint : '') : (csLab() ? 'error: ' + res.error : friendlyError(res.error));
      else if (res.stopped) text = 'The loop never ended, so the scene stopped it. Make sure something inside the loop changes so the check becomes false.';
      else if (trimOut(res.output) !== trimOut(c.expect)) text = sqlLab() ? 'Your query showed:\n' + (trimOut(res.output) || '(nothing)') + '\nIt should show:\n' + trimOut(c.expect) : 'Your program printed:\n' + (trimOut(res.output) || '(nothing)') + '\nIt should print:\n' + trimOut(c.expect);
      else text = 'Not yet: ' + ev.goals.filter(function (g) { return !g.ok; })[0].label;
      setMsg(text, 'is-bad');
      shell.classList.add('cpp-wrong-shake');
      setTimeout(function () { shell.classList.remove('cpp-wrong-shake'); }, 900);
    }
    bMain.addEventListener('click', check);
    bHint.addEventListener('click', function () {
      if (S.busy || S.fin) return;
      var c = list[S.i];
      S.hints++;
      setMsg(S.hints === 1 ? 'Hint: ' + c.hint : 'Answer:\n' + c.solution, '');
    });
    bReset.addEventListener('click', function () { if (!S.busy && !S.fin) load(); });
    bSkip.addEventListener('click', function () {
      if (S.busy || S.fin) return;
      S.done[S.i] = 'skip';
      next();
    });
    lab._diy = {
      check: check,
      auto: function () {
        clearTimeout(timer);
        if (S.busy || S.fin) return;
        timer = setTimeout(function () {
          if (S.busy || S.fin) return;
          var ev = evaluate(ta.value);
          showGoals(ev);
          if (ev.ok) win();
        }, 600);
      }
    };
    lab._practice = true;
    load();
  }

  function buildBar(lab) {
    var old = lab.querySelector('.cpp-diy-bar');
    if (old) old.remove();
    lab._diy = null;
    lab._practice = false;
    var shell = lab.querySelector('.cpp-editor-shell');
    var ta = lab.querySelector('[data-role="lab-code"]');
    if (!shell || !ta) return;
    var practiceData = lab.getAttribute('data-practice');
    if (practiceData) {
      var list = null;
      try { list = JSON.parse(practiceData); } catch (e) { list = null; }
      if (list && list.length) { buildPractice(lab, shell, ta, list); return; }
    }
    var tasks = readTasks(lab);
    var bar = document.createElement('div');
    bar.className = 'cpp-diy-bar';
    bar.innerHTML = '<div class="cpp-diy-top"><span class="cpp-diy-kicker">DO IT YOURSELF</span><span class="cpp-diy-dots"></span></div><p class="cpp-diy-task"></p><p class="cpp-diy-msg"></p><div class="cpp-diy-actions"><button type="button" class="cpp-diy-btn is-main">Check my code</button><button type="button" class="cpp-diy-btn is-hint">Hint</button><button type="button" class="cpp-diy-btn is-skip">Skip</button></div>';
    shell.parentNode.insertBefore(bar, shell);
    var q = function (s) { return bar.querySelector(s); };
    var dots = q('.cpp-diy-dots'), taskEl = q('.cpp-diy-task'), msg = q('.cpp-diy-msg');
    var bMain = q('.is-main'), bHint = q('.is-hint'), bSkip = q('.is-skip');
    if (!tasks.length) {
      taskEl.textContent = 'Free build: write any C++ you like inside main() and watch the 3D boxes build as you type. Press Run code to see the output.';
      bMain.style.display = 'none'; bHint.style.display = 'none'; bSkip.style.display = 'none';
      return;
    }
    var S = { i: 0, hints: 0, done: [], busy: false, fin: false };
    var timer = 0;

    function setMsg(t, cls) { msg.textContent = t; msg.className = 'cpp-diy-msg' + (cls ? ' ' + cls : ''); }
    function render(swap) {
      dots.innerHTML = '';
      tasks.forEach(function (t, k) {
        var d = document.createElement('span');
        d.className = S.done[k] === 'ok' ? 'is-done' : S.done[k] === 'skip' ? 'is-skip' : (k === S.i && !S.fin) ? 'is-now' : '';
        dots.appendChild(d);
      });
      if (S.fin) {
        var ok = S.done.filter(function (x) { return x === 'ok'; }).length;
        taskEl.textContent = 'All done! You solved ' + ok + ' of ' + tasks.length + ' by yourself.';
        bMain.textContent = 'Start over'; bHint.style.display = 'none'; bSkip.style.display = 'none';
        return;
      }
      bMain.textContent = 'Check my code'; bHint.style.display = ''; bSkip.style.display = '';
      taskEl.textContent = 'Task ' + (S.i + 1) + ' of ' + tasks.length + ': ' + tasks[S.i].text;
      if (swap) { bar.classList.remove('is-swap'); void bar.offsetWidth; bar.classList.add('is-swap'); }
    }
    function next() {
      S.hints = 0; S.i++;
      while (S.i < tasks.length && S.done[S.i]) S.i++;
      if (S.i >= tasks.length) S.fin = true;
      setMsg('', '');
      render(true);
    }
    function win() {
      if (S.busy) return;
      S.busy = true;
      S.done[S.i] = 'ok';
      var all = tasks.every(function (t, k) { return S.done[k]; });
      setMsg('Correct!', 'is-good');
      bar.classList.add('is-ok');
      shell.classList.add('cpp-done-green');
      praise(lab, all ? 'All challenges complete!' : null);
      render();
      setTimeout(function () {
        bar.classList.remove('is-ok');
        shell.classList.remove('cpp-done-green');
        S.busy = false;
        next();
      }, 1300);
    }
    function check() {
      if (S.busy) return;
      if (S.fin) { S.i = 0; S.done = []; S.fin = false; S.hints = 0; setMsg('', ''); setScaffold(ta); render(true); return; }
      var miss = gap(tasks[S.i], ta.value);
      if (miss === null) { win(); return; }
      setMsg(diagnose(ta.value, miss), 'is-bad');
      shell.classList.add('cpp-wrong-shake');
      setTimeout(function () { shell.classList.remove('cpp-wrong-shake'); }, 900);
    }
    bMain.addEventListener('click', check);
    bHint.addEventListener('click', function () {
      if (S.busy || S.fin) return;
      var c = tasks[S.i].code;
      S.hints++;
      setMsg(S.hints === 1 ? 'Hint, it starts like this:\n' + c.slice(0, Math.ceil(c.length / 2)) + '...' : 'Answer:\n' + c, '');
    });
    bSkip.addEventListener('click', function () {
      if (S.busy || S.fin) return;
      S.done[S.i] = 'skip';
      next();
    });
    lab._diy = {
      check: check,
      auto: function () {
        clearTimeout(timer);
        if (S.busy || S.fin) return;
        timer = setTimeout(function () {
          if (!S.busy && !S.fin && gap(tasks[S.i], ta.value) === null) win();
        }, 500);
      }
    };
    render(true);
  }

  function enter(lab) {
    buildBar(lab);
    var ta = lab.querySelector('[data-role="lab-code"]');
    if (ta && !lab._practice) setScaffold(ta);
  }
  function header(lab, mode) {
    return (lab.closest('.lado-ws') || document).querySelector('[data-role="lab-mode"][data-mode="' + mode + '"]');
  }
  function openDiy(lab) {
    var hb = header(lab, 'diy');
    if (hb) hb.click();
    else {
      lab.classList.add('is-guided-open', 'is-diy');
      var dr = lab.querySelector('[data-role="guided-drawer"]');
      if (dr) dr.setAttribute('aria-hidden', 'false');
    }
    setTimeout(function () { enter(lab); }, 0);
  }
  function sync(lab) {
    var on = lab.classList.contains('is-diy');
    var bar = lab.querySelector('.cpp-diy-bar');
    if (on && !bar) enter(lab);
    else if (!on && bar) { bar.remove(); lab._diy = null; }
  }
  function inject(lab) {
    var g = lab.querySelector('.cpp-open-guided');
    if (!g) return;
    lab.dataset.cppDiy = '1';
    var row = document.createElement('div');
    row.className = 'cpp-action-row';
    g.parentNode.insertBefore(row, g);
    row.appendChild(g);
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'cpp-open-diy';
    d.textContent = 'Do it yourself';
    row.appendChild(d);
    d.addEventListener('click', function () { openDiy(lab); });
    g.addEventListener('click', function (e) {
      if (!lab.classList.contains('is-diy')) return;
      var hb = header(lab, 'guided');
      if (hb) { e.stopPropagation(); hb.click(); }
    });
    lab.addEventListener('input', function (e) {
      if (lab._diy && e.target.matches && e.target.matches('[data-role="lab-code"]')) lab._diy.auto();
    });
    lab.addEventListener('keydown', function (e) {
      if (lab._diy && (e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); lab._diy.check(); }
    });
    new MutationObserver(function () { sync(lab); }).observe(lab, { attributes: true, attributeFilter: ['class'] });
  }
  function scan() {
    document.querySelectorAll('.cpp-lab:not([data-cpp-diy])').forEach(inject);
  }
  var qf = 0;
  new MutationObserver(function () {
    if (qf) return;
    qf = requestAnimationFrame(function () { qf = 0; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();

/* cpp-diy-indent */
(function () {
  var U = '  ';
  function ins(ta, text) {
    ta.focus();
    if (!document.execCommand('insertText', false, text)) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  function lineStart(v, i) { return v.lastIndexOf('\n', i - 1) + 1; }

  document.addEventListener('keydown', function (e) {
    var ta = e.target;
    if (!ta || ta.tagName !== 'TEXTAREA' || ta.getAttribute('data-role') !== 'lab-code') return;
    var lab = ta.closest('.cpp-lab');
    if (!lab || !lab.classList.contains('is-diy')) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    var v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      var multi = v.slice(s, en).indexOf('\n') >= 0;
      if (!e.shiftKey && !multi) { ins(ta, U); return; }
      var a = lineStart(v, s);
      var b = (en > s && v.charAt(en - 1) === '\n') ? en - 1 : en;
      var endLine = v.indexOf('\n', b);
      if (endLine < 0) endLine = v.length;
      var block = v.slice(a, endLine);
      var out = block.split('\n').map(function (l) {
        if (!e.shiftKey) return U + l;
        return l.indexOf(U) === 0 ? l.slice(2) : l.replace(/^ /, '');
      }).join('\n');
      ta.setSelectionRange(a, endLine);
      ins(ta, out);
      if (s === en) {
        var caret = Math.max(a, s - (block.length - out.length));
        ta.setSelectionRange(caret, caret);
      } else {
        ta.setSelectionRange(a, a + out.length);
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      var ls = lineStart(v, s);
      var before = v.slice(ls, s);
      var indent = before.match(/^[ \t]*/)[0];
      var open = before.replace(/\s+$/, '').slice(-1) === '{';
      var after = v.slice(en).match(/^[ \t]*(.?)/)[1];
      if (open && after === '}') {
        ins(ta, '\n' + indent + U + '\n' + indent);
        var p = s + 1 + indent.length + U.length;
        ta.setSelectionRange(p, p);
      } else {
        ins(ta, '\n' + indent + (open ? U : ''));
      }
      return;
    }

    if (e.key === '}' && s === en) {
      var bef = v.slice(lineStart(v, s), s);
      if (/^ {2,}$/.test(bef)) {
        e.preventDefault();
        e.stopPropagation();
        ta.setSelectionRange(s - 2, s);
        ins(ta, '}');
      }
    }
  }, true);
})();


/* cpp-sidebar-aria */
(function () {
  function sync(shell) {
    var tg = shell.querySelector('[data-role="toggle-sidebar"]');
    if (!tg) return;
    var c = shell.classList.contains('is-sidebar-collapsed');
    tg.setAttribute('aria-expanded', String(!c));
    tg.setAttribute('title', c ? 'Expand lessons' : 'Collapse lessons');
  }
  function watch(shell) {
    if (shell.dataset.cppSa) return;
    shell.dataset.cppSa = '1';
    new MutationObserver(function () { sync(shell); }).observe(shell, { attributes: true, attributeFilter: ['class'] });
    sync(shell);
  }
  function scan() { document.querySelectorAll('.lado-ws-shell:not([data-cpp-sa])').forEach(watch); }
  var q = 0;
  new MutationObserver(function () {
    if (q) return;
    q = requestAnimationFrame(function () { q = 0; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();

/* cpp-const-scene */
(function () {
  var TY = 'int|float|double|char|bool|string|auto|size_t|long|short|unsigned';
  var MOD = '(?:(?:unsigned|signed|long|short)\\s+)*';
  var TAIL = '\\s+([A-Za-z_]\\w*)\\s*(?:(=|\\{)\\s*([^}]*?)\\s*\\}?)?\\s*$';
  var CONST_RE = new RegExp('^(const|constexpr)\\s+(' + MOD + '(?:' + TY + '))' + TAIL);
  var VAR_RE = new RegExp('^(' + MOD + '(?:' + TY + '))' + TAIL);
  var ASSIGN_RE = /^([A-Za-z_]\w*)\s*(<<|>>|[-+*\/%&|^])?=(?!=)\s*(.*)$/;
  var INC_RE = /^(?:(\+\+|--)\s*([A-Za-z_]\w*)|([A-Za-z_]\w*)\s*(\+\+|--))$/;
  var BOXC = '<div class="cpp-box-cube"><i class="f front"><b class="cpp-box-val"></b></i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div><div class="cpp-item"><span></span></div><div class="cpp-padlock"><span class="cpp-shackle"></span><span class="cpp-lockbody"></span></div></div><div class="cpp-box-label"></div><div class="cpp-crate-try"><span></span></div><div class="cpp-crate-err"></div>';

  function parse(src) {
    src = window.__ladoCsSrc(src);
    var code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/^\s*#.*$/gm, '');
    var mi = code.search(/\bmain\s*\([^)]*\)\s*\{/);
    if (mi >= 0) code = code.slice(mi).replace(/^[^{]*\{/, '');
    var pieces = [], flags = [];
    code.split('\n').forEach(function (ln) {
      var segs = ln.split(';');
      segs.forEach(function (sg, si) { pieces.push(sg); flags.push(si < segs.length - 1); });
    });
    var out = { items: [], hits: Object.create(null), total: 0 };
    var by = Object.create(null);
    var k, p, m, closed, n;

    function push(isConst, kind, type, name, op, val, isClosed) {
      var v = (val || '').trim();
      var st = op === undefined ? 'declared' : (isClosed ? 'done' : (v === '' ? 'assigning' : 'filling'));
      var it = { isConst: isConst, kind: kind, type: type, name: name, value: op === undefined ? '' : v, state: st };
      out.items.push(it);
      by[name] = it;
    }
    function touch(name, text, simple, rhs) {
      var o = by[name];
      if (!o) return;
      if (o.isConst) {
        if (out.hits[name] === undefined) out.hits[name] = [];
        out.hits[name].push(text);
        out.total++;
      } else if (simple) {
        o.value = rhs.trim();
        o.state = 'done';
      }
    }

    for (k = 0; k < pieces.length; k++) {
      closed = flags[k];
      p = pieces[k].replace(/\s+/g, ' ').replace(/^[{}\s]+/, '').trim();
      if (p === '') continue;
      m = CONST_RE.exec(p);
      if (m) { push(true, m[1], m[2], m[3], m[4], m[5], closed); continue; }
      m = VAR_RE.exec(p);
      if (m) { push(false, '', m[1], m[2], m[3], m[4], closed); continue; }
      if (!closed) continue;
      m = INC_RE.exec(p);
      if (m) { n = m[2] || m[3]; touch(n, p + ';', false, ''); continue; }
      m = ASSIGN_RE.exec(p);
      if (m) touch(m[1], p + ';', !m[2], m[3]);
    }
    return out;
  }

  function hit(slot, name, text) {
    slot.querySelector('.cpp-crate-try span').textContent = text;
    slot.querySelector('.cpp-crate-err').textContent = "Error: you can't change " + name + ". It is a const.";
    slot.classList.remove('is-hit');
    void slot.offsetWidth;
    slot.classList.add('is-hit', 'has-err');
    var lq = slot.closest('.cpp-lab'); var sq = lq && lq.querySelector('.cpp-editor-shell'); if (sq) sq.classList.remove('cpp-const-quiet');
    clearTimeout(slot._t);
    slot._t = setTimeout(function () { slot.classList.remove('is-hit'); }, 1200);
  }

  function update(stage, ta) {
    var model = parse(ta.value);
    var hasConst = model.items.some(function (i) { return i.isConst; });
    var sc = stage.querySelector('.cpp-const-scene');
    var status = stage.querySelector('.cpp-visual-status');
    if (!hasConst) {
      if (sc) sc.remove();
      var sh0 = ta.closest('.cpp-editor-shell'); if (sh0) sh0.classList.remove('cpp-const-err');
      stage.classList.remove('has-const');
      stage._ca = {};
      return;
    }
    if (sc === null) {
      sc = document.createElement('div');
      sc.className = 'cpp-const-scene';
      stage.appendChild(sc);
      stage._ca = {};
    }
    stage.classList.add('has-const');

    var slots = sc.querySelectorAll('.cpp-box-slot');
    model.items.forEach(function (it, i) {
      if (slots[i] !== undefined) return;
      var s = document.createElement('div');
      s.className = 'cpp-box-slot is-new';
      s.innerHTML = BOXC;
      s._fresh = true;
      sc.appendChild(s);
      (function (el) { setTimeout(function () { el.classList.remove('is-new'); el._fresh = false; }, 900); })(s);
    });
    slots = sc.querySelectorAll('.cpp-box-slot');
    for (var j = slots.length - 1; j >= model.items.length; j--) slots[j].remove();
    slots = sc.querySelectorAll('.cpp-box-slot');

    var now = Date.now();
    var active = -1;
    var effs = model.items.map(function (it, i) {
      var s = slots[i], eff = it.state, wait;
      if (it.state === 'filling' || it.state === 'assigning') {
        s._saw = true;
      } else if (it.state === 'done' && it.value !== '') {
        if (!s._saw && s._played !== it.value) {
          s._played = it.value;
          s._until = now + (s._fresh ? 1500 : 1100);
          wait = s._until - now + 60;
          setTimeout(function () { stage._csv = null; }, wait);
        } else if (s._saw) {
          s._played = it.value;
        }
        s._saw = false;
      }
      if (s._until && now < s._until) eff = 'filling';
      if (eff !== 'done') active = i;
      return eff;
    });
    sc.classList.toggle('has-active', active >= 0);

    model.items.forEach(function (it, i) {
      var s = slots[i], eff = effs[i];
      s.style.setProperty('--c', it.isConst ? (it.kind === 'constexpr' ? '#7cf0c4' : '#5fb0ff') : '#cfd8ff');
      s.querySelector('.cpp-box-label').textContent = (it.isConst ? it.kind + ' ' : '') + it.type + ' ' + it.name;
      s.classList.remove('s-declared', 's-assigning', 's-filling', 's-done');
      s.classList.add('s-' + eff);
      s.classList.toggle('is-open', eff === 'assigning' || eff === 'filling');
      s.classList.toggle('is-active', i === active);
      s.classList.toggle('is-const', it.isConst);
      s.classList.toggle('is-cx', it.kind === 'constexpr');
      if (it.value) {
        s.querySelector('.cpp-item span').textContent = it.value;
        s.querySelector('.cpp-box-val').textContent = it.value;
      }
      if (it.isConst) {
        var list = model.hits[it.name] || [];
        var prev = stage._ca[it.name] || 0;
        if (list.length > prev) hit(s, it.name, list[list.length - 1]);
        if (list.length === 0) s.classList.remove('has-err', 'is-hit');
        stage._ca[it.name] = list.length;
      }
    });

    var sh1 = ta.closest('.cpp-editor-shell'); if (sh1) sh1.classList.toggle('cpp-const-err', model.total > 0);
    if (status) {
      status.textContent = model.total > 0
        ? 'Change blocked. The crate is locked'
        : model.items.length + (model.items.length === 1 ? ' variable' : ' variables');
    }
  }

  setInterval(function () {
    var stage = document.querySelector('.cpp-visual-stage');
    if (stage === null) return;
    var scope = stage.closest('.cpp-lab') || document;
    var ta = scope.querySelector('[data-role="lab-code"]');
    if (ta === null) return;
    if (stage._csv === ta.value) return;
    stage._csv = ta.value;
    try { update(stage, ta); } catch (err) { }
  }, 250);
})();

/* cpp-const-hl */
(function () {
  var RE = /\b(constexpr|const)\b/;
  function handle(t) {
    var m = RE.exec(t.nodeValue);
    if (!m) return;
    var par = t.parentNode;
    if (par && par.classList && par.classList.contains('cpp-const-hl')) return;
    var mid = t.splitText(m.index);
    var rest = mid.splitText(m[0].length);
    var sp = document.createElement('span');
    sp.className = 'cpp-const-hl';
    mid.parentNode.replaceChild(sp, mid);
    sp.appendChild(mid);
    handle(rest);
  }
  function wrap(pre) {
    var w = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(handle);
  }
  function clear(pre) {
    pre.querySelectorAll('.cpp-const-hl').forEach(function (sp) {
      var p = sp.parentNode;
      while (sp.firstChild) p.insertBefore(sp.firstChild, sp);
      p.removeChild(sp);
      p.normalize();
    });
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('cpp-live-editor')) return;
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    var sh = t.closest('.cpp-editor-shell');
    if (sh) sh.classList.add('cpp-const-quiet');
  }, true);
  setInterval(function () {
    document.querySelectorAll('.cpp-editor-shell').forEach(function (sh) {
      var pre = sh.querySelector('.cpp-hl:not(.cpp-hl-ghost)');
      if (!pre) return;
      try {
        var ae = sh.classList.contains('cpp-auto-err'); if ((sh.classList.contains('cpp-const-err') || ae) && !sh.classList.contains('cpp-const-quiet')) { RE = ae ? /\bauto\b/ : /\b(constexpr|const)\b/; wrap(pre); }
        else if (pre.querySelector('.cpp-const-hl')) clear(pre);
      } catch (err) { }
    });
  }, 120);
})();

/* cpp-auto-scene */
(function () {
  var TY = 'int|float|double|char|bool|string|size_t|long|short|unsigned';
  var AUTO_RE = /^auto\s+([A-Za-z_]\w*)\s*(?:(=|\{)\s*([^}]*?)\s*\}?)?\s*$/;
  var VAR_RE = new RegExp('^((?:(?:unsigned|signed|long|short)\\s+)*(?:' + TY + '))\\s+([A-Za-z_]\\w*)\\s*(?:(=|\\{)\\s*([^}]*?)\\s*\\}?)?\\s*$');
  var COLS = { 'int': '#5fb0ff', 'double': '#ffb454', 'char': '#c58bff', 'bool': '#5eeaa0', 'float': '#ffd84d', 'long': '#4fd8e8', 'const char*': '#ff8fab' };
  var HEADS = ['int', 'double', 'char', 'bool', 'float'];
  var BOXA = '<div class="cpp-box-cube"><i class="f front"><b class="cpp-box-val"></b></i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div><div class="cpp-item"><span></span></div></div><div class="cpp-box-label"></div><div class="cpp-scanner"><i class="cpp-beam"></i></div><div class="cpp-scan-tag"></div><div class="cpp-crate-err"></div>';
  var TABLE = HEADS.map(function (t) {
    return '<div class="cpp-tcol" data-type="' + t + '" style="--tc:' + COLS[t] + '"><div class="cpp-thead">' + t + '</div><div class="cpp-tcell" data-type="' + t + '"><div class="cpp-tcell-in"></div></div></div>';
  }).join('');

  function deduce(v, types) {
    v = v.trim();
    if (/^'(?:\\.|[^'\\])'$/.test(v)) return { type: 'char', why: 'single quotes → char' };
    if (/^"[\s\S]*"$/.test(v)) return { type: 'const char*', why: 'text in quotes → const char*' };
    if (v === 'true' || v === 'false') return { type: 'bool', why: 'true or false → bool' };
    if (/^[-+]?(\d+\.\d*|\.\d+)[fF]$/.test(v)) return { type: 'float', why: 'decimal + f → float' };
    if (/^[-+]?(\d+\.\d*|\.\d+)$/.test(v)) return { type: 'double', why: 'decimal point → double' };
    if (/^[-+]?\d+[lL]$/.test(v)) return { type: 'long', why: 'whole number + L → long' };
    if (/^[-+]?\d+$/.test(v)) return { type: 'int', why: 'whole number → int' };
    if (/^[A-Za-z_]\w*$/.test(v) && types[v]) return { type: types[v], why: 'copies ' + v + ' → ' + types[v] };
    return { type: '?', why: "can't tell the type" };
  }

  function parse(src) {
    src = window.__ladoCsSrc(src);
    var code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/^\s*#.*$/gm, '');
    var mi = code.search(/\bmain\s*\([^)]*\)\s*\{/);
    if (mi >= 0) code = code.slice(mi).replace(/^[^{]*\{/, '');
    var items = [];
    code.split('\n').forEach(function (ln) {
      var segs = ln.split(';');
      segs.forEach(function (sg, si) {
        var closed = si < segs.length - 1;
        var p = sg.replace(/\s+/g, ' ').replace(/^[{}\s]+/, '').trim();
        if (p === '') return;
        var m = AUTO_RE.exec(p), v, st;
        if (m) {
          v = (m[3] || '').trim();
          if (closed) st = (m[2] && v !== '') ? 'done' : 'nothing';
          else st = !m[2] ? 'declared' : (v === '' ? 'assigning' : 'filling');
          items.push({ auto: true, type: '', name: m[1], value: v, state: st });
          return;
        }
        m = VAR_RE.exec(p);
        if (m) {
          v = (m[4] || '').trim();
          if (closed) st = m[3] ? 'done' : 'declared';
          else st = !m[3] ? 'declared' : (v === '' ? 'assigning' : 'filling');
          items.push({ auto: false, type: m[1], name: m[2], value: v, state: st });
        }
      });
    });
    return items;
  }

  function hot(stage, type, on) {
    var col = stage.querySelector('.cpp-tcol[data-type="' + type + '"]');
    if (col) col.classList.toggle('is-hot', on);
  }

  function goHome(stage, s, type) {
    if (!s.isConnected || s._home === type) return;
    var cell = stage.querySelector('.cpp-tcell[data-type="' + type + '"] .cpp-tcell-in');
    if (!cell) return;
    var r0 = s.getBoundingClientRect();
    cell.appendChild(s);
    s.classList.add('is-homed');
    s.classList.remove('is-stamped');
    var r1 = s.getBoundingClientRect();
    var dx = (r0.left + r0.width / 2) - (r1.left + r1.width / 2);
    var dy = (r0.top + r0.height / 2) - (r1.top + r1.height / 2);
    var k = r1.width > 0 ? r0.width / r1.width : 1;
    s.style.zIndex = '9';
    s.style.transition = 'none';
    s.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')';
    void s.offsetWidth;
    s.style.transition = 'transform .95s cubic-bezier(.22, 1, .36, 1)';
    s.style.transform = '';
    setTimeout(function () { s.style.transition = ''; s.style.zIndex = ''; }, 1000);
    setTimeout(function () { hot(stage, type, false); }, 1500);
    s._home = type;
    stage._asv = null;
  }

  function unHome(stage, s) {
    var pool = stage.querySelector('.cpp-auto-pool');
    if (pool && s.isConnected) pool.appendChild(s);
    s._home = null;
    s.classList.remove('is-homed');
    s.style.transition = ''; s.style.transform = ''; s.style.zIndex = '';
  }

  function update(stage, ta) {
    var items = parse(ta.value);
    var sh = ta.closest('.cpp-editor-shell');
    var sc = stage.querySelector('.cpp-auto-scene');
    var status = stage.querySelector('.cpp-visual-status');
    var hasAuto = items.some(function (i) { return i.auto; });
    if (!hasAuto) {
      if (sc) sc.remove();
      stage.classList.remove('has-auto');
      if (sh) sh.classList.remove('cpp-auto-err');
      stage._abad = false;
      stage._as = [];
      return;
    }
    if (sc === null) {
      sc = document.createElement('div');
      sc.className = 'cpp-auto-scene';
      sc.innerHTML = '<div class="cpp-type-table">' + TABLE + '</div><div class="cpp-auto-pool"></div>';
      stage.appendChild(sc);
      stage._as = [];
    }
    stage.classList.add('has-auto');
    var pool = sc.querySelector('.cpp-auto-pool');
    var arr = stage._as;

    items.forEach(function (it, i) {
      if (arr[i] !== undefined) return;
      var s = document.createElement('div');
      s.className = 'cpp-box-slot is-new';
      s.innerHTML = BOXA;
      pool.appendChild(s);
      arr[i] = s;
      (function (el) { setTimeout(function () { el.classList.remove('is-new'); }, 900); })(s);
    });
    while (arr.length > items.length) arr.pop().remove();

    var now = Date.now(), types = Object.create(null), active = -1, anyBad = false, anyScan = false;
    items.forEach(function (it, i) {
      var s = arr[i], eff = it.state, scanning = false, stamped = false, bad = false, d = null, label, col = '#cfd8ff', front = '';
      if (it.auto) {
        label = 'auto ' + it.name;
        if (it.state === 'nothing') {
          bad = true; eff = 'declared'; s._played = null; s._until = 0;
        } else if (it.state === 'done') {
          d = deduce(it.value, types);
          var key = it.value + '|' + d.type;
          if (s._played !== key) {
            s._played = key;
            s._until = now + 1500;
            setTimeout(function () { stage._asv = null; }, 1560);
            (function (el, ty) {
              setTimeout(function () { if (el._want === ty) hot(stage, ty, true); }, 900);
              setTimeout(function () { if (el._want === ty) goHome(stage, el, ty); }, 2500);
            })(s, d.type);
          }
          if (now < s._until) { eff = 'filling'; scanning = true; }
          else { stamped = true; eff = 'done'; }
          types[it.name] = d.type === '?' ? null : d.type;
        } else {
          s._played = null; s._until = 0;
        }
        if (stamped && d.type !== '?') { label = d.type + ' ' + it.name; col = COLS[d.type] || col; }
        front = stamped ? it.value : '?';
      } else {
        label = it.type + ' ' + it.name;
        col = COLS[it.type] || col;
        front = it.value;
        types[it.name] = it.type;
      }
      s._want = (it.auto && d && d.type !== '?' && (scanning || stamped)) ? d.type : null;
      if (s._home && !stamped) unHome(stage, s);

      var showScan = scanning || bad;
      if (showScan && !s._so) { s.classList.remove('is-scan'); void s.offsetWidth; s.classList.add('is-scan'); }
      else if (!showScan) s.classList.remove('is-scan');
      s._so = showScan;
      s.classList.toggle('is-bad', bad);
      s.classList.toggle('has-err', bad);
      s.classList.toggle('is-stamped', stamped && !s._home);
      s.classList.toggle('is-unknown', it.auto && !stamped);
      s.style.setProperty('--c', col);
      s.querySelector('.cpp-box-label').textContent = label;
      s.classList.remove('s-declared', 's-assigning', 's-filling', 's-done');
      s.classList.add('s-' + eff);
      s.classList.toggle('is-open', eff === 'assigning' || eff === 'filling');
      if (eff !== 'done') active = i;
      if (bad) anyBad = true;
      if (scanning) anyScan = true;
      s.querySelector('.cpp-scan-tag').textContent = d ? d.why : '';
      s.querySelector('.cpp-crate-err').textContent = bad ? 'Error: auto needs a value to look at.' : '';
      s.querySelector('.cpp-box-val').textContent = front;
      if (it.value) s.querySelector('.cpp-item span').textContent = it.value;
    });
    items.forEach(function (it, i) { arr[i].classList.toggle('is-active', i === active); });
    sc.classList.toggle('has-active', active >= 0);
    sc.querySelectorAll('.cpp-tcell').forEach(function (c) {
      c.classList.toggle('has-box', c.querySelector('.cpp-box-slot') !== null);
    });

    if (sh) {
      sh.classList.toggle('cpp-auto-err', anyBad);
      if (anyBad && !stage._abad) sh.classList.remove('cpp-const-quiet');
    }
    stage._abad = anyBad;
    if (status) {
      status.textContent = anyBad ? 'Nothing to scan. auto needs a value'
        : anyScan ? 'Scanner is reading the value'
        : items.length + (items.length === 1 ? ' variable' : ' variables');
    }
  }

  setInterval(function () {
    var stage = document.querySelector('.cpp-visual-stage');
    if (stage === null) return;
    var scope = stage.closest('.cpp-lab') || document;
    var ta = scope.querySelector('[data-role="lab-code"]');
    if (ta === null) return;
    if (stage._asv === ta.value) return;
    stage._asv = ta.value;
    try { update(stage, ta); } catch (err) { }
  }, 250);
})();

/* cpp-cast-scene */
(function () {
  var RANK = { bool: 0, char: 1, short: 2, int: 3, long: 4, float: 5, double: 6 };
  var COL = { bool: '#5eeaa0', char: '#c58bff', short: '#4fd8e8', int: '#5fb0ff', long: '#4fd8e8', float: '#ffd84d', double: '#ffb454' };
  var TYS = 'int|short|long|char|bool|float|double';
  var DECL = new RegExp('^(?:const\\s+)?(' + TYS + ')\\s+([A-Za-z_]\\w*)\\s*(?:=|\\{)\\s*([^}]+?)\\s*\\}?$');
  var CAST = new RegExp('^static_cast<\\s*(' + TYS + ')\\s*>\\s*\\(([\\s\\S]+)\\)$');
  var BIN = /^(.+?)\s*([\/*+\-])\s*([^\/*+\-]+)$/;
  function isF(t) { return t === 'float' || t === 'double'; }
  function isI(t) { return !isF(t); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function cast(n, t) {
    if (t === 'bool') return n ? 1 : 0;
    if (t === 'float') return Math.fround(n);
    if (t === 'double') return n;
    return Math.trunc(n);
  }
  function fmt(n, t) {
    if (t === 'char') return "'" + String.fromCharCode(n) + "'";
    if (t === 'bool') return n ? 'true' : 'false';
    if (isF(t)) return Number.isInteger(n) ? n.toFixed(1) : String(+n.toPrecision(7));
    return String(n);
  }
  function atom(s, by) {
    var m, a;
    s = s.trim();
    if ((m = CAST.exec(s))) {
      a = atom(m[2], by);
      return a ? { t: m[1], n: cast(a.n, m[1]), cast: true, from: a.t, raw: a.n } : null;
    }
    if ((m = /^([-+]?(?:\d+\.\d*|\.\d+))([fF]?)$/.exec(s))) return { t: m[2] ? 'float' : 'double', n: parseFloat(m[1]) };
    if (/^[-+]?\d+$/.test(s)) return { t: 'int', n: parseInt(s, 10) };
    if ((m = /^'(.)'$/.exec(s))) return { t: 'char', n: m[1].charCodeAt(0) };
    if (/^[A-Za-z_]\w*$/.test(s) && by[s] && by[s].n !== null) return { t: by[s].t, n: by[s].n };
    return null;
  }
  function expr(s, by) {
    var a = atom(s, by), m, l, r, ints, t, n;
    if (a) return a;
    m = BIN.exec(s.trim());
    if (!m) return null;
    l = atom(m[1], by); r = atom(m[3], by);
    if (!l || !r) return null;
    ints = isI(l.t) && isI(r.t);
    t = ints ? 'int' : (l.t === 'double' || r.t === 'double' ? 'double' : 'float');
    n = m[2] === '+' ? l.n + r.n : m[2] === '-' ? l.n - r.n : m[2] === '*' ? l.n * r.n : l.n / r.n;
    if (ints) n = Math.trunc(n);
    if (!isFinite(n)) return null;
    return { t: t, n: n, cast: !!(l.cast || r.cast), intDiv: ints && m[2] === '/' };
  }
  function crate(t, val, label, cls) {
    var w = 36 + RANK[t] * 7;
    return '<div class="cpp-fn-crate ' + cls + '" style="--c:' + COL[t] + ';--w:' + w + 'px"><b>' + esc(label) + '</b><span>' + esc(val) + '</span></div>';
  }
  function lane(T, name, e) {
    var S = e.from || e.t, sv = e.from ? e.raw : e.n, fv = cast(e.n, T);
    var narrow = RANK[T] < RANK[S], widen = RANK[T] > RANK[S], lost = '', tag;
    if (!narrow && !widen && !e.cast && !e.intDiv) return null;
    if (isI(T) && isF(S) && sv !== Math.trunc(sv)) lost = String(+Math.abs(sv - Math.trunc(sv)).toFixed(6)).replace(/^0/, '');
    else if (T === 'float' && S === 'double' && Math.fround(sv) !== sv) lost = 'precision';
    if (e.intDiv) tag = widen ? 'int / int already dropped the decimals, so widening comes too late' : 'int / int drops the decimals';
    else if (narrow) tag = e.from ? 'static_cast: you chose to squeeze it' : 'Implicit narrowing: data is lost';
    else if (widen) tag = 'Widening: smooth, nothing lost';
    else tag = e.from ? 'static_cast: same size, nothing changes' : 'Cast first, then divide: decimals kept';
    return '<div class="cpp-fn-lane ' + (narrow ? 'is-narrow' : widen ? 'is-widen' : 'is-same') + (narrow || e.intDiv ? ' is-bad' : '') + '">'
      + crate(S, fmt(sv, S), S, 'from')
      + '<div class="cpp-fn-funnel"><u class="cpp-fn-shape"></u><i class="cpp-fn-chip">' + esc(fmt(sv, S)) + '</i>' + (lost ? '<i class="cpp-fn-lost">lost ' + esc(lost) + '</i>' : '') + '</div>'
      + crate(T, fmt(fv, T), T + ' ' + name, 'to')
      + '<div class="cpp-fn-tag">' + esc(tag) + '</div></div>';
  }
  function parse(src) {
    src = window.__ladoCsSrc(src);
    var code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/^\s*#.*$/gm, '');
    var mi = code.search(/\bmain\s*\([^)]*\)\s*\{/);
    if (mi >= 0) code = code.slice(mi).replace(/^[^{]*\{/, '');
    var by = Object.create(null), out = [], parts = code.split(';');
    parts.pop();
    parts.forEach(function (raw) {
      var p = raw.replace(/\s+/g, ' ').replace(/^[{}\s]+/, '').trim();
      var m = DECL.exec(p), e, l;
      if (!m) return;
      e = expr(m[3], by);
      if (!e) { by[m[2]] = { t: m[1], n: null }; return; }
      by[m[2]] = { t: m[1], n: cast(e.n, m[1]) };
      l = lane(m[1], m[2], e);
      if (l) out.push(l);
    });
    return out;
  }
  function update(stage, lab, ta) {
    var h = window.__ladoVH(lab);
    var lanes = (h && /Type Conversion/.test(h.textContent)) ? parse(ta.value) : [];
    var sc = stage.querySelector('.cpp-fn-scene');
    var status = stage.querySelector('.cpp-visual-status');
    if (!lanes.length) { if (sc) sc.remove(); stage.classList.remove('has-fn'); return; }
    if (!sc) { sc = document.createElement('div'); sc.className = 'cpp-fn-scene'; stage.appendChild(sc); }
    stage.classList.add('has-fn');
    lanes.forEach(function (html, i) {
      var kid = sc.children[i];
      if (kid && kid._h === html) return;
      var d = document.createElement('div');
      d.innerHTML = html;
      var el = d.firstChild;
      el._h = html;
      if (kid) sc.replaceChild(el, kid); else sc.appendChild(el);
    });
    while (sc.children.length > lanes.length) sc.lastChild.remove();
    if (status) status.textContent = lanes.length + (lanes.length === 1 ? ' conversion' : ' conversions');
  }
  setInterval(function () {
    var stage = document.querySelector('.cpp-visual-stage');
    if (stage === null) return;
    var lab = stage.closest('.cpp-lab');
    var ta = lab && lab.querySelector('[data-role="lab-code"]');
    if (!ta || stage._fnv === ta.value) return;
    stage._fnv = ta.value;
    try { update(stage, lab, ta); } catch (err) { }
  }, 250);
})();

/* cpp-scope-scene */
(function () {
  var TY = 'int|short|long|char|bool|float|double|string|auto';
  var COL = { int: '#5fb0ff', short: '#4fd8e8', long: '#4fd8e8', char: '#c58bff', bool: '#5eeaa0', float: '#ffd84d', double: '#ffb454', string: '#ff8fab', auto: '#cfd8ff' };
  var TYPE = new RegExp('^(?:const\\s+)?(?:unsigned\\s+)?(' + TY + ')\\s+([\\s\\S]+)$');
  var BRACEINIT = new RegExp('^\\s*(?:const\\s+)?(?:unsigned\\s+)?(?:' + TY + ')\\s+[A-Za-z_]\\w*\\s*$');
  var SKIP = /^(?:cout|cin|cerr|endl|std|return|true|false|static_cast|nullptr|sizeof|main|int|short|long|char|bool|float|double|string|auto|const|unsigned|using|namespace)$/;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function parse(src) {
    src = window.__ladoCsSrc(src);
    var code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/^\s*#.*$/gm, '');
    var mi = code.search(/\bmain\s*\([^)]*\)\s*\{/);
    if (mi >= 0) code = code.slice(mi).replace(/^[^{]*\{/, '');
    var scopes = [{ p: -1, vars: [], closed: false, errs: [] }], stack = [0], ever = Object.create(null), cur = '', i, c, j;

    function find(name) {
      for (var k = stack.length - 1; k >= 0; k--) {
        var vs = scopes[stack[k]].vars;
        for (var q = vs.length - 1; q >= 0; q--) if (vs[q].name === name) return vs[q];
      }
      return null;
    }
    function stmt(s) {
      s = s.replace(/\s+/g, ' ').trim();
      if (!s || /^return\b/.test(s)) return;
      var hi = stack[stack.length - 1], here = scopes[hi], tm = TYPE.exec(s), decls = null, exprs = s, parts;
      if (tm) {
        parts = tm[2].split(',');
        decls = [];
        parts.forEach(function (p) {
          var d = /^\s*[*&]?([A-Za-z_]\w*)\s*(?:=\s*([\s\S]*?))?\s*$/.exec(p);
          if (d) decls.push({ name: d[1], val: d[2] || '' });
        });
        if (decls.length !== parts.length) decls = null;
        else exprs = decls.map(function (d) { return d.val; }).join(' ');
      }
      (exprs.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '').match(/[A-Za-z_]\w*/g) || []).forEach(function (id) {
        if (SKIP.test(id) || find(id) || !ever[id]) return;
        if (here.errs.indexOf(id) < 0) here.errs.push(id);
      });
      if (decls) decls.forEach(function (d) {
        var prev = find(d.name);
        if (prev && prev.sc !== hi) prev.by = hi;
        here.vars.push({ name: d.name, type: tm[1], val: d.val.trim(), sc: hi });
        ever[d.name] = true;
      });
    }

    for (i = 0; i < code.length; i++) {
      c = code.charAt(i);
      if (c === ';') { stmt(cur); cur = ''; }
      else if (c === '{') {
        if (BRACEINIT.test(cur)) {
          j = code.indexOf('}', i);
          if (j < 0) break;
          cur += '=' + code.slice(i + 1, j);
          i = j;
          continue;
        }
        cur = '';
        scopes.push({ p: stack[stack.length - 1], vars: [], closed: false, errs: [] });
        stack.push(scopes.length - 1);
      } else if (c === '}') {
        cur = '';
        if (stack.length > 1) scopes[stack.pop()].closed = true;
      } else cur += c;
    }
    return scopes;
  }

  function render(scopes, seen, closedSeen, ids, cids) {
    function room(i) {
      var s = scopes[i], id = 'r' + i, h;
      ids[id] = 1;
      if (s.closed) cids[id] = 1;
      h = '<div class="cpp-sc-room' + (i === 0 ? ' is-main' : '') + (s.closed ? ' is-closed' : ' is-open') + (!seen[id] ? ' is-new' : '') + (s.closed && !closedSeen[id] ? ' is-poof' : '') + '">'
        + '<div class="cpp-sc-head"><span>' + (i === 0 ? 'main() warehouse' : 'Room { }') + '</span><em>' + (s.closed ? 'door closed: variables destroyed' : 'door open') + '</em></div><div class="cpp-sc-vars">';
      s.vars.forEach(function (v, j) {
        var vid = 'v' + i + '_' + j, hidden = v.by !== undefined && !scopes[v.by].closed;
        ids[vid] = 1;
        h += '<div class="cpp-sc-var' + (s.closed ? ' is-gone' : '') + (hidden ? ' is-hidden' : '') + (!seen[vid] ? ' is-new' : '') + '" style="--c:' + (COL[v.type] || '#cfd8ff') + '"><b>' + esc(v.type + ' ' + v.name) + '</b><span>' + esc(v.val || '?') + '</span>' + (hidden ? '<u>hidden by the inner ' + esc(v.name) + '</u>' : '') + '</div>';
      });
      h += '</div>';
      scopes.forEach(function (ch, k) { if (ch.p === i) h += room(k); });
      s.errs.forEach(function (n) { h += '<div class="cpp-sc-err">Error: \'' + esc(n) + '\' was not declared in this scope</div>'; });
      return h + '</div>';
    }
    return room(0);
  }

  function update(stage, lab, ta) {
    var h = window.__ladoVH(lab);
    var scopes = (h && /Scope and Lifetime/.test(h.textContent)) ? parse(ta.value) : null;
    var sc = stage.querySelector('.cpp-sc-scene');
    var status = stage.querySelector('.cpp-visual-status');
    var errs = scopes ? scopes.reduce(function (n, s) { return n + s.errs.length; }, 0) : 0;
    if (!scopes || (scopes.length < 2 && !errs)) {
      if (sc) sc.remove();
      stage.classList.remove('has-scope');
      return;
    }
    if (!sc) {
      sc = document.createElement('div');
      sc.className = 'cpp-sc-scene';
      stage.appendChild(sc);
      stage._scS = {}; stage._scC = {};
    }
    stage.classList.add('has-scope');
    var ids = {}, cids = {};
    sc.innerHTML = render(scopes, stage._scS, stage._scC, ids, cids);
    stage._scS = ids; stage._scC = cids;
    if (status) status.textContent = (scopes.length - 1) + (scopes.length === 2 ? ' room' : ' rooms') + ' inside main' + (errs ? ', name error' : '');
  }

  setInterval(function () {
    var stage = document.querySelector('.cpp-visual-stage');
    if (stage === null) return;
    var lab = stage.closest('.cpp-lab');
    var ta = lab && lab.querySelector('[data-role="lab-code"]');
    if (!ta || stage._scv === ta.value) return;
    stage._scv = ta.value;
    try { update(stage, lab, ta); } catch (err) { }
  }, 250);
})();


/* cpp-arith-scene */
(function () {
  var TY = 'int|short|long|float|double';
  var DECL = new RegExp('^(?:const\\s+)?(' + TY + ')\\s+([A-Za-z_]\\w*)\\s*(?:=|\\{)\\s*([^}]+?)\\s*\\}?$');
  var ASSIGN = /^([A-Za-z_]\w*)\s*=(?!=)\s*(.+)$/;
  var BIN = /^(.+?)\s*([\/*+\-%])\s*([^\/*+\-%]+)$/;
  var SYM = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7', '%': '%' };
  var COL = { int: '#5fb0ff', short: '#4fd8e8', long: '#4fd8e8', float: '#ffd84d', double: '#ffb454' };
  function isF(t) { return t === 'float' || t === 'double'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(n, t) {
    if (n === Infinity) return 'inf';
    if (n === -Infinity) return '-inf';
    if (n !== n) return 'nan';
    if (isF(t)) return Number.isInteger(n) ? n.toFixed(1) : String(+n.toPrecision(7));
    return String(n);
  }
  function conv(n, t) {
    if (!isFinite(n)) return n;
    return t === 'float' ? Math.fround(n) : t === 'double' ? n : Math.trunc(n);
  }
  function atom(s, by) {
    var m;
    s = s.trim();
    if ((m = /^([-+]?(?:\d+\.\d*|\.\d+))([fF]?)$/.exec(s))) return { t: m[2] ? 'float' : 'double', n: parseFloat(m[1]) };
    if (/^[-+]?\d+$/.test(s)) return { t: 'int', n: parseInt(s, 10) };
    if (/^[A-Za-z_]\w*$/.test(s) && by[s] && by[s].n !== null) return { t: by[s].t, n: by[s].n, name: s };
    return null;
  }
  function calc(l, o, r) {
    var ints = !isF(l.t) && !isF(r.t);
    var res = { ints: ints, t: ints ? 'int' : (l.t === 'double' || r.t === 'double' ? 'double' : 'float'), jam: false, bad: false };
    if (o === '%') {
      if (!ints) { res.bad = true; return res; }
      if (r.n === 0) { res.jam = true; return res; }
      res.n = l.n % r.n;
      return res;
    }
    if (o === '/') {
      res.dec = r.n === 0 ? (l.n === 0 ? NaN : (l.n > 0 ? Infinity : -Infinity)) : l.n / r.n;
      if (ints) {
        if (r.n === 0) { res.jam = true; return res; }
        res.n = Math.trunc(l.n / r.n);
      } else res.n = res.dec;
      return res;
    }
    res.n = o === '+' ? l.n + r.n : o === '-' ? l.n - r.n : l.n * r.n;
    return res;
  }
  function boxHtml(cls, left, color, label, val) {
    return '<div class="cpp-ar-box ' + cls + '" style="left:' + left + ';--c:' + color + '"><div class="cpp-box-cube"><i class="f front"><b class="cpp-box-val">' + (val === null ? '' : esc(val)) + '</b></i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div></div><div class="cpp-ar-name">' + esc(label) + '</div></div>';
  }
  function chip(cls, style, label, val) {
    return '<i class="cpp-ar-chip ' + cls + '"' + (style ? ' style="' + style + '"' : '') + '>' + (label ? '<small>' + label + '</small>' : '') + esc(val) + '</i>';
  }
  function lane(T, name, l, o, r) {
    var c = calc(l, o, r), bad = c.jam || c.bad, fin = null, tag = '', tagAt = '4.7s', res = '';
    var lval = fmt(l.n, l.t), rval = fmt(r.n, r.t), iv, dv;
    if (c.jam) { tag = 'Error: divide by zero. The operation jammed'; tagAt = '2.7s'; }
    else if (c.bad) { tag = 'Error: % only works on whole numbers'; tagAt = '2.7s'; }
    else {
      fin = conv(c.n, T);
      if (o === '/') {
        iv = fmt(Math.trunc(l.n / r.n), 'int');
        dv = fmt(c.dec, 'double');
        res = chip('r is-int ' + (c.ints ? 'is-used' : 'is-dim'), '--x0:calc(29% - 46px)', 'Integer', iv)
          + chip('r is-dec ' + (c.ints ? 'is-dim' : 'is-used'), '--x0:calc(29% + 46px)', 'Decimal', dv);
        tag = c.ints
          ? (isF(T) ? 'Whole numbers in: integer division ran first, then it was stored as ' + fmt(fin, T) : 'Whole numbers in, whole number out: the decimals are dropped')
          : 'A decimal is involved, so the decimals are kept';
        tagAt = '3.4s';
      } else {
        res = chip('r is-used', '--x0:29%', '', fmt(fin, T));
        if (o === '%') tag = 'The remainder is what is left over after dividing';
      }
    }
    var html = '<div class="cpp-ar-lane' + (bad ? ' is-jam' : '') + '">'
      + boxHtml('a', '14%', COL[l.t] || '#cfd8ff', l.name ? l.t + ' ' + l.name : 'number', lval)
      + boxHtml('b', '44%', COL[r.t] || '#cfd8ff', r.name ? r.t + ' ' + r.name : 'number', rval)
      + boxHtml('s', '84%', bad ? '#ff5468' : (COL[T] || '#cfd8ff'), T + ' ' + name, bad ? null : fmt(fin, T))
      + '<div class="cpp-ar-sign">' + SYM[o] + '</div><div class="cpp-ar-eq">=</div>'
      + (bad ? '<u class="cpp-ar-smoke"></u>' : '')
      + chip('a', '', '', lval) + chip('b', '', '', rval) + res
      + (tag ? '<div class="cpp-ar-tag" style="animation-delay:' + tagAt + '">' + esc(tag) + '</div>' : '')
      + '</div>';
    return { html: html, jam: bad, hist: name + ' = ' + lval + ' ' + SYM[o] + ' ' + rval + ' = ' + (bad ? 'JAM' : fmt(fin, T)) };
  }
  function parse(src) {
    src = window.__ladoCsSrc(src);
    var code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/^\s*#.*$/gm, '');
    var mi = code.search(/\bmain\s*\([^)]*\)\s*\{/);
    if (mi >= 0) code = code.slice(mi).replace(/^[^{]*\{/, '');
    var by = Object.create(null), out = [], parts = code.split(';');
    parts.pop();
    parts.forEach(function (raw) {
      var p = raw.replace(/\s+/g, ' ').replace(/^[{}\s]+/, '').trim();
      var m = DECL.exec(p), T, name, ex, a, e, l, r, c;
      if (m) { T = m[1]; name = m[2]; ex = m[3]; }
      else if ((m = ASSIGN.exec(p)) && by[m[1]]) { T = by[m[1]].t; name = m[1]; ex = m[2]; }
      else return;
      a = atom(ex, by);
      if (a) { by[name] = { t: T, n: conv(a.n, T) }; return; }
      e = BIN.exec(ex.trim());
      if (!e) { by[name] = { t: T, n: null }; return; }
      l = atom(e[1], by); r = atom(e[3], by);
      if (!l || !r) { by[name] = { t: T, n: null }; return; }
      c = calc(l, e[2], r);
      by[name] = { t: T, n: (c.jam || c.bad) ? null : conv(c.n, T) };
      out.push(lane(T, name, l, e[2], r));
    });
    return out;
  }
  function update(stage, lab, ta) {
    var h = window.__ladoVH(lab);
    var ops = (h && /Arithmetic Operators/.test(h.textContent)) ? parse(ta.value) : [];
    var sc = stage.querySelector('.cpp-ar-scene');
    var status = stage.querySelector('.cpp-visual-status');
    if (!ops.length) { if (sc) sc.remove(); stage.classList.remove('has-ar'); return; }
    if (!sc) {
      sc = document.createElement('div');
      sc.className = 'cpp-ar-scene';
      sc.innerHTML = '<div class="cpp-ar-hist"></div><div class="cpp-ar-stage"></div>';
      stage.appendChild(sc);
    }
    stage.classList.add('has-ar');
    var last = ops[ops.length - 1];
    sc.querySelector('.cpp-ar-hist').innerHTML = ops.slice(Math.max(0, ops.length - 7), -1).map(function (x) {
      return '<span class="' + (x.jam ? 'is-jam' : '') + '">' + esc(x.hist) + '</span>';
    }).join('');
    var st = sc.querySelector('.cpp-ar-stage');
    if (st._h !== last.html) { st.innerHTML = last.html; st._h = last.html; }
    if (status) status.textContent = ops.length + (ops.length === 1 ? ' operation' : ' operations') + (last.jam ? ', jammed' : '');
  }
  setInterval(function () {
    var stage = document.querySelector('.cpp-visual-stage');
    if (stage === null) return;
    var lab = stage.closest('.cpp-lab');
    var ta = lab && lab.querySelector('[data-role="lab-code"]');
    if (!ta || stage._arv === ta.value) return;
    stage._arv = ta.value;
    try { update(stage, lab, ta); } catch (err) { }
  }, 250);
})();


/* cpp-assign-scene */
(function () {
  var TY = 'int|short|long|float|double';
  var DECL = new RegExp('^(?:const\\s+)?(' + TY + ')\\s+([A-Za-z_]\\w*)\\s*(?:=|\\{)\\s*([^}]+?)\\s*\\}?$');
  var COMP = /^([A-Za-z_]\w*)\s*([+\-*\/%])=\s*(.+)$/;
  var CMP = /^([A-Za-z_]\w*)\s*==\s*(.+)$/;
  var ASSIGN = /^([A-Za-z_]\w*)\s*=(?!=)\s*(.+)$/;
  var COL = { int: '#5fb0ff', short: '#4fd8e8', long: '#4fd8e8', float: '#ffd84d', double: '#ffb454' };
  function isF(t) { return t === 'float' || t === 'double'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(n, t) {
    if (n === null || n === undefined) return '?';
    if (!isFinite(n)) return n !== n ? 'nan' : (n > 0 ? 'inf' : '-inf');
    if (isF(t)) return Number.isInteger(n) ? n.toFixed(1) : String(+n.toPrecision(7));
    return String(n);
  }
  function conv(n, t) {
    if (!isFinite(n)) return n;
    return t === 'float' ? Math.fround(n) : t === 'double' ? n : Math.trunc(n);
  }
  function ev(ex, by) {
    var bad = false;
    var s = ex.replace(/(\d)[fF]\b/g, '$1').replace(/[A-Za-z_]\w*/g, function (id) {
      if (by[id] && by[id].n !== null) return '(' + by[id].n + ')';
      bad = true; return '0';
    });
    if (bad || !/^[\d\s.+\-*\/%()eE]*$/.test(s) || !s.trim()) return null;
    try { var v = Function('return (' + s + ')')(); return typeof v === 'number' ? v : null; } catch (e) { return null; }
  }
  function parse(src) {
    src = window.__ladoCsSrc(src);
    var code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/^\s*#.*$/gm, '');
    var mi = code.search(/\bmain\s*\([^)]*\)\s*\{/);
    if (mi >= 0) code = code.slice(mi).replace(/^[^{]*\{/, '');
    var by = Object.create(null), order = [], steps = [], parts = code.split(';');
    var pending = parts.pop().replace(/\s+/g, ' ').replace(/^[{}\s]+/, '').trim();
    parts.forEach(function (raw) {
      var p = raw.replace(/\s+/g, ' ').replace(/^[{}\s]+/, '').trim(), m, T, r, cur, res, st;
      if (!p) return;
      if ((m = DECL.exec(p))) {
        T = m[1]; r = ev(m[3], by);
        if (r === null) return;
        by[m[2]] = { t: T, n: conv(r, T) };
        if (order.indexOf(m[2]) < 0) order.push(m[2]);
        steps.push({ kind: 'decl', name: m[2], t: T, old: null, nw: by[m[2]].n, lab: T + ' ' + m[2] + ' = ' + m[3].trim() });
      } else if ((m = CMP.exec(p)) && by[m[1]]) {
        r = ev(m[2], by);
        steps.push({ kind: 'cmp', name: m[1], t: by[m[1]].t, old: by[m[1]].n, nw: by[m[1]].n, lab: m[1] + ' == ' + m[2].trim(), rhs: r });
      } else if ((m = COMP.exec(p)) && by[m[1]]) {
        T = by[m[1]].t; cur = by[m[1]].n; r = ev(m[3], by);
        if (r === null || cur === null) return;
        st = { kind: 'comp', name: m[1], t: T, old: cur, op: m[2], rhs: r, lab: m[1] + ' ' + m[2] + '= ' + m[3].trim() };
        if ((m[2] === '/' || m[2] === '%') && r === 0 && (m[2] === '%' || !isF(T))) { st.jam = true; st.nw = cur; }
        else {
          res = m[2] === '+' ? cur + r : m[2] === '-' ? cur - r : m[2] === '*' ? cur * r : m[2] === '/' ? cur / r : cur % r;
          st.nw = conv(res, T);
          by[m[1]].n = st.nw;
        }
        steps.push(st);
      } else if ((m = ASSIGN.exec(p)) && by[m[1]]) {
        T = by[m[1]].t; cur = by[m[1]].n; r = ev(m[2], by);
        if (r === null) return;
        by[m[1]].n = conv(r, T);
        steps.push({ kind: 'set', name: m[1], t: T, old: cur, nw: by[m[1]].n, lab: m[1] + ' = ' + m[2].trim() });
      }
    });
    return { by: by, order: order, steps: steps, pending: pending };
  }
  var SG = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7', '%': '%' };
  function chip(cls, txt) { return '<i class="cpp-as-chip ' + cls + '">' + esc(txt) + '</i>'; }
  function html(P) {
    var last = P.steps[P.steps.length - 1], k = last.kind, T = last.t, col = COL[T] || '#cfd8ff';
    var bad = false, keep = false, nv = true, tag = '', chips = '', vals = '', cls = '', td = 0, rt;
    if (k === 'comp') {
      bad = !!last.jam; keep = bad; nv = !bad; cls = 'is-comp'; td = 6.2;
      chips = chip('c-o', fmt(last.old, T)) + chip('c-s is-sign', SG[last.op]) + chip('c-n', fmt(last.rhs, T))
        + chip(bad ? 'c-rj is-bad' : 'c-r is-res', bad ? '\u2716' : fmt(last.nw, T));
      vals = '<b class="cpp-box-val ov">' + esc(fmt(last.old, T)) + '</b>' + (bad ? '' : '<b class="cpp-box-val nv">' + esc(fmt(last.nw, T)) + '</b>');
      tag = bad ? 'Error: divide by zero. The box cannot change'
        : last.name + ' ' + last.op + '= ' + fmt(last.rhs, T) + '  means  ' + fmt(last.old, T) + ' ' + SG[last.op] + ' ' + fmt(last.rhs, T) + ' = ' + fmt(last.nw, T) + ', which goes back in the box';
    } else if (k === 'cmp') {
      keep = true; nv = false; cls = 'is-cmp'; td = 6.2;
      rt = last.rhs === null ? '?' : (last.old === last.rhs ? 'true' : 'false');
      chips = chip('c-o', fmt(last.old, T)) + chip('c-s is-sign', '==') + chip('c-n', last.rhs === null ? '?' : fmt(last.rhs, T))
        + chip('c-rc ' + (rt === 'true' ? 'is-res' : 'is-bad'), rt);
      vals = '<b class="cpp-box-val ov">' + esc(fmt(last.old, T)) + '</b>';
      tag = '== only asks a question (' + rt + '). ' + last.name + ' is still ' + fmt(last.old, T) + '. Use a single = to store a value';
    } else {
      cls = 'is-set'; td = 3.8;
      chips = (last.old !== null ? chip('s-o', fmt(last.old, T)) : '') + chip('s-n is-res', fmt(last.nw, T));
      vals = (last.old !== null ? '<b class="cpp-box-val ov">' + esc(fmt(last.old, T)) + '</b>' : '') + '<b class="cpp-box-val nv">' + esc(fmt(last.nw, T)) + '</b>';
      tag = k === 'decl' ? 'A new box is made and ' + fmt(last.nw, T) + ' goes inside'
        : last.name + ' = ' + fmt(last.nw, T) + ': the old value ' + fmt(last.old, T) + ' is replaced';
    }
    var hist = '<div class="cpp-as-hist">' + P.steps.slice(Math.max(0, P.steps.length - 7), -1).map(function (x) {
      return '<span>' + esc(x.lab) + (x.kind === 'decl' || x.kind === 'cmp' ? '' : '  \u2192  ' + esc(fmt(x.nw, x.t))) + '</span>';
    }).join('') + '</div>';
    var box = '<div class="cpp-ar-box" style="left:14%;--c:' + (bad ? '#ff5468' : col) + '"><div class="cpp-box-cube"><i class="f front">' + vals
      + '</i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div></div><div class="cpp-ar-name">' + esc(T + ' ' + last.name) + '</div></div>';
    return hist + '<div class="cpp-as-stage"><div class="cpp-as-lane ' + cls + (keep ? ' is-keep' : '') + (nv ? ' has-nv' : '') + '">' + box + chips
      + '<div class="cpp-as-tag' + (bad || rt === 'false' ? ' is-jam' : '') + '" style="animation-delay:' + td + 's">' + esc(tag) + '</div></div></div>';
  }
  function pendingHtml(P) {
    var p = P.pending, m, name, T, rhs, op = '=', old = null, val = null;
    if (!p) return '';
    if ((m = DECL.exec(p))) {
      T = m[1]; name = m[2]; rhs = m[3];
    } else if ((m = COMP.exec(p)) && P.by[m[1]]) {
      name = m[1]; T = P.by[name].t; old = P.by[name].n; op = m[2] + '='; rhs = m[3];
    } else if ((m = ASSIGN.exec(p)) && P.by[m[1]]) {
      name = m[1]; T = P.by[name].t; old = P.by[name].n; rhs = m[2];
    } else return '';
    val = ev(rhs, P.by);
    if (val === null) return '';
    val = conv(val, T);
    var col = COL[T] || '#cfd8ff';
    var distance = Math.min(42, Math.max(0, rhs.trim().length * 5));
    var left = 66 - distance;
    var vals = old === null ? '' : '<b class="cpp-box-val" style="opacity:1">' + esc(fmt(old, T)) + '</b>';
    var box = '<div class="cpp-ar-box" style="left:14%;--c:' + col + '"><div class="cpp-box-cube"><i class="f front">' + vals
      + '</i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div></div><div class="cpp-ar-name">' + esc(T + ' ' + name) + '</div></div>';
    return '<div class="cpp-as-stage"><div class="cpp-as-lane is-pending">' + box
      + '<i class="cpp-as-pending-value" style="--pending-left:' + left + '%">' + esc(fmt(val, T)) + '</i>'
      + '<i class="cpp-as-pending-sign">' + esc(op) + '</i>'
      + '<div class="cpp-as-tag">Type ; to put ' + esc(fmt(val, T)) + ' inside the ' + esc(name) + ' box</div></div></div>';
  }
  function update(stage, lab, ta) {
    var h = window.__ladoVH(lab);
    var P = (h && /Assignment and Compound Assignment/.test(h.textContent)) ? parse(ta.value) : null;
    var sc = stage.querySelector('.cpp-as-scene');
    var status = stage.querySelector('.cpp-visual-status');
    var pending = P && pendingHtml(P);
    if (!P || (!P.steps.length && !pending)) { if (sc) sc.remove(); stage.classList.remove('has-as'); return; }
    if (!sc) { sc = document.createElement('div'); sc.className = 'cpp-as-scene'; stage.appendChild(sc); }
    stage.classList.add('has-as');
    var out = pending || html(P);
    if (sc._h !== out) {
      sc._h = out; sc.innerHTML = out;
    }
    if (status) status.textContent = pending ? 'Value ready — type ; to store it' : P.steps.length + (P.steps.length === 1 ? ' step' : ' steps');
  }
  setInterval(function () {
    var stages = document.querySelectorAll('.cpp-visual-stage');
    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];
      var lab = stage.closest('.cpp-lab');
      var ta = lab && lab.querySelector('[data-role="lab-code"]');
      if (!ta) continue;
      try { update(stage, lab, ta); } catch (err) { console.error('[cpp-assign-scene]', err); }
    }
  }, 250);
})();
