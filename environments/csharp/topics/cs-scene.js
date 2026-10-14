import { runCsharp, traceCsharp } from './cs-run.js?v=20261014-cs-11';
import { syncDiy } from './cs-diy-scene.js?v=20261014-cs-11';

// Guided scene: the program is replayed one statement at a time. Your variables are boxes that change value,
// and the terminal below prints the output as it happens.
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const show = (v, type) => (Array.isArray(v) ? '[' + v.map(x => show(x)).join(', ') + ']' : typeof v === 'boolean' ? (v ? 'True' : 'False') : typeof v === 'string' ? (type === 'char' ? `'${v}'` : `"${v}"`) : String(Math.round(v * 1e6) / 1e6));
const STEP_MS = 800;

function skeleton(scene) {
  scene.innerHTML = `<p class="cs-banner" role="status"></p><div class="cs-vars"></div>
    <div class="csd-term cs-term"><div class="csd-term-bar"><i></i><i></i><i></i><span>terminal</span></div><pre class="csd-term-out"></pre></div>
    <div class="cs-controls"><button type="button" data-cs="prev" aria-label="Previous step">‹</button><button type="button" data-cs="play">Pause</button><button type="button" data-cs="next" aria-label="Next step">›</button><small></small></div>`;
  scene.boxes = new Map();
  scene.addEventListener('click', e => {
    const b = e.target.closest('[data-cs]'); if (!b) return;
    const total = scene.trace.frames.length;
    if (b.dataset.cs === 'play') { if (scene.playing) stop(scene); else { if (scene.k >= total - 1) scene.k = 0; scene.playing = true; draw(scene); tick(scene); } return; }
    stop(scene); scene.k = Math.max(0, Math.min(total - 1, scene.k + (b.dataset.cs === 'next' ? 1 : -1))); draw(scene);
  });
}
function stop(scene) { scene.playing = false; clearTimeout(scene.tick); draw(scene); }
function tick(scene) {
  clearTimeout(scene.tick);
  if (!scene.playing) return;
  scene.tick = setTimeout(() => {
    if (!scene.isConnected) return;
    if (scene.k >= scene.trace.frames.length - 1) { scene.playing = false; draw(scene); return; }
    scene.k++; draw(scene); tick(scene);
  }, STEP_MS);
}
function draw(scene) {
  const { frames, types, text, unsupported } = scene.trace, f = frames[scene.k] || { vars: {}, out: '' }, prev = frames[scene.k - 1] || { vars: {}, out: '' };
  const box = scene.querySelector('.cs-vars'), banner = scene.querySelector('.cs-banner'), term = scene.querySelector('.csd-term-out');
  const names = Object.keys(f.vars), changed = [];
  scene.boxes.forEach((el, n) => { if (!names.includes(n)) { el.remove(); scene.boxes.delete(n); } });
  names.forEach(n => {
    let el = scene.boxes.get(n);
    const val = show(f.vars[n], types[n]), isNew = !el;
    if (!el) { el = document.createElement('div'); el.className = 'cs-var'; el.innerHTML = '<small></small><b></b><span></span>'; box.appendChild(el); scene.boxes.set(n, el); }
    el.querySelector('small').textContent = types[n] || 'var'; el.querySelector('b').textContent = n;
    const span = el.querySelector('span');
    if (span.textContent !== val) { span.textContent = val; if (!isNew) { span.classList.remove('is-new'); void span.offsetWidth; span.classList.add('is-new'); changed.push(n); } }
    if (isNew) { el.classList.remove('is-born'); void el.offsetWidth; el.classList.add('is-born'); changed.push(n); }
  });
  if (!names.length && !scene.querySelector('.cs-empty')) box.insertAdjacentHTML('beforeend', '<p class="cs-empty">Your variables appear here as boxes. Type <code>int age = 25;</code> to see one.</p>');
  else if (names.length) scene.querySelector('.cs-empty')?.remove();
  const total = frames.length, newOut = f.out.slice(prev.out.length).trim();
  banner.className = 'cs-banner ' + (scene.k === 0 ? 'is-start' : changed.length ? 'is-set' : newOut ? 'is-print' : '');
  banner.textContent = unsupported ? 'This lesson needs real .NET, so the scene shows the output only.' : !total ? 'Start typing and the program runs here, one statement at a time.' : scene.k === 0 ? 'Program starts' : changed.length ? 'Box ' + changed.join(', ') + ' now holds ' + changed.map(n => show(f.vars[n], types[n])).join(', ') : newOut ? 'Printed to the terminal: ' + newOut.split('\n').pop() : 'Step ' + scene.k;
  const shown = unsupported || !total ? text : f.out;
  term.innerHTML = '<span class="csd-p">$ dotnet run</span>\n' + (/^error|\nerror:/m.test(shown) ? `<span class="csd-bad">${esc(shown)}</span>` : esc(shown)) + '<i class="csd-cur"></i>';
  scene.querySelector('[data-cs="play"]').textContent = scene.playing ? 'Pause' : scene.k >= total - 1 ? 'Replay' : 'Play';
  scene.querySelector('.cs-controls small').textContent = total ? `step ${scene.k + 1} / ${total}` : '';
  scene.querySelector('.cs-controls').style.visibility = total > 1 ? '' : 'hidden';
}
function sync(stage) {
  const lab = stage.closest('.cpp-lab');
  if (!lab || lab.dataset.lang !== 'csharp') { stage.querySelectorAll('.cpp-loop-scene.is-cs, .cpp-loop-scene.is-csd').forEach(n => n.remove()); if (stage.querySelector('.cpp-loop-scene') === null) stage.classList.remove('has-loop'); return; }
  const editor = lab.querySelector('[data-role="lab-code"]'); if (!editor) return;
  if (lab.classList.contains('is-diy') && lab._practice) { if (lab.querySelector('.cpp-guided-drawer')?.getAttribute('aria-hidden') !== 'true') syncDiy(stage, lab, editor); return; }
  stage.querySelector('.cpp-loop-scene.is-csd')?.remove();
  let scene = stage.querySelector('.cpp-loop-scene.is-cs');
  if (!scene) { scene = document.createElement('section'); scene.className = 'cpp-loop-scene is-cs'; stage.appendChild(scene); scene.trace = { frames: [], types: {}, text: '' }; scene.k = 0; skeleton(scene); draw(scene); }
  stage.classList.add('has-loop');
  if (lab.querySelector('.cpp-guided-drawer')?.getAttribute('aria-hidden') === 'true') { stop(scene); scene.code = undefined; return; }
  const code = editor.value;
  if (scene.code === code) return;
  scene.code = code; clearTimeout(scene.timer); stop(scene);
  scene.timer = setTimeout(() => {
    if (!scene.isConnected) return;
    scene.trace = traceCsharp(code);
    const status = stage.querySelector('.cpp-visual-status'); if (status) status.textContent = /^error/m.test(scene.trace.text) ? 'Check the current code' : '';
    scene.trace.frames.unshift({ vars: {}, out: '' });
    scene.k = 0; scene.playing = scene.trace.frames.length > 1; draw(scene); tick(scene);
  }, 450);
}
setInterval(() => document.querySelectorAll('.cpp-visual-stage').forEach(sync), 250);
