import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';

const loader=new GLTFLoader(),rigs={};
const assetRoot=new URL('../assets/3d/',import.meta.url);
export const rigsReady=Promise.all([['box','variable-box.glb','Box_Root'],['door','branch-door.glb','Door_Root'],['guard','branch-guard.glb','Guard_Root']].map(async([key,file,root])=>{
  const gltf=await loader.loadAsync(new URL(file,assetRoot).href);rigs[key]=gltf.scene.getObjectByName(root);if(!rigs[key])throw new Error(`Missing ${root} in ${file}`);
}));
let ready=false;rigsReady.then(()=>{ready=true;}).catch(error=>console.error('Learning rigs:',error));
const managers=new Map(),boxCommands=new WeakMap(),guardCommands=new WeakMap();
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const ease=(a,b,t)=>a.clone().lerp(b,smooth(t));
const textCache=new Map();
function texture(text){
  text=String(text);if(textCache.has(text))return textCache.get(text);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const c=canvas.getContext('2d');c.fillStyle='#f7fbff';c.fillRect(0,0,512,256);c.fillStyle='#103a51';c.font=`700 ${Math.min(150,Math.floor(780/Math.max(1,text.length)))}px monospace`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,135,480);
  const result=new THREE.CanvasTexture(canvas);result.colorSpace=THREE.SRGBColorSpace;result.anisotropy=4;textCache.set(text,result);return result;
}
function numberMesh(text){
  const group=new THREE.Group(),w=Math.min(1.45,Math.max(.75,String(text).length*.13));
  const edge=new THREE.MeshStandardMaterial({color:0xc4d5df,roughness:.38,metalness:.1});
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,.50,.075),edge);body.castShadow=true;body.receiveShadow=true;group.add(body);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(w-.025,.475),new THREE.MeshStandardMaterial({map:texture(text),roughness:.6}));face.position.z=.039;group.add(face);group.userData.text=String(text);return group;
}
function model(key){const root=rigs[key].clone(true);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return root;}
function readable(chip){const copy=chip.cloneNode(true);copy.querySelectorAll('small').forEach(el=>el.remove());return (copy.textContent||'').trim();}
function visible(el){const r=el.getBoundingClientRect();return el.isConnected&&r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';}
function owner(box){return box?.matches?.('.cpp-box-cube')?box:box?.querySelector?.('.cpp-box-cube');}
function getManager(el){const stage=el?.closest?.('.cpp-visual-stage');if(!stage||!ready)return null;let manager=managers.get(stage);if(!manager){try{manager=new PhysicalStage(stage);managers.set(stage,manager);}catch(error){stage.dataset.webglError=error.message;console.error(error);return null;}}return manager;}
export function hover3D(chip,box){const manager=getManager(owner(box));if(!manager||!chip)return false;manager.ensureNumber(chip);return true;}
export function openBox3D(box,openAt,closeAt){const cube=owner(box);if(!cube||!getManager(cube))return false;boxCommands.set(cube,{start:performance.now()+openAt,close:performance.now()+closeAt});return true;}
export function deposit3D(chip,box,delay=0,duration=1000){const cube=owner(box),manager=getManager(cube);if(!cube||!chip||!manager)return false;manager.transfer(chip,cube,'drop',delay,Math.max(1000,duration));return true;}
export function withdraw3D(chip,box,delay=450,duration=950){const cube=owner(box),manager=getManager(cube);if(!cube||!chip||!manager)return false;manager.transfer(chip,cube,'lift',delay,Math.max(950,duration));return true;}
export function touchDoor3D(guard,door,{start,open,leave,end}){if(!getManager(guard))return false;guardCommands.set(guard,{door,start:performance.now()+start,open:performance.now()+open,leave:performance.now()+leave,end:performance.now()+end});return true;}

class PhysicalStage {
  constructor(stage){
    this.stage=stage;this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,3000);this.camera.position.z=1200;
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.domElement.className='cpp-three-canvas';stage.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xdcefff,0x31414d,2));
    this.light=new THREE.DirectionalLight(0xfff5e8,3.1);this.light.position.set(-220,420,650);this.light.castShadow=true;this.light.shadow.mapSize.set(2048,2048);this.light.shadow.bias=-.0002;this.light.shadow.normalBias=.5;this.scene.add(this.light);
    const fill=new THREE.DirectionalLight(0xbadfff,1.2);fill.position.set(300,100,400);this.scene.add(fill);
    this.boxes=new Map();this.numbers=new Map();this.actors=new Map();this.rect=stage.getBoundingClientRect();
    stage.classList.add('has-three');stage._physical=this;
  }
  screen(el,z=140){const r=el.getBoundingClientRect();return v(r.x+r.width/2-this.rect.x-this.rect.width/2,this.rect.height/2-(r.y+r.height/2-this.rect.y),z);}
  numberPosition(chip){
    if(chip.matches('.cpp-guard-value')){
      const actor=this.actors.get(chip.closest('.cpp-branch-guard'));
      const hand=actor?.root.getObjectByName('Guard_Hand_L');
      if(hand){const point=hand.getWorldPosition(v());point.y+=actor.root.scale.x*.15;point.z+=actor.root.scale.x*.12;return point;}
    }
    return this.screen(chip);
  }
  ensureBox(cube){
    let box=this.boxes.get(cube);if(box)return box;
    const root=model('box');this.scene.add(root);
    const host=cube.parentElement;const readout=document.createElement('span');readout.className='cpp-three-readout';readout.setAttribute('aria-live','polite');host.appendChild(readout);
    cube.classList.add('cpp-three-box');
    box={cube,root,host,lid:root.getObjectByName('Lid_Hinge'),readout,content:null,stored:null,scale:45,born:performance.now(),forceOpenUntil:0,lidWindows:[],landedAt:0};this.boxes.set(cube,box);this.placeBox(box);return box;
  }
  placeBox(box){
    const r=box.cube.getBoundingClientRect();box.scale=Math.max(10,r.width/2.35);
    box.root.scale.setScalar(box.scale*(.65+.35*smooth((performance.now()-box.born)/450)));box.root.rotation.set(.43,-.36,0);
    box.root.position.set(r.x+r.width/2-this.rect.x-this.rect.width/2,this.rect.height/2-(r.y+r.height*.90-this.rect.y),0);box.root.updateMatrixWorld(true);
  }
  local(box,x,y,z=0){return box.root.localToWorld(v(x,y,z));}
  ensureNumber(chip){let item=this.numbers.get(chip);const text=readable(chip);if(!text)return null;
    if(item&&item.text!==text&&!item.job){this.scene.remove(item.mesh);this.numbers.delete(chip);item=null;}
    if(!item){const mesh=numberMesh(text);this.scene.add(mesh);item={mesh,text,chip,job:null};this.numbers.set(chip,item);chip.classList.add('cpp-three-number');}return item;
  }
  transfer(chip,cube,kind,delay,duration){const box=this.ensureBox(cube),item=this.ensureNumber(chip);if(!item)return;
    // One actual mesh crosses the rim and remains in the cavity after landing.
    item.job={kind,box,start:performance.now()+delay,duration,origin:this.screen(chip),scale:box.scale*.84};item.mesh.scale.setScalar(box.scale*.84);item.mesh.quaternion.identity();
    box.lidWindows.push({start:Math.max(performance.now(),item.job.start-480),close:item.job.start+duration+200});
  }
  store(box,item){
    if(box.content&&box.content!==item.mesh)box.root.remove(box.content);
    box.root.attach(item.mesh);item.mesh.position.set(0,.34,0);item.mesh.quaternion.identity();item.mesh.scale.setScalar(.84);item.mesh.visible=true;
    box.content=item.mesh;box.stored=item.text;box.readout.textContent=`stored: ${item.text}`;box.landedAt=performance.now();item.stored=true;
  }
  updateNumber(item,now){
    const {chip,mesh,job}=item;
    if(!visible(chip)){mesh.visible=false;return;}
    if(job){
      const {box,kind,start,duration}=job;this.placeBox(box);const p=clamp((now-start)/duration);
      if(now<start){mesh.visible=kind==='drop'&&Number(getComputedStyle(chip).opacity)>.05;mesh.position.copy(this.screen(chip));mesh.scale.setScalar(job.scale);return;}
      if(!job.captured){job.origin=this.screen(chip);job.captured=true;}
      const hover=this.local(box,0,2.1,0),inside=this.local(box,0,.34,0);
      mesh.scale.setScalar(job.scale);mesh.quaternion.copy(box.root.quaternion);mesh.visible=now>=start;
      mesh.traverse(o=>{if(o.isMesh){o.material.opacity=1;o.material.transparent=false;}});
      if(kind==='drop'){
        if(p<.45){const high=job.origin.clone();high.y=Math.max(high.y,hover.y+20);const t=p/.45;mesh.position.copy(t<.4?ease(job.origin,high,t/.4):ease(high,hover,(t-.4)/.6));}
        else {const t=(p-.45)/.55;mesh.position.copy(hover.clone().lerp(inside,t*t));}
        if(p===1){this.store(box,item);item.job=null;}
      }else{
        const destination=this.numberPosition(chip);mesh.position.copy(p<.5?ease(inside,hover,p/.5):ease(hover,destination,(p-.5)/.5));
        if(p===1){item.job=null;mesh.quaternion.identity();}
      }
      return;
    }
    if(item.stored)return;
    if(!chip.isConnected){mesh.visible=false;return;}
    const style=getComputedStyle(chip),opacity=Number(style.opacity);mesh.visible=opacity>.01;
    mesh.position.copy(this.numberPosition(chip));mesh.quaternion.identity();
    const rect=chip.getBoundingClientRect();mesh.scale.setScalar(Math.min(65,Math.max(20,rect.height*1.4)));
    mesh.traverse(o=>{if(o.isMesh){o.material.transparent=opacity<.999;o.material.opacity=opacity;}});
  }
  updateBox(box,now){
    this.placeBox(box);const command=boxCommands.get(box.cube);
    let amount=0;
    if(command){const open=smooth((now-command.start)/480),close=1-smooth((now-command.close)/450);amount=open*close;}
    else {const lid=box.cube.querySelector('.lid-face');if(lid){const m=new DOMMatrixReadOnly(getComputedStyle(lid).transform);const angle=Math.atan2(m.m23,m.m22)*180/Math.PI;amount=clamp(((angle<0?angle+360:angle)-90)/106);}}
    box.lidWindows=box.lidWindows.filter(window=>now<window.close+450);
    for(const window of box.lidWindows)amount=Math.max(amount,smooth((now-window.start)/480)*(1-smooth((now-window.close)/450)));
    box.lid.rotation.x=-1.95*amount;
    const values=Array.from(box.cube.querySelectorAll('.cpp-box-val')).filter(el=>Number(getComputedStyle(el).opacity)>.8);
    const text=values.at(-1)?.textContent.trim();
    const dropping=Array.from(this.numbers.values()).some(item=>item.job?.kind==='drop'&&item.job.box===box);
    if(text&&!dropping&&box.stored!==text&&now-box.landedAt>700){
      if(box.content)box.root.remove(box.content);const content=numberMesh(text);content.position.set(0,.34,0);content.scale.setScalar(.84);box.root.add(content);box.content=content;box.stored=text;box.readout.textContent=`stored: ${text}`;
    }
    if(!text&&!dropping&&!box.stored)box.readout.textContent='empty';
  }
  ensureActor(el,key){let actor=this.actors.get(el);if(!actor){const root=model(key);this.scene.add(root);actor={root,key,last:null,phase:0};this.actors.set(el,actor);el.classList.add(`cpp-three-${key}`);}return actor;}
  updateDoor(el,actor){
    const r=el.getBoundingClientRect(),scale=Math.min(r.height/2.55,r.width/1.38);actor.root.scale.setScalar(scale);actor.root.position.set(r.x+r.width/2-this.rect.x-this.rect.width/2,this.rect.height/2-(r.bottom-this.rect.y),0);actor.root.rotation.y=-.1;
    const face=el.querySelector('.cpp-branch-door'),m=face?new DOMMatrixReadOnly(getComputedStyle(face).transform):null;
    actor.root.getObjectByName('Door_Hinge').rotation.y=m?-Math.acos(Math.max(-1,Math.min(1,m.m11))):0;actor.scale=scale;actor.root.updateMatrixWorld(true);
  }
  updateGuard(el,actor,now){
    const contact=guardCommands.get(el);
    const r=el.getBoundingClientRect(),doorRect=el.closest('.cpp-branch-route')?.querySelector('.cpp-branch-doorway')?.getBoundingClientRect(),fit=doorRect?Math.min(1,doorRect.width/(doorRect.height/2.55*1.38)):1,scale=r.height/1.93*fit;actor.root.scale.setScalar(scale);actor.root.position.set(r.x+r.width/2-this.rect.x-this.rect.width/2,this.rect.height/2-(r.bottom-this.rect.y)-scale*.175,30);
    actor.root.rotation.y=contact&&now>contact.leave?1.1+(Math.PI-1.1)*smooth((now-contact.leave)/550):1.1;
    const moving=(actor.last?actor.root.position.distanceTo(actor.last)>.05:false)||!!(contact&&now>contact.leave&&now<contact.leave+550);actor.phase+=moving?.19:0;actor.last=actor.root.position.clone();
    const joint=name=>{let found;actor.root.traverse(o=>{if(o.name===name&&!o.isBone)found=o;});return found;};
    ['Leg_L','Leg_R','Arm_L','Arm_R'].forEach((name,i)=>{const j=joint(name);if(j)j.rotation.set(moving?Math.sin(actor.phase+((i<2?i%2:!(i%2))?Math.PI:0))*(i<2?.42:.28):0,0,0);});
    ['Elbow_L','Elbow_R'].forEach(name=>{const j=joint(name);if(j)j.rotation.set(0,0,0);});
    if(contact&&now>contact.leave)actor.root.position.z=30-110*smooth((now-contact.leave)/550);
    if(contact&&now>=contact.start&&now<=contact.end){
      const door=this.actors.get(contact.door);if(door){
        const knob=door.root.getObjectByName('Door_Knob'),hinge=door.root.getObjectByName('Door_Hinge');
        const opened=smooth((now-contact.open)/650);hinge.rotation.y=-opened*1.832596;door.root.updateMatrixWorld(true);
        const target=knob.getWorldPosition(v());
        const reach=smooth((now-contact.start)/600)*(1-smooth((now-contact.leave)/450));
        if(reach>0){
          actor.root.rotation.y*=1-reach;
          const shoulder=joint('Arm_R'),elbow=joint('Elbow_R');
          actor.root.position.x=THREE.MathUtils.lerp(actor.root.position.x,target.x-scale*.38,reach);
          actor.root.position.y=THREE.MathUtils.lerp(actor.root.position.y,target.y-scale*1.33,reach);
          actor.root.position.z=THREE.MathUtils.lerp(actor.root.position.z,target.z+scale*.35,reach);
          actor.root.updateMatrixWorld(true);
          if(shoulder&&elbow){
            const at=shoulder.getWorldPosition(v()),local=shoulder.parent.worldToLocal(target.clone()).sub(shoulder.position),distance=Math.min(.499,local.length()),dir=local.normalize();
            const perpendicular=v(0,0,1).addScaledVector(dir,-dir.z).normalize();const angle=Math.acos(Math.max(-1,Math.min(1,(.26*.26+distance*distance-.24*.24)/(2*.26*distance))));
            const upper=dir.clone().multiplyScalar(Math.cos(angle)).addScaledVector(perpendicular,Math.sin(angle));shoulder.quaternion.setFromUnitVectors(v(0,-1,0),upper);actor.root.updateMatrixWorld(true);
            const lower=shoulder.worldToLocal(target.clone()).sub(elbow.position).normalize();elbow.quaternion.setFromUnitVectors(v(0,-1,0),lower);
          }
        }
      }
    }
  }
  bridgeLegacy(){
    this.stage.querySelectorAll('.cpp-ar-chip.r.is-used,.cpp-as-chip.c-r,.cpp-as-chip.s-n').forEach(chip=>{
      if(!visible(chip)||this.numbers.has(chip))return;
      const lane=chip.closest('.cpp-ar-lane,.cpp-as-lane');
      const cube=lane?.querySelector(chip.matches('.cpp-ar-chip')?'.cpp-ar-box.s .cpp-box-cube':'.cpp-box-cube');
      if(!cube)return;
      const elapsed=Math.max(0,...chip.getAnimations().map(a=>Number(a.currentTime)||0));
      const delay=chip.matches('.cpp-ar-chip')?3750:chip.matches('.c-r')?4900:2300;
      this.transfer(chip,cube,'drop',Math.max(0,delay-elapsed),1100);
    });
    this.stage.querySelectorAll('.cpp-box-slot.s-done').forEach(slot=>{
      const cube=slot.querySelector('.cpp-box-cube'),chip=slot.querySelector('.cpp-item span');
      if(!cube||!chip||!visible(cube))return;
      const text=readable(chip);if(!text||slot._physicalValue===text)return;slot._physicalValue=text;
      const commit=this.stage._lastPhysicalCommit;
      if(commit&&commit.value===text&&slot.querySelector('.cpp-box-label')?.textContent.trim().endsWith(' '+commit.name))return;
      this.transfer(chip,cube,'drop',450,1100);
      const item=this.numbers.get(chip);if(item){item.job.origin=this.local(item.job.box,0,2.1);item.job.captured=true;item.job.fixedOrigin=true;}
    });
  }
  frame(now){
    const rect=this.stage.getBoundingClientRect();this.rect=rect;if(rect.width<10||rect.height<10)return;
    if(this.width!==rect.width||this.height!==rect.height){this.width=rect.width;this.height=rect.height;this.renderer.setSize(rect.width,rect.height,false);this.camera.left=-rect.width/2;this.camera.right=rect.width/2;this.camera.top=rect.height/2;this.camera.bottom=-rect.height/2;this.camera.updateProjectionMatrix();const c=this.light.shadow.camera;c.left=-rect.width;c.right=rect.width;c.top=rect.height;c.bottom=-rect.height;c.far=1600;c.updateProjectionMatrix();}
    this.stage.querySelectorAll('.cpp-box-cube').forEach(cube=>{if(visible(cube))this.ensureBox(cube);});
    this.bridgeLegacy();
    for(const [cube,box]of this.boxes){if(!cube.isConnected){this.scene.remove(box.root);box.readout.remove();this.boxes.delete(cube);continue;}box.root.visible=visible(cube);box.readout.style.display=box.root.visible?'':'none';if(box.root.visible)this.updateBox(box,now);}
    // Order matters: door transforms are available to the guard's hand IK.
    this.stage.querySelectorAll('.cpp-branch-doorway').forEach(el=>{if(visible(el))this.updateDoor(el,this.ensureActor(el,'door'));});
    this.stage.querySelectorAll('.cpp-branch-guard').forEach(el=>{if(visible(el))this.updateGuard(el,this.ensureActor(el,'guard'),now);});
    for(const [el,actor]of this.actors){if(!el.isConnected){this.scene.remove(actor.root);this.actors.delete(el);}else actor.root.visible=visible(el);}
    for(const [chip,item]of this.numbers){if(!chip.isConnected){if(!item.stored)item.mesh.removeFromParent();this.numbers.delete(chip);}else this.updateNumber(item,now);}
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();this.stage.classList.remove('has-three');}
}
function frame(now){
  if(ready)document.querySelectorAll('.cpp-visual-stage').forEach(stage=>{if(stage.closest('.cpp-guided-drawer')?.getAttribute('aria-hidden')!=='true')getManager(stage);});
  for(const [stage,manager]of managers){if(!stage.isConnected){manager.dispose();managers.delete(stage);}else if(stage.closest('.cpp-guided-drawer')?.getAttribute('aria-hidden')!=='true')manager.frame(now);}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
