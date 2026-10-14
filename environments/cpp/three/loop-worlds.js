import * as THREE from '../vendor/three/three.module.js';
import { LoopMachine, label, environment, mat, clamp, lerp, inOut, outCubic, outBack, win, nextAngle, STATION, R, DEG } from './loop-machine.js?v=20261014-cs-18';

// Other loop lessons, each with its own physical concept, sharing one timed-step engine (travel, then a reaction).
const REACT={stmt:1000,error:1600,init:900,check:1400,body:800,print:2700,continue:800,update:900,item:1000,exit:1100,break:1000,limit:900};
const PRINT_MS=1900;
class OutputRig {
  // Thermal printer desk plus terminal monitor: paper feeds out typing itself, is cut, falls in the tray and glides into the monitor.
  constructor(world,x,z,yaw,{lite=false}={}){
    this.world=world;this.lite=lite;const g=new THREE.Group(),steel=mat(0x1c2a38,.4,.6);this.group=g;
    if(!lite){
    const desk=new THREE.Mesh(new THREE.BoxGeometry(1.3,.7,1),mat(0x2d7fb8,.4,.5));desk.position.y=.35;desk.castShadow=desk.receiveShadow=true;g.add(desk);
    const house=new THREE.Mesh(new THREE.BoxGeometry(.8,.35,.6),mat(0x20303e,.35,.5));house.position.set(0,.875,.25);house.castShadow=true;g.add(house);
    this.led=new THREE.Mesh(new THREE.SphereGeometry(.03,12,8),new THREE.MeshStandardMaterial({color:0x224433,emissive:0x000000}));this.led.position.set(.3,1.0,.552);g.add(this.led);
    this.cutter=new THREE.Mesh(new THREE.BoxGeometry(.7,.02,.04),mat(0xe8eef3,.2,1,{emissive:0x000000}));this.cutter.position.set(0,.7,.56);g.add(this.cutter);
    this.canvas=document.createElement('canvas');this.canvas.width=320;this.canvas.height=220;this.tex=new THREE.CanvasTexture(this.canvas);this.tex.colorSpace=THREE.SRGBColorSpace;this.tex.anisotropy=4;
    const paperMat=new THREE.MeshStandardMaterial({map:this.tex,roughness:.9,side:THREE.DoubleSide,emissive:0xffffff,emissiveMap:this.tex,emissiveIntensity:.25});
    this.paper=new THREE.Mesh(new THREE.PlaneGeometry(.52,.34),paperMat);this.paper.position.set(0,.875,.52);this.paper.visible=false;g.add(this.paper);
    this.ticket=new THREE.Mesh(new THREE.PlaneGeometry(.52,.34),paperMat);this.ticket.visible=false;world.scene.add(this.ticket);
    const tray=new THREE.Mesh(new THREE.BoxGeometry(.95,.07,.62),mat(0x9fb4c6,.35,.7));tray.position.set(0,.035,1.15);tray.receiveShadow=true;g.add(tray);
    }
    const stand=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,.8,16),steel);stand.position.set(1.9,.4,-.2);stand.castShadow=true;g.add(stand);
    const frame=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.12,.14),steel);frame.position.set(1.9,1.25,-.2);frame.castShadow=true;g.add(frame);
    this.termCanvas=document.createElement('canvas');this.termCanvas.width=512;this.termCanvas.height=336;this.termTex=new THREE.CanvasTexture(this.termCanvas);this.termTex.colorSpace=THREE.SRGBColorSpace;this.termTex.anisotropy=4;
    this.screen=new THREE.Mesh(new THREE.PlaneGeometry(1.56,1),new THREE.MeshBasicMaterial({map:this.termTex,toneMapped:false}));this.screen.position.set(1.9,1.25,-.12);g.add(this.screen);
    const slit=new THREE.Mesh(new THREE.BoxGeometry(.7,.03,.1),new THREE.MeshBasicMaterial({color:0x05080b}));slit.position.set(1.9,1.82,-.16);g.add(slit);[stand,frame,this.screen,slit].forEach(m=>{m.visible=false;});
    g.position.set(x,0,z);g.rotation.y=yaw;g.userData.baseScale=this.s0=.85;this.text='';this.blink=true;this.fl={};this.drawTerm();
    this.piece=world.piece('rig',g,world.rise(g,1.6));
  }
  drawTerm() {
    const c=this.termCanvas.getContext('2d'),lines=this.text.split('\n'),shown=lines.slice(-8);
    c.fillStyle='#03121a';c.fillRect(0,0,512,336);c.fillStyle='#0f3b4d';c.fillRect(0,0,512,34);
    c.fillStyle='#8fd3f4';c.font='700 20px monospace';c.textBaseline='middle';c.textAlign='left';c.fillText('● terminal',14,18);
    c.font='700 30px monospace';c.fillStyle='#5eff9d';c.textBaseline='top';
    shown.forEach((line,i)=>c.fillText(line.slice(0,26),16,48+i*34));
    if(this.blink){c.fillRect(16+Math.min(26,shown.at(-1)?.length||0)*18,48+(shown.length-1)*34+4,16,26);}
    this.termTex.needsUpdate=true;
  }
  setText(text){if(text!==this.text){this.text=text;this.drawTerm();}}
  drawPaper(text,count) {
    const c=this.canvas.getContext('2d');c.fillStyle='#fbfbf6';c.fillRect(0,0,320,220);c.fillStyle='#d6d6cc';c.fillRect(0,0,320,8);
    c.fillStyle='#7c8a94';c.font='700 18px monospace';c.textAlign='center';c.textBaseline='top';c.fillText('— cout —',160,24);
    c.fillStyle='#16303f';c.textBaseline='middle';c.font=`800 ${Math.min(56,Math.floor(500/Math.max(4,text.length)))}px monospace`;c.fillText(text.slice(0,count),160,112);
    c.fillStyle='#b9b9ae';for(let x=0;x<320;x+=16){c.beginPath();c.moveTo(x,220);c.lineTo(x+8,208);c.lineTo(x+16,220);c.fill();}
    this.tex.needsUpdate=true;
  }
  // r: ms since the print started (negative = idle). Returns true while the sequence is running.
  render(r,text,out,now) {
    const g=this.group,fl=this.fl,on=r>=0&&!!text;
    if(this.lite){
      if(on&&r>=300&&!fl.done){fl.done=true;this.setText(out);this.flash=now;}
      this.screen.material.color.setScalar(1+(this.flash?clamp(1-(now-this.flash)/500):0)*.6);return on&&r<600;
    }
    const feed=on?inOut(win(r,0,650)):0,typed=on?Math.floor(text.length*win(r,40,650)):0;
    if(on&&fl.typed!==typed&&r<700){fl.typed=typed;this.drawPaper(text,typed);}
    this.paper.visible=on&&r<750;this.paper.position.y=.875-feed*.34;this.paper.rotation.x=feed*.1;
    this.led.material.emissive.setHex(on&&r<750&&Math.floor(now/90)%2===0?0x33ff88:0);
    const cut=on?win(r,650,750):0;this.cutter.scale.y=1+Math.sin(cut*Math.PI)*3;this.cutter.material.emissive.setHex(cut>0&&cut<1?0xffffff:0);
    const fall=win(r,750,1050),glide=win(r,1100,1650),flying=on&&r>=750&&r<1650;this.ticket.visible=flying;
    if(flying){
      const start=g.localToWorld(new THREE.Vector3(0,.7,.52)),land=g.localToWorld(new THREE.Vector3(0,.12,1.15)),slot=g.localToWorld(new THREE.Vector3(1.9,1.85,-.16));
      if(glide<=0){const f=fall*fall;this.ticket.position.set(lerp(start.x,land.x,fall),lerp(start.y-.2,land.y,f)+(fall>=1?Math.sin(win(r,1050,1100)*Math.PI)*.04:0),lerp(start.z,land.z,outCubic(fall)));this.ticket.rotation.set(-lerp(0,Math.PI/2.1,outCubic(fall)),g.rotation.y,0);this.ticket.scale.setScalar(this.s0);}
      else{const e=inOut(glide),mid=land.clone().lerp(slot,.5);mid.y+=1.2;this.ticket.position.copy(land.clone().lerp(mid,e).lerp(mid.clone().lerp(slot,e),e));this.ticket.rotation.set(-lerp(Math.PI/2.1,0,e),g.rotation.y,0);this.ticket.scale.setScalar(this.s0*(1-.8*Math.max(0,(glide-.7)/.3)));}
    }
    if(on&&r>=1650&&!fl.done){fl.done=true;this.setText(out);this.flash=now;}
    this.screen.material.color.setScalar(1+(this.flash?clamp(1-(now-this.flash)/450):0)*.7);
    return on&&r<1900;
  }
  begin(){this.fl={};}
  tick(now){const b=Math.floor(now/500)%2===0;if(b!==this.blink){this.blink=b;this.drawTerm();}}
}

class World {
  constructor() {
    this.el=document.createElement('div');this.el.className='cpp-lp-canvas';
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.el.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.environment=environment(this.renderer);this.scene.environmentIntensity=.7;
    this.camera=new THREE.PerspectiveCamera(38,2,.1,100);
    const sun=new THREE.DirectionalLight(0xfff1dc,2.6);sun.position.set(-5,9,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:32});sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;this.scene.add(sun,new THREE.HemisphereLight(0xcfe6ff,0x1a2a38,.9));
    this.billboards=[];this.pieces={};this.later=[];this.speed=1;this.stepMs=1200;this.frames=[];this.header={has:false};this.cam={x:0,y:5.6,z:9,ty:.4,tz:.3};
    this.step={t0:0,travel:0,reaction:0,kind:'init',flags:{}};this.last='';
    const floor=new THREE.Mesh(new THREE.CircleGeometry(11,64),mat(0x14283a,.85,.05));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;this.scene.add(floor);
    const grid=new THREE.GridHelper(22,22,0x2c5578,0x1d3a55);grid.position.y=.004;grid.material.transparent=true;grid.material.opacity=.45;this.scene.add(grid);
    this.tagMesh=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.4),new THREE.MeshBasicMaterial({map:label(' '),transparent:true,opacity:0,toneMapped:false}));this.scene.add(this.tagMesh);
    this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(this.el);
    this.clock=performance.now();this.alive=true;this.frame=this.loop.bind(this);requestAnimationFrame(this.frame);
  }
  fit(){const w=this.el.clientWidth||600,h=this.el.clientHeight||300;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  piece(name,group,apply,{spring=true}={}){group.visible=false;this.scene.add(group);this.pieces[name]={group,p:0,v:0,target:0,apply,spring};return group;}
  want(name,on){this.pieces[name].target=on?1:0;}
  addLabel(parent,x,y,z,w=1.5,h=.5){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:label(' '),transparent:true,toneMapped:false}));m.position.set(x,y,z);parent.add(m);this.billboards.push(m);return m;}
  setLabel(mesh,text,opts){if(mesh.userData.text===text)return;mesh.userData.text=text;mesh.material.map=label(text,opts);}
  rise(group,depth=1.2){return p=>{group.position.y=(group.userData.baseY||0)-depth*(1-p);group.scale.setScalar(Math.max(.01,(.55+.45*p)*(group.userData.baseScale||1)));group.visible=p>.01;};}
  setFrames(frames){this.frames=frames||[];}
  show(frame,prev,{jump=false}={}) {
    if(!frame||!this.header.has)return;
    const now=performance.now(),sp=this.speed,plan=this.plan(frame,prev,jump)||{};
    const printed=this.printedText(frame,prev),reaction=jump?0:plan.reaction??(printed?REACT.print:REACT[frame.kind]||800);
    this.step={t0:now,frame,prev,jump,kind:frame.kind,travel:jump?0:(plan.travel||0)/sp,reaction,printed,printDelay:0,flags:{},...plan.extra};
    this.stepMs=jump?120:this.step.travel+reaction/sp+180/sp;this.later=[];
    if(this.rig&&printed&&!jump)this.rig.begin();
    this.apply?.(frame,prev,jump);
  }
  printedText(frame,prev){return frame.kind==='body'?frame.out.slice(prev?.out.length||0).replace(/\n/g,''):'';}
  later_(ms,fn){this.later.push({at:performance.now()+ms,fn});}
  at(ms){return performance.now()+this.step.travel+ms/this.speed;}
  whenMs(ms){return this.step.travel+ms/this.speed;}
  tag(text,tone){this.tagMesh.material.map=label(text,{bg:tone==='bad'?'#ffb08a':tone==='skip'?'#ffe28a':'#a8ffcc',fg:'#122',size:110});}
  loop(now) {
    if(!this.alive)return;requestAnimationFrame(this.frame);
    if(!this.el.isConnected||document.hidden)return;
    const dt=Math.max(0,Math.min(.12,(now-this.clock)/1000));this.clock=now;
    for(const piece of Object.values(this.pieces)){
      const before=piece.p;
      if(piece.spring){const n=Math.ceil(dt/.01),h=dt/n;for(let i=0;i<n;i++){const f=(piece.target-piece.p)*110-piece.v*13;piece.v+=f*h;piece.p+=piece.v*h;}if(Math.abs(piece.target-piece.p)<.002&&Math.abs(piece.v)<.02){piece.p=piece.target;piece.v=0;}}
      else{const d=piece.target-piece.p;piece.p+=Math.sign(d)*Math.min(Math.abs(d),dt/1.4);}
      if(piece.p!==before||piece.group.visible!==piece.p>.001)piece.apply(piece.spring?piece.p:inOut(piece.p));
    }
    this.later=this.later.filter(item=>{if(now>=item.at){item.fn();return false;}return true;});
    const st=this.step,t=now-st.t0,u=st.travel>0?clamp(t/st.travel):1,r=Math.max(0,(t-st.travel)*this.speed);
    this.animate(now,dt,st,u,r);
    if(this.rig){this.rig.tick(now);this.rig.render(st.printed&&!st.jump?r-(st.printDelay||0):-1,st.printed,st.frame?.out||'',now);}
    const show=['exit','break','limit','continue','error'].includes(st.kind),w=show?win(r,0,260):0,fade=show?1-win(r,st.reaction*.7,st.reaction):0;
    this.tagMesh.visible=show;this.tagMesh.material.opacity=Math.min(1,w*4)*fade;this.tagMesh.scale.setScalar(.5+.5*outBack(w));
    if(show){this.tagMesh.position.copy(this.tagAnchor?.()||new THREE.Vector3(0,2,0));this.tagMesh.position.y+=w*.25;}
    this.tagMesh.quaternion.copy(this.camera.quaternion);this.billboards.forEach(b=>b.quaternion.copy(this.camera.quaternion));
    const wide=this.wideFn?this.wideFn(this.camera.aspect):Math.max(1,Math.pow(2.1/this.camera.aspect,.7));
    this.camera.position.set(Math.sin(now/6200)*(this.sway??1.1)+this.cam.x,this.cam.ty+(this.cam.y-this.cam.ty)*wide,this.cam.tz+(this.cam.z-this.cam.tz)*wide);this.camera.lookAt(0,this.cam.ty,this.cam.tz);
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.alive=false;this.resize.disconnect();this.renderer.dispose();this.el.remove();}
}
const colors=[0xff7a59,0x3fc1c9,0xffc93c,0x9b7bff,0x5ed38a,0xff6fa5];
const trimQuote=s=>String(s).replace(/^['"]|['"]$/g,'');

// ---- range-based for: a gantry crane over a conveyor belt picks up each item in turn ----
class RangeWorld extends World {
  constructor(){super();this.cam={x:0,y:5.8,z:10.8,ty:.8,tz:.2};this.items=[];this.itemKey='';this.byRef=false;this.trolleyX=-5;this.heldIdx=-1;this.varName='n';this.spawnAt=0;this.build();}
  build() {
    const belt=new THREE.Group(),rubber=mat(0x1b2530,.8),steel=mat(0x8fa4b6,.35,.85);
    const top=new THREE.Mesh(new THREE.BoxGeometry(9.4,.16,1.5),rubber);top.position.set(0,.5,1);top.castShadow=top.receiveShadow=true;belt.add(top);
    [-4.7,4.7].forEach(x=>{const roller=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,1.6,24),steel);roller.rotation.x=Math.PI/2;roller.position.set(x,.5,1);roller.castShadow=true;belt.add(roller);});
    [-.85,.85].forEach(z=>{const rail=new THREE.Mesh(new THREE.BoxGeometry(9.4,.12,.08),steel);rail.position.set(0,.64,1+z);belt.add(rail);});
    [-4,0,4].forEach(x=>[-.6,.6].forEach(z=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.14,.45,.14),steel);leg.position.set(x,.22,1+z);belt.add(leg);}));
    this.stripes=[];for(let i=0;i<14;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.08,.012,1.3),mat(0x2f3f50,.8));s.position.set(-4.5+i*.69,.585,1);belt.add(s);this.stripes.push(s);}
    this.piece('belt',belt,p=>{belt.position.y=-1*(1-p);belt.scale.setScalar(.6+.4*p);belt.visible=p>.01;});
    const gantry=new THREE.Group();
    [-5.1,5.1].forEach(x=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.22,3.7,.22),steel);post.position.set(x,1.85,1);post.castShadow=true;gantry.add(post);});
    const beam=new THREE.Mesh(new THREE.BoxGeometry(10.4,.26,.3),mat(0xffb02e,.4,.4));beam.position.set(0,3.7,1);beam.castShadow=true;gantry.add(beam);
    this.trolley=new THREE.Group();this.trolley.position.set(-5,3.55,1);
    this.trolley.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.6,.3,.5),mat(0x2d7fb8,.4,.5)),{castShadow:true}));
    this.cable=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,8),mat(0xdde6ee,.3,.9));this.trolley.add(this.cable);
    this.claw=new THREE.Group();const fingerMat=mat(0xdde6ee,.25,.9);this.fingers=[-1,1].map(s=>{const f=new THREE.Mesh(new THREE.BoxGeometry(.08,.5,.14),fingerMat);f.position.set(s*.42,-.2,0);f.castShadow=true;this.claw.add(f);return f;});
    const bar=new THREE.Mesh(new THREE.BoxGeometry(1,.1,.2),fingerMat);this.claw.add(bar);this.trolley.add(this.claw);
    gantry.add(this.trolley);this.piece('gantry',gantry,p=>{gantry.position.y=2.4*(1-p);gantry.visible=p>.01;});
    const plate=new THREE.Group(),post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.4,12),steel);post.position.y=.7;plate.add(post);
    this.plateTag=this.addLabel(plate,0,1.7,0,1.7,.45);plate.position.set(-3.6,0,2.7);this.plateGroup=plate;this.piece('plate',plate,this.rise(plate));
    this.itemsGroup=new THREE.Group();this.scene.add(this.itemsGroup);
    this.ghost=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.9),mat(0xffffff,.45,.1,{map:label('?'),transparent:true,opacity:.85}));this.ghost.visible=false;this.ghost.castShadow=true;this.scene.add(this.ghost);
    this.rig=new OutputRig(this,-1.6,4.4,0);
  }
  itemX(i,n=this.items.length){return (i-(n-1)/2)*1.3;}
  setItems(list) {
    const key=JSON.stringify(list);if(key===this.itemKey)return;this.itemKey=key;
    this.items.forEach(item=>this.itemsGroup.remove(item.mesh));
    this.items=list.map((text,i)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.9),mat(colors[i%colors.length],.45,.15,{map:label(text,{bg:'#ffffff',size:150})}));mesh.castShadow=mesh.receiveShadow=true;this.itemsGroup.add(mesh);return {mesh,text,pop:0};});
    this.spawnAt=performance.now();this.layout();
  }
  layout(){this.items.forEach((item,i)=>item.mesh.position.set(this.itemX(i),.58+.45,1));}
  setCode(code) {
    const m=/\bfor\s*\(([^)]*)/.exec(code),h=this.header={has:!!m,body:false};
    if(!m){['belt','gantry','plate','rig'].forEach(n=>this.want(n,false));this.setItems([]);return;}
    const header=m[1],decl=/(?:const\s+)?(?:auto|int|char|string|double)\s*(&?)\s*([A-Za-z_]\w*)\s*(:?)\s*([^)]*)/.exec(header);
    this.want('belt',true);this.want('gantry',true);this.want('plate',!!decl);
    h.body=/\bfor\s*\([^)]*\)\s*\{/.test(code);this.want('rig',h.body);
    if(decl){this.byRef=decl[1]==='&';this.varName=decl[2];this.setLabel(this.plateTag,`${this.byRef?'auto& ':''}${decl[2]}`,{bg:'#bfe3ff',size:110});}
    let list=[];const src=(decl?.[4]||'').trim();
    if(decl?.[3]===':'&&src){
      if(src.startsWith('{'))list=src.replace(/[{}]/g,'').split(',').map(x=>trimQuote(x.trim())).filter(Boolean);
      else if(src.startsWith('"'))list=[...trimQuote(src)];
      else if(/^\w+$/.test(src)){
        const arr=new RegExp(`\\b(?:int|char|double|float|auto)\\s+${src}\\s*\\[[^\\]]*\\]\\s*=\\s*\\{([^}]*)\\}`).exec(code),str=new RegExp(`\\bstring\\s+${src}\\s*=\\s*"([^"]*)"`).exec(code);
        if(arr)list=arr[1].split(',').map(x=>trimQuote(x.trim())).filter(Boolean);else if(str)list=[...str[1]];
      }
    }
    if(!this.replaying)this.setItems(list);
  }
  plan(frame,prev,jump) {
    this.replaying=true;const rf=frame.rf;
    if(rf?.items&&this.items.length!==rf.items.length)this.setItems(rf.items);
    const idx=rf?.idx??-1,tx=frame.kind==='init'||frame.kind==='exit'?-5:this.itemX(idx),dist=Math.abs(tx-this.trolleyX);
    return {travel:frame.kind==='item'||frame.kind==='exit'?Math.max(300,dist/2.8*1000):0,extra:{x0:this.trolleyX,x1:tx,idx}};
  }
  apply(frame,prev,jump) {
    const rf=frame.rf;
    if(rf?.items){rf.items.forEach((text,i)=>{const item=this.items[i];if(item&&item.text!==text){item.text=text;item.mesh.material.map=label(text,{bg:'#ffffff',size:150});item.pop=performance.now();}});}
    const value=rf?.idx>=0?rf.items[rf.idx]:'',name=this.varName;
    const set=()=>this.setLabel(this.plateTag,`${this.byRef?'auto& ':''}${name}${value!==''?' = '+value:''}`,{bg:'#bfe3ff',size:100});
    if(frame.kind==='item'&&!jump)this.later_(this.step.travel+800/this.speed,set);else set();
    if(['exit','break','continue','limit'].includes(frame.kind))this.tag({exit:'done ✔',break:'break ✖',continue:'skip ⏭',limit:'step limit!'}[frame.kind],frame.kind==='exit'?'ok':frame.kind==='continue'?'skip':'bad');
    if(this.rig&&(jump||['init','item','break','exit'].includes(frame.kind)))this.rig.setText(frame.out);
  }
  tagAnchor(){return new THREE.Vector3(this.trolley.position.x,3.6,1.4);}
  animate(now,dt,st,u,r) {
    const sp=this.speed,jump=st.jump,x=lerp(st.x0??this.trolleyX,st.x1??this.trolleyX,inOut(u));this.trolleyX=x;
    this.trolley.position.x=x;this.stripes.forEach((s,i)=>{s.position.x=-4.5+((i*.69+(st.kind==='init'?0:0))%9.66);});
    const kind=st.kind,reaction=st.reaction,idx=st.idx??-1,item=this.items[idx];
    // Held height: grab while 'item', carry through the body, set down at the end.
    let lift=0,down=0,close=0;
    if(!jump){
      if(kind==='item'){down=inOut(win(r,0,350));close=inOut(win(r,300,420));lift=inOut(win(r,420,800));}
      else if(kind==='body'||kind==='continue'){close=1;lift=1-inOut(win(r,reaction-450,reaction));}
      else if(kind==='break'){close=1-win(r,0,300);lift=1-inOut(win(r,0,300));}
    } else if(kind==='item'||kind==='body'){lift=1;close=1;}
    const homeY=3.0,restTop=.58+.9+.55,carryY=2.5,holdY=lerp(restTop+.45,carryY,lift);
    const clawY=(kind==='item'&&!jump&&r<420)?lerp(homeY,restTop+.75,down):lift>0||close>0?holdY+.75:homeY;
    this.claw.position.y=-(3.55-clawY);this.cable.scale.y=Math.max(.01,3.55-clawY);this.cable.position.y=-(3.55-clawY)/2;
    this.fingers.forEach((f,i)=>{f.position.x=(i?1:-1)*lerp(.55,.33,close);});
    // Held item: the real crate if auto&, otherwise a ghost copy while the original stays on the belt.
    const wobble=kind==='body'&&r>300?Math.sin(r*.03)*.04:0,holdsGhost=item&&!this.byRef&&idx>=0&&lift>0;
    this.items.forEach((it,i)=>{
      const base=this.itemX(i),spawn=(now-this.spawnAt-i*140)/600,drop=this.spawnAt&&spawn<1?1-outBack(spawn):0,pop=it.pop?clamp(1-(now-it.pop)/500):0;
      const real=i===idx&&this.byRef&&lift>0;
      it.mesh.position.set(base,real?holdY:.58+.45+drop*3,1);
      it.mesh.visible=spawn>0||!this.spawnAt;it.mesh.scale.setScalar(1+Math.sin(pop*Math.PI)*.3);
      it.mesh.rotation.y=real?wobble*6:0;it.mesh.material.opacity=1;it.mesh.material.emissive.setHex(i===idx&&lift>0&&!this.byRef?0x222222:0);
    });
    this.ghost.visible=!!holdsGhost;
    if(holdsGhost){this.ghost.material.map=item.mesh.material.map;this.ghost.position.set(this.itemX(idx),holdY,1);this.ghost.rotation.y=wobble*6;this.ghost.material.color.set(colors[idx%colors.length]);this.ghost.scale.setScalar(.92+Math.sin(r*.012)*.02);}
  }
}

// ---- while / do-while: a canal lock. The gate opens only while the condition holds; the gauge tower shows the variable ----
class WhileWorld extends World {
  constructor(){super();this.cam={x:0,y:5.4,z:9.2,ty:.3,tz:.3};this.boat={a:180,fresh:true,wheel:0};this.gate=0;this.level=.5;this.levelTarget=.5;this.varName='n';this.doMode=false;this.gaugeMax=1;this.build();}
  build() {
    const water=new THREE.Mesh(new THREE.RingGeometry(R-.9,R+.9,96,1),new THREE.MeshStandardMaterial({color:0x2a8fd0,roughness:.08,metalness:.1,transparent:true,opacity:.0}));water.rotation.x=-Math.PI/2;water.position.y=.07;water.receiveShadow=true;
    const stone=mat(0x8c8f93,.8),canal=new THREE.Group();canal.add(water);
    [-.97,.97].forEach(o=>{const wall=new THREE.Mesh(new THREE.TorusGeometry(R+o,.11,10,96),stone);wall.rotation.x=Math.PI/2;wall.position.y=.12;wall.castShadow=wall.receiveShadow=true;canal.add(wall);});
    const island=new THREE.Mesh(new THREE.CircleGeometry(R-1.08,64),mat(0x3d6a4a,.95));island.rotation.x=-Math.PI/2;island.position.y=.03;island.receiveShadow=true;canal.add(island);
    this.water=water;this.piece('canal',canal,p=>{canal.visible=p>.001;water.material.opacity=Math.min(.88,p*1.2);canal.scale.set(.85+.15*p,1,.85+.15*p);},{spring:false});
    const boat=new THREE.Group(),shape=new THREE.Shape();shape.moveTo(-.55,.34);shape.lineTo(-.45,0);shape.lineTo(.4,0);shape.lineTo(.8,.34);shape.closePath();
    const hullGeo=new THREE.ExtrudeGeometry(shape,{depth:.46,bevelEnabled:false});hullGeo.translate(0,0,-.23);
    const hull=new THREE.Mesh(hullGeo,mat(0xd9453a,.45,.2));hull.castShadow=true;boat.add(hull);
    const deck=new THREE.Mesh(new THREE.BoxGeometry(1.1,.04,.4),mat(0xe9d7ae,.8));deck.position.set(.1,.345,0);boat.add(deck);
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(.4,.3,.34),mat(0xf4f4ee,.5));cabin.position.set(-.15,.5,0);cabin.castShadow=true;boat.add(cabin);
    const funnel=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.2,12),mat(0xffb02e,.4));funnel.position.set(-.25,.75,0);boat.add(funnel);
    this.sign=new THREE.Mesh(new THREE.PlaneGeometry(.4,.2),new THREE.MeshBasicMaterial({map:label(' ',{w:256,h:128}),toneMapped:false}));this.sign.rotation.x=-Math.PI/2;this.sign.position.set(.3,.37,0);boat.add(this.sign);
    boat.scale.setScalar(1.25);boat.visible=false;this.scene.add(boat);this.boatMesh=boat;
    const gate=new THREE.Group();gate.position.set(0,0,R);this.gateLeaves=[-1,1].map(s=>{
      const hinge=new THREE.Group();hinge.position.set(0,.12,s*.9);const leaf=new THREE.Mesh(new THREE.BoxGeometry(.1,.85,.9),mat(0xffcf3a,.45,.3));leaf.position.set(0,.42,-s*.45);leaf.castShadow=true;hinge.add(leaf);
      const post=new THREE.Mesh(new THREE.BoxGeometry(.26,1.05,.26),stone);post.position.set(0,.3,s*.05);gate.add(post);hinge.userData.s=s;gate.add(hinge);return hinge;});
    this.lamp=new THREE.Mesh(new THREE.SphereGeometry(.14,24,16),new THREE.MeshStandardMaterial({color:0x445566,emissive:0x000000,roughness:.2}));this.lamp.position.set(0,1.45,0);gate.add(this.lamp);
    const bridge=new THREE.Mesh(new THREE.BoxGeometry(.18,.14,2.1),mat(0x8fa4b6,.35,.85));bridge.position.set(0,1.28,0);bridge.castShadow=true;gate.add(bridge);
    this.condTag=this.addLabel(gate,0,2.05,0,1.7,.4);this.modeTag=this.addLabel(gate,0,2.5,0,2.2,.34);this.piece('gate',gate,p=>{gate.position.y=(1-p)*3;gate.visible=p>.01;});
    const tower=new THREE.Group(),glass=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,2,24,1,true),new THREE.MeshStandardMaterial({color:0xbfe6ff,transparent:true,opacity:.3,roughness:.05,side:THREE.DoubleSide}));glass.position.y=1.15;tower.add(glass);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.45,.55,.3,24),mat(0x3b5a78,.4,.6));base.position.y=.15;base.castShadow=true;tower.add(base);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.12,24),mat(0x3b5a78,.4,.6));cap.position.y=2.2;tower.add(cap);
    for(let i=0;i<=8;i++){const tick=new THREE.Mesh(new THREE.BoxGeometry(.14,.015,.015),mat(0xffffff,.5));tick.position.set(.3,.3+i*.2,0);tower.add(tick);}
    this.float=new THREE.Mesh(new THREE.SphereGeometry(.18,24,16),mat(0xff5252,.3,.1));this.float.castShadow=true;tower.add(this.float);
    this.gaugeTag=this.addLabel(tower,0,2.75,0,1.6,.42);tower.position.set(-(R+1.8),0,0);this.piece('gauge',tower,this.rise(tower));
    const dock=new THREE.Group(),pier=new THREE.Mesh(new THREE.BoxGeometry(1.6,.16,.9),mat(0x7a5535,.85));pier.position.set(R+1.35,.2,0);pier.castShadow=pier.receiveShadow=true;dock.add(pier);
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,1.6,16),mat(0x2d7fb8,.4,.5));mast.position.set(R+1.8,1,0);mast.castShadow=true;dock.add(mast);
    this.boom=new THREE.Group();this.boom.position.set(R+1.8,1.75,0);dock.add(this.boom);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(1.5,.14,.14),mat(0xffcf3a,.35,.6));arm.position.x=-.75;arm.castShadow=true;this.boom.add(arm);
    this.hook=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1,8),mat(0xdde6ee,.3,.9));this.hook.position.set(-1.4,-.5,0);this.boom.add(this.hook);
    this.piece('dock',dock,p=>{dock.position.y=-1.2*(1-p);dock.visible=p>.01;});
    this.rig=new OutputRig(this,-1.6,4.4,0);
  }
  stationAngle(kind){return kind==='check'?90:kind==='body'||kind==='continue'||kind==='break'?0:(this.doMode?0:180);}
  setCode(code) {
    const w=/\bwhile\s*\(([^)]*)/.exec(code),d=/\bdo\s*\{/.test(code),decl=/\b(?:int|double|float|long)\s+([A-Za-z_]\w*)\s*=\s*([-\d.]+)/.exec(code);
    this.doMode=d;const h=this.header={has:!!w||d,body:false};
    ['canal','gate','gauge','dock','rig'].forEach(n=>this.want(n,false));
    if(!h.has){this.boatMesh.visible=false;this.boat.fresh=true;this.replaying=false;return;}
    this.want('canal',true);
    if(decl&&(w||d)){this.varName=decl[1];this.want('gauge',true);this.levelTarget=this.level=clamp(Math.abs(+decl[2])/Math.max(1,Math.abs(+decl[2])),0,1);this.setLabel(this.gaugeTag,`${decl[1]} = ${decl[2]}`,{bg:'#bfe3ff',size:100});}
    const cond=d?(/\}\s*while\s*\(([^)]*)/.exec(code)?.[1]||''):w?.[1]||'';
    if(cond.trim()){this.want('gate',true);this.setLabel(this.condTag,cond.trim(),{bg:'#fff3c7',fg:'#4a3300',size:110});this.setLabel(this.modeTag,d?'run first, then check':'check first, then run',{bg:'#e8f0ff',fg:'#16456b',size:80});}
    h.body=d?true:/\bwhile\s*\([^)]*\)\s*\{/.test(code);this.want('dock',h.body);this.want('rig',h.body);
    this.boatMesh.visible=this.replaying||(h.body&&!!decl);
    if(!this.replaying&&h.body&&decl)this.boat.a=this.doMode?0:180;
  }
  setFrames(frames){
    super.setFrames(frames);const nums=frames.map(f=>Math.abs(parseFloat(f.vars.find(v=>v.name===this.varName)?.show))).filter(Number.isFinite);this.gaugeMax=Math.max(1,...nums);
  }
  plan(frame,prev,jump) {
    this.replaying=true;this.boatMesh.visible=true;const b=this.boat;
    if(b.fresh){b.a=this.doMode?0:180;b.fresh=false;}
    const station=this.stationAngle(frame.kind),hold=frame.kind==='exit'||frame.kind==='limit'||frame.kind==='break'&&false;
    const a1=hold?b.a:jump?station+360*Math.round((b.a-station)/360):nextAngle(b.a,station);
    return {travel:Math.abs(a1-b.a)/90*1250,extra:{a0:b.a,a1}};
  }
  apply(frame,prev,jump) {
    const raw=parseFloat(frame.vars.find(v=>v.name===this.varName)?.show),show=frame.vars.find(v=>v.name===this.varName)?.show??'?';
    const set=()=>{if(Number.isFinite(raw))this.levelTarget=clamp(Math.abs(raw)/this.gaugeMax,0,1);this.setLabel(this.gaugeTag,`${this.varName} = ${show}`,{bg:'#bfe3ff',size:100});this.sign.material.map=label(`${this.varName}=${show}`,{w:256,h:128,size:60});};
    if(frame.kind==='body'&&!jump)this.later_(this.step.travel+450/this.speed,set);else set();
    if(['exit','break','continue','limit'].includes(frame.kind))this.tag({exit:'done ✔',break:'break ✖',continue:'skip ⏭',limit:'step limit!'}[frame.kind],frame.kind==='exit'?'ok':frame.kind==='continue'?'skip':'bad');
    if(this.rig&&(jump||['init','check','exit','break'].includes(frame.kind)))this.rig.setText(frame.out);
  }
  tagAnchor(){return this.boatMesh.position.clone().add(new THREE.Vector3(0,1.6,0));}
  animate(now,dt,st,u,r) {
    const b=this.boat,kind=st.kind,sp=this.speed;
    b.a=lerp(st.a0??b.a,st.a1??b.a,inOut(u));const rad=b.a*DEG;
    const bob=Math.sin(now/420)*.025,settle=u>=1&&st.travel>0?Math.exp(-r/180)*Math.sin(r/30)*.03:0;
    this.boatMesh.position.set(Math.cos(rad)*R,.1+bob+settle,Math.sin(rad)*R);this.boatMesh.rotation.y=Math.PI/2-rad;this.boatMesh.rotation.z=Math.sin(now/510)*.03+(u<1?Math.sin(u*Math.PI*2)*.03:0);
    // Gate: opens only after a true check, and closes behind the boat as it leaves.
    let open=this.gate;
    if(kind==='check')open=st.frame.ok?inOut(win(r,0,650)):0;
    else if(kind==='body'||kind==='continue')open=1-inOut(clamp(u*2.2));
    else if(kind==='init'||kind==='exit'||kind==='limit')open=0;
    this.gate=open;this.gateLeaves.forEach(h=>{h.rotation.y=-h.userData.s*open*1.35;});
    const ok=kind==='check'&&r>600?!!st.frame.ok:null,tone=ok===false?0xff5a4a:0x44ff99,on=kind==='check'&&r>600||kind==='exit'&&true||open>.5;
    this.lamp.material.color.setHex(on?(ok===false||kind==='exit'?0xff5a4a:0x44ff99):0x445566);this.lamp.material.emissive.setHex(on?(ok===false||kind==='exit'?0xff5a4a:0x44ff99):0);this.lamp.material.emissiveIntensity=on?1.4:0;
    // Gauge float eases to the variable's level.
    this.level+=(this.levelTarget-this.level)*(1-Math.exp(-dt*4));this.float.position.y=.35+this.level*1.55+Math.sin(now/380)*.015;
    // Dock crane swings out over the boat while the body runs.
    const work=kind==='body'?Math.sin(win(r,0,640)*Math.PI):0;this.boom.rotation.y=work*.7;this.hook.scale.y=1+work*.3;this.hook.position.y=-.5-work*.15;
    this.water.material.color.setHex(0x2a8fd0);this.water.position.y=.07+Math.sin(now/700)*.006;
  }
}

// ---- nested loops: a gear train (inner loop turns the small gear) and an LED wall that lights one cell per inner lap ----
function gearGeometry(radius,teeth,depth) {
  const shape=new THREE.Shape(),step=Math.PI*2/teeth,inner=radius*.82;
  for(let i=0;i<teeth;i++){const a=i*step;[[a,inner],[a+.16*step,radius],[a+.52*step,radius],[a+.7*step,inner]].forEach(([ang,rad],j)=>{const x=Math.cos(ang)*rad,y=Math.sin(ang)*rad;(i===0&&j===0)?shape.moveTo(x,y):shape.lineTo(x,y);});}
  shape.closePath();const hole=new THREE.Path();hole.absarc(0,0,radius*.18,0,Math.PI*2,true);shape.holes.push(hole);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2,h=new THREE.Path();h.absarc(Math.cos(a)*radius*.5,Math.sin(a)*radius*.5,radius*.13,0,Math.PI*2,true);shape.holes.push(h);}
  const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:2});geo.translate(0,0,-depth/2);return geo;
}
class NestedWorld extends World {
  constructor(){super();this.cam={x:0,y:5,z:10.8,ty:1.7,tz:0};this.rows=3;this.cols=3;this.cells=[];this.angleS=0;this.angleT=0;this.lit=new Set();this.cur='';this.build();}
  build() {
    const brass=mat(0xd6a24a,.35,.9),steel=mat(0x9fb4c6,.3,.9),Nb=20,Ns=10,rb=1.3,rs=.65;this.Nb=Nb;this.Ns=Ns;
    const gears=new THREE.Group();gears.position.set(-4.3,2.3,-1);gears.userData.baseY=2.3;
    this.big=new THREE.Mesh(gearGeometry(rb,Nb,.3),brass);this.big.castShadow=true;gears.add(this.big);
    this.small=new THREE.Mesh(gearGeometry(rs,Ns,.3),steel);this.small.position.x=rb+rs+.02;this.small.castShadow=true;gears.add(this.small);
    [this.big,this.small].forEach(g=>{const axle=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.5,12),mat(0x40525f,.4,.8));axle.rotation.x=Math.PI/2;axle.position.copy(g.position);gears.add(axle);});
    const back=new THREE.Mesh(new THREE.BoxGeometry(4.1,2.9,.1),mat(0x1b2c3c,.6,.3));back.position.set(rb*.9+.2,0,-.25);back.receiveShadow=true;gears.add(back);
    this.outerTag=this.addLabel(gears,0,-1.75,.4,1.6,.4);this.innerTag=this.addLabel(gears,rb+rs+.02,-1.75,.4,1.6,.4);this.gears=gears;this.piece('gearBig',gears,this.rise(gears,2.5));
    const wall=new THREE.Group();wall.position.set(.9,0,-.4);this.wall=wall;this.piece('matrix',wall,this.rise(wall,2));
    this.rig=new OutputRig(this,-1.6,4.4,0);
    this.buildMatrix(3,3);
  }
  buildMatrix(rows,cols) {
    if(this.rows===rows&&this.cols===cols&&this.cells.length)return;
    this.rows=rows;this.cols=cols;this.cells.forEach(c=>this.wall.remove(c.mesh));this.wall.children.slice().forEach(ch=>{if(ch.userData.dyn)this.wall.remove(ch);});
    const pitch=.66,w=cols*pitch,h=rows*pitch;
    const frame=new THREE.Mesh(new THREE.BoxGeometry(w+.35,h+.35,.2),mat(0x1b2c3c,.5,.5));frame.position.set(0,1.9,-.15);frame.userData.dyn=true;frame.castShadow=true;this.wall.add(frame);
    const stand=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,1.9-h/2,12),mat(0x40525f,.4,.8));stand.position.set(0,(1.9-h/2)/2,-.15);stand.userData.dyn=true;this.wall.add(stand);
    this.cells=[];this.rowLamps=[];this.colLamps=[];
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(.54,.54,.3),new THREE.MeshStandardMaterial({color:0x2a3b4c,roughness:.4,metalness:.2,emissive:0x000000}));
      mesh.position.set((c-(cols-1)/2)*pitch,1.9+((rows-1)/2-r)*pitch,0);mesh.castShadow=true;this.wall.add(mesh);this.cells.push({mesh,r:r+1,c:c+1,pop:0});
    }
    for(let r=0;r<rows;r++){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),new THREE.MeshStandardMaterial({color:0x445566,emissive:0x000000}));lamp.position.set(-w/2-.4,1.9+((rows-1)/2-r)*pitch,0);lamp.userData.dyn=true;this.wall.add(lamp);this.rowLamps.push(lamp);}
    for(let c=0;c<cols;c++){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),new THREE.MeshStandardMaterial({color:0x445566,emissive:0x000000}));lamp.position.set((c-(cols-1)/2)*pitch,1.9-h/2-.4,0);lamp.userData.dyn=true;this.wall.add(lamp);this.colLamps.push(lamp);}
  }
  setCode(code) {
    const heads=[...code.matchAll(/\bfor\s*\(([^)]*)/g)],h=this.header={has:heads.length>0,body:false};
    ['gearBig','matrix','rig'].forEach(n=>this.want(n,false));
    if(!heads.length){this.replaying=false;return;}
    const bound=text=>{const m=/(<=?)\s*(\d+)/.exec(text||'');return m?+m[2]-(m[1]==='<'?1:0)+(m[1]==='<'?0:0)||3:3;};
    const outer=heads[0][1],inner=heads[1]?.[1];
    this.want('gearBig',/\b(?:int|auto)\s+\w+/.test(outer));
    const rows=Math.min(6,Math.max(1,bound(outer.split(';')[1])));let cols=3;if(inner){const c=inner.split(';')[1]||'';cols=/<=?\s*\d+/.test(c)?Math.min(6,Math.max(1,bound(c))):rows;}
    if(!this.replaying)this.buildMatrix(rows,heads[1]?cols:rows);
    this.want('matrix',!!heads[1]&&/<|>/.test(heads[1][1]));
    h.body=/\bfor\s*\([^)]*\)\s*\{[\s\S]*\bfor\s*\([^)]*\)\s*\{/.test(code);this.want('rig',h.body);
    this.setLabel(this.outerTag,`outer: ${/(?:int|auto)\s+(\w+)/.exec(outer)?.[1]||''}`,{bg:'#ffe0a8',fg:'#4a2a00',size:100});
    if(inner)this.setLabel(this.innerTag,`inner: ${/(?:int|auto)\s+(\w+)/.exec(inner)?.[1]||''}`,{bg:'#d6e9ff',fg:'#0b3354',size:100});
  }
  setFrames(frames) {
    super.setFrames(frames);const body=frames.filter(f=>f.depth>=2&&f.lap!==undefined);
    if(body.length){this.buildMatrix(Math.max(...body.map(f=>f.iters[0])),Math.max(...body.map(f=>f.iters[1])));}
  }
  printedText(){return '';}
  progress(frame) {
    // Cells already lit (inner body frames up to and including this one) and the inner-lap count for the small gear.
    const idx=this.frames.indexOf(frame),lit=new Set();let laps=0;
    this.frames.slice(0,idx+1).forEach(f=>{if(f.depth>=2&&f.lap!==undefined&&['body','continue','break'].includes(f.kind)){lit.add(`${f.iters[0]}:${f.iters[1]}`);laps++;}});
    return {lit,laps};
  }
  plan(frame){this.replaying=true;return {travel:0,reaction:frame.kind==='body'&&frame.depth>=2?650:frame.kind==='check'?420:frame.kind==='init'?600:frame.kind==='exit'?800:450};}
  apply(frame,prev,jump) {
    const {lit,laps}=this.progress(frame);this.lit=lit;this.angleT=laps/this.cols*Math.PI*2;
    this.cur=frame.depth>=2&&frame.lap!==undefined?`${frame.iters[0]}:${frame.iters[1]}`:'';this.curRow=frame.iters?.[0]||0;this.curCol=frame.iters?.[1]||0;this.checkDepth=frame.kind==='check'?frame.depth:0;
    if(jump)this.angleS=this.angleT;else if(this.cur)this.cells.forEach(c=>{if(`${c.r}:${c.c}`===this.cur)c.pop=performance.now();});
    if(this.rig&&(jump||frame.kind==='body'||frame.kind==='init'||frame.kind==='exit')){this.rig.setText(frame.out);if(!jump&&frame.kind==='body'&&this.printedText2(frame))this.rig.flash=performance.now();}
    if(frame.kind==='exit'&&frame.depth===0)this.tag('done ✔','ok');
  }
  printedText2(frame){return frame.kind==='body'&&frame.out.length>(this.step.prev?.out.length||0);}
  tagAnchor(){return new THREE.Vector3(.9,4.2,0);}
  animate(now,dt,st,u,r) {
    // Gears turn smoothly toward the lap count; the big gear is driven by the small one at the true tooth ratio.
    this.angleS+=(this.angleT-this.angleS)*(1-Math.exp(-dt*6));
    this.small.rotation.z=-this.angleS+Math.PI/this.Ns;this.big.rotation.z=this.angleS*this.Ns/this.Nb;
    this.cells.forEach(c=>{
      const on=this.lit.has(`${c.r}:${c.c}`),cur=`${c.r}:${c.c}`===this.cur,pop=c.pop?clamp((now-c.pop)/450):1;
      c.mesh.material.color.setHex(cur?0xffdc5a:on?0x35c97a:0x2a3b4c);c.mesh.material.emissive.setHex(cur?0x8a6a00:on?0x0b5c33:0);
      c.mesh.position.z=on||cur?.12+(cur?Math.sin(pop*Math.PI)*.25:0):0;c.mesh.scale.setScalar(on?1:.96);
    });
    this.rowLamps.forEach((l,i)=>{const on=i+1===this.curRow;l.material.color.setHex(on?0xffdc5a:0x445566);l.material.emissive.setHex(on?0xffaa00:0);l.material.emissiveIntensity=on?1.5:0;});
    this.colLamps.forEach((l,i)=>{const on=i+1===this.curCol;l.material.color.setHex(on?0x5ab8ff:0x445566);l.material.emissive.setHex(on?0x2266ff:0);l.material.emissiveIntensity=on?1.5:0;});
  }
}

// ---- break / continue: the for-loop track plus a bypass siding with a rail switch, an emergency barrier and an exit tunnel ----
class BreakWorld extends LoopMachine {
  constructor() {
    super();const ex=new THREE.Group(),steel=mat(0xcfd9e2,.28,.95);this.extras=ex;ex.visible=false;this.scene.add(ex);
    const siding=a=>new THREE.CatmullRomCurve3(Array.from({length:40},(_,i)=>{const t=-45+90*i/39,rr=R+a-1.3*Math.pow(Math.sin(Math.PI*(t+45)/90),2);return new THREE.Vector3(Math.cos(t*DEG)*rr,.09,Math.sin(t*DEG)*rr);}));
    [-.3,.3].forEach(o=>{const rail=new THREE.Mesh(new THREE.TubeGeometry(siding(o),60,.045,8,false),steel);rail.castShadow=true;ex.add(rail);});
    for(let i=0;i<14;i++){const t=-40+80*i/13,rr=R-1.3*Math.pow(Math.sin(Math.PI*(t+45)/90),2),s=new THREE.Mesh(new THREE.BoxGeometry(.8,.05,.14),mat(0x7a5535,.85));s.position.set(Math.cos(t*DEG)*rr,.04,Math.sin(t*DEG)*rr);s.rotation.y=-t*DEG;ex.add(s);}
    const sw=new THREE.Group();sw.position.set(Math.cos(55*DEG)*(R-1.4),0,Math.sin(55*DEG)*(R-1.4));const swBase=new THREE.Mesh(new THREE.BoxGeometry(.5,.35,.4),mat(0x3b5a78,.4,.6));swBase.position.y=.18;sw.add(swBase);
    this.swLever=new THREE.Group();this.swLever.position.y=.38;sw.add(this.swLever);const rod=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.6,10),mat(0xdde6ee,.25,.9));rod.position.y=.3;this.swLever.add(rod);
    this.swKnob=new THREE.Mesh(new THREE.SphereGeometry(.1,16,12),mat(0xffcf3a,.3,.2,{emissive:0x000000}));this.swKnob.position.y=.62;this.swLever.add(this.swKnob);
    this.swTag=this.addLabel(sw,0,1.4,0,1.2,.34);this.setLabel(this.swTag,'switch',{bg:'#ffe28a',fg:'#3a2a00',size:100});ex.add(sw);
    const barrier=new THREE.Group(),ang=-52*DEG;barrier.position.set(Math.cos(ang)*R,0,Math.sin(ang)*R);barrier.rotation.y=-ang;
    [-.9,.9].forEach(z=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.18,1.1,.18),mat(0xe9e9e9,.5));post.position.set(0,.55,z);post.castShadow=true;barrier.add(post);});
    this.bar=new THREE.Group();this.bar.position.set(0,1.0,-.9);barrier.add(this.bar);
    const stripes=new THREE.Mesh(new THREE.BoxGeometry(.1,.14,1.8),mat(0xd9453a,.45));stripes.position.z=.9;stripes.castShadow=true;this.bar.add(stripes);
    for(let i=0;i<5;i++){const w=new THREE.Mesh(new THREE.BoxGeometry(.105,.145,.18),mat(0xffffff,.5));w.position.z=.2+i*.36;this.bar.add(w);}
    ex.add(barrier);
    const tunnel=new THREE.Group(),exitAng=-46*DEG;tunnel.position.set(Math.cos(exitAng)*(R+3.9),0,Math.sin(exitAng)*(R+3.9));tunnel.rotation.y=-exitAng;
    const rock=mat(0x4d5a66,.9),arch=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.6,2.4),rock);arch.position.y=.8;arch.castShadow=true;tunnel.add(arch);
    const mouth=new THREE.Mesh(new THREE.BoxGeometry(.05,1.0,1.3),new THREE.MeshBasicMaterial({color:0x03080c}));mouth.position.set(-.62,.5,0);tunnel.add(mouth);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1,.3),new THREE.MeshBasicMaterial({map:label('exit',{bg:'#ffb08a',fg:'#2a0a00',size:100}),toneMapped:false}));sign.position.set(-.63,1.35,0);sign.rotation.y=-Math.PI/2;tunnel.add(sign);
    ex.add(tunnel);
  }
  extra(now,dt,st,r) {
    this.extras.visible=this.pieces.station.p>.4;
    const kind=st.kind,w=win(r,0,800);
    if(kind==='continue'){
      // Cart takes the inner siding past the workstation instead of stopping under the arm.
      if(st.base===undefined)st.base=st.a1;const e=inOut(w);st.a1=st.base-30*e;
      const rad=st.a1*DEG,rr=R-1.3*Math.pow(Math.sin(Math.PI*clamp((st.a1-st.base+30)/60+.25)*.0+Math.PI*clamp(.5-(st.a1-st.base)/60)),2);
      this.cartMesh.position.set(Math.cos(rad)*rr,.06,Math.sin(rad)*rr);
    }
    this.swLever.rotation.z=kind==='continue'?Math.sin(win(r,0,500)*Math.PI)*.8:0;this.swKnob.material.emissive.setHex(kind==='continue'&&r>0&&r<500?0xaa7700:0);
    const slam=kind==='break'||kind==='exit'&&this.step.a1!==undefined&&this.slammed;if(kind==='break')this.slammed=true;else if(kind==='check'||kind==='body')this.slammed=false;
    const drop=kind==='break'?outBack(win(r,150,450)):this.slammed?1:0;this.bar.rotation.x=(1-drop)*-1.35;
  }
}

export { World, OutputRig, REACT, RangeWorld, WhileWorld, NestedWorld, BreakWorld };
