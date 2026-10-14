import * as THREE from '../vendor/three/three.module.js';
import { World } from './loop-worlds.js?v=20261014-cs-18';
import { label, mat, clamp, lerp, inOut, outCubic, outBack, win } from './loop-machine.js?v=20261014-cs-18';

// Base for the object-oriented scenes: every event of a statement becomes a small timed task, run one after another.
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export const arc=(a,b,t,h)=>V(lerp(a.x,b.x,t),lerp(a.y,b.y,t)+Math.sin(Math.PI*t)*h,lerp(a.z,b.z,t));
export const plain=s=>{s=String(s);return /^'.*'$/.test(s)||/^".*"$/.test(s)?s.slice(1,-1):s;};

export class TimedWorld extends World {
  constructor() {
    super();this.timeline=[];this.temp=new Set();this.delayed=new Map();this.instant=false;this.fast=1;this.started=false;
    this.crates=new Map();this.header={has:true,body:true};
    this.scene.children.filter(o=>o.type==='GridHelper').forEach(o=>this.scene.remove(o));
  }
  // ---- timeline ----
  tl(delay,dur,fn,done) {
    if(this.instant){fn?.(1);done?.();return;}
    const sp=this.speed*this.fast,a=this.at(delay/this.fast),b=a+dur/sp;
    this.timeline.push({a,b,fn,done});
  }
  abs(ms){return this.at(ms/this.fast);}
  finishAll(){const list=this.timeline;this.timeline=[];list.forEach(t=>{t.fn?.(1);t.done?.();});}
  runTimeline(now) {
    this.timeline=this.timeline.filter(t=>{
      if(now<t.a)return true;
      const p=t.b>t.a?clamp((now-t.a)/(t.b-t.a)):1;t.fn?.(p,now);
      if(p>=1){t.fn?.(1);t.done?.();return false;}
      return true;
    });
  }
  // ---- small blocks that carry a value ----
  block(text,{tint=0x7fc0ff,ghost=false,size=.4}={}) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(size,size,size),new THREE.MeshStandardMaterial({color:tint,map:label(plain(text),{w:256,h:256,size:150,bg:ghost?'#e3edf6':'#ffffff'}),roughness:.45,metalness:.1,transparent:true,opacity:ghost?.7:1}));
    m.castShadow=true;this.scene.add(m);this.temp.add(m);return m;
  }
  setBlock(m,text){m.material.map=label(plain(text),{w:256,h:256,size:150,bg:'#ffffff'});}
  kill(m){this.scene.remove(m);this.temp.delete(m);}
  // ---- stepping ----
  printedText(frame){return frame.events?.find(e=>e.t==='print')?.text?.replace(/\n/g,'')||'';}
  setCode(){}
  plan(){this.replaying=true;if(!this.started){this.reset();this.started=true;}return {travel:0,reaction:900};}
  reset(){this.finishAll();[...this.temp].forEach(m=>this.kill(m));this.crates.forEach(c=>this.scene.remove(c.group));this.crates.clear();this.delayed.clear();this.onReset?.();}
  apply(frame,prev,jump) {
    const evs=frame.events||[];this.finishAll();this.instant=!!jump;
    this.fast=jump?1:Math.max(1,Math.min(2.2,evs.length/4));
    this.frameData=frame;
    let ofs=0;
    for(let i=0;i<evs.length;i++)ofs+=this.handle(evs[i],evs,i,ofs,frame)||0;
    this.syncState(frame,this.instant,ofs);
    this.instant=false;
    if(frame.kind==='error')this.tag('error ✖','bad');
    if(!jump){this.step.printDelay=0;this.step.reaction=ofs+250;this.stepMs=this.step.reaction/(this.speed*this.fast)+170/this.speed;}
  }
  handle(){return 0;}
  syncState(){}
  // ---- variable crates for plain values ----
  crateSlot(k){return V(-5.2,0,-1.2+k*1.2);}
  syncCrates(vars,instant) {
    const keep=vars.filter(v=>['scalar','string'].includes(v.kind));
    const names=new Set(keep.map(v=>v.name));
    this.crates.forEach((c,name)=>{if(!names.has(name)){this.scene.remove(c.group);this.crates.delete(name);}});
    let k=0;
    keep.forEach(v=>{
      let c=this.crates.get(v.name);
      if(!c){
        const g=new THREE.Group(),box=new THREE.Mesh(new THREE.BoxGeometry(.58,.58,.58),new THREE.MeshStandardMaterial({color:0xffffff,map:label(' ',{w:256,h:256,size:150}),roughness:.45,metalness:.1}));box.position.y=.32;box.castShadow=true;g.add(box);
        const tag=this.addLabel(g,0,1.0,0,1.1,.34);this.setLabel(tag,v.name,{bg:'#e8f0ff',fg:'#16456b',size:90,w:256,h:100});
        g.position.copy(this.crateSlot(k));this.scene.add(g);c={group:g,box,tag,text:null,pop:0,spawn:instant?0:(this.delayed.get(v.name)??performance.now())};this.crates.set(v.name,c);
      }
      c.group.position.copy(this.crateSlot(k));k++;
      const apply=()=>{c.text=v.show;c.box.material.map=label(plain(v.show),{w:256,h:256,size:150});};
      const at=this.delayed.get(v.name);
      if(c.text===null||instant||(at===undefined&&c.text===v.show))apply();
      else if(c.text!==v.show){if(at!==undefined)this.later.push({at,fn:()=>{apply();c.pop=performance.now();}});else{apply();c.pop=performance.now();}}
    });
    this.delayed.forEach((_,name)=>{});
  }
  animateCrates(now) {
    this.crates.forEach(c=>{
      const s=clamp((now-c.spawn)/500),pop=c.pop?clamp(1-(now-c.pop)/450):0;
      c.group.scale.setScalar(s<1?Math.max(.001,outBack(s)):1);c.box.scale.setScalar(1+Math.sin(pop*Math.PI)*.22);
    });
  }
  animate(now,dt,st,u,r) {this.runTimeline(now);this.animateCrates(now);this.frameUpdate?.(now,dt,st,r);}
}
export { THREE, label, mat, clamp, lerp, inOut, outCubic, outBack, win };
