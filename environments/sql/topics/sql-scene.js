import { sqlModel, assemble } from './sql-model.js?v=20261014-cs-11';
import { createSqlWorld } from '../three/sql-world.js?v=20261014-cs-11';

// Replays a SQL lesson: the 3D world above, the computer (result screen) below, the controls underneath.
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const showVal = v => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? (Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6)) : String(v));

function screenHtml(f, delay, animate) {
  const s = f.screen || { type: 'msg', text: '' };
  const style = animate ? ` style="--at:${Math.round(delay)}ms" data-anim="1"` : '';
  if (s.type === 'rows') {
    const head = s.columns.map(c => `<th>${esc(c)}</th>`).join('');
    const body = s.rows.length
      ? s.rows.map((r, i) => `<tr style="--i:${i}">${r.map(v => `<td class="${v === null ? 'is-null' : typeof v === 'number' ? 'is-num' : ''}">${esc(showVal(v))}</td>`).join('')}</tr>`).join('')
      : `<tr><td class="is-empty" colspan="${s.columns.length}">(no rows matched)</td></tr>`;
    return `<div class="cpp-lp-rs"${style}><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><p class="cpp-lp-rs-count">${s.rows.length} row${s.rows.length === 1 ? '' : 's'}</p></div>`;
  }
  if (s.type === 'error') return `<div class="cpp-lp-msg is-error"${style}><b>error:</b> ${esc(s.text)}${s.hint ? `<small>${esc(s.hint)}</small>` : ''}</div>`;
  const text = s.text === 'ready' || s.text === 'empty database' ? '' : s.text;
  return `<div class="cpp-lp-msg"${style}>${text ? '<b>✔</b> ' + esc(text) : '<span class="cpp-lp-idle">sql&gt; </span><i class="cpp-lp-cursor"></i>'}</div>`;
}
function view(state, k, playing, machine, animateScreen, delay) {
  const frames = state.frames, f = frames[k];
  const code = f.stmt ? `<code>${esc(f.stmt.replace(/\s+/g, ' ').slice(0, 120))}</code>` : '';
  return `<p class="cpp-lp-banner cpp-lp-sqlbanner is-${f.kind === 'error' ? 'limit' : f.kind === 'start' ? 'check' : 'exit'}" role="status"><span>${esc(f.label)}</span>${code}</p>
    <div class="cpp-lp-computer" aria-label="Query result">
      <div class="cpp-lp-bezel"><div class="cpp-lp-screen"><div class="cpp-lp-screen-bar"><i></i><i></i><i></i><span>database screen</span></div><div class="cpp-lp-sqlout">${screenHtml(f, delay, animateScreen)}</div></div><u class="cpp-lp-led"></u></div>
      <div class="cpp-lp-neck"></div><div class="cpp-lp-base"></div>
    </div>
    <div class="cpp-lp-controls"><button type="button" data-lp="prev" aria-label="Previous step">‹</button><button type="button" data-lp="play">${playing ? 'Pause' : k >= frames.length - 1 ? 'Replay' : 'Play'}</button><button type="button" data-lp="next" aria-label="Next step">›</button><small>step ${k + 1} / ${frames.length}</small></div>`;
}
// The 3D canvas lives in a shell that is created once; only the part below it is re-rendered, so the canvas never detaches or blanks.
function rest(scene, html) {
  const machine = scene.machine;
  let shell = scene.querySelector(':scope > .cpp-lp-3d'), body = scene.querySelector(':scope > .cpp-lp-rest');
  if (!body) { scene.innerHTML = ''; if (machine) { shell = document.createElement('div'); shell.className = 'cpp-lp-3d'; scene.appendChild(shell); } body = document.createElement('div'); body.className = 'cpp-lp-rest'; scene.appendChild(body); }
  if (shell && machine && machine.el.parentNode !== shell) { shell.appendChild(machine.el); machine.fit(); }
  if (body.dataset.html !== html) { body.innerHTML = html; body.dataset.html = html; }
}
function draw(scene) {
  const state = scene.state || { frames: [], error: '' }, machine = scene.machine;
  if (!state.frames.length) {
    const wait = state.incomplete;
    const hint = 'Start typing and the database scene builds itself, piece by piece.';
    rest(scene, `<p class="cpp-branch-error" role="status">${esc(state.error ? (wait ? 'Keep typing: ' + (state.hint || state.error) : state.error) : hint)}</p>`);
    return;
  }
  const total = state.frames.length;
  let fresh = false;
  if (machine) {
    machine.setFrames?.(state.frames); machine.speed = total > 14 ? 2 : total > 8 ? 1.5 : 1;
    if (scene.shown !== scene.k) { machine.show(state.frames[scene.k], state.frames[scene.k - 1], { jump: !!scene.jump }); scene.shown = scene.k; fresh = !scene.jump; scene.anim = fresh ? { k: scene.k, t0: performance.now(), at: machine.screenAt || 0 } : null; }
  }
  // The result appears on the screen only when the pieces arrive; a redraw during that wait keeps counting from the same start.
  let delay = 0;
  if (scene.anim && scene.anim.k === scene.k) { const left = scene.anim.at - (performance.now() - scene.anim.t0); if (left > 0) { fresh = true; delay = left; } else fresh = false; } else fresh = false;
  rest(scene, view(state, scene.k, scene.playing, machine, fresh, delay) + (state.error ? `<p class="cpp-branch-error" role="status">${esc(state.incomplete ? 'Keep typing: ' + (state.hint || state.error) : state.error + (state.hint ? ' — ' + state.hint : ''))}</p>` : ''));
  scene.jump = false;
}
function stop(scene) { scene.playing = false; clearTimeout(scene.timer); }
function tick(scene) {
  clearTimeout(scene.timer);
  if (!scene.playing) return;
  const total = scene.state.frames.length;
  if (scene.k >= total - 1) { scene.playing = false; draw(scene); return; }
  const wait = scene.machine ? scene.machine.stepMs : 900;
  scene.timer = setTimeout(() => { if (!scene.isConnected) return; scene.k++; draw(scene); tick(scene); }, wait);
}
function play(scene) {
  stop(scene); scene.k = 0; scene.shown = -1; draw(scene);
  if (!scene.state.frames.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { scene.k = scene.state.frames.length - 1; scene.jump = true; draw(scene); return; }
  scene.playing = true; draw(scene); tick(scene);
}
function controls(scene, event) {
  const button = event.target.closest('[data-lp]'); if (!button) return;
  const total = scene.state.frames.length, action = button.dataset.lp;
  if (action === 'play') {
    if (scene.playing) { stop(scene); draw(scene); return; }
    if (scene.k >= total - 1) { scene.k = 0; scene.shown = -1; }
    scene.playing = true; draw(scene); tick(scene); return;
  }
  stop(scene); scene.jump = true; scene.k = Math.max(0, Math.min(total - 1, scene.k + (action === 'next' ? 1 : -1))); draw(scene);
}
function sync(stage) {
  const lab = stage.closest('.cpp-lab');
  let scene = stage.querySelector('.cpp-loop-scene');
  if (!lab || lab.dataset.lang !== 'sql') { if (scene && scene.dataset.sql) { stop(scene); scene.machine?.dispose(); scene.remove(); stage.classList.remove('has-loop'); } return; }
  const editor = lab.querySelector('[data-role="lab-code"]'); if (!editor) return;
  if (!scene) {
    scene = document.createElement('section'); scene.className = 'cpp-loop-scene is-sql'; scene.dataset.sql = '1'; scene.k = 0; stage.appendChild(scene);
    scene.addEventListener('click', event => controls(scene, event));
  }
  if (!scene.machineMade) { scene.machine = createSqlWorld('sql') || null; scene.machineMade = true; scene.state = undefined; scene.wasOpen = false; scene.shown = -1; scene.code = undefined; }
  stage.classList.add('has-loop');
  const opened = lab.querySelector('.cpp-guided-drawer')?.getAttribute('aria-hidden') !== 'true';
  if (!opened) { scene.wasOpen = false; stop(scene); return; }
  const full = assemble(lab.dataset.sqlSetup, editor.value);
  const changed = scene.code !== full;
  if (changed) { scene.code = full; scene.next = sqlModel(full); }
  if (scene.machine && (changed || !scene.querySelector('.cpp-lp-3d'))) { if (changed) { stop(scene); scene.machine.setCode(full); } if (!scene.querySelector('.cpp-lp-3d')) draw(scene); }
  if (changed || !scene.wasOpen) {
    scene.wasOpen = true; clearTimeout(scene.debounce); const next = scene.next;
    scene.debounce = setTimeout(() => { if (!scene.isConnected) return; scene.state = next; play(scene); }, 650);
  }
  const status = stage.querySelector('.cpp-visual-status');
  const message = scene.next?.error && !scene.next.incomplete ? 'Check the current code' : '';
  if (status && status.textContent !== message) status.textContent = message;
}
setInterval(() => document.querySelectorAll('.cpp-visual-stage').forEach(sync), 180);
