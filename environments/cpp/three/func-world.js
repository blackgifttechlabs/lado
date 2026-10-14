import * as THREE from '../vendor/three/three.module.js';
import { World, OutputRig } from './loop-worlds.js?v=20261014-cs-18';
import { label, mat, clamp, lerp, inOut, outCubic, outBack, win } from './loop-machine.js?v=20261014-cs-18';
import { loopModel } from '../topics/loop-model.js?v=20261014-cs-18';

// Functions as small machines. Deliberately sparse: the machine(s), the caller's variable crates, ONE moving block at a time,
// and the output monitor in the lower half. Each call: values go into labelled ports, the machine works, the answer comes out.
const PAL=[0x4aa3df,0x5ed38a,0xffc93c,0xff7a59,0x9b7bff];
const plain=s=>{s=String(s);return /^'.*'$/.test(s)||/^".*"$/.test(s)?s.slice(1,-1):s;};
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const arc=(a,b,t,h)=>V(lerp(a.x,b.x,t),lerp(a.y,b.y,t)+Math.sin(Math.PI*t)*h,lerp(a.z,b.z,t));
const plateCache=new Map();
function plateTex(title,sub) {
  const key=`${title}|${sub}`;if(plateCache.has(key))return plateCache.get(key);
  const c=document.createElement('canvas');c.width=512;c.height=200;const g=c.getContext('2d');
  g.fillStyle='#f4f9fd';g.fillRect(0,0,512,200);g.fillStyle='#16303f';g.textAlign='center';g.textBaseline='middle';
  g.font=`800 ${Math.min(84,Math.floor(900/Math.max(3,title.length)))}px monospace`;g.fillText(title,256,72);
  g.fillStyle='#5b7384';g.font=`700 ${Math.min(36,Math.floor(900/Math.max(10,sub.length)))}px monospace`;g.fillText(sub,256,146);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(plateCache.size>60)plateCache.clear();plateCache.set(key,t);return t;
}

class Machine {
  constructor(world,def,index,solid) {
    this.world=world;this.def=def;this.index=index;this.group=new THREE.Group();const g=this.group,color=def.lambda?0xf0a8d8:PAL[index%PAL.length];
    this.solidMat=mat(color,.45,.25,{emissive:0x000000,transparent:true});this.bpMat=new THREE.MeshBasicMaterial({color,wireframe:true,transparent:true,opacity:.6});
    this.body=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.2,1.1),solid?this.solidMat:this.bpMat);this.body.position.y=.6;this.body.castShadow=true;g.add(this.body);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(1.84,.1,1.24),mat(0x2b3947,.5,.4));cap.position.y=1.25;g.add(cap);
    const n=def.params.length,gap=Math.min(.55,1.3/Math.max(1,n));
    this.ports=def.params.map((q,i)=>{
      const x=(i-(n-1)/2)*gap,port=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.06,20),new THREE.MeshStandardMaterial({color:0x14202c,emissive:0x000000}));port.position.set(x,1.33,0);g.add(port);
      const tag=world.addLabel(g,x,1.78,0,.5,.22);world.setLabel(tag,`${q.byRef?'&':''}${q.ptr?'*':''}${q.name}${q.def?' =':''}`,{bg:'#e8f0ff',fg:'#16456b',size:80,w:256,h:100});
      let ghost=null;if(q.def){ghost=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.3),new THREE.MeshStandardMaterial({color:0xaab4c0,transparent:true,opacity:.45,emissive:0x000000}));ghost.position.set(x,1.5,0);g.add(ghost);}
      return {x,port,tag,ghost,q};
    });
    const sig=def.lambda?`[${(def.caps||[]).map(c=>(def.refs||[]).includes(c)?'&'+c:c).join(', ')}]`:`${def.params.map(q=>q.type).join(', ')}${def.inline?' · inline':''}`;
    this.plate=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.58),new THREE.MeshBasicMaterial({map:plateTex(def.lambda?(def.varName||'λ'):def.name,sig),toneMapped:false}));this.plate.position.set(0,.6,.56);g.add(this.plate);
    if(def.ret&&def.ret!=='void'){this.tray=new THREE.Mesh(new THREE.BoxGeometry(.7,.07,.5),mat(0xdde6ee,.35,.7));this.tray.position.set(1.15,.45,0);this.tray.rotation.z=-.3;g.add(this.tray);}
    else if(!def.lambda){const badge=world.addLabel(g,1.15,.6,0,.7,.26);world.setLabel(badge,'void',{bg:'#ffe8d6',fg:'#6a2f00',size:70,w:256,h:100});}
    this.sub=sig;this.state=solid?'solid':'proto';this.x=0;this.tx=0;this.spawn=performance.now();this.glow=null;this.dim=false;this.red=null;g.scale.setScalar(.01);world.scene.add(g);
  }
  setSolid(){this.state='solid';this.body.material=this.solidMat;this.solidAt=performance.now();}
  at(x,y,z){this.group.updateWorldMatrix(true,false);return this.group.localToWorld(V(x,y,z));}
  portPos(i){const p=this.ports[Math.min(i,this.ports.length-1)];return this.at(p?p.x:0,1.55,0);}
  trayPos(){return this.at(this.tray?1.35:.9,.75,0);}
  dispose(){this.world.scene.remove(this.group);}
}

export class FuncWorld extends World {
  constructor(mode) {
    super();this.mode=mode;this.cam={x:0,y:4.9,z:8.3,ty:.9,tz:.3};this.machines=[];this.crates=new Map();this.dials=new Map();this.timeline=[];this.temp=new Set();
    this.calls=new Map();this.stack=[];this.plates=[];this.delayed=new Map();this.instant=false;this.fast=1;this.started=false;this.header={has:true,body:true};this.pendingLambda=null;
    this.scene.children.filter(o=>o.type==='GridHelper').forEach(o=>this.scene.remove(o));
    this.rig=new OutputRig(this,-1.6,4.4,0,{lite:true});this.pieces.rig.target=1;
  }
  // ---------- timeline: everything that moves is a small timed task, run one after another ----------
  tl(delay,dur,fn,done) {
    if(this.instant){fn?.(1);done?.();return;}
    const sp=this.speed*this.fast,a=this.at(delay/this.fast),b=a+dur/sp;
    this.timeline.push({a,b,fn,done,finished:false});
  }
  abs(ms){return this.at(ms/this.fast);}
  finishAll(){const list=this.timeline;this.timeline=[];list.forEach(t=>{t.fn?.(1);t.done?.();});}
  block(text,{tint=0x7fc0ff,ghost=false,size=.4}={}) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(size,size,size),new THREE.MeshStandardMaterial({color:tint,map:label(plain(text),{w:256,h:256,size:150,bg:ghost?'#e3edf6':'#ffffff'}),roughness:.45,metalness:.1,transparent:true,opacity:ghost?.7:1,emissive:0x000000}));
    m.castShadow=true;this.scene.add(m);this.temp.add(m);return m;
  }
  setBlock(m,text){m.material.map=label(plain(text),{w:256,h:256,size:150,bg:'#ffffff'});}
  kill(m){this.scene.remove(m);this.temp.delete(m);}
  // ---------- machines ----------
  relayout() {
    const n=this.machines.length,gap=this.mode==='recursion'?0:Math.min(2.5,8.4/Math.max(1,n));
    this.machines.forEach((m,i)=>{m.tx=this.mode==='recursion'?-1.3:(i-(n-1)/2)*gap+(this.mode==='fnptr'?.6:.4);});
  }
  addMachine(def,solid) {
    const m=new Machine(this,def,this.machines.length,solid);this.machines.push(m);this.relayout();return m;
  }
  findMachine(sig){return this.machines.find(m=>m.def.sig===sig&&!m.def.lambda);}
  machineFor(e) {
    if(e.lambda)return this.machines.find(m=>m.def.lambda&&m.def.varName===e.fn)||this.machines.filter(m=>m.def.lambda).at(-1);
    const same=this.machines.filter(m=>!m.def.lambda&&m.def.name===(e.target||e.fn)&&m.state==='solid');
    return e.overload?same[e.overload.index]||same[0]:same[0];
  }
  // ---------- typing preview ----------
  setCode(code) {
    const model=loopModel(code,{statements:true});
    if(this.replaying||model.error&&!model.functions?.length)return;
    const funcs=model.functions||[],keep=new Set();
    funcs.forEach(f=>{
      const def={...f,sig:f.sig},existing=this.findMachine(f.sig);keep.add(f.sig);
      if(!existing)this.addMachine(def,!f.proto);else if(!f.proto&&existing.state==='proto')existing.setSolid();
    });
    this.machines.filter(m=>!m.def.lambda&&!keep.has(m.def.sig)).forEach(m=>{m.dispose();this.machines.splice(this.machines.indexOf(m),1);});
    this.relayout();
  }
  reset() {
    this.finishAll();this.machines.forEach(m=>m.dispose());this.machines=[];this.crates.forEach(c=>this.scene.remove(c.group));this.crates.clear();
    this.dials.forEach(d=>this.scene.remove(d.group));this.dials.clear();this.plates.forEach(p=>this.scene.remove(p.group));this.plates=[];
    [...this.temp].forEach(m=>this.kill(m));this.calls.clear();this.stack=[];this.delayed.clear();this.pendingLambda=null;
  }
  // ---------- variable crates and the function-pointer dial ----------
  crateSlot(k){return V(-3.9,0,-1.0+k*1.25);}
  syncVars(vars,instant) {
    const names=new Set(vars.filter(v=>['scalar','string','ptr','array'].includes(v.kind)).map(v=>v.name));
    this.crates.forEach((c,name)=>{if(!names.has(name)){this.scene.remove(c.group);this.crates.delete(name);}});
    let k=0;
    vars.forEach(v=>{
      if(v.kind==='fn'){if(this.mode==='fnptr')this.syncDial(v);return;}
      if(!names.has(v.name))return;
      let c=this.crates.get(v.name);
      if(!c){
        const g=new THREE.Group(),box=new THREE.Mesh(new THREE.BoxGeometry(.58,.58,.58),new THREE.MeshStandardMaterial({color:0xffffff,map:label(' ',{w:256,h:256,size:150}),roughness:.45,metalness:.1,emissive:0x000000}));box.position.y=.32;box.castShadow=true;g.add(box);
        const tag=this.addLabel(g,0,1.0,0,1.1,.34);this.setLabel(tag,v.name,{bg:'#e8f0ff',fg:'#16456b',size:90,w:256,h:100});
        g.position.copy(this.crateSlot(k));this.scene.add(g);c={group:g,box,tag,text:null,home:this.crateSlot(k),pop:0,spawn:instant?0:(this.delayed.get(v.name)??performance.now()),slot:k};this.crates.set(v.name,c);
      }
      c.slot=k;c.home=this.crateSlot(k);k++;
      const apply=()=>{c.text=v.show;c.box.material.map=label(plain(v.kind==='ptr'?'&'+(v.target||''):v.show),{w:256,h:256,size:v.kind==='ptr'?110:150});};
      const at=this.delayed.get(v.name);
      if(c.text===null||instant||at===undefined&&c.text===v.show)apply();
      else if(c.text!==v.show){if(at!==undefined)this.later.push({at,fn:()=>{apply();c.pop=performance.now();}});else{apply();c.pop=performance.now();}}
    });
    this.delayed.clear();
  }
  syncDial(v) {
    let d=this.dials.get(v.name);
    if(!d){
      const g=new THREE.Group(),base=new THREE.Mesh(new THREE.CylinderGeometry(.62,.7,.22,32),mat(0x2b3947,.45,.5));base.position.y=.11;g.add(base);
      const knob=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.18,28),mat(0xdde6ee,.3,.8));knob.position.y=.31;g.add(knob);
      const arrow=new THREE.Group();const stem=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.75),mat(0xffdc5a,.35,.3,{emissive:0x553d00}));stem.position.z=.4;arrow.add(stem);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(.14,.28,16),mat(0xffdc5a,.35,.3,{emissive:0x553d00}));tip.rotation.x=Math.PI/2;tip.position.z=.88;arrow.add(tip);arrow.position.y=.43;g.add(arrow);
      const tag=this.addLabel(g,0,1.0,0,1.5,.36);g.position.set(-3.4,0,1.8);this.scene.add(g);d={group:g,arrow,tag,angle:0,target:0,fn:null};this.dials.set(v.name,d);
    }
    if(d.fn!==v.fn){d.fn=v.fn;const m=this.machines.find(x=>x.def.name===v.fn&&!x.def.lambda);d.mach=m||null;}
    this.setLabel(d.tag,`${v.name} → ${v.fn||'?'}`,{bg:'#fff3c7',fg:'#4a3300',size:90,w:384,h:100});
  }
  // ---------- stepping ----------
  printedText(frame){return frame.events?.find(e=>e.t==='print')?.text?.replace(/\n/g,'')||'';}
  plan(frame,prev,jump) {
    this.replaying=true;
    if(!this.started){this.reset();this.started=true;}
    return {travel:0,reaction:900};
  }
  apply(frame,prev,jump) {
    const evs=frame.events||[];this.finishAll();this.instant=!!jump;
    this.fast=jump?1:Math.max(1,Math.min(2.2,evs.filter(e=>e.t==='call').length/3));
    let ofs=0;
    for(let i=0;i<evs.length;i++)ofs+=this.handle(evs[i],evs,i,ofs,frame)||0;
    this.syncVars(frame.vars,this.instant);
    this.instant=false;
    if(frame.kind==='error')this.tag('error ✖','bad');
    this.rig.setText(this.printedText(frame)&&!jump?(this.step.prev?.out||''):frame.out);
    if(!jump){
      this.step.printDelay=ofs;this.step.reaction=ofs+(this.printedText(frame)?800:250);
      this.stepMs=this.step.reaction/(this.speed*this.fast)+170/this.speed;
    }
  }
  handle(e,evs,i,ofs,frame) {
    switch(e.t) {
      case 'define':return this.onDefine(e,ofs);
      case 'lambda':return this.onLambda(e,ofs);
      case 'declare':if(e.name)this.tl(ofs,1,null,()=>{const m=this.pendingLambda;if(m){m.def.varName=e.name;m.plate.material.map=plateTex(e.name,m.sub);this.pendingLambda=null;}});return 0;
      case 'call':return this.onCall(e,evs,i,ofs);
      case 'return':return this.onReturn(e,evs,i,ofs);
      case 'set':case 'write':return this.onSet(e,ofs);
      case 'overflow':case 'undeclared':case 'nomatch':return this.onFail(e,ofs);
    }
    return 0;
  }
  onDefine(e,ofs) {
    const def={name:e.fn,sig:e.sig,params:e.params,ret:e.ret,inline:e.inline,proto:e.proto};
    this.tl(ofs,1,null,()=>{
      const existing=this.findMachine(e.sig);
      if(e.proto){if(!existing)this.addMachine(def,false);}
      else if(existing){if(existing.state==='proto')existing.setSolid();}
      else this.addMachine(def,true);
    });
    return 800;
  }
  onLambda(e,ofs) {
    const def={name:'λ',sig:'λ',params:e.params||[],ret:'auto',lambda:true,caps:e.caps,refs:e.refs,varName:null};
    this.tl(ofs,1,null,()=>{const m=this.addMachine(def,true);this.pendingLambda=m;e.caps.forEach((c)=>{const crate=this.crates.get(c);if(crate)crate.pop=performance.now();});});
    return 900;
  }
  src(a,k) {
    const crate=a.from?this.crates.get(a.from):null;
    return crate?crate.group.position.clone().add(V(0,.8,0)):V(-3.2,1.9+k*.2,1.3);
  }
  onCall(e,evs,i,ofs) {
    const m=this.machineFor(e);if(!m)return 0;
    const ctx={id:e.id,m,blocks:[],lifted:[],lines:[],refMap:{},copies:new Map(),e};this.calls.set(e.id,ctx);this.stack.push(ctx);
    const same=this.machines.filter(x=>!x.def.lambda&&x.def.name===m.def.name);
    if(this.mode==='recursion')return this.callPlate(e,ctx,ofs);
    const n=e.args.length;let end=500;
    const parent=this.stack.length>1?this.stack.at(-2).m:null;
    this.tl(ofs,0,null,()=>{if(same.length>1)same.forEach(x=>{x.dim=x!==m;});});
    if(e.inline&&m.def.inline)return this.callInline(e,ctx,ofs);
    e.args.forEach((a,k)=>{
      const port=m.portPos(k),start=parent&&!a.from?parent.trayPos():this.src(a,k),t0=ofs+k*150;
      if(a.def){const gh=m.ports[k]?.ghost;if(gh)this.tl(t0,500,p=>{gh.material.emissive.setHex(0x886600);gh.material.opacity=.45+.4*Math.sin(p*Math.PI);},()=>{gh.material.emissive.setHex(0);gh.material.opacity=.45;});return;}
      if(a.byRef&&a.from&&this.crates.get(a.from)){
        const crate=this.crates.get(a.from),home=crate.group.position.clone();ctx.lifted.push({crate,home});ctx.refMap[a.name]=a.from;
        this.tl(t0,800,p=>{crate.group.position.copy(arc(home,port.clone().add(V(0,-.5,0)),inOut(p),1.0));crate.group.position.y=Math.max(0,crate.group.position.y);});
        return;
      }
      if(a.ptr){
        const card=this.block(`&${a.target||a.from||''}`,{tint:0xffe08a,ghost:false,size:.36});card.scale.set(1.6,.5,.3);ctx.blocks.push(card);
        const target=a.target?this.crates.get(a.target):null;
        this.tl(t0,800,p=>{card.position.copy(arc(start,port.clone().add(V(0,.1,0)),inOut(p),.8));});
        if(target){const line=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,8),new THREE.MeshBasicMaterial({color:0xffdc5a,transparent:true,opacity:.0}));this.scene.add(line);ctx.lines.push(line);ctx.ptrCrate=target;ctx.refMap[a.name]=a.target;
          this.tl(t0+600,400,p=>{line.material.opacity=.8*p;});}
        return;
      }
      const b=this.block(a.value,{tint:a.from?0xbfe3ff:0x7fc0ff,ghost:!!a.from});ctx.blocks.push(b);ctx.copies.set(a.name,b);
      this.tl(t0,800,p=>{b.position.copy(arc(start,port.clone().add(V(0,.3,0)),inOut(p),.9));b.scale.setScalar(1-.15*p);});
    });
    end=700+(Math.max(1,n)-1)*150;
    this.tl(ofs+end,700,p=>{m.glow=Math.sin(p*Math.PI);},()=>{m.glow=0;});
    return end+700;
  }
  callInline(e,ctx,ofs) {
    // inline: the machine does not receive the blocks. Its body is pasted at the call site, then it goes back.
    const m=ctx.m,home=m.tx,site=-2.4;
    this.tl(ofs,700,p=>{m.tx=lerp(home,site,inOut(p));m.sizeMul=1-.35*inOut(p);});
    this.tl(ofs+700,600,p=>{m.glow=Math.sin(p*Math.PI);},()=>{m.glow=0;});
    ctx.inlineHome=home;return 1300;
  }
  callPlate(e,ctx,ofs) {
    const k=this.plates.length,g=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(1.7,.26,.95),mat(PAL[k%PAL.length],.45,.25));body.castShadow=true;g.add(body);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.22),new THREE.MeshBasicMaterial({map:label(`${e.fn}(${e.args.map(a=>plain(a.value)).join(', ')})`,{w:512,h:100,size:70,bg:'#f4f9fd'}),toneMapped:false}));face.position.set(0,0,.48);g.add(face);
    g.position.set(3.2,.14+k*.34,0);g.visible=false;this.scene.add(g);const plate={group:g,face,k,e};this.plates.push(plate);ctx.plate=plate;
    this.tl(ofs,700,p=>{g.visible=true;g.position.y=lerp(.14+k*.34+2.2,.14+k*.34,outBack(p));g.scale.setScalar(1);});
    this.tl(ofs+200,500,p=>{ctx.m.glow=Math.sin(p*Math.PI);},()=>{ctx.m.glow=0;});
    return 650;
  }
  onReturn(e,evs,i,ofs) {
    const ctx=this.calls.get(e.id);if(!ctx)return 0;const m=ctx.m;let dur=0;
    this.stack=this.stack.filter(c=>c!==ctx);this.calls.delete(e.id);
    if(ctx.plate){
      const plate=ctx.plate,k=plate.k;
      this.tl(ofs,200,null,()=>{plate.face.material.map=label(`= ${plain(e.value||'done')}`,{w:512,h:100,size:80,bg:'#d7ffe7',fg:'#0a4a2a'});});
      this.tl(ofs+450,450,p=>{plate.group.scale.y=Math.max(.01,1-inOut(p));plate.group.position.y=.14+k*.34-.1*p;},()=>{plate.group.visible=false;this.scene.remove(plate.group);this.plates=this.plates.filter(x=>x!==plate);});
      return 950;
    }
    ctx.lifted.forEach(({crate,home})=>{const from=crate.group.position.clone();this.tl(ofs,800,p=>{crate.group.position.copy(arc(from,home,inOut(p),.7));crate.group.position.y=Math.max(0,crate.group.position.y);});});
    ctx.copies.forEach(b=>{this.tl(ofs,600,p=>{b.scale.setScalar(.85*(1-inOut(p)));b.material.opacity=1-p;},()=>this.kill(b));});
    const copySet=new Set(ctx.copies.values());
    ctx.blocks.filter(b=>!copySet.has(b)).forEach(b=>{this.tl(ofs,500,p=>{b.material.opacity=1-p;},()=>this.kill(b));});
    ctx.lines.forEach(l=>{this.tl(ofs,400,p=>{l.material.opacity=.8*(1-p);},()=>{this.scene.remove(l);});});
    if(ctx.inlineHome!==undefined){const home=ctx.inlineHome;this.tl(ofs,700,p=>{m.tx=lerp(-2.4,home,inOut(p));m.sizeMul=.65+.35*inOut(p);});dur=Math.max(dur,700);}
    if(same(this.machines,m))this.machines.forEach(x=>{x.dim=false;});
    if(e.value!==''&&m.tray) {
      const res=this.block(e.value,{tint:0x9bf0b8}),from=m.trayPos(),dest=this.destFor(evs,i);res.visible=false;
      this.tl(ofs+150,350,p=>{res.visible=true;res.scale.setScalar(outBack(p));res.position.copy(from).add(V(0,.1+p*.2,0));});
      this.tl(ofs+550,800,p=>{res.position.copy(arc(from.clone().add(V(0,.3,0)),dest.pos,inOut(p),.8));if(dest.fade)res.material.opacity=1-p*.5;},()=>{if(!dest.keep)this.kill(res);else this.lastResult=res;});
      if(dest.name)this.delayed.set(dest.name,this.abs(ofs+1300));
      dur=Math.max(dur,1400);
    }
    else dur=Math.max(dur,600);
    return dur;
  }
  destFor(evs,i) {
    for(let j=i+1;j<evs.length;j++){
      const e=evs[j];
      if(e.t==='declare'&&e.name&&e.kind!=='fn')return {pos:this.crateSlotPos(e.name),name:e.name};
      if(e.t==='set'&&this.crates.get(e.name))return {pos:this.crates.get(e.name).group.position.clone().add(V(0,.8,0)),name:e.name};
      if(e.t==='print')return {pos:this.rig.group.localToWorld(V(1.9,1.2,-.1)),fade:true};
      if(e.t==='call')return {pos:V(-1.4,2.2,.9),keep:false,fade:true};
    }
    return {pos:V(2.6,1.6,1.2),fade:true};
  }
  crateSlotPos(name){const c=this.crates.get(name);return (c?c.group.position:this.crateSlot(this.crates.size)).clone().add(V(0,.8,0));}
  onSet(e,ofs) {
    const ctx=this.stack.at(-1),crateName=(ctx?.refMap?.[e.name])||e.name;
    const crate=this.crates.get(crateName),copy=ctx?.copies.get(e.name);
    if(copy){this.tl(ofs,500,p=>{copy.scale.setScalar(.85+.25*Math.sin(p*Math.PI));},()=>{});this.tl(ofs+150,1,null,()=>this.setBlock(copy,e.value));return 600;}
    if(crate){
      this.delayed.set(crateName,this.abs(ofs+250));crate.next=e.value;
      this.tl(ofs,600,p=>{crate.box.material.emissive.setHex(p<.5?0x335522:0x000000);},()=>{crate.box.material.emissive.setHex(0);});
      if(ctx?.ptrCrate)this.tl(ofs,500,p=>{ctx.m.glow=Math.sin(p*Math.PI);},()=>{ctx.m.glow=0;});
      return 650;
    }
    return 0;
  }
  onFail(e,ofs) {
    const hit=this.machines.filter(m=>!m.def.lambda&&m.def.name===e.fn);
    this.tl(ofs,900,p=>{hit.forEach(m=>{m.red=Math.sin(p*Math.PI);});},()=>hit.forEach(m=>{m.red=0;}));
    if(e.t==='overflow')this.plates.forEach(pl=>{this.tl(ofs,700,p=>{pl.group.rotation.z=Math.sin(p*18)*.05*(1-p);},()=>{pl.group.rotation.z=0;});});
    return 900;
  }
  tagAnchor(){return V(0,2.9,.8);}
  animate(now,dt,st) {
    const k=1-Math.exp(-dt*6);
    this.timeline=this.timeline.filter(t=>{
      if(now<t.a)return true;
      const p=t.b>t.a?clamp((now-t.a)/(t.b-t.a)):1;t.fn?.(p,now);
      if(p>=1){t.fn?.(1);t.done?.();return false;}
      return true;
    });
    this.machines.forEach((m,i)=>{
      const s=clamp((now-m.spawn)/650),grow=outBack(s);m.x+=(m.tx-m.x)*k;m.group.position.x=m.x;
      m.group.scale.setScalar(Math.max(.01,grow*(m.sizeMul??1)));
      const solid=m.state==='solid',fade=m.solidAt?clamp((now-m.solidAt)/500):1;
      m.solidMat.opacity=m.dim?.4:solid?fade:0;m.body.material=solid?m.solidMat:m.bpMat;
      const glow=m.glow||0,red=m.red||0;m.solidMat.emissive.setHex(red>0?0x771111:glow>0?0x2a4a2a:0);m.solidMat.emissiveIntensity=Math.max(glow,red);
      m.body.position.y=.6+glow*.05;
    });
    this.crates.forEach(c=>{
      const s=clamp((now-c.spawn)/500),pop=c.pop?clamp(1-(now-c.pop)/450):0;
      c.group.scale.setScalar(s<1?Math.max(.001,outBack(s)):1);c.box.scale.setScalar(1+Math.sin(pop*Math.PI)*.22);
    });
    this.dials.forEach(d=>{
      const m=d.mach;let target=d.angle;if(m){m.group.updateWorldMatrix(true,false);const dx=m.x+0.0-d.group.position.x,dz=0-d.group.position.z;target=Math.atan2(dx,dz);}
      d.angle+=(target-d.angle)*(1-Math.exp(-dt*5));d.arrow.rotation.y=d.angle;
    });
    this.stack.forEach(c=>{
      c.lines.forEach(l=>{
        if(!c.ptrCrate)return;const a=c.m.portPos(0),b=c.ptrCrate.group.position.clone().add(V(0,.5,0)),mid=a.clone().lerp(b,.5),len=a.distanceTo(b);
        l.position.copy(mid);l.scale.y=len;l.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());
      });
    });
  }
}
const same=(machines,m)=>machines.filter(x=>x.def.name===m.def.name).length>1;
