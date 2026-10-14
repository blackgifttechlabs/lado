import { runCsharp } from './cs-run.js?v=20261014-cs-18';

// Do it yourself scene. Every token typed adds one more part to a detailed build. A mistake makes only the newest part slip and fall.
const R = (x, y, w, h, f, rx = 1, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${extra}/>`;
const C = (x, y, r, f, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${extra}/>`;
const P = (pts, f, extra = '') => `<polygon points="${pts}" fill="${f}" ${extra}/>`;
const L = (x1, y1, x2, y2, s = '#0003', w = 1) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}"/>`;
const PA = (d, f, s = 'none', w = 1) => `<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${w}"/>`;
const range = n => [...Array(n).keys()];

const DEFS = `<linearGradient id="gStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1d9a0"/><stop offset="1" stop-color="#c2994f"/></linearGradient>
<linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6f1ff"/><stop offset=".5" stop-color="#6fb1e0"/><stop offset="1" stop-color="#2f6797"/></linearGradient>
<linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f8fb"/><stop offset=".55" stop-color="#b7c0cc"/><stop offset="1" stop-color="#7f8a99"/></linearGradient>
<linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7d6b"/><stop offset=".5" stop-color="#d9362b"/><stop offset="1" stop-color="#8f1a14"/></linearGradient>
<linearGradient id="gBlue" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3f6fcf"/><stop offset=".5" stop-color="#7aa6f5"/><stop offset="1" stop-color="#2c51a6"/></linearGradient>
<linearGradient id="gBrick" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e07a58"/><stop offset="1" stop-color="#a8432b"/></linearGradient>
<linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98348"/><stop offset="1" stop-color="#6d4423"/></linearGradient>
<linearGradient id="gRoof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d4a3a"/><stop offset="1" stop-color="#4a271e"/></linearGradient>
<radialGradient id="gGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6b0" stop-opacity=".95"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></radialGradient>
<radialGradient id="gFlame" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fffbe0"/><stop offset=".4" stop-color="#ffc83d"/><stop offset="1" stop-color="#ff4d1a" stop-opacity=".1"/></radialGradient>`;

function skyscraper() {
  const p = [R(110, 215, 180, 10, '#5c6370', 2), R(122, 208, 156, 7, 'url(#gMetal)', 1)];
  [138, 172, 220, 254].forEach(x => p.push(R(x, 176, 9, 32, 'url(#gStone)', 1) + R(x - 2, 174, 13, 3, '#8d7a55', 1)));
  p.push(R(147, 178, 106, 30, 'url(#gGlass)', 1) + L(200, 178, 200, 208, '#fff8', 1.5) + L(173, 178, 173, 208, '#fff5') + L(227, 178, 227, 208, '#fff5'));
  p.push(C(200, 195, 11, '#0000', 'stroke="#c9d3df" stroke-width="2"') + L(189, 195, 211, 195, '#c9d3df', 2) + L(200, 184, 200, 206, '#c9d3df', 2));
  p.push(R(166, 169, 68, 6, 'url(#gRed)', 2) + L(170, 175, 170, 178, '#333') + L(230, 175, 230, 178, '#333'));
  range(8).forEach(f => {
    const y = 176 - 18 * (f + 1) + 0; const top = 176 - 18 * (f + 1);
    p.push(R(136, top, 128, 18, 'url(#gBlue)', 0) + L(136, top, 264, top, '#fff6', 1) + L(136, top + 17.5, 264, top + 17.5, '#0005', 1));
    p.push(range(7).map(i => R(142 + i * 17.5, top + 4, 13, 10, f % 3 === 1 ? '#ffe27a' : 'url(#gGlass)', 1) + L(142 + i * 17.5, top + 9, 155 + i * 17.5, top + 9, '#fff7')).join(''));
    p.push(R(133, top + 16, 134, 3, '#d8dee8', 1) + L(133, top + 17, 267, top + 17, '#fff9'));
  });
  p.push(R(132, 22, 136, 9, 'url(#gMetal)', 2));
  p.push(R(146, 11, 26, 11, '#8e98a6', 2) + L(150, 14, 168, 14, '#555') + L(150, 18, 168, 18, '#555'));
  p.push(R(178, 11, 26, 11, '#8e98a6', 2) + C(191, 16, 4, '#333'));
  p.push(R(224, 6, 24, 16, 'url(#gWood)', 3) + R(222, 4, 28, 4, '#4a2e17', 2) + L(228, 22, 226, 30, '#4a2e17', 2) + L(244, 22, 246, 30, '#4a2e17', 2));
  p.push(R(199, -26, 3, 48, '#cfd6e0', 1) + L(190, -6, 210, -6, '#cfd6e0', 1.5) + L(193, 4, 207, 4, '#cfd6e0', 1.5));
  p.push(C(200, -28, 5, '#ff4d4d') + C(200, -28, 14, 'url(#gGlow)', 'opacity=".7"'));
  p.push(R(138, 30, 3, 140, '#9fd8ff', 1, 'opacity=".55"') + R(259, 30, 3, 140, '#9fd8ff', 1, 'opacity=".55"'));
  p.push(PA('M150 12 L150 -4 L168 3 L150 9z', '#2fe08d'));
  return { name: 'skyscraper', sky: ['#1b2a6b', '#0b0d1f'], ground: '#2a2e38', parts: p, shift: 36 };
}
function pyramid() {
  const p = [], n = 8, w = 34, h = 22;
  range(n).forEach(l => { const m = n - l; range(m).forEach(i => {
    const x = 200 - m * w / 2 + i * w, y = 224 - h * (l + 1);
    p.push(R(x + .5, y + .5, w - 1, h - 1, 'url(#gStone)', 1) + R(x + .5, y + .5, w - 1, 3, '#fff6c8', 1, 'opacity=".55"') + P(`${x + w - 6},${y + 1} ${x + w - .5},${y + 1} ${x + w - .5},${y + h - .5} ${x + w - 6},${y + h - .5}`, '#6b4a1c', 'opacity=".25"') + L(x + 6, y + 9, x + 15, y + 9, '#8a6a2c', .8));
  }); });
  p.push(P('200,28 184,48 216,48', '#ffd24a') + P('200,28 200,48 216,48', '#c9962a'));
  p.push(R(188, 196, 24, 28, '#1b1208', 1) + R(185, 192, 30, 6, '#8d6b2e', 1));
  p.push(R(176, 200, 4, 20, '#5a3b16', 1) + C(178, 197, 4, '#ff9d1f') + C(178, 197, 10, 'url(#gGlow)'));
  p.push(R(220, 200, 4, 20, '#5a3b16', 1) + C(222, 197, 4, '#ff9d1f') + C(222, 197, 10, 'url(#gGlow)'));
  p.push(R(120, 160, 3, 30, '#ddd', 1) + PA('M123 160 L146 167 L123 174z', '#c0392b'));
  p.push(P('300,224 316,190 332,224', '#d8c392') + P('316,190 316,224 332,224', '#b79d66'));
  p.push(P('60,224 76,196 92,224', '#d8c392') + P('76,196 76,224 92,224', '#b79d66'));
  p.push(PA('M340 224 q4 -26 12 -26 q10 0 10 14 q0 8 -4 12', '#6b4a1c') + C(354, 196, 4, '#6b4a1c'));
  return { name: 'pyramid', sky: ['#5a2d91', '#1a0f33'], ground: '#a98443', parts: p, shift: 0 };
}
function wheel(cx, cy) {
  return [C(cx, cy, 24, '#161616') + C(cx, cy, 24, '#0000', 'stroke="#333" stroke-width="2"'), C(cx, cy, 15, 'url(#gMetal)') + C(cx, cy, 15, '#0000', 'stroke="#667" stroke-width="1"'),
    range(6).map(i => { const a = i * Math.PI / 3; return L(cx, cy, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, '#556', 2.4); }).join(''), C(cx, cy, 4, '#3b3f48') + C(cx, cy, 1.5, '#cfd6e0'),
    PA(`M${cx - 9} ${cy - 11} A14 14 0 0 1 ${cx + 9} ${cy - 11} L${cx + 6} ${cy - 5} L${cx - 6} ${cy - 5}z`, '#d4a017', '#00000055', .6)];
}
function car() {
  const p = [R(96, 176, 208, 8, '#1a1a1a', 3), R(84, 178, 20, 5, 'url(#gMetal)', 2) + R(78, 179, 8, 3, '#667', 1),
    R(86, 150, 16, 26, 'url(#gMetal)', 4), R(298, 152, 20, 24, 'url(#gMetal)', 4), R(98, 142, 204, 36, 'url(#gRed)', 12), R(122, 172, 156, 6, '#6e130f', 2),
    PA('M262 146 Q296 148 302 160 L302 146z', '#e24a3d'), PA('M98 146 Q100 142 130 142 L130 150 L98 154z', '#c42d22'),
    PA('M130 142 L158 106 L242 106 L268 142z', 'url(#gRed)'), PA('M158 106 Q200 98 242 106 L238 112 L162 112z', '#a31f17'),
    PA('M241 109 L262 140 L236 140 L236 109z', 'url(#gGlass)', '#2a4a66', 1), PA('M139 140 L160 109 L176 109 L176 140z', 'url(#gGlass)', '#2a4a66', 1),
    PA('M180 109 L200 109 L200 140 L180 140z', 'url(#gGlass)', '#2a4a66', 1), PA('M204 109 L232 109 L232 140 L204 140z', 'url(#gGlass)', '#2a4a66', 1),
    R(200, 108, 4, 34, '#7a1812', 1), L(176, 142, 176, 172, '#5b0f0b', 1.5) + L(232, 142, 232, 172, '#5b0f0b', 1.5), R(182, 150, 14, 3.5, '#e8eef5', 1), R(238, 150, 14, 3.5, '#e8eef5', 1),
    PA('M246 124 L262 122 L262 132 L248 134z', '#b02419', '#5b0f0b', 1), R(300, 146, 10, 10, '#e8eef5', 3) + R(302, 148, 6, 6, '#fff7b3', 2), C(306, 151, 12, 'url(#gGlow)', 'opacity=".8"'),
    PA('M310 151 L360 135 L360 168z', '#fff6b0', 'none', 0).replace('fill="#fff6b0"', 'fill="#fff6b0" opacity=".28"'), R(94, 148, 6, 12, '#ff3b30', 2) + R(94, 148, 6, 3, '#ff9a92', 1),
    range(4).map(i => R(298, 160 + i * 3.5, 12, 1.8, '#2b2b2b', 1)).join(''), R(106, 164, 20, 8, '#f3f3f3', 1) + L(109, 168, 123, 168, '#555', .8),
    PA('M118 178 A26 26 0 0 1 170 178z', '#101010'), PA('M230 178 A26 26 0 0 1 282 178z', '#101010')];
  p.push(...wheel(144, 178)); p.push(...wheel(256, 178).slice(0, 2).concat(wheel(256, 178).slice(2)));
  p.push(L(190, 106, 186, 80, '#333', 1.5) + C(186, 79, 2, '#333'), R(106, 130, 3, 14, '#222', 1) + R(122, 130, 3, 14, '#222', 1), PA('M96 128 L132 124 L132 130 L98 134z', '#111'),
    R(130, 156, 140, 2.5, '#fff', 1, 'opacity=".85"') + R(130, 160, 140, 1.5, '#fff', 1, 'opacity=".6"'), C(222, 158, 4, '#e8eef5') + L(220, 158, 224, 158, '#c42d22', 1), R(104, 152, 8, 5, '#222', 2));
  return { name: 'car', sky: ['#17406b', '#0a1428'], ground: '#2c2f38', parts: p, shift: 2 };
}
function rocket() {
  const cx = 150, p = [R(70, 218, 150, 7, 'url(#gMetal)', 2), R(86, 212, 118, 6, '#6b7280', 2), L(100, 212, 92, 190, '#7a8494', 4) + L(200, 212, 208, 190, '#7a8494', 4)];
  [-22, 0, 22].forEach(o => p.push(PA(`M${cx + o - 8} 188 L${cx + o + 8} 188 L${cx + o + 12} 206 L${cx + o - 12} 206z`, 'url(#gMetal)', '#556', 1)));
  p.push(R(cx - 36, 184, 72, 6, '#4b5563', 2));
  range(5).forEach(s => p.push(R(cx - 32, 184 - 26 * (s + 1), 64, 26, 'url(#gMetal)', 2) + L(cx - 32, 184 - 26 * (s + 1), cx + 32, 184 - 26 * (s + 1), '#fff9') + [-26, 26].map(x => C(cx + x, 184 - 26 * s - 6, 1.3, '#556') + C(cx + x, 184 - 26 * s - 20, 1.3, '#556')).join('') + R(cx + 14, 184 - 26 * (s + 1), 18, 26, '#0000', 1, 'fill-opacity="0"') + R(cx + 20, 184 - 26 * (s + 1), 12, 26, '#0003', 0, 'opacity=".25"')));
  [0, 2, 4].forEach(s => p.push(R(cx - 32, 184 - 26 * s - 12, 64, 7, 'url(#gRed)', 1)));
  [0, 1, 2].forEach(i => p.push(C(cx, 160 - i * 26, 10, '#3b4452') + C(cx, 160 - i * 26, 7.5, 'url(#gGlass)') + C(cx - 2, 158 - i * 26, 2, '#fff', 'opacity=".8"')));
  p.push(C(cx, 60 + 0, 0, '#0000'));
  p.push(PA(`M${cx - 32} 150 L${cx - 58} 192 L${cx - 32} 182z`, 'url(#gRed)', '#7f1d1d', 1), PA(`M${cx + 32} 150 L${cx + 58} 192 L${cx + 32} 182z`, 'url(#gRed)', '#7f1d1d', 1), PA(`M${cx - 4} 170 L${cx - 4} 196 L${cx + 4} 196 L${cx + 4} 170z`, '#b02419'));
  p.push(PA(`M${cx - 32} 54 Q${cx - 30} 40 ${cx} 18 Q${cx + 30} 40 ${cx + 32} 54z`, 'url(#gRed)', '#7f1d1d', 1), R(cx - 32, 52, 64, 4, '#7f1d1d', 1), R(cx - 1.5, 4, 3, 16, '#cfd6e0', 1) + C(cx, 4, 3, '#ff5252'));
  range(7).forEach(s => p.push(R(230, 214 - 28 * (s + 1), 14, 28, '#7a8494', 0) + L(230, 214 - 28 * s - 14, 244, 214 - 28 * s - 28, '#566', 1) + L(244, 214 - 28 * s - 14, 230, 214 - 28 * s - 28, '#566', 1)));
  [0, 1, 2].forEach(i => p.push(R(184, 190 - i * 52 - 6, 46, 5, '#9aa4b4', 1) + R(180, 188 - i * 52 - 6, 6, 9, '#6b7280', 1)));
  p.push(L(244, 24, 244, 214, '#0000') + R(228, 14, 18, 6, '#4b5563', 1) + C(237, 12, 4, '#ff5252') + C(237, 12, 14, 'url(#gGlow)', 'opacity=".6"'));
  p.push(PA(`M${cx - 22} 206 Q${cx - 24} 232 ${cx - 22} 244 Q${cx - 22} 232 ${cx - 18} 206z`, 'url(#gFlame)'), PA(`M${cx - 10} 206 Q${cx} 252 ${cx + 10} 206z`, 'url(#gFlame)'), PA(`M${cx + 22} 206 Q${cx + 24} 232 ${cx + 22} 244 Q${cx + 22} 232 ${cx + 18} 206z`, 'url(#gFlame)'));
  p.push(C(120, 232, 14, '#cfd6e0', 'opacity=".55"') + C(150, 238, 18, '#dfe6ee', 'opacity=".5"') + C(182, 232, 14, '#cfd6e0', 'opacity=".55"'));
  return { name: 'rocket', sky: ['#070b2a', '#1a1f4a'], ground: '#3a3f4b', parts: p, shift: 22 };
}
function bridge() {
  const p = [range(7).map(i => PA(`M${i * 60 - 20} 232 q15 -9 30 0 t30 0`, '#0000', '#7fd0ff', 1.5)).join('') + R(0, 232, 400, 28, '#0b3a5e', 0, 'opacity=".6"')];
  [100, 300].forEach(cx => range(5).forEach(b => p.push(R(cx - 18, 224 - 14 * (b + 1), 36, 14, '#9097a3', 1) + L(cx - 18, 224 - 14 * b - 7, cx + 18, 224 - 14 * b - 7, '#6b7280', 1) + R(cx + 8, 224 - 14 * (b + 1), 10, 14, '#0003', 0, 'opacity=".3"'))));
  [100, 300].forEach(cx => range(6).forEach(s => p.push(R(cx - 6, 152 - 17 * (s + 1), 12, 17, 'url(#gRed)', 1) + L(cx - 6, 152 - 17 * s - 8, cx + 6, 152 - 17 * s - 8, '#7f1d1d', 1))));
  range(10).forEach(i => p.push(R(36 + i * 33, 148, 33, 10, 'url(#gMetal)', 1) + L(36 + i * 33, 158, 69 + i * 33, 148, '#8892a0', 1) + R(36 + i * 33, 156, 33, 3, '#4b5563', 1)));
  p.push(range(11).map(i => L(40 + i * 32, 152, 52 + i * 32, 152, '#fff', 2)).join('') + R(36, 146, 330, 3, '#2b2f38', 0));
  p.push(L(36, 138, 366, 138, '#cfd6e0', 2) + range(21).map(i => L(40 + i * 16, 138, 40 + i * 16, 148, '#cfd6e0', 1)).join(''));
  p.push(PA('M30 148 Q60 90 100 40', '#0000', '#ffd24a', 3) + PA('M100 40 Q200 128 300 40', '#0000', '#ffd24a', 3));
  p.push(PA('M300 40 Q340 90 370 148', '#0000', '#ffd24a', 3));
  [[62, 111], [76, 94], [88, 70]].forEach(([x, y]) => p.push(L(x, y, x, 146, '#ffd24a', 1.3)));
  p.push(range(9).map(i => { const x = 120 + i * 20, y = 40 + 88 * (1 - Math.pow((x - 200) / 100, 2)) * 1; return L(x, 40 + (1 - Math.pow((x - 200) / 100, 2)) * 0 + 88 * (1 - Math.pow((x - 200) / 100, 2)), x, 146, '#ffd24a', 1.3); }).join(''));
  [[326, 104], [342, 86], [354, 70]].forEach(([x, y]) => p.push(L(x, y, x, 146, '#ffd24a', 1.3)));
  [70, 130, 190, 250, 310, 350].forEach(x => p.push(R(x, 120, 2.5, 26, '#333', 1) + C(x + 1, 119, 4, '#fff2a8') + C(x + 1, 119, 14, 'url(#gGlow)', 'opacity=".8"')));
  p.push(R(200, 138, 34, 10, '#2f80ed', 3) + R(206, 133, 20, 6, '#2f80ed', 2) + C(208, 149, 3.5, '#111') + C(226, 149, 3.5, '#111') + R(209, 134, 7, 4, '#bfe9ff', 1));
  return { name: 'bridge', sky: ['#103a63', '#e08a4a'], ground: '#0e4a74', parts: p, shift: -20 };
}
function house() {
  const p = [R(110, 208, 180, 12, '#7b7f87', 2), R(180, 214, 40, 6, '#a0a5ad', 1)];
  range(6).forEach(r => p.push(R(120, 208 - 20 * (r + 1), 160, 20, 'url(#gBrick)', 0) + range(r % 2 ? 9 : 8).map(i => L(120 + (r % 2 ? i * 20 - 10 : i * 20), 208 - 20 * (r + 1), 120 + (r % 2 ? i * 20 - 10 : i * 20), 208 - 20 * r, '#6e2a18', 1)).join('') + L(120, 208 - 20 * (r + 1), 280, 208 - 20 * (r + 1), '#6e2a18', 1.5)));
  p.push(R(184, 150, 32, 58, '#f4efe4', 1), R(188, 154, 24, 54, 'url(#gWood)', 2) + R(192, 158, 16, 20, '#0003', 1) + R(192, 182, 16, 20, '#0003', 1), C(207, 182, 2.3, '#ffd24a'), R(176, 142, 48, 6, '#e8e1d2', 2) + P('172,142 228,142 200,128', '#e8e1d2'));
  [[134, 154], [246, 154]].forEach(([x, y]) => p.push(R(x - 3, y - 3, 36, 38, '#f4efe4', 1) + R(x, y, 30, 32, 'url(#gGlass)', 1) + L(x + 15, y, x + 15, y + 32, '#f4efe4', 2) + L(x, y + 16, x + 30, y + 16, '#f4efe4', 2) + R(x + 6, y + 3, 6, 10, '#fff', 1, 'opacity=".4"')));
  [[134, 154], [246, 154]].forEach(([x, y]) => p.push(R(x - 12, y, 9, 32, '#3f7d5a', 1) + R(x + 33, y, 9, 32, '#3f7d5a', 1) + range(5).map(i => L(x - 12, y + 4 + i * 6, x - 3, y + 4 + i * 6, '#2b5a41')).join('') + R(x - 4, y + 34, 38, 4, '#e8e1d2', 1)));
  range(5).forEach(r => p.push(PA(`M${104 + r * 9} ${96 + r * 7 - 0} L200 ${58 + r * 7 - 6} L${296 - r * 9} ${96 + r * 7}z`, 'url(#gRoof)') + L(104 + r * 9, 96 + r * 7, 296 - r * 9, 96 + r * 7, '#2b140f', 1.4)));
  p.push(PA('M100 130 L200 50 L300 130', '#0000', '#2b140f', 3), R(240, 56, 20, 36, 'url(#gBrick)', 1) + range(4).map(i => L(240, 62 + i * 8, 260, 62 + i * 8, '#6e2a18')).join(''), R(236, 52, 28, 6, '#8b8f98', 1));
  p.push(C(250, 40, 6, '#e1e6ee', 'opacity=".8"'), C(258, 28, 8, '#d4dae3', 'opacity=".7"'), C(268, 14, 10, '#c8cfd9', 'opacity=".55"'));
  p.push(R(106, 128, 188, 4, '#c9ced6', 2), R(190, 96, 20, 20, '#f4efe4', 2) + C(200, 106, 7, 'url(#gGlass)') + L(200, 99, 200, 113, '#f4efe4', 1.5));
  [0, 1, 2, 3].forEach(g => p.push(range(5).map(i => PA(`M${30 + g * 0 + (g < 2 ? g * 52 : 0) + (g >= 2 ? 300 + (g - 2) * 52 : 0) + i * 9} 220 l0 -26 l4 -5 l4 5 l0 26z`, '#fff', '#c9ced6', .6)).join('') + R(26 + (g < 2 ? g * 52 : 300 + (g - 2) * 52), 204, 48, 3, '#f1f1f1', 1)));
  p.push(R(316, 188, 4, 32, '#6b4a2c', 1) + R(308, 176, 20, 14, '#2f80ed', 3) + R(312, 180, 12, 3, '#fff', 1));
  p.push(R(354, 160, 12, 60, 'url(#gWood)', 3), C(360, 140, 30, '#2f8f4e') + C(344, 156, 20, '#3aa862') + C(376, 156, 20, '#25773e'), C(98, 216, 12, '#2f8f4e') + C(84, 218, 9, '#3aa862'));
  p.push([86, 96, 104].map((x, i) => L(x + i * 3, 224, x + i * 3, 214, '#2f8f4e', 1.5) + C(x + i * 3, 212, 3.2, ['#ff5d8f', '#ffd24a', '#b57bff'][i])).join(''), PA('M196 220 Q210 232 250 238 L290 238 L270 232 Q226 226 214 220z', '#c9b99b'));
  return { name: 'house', sky: ['#2b1b63', '#e8844a'], ground: '#2f6a3d', parts: p, shift: 0 };
}
const BUILDERS = [skyscraper, pyramid, car, rocket, bridge, house];
const hash = t => [...String(t)].reduce((a, c) => a + c.charCodeAt(0), 0);
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tokens = code => Math.max(0, (String(code).match(/"(?:\\.|[^"\\\n])*"|\w+|[^\s\w]/g) || []).length - 13);

export function skeleton(scene) {
  scene.innerHTML = `<div class="csd-stage"><svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax meet" class="csd-svg"></svg><p class="csd-say"></p></div>
    <div class="csd-term"><div class="csd-term-bar"><i></i><i></i><i></i><span>terminal</span></div><pre class="csd-term-out"></pre></div>`;
  scene.theme = -1;
}
export function paint(scene, st, code) {
  const idx = hash(st.task) % BUILDERS.length, svg = scene.querySelector('.csd-svg');
  if (scene.theme !== idx) {
    scene.theme = idx; const T = BUILDERS[idx](); scene.T = T;
    svg.innerHTML = `<defs>${DEFS}<linearGradient id="csdsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sky[0]}"/><stop offset="1" stop-color="${T.sky[1]}"/></linearGradient></defs><rect width="400" height="260" fill="url(#csdsky)"/>` +
      range(26).map(i => `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 120}" r="${.6 + (i % 3) * .5}" fill="#fff" opacity="${.35 + (i % 4) * .15}"/>`).join('') +
      `<rect y="224" width="400" height="36" fill="${T.ground}"/><rect y="224" width="400" height="3" fill="#fff" opacity=".12"/><g transform="translate(0 ${T.shift || 0})">` +
      T.parts.map((part, i) => `<g class="csd-piece" style="--i:${i}">${part}</g>`).join('') + `</g><g class="csd-flag"><line x1="360" y1="150" x2="360" y2="224" stroke="#ddd" stroke-width="2.5"/><path d="M360 150 L392 160 L360 170z" fill="#2fe08d"/></g>`;
  }
  const N = scene.T.parts.length, typed = tokens(code), shown = st.solved ? N : Math.min(N - 1, typed);
  const pieces = svg.querySelectorAll('.csd-piece');
  pieces.forEach((g, i) => { g.classList.toggle('on', i < shown); g.classList.remove('is-wobble', 'is-fell'); });
  const last = pieces[shown - 1];
  const fell = !st.solved && st.fellCode !== undefined && st.fellCode === code, broken = !st.solved && !!st.err;
  if (last && (fell || broken)) last.classList.add(fell ? 'is-fell' : 'is-wobble');
  svg.classList.toggle('is-done', st.solved);
  const say = scene.querySelector('.csd-say'), name = scene.T.name;
  say.textContent = fell ? 'That part fell off. Fix the code and it goes back.' : broken ? 'A part slipped. Check the terminal.' : st.solved ? `Your ${name} is finished!` : `Building a ${name}: ${shown} of ${N} parts`;
  say.dataset.tone = fell || broken ? 'bad' : st.solved ? 'good' : '';
  const out = runCsharp(code), term = scene.querySelector('.csd-term-out');
  term.innerHTML = `<span class="csd-p">$ dotnet run</span>\n` + (/^error|\nerror:/m.test(out) ? `<span class="csd-bad">${esc(out)}</span>` : /^(This preview|This program opens|The preview could not)/.test(out) ? `<span class="csd-dim">${esc(out)}</span>` : esc(out)) + '<i class="csd-cur"></i>';
}
export function syncDiy(stage, lab, editor) {
  let scene = stage.querySelector('.cpp-loop-scene.is-csd');
  if (!scene) {
    stage.querySelector('.cpp-loop-scene.is-cs')?.remove();
    scene = document.createElement('section'); scene.className = 'cpp-loop-scene is-csd'; stage.appendChild(scene); skeleton(scene);
    scene.st = { ok: 0, total: 1, err: '', solved: false, task: 'x' };
    lab.addEventListener('cs-practice', e => {
      const d = e.detail; scene.st = { ...d, fellCode: d.checked && !d.solved ? editor.value : (d.task === scene.st.task ? scene.st.fellCode : undefined) }; scene.code = undefined;
    });
  }
  stage.classList.add('has-loop');
  const key = editor.value + JSON.stringify(scene.st);
  if (scene.code === key) return;
  scene.code = key; clearTimeout(scene.timer);
  scene.timer = setTimeout(() => { if (scene.isConnected) paint(scene, scene.st, editor.value); }, 120);
}
