// A small C# preview: simple console programs are translated to JavaScript and run here.
// Programs that need the real .NET (classes, files, forms, databases) get an explanation instead.
const NEEDS_DOTNET = /\b(class\s+(?!Program\b)\w+|struct\s|enum\s|ref\s|out\s|event\s|Form\b|SqlConnection|File\.|StreamWriter|StreamReader|List<|Dictionary<|ArrayList|DateTime|Task\b)/;

function initializers(src) {
  let out = '', i = 0;
  while (i < src.length) {
    const m = /=\s*\{/g; m.lastIndex = i; const hit = m.exec(src);
    if (!hit) { out += src.slice(i); break; }
    out += src.slice(i, hit.index) + '= ';
    let depth = 0, j = hit.index + hit[0].length - 1, body = '';
    for (; j < src.length; j++) { const ch = src[j]; if (ch === '{') { depth++; body += '['; } else if (ch === '}') { depth--; body += ']'; if (!depth) break; } else body += ch; }
    out += body; i = j + 1;
  }
  return out;
}

// Adds a __snap() call after every statement so the lesson pane can replay the program one step at a time.
function instrument(src, names) {
  const getters = names.slice(0, 14).map(n => `['${n}',()=>${n}]`).join(',');
  const call = ` __snap(()=>[${getters}]);`;
  let o = '', paren = 0, brace = 0, q = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) { o += ch; if (ch === '\\') { o += src[++i] || ''; } else if (ch === q) q = ''; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; o += ch; continue; }
    if (ch === '(') paren++; else if (ch === ')') paren--; else if (ch === '{') brace++; else if (ch === '}') brace--;
    o += ch;
    if (ch === ';' && paren === 0 && brace > 0 && !/^\s*(else\b|catch\b|finally\b)/.test(src.slice(i + 1))) o += call;
  }
  return o;
}
// Turns every if / while / for condition into __chk(() => cond, 'cond', getters), so each check can be shown as it happens.
function wrapConds(src, getters) {
  let o = '', i = 0;
  const G = `()=>[${getters}]`;
  while (i < src.length) {
    const m = /\b(if|while|for)\s*\(/g; m.lastIndex = i; const hit = m.exec(src);
    if (!hit) { o += src.slice(i); break; }
    // skip matches inside strings
    const before = src.slice(0, hit.index); if (((before.match(/(?<!\\)"/g) || []).length % 2) === 1) { o += src.slice(i, hit.index + hit[0].length); i = hit.index + hit[0].length; continue; }
    const start = hit.index + hit[0].length; let depth = 1, j = start, q = '';
    for (; j < src.length && depth; j++) { const ch = src[j]; if (q) { if (ch === q && src[j - 1] !== '\\') q = ''; } else if (ch === '"' || ch === "'" || ch === '`') q = ch; else if (ch === '(') depth++; else if (ch === ')') depth--; }
    const inner = src.slice(start, j - 1); o += src.slice(i, start);
    const wrap = (c, k) => `__chk(()=>(${c}),${JSON.stringify(c.trim())},'${k}',${G})`;
    if (hit[1] === 'for') { const parts = []; let d = 0, last = 0; for (let t = 0; t < inner.length; t++) { const ch = inner[t]; if (ch === '(') d++; else if (ch === ')') d--; else if (ch === ';' && !d) { parts.push(inner.slice(last, t)); last = t + 1; } } parts.push(inner.slice(last)); o += parts.length === 3 && parts[1].trim() ? `${parts[0]};${wrap(parts[1], 'for')};${parts[2]}` : inner; }
    else o += wrap(inner, hit[1]);
    o += ')'; i = j;
  }
  return o;
}
const clone = v => (Array.isArray(v) ? v.map(clone) : v);

export function runCsharp(code, reader = () => '5', trace = null) {
  const text = String(code || '');
  if (/System\.Windows\.Forms|SqlClient/.test(text)) return 'This program opens a window or a database, so it needs a real Windows PC with .NET.\nThe code above is correct to study and copy into Visual Studio.';
  if (NEEDS_DOTNET.test(text)) return 'This preview runs simple console programs only.\nYour code uses classes, files, collections or other .NET features, so run it in Visual Studio or with "dotnet run".';
  let s = text.replace(/^\s*using\s+[\w.]+;\s*$/gm, '').replace(/\/\/[^\n]*/g, '');
  const ints = new Set();
  for (const m of s.matchAll(/\b(?:int|long|short|byte)\s+([^;(]*);/g)) m[1].split(',').forEach(d => { const n = d.split('=')[0].trim(); if (/^\w+$/.test(n)) ints.add(n); });
  for (const m of s.matchAll(/\b(?:int|long|short|byte)\s+(\w+)/g)) ints.add(m[1]);
  // Mistakes the C# compiler would catch.
  const typeBug = s.match(/\b(?:int|long|short|byte)\s+\w+\s*=\s*-?\d+\.\d+/) ? 'Cannot implicitly convert type double to int' : /\bif\s*\(\s*\w+\s*=\s*[^=]/.test(s) ? 'Cannot implicitly convert type int to bool (use == to compare)' : '';
  if (typeBug) return 'error: ' + typeBug;
  s = s.replace(/\bint\s+(\w+)\s*=\s*([^;]*?\bint\.TryParse[^;]*)/g, '$&');
  // Methods and Main.
  s = s.replace(/\bclass\s+Program\s*\{/, '').replace(/\}\s*$/, '');
  s = s.replace(/\[STAThread\]/g, '').replace(/\bstatic\s+(?:void|int|double|string|bool|decimal|long|char)\s+(\w+)\s*\(([^)]*)\)\s*=>\s*([^;]+);/g, (m, n, p, e) => `function ${n}(${p.replace(/\b(?:int|double|string|bool|decimal|long|char)\s+(\w+)/g, '$1')}) { return ${e}; }`);
  s = s.replace(/\bstatic\s+(?:void|int|double|string|bool|decimal|long|char)\s+(\w+)\s*\(([^)]*)\)/g, (m, n, p) => `function ${n}(${p.replace(/\b(?:int|double|string|bool|decimal|long|char)\s+(\w+)(\s*=\s*[^,)]+)?/g, '$1$2').replace(/\b(\w+):\s*/g, '')})`);
  s = initializers(s);
  s = s.replace(/\bnew\s+(?!Array)\w+\(([^)]*)\)/g, '$1');
  s = s.replace(/new\s+(?:int|double|string|bool|char|decimal)\s*\[\s*(\w+)\s*\]/g, 'new Array($1).fill(0)').replace(/new\s+(?:int|double|string)?\[\]\s*(\[)/g, '$1');
  s = s.replace(/\bforeach\s*\(\s*\w+\s+(\w+)\s+in\s+/g, 'for (const $1 of ').replace(/\b(?:int|long|short|byte|double|float|decimal|bool|string|char|var|const)\s*(?:\[\s*,?\s*\])?\s+(\w+)\s*(?==|;|,)/g, 'let $1');
  s = s.replace(/let (\w+)\s*,\s*(\w+)\s*=/g, 'let $1, $2 =').replace(/(\d)[mfdL]\b/g, '$1');
  s = s.replace(/\bconst\s+let/g, 'const').replace(/\bstring\.Join\(/g, '__join(').replace(/\bint\.(?:Parse|TryParse)\(/g, 'parseInt(').replace(/\bdouble\.Parse\(/g, 'parseFloat(').replace(/\bConvert\.ToInt32\(/g, 'parseInt(');
  s = s.replace(/\bConsole\.ReadLine\(\)/g, '__read()').replace(/\bConsole\.WriteLine\(\)/g, '__out("\\n")').replace(/\bConsole\.WriteLine\(/g, '__line(').replace(/\bConsole\.Write\(/g, '__out(');
  s = s.replace(/\$"((?:\\.|[^"\\])*)"/g, (m, b) => '`' + b.replace(/`/g, '\\`').replace(/\{([^}:]+)(?::[^}]*)?\}/g, '${__f($1)}') + '`');
  s = s.replace(/(\w+)\.GetLength\(0\)/g, '$1.length').replace(/(\w+)\.GetLength\(1\)/g, '$1[0].length');
  s = s.replace(/\.Length\b/g, '.length').replace(/\.Count\b/g, '.length').replace(/\.ToUpper\(\)/g, '.toUpperCase()').replace(/\.ToLower\(\)/g, '.toLowerCase()').replace(/\.Trim\(\)/g, '.trim()').replace(/\.Substring\(/g, '.substr(').replace(/\.Contains\(/g, '.includes(').replace(/\.Replace\(/g, '.replaceAll(').replace(/\.Split\(/g, '.split(').replace(/\bMath\.(Min|Max|Abs|Sqrt|Pow|Round|Floor|Ceiling)\b/g, (m, f) => 'Math.' + ({ Min: 'min', Max: 'max', Abs: 'abs', Sqrt: 'sqrt', Pow: 'pow', Round: 'round', Floor: 'floor', Ceiling: 'ceil' })[f]).replace(/\bMath\.PI\b/g, 'Math.PI');
  s = s.replace(/(?<=\w)\[\s*(\w+)\s*,\s*(\w+)\s*\]/g, '[$1][$2]').replace(/\bstring\.IsNullOrWhiteSpace\(([^)]*)\)/g, '(!($1) || !($1).trim())');
  // Integer division when both sides are ints.
  const isInt = t => /^\d+$/.test(t) || ints.has(t);
  s = s.replace(/(?<![\w.])(\w+)\s*\/\s*(\w+)(?![\w.(])/g, (m, a, b) => (isInt(a) && isInt(b) ? `__div(${a},${b})` : m));
  s = s.replace(/\bcatch\s*\([^)]*\)/g, 'catch (__e)');
  s = s.replace(/case\s+(\d+|"[^"]*"|'[^']*'):\s*([^;]*;)\s*break;/g, 'case $1: $2 break;');
  let out = '';
  const f = v => (v === true ? 'True' : v === false ? 'False' : v === null || v === undefined ? '' : String(v));
  const guard = { n: 0 };
  try {
    let safe = s;
    if (trace) {
      const names = new Set();
      for (const m of s.matchAll(/\blet\s+([^;]*);/g)) m[1].split(',').forEach(d => { const n = d.split('=')[0].trim(); if (/^\w+$/.test(n)) names.add(n); });
      for (const m of s.matchAll(/\bfor\s*\(\s*const\s+(\w+)\s+of/g)) names.add(m[1]);
      const gl = [...names].slice(0, 14).map(n => `['${n}',()=>${n}]`).join(',');
      safe = instrument(wrapConds(s, gl), [...names]);
    }
    safe = safe.replace(/\b(while|for)\s*\(([^)]*)\)\s*\{/g, (m, k, c) => `${k} (${c}) { if (++__g.n > 20000) throw new Error('loop never ends');`);
    const grab = get => { const vars = {}; try { get().forEach(([n, g]) => { try { vars[n] = clone(g()); } catch (e) { /* not declared yet */ } }); } catch (e) { /* ignore */ } return vars; };
    const chk = (cond, text, kind, get) => { const ok = !!cond(); if (trace && trace.length <= 400) trace.push({ vars: grab(get), out, ev: { t: 'check', kind, text, ok } }); return ok; };
    const snap = trace ? (get => { if (trace.length > 400) return; const vars = {}; try { get().forEach(([n, g]) => { try { vars[n] = clone(g()); } catch (e) { /* not declared yet */ } }); } catch (e) { return; } trace.push({ vars, out }); }) : () => {};
    new Function('__out', '__line', '__f', '__join', '__read', '__g', '__div', '__snap', '__chk', `${safe}\nif (typeof Main === 'function') Main();`)(
      t => { out += f(t); }, t => { out += f(t) + '\n'; }, f, (sep, arr) => arr.join(sep), reader, guard, (a, b) => { if (b === 0) throw new Error('Attempted to divide by zero.'); return Math.trunc(a / b); }, snap, chk);
  } catch (e) {
    return (out ? out + '\n' : '') + (e instanceof SyntaxError ? 'The preview could not understand this program.\nRun it in Visual Studio or with "dotnet run" to see the real result.' : 'error: ' + e.message);
  }
  return out || '(the program printed nothing)';
}

// For the Do it yourself / Debug checker: { output, error }. Code that needs real .NET is judged by its goals only.
export function runCsharpRaw(code) {
  const t = runCsharp(code);
  if (/^(This preview|This program opens|The preview could not)/.test(t)) return { output: '', error: '', stopped: false, unsupported: true };
  const m = t.match(/(?:^|\n)error: (.*)$/);
  return { output: m ? t.slice(0, m.index) : t, error: m ? m[1] : '', stopped: false };
}

// Step-by-step replay: [{ vars, out }] after every statement, plus the declared type of each variable.
export function traceCsharp(code) {
  const frames = [], types = {};
  for (const m of String(code).matchAll(/\b(int|long|short|byte|double|float|decimal|bool|string|char|var)\s*(\[\s*,?\s*\])?\s+(\w+)\s*(?==|;|,)/g)) types[m[3]] = m[1] + (m[2] ? '[]' : '');
  for (const m of String(code).matchAll(/\bforeach\s*\(\s*(\w+)\s+(\w+)\s+in/g)) types[m[2]] = m[1];
  const text = runCsharp(code, () => '5', frames);
  const unsupported = /^(This preview|This program opens|The preview could not)/.test(text);
  return { frames: unsupported ? [] : frames, types, text, unsupported };
}
