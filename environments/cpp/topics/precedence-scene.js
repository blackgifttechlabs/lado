import { deposit3D } from '../three/physical-scene.js?v=20261015-m-1';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const priority=op=>['*','/','%'].includes(op)?2:1;
const letter=op=>({'*':'M','/':'D','%':'D','+':'A','-':'S'}[op]||'A');

// Build a sequence of visible reductions while preserving the parser's grouping.
export function precedencePlan(root) {
  let serial=0;
  const tokens=[],operations=[];
  function visit(node,parentGroup=0) {
    const ids=new Set(),grouped=(node.group||0)>parentGroup;
    const add=(text,kind)=>{const token={id:`p${serial++}`,text:String(text),kind};tokens.push(token);ids.add(token.id);};
    if(grouped)add('(','bracket');
    if(!node.op)add(node.name?`${node.value}`:node.value,'number');
    else {
      node.children.forEach((child,i)=>{
        if(i)add(node.op==='*'?'×':node.op==='/'?'÷':node.op==='-'?'−':node.op,'sign');
        if(node.children.length===1)add(node.op,'sign');
        const childIDs=visit(child,node.group||0);childIDs.forEach(id=>ids.add(id));
      });
    }
    if(grouped)add(')','bracket');
    if(node.op){const result={id:`p${serial++}`,text:String(node.value),kind:'result'};ids.add(result.id);operations.push({node,ids,result,position:operations.length});}
    return ids;
  }
  visit(root);
  const all=tokens.slice(),steps=[];let current=tokens.slice(),remaining=operations.slice();
  while(remaining.length) {
    const ready=remaining.filter(candidate=>!remaining.some(other=>other!==candidate&&candidate.ids.has(other.result.id)));
    ready.sort((a,b)=>(b.node.group||0)-(a.node.group||0)||priority(b.node.op)-priority(a.node.op)||a.position-b.position);
    const operation=ready[0];
    const selected=current.filter(token=>operation.ids.has(token.id));
    const first=current.findIndex(token=>operation.ids.has(token.id));
    const after=current.filter(token=>!operation.ids.has(token.id));after.splice(first,0,operation.result);
    const operands=operation.node.children.map(child=>child.value);
    const calculation=operands.length===1?`${operation.node.op}${operands[0]}`:operands.join(` ${operation.node.op==='*'?'×':operation.node.op==='/'?'÷':operation.node.op} `);
    steps.push({before:current,after,selected,result:operation.result,letter:operation.node.group?'B':letter(operation.node.op),calculation:`${calculation} = ${operation.node.value}`});
    all.push(operation.result);current=after;remaining=remaining.filter(item=>item!==operation);
  }
  return {tokens:all,initial:tokens,steps,final:current[0],duration:1200+steps.length*3000+1600};
}
export function precedenceScene(step) {
  const plan=precedencePlan(step.tree);
  const names={B:'Brackets',O:'Orders (powers)',M:'Multiplication',D:'Division and remainder',A:'Addition',S:'Subtraction'};
  return `<div class="cpp-bomdas" aria-label="BOMDAS"><div class="cpp-bomdas-letters">${Object.entries(names).map(([key,name])=>`<span data-letter="${key}" title="${name}">${key}</span>`).join('')}</div><small>M / D: left to right · A / S: left to right</small></div>
    <div class="cpp-bomdas-work" role="img" aria-label="${esc(plan.steps.map(step=>step.calculation).join(', then '))}">${plan.tokens.map(token=>`<span class="cpp-bomdas-token is-${token.kind}" data-token="${token.id}">${esc(token.text)}</span>`).join('')}</div>
    <div class="cpp-bomdas-calculations">${plan.steps.map((step,i)=>`<span data-calculation="${i}">${esc(step.calculation)}</span>`).join('')}</div>`;
}
export function animatePrecedence(scene,step,{animate,hinge,fade,mouth}) {
  const plan=precedencePlan(step.tree),work=scene.querySelector('.cpp-bomdas-work'),target=scene.querySelector('.is-destination');
  const width=work.getBoundingClientRect().width,total=plan.duration;
  const tracks=new Map(plan.tokens.map(token=>[token.id,[]]));
  const state=new Map();
  function point(id,time,x,y,opacity) {
    tracks.get(id).push({offset:time/total,transform:`translate(${x}px,${y}px)`,opacity});state.set(id,{x,y,opacity});
  }
  function hold(id,time){const s=state.get(id);point(id,time,s.x,s.y,s.opacity);}
  const position=(list,index)=>(index-(list.length-1)/2)*Math.min(62,(width-54)/Math.max(1,list.length-1));
  plan.tokens.forEach(token=>{const index=plan.initial.indexOf(token);point(token.id,0,index>=0?position(plan.initial,index):0,0,0);if(index>=0)point(token.id,700,position(plan.initial,index),0,1);});
  plan.steps.forEach((step,i)=>{
    const start=1200+i*3000,mid=step.selected.reduce((sum,t)=>sum+state.get(t.id).x,0)/step.selected.length;
    step.selected.forEach(token=>{
      const s={...state.get(token.id)};hold(token.id,start+250);
      point(token.id,start+950,s.x,-65,1);
      point(token.id,start+1300,s.x,-65,1);
      point(token.id,start+1700,mid,-65,0);
    });
    point(step.result.id,start+1550,mid,-65,0);
    point(step.result.id,start+1850,mid,-65,1);
    point(step.result.id,start+2150,mid,-65,1);
    point(step.result.id,start+2550,position(step.after,step.after.indexOf(step.result)),0,1);
    step.after.filter(t=>t!==step.result).forEach(token=>{
      hold(token.id,start+2100);point(token.id,start+2550,position(step.after,step.after.indexOf(token)),0,1);
    });
    const caption=scene.querySelector(`[data-calculation="${i}"]`);
    animate(caption,[{opacity:0},{opacity:1}],200,start+1700);
    if(i<plan.steps.length-1)animate(caption,[{opacity:1},{opacity:0}],150,start+2850,'forwards');
  });
  const dropAt=1200+plan.steps.length*3000+250;
  if(target&&plan.final) {
    const rect=work.getBoundingClientRect(),to=mouth(target),x=to.x-(rect.x+rect.width/2),y=to.y-(rect.y+rect.height*.7);
    hold(plan.final.id,dropAt);
    if(!deposit3D(scene.querySelector(`[data-token="${plan.final.id}"]`),target,dropAt,1000)){point(plan.final.id,dropAt+550,x,y-32,1);point(plan.final.id,dropAt+900,x,y+15,0);}
    hinge(target,dropAt-550,dropAt+1000);
    const value=target.querySelector('.is-after');value.style.animation='none';fade(value,dropAt+830,true);
  }
  tracks.forEach((frames,id)=>{hold(id,total);scene.querySelector(`[data-token="${id}"]`).animate(frames.map(frame=>({...frame,easing:'cubic-bezier(.4,0,.2,1)'})),{duration:total,fill:'both',easing:'linear'});});
  // Only the current operation lights up. M and D, and A and S, share precedence.
  scene.querySelectorAll('[data-letter]').forEach(el=>{
    const off={color:'#b8dcf2',backgroundColor:'rgba(8,60,101,0)',transform:'scale(1)',textShadow:'none'};
    const on={color:'#083d51',backgroundColor:'#ffdd86',transform:'scale(1.1)',textShadow:'0 1px 0 #ffffff88'};
    const frames=[{...off,offset:0}];
    plan.steps.forEach((step,i)=>{if(step.letter!==el.dataset.letter)return;const start=1200+i*3000;frames.push({...off,offset:start/total},{...on,offset:(start+200)/total},{...on,offset:(start+2700)/total},{...off,offset:(start+2950)/total});});
    frames.push({...off,offset:1});el.animate(frames,{duration:total,fill:'both',easing:'linear'});
  });
}
