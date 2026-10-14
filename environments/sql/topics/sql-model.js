// A small teaching SQL engine. It runs CREATE / DROP / ALTER / INSERT / UPDATE / DELETE / SELECT on an in-memory
// database and records one frame per statement, with the events the 3D scene replays (build a table, drop a row in,
// walk a bin to a row, copy a column to the screen...).
//
// loopless usage:  sqlModel(code, { check }) -> { frames, error, hint, incomplete, output, results, db }
// The text before a line "-- YOUR TURN" is the setup: it builds the starting database silently.

export const MARK = '-- YOUR TURN';
const MARK_RE = /^[ \t]*--[ \t]*YOUR TURN[^\n]*\n?/im;

class SqlError extends Error {
  constructor(message, { incomplete = false, hint = '', table = '' } = {}) { super(message); this.incomplete = incomplete; this.hint = hint; this.table = table; }
}

// ---------------- tokens ----------------
const KEYWORDS = new Set(['select', 'from', 'where', 'and', 'or', 'not', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table', 'drop', 'alter', 'add', 'column', 'rename', 'to', 'primary', 'key', 'autoincrement', 'unique', 'default', 'null', 'order', 'by', 'group', 'having', 'limit', 'offset', 'distinct', 'as', 'asc', 'desc', 'in', 'between', 'like', 'is', 'join', 'inner', 'left', 'outer', 'on', 'if', 'exists', 'references', 'true', 'false', 'cross', 'right', 'case', 'when', 'then', 'else', 'end']);
const AGG = new Set(['count', 'sum', 'avg', 'min', 'max']);

function tokenize(src) {
  const out = []; let i = 0, line = 1;
  const push = (t, v, s, e, extra = {}) => out.push({ t, v, s, e, line, raw: src.slice(s, e), ...extra });
  while (i < src.length) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '-' && src[i + 1] === '-') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
    const s = i;
    if (/\d/.test(c) || (c === '.' && /\d/.test(src[i + 1] || ''))) {
      while (/\d/.test(src[i] || '')) i++;
      if (src[i] === '.' && /\d/.test(src[i + 1] || '')) { i++; while (/\d/.test(src[i] || '')) i++; }
      push('num', Number(src.slice(s, i)), s, i); continue;
    }
    if (c === "'") {
      i++; let v = '', closed = false;
      while (i < src.length) { if (src[i] === "'") { if (src[i + 1] === "'") { v += "'"; i += 2; continue; } i++; closed = true; break; } v += src[i++]; }
      push('str', v, s, i, { open: !closed }); continue;
    }
    if (c === '"' || c === '`') {
      const q = c; i++; let v = '';
      while (i < src.length && src[i] !== q) v += src[i++];
      const closed = src[i] === q; i++; push('qid', v, s, i, { open: !closed }); continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      while (/\w/.test(src[i] || '')) i++;
      const w = src.slice(s, i), lw = w.toLowerCase();
      push(KEYWORDS.has(lw) ? 'kw' : 'id', KEYWORDS.has(lw) ? lw : w, s, i); continue;
    }
    const two = src.slice(i, i + 2);
    if (['<=', '>=', '<>', '!=', '==', '||'].includes(two)) { i += 2; push('op', two === '==' ? '=' : two === '!=' ? '<>' : two, s, i); continue; }
    if ('(),;.*+-/%=<>'.includes(c)) { i++; push('op', c, s, i); continue; }
    i++; push('bad', c, s, i);
  }
  push('eof', '', src.length, src.length);
  return out;
}

// ---------------- parser ----------------
class Parser {
  constructor(src) { this.src = src; this.toks = tokenize(src); this.p = 0; }
  peek(o = 0) { return this.toks[Math.min(this.p + o, this.toks.length - 1)]; }
  next() { return this.toks[this.p < this.toks.length - 1 ? this.p++ : this.p]; }
  isKw(v, o = 0) { const t = this.peek(o); return t.t === 'kw' && t.v === v; }
  isOp(v, o = 0) { const t = this.peek(o); return t.t === 'op' && t.v === v; }
  acceptKw(v) { if (this.isKw(v)) { this.next(); return true; } return false; }
  acceptOp(v) { if (this.isOp(v)) { this.next(); return true; } return false; }
  fail(tok, hint = '') {
    tok = tok || this.peek();
    if (tok.t === 'eof') throw new SqlError('the statement is not finished yet', { incomplete: true, hint: hint || 'Keep typing, and end the statement with ;' });
    const last = this.toks[this.toks.indexOf(tok) + 1]?.t === 'eof';
    throw new SqlError(`near "${tok.raw}": syntax error`, { hint, incomplete: last });
  }
  expectKw(v, hint) { if (!this.acceptKw(v)) this.fail(this.peek(), hint || `Expected ${v.toUpperCase()} here.`); }
  expectOp(v, hint) { if (!this.acceptOp(v)) this.fail(this.peek(), hint || `Expected "${v}" here.`); }
  name(what = 'a name') {
    const t = this.peek();
    if (t.t === 'id' || t.t === 'qid') { this.next(); return t.v; }
    if (t.t === 'kw' && !['select', 'from', 'where', 'insert', 'update', 'delete', 'create', 'drop', 'table', 'values', 'order', 'group', 'by', 'set', 'into', 'and', 'or', 'not', 'join', 'on'].includes(t.v)) { this.next(); return t.v; }
    this.fail(t, `Expected ${what} here.`);
  }
  script() {
    const stmts = [];
    while (true) {
      while (this.acceptOp(';'));
      if (this.peek().t === 'eof') break;
      const start = this.peek();
      const st = this.statement();
      st.src = this.src.slice(start.s, this.toks[this.p - 1].e); st.line = start.line; st.start = start.s;
      const t = this.peek();
      if (t.t !== 'eof' && !this.isOp(';')) this.fail(t, 'A statement ends with ; . Is a comma, a quote or a keyword missing?');
      st.closed = this.isOp(';');
      stmts.push(st);
    }
    return stmts;
  }
  statement() {
    const t = this.peek();
    if (t.t === 'kw') {
      switch (t.v) {
        case 'create': return this.create();
        case 'drop': return this.drop();
        case 'alter': return this.alter();
        case 'insert': return this.insert();
        case 'update': return this.update();
        case 'delete': return this.del();
        case 'select': return this.select();
      }
    }
    if (t.t === 'id') {
      const near = ['select', 'insert', 'update', 'delete', 'create', 'drop', 'alter'].find(k => k[0] === t.v[0].toLowerCase() && k.length === t.v.length) || ['select', 'insert', 'update', 'delete', 'create', 'drop', 'alter'].find(k => lev(k, t.v.toLowerCase()) <= 2);
      this.fail(t, near ? `Did you mean ${near.toUpperCase()}?` : 'A command starts with SELECT, INSERT, UPDATE, DELETE, CREATE, DROP or ALTER.');
    }
    this.fail(t, 'A command starts with SELECT, INSERT, UPDATE, DELETE, CREATE, DROP or ALTER.');
  }
  create() {
    this.next(); this.expectKw('table', 'After CREATE comes the word TABLE.');
    let ifNot = false;
    if (this.acceptKw('if')) { this.expectKw('not'); this.expectKw('exists'); ifNot = true; }
    const name = this.name('the table name');
    this.expectOp('(', 'The columns go inside ( ) after the table name.');
    const cols = []; const tablePk = [];
    do {
      if (this.isKw('primary')) { this.next(); this.expectKw('key'); this.expectOp('('); do { tablePk.push(this.name()); } while (this.acceptOp(',')); this.expectOp(')'); continue; }
      const cname = this.name('a column name');
      const col = { name: cname, type: 'TEXT', pk: false, auto: false, nn: false, uniq: false, def: undefined, ref: null, declared: false };
      const t = this.peek();
      if (t.t === 'id' || (t.t === 'kw' && ['key'].includes(t.v) === false && !['primary', 'not', 'unique', 'default', 'null', 'references', 'autoincrement'].includes(t.v))) {
        let ty = this.next().v.toUpperCase();
        if (this.acceptOp('(')) { while (!this.isOp(')') && this.peek().t !== 'eof') this.next(); this.expectOp(')'); }
        col.type = normalizeType(ty); col.declared = true;
      }
      while (true) {
        if (this.isKw('primary')) { this.next(); this.expectKw('key'); col.pk = true; if (this.acceptKw('autoincrement')) col.auto = true; }
        else if (this.isKw('autoincrement')) { this.next(); col.auto = true; }
        else if (this.isKw('not')) { this.next(); this.expectKw('null'); col.nn = true; }
        else if (this.isKw('null')) { this.next(); }
        else if (this.isKw('unique')) { this.next(); col.uniq = true; }
        else if (this.isKw('default')) { this.next(); col.def = this.primary(); }
        else if (this.isKw('references')) { this.next(); const rt = this.name(); let rc = null; if (this.acceptOp('(')) { rc = this.name(); this.expectOp(')'); } col.ref = { table: rt, col: rc }; }
        else break;
      }
      cols.push(col);
    } while (this.acceptOp(','));
    this.expectOp(')', 'Columns are separated by commas. Is a comma missing here? The list ends with ) .');
    tablePk.forEach(n => { const c = cols.find(x => x.name.toLowerCase() === n.toLowerCase()); if (c) c.pk = true; });
    return { k: 'create', name, cols, ifNot };
  }
  drop() {
    this.next(); this.expectKw('table', 'After DROP comes the word TABLE.');
    let ifExists = false; if (this.acceptKw('if')) { this.expectKw('exists'); ifExists = true; }
    return { k: 'drop', name: this.name('the table name'), ifExists };
  }
  alter() {
    this.next(); this.expectKw('table', 'After ALTER comes the word TABLE.');
    const name = this.name('the table name');
    if (this.acceptKw('rename')) {
      if (this.acceptKw('to')) return { k: 'alter', name, op: 'rename', to: this.name() };
      this.acceptKw('column'); const from = this.name(); this.expectKw('to'); return { k: 'alter', name, op: 'renamecol', col: from, to: this.name() };
    }
    if (this.acceptKw('add')) {
      this.acceptKw('column'); const cname = this.name('a column name'); const col = { name: cname, type: 'TEXT', pk: false, auto: false, nn: false, uniq: false, def: undefined, ref: null };
      const t = this.peek(); if (t.t === 'id') { col.type = normalizeType(this.next().v.toUpperCase()); if (this.acceptOp('(')) { while (!this.isOp(')') && this.peek().t !== 'eof') this.next(); this.expectOp(')'); } }
      while (true) {
        if (this.isKw('not')) { this.next(); this.expectKw('null'); col.nn = true; }
        else if (this.isKw('default')) { this.next(); col.def = this.primary(); }
        else if (this.isKw('unique')) { this.next(); col.uniq = true; }
        else break;
      }
      return { k: 'alter', name, op: 'add', col };
    }
    if (this.acceptKw('drop')) { this.acceptKw('column'); return { k: 'alter', name, op: 'drop', col: this.name('a column name') }; }
    this.fail(this.peek(), 'After the table name use ADD COLUMN, DROP COLUMN or RENAME TO.');
  }
  insert() {
    this.next(); this.expectKw('into', 'After INSERT comes the word INTO.');
    const name = this.name('the table name'); let cols = null;
    if (this.isOp('(')) { this.next(); cols = []; do { cols.push(this.name('a column name')); } while (this.acceptOp(',')); this.expectOp(')'); }
    this.expectKw('values', 'After the table name comes VALUES ( ... ).');
    const rows = [];
    do {
      this.expectOp('(', 'Each row of values goes inside ( ) .');
      const row = []; do { row.push(this.expr()); } while (this.acceptOp(','));
      this.expectOp(')', 'Close the row with ) . Values are separated by commas.'); rows.push(row);
    } while (this.acceptOp(','));
    return { k: 'insert', name, cols, rows };
  }
  update() {
    this.next(); const name = this.name('the table name'); this.expectKw('set', 'After the table name comes SET column = value.');
    const sets = [];
    do { const col = this.name('a column name'); this.expectOp('=', 'Write column = value.'); sets.push({ col, expr: this.expr() }); } while (this.acceptOp(','));
    let where = null; if (this.acceptKw('where')) where = this.expr();
    return { k: 'update', name, sets, where };
  }
  del() {
    this.next(); this.expectKw('from', 'After DELETE comes the word FROM.');
    const name = this.name('the table name'); let where = null; if (this.acceptKw('where')) where = this.expr();
    return { k: 'delete', name, where };
  }
  select() {
    this.next(); const st = { k: 'select', distinct: false, items: [], from: null, joins: [], where: null, group: [], having: null, order: [], limit: null, offset: null };
    if (this.acceptKw('distinct')) st.distinct = true; else this.acceptKw('all');
    do {
      if (this.isOp('*')) { this.next(); st.items.push({ star: true }); continue; }
      if ((this.peek().t === 'id' || this.peek().t === 'qid') && this.isOp('.', 1) && this.isOp('*', 2)) { const t = this.next().v; this.next(); this.next(); st.items.push({ star: true, table: t }); continue; }
      const s0 = this.peek().s; const expr = this.expr(); const text = this.src.slice(s0, this.toks[this.p - 1].e);
      let alias = null; if (this.acceptKw('as')) alias = this.name('a name'); else if (this.peek().t === 'id' || this.peek().t === 'qid') alias = this.next().v;
      st.items.push({ expr, alias, text });
    } while (this.acceptOp(','));
    if (this.acceptKw('from')) {
      st.from = this.tableRef();
      while (true) {
        let type = null;
        if (this.isKw('inner') && this.isKw('join', 1)) { this.next(); this.next(); type = 'inner'; }
        else if (this.isKw('left')) { this.next(); this.acceptKw('outer'); this.expectKw('join'); type = 'left'; }
        else if (this.isKw('join')) { this.next(); type = 'inner'; }
        else if (this.isKw('cross') && this.isKw('join', 1)) { this.next(); this.next(); type = 'cross'; }
        else if (this.isOp(',')) { this.next(); type = 'cross'; }
        else break;
        const ref = this.tableRef(); let on = null;
        if (type !== 'cross') { this.expectKw('on', 'A JOIN needs ON, to say which columns match.'); on = this.expr(); }
        st.joins.push({ type, ref, on });
      }
    }
    if (this.acceptKw('where')) st.where = this.expr();
    if (this.isKw('group')) { this.next(); this.expectKw('by'); do { st.group.push(this.expr()); } while (this.acceptOp(',')); }
    if (this.acceptKw('having')) st.having = this.expr();
    if (this.isKw('order')) { this.next(); this.expectKw('by', 'After ORDER comes the word BY.'); do { const e = this.expr(); let dir = 'asc'; if (this.acceptKw('desc')) dir = 'desc'; else this.acceptKw('asc'); st.order.push({ expr: e, dir }); } while (this.acceptOp(',')); }
    if (this.acceptKw('limit')) { st.limit = this.expr(); if (this.acceptKw('offset')) st.offset = this.expr(); else if (this.acceptOp(',')) { st.offset = st.limit; st.limit = this.expr(); } }
    return st;
  }
  tableRef() {
    const name = this.name('a table name'); let alias = null;
    if (this.acceptKw('as')) alias = this.name(); else if (this.peek().t === 'id' || this.peek().t === 'qid') alias = this.next().v;
    return { name, alias };
  }
  // ---- expressions ----
  expr() { return this.orE(); }
  orE() { let l = this.andE(); while (this.acceptKw('or')) l = { k: 'bin', op: 'or', l, r: this.andE() }; return l; }
  andE() { let l = this.notE(); while (this.acceptKw('and')) l = { k: 'bin', op: 'and', l, r: this.notE() }; return l; }
  notE() { if (this.isKw('not') && !this.isKw('null', 1)) { this.next(); return { k: 'not', e: this.notE() }; } return this.cmp(); }
  cmp() {
    let l = this.add();
    while (true) {
      const t = this.peek();
      if (t.t === 'op' && ['=', '<>', '<', '<=', '>', '>='].includes(t.v)) { this.next(); l = { k: 'bin', op: t.v, l, r: this.add() }; continue; }
      if (this.isKw('is')) { this.next(); const neg = this.acceptKw('not'); this.expectKw('null', 'IS must be followed by NULL or NOT NULL.'); l = { k: 'isnull', e: l, neg }; continue; }
      let neg = false;
      if (this.isKw('not') && (this.isKw('in', 1) || this.isKw('between', 1) || this.isKw('like', 1))) { this.next(); neg = true; }
      if (this.isKw('in')) {
        this.next(); this.expectOp('(', 'IN needs a list in ( ) .');
        if (this.isKw('select')) { const sub = this.select(); this.expectOp(')'); l = { k: 'in', e: l, sub, neg }; continue; }
        const list = []; do { list.push(this.expr()); } while (this.acceptOp(',')); this.expectOp(')'); l = { k: 'in', e: l, list, neg }; continue;
      }
      if (this.isKw('between')) { this.next(); const lo = this.add(); this.expectKw('and', 'BETWEEN a AND b needs the word AND.'); const hi = this.add(); l = { k: 'between', e: l, lo, hi, neg }; continue; }
      if (this.isKw('like')) { this.next(); l = { k: 'like', e: l, pat: this.add(), neg }; continue; }
      break;
    }
    return l;
  }
  add() { let l = this.mul(); while (true) { const t = this.peek(); if (t.t === 'op' && ['+', '-', '||'].includes(t.v)) { this.next(); l = { k: 'bin', op: t.v, l, r: this.mul() }; } else break; } return l; }
  mul() { let l = this.unary(); while (true) { const t = this.peek(); if (t.t === 'op' && ['*', '/', '%'].includes(t.v)) { this.next(); l = { k: 'bin', op: t.v, l, r: this.unary() }; } else break; } return l; }
  unary() { if (this.isOp('-')) { this.next(); return { k: 'neg', e: this.unary() }; } if (this.isOp('+')) { this.next(); return this.unary(); } return this.primary(); }
  primary() {
    const t = this.peek();
    if (t.t === 'num') { this.next(); return { k: 'lit', v: t.v }; }
    if (t.t === 'str') { this.next(); if (t.open) throw new SqlError('the text is missing its closing quote', { incomplete: true, hint: "Close the text with a second ' quote." }); return { k: 'lit', v: t.v }; }
    if (t.t === 'kw' && t.v === 'null') { this.next(); return { k: 'lit', v: null }; }
    if (t.t === 'kw' && (t.v === 'true' || t.v === 'false')) { this.next(); return { k: 'lit', v: t.v === 'true' ? 1 : 0 }; }
    if (t.t === 'op' && t.v === '(') {
      this.next();
      if (this.isKw('select')) { const sub = this.select(); this.expectOp(')'); return { k: 'sub', sub }; }
      const e = this.expr(); this.expectOp(')', 'Close the bracket with ) .'); return e;
    }
    if (t.t === 'kw' && t.v === 'case') {
      this.next(); const whens = []; let els = null;
      while (this.acceptKw('when')) { const c = this.expr(); this.expectKw('then'); whens.push({ c, r: this.expr() }); }
      if (this.acceptKw('else')) els = this.expr(); this.expectKw('end'); return { k: 'case', whens, els };
    }
    if (t.t === 'id' || t.t === 'qid' || (t.t === 'kw' && ['if', 'left', 'key', 'column', 'to', 'add', 'end'].includes(t.v) && this.isOp('(', 1))) {
      this.next();
      if (this.isOp('(') && t.t !== 'qid') {
        this.next(); const fn = String(t.v).toLowerCase(); const node = { k: 'fn', name: fn, args: [], star: false, distinct: false };
        if (this.isOp('*')) { this.next(); node.star = true; }
        else if (!this.isOp(')')) { if (this.acceptKw('distinct')) node.distinct = true; do { node.args.push(this.expr()); } while (this.acceptOp(',')); }
        this.expectOp(')', 'Close the function with ) .'); return node;
      }
      if (this.isOp('.') && (this.peek(1).t === 'id' || this.peek(1).t === 'qid')) { this.next(); const c = this.next().v; return { k: 'col', table: t.v, name: c }; }
      return { k: 'col', name: t.v, quoted: t.t === 'qid' };
    }
    this.fail(t, t.t === 'kw' ? `"${t.raw}" is a SQL word and cannot be used as a value here.` : 'Expected a value, a column name or a function here.');
  }
}
function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
function normalizeType(t) {
  if (/^(INT|INTEGER|BIGINT|SMALLINT|TINYINT)$/.test(t)) return 'INTEGER';
  if (/^(REAL|FLOAT|DOUBLE|DECIMAL|NUMERIC|NUMBER)$/.test(t)) return 'REAL';
  if (/^(BOOLEAN|BOOL)$/.test(t)) return 'INTEGER';
  return 'TEXT';
}

// ---------------- values ----------------
const isNum = v => typeof v === 'number';
export function show(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  return String(v);
}
function cmpVals(a, b) {
  if (a === null && b === null) return 0; if (a === null) return -1; if (b === null) return 1;
  if (isNum(a) && isNum(b)) return a < b ? -1 : a > b ? 1 : 0;
  if (isNum(a)) return -1; if (isNum(b)) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}
function truthy(v) { return v !== null && v !== undefined && v !== 0 && v !== '' && v !== false; }
function likeToRe(p) { return new RegExp('^' + String(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$', 'is'); }

// ---------------- engine ----------------
class Engine {
  constructor() { this.tables = new Map(); this.rid = 0; }
  key(n) { return String(n).toLowerCase(); }
  table(name, forErr = true) {
    const t = this.tables.get(this.key(name));
    if (!t && forErr) throw new SqlError(`no such table: ${name}`, { table: name, hint: this.tables.size ? `The tables you have are: ${[...this.tables.values()].map(x => x.name).join(', ')}. Check the spelling, and make sure you created it first.` : 'No table exists yet. Create it first with CREATE TABLE.' });
    return t;
  }
  snap() {
    return { tables: [...this.tables.values()].map(t => ({ name: t.name, cols: t.cols.map(c => ({ name: c.name, type: c.type, pk: !!c.pk, nn: !!c.nn, uniq: !!c.uniq, auto: !!c.auto, ref: c.ref ? { ...c.ref } : null, def: c.defv })), rows: t.rows.map(r => ({ id: r.id, v: r.v.slice() })) })) };
  }
  colIndex(t, name, forErr = true) {
    const i = t.cols.findIndex(c => c.name.toLowerCase() === String(name).toLowerCase());
    if (i < 0 && forErr) throw new SqlError(`no such column: ${name}`, { table: t.name, hint: `${t.name} has these columns: ${t.cols.map(c => c.name).join(', ')}.` });
    return i;
  }
  // coerce a value for a column
  coerce(t, c, v) {
    if (v === null || v === undefined) return null;
    if (c.type === 'INTEGER') {
      if (isNum(v)) return Number.isInteger(v) ? v : v;
      if (/^\s*-?\d+(\.\d+)?\s*$/.test(v)) return Number(v);
      throw new SqlError(`datatype mismatch: ${t.name}.${c.name} holds whole numbers, but got '${v}'`, { table: t.name, hint: `${c.name} is ${c.type}. Put a number there, not text.` });
    }
    if (c.type === 'REAL') {
      if (isNum(v)) return v;
      if (/^\s*-?\d+(\.\d+)?\s*$/.test(v)) return Number(v);
      throw new SqlError(`datatype mismatch: ${t.name}.${c.name} holds numbers, but got '${v}'`, { table: t.name, hint: `${c.name} is ${c.type}. Put a number there, not text.` });
    }
    return isNum(v) ? show(v) : String(v);
  }
  // ---- expression evaluation ----
  // env: { rows: [{ t:table, alias, row }], group: [envs]|null, outAlias: Map }
  evalE(e, env) {
    switch (e.k) {
      case 'lit': return e.v;
      case 'col': return this.colValue(e, env);
      case 'neg': { const v = this.evalE(e.e, env); return v === null ? null : -v; }
      case 'not': { const v = this.evalE(e.e, env); return v === null ? null : (truthy(v) ? 0 : 1); }
      case 'isnull': { const v = this.evalE(e.e, env); return (v === null) !== !!e.neg ? 1 : 0; }
      case 'in': {
        const v = this.evalE(e.e, env); if (v === null) return null;
        const list = e.sub ? this.runSelect(e.sub, { quiet: true }).rows.map(r => r[0]) : e.list.map(x => this.evalE(x, env));
        const hit = list.some(x => x !== null && cmpVals(v, x) === 0); return hit !== !!e.neg ? 1 : 0;
      }
      case 'between': { const v = this.evalE(e.e, env), lo = this.evalE(e.lo, env), hi = this.evalE(e.hi, env); if (v === null || lo === null || hi === null) return null; const r = cmpVals(v, lo) >= 0 && cmpVals(v, hi) <= 0; return r !== !!e.neg ? 1 : 0; }
      case 'like': { const v = this.evalE(e.e, env), p = this.evalE(e.pat, env); if (v === null || p === null) return null; const r = likeToRe(p).test(show(v)); return r !== !!e.neg ? 1 : 0; }
      case 'case': { for (const w of e.whens) if (truthy(this.evalE(w.c, env))) return this.evalE(w.r, env); return e.els ? this.evalE(e.els, env) : null; }
      case 'sub': { const r = this.runSelect(e.sub, { quiet: true }); return r.rows.length ? r.rows[0][0] : null; }
      case 'fn': return this.evalFn(e, env);
      case 'bin': {
        if (e.op === 'and') { const a = this.evalE(e.l, env); if (a !== null && !truthy(a)) return 0; const b = this.evalE(e.r, env); if (b !== null && !truthy(b)) return 0; return a === null || b === null ? null : 1; }
        if (e.op === 'or') { const a = this.evalE(e.l, env); if (truthy(a)) return 1; const b = this.evalE(e.r, env); if (truthy(b)) return 1; return a === null || b === null ? null : 0; }
        const a = this.evalE(e.l, env), b = this.evalE(e.r, env);
        if (['=', '<>', '<', '<=', '>', '>='].includes(e.op)) {
          if (a === null || b === null) return null;
          const c = cmpVals(a, b);
          return ({ '=': c === 0, '<>': c !== 0, '<': c < 0, '<=': c <= 0, '>': c > 0, '>=': c >= 0 })[e.op] ? 1 : 0;
        }
        if (e.op === '||') return a === null || b === null ? null : show(a) + show(b);
        if (a === null || b === null) return null;
        const x = isNum(a) ? a : Number(a), y = isNum(b) ? b : Number(b);
        if (Number.isNaN(x) || Number.isNaN(y)) throw new SqlError(`cannot do math with text: '${isNum(a) ? b : a}'`, { hint: 'Math (+ - * /) only works on numbers.' });
        switch (e.op) { case '+': return x + y; case '-': return x - y; case '*': return x * y; case '/': return y === 0 ? null : (Number.isInteger(a) && Number.isInteger(b) ? Math.trunc(x / y) : x / y); case '%': return y === 0 ? null : x % y; }
      }
    }
    throw new SqlError('this kind of expression is not supported here');
  }
  colValue(e, env) {
    if (env.outAlias && !e.table && env.outAlias.has(e.name.toLowerCase())) {
      // alias reference (ORDER BY / HAVING); real columns win
      const found = this.findCol(e, env, false);
      if (!found) return env.outAlias.get(e.name.toLowerCase());
    }
    const f = this.findCol(e, env, true);
    return f.row.v[f.idx];
  }
  findCol(e, env, must) {
    const hits = [];
    for (const part of env.rows) {
      if (e.table && part.alias.toLowerCase() !== e.table.toLowerCase() && part.t.name.toLowerCase() !== e.table.toLowerCase()) continue;
      const idx = part.t.cols.findIndex(c => c.name.toLowerCase() === e.name.toLowerCase());
      if (idx >= 0) hits.push({ part, idx, row: part.row || { v: part.t.cols.map(() => null) } });
    }
    if (hits.length > 1) throw new SqlError(`ambiguous column name: ${e.name}`, { hint: `More than one table has a column called ${e.name}. Write table.${e.name}, for example ${hits[0].part.alias}.${e.name}.` });
    if (!hits.length) {
      if (e.quoted) return { row: { v: [e.name] }, idx: 0 };
      if (!must) return null;
      const tabs = env.rows.map(p => p.t);
      const all = tabs.flatMap(t => t.cols.map(c => c.name));
      const wasText = tabs.length && !e.table;
      throw new SqlError(`no such column: ${e.table ? e.table + '.' : ''}${e.name}`, { table: tabs[0]?.name, hint: !tabs.length ? `${e.name} is not a value. If it is text, put single quotes around it, like '${e.name}'.` : wasText ? `There is no column called ${e.name}. If it is a text value, put single quotes around it, like '${e.name}'. Columns here: ${all.join(', ')}.` : `Columns here: ${all.join(', ')}.` });
    }
    return hits[0];
  }
  evalFn(e, env) {
    const n = e.name;
    if (AGG.has(n)) {
      if (!env.group) throw new SqlError(`misuse of aggregate function ${n.toUpperCase()}()`, { hint: `${n.toUpperCase()}() adds up many rows, so it cannot be used in WHERE. Use HAVING after GROUP BY, or move it into SELECT.` });
      const rows = env.group;
      if (n === 'count' && e.star) return rows.length;
      let vals = rows.map(r => this.evalE(e.args[0], r)).filter(v => v !== null);
      if (e.distinct) { const seen = new Set(); vals = vals.filter(v => { const k = typeof v + show(v); if (seen.has(k)) return false; seen.add(k); return true; }); }
      if (n === 'count') return vals.length;
      if (!vals.length) return null;
      if (n === 'min') return vals.reduce((a, b) => cmpVals(a, b) <= 0 ? a : b);
      if (n === 'max') return vals.reduce((a, b) => cmpVals(a, b) >= 0 ? a : b);
      const nums = vals.map(Number); if (nums.some(Number.isNaN)) throw new SqlError(`${n.toUpperCase()}() needs numbers, but this column has text`, { hint: `${n.toUpperCase()} only works on number columns.` });
      const sum = nums.reduce((a, b) => a + b, 0);
      return n === 'sum' ? sum : sum / nums.length;
    }
    const a = e.args.map(x => this.evalE(x, env));
    switch (n) {
      case 'upper': return a[0] === null ? null : show(a[0]).toUpperCase();
      case 'lower': return a[0] === null ? null : show(a[0]).toLowerCase();
      case 'length': return a[0] === null ? null : show(a[0]).length;
      case 'abs': return a[0] === null ? null : Math.abs(a[0]);
      case 'round': return a[0] === null ? null : (a[1] ? Math.round(a[0] * 10 ** a[1]) / 10 ** a[1] : Math.round(a[0]));
      case 'coalesce': case 'ifnull': return a.find(x => x !== null) ?? null;
      case 'trim': return a[0] === null ? null : show(a[0]).trim();
      case 'substr': case 'substring': return a[0] === null ? null : show(a[0]).substr(Math.max(0, a[1] - 1), a[2] ?? 1e9);
      default: throw new SqlError(`no such function: ${e.name}`, { hint: 'Functions you can use: COUNT, SUM, AVG, MIN, MAX, UPPER, LOWER, LENGTH, ROUND, ABS.' });
    }
  }
  hasAgg(e) {
    if (!e || typeof e !== 'object') return false;
    if (e.k === 'fn' && AGG.has(e.name)) return true;
    return ['l', 'r', 'e', 'lo', 'hi', 'pat'].some(k => e[k] && this.hasAgg(e[k])) || (e.args || []).some(a => this.hasAgg(a)) || (e.list || []).some(a => this.hasAgg(a)) || (e.whens || []).some(w => this.hasAgg(w.c) || this.hasAgg(w.r)) || (e.els ? this.hasAgg(e.els) : false);
  }
  // ---- statements ----
  exec(st, ev) {
    switch (st.k) {
      case 'create': return this.doCreate(st, ev);
      case 'drop': return this.doDrop(st, ev);
      case 'alter': return this.doAlter(st, ev);
      case 'insert': return this.doInsert(st, ev);
      case 'update': return this.doUpdate(st, ev);
      case 'delete': return this.doDelete(st, ev);
      case 'select': return this.doSelect(st, ev);
    }
  }
  doCreate(st, ev) {
    if (this.table(st.name, false)) {
      if (st.ifNot) { ev.push({ t: 'note', text: `${st.name} already exists, so nothing changes` }); return { msg: `Table ${st.name} already exists. Nothing changed.` }; }
      throw new SqlError(`table ${st.name} already exists`, { table: st.name, hint: 'Use another name, DROP the old table first, or write CREATE TABLE IF NOT EXISTS.' });
    }
    const seen = new Set();
    st.cols.forEach(c => { const k = c.name.toLowerCase(); if (seen.has(k)) throw new SqlError(`duplicate column name: ${c.name}`, { hint: 'Every column in a table needs its own name.' }); seen.add(k); });
    if (!st.cols.length) throw new SqlError('a table needs at least one column');
    const cols = st.cols.map(c => { const col = { ...c }; if (c.pk && c.type === 'INTEGER' && st.cols.filter(x => x.pk).length === 1) col.auto = true; col.defv = c.def === undefined ? undefined : this.evalE(c.def, { rows: [] }); return col; });
    const t = { name: st.name, cols, rows: [], next: 1 };
    this.tables.set(this.key(st.name), t);
    ev.push({ t: 'create', table: st.name, cols: cols.map(c => ({ name: c.name, type: c.type, pk: !!c.pk, nn: !!c.nn, uniq: !!c.uniq, ref: c.ref, def: c.defv })) });
    return { msg: `Table ${st.name} created with ${cols.length} column${cols.length === 1 ? '' : 's'}.` };
  }
  doDrop(st, ev) {
    const t = this.table(st.name, !st.ifExists);
    if (!t) { ev.push({ t: 'note', text: `${st.name} does not exist, so nothing to drop` }); return { msg: `Table ${st.name} does not exist. Nothing dropped.` }; }
    ev.push({ t: 'drop', table: t.name, rows: t.rows.length });
    this.tables.delete(this.key(st.name));
    return { msg: `Table ${t.name} dropped (${t.rows.length} row${t.rows.length === 1 ? '' : 's'} gone).` };
  }
  doAlter(st, ev) {
    const t = this.table(st.name);
    if (st.op === 'rename') {
      if (this.table(st.to, false)) throw new SqlError(`there is already a table named ${st.to}`);
      ev.push({ t: 'alter', table: t.name, op: 'rename', to: st.to });
      this.tables.delete(this.key(t.name)); t.name = st.to; this.tables.set(this.key(t.name), t);
      return { msg: `Table renamed to ${st.to}.` };
    }
    if (st.op === 'add') {
      if (this.colIndex(t, st.col.name, false) >= 0) throw new SqlError(`duplicate column name: ${st.col.name}`, { table: t.name });
      const col = { ...st.col, defv: st.col.def === undefined ? undefined : this.evalE(st.col.def, { rows: [] }) };
      if (col.nn && col.defv === undefined && t.rows.length) throw new SqlError(`Cannot add a NOT NULL column with no default value to a table that already has rows`, { table: t.name, hint: 'Give the new column a DEFAULT value, for example DEFAULT 0.' });
      t.cols.push(col); t.rows.forEach(r => r.v.push(col.defv === undefined ? null : col.defv));
      ev.push({ t: 'alter', table: t.name, op: 'add', col: { name: col.name, type: col.type, nn: !!col.nn, def: col.defv } });
      return { msg: `Column ${col.name} added to ${t.name}.` };
    }
    const idx = this.colIndex(t, st.col);
    if (st.op === 'drop') {
      if (t.cols.length === 1) throw new SqlError('cannot drop the only column of a table', { table: t.name });
      ev.push({ t: 'alter', table: t.name, op: 'drop', col: t.cols[idx].name, idx });
      t.cols.splice(idx, 1); t.rows.forEach(r => r.v.splice(idx, 1));
      return { msg: `Column ${st.col} removed from ${t.name}.` };
    }
    ev.push({ t: 'alter', table: t.name, op: 'renamecol', col: t.cols[idx].name, idx, to: st.to });
    t.cols[idx].name = st.to; return { msg: `Column renamed to ${st.to}.` };
  }
  checkRow(t, row, ignoreRid) {
    t.cols.forEach((c, i) => {
      if (row[i] === null && c.nn) throw new SqlError(`NOT NULL constraint failed: ${t.name}.${c.name}`, { table: t.name, hint: `${c.name} cannot be empty. Give this column a value.` });
      if (row[i] !== null && (c.pk || c.uniq) && t.rows.some(r => r.id !== ignoreRid && cmpVals(r.v[i], row[i]) === 0))
        throw new SqlError(`UNIQUE constraint failed: ${t.name}.${c.name}`, { table: t.name, hint: `${c.name} must be different in every row, but ${show(row[i])} is already taken.` });
    });
  }
  doInsert(st, ev) {
    const t = this.table(st.name);
    const idxs = st.cols ? st.cols.map(n => this.colIndex(t, n)) : t.cols.map((_, i) => i);
    const made = [];
    for (const rowExprs of st.rows) {
      if (rowExprs.length !== idxs.length) throw new SqlError(`${rowExprs.length} value${rowExprs.length === 1 ? '' : 's'} for ${idxs.length} column${idxs.length === 1 ? '' : 's'}`, { table: t.name, hint: st.cols ? `You listed ${idxs.length} column${idxs.length === 1 ? '' : 's'}, so each row needs exactly ${idxs.length} value${idxs.length === 1 ? '' : 's'}.` : `${t.name} has ${t.cols.length} columns, so give ${t.cols.length} values, or list the columns you want to fill.` });
      const row = t.cols.map(c => (c.defv === undefined ? null : c.defv));
      const given = [];
      rowExprs.forEach((x, k) => { const i = idxs[k]; row[i] = this.coerce(t, t.cols[i], this.evalE(x, { rows: [] })); given.push(i); });
      t.cols.forEach((c, i) => { if (row[i] === null && c.auto) row[i] = Math.max(0, ...t.rows.map(r => Number(r.v[i]) || 0)) + 1; });
      try { this.checkRow(t, row, null); made.forEach(m => { t.cols.forEach((c, i) => { if ((c.pk || c.uniq) && row[i] !== null && cmpVals(m.v[i], row[i]) === 0) throw new SqlError(`UNIQUE constraint failed: ${t.name}.${c.name}`, { table: t.name, hint: `${c.name} must be different in every row, but ${show(row[i])} is already taken.` }); }); }); }
      catch (err) { if (err instanceof SqlError) { err.rejected = { table: t.name, values: row.slice(), given: given.slice() }; t.rows = t.rows.filter(x => !made.includes(x)); } throw err; }
      const r = { id: ++this.rid, v: row, given }; t.rows.push(r); made.push(r);
    }
    made.forEach(m => ev.push({ t: 'insert', table: t.name, rid: m.id, values: m.v.slice(), given: m.given }));
    made.forEach(m => delete m.given);
    return { msg: `${made.length} row${made.length === 1 ? '' : 's'} added to ${t.name}.` };
  }
  matchRows(t, where) {
    const scanned = t.rows.map(r => r.id), matched = [];
    t.rows.forEach(r => { if (!where || truthy(this.evalE(where, { rows: [{ t, alias: t.name, row: r }] }))) matched.push(r); });
    return { scanned, matched };
  }
  doUpdate(st, ev) {
    const t = this.table(st.name);
    const sets = st.sets.map(s => ({ i: this.colIndex(t, s.col), expr: s.expr }));
    const { scanned, matched } = this.matchRows(t, st.where);
    const changes = [];
    const newRows = matched.map(r => { const nv = r.v.slice(); sets.forEach(s => { nv[s.i] = this.coerce(t, t.cols[s.i], this.evalE(s.expr, { rows: [{ t, alias: t.name, row: r }] })); }); return nv; });
    matched.forEach((r, k) => {
      const nv = newRows[k]; this.checkRow(t, nv, r.id);
      matched.forEach((o, j) => { if (j !== k) t.cols.forEach((c, i) => { if ((c.pk || c.uniq) && sets.some(s => s.i === i) && nv[i] !== null && cmpVals(newRows[j][i], nv[i]) === 0 && j < k) throw new SqlError(`UNIQUE constraint failed: ${t.name}.${c.name}`, { table: t.name, hint: `${c.name} must be different in every row, so you cannot set many rows to the same ${c.name}.` }); }); });
    });
    matched.forEach((r, k) => { const cs = []; sets.forEach(s => { if (cmpVals(r.v[s.i], newRows[k][s.i]) !== 0 || r.v[s.i] !== newRows[k][s.i]) cs.push({ col: s.i, from: r.v[s.i], to: newRows[k][s.i] }); }); changes.push({ rid: r.id, cells: cs }); r.v = newRows[k]; });
    ev.push({ t: 'update', table: t.name, scanned, matched: matched.map(r => r.id), where: !!st.where, cols: [...new Set(sets.map(s => s.i))], changes });
    return { msg: `${matched.length} row${matched.length === 1 ? '' : 's'} updated in ${t.name}.` };
  }
  doDelete(st, ev) {
    const t = this.table(st.name);
    const { scanned, matched } = this.matchRows(t, st.where);
    const ids = new Set(matched.map(r => r.id));
    ev.push({ t: 'delete', table: t.name, scanned, matched: [...ids], where: !!st.where, all: ids.size === t.rows.length && t.rows.length > 0 });
    t.rows = t.rows.filter(r => !ids.has(r.id));
    return { msg: `${ids.size} row${ids.size === 1 ? '' : 's'} deleted from ${t.name}.` };
  }
  // ---- SELECT ----
  sourceFor(st) {
    if (!st.from) return { parts: [], rows: [{ rows: [] }], tables: [] };
    const base = this.table(st.from.name);
    const parts = [{ t: base, alias: st.from.alias || base.name }];
    let combos = base.rows.map(r => ({ rows: [{ t: base, alias: parts[0].alias, row: r }] }));
    const pairs = [], unmatched = [];
    for (const j of st.joins) {
      const jt = this.table(j.ref.name); const alias = j.ref.alias || jt.name;
      if ([...parts].some(p => p.alias.toLowerCase() === alias.toLowerCase())) throw new SqlError(`ambiguous table name: ${alias}`, { hint: 'Give the second copy of the table a different nickname, for example FROM staff AS boss.' });
      parts.push({ t: jt, alias });
      const next = [];
      combos.forEach(c => {
        let any = false;
        jt.rows.forEach(r => {
          const env = { rows: [...c.rows, { t: jt, alias, row: r }] };
          if (j.type === 'cross' || truthy(this.evalE(j.on, env))) { next.push(env); any = true; if (parts.length === 2) pairs.push([c.rows[0].row.id, r.id]); }
        });
        if (!any && j.type === 'left') { next.push({ rows: [...c.rows, { t: jt, alias, row: null }] }); if (parts.length === 2) unmatched.push(c.rows[0].row.id); }
      });
      combos = next;
    }
    return { parts, rows: combos, tables: parts.map(p => p.t.name), pairs, unmatched };
  }
  doSelect(st, ev) {
    const r = this.runSelect(st, { events: ev });
    return { msg: `${r.rows.length} row${r.rows.length === 1 ? '' : 's'} found.`, result: { columns: r.columns, rows: r.rows } };
  }
  runSelect(st, { quiet = false, events = null } = {}) {
    const src = this.sourceFor(st);
    const empty = !src.parts.length;
    const scanned = src.rows.map(c => c.rows[0]?.row?.id).filter(x => x !== undefined);
    // WHERE
    const kept = st.where ? src.rows.filter(c => truthy(this.evalE(st.where, { rows: c.rows }))) : src.rows;
    // output columns
    const items = [];
    st.items.forEach(it => {
      if (it.star) {
        if (empty) throw new SqlError('SELECT * needs a table', { hint: 'Add FROM table_name.' });
        src.parts.forEach(p => { if (it.table && p.alias.toLowerCase() !== it.table.toLowerCase() && p.t.name.toLowerCase() !== it.table.toLowerCase()) return; p.t.cols.forEach((c, i) => items.push({ label: c.name, expr: { k: 'col', table: p.alias, name: c.name }, src: { table: p.t.name, idx: i } })); });
        if (it.table && !items.length) throw new SqlError(`no such table: ${it.table}`);
      } else {
        const plain = it.expr.k === 'col';
        let sr = null;
        if (plain) { const p = src.parts.find(pp => (!it.expr.table || pp.alias.toLowerCase() === it.expr.table.toLowerCase() || pp.t.name.toLowerCase() === it.expr.table.toLowerCase()) && pp.t.cols.some(c => c.name.toLowerCase() === it.expr.name.toLowerCase())); if (p) sr = { table: p.t.name, idx: p.t.cols.findIndex(c => c.name.toLowerCase() === it.expr.name.toLowerCase()) }; }
        items.push({ label: it.alias || (plain && sr ? src.parts.find(pp => pp.t.name === sr.table).t.cols[sr.idx].name : (it.text || '?')), expr: it.expr, src: sr, alias: it.alias });
      }
    });
    if (!items.length) throw new SqlError('nothing to select');
    // validate columns early even if there are no rows
    const probe = { rows: src.parts.map(p => ({ t: p.t, alias: p.alias, row: null })), group: [] };
    const aggregated = st.group.length > 0 || items.some(i => this.hasAgg(i.expr)) || (st.having && this.hasAgg(st.having));
    items.forEach(i => { if (!this.hasAgg(i.expr)) this.validate(i.expr, probe, st); });
    if (st.where) this.validate(st.where, probe, st);
    // build result rows
    let groups = null;
    const outAlias = new Map();
    let rowsOut = [];
    if (aggregated) {
      const map = new Map();
      kept.forEach(c => { const k = JSON.stringify(st.group.map(g => this.evalE(g, { rows: c.rows }))); if (!map.has(k)) map.set(k, []); map.get(k).push(c); });
      if (!st.group.length && !map.size) map.set('[]', []);
      groups = [...map.entries()].map(([k, members]) => ({ key: JSON.parse(k), members }));
      groups.forEach(g => {
        const first = g.members[0] || { rows: src.parts.map(p => ({ t: p.t, alias: p.alias, row: null })) };
        const env = { rows: first.rows, group: g.members.map(m => ({ rows: m.rows })) };
        const vals = items.map(i => this.evalE(i.expr, env));
        items.forEach((i, k) => outAlias.set(String(i.label).toLowerCase(), vals[k]));
        const env2 = { ...env, outAlias: new Map(items.map((i, k) => [String(i.label).toLowerCase(), vals[k]])) };
        if (st.having && !truthy(this.evalE(st.having, env2))) return;
        rowsOut.push({ vals, env: env2, members: g.members, key: g.key });
      });
    } else {
      if (st.having) throw new SqlError('HAVING needs a GROUP BY', { hint: 'Use WHERE to filter rows. HAVING only filters groups.' });
      kept.forEach(c => { const env = { rows: c.rows }; const vals = items.map(i => this.evalE(i.expr, env)); env.outAlias = new Map(items.map((i, k) => [String(i.label).toLowerCase(), vals[k]])); rowsOut.push({ vals, env, members: [c] }); });
    }
    const pre = rowsOut.slice();
    // DISTINCT
    let removed = [];
    if (st.distinct) { const seen = new Set(); rowsOut = rowsOut.filter(r => { const k = JSON.stringify(r.vals); if (seen.has(k)) { removed.push(r); return false; } seen.add(k); return true; }); }
    const afterDistinct = rowsOut.slice();
    // ORDER BY
    if (st.order.length) {
      const keyOf = (r, o) => {
        if (o.expr.k === 'lit' && Number.isInteger(o.expr.v)) { if (o.expr.v < 1 || o.expr.v > items.length) throw new SqlError(`ORDER BY term out of range: ${o.expr.v}`, { hint: `Pick a number from 1 to ${items.length}.` }); return r.vals[o.expr.v - 1]; }
        return this.evalE(o.expr, r.env);
      };
      rowsOut = rowsOut.map((r, i) => ({ r, i, k: st.order.map(o => keyOf(r, o)) }))
        .sort((a, b) => { for (let n = 0; n < st.order.length; n++) { const c = cmpVals(a.k[n], b.k[n]); if (c) return st.order[n].dir === 'desc' ? -c : c; } return a.i - b.i; }).map(x => x.r);
    }
    const ordered = rowsOut.slice();
    // LIMIT / OFFSET
    const lim = st.limit ? this.evalE(st.limit, { rows: [] }) : null, off = st.offset ? this.evalE(st.offset, { rows: [] }) : 0;
    if (st.limit && (!Number.isInteger(lim) || lim < 0)) throw new SqlError('LIMIT must be a whole number', { hint: 'Write LIMIT 3, for example.' });
    if (lim !== null || off) rowsOut = rowsOut.slice(off || 0, lim === null ? undefined : (off || 0) + lim);
    const columns = items.map(i => i.label);
    const out = { columns, rows: rowsOut.map(r => r.vals) };
    if (events) {
      const primary = src.parts[0]?.t;
      const ridOf = (c, k = 0) => c.rows[k]?.row?.id ?? null;
      const idxPre = new Map(pre.map((r, i) => [r, i]));
      const allRows = st.where ? false : true;
      const allCols = items.every(i => i.src) && src.parts.length === 1 && items.length === primary?.cols.length && items.every((i, k) => i.src.idx === k);
      let mode = aggregated ? (st.group.length ? 'group' : 'agg') : src.parts.length > 1 ? 'join' : empty ? 'expr' : (allRows && allCols ? 'whole' : allRows ? 'columns' : allCols ? 'rows' : 'cells');
      if (!aggregated && items.some(i => !i.src) && mode !== 'join' && !empty) mode = allRows ? 'columns' : 'cells';
      events.push({
        t: 'select', mode, tables: src.tables, primary: primary?.name || null,
        scanned, matched: kept.map(c => ridOf(c)).filter(x => x !== null), where: !!st.where,
        cols: items.map(i => ({ name: i.label, src: i.src ? { ...i.src } : null, alias: i.alias || null, expr: !i.src })),
        pairs: src.pairs || [], unmatched: src.unmatched || [], join: src.parts.length > 1 ? { left: src.parts[0].t.name, right: src.parts[1].t.name, type: st.joins[0].type } : null,
        pre: pre.map(r => ({ vals: r.vals.slice(), rids: r.members.map(m => m.rows.map(x => x.row?.id ?? null)) , key: r.key })),
        distinct: st.distinct ? removed.length : 0, distinctKeep: afterDistinct.map(r => idxPre.get(r)),
        ordered: st.order.length ? ordered.map(r => idxPre.get(r)) : null, order: st.order.map(o => ({ dir: o.dir })),
        limit: lim, offset: off || 0, shown: rowsOut.map(r => idxPre.get(r)),
        result: { columns, rows: out.rows.map(r => r.slice()) },
      });
    }
    return out;
  }
  validate(e, probe, st) {
    // a column that does not exist should fail even when the table is empty
    if (!e || typeof e !== 'object') return;
    if (e.k === 'col') { const aliasHit = !e.table && st.items.some(i => i.alias && i.alias.toLowerCase() === e.name.toLowerCase()); if (!aliasHit) this.findCol(e, probe, true); return; }
    if (e.k === 'sub' || e.sub) return;
    ['l', 'r', 'e', 'lo', 'hi', 'pat'].forEach(k => e[k] && this.validate(e[k], probe, st));
    (e.args || []).forEach(a => this.validate(a, probe, st)); (e.list || []).forEach(a => this.validate(a, probe, st));
  }
}

// ---------------- running a script ----------------
const KIND_LABEL = {
  create: s => `CREATE TABLE: build an empty ${s.name} table with ${s.cols.length} column${s.cols.length === 1 ? '' : 's'}`,
  drop: s => `DROP TABLE: throw the whole ${s.name} table away`,
  alter: s => ({ add: `ALTER TABLE: add the column ${s.col?.name} to ${s.name}`, drop: `ALTER TABLE: remove the column ${s.col} from ${s.name}`, rename: `ALTER TABLE: rename ${s.name} to ${s.to}`, renamecol: `ALTER TABLE: rename the column ${s.col}` })[s.op],
  insert: s => `INSERT: add ${s.rows.length} new row${s.rows.length === 1 ? '' : 's'} to ${s.name}`,
  update: s => `UPDATE: change the rows of ${s.name}${s.where ? ' that match' : ' (every row)'}`,
  delete: s => s.where ? `DELETE: remove the rows of ${s.name} that match` : `DELETE: remove every row of ${s.name}`,
  select: () => 'SELECT: look at the data and show it on the screen',
};
export function renderResult(r) {
  if (!r) return '';
  return [r.columns.join(' | '), ...r.rows.map(row => row.map(show).join(' | '))].join('\n');
}
// The ready-made tables of a lesson (setup) come first, then the marker, then what the learner typed.
export function assemble(setup, code) {
  const s = String(setup || '').trim();
  if (!s) return String(code || '');
  return s + '\n' + (MARK_RE.test(code) ? '' : MARK + '\n') + code;
}
export function splitSetup(code) {
  const m = MARK_RE.exec(code);
  if (!m) return { setup: '', main: code, offset: 0 };
  return { setup: code.slice(0, m.index), main: code.slice(m.index + m[0].length), offset: m.index + m[0].length };
}
function runStatements(engine, text, { frames, record, startLine = 1 }) {
  let stmts;
  const lead = text;
  let parser;
  try { parser = new Parser(lead); stmts = parser.script(); }
  catch (err) {
    if (!(err instanceof SqlError)) throw err;
    // run the statements that were complete before the error
    const done = []; const p2 = new Parser(lead);
    try { while (true) { while (p2.acceptOp(';')); if (p2.peek().t === 'eof') break; const s0 = p2.peek(); const st = p2.statement(); st.src = lead.slice(s0.s, p2.toks[p2.p - 1].e); st.line = s0.line; if (p2.isOp(';')) { st.closed = true; done.push(st); } else if (p2.peek().t === 'eof') { done.push(st); break; } else break; } } catch (e) { /* the broken statement */ }
    const sofar = run(done);
    if (sofar.error) return sofar;
    return { error: err.message, hint: err.hint, incomplete: err.incomplete, line: p2.peek().line };
  }
  return run(stmts);
  function run(list) {
    for (const st of list) {
      const events = [];
      try {
        const r = engine.exec(st, events);
        if (record) frames.push({ kind: st.k, op: st.op, label: KIND_LABEL[st.k](st), stmt: st.src, line: st.line, events, screen: r.result ? { type: 'rows', columns: r.result.columns, rows: r.result.rows } : { type: 'msg', text: r.msg }, db: engine.snap() });
        else if (r.result) frames.push({ result: r.result });
        else frames.push({});
      } catch (err) {
        if (!(err instanceof SqlError)) throw err;
        if (record) frames.push({ kind: 'error', label: `${err.message}`, stmt: st.src, line: st.line, events: [...(err.events || []), { t: 'error', msg: err.message, hint: err.hint, table: err.table, rejected: err.rejected || null, stmt: st.k }], screen: { type: 'error', text: err.message, hint: err.hint }, db: engine.snap() });
        return { error: err.message, hint: err.hint, line: st.line };
      }
    }
    return {};
  }
}
// Hidden checks used by the challenges: "@table name" describes a table on one line, "@tables" lists the table names.
function summarize(engine, check) {
  let m = /^@table\s+(\w+)/i.exec(check.trim());
  if (m) {
    const t = engine.table(m[1], false);
    if (!t) return `(there is no table called ${m[1]})`;
    return `${t.name}(${t.cols.map(c => [c.name, c.type, c.pk && 'KEY', c.nn && 'NOT NULL', c.uniq && 'UNIQUE', c.defv !== undefined && c.defv !== null && 'DEFAULT ' + show(c.defv)].filter(Boolean).join(' ')).join(', ')})`;
  }
  if (/^@tables/i.test(check.trim())) return [...engine.tables.values()].map(t => t.name).sort().join(', ') || '(no tables)';
  return null;
}
export function sqlModel(code, opts = {}) {
  const { setup, main } = splitSetup(String(code || ''));
  const engine = new Engine();
  const frames = [];
  const sink = [];
  const setupRes = setup.trim() ? runStatements(engine, setup, { frames: sink, record: false }) : {};
  if (setupRes.error) return { frames: [], error: `The ready-made part has a problem: ${setupRes.error}`, hint: '', incomplete: false, output: '', results: [], db: engine.snap() };
  const start = engine.snap();
  frames.push({ kind: 'start', label: start.tables.length ? 'The database is ready. These tables already exist.' : 'The database is empty. Nothing exists yet.', events: [], screen: { type: 'msg', text: start.tables.length ? 'ready' : 'empty database' }, db: start, stmt: '' });
  const res = runStatements(engine, main, { frames, record: true });
  const results = frames.filter(f => f.screen?.type === 'rows').map(f => ({ columns: f.screen.columns, rows: f.screen.rows }));
  let checkText = '';
  if (opts.check && !res.error) {
    const special = summarize(engine, opts.check);
    if (special !== null) checkText = special;
    else {
      const sink2 = []; const r = runStatements(engine, opts.check, { frames: sink2, record: false });
      const last = sink2.filter(x => x.result).pop();
      checkText = r.error ? `error: ${r.error}` : last ? renderResult(last.result) : '';
    }
  }
  const output = [...results.map(renderResult), ...(checkText ? [checkText] : [])].join('\n\n');
  return { frames, error: res.error || '', hint: res.hint || '', incomplete: !!res.incomplete, line: res.line, output, results, db: engine.snap(), stopped: false };
}

// ---------------- typing preview ----------------
// Reads the statement that is still being typed (no ; yet) so the scene can show it taking shape.
export function previewStatement(code) {
  const { main, setup } = splitSetup(String(code || ''));
  const text = main;
  const toks = tokenize(text).filter(t => t.t !== 'eof');
  let startTok = 0;
  toks.forEach((t, i) => { if (t.t === 'op' && t.v === ';') startTok = i + 1; });
  const cur = toks.slice(startTok);
  if (!cur.length) return null;
  const kw = cur[0].t === 'kw' ? cur[0].v : null;
  const out = { kind: kw, text: text.slice(cur[0].s) };
  if (kw === 'create' && cur[1]?.v === 'table') {
    let i = 2; if (cur[i]?.v === 'if') i += 3;
    const name = cur[i]; if (!name) return out;
    out.table = name.v; const open = cur.findIndex(t => t.t === 'op' && t.v === '(');
    out.cols = [];
    if (open >= 0) {
      let depth = 0, seg = [];
      const flush = (done) => {
        if (!seg.length) return;
        const name = seg[0].v, rest = seg.slice(1);
        const type = rest[0] && (rest[0].t === 'id') ? normalizeType(String(rest[0].v).toUpperCase()) : '';
        const up = rest.map(t => String(t.v).toLowerCase()).join(' ');
        out.cols.push({ name: String(name), type, pk: /primary key/.test(up), nn: /not null/.test(up), uniq: /unique/.test(up), done, rawType: rest[0] && rest[0].t === 'id' ? rest[0].v : '' });
        seg = [];
      };
      for (let k = open + 1; k < cur.length; k++) {
        const t = cur[k];
        if (t.t === 'op' && t.v === '(') depth++;
        if (t.t === 'op' && t.v === ')') { if (depth === 0) { flush(true); out.closed = true; break; } depth--; }
        if (t.t === 'op' && t.v === ',' && depth === 0) { flush(true); continue; }
        seg.push(t);
      }
      if (!out.closed) flush(false);
    }
  } else if (kw === 'insert' && cur[1]?.v === 'into') {
    out.table = cur[2]?.v; const vi = cur.findIndex(t => t.v === 'values');
    if (vi >= 0) {
      const rows = []; let row = null, depth = 0, seg = [];
      for (let k = vi + 1; k < cur.length; k++) {
        const t = cur[k];
        if (t.t === 'op' && t.v === '(') { depth++; if (depth === 1) { row = { vals: [], done: false }; seg = []; rows.push(row); continue; } }
        if (t.t === 'op' && t.v === ')') { depth--; if (depth === 0) { if (seg.length) row.vals.push({ text: seg.map(x => x.t === 'str' ? x.v : x.raw).join(' '), done: true, str: seg[0].t === 'str' }); row.done = true; seg = []; continue; } }
        if (t.t === 'op' && t.v === ',' && depth === 1) { row.vals.push({ text: seg.map(x => x.t === 'str' ? x.v : x.raw).join(' '), done: true, str: seg[0]?.t === 'str' }); seg = []; continue; }
        if (depth >= 1) seg.push(t);
      }
      if (row && !row.done && seg.length) row.vals.push({ text: seg.map(x => x.t === 'str' ? x.v : x.raw).join(' '), done: false, str: seg[0]?.t === 'str' });
      out.rows = rows;
    }
  }
  return out;
}
