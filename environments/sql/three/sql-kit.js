import * as THREE from '../../cpp/vendor/three/three.module.js';
import { tex, redraw, rr, INK, MUTED } from '../../cpp/three/office-kit.js?v=20261014-cs-18';
import { show } from '../topics/sql-model.js?v=20261014-cs-18';

// Building blocks of the SQL scenes: tables lying on a desk (header plates + row trays), tiles, and two little walkers.
// Same font stack as the code editor, so the scene text matches the code.
export const MONO = '"LadoMono", "DejaVu Sans Mono", "Liberation Mono", "SF Mono", Menlo, Consolas, monospace';
export const CW = 1.5, RH = .62, HH = .78, PX = 288, PY = 120;
export const ACCENTS = [['#2d7fb8', '#bfe0f5'], ['#2f9e63', '#c4ecd5'], ['#d99a1f', '#f6e1ae'], ['#9b5de5', '#e0cdf7']];
export const mat = (c, r = .5, m = .1, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...extra });
const basic = (map, extra = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...extra });
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const outCubic = t => 1 - Math.pow(1 - t, 3);
export const outBack = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function fit(g, text, maxW, size, weight = 800) {
  let s = size; g.font = `${weight} ${s}px ${MONO}`;
  while (g.measureText(text).width > maxW && s > 15) { s -= 2; g.font = `${weight} ${s}px ${MONO}`; }
  return s;
}
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// ---------- cell and tile textures ----------
const TILE_CACHE = new Map();
export function tileTex(text, kind = 'cell', accent = 0) {
  const key = `${kind}|${accent}|${text}`;
  let t = TILE_CACHE.get(key);
  if (t) return t;
  const [dark, pale] = ACCENTS[accent % ACCENTS.length];
  t = tex(PX, PY, (g, w, h) => {
    const head = kind === 'head', ghost = kind === 'ghost', res = kind === 'result';
    g.fillStyle = head ? dark : res ? '#fff6d6' : ghost ? '#dff0ff' : '#ffffff';
    rr(g, 3, 3, w - 6, h - 6, 16); g.fill();
    g.strokeStyle = head ? '#0b2a38' : res ? '#e0b43c' : ghost ? '#79b6e8' : '#9fb7c9'; g.lineWidth = 5; rr(g, 3, 3, w - 6, h - 6, 16); g.stroke();
    g.fillStyle = head ? '#ffffff' : INK; g.textBaseline = 'middle'; g.textAlign = 'center';
    const txt = text === 'NULL' ? 'NULL' : text;
    fit(g, txt, w - 34, 44); if (text === 'NULL') g.fillStyle = '#9aa9b5';
    g.fillText(clip(txt, 20), w / 2, h / 2 + 3);
  });
  TILE_CACHE.set(key, t);
  return t;
}
export function tile(text, { kind = 'cell', accent = 0, w = CW * .9, d = RH * .82 } = {}) {
  const geo = new THREE.BoxGeometry(w, .14, d); geo.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(geo, [mat(0xdfe8ef, .5, .1), mat(0xdfe8ef, .5, .1), new THREE.MeshBasicMaterial({ map: tileTex(text, kind, accent), toneMapped: false, transparent: true }), mat(0xaebdc9, .6, .1), mat(0xdfe8ef, .5, .1), mat(0xdfe8ef, .5, .1)]);
  m.castShadow = true; m.userData.text = text; return m;
}
export function setTileOpacity(m, o) { m.material.forEach(x => { x.transparent = true; x.opacity = o; }); }

// ---------- rows ----------
export class RowMesh {
  constructor(table, rid, vals) {
    this.table = table; this.rid = rid; this.vals = vals.map(v => (v === undefined ? '' : v)); this.state = 'idle'; this.cellHi = {}; this.mark = '';
    this.group = new THREE.Group(); this.z = 0; this.tz = 0; this.lift = 0; this.tlift = 0; this.scale = 1; this.tex = null; this.cols = 0;
    this.slab = new THREE.Mesh(new THREE.BoxGeometry(1, .14, 1), mat(0xe9f1f7, .6, .05)); this.slab.castShadow = true; this.slab.receiveShadow = true;
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic(null)); this.plane.rotation.x = -Math.PI / 2; this.plane.position.y = .076;
    this.group.add(this.slab, this.plane); this.rebuild();
  }
  rebuild() {
    const n = this.table.cols.length; const W = Math.max(2, n) * CW;
    if (this.cols !== n || !this.tex) {
      this.tex?.dispose();
      this.tex = tex(Math.max(2, n) * PX, PY, () => {}); this.cols = n; this.plane.material.map = this.tex; this.plane.material.needsUpdate = true;
    }
    this.slab.scale.set(W, 1, RH * .94); this.plane.scale.set(W - .06, RH * .9, 1); this.draw();
  }
  draw() {
    const t = this.table, n = Math.max(2, t.cols.length), accent = t.accent;
    const [dark, pale] = ACCENTS[accent % ACCENTS.length];
    const base = { idle: '#f7fafc', scan: '#fff6c4', match: '#ffe27a', danger: '#ffb3a7', ok: '#bff0cf', dim: '#dde5eb', reject: '#ff8f84' }[this.state] || '#f7fafc';
    redraw(this.tex, (g, w, h) => {
      g.fillStyle = base; rr(g, 2, 2, w - 4, h - 4, 14); g.fill();
      g.strokeStyle = this.state === 'danger' || this.state === 'reject' ? '#d9453a' : '#a9bfd0'; g.lineWidth = 4; rr(g, 2, 2, w - 4, h - 4, 14); g.stroke();
      g.fillStyle = dark; g.fillRect(2, 14, 8, h - 28);
      for (let i = 0; i < n; i++) {
        const x = i * PX;
        if (this.cellHi[i]) { g.fillStyle = this.cellHi[i]; rr(g, x + 14, 12, PX - 22, h - 24, 12); g.fill(); }
        if (i > 0) { g.strokeStyle = '#c4d3df'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 18); g.lineTo(x, h - 18); g.stroke(); }
        if (i >= t.cols.length) continue;
        const v = this.vals[i]; const empty = v === '' || v === undefined;
        const isNull = v === null; const txt = empty ? '' : show(v);
        g.textAlign = 'left'; g.textBaseline = 'middle';
        fit(g, txt, PX - 40, 44, 800); g.fillStyle = isNull ? '#9aa9b5' : this.state === 'dim' ? '#6f7f8c' : INK;
        if (isNull) g.font = `italic 700 34px ${MONO}`;
        g.fillText(clip(txt, 18), x + 24, h / 2 + 3);
      }
      if (this.mark) {
        g.textAlign = 'right'; g.font = `800 64px ${MONO}`; g.fillStyle = this.mark === 'yes' ? '#1b8a4f' : '#c43a2f';
        g.fillText(this.mark === 'yes' ? '✓' : '✗', w - 14, h / 2 + 4);
      }
    });
  }
  set(state) { if (this.state !== state) { this.state = state; this.draw(); } }
  setMark(m) { if (this.mark !== m) { this.mark = m; this.draw(); } }
  setVals(v) { this.vals = v.slice(); this.draw(); }
  setCell(i, v) { this.vals[i] = v; this.draw(); }
  hi(i, color) { if (color) this.cellHi[i] = color; else delete this.cellHi[i]; this.draw(); }
  dispose() { this.tex?.dispose(); this.slab.geometry.dispose(); this.plane.geometry.dispose(); this.group.removeFromParent(); }
}

// ---------- tables ----------
export class TableMesh {
  constructor(world, name, accent = 0) {
    this.world = world; this.name = name; this.accent = accent; this.cols = []; this.rows = new Map(); this.order = []; this.heads = [];
    this.group = new THREE.Group(); this.group.rotation.x = Math.PI / 2; this.tx = 0; this.ty = 5; this.tz = 0; this.ts = 1; this.sw = 2 * CW; this.sd = HH + 3 * RH; this.born = 0; this.building = false; this.spawn = performance.now();
    const [dark] = ACCENTS[accent % ACCENTS.length];
    this.slab = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(0x2e5877, .6, .1)); this.slab.castShadow = true; this.slab.receiveShadow = true;
    this.slab.position.y = .15; this.rim = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(new THREE.Color(dark), .55, .15)); this.rim.position.y = .05; this.rim.castShadow = true;
    this.group.add(this.slab, this.rim);
    this.slotTex = tex(PX, PY, (g, w, h) => { g.setLineDash([16, 12]); g.strokeStyle = '#a9d6f7'; g.lineWidth = 5; rr(g, 4, 4, w - 8, h - 8, 14); g.stroke(); });
    this.slotTex.wrapS = THREE.RepeatWrapping; this.slotTex.repeat.set(2, 1);
    this.slots = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic(this.slotTex, { opacity: .55 })); m.rotation.x = -Math.PI / 2; m.position.y = .312; this.group.add(m); return m; });
    this.signTex = tex(512, 160, () => {});
    this.sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .81), basic(this.signTex)); this.sign.rotation.x = -Math.PI / 2; this.sign.position.set(0, .32, -.62);
    this.post = new THREE.Mesh(new THREE.BoxGeometry(.08, .7, .08), mat(0x6c7f8f, .5, .4)); this.post.position.set(0, .45, -.3); this.post.castShadow = true;
    this.post.visible = false; this.group.add(this.sign, this.post);
    world.scene.add(this.group); this.drawSign(); this.layoutSlots(); this.settle(true);
  }
  get W() { return Math.max(2, this.cols.length) * CW; }
  get D() { return HH + Math.max(3, this.order.length + 2) * RH; }
  slotZ(k) { return HH + RH * (k + .5); }
  colX(i) { return -this.W / 2 + CW * (i + .5); }
  drawSign() {
    const label = `${this.name}`, info = `${this.order.length} row${this.order.length === 1 ? '' : 's'} · ${this.cols.length} col${this.cols.length === 1 ? '' : 's'}`;
    const [dark, pale] = ACCENTS[this.accent % ACCENTS.length];
    redraw(this.signTex, (g, w, h) => {
      g.fillStyle = '#f7fafc'; rr(g, 3, 3, w - 6, h - 6, 24); g.fill(); g.strokeStyle = dark; g.lineWidth = 8; rr(g, 3, 3, w - 6, h - 6, 24); g.stroke();
      g.fillStyle = dark; g.textAlign = 'center'; g.textBaseline = 'middle'; fit(g, label, w - 60, 66); g.fillText(label, w / 2, 62);
      g.fillStyle = MUTED; g.font = `700 32px ${MONO}`; g.fillText(info, w / 2, 124);
    });
  }
  setName(n) { this.name = n; this.drawSign(); }
  layoutSlots() {
    const empties = [0, 1, 2].map(i => this.order.length + i);
    this.slots.forEach((m, i) => { m.position.set(0, .312, this.slotZ(empties[i])); m.scale.set(this.W - .06, RH * .88, 1); m.visible = this.cols.length > 0 && !this.building && (this.order.length + i < Math.max(3, this.order.length + 2)); });
    this.slotTex.repeat.set(Math.max(2, this.cols.length), 1);
    this.slots.forEach((m, i) => { m.material.opacity = [.6, .35, .18][i]; });
  }
  headPlate(def) {
    const g = new THREE.Group(), [dark] = ACCENTS[this.accent % ACCENTS.length];
    const t = tex(PX, 150, () => {});
    const box = new THREE.Mesh(new THREE.BoxGeometry(CW * .94, .22, HH * .92), mat(new THREE.Color(dark), .45, .2)); box.castShadow = true; box.position.y = .11;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(CW * .94, HH * .92), basic(t)); face.rotation.x = -Math.PI / 2; face.position.y = .226;
    g.add(box, face);
    const head = { group: g, tex: t, def, x: 0, tx: 0, dropAt: 0, y: 0, fall: 0 };
    this.drawHead(head); return head;
  }
  drawHead(h) {
    const d = h.def, [dark] = ACCENTS[this.accent % ACCENTS.length];
    redraw(h.tex, (g, w, hh) => {
      g.fillStyle = dark; rr(g, 2, 2, w - 4, hh - 4, 16); g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; rr(g, 6, 6, w - 12, hh - 12, 12); g.stroke();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; fit(g, d.name, w - 50, 46); g.fillText(clip(d.name, 14), w / 2, 40);
      g.fillStyle = '#bfe6ff'; g.font = `700 26px ${MONO}`; g.fillText(d.type || '', w / 2, 84);
      let x = 24; const chip = (txt, bg, fg = '#12303f') => { g.font = `800 19px ${MONO}`; const cw = g.measureText(txt).width + 16; g.fillStyle = bg; rr(g, x, 104, cw, 30, 8); g.fill(); g.fillStyle = fg; g.textAlign = 'left'; g.fillText(txt, x + 8, 120); x += cw + 8; };
      if (d.pk) chip('KEY', '#ffd75e'); if (d.nn) chip('NOT NULL', '#ffb3a7'); if (d.uniq) chip('UNIQUE', '#c4ecd5'); if (d.ref) chip('→ ' + d.ref.table, '#e0cdf7');
    });
  }
  addCol(def, { instant = false, at = 0 } = {}) {
    this.cols.push(def); const h = this.headPlate(def); h.tx = this.colX(this.cols.length - 1); h.x = h.tx; this.heads.push(h);
    this.group.add(h.group); h.group.position.set(h.x, .3, HH / 2); h.fall = instant ? 1 : 0; h.dropAt = at;
    if (!instant) h.group.visible = false;
    this.afterCols(); return h;
  }
  insertColAt(idx, def) { /* only used when rebuilding */ this.cols.splice(idx, 0, def); const h = this.headPlate(def); this.heads.splice(idx, 0, h); this.group.add(h.group); h.fall = 1; this.afterCols(); }
  removeCol(idx) { this.cols.splice(idx, 1); const [h] = this.heads.splice(idx, 1); h.group.removeFromParent(); this.rows.forEach(r => { r.vals.splice(idx, 1); }); this.afterCols(); return h; }
  afterCols() {
    this.heads.forEach((h, i) => { h.tx = this.colX(i); });
    this.rows.forEach(r => r.rebuild()); this.layoutSlots(); this.drawSign(); this.world.layout();
  }
  addRow(rid, vals, { instant = true } = {}) {
    const r = new RowMesh(this, rid, vals); this.rows.set(rid, r); this.order.push(rid);
    r.tz = this.slotZ(this.order.length - 1); r.z = r.tz; r.group.position.set(0, .3 + .08, r.z); this.group.add(r.group);
    this.layoutSlots(); this.drawSign(); this.world.layout(); return r;
  }
  removeRow(rid) {
    const r = this.rows.get(rid); if (!r) return; r.dispose(); this.rows.delete(rid); this.order = this.order.filter(x => x !== rid);
    this.compact(); this.layoutSlots(); this.drawSign(); this.world.layout();
  }
  compact() { this.order.forEach((rid, k) => { this.rows.get(rid).tz = this.slotZ(k); }); }
  cellWorld(rid, col) { // center of a cell on the top face
    this.group.updateMatrixWorld(true); const r = this.rows.get(rid);
    return this.group.localToWorld(V(this.colX(col), .42 + (r?.lift || 0), r ? r.z : this.slotZ(this.order.length)));
  }
  rowWorld(rid) { const r = this.rows.get(rid); this.group.updateMatrixWorld(true); return this.group.localToWorld(V(0, .42 + (r?.lift || 0), r ? r.z : 0)); }
  headWorld(col) { this.group.updateMatrixWorld(true); return this.group.localToWorld(V(this.colX(col), .5, HH / 2)); }
  leftWorld(z = 0) { this.group.updateMatrixWorld(true); return this.group.localToWorld(V(-this.W / 2 - .2, 0, z)); }
  rightWorld(z = 0) { this.group.updateMatrixWorld(true); return this.group.localToWorld(V(this.W / 2 + .2, 0, z)); }
  settle(instant) {}
  update(now, dt) {
    const k = 1 - Math.exp(-dt * 7), ks = 1 - Math.exp(-dt * 5);
    this.sw += (this.W + .5 - this.sw) * ks; this.sd += (this.D + .35 - this.sd) * ks;
    this.slab.scale.set(this.sw, .3, this.sd); this.slab.position.set(0, .15, this.sd / 2 - .2);
    this.rim.scale.set(this.sw + .16, .1, this.sd + .16); this.rim.position.set(0, .05, this.sd / 2 - .2);
    this.sign.position.set(0, .32, -.62);
    this.heads.forEach((h, i) => {
      h.x += (h.tx - h.x) * k;
      if (h.fall < 1 && h.dropAt && now >= h.dropAt) { h.group.visible = true; h.fall = Math.min(1, (now - h.dropAt) / 520); }
      const f = h.fall; const y = .3 + (1 - Math.min(1, outBack(f))) * 3.2 * (h.fall < 1 ? 1 : 0);
      h.group.position.set(h.x, y, HH / 2); h.group.visible = !h.hidden && (h.fall > 0 || h.dropAt === 0);
    });
    this.rows.forEach(r => {
      r.z += (r.tz - r.z) * k; r.lift += (r.tlift - r.lift) * k;
      if (!r.flying) r.group.position.set(0, .38 + r.lift, r.z);
      r.group.scale.setScalar(r.scale);
    });
    const born = clamp((now - this.spawn) / 600); this.group.scale.setScalar(Math.max(.001, this.ts * (this.born ? 1 : outBack(born))));
    this.group.position.x += (this.tx - this.group.position.x) * k; this.group.position.y += (this.ty - this.group.position.y) * k; this.group.position.z += (this.tz - this.group.position.z) * k;
  }
  dispose() { this.rows.forEach(r => r.dispose()); this.heads.forEach(h => h.tex.dispose()); this.signTex.dispose(); this.slotTex.dispose(); this.group.removeFromParent(); }
}

// ---------- walkers ----------
const part = (geo, material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; return m; };
function eyes(g, y, z, sep = .12) {
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .3 }), pupil = new THREE.MeshBasicMaterial({ color: 0x0c1a24 });
  const out = [];
  [-sep, sep].forEach(x => { const e = part(new THREE.SphereGeometry(.085, 16, 12), white, x, y, z); const p = part(new THREE.SphereGeometry(.045, 12, 8), pupil, x, y, z + .06); p.castShadow = false; g.add(e, p); out.push(p); });
  return out;
}
export function makeBin(scale = 1) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const green = mat(0x2fa36b, .5, .1), dark = mat(0x1d6e49, .55, .1);
  const can = part(new THREE.CylinderGeometry(.42, .34, .86, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x2fa36b, roughness: .5, metalness: .1, side: THREE.DoubleSide }), 0, .78, 0);
  const bottom = part(new THREE.CylinderGeometry(.34, .34, .05, 24), dark, 0, .36, 0);
  const inner = part(new THREE.CylinderGeometry(.4, .33, .84, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x0f3b29, roughness: .8, side: THREE.BackSide }), 0, .78, 0); inner.castShadow = false;
  const rim = part(new THREE.TorusGeometry(.42, .035, 8, 28), dark, 0, 1.21, 0); rim.rotation.x = Math.PI / 2;
  const stripe = part(new THREE.CylinderGeometry(.41, .39, .08, 24, 1, true), mat(0xffffff, .5, 0, { side: THREE.DoubleSide }), 0, .98, 0);
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, 1.23, -.4);
  const lid = part(new THREE.CylinderGeometry(.44, .44, .06, 24), dark, 0, 0, .4); lidPivot.add(lid);
  const legs = [-.16, .16].map(x => { const lp = new THREE.Group(); lp.position.set(x, .36, 0); lp.add(part(new THREE.BoxGeometry(.13, .34, .15), mat(0x24324a, .6, .2), 0, -.17, 0)); lp.add(part(new THREE.BoxGeometry(.18, .07, .26), mat(0x0f1a2a, .6, .2), 0, -.35, .05)); g.add(lp); return lp; });
  const faceGrp = new THREE.Group(); body.add(faceGrp);
  const pupils = eyes(faceGrp, .98, .38, .15);
  const mouth = part(new THREE.BoxGeometry(.2, .035, .02), new THREE.MeshBasicMaterial({ color: 0x0c1a24 }), 0, .83, .39); mouth.castShadow = false; faceGrp.add(mouth);
  body.add(can, bottom, inner, rim, stripe, lidPivot);
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), basic(tex(128, 128, (c, w, h) => { c.fillStyle = '#ffffff'; rr(c, 6, 6, w - 12, h - 12, 20); c.fill(); c.strokeStyle = '#2fa36b'; c.lineWidth = 8; c.beginPath(); c.arc(64, 64, 34, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(34, 64); c.lineTo(94, 64); c.stroke(); c.fillStyle = '#2fa36b'; c.font = '800 20px ' + MONO; c.textAlign = 'center'; c.fillText('DEL', 64, 112); })));
  badge.position.set(0, .62, .37); badge.rotation.x = -.06; body.add(badge);
  g.scale.setScalar(scale);
  return { kind: 'bin', group: g, body, legs, lidPivot, pupils, mouthY: 1.3 * scale, open: 0, phase: 0, scale, set lid(v) { lidPivot.rotation.x = -v * 1.7; } };
}
export function makeBot(scale = 1) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const blue = mat(0x2d7fb8, .4, .3), dark = mat(0x1c3347, .5, .4), light = mat(0xdfeaf2, .4, .2);
  const torso = part(new THREE.BoxGeometry(.66, .6, .46), blue, 0, .86, 0);
  const panel = part(new THREE.BoxGeometry(.4, .24, .02), new THREE.MeshBasicMaterial({ color: 0x9fe8ff }), 0, .86, .24); panel.castShadow = false;
  const head = new THREE.Group(); head.position.set(0, 1.4, 0);
  const skull = part(new THREE.BoxGeometry(.54, .38, .44), light, 0, 0, 0);
  const visor = part(new THREE.BoxGeometry(.42, .17, .02), new THREE.MeshBasicMaterial({ color: 0x0e2230 }), 0, .02, .225); visor.castShadow = false;
  const eyeL = part(new THREE.BoxGeometry(.07, .09, .02), new THREE.MeshBasicMaterial({ color: 0x7dffd0 }), -.1, .02, .24), eyeR = part(new THREE.BoxGeometry(.07, .09, .02), new THREE.MeshBasicMaterial({ color: 0x7dffd0 }), .1, .02, .24); eyeL.castShadow = eyeR.castShadow = false;
  const ant = part(new THREE.CylinderGeometry(.02, .02, .22, 8), dark, .0, .3, 0), bulb = part(new THREE.SphereGeometry(.06, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd75e }), 0, .44, 0);
  head.add(skull, visor, eyeL, eyeR, ant, bulb);
  const legs = [-.15, .15].map(x => { const lp = new THREE.Group(); lp.position.set(x, .56, 0); lp.add(part(new THREE.BoxGeometry(.15, .5, .17), dark, 0, -.25, 0)); lp.add(part(new THREE.BoxGeometry(.2, .08, .3), mat(0x0f1a2a, .6, .2), 0, -.52, .05)); g.add(lp); return lp; });
  const arms = [-1, 1].map(s => {
    const a = new THREE.Group(); a.position.set(s * .42, 1.06, 0); a.add(part(new THREE.BoxGeometry(.12, .5, .12), dark, 0, -.25, 0));
    const claw = new THREE.Group(); claw.position.set(0, -.52, 0); const c1 = part(new THREE.BoxGeometry(.05, .2, .06), light, -.05, -.08, 0), c2 = part(new THREE.BoxGeometry(.05, .2, .06), light, .05, -.08, 0); claw.add(c1, c2); a.add(claw);
    body.add(a); return { group: a, claw, c1, c2 };
  });
  body.add(torso, panel, head);
  const jet = part(new THREE.ConeGeometry(.2, .5, 12), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: .85 }), 0, .0, 0); jet.rotation.x = Math.PI; jet.castShadow = false; jet.visible = false; g.add(jet);
  g.scale.setScalar(scale);
  return { kind: 'bot', jet, group: g, body, legs, arms, head, scale, phase: 0, mouthY: 1.0 * scale };
}
// leg swing + hop while moving; amp 0 stands still
export function pose(actor, phase, amp) {
  const s = Math.sin(phase) * .7 * amp;
  actor.legs[0].rotation.x = s; actor.legs[1].rotation.x = -s;
  actor.body.position.y = Math.abs(Math.sin(phase)) * .05 * amp;
  if (actor.arms) { actor.arms[0].group.rotation.x = -s * .6; actor.arms[1].group.rotation.x = s * .6; }
}
export function disposeActor(a) { a.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); a.group.removeFromParent(); }
