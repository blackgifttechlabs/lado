import { TimedWorld, THREE, V, arc, plain, label, mat, clamp, lerp, inOut, outCubic, outBack, win } from './timed-world.js?v=20261014-cs-18';
import { tex, redraw, rr, INK, MUTED } from './office-kit.js?v=20261014-cs-18';

// Files: a library. Files are books on a shelf. A stream is a reader desk: it opens a book, shows the page,
// keeps a reading mark, has status lamps, and (for writing) a small buffer tray that waits to be saved.
const BOOKS=[0xd9453a,0x5a6dd4,0xd99a1f,0x2f9e63,0x9b5de5,0x2d7fb8];
const FLAG_NAMES=['in','out','app','trunc','binary','ate'];
const modeText=f=>FLAG_NAMES.filter((_,i)=>f&(1<<i)).join(' | ');
const showText=t=>String(t).replace(/\n/g,'↵');

export class FileWorld extends TimedWorld {
  constructor(mode) {
    super();this.mode=mode;this.cam={x:0,y:4.9,z:8.2,ty:2.0,tz:0};
    this.files=[];this.books=new Map();this.desks=new Map();this.door=null;this.includes=new Set();this.tagMesh2=null;
    const shelf=new THREE.Mesh(new THREE.BoxGeometry(9.4,.18,.9),mat(0x5b4631,.7,.1));shelf.position.set(0,2.9,-2.2);shelf.receiveShadow=true;this.scene.add(shelf);
    const back=new THREE.Mesh(new THREE.BoxGeometry(9.8,2.5,.2),mat(0x1c2b3a,.8,.1));back.position.set(0,3.95,-2.75);this.scene.add(back);
    this.shelfLabel=this.addLabel(this.scene,-3.7,5.0,-2.4,1.5,.34);this.setLabel(this.shelfLabel,'files on disk',{bg:'#e8f0ff',fg:'#16456b',size:80,w:384,h:100});
  }
  onReset() {
    this.books.forEach(b=>this.scene.remove(b.group));this.books.clear();this.desks.forEach(d=>this.scene.remove(d.group));this.desks.clear();
    if(this.door){this.scene.remove(this.door.group);this.door=null;}this.files=[];
  }
  setCode(code) {
    this.includes=new Set([...code.matchAll(/#include\s*<([^>]+)>/g)].map(m=>m[1]));
    if(this.mode==='include')this.ensureDoor();
  }
  // ---- the library door (headers) ----
  ensureDoor(error) {
    if(!this.door){
      const g=new THREE.Group(),t=tex(512,384,()=>{}),plane=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.95),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,side:THREE.DoubleSide}));
      plane.position.set(0,1.1,.1);const slab=new THREE.Mesh(new THREE.BoxGeometry(2.7,2.05,.1),mat(0x1b2c3c,.6,.2));slab.position.set(0,1.1,0);g.add(slab,plane);
      g.position.set(-4.6,0,.6);g.scale.setScalar(.01);this.scene.add(g);this.door={group:g,tex:t,spawn:performance.now(),open:0,openT:0};
    }
    const need=this.includes.has('fstream'),sub=this.includes.has('sstream');
    this.door.target=need?1:0;
    redraw(this.door.tex,(g,w,h)=>{
      g.fillStyle=need?'#e6f7ec':'#fde8e4';rr(g,4,4,w-8,h-8,22);g.fill();g.strokeStyle=need?'#2f9e63':'#d9453a';g.lineWidth=8;rr(g,4,4,w-8,h-8,22);g.stroke();
      g.fillStyle=INK;g.font='800 38px monospace';g.textAlign='center';g.textBaseline='middle';
      g.fillText('library door',w/2,50);
      g.font='800 34px monospace';g.fillStyle=need?'#1d7a49':'#b3382d';g.fillText('#include <fstream>',w/2,130);
      g.font='700 28px monospace';g.fillStyle=MUTED;g.fillText(need?'door open: keys inside':'locked: add the include',w/2,184);
      ['ifstream','ofstream','fstream'].forEach((k,i)=>{g.fillStyle=need?'#cfeedd':'#f3d3cd';rr(g,40+i*152,222,140,56,10);g.fill();g.fillStyle=INK;g.font='700 22px monospace';g.fillText(k,110+i*152,250);});
      if(sub||this.includes.has('sstream')){g.fillStyle='#cfe3f5';rr(g,40,296,436,50,10);g.fill();g.fillStyle=INK;g.font='700 22px monospace';g.fillText('#include <sstream>  →  stringstream',258,321);}
    });
  }
  // ---- books on the shelf ----
  syncBooks(files,instant) {
    this.files=files||[];
    const names=new Set(this.files.map(f=>f.name));
    this.books.forEach((b,n)=>{if(!names.has(n)){this.scene.remove(b.group);this.books.delete(n);}});
    const shown=this.files.slice(0,7);
    shown.forEach((f,i)=>{
      let b=this.books.get(f.name);
      if(!b){
        const g=new THREE.Group(),color=BOOKS[(this.books.size+(f.sample?0:2))%BOOKS.length];
        const body=new THREE.Mesh(new THREE.BoxGeometry(.78,1.15,.4),mat(color,.5,.15));body.castShadow=true;g.add(body);
        const t=tex(256,96,()=>{}),spine=new THREE.Mesh(new THREE.PlaneGeometry(.74,.3),new THREE.MeshBasicMaterial({map:t,toneMapped:false}));spine.position.set(0,.2,.21);g.add(spine);
        const nm=f.name.length>10?f.name.slice(0,9)+'…':f.name;
        redraw(t,(gg,w,h)=>{gg.fillStyle='#f6fafd';rr(gg,2,2,w-4,h-4,12);gg.fill();gg.fillStyle=INK;gg.font='800 34px monospace';gg.textAlign='center';gg.textBaseline='middle';gg.fillText(nm,w/2,h/2);});
        g.position.set(0,3.55,-2.15);g.scale.setScalar(.01);this.scene.add(g);
        b={group:g,spawn:instant?0:performance.now(),home:V(0,3.55,-2.15),away:false,name:f.name};this.books.set(f.name,b);
      }
    });
    const list=[...this.books.values()];
    list.forEach((b,i)=>{b.home=V((i-(list.length-1)/2)*1.0,3.55,-2.15);if(!b.away&&!b.flying)b.group.position.copy(b.home);});
  }
  // ---- stream desks ----
  ensureDesk(v,instant) {
    let d=this.desks.get(v.name);
    if(!d){
      const g=new THREE.Group(),t=tex(640,430,()=>{}),plane=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2.35),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,side:THREE.DoubleSide}));
      plane.position.set(0,1.3,.1);const slab=new THREE.Mesh(new THREE.BoxGeometry(3.6,2.45,.1),mat(0x1b2c3c,.6,.2));slab.position.set(0,1.3,0);slab.castShadow=true;g.add(slab,plane);
      const stand=new THREE.Mesh(new THREE.BoxGeometry(3.2,.14,.9),mat(0x5b4631,.7,.1));stand.position.set(0,.07,.1);g.add(stand);
      g.scale.setScalar(.01);this.scene.add(g);
      d={group:g,tex:t,name:v.name,snap:v.stream,spawn:instant?0:performance.now(),hi:null,flash:null,x:0,tx:0};this.desks.set(v.name,d);this.layoutDesks();
    }
    d.snap=v.stream;
    const at=this.delayed.get(v.name);
    if(instant||at===undefined)this.drawDesk(d);else this.later.push({at,fn:()=>this.drawDesk(d)});
  }
  layoutDesks() {const list=[...this.desks.values()],n=list.length,gap=3.9;list.forEach((d,i)=>{d.tx=(i-(n-1)/2)*gap+(n===1?.6:0);});}
  textOf(d){const S=d.snap;if(!S)return '';if(S.kind.includes('stringstream')||S.kind==='stringstream'||S.kind==='istringstream'||S.kind==='ostringstream')return S.str;return this.files.find(f=>f.name===S.path)?.text||'';}
  drawDesk(d) {
    const S=d.snap;if(!S)return;
    const isStr=/stringstream/.test(S.kind),text=this.textOf(d);
    redraw(d.tex,(g,w,h)=>{
      g.fillStyle='#f6fafd';rr(g,2,2,w-4,h-4,20);g.fill();g.strokeStyle='#b8cbd9';g.lineWidth=3;rr(g,2,2,w-4,h-4,20);g.stroke();
      g.fillStyle='#dbe9f5';rr(g,2,2,w-4,58,20);g.fill();g.fillRect(2,34,w-4,26);
      g.fillStyle=INK;g.textBaseline='middle';g.textAlign='left';g.font='800 30px monospace';g.fillText(`${d.name}`,22,32);
      g.textAlign='right';g.font='700 22px monospace';g.fillStyle=MUTED;g.fillText(isStr?S.kind:`${S.kind}  ${S.path?'"'+S.path+'"':''}`,w-20,32);
      // page
      const open=S.open||isStr;
      g.fillStyle=open?'#fbf7ea':'#e9e6dc';rr(g,22,76,w-44,206,12);g.fill();g.strokeStyle=open?'#d4c9a8':'#cfc9b8';g.lineWidth=3;rr(g,22,76,w-44,206,12);g.stroke();
      const lines=[];let idx=0;for(const ln of (text||'').split('\n')){lines.push({t:ln,from:idx});idx+=ln.length+1;}
      if(lines.length&&lines.at(-1).t==='')lines.pop();
      g.font='700 27px monospace';const cw=g.measureText('M').width;
      if(!open){g.fillStyle='#a79f8a';g.textAlign='center';g.fillText(S.path?'closed: the book is back on the shelf':'not opened yet',w/2,180);}
      else if(!lines.length){g.fillStyle='#c9bfa0';g.textAlign='left';g.fillText('(empty page)',44,112);}
      lines.slice(0,5).forEach((ln,i)=>{
        const y=112+i*38;
        if(d.hi&&d.hi.to>ln.from&&d.hi.from<ln.from+ln.t.length+1){
          const a=Math.max(0,d.hi.from-ln.from),b=Math.min(ln.t.length,d.hi.to-ln.from);
          g.fillStyle=d.hi.color||'#ffe28a';rr(g,44+a*cw-2,y-17,Math.max(cw*.8,(b-a)*cw)+4,34,6);g.fill();
        }
        g.fillStyle=INK;g.textAlign='left';g.font='700 27px monospace';g.fillText(ln.t.slice(0,30),44,y);
      });
      if(open&&text&&S.pos>=0&&S.mode&1||isStr&&S.pos>0){ // reading mark
        let rem=S.pos,li=0;for(;li<lines.length;li++){if(rem<=lines[li].t.length)break;rem-=lines[li].t.length+1;}
        if(li<5&&lines[li]){g.fillStyle='#2b7fd4';const x=44+Math.min(rem,30)*cw,y=112+li*38;g.beginPath();g.moveTo(x,y-24);g.lineTo(x-8,y-34);g.lineTo(x+8,y-34);g.closePath();g.fill();}
      }
      // lamps
      const lamp=(x,label,on,color)=>{g.fillStyle=on?color:'#c9d3dc';g.beginPath();g.arc(x,322,13,0,Math.PI*2);g.fill();g.strokeStyle=on?color:'#9fb0bf';g.lineWidth=2;g.stroke();g.fillStyle=INK;g.font='700 21px monospace';g.textAlign='left';g.fillText(label,x+22,322);};
      const good=open&&!S.fail&&!S.eof;
      lamp(40,'open',open,'#2f9e63');lamp(190,'good',good,'#2f9e63');lamp(330,'eof',S.eof,'#d99a1f');lamp(460,'fail',S.fail,'#d9453a');
      if(d.flash){g.strokeStyle=d.flash==='fail'?'#d9453a':'#2b7fd4';g.lineWidth=6;rr(g,6,6,w-12,h-12,20);g.stroke();}
      // buffer tray
      const buf=S.buf||'';
      g.fillStyle=buf?'#ffe9c7':'#eef2f6';rr(g,22,350,w-44,60,12);g.fill();g.strokeStyle=buf?'#d99a1f':'#cfd8e0';g.lineWidth=2;rr(g,22,350,w-44,60,12);g.stroke();
      g.fillStyle=buf?'#7a4b00':'#9fb0bf';g.font='700 23px monospace';g.textAlign='left';
      g.fillText(buf?`waiting to be saved: "${showText(buf).slice(0,24)}"`:(S.mode&2||S.mode&4?'buffer is empty':'(only writers have a buffer)'),36,380);
    });
  }
  // ---- events ----
  deskOf(name){return this.desks.get(name)||[...this.desks.values()][0];}
  deskPos(d){return V(d.tx,1.7,.4);}
  handle(e,evs,i,ofs) {
    switch(e.t) {
      case 'noinclude':return this.onNoInclude(e,ofs);
      case 'fopen':return this.onOpen(e,ofs);
      case 'fclose':return this.onClose(e,ofs);
      case 'fwrite':return this.onWrite(e,ofs);
      case 'swrite':return this.onWrite(e,ofs);
      case 'fflush':return this.onFlush(e,ofs);
      case 'fread':case 'fgetline':return this.onRead(e,evs,i,ofs);
      case 'fcheck':return this.onCheck(e,ofs);
      case 'fseek':return this.onSeek(e,ofs);
      case 'convert':return 500;
    }
    return 0;
  }
  onNoInclude(e,ofs) {
    this.tl(ofs,1,null,()=>{this.includes.delete(e.header);this.ensureDoor();this.tag(`add #include <${e.header}>`,'bad');});
    return 900;
  }
  bookFor(path){return this.books.get(path);}
  onOpen(e,ofs) {
    const d=this.deskOf(e.stream);
    if(!d)return 0;
    this.delayed.set(e.stream,this.abs(ofs+500));
    if(!e.ok){
      this.tl(ofs,1,null,()=>{d.flash='fail';this.drawDesk(d);});this.tl(ofs+1100,1,null,()=>{d.flash=null;this.drawDesk(d);});
      return 1200;
    }
    const b=this.bookFor(e.path),to=this.deskPos(d);
    if(b){
      b.away=true;const from=b.group.position.clone();
      this.tl(ofs,700,p=>{b.group.position.copy(arc(from,to.clone().add(V(0,-.4,.8)),inOut(p),1.0));b.group.scale.setScalar(lerp(1,.5,p));});
    }
    return 900;
  }
  onClose(e,ofs) {
    const d=this.deskOf(e.stream),b=this.bookFor(e.path);
    this.delayed.set(e.stream,this.abs(ofs+300));
    if(b&&b.away){const from=b.group.position.clone();this.tl(ofs+200,700,p=>{b.group.position.copy(arc(from,b.home,inOut(p),1.0));b.group.scale.setScalar(lerp(.5,1,p));},()=>{b.away=false;});}
    return 1000;
  }
  onWrite(e,ofs) {
    const d=this.deskOf(e.stream);if(!d)return 0;
    if(e.ok===false){this.tl(ofs,1,null,()=>{d.flash='fail';this.drawDesk(d);});this.tl(ofs+900,1,null,()=>{d.flash=null;this.drawDesk(d);});return 1000;}
    const txt=showText(e.text||'');
    if(txt){const chip=this.block(txt.slice(0,6),{tint:0xffe08a,size:.36});chip.scale.set(1.6,.7,.4);
      this.tl(ofs,700,p=>{chip.position.copy(arc(V(-1.5,3.4,2.4),d.group.position.clone().add(V(0,.9,.5)),inOut(p),.6));},()=>this.kill(chip));}
    this.delayed.set(e.stream,this.abs(ofs+650));
    return 800;
  }
  onFlush(e,ofs) {
    const d=this.deskOf(e.stream);if(!d)return 0;
    this.delayed.set(e.stream,this.abs(ofs+500));
    const txt=showText(e.text||'');
    if(txt){const chip=this.block(txt.slice(0,6),{tint:0xffe08a,size:.36});chip.scale.set(1.6,.7,.4);const from=d.group.position.clone().add(V(0,.5,.6));
      this.tl(ofs,600,p=>{chip.position.copy(arc(from,d.group.position.clone().add(V(0,1.7,.5)),inOut(p),.4));chip.material.opacity=1-p*.8;},()=>this.kill(chip));}
    return 800;
  }
  onRead(e,evs,i,ofs) {
    const d=this.deskOf(e.stream);if(!d)return 0;
    const from=e.from??0,to=e.to??from;
    this.tl(ofs,1,null,()=>{d.hi={from,to:Math.max(to,from+(e.ok?0:1)),color:e.ok?'#ffe28a':'#ffb08a'};d.flash=e.ok?null:'fail';this.drawDesk(d);});
    this.tl(ofs+1000,1,null,()=>{d.hi=null;d.flash=null;this.drawDesk(d);});
    if(e.ok&&(e.token!==undefined||e.line!==undefined)){
      const val=e.token!==undefined?e.token:e.line,dest=this.destFor(evs,i);
      const chip=this.block(String(val).slice(0,5),{tint:0xbfe3ff,size:.38});chip.scale.set(1.5,.8,.4);
      const start=d.group.position.clone().add(V(-.4,1.4,.5));
      this.tl(ofs+250,800,p=>{chip.position.copy(arc(start,dest.pos,inOut(p),.8));},()=>this.kill(chip));
      if(dest.name)this.delayed.set(dest.name,this.abs(ofs+1000));
    }
    this.delayed.set(e.stream,this.abs(ofs+300));
    return 1100;
  }
  destFor(evs,i) {
    for(let j=i+1;j<evs.length;j++){
      const e=evs[j];
      if((e.t==='set'||e.t==='method')&&e.name&&this.crates.get(e.name))return {pos:this.crates.get(e.name).group.position.clone().add(V(0,.9,0)),name:e.name};
      if(e.t==='declare'&&e.name)return {pos:this.crateSlot(this.crates.size).add(V(0,.9,0)),name:e.name};
    }
    return {pos:V(-4.6,1.4,.6)};
  }
  onCheck(e,ofs) {
    const d=this.deskOf(e.stream);if(!d)return 0;
    this.tl(ofs,1,null,()=>{d.flash=e.result&&e.method!=='eof'&&e.method!=='fail'&&e.method!=='bad'?null:(e.result?'fail':null);this.drawDesk(d);});
    this.tl(ofs+900,1,null,()=>{d.flash=null;this.drawDesk(d);});
    this.tl(ofs,1,null,()=>this.tag(`${e.stream||'stream'}.${e.method}() → ${e.result}`,e.result&&(e.method==='fail'||e.method==='eof')?'bad':'ok'));
    return 1000;
  }
  onSeek(e,ofs){const d=this.deskOf(e.stream);if(!d)return 0;this.delayed.set(e.stream,this.abs(ofs+200));return 500;}
  tagAnchor(){return V(0,3.4,.6);}
  // ---- syncing ----
  syncState(frame,instant) {
    this.syncBooks(frame.files,instant);
    this.syncCrates(frame.vars,instant);
    const names=new Set();
    frame.vars.filter(v=>v.kind==='stream'&&v.stream&&!v.stream.console).forEach(v=>{names.add(v.name);this.ensureDesk(v,instant);});
    this.desks.forEach((d,n)=>{if(!names.has(n)){this.scene.remove(d.group);this.desks.delete(n);this.layoutDesks();}});
    if(this.door&&this.mode!=='include'&&!this.door.keep)this.door.target=1;
    if(this.mode==='include')this.ensureDoor();
  }
  frameUpdate(now,dt) {
    const k=1-Math.exp(-dt*6);
    this.books.forEach(b=>{if(!b.flying&&!b.away&&b.group.scale.x<1.01&&now-b.spawn>=0){const s=clamp((now-b.spawn)/500);b.group.scale.setScalar(Math.max(.01,outBack(s)));}});
    this.desks.forEach(d=>{d.x+=(d.tx-d.x)*k;d.group.position.set(d.x,0,0);const s=clamp((now-d.spawn)/550);d.group.scale.setScalar(Math.max(.01,outBack(s)));});
    if(this.door){const s=clamp((now-this.door.spawn)/500);this.door.group.scale.setScalar(Math.max(.01,outBack(s)));this.door.open+=((this.door.target||0)-this.door.open)*k;this.door.group.rotation.y=this.door.open*.35;}
  }
}
