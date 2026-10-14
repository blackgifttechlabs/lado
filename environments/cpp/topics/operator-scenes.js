import { rigsReady, deposit3D, withdraw3D, openBox3D } from '../three/physical-scene.js?v=20261014-cs-18';
import { logicalScene, bitwiseScene, bitwiseDuration, animateLogic, animateBitwise } from './operator-phases.js?v=20261014-cs-18';
import { modelCode } from './operator-model.js?v=20261014-cs-18';
import { precedenceScene, precedencePlan, animatePrecedence } from './precedence-scene.js?v=20261014-cs-18';

const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const topics = {'Logical Operators':'logical','Bitwise Operators':'bitwise','Increment and Decrement Operators':'increment','Conditional Ternary Operator':'ternary','Operator Precedence and Evaluation Order':'precedence'};
const hints = {logical:'Start with bool a = true; to create your first switch box.',bitwise:'Start with unsigned int a = 12; to put a number in a box.',increment:'Start with int x = 5; to create your counter box.',ternary:'Start with int age = 20; to create the age box.',precedence:'Start with int plain; to create an empty box, then assign an expression.'};
const display = value => value===undefined?'':typeof value==='string'?`"${value}"`:String(value);
function label(node) {
  if(node.name)return node.op==='call'?`${node.name}()`:node.name;
  if(!node.op)return display(node.value);
  if(node.op==='?:')return `${label(node.children[0])} ? ${label(node.children[1])} : ${label(node.children[2])}`;
  if(node.op==='cast')return label(node.children[0]);
  if(node.children.length===1)return node.prefix===false?`${label(node.children[0])}${node.op}`:`${node.op}${label(node.children[0])}`;
  return node.children.map(label).join(` ${node.op} `);
}
function box(name,item,previous,isDestination) {
  const changed=previous&&previous.value!==item.value;
  return `<div data-box="${esc(name)}" class="cpp-flow-box ${isDestination?'is-destination':''} ${changed?'is-changing':''}" style="--c:${item.type==='bool'?'#5eeaa0':item.type?.includes('string')?'#ff8fab':'#5fb0ff'};${changed&&!isDestination?'--store:1.1s':''}">
    <div class="cpp-box-cube"><i class="f front">${changed?`<b class="cpp-box-val is-before">${esc(display(previous.value))}</b>`:''}<b class="cpp-box-val is-after">${esc(display(item.value))}</b></i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div></div>
    <span class="cpp-flow-box-name">${esc(name)}</span><small>${esc(item.type)}</small></div>`;
}
function token(node,cls='') {return `<div data-source="${esc(node.name||'')}" class="cpp-flow-token ${cls} ${node.skipped?'is-skipped':''}"><small>${esc(label(node))}</small><b>${node.skipped?'skipped':esc(display(node.value))}</b></div>`;}
function result(step) {return `<div class="cpp-flow-delivery"><span>${esc(display(step.value))}</span><small>↓ ${esc(step.name||'result')}</small></div>`;}
function increment(step) {
  const e=step.events[0];
  return `<div class="cpp-inc-work" aria-label="${esc(e.name)}: ${e.before} ${e.op==='++'?'plus':'minus'} 1 becomes ${e.after}">
    <div class="cpp-inc-equation"><span class="cpp-inc-number is-old">${e.before}</span><span class="cpp-inc-sign">${e.op==='++'?'+':'−'}</span><span class="cpp-inc-one">1</span></div>
    <span class="cpp-inc-number is-new">${e.after}</span>
    ${step.name?`<span class="cpp-inc-copy">${esc(display(step.value))}</span>`:''}
  </div>`;
}
function ternary(step) {
  const [condition,yes,no]=step.tree.children;
  return `<div class="cpp-flow-fork"><div class="cpp-flow-question"><div class="cpp-flow-condition">${condition.children.length===2?`<div class="cpp-flow-compare">${token(condition.children[0])}<strong>${esc(condition.op)}</strong>${token(condition.children[1])}</div>`:''}${token(condition)}</div><strong>?</strong></div><div class="cpp-flow-branches"><div class="${yes.skipped?'is-unused':'is-chosen'}"><span>↙ true</span>${token(yes)}</div><div class="${no.skipped?'is-unused':'is-chosen'}"><span>false ↘</span>${token(no)}</div></div></div>${result(step)}`;
}
function explanation(step,kind) {
  if(step.error)return step.error;
  if(step.empty)return `An empty box named ${step.name}. Give it a value before using it.`;
  if(step.events.length) {const e=step.events[0];if(!step.name)return `${e.before} ${e.op==='++'?'+':'−'} 1 = ${e.after}. Put ${e.after} back in ${e.name}.`;return e.prefix?`Change ${e.name} first. ${step.name?`${step.name} receives`:'The expression uses'} ${e.used}.`:`Use ${e.before} first, then change ${e.name} to ${e.after}.`;}
  const root=step.tree;
  if(!root.op)return `Create ${step.name}, then put ${display(step.value)} inside.`;
  if(root.op==='?:')return `${label(root.children[0])} is ${!!root.children[0].value}. Only the ${root.selected===1?'true':'false'} path sends its value to ${step.name}.`;
  if(root.op==='&&'||root.op==='||')return root.children[1].skipped?`${display(root.children[0].value)} already decides the answer. Skip the right side; its boxes do not change.`:`Read both signals. ${root.op==='&&'?'Both must be true.':'At least one must be true.'}`;
  if(root.op==='!')return 'NOT flips the signal: true becomes false, false becomes true.';
  if(kind==='bitwise')return 'Read the bit rows, apply the operator, then store the result. The row shows only the lowest 8 bits.';
  if(kind==='precedence')return 'Follow BOMDAS. Lift the next calculation, combine its numbers, then put the final answer in the box.';
  return `Work out ${step.expression}, then put ${display(step.value)} in ${step.name||'the result'}.`;
}
function render(state,kind) {
  const step=state.last;
  if(!step)return `<div class="cpp-flow-empty"><div class="cpp-flow-outline">?</div><p>${hints[kind]}</p></div>`;
  let action='';
  if(!step.error&&step.tree?.op) {
    if(step.tree.op==='?:')action=ternary(step);
    else if(['&&','||','!'].includes(step.tree.op))action=logicalScene(step,{token,result});
    else if(step.events.length)action=increment(step);
    else if(kind==='precedence')action=precedenceScene(step);
    else if(kind==='bitwise')action=bitwiseScene(step,{label,result});
    else action=`<div class="cpp-flow-simple">${esc(step.expression)} = ${esc(display(step.value))}</div>${result(step)}`;
  }
  const operated=!!action;
  if(!operated&&!step.error&&!step.empty) action=result(step);
  const destination=step.name;
  const boxes=Object.entries(step.after).map(([name,item])=>{let html=box(name,item,step.before[name],name===destination);if(kind==='bitwise'&&typeof item.value==='number')html=html.replace('</small></div>',`</small><small class="cpp-box-binary">${(item.value>>>0).toString(2).padStart(4,'0')}</small></div>`);return html;}).join('');
  const wait=(durationFor(step,kind)-700)/1000;
  return `<div class="cpp-flow-step"><span>${step.error?'CHECK THIS LINE':`PHASE ${state.index+1} OF ${state.count}`} </span><code>${esc(step.line)};</code></div>
    <div class="cpp-flow-action ${operated?'has-operation':'is-creation'} ${action.includes('cpp-inc-work')?'is-increment':''} ${action.includes('cpp-bomdas-work')?'is-precedence':''} ${action.includes('cpp-bit-work')?'is-bitwise':''} ${action.includes('cpp-logic-work')?'is-logical':''}" style="--store:${wait}s">${action}<div class="cpp-flow-boxes">${boxes}</div></div>
    <p class="cpp-flow-caption ${step.error?'is-error':''}">${esc(explanation(step,kind))}</p>`;
}
const motionEase='cubic-bezier(.4,0,.2,1)';
function animate(element,frames,duration,delay=0,fill='both') {
  return element?.animate(frames,{duration,delay,fill,easing:motionEase});
}
function fade(element,start,visible) {
  return animate(element,[{opacity:visible?0:1},{opacity:visible?1:0}],160,start,visible?'both':'forwards');
}
function hinge(box,openAt,closeAt) {
  openBox3D(box,openAt,closeAt);
  const lid=box?.querySelector('.lid-face');
  if(!lid)return;
  lid.style.animation='none';lid.style.transition='none';
  animate(lid,[{transform:'rotateX(90deg)',offset:0},{transform:'rotateX(196deg)',offset:450/(closeAt-openAt+500)},{transform:'rotateX(196deg)',offset:(closeAt-openAt)/(closeAt-openAt+500)},{transform:'rotateX(90deg)',offset:1}],closeAt-openAt+500,openAt);
}
function center(element) {
  const r=element.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};
}
function mouth(box) {
  const r=box.querySelector('.cpp-box-cube').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*.25};
}
function lift(chip,box,delay=450) {
  if(withdraw3D(chip,box,delay,950))return;
  const from=mouth(box),to=center(chip),dx=from.x-to.x,dy=from.y-to.y;
  animate(chip,[
    {transform:`translate(${dx}px,${dy+22}px) scale(.65)`,opacity:0,offset:0},
    {transform:`translate(${dx}px,${dy-24}px) scale(.9)`,opacity:1,offset:.35},
    {transform:'translate(0,0) scale(1)',opacity:1,offset:1}
  ],850,delay);
}
function drop(chip,box,delay,duration=850) {
  if(deposit3D(chip,box,delay,duration))return;
  const from=center(chip),to=mouth(box),dx=to.x-from.x,dy=to.y-from.y;
  animate(chip,[
    {transform:'translate(0,0) scale(1)',opacity:1,offset:0},
    {transform:`translate(${dx}px,${dy-34}px) scale(.9)`,opacity:1,offset:.65},
    {transform:`translate(${dx}px,${dy+16}px) scale(.55)`,opacity:0,offset:1}
  ],duration,delay,'forwards');
}
function animateIncrement(scene,step,boxes) {
  const e=step.events[0],source=boxes.find(box=>box.dataset.box===e.name),destination=boxes.find(box=>box.dataset.box===step.name);
  if(!source)return;
  const work=scene.querySelector('.cpp-inc-work'),old=work.querySelector('.is-old'),next=work.querySelector('.is-new'),copy=work.querySelector('.cpp-inc-copy');
  const hasCopy=!!destination&&destination!==source;
  const resolve=hasCopy&&!e.prefix?3200:2050,returnAt=resolve+550,returned=returnAt+850;
  const copyAt=e.prefix?returned+1300:1450;
  const closeAt=hasCopy?Math.max(returned,copyAt+850)+150:returned+150;
  const before=source.querySelector('.is-before'),after=source.querySelector('.is-after');
  [before,after,destination?.querySelector('.is-after')].filter(Boolean).forEach(el=>{el.style.animation='none';});
  hinge(source,250,closeAt);
  lift(old,source,750);
  fade(before,500,false);
  fade(work.querySelector('.cpp-inc-sign'),hasCopy&&!e.prefix?2450:1450,true);
  fade(work.querySelector('.cpp-inc-one'),hasCopy&&!e.prefix?2550:1550,true);
  // Resolve the little sum in place; no dial, separate timeline, or extra result panel.
  fade(old,resolve,false);
  fade(work.querySelector('.cpp-inc-sign'),resolve,false);
  fade(work.querySelector('.cpp-inc-one'),resolve,false);
  fade(next,resolve+120,true);
  drop(next,source,returnAt);
  fade(after,returned-80,true);
  if(hasCopy) {
    const origin=center(e.prefix?next:old),position=center(copy);
    copy.style.left=`calc(50% + ${origin.x-position.x}px)`;
    copy.style.top=`calc(50% + ${origin.y-position.y}px)`;
    hinge(destination,350,closeAt);
    if(e.prefix)lift(copy,source,returned+300);else fade(copy,copyAt-100,true);
    drop(copy,destination,copyAt);
    fade(destination.querySelector('.is-after'),copyAt+780,true);
  }
}
function animateTransfers(scene,step) {
  if(!scene.isConnected||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(scene.querySelector('.cpp-bit-work')) {animateBitwise(scene,step,{animate,hinge,fade,lift,drop});return;}
  if(scene.querySelector('.cpp-logic-work')) {animateLogic(scene,step,{animate,hinge,fade,lift,drop});return;}
  if(scene.querySelector('.cpp-bomdas-work')) {animatePrecedence(scene,step,{animate,hinge,fade,mouth});return;}
  const boxes=Array.from(scene.querySelectorAll('[data-box]'));
  if(scene.querySelector('.cpp-inc-work')) {animateIncrement(scene,step,boxes);return;}
  const store=parseFloat(getComputedStyle(scene.querySelector('.cpp-flow-action')||scene).getPropertyValue('--store'))*1000||1800;
  const opened=new Set();
  scene.querySelectorAll('[data-source]').forEach(token=>{
    if(token.classList.contains('is-skipped'))return;
    const source=boxes.find(box=>box.dataset.box===token.dataset.source);
    if(!source)return;
    if(!opened.has(source)){hinge(source,0,1500);opened.add(source);}
    lift(token,source);
  });
  const chip=scene.querySelector('.cpp-flow-delivery > span'),target=scene.querySelector('.is-destination');
  if(chip&&target) {
    const start=store-850;
    hinge(target,opened.has(target)?0:Math.max(0,start-600),store+100);
    fade(chip,Math.max(0,start-250),true);
    drop(chip,target,start);
    fade(target.querySelector('.is-after'),store-70,true);
  }
}
function durationFor(step,kind) {
  if(!step||step.error||step.empty)return 1600;
  if(step.tree?.op==='?:')return 4700;
  if(['&&','||','!'].includes(step.tree?.op))return 4700;
  if(step.events.length)return step.name?(step.events[0].prefix?6600:5600):4200;
  if(step.tree?.op&&kind==='precedence')return precedencePlan(step.tree).duration+350;
  if(step.tree?.op&&kind==='bitwise')return bitwiseDuration(step);
  return step.tree?.op?4700:2600;
}
function pendingDeclaration(code,vars) {
  const clean=code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').replace(/\breturn\s+0\s*;/g,'').replace(/[}\s]+$/,'');
  const tail=clean.slice(Math.max(clean.lastIndexOf(';'),clean.lastIndexOf('{'))+1).trim();
  const match=/^(unsigned\s+(?:int|char)|int|bool|string)\s+([A-Za-z_]\w*)\s*(=\s*([\s\S]*))?$/.exec(tail);
  if(!match||Object.prototype.hasOwnProperty.call(vars,match[2]))return null;
  const [,type,name,assignment,raw]=match;
  let value;const literal=(raw||'').trim();
  if(/^-?\d+$/.test(literal))value=Number(literal);
  else if(/^(true|false)$/.test(literal))value=literal==='true';
  return {type,name,assignment:!!assignment,value,line:tail};
}
function showPending(scene,pending,vars) {
  const signature=JSON.stringify({pending,vars});if(scene.pendingSignature===signature)return;
  scene.pendingSignature=signature;scene.preview=pending;
  const boxes=Object.entries(vars).map(([name,item])=>box(name,item,null,false)).join('')+box(pending.name,{type:pending.type,value:pending.value},null,true);
  scene.innerHTML=`<div class="cpp-flow-step"><span>BUILDING THE BOX</span><code>${esc(pending.line)}</code></div><div class="cpp-flow-action" style="--store:1.8s">${pending.value!==undefined?`<div class="cpp-flow-delivery"><span>${esc(display(pending.value))}</span></div>`:''}<div class="cpp-flow-boxes">${boxes}</div></div><p class="cpp-flow-caption">${pending.assignment?'The box is open. Finish with ; to store the value and close it.':`The ${esc(pending.name)} box is ready. Type = to open its lid.`}</p>`;
  if(pending.assignment)scene.querySelector('.is-destination .lid-face').style.transform='rotateX(196deg)';
  if(pending.value!==undefined)requestAnimationFrame(()=>{
    if(!scene.isConnected||scene.preview!==pending)return;
    const target=scene.querySelector('.is-destination'),chip=scene.querySelector('.cpp-flow-delivery > span'),value=target.querySelector('.is-after');
    value.style.animation='none';
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){chip.style.display='none';value.style.opacity='1';return;}
    fade(chip,100,true);drop(chip,target,450);fade(value,1250,true);
  });
}
function showStep(scene,kind,index) {
  scene.index=index;scene.pendingSignature=null;
  const step=scene.steps[index],preview=scene.preview;scene.preview=null;scene.showing=step;
  const closePreview=preview&&preview.name===step?.name&&preview.value!==undefined&&preview.value===step.value&&!step.tree?.op;
  scene.innerHTML=render({last:step,index,count:scene.steps.length},kind);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  scene.deadline=performance.now()+(closePreview?650:reduced?450:durationFor(step,kind))+250;
  rigsReady.then(()=>requestAnimationFrame(()=>{
    if(!scene.isConnected||scene.showing!==step)return;
    if(closePreview){
      scene.querySelector('.cpp-flow-delivery')?.remove();
      const target=scene.querySelector('.is-destination'),value=target.querySelector('.is-after');value.style.animation='none';value.style.opacity='1';
      if(!reduced)animate(target.querySelector('.lid-face'),[{transform:'rotateX(196deg)'},{transform:'rotateX(90deg)'}],400,100);
    }else animateTransfers(scene,step);
  }));
}
function sync(stage) {
  const lab=stage.closest('.cpp-lab'),kind=topics[window.__ladoVH(lab)?.textContent.trim()],editor=lab?.querySelector('[data-role="lab-code"]');
  let scene=stage.querySelector('.cpp-op-scene');
  if(!kind||!editor) {scene?.remove();stage.classList.remove('has-op');return;}
  if(!scene||scene.dataset.kind!==kind) {scene?.remove();scene=document.createElement('section');scene.className='cpp-op-scene cpp-code-flow';scene.dataset.kind=kind;scene.steps=[];scene.index=-1;stage.appendChild(scene);}
  stage.classList.add('has-op');
  const opened=lab.querySelector('.cpp-guided-drawer')?.getAttribute('aria-hidden')!=='true';
  let redraw=false;
  if(scene.editorCode!==window.__ladoCode(editor)) {
    scene.editorCode=window.__ladoCode(editor);
    const state=modelCode(window.__ladoCode(editor));let shared=0;
    while(shared<scene.steps.length&&shared<state.steps.length&&JSON.stringify(scene.steps[shared])===JSON.stringify(state.steps[shared]))shared++;
    if(shared<scene.steps.length||scene.index<0){scene.index=Math.min(shared,Math.max(0,state.steps.length-1));redraw=true;}
    scene.steps=state.steps;scene.vars=state.vars;scene.pending=null;
    if(!state.steps.length){scene.index=-1;redraw=true;}
  }
  if(!opened){scene.wasOpen=false;return;}
  if(!scene.wasOpen){redraw=true;scene.wasOpen=true;}
  if(scene.index<0) {
    if(scene.pending)showPending(scene,scene.pending,scene.vars||{});
    else if(redraw){scene.innerHTML=render({last:null},kind);scene.pendingSignature=null;}
  } else {
    if(redraw)showStep(scene,kind,scene.index);
    else if(performance.now()>=scene.deadline&&scene.index+1<scene.steps.length)showStep(scene,kind,scene.index+1);
    else if(performance.now()>=scene.deadline&&scene.pending)showPending(scene,scene.pending,scene.vars);
    else if(!scene.pending&&scene.pendingSignature)showStep(scene,kind,scene.index);
  }
  const status=stage.querySelector('.cpp-visual-status');
  const done=scene.index>=0&&scene.index===scene.steps.length-1&&performance.now()>=scene.deadline&&!scene.pending;
  const message=scene.pending&&scene.pendingSignature?'Finish the statement with ;':scene.index<0?'Create your first variable':done?'Shelf complete':`Phase ${scene.index+1} of ${scene.steps.length}`;
  if(status&&status.textContent!==message)status.textContent=message;
}
setInterval(()=>document.querySelectorAll('.cpp-visual-stage').forEach(sync),180);
