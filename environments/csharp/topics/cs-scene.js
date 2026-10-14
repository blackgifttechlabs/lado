import { runCsharp, traceCsharp } from './cs-run.js?v=20261015-m-1';
import { syncDiy } from './cs-diy-scene.js?v=20261015-m-1';

// Guided scene: the program is replayed one statement at a time. Your variables are boxes that change value,
// and the terminal below prints the output as it happens.
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const show = (v, type) => (Array.isArray(v) ? '[' + v.map(x => show(x)).join(', ') + ']' : typeof v === 'boolean' ? (v ? 'True' : 'False') : typeof v === 'string' ? (type === 'char' ? `'${v}'` : `"${v}"`) : String(Math.round(v * 1e6) / 1e6));
const BOX = '<div class="cpp-box-cube"><i class="f front"><b class="cpp-box-val"></b></i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div><div class="cpp-item"><span></span></div></div><div class="cpp-box-label"></div>';
const COL = { int: '#5ac8fa', long: '#5ac8fa', short: '#5ac8fa', byte: '#5ac8fa', float: '#ffd66b', double: '#ffd66b', decimal: '#ffd66b', char: '#ff9ad5', bool: '#8ef2b8', string: '#c8a2ff' };
const KIND = { for: 'loop check', while: 'loop check', if: 'if check' };

function skeleton(scene) {
  scene.innerHTML = `<p class="cs-banner" role="status"></p><div class="cs-vars cpp-box-scene"></div>
    <div class="cs-station" data-state="idle"><div class="cs-ring"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" class="cs-track"/><g class="cs-spin"><circle cx="30" cy="8" r="5" class="cs-runner"/></g></svg><small class="cs-round"></small></div>
      <div class="cs-rail"><span class="cs-guard"></span><code class="cs-cond"></code><div class="cs-door"><i class="l"></i><i class="r"></i></div><b class="cs-verdict"></b></div></div>
    <div class="csd-term cs-term"><div class="csd-term-bar"><i></i><i></i><i></i><span>terminal</span></div><pre class="csd-term-out"></pre></div>
    <div class="cs-controls"><button type="button" data-cs="prev" aria-label="Previous step">‹</button><button type="button" data-cs="play">Pause</button><button type="button" data-cs="next" aria-label="Next step">›</button><small></small></div>`;
  scene.boxes = new Map();
  scene.addEventListener('click', e => {
    const b = e.target.closest('[data-cs]'); if (!b) return;
    const total = scene.trace.frames.length;
    if (b.dataset.cs === 'play') { if (scene.playing) stop(scene); else { if (scene.k >= total - 1) scene.k = 0; scene.playing = true; draw(scene); tick(scene); } return; }
    stop(scene); scene.k = Math.max(0, Math.min(total - 1, scene.k + (b.dataset.cs === 'next' ? 1 : -1))); draw(scene, true);
  });
}
function stop(scene) { scene.playing = false; clearTimeout(scene.tick); draw(scene, true); }
// How long a step is held: boxes need time to open and fill, checks need time for the guard to walk to the door.
function hold(scene, k) {
  const f = scene.trace.frames[k], p = scene.trace.frames[k - 1] || { vars: {}, out: '' };
  if (!f) return 800;
  if (f.ev) return 1700;
  if (Object.keys(f.vars).some(n => JSON.stringify(f.vars[n]) !== JSON.stringify(p.vars[n]))) return 1900;
  return f.out !== p.out ? 1100 : 800;
}
function tick(scene) {
  clearTimeout(scene.tick);
  if (!scene.playing) return;
  scene.tick = setTimeout(() => {
    if (!scene.isConnected) return;
    if (scene.k >= scene.trace.frames.length - 1) { scene.playing = false; draw(scene); return; }
    scene.k++; draw(scene); tick(scene);
  }, hold(scene, scene.k + 1) + 80);
}
const settle = (slot, val) => { clearTimeout(slot._t1); clearTimeout(slot._t2); slot.classList.remove('s-declared', 's-assigning', 's-filling'); slot.classList.add('s-done'); slot.classList.remove('is-open', 'is-active'); slot.querySelector('.cpp-box-val').textContent = val; slot.querySelector('.cpp-item span').textContent = val; };
// Same story as the C++ boxes: the lid opens, the value drops in, the lid closes.
function fill(slot, val, parent) {
  clearTimeout(slot._t1); clearTimeout(slot._t2);
  slot.querySelector('.cpp-item span').textContent = val;
  slot.classList.remove('s-declared', 's-filling', 's-done'); slot.classList.add('s-assigning', 'is-open', 'is-active'); parent.classList.add('has-active');
  slot._t1 = setTimeout(() => { slot.classList.remove('s-assigning'); slot.classList.add('s-filling'); }, 550);
  slot._t2 = setTimeout(() => { slot.querySelector('.cpp-box-val').textContent = val; slot.classList.remove('s-filling'); slot.classList.add('s-done'); slot.classList.remove('is-open'); setTimeout(() => { slot.classList.remove('is-active'); if (!parent.querySelector('.is-active')) parent.classList.remove('has-active'); }, 600); }, 1250);
}
function draw(scene, instant) {
  const { frames, types, text, unsupported } = scene.trace, f = frames[scene.k] || { vars: {}, out: '' }, prev = frames[scene.k - 1] || { vars: {}, out: '' };
  const box = scene.querySelector('.cs-vars'), banner = scene.querySelector('.cs-banner'), term = scene.querySelector('.csd-term-out'), st = scene.querySelector('.cs-station');
  const names = Object.keys(f.vars), changed = [];
  scene.boxes.forEach((el, n) => { if (!names.includes(n)) { el.remove(); scene.boxes.delete(n); } });
  names.forEach(n => {
    let el = scene.boxes.get(n); const val = show(f.vars[n], types[n]), type = types[n] || 'var';
    if (!el) { el = document.createElement('div'); el.className = 'cpp-box-slot s-declared'; el.innerHTML = BOX; box.appendChild(el); scene.boxes.set(n, el); el.dataset.val = ''; if (!instant) { el.classList.add('is-new'); setTimeout(() => el.classList.remove('is-new'), 900); } }
    el.style.setProperty('--c', COL[type.replace('[]', '')] && !type.endsWith('[]') ? COL[type] : '#cfd8ff');
    el.querySelector('.cpp-box-label').textContent = type + ' ' + n;
    if (el.dataset.val !== val) { const born = el.dataset.val === ''; el.dataset.val = val; changed.push(n); if (instant) settle(el, val); else fill(el, val, box); } else if (instant) settle(el, val);
  });
  const empty = box.querySelector('.cs-empty');
  if (!names.length && !empty) box.insertAdjacentHTML('beforeend', '<p class="cs-empty">Your variables appear here as boxes. Type <code>int age = 25;</code> to see one.</p>');
  else if (names.length && empty) empty.remove();
  // The check station: a guard walks to the door; it opens when the condition is true.
  const ev = f.ev;
  if (ev) {
    const sameLoop = (g) => g.ev && g.ev.kind !== 'if' && g.ev.text === ev.text;
    const round = ev.kind === 'if' ? 0 : frames.slice(0, scene.k + 1).filter(g => sameLoop(g) && g.ev.ok).length;
    st.querySelector('.cs-cond').textContent = ev.text;
    st.querySelector('.cs-round').textContent = ev.kind === 'if' ? 'if' : ev.ok ? 'round ' + round : 'done after ' + round;
    st.querySelector('.cs-spin').style.transform = `rotate(${round * 90}deg)`;
    st.querySelector('.cs-verdict').textContent = ev.ok ? 'YES' : 'NO';
    st.dataset.kind = ev.kind === 'if' ? 'if' : 'loop';
    const key = scene.k + ':' + ev.text; if (st.dataset.key !== key || instant) { st.dataset.key = key; st.dataset.state = 'idle'; st.classList.remove('go'); if (instant) st.dataset.state = ev.ok ? 'true' : 'false'; else { void st.offsetWidth; st.dataset.state = ev.ok ? 'true' : 'false'; st.classList.add('go'); } }
  } else { st.dataset.state = 'idle'; st.dataset.key = ''; st.classList.remove('go'); st.querySelector('.cs-cond').textContent = ''; st.querySelector('.cs-verdict').textContent = ''; st.querySelector('.cs-round').textContent = ''; }
  const total = frames.length, newOut = f.out.slice(prev.out.length).trim();
  banner.className = 'cs-banner ' + (scene.k === 0 ? 'is-start' : ev ? (ev.ok ? 'is-set' : 'is-print') : changed.length ? 'is-set' : newOut ? 'is-print' : '');
  banner.textContent = unsupported ? 'This lesson needs real .NET, so the scene shows the output only.' : !total ? 'Start typing and the program runs here, one statement at a time.' : scene.k === 0 ? 'Program starts' : ev ? `${KIND[ev.kind]}: is ${ev.text} ? ${ev.ok ? 'Yes, go in' : 'No, move on'}` : changed.length ? 'Box ' + changed.join(', ') + ' now holds ' + changed.map(n => show(f.vars[n], types[n])).join(', ') : newOut ? 'Printed to the terminal: ' + newOut.split('\n').pop() : 'Step ' + scene.k;
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
  // Topics that borrow a C++ scene are drawn by the C++ scene code, so this pane stays out of the way.
  if (lab.dataset.visual) { stage.querySelector('.cpp-loop-scene.is-cs')?.remove(); return; }
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
