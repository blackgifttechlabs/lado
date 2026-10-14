import { TimedWorld, THREE } from '../../cpp/three/timed-world.js?v=20261014-cs-11';
import { tex, redraw, rr, INK, MUTED } from '../../cpp/three/office-kit.js?v=20261014-cs-11';
import { sqlModel, previewStatement, show } from '../topics/sql-model.js?v=20261014-cs-11';
import { MONO, CW, RH, HH, PX, PY, ACCENTS, mat, clamp, lerp, inOut, outCubic, outBack, V, tile, tileTex, setTileOpacity, TableMesh, makeBin, makeBot, pose, disposeActor } from './sql-kit.js?v=20261014-cs-11';

// The SQL scenes. Tables lie on desks. Every command has its own little show:
//   CREATE builds the table piece by piece, INSERT drops a row in and fills the cells,
//   UPDATE flips the changed cells, DELETE walks a bin to the rows which are broken up and thrown in,
//   SELECT sends a fetch-bot to copy the data into a tray that is shipped to the computer screen.
const key = n => String(n).toLowerCase();
const lerpAngle = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; };
const sigOf = db => JSON.stringify(db.tables.map(t => [t.name, t.cols.map(c => c.name), t.rows.map(r => r.v)]));

export class SqlWorld extends TimedWorld {
  constructor(mode) {
    super(); this.mode = mode; this.cam = { x: 0, y: 3.3, z: 11.4, ty: 2.7, tz: 0 }; this.sway = .3;
    this.tables = new Map(); this.actors = new Set(); this.notes = []; this.screenAt = 0; this.shownSig = ''; this.pv = null; this.lastDb = null;
    this.scene.fog = null;
    this.wideFn = a => Math.max(1, Math.pow(1.5 / a, .55));
  }
  // how many world units fit across the screen at the tables
  visibleWidth() { const a = this.camera.aspect || 1.6, wide = this.wideFn(a); return 2 * 10.4 * wide * Math.tan(19 * Math.PI / 180) * a * .92; }
  fit() { const el = this.el, key = el.clientWidth + 'x' + el.clientHeight; if (key === this.sizeKey && this.tables) return; this.sizeKey = key; super.fit(); if (this.tables?.size) this.layout(); }
  // ---------- timeline: nested tasks must run too when everything is forced to finish ----------
  finishAll() { let n = 0; while (this.timeline.length && n++ < 30) { const list = this.timeline; this.timeline = []; list.forEach(t => { t.fn?.(1); t.done?.(); }); } }
  runTimeline(now) {
    const list = this.timeline; this.timeline = []; const keep = [];
    for (const t of list) {
      if (now < t.a) { keep.push(t); continue; }
      const p = t.b > t.a ? clamp((now - t.a) / (t.b - t.a)) : 1; t.fn?.(p, now);
      if (p >= 1) { t.fn?.(1); t.done?.(); } else keep.push(t);
    }
    this.timeline = [...keep, ...this.timeline];
  }
  sched(ms, fn) { this.tl(ms, 1, null, fn); }
  tbl(name) { return this.tables.get(key(name)); }
  emit(m) { this.scene.add(m); this.temp.add(m); return m; }
  spawn(actor, pos) { this.scene.add(actor.group); this.actors.add(actor); if (pos) actor.group.position.copy(pos); return actor; }
  // ---------- state ----------
  clearAll() {
    this.finishAll(); [...this.temp].forEach(m => this.kill(m)); this.actors.forEach(disposeActor); this.actors.clear();
    this.tables.forEach(t => t.dispose()); this.tables.clear(); this.notes.forEach(n => { this.scene.remove(n.sprite); }); this.notes = []; this.clearGhost();
  }
  reset() { this.clearAll(); this.started = false; }
  rebuild(db, instant = true) {
    this.clearAll(); this.lastDb = db; this.shownSig = sigOf(db);
    db.tables.forEach((td, i) => { const t = this.makeTable(td.name, i); td.cols.forEach(c => t.addCol(c, { instant: true })); td.rows.forEach(r => t.addRow(r.id, r.v)); t.born = 1; });
    this.layout(true);
  }
  makeTable(name, accent) {
    const t = new TableMesh(this, name, accent ?? this.tables.size); this.tables.set(key(name), t); this.layout(); return t;
  }
  layout(jump) {
    const list = [...this.tables.values()]; if (!list.length) return;
    const gap = .9, widths = list.map(t => t.W + .6); const total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    const maxD = Math.max(...list.map(t => t.D + .5));
    const s = Math.min(1.05, this.visibleWidth() / total, 4.5 / maxD); let x = -total * s / 2;
    list.forEach((t, i) => {
      t.ts = s; t.tx = x + widths[i] * s / 2; t.ty = 5.0; t.tz = -1.2; x += (widths[i] + gap) * s;
      if (jump) { t.group.position.set(t.tx, t.ty, t.tz); t.group.scale.setScalar(s); }
    });
  }
  settleTo(db) { if (this.lastDb && sigOf(db) === this.shownSigLive()) { this.lastDb = db; return; } this.rebuild(db); }
  shownSigLive() { return sigOf({ tables: [...this.tables.values()].map(t => ({ name: t.name, cols: t.cols, rows: t.order.map(id => ({ v: t.rows.get(id).vals })) })) }); }
  // ---------- showing a step ----------
  plan() { this.replaying = true; return { travel: 0, reaction: 900 }; }
  apply(frame, prev, jump) {
    this.finishAll(); [...this.temp].forEach(m => this.kill(m)); this.actors.forEach(disposeActor); this.actors.clear(); this.clearGhost();
    this.frameData = frame; this.screenAt = 0;
    if (!prev || jump || frame.kind === 'start') { this.rebuild(frame.db); if (!jump) { this.step.reaction = 500; this.stepMs = 500 / this.speed + 100; } return; }
    this.instant = false;
    const evs = frame.events || []; this.fast = evs.length > 8 ? 1.7 : evs.length > 4 ? 1.35 : 1;
    let ofs = 0;
    evs.forEach((e, i) => { ofs += this.handle(e, evs, i, ofs, frame) || 0; });
    this.sched(ofs + 40, () => this.settleTo(frame.db));
    const sp = this.speed * this.fast;
    this.screenAt = frame.screen?.type === 'rows' ? Math.max(0, this.shipEnd || ofs) / sp : Math.max(0, ofs - 350) / sp;
    this.step.printDelay = 0; this.step.reaction = ofs + 500; this.stepMs = this.step.reaction / sp + 160 / this.speed;
    if (frame.kind === 'error') this.tag(String(frame.label).slice(0, 26), 'bad');
  }
  handle(e, evs, i, ofs) {
    switch (e.t) {
      case 'create': return this.onCreate(e, ofs);
      case 'insert': return this.onInsert(e, ofs, evs);
      case 'update': return this.onUpdate(e, ofs);
      case 'delete': return this.onDelete(e, ofs);
      case 'drop': return this.onDrop(e, ofs);
      case 'alter': return this.onAlter(e, ofs);
      case 'select': return this.onSelect(e, ofs);
      case 'error': return this.onError(e, ofs);
      case 'note': this.sched(ofs, () => this.note(e.text, V(0, 2, 0), 'info')); return 900;
    }
    return 0;
  }
  tagAnchor() { return V(0, 2.4, -1); }
  // ---------- small helpers ----------
  note(text, pos, tone = 'info', life = 1700) {
    const colors = { info: ['#e9f3fb', '#16456b'], good: ['#cdf3dc', '#13683c'], bad: ['#ffd4cc', '#a52a1f'], warn: ['#fff0b8', '#7a5a00'] }[tone];
    const t = tex(512, 128, (g, w, h) => { g.fillStyle = colors[0]; rr(g, 4, 4, w - 8, h - 8, 30); g.fill(); g.strokeStyle = colors[1]; g.lineWidth = 6; rr(g, 4, 4, w - 8, h - 8, 30); g.stroke(); g.fillStyle = colors[1]; g.textAlign = 'center'; g.textBaseline = 'middle'; let s = 46; g.font = `800 ${s}px ${MONO}`; while (g.measureText(text).width > w - 50 && s > 20) { s -= 2; g.font = `800 ${s}px ${MONO}`; } g.fillText(text, w / 2, h / 2 + 3); });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false })); sp.scale.set(2.6, .65, 1); sp.position.copy(pos); sp.position.x = clamp(sp.position.x, -2.5, 2.5); sp.renderOrder = 10;
    this.scene.add(sp); const n = { sprite: sp, born: performance.now(), life: life / this.speed, y0: pos.y }; this.notes.push(n);
  }
  fly(m, a, b, ofs, dur, { h = 1.2, spin = 0, s0 = null, s1 = null, done = null, ease = inOut, tilt = 0 } = {}) {
    const sa = s0 ?? m.scale.x, sb = s1 ?? m.scale.x;
    this.tl(ofs, dur, p => { const e = ease(p); m.position.set(lerp(a.x, b.x, e), lerp(a.y, b.y, e) + Math.sin(Math.PI * e) * h, lerp(a.z, b.z, e)); m.rotation.y = spin * e; m.rotation.x = tilt * Math.sin(Math.PI * e); m.scale.setScalar(lerp(sa, sb, e)); }, done);
  }
  walk(a, from, to, ofs, dur, face = 0, done) {
    const heading = Math.atan2(to.x - from.x, to.z - from.z) * .6;
    this.tl(ofs, dur, p => {
      const e = inOut(p), moving = p < .985; a.group.position.set(lerp(from.x, to.x, e), lerp(from.y, to.y, e), lerp(from.z, to.z, e));
      if (a.jet) { a.jet.visible = a.group.position.y > .25; a.jet.scale.y = .8 + Math.sin(p * 60) * .25; }
      pose(a, p * dur / 95, moving ? 1 : 0); a.group.rotation.y = lerpAngle(heading, face, clamp((p - .78) / .22));
    }, () => { pose(a, 0, 0); a.group.rotation.y = face; done?.(); });
  }
  offstageLeft(z = 0) { return V(-9.6, 0, z); }
  setRows(t, rids, state, { mark = null } = {}) { rids.forEach(id => { const r = t.rows.get(id); if (r) { r.set(state); if (mark !== null) r.setMark(mark); } }); }
  restore(t, ofs) { this.sched(ofs, () => t.rows.forEach(r => { r.set('idle'); r.setMark(''); r.hiAll?.(); Object.keys(r.cellHi).forEach(k => delete r.cellHi[k]); r.draw(); })); }
  // a thin light bar that sweeps along the rows; every row it crosses is judged
  scan(t, e, ofs, { yes = 'match', no = 'dim' } = {}) {
    const rows = t.order.filter(id => t.rows.has(id)), n = rows.length, matched = new Set(e.matched);
    if (!n) return 300;
    if (!e.where) { this.sched(ofs + 150, () => rows.forEach(id => { t.rows.get(id).set(yes); })); this.sched(ofs + 160, () => this.note('no WHERE: every row', t.rowWorld(rows[0]).add(V(0, 1.1, -.2)), 'warn')); return 700; }
    const bar = this.emit(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: .8 }))); bar.visible = false;
    const step = Math.min(210, Math.max(110, 1100 / n)), dur = n * step + 200;
    this.tl(ofs, dur, p => { bar.visible = p > 0 && p < 1; t.group.updateMatrixWorld(true); const z = lerp(HH, t.slotZ(n - 1) + RH * .5, clamp(p * dur / (n * step))); const w = t.group.localToWorld(V(0, .6, z)); bar.position.copy(w); bar.scale.set((t.W + .3) * t.ts, .09 * t.ts, .05); }, () => this.kill(bar));
    rows.forEach((id, k) => this.sched(ofs + k * step + 70, () => { const r = t.rows.get(id); if (!r) return; const ok = matched.has(id); r.set(ok ? yes : no); r.setMark(ok ? 'yes' : 'no'); }));
    return dur;
  }
  chunkAt(t, rid, col, state) {
    const r = t.rows.get(rid); const m = tile(show(r ? r.vals[col] : ''), { accent: t.accent }); m.scale.setScalar(t.ts); m.position.copy(t.cellWorld(rid, col)); this.emit(m); return m;
  }
  // ---------- CREATE ----------
  onCreate(e, ofs) {
    const t0 = this.tbl(e.table); let t;
    this.sched(ofs, () => { if (this.tbl(e.table)) return; t = this.makeTable(e.table, this.tables.size); t.born = 0; t.spawn = performance.now(); t.building = true; });
    const per = 470;
    e.cols.forEach((c, i) => {
      this.sched(ofs + 520 + i * per, () => { t = this.tbl(e.table); if (!t) return; const h = t.addCol(c, { instant: false, at: performance.now() + 20 }); h.group.visible = true; });
      this.sched(ofs + 520 + i * per + 300, () => { const tt = this.tbl(e.table); if (tt) { const h = tt.heads[i]; if (h && (c.pk || c.nn)) this.note(c.pk ? 'KEY: no two rows share it' : 'NOT NULL: must be filled', tt.headWorld(i).add(V(0, 1.2, 0)), c.pk ? 'warn' : 'bad', 1500); } });
    });
    const end = 520 + e.cols.length * per + 350;
    this.sched(ofs + end, () => { const tt = this.tbl(e.table); if (tt) { tt.building = false; tt.layoutSlots(); } });
    this.sched(ofs + end + 50, () => { const tt = this.tbl(e.table); if (tt) this.note('empty table, ready for rows', tt.headWorld(0).add(V(1.2, 1.7, 1.2)), 'good'); });
    return end + 800;
  }
  // ---------- INSERT ----------
  ensureTable(name) { return this.tbl(name); }
  onInsert(e, ofs, evs) {
    const quick = evs.filter(x => x.t === 'insert').length > 1, q = quick ? .6 : 1;
    const t = this.tbl(e.table); if (!t) return 0;
    let row; const n = e.values.length, given = e.given || [], order = [...given.slice().sort((a, b) => a - b), ...e.values.map((_, i) => i).filter(i => !given.includes(i))];
    this.sched(ofs, () => { row = t.addRow(e.rid, e.values.map(() => ''), { instant: false }); row.lift = 1.5; row.tlift = 0; row.group.position.set(0, .38 + 1.5, row.z); row.set('scan'); });
    this.sched(ofs + 380 * q, () => { if (row) { row.scale = 1.05; row.set('idle'); } });
    this.sched(ofs + 470 * q, () => { if (row) row.scale = 1; });
    order.forEach((ci, j) => {
      const at = ofs + (430 + j * 210) * q; const isGiven = given.includes(ci);
      this.sched(at, () => {
        const v = e.values[ci]; const chip = tile(isGiven ? show(v) : (v === null ? 'NULL' : show(v)), { kind: isGiven ? 'ghost' : 'result', accent: t.accent }); chip.scale.setScalar(t.ts);
        const to = t.cellWorld(e.rid, ci), from = to.clone().add(V(0, 1.5, 0)); this.emit(chip); chip.position.copy(from);
        this.tl(0, 300 * q, p => { chip.position.y = lerp(from.y, to.y + .1, p * p); }, () => { this.kill(chip); const rr_ = t.rows.get(e.rid); if (rr_) { rr_.setCell(ci, v); rr_.hi(ci, isGiven ? '#cdeedb' : '#ece2ff'); rr_.scale = 1.03; setTimeout(() => { if (rr_) { rr_.scale = 1; rr_.hi(ci, null); } }, 550); } });
      });
    });
    const end = (430 + order.length * 210 + 450) * q;
    if (!quick) this.sched(ofs + end - 150, () => { const r2 = t.rows.get(e.rid); if (r2) this.note('new row saved', t.rowWorld(e.rid).add(V(0, 1.0, .9)), 'good', 1300); });
    return end;
  }
  // ---------- UPDATE ----------
  onUpdate(e, ofs) {
    const t = this.tbl(e.table); if (!t) return 0;
    const scanDur = this.scan(t, e, ofs, { yes: 'match', no: 'dim' }); let d = scanDur + 250;
    const rows = e.changes.filter(c => t.rows.has(c.rid));
    if (!e.matched.length) { this.sched(ofs + scanDur, () => this.note('0 rows matched: nothing changes', t.rowWorld(t.order[0] ?? 0).add(V(0, 1.3, -.2)), 'warn')); this.restore(t, ofs + scanDur + 900); return scanDur + 1000; }
    rows.forEach((c, k) => {
      c.cells.forEach((cell, j) => {
        const at = ofs + scanDur + 250 + k * 330 + j * 140;
        this.sched(at, () => {
          const r = t.rows.get(c.rid); if (!r) return;
          const old = tile(show(cell.from), { accent: t.accent, kind: 'cell' }); old.scale.setScalar(t.ts); const p = t.cellWorld(c.rid, cell.col); this.emit(old); old.position.copy(p);
          this.tl(0, 380, q => { old.position.y = p.y + q * 1.1; old.rotation.x = q * 1.4; setTileOpacity(old, 1 - q); old.scale.setScalar(t.ts * (1 - q * .4)); }, () => this.kill(old));
          r.setCell(cell.col, ''); r.hi(cell.col, '#ffe9a8');
          this.sched(160, () => {
            const nw = tile(show(cell.to), { accent: t.accent, kind: 'ghost' }); nw.scale.setScalar(t.ts); this.emit(nw); const from = p.clone().add(V(0, 1.7, 0)); nw.position.copy(from);
            this.tl(0, 320, q => { nw.position.y = lerp(from.y, p.y + .1, q * q); }, () => { this.kill(nw); const r2 = t.rows.get(c.rid); if (r2) { r2.setCell(cell.col, cell.to); r2.hi(cell.col, '#cdeedb'); r2.scale = 1.04; setTimeout(() => { r2.scale = 1; }, 220); } });
          });
        });
      });
      d = Math.max(d, scanDur + 250 + k * 330 + c.cells.length * 140 + 700);
    });
    this.restore(t, ofs + d); this.sched(ofs + d - 100, () => this.note(`${e.matched.length} row${e.matched.length === 1 ? '' : 's'} changed`, t.rowWorld(e.matched[0]).add(V(0, 1.0, .9)), 'good', 1300));
    return d + 450;
  }
  // ---------- DELETE ----------
  binTarget(t, rids) {
    t.group.updateMatrixWorld(true);
    const zs = rids.map(id => t.rowWorld(id).z); const z = zs.length ? zs.reduce((a, b) => a + b, 0) / zs.length : 0;
    return V(t.leftWorld().x - 1.25 * Math.max(.7, t.ts), 0, t.group.position.z + 1.3);
  }
  onDelete(e, ofs) {
    const t = this.tbl(e.table); if (!t) return 0;
    const matched = e.matched.filter(id => t.rows.has(id));
    const scanDur = this.scan(t, e, ofs, { yes: 'danger', no: 'dim' });
    if (!matched.length) { this.sched(ofs + scanDur, () => this.note('0 rows matched: nothing deleted', t.rowWorld(t.order[0] ?? 0).add(V(0, 1.3, -.2)), 'warn')); this.restore(t, ofs + scanDur + 900); return scanDur + 1000; }
    const target = this.binTarget(t, matched), bin = this.spawn(makeBin(matched.length > 3 ? 1.1 : 1), this.offstageLeft(target.z + .6));
    bin.group.position.copy(this.offstageLeft(target.z + .6));
    this.walk(bin, this.offstageLeft(target.z + .6), target, ofs + 100, 1000, Math.PI * .38);
    const t0 = ofs + Math.max(1150, scanDur + 150); let at = t0;
    this.tl(t0 - 150, 260, p => { bin.lid = p; });
    const mouth = () => target.clone().add(V(0, bin.mouthY + .15, 0));
    matched.forEach((rid, k) => {
      const when = t0 + 200 + k * 360;
      this.sched(when, () => {
        const r = t.rows.get(rid); if (!r) return;
        const chunks = t.cols.map((_, i) => this.chunkAt(t, rid, i)); r.group.visible = false; t.removeRow(rid); const to = mouth();
        chunks.forEach((m, i) => {
          const p0 = m.position.clone();
          this.tl(0, 200, p => { m.position.set(p0.x + Math.sin(p * 46 + i * 2) * .045, p0.y + p * .18, p0.z); m.rotation.z = Math.sin(p * 32 + i) * .12 * p; });
          this.fly(m, p0.clone().add(V(0, .18, 0)), to.clone().add(V((i % 3 - 1) * .08, 0, 0)), 200 + i * 75, 620, { h: 1.1 + (i % 2) * .35, spin: (i % 2 ? 1 : -1) * (2.4 + i * .5), s1: m.scale.x * .3, done: () => { this.kill(m); bin.body.scale.set(1.08, .9, 1.08); this.sched(110, () => bin.body.scale.set(1, 1, 1)); } });
        });
      });
      at = when + 200 + t.cols.length * 75 + 700;
    });
    this.sched(at, () => { bin.lid = 0; });
    this.tl(at, 300, p => { bin.lid = 1 - p; }, () => { bin.body.position.y = 0; });
    this.sched(at + 250, () => this.note(`${matched.length} row${matched.length === 1 ? '' : 's'} thrown away`, target.clone().add(V(0, 2.3, 0)), 'bad', 1500));
    this.tl(at + 150, 300, p => { bin.group.position.y = Math.sin(p * Math.PI) * .22; });
    this.walk(bin, target, this.offstageLeft(target.z + .3), at + 700, 900, -Math.PI * .5, () => { this.actors.delete(bin); disposeActor(bin); });
    this.restore(t, at);
    return at + 1650 - ofs;
  }
  // ---------- DROP ----------
  onDrop(e, ofs) {
    const t = this.tbl(e.table); if (!t) return 0;
    const rids = [...t.order], target = this.binTarget(t, rids); target.z = clamp(target.z, -1, 1.2);
    target.z += .5; const bin = this.spawn(makeBin(1.3), this.offstageLeft(target.z)); target.x -= .45;
    this.walk(bin, this.offstageLeft(target.z), target, ofs, 1100, Math.PI * .38);
    const t0 = ofs + 1200; this.tl(t0 - 200, 300, p => { bin.lid = p; });
    this.sched(t0 - 100, () => this.note(`DROP: the whole table goes, with all ${rids.length} rows`, V(0, 6.0, 1.0), 'bad', 2400));
    const mouth = () => target.clone().add(V(0, bin.mouthY + .2, 0)); let k = 0;
    const pieces = [];
    t.heads.forEach((h, i) => pieces.push({ text: h.def.name, kind: 'head', pos: () => t.headWorld(i) }));
    rids.forEach(id => t.cols.forEach((c, i) => pieces.push({ text: show(t.rows.get(id).vals[i]), kind: 'cell', pos: () => t.cellWorld(id, i) })));
    const stag = Math.min(110, 1600 / Math.max(1, pieces.length));
    this.sched(t0, () => { t.rows.forEach(r => { r.group.visible = false; }); t.heads.forEach(h => { h.hidden = true; h.group.visible = false; }); });
    pieces.forEach((pc, n) => {
      this.sched(t0 + 40, () => {
        const m = tile(pc.text, { kind: pc.kind, accent: t.accent }); m.scale.setScalar(t.ts); this.emit(m); const p0 = pc.pos(); m.position.copy(p0);
        this.fly(m, p0, mouth(), n * stag + 150, 650, { h: 1.2 + (n % 3) * .3, spin: (n % 2 ? 1 : -1) * (2 + n * .2), s1: m.scale.x * .3, done: () => { this.kill(m); bin.body.scale.set(1.07, .92, 1.07); this.sched(90, () => bin.body.scale.set(1, 1, 1)); } });
      });
    });
    const end = t0 + pieces.length * stag + 900;
    this.tl(end - 600, 600, p => { t.ts2 = 1 - p; t.group.scale.setScalar(Math.max(.001, t.ts * (1 - p))); }, () => { t.dispose(); this.tables.delete(key(t.name)); this.layout(); });
    this.tl(end, 300, p => { bin.lid = 1 - p; });
    this.walk(bin, target, this.offstageLeft(target.z), end + 350, 1000, -Math.PI * .5, () => { this.actors.delete(bin); disposeActor(bin); });
    return end + 1450 - ofs;
  }
  // ---------- ALTER ----------
  onAlter(e, ofs) {
    const t = this.tbl(e.table); if (!t) return 0;
    if (e.op === 'rename') { this.tl(ofs, 500, p => { t.sign.scale.x = Math.cos(p * Math.PI * 2); if (p > .5 && t.name !== e.to) t.setName(e.to); }, () => { t.sign.scale.x = 1; }); this.sched(ofs + 100, () => this.note(`now called ${e.to}`, t.headWorld(0).add(V(1.5, 1.8, .2)), 'good')); return 1100; }
    if (e.op === 'renamecol') { const h = t.heads[e.idx]; if (h) this.tl(ofs, 500, p => { h.group.rotation.x = Math.sin(p * Math.PI * 2) * .7; if (p > .5) { h.def = { ...h.def, name: e.to }; t.drawHead(h); } }, () => { h.group.rotation.x = 0; }); this.sched(ofs + 100, () => this.note(`column is now ${e.to}`, t.headWorld(e.idx).add(V(0, 1.4, 0)), 'good')); return 1100; }
    if (e.op === 'add') {
      this.sched(ofs, () => { const h = t.addCol({ name: e.col.name, type: e.col.type, nn: e.col.nn, pk: false }, { instant: false, at: performance.now() + 20 }); h.group.visible = true; t.rows.forEach(r => { r.vals.push(e.col.def === undefined || e.col.def === null ? null : e.col.def); r.draw(); r.scale = 1.05; setTimeout(() => { r.scale = 1; }, 280); }); });
      this.sched(ofs + 700, () => this.note(e.col.def !== undefined && e.col.def !== null ? `every row gets ${show(e.col.def)}` : 'old rows get NULL (empty)', t.headWorld(t.cols.length - 1).add(V(0, 1.5, .8)), 'info', 1800));
      return 1700;
    }
    // drop column: its plate and cells break off into a small bin
    const idx = e.idx, target = V(t.rightWorld().x + 1.1, 0, t.group.position.z + 1.1), bin = this.spawn(makeBin(.85), V(9.6, 0, target.z));
    this.walk(bin, V(9.6, 0, target.z), target, ofs, 900, -Math.PI * .38); this.tl(ofs + 700, 250, p => { bin.lid = p; });
    this.sched(ofs + 1000, () => {
      const items = [{ text: t.heads[idx]?.def.name || e.col, kind: 'head', pos: t.headWorld(idx) }, ...t.order.map(id => ({ text: show(t.rows.get(id).vals[idx]), kind: 'cell', pos: t.cellWorld(id, idx) }))];
      const h = t.removeCol(idx); const to = target.clone().add(V(0, bin.mouthY + .15, 0));
      items.forEach((it, n) => { const m = tile(it.text, { kind: it.kind, accent: t.accent }); m.scale.setScalar(t.ts); this.emit(m); m.position.copy(it.pos); this.fly(m, it.pos, to, n * 90, 600, { h: 1.1, spin: 2 + n * .3, s1: m.scale.x * .3, done: () => { this.kill(m); bin.body.scale.set(1.08, .9, 1.08); this.sched(90, () => bin.body.scale.set(1, 1, 1)); } }); });
    });
    const end = 1000 + (t.order.length + 1) * 90 + 700; this.tl(ofs + end, 250, p => { bin.lid = 1 - p; });
    this.walk(bin, target, V(9.6, 0, target.z), ofs + end + 300, 900, Math.PI * .5, () => { this.actors.delete(bin); disposeActor(bin); });
    return end + 1300;
  }
  // ---------- errors ----------
  onError(e, ofs) {
    const t = e.table ? this.tbl(e.table) : null;
    if (e.rejected && t) {
      const rj = e.rejected, rid = -1; let row;
      this.sched(ofs, () => { row = t.addRow(rid, rj.values.map(() => ''), { instant: false }); row.lift = 1.5; row.tlift = 0; row.group.position.set(0, .38 + 1.5, row.z); });
      rj.values.forEach((v, i) => this.sched(ofs + 380 + i * 90, () => { const r = t.rows.get(rid); if (r) r.setCell(i, v); }));
      const at = ofs + 380 + rj.values.length * 90 + 150;
      this.sched(at, () => { const r = t.rows.get(rid); if (r) { r.set('reject'); } this.note(e.msg, t.rowWorld(rid).add(V(0, 1.2, .2)), 'bad', 2600); });
      this.tl(at + 150, 520, p => { const r = t.rows.get(rid); if (r) r.group.position.x = Math.sin(p * 40) * .08 * (1 - p); });
      this.tl(at + 900, 520, p => { const r = t.rows.get(rid); if (r) { r.tlift = 2.6 * p; r.scale = 1 - p * .9; } }, () => { t.removeRow(rid); });
      return at + 1500 - ofs;
    }
    this.sched(ofs, () => {
      const anchor = t ? t.headWorld(0).add(V(1.2, 1.4, 0)) : V(0, 2.2, 0); this.note(e.msg, anchor, 'bad', 3200);
      if (t) { t.rows.forEach(r => r.set('reject')); setTimeout(() => t.rows.forEach(r => r.set('idle')), 900); }
      else { const q = tile('?', { kind: 'head', accent: 0 }); q.scale.setScalar(1.3); this.emit(q); q.position.set(0, 1.6, 0); this.tl(0, 900, p => { q.position.y = 1.6 + Math.sin(p * Math.PI) * .2; q.rotation.z = Math.sin(p * 30) * .2 * (1 - p); setTileOpacity(q, 1 - Math.max(0, p - .6) * 2.5); }, () => this.kill(q)); }
    });
    return 1500;
  }
  // ---------- SELECT ----------
  trayCell(tr, r, c) { return V(tr.center.x - tr.W * tr.s / 2 + (c + .5) * CW * tr.s, tr.top - (HH * tr.s + (r + .5) * RH * tr.s), tr.center.z + .13); }
  trayNote(tr) { return V(-(tr.W * tr.s / 2) - 1.4, 1.5, tr.center.z + .6); }
  trayHead(tr, c) { return V(tr.center.x - tr.W * tr.s / 2 + (c + .5) * CW * tr.s, tr.top - HH * tr.s / 2, tr.center.z + .13); }
  makeTray(nCols, nRows) {
    const W = Math.max(2, nCols) * CW, s = Math.min(.72, 6.6 / W, 2.5 / (HH + Math.max(1, nRows) * RH));
    const D = (HH + Math.max(1, nRows) * RH) * s, top = 2.55, zc = 2.2;
    const g = new THREE.Group(); g.position.set(0, top - D / 2, zc);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W * s + .3, D + .3, .1), new THREE.MeshStandardMaterial({ color: 0xb9dcf5, transparent: true, opacity: .32, roughness: .15, metalness: .1 })); slab.castShadow = true;
    g.add(slab); this.scene.add(g); this.temp.add(g); g.scale.setScalar(.001);
    return { group: g, center: V(0, top - D / 2, zc), top, W, s, D, slab, tiles: [], heads: [] };
  }
  onSelect(e, ofs) {
    const t = e.primary ? this.tbl(e.primary) : null; const nC = e.cols.length, nPre = e.pre.length;
    const tr = this.makeTray(nC, nPre); let d = 0;
    const bot = this.spawn(makeBot(1), V(-9.6, 0, 0));
    const botTarget = t ? V(t.leftWorld().x - 1.05 * Math.max(.7, t.ts), 0, t.group.position.z + .9) : V(-4, 0, 0.5);
    const mode = e.mode;
    if (t) { const midRid = t.order[Math.floor(t.order.length / 2)]; const yy = mode === 'columns' || mode === 'cells' ? t.headWorld(0).y : (midRid !== undefined ? t.rowWorld(midRid).y : t.headWorld(0).y); botTarget.y = clamp(yy - 1.1, 0, 3.6); }
    if (t && mode === 'join') { botTarget.x = t.leftWorld().x - .6; botTarget.y = clamp(t.headWorld(0).y - 2.2, 0, 3); }
    this.walk(bot, V(-9.6, 0, botTarget.z), botTarget, ofs, 1100, Math.PI * .4);
        const t0 = ofs + 1050; const armUp = (on, at) => this.tl(at, 300, p => { bot.arms.forEach(a => { a.group.rotation.x = lerp(on ? 0 : -1.25, on ? -1.25 : 0, p); a.group.rotation.z = (on ? p : 1 - p) * (a === bot.arms[0] ? -.15 : .15); }); });
    armUp(true, t0 - 100);
    const grid = []; // grid[r][c] = tile mesh
    const spawnAt = (text, pos, kind = 'cell', accent = t?.accent ?? 0, sc = t?.ts ?? 1) => { const m = tile(text, { kind, accent }); m.scale.setScalar(sc); this.emit(m); m.position.copy(pos); return m; };
    // header tiles in the tray, one per result column
    const trayHeads = e.cols.map((c, ci) => {
      const srcT = c.src ? this.tbl(c.src.table) : null; const from = srcT && srcT.heads[c.src.idx] ? srcT.headWorld(c.src.idx) : trayOriginAbove(this, tr, ci); return { c, ci, from, srcT };
    });
    function trayOriginAbove(w, tr, ci) { return w.trayHead(tr, ci).add(V(0, 2.2, 0)); }
    let pickEnd = t0, firstFly = t0 + 500;
    const flyIn = (m, to, at, dur = 640, h = 1.4, s1 = null, done = null) => this.fly(m, m.position.clone(), to, at, dur, { h, s1: s1 ?? tr.s, spin: 0, done });
    const heads = trayHeads.map(({ c, ci, from }) => { const m = spawnAt(c.name, from, 'head', t?.accent ?? 0, t?.ts ?? 1); m.visible = false; return m; });
    // ---- scanner and picking ----
    if (mode === 'whole') {
      const scanDur = this.scan(t, { ...e, where: true, matched: t.order }, t0, { yes: 'ok', no: 'ok' }); this.sched(t0 + 20, () => this.note('copy the whole table', t.headWorld(0).add(V(1.4, 1.1, .9)), 'info', 1600));
      const startAt = t0 + scanDur + 150; pickEnd = startAt; firstFly = startAt;
      trayHeads.forEach(({ ci }) => { const m = heads[ci]; this.sched(startAt, () => { m.visible = true; }); flyIn(m, this.trayHead(tr, ci), startAt, 600, 1.0); });
      e.pre.forEach((row, r) => { grid[r] = []; e.cols.forEach((c, ci) => { const rid = row.rids[0][0]; const m = spawnAt('', V(0, -9, 0)); m.visible = false; grid[r][ci] = m; this.sched(startAt + 5, () => { const rr_ = t.rows.get(rid); if (!rr_) { m.visible = false; return; } m.material[2].map = tileTex(show(row.vals[ci]), 'ghost', t.accent); m.position.copy(t.cellWorld(rid, c.src ? c.src.idx : ci)); m.visible = true; this.fly(m, m.position.clone(), this.trayCell(tr, r, ci), 60 * r + 20, 640, { h: 1.3, s1: tr.s }); }); pickEnd = Math.max(pickEnd, startAt + 60 * r + 720); }); });
      this.restore(t, pickEnd);
    } else if (mode === 'columns' || mode === 'cells' || mode === 'rows') {
      const colSet = new Set(e.cols.filter(c => c.src).map(c => c.src.idx));
      const scanDur = e.where ? this.scan(t, e, t0, { yes: 'match', no: 'dim' }) : 0;
      const startAt = t0 + (e.where ? scanDur + 100 : 900); pickEnd = startAt; firstFly = startAt;
      if (mode !== 'rows') [...colSet].forEach((ci, k) => {
        const bar = this.emit(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0 })));
        const n = t.order.length, z0 = HH / 2 - .35, z1 = t.slotZ(Math.max(0, n - 1)) + RH * .5;
        this.tl(t0 + 100 + k * 150, 750, p => { t.group.updateMatrixWorld(true); const c = t.group.localToWorld(V(t.colX(ci), .5, (z0 + z1) / 2)); bar.position.copy(c); bar.scale.set(CW * .98 * t.ts, (z1 - z0) * t.ts, .05); bar.material.opacity = Math.sin(p * Math.PI) * .42; }, () => this.kill(bar));
      });
      e.cols.forEach((c, ci) => { const m = heads[ci]; this.sched(startAt + ci * 90, () => { m.visible = true; }); flyIn(m, this.trayHead(tr, ci), startAt + ci * 90, 600, 1.0); });
      e.pre.forEach((row, r) => { grid[r] = []; e.cols.forEach((c, ci) => {
        const m = spawnAt('', V(0, -9, 0)); m.visible = false; grid[r][ci] = m; const at = startAt + 150 + r * 130 + ci * 70;
        this.sched(at, () => { const rid = row.rids[0][0]; const srcT = c.src ? this.tbl(c.src.table) : t; const rr_ = srcT?.rows.get(rid); const val = row.vals[ci]; m.material[2].map = tileTex(show(val), c.src ? 'ghost' : 'result', srcT?.accent ?? 0); m.visible = true; m.position.copy(rr_ && c.src ? srcT.cellWorld(rid, c.src.idx) : (srcT && rr_ ? srcT.rowWorld(rid) : V(0, .8, 0))); this.fly(m, m.position.clone(), this.trayCell(tr, r, ci), 0, 620, { h: 1.3, s1: tr.s }); });
        pickEnd = Math.max(pickEnd, at + 700);
      }); });
      this.restore(t, pickEnd);
    } else if (mode === 'join') {
      const L = this.tbl(e.join.left), R = this.tbl(e.join.right);
      this.sched(t0, () => this.note(`match ${L?.name}.id with ${R?.name}`, V(0, 2.5, -.5), 'info', 1700));
      const links = []; let startAt = t0 + 300;
      (e.pairs || []).forEach(([a, b], k) => {
        this.sched(t0 + 250 + k * 170, () => {
          if (!L || !R || !L.rows.has(a) || !R.rows.has(b)) return; const p1 = L.rowWorld(a).add(V(L.W * L.ts / 2 - .1, 0, .15)), p2 = R.rowWorld(b).add(V(-R.W * R.ts / 2 + .1, 0, .15));
          const mid = p1.clone().lerp(p2, .5); mid.z += 1.0; const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
          const tube = this.emit(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .035, 6), new THREE.MeshBasicMaterial({ color: 0xffd75e, transparent: true, opacity: 0 })));
          this.tl(0, 380, p => { tube.material.opacity = p; }); L.rows.get(a).set('ok'); R.rows.get(b).set('ok');
        });
        startAt = Math.max(startAt, t0 + 250 + k * 170 + 600);
      });
      (e.unmatched || []).forEach((id, k) => this.sched(t0 + 300 + k * 150, () => { const r = L?.rows.get(id); if (r) { r.set('match'); this.note('no match: gets NULL', L.rowWorld(id).add(V(0, 1.1, -.1)), 'warn', 1500); } }));
      pickEnd = startAt; firstFly = startAt;
      e.cols.forEach((c, ci) => { const m = heads[ci]; this.sched(startAt + ci * 70, () => { m.visible = true; }); flyIn(m, this.trayHead(tr, ci), startAt + ci * 70, 600, 1.0); });
      e.pre.forEach((row, r) => { grid[r] = []; e.cols.forEach((c, ci) => {
        const m = spawnAt('', V(0, -9, 0)); m.visible = false; grid[r][ci] = m; const at = startAt + 150 + r * 130 + ci * 60;
        this.sched(at, () => { const parts = row.rids[0]; const si = c.src ? e.tables.indexOf(c.src.table) : -1; const rid = si >= 0 ? parts[si] : parts[0]; const srcT = c.src ? this.tbl(c.src.table) : L; const rr_ = srcT?.rows.get(rid); m.material[2].map = tileTex(show(row.vals[ci]), 'ghost', srcT?.accent ?? 0); m.visible = true; m.position.copy(rr_ && c.src ? srcT.cellWorld(rid, c.src.idx) : V(0, .8, 0)); m.scale.setScalar(srcT?.ts ?? 1); this.fly(m, m.position.clone(), this.trayCell(tr, r, ci), 0, 620, { h: 1.3, s1: tr.s }); });
        pickEnd = Math.max(pickEnd, at + 700);
      }); });
      this.restore(L || t, pickEnd); if (R) this.restore(R, pickEnd);
    } else if (mode === 'agg' || mode === 'group') {
      const scanDur = t && e.where ? this.scan(t, e, t0, { yes: 'match', no: 'dim' }) : 300; const startAt = t0 + scanDur + 100; pickEnd = startAt; firstFly = startAt + 1300;
      e.cols.forEach((c, ci) => { const m = heads[ci]; this.sched(startAt + ci * 70, () => { m.visible = true; }); flyIn(m, this.trayHead(tr, ci), startAt + ci * 70, 600, 1.0); });
      const nB = e.pre.length, bz = (t ? t.group.position.z : -1) + 1.7, bx0 = t ? t.group.position.x : 0;
      e.pre.forEach((row, r) => {
        const rightX = bx0 + (r - (nB - 1) / 2) * 1.4, z = bz; const bucket = this.emit(new THREE.Group()); bucket.position.set(rightX, 0, z);
        const box = new THREE.Mesh(new THREE.CylinderGeometry(.62, .42, .55, 20, 1, true), new THREE.MeshStandardMaterial({ color: mode === 'group' ? 0xd99a1f : 0x9b5de5, roughness: .45, metalness: .2, side: THREE.DoubleSide })); box.position.y = .38; box.castShadow = true;
        const base = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .05, 20), mat(0x3d2f5e, .5, .3)); base.position.y = .12; bucket.add(box, base);
        const lab = tex(256, 96, (g, w, h) => { g.fillStyle = '#fff'; rr(g, 3, 3, w - 6, h - 6, 16); g.fill(); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 40px ' + MONO; g.fillText(mode === 'group' ? String(show(row.key?.[0] ?? '')).slice(0, 8) : 'sum up', w / 2, h / 2); });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(.9, .34), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false })); sign.position.set(0, 1.0, 0); sign.rotation.x = -.1; bucket.add(sign); bucket.scale.setScalar(.001);
        this.tl(startAt - 100 + r * 120, 350, p => { bucket.scale.setScalar(Math.max(.001, outBack(p))); });
        const members = row.rids; let last = startAt + 150 + r * (mode === 'group' ? 520 : 0);
        members.forEach((mem, k) => {
          const rid = mem[0]; const at = last + k * 130;
          this.sched(at, () => { const rr_ = t?.rows.get(rid); if (!rr_) return; const gi = e.cols.findIndex(c => c.src); const ci = gi >= 0 ? e.cols[gi].src.idx : 0; const m = spawnAt(show(rr_.vals[ci]), t.cellWorld(rid, ci), 'ghost'); const to = bucket.position.clone().add(V(0, .85, 0)); this.fly(m, m.position.clone(), to, 0, 520, { h: 1.2, s1: m.scale.x * .35, done: () => { this.kill(m); box.scale.set(1.06, .94, 1.06); this.sched(80, () => box.scale.set(1, 1, 1)); } }); });
        });
        const crunchAt = last + members.length * 130 + 650; pickEnd = Math.max(pickEnd, crunchAt + 900);
        this.tl(crunchAt, 420, p => { bucket.position.x = rightX + Math.sin(p * 50) * .05 * (1 - p); bucket.position.y = Math.abs(Math.sin(p * 40)) * .04; });
        e.cols.forEach((c, ci) => { const m = spawnAt('', V(0, -9, 0)); m.visible = false; if (!grid[r]) grid[r] = []; grid[r][ci] = m;
          this.sched(crunchAt + 450 + ci * 60, () => { const gcol = c.src && mode === 'group'; m.material[2].map = tileTex(show(row.vals[ci]), 'result', 1); m.visible = true; m.scale.setScalar(.9); m.position.copy(bucket.position.clone().add(V(0, .9, 0))); this.fly(m, m.position.clone(), this.trayCell(tr, r, ci), 0, 640, { h: 1.5, s1: tr.s }); }); });
        this.sched(crunchAt + 1100 + r * 100, () => this.tl(0, 300, p => { bucket.scale.setScalar(Math.max(.001, 1 - p)); }, () => { this.kill(bucket); }));
      });
      if (t) this.restore(t, pickEnd);
    } else { // expr: no table
      e.cols.forEach((c, ci) => { const m = heads[ci]; this.sched(t0 + ci * 70, () => { m.visible = true; }); flyIn(m, this.trayHead(tr, ci), t0 + ci * 70, 600, 1.0); });
      e.pre.forEach((row, r) => { grid[r] = []; e.cols.forEach((c, ci) => { const m = spawnAt('', V(0, -9, 0)); m.visible = false; grid[r][ci] = m; this.sched(t0 + 400 + ci * 80, () => { m.material[2].map = tileTex(show(row.vals[ci]), 'result', 0); m.visible = true; m.position.copy(botTarget.clone().add(V(0, 2.2, 0))); m.scale.setScalar(.9); this.fly(m, m.position.clone(), this.trayCell(tr, r, ci), 0, 700, { h: 1.2, s1: tr.s }); }); pickEnd = Math.max(pickEnd, t0 + 1200 + ci * 80); }); });
    }
    this.tl(Math.max(ofs + 600, firstFly - 350), 400, p => { tr.group.scale.setScalar(Math.max(.001, outBack(p))); });
    armUp(false, pickEnd + 200);
    // ---- refine: DISTINCT, ORDER BY, LIMIT ----
    let at = pickEnd + 100, seq = e.pre.map((_, i) => i);
    const place = (idxList, atMs, dur = 650) => idxList.forEach((pi, pos) => grid[pi]?.forEach((m, ci) => { this.sched(atMs, () => { const from = m.position.clone(), to = this.trayCell(tr, pos, ci); this.tl(0, dur, p => { const q = inOut(p); m.position.set(lerp(from.x, to.x, q), lerp(from.y, to.y, q) + Math.sin(Math.PI * q) * .45, lerp(from.z, to.z, q)); }); }); }));
    const dropTiles = (list, atMs, why) => { list.forEach(pi => grid[pi]?.forEach(m => this.sched(atMs, () => { this.tl(0, 450, p => { m.position.y += .012; setTileOpacity(m, 1 - p); m.scale.setScalar(m.scale.x * (1 - .01)); }, () => { m.visible = false; }); }))); if (list.length) this.sched(atMs, () => this.note(why, this.trayNote(tr), 'warn', 1500)); };
    if (e.distinct) { const keep = new Set(e.distinctKeep); const gone = seq.filter(i => !keep.has(i)); dropTiles(gone, at, 'DISTINCT: duplicates removed'); seq = e.distinctKeep.slice(); place(seq, at + 400); at += 1100; }
    if (e.ordered) { const o = e.ordered.filter(i => seq.includes(i)); this.sched(at, () => this.note(`ORDER BY ${e.order[0]?.dir === 'desc' ? '↓ biggest first' : '↑ smallest first'}`, this.trayNote(tr), 'info', 1500)); seq = o; place(seq, at + 150, 800); at += 1150; }
    const shown = e.shown; if (shown.length !== seq.length || shown.some((v, i) => v !== seq[i])) {
      const gone = seq.filter(i => !shown.includes(i)); dropTiles(gone, at, e.limit !== null ? `LIMIT ${e.limit}${e.offset ? ' OFFSET ' + e.offset : ''}` : 'rows cut'); seq = shown.slice(); place(seq, at + 400); at += 1100;
    }
    // ---- ship to the computer ----
    const shipAt = at + 250;
    this.sched(shipAt - 20, () => { grid.forEach(row => row?.forEach(m => { if (m.visible) tr.group.attach(m); })); heads.forEach(m => { if (m.visible) tr.group.attach(m); }); this.note(e.result.rows.length ? `${e.result.rows.length} row${e.result.rows.length === 1 ? '' : 's'} go to the screen` : 'no rows matched', this.trayNote(tr), e.result.rows.length ? 'good' : 'warn', 1500); });
    const from = tr.center.clone();
    this.tl(shipAt + 350, 800, p => { const q = p * p * (3 - 2 * p); const tgt = this.ndcPoint(0, -1.15, 7.0); tr.group.position.set(lerp(from.x, tgt.x, q), lerp(from.y, tgt.y, q), lerp(from.z, tgt.z, q)); tr.group.scale.setScalar(lerp(1, .3, q)); }, () => { this.kill(tr.group); });
    this.walk(bot, botTarget, V(-9.6, 0, botTarget.z), shipAt + 200, 1000, -Math.PI * .5, () => { this.actors.delete(bot); disposeActor(bot); });
    this.shipEnd = shipAt + 1150; d = this.shipEnd - ofs + 250;
    return d;
  }
  ndcPoint(nx, ny, dist) {
    const c = this.camera; c.updateMatrixWorld(); const v = new THREE.Vector3(nx, ny, .5).unproject(c); const dir = v.sub(c.position).normalize(); return c.position.clone().add(dir.multiplyScalar(dist));
  }
  // ---------- typing preview ----------
  clearGhost() { if (this.pv) { this.pv.tbl?.dispose(); if (this.pv.tbl) this.tables.delete(key(this.pv.name)); if (this.pv.row && this.pv.rowTable?.rows.has(-9)) this.pv.rowTable.removeRow(-9); this.pv = null; this.layout(); } }
  setCode(code) {
    const model = sqlModel(code), last = model.frames.at(-1), db = last?.db;
    if (!db) return;
    if (this.started === 'replay') { /* a replay is running; the next replay rebuilds */ }
    this.finishAll();
    if (sigOf(db) !== this.shownSigLive() || !this.tables.size && db.tables.length) { this.clearGhostSilent(); this.rebuild(db); }
    const pv = model.incomplete || model.error ? previewStatement(code) : null;
    this.preview(pv, db);
  }
  clearGhostSilent() { this.pv = null; }
  preview(pv, db) {
    if (!pv) { this.clearGhost(); return; }
    if (pv.kind === 'create' && pv.table && !this.tbl(pv.table) || (this.pv && this.pv.name === pv.table && pv.kind === 'create')) {
      if (!pv.table || (this.tbl(pv.table) && !this.pv)) { this.clearGhost(); return; }
      if (!this.pv) { const tb = new TableMesh(this, pv.table, this.tables.size); this.tables.set(key(pv.table), tb); tb.building = true; this.pv = { name: pv.table, tbl: tb, sig: '' }; this.layout(); }
      const tb = this.pv.tbl; tb.setName(pv.table);
      const want = (pv.cols || []).map(c => ({ name: c.name, type: c.type, pk: c.pk, nn: c.nn, uniq: c.uniq, done: c.done }));
      const sig = JSON.stringify(want);
      if (sig !== this.pv.sig) {
        this.pv.sig = sig; const n = want.length; while (tb.cols.length > n) tb.removeCol(tb.cols.length - 1);
        want.forEach((c, i) => { if (i < tb.cols.length) { tb.cols[i] = c; tb.heads[i].def = c; tb.drawHead(tb.heads[i]); } else { const h = tb.addCol(c, { instant: false, at: performance.now() + 10 }); h.group.visible = true; } });
        tb.layoutSlots();
      }
      return;
    }
    if (pv.kind === 'insert' && pv.table && this.tbl(pv.table) && pv.rows?.length) {
      const tb = this.tbl(pv.table), rw = pv.rows.at(-1); this.clearGhostRowOnly();
      const vals = tb.cols.map((_, i) => (rw.vals[i] ? (rw.vals[i].str ? rw.vals[i].text : rw.vals[i].text) : ''));
      const r = tb.addRow(-9, vals); r.set('scan'); r.lift = 0; this.pv = { name: pv.table, rowTable: tb, row: true }; return;
    }
    this.clearGhost();
  }
  clearGhostRowOnly() { if (this.pv?.row && this.pv.rowTable?.rows.has(-9)) this.pv.rowTable.removeRow(-9); this.pv = null; }
  // ---------- per frame ----------
  frameUpdate(now, dt) {
    this.tables.forEach(t => t.update(now, dt));
    this.notes = this.notes.filter(n => {
      const p = (now - n.born) / n.life; if (p >= 1) { this.scene.remove(n.sprite); n.sprite.material.dispose(); return false; }
      n.sprite.position.y = n.y0 + p * .5; n.sprite.material.opacity = p < .12 ? p / .12 : p > .75 ? 1 - (p - .75) / .25 : 1; n.sprite.scale.set(2.6 * (.8 + .2 * outBack(clamp(p * 6))), .65 * (.8 + .2 * outBack(clamp(p * 6))), 1); return true;
    });
    this.actors.forEach(a => { if (a.kind === 'bin') a.pupils.forEach(p => { p.position.x += (Math.sign(p.position.x) * .0 - 0) * 0; }); });
  }
}
export function createSqlWorld(mode) { const w = new SqlWorld(mode); w.fit(); return w; }
