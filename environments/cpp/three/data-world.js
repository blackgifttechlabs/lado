import * as THREE from '../vendor/three/three.module.js';
import { World, OutputRig } from './loop-worlds.js?v=20261015-m-1';
import { label, mat, clamp, lerp, inOut, outCubic, outBack, win } from './loop-machine.js?v=20261015-m-1';
import { loopModel } from '../topics/loop-model.js?v=20261015-m-1';

// Arrays and strings as physical things: lockers (arrays), an apartment block (2D arrays), letter tiles (strings and C-strings).
// Every statement's events (read, write, size, find, insert, erase...) drive a matching physical action.
const PAL=[0x4aa3df,0x5ed38a,0xffc93c,0xff7a59,0x9b7bff,0x3fc1c9,0xff6fa5,0xa3d65c];
const plain=s=>{s=String(s);return /^'.*'$/.test(s)||/^".*"$/.test(s)?s.slice(1,-1):s;};
const isNum=v=>typeof v==='number'&&Number.isFinite(v);

function lockerCell(i,text,small) {
  const doorText=String(i);
  const g=new THREE.Group(),w=small?.92:.96,h=small?.95:1.5,d=small?.6:.8,color=PAL[i%PAL.length],metal=mat(color,.35,.55);
  const panel=(sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),metal);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);};
  panel(w,h,.04,0,h/2,-d/2);panel(.04,h,d,-w/2,h/2,0);panel(.04,h,d,w/2,h/2,0);panel(w,.04,d,0,h,0);panel(w,.05,d,0,.025,0);
  const val=new THREE.Mesh(new THREE.BoxGeometry(.46,.46,.46),mat(0xffffff,.45,.1,{map:label(plain(text),{size:150,w:256,h:256}),emissive:0x000000}));val.position.set(0,.27,0);val.castShadow=true;g.add(val);
  const pivot=new THREE.Group();pivot.position.set(-w/2,0,d/2);g.add(pivot);
  const door=new THREE.Mesh(new THREE.BoxGeometry(w,h-.02,.05),mat(color,.4,.5));door.position.set(w/2,h/2,0);door.castShadow=true;pivot.add(door);
  const num=new THREE.Mesh(new THREE.PlaneGeometry(.5,.26),new THREE.MeshBasicMaterial({map:label(doorText,{w:200,h:100,bg:'#ffffff',size:80}),toneMapped:false}));num.position.set(w/2,h*.8,.03);pivot.add(num);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),mat(0xdde6ee,.25,.9));knob.position.set(w-.12,h*.45,.05);pivot.add(knob);
  return {group:g,val,pivot,kind:'locker',w,h,d,text,i,color};
}
function tileCell(i,text,end) {
  const g=new THREE.Group(),tile=new THREE.Mesh(new THREE.BoxGeometry(.68,.88,.2),new THREE.MeshStandardMaterial({color:end?0xffa24a:0xf7f1da,roughness:.55,metalness:.05,emissive:0x000000}));tile.position.y=.56;tile.castShadow=true;g.add(tile);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.58,.78),new THREE.MeshBasicMaterial({map:label(plain(text)==='\0'?'\\0':plain(text),{w:200,h:260,bg:end?'#ffa24a':'#f7f1da',fg:end?'#3a1d00':'#1d2b3a',size:200}),toneMapped:false}));face.position.set(0,.56,.102);g.add(face);
  const idx=new THREE.Mesh(new THREE.PlaneGeometry(.4,.2),new THREE.MeshBasicMaterial({map:label(String(i),{w:128,h:64,bg:'#16354f',fg:'#9fd0ff',size:46}),toneMapped:false}));idx.rotation.x=-Math.PI/2.6;idx.position.set(0,.13,.52);g.add(idx);
  return {group:g,tile,face,kind:'tile',w:.7,h:.9,d:.2,text,i,end};
}

class Row {
  constructor(world,name,data,kind,dims,type,std) {
    this.world=world;this.name=name;this.kind=kind;this.type=type;this.std=std;this.dims=dims||[];this.group=new THREE.Group();this.cells=[];this.dying=[];this.ghostGroup=new THREE.Group();
    this.chars=kind==='string'||kind==='chars';this.twoD=dims?.length>1;this.pitch=this.twoD?1.04:this.chars?.78:1.12;
    this.slab=new THREE.Mesh(new THREE.BoxGeometry(1,this.chars?.1:.08,this.chars?1.15:1.0),mat(this.chars?0x2d3b4a:0x3b5a78,.6,.4));this.slab.position.y=-.02;this.slab.receiveShadow=true;this.group.add(this.slab);
    this.tag=world.addLabel(this.group,0,0,0,2.1,.46);this.group.add(this.ghostGroup);world.scene.add(this.group);
    this.setTag();this.build(data);
  }
  setTag(){const t=this.kind==='string'?`string ${this.name}`:this.kind==='chars'?`char ${this.name}[ ]`:this.std?`array ${this.name}`:`${this.type} ${this.name}[${this.dims.join('][')}]`;this.world.setLabel(this.tag,t,{bg:'#bfe3ff',size:90});}
  makeCell(item,i,r,c) {
    const text=Array.isArray(item)?'':item,end=this.kind==='chars'&&plain(text)==='\\0';
    const cell=this.chars?tileCell(i,text,end):lockerCell(this.twoD?`${r},${c}`:i,text,this.twoD);
    cell.r=r;cell.c=c;cell.fx={};this.group.add(cell.group);return cell;
  }
  build(data) {
    this.cells.forEach(c=>this.group.remove(c.group));this.cells=[];
    if(this.twoD){data.forEach((rowData,r)=>rowData.forEach((item,c)=>{const cell=this.makeCell(item,0,r,c);cell.i=c;this.cells.push(cell);}));}
    else data.forEach((item,i)=>this.cells.push(this.makeCell(item,i,0,i)));
    this.cells.forEach((cell,k)=>{cell.fx.spawn=performance.now()+this.world.whenMs(0)+k*90;this.place(cell,true);});this.fit();
  }
  count(){return this.twoD?this.dims[1]:this.cells.length;}
  index(cell){return this.twoD?cell.c:this.cells.indexOf(cell);}
  targetOf(cell,i) {
    if(this.twoD){const rows=this.dims[0],cols=this.dims[1];return {x:(cell.c-(cols-1)/2)*this.pitch,y:(rows-1-cell.r)*1.08+.05,z:0};}
    return {x:(i-(this.cells.length-1)/2)*this.pitch,y:this.chars?.06:.05,z:0};
  }
  place(cell,snap) {const t=this.targetOf(cell,this.twoD?0:this.cells.indexOf(cell));cell.tx=t.x;cell.ty=t.y;if(snap||cell.x===undefined){cell.x=t.x;cell.y=t.y;}cell.group.position.set(cell.x,cell.y,0);}
  width(){const n=this.count();return Math.max(1,n)*this.pitch+.5;}
  fit(){const s=Math.min(1,9.6/this.width());this.group.scale.setScalar(s);this.slab.scale.x=this.width();this.tag.position.set(-this.width()/2+1.15,this.twoD?this.dims[0]*1.08+.45:this.chars?1.95:2.0,0);}
  cellAt(path){if(this.twoD)return this.cells.find(c=>c.r===path[0]&&c.c===path[1]);return this.cells[path[0]??path];}
  worldPos(cell,dy=0){const p=new THREE.Vector3(cell?.x??0,(cell?.y??0)+dy,.5);return this.group.localToWorld(p);}
  setText(cell,text) {
    cell.text=text;const t=plain(text);
    if(cell.kind==='locker')cell.val.material.map=label(t,{size:150,w:256,h:256});
    else{cell.face.material.map=label(t==='\0'?'\\0':t,{w:200,h:260,bg:cell.end?'#ffa24a':'#f7f1da',fg:cell.end?'#3a1d00':'#1d2b3a',size:200});}
  }
  // Strings change shape: tiles slide, new ones drop in, removed ones fall off the ribbon.
  restructure(texts,op,when) {
    const old=this.cells,next=new Array(texts.length).fill(null),now=performance.now();
    const move=(from,to)=>{if(to>=0&&to<next.length)next[to]=old[from];};
    old.forEach((cell,i)=>{
      let to=i;
      if(op?.kind==='insert')to=i<op.pos?i:i+op.count;
      else if(op?.kind==='erase'){if(i>=op.pos&&i<op.pos+op.len){cell.fx.die=when;this.dying.push(cell);return;}to=i<op.pos?i:i-op.len;}
      else if(op?.kind==='replace'){if(i>=op.pos&&i<op.pos+op.len){cell.fx.die=when;this.dying.push(cell);return;}to=i<op.pos?i:i-op.len+op.count;}
      move(i,to);
    });
    this.cells=next.map((cell,i)=>{
      if(cell){if(cell.text!==texts[i])this.setText(cell,texts[i]);return cell;}
      const fresh=this.makeCell(texts[i],i,0,i);fresh.fx.spawn=when+(i%6)*70;fresh.x=(i-(texts.length-1)/2)*this.pitch;fresh.y=.06;return fresh;
    });
    this.cells.forEach(c=>{const t=this.targetOf(c,this.cells.indexOf(c));c.tx=t.x;c.ty=t.y;if(c.x===undefined){c.x=t.x;c.y=t.y;}});
    this.fit();
  }
  dispose(){this.world.scene.remove(this.group);}
}

export class DataWorld extends World {
  constructor(mode) {
    super();this.mode=mode;this.cam={x:0,y:5.1,z:8.8,ty:.9,tz:.4};this.rows=new Map();this.crates=new Map();this.cursorPos=new THREE.Vector3(0,3,.6);this.cursorGoal=this.cursorPos.clone();this.cursorOn=false;this.ctrl='';this.rowOrder=[];
    this.fx={};this.build();this.header={has:true,body:true};
  }
  build() {
    this.rig=new OutputRig(this,-1.6,4.4,0);this.pieces.rig.target=1;
    const cursor=new THREE.Mesh(new THREE.ConeGeometry(.2,.5,18),mat(0xffdc5a,.3,.2,{emissive:0xaa7a00}));cursor.rotation.x=Math.PI;cursor.visible=false;this.scene.add(cursor);this.cursor=cursor;
    this.valueTag=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.7),new THREE.MeshBasicMaterial({map:label(' '),transparent:true,opacity:0,toneMapped:false}));this.scene.add(this.valueTag);
    const beacon=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,1.4,12),mat(0x8fa4b6,.4,.7));pole.position.y=.7;beacon.add(pole);
    this.lampMat=new THREE.MeshStandardMaterial({color:0x553333,emissive:0x000000,roughness:.2});const lamp=new THREE.Mesh(new THREE.SphereGeometry(.24,24,16),this.lampMat);lamp.position.y=1.55;beacon.add(lamp);
    beacon.position.set(-6.4,0,-2.6);this.scene.add(beacon);
    this.ghost=new THREE.Mesh(new THREE.BoxGeometry(.96,1.5,.8),new THREE.MeshBasicMaterial({color:0xff4a4a,wireframe:true,transparent:true,opacity:0}));this.ghost.position.y=.75;this.scene.add(this.ghost);
    this.tape=new THREE.Mesh(new THREE.BoxGeometry(1,.05,.22),mat(0xffd23a,.5,.2));this.tape.visible=false;this.scene.add(this.tape);
    const mag=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(.38,.06,12,32),mat(0xdde6ee,.25,.9));mag.add(ring);
    const glass=new THREE.Mesh(new THREE.CircleGeometry(.36,32),new THREE.MeshStandardMaterial({color:0xbfe6ff,transparent:true,opacity:.35,roughness:.05}));mag.add(glass);
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.7,10),mat(0x7a5535,.7));handle.position.set(.38,-.38,0);handle.rotation.z=Math.PI/4;mag.add(handle);mag.visible=false;this.scene.add(mag);this.mag=mag;
    const scissors=new THREE.Group();this.blades=[1,-1].map(s=>{const blade=new THREE.Mesh(new THREE.BoxGeometry(.9,.06,.1),mat(0xe8eef3,.2,1));blade.position.x=.45;const pivot=new THREE.Group();pivot.add(blade);pivot.userData.s=s;scissors.add(pivot);return pivot;});
    scissors.visible=false;this.scene.add(scissors);this.scissors=scissors;
    this.stamp=new THREE.Mesh(new THREE.BoxGeometry(.9,.45,.8),mat(0xd9453a,.4,.4));this.stamp.visible=false;this.scene.add(this.stamp);
    this.arch=new THREE.Group();const steel=mat(0x8fa4b6,.35,.85);[-.7,.7].forEach(z=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.12,1.9,.12),steel);post.position.set(0,.95,z);this.arch.add(post);});
    const beam=new THREE.Mesh(new THREE.BoxGeometry(.18,.16,1.5),steel);beam.position.y=1.9;this.arch.add(beam);
    this.curtain=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.7),new THREE.MeshBasicMaterial({color:0x44ff99,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));this.curtain.rotation.y=Math.PI/2;this.curtain.position.y=.95;this.arch.add(this.curtain);this.arch.visible=false;this.scene.add(this.arch);
    this.hl=new THREE.Mesh(new THREE.BoxGeometry(1,1.0,.05),new THREE.MeshBasicMaterial({color:0xffdc5a,transparent:true,opacity:0,depthWrite:false}));this.scene.add(this.hl);
  }
  // Typing: preview the declarations as soon as the code runs.
  setCode(code) {
    const model=loopModel(code,{statements:true});
    if(!model.frames.length)return;
    if(this.replaying)return;
    const first=new Map();model.frames.forEach(f=>f.vars.forEach(v=>{if(!first.has(v.name))first.set(v.name,v);}));
    this.syncVars([...first.values()],[],true);
  }
  reset(){this.rows.forEach(r=>r.dispose());this.rows.clear();this.crates.forEach(c=>this.scene.remove(c.group));this.crates.clear();this.rowOrder=[];}
  rowZ(k){return k===0?.6:2.5;}
  syncVars(vars,events,quiet) {
    const names=new Set(vars.map(v=>v.name));
    this.rows.forEach((row,name)=>{if(!names.has(name)){row.dispose();this.rows.delete(name);}});
    this.crates.forEach((crate,name)=>{if(!names.has(name)){this.scene.remove(crate.group);this.crates.delete(name);}});
    let k=0,sc=0;
    vars.forEach(v=>{
      if(v.kind==='scalar'){this.syncCrate(v,sc++,quiet);return;}
      const chars=v.kind==='string'?[...(v.str||'')].map(c=>`'${c}'`):null;
      let row=this.rows.get(v.name);
      const data=v.kind==='string'?chars:v.data,kind=v.kind==='string'?'string':v.elem==='char'&&v.dims.length===1?'chars':'array';
      if(!row){row=new Row(this,v.name,data,kind,v.dims,v.elem,v.std);this.rows.set(v.name,row);}
      row.group.position.set(0,0,this.rowZ(Math.min(k,1)));k++;
      this.updateRow(row,v,data,events,quiet);
    });
    this.rowOrder=[...this.rows.keys()];
  }
  updateRow(row,v,data,events,quiet) {
    if(row.chars){
      const texts=data,current=row.cells.map(c=>c.text);
      if(JSON.stringify(texts)!==JSON.stringify(current)){
        const m=events.find(e=>e.t==='method'&&e.name===row.name&&['append','insert','erase','replace'].includes(e.op));
        const op=m?{kind:m.op,pos:m.pos??row.cells.length,len:m.len??0,count:(m.text||'').length}:null,when=quiet?0:this.at(this.opDelay?.[row.name]??300);
        if(row.kind==='chars'||!op||quiet)this.replaceRow(row,texts);else row.restructure(texts,op,when);
      }
      return;
    }
    const flat=row.twoD?data.flat():data;
    row.cells.forEach((cell,i)=>{const t=flat[i];if(t!==undefined&&cell.text!==t){if(quiet||!events.some(e=>e.t==='write'&&e.name===row.name))this.setText2(row,cell,t);}});
  }
  setText2(row,cell,t){row.setText(cell,t);}
  replaceRow(row,texts){row.build(texts);}
  syncCrate(v,k,quiet) {
    let crate=this.crates.get(v.name);
    if(!crate){
      const g=new THREE.Group(),box=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.6),mat(0xffffff,.45,.1,{map:label(' ',{size:150,w:256,h:256})}));box.position.y=.3;box.castShadow=true;g.add(box);
      const tag=this.addLabel(g,0,1.15,0,1.6,.4);g.position.set(-3.8+k*1.9,0,2.7);g.scale.setScalar(.8);this.scene.add(g);crate={group:g,box,tag,show:'',pop:0};this.crates.set(v.name,crate);crate.spawn=performance.now();
    }
    if(crate.show!==v.show){crate.show=v.show;crate.pending=v;this.setCrate(crate,v);if(!quiet)crate.pop=performance.now();}
  }
  setCrate(crate,v){crate.box.material.map=label(plain(v.show),{size:150,w:256,h:256});this.setLabel(crate.tag,`${v.name} = ${v.show}`,{bg:'#e8f0ff',fg:'#16456b',size:90});}
  printedText(frame){return frame.events?.find(e=>e.t==='print')?.text?.replace(/\n/g,'')||'';}
  eventTarget(frame) {
    for(const e of frame.events||[]){
      if(e.name&&this.rows.has(e.name)&&(e.path||e.index!==undefined||e.op==='find'||e.op==='substr'||e.op==='erase'||e.op==='replace'||e.op==='insert')){
        const row=this.rows.get(e.name);let idx=e.path?e.path[e.path.length-1]:e.index??e.pos??0;
        return {row,idx:isNum(idx)?idx:0,event:e};
      }
    }
    // Loop frames: follow the loop variable or the range-for item.
    if(frame.rf&&frame.rf.idx>=0){const row=[...this.rows.values()][0];if(row)return {row,idx:frame.rf.idx};}
    const row=[...this.rows.values()][0];
    if(row&&frame.ctrl)this.ctrl=frame.ctrl;
    if(row&&this.ctrl){const v=frame.vars.find(x=>x.name===this.ctrl),n=parseFloat(v?.show);if(Number.isFinite(n)&&n>=0&&n<=row.count())return {row,idx:Math.min(n,row.count()-1)};}
    return null;
  }
  plan(frame,prev,jump) {
    this.replaying=true;
    if(!this.started){this.reset();this.started=true;}
    const target=this.eventTarget(frame);let travel=0;
    if(target){const row=target.row,cell=row.cellAt(row.twoD?(target.event?.path||[0,target.idx]):[target.idx]),p=cell?row.worldPos(cell):row.group.localToWorld(new THREE.Vector3((target.idx-(row.count()-1)/2)*row.pitch,0,.5));travel=Math.min(900,Math.max(250,this.cursorGoal.distanceTo(new THREE.Vector3(p.x,this.cursorGoal.y,p.z))/4.4*1000));if(!jump)this.cursorGoal.set(p.x,p.y+1.35,p.z);this.cursorOn=true;}
    return {travel:jump?0:travel,reaction:900,extra:{target}};
  }
  apply(frame,prev,jump) {
    const events=frame.events||[];this.opDelay={};
    const hadPrint=!!this.printedText(frame),T=ms=>jump?0:this.whenMs(ms);
    let ofs=0;const abs=ms=>jump?0:this.at(ms);
    const clear=row=>row.cells.forEach(c=>{c.fx={...c.fx,glow:null};});
    for(const e of events) {
      const row=this.rows.get(e.name);
      if(e.t==='read'&&row){const cell=row.cellAt(e.path.length>1||row.twoD?e.path:[e.path[0]]);if(cell){const a=abs(ofs);
        if(e.via==='at'){this.fx.arch={row,from:a,to:a+900,ok:true};}
        cell.fx.open=[a,a+1000];cell.fx.lift=[a+280,a+900];this.fx.value={text:plain(e.value),from:a+320,to:a+1100,cell,row};ofs+=1250;}}
      else if(e.t==='write'&&row){const cell=row.cellAt(e.path);if(cell){const a=abs(ofs);cell.fx.open=[a,a+1250];cell.fx.out=[a+250,a+600];this.later_(this.whenMs(ofs+560),()=>{row.setText(cell,e.value);cell.fx.spawnVal=performance.now();});ofs+=1450;}}
      else if(e.t==='oob'){const r=row||[...this.rows.values()][0];if(r){const a=abs(ofs);this.fx.alarm=[a,a+1900];this.fx.ghost={row:r,index:e.index,from:a,to:a+1900};if(e.via==='at')this.fx.arch={row:r,from:a,to:a+1100,ok:false};ofs+=1900;}}
      else if(e.t==='method'&&row)ofs+=this.methodFx(e,row,abs,ofs);
    }
    if(!jump){this.step.printDelay=ofs;this.step.reaction=Math.max(hadPrint?ofs+2700:ofs+250,500);this.stepMs=this.step.travel+this.step.reaction/this.speed+180/this.speed;}
    this.syncVars(frame.vars,events,jump);
    const sig=frame.kind==='error'?frame.label:'';
    if(frame.kind==='error')this.tag('error ✖','bad');
    if(this.rig&&(jump||['stmt','init','error'].includes(frame.kind)))this.rig.setText(hadPrint&&!jump?prev?.out||'':frame.out);
  }
  methodFx(e,row,abs,ofs) {
    const a=abs(ofs),fx=this.fx;
    switch(e.op) {
      case 'size':fx.tape={row,from:a,to:a+1000,n:e.n};return 1100;
      case 'find':{const idx=e.result==='npos'?row.cells.length:e.result,len=e.needle.length;fx.mag={row,from:a,to:a+1500,idx,len,miss:e.result==='npos'};row.cells.forEach((c,i)=>{if(e.result!=='npos'&&i>=idx&&i<idx+len)c.fx.glow=[a+1100,a+2300,0x35c97a];});return 1700;}
      case 'substr':{row.cells.forEach((c,i)=>{if(i>=e.pos&&i<e.pos+e.len)c.fx.glow=[a,a+1300,0xffdc5a];});fx.value={text:`"${e.result}"`,from:a+300,to:a+1500,row,cell:row.cells[e.pos]};return 1500;}
      case 'append':this.opDelay[row.name]=ofs;return 900;
      case 'insert':fx.stamp=null;this.opDelay[row.name]=ofs+200;return 1100;
      case 'erase':{fx.scissors={row,pos:e.pos,len:e.len,from:a,to:a+900};this.opDelay[row.name]=ofs+520;return 1300;}
      case 'replace':{fx.stamp={row,pos:e.pos,len:e.len,from:a,to:a+800};this.opDelay[row.name]=ofs+420;return 1300;}
    }
    return 400;
  }
  tagAnchor(){return new THREE.Vector3(0,3.4,1.2);}
  animate(now,dt,st,u,r) {
    const k=1-Math.exp(-dt*7);
    this.rows.forEach(row=>{
      row.cells.concat(row.dying).forEach(cell=>{
        const f=cell.fx||{};cell.x+=(cell.tx-cell.x)*k;cell.y+=(cell.ty-cell.y)*k;
        let sy=1,visible=true,yo=0;
        if(f.spawn!==undefined){const s=(now-f.spawn)/520;if(s<0)visible=false;else if(s<1){yo=(1-outBack(s))*2.4;sy=.7+.3*outBack(s);}}
        if(f.die!==undefined){const t=(now-f.die)/700;if(t>0){yo=-t*t*5;cell.group.rotation.z=t*1.2;sy=Math.max(.01,1-t*.6);if(t>1)visible=false;}}
        cell.group.position.set(cell.x,cell.y+yo,0);cell.group.visible=visible;cell.group.scale.setScalar(sy);
        if(cell.kind==='locker'){
          const open=f.open?inOut(win(now,f.open[0],f.open[0]+280))-inOut(win(now,f.open[1],f.open[1]+280)):0;cell.pivot.rotation.y=-open*1.9;
          const lift=f.lift?inOut(win(now,f.lift[0],f.lift[0]+260))-inOut(win(now,f.lift[1],f.lift[1]+260)):0;
          const out=f.out?inOut(win(now,f.out[0],f.out[0]+250)):0,sv=f.spawnVal?outBack(win(now,f.spawnVal,f.spawnVal+350)):1;
          cell.val.position.set(0,.27+lift*.55,lift*.5);cell.val.scale.setScalar(Math.max(.01,(1-out*(sv<1?1:0))*sv)||1);
          if(f.out&&now<f.out[1]+300&&!f.spawnVal)cell.val.position.y=.27-out*.4;
        }
        const glow=f.glow&&now>=f.glow[0]&&now<=f.glow[1];
        const tgt=cell.kind==='tile'?cell.tile.material:cell.val.material;tgt.emissive.setHex(glow?f.glow[2]:cell.end?0x6a3a00:0x000000);
        if(cell.kind==='tile')cell.tile.position.y=.56+(glow?.16:0)+(cell.end?Math.sin(now/260)*.03:0);
      });
      row.dying=row.dying.filter(c=>now-(c.fx.die||now)<800||(row.group.remove(c.group),false));
      row.slab.scale.x+=(row.width()-row.slab.scale.x)*k;
    });
    // Cursor follows the target like a hovering spotlight.
    this.cursorPos.lerp(this.cursorGoal,1-Math.exp(-dt*(st.travel>0?6:4)));this.cursor.visible=this.cursorOn&&this.rows.size>0;this.cursor.position.set(this.cursorPos.x,this.cursorPos.y+Math.sin(now/300)*.06,this.cursorPos.z);
    // Floating value readout.
    const val=this.fx.value,vt=val?clamp(Math.min(win(now,val.from,val.from+200),1-win(now,val.to-200,val.to))):0;
    if(val&&!val.set){val.set=true;this.valueTag.material.map=label(val.text,{bg:'#fff3c7',fg:'#3a2a00',size:130,w:384,h:160});}
    this.valueTag.visible=vt>0;this.valueTag.material.opacity=vt;if(val&&vt>0){const p=val.row.worldPos(val.cell,1.9);this.valueTag.position.set(p.x,p.y+vt*.2,p.z+.3);this.valueTag.quaternion.copy(this.camera.quaternion);}
    // Alarm beacon, ghost slot and shake for out-of-range access.
    const al=this.fx.alarm,alOn=al&&now>=al[0]&&now<=al[1];this.lampMat.emissive.setHex(alOn&&Math.floor(now/160)%2===0?0xff2a2a:0);this.lampMat.emissiveIntensity=alOn?2.2:0;this.lampMat.color.setHex(alOn?0xff4a4a:0x553333);
    const gh=this.fx.ghost;if(gh){const t=win(now,gh.from,gh.to),on=t>0&&t<1,row=gh.row,idx=gh.index;
      const p=row.group.localToWorld(new THREE.Vector3((idx-(row.count()-1)/2)*row.pitch,.75,0));this.ghost.position.set(p.x,p.y,p.z);this.ghost.scale.setScalar(row.group.scale.x);this.ghost.material.opacity=on?(.6+.3*Math.sin(now/120)):0;
      if(on)row.group.position.x=Math.sin(now/45)*.05*(1-t);else row.group.position.x=0;}
    // Scanner arch for .at().
    const ar=this.fx.arch;this.arch.visible=!!ar&&now<ar.to+300;if(ar){const row=ar.row,t=win(now,ar.from,ar.to),p=row.group.localToWorld(new THREE.Vector3(-row.width()/2-.2,0,0));this.arch.position.set(p.x,0,p.z);this.curtain.material.color.setHex(ar.ok?0x44ff99:0xff5a4a);this.curtain.position.x=lerp(-.3,.3,t);this.curtain.material.opacity=t>0&&t<1?Math.sin(t*Math.PI)*.6:0;}
    // Tape measure.
    const tp=this.fx.tape;this.tape.visible=!!tp&&now<tp.to+500;if(tp){const t=inOut(win(now,tp.from,tp.from+650)),w=tp.row.width()*tp.row.group.scale.x,p=tp.row.group.localToWorld(new THREE.Vector3(0,.1,.9));this.tape.scale.x=Math.max(.01,w*t);this.tape.position.set(p.x-w/2+w*t/2,.1,p.z);
      if(t>.98&&!tp.set){tp.set=true;this.valueTag.material.map=label(`size = ${tp.n}`,{bg:'#ffe28a',fg:'#3a2a00',size:110,w:384,h:160});this.fx.value={text:`size = ${tp.n}`,from:now,to:now+900,row:tp.row,cell:tp.row.cells[Math.max(0,tp.row.cells.length-1)],set:true};}}
    // Magnifier slides along the string looking for the needle.
    const mg=this.fx.mag;this.mag.visible=!!mg&&now<mg.to+1200;if(mg){const row=mg.row,t=inOut(win(now,mg.from,mg.to)),x=(lerp(0,mg.idx,t)-(row.cells.length-1)/2)*row.pitch,p=row.group.localToWorld(new THREE.Vector3(x+mg.len*.35,1.3,.6));this.mag.position.set(p.x,p.y+Math.sin(now/200)*.04,p.z);this.mag.scale.setScalar(row.group.scale.x*1.2);this.mag.quaternion.copy(this.camera.quaternion);
      if(mg.miss&&t>=1&&!mg.shown){mg.shown=true;this.fx.value={text:'npos (not found)',from:now,to:now+1100,row,cell:row.cells.at(-1),set:false};}}
    // Scissors snip the ribbon; the stamp press pushes new letters in.
    const sc=this.fx.scissors;this.scissors.visible=!!sc&&now<sc.to+300;if(sc){const t=win(now,sc.from,sc.to),x=(sc.pos+sc.len/2-.5-(sc.row.cells.length-1)/2)*sc.row.pitch,p=sc.row.group.localToWorld(new THREE.Vector3(x,1.7,.6));this.scissors.position.set(p.x,p.y,p.z);this.scissors.scale.setScalar(sc.row.group.scale.x*1.1);const snip=Math.abs(Math.sin(t*Math.PI*3))*.5;this.blades.forEach(b=>{b.rotation.z=b.userData.s*(.05+snip);});this.scissors.quaternion.copy(this.camera.quaternion);}
    const sp=this.fx.stamp;this.stamp.visible=!!sp&&now<sp.to+300;if(sp){const t=win(now,sp.from,sp.to),down=Math.sin(Math.min(1,t*1.3)*Math.PI),x=(sp.pos+sp.len/2-.5-(sp.row.cells.length-1)/2)*sp.row.pitch,p=sp.row.group.localToWorld(new THREE.Vector3(x,.0,.4));this.stamp.position.set(p.x,2.4-down*1.7,p.z);this.stamp.scale.set(Math.max(.6,sp.len)*.9*sp.row.group.scale.x,sp.row.group.scale.x,sp.row.group.scale.x);}
    this.crates.forEach(c=>{const pop=c.pop?clamp(1-(now-c.pop)/450):0,sp2=(now-c.spawn)/500;c.box.scale.setScalar(sp2<1?outBack(sp2):1+Math.sin(pop*Math.PI)*.3);c.box.rotation.y+=dt*.4;});
    this.hl.material.opacity=0;
  }
}
