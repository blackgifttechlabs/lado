import { rigsReady, deposit3D, withdraw3D, touchDoor3D } from '../three/physical-scene.js?v=20261014-cs-11';
import { branchingModel } from './branching-model.js?v=20261014-cs-11';
const title='Conditional Branching with if, else if, and else';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valueText=value=>value===undefined?'':typeof value==='string'?`"${value}"`:String(value);
function box(name,item,after) {
  return `<div class="cpp-flow-box" data-branch-box="${esc(name)}" style="--c:${item.type==='bool'?'#5eeaa0':'#5fb0ff'}"><div class="cpp-box-cube"><i class="f front"><b class="cpp-box-val branch-entry-value">${esc(valueText(item.value))}</b>${after&&after.value!==item.value?`<b class="cpp-box-val branch-final-value">${esc(valueText(after.value))}</b>`:''}</i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div></div><span class="cpp-flow-box-name">${esc(name)}</span><small>${esc(item.type)}</small></div>`;
}
function render(state) {
  const primary=Object.keys(state.vars).find(name=>state.branches.some(branch=>new RegExp(`\\b${name}\\b`).test(branch.condition||'')))||Object.keys(state.vars)[0];
  const held=primary?valueText(state.vars[primary].value):'';
  return `<div class="cpp-branch-entry"><div class="cpp-flow-boxes">${Object.entries(state.vars).map(([name,item])=>box(name,item,state.after?.[name])).join('')}</div></div>
    ${state.branches.length?`<div class="cpp-branch-route"><div class="cpp-branch-rail"></div><div class="cpp-branch-guard" role="img" aria-label="Guard walking to the selected door"><span class="cpp-guard-head"></span><span class="cpp-guard-body"></span><i class="cpp-guard-arm"></i><i class="cpp-guard-leg is-left"></i><i class="cpp-guard-leg is-right"></i><b class="cpp-guard-value">${esc(held)}</b></div>
    ${state.branches.map((branch,i)=>`<section class="cpp-branch-station" data-station="${i}" data-status="${branch.status}"><code class="cpp-branch-condition">${esc(branch.kind)}${branch.condition!==null?`<small>${esc(branch.condition||'…')}</small>`:''}</code><div class="cpp-branch-doorway"><div class="cpp-branch-door"><i></i></div></div><strong class="cpp-branch-verdict">${branch.status==='skipped'?'':branch.condition===null?'':branch.result===undefined?'':branch.result?'true':'false'}</strong></section>`).join('')}</div>`:''}
    ${state.error?`<p class="cpp-branch-error" role="status">${esc(state.error)}</p>`:''}`;
}
const ease='cubic-bezier(.4,0,.2,1)';
function animate(el,frames,duration,delay=0,fill='both') {return el?.animate(frames,{duration,delay,fill,easing:ease});}
function reveal(el,delay){animate(el,[{opacity:0},{opacity:1}],300,delay);}
function hinge(el,start,end) {
  if(!el)return;
  el.style.transition='none';
  animate(el,[{transform:'rotateX(90deg)',offset:0},{transform:'rotateX(196deg)',offset:.18},{transform:'rotateX(196deg)',offset:.82},{transform:'rotateX(90deg)',offset:1}],end-start,start);
}
function run(scene,state,initializeEntry=true) {
  if(!scene.isConnected)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){scene.classList.add('is-settled');scene.querySelector('.cpp-branch-guard')?.setAttribute('hidden','');return;}
  const boxes=Array.from(scene.querySelectorAll('[data-branch-box]'));
  if(initializeEntry)boxes.forEach(box=>{
    const value=box.querySelector('.branch-entry-value');reveal(value,850);
    hinge(box.querySelector('.lid-face'),100,1350);
    if(value.textContent){
      const chip=document.createElement('b');chip.className='cpp-branch-load';chip.textContent=value.textContent;box.appendChild(chip);
      if(!deposit3D(chip,box,200,1100)) animate(chip,[{opacity:0,transform:'translateY(-50px) scale(.85)',offset:0},{opacity:1,transform:'translateY(-35px)',offset:.3},{opacity:1,transform:'translateY(-10px)',offset:.65},{opacity:0,transform:'translateY(28px) scale(.5)',offset:1}],700,200);
    }
  });
  if(!state.complete||state.error)return;
  const guard=scene.querySelector('.cpp-branch-guard'),route=scene.querySelector('.cpp-branch-route');
  if(!guard||!route)return;
  const routeRect=route.getBoundingClientRect(),guardRect=guard.getBoundingClientRect();
  const steps=state.branches.filter(branch=>branch.status!=='skipped');
  const exitAt=3800+steps.length*3500,total=exitAt+600;
  const transform=x=>`translateX(${x}px)`;
  const frames=[{offset:0,transform:transform(0)},{offset:3750/total,transform:transform(0)}];
  let finalX=0;
  state.branches.forEach((branch,i)=>{
    const station=scene.querySelector(`[data-station="${i}"]`);
    if(branch.status==='skipped'){animate(station,[{opacity:1},{opacity:.42}],400,exitAt-600);return;}
    const start=3800+i*3500,doorway=station.querySelector('.cpp-branch-doorway'),rect=doorway.getBoundingClientRect();
    const center=rect.x+rect.width/2-routeRect.x-guardRect.width/2;
    const approach=Math.max(0,center-rect.width*.55);
    frames.push({offset:(start+600)/total,transform:transform(approach)});
    reveal(station.querySelector('.cpp-branch-verdict'),start+1250);
    if(branch.status==='entered'){
      animate(station.querySelector('.cpp-branch-door'),[{transform:'rotateY(0)'},{transform:'rotateY(-105deg)'}],650,start+2200);
      touchDoor3D(guard,doorway,{start:start+1500,open:start+2200,leave:start+2850,end:start+3400});
      frames.push({offset:(start+1400)/total,transform:transform(approach)},{offset:(start+2050)/total,transform:transform(center)},{offset:(start+2850)/total,transform:transform(center)},{offset:(start+3350)/total,transform:transform(center)});
      finalX=center;
    }else{frames.push({offset:(start+3250)/total,transform:transform(approach)});finalX=approach;}
  });
  if(state.selected<0)finalX=routeRect.width-guardRect.width;
  frames.push({offset:exitAt/total,transform:transform(finalX)},{offset:1,transform:transform(finalX)});
  guard.animate(frames.map(frame=>({...frame,easing:ease})),{duration:total,fill:'both',easing:'linear'});
  const held=guard.querySelector('.cpp-guard-value');
  reveal(held,2800);
  const firstBox=boxes.find(box=>state.branches.some(branch=>new RegExp(`\\b${box.dataset.branchBox}\\b`).test(branch.condition||'')))||boxes[0];
  if(firstBox) {
    hinge(firstBox.querySelector('.lid-face'),2300,4100);
    const from=firstBox.getBoundingClientRect(),to=held.getBoundingClientRect();
    if(!withdraw3D(held,firstBox,2800,950)) animate(held,[{opacity:0,transform:`translate(${from.x+from.width/2-to.x-to.width/2}px,${from.y-to.y}px) scale(.6)`},{opacity:1,transform:'none'}],750,1000);
  }
  boxes.forEach(box=>{if(box.querySelector('.branch-final-value')){animate(box.querySelector('.branch-entry-value'),[{opacity:1},{opacity:0}],150,exitAt,'forwards');reveal(box.querySelector('.branch-final-value'),exitAt);}});
}
function sync(stage) {
  const lab=stage.closest('.cpp-lab'),active=lab?.querySelector('.cpp-flat-lesson h2')?.textContent.trim()===title;
  let scene=stage.querySelector('.cpp-branch-scene');
  if(!active){scene?.remove();stage.classList.remove('has-branch');return;}
  const editor=lab.querySelector('[data-role="lab-code"]');if(!editor)return;
  if(!scene){scene=document.createElement('section');scene.className='cpp-branch-scene';stage.appendChild(scene);}
  stage.classList.add('has-branch');
  const opened=lab.querySelector('.cpp-guided-drawer')?.getAttribute('aria-hidden')!=='true';
  if(!opened){scene.wasOpen=false;return;}
  let state=scene.state;
  if(scene.code!==editor.value){scene.code=editor.value;state=branchingModel(editor.value);scene.state=state;}
  const signature=JSON.stringify(state);
  if(!scene.wasOpen||signature!==scene.pendingSignature){
    scene.wasOpen=true;scene.pendingSignature=signature;clearTimeout(scene.renderTimer);
    scene.renderTimer=setTimeout(()=>{
      if(!scene.isConnected||scene.state!==state)return;
      const varsSignature=JSON.stringify(state.vars);
      const entry=varsSignature===scene.varsSignature?scene.querySelector('.cpp-branch-entry'):null;
      scene.signature=signature;scene.varsSignature=varsSignature;scene.classList.remove('is-settled');
      if(entry)entry.remove();
      scene.innerHTML=render(state);
      if(entry)scene.querySelector('.cpp-branch-entry').replaceWith(entry);
      rigsReady.then(()=>requestAnimationFrame(()=>{if(scene.state===state)run(scene,state,!entry);})).catch(()=>{if(scene.state===state)run(scene,state,!entry);});
    },450);
  }
  const status=stage.querySelector('.cpp-visual-status');
  const message=state.error?'Check the current code':state.complete?'':'Type your code';
  if(status&&status.textContent!==message)status.textContent=message;
}
setInterval(()=>document.querySelectorAll('.cpp-visual-stage').forEach(sync),180);
