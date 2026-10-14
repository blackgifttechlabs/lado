import { switchModel } from './switch-model.js?v=20261014-cs-18';
const title='Multi-way Branching with switch';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valueText=value=>value===undefined?'':typeof value==='string'?`"${value}"`:String(value);
const verdicts={entered:'match',fell:'falls through',failed:'no match',skipped:'not reached'};
function render(state) {
  const held=valueText(state.selector);
  return `<div class="cpp-branch-entry"><div class="cpp-switch-selector"><span>switch (${esc(state.selectorCode||'…')})</span><b>${esc(held)}</b></div></div>
    ${state.cases.length?`<div class="cpp-branch-route cpp-switch-route"><div class="cpp-branch-rail"></div><div class="cpp-branch-guard" role="img" aria-label="Train driver rolling along the selected tracks"><span class="cpp-guard-head"></span><span class="cpp-guard-body"></span><i class="cpp-guard-arm"></i><i class="cpp-guard-leg is-left"></i><i class="cpp-guard-leg is-right"></i><b class="cpp-guard-value">${esc(held)}</b></div>
    ${state.cases.map((item,i)=>`<section class="cpp-branch-station cpp-switch-track" data-station="${i}" data-status="${item.status}"><code class="cpp-branch-condition">${item.kind==='default'?'default':`case<small>${esc(item.label)}</small>`}</code><div class="cpp-branch-doorway"><div class="cpp-branch-door"><i></i></div><span class="cpp-switch-stop ${item.hasBreak?'is-break':'is-open'}">${item.hasBreak?'break':'no break ↓'}</span></div><strong class="cpp-branch-verdict">${verdicts[item.status]||''}</strong></section>`).join('')}</div>`:''}
    ${state.error?`<p class="cpp-branch-error" role="status">${esc(state.error)}</p>`:''}`;
}
const ease='cubic-bezier(.4,0,.2,1)';
function animate(el,frames,duration,delay=0){return el?.animate(frames,{duration,delay,fill:'both',easing:ease});}
function run(scene,state) {
  if(!scene.isConnected)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!state.complete||state.error){scene.classList.add('is-settled');return;}
  const guard=scene.querySelector('.cpp-branch-guard'),route=scene.querySelector('.cpp-branch-route');
  if(!guard||!route)return;
  const routeRect=route.getBoundingClientRect(),guardRect=guard.getBoundingClientRect();
  const reached=state.cases.map((item,i)=>({item,i})).filter(({item})=>item.status==='entered'||item.status==='fell'||item.status==='failed');
  const per=2200,total=1200+reached.length*per+600;
  const frames=[{offset:0,transform:'translateX(0)'}];
  let x=0;
  reached.forEach(({item,i},step)=>{
    const station=scene.querySelector(`[data-station="${i}"]`),rect=station.querySelector('.cpp-branch-doorway').getBoundingClientRect();
    const center=rect.x+rect.width/2-routeRect.x-guardRect.width/2,start=1200+step*per;
    frames.push({offset:start/total,transform:`translateX(${x}px)`},{offset:(start+700)/total,transform:`translateX(${center}px)`});
    animate(station.querySelector('.cpp-branch-verdict'),[{opacity:0},{opacity:1}],300,start+700);
    if(item.status!=='failed'){
      animate(station.querySelector('.cpp-branch-door'),[{transform:'rotateY(0)'},{transform:'rotateY(-105deg)'}],600,start+800);
      frames.push({offset:(start+per-300)/total,transform:`translateX(${center}px)`});
    }
    x=center;
  });
  frames.push({offset:1,transform:`translateX(${x}px)`});
  guard.animate(frames,{duration:total,fill:'both',easing:'linear'});
  animate(guard.querySelector('.cpp-guard-value'),[{opacity:0},{opacity:1}],300,600);
  state.cases.forEach((item,i)=>{if(item.status==='skipped')animate(scene.querySelector(`[data-station="${i}"]`),[{opacity:1},{opacity:.4}],400,total-600);});
}
function sync(stage) {
  const lab=stage.closest('.cpp-lab'),active=window.__ladoVH(lab)?.textContent.trim()===title;
  let scene=stage.querySelector('.cpp-switch-scene');
  if(!active){scene?.remove();stage.classList.remove('has-switch');return;}
  const editor=lab.querySelector('[data-role="lab-code"]');if(!editor)return;
  if(!scene){scene=document.createElement('section');scene.className='cpp-switch-scene';stage.appendChild(scene);}
  stage.classList.add('has-switch');
  const opened=lab.querySelector('.cpp-guided-drawer')?.getAttribute('aria-hidden')!=='true';
  if(!opened){scene.wasOpen=false;return;}
  if(scene.code!==window.__ladoCode(editor)){scene.code=window.__ladoCode(editor);scene.state=switchModel(window.__ladoCode(editor));}
  const state=scene.state,signature=JSON.stringify(state);
  if(!scene.wasOpen||signature!==scene.signature){
    scene.wasOpen=true;scene.signature=signature;clearTimeout(scene.renderTimer);
    scene.renderTimer=setTimeout(()=>{
      if(!scene.isConnected||scene.state!==state)return;
      scene.classList.remove('is-settled');scene.innerHTML=render(state);
      requestAnimationFrame(()=>{if(scene.state===state)run(scene,state);});
    },450);
  }
  const status=stage.querySelector('.cpp-visual-status'),message=state.error?'Check the current code':state.complete?'':'Type your code';
  if(status&&status.textContent!==message)status.textContent=message;
}
setInterval(()=>document.querySelectorAll('.cpp-visual-stage').forEach(sync),180);
