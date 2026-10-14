import * as THREE from '../vendor/three/three.module.js';

// The for-loop machine. Typing builds its parts; replay steps drive a timed choreography (travel, then that station's reaction).
const R=3.2,DEG=Math.PI/180,G=11;
const STATION={init:180,check:90,body:0,update:-90};
const clamp=x=>Math.max(0,Math.min(1,x)),lerp=(a,b,t)=>a+(b-a)*t;
const inOut=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
const outCubic=x=>1-Math.pow(1-clamp(x),3);
const outBack=x=>{x=clamp(x);const c=1.70158;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);};
const win=(r,a,b)=>clamp((r-a)/(b-a));
const mat=(color,rough=.5,metal=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,...extra});
const textures=new Map();
function label(text,{w=512,h=256,fg='#0f3a52',bg='#f4f9fd',size=120}={}) {
  const key=`${text}|${fg}|${bg}|${w}|${size}`;if(textures.has(key))return textures.get(key);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');
  c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';
  c.font=`800 ${Math.min(size,Math.floor((w*1.5)/Math.max(2,String(text).length)))}px monospace`;c.fillText(String(text),w/2,h/2+4);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  if(textures.size>120)textures.clear();textures.set(key,texture);return texture;
}
function environment(renderer) {
  const scene=new THREE.Scene(),geo=new THREE.SphereGeometry(50,32,16),colors=[],p=geo.attributes.position,top=new THREE.Color(0x8fc4ff),mid=new THREE.Color(0xffffff),low=new THREE.Color(0x203040);
  for(let i=0;i<p.count;i++){const y=p.getY(i)/50;colors.push(...(y>0?mid.clone().lerp(top,y):mid.clone().lerp(low,-y*1.6)).toArray());}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  scene.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  [[-20,30,20],[25,22,-10]].forEach(([x,y,z])=>{const box=new THREE.Mesh(new THREE.PlaneGeometry(26,10),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));box.position.set(x,y,z);box.lookAt(0,0,0);box.material.color.multiplyScalar(5);scene.add(box);});
  const pmrem=new THREE.PMREMGenerator(renderer),texture=pmrem.fromScene(scene,.03).texture;pmrem.dispose();return texture;
}
const ring=(radius,offset)=>new THREE.CatmullRomCurve3(Array.from({length:120},(_,i)=>{const a=i/120*Math.PI*2;return new THREE.Vector3(Math.cos(a)*(radius+offset),.09,Math.sin(a)*(radius+offset));}),true);
function parseHeader(code) {
  const found=/\bfor\s*\(/.exec(code);if(!found)return {has:false};
  const rest=code.slice(found.index+found[0].length);let depth=0,end=-1;
  for(let i=0;i<rest.length;i++){if(rest[i]==='(')depth++;else if(rest[i]===')'){if(depth===0){end=i;break;}depth--;}}
  const header=end>=0?rest.slice(0,end):rest.split(/[{\n]/)[0],parts=header.split(';'),init=parts[0]||'';
  return {
    has:true,decl:/\b(?:int|auto|size_t|unsigned|long|double)\s+([A-Za-z_]\w*)/.exec(init),value:/=\s*[-\w'"]/.test(init),initValue:(/=\s*([^;]+)/.exec(init)?.[1]||'').trim(),
    cond:parts.length>1&&parts[1].trim()?parts[1].trim():'',update:parts.length>2&&parts[2].trim()?parts[2].trim():'',
    body:end>=0&&/^\s*\{/.test(rest.slice(end+1)),
  };
}
const nextAngle=(current,station)=>station+360*Math.floor((current-station)/360+1e-6);
const nearAngle=(current,station)=>station+360*Math.round((current-station)/360);
// Base durations (ms at speed 1) of what each step does after the cart arrives.
const REACTION={init:900,check:1500,body:900,print:2700,continue:800,update:1000,exit:1100,break:1000,limit:900};

class LoopMachine {
  constructor() {
    this.el=document.createElement('div');this.el.className='cpp-lp-canvas';
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.el.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.environment=environment(this.renderer);this.scene.environmentIntensity=.7;
    this.camera=new THREE.PerspectiveCamera(38,2,.1,100);
    const sun=new THREE.DirectionalLight(0xfff1dc,2.6);sun.position.set(-5,9,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:30});sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;this.scene.add(sun,new THREE.HemisphereLight(0xcfe6ff,0x1a2a38,.9));
    this.billboards=[];this.pieces={};this.later=[];this.speed=1;this.stepMs=1200;this.varName='';this.header={has:false};
    this.cart={a:180,wheel:0,fresh:true};this.step={t0:0,travel:0,a0:180,a1:180,kind:'init',printed:'',flags:{}};this.lampOn=false;this.lampTone=0x445566;
    this.buildFloor();this.buildTrack();this.buildPedestal();this.buildArch();this.buildLever();this.buildStation();this.buildMonitor();this.buildCart();this.buildSparks();
    this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(this.el);
    this.clock=performance.now();this.alive=true;this.frame=this.loop.bind(this);requestAnimationFrame(this.frame);
  }
  fit(){const w=this.el.clientWidth||600,h=this.el.clientHeight||300;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  piece(name,group,apply,{spring=true}={}){group.visible=false;this.scene.add(group);this.pieces[name]={group,p:0,v:0,target:0,apply,spring};return group;}
  addLabel(parent,x,y,z,w=1.5,h=.5){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:label(' '),transparent:true,toneMapped:false}));m.position.set(x,y,z);parent.add(m);this.billboards.push(m);return m;}
  setLabel(mesh,text,opts){if(mesh.userData.text===text)return;mesh.userData.text=text;mesh.material.map=label(text,opts);}
  rise(group,depth=1.2){return p=>{group.position.y=-depth*(1-p);group.scale.setScalar(Math.max(.01,(.55+.45*p)*(group.userData.baseScale||1)));group.visible=p>.01;};}
  buildFloor() {
    const floor=new THREE.Mesh(new THREE.CircleGeometry(10,64),mat(0x14283a,.85,.05));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;this.scene.add(floor);
    const grid=new THREE.GridHelper(20,20,0x2c5578,0x1d3a55);grid.position.y=.004;grid.material.transparent=true;grid.material.opacity=.45;this.scene.add(grid);
  }
  buildTrack() {
    const group=new THREE.Group(),rails=[-.3,.3].map(o=>{
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(ring(R,o),240,.05,8,true),mat(0xcfd9e2,.28,.95));mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
    });
    const ballast=new THREE.Mesh(new THREE.RingGeometry(R-.55,R+.55,96,1),mat(0x2b3947,.95,0,{transparent:true,opacity:0}));ballast.rotation.x=-Math.PI/2;ballast.position.y=.01;ballast.receiveShadow=true;group.add(ballast);
    const count=72,sleepers=new THREE.InstancedMesh(new THREE.BoxGeometry(.8,.05,.16),mat(0x7a5535,.85),count),m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1);
    for(let i=0;i<count;i++){const a=i/count*Math.PI*2;q.setFromEuler(new THREE.Euler(0,-a,0));m.compose(new THREE.Vector3(Math.cos(a)*R,.04,Math.sin(a)*R),q,s);sleepers.setMatrixAt(i,m);}
    sleepers.castShadow=sleepers.receiveShadow=true;group.add(sleepers);
    this.piece('track',group,p=>{group.visible=p>.001;ballast.material.opacity=Math.min(1,p*2.5);sleepers.count=Math.floor(count*p);rails.forEach(r=>r.geometry.setDrawRange(0,Math.floor(r.geometry.index.count/3*p)*3));},{spring:false});
  }
  buildPedestal() {
    const group=new THREE.Group(),base=new THREE.Mesh(new THREE.CylinderGeometry(.55,.7,.5,32),mat(0x3b5a78,.4,.6));base.position.y=.25;base.castShadow=base.receiveShadow=true;group.add(base);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.06,32),mat(0x9fd0ff,.25,.8));top.position.y=.53;group.add(top);
    this.crate=new THREE.Mesh(new THREE.BoxGeometry(.62,.62,.62),mat(0xffffff,.45,.1,{map:label('?')}));this.crate.position.y=.9;this.crate.castShadow=true;group.add(this.crate);
    this.crateTag=this.addLabel(group,0,1.55,0,1.3,.4);group.position.set(-(R+1.9),0,.2);
    this.piece('pedestal',group,this.rise(group));
  }
  buildArch() {
    const group=new THREE.Group(),steel=mat(0x8fa4b6,.35,.85);
    [-.85,.85].forEach(z=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.14,1.7,.14),steel);post.position.set(0,.85,z);post.castShadow=true;group.add(post);});
    const beam=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,1.95),steel);beam.position.y=1.75;beam.castShadow=true;group.add(beam);
    this.lamp=new THREE.Mesh(new THREE.SphereGeometry(.14,24,16),new THREE.MeshStandardMaterial({color:0x445566,emissive:0x000000,roughness:.2}));this.lamp.position.y=1.98;group.add(this.lamp);
    this.curtain=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.5),new THREE.MeshBasicMaterial({color:0x44ff99,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));this.curtain.rotation.y=Math.PI/2;this.curtain.position.y=.85;group.add(this.curtain);
    this.condTag=this.addLabel(group,0,2.45,0,1.5,.36);group.position.set(0,0,R);
    this.piece('arch',group,p=>{group.position.y=(1-p)*3.2;group.visible=p>.01;});
  }
  buildLever() {
    const group=new THREE.Group(),base=new THREE.Mesh(new THREE.BoxGeometry(1.1,.7,.7),mat(0x3b5a78,.4,.6));base.position.y=.35;base.castShadow=true;group.add(base);
    this.lever=new THREE.Group();this.lever.position.set(0,.75,0);group.add(this.lever);
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.9,12),mat(0xdde6ee,.25,.9));rod.position.y=.45;rod.castShadow=true;this.lever.add(rod);
    this.knob=new THREE.Mesh(new THREE.SphereGeometry(.12,20,14),mat(0xff5252,.3,.2,{emissive:0x000000}));this.knob.position.y=.95;this.lever.add(this.knob);
    this.updateTag=this.addLabel(group,0,2,0,1.3,.4);group.position.set(0,0,-(R+1.6));
    this.piece('lever',group,this.rise(group));
  }
  buildStation() {
    const group=new THREE.Group(),steel=mat(0xcfd9e2,.3,.8);
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.1,1.3),mat(0x2d7fb8,.4,.5));body.position.y=.55;body.castShadow=body.receiveShadow=true;group.add(body);
    const hood=new THREE.Mesh(new THREE.BoxGeometry(1.25,.12,1.35),steel);hood.position.y=1.15;group.add(hood);
    // Thermal printer on the front face: paper hides inside the housing and feeds out of the slot below it.
    const printer=new THREE.Mesh(new THREE.BoxGeometry(.7,.34,.34),mat(0x20303e,.35,.5));printer.position.set(0,.95,.78);printer.castShadow=true;group.add(printer);
    const slot=new THREE.Mesh(new THREE.PlaneGeometry(.56,.035),new THREE.MeshBasicMaterial({color:0x05080b}));slot.position.set(0,.785,.952);group.add(slot);
    this.led=new THREE.Mesh(new THREE.SphereGeometry(.028,12,8),new THREE.MeshStandardMaterial({color:0x224433,emissive:0x000000}));this.led.position.set(.28,1.07,.952);group.add(this.led);
    this.cutter=new THREE.Mesh(new THREE.BoxGeometry(.6,.02,.04),mat(0xe8eef3,.2,1,{emissive:0x000000}));this.cutter.position.set(0,.78,.96);group.add(this.cutter);
    this.paperCanvas=document.createElement('canvas');this.paperCanvas.width=320;this.paperCanvas.height=220;this.paperTexture=new THREE.CanvasTexture(this.paperCanvas);this.paperTexture.colorSpace=THREE.SRGBColorSpace;this.paperTexture.anisotropy=4;
    this.paper=new THREE.Mesh(new THREE.PlaneGeometry(.52,.34),new THREE.MeshStandardMaterial({map:this.paperTexture,roughness:.9,side:THREE.DoubleSide,emissive:0xffffff,emissiveMap:this.paperTexture,emissiveIntensity:.25}));
    this.paper.position.set(0,.95,.9);this.paper.visible=false;this.paper.castShadow=true;group.add(this.paper);this.paperHome=group;
    const tray=new THREE.Mesh(new THREE.BoxGeometry(.95,.07,.62),mat(0x9fb4c6,.35,.7));tray.position.set(0,.035,1.45);tray.receiveShadow=true;group.add(tray);
    this.arm=new THREE.Group();this.arm.position.set(-.45,1.35,0);group.add(this.arm);
    const seg=(len,color)=>{const g=new THREE.BoxGeometry(len,.16,.16);g.translate(-len/2,0,0);const m=new THREE.Mesh(g,mat(color,.3,.7));m.castShadow=true;return m;};
    this.arm.add(seg(1,0xffcf3a));this.elbow=new THREE.Group();this.elbow.position.x=-1;this.arm.add(this.elbow);this.elbow.add(seg(.75,0xffb02e));
    this.claw=new THREE.Mesh(new THREE.ConeGeometry(.1,.25,16),mat(0xdde6ee,.25,.9));this.claw.rotation.z=Math.PI;this.claw.position.set(-.75,-.12,0);this.elbow.add(this.claw);
    this.bodyTag=this.addLabel(group,0,2.2,0,1.5,.4);this.setLabel(this.bodyTag,'{ body }',{bg:'#ffdc80',fg:'#3a2a00',size:100});
    group.position.set(R+1.7,0,0);this.station=group;
    this.piece('station',group,this.rise(group,1.4));
  }
  buildMonitor() {
    const group=new THREE.Group(),shell=mat(0x1c2a38,.4,.6);
    const stand=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,.8,16),shell);stand.position.y=.4;stand.castShadow=true;group.add(stand);
    const frame=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.12,.14),shell);frame.position.y=1.25;frame.castShadow=true;group.add(frame);
    this.termCanvas=document.createElement('canvas');this.termCanvas.width=512;this.termCanvas.height=336;this.termTexture=new THREE.CanvasTexture(this.termCanvas);this.termTexture.colorSpace=THREE.SRGBColorSpace;this.termTexture.anisotropy=4;
    this.screen=new THREE.Mesh(new THREE.PlaneGeometry(1.56,1.0),new THREE.MeshBasicMaterial({map:this.termTexture,toneMapped:false}));this.screen.position.set(0,1.25,.075);group.add(this.screen);
    const slit=new THREE.Mesh(new THREE.BoxGeometry(.7,.03,.1),new THREE.MeshBasicMaterial({color:0x05080b}));slit.position.set(0,1.82,.04);group.add(slit);[stand,frame,this.screen,slit].forEach(m=>{m.visible=false;});
    this.term={text:'',blink:true,last:''};this.drawTerm();
    group.position.set(0,0,4.4);group.rotation.y=0;group.userData.baseScale=.85;this.monitor=group;
    this.piece('monitor',group,this.rise(group,1.6));
  }
  drawTerm() {
    const c=this.termCanvas.getContext('2d'),lines=this.term.text.split('\n'),shown=lines.slice(-8);
    c.fillStyle='#03121a';c.fillRect(0,0,512,336);c.fillStyle='#0f3b4d';c.fillRect(0,0,512,34);
    c.fillStyle='#8fd3f4';c.font='700 20px monospace';c.textBaseline='middle';c.textAlign='left';c.fillText('● terminal',14,18);
    c.font='700 30px monospace';c.fillStyle='#5eff9d';c.textBaseline='top';
    const rows=shown.length;shown.forEach((line,i)=>c.fillText(line.slice(0,26),16,48+i*34));
    if(this.term.blink){c.fillStyle='#5eff9d';c.fillRect(16+Math.min(26,shown.at(-1)?.length||0)*18,48+(rows-1)*34+4,16,26);}
    this.termTexture.needsUpdate=true;
  }
  drawPaper(text,count) {
    const c=this.paperCanvas.getContext('2d');
    c.fillStyle='#fbfbf6';c.fillRect(0,0,320,220);c.fillStyle='#d6d6cc';c.fillRect(0,0,320,8);
    c.fillStyle='#7c8a94';c.font='700 18px monospace';c.textAlign='center';c.textBaseline='top';c.fillText('— cout —',160,24);
    c.fillStyle='#16303f';c.font='800 56px monospace';c.textBaseline='middle';
    const shown=text.slice(0,count),size=Math.min(56,Math.floor(500/Math.max(4,text.length)));c.font=`800 ${size}px monospace`;c.fillText(shown,160,112);
    c.fillStyle='#b9b9ae';for(let x=0;x<320;x+=16){c.beginPath();c.moveTo(x,220);c.lineTo(x+8,208);c.lineTo(x+16,220);c.fill();}
    this.paperTexture.needsUpdate=true;
  }
  buildCart() {
    const cart=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(.95,.32,.55),mat(0xffb02e,.4,.35));body.position.y=.34;body.castShadow=true;cart.add(body);
    const cab=new THREE.Mesh(new THREE.BoxGeometry(.4,.28,.5),mat(0xe8851a,.4,.35));cab.position.set(-.22,.6,0);cab.castShadow=true;cart.add(cab);
    this.sign=new THREE.Mesh(new THREE.PlaneGeometry(.42,.26),new THREE.MeshBasicMaterial({map:label(' ',{w:256,h:160}),toneMapped:false}));this.sign.rotation.x=-Math.PI/2;this.sign.position.set(.2,.51,0);cart.add(this.sign);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),new THREE.MeshBasicMaterial({color:0xfff2b0}));lamp.position.set(.48,.36,0);cart.add(lamp);
    this.wheels=[];[[-.3,.26],[.3,.26],[-.3,-.26],[.3,-.26]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.08,20),mat(0x1b1b1f,.7));w.rotation.x=Math.PI/2;w.position.set(x,.14,z);w.castShadow=true;cart.add(w);this.wheels.push(w);});
    cart.scale.setScalar(1.35);cart.visible=false;this.scene.add(cart);this.cartMesh=cart;
    this.cartTag=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.4),new THREE.MeshBasicMaterial({map:label(' '),transparent:true,opacity:0,toneMapped:false}));this.scene.add(this.cartTag);
    // The ticket is a separate flying object once it is cut from the printer.
    this.ticket=new THREE.Mesh(new THREE.PlaneGeometry(.52,.34),this.paper.material);this.ticket.visible=false;this.ticket.castShadow=true;this.scene.add(this.ticket);
  }
  buildSparks() {
    this.sparks=[];const max=90,geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(max*3).fill(-50),3));
    this.sparkGeo=geo;this.sparkMax=max;this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0xffc861,size:.08,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending})));
  }
  emit(origin,n) {for(let i=0;i<n&&this.sparks.length<this.sparkMax;i++)this.sparks.push({p:origin.clone(),v:new THREE.Vector3((Math.random()-.5)*2.4,1.2+Math.random()*1.6,(Math.random()-.5)*2.4),life:.5+Math.random()*.3});}
  // Typing: show each part as soon as its piece of the for header exists.
  setCode(code) {
    const h=parseHeader(code);this.header=h;
    const t=(name,on)=>{this.pieces[name].target=on?1:0;};
    t('track',h.has);t('pedestal',h.has&&!!h.decl);t('arch',h.has&&!!h.cond);t('lever',h.has&&!!h.update);t('station',h.has&&h.body);t('monitor',h.has&&h.body);
    if(h.decl){this.varName=h.decl[1];this.setLabel(this.crateTag,`int ${h.decl[1]}`,{bg:'#bfe3ff',size:110});}
    if(h.cond)this.setLabel(this.condTag,h.cond,{bg:'#fff3c7',fg:'#4a3300',size:110});
    if(h.update)this.setLabel(this.updateTag,h.update,{bg:'#d7ffe7',fg:'#0a4a2a',size:120});
    const key=JSON.stringify([h.has,!!h.decl,h.value]);
    if(key!==this.last){this.last=key;if(h.value&&h.decl)this.spawnAt=performance.now();}
    if(!this.replaying)this.crate.material.map=label(h.value?h.initValue:'?');
    this.cartMesh.visible=this.replaying||(h.has&&h.body&&h.value);
    if(!h.has||!h.body){this.replaying=false;this.cart.fresh=true;}
  }
  // Replay: schedule this step as travel to its station, then that station's reaction. Sets stepMs for the player.
  show(frame,prev,{jump=false}={}) {
    if(!frame||!this.header.has||!this.header.body)return;
    const now=performance.now(),kind=frame.kind,cart=this.cart,sp=this.speed;
    const station=kind==='continue'||kind==='break'?'body':STATION[kind]!==undefined?kind:'check';
    const hold=kind==='exit'||kind==='limit';
    this.replaying=true;this.cartMesh.visible=true;this.later=[];
    if(cart.fresh){cart.a=STATION.init;cart.fresh=false;}
    const a0=cart.a,a1=hold?a0:jump?nearAngle(a0,STATION[station]):nextAngle(a0,STATION[station]);
    const travel=jump?0:Math.abs(a1-a0)/90*1150/sp,printed=(kind==='body'?frame.out.slice(prev?.out.length||0):'').replace(/\n/g,'');
    const reaction=jump?0:kind==='body'?(printed?REACTION.print:REACTION.body):REACTION[kind]||800;
    this.step={t0:now,a0,a1,travel,kind,printed,out:frame.out,reaction,flags:{},jump};
    this.stepMs=jump?120:travel+reaction/sp+180/sp;
    const value=frame.vars.find(v=>v.name===this.varName)?.show??'?',apply=()=>{
      this.crate.material.map=label(value);this.sign.material.map=label(`${this.varName||''}=${value}`,{w:256,h:160,size:70});
    };
    if(kind==='update'&&!jump)this.later.push({at:now+travel+350/sp,fn:apply});else apply();
    if(jump||kind==='init'||kind==='check'||kind==='body'||kind==='update'){this.term.text=kind==='body'&&printed&&!jump?prev?.out||'':frame.out;this.drawTerm();}
    if(kind==='exit'||kind==='break'||kind==='limit'||kind==='continue'){
      const text={exit:'done ✔',break:'break ✖',limit:'step limit!',continue:'skip ⏭'}[kind],bad=kind!=='exit'&&kind!=='continue';
      this.cartTag.material.map=label(text,{bg:bad?'#ffb08a':kind==='continue'?'#ffe28a':'#a8ffcc',fg:'#122',size:110});
    }
    if(kind==='init')this.spawnAt=now+travel;
    if(!this.step.jump&&kind==='check'){this.lampOn=false;}
  }
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
    const st=this.step,sp=this.speed,t=now-st.t0,u=st.travel>0?clamp(t/st.travel):1,r=Math.max(0,(t-st.travel)*sp);
    // Cart: eased drive along the track with a little pitch, wheel roll and arrival settle.
    const before=this.cart.a;this.cart.a=lerp(st.a0,st.a1,inOut(u));this.cart.wheel+=Math.abs(this.cart.a-before)*DEG*R;
    const leave=st.kind==='break'?outCubic(r/900):0,rad=this.cart.a*DEG-leave*.8;
    const settle=u>=1&&st.travel>0?Math.exp(-r/160)*Math.sin(r/26)*.018:0,hop=st.kind==='exit'?Math.sin(win(r,0,700)*Math.PI)*.4*Math.exp(-win(r,0,700)*.8):0;
    this.cartMesh.position.set(Math.cos(rad)*(R+leave*4.2),.06+settle+hop,Math.sin(rad)*(R+leave*4.2));
    this.cartMesh.rotation.y=Math.PI/2-rad;this.cartMesh.rotation.z=u<1?Math.sin(u*Math.PI*2)*.04:0;
    this.wheels.forEach(w=>{w.rotation.y=-this.cart.wheel/.12*.35;});
    // Scanner arch: a light curtain sweeps over the cart, then the lamp reports the result.
    if(st.kind==='check'){
      const sweep=win(r,0,900),tone=st.ok===undefined?0x44ff99:0x44ff99;
      this.curtain.position.x=lerp(-.75,.75,inOut(sweep));this.curtain.material.opacity=r>0&&r<900?Math.sin(sweep*Math.PI)*.6:0;
      if(r>650&&!st.flags.lamp){st.flags.lamp=true;}
    } else this.curtain.material.opacity=0;
    this.updateLamp(st,r);
    // Update lever: pull, hold, release. The crate value changes mid-pull (see this.later).
    const pull=st.kind==='update'?outCubic(win(r,0,350))-inOut(win(r,520,900)):0;this.lever.rotation.x=pull*.95;
    this.knob.material.emissive.setHex(st.kind==='update'&&r>0&&r<900?0xaa1111:0);
    // Body: arm lowers over the cart and works, printer feeds a ticket, cutter snips, ticket flies to the terminal.
    this.animateBody(st,r,now,dt);
    // Crate pops when created and pulses when the lever changes it.
    const spawn=this.spawnAt?(now-this.spawnAt)/700:2,pulse=st.kind==='update'?win(r,350,850):2;
    this.crate.scale.setScalar(spawn>=0&&spawn<=1?outBack(spawn):pulse>=0&&pulse<=1?1+Math.sin(pulse*Math.PI)*.3:1);this.crate.rotation.y+=dt*.5;
    this.animateTag(now,st,r);
    this.extra?.(now,dt,st,r);
    // Sparks.
    const pos=this.sparkGeo.attributes.position;
    this.sparks=this.sparks.filter(s=>{s.life-=dt;s.v.y-=G*dt*.6;s.p.addScaledVector(s.v,dt);return s.life>0&&s.p.y>0;});
    for(let i=0;i<this.sparkMax;i++){const s=this.sparks[i];if(s)pos.setXYZ(i,s.p.x,s.p.y,s.p.z);else pos.setXYZ(i,0,-50,0);}pos.needsUpdate=true;
    if(this.term.blink!==(Math.floor(now/500)%2===0)){this.term.blink=!this.term.blink;this.drawTerm();}
    this.billboards.forEach(b=>b.quaternion.copy(this.camera.quaternion));
    const wide=Math.max(1,Math.pow(2.1/this.camera.aspect,.7));this.camera.position.set(Math.sin(now/6200)*1.1,.3+(5.4-.3)*wide,.3+(8.6-.3)*wide);this.camera.lookAt(0,.3,.3);
    this.renderer.render(this.scene,this.camera);
  }
  updateLamp(st,r) {
    if(st.kind==='check'&&r>650&&st.ok!==undefined){this.lampOn=true;}
    const tone=st.ok===false?0xff5a4a:0x44ff99,on=st.kind==='exit'||st.kind==='check'&&r>650||this.lampOn&&st.kind!=='check';
    this.lamp.material.color.setHex(on?tone:0x445566);this.lamp.material.emissive.setHex(on?tone:0);this.lamp.material.emissiveIntensity=on?1.4:0;
  }
  animateTag(now,st,r) {
    const show=['exit','break','limit','continue'].includes(st.kind),w=show?win(r,0,260):0,fade=show?1-win(r,st.reaction*.7,st.reaction):0;
    this.cartTag.visible=show;this.cartTag.material.opacity=Math.min(1,w*4)*fade;this.cartTag.scale.setScalar(.5+.5*outBack(w));
    this.cartTag.position.copy(this.cartMesh.position).add(new THREE.Vector3(0,1.5+w*.25,0));this.cartTag.quaternion.copy(this.camera.quaternion);
  }
  animateBody(st,r,now,dt) {
    const working=st.kind==='body'||st.kind==='continue'&&false,printed=st.printed,body=st.kind==='body';
    const down=body?inOut(win(r,0,260)):0,up=body?inOut(win(r,560,800)):0,work=body&&r>260&&r<560?Math.sin(r*.06)*.05:0;
    this.arm.rotation.z=-.55+(down-up)*1.1+work;this.elbow.rotation.z=.25-(down-up)*.6;
    if(body&&r>280&&r<540){this.claw.getWorldPosition(this.tmp||(this.tmp=new THREE.Vector3()));this.emit(this.tmp,2);}
    // Printer: paper slides out of the slot while the text types itself.
    const feed=body&&printed?inOut(win(r,600,1300)):0,typed=body&&printed?Math.floor(printed.length*win(r,640,1300)):0,home=this.paperHome;
    const detached=body&&printed&&r>=1400;
    if(!st.flags.drawn||st.flags.typed!==typed){st.flags.drawn=true;st.flags.typed=typed;if(body&&printed&&r<1450)this.drawPaper(printed,typed);}
    this.paper.visible=body&&!!printed&&r>=600&&r<1400;this.paper.position.set(0,.95-feed*.34,.9);this.paper.rotation.x=feed*.1;
    this.led.material.emissive.setHex(body&&printed&&r>600&&r<1400&&Math.floor(now/90)%2===0?0x33ff88:0);
    const cut=body&&printed?win(r,1300,1400):0;this.cutter.scale.set(1,1+Math.sin(cut*Math.PI)*3,1);this.cutter.material.emissive.setHex(cut>0&&cut<1?0xffffff:0);this.cutter.material.emissiveIntensity=1;
    // Ticket flight: fall into the tray, then glide into the monitor.
    const fall=win(r,1400,1700),glide=win(r,1760,2350),flying=body&&printed&&r>=1400&&r<2350;
    this.ticket.visible=flying;
    if(flying){
      const start=home.localToWorld(new THREE.Vector3(0,.61,.9)),land=home.localToWorld(new THREE.Vector3(0,.12,1.45)),slot=this.monitor.localToWorld(new THREE.Vector3(0,1.85,.06));
      if(glide<=0){
        const f=fall*fall,bounce=fall>=1?Math.sin(win(r,1700,1850)*Math.PI)*.05:0;
        this.ticket.position.set(lerp(start.x,land.x,fall),lerp(start.y,land.y,f)+bounce,lerp(start.z,land.z,outCubic(fall)));this.ticket.rotation.set(-lerp(0,Math.PI/2.1,outCubic(fall)),0,Math.sin(fall*Math.PI)*.25);this.ticket.scale.setScalar(1);
      } else {
        const e=inOut(glide),mid=land.clone().lerp(slot,.5);mid.y+=1.3;
        const a=land.clone().lerp(mid,e),b=mid.clone().lerp(slot,e);this.ticket.position.copy(a.lerp(b,e));
        this.ticket.rotation.set(-lerp(Math.PI/2.1,0,e),lerp(0,this.monitor.rotation.y,e),0);this.ticket.scale.setScalar(1-.8*Math.max(0,(glide-.7)/.3));
      }
    }
    if(body&&printed&&r>=2350&&!st.flags.terminal){st.flags.terminal=true;this.term.text=st.out;this.drawTerm();this.flash=now;}
    const f=this.flash?clamp(1-(now-this.flash)/450):0;this.screen.material.color.setScalar(1+f*.7);
  }
  dispose(){this.alive=false;this.resize.disconnect();this.renderer.dispose();this.el.remove();}
}
export function createLoopMachine() {
  try{const machine=new LoopMachine();machine.fit();return machine;}catch(error){console.warn('Loop machine unavailable:',error);return null;}
}
export { LoopMachine, label, environment, mat, clamp, lerp, inOut, outCubic, outBack, win, nextAngle, STATION, R, DEG };
