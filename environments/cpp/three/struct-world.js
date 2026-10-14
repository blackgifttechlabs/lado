import { TimedWorld, THREE, V, arc, plain, label, mat, clamp, lerp, inOut, outCubic, outBack, win } from './timed-world.js?v=20261014-cs-11';
import { tex, redraw, rr, drawCard, cardHeight, drawBlueprintPage, INK, MUTED } from './office-kit.js?v=20261014-cs-11';

// Structures: a records office. A struct is a blank form (blueprint); each variable is a filled-in card.
export const CARD_W=3.0;
export class CardMesh {
  constructor(world,snap,opts) {
    this.world=world;this.snap=snap;this.opts=opts;this.hl=null;this.flash=null;
    this.group=new THREE.Group();
    this.tex=tex(512,300,()=>{});
    this.plane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:this.tex,transparent:true,toneMapped:false,side:THREE.DoubleSide}));
    this.slab=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat(0x1b2c3c,.6,.2));this.slab.castShadow=true;
    this.group.add(this.slab,this.plane);
    this.tag=world.addLabel(this.group,0,0,0,1.5,.36);
    world.scene.add(this.group);this.redraw();
  }
  redraw() {
    const page=this.opts.page,hgt=page?(page.members.length+page.methods.length)*40+120:Math.ceil(cardHeight(this.snap,this.opts)),o={...this.opts,highlight:this.hl,flash:this.flash};
    redraw(this.tex,(g,w,h)=>page?drawBlueprintPage(g,w,h,page):drawCard(g,w,h,this.snap,o),[512,hgt]);
    const ph=CARD_W*hgt/512;this.height=ph;
    this.plane.scale.set(CARD_W,ph,1);this.plane.position.set(0,ph/2+.15,.05);
    this.slab.scale.set(CARD_W+.08,ph+.08,.08);this.slab.position.set(0,ph/2+.15,0);
    this.tag.position.set(0,ph+.55,0);
  }
  setSnap(snap){this.snap=snap;this.redraw();}
  highlight(path,flash){this.hl=path;this.flash=flash;this.redraw();}
  clear(){this.hl=null;this.flash=null;this.redraw();}
  dispose(){this.world.scene.remove(this.group);}
}
export const setPath=(snap,path,value)=>{
  let s=snap;
  for(let i=0;i<path.length;i++){
    const f=s.fields?.find(x=>x.name===path[i]);if(!f)return;
    if(i===path.length-1){f.show=value;return;}
    s=f.obj;if(!s)return;
  }
};
export const deep=o=>JSON.parse(JSON.stringify(o));
const SIZES={int:4,float:4,double:8,char:1,bool:1,long:8,short:2};

export class StructWorld extends TimedWorld {
  constructor(mode) {
    super();this.mode=mode;this.cam={x:0,y:4.4,z:7.4,ty:1.3,tz:0};
    this.items=[];this.bp=new Map();this.cards=new Map();this.racks=new Map();this.dials=new Map();this.unions=new Map();this.types=new Map();
    this.calls=new Map();this.stack=[];this.counter=null;
  }
  onReset() {
    this.items.forEach(i=>this.scene.remove(i.group));this.items=[];this.bp.clear();this.cards.clear();this.racks.clear();this.dials.clear();this.unions.clear();this.types.clear();
    this.calls.clear();this.stack=[];if(this.counter){this.scene.remove(this.counter.group);this.counter=null;}
  }
  // ---- layout: every item sits in one tidy row ----
  addItem(kind,group,width,extra={}) {
    const item={kind,group,width,x:0,tx:0,spawn:this.instant?0:performance.now(),...extra};
    group.position.set(0,0,0);this.scene.add(group);this.items.push(item);this.relayout();return item;
  }
  removeItem(item){this.scene.remove(item.group);this.items=this.items.filter(i=>i!==item);this.relayout();}
  relayout() {
    const gap=.5,total=this.items.reduce((a,i)=>a+i.width,0)+gap*Math.max(0,this.items.length-1);
    const scale=Math.min(1,9.2/Math.max(1,total));this.layoutScale=scale;
    let x=-total/2;
    this.items.forEach(i=>{i.tx=(x+i.width/2)*scale;x+=i.width+gap;});
  }
  // ---- blueprints ----
  blueprintOpts(t){return {blueprint:true,title:`${t.kind} ${t.name}`,sub:'blank form'};}
  blueprintSnap(t){return {cls:t.name,fields:t.members.filter(m=>!m.static).map(m=>({name:m.name,type:m.type,access:m.access,show:'',kind:'scalar'})),statics:[]};}
  makeBlueprint(t) {
    if(this.bp.has(t.name))return;
    const card=new CardMesh(this,this.blueprintSnap(t),this.blueprintOpts(t));
    card.tag.visible=false;
    const item=this.addItem('bp',card.group,CARD_W,{card});this.bp.set(t.name,item);
  }
  // ---- events ----
  handle(e,evs,i,ofs) {
    switch(e.t) {
      case 'type':this.tl(ofs,1,null,()=>{this.types.set(e.name,e);if(!['enum'].includes(e.kind))this.makeBlueprint(e);});return 700;
      case 'get':case 'wset':return this.onAccess(e,ofs);
      case 'call':return this.onCall(e,ofs);
      case 'return':return this.onReturn(e,ofs);
      case 'union':return this.onUnion(e,ofs);
      case 'denied':return 400;
    }
    return 0;
  }
  holder(name) {
    const c=this.cards.get(name)||this.cards.get(this.ptrMap?.[name]);if(c)return {card:c.card,item:c};
    return null;
  }
  onAccess(e,ofs) {
    const write=e.t==='wset';let target=this.holder(e.obj),path=e.path;
    const ctx=this.stack.at(-1),mapped=ctx?.refMap?.[e.obj];
    if(!target&&mapped)target=this.holder(mapped);
    const copy=ctx?.copies?.get(e.obj);
    if(copy){
      this.tl(ofs,500,p=>{if(p<.3)copy.highlight(path,write?'write':'read');},()=>{if(write){setPath(copy.snap,path,e.value);copy.redraw();}});
      this.tl(ofs+600,1,null,()=>copy.clear());return 700;
    }
    const rack=this.racks.get(e.obj);
    if(rack&&typeof path[0]==='number'){
      const idx=path[0],cell=rack.cells[idx];if(!cell)return 0;
      this.tl(ofs,700,p=>{cell.lift=Math.sin(p*Math.PI);if(p<.3)cell.card.highlight(path.slice(1),write?'write':'read');},()=>{cell.lift=0;});
      if(write){this.delayed.set(e.obj,this.abs(ofs+300));}
      this.tl(ofs+800,1,null,()=>cell.card.clear());return 900;
    }
    if(!target)return 0;
    const card=target.card;
    if(write&&mapped)this.delayed.set(mapped,this.abs(ofs+300));else if(write)this.delayed.set(e.obj,this.abs(ofs+300));
    this.tl(ofs,500,p=>{if(p<.2)card.highlight(path,write?'write':'read');});
    this.tl(ofs+800,1,null,()=>card.clear());
    return 900;
  }
  // ---- passing structs to functions ----
  ensureCounter(name) {
    if(this.counter){if(this.counter.name!==name){this.counter.name=name;this.counter.setPlate(name);}return this.counter;}
    const g=new THREE.Group(),desk=new THREE.Mesh(new THREE.BoxGeometry(2.2,.5,1.2),mat(0x2d7fb8,.4,.4));desk.position.y=.25;desk.castShadow=true;g.add(desk);
    const tag=this.addLabel(g,0,.9,0,1.8,.4);
    g.position.set(2.4,0,2.7);g.scale.setScalar(.01);this.scene.add(g);
    this.counter={group:g,name,tag,spawn:performance.now(),setPlate:n=>this.setLabel(tag,`${n}( )`,{bg:'#fff3c7',fg:'#4a3300',size:90,w:384,h:100})};
    this.counter.setPlate(name);return this.counter;
  }
  onCall(e,ofs) {
    if(this.mode!=='pass'&&!e.args.some(a=>this.cards.has(a.from)))return 0;
    const ctx={id:e.id,copies:new Map(),refMap:{},lifted:[],slips:[],e};this.calls.set(e.id,ctx);this.stack.push(ctx);
    const counter=this.ensureCounter(e.fn),spot=V(2.4,.6,2.7);let end=500;
    e.args.forEach((a,k)=>{
      const src=a.from?this.cards.get(a.from):null,t0=ofs+k*150;
      if(a.byRef&&src){
        const item=src,home=item.group.position.clone();ctx.refMap[a.name]=a.from;ctx.lifted.push({item,home});item.hold=true;
        this.tl(t0,800,p=>{item.group.position.copy(arc(home,spot.clone().add(V(0,.9+k*.1,.4)),inOut(p),1.2));});return;
      }
      if(a.ptr&&src){
        ctx.refMap[a.name]=a.target||a.from;
        const slip=this.block(`&${a.target||a.from}`,{tint:0xffe08a,size:.36});slip.scale.set(1.7,.5,.3);ctx.slips.push(slip);
        const start=src.group.position.clone().add(V(0,src.card.height+.6,.2));
        this.tl(t0,800,p=>{slip.position.copy(arc(start,spot.clone().add(V(0,1.6,0)),inOut(p),.8));});return;
      }
      if(src){
        const copy=new CardMesh(this,deep(src.card.snap),{...src.card.opts,sub:'copy'});copy.tag.visible=false;ctx.copies.set(a.name,copy);
        const start=src.group.position.clone(),to=spot.clone().add(V(-.2,.4,.6));copy.group.scale.setScalar(.01);
        this.tl(t0,800,p=>{copy.group.position.copy(arc(start,to,inOut(p),1.0));copy.group.scale.setScalar(lerp(.2,.5,inOut(p)));});return;
      }
      const b=this.block(a.value,{tint:0xbfe3ff});ctx.slips.push(b);
      this.tl(t0,800,p=>{b.position.copy(arc(V(-3,2,1.4),spot.clone().add(V(0,1.4,0)),inOut(p),.8));});
    });
    end=800+(e.args.length-1)*150+200;return end;
  }
  onReturn(e,ofs) {
    const ctx=this.calls.get(e.id);if(!ctx)return 0;
    this.stack=this.stack.filter(c=>c!==ctx);this.calls.delete(e.id);
    ctx.copies.forEach(c=>{this.tl(ofs,600,p=>{c.group.scale.setScalar(.5*(1-inOut(p)));c.group.position.y-=.01;},()=>c.dispose());});
    ctx.slips.forEach(b=>{this.tl(ofs,500,p=>{b.material.opacity=1-p;},()=>this.kill(b));});
    ctx.lifted.forEach(({item,home})=>{const from=item.group.position.clone();this.tl(ofs,800,p=>{item.group.position.copy(arc(from,home,inOut(p),1.0));},()=>{item.hold=false;});});
    return 900;
  }
  // ---- unions ----
  onUnion(e,ofs) {
    const u=this.unions.get(e.obj)||[...this.unions.values()][0];if(!u)return 0;
    this.tl(ofs,1,null,()=>{u.bytes=e.bytes;u.hi={name:e.name,op:e.op,reinterpret:!!e.reinterpret,from:e.from};u.dirty=true;u.until=performance.now()+1600;});
    return 1000;
  }
  drawUnion(u) {
    redraw(u.tex,(g,w,h)=>{
      g.fillStyle=u.blueprint?'#0d3a5e':'#f6fafd';rr(g,2,2,w-4,h-4,16);g.fill();g.strokeStyle='#b8cbd9';g.lineWidth=2;rr(g,2,2,w-4,h-4,16);g.stroke();
      g.fillStyle=INK;g.font='800 30px monospace';g.textAlign='left';g.textBaseline='middle';g.fillText(`union ${u.cls}  ·  one box of ${u.size} bytes`,24,34);
      const cw=Math.min(90,(w-60)/u.size);const x0=(w-cw*u.size)/2;
      for(let i=0;i<u.size;i++){
        const b=u.bytes?.[i]??0,hot=u.hi&&u.hi.op==='write';
        g.fillStyle=hot?'#c9f2d9':'#e4eef7';rr(g,x0+i*cw+3,70,cw-6,70,8);g.fill();g.strokeStyle='#8fb4d2';rr(g,x0+i*cw+3,70,cw-6,70,8);g.stroke();
        g.fillStyle=INK;g.font='800 28px monospace';g.textAlign='center';g.fillText(b.toString(16).padStart(2,'0').toUpperCase(),x0+i*cw+cw/2,105);
      }
      u.fields.forEach((f,k)=>{
        const sz=Math.min(u.size,SIZES[f.type]||4),y=170+k*58;
        const on=u.hi&&u.hi.name===f.name,color=on?(u.hi.op==='write'?'#2f9e63':'#2b7fd4'):'#8fb4d2';
        g.fillStyle=on?(u.hi.op==='write'?'#d3f5e1':'#d6e9fb'):'#eef4fa';rr(g,x0+3,y-20,cw*sz-6,40,8);g.fill();g.strokeStyle=color;g.lineWidth=on?3:2;rr(g,x0+3,y-20,cw*sz-6,40,8);g.stroke();
        g.fillStyle=color;g.font='800 24px monospace';g.textAlign='left';g.fillText(`${f.type} ${f.name}`,x0+14,y);
        g.fillStyle=INK;g.textAlign='left';g.font='700 26px monospace';g.fillText('= '+plain(f.show).slice(0,14),x0+cw*sz+8,y);
      });
      if(u.hi&&u.hi.reinterpret){g.fillStyle='#b05a00';g.font='800 24px monospace';g.textAlign='center';g.fillText(`same bytes, read as ${u.hi.name}`,w/2,h-22);}
    },[640,170+u.fields.length*58+60]);
    const ph=3.2*u.tex.userData.c.height/640;u.plane.scale.set(3.2,ph,1);u.plane.position.set(0,ph/2+.15,.05);u.slab.scale.set(3.3,ph+.08,.08);u.slab.position.y=ph/2+.15;u.height=ph;
  }
  // ---- syncing with the variables ----
  syncState(frame,instant,ofs) {
    const vars=frame.vars;this.syncCrates(vars,instant);
    const names=new Set();
    vars.forEach(v=>{
      if(v.kind==='object'&&v.obj){
        names.add(v.name);
        if(v.obj.union){this.ensureUnion(v);return;}
        this.ensureCard(v,instant);
      } else if(v.kind==='array'&&v.objs){names.add(v.name);this.ensureRack(v,instant);}
      else if(v.kind==='enum'){names.add(v.name);this.ensureDial(v,instant);}
    });
    [...this.cards.keys(),...this.racks.keys(),...this.dials.keys(),...this.unions.keys()].forEach(n=>{if(!names.has(n))this.dropVar(n);});
    this.syncPointers(vars);
  }
  dropVar(name) {
    for(const m of [this.cards,this.racks,this.dials,this.unions]){const it=m.get(name);if(it){this.removeItem(it);m.delete(name);}}
  }
  cardOpts(v){return {title:`${v.name}`,sub:v.obj.cls};}
  decorate(item,v){}
  ensureCard(v,instant) {
    const snap=v.obj,opts=this.cardOpts(v),sig=JSON.stringify(snap);
    let item=this.cards.get(v.name);
    if(!item){
      const card=new CardMesh(this,deep(snap),opts);card.tag.visible=false;
      item=this.addItem('card',card.group,CARD_W,{card,sig});this.cards.set(v.name,item);this.decorate(item,v);
      const bp=this.bp.get(snap.cls);
      if(!instant&&bp){const from=bp.group.position.clone();item.group.position.copy(from);item.born=performance.now();item.fromX=from.x;}
      return;
    }
    if(item.sig===sig)return;
    item.sig=sig;
    const at=this.delayed.get(v.name),apply=()=>{item.card.setSnap(deep(snap));};
    if(instant||at===undefined)apply();else this.later.push({at,fn:apply});
  }
  ensureRack(v,instant) {
    let item=this.racks.get(v.name);const sig=JSON.stringify(v.objs);
    if(!item){
      const g=new THREE.Group(),n=v.objs.length,cw=2.35,gap=.12,width=n*cw+(n-1)*gap+.3,rows=Math.max(...v.objs.map(o=>o.fields.length))+1;
      const ch=Math.max(1.9,(rows*52+84)/512*CARD_W*.74+.5);
      const cab=new THREE.Mesh(new THREE.BoxGeometry(width,ch,.3),mat(0x2b3947,.6,.3));cab.position.set(0,ch/2+.05,-.25);cab.castShadow=true;g.add(cab);
      const tag=this.addLabel(g,0,ch+.5,0,2,.4);this.setLabel(tag,`${v.type}  ${v.name}`,{bg:'#e8f0ff',fg:'#16456b',size:80,w:384,h:100});
      const cells=v.objs.map((snap,i)=>{
        const card=new CardMesh(this,deep(snap),{title:`${v.name}[${i}]`,sub:snap.cls,rowH:50});card.tag.visible=false;
        card.group.scale.setScalar(.74);g.add(card.group);card.group.position.set((i-(n-1)/2)*(cw+gap),.2,0);
        return {card,lift:0,x:(i-(n-1)/2)*(cw+gap)};
      });
      item=this.addItem('rack',g,width,{cells,sig});this.racks.set(v.name,item);return;
    }
    if(item.sig===sig)return;item.sig=sig;
    const apply=()=>item.cells.forEach((c,i)=>{if(v.objs[i])c.card.setSnap(deep(v.objs[i]));});
    const at=this.delayed.get(v.name);if(instant||at===undefined)apply();else this.later.push({at,fn:apply});
  }
  ensureDial(v,instant) {
    const en=v.en,info=this.types.get(en.type),names=en.names||[],n=Math.max(1,names.length);
    let item=this.dials.get(v.name);
    if(!item){
      const g=new THREE.Group(),t=tex(512,512,()=>{});
      const wheel=new THREE.Mesh(new THREE.CircleGeometry(1.2,48),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}));wheel.position.y=1.5;g.add(wheel);
      const arrow=new THREE.Mesh(new THREE.ConeGeometry(.16,.8,16),mat(0xffdc5a,.35,.3,{emissive:0x553d00}));arrow.position.set(0,1.5,.12);g.add(arrow);
      const tag=this.addLabel(g,0,3.0,0,2.2,.42);
      item={group:g,width:2.6,kind:'dial',x:0,tx:0,spawn:performance.now(),wheel,arrow,tex:t,names,angle:0,target:0,tag,scoped:!!info?.scoped,type:en.type};
      g.position.set(0,0,0);this.scene.add(g);this.items.push(item);this.relayout();this.dials.set(v.name,item);
      redraw(t,(gg,w,h)=>{
        gg.translate(w/2,h/2);gg.fillStyle='#f6fafd';gg.beginPath();gg.arc(0,0,250,0,Math.PI*2);gg.fill();gg.strokeStyle='#8fb4d2';gg.lineWidth=6;gg.stroke();
        names.forEach((nm,i)=>{
          const a0=i/n*Math.PI*2-Math.PI/2,a1=(i+1)/n*Math.PI*2-Math.PI/2,am=(a0+a1)/2;
          gg.strokeStyle='#b8cbd9';gg.lineWidth=3;gg.beginPath();gg.moveTo(0,0);gg.lineTo(Math.cos(a0)*250,Math.sin(a0)*250);gg.stroke();
          gg.fillStyle=INK;gg.font='800 34px monospace';gg.textAlign='center';gg.textBaseline='middle';gg.fillText(nm,Math.cos(am)*150,Math.sin(am)*150);
          gg.fillStyle='#9ab';gg.font='700 24px monospace';gg.fillText(String(i),Math.cos(am)*205,Math.sin(am)*205);
        });
      });
    }
    const idx=Math.max(0,names.indexOf(en.name));item.target=-((idx+.5)/n*Math.PI*2);
    if(instant)item.angle=item.target;
    this.setLabel(item.tag,`${item.scoped?'enum class':'enum'} ${en.type}  ${v.name} = ${item.scoped?en.type+'::':''}${en.name}`,{bg:'#fff3c7',fg:'#4a3300',size:70,w:512,h:100});
  }
  ensureUnion(v) {
    let item=this.unions.get(v.name);const o=v.obj;
    if(!item){
      const g=new THREE.Group(),t=tex(640,300,()=>{});
      const plane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,side:THREE.DoubleSide}));
      const slab=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat(0x1b2c3c,.6,.2));g.add(slab,plane);
      const size=Math.max(...o.fields.map(f=>SIZES[f.type]||4));
      item={group:g,width:3.3,kind:'union',x:0,tx:0,spawn:performance.now(),tex:t,plane,slab,cls:o.cls,fields:o.fields,size,bytes:Array(size).fill(0),hi:null,dirty:true};
      this.scene.add(g);this.items.push(item);this.relayout();this.unions.set(v.name,item);
    }
    item.fields=o.fields;item.dirty=true;
  }
  syncPointers(vars) {
    // a small slip above a card shows which pointer points at it
    this.ptrMap={};vars.filter(v=>v.kind==='ptr'&&v.target).forEach(v=>{this.ptrMap[v.name]=v.target;});
    this.cards.forEach(c=>{c.pointers=[];});
    vars.filter(v=>v.kind==='ptr'&&v.target&&this.cards.has(v.target)).forEach(v=>this.cards.get(v.target).pointers.push(v.name));
    this.cards.forEach(c=>{
      const txt=c.pointers.length?`${c.pointers.join(', ')} → here`:'';
      c.card.tag.visible=!!txt;if(txt)this.setLabel(c.card.tag,txt,{bg:'#ffe9a8',fg:'#4a3300',size:80,w:384,h:100});
    });
  }
  // ---- per frame ----
  frameUpdate(now,dt) {
    const k=1-Math.exp(-dt*6),s=this.layoutScale||1;
    this.items.forEach(i=>{
      const sp=clamp((now-i.spawn)/600),grow=i.kind==='bp'||i.kind==='card'||i.kind==='rack'||i.kind==='union'||i.kind==='dial'?outBack(sp):1;
      if(!i.hold){i.x+=(i.tx-i.x)*k;}
      if(i.born&&now-i.born<900){const t=inOut((now-i.born)/900);i.group.position.x=lerp(i.fromX,i.tx,t);i.x=i.group.position.x;i.group.scale.setScalar(Math.max(.01,lerp(.4,1,t))*s);}
      else {if(!i.hold){i.group.position.x=i.x;i.group.position.z=0;i.group.position.y=0;}if(!i.born||now-i.born>=900)i.group.scale.setScalar(Math.max(.01,grow)*s*(i.kind==='card'||i.kind==='bp'?1:1));}
    });
    this.racks.forEach(r=>r.cells.forEach(c=>{c.card.group.position.z=c.lift*.7;c.card.group.position.y=.2+c.lift*.25;}));
    this.dials.forEach(d=>{d.angle+=(d.target-d.angle)*(1-Math.exp(-dt*5));});
    this.dials.forEach(d=>{d.arrow.rotation.z=d.angle;const a=d.angle;d.arrow.position.set(-Math.sin(a)*.45,1.5+Math.cos(a)*.45,.12);d.arrow.rotation.z=a;});
    this.unions.forEach(u=>{if(u.dirty){u.dirty=false;this.drawUnion(u);}});
    if(this.counter){const sp=clamp((now-this.counter.spawn)/500);this.counter.group.scale.setScalar(Math.max(.01,outBack(sp)));}
  }
}
