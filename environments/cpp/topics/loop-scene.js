import { loopModel } from './loop-model.js?v=20261014-cs-11';
import { createWorld } from '../three/scenes3d.js?v=20261014-cs-11';

// One replay scene for every loop lesson: variable boxes, a lesson-specific track, and the terminal, stepped frame by frame.
const MODES={
  'Defining and Using struct Types':'struct-define','Accessing Structure Members':'struct-access','Creating Nested Structures':'struct-nested','Working with Arrays of Structures':'struct-array','Passing Structures to Functions':'struct-pass','Enumerations with enum and enum class':'struct-enum','Memory Sharing with union':'struct-union',
  'Class Data Members and Methods':'class-members','Access Specifiers: public, private, protected':'class-access','Constructors and Destructors':'class-ctor','The this Pointer':'class-this','Static Data Members and Methods':'class-static','Encapsulation with Getters and Setters':'class-encap','Class Inheritance':'class-inherit','Polymorphism and Virtual Functions':'class-poly','Operator Overloading in Classes':'class-operator',
  'Including the <fstream> Header':'file-include','Opening and Closing Files':'file-open','Reading from Files with ifstream':'file-read','Writing to Files with ofstream':'file-write','File Modes: Append and Binary':'file-modes','Checking for File Errors and EOF':'file-errors','Reading Text Files Line by Line':'file-lines','Working with CSV and Text Data':'file-csv',
  'Traditional for Loops':'for','Range-based for Loops':'range','while and do-while Loops':'while',
  'Loop Control with break and continue':'laps','Working with Nested Loops':'grid',
  'Declaring, Initializing, and Indexing Arrays':'data-lockers','Working with Multidimensional Arrays':'data-building','Fixed-size Containers with array':'data-safe',
  'Function Declaration, Definition, and Calling':'func-decl','Function Parameters and Return Values':'func-params','Pass by Value, Reference, and Pointer':'func-passing',
  'Functions with Default Arguments':'func-default','Function Overloading':'func-overload','Inline Functions':'func-inline','Recursive Functions':'func-recursion',
  'Lambda Expressions':'func-lambda','Function Pointers':'func-fnptr',
  'Character Arrays and C-style Strings':'data-tiles','string and Its Member Functions':'data-ribbon','String Manipulation and Searching':'data-tools','Iterating over Arrays and Strings':'data-pointer',
};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function laps(frames,k,depthIndex=0) {
  // One chip per lap of the outermost loop; status is derived from the frames replayed so far.
  const chips=new Map();
  frames.forEach((f,i)=>{
    if(f.lap===undefined||f.depth!==depthIndex+1)return;
    const status=f.kind==='break'?'break':f.kind==='continue'?'continue':'body';
    const chip=chips.get(f.lap)||{lap:f.lap,lv:f.lv,at:i,status:'pending'};
    chip.lv=f.lv??chip.lv;if(i<=k)chip.status=status;chips.set(f.lap,chip);
  });
  return [...chips.values()].map(c=>`<span class="cpp-lp-lap is-${c.status}${frames[k]?.lap===c.lap&&frames[k].depth===depthIndex+1?' is-current':''}" title="lap ${c.lap}"><small>lap ${c.lap}</small><b>${esc(c.lv||c.lap)}</b>${c.status==='break'?'<i>break</i>':c.status==='continue'?'<i>skipped</i>':''}</span>`).join('');
}
function track(mode,frames,k) {
  const f=frames[k];
  if(f.rf||mode==='range') {
    const rf=f.rf||{items:[],idx:-1};
    return `<div class="cpp-lp-belt"><span class="cpp-lp-belt-label">items</span>${rf.items.map((item,i)=>`<span class="cpp-lp-item${i===rf.idx?' is-current':''}${i<rf.idx?' is-done':''}">${esc(item)}</span>`).join('')}</div>`;
  }
  if(mode==='grid'&&frames.some(x=>x.depth>=2)) {
    const rows=Math.max(...frames.map(x=>x.iters[0]||0)),cols=Math.max(...frames.map(x=>x.iters[1]||0));
    const lit=new Set(),here=f.depth>=2&&f.lap!==undefined?`${f.iters[0]}:${f.iters[1]}`:'';
    frames.slice(0,k+1).forEach(x=>{if(x.depth>=2&&x.lap!==undefined)lit.add(`${x.iters[0]}:${x.iters[1]}`);});
    return `<div class="cpp-lp-grid" style="--cols:${cols}">${Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>{
      const key=`${r+1}:${c+1}`;return `<span class="cpp-lp-cell${lit.has(key)?' is-lit':''}${key===here?' is-current':''}">${r+1},${c+1}</span>`;}).join('')).join('')}</div>`;
  }
  const lapStrip=`<div class="cpp-lp-laps">${laps(frames,k)}</div>`;
  if(mode==='for') {
    const flag=(name,key)=>`<span class="cpp-lp-flag${f.flag===key?' is-active':''}">${name}</span>`;
    return `<div class="cpp-lp-flags">${flag('1 init','init')}${flag('2 check','check')}${flag('3 body','body')}${flag('4 update','update')}</div>${lapStrip}`;
  }
  if(mode==='while'||f.loopKind==='while'||f.loopKind==='do') {
    const kind=frames.find(x=>x.loopKind)?.loopKind;
    const gate=f.kind==='check'?(f.ok?'open':'closed'):'idle';
    return `<div class="cpp-lp-gate is-${gate}"><span class="cpp-lp-gate-bar"></span><b>${kind==='do'?'run first, then check':'check first, then run'}</b></div>${lapStrip}`;
  }
  return lapStrip;
}
function view(state,k,mode,playing,machine) {
  const frames=state.frames,f=frames[k],prev=frames[k-1];
  const vars=f.vars.map(v=>`<span class="cpp-lp-var${prev?.vars.find(x=>x.name===v.name)?.show!==v.show?' is-changed':''}"><small>${esc(v.type)}</small><i>${esc(v.name)}</i><b>${esc(v.show)}</b></span>`).join('');
  return `<div class="cpp-lp-vars">${vars}</div>
    <p class="cpp-lp-banner is-${f.kind}${f.ok===false?' is-false':''}" role="status">${esc(f.label)}</p>
    ${machine?'':`<div class="cpp-lp-track">${track(mode,frames,k)}</div>`}
    <div class="cpp-lp-computer" aria-label="Program output">
      <div class="cpp-lp-bezel"><div class="cpp-lp-screen"><div class="cpp-lp-screen-bar"><i></i><i></i><i></i><span>terminal</span></div><pre class="cpp-lp-out">${esc(f.out)||'$ '}<b class="cpp-lp-cursor"></b></pre></div><u class="cpp-lp-led"></u></div>
      <div class="cpp-lp-neck"></div><div class="cpp-lp-base"></div>
    </div>
    <div class="cpp-lp-controls"><button type="button" data-lp="prev" aria-label="Previous step">‹</button><button type="button" data-lp="play">${playing?'Pause':k>=frames.length-1?'Replay':'Play'}</button><button type="button" data-lp="next" aria-label="Next step">›</button><small>step ${k+1} / ${frames.length}</small></div>`;
}
function draw(scene) {
  const state=scene.state||{frames:[],error:''},machine=scene.machine,shell=machine?'<div class="cpp-lp-3d"></div>':'';
  if(!state.frames.length){
    const wait=!state.error||/ended|Expected|unfinished/.test(state.error);
    const hint=machine?'Start typing and the 3D scene builds itself, piece by piece.':'Write a loop and its steps will be replayed here.';
    scene.innerHTML=shell+`<p class="cpp-branch-error" role="status">${esc(state.error?(wait?'Keep typing: '+state.error:state.error):hint)}</p>`;
  } else scene.innerHTML=shell+view(state,scene.k,scene.mode,scene.playing,machine)+(state.error?`<p class="cpp-branch-error" role="status">${esc(state.error)}</p>`:'');
  if(machine){
    scene.querySelector('.cpp-lp-3d').appendChild(machine.el);machine.fit();
    const total=state.frames.length;machine.setFrames?.(state.frames);machine.speed=total>60?2.6:total>40?2:total>20?1.4:1;
    if(total&&scene.shown!==scene.k){machine.show(state.frames[scene.k],state.frames[scene.k-1],{jump:!!scene.jump});scene.shown=scene.k;}
    scene.jump=false;
  }
}
function stop(scene){scene.playing=false;clearTimeout(scene.timer);}
function tick(scene) {
  clearTimeout(scene.timer);
  if(!scene.playing)return;
  const total=scene.state.frames.length;
  if(scene.k>=total-1){scene.playing=false;draw(scene);return;}
  const wait=scene.machine?scene.machine.stepMs:total>40?260:total>20?520:780;
  scene.timer=setTimeout(()=>{if(!scene.isConnected)return;scene.k++;draw(scene);tick(scene);},wait);
}
function play(scene) {
  stop(scene);scene.k=0;scene.shown=-1;draw(scene);
  if(!scene.state.frames.length)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){scene.k=scene.state.frames.length-1;draw(scene);return;}
  scene.playing=true;draw(scene);tick(scene);
}
function controls(scene,event) {
  const button=event.target.closest('[data-lp]');if(!button)return;
  const total=scene.state.frames.length,action=button.dataset.lp;
  if(action==='play') {
    if(scene.playing){stop(scene);draw(scene);return;}
    if(scene.k>=total-1)scene.k=0;
    scene.playing=true;draw(scene);tick(scene);return;
  }
  stop(scene);scene.jump=true;scene.k=Math.max(0,Math.min(total-1,scene.k+(action==='next'?1:-1)));draw(scene);
}
function sync(stage) {
  const lab=stage.closest('.cpp-lab'),name=lab?.querySelector('.cpp-flat-lesson h2')?.textContent.trim(),mode=MODES[name];
  let scene=stage.querySelector('.cpp-loop-scene');
  if(!mode){if(scene){stop(scene);scene.machine?.dispose();scene.remove();}stage.classList.remove('has-loop');return;}
  const editor=lab.querySelector('[data-role="lab-code"]');if(!editor)return;
  if(!scene){
    scene=document.createElement('section');scene.className='cpp-loop-scene';scene.k=0;stage.appendChild(scene);
    scene.addEventListener('click',event=>controls(scene,event));
  }
  if(scene.machineMode!==mode){scene.machine?.dispose();scene.machine=createWorld(mode)||null;scene.machineMode=mode;scene.state=undefined;scene.wasOpen=false;scene.shown=-1;scene.code=undefined;}
  stage.classList.add('has-loop');scene.mode=mode;
  const opened=lab.querySelector('.cpp-guided-drawer')?.getAttribute('aria-hidden')!=='true';
  if(!opened){scene.wasOpen=false;stop(scene);return;}
  const changed=scene.code!==editor.value;
  if(changed){scene.code=editor.value;scene.next=loopModel(editor.value,/^(data|func|struct|class|file)-/.test(mode)?{statements:true}:{});}
  if(scene.machine&&(changed||!scene.querySelector('.cpp-lp-3d'))){scene.machine.setCode(editor.value);if(!scene.querySelector('.cpp-lp-3d'))draw(scene);}
  if(changed||!scene.wasOpen){
    scene.wasOpen=true;clearTimeout(scene.debounce);const next=scene.next;
    scene.debounce=setTimeout(()=>{if(!scene.isConnected)return;scene.state=next;play(scene);},450);
  }
  const status=stage.querySelector('.cpp-visual-status');
  const message=scene.state?.error?'Check the current code':'';
  if(status&&status.textContent!==message)status.textContent=message;
}
setInterval(()=>document.querySelectorAll('.cpp-visual-stage').forEach(sync),180);
