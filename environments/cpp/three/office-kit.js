import * as THREE from '../vendor/three/three.module.js';

// Small canvas-drawing helpers shared by the Structures, Classes and Files scenes.
export const INK='#16303f',MUTED='#6b8190',PAPER='#f6fafd';
export const ACCESS={public:'#2f9e63',private:'#d9453a',protected:'#d99a1f'};
export function tex(w,h,draw) {
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.userData={c,draw};return t;
}
export function redraw(t,draw,size) {
  const c=t.userData.c;if(size){c.width=size[0];c.height=size[1];}
  const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);draw(g,c.width,c.height);t.needsUpdate=true;
}
export function rr(g,x,y,w,h,r) {
  g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();
}
const plain=s=>{s=String(s);return /^'.*'$/.test(s)||/^".*"$/.test(s)?s.slice(1,-1):s;};
export const plainText=plain;
export function lock(g,x,y,s,color) {
  g.fillStyle=color;rr(g,x,y+s*.42,s,s*.58,3);g.fill();
  g.strokeStyle=color;g.lineWidth=Math.max(2,s*.14);g.beginPath();g.arc(x+s/2,y+s*.42,s*.28,Math.PI,0);g.stroke();
}
// How many text rows an object snapshot needs.
export function rowCount(snap,showStatics) {
  let n=0;
  for(const f of snap.fields){n+=1;if(f.obj)n+=rowCount(f.obj,false)+.5;if(f.kind==='array'&&f.data&&f.data.length>3)n+=0;}
  if(showStatics&&snap.statics?.length)n+=snap.statics.length;
  return n;
}
// Draw an object as a form card. o: {title, highlight:[names], flash, access:boolean, group:boolean, blueprint:boolean}
export function drawCard(g,w,h,snap,o={}) {
  const bp=!!o.blueprint;
  g.fillStyle=bp?'#0d3a5e':PAPER;rr(g,2,2,w-4,h-4,18);g.fill();
  g.strokeStyle=bp?'#7fc3ff':'#b8cbd9';g.lineWidth=bp?3:2;if(bp)g.setLineDash([10,8]);rr(g,2,2,w-4,h-4,18);g.stroke();g.setLineDash([]);
  g.fillStyle=bp?'#164f7c':'#dbe9f5';rr(g,2,2,w-4,64,18);g.fill();g.fillRect(2,40,w-4,26);
  g.fillStyle=bp?'#cfe8ff':INK;g.textBaseline='middle';g.textAlign='left';g.font='800 34px monospace';
  g.fillText(o.title||snap.cls,22,36);
  if(o.sub){g.font='700 22px monospace';g.fillStyle=bp?'#9fd0ff':MUTED;g.textAlign='right';g.fillText(o.sub,w-20,36);}
  let y=84;const rowH=o.rowH||52;
  const draw=(s,x0,depth)=>{
    for(const f of s.fields) {
      const hl=o.highlight&&o.highlight[depth]===f.name&&(o.highlight.length-1===depth||f.obj);
      const last=o.highlight&&o.highlight.length-1===depth&&o.highlight[depth]===f.name;
      if(hl&&last){g.fillStyle=o.flash==='write'?'#ffe9a8':'#cfeeff';rr(g,x0-6,y-rowH/2+4,w-x0-8,rowH-6,10);g.fill();}
      const col=o.access?ACCESS[f.access]||INK:(bp?'#cfe8ff':INK);
      if(o.access){g.fillStyle=ACCESS[f.access]||INK;g.fillRect(x0-12,y-rowH/2+8,5,rowH-14);}
      g.font=`700 ${depth?26:30}px monospace`;g.textAlign='left';g.fillStyle=col;const nx=x0+(o.access&&f.access==='private'?34:0);g.fillText(`${f.name}`,nx,y);
      if(o.access&&f.owner&&f.owner!==snap.cls&&depth===0){const nw=g.measureText(f.name).width;g.font='600 20px monospace';g.fillStyle=MUTED;g.fillText(`from ${f.owner}`,nx+nw+12,y+2);}
      if(o.access&&f.access==='private')lock(g,x0,y-14,24,ACCESS.private);
      if(!bp){g.textAlign='right';g.font=`800 ${depth?26:30}px monospace`;g.fillStyle=f.show==='?'?'#b07a00':INK;
        g.fillText(f.kind==='object'?'':(f.show.length>16?f.show.slice(0,15)+'…':plain(f.show)),w-24,y);}
      else{g.textAlign='right';g.font='600 24px monospace';g.fillStyle='#9fd0ff';g.fillText(f.type,w-24,y);}
      y+=rowH;
      if(f.obj){
        const top=y-rowH/2+6;g.strokeStyle=bp?'#7fc3ff':'#8fb4d2';g.lineWidth=2;
        const inner=rowCount(f.obj,false)*rowH;
        g.fillStyle=bp?'#10476f':'#e9f3fb';rr(g,x0+14,top-4,w-x0-40,inner+rowH*.5-6,10);g.fill();rr(g,x0+14,top-4,w-x0-40,inner+rowH*.5-6,10);g.stroke();
        y+=rowH*.2;draw(f.obj,x0+34,depth+1);y+=rowH*.3;
      }
    }
  };
  draw(snap,30,0);
  if(o.statics&&snap.statics?.length){
    g.fillStyle=MUTED;g.font='700 22px monospace';g.textAlign='left';
    for(const st of snap.statics){g.fillText(`static ${st.name} = ${st.show}`,30,y);y+=rowH*.7;}
  }
  return y;
}
export function cardHeight(snap,o={}) {const rowH=o.rowH||52;return 84+rowCount(snap,!!o.statics)*rowH+rowH*.6;}
// A text page for the file scenes. hi: {from,to} character range to highlight.
export function drawPage(g,w,h,text,o={}) {
  g.fillStyle='#fbf7ea';rr(g,2,2,w-4,h-4,14);g.fill();g.strokeStyle='#d4c9a8';g.lineWidth=3;rr(g,2,2,w-4,h-4,14);g.stroke();
  g.fillStyle='#b8ad8a';g.font='700 22px monospace';g.textAlign='left';g.textBaseline='middle';g.fillText(o.name||'',22,28);
  const lines=[];let idx=0;
  for(const line of (text||'').split('\n')){lines.push({t:line,from:idx});idx+=line.length+1;}
  if(lines.length&&lines.at(-1).t==='')lines.pop();
  const lh=44,x0=30,y0=84;
  lines.slice(0,9).forEach((ln,i)=>{
    const y=y0+i*lh;g.font='700 30px monospace';
    if(o.hi&&o.hi.to>ln.from&&o.hi.from<ln.from+ln.t.length+1){
      const a=Math.max(0,o.hi.from-ln.from),b=Math.min(ln.t.length,o.hi.to-ln.from);
      const cw=g.measureText('M').width;g.fillStyle=o.hiColor||'#ffe28a';rr(g,x0+a*cw-2,y-17,Math.max(cw,(b-a)*cw)+4,34,6);g.fill();
    }
    g.fillStyle=INK;g.fillText(ln.t,x0,y);
  });
  if(!lines.length){g.fillStyle='#c9bfa0';g.font='700 26px monospace';g.fillText('(empty)',x0,y0);}
  if(o.eofAt!==undefined){g.fillStyle='#d9453a';g.font='800 22px monospace';g.fillText('— end of file —',x0,h-26);}
}
export function drawBlueprintPage(g,w,h,t) {
  g.fillStyle='#0d3a5e';rr(g,2,2,w-4,h-4,14);g.fill();g.strokeStyle='#7fc3ff';g.lineWidth=3;g.setLineDash([10,8]);rr(g,2,2,w-4,h-4,14);g.stroke();g.setLineDash([]);
  g.fillStyle='#cfe8ff';g.font='800 36px monospace';g.textAlign='left';g.textBaseline='middle';g.fillText(`${t.kind} ${t.name}${t.base?' : '+t.base:''}`,24,40);
  let y=96;
  const row=(txt,color,ic)=>{g.fillStyle=color;g.font='700 26px monospace';if(ic==='lock')lock(g,24,y-14,22,color);g.fillText(txt,ic==='lock'?56:30,y);y+=40;};
  for(const m of t.members)row(`${m.static?'static ':''}${m.type} ${m.name}`,ACCESS[m.access]||'#cfe8ff',m.access==='private'?'lock':'');
  for(const m of t.methods)row(`${m.ctor?'':m.dtor?'':m.virt?'virtual ':''}${m.ctor||m.dtor?m.name:m.name}()`,ACCESS[m.access]||'#cfe8ff',m.access==='private'?'lock':'');
}
