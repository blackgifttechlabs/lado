import { StructWorld, CardMesh, CARD_W, setPath, deep } from './struct-world.js?v=20261014-cs-18';
import { THREE, V, arc, plain, label, mat, clamp, lerp, inOut, outCubic, outBack, win } from './timed-world.js?v=20261014-cs-18';
import { tex, redraw, rr, INK, MUTED, ACCESS } from './office-kit.js?v=20261014-cs-18';

// Classes: a housing estate. A class is a plan sheet; every object is a house built from it.
// Private rooms are red and locked, public ones are green. Inherited rooms come from the parent plan.
const ROOFS=[0xd9453a,0x5a6dd4,0xd99a1f,0x2f9e63,0x9b5de5];
const hash=s=>[...s].reduce((a,c)=>a*31+c.charCodeAt(0),7)>>>0;

export class ClassWorld extends StructWorld {
  constructor(mode) {
    super(mode);this.cam={x:0,y:4.6,z:7.8,ty:1.5,tz:0};this.sign=null;this.statics=new Map();this.tagTimers=new Map();this.heapItems=new Map();
  }
  onReset(){super.onReset();if(this.sign){this.scene.remove(this.sign.group);this.sign=null;}this.statics.clear();this.heapItems.forEach(i=>this.scene.remove(i.group));this.heapItems.clear();}
  // ---- blueprints are plan sheets ----
  blueprintOpts(t){return {page:{kind:t.kind,name:t.name,base:t.base,members:t.members,methods:t.methods},blueprint:true};}
  blueprintSnap(t){return {cls:t.name,fields:[],statics:[]};}
  cardOpts(v){return {title:v.name,sub:v.obj.cls,access:true,rowH:50};}
  decorate(item,v) {
    const cls=v.obj.cls,h=item.card.height,color=ROOFS[hash(cls)%ROOFS.length];
    const shape=new THREE.Shape();const hw=CARD_W/2+.18;shape.moveTo(-hw,0);shape.lineTo(hw,0);shape.lineTo(0,.85);shape.closePath();
    const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.3,bevelEnabled:false}),mat(color,.5,.2));roof.position.set(0,h+.22,-.22);roof.castShadow=true;item.group.add(roof);
    const step=new THREE.Mesh(new THREE.BoxGeometry(CARD_W+.5,.14,.7),mat(0x8c8f93,.8));step.position.set(0,.07,.25);step.receiveShadow=true;item.group.add(step);
    item.roof=roof;item.card.tag.position.set(0,h+1.4,0);item.card.tag.visible=false;
    item.height=h;
  }
  showTag(item,text,ms,tone) {
    if(!item)return;
    const tag=item.card.tag;
    this.setLabel(tag,text,{bg:tone==='bad'?'#ffb08a':tone==='ok'?'#d3f5e1':'#fff3c7',fg:'#2a2000',size:78,w:512,h:100});
    tag.visible=true;
    const key=item;clearTimeout(this.tagTimers.get(key));
    if(!this.instant)this.tagTimers.set(key,setTimeout(()=>{tag.visible=false;},ms/this.speed/this.fast));else tag.visible=false;
  }
  houseOf(name){
    if(name==='this'||name===undefined)return this.cards.get(this.stack.at(-1)?.obj)||null;
    return this.cards.get(name)||this.cards.get(this.ptrMap?.[name])||this.heapItems.get(name)||null;
  }
  // ---- events ----
  handle(e,evs,i,ofs) {
    switch(e.t) {
      case 'type':return super.handle(e,evs,i,ofs);
      case 'construct':return this.onConstruct(e,ofs);
      case 'destruct':return this.onDestruct(e,ofs);
      case 'call':return this.onMethod(e,ofs);
      case 'return':return this.onMethodReturn(e,ofs);
      case 'get':case 'wset':return this.onField(e,ofs);
      case 'set':return this.onBare(e,ofs);
      case 'denied':return this.onDenied(e,ofs);
      case 'dispatch':return this.onDispatch(e,ofs);
      case 'operator':return this.onOperator(e,ofs);
      case 'new':return this.onNew(e,ofs);
      case 'delete':return 700;
      case 'static-define':return this.onStatic(e,ofs);
      case 'slice':return 500;
    }
    return 0;
  }
  onConstruct(e,ofs) {
    const args=(e.args||[]).join(', '),text=e.implicit?`${e.cls}: default constructor`:`${e.cls}(${args})`;
    this.tl(ofs,1,null,()=>{this.pendingBuild=this.pendingBuild||[];this.pendingBuild.push({obj:e.obj,text,cls:e.cls});});
    return 700;
  }
  onDestruct(e,ofs) {
    this.tl(ofs,1,null,()=>{
      const item=this.houseOf(e.obj);if(!item)return;
      this.showTag(item,e.implicit?`~${e.cls}: taken apart`:`~${e.cls}() runs`,900,'bad');
      item.dying=true;item.sinkAt=this.abs(ofs+500);
    });
    return 900;
  }
  onField(e,ofs) {
    const write=e.t==='wset',ctx=this.stack.at(-1),name=e.obj==='this'?ctx?.obj:e.obj;
    const item=this.houseOf(e.obj==='this'?undefined:e.obj);
    if(!item)return 0;
    const path=e.path||[];
    this.tl(ofs,500,p=>{if(p<.2)item.card.highlight(path,write?'write':'read');});
    this.tl(ofs+800,1,null,()=>item.card.clear());
    if(write)this.delayed.set(item===this.cards.get(name)?name:[...this.cards.entries()].find(([,v])=>v===item)?.[0]??name,this.abs(ofs+300));
    return 900;
  }
  onBare(e,ofs) {
    const ctx=this.stack.at(-1);
    if(e.static){const n=`${e.static}::${e.name}`;this.statics.set(n,e.value);this.tl(ofs,1,null,()=>{if(this.sign){this.sign.pop=performance.now();this.drawSign();}});return 600;}
    if(!ctx||!ctx.obj)return 0;
    const item=this.cards.get(ctx.obj);if(!item)return 0;
    this.tl(ofs,500,p=>{if(p<.2)item.card.highlight([e.name],'write');});
    this.tl(ofs+800,1,null,()=>item.card.clear());
    this.delayed.set(ctx.obj,this.abs(ofs+300));return 900;
  }
  onDenied(e,ofs) {
    const item=this.houseOf(e.obj)||[...this.cards.values()].at(-1);
    this.tl(ofs,1,null,()=>{if(item){this.showTag(item,`${e.name} is ${e.access}: keep out!`,1400,'bad');item.shake=performance.now();item.card.highlight([e.name],'write');}});
    this.tl(ofs+1200,1,null,()=>item?.card.clear());
    return 1300;
  }
  onMethod(e,ofs) {
    const item=this.houseOf(e.obj);
    const ctx={id:e.id,obj:e.obj,item,e};this.calls.set(e.id,ctx);this.stack.push(ctx);
    if(!item||e.depth>1)return 0;
    const text=`${e.obj}.${e.fn}(${e.args.map(a=>a.value).join(', ')})`;
    this.tl(ofs,1,null,()=>this.showTag(item,this.mode==='this'?`this → ${e.obj}`:text,1100,'ok'));
    const door=item.group.position.clone().add(V(0,.5,1.2));
    e.args.forEach((a,k)=>{
      const b=this.block(a.value,{tint:0xbfe3ff,size:.34});ctx.blocks=ctx.blocks||[];ctx.blocks.push(b);
      this.tl(ofs+k*150,700,p=>{b.position.copy(arc(V(-3.2,2.2,2.6),door.clone().add(V(0,.4,0)),inOut(p),.8));b.scale.setScalar(1-.4*p);},()=>{this.tl(0,300,pp=>{b.material.opacity=1-pp;},()=>this.kill(b));});
    });
    return 700+Math.max(0,e.args.length-1)*150+200;
  }
  onMethodReturn(e,ofs) {
    const ctx=this.calls.get(e.id);if(!ctx)return 0;this.stack=this.stack.filter(c=>c!==ctx);this.calls.delete(e.id);
    if(ctx.item&&e.value!==''&&e.depth<1){
      const b=this.block(e.value,{tint:0x9bf0b8,size:.36}),from=ctx.item.group.position.clone().add(V(0,.8,1.0)),to=V(-3.0,2.0,2.4);
      this.tl(ofs,900,p=>{b.position.copy(arc(from,to,inOut(p),.7));},()=>this.kill(b));return 900;
    }
    return 0;
  }
  onDispatch(e,ofs) {
    const item=[...this.cards.values()].find(i=>i.card.snap.cls===e.actual)||[...this.heapItems.values()].find(i=>i.card.snap.cls===e.actual);
    const virtual=e.via==='virtual',text=virtual?`${e.method}(): ${e.owner}::${e.method} runs (virtual: the real object decides)`:`${e.method}(): ${e.owner}::${e.method} runs (not virtual: the pointer type decides)`;
    this.tl(ofs,1,null,()=>{if(item){this.showTag(item,text,2200,virtual?'ok':'bad');item.pulse=performance.now();}});
    return 1700;
  }
  onOperator(e,ofs) {
    this.tl(ofs,1,null,()=>{const items=[...this.cards.values()].slice(-3);items.forEach(it=>{it.pulse=performance.now();});const last=items.at(-1);if(last)this.showTag(last,`operator${e.op} runs`,1200,'ok');});
    return 900;
  }
  onNew(e,ofs){return 700;}
  onStatic(e,ofs){this.statics.set(`${e.cls}::${e.name}`,e.value);this.tl(ofs,1,null,()=>{this.ensureSign();this.drawSign();});return 500;}
  // ---- street sign for static members ----
  ensureSign() {
    if(this.sign)return;
    const g=new THREE.Group(),t=tex(512,256,()=>{}),plane=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.1),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,side:THREE.DoubleSide}));
    plane.position.set(0,1.9,.05);const post=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,2,10),mat(0x8c8f93,.6,.4));post.position.y=1;g.add(post,plane);
    g.position.set(-3.7,0,2.7);g.scale.setScalar(.01);this.scene.add(g);this.sign={group:g,tex:t,spawn:performance.now(),pop:0};
  }
  drawSign() {
    if(!this.sign)return;
    const rows=[...this.statics.entries()];
    redraw(this.sign.tex,(g,w,h)=>{
      g.fillStyle='#fff3c7';rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle='#b8972a';g.lineWidth=6;rr(g,4,4,w-8,h-8,18);g.stroke();
      g.fillStyle='#4a3300';g.font='800 30px monospace';g.textAlign='center';g.fillText('shared by every house',w/2,50);
      g.textAlign='left';g.font='800 36px monospace';rows.slice(0,3).forEach(([n,v],i)=>g.fillText(`${n} = ${plain(v)}`,28,120+i*58));
    });
  }
  // ---- syncing: houses for objects, heap houses at the back ----
  syncState(frame,instant,ofs) {
    super.syncState(frame,instant,ofs);
    // statics seen in snapshots
    frame.vars.filter(v=>v.kind==='object'&&v.obj).forEach(v=>v.obj.statics?.forEach(st=>{if(st.show!=='?')this.statics.set(`${st.owner}::${st.name}`,st.show);}));
    if(this.statics.size){this.ensureSign();this.drawSign();}
    // construction tags and build-up
    if(this.pendingBuild?.length){
      const list=this.pendingBuild;this.pendingBuild=[];
      list.forEach((b,k)=>{const it=this.cards.get(b.obj)||this.heapItems.get(b.obj);if(!it)return;
        if(!instant){it.born=performance.now();it.fromX=it.tx;it.group.position.y=0;}
        this.later.push({at:performance.now()+this.whenMs(Math.max(0,k*500)),fn:()=>this.showTag(it,b.text,900,'ok')});});
    }
    this.syncHeap(frame,instant);
  }
  syncHeap(frame,instant) {
    const heap=frame.heap||[],keep=new Set();
    heap.forEach((h,k)=>{
      if(!h.obj)return;const key=`heap#${h.id}`;keep.add(key);
      let item=this.heapItems.get(key);
      if(!item){
        const card=new CardMesh(this,deep(h.obj),{title:'heap',sub:h.obj.cls,access:true,rowH:50});card.tag.visible=false;
        const g=card.group;g.scale.setScalar(.01);this.scene.add(g);
        item={group:g,card,kind:'heap',x:0,tx:0,spawn:instant?0:performance.now(),sig:''};this.heapItems.set(key,item);this.decorate(item,{obj:h.obj});
      }
      const idx=[...this.heapItems.keys()].indexOf(key),sig=JSON.stringify(h);
      item.group.position.set(-3+idx*3.4*.6,0,-3.2);item.baseS=.6;
      if(item.sig!==sig){item.sig=sig;item.card.setSnap(deep(h.obj));}
      if(h.freed&&!item.dying){item.dying=true;item.sinkAt=performance.now()+(instant?0:500);}
    });
    this.heapItems.forEach((item,key)=>{if(!keep.has(key)&&!item.dying){item.dying=true;item.sinkAt=performance.now();}});
  }
  dropVar(name) {
    const item=this.cards.get(name);
    if(item&&item.dying){this.pendingRemove=this.pendingRemove||new Set();this.pendingRemove.add(name);return;}
    super.dropVar(name);
  }
  frameUpdate(now,dt) {
    super.frameUpdate(now,dt);
    const reap=(item,remove)=>{
      if(!item.dying)return;
      const t=clamp((now-item.sinkAt)/600);
      if(now<item.sinkAt)return;
      item.group.scale.y=Math.max(.01,1-inOut(t));item.group.position.y=-t*.4;
      if(t>=1)remove();
    };
    this.cards.forEach((item,name)=>reap(item,()=>{if(this.pendingRemove?.has(name)||item.dying){this.cards.delete(name);this.removeItem(item);this.pendingRemove?.delete(name);}}));
    this.heapItems.forEach((item,key)=>{
      if(item.baseS&&!item.dying)item.group.scale.setScalar(Math.max(.01,outBack(clamp((now-item.spawn)/600))*item.baseS));
      reap(item,()=>{this.scene.remove(item.group);this.heapItems.delete(key);});
    });
    this.cards.forEach(item=>{
      if(item.shake&&now-item.shake<600)item.group.position.x=item.x+Math.sin((now-item.shake)/40)*.08*(1-(now-item.shake)/600);
      if(item.pulse&&now-item.pulse<700&&!item.born)item.group.position.y=Math.sin((now-item.pulse)/700*Math.PI)*.2;
    });
    if(this.sign){const sp=clamp((now-this.sign.spawn)/500),pop=this.sign.pop?clamp(1-(now-this.sign.pop)/450):0;this.sign.group.scale.setScalar(Math.max(.01,outBack(sp))*(1+Math.sin(pop*Math.PI)*.12));}
  }
}
