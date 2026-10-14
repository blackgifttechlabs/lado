// Rewrites a C# lesson program as the C++ program the C++ scenes understand, so the very same live scenes
// (boxes that build as you type, loop machines, branching doors...) can run on C# code.
const closeAt = (s, open) => { let d = 0, q = ''; for (let i = open; i < s.length; i++) { const c = s[i]; if (q) { if (c === q && s[i - 1] !== '\\') q = ''; continue; } if (c === '"' || c === "'") q = c; else if (c === '(' || c === '{' || c === '[') d++; else if (c === ')' || c === '}' || c === ']') { d--; if (!d) return i; } } return -1; };
const splitTop = (e, sep) => { const out = []; let d = 0, q = '', last = 0; for (let i = 0; i < e.length; i++) { const c = e[i]; if (q) { if (c === q && e[i - 1] !== '\\') q = ''; continue; } if (c === '"' || c === "'") q = c; else if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; else if (c === sep && !d) { out.push(e.slice(last, i)); last = i + 1; } } out.push(e.slice(last)); return out; };
const interp = e => e.replace(/\$"((?:\\.|[^"\\])*)"/g, (m, b) => b.split(/(\{[^}]*\})/).filter(Boolean).map(p => (p[0] === '{' ? p.slice(1, -1).split(':')[0] : `"${p}"`)).join(' << '));
const outArgs = e => { const x = interp(e.trim()); return /"/.test(x) ? splitTop(x, '+').map(p => p.trim()).join(' << ') : x; };

// `if (c) stmt;` and `else stmt;` get braces, because the C++ scenes expect them.
function bracify(s) {
  for (let n = 0; n < 40; n++) {
    let changed = false;
    for (const m of s.matchAll(/\b(?:else\s+)?if\s*\(|\belse\b(?!\s*(?:if\b|\{))/g)) {
      let after = m.index + m[0].length;
      if (m[0].endsWith('(')) { const close = closeAt(s, after - 1); if (close < 0) continue; after = close + 1; }
      const rest = s.slice(after), lead = rest.match(/^\s*/)[0].length;
      if (rest[lead] === '{' || rest[lead] === undefined || /^\s*$/.test(rest)) continue;
      let d = 0, q = '', end = -1;
      for (let i = after + lead; i < s.length; i++) { const c = s[i]; if (q) { if (c === q && s[i - 1] !== '\\') q = ''; continue; } if (c === '"' || c === "'") q = c; else if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; else if (c === ';' && d === 0) { end = i; break; } if (d < 0) break; }
      if (end < 0) continue;
      s = s.slice(0, after) + ' {' + s.slice(after, end + 1) + ' }' + s.slice(end + 1); changed = true; break;
    }
    if (!changed) break;
  }
  return s;
}

export function csToCpp(src) {
  let s = String(src);
  if (!/\bstatic\s+void\s+Main\b/.test(s)) return s;
  s = s.replace(/^\s*using\s+[\w.]+;[ \t]*\n?/gm, '');
  // Console output / input.
  for (const [name, end] of [['Console.WriteLine(', ' << endl;'], ['Console.Write(', ';']]) {
    let at;
    while ((at = s.indexOf(name)) >= 0) {
      const open = at + name.length - 1, close = closeAt(s, open); if (close < 0) break;
      const arg = s.slice(open + 1, close).trim(), semi = s[close + 1] === ';' ? 1 : 0;
      s = s.slice(0, at) + (arg ? `cout << ${outArgs(arg)}${end}` : `cout${end.replace(' <<', ' <<')}`.replace('cout << endl;', 'cout << endl;')) + s.slice(close + 1 + semi);
    }
  }
  s = s.replace(/cout;/g, 'cout << "";').replace(/\b(\w+)\s+(\w+)\s*=\s*(?:int\.Parse|double\.Parse|Convert\.To\w+)\(\s*Console\.ReadLine\(\)\s*\)\s*;/g, '$1 $2; cin >> $2;').replace(/\bstring\s+(\w+)\s*=\s*Console\.ReadLine\(\)\s*;/g, 'string $1; cin >> $1;');
  // The Program wrapper and static methods.
  s = s.replace(/\bclass\s+Program\s*\{/, '');
  const lastBrace = s.lastIndexOf('}'); if (lastBrace >= 0) s = s.slice(0, lastBrace) + s.slice(lastBrace + 1);
  s = s.replace(/\bstatic\s+void\s+Main\s*\(\s*\)/, 'int main()').replace(/\bstatic\s+(void|int|double|string|bool|decimal|long|char)\s+(\w+)\s*\(/g, (m, t, n) => `${t === 'decimal' ? 'double' : t} ${n}(`);
  s = s.replace(/\b(?:ref|out)\s+(\w+)\s+(\w+)/g, '$1& $2').replace(/\b(?:ref|out)\s+(?:\w+\s+)?(\w+)\)/g, '$1)').replace(/\b(\w+)\(([^()]*)\bref\s+/g, '$1($2');
  // Types, arrays and loops.
  s = s.replace(/\bdecimal\b/g, 'double').replace(/(\d)m\b/g, '$1').replace(/\bvar\b/g, 'auto').replace(/\bforeach\s*\(\s*(\w+)\s+(\w+)\s+in\s+/g, 'for ($1 $2 : ');
  s = s.replace(/\b(int|double|string|bool|char|float|long)\s*\[\s*\]\s+(\w+)\s*=\s*new\s+\w+\s*\[\s*(\w+)\s*\]\s*;/g, '$1 $2[$3];').replace(/\bnew\s+\w*\s*\[\s*\]\s*\{/g, '{').replace(/\b(int|double|string|bool|char|float|long)\s*\[\s*\]\s+(\w+)\s*=/g, '$1 $2[] =');
  s = s.replace(/\b(int|double|string|bool|char|float|long)\s*\[\s*,\s*\]\s+(\w+)\s*=\s*\{\s*\{([^{}]*)\}/g, (m, t, n, row) => `${t} ${n}[][${row.split(',').length}] = { {${row}}`).replace(/\[\s*(\w+)\s*,\s*(\w+)\s*\]/g, '[$1][$2]');
  s = s.replace(/\.Length\b/g, '.size()').replace(/\.Count\b/g, '.size()').replace(/\bMath\.(Max|Min|Abs|Sqrt|Pow)\(/g, (m, f) => f.toLowerCase() + '(').replace(/\bstring\.IsNullOrWhiteSpace\(/g, 'isblank(');
  // Classes and structs: public: and a closing semicolon, and `new` becomes a plain declaration.
  s = s.replace(/\b(class|struct)\s+(\w+)\s*(?::\s*(\w+)\s*)?\{/g, (m, k, n, base) => `${k} ${n}${base ? ' : public ' + base : ''} {\npublic:`);
  s = s.replace(/\b(?:public|private|protected|internal)\s+(?=\w)/g, '').replace(/\boverride\b/g, '').replace(/\b(\w+)\s+(\w+)\s*=\s*new\s+\1\s*\(([^)]*)\)\s*;/g, (m, t, n, a) => (a.trim() ? `${t} ${n}(${a});` : `${t} ${n};`));
  let at = 0, guard = 0;
  while (guard++ < 20) { const m = /\b(class|struct)\s+\w+[^{]*\{\npublic:/g; m.lastIndex = at; const hit = m.exec(s); if (!hit) break; const open = hit.index + hit[0].indexOf('{'), close = closeAt(s, open); if (close < 0) break; if (s[close + 1] !== ';') s = s.slice(0, close + 1) + ';' + s.slice(close + 1); at = close + 2; }
  return bracify(s);
}
